import { Film, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="glass-strong mt-auto py-8 border-t border-white/5">
      <div className="container mx-auto px-4 text-center space-y-3">
        <div className="flex items-center justify-center gap-2.5">
          <div className="w-8 h-8 rounded-xl gradient-btn flex items-center justify-center shadow-lg">
            <Film className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg gradient-text">JIE影视4K</span>
        </div>
        <p className="text-xs text-muted-foreground/80">
          备案号：桂ICP备202602110908号
        </p>
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/60">
          <span>Made with</span>
          <Heart className="w-3 h-3 text-primary fill-primary animate-pulse" />
          <span>by 杰同学🐾</span>
        </div>
        <p className="text-xs text-muted-foreground/40">
          © {new Date().getFullYear()} JIE影视4K · All Rights Reserved
        </p>
      </div>
    </footer>
  );
}
