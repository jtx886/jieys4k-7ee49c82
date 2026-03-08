import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getVideoDetail, parsePlayUrls, type VodItem } from "@/lib/videoApi";
import VideoPlayer from "@/components/VideoPlayer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Heart, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [video, setVideo] = useState<VodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentEp, setCurrentEp] = useState(0);
  const [isFav, setIsFav] = useState(false);
  const [initialProgress, setInitialProgress] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const { user } = useAuth();
  const lastSavedProgress = useRef(0);
  const historyLoaded = useRef(false);

  // Check if coming from history (auto param)
  const fromHistory = searchParams.get("auto") === "1";

  const episodes = video ? parsePlayUrls(video.vod_play_url?.split("$$$")[0] || "") : [];

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    historyLoaded.current = false;
    getVideoDetail(id).then((data) => {
      setVideo(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  // Load saved progress from history
  useEffect(() => {
    if (!user || !id || historyLoaded.current) return;
    supabase.from("watch_history")
      .select("progress, episode")
      .eq("user_id", user.id)
      .eq("vod_id", String(id))
      .order("watched_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        historyLoaded.current = true;
        if (data?.progress && data.progress > 0 && data.progress < 0.98) {
          setInitialProgress(data.progress);
          // Try to restore episode
          if (data.episode && episodes.length > 1) {
            const epIdx = episodes.findIndex(e => e.name === data.episode);
            if (epIdx >= 0) setCurrentEp(epIdx);
          }
        }
        // Auto-play if coming from history
        if (fromHistory) {
          setAutoPlay(true);
        }
      });
  }, [user, id, episodes.length, fromHistory]);

  // Check favorite status
  useEffect(() => {
    if (!user || !id) return;
    supabase.from("favorites").select("id").eq("user_id", user.id).eq("vod_id", String(id)).maybeSingle()
      .then(({ data }) => setIsFav(!!data));
  }, [user, id]);

  // Save watch history - debounced to avoid too many writes
  const saveHistory = useCallback((progress: number) => {
    if (!user || !video) return;
    // Only save if progress changed significantly (>2%)
    if (Math.abs(progress - lastSavedProgress.current) < 0.02) return;
    lastSavedProgress.current = progress;

    supabase.from("watch_history").upsert({
      user_id: user.id,
      vod_id: String(video.vod_id),
      vod_name: video.vod_name,
      vod_pic: video.vod_pic,
      vod_type: video.type_name,
      episode: episodes[currentEp]?.name || "",
      progress,
      watched_at: new Date().toISOString(),
    }, { onConflict: "user_id,vod_id" }).then(() => {});
  }, [user, video, currentEp, episodes]);

  const toggleFavorite = async () => {
    if (!user) {
      toast.error("请先登录");
      return;
    }
    if (!video) return;

    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("vod_id", String(video.vod_id));
      setIsFav(false);
      toast.success("已取消收藏");
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        vod_id: String(video.vod_id),
        vod_name: video.vod_name,
        vod_pic: video.vod_pic,
        vod_type: video.type_name,
      });
      setIsFav(true);
      toast.success("已收藏");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">视频不存在</p>
        </div>
      </div>
    );
  }

  const handleNextEpisode = useCallback(() => {
    if (currentEp < episodes.length - 1) {
      setCurrentEp(currentEp + 1);
      setInitialProgress(0);
      setAutoPlay(true);
    }
  }, [currentEp, episodes.length]);

  const handlePrevEpisode = useCallback(() => {
    if (currentEp > 0) {
      setCurrentEp(currentEp - 1);
      setInitialProgress(0);
      setAutoPlay(true);
    }
  }, [currentEp]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Player */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <VideoPlayer
            url={episodes[currentEp]?.url || ""}
            onProgress={saveHistory}
            initialProgress={initialProgress}
            autoPlay={autoPlay}
            onNextEpisode={handleNextEpisode}
            onPrevEpisode={handlePrevEpisode}
            hasNextEpisode={currentEp < episodes.length - 1}
            hasPrevEpisode={currentEp > 0}
            currentEpisodeName={episodes[currentEp]?.name}
          />
        </motion.div>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-5 space-y-4"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-display font-bold text-foreground">{video.vod_name}</h1>
              <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                {video.type_name && <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary">{video.type_name}</span>}
                {video.vod_year && <span>{video.vod_year}</span>}
                {video.vod_area && <span>{video.vod_area}</span>}
                {video.vod_lang && <span>{video.vod_lang}</span>}
              </div>
            </div>
            <button
              onClick={toggleFavorite}
              className={`shrink-0 p-3 rounded-xl transition-all ${
                isFav ? "bg-primary/15 text-primary" : "glass text-muted-foreground hover:text-primary"
              }`}
            >
              {isFav ? <Star className="w-5 h-5 fill-current" /> : <Heart className="w-5 h-5" />}
            </button>
          </div>

          {video.vod_director && (
            <p className="text-xs text-muted-foreground">导演：{video.vod_director}</p>
          )}
          {video.vod_actor && (
            <p className="text-xs text-muted-foreground">主演：{video.vod_actor}</p>
          )}
          {(video.vod_blurb || video.vod_content) && (
            <p className="text-sm text-secondary-foreground leading-relaxed line-clamp-3">
              {video.vod_blurb || video.vod_content?.replace(/<[^>]+>/g, "")}
            </p>
          )}
        </motion.div>

        {/* Episodes */}
        {episodes.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-5 space-y-3"
          >
            <h2 className="text-sm font-display font-semibold text-foreground">选集</h2>
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
              {episodes.map((ep, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentEp(i); setInitialProgress(0); }}
                  className={`px-2 py-2 rounded-lg text-xs font-medium transition-all truncate ${
                    i === currentEp
                      ? "gradient-btn text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {ep.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </main>
      <Footer />
    </div>
  );
}
