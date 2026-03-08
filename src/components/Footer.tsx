import { Film } from "lucide-react";

export default function Footer() {
  return (
    <footer className="glass-strong mt-auto py-6">
      <div className="container mx-auto px-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Film className="w-4 h-4 text-primary" />
          <span className="font-display font-bold gradient-text">JIE影视4K</span>
        </div>
        <p className="text-xs text-muted-foreground">
          备案号：桂ICP备202602110908号
        </p>
        <p className="text-xs text-muted-foreground">
          作者：杰同学🐾
        </p>
        <p className="text-xs text-muted-foreground">
          视频资源中的广告请勿相信
        </p>
      </div>
    </footer>
  );
}
