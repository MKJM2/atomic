import { useEffect } from 'react';
import type { LayoutMode } from '@atomic/ui';

interface UseKeyboardNavOptions {
    activeIndex: number;
    setActiveIndex: (index: number) => void;
    entryCount: number;
    layoutMode: LayoutMode;
    isSettingsOpen: boolean;
    setIsSettingsOpen: (open: boolean) => void;
    scrollToActive: (index: number) => void;
}

export function useKeyboardNav({
    activeIndex,
    setActiveIndex,
    entryCount,
    layoutMode,
    isSettingsOpen,
    setIsSettingsOpen,
    scrollToActive,
}: UseKeyboardNavOptions) {
    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape' && isSettingsOpen) {
                setIsSettingsOpen(false);
                return;
            }

            if (
                e.target instanceof HTMLTextAreaElement ||
                e.target instanceof HTMLInputElement ||
                (e.target instanceof HTMLDivElement && e.target.isContentEditable)
            ) {
                return;
            }

            let newIndex = activeIndex;
            if (e.key === 'j' || e.key === 'ArrowDown') {
                e.preventDefault();
                newIndex = Math.min(activeIndex + 1, entryCount - 1);
            } else if (e.key === 'k' || e.key === 'ArrowUp') {
                e.preventDefault();
                newIndex = Math.max(activeIndex - 1, 0);
            }
            if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
                if (layoutMode === 'minimalist') {
                    scrollToActive(newIndex);
                }
            }
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, entryCount, scrollToActive, layoutMode, isSettingsOpen, setActiveIndex, setIsSettingsOpen]);
}
