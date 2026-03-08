import { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  onProgress?: (progress: number) => void;
}

export default function VideoPlayer({ url, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !url) return;

    setLoading(true);
    setError("");

    // Clean up previous instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hlsRef.current = hls;
        hls.loadSource(url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            setError("视频加载失败，请尝试其他源");
            setLoading(false);
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
        video.addEventListener("loadedmetadata", () => {
          setLoading(false);
          video.play().catch(() => {});
        });
      } else {
        setError("您的浏览器不支持播放此视频格式");
        setLoading(false);
      }
    } else {
      video.src = url;
      video.addEventListener("loadeddata", () => {
        setLoading(false);
        video.play().catch(() => {});
      });
      video.addEventListener("error", () => {
        setError("视频加载失败");
        setLoading(false);
      });
    }

    // Progress tracking
    const handleTimeUpdate = () => {
      if (video.duration && onProgress) {
        onProgress(video.currentTime / video.duration);
      }
    };
    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [url, onProgress]);

  return (
    <div className="relative w-full aspect-video bg-background rounded-xl overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10 gap-2">
          <AlertCircle className="w-10 h-10 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      )}
      <video
        ref={videoRef}
        controls
        className="w-full h-full"
        playsInline
      />
    </div>
  );
}
