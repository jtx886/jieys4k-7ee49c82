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
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-secondary">
        <img
          src={video.vod_pic}
          alt={video.vod_name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full gradient-btn flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </div>
        </div>
        {/* Badge */}
        {video.vod_remarks && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-md glass text-foreground">
            {video.vod_remarks}
          </span>
        )}
        {/* Type */}
        {video.type_name && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium rounded-md bg-primary/80 text-primary-foreground">
            {video.type_name}
          </span>
        )}
      </div>
      <div className="mt-2 px-1">
        <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
          {video.vod_name}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {video.vod_year} {video.vod_area}
        </p>
      </div>
    </Link>
  );
}
