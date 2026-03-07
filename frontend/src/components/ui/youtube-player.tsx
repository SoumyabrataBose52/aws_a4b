"use client";

import { useEffect, useRef, useCallback } from "react";

/* ── YouTube IFrame API type declarations ─────────────────── */
declare global {
    interface Window {
        YT: typeof YT;
        onYouTubeIframeAPIReady: (() => void) | undefined;
        _ytApiLoaded?: boolean;
        _ytApiCallbacks?: (() => void)[];
    }
    namespace YT {
        class Player {
            constructor(elementId: string | HTMLElement, options: PlayerOptions);
            destroy(): void;
            playVideo(): void;
            pauseVideo(): void;
            stopVideo(): void;
            getPlayerState(): number;
        }
        interface PlayerOptions {
            width?: number | string;
            height?: number | string;
            videoId?: string;
            playerVars?: Record<string, number | string>;
            events?: {
                onReady?: (event: PlayerEvent) => void;
                onStateChange?: (event: OnStateChangeEvent) => void;
                onError?: (event: OnErrorEvent) => void;
            };
        }
        interface PlayerEvent {
            target: Player;
        }
        interface OnStateChangeEvent {
            data: number;
            target: Player;
        }
        interface OnErrorEvent {
            data: number;
            target: Player;
        }
        const PlayerState: {
            UNSTARTED: -1;
            ENDED: 0;
            PLAYING: 1;
            PAUSED: 2;
            BUFFERING: 3;
            CUED: 5;
        };
    }
}

/* ── Script loader (singleton) ────────────────────────────── */
function loadYTApi(): Promise<void> {
    return new Promise((resolve) => {
        // Already loaded
        if (window._ytApiLoaded && window.YT?.Player) {
            resolve();
            return;
        }

        // Queue callback if script is loading
        if (!window._ytApiCallbacks) {
            window._ytApiCallbacks = [];
        }
        window._ytApiCallbacks.push(resolve);

        // Only inject script once
        if (document.getElementById("yt-iframe-api")) return;

        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const first = document.getElementsByTagName("script")[0];
        first.parentNode?.insertBefore(tag, first);

        window.onYouTubeIframeAPIReady = () => {
            window._ytApiLoaded = true;
            window._ytApiCallbacks?.forEach((cb) => cb());
            window._ytApiCallbacks = [];
        };
    });
}

/* ── Component ────────────────────────────────────────────── */
interface YouTubePlayerProps {
    videoId: string;
    width?: number | string;
    height?: number | string;
    autoplay?: boolean;
    className?: string;
    onReady?: (player: YT.Player) => void;
    onStateChange?: (state: number) => void;
}

export function YouTubePlayer({
    videoId,
    width = "100%",
    height = "100%",
    autoplay = true,
    className,
    onReady,
    onStateChange,
}: YouTubePlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<YT.Player | null>(null);
    const elIdRef = useRef(`yt-player-${Math.random().toString(36).slice(2, 9)}`);

    const initPlayer = useCallback(() => {
        if (!containerRef.current) return;

        // Create a child div the API will replace
        const el = document.createElement("div");
        el.id = elIdRef.current;
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(el);

        playerRef.current = new window.YT.Player(elIdRef.current, {
            width,
            height,
            videoId,
            playerVars: {
                autoplay: autoplay ? 1 : 0,
                playsinline: 1,
                rel: 0,
                modestbranding: 1,
            },
            events: {
                onReady: (e) => onReady?.(e.target),
                onStateChange: (e) => onStateChange?.(e.data),
            },
        });
    }, [videoId, width, height, autoplay, onReady, onStateChange]);

    useEffect(() => {
        loadYTApi().then(initPlayer);

        return () => {
            try {
                playerRef.current?.destroy();
            } catch {
                // player may already be gone
            }
            playerRef.current = null;
        };
    }, [initPlayer]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ width: typeof width === "number" ? `${width}px` : width, height: typeof height === "number" ? `${height}px` : height }}
        />
    );
}
