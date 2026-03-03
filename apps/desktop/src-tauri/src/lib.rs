use std::sync::Arc;
use tauri::{
    command,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, State,
};
use tauri_plugin_notification::NotificationExt;
use tokio::sync::Mutex;
use tokio_cron_scheduler::{Job, JobScheduler};
use chrono::Local;
use std::sync::atomic::{AtomicI64, Ordering};

/// Holds the cron scheduler and the UUID of the current reminder job (if any).
struct SchedulerState {
    scheduler: JobScheduler,
    job_id: Option<uuid::Uuid>,
}

struct AppState {
    scheduler_state: Arc<Mutex<Option<SchedulerState>>>,
    /// Epoch milliseconds of the next scheduled notification fire time.
    /// 0 means no notification scheduled.
    next_fire_time_ms: Arc<AtomicI64>,
}

/// Convert a "HH:MM" time string into a cron expression that fires daily at that time.
/// Cron format for tokio-cron-scheduler: sec min hour day month weekday
fn time_to_cron(time: &str) -> Result<String, String> {
    let parts: Vec<&str> = time.split(':').collect();
    if parts.len() != 2 {
        return Err(format!("Invalid time format: {}", time));
    }
    let hour: u32 = parts[0]
        .parse()
        .map_err(|_| format!("Invalid hour: {}", parts[0]))?;
    let minute: u32 = parts[1]
        .parse()
        .map_err(|_| format!("Invalid minute: {}", parts[1]))?;
    // sec min hour day month weekday
    Ok(format!("0 {} {} * * *", minute, hour))
}


#[command]
async fn schedule_daily_reminder(
    app: AppHandle,
    state: State<'_, AppState>,
    time: String,
    message: String,
) -> Result<(), String> {
    // First cancel any existing job
    {
        let mut lock = state.scheduler_state.lock().await;
        if let Some(ref mut ss) = *lock {
            if let Some(job_id) = ss.job_id.take() {
                let _ = ss.scheduler.remove(&job_id).await;
                tracing::info!("Cancelled previous scheduled notification");
            }
        }
    }

    let cron_expr = time_to_cron(&time)?;

    let app_handle = app.clone();
    let cron_expr_log = cron_expr.clone();
    let notification_message = message.clone();
    let job = Job::new_async_tz(cron_expr.as_str(), Local, move |uuid, _lock| {
        let app = app_handle.clone();
        let cron_for_log = cron_expr_log.clone();
        let body = notification_message.clone();
        Box::pin(async move {
            let now = chrono::Local::now();
            tracing::info!("[FIRE] Daily reminder cron job triggered! job_uuid={}, cron={}, local_time={}", uuid, cron_for_log, now.format("%Y-%m-%d %H:%M:%S"));
            match app
                .notification()
                .builder()
                .title("Atomic")
                .body(&body)
                .show()
            {
                Ok(_) => tracing::info!("[FIRE] Notification .show() succeeded"),
                Err(e) => tracing::error!("[FIRE] Notification .show() FAILED: {:?}", e),
            }
        })
    })
    .map_err(|e| format!("Failed to create cron job: {}", e))?;

    let job_id = job.guid();

    {
        let lock = state.scheduler_state.lock().await;
        let ss = lock.as_ref().ok_or("Scheduler not initialized")?;
        ss.scheduler
            .add(job)
            .await
            .map_err(|e| format!("Failed to schedule job: {}", e))?;
    }

    {
        let mut lock = state.scheduler_state.lock().await;
        if let Some(ref mut ss) = *lock {
            ss.job_id = Some(job_id);
        }
    }

    // Calculate next fire time from the time string
    let now = Local::now();
    let parts: Vec<&str> = time.split(':').collect();
    if let (Ok(h), Ok(m)) = (parts[0].parse::<u32>(), parts[1].parse::<u32>()) {
        let today = now.date_naive().and_hms_opt(h, m, 0).unwrap();
        let next = if today > now.naive_local() {
            today
        } else {
            today + chrono::Duration::days(1)
        };
        let next_dt = next.and_local_timezone(Local).unwrap();
        state.next_fire_time_ms.store(next_dt.timestamp_millis(), Ordering::SeqCst);
    }

    tracing::info!("Scheduled daily notification with cron: {} (time: {})", cron_expr, time);
    Ok(())
}

