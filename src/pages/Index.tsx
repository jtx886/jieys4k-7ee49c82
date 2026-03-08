import { useState, useEffect } from "react";
import { getVideoList, type VodItem, type VodApiResponse } from "@/lib/videoApi";
import VideoCard from "@/components/VideoCard";
import CategoryTabs from "@/components/CategoryTabs";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

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
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 sm:p-8"
        >
          <h1 className="text-2xl sm:text-3xl font-display font-bold">
            <span className="gradient-text">JIE影视4K</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            免费在线观看高清电影、电视剧、动漫 · 无广告 · 支持4K
          </p>
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
              transition={{ duration: 0.3 }}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4"
            >
              {videos.map((video, i) => (
                <motion.div
                  key={`${video.vod_id}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.5) }}
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
              <div className="flex justify-center pt-4">
                <button
                  onClick={loadMore}
                  className="glass px-6 py-3 rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-all flex items-center gap-2"
                >
                  加载更多
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
