import { Link } from "react-router-dom";
import type { VodItem } from "@/lib/videoApi";
import { Play } from "lucide-react";

interface VideoCardProps {
  video: VodItem;
}

export default function VideoCard({ video }: VideoCardProps) {
  return (
    <Link
      to={`/player/${video.vod_id}`}
      className="group card-hover block"
    >
      <div className="relative aspect-[2/3] rounded-2xl overflow-hidden bg-gradient-to-br from-secondary to-secondary/60 shadow-lg">
        <img
          src={video.vod_pic}
          alt={video.vod_name}
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        
        {/* Premium overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent opacity-60" />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full gradient-btn flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform duration-500 shadow-2xl">
            <Play className="w-6 h-6 text-primary-foreground ml-0.5" />
          </div>
        </div>
        
        {/* Premium badge */}
        {video.vod_remarks && (
          <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded-lg glass-strong text-foreground backdrop-blur-xl border border-white/10">
            {video.vod_remarks}
          </span>
        )}
        
        {/* Type badge */}
        {video.type_name && (
          <span className="absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-lg gradient-btn text-primary-foreground shadow-lg">
            {video.type_name}
          </span>
        )}
      </div>
      
      {/* Card info */}
      <div className="mt-3 px-1">
        <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-300">
          {video.vod_name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground truncate">
            {video.vod_year}
          </span>
          {video.vod_area && (
            <>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground truncate">
                {video.vod_area}
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