#[command]
async fn cancel_daily_reminder(state: State<'_, AppState>) -> Result<(), String> {
    let mut lock = state.scheduler_state.lock().await;
    if let Some(ref mut ss) = *lock {
        if let Some(job_id) = ss.job_id.take() {
            ss.scheduler
                .remove(&job_id)
                .await
                .map_err(|e| format!("Failed to cancel job: {}", e))?;
            tracing::info!("Cancelled scheduled notification");
        }
    }
    state.next_fire_time_ms.store(0, Ordering::SeqCst);
    Ok(())
}

/// Schedule a one-shot test notification that fires after `delay_secs` seconds.
#[command]
async fn schedule_test_notification(
    app: AppHandle,
    state: State<'_, AppState>,
    delay_secs: u64,
) -> Result<i64, String> {
    let fire_at = Local::now() + chrono::Duration::seconds(delay_secs as i64);
    let fire_ms = fire_at.timestamp_millis();
    state.next_fire_time_ms.store(fire_ms, Ordering::SeqCst);

    let next_fire_clone = state.next_fire_time_ms.clone();
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_secs(delay_secs)).await;
        tracing::info!("[TEST-FIRE] Test notification timer elapsed, sending notification now");
        match app
            .notification()
            .builder()
            .title("Atomic")
            .body("Test notification — your scheduler works! 🎉")
            .show()
        {
            Ok(_) => tracing::info!("[TEST-FIRE] Notification .show() succeeded"),
            Err(e) => tracing::error!("[TEST-FIRE] Notification .show() FAILED: {:?}", e),
        }
        // Clear the fire time if it's still pointing to this one
        let _ = next_fire_clone.compare_exchange(
            fire_ms,
            0,
            Ordering::SeqCst,
            Ordering::SeqCst,
        );
    });

    tracing::info!("Scheduled test notification in {}s (fire_at: {})", delay_secs, fire_at);
    Ok(fire_ms)
}

/// Returns the epoch millis of the next scheduled notification, or 0 if none.
#[command]
async fn get_next_notification_time(state: State<'_, AppState>) -> Result<i64, String> {
    Ok(state.next_fire_time_ms.load(Ordering::SeqCst))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let scheduler_state = Arc::new(Mutex::new(None));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: None,
                    }),
                ])
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .manage(AppState {
            scheduler_state: scheduler_state.clone(),
            next_fire_time_ms: Arc::new(AtomicI64::new(0)),
        })
        .invoke_handler(tauri::generate_handler![
            schedule_daily_reminder,
            cancel_daily_reminder,
            schedule_test_notification,
            get_next_notification_time,
        ])
        .setup(move |app| {
            // --- System tray ---
            let show_i = MenuItem::with_id(app, "show", "Show Atomic", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("Atomic")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.unminimize();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            // --- Hide on close instead of quitting ---
            let main_window = app.get_webview_window("main").unwrap();
            let window_clone = main_window.clone();
            main_window.on_window_event(move |event| {
                if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    let _ = window_clone.hide();
                }
            });

            // --- Initialize the cron scheduler ---
            let scheduler_state_clone = scheduler_state.clone();
            tauri::async_runtime::spawn(async move {
                match JobScheduler::new().await {
                    Ok(scheduler) => {
                        // --- 1-minute heartbeat job for debugging (dev builds only) ---
                        #[cfg(debug_assertions)]
                        {
                            let heartbeat = Job::new_async("0 * * * * *", |_uuid, _lock| {
                                Box::pin(async move {
                                    let now = chrono::Local::now();
                                    tracing::debug!("[HEARTBEAT] Scheduler alive — local_time={}", now.format("%Y-%m-%d %H:%M:%S"));
                                })
                            });
                            match heartbeat {
                                Ok(hb) => {
                                    if let Err(e) = scheduler.add(hb).await {
                                        tracing::error!("Failed to add heartbeat job: {}", e);
                                    } else {
                                        tracing::debug!("Heartbeat job added (fires every minute at :00)");
                                    }
                                }
                                Err(e) => tracing::error!("Failed to create heartbeat job: {}", e),
                            }
                        }

                        if let Err(e) = scheduler.start().await {
                            tracing::error!("Failed to start scheduler: {}", e);
                            return;
                        }
                        tracing::info!("Cron scheduler started");
                        let mut lock = scheduler_state_clone.lock().await;
                        *lock = Some(SchedulerState {
                            scheduler,
                            job_id: None,
                        });
                    }
                    Err(e) => {
                        tracing::error!("Failed to create scheduler: {}", e);
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
