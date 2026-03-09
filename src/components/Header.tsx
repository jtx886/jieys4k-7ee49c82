import { Search, User, Film, Home, History, Trash2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { searchVideos, type VodItem } from "@/lib/videoApi";
import {
  addSearchHistoryItem,
  clearSearchHistory,
  readSearchHistory,
} from "@/lib/searchHistory";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<VodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLFormElement>(null);

  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    setHistory(readSearchHistory());
  }, []);

  const submitSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    setHistory(addSearchHistoryItem(trimmed));
    setShowSuggestions(false);
    setShowHistory(false);
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(searchQuery);
  };

  const handleSuggestionClick = (name: string) => {
    setSearchQuery(name);
    submitSearch(name);
  };

  // Fetch suggestions with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      searchVideos(searchQuery.trim(), 1)
        .then((data) => {
          setSuggestions(data.list?.slice(0, 8) || []);
          setShowSuggestions(true);
        })
        .catch(() => setSuggestions([]));
    }, 400);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close popovers on route change
  useEffect(() => {
    setShowSuggestions(false);
    setShowHistory(false);
  }, [location.pathname, location.search]);

  const navItems = [
    { path: "/", icon: Home, label: "首页" },
    { path: "/profile", icon: User, label: "我的" },
  ];

  return (
    <header className="glass-strong sticky top-0 z-50 border-b border-white/5 shadow-xl">
      <div className="container mx-auto px-4 py-3.5 flex items-center gap-3">
        {/* Premium Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
            <Film className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg gradient-text hidden sm:block">
            JIE影视4K
          </span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md mx-auto" ref={containerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="搜索电影、电视剧、动漫..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              className="w-full pl-10 pr-12 py-2.5 rounded-full glass border border-white/10 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 focus:border-primary/40 transition-all duration-300 hover:border-white/20"
            />

            {/* Search history button */}
            <button
              type="button"
              onClick={() => {
                const next = readSearchHistory();
                setHistory(next);
                setShowHistory((v) => !v);
                setShowSuggestions(false);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="搜索历史"
              title="搜索历史"
            >
              <History className="w-4 h-4" />
            </button>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50">
                {suggestions.map((item) => (
                  <button
                    key={item.vod_id}
                    type="button"
                    onClick={() => handleSuggestionClick(item.vod_name)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors"
                  >
                    <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{item.vod_name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {[item.type_name, item.vod_remarks].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* History dropdown */}
            {showHistory && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground">搜索历史</p>
                  <button
                    type="button"
                    onClick={() => {
                      clearSearchHistory();
                      setHistory([]);
                      setShowHistory(false);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    清空
                  </button>
                </div>

                {history.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-muted-foreground">暂无搜索历史</div>
                ) : (
                  <div className="max-h-72 overflow-auto">
                    {history.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleSuggestionClick(q)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">{q}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </form>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                location.pathname === path
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
