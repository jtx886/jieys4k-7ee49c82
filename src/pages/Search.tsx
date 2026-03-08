import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { searchVideos, type VodItem } from "@/lib/videoApi";
import VideoCard from "@/components/VideoCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [videos, setVideos] = useState<VodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (query) {
      setLoading(true);
      setPage(1);
      searchVideos(query, 1).then((data) => {
        setVideos(data.list || []);
        setTotalPages(data.pagecount || 1);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [query]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    searchVideos(query, next).then((data) => {
      setVideos((prev) => [...prev, ...(data.list || [])]);
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 space-y-6">
        <h2 className="text-xl font-display font-bold text-foreground">
          搜索结果：<span className="text-primary">{query}</span>
        </h2>

        {loading ? (
          <LoadingSkeleton />
        ) : videos.length > 0 ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
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
            {page < totalPages && (
              <div className="flex justify-center pt-4">
                <button onClick={loadMore} className="glass px-6 py-3 rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-all">
                  加载更多
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 space-y-3">
            <SearchX className="w-16 h-16 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">未找到相关内容</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
