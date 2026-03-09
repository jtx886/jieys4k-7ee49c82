import { CATEGORIES } from "@/lib/videoApi";

interface CategoryTabsProps {
  active: number;
  onChange: (id: number) => void;
}

export default function CategoryTabs({ active, onChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
            active === cat.id
              ? "gradient-btn text-primary-foreground"
              : "glass text-muted-foreground hover:text-foreground"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
