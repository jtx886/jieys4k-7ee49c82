import { useState, useEffect } from "react";
import { getVideoList, type VodItem, type VodApiResponse } from "@/lib/videoApi";
import VideoCard from "@/components/VideoCard";
import CategoryTabs from "@/components/CategoryTabs";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ChevronRight, Sparkles } from "lucide-react";

export default function Index() {
  const [category, setCategory] = useState(0);
  const [videos, setVideos] = useState<VodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchVideos(1, category);
  }, [category]);

  const fetchVideos = async (pg: number, cat: number) => {
    try {
      const data: VodApiResponse = await getVideoList(cat || undefined, pg);
      if (pg === 1) {
        setVideos(data.list || []);
      } else {
        setVideos((prev) => [...prev, ...(data.list || [])]);
      }
      setTotalPages(data.pagecount || 1);
    } catch {
      console.error("加载失败");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchVideos(nextPage, category);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="glass-strong rounded-3xl p-8 sm:p-10 relative overflow-hidden"
        >
          {/* Decorative gradient orbs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-primary/20 to-accent/10 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/15 to-transparent rounded-full blur-2xl opacity-40" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Premium 4K Streaming</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold leading-tight">
              <span className="gradient-text">JIE影视4K</span>
            </h1>
            <p className="text-muted-foreground mt-3 text-sm sm:text-base max-w-2xl leading-relaxed">
              🎬 高清无广告4K画质影视平台 · 海量蓝光资源免费观看
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              {["⚡ 极速加载", "🎯 精准搜索", "📱 全平台支持"].map((tag) => (
                <div key={tag} className="glass px-4 py-2 rounded-full text-xs sm:text-sm text-foreground/90 border border-white/8">
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Categories */}
        <CategoryTabs active={category} onChange={setCategory} />

        {/* Video Grid */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 sm:gap-5"
            >
              {videos.map((video, i) => (
                <motion.div
                  key={`${video.vod_id}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5), duration: 0.4 }}
                >
                  <VideoCard video={video} />
                </motion.div>
              ))}
            </motion.div>

            {videos.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">暂无内容</p>
              </div>
            )}

            {page < totalPages && (
              <div className="flex justify-center pt-6">
                <motion.button
                  onClick={loadMore}
                  whileTap={{ scale: 0.97 }}
                  className="glass px-8 py-3.5 rounded-2xl text-sm font-semibold text-foreground hover:border-primary/30 transition-all duration-300 flex items-center gap-2 group"
                >
                  加载更多
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
