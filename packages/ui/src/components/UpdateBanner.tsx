interface UpdateBannerProps {
    version: string;
    isDownloading: boolean;
    downloadProgress: number;
    onUpdate: () => void;
    onDismiss: () => void;
}

export function UpdateBanner({
    version,
    isDownloading,
    downloadProgress,
    onUpdate,
    onDismiss,
}: UpdateBannerProps) {
    return (
        <div className="update-banner">
            <div className="update-banner-content">
                <span className="update-banner-text">
                    {isDownloading
                        ? `Downloading v${version}…`
                        : `Atomic v${version} is available`}
                </span>
                <div className="update-banner-actions">
                    {isDownloading ? (
                        <div className="update-progress-bar">
                            <div
                                className="update-progress-fill"
                                style={{ width: `${downloadProgress}%` }}
                            />
                        </div>
                    ) : (
                        <>
                            <button className="update-btn update-btn-primary" onClick={onUpdate}>
                                Update
                            </button>
                            <button className="update-btn update-btn-dismiss" onClick={onDismiss} aria-label="Dismiss">
                                ✕
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
