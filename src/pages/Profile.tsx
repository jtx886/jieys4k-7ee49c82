import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Clock, Heart, LogOut, User, Trash2, Play } from "lucide-react";
import { toast } from "sonner";

interface HistoryItem {
  id: string;
  vod_id: string;
  vod_name: string;
  vod_pic: string | null;
  vod_type: string | null;
  episode: string | null;
  watched_at: string;
}

interface FavoriteItem {
  id: string;
  vod_id: string;
  vod_name: string;
  vod_pic: string | null;
  vod_type: string | null;
  created_at: string;
}

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"history" | "favorites">("history");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [profile, setProfile] = useState<{ username: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    supabase.from("profiles").select("username").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setProfile(data));

    supabase.from("watch_history").select("*").eq("user_id", user.id).order("watched_at", { ascending: false }).limit(50)
      .then(({ data }) => setHistory((data as HistoryItem[]) || []));

    supabase.from("favorites").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setFavorites((data as FavoriteItem[]) || []));
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    toast.success("已退出登录");
    navigate("/");
  };

  const clearHistory = async () => {
    if (!user) return;
    await supabase.from("watch_history").delete().eq("user_id", user.id);
    setHistory([]);
    toast.success("历史记录已清空");
  };

  const removeFavorite = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    toast.success("已取消收藏");
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full gradient-btn flex items-center justify-center">
              <User className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-foreground">
                {profile?.username || "用户"}
              </h2>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="glass px-4 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive transition-all flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">退出</span>
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab("history")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === "history" ? "gradient-btn text-primary-foreground" : "glass text-muted-foreground"
            }`}
          >
            <Clock className="w-4 h-4" />
            观看历史
          </button>
          <button
            onClick={() => setTab("favorites")}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              tab === "favorites" ? "gradient-btn text-primary-foreground" : "glass text-muted-foreground"
            }`}
          >
            <Heart className="w-4 h-4" />
            我的收藏
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {tab === "history" && (
            <>
              {history.length > 0 && (
                <div className="flex justify-end">
                  <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                    <Trash2 className="w-3 h-3" />
                    清空历史
                  </button>
                </div>
              )}
              {history.length === 0 ? (
                <div className="text-center py-16">
                  <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">暂无观看记录</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                  {history.map((item) => (
                    <Link key={item.id} to={`/player/${item.vod_id}?auto=1`} className="group card-hover block">
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                        <img
                          src={item.vod_pic || "/placeholder.svg"}
                          alt={item.vod_name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play className="w-8 h-8 text-primary" />
                        </div>
                        {item.episode && (
                          <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded glass text-foreground">
                            {item.episode}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-foreground truncate">{item.vod_name}</p>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === "favorites" && (
            <>
              {favorites.length === 0 ? (
                <div className="text-center py-16">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">暂无收藏</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
                  {favorites.map((item) => (
                    <div key={item.id} className="group relative">
                      <Link to={`/player/${item.vod_id}`} className="card-hover block">
                        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
                          <img
                            src={item.vod_pic || "/placeholder.svg"}
                            alt={item.vod_name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                          />
                        </div>
                        <p className="mt-1.5 text-xs text-foreground truncate">{item.vod_name}</p>
                      </Link>
                      <button
                        onClick={(e) => { e.preventDefault(); removeFavorite(item.id); }}
                        className="absolute top-1 right-1 p-1.5 rounded-lg glass opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
