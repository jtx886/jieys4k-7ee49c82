import { CATEGORIES } from "@/lib/videoApi";
import { motion } from "framer-motion";

interface CategoryTabsProps {
  active: number;
  onChange: (id: number) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-2 px-1">
      {CATEGORIES.map((cat) => (
        <motion.button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          whileTap={{ scale: 0.95 }}
          className={`relative px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-400 ${
            active === cat.id
              ? "gradient-btn text-primary-foreground shadow-lg"
              : "glass text-muted-foreground hover:text-foreground hover:border-white/15"
          }`}
        >
          {cat.name}
        </motion.button>
      ))}
    </div>
  );
}
