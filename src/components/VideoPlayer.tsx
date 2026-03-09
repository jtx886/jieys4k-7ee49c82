import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  Loader2,
  AlertCircle,
  Volume2,
  VolumeX,
  Sun,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Maximize,
  Minimize,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export interface Episode {
  name: string;
  url: string;
}

interface VideoPlayerProps {
  url: string;
  onProgress?: (progress: number) => void;
  initialProgress?: number; // 0-1
  autoPlay?: boolean;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  hasNextEpisode?: boolean;
  hasPrevEpisode?: boolean;
  currentEpisodeName?: string;
  episodes?: Episode[];
  currentEpisodeIndex?: number;
  onEpisodeSelect?: (index: number) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const RATIO_OPTIONS = [
  { label: "自适应", value: "auto" },
  { label: "16:9", value: "16/9" },
  { label: "4:3", value: "4/3" },
  { label: "填充", value: "fill" },
];
const DEFAULT_SKIP_INTRO_SEC = 0;
const DEFAULT_SKIP_OUTRO_SEC = 0;

export default function VideoPlayer({ 
  url, 
  onProgress, 
  initialProgress, 
  autoPlay = false,
  onNextEpisode,
  onPrevEpisode,
  hasNextEpisode = false,
  hasPrevEpisode = false,
  currentEpisodeName,
  episodes = [],
  currentEpisodeIndex = 0,
  onEpisodeSelect,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Controls state
  const [paused, setPaused] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [ratioIdx, setRatioIdx] = useState(0);
  const [showRatioMenu, setShowRatioMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [orientationLockFailed, setOrientationLockFailed] = useState(false);
  const [isPortrait, setIsPortrait] = useState(() =>
    typeof window !== "undefined" ? window.innerHeight > window.innerWidth : false
  );
  const [showControls, setShowControls] = useState(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout>>();

  // Gesture state
  const [gestureInfo, setGestureInfo] = useState<string>("");
  const gestureRef = useRef<{
    startX: number;
    startY: number;
    type: "" | "volume" | "brightness" | "seek";
    startVolume: number;
    startBrightness: number;
    startTime: number;
  } | null>(null);
  const [brightness, setBrightness] = useState(1);

  // Long press & double tap state
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();
  const [isLongPress, setIsLongPress] = useState(false);
  const prevSpeed = useRef(1);
  const tapTimer = useRef<ReturnType<typeof setTimeout>>();
  const tapCount = useRef(0);

  // Skip seconds state
  const [skipIntroSec, setSkipIntroSec] = useState(DEFAULT_SKIP_INTRO_SEC);
  const [skipOutroSec, setSkipOutroSec] = useState(DEFAULT_SKIP_OUTRO_SEC);
  const [showSkipSettings, setShowSkipSettings] = useState(false);

  // Episode list state
  const [showEpisodeList, setShowEpisodeList] = useState(false);

  // Progress bar state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressApplied = useRef(false);

  // ---- Video source loading ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setLoading(true);
    setError("");
    progressApplied.current = false;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const onReady = () => {
      setLoading(false);
      // Apply initial progress
      if (initialProgress && initialProgress > 0 && initialProgress < 0.98 && video.duration) {
        video.currentTime = video.duration * initialProgress;
        progressApplied.current = true;
      }
      // Auto-play if requested
      if (autoPlay) {
        video.play().catch(() => {});
      } else {
        setPaused(true);
      }
    };

    if (url.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => onReady());
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError("视频加载失败，请尝试其他源");
            setLoading(false);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener("loadedmetadata", onReady, { once: true });
      } else {
        setError("您的浏览器不支持播放此视频格式");
        setLoading(false);
      }
    } else {
      video.src = url;
      video.addEventListener("loadeddata", onReady, { once: true });
      video.addEventListener("error", () => {
        setError("视频加载失败");
        setLoading(false);
      }, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url]);

  // Apply initial progress when duration becomes available
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !initialProgress || progressApplied.current) return;
    if (duration > 0 && initialProgress > 0 && initialProgress < 0.98) {
      video.currentTime = duration * initialProgress;
      progressApplied.current = true;
    }
  }, [duration, initialProgress]);

  // ---- Time update & Auto next episode ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => {
      setCurrentTime(video.currentTime);
      setDuration(video.duration || 0);
      if (video.duration && onProgress) {
        onProgress(video.currentTime / video.duration);
      }
    };
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    const onEnded = () => {
      // Auto play next episode when current ends
      if (hasNextEpisode && onNextEpisode) {
        setTimeout(() => {
          onNextEpisode();
        }, 1000); // 1 second delay before auto-playing next
      }
    };
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [onProgress, hasNextEpisode, onNextEpisode]);

  // ---- Controls auto-hide ----
  const showControlsBriefly = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setShowControls(false), 3500);
  }, []);

  // ---- Speed ----
  const changeSpeed = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setShowSpeedMenu(false);
  };

  // ---- Ratio ----
  const cycleRatio = () => {
    const next = (ratioIdx + 1) % RATIO_OPTIONS.length;
    setRatioIdx(next);
    setShowRatioMenu(false);
  };

  const getVideoStyle = (): React.CSSProperties => {
    const r = RATIO_OPTIONS[ratioIdx].value;
    if (r === "auto") return { width: "100%", height: "100%", objectFit: "contain" };
    if (r === "fill") return { width: "100%", height: "100%", objectFit: "cover" };
    return { width: "100%", height: "100%", objectFit: "contain", aspectRatio: r };
  };

  // ---- Fullscreen ----
  const shouldRotateLandscape = isFullscreen && isPortrait && orientationLockFailed;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    update();
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;

    const supportsOrientationLock =
      typeof screen !== "undefined" &&
      !!screen.orientation &&
      typeof screen.orientation.lock === "function";

    const supportsOrientationUnlock =
      typeof screen !== "undefined" &&
      !!screen.orientation &&
      typeof screen.orientation.unlock === "function";

    if (!isFullscreen) {
      setOrientationLockFailed(false);

      // Try native fullscreen first; if not supported, fall back to "pseudo" fullscreen (fixed positioning)
      if (el.requestFullscreen) {
        try {
          await el.requestFullscreen();
        } catch {
          // Ignore; we'll still enter pseudo fullscreen
        }
      }

      setIsFullscreen(true);

      // Try to force landscape on supported browsers; if it fails, we'll rotate via CSS as a fallback.
      if (supportsOrientationLock) {
        try {
          await screen.orientation.lock("landscape");
        } catch {
          setOrientationLockFailed(true);
        }
      } else {
        setOrientationLockFailed(true);
      }
    } else {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore
      }

      setIsFullscreen(false);
      setOrientationLockFailed(false);

      try {
        if (supportsOrientationUnlock) screen.orientation.unlock();
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    const onFs = () => {
      const isFull = !!document.fullscreenElement;
      setIsFullscreen(isFull);
      if (!isFull) {
        setOrientationLockFailed(false);
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch {
          // Ignore
        }
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // ---- Skip intro/outro ----
  const skipIntro = () => {
    if (videoRef.current) videoRef.current.currentTime = Math.min(skipIntroSec, duration);
  };
  const skipOutro = () => {
    if (videoRef.current && duration) videoRef.current.currentTime = Math.max(0, duration - skipOutroSec);
  };

  // ---- Gesture handling (touch) ----
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const video = videoRef.current;
    if (!video) return;
    gestureRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      type: "",
      startVolume: video.volume,
      startBrightness: brightness,
      startTime: video.currentTime,
    };

    // Long press detection
    prevSpeed.current = speed;
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true);
      video.playbackRate = 2;
      setGestureInfo("2x 倍速播放中");
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gestureRef.current || !containerRef.current) return;
    const touch = e.touches[0];
    const g = gestureRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = touch.clientX - g.startX;
    const dy = touch.clientY - g.startY;

    // Cancel long press on move
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      if (isLongPress) {
        setIsLongPress(false);
        if (videoRef.current) videoRef.current.playbackRate = prevSpeed.current;
        setGestureInfo("");
      }
    }

    // Determine gesture type
    if (!g.type) {
      if (Math.abs(dy) > 20) {
        const isRight = touch.clientX > rect.left + rect.width / 2;
        g.type = isRight ? "volume" : "brightness";
      } else if (Math.abs(dx) > 30) {
        g.type = "seek";
      } else {
        return;
      }
    }

    // Prevent default to avoid scroll interference with gestures
    e.preventDefault();

    const video = videoRef.current;
    if (!video) return;

    if (g.type === "volume") {
      const delta = -dy / (rect.height * 0.8);
      const newVol = Math.max(0, Math.min(1, g.startVolume + delta));
      video.volume = newVol;
      video.muted = false;
      setGestureInfo(`🔊 音量 ${Math.round(newVol * 100)}%`);
    } else if (g.type === "brightness") {
      const delta = -dy / (rect.height * 0.8);
      // Use a darker overlay approach: 0.3 (very dim) to 1.0 (normal)
      const newB = Math.max(0.3, Math.min(1, g.startBrightness + delta));
      setBrightness(newB);
      setGestureInfo(`☀️ 亮度 ${Math.round(newB * 100)}%`);
    } else if (g.type === "seek") {
      const seekDelta = (dx / rect.width) * (duration * 0.3);
      const newTime = Math.max(0, Math.min(duration, g.startTime + seekDelta));
      video.currentTime = newTime;
      setGestureInfo(`⏩ ${formatTime(newTime)}`);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (isLongPress && videoRef.current) {
      videoRef.current.playbackRate = prevSpeed.current;
      setIsLongPress(false);
    }
    gestureRef.current = null;
    setTimeout(() => setGestureInfo(""), 600);
    showControlsBriefly();
  };

  // ---- Double tap to play/pause, single tap to show controls ----
  const handleTap = () => {
    tapCount.current += 1;
    if (tapCount.current === 1) {
      tapTimer.current = setTimeout(() => {
        // Single tap: just show/hide controls
        tapCount.current = 0;
        showControlsBriefly();
      }, 300);
    } else if (tapCount.current >= 2) {
      // Double tap: toggle play/pause
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapCount.current = 0;
      const video = videoRef.current;
      if (!video) return;
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
      showControlsBriefly();
    }
  };

  // ---- Progress bar seek ----
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (videoRef.current && duration) {
      videoRef.current.currentTime = ratio * duration;
    }
  };

  // ---- Format time ----
  function formatTime(sec: number) {
    if (!sec || !isFinite(sec)) return "00:00";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden select-none ${
        isFullscreen ? "fixed z-50 rounded-none" : "rounded-xl aspect-video"
      } ${isFullscreen && !shouldRotateLandscape ? "inset-0" : ""}`}
      style={
        shouldRotateLandscape
          ? {
              width: "100vh",
              height: "100vw",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(90deg)",
              transformOrigin: "center",
            }
          : undefined
      }
      onMouseMove={showControlsBriefly}
      onClick={handleTap}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Brightness overlay - dims the screen like real brightness */}
      {brightness < 1 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none z-[5]"
          style={{ opacity: 1 - brightness }}
        />
      )}
      {/* Loading */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}
      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20 gap-2">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-sm text-white/70">{error}</p>
        </div>
      )}

      {/* Gesture overlay info */}
      {gestureInfo && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium pointer-events-none">
          {gestureInfo}
        </div>
      )}

      {/* Long press indicator */}
      {isLongPress && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-medium pointer-events-none animate-pulse">
          ⏩ 2x 倍速
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full"
        style={getVideoStyle()}
        playsInline
        onClick={(e) => e.stopPropagation()}
      />

      {/* Custom Controls Overlay */}
      <div
        className={`absolute inset-0 z-10 transition-opacity duration-300 ${showControls || paused ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={(e) => {
          e.stopPropagation();
          handleTap();
        }}
      >
        {/* Top bar */}
        <div
          className="absolute top-0 left-0 right-0 p-3 flex justify-end gap-2 bg-gradient-to-b from-black/60 to-transparent"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Ratio button */}
          <div className="relative">
            <button
              onClick={() => { setShowRatioMenu(!showRatioMenu); setShowSpeedMenu(false); }}
              className="text-white/90 text-xs bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-white/30"
            >
              {RATIO_OPTIONS[ratioIdx].label}
            </button>
            {showRatioMenu && (
              <div className="absolute right-0 top-full mt-1 bg-black/90 backdrop-blur-md rounded-lg overflow-hidden min-w-[80px] z-40">
                {RATIO_OPTIONS.map((r, i) => (
                  <button
                    key={r.value}
                    onClick={() => { setRatioIdx(i); setShowRatioMenu(false); }}
                    className={`block w-full text-left px-3 py-2 text-xs transition-colors ${i === ratioIdx ? "text-primary bg-white/10" : "text-white/80 hover:bg-white/10"}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speed button */}
          <div className="relative">
            <button
              onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowRatioMenu(false); }}
              className="text-white/90 text-xs bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-white/30"
            >
              {speed}x
            </button>
            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-1 bg-black/90 backdrop-blur-md rounded-lg overflow-hidden min-w-[60px] z-40">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => changeSpeed(s)}
                    className={`block w-full text-left px-3 py-2 text-xs transition-colors ${s === speed ? "text-primary bg-white/10" : "text-white/80 hover:bg-white/10"}`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="text-white/90 bg-white/20 backdrop-blur-sm p-1.5 rounded-lg hover:bg-white/30"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>

        {/* Center play/pause */}
        {paused && !loading && !error && (
          <div
            className="absolute inset-0 flex items-center justify-center z-20"
            onClick={(e) => {
              e.stopPropagation();
              const video = videoRef.current;
              if (video) video.play().catch(() => {});
              showControlsBriefly();
            }}
          >
            <div className="bg-black/50 rounded-full p-4">
              <Play className="w-10 h-10 text-white fill-white" />
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8 space-y-2"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Progress bar */}
          <div
            className="w-full h-1.5 bg-white/20 rounded-full cursor-pointer group relative"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-primary rounded-full relative transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Previous episode */}
              {hasPrevEpisode && (
                <button 
                  onClick={onPrevEpisode} 
                  className="text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-white/30 text-xs font-medium"
                  title="上一集"
                >
                  上一集
                </button>
              )}
              <button onClick={skipIntro} className="text-white/80 text-[10px] bg-white/15 px-2 py-1 rounded hover:bg-white/25">
                跳过片头{skipIntroSec > 0 ? ` ${skipIntroSec}s` : ""}
              </button>
              <span className="text-white/80 text-xs tabular-nums">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              {currentEpisodeName && (
                <span className="text-white/60 text-xs hidden sm:inline">
                  {currentEpisodeName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={skipOutro} className="text-white/80 text-[10px] bg-white/15 px-2 py-1 rounded hover:bg-white/25">
                跳过片尾{skipOutroSec > 0 ? ` ${skipOutroSec}s` : ""}
              </button>
              <button
                onClick={() => setShowSkipSettings(!showSkipSettings)}
                className="text-white/80 text-[10px] bg-white/15 px-2 py-1 rounded hover:bg-white/25"
              >
                ⚙️
              </button>
              {/* Episode list button */}
              {episodes.length > 0 && (
                <button 
                  onClick={() => setShowEpisodeList(!showEpisodeList)} 
                  className="text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-white/30 text-xs font-medium"
                  title="选集"
                >
                  选集
                </button>
              )}
              {/* Next episode */}
              {hasNextEpisode && (
                <button 
                  onClick={onNextEpisode} 
                  className="text-white/90 bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg hover:bg-white/30 text-xs font-medium"
                  title="下一集"
                >
                  下一集
                </button>
              )}
            </div>
          </div>

          {/* Skip settings panel */}
          {showSkipSettings && (
            <div className="flex items-center gap-3 bg-black/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white/90">
              <label className="flex items-center gap-1.5">
                片头
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={skipIntroSec}
                  onChange={(e) => setSkipIntroSec(Math.max(0, Number(e.target.value)))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-14 bg-white/15 text-white text-center rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                />
                秒
              </label>
              <label className="flex items-center gap-1.5">
                片尾
                <input
                  type="number"
                  min={0}
                  max={600}
                  value={skipOutroSec}
                  onChange={(e) => setSkipOutroSec(Math.max(0, Number(e.target.value)))}
                  onClick={(e) => e.stopPropagation()}
                  className="w-14 bg-white/15 text-white text-center rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-primary"
                />
                秒
              </label>
            </div>
          )}

          {/* Episode list panel */}
          {showEpisodeList && episodes.length > 0 && (
            <div className="bg-black/90 backdrop-blur-md rounded-lg p-3 max-h-[200px] overflow-y-auto">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {episodes.map((ep, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (onEpisodeSelect) {
                        onEpisodeSelect(index);
                        setShowEpisodeList(false);
                      }
                    }}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      index === currentEpisodeIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/10 text-white/80 hover:bg-white/20"
                    }`}
                  >
                    {ep.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
