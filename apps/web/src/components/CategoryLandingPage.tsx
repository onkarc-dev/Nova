import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, Star, Heart, ChevronRight } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/routes/index";

/* ---------- Category config ---------- */
type CategoryConfig = {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  showcase: { emoji: string; name: string; price: string }[];
  subcategories: { emoji: string; name: string; count: string; slug: string }[];
  deals: { emoji: string; brand: string; name: string; sale: number; was: number; claimed: number; rating: number; reviews: number }[];
  brands: string[];
  trending: { emoji: string; brand: string; name: string; price: number; was?: number; rating: number; reviews: number; tier: "under50" | "under200" | "under500" | "premium" | "new" }[];
  guides: { emoji: string; title: string; excerpt: string }[];
  editor: {
    big: { emoji: string; tag: string; name: string; desc: string; price: string; was: string };
    a: { emoji: string; tag: string; name: string; price: string; was: string };
    b: { emoji: string; tag: string; name: string; price: string; was: string };
  };
};

const CATEGORIES: Record<string, CategoryConfig> = {
  electronics: {
    slug: "electronics",
    title: "Electronics",
    subtitle: "Discover the latest in tech — from smartphones to smart homes.",
    icon: "💻",
    showcase: [
      { emoji: "📱", name: "Samsung S25 Ultra", price: "$899" },
      { emoji: "💻", name: "MacBook Air M4", price: "$999" },
      { emoji: "🎧", name: "Sony WH-1000XM6", price: "$329" },
      { emoji: "📷", name: "Canon EOS R8", price: "$1,499" },
    ],
    subcategories: [
      { emoji: "📱", name: "Smartphones", count: "4,832 products", slug: "smartphones" },
      { emoji: "💻", name: "Laptops & PCs", count: "3,201 products", slug: "laptops" },
      { emoji: "🎧", name: "Headphones", count: "2,418 products", slug: "headphones" },
      { emoji: "📺", name: "Televisions", count: "1,907 products", slug: "tvs" },
      { emoji: "📷", name: "Cameras", count: "1,544 products", slug: "cameras" },
      { emoji: "🎮", name: "Gaming", count: "5,182 products", slug: "gaming" },
      { emoji: "⌚", name: "Wearables", count: "2,003 products", slug: "wearables" },
      { emoji: "🔊", name: "Speakers", count: "1,629 products", slug: "speakers" },
      { emoji: "🖨️", name: "Printers", count: "812 products", slug: "printers" },
      { emoji: "💡", name: "Smart Home", count: "3,476 products", slug: "smart-home" },
      { emoji: "🔋", name: "Accessories", count: "9,210 products", slug: "accessories" },
      { emoji: "📡", name: "Networking", count: "1,108 products", slug: "networking" },
    ],
    deals: [
      { emoji: "📺", brand: "SONY", name: 'Sony 65" 4K OLED TV', sale: 1299, was: 2199, claimed: 68, rating: 4.7, reviews: 1240 },
      { emoji: "💻", brand: "APPLE", name: "MacBook Air M4 13\"", sale: 999, was: 1299, claimed: 82, rating: 4.9, reviews: 8421 },
      { emoji: "📱", brand: "SAMSUNG", name: "Samsung Galaxy S25 Ultra", sale: 899, was: 1199, claimed: 54, rating: 4.6, reviews: 3210 },
      { emoji: "🚁", brand: "DJI", name: "DJI Mini 4 Pro Drone", sale: 759, was: 959, claimed: 41, rating: 4.8, reviews: 612 },
      { emoji: "🎮", brand: "SONY", name: "PlayStation 5 Slim", sale: 449, was: 499, claimed: 91, rating: 4.9, reviews: 15032 },
    ],
    brands: ["Apple", "Sony", "Samsung", "LG", "Dell", "Bose", "Canon", "DJI"],
    trending: [
      { emoji: "🎧", brand: "JBL", name: "JBL Tune 510BT Wireless", price: 39, was: 59, rating: 4.4, reviews: 8210, tier: "under50" },
      { emoji: "🔌", brand: "ANKER", name: "Anker 65W USB-C Charger", price: 29, rating: 4.7, reviews: 3120, tier: "under50" },
      { emoji: "⌚", brand: "FITBIT", name: "Fitbit Inspire 3 Tracker", price: 99, was: 129, rating: 4.5, reviews: 2210, tier: "under200" },
      { emoji: "🔊", brand: "BOSE", name: "Bose SoundLink Flex", price: 149, rating: 4.8, reviews: 4012, tier: "under200" },
      { emoji: "📱", brand: "GOOGLE", name: "Pixel 8a Smartphone", price: 499, was: 549, rating: 4.6, reviews: 1820, tier: "under500" },
      { emoji: "🎮", brand: "NINTENDO", name: "Nintendo Switch OLED", price: 349, rating: 4.9, reviews: 22310, tier: "under500" },
      { emoji: "💻", brand: "DELL", name: 'Dell XPS 14 OLED Laptop', price: 1799, was: 1999, rating: 4.7, reviews: 412, tier: "premium" },
      { emoji: "📷", brand: "CANON", name: "Canon EOS R8 Mirrorless", price: 1499, rating: 4.8, reviews: 318, tier: "premium" },
      { emoji: "🥽", brand: "META", name: "Meta Quest 3S VR Headset", price: 299, rating: 4.6, reviews: 1109, tier: "new" },
      { emoji: "📺", brand: "LG", name: 'LG C4 55" OLED evo TV', price: 1399, was: 1699, rating: 4.8, reviews: 540, tier: "new" },
    ],
    guides: [
      { emoji: "🎧", title: "Best Headphones of 2026: Tested and Ranked", excerpt: "Our experts spent 200+ hours testing the latest wireless headphones for sound, comfort, and noise cancellation." },
      { emoji: "💻", title: "Laptop Buying Guide: What to Look For in 2026", excerpt: "From M-series Macs to Snapdragon X, here's how to choose the right laptop for work, school, or play." },
      { emoji: "📱", title: "Best Smartphones Under $500", excerpt: "You don't need to spend a fortune to get a great phone. These mid-range picks punch well above their price." },
    ],
    editor: {
      big: { emoji: "💻", tag: "EDITOR'S CHOICE", name: "MacBook Air M4", desc: "The thinnest, lightest Mac ever built. Blazing M4 chip performance in a fanless design that lasts all day.", price: "$999", was: "$1,299" },
      a: { emoji: "🎧", tag: "BEST AUDIO", name: "Sony WH-1000XM6", price: "$329", was: "$449" },
      b: { emoji: "📱", tag: "TOP SELLER", name: "Samsung Galaxy S25 Ultra", price: "$899", was: "$1,199" },
    },
  },
  fashion: {
    slug: "fashion",
    title: "Fashion",
    subtitle: "Trending styles for every occasion.",
    icon: "👗",
    showcase: [
      { emoji: "👗", name: "Linen Midi Dress", price: "$79" },
      { emoji: "👟", name: "Retro Court Sneakers", price: "$129" },
      { emoji: "👜", name: "Suede Crossbody Bag", price: "$149" },
      { emoji: "🧥", name: "Wool Trench Coat", price: "$249" },
    ],
    subcategories: [
      { emoji: "👗", name: "Dresses", count: "6,210 products", slug: "dresses" },
      { emoji: "👕", name: "Tops & Tees", count: "9,401 products", slug: "tops" },
      { emoji: "👖", name: "Jeans", count: "4,108 products", slug: "jeans" },
      { emoji: "👟", name: "Sneakers", count: "5,544 products", slug: "sneakers" },
      { emoji: "👜", name: "Bags", count: "3,201 products", slug: "bags" },
      { emoji: "🧥", name: "Outerwear", count: "2,832 products", slug: "outerwear" },
      { emoji: "👔", name: "Suits", count: "1,108 products", slug: "suits" },
      { emoji: "🧢", name: "Accessories", count: "7,210 products", slug: "accessories" },
      { emoji: "👠", name: "Heels", count: "1,909 products", slug: "heels" },
      { emoji: "🩴", name: "Sandals", count: "2,420 products", slug: "sandals" },
      { emoji: "🧣", name: "Scarves", count: "812 products", slug: "scarves" },
      { emoji: "💍", name: "Jewelry", count: "4,829 products", slug: "jewelry" },
    ],
    deals: [
      { emoji: "👗", brand: "ZARA", name: "Linen Midi Dress", sale: 49, was: 89, claimed: 72, rating: 4.5, reviews: 920 },
      { emoji: "👟", brand: "NIKE", name: "Air Court Retro Sneakers", sale: 89, was: 129, claimed: 60, rating: 4.7, reviews: 4210 },
      { emoji: "🧥", brand: "MANGO", name: "Wool Trench Coat", sale: 179, was: 249, claimed: 38, rating: 4.6, reviews: 312 },
      { emoji: "👜", brand: "COACH", name: "Suede Crossbody Bag", sale: 119, was: 199, claimed: 55, rating: 4.8, reviews: 1820 },
      { emoji: "👖", brand: "LEVIS", name: "501 Original Jeans", sale: 59, was: 89, claimed: 81, rating: 4.7, reviews: 9210 },
    ],
    brands: ["Zara", "Nike", "Mango", "Coach", "Levi's", "H&M", "Uniqlo", "Adidas"],
    trending: [
      { emoji: "🧦", brand: "UNIQLO", name: "Heattech Crew Socks", price: 12, rating: 4.6, reviews: 4210, tier: "under50" },
      { emoji: "👕", brand: "H&M", name: "Cotton Oversized Tee", price: 19, was: 29, rating: 4.4, reviews: 1820, tier: "under50" },
      { emoji: "👖", brand: "LEVIS", name: "501 Original Jeans", price: 59, was: 89, rating: 4.7, reviews: 9210, tier: "under200" },
      { emoji: "👟", brand: "ADIDAS", name: "Samba OG Sneakers", price: 110, rating: 4.8, reviews: 6520, tier: "under200" },
      { emoji: "🧥", brand: "MANGO", name: "Wool Trench Coat", price: 249, rating: 4.6, reviews: 312, tier: "under500" },
      { emoji: "👜", brand: "COACH", name: "Suede Crossbody Bag", price: 199, rating: 4.8, reviews: 1820, tier: "under500" },
      { emoji: "💼", brand: "GUCCI", name: "Leather Tote Bag", price: 1290, rating: 4.9, reviews: 210, tier: "premium" },
      { emoji: "👠", brand: "JIMMY CHOO", name: "Romy Suede Pumps", price: 695, rating: 4.7, reviews: 140, tier: "premium" },
      { emoji: "👗", brand: "ZARA", name: "Pleated Satin Skirt", price: 59, rating: 4.5, reviews: 410, tier: "new" },
      { emoji: "🧢", brand: "NEW ERA", name: "9FORTY Cap Collection", price: 32, rating: 4.6, reviews: 820, tier: "new" },
    ],
    guides: [
      { emoji: "👗", title: "Spring 2026 Style Edit", excerpt: "The looks, fabrics, and silhouettes defining the season — and how to shop them on any budget." },
      { emoji: "👟", title: "The Sneaker Buying Guide", excerpt: "From court classics to running performance, here's how to pick the right pair for how you actually live." },
      { emoji: "👜", title: "Investment Bags Worth It in 2026", excerpt: "Designer pieces that hold their value — and the high-street alternatives that look just as good." },
    ],
    editor: {
      big: { emoji: "🧥", tag: "EDITOR'S CHOICE", name: "Mango Wool Trench", desc: "A timeless silhouette in soft Italian wool. The kind of coat you'll reach for every fall for the next decade.", price: "$179", was: "$249" },
      a: { emoji: "👟", tag: "BEST SNEAKER", name: "Adidas Samba OG", price: "$110", was: "$140" },
      b: { emoji: "👜", tag: "TOP SELLER", name: "Coach Suede Crossbody", price: "$119", was: "$199" },
    },
  },
  home: {
    slug: "home",
    title: "Home & Kitchen",
    subtitle: "Beautiful essentials for the spaces you love.",
    icon: "🏡",
    showcase: [
      { emoji: "🛋️", name: "Linen Sofa", price: "$1,199" },
      { emoji: "🍳", name: "Cast-Iron Pan", price: "$79" },
      { emoji: "🛏️", name: "Linen Bedding Set", price: "$189" },
      { emoji: "🕯️", name: "Soy Candle Trio", price: "$49" },
    ],
    subcategories: [
      { emoji: "🛋️", name: "Living Room", count: "2,120 products", slug: "living-room" },
      { emoji: "🛏️", name: "Bedroom", count: "3,401 products", slug: "bedroom" },
      { emoji: "🍳", name: "Cookware", count: "2,910 products", slug: "cookware" },
      { emoji: "🍽️", name: "Dining", count: "1,820 products", slug: "dining" },
      { emoji: "🛁", name: "Bath", count: "1,540 products", slug: "bath" },
      { emoji: "🕯️", name: "Decor", count: "4,201 products", slug: "decor" },
      { emoji: "🪴", name: "Plants", count: "920 products", slug: "plants" },
      { emoji: "💡", name: "Lighting", count: "1,810 products", slug: "lighting" },
      { emoji: "🧺", name: "Storage", count: "2,310 products", slug: "storage" },
      { emoji: "🧹", name: "Cleaning", count: "1,409 products", slug: "cleaning" },
      { emoji: "🪞", name: "Mirrors", count: "612 products", slug: "mirrors" },
      { emoji: "🖼️", name: "Wall Art", count: "3,109 products", slug: "wall-art" },
    ],
    deals: [
      { emoji: "🛋️", brand: "WEST ELM", name: "Andes Linen Sofa", sale: 1199, was: 1899, claimed: 44, rating: 4.7, reviews: 312 },
      { emoji: "🍳", brand: "LODGE", name: 'Cast-Iron 12" Skillet', sale: 39, was: 59, claimed: 88, rating: 4.9, reviews: 18210 },
      { emoji: "🛏️", brand: "BROOKLINEN", name: "Linen Bedding Set", sale: 149, was: 229, claimed: 61, rating: 4.6, reviews: 2018 },
      { emoji: "🕯️", brand: "DIPTYQUE", name: "Soy Candle Trio", sale: 89, was: 129, claimed: 52, rating: 4.8, reviews: 920 },
      { emoji: "💡", brand: "PHILIPS", name: "Hue Smart Bulb 4-Pack", sale: 119, was: 179, claimed: 73, rating: 4.7, reviews: 4210 },
    ],
    brands: ["West Elm", "Lodge", "Brooklinen", "Diptyque", "Philips", "Le Creuset", "Muji", "Crate & Barrel"],
    trending: [
      { emoji: "🍽️", brand: "MUJI", name: "Stoneware Dinner Bowl", price: 14, rating: 4.6, reviews: 2210, tier: "under50" },
      { emoji: "🕯️", brand: "MUJI", name: "Unscented Soy Candle", price: 18, rating: 4.5, reviews: 1018, tier: "under50" },
      { emoji: "🍳", brand: "LODGE", name: 'Cast-Iron 12" Skillet', price: 39, was: 59, rating: 4.9, reviews: 18210, tier: "under200" },
      { emoji: "🛏️", brand: "BROOKLINEN", name: "Percale Sheet Set", price: 169, rating: 4.7, reviews: 5410, tier: "under200" },
      { emoji: "💡", brand: "PHILIPS", name: "Hue Smart Bulb 4-Pack", price: 179, rating: 4.7, reviews: 4210, tier: "under500" },
      { emoji: "🪞", brand: "CB2", name: "Arched Floor Mirror", price: 399, rating: 4.6, reviews: 410, tier: "under500" },
      { emoji: "🛋️", brand: "WEST ELM", name: "Andes Linen Sofa", price: 1899, was: 2299, rating: 4.7, reviews: 312, tier: "premium" },
      { emoji: "🍲", brand: "LE CREUSET", name: 'Round Dutch Oven 5.5qt', price: 449, rating: 4.9, reviews: 9210, tier: "premium" },
      { emoji: "🪴", brand: "BLOOMSCAPE", name: "Fiddle Leaf Fig Tree", price: 159, rating: 4.4, reviews: 412, tier: "new" },
      { emoji: "🖼️", brand: "MINTED", name: "Framed Botanical Print", price: 89, rating: 4.6, reviews: 218, tier: "new" },
    ],
    guides: [
      { emoji: "🛏️", title: "How to Build the Perfect Bed in 2026", excerpt: "Sheets, layers, pillows — our editors break down the formula for hotel-quality sleep at home." },
      { emoji: "🍳", title: "Cookware Buying Guide: Cast Iron, Stainless, Nonstick", excerpt: "Which pans actually belong in your kitchen, and which ones you can skip entirely." },
      { emoji: "🪴", title: "Beginner's Guide to Indoor Plants", excerpt: "The 10 plants that thrive on benign neglect — perfect for first-time plant parents." },
    ],
    editor: {
      big: { emoji: "🍳", tag: "EDITOR'S CHOICE", name: 'Lodge 12" Cast Iron Skillet', desc: "A single pan that does it all — sears, sautés, bakes, and gets better with every use. A true lifetime tool.", price: "$39", was: "$59" },
      a: { emoji: "🛏️", tag: "BEST SHEETS", name: "Brooklinen Percale Set", price: "$169", was: "$229" },
      b: { emoji: "🍲", tag: "TOP SELLER", name: "Le Creuset Dutch Oven", price: "$449", was: "$540" },
    },
  },
};

const DEFAULT_CATEGORY = CATEGORIES.electronics;

export function getCategoryConfig(slug: string): CategoryConfig {
  const key = slug.toLowerCase();
  if (CATEGORIES[key]) return CATEGORIES[key];
  // graceful fallback — use electronics structure with overridden title
  return {
    ...DEFAULT_CATEGORY,
    slug: key,
    title: key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    subtitle: "Top picks, deals, and editor favorites — all in one place.",
  };
}

/* ---------- Countdown ---------- */
function useDealsCountdown() {
  const [t, setT] = useState({ h: "04", m: "32", s: "18" });
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const end = Date.now() + (4 * 3600 + 32 * 60 + 18) * 1000;
    const tick = () => {
      const diff = Math.max(0, end - Date.now());
      const h = Math.floor(diff / 3.6e6);
      const m = Math.floor((diff % 3.6e6) / 6e4);
      const s = Math.floor((diff % 6e4) / 1000);
      setT({ h: String(h).padStart(2, "0"), m: String(m).padStart(2, "0"), s: String(s).padStart(2, "0") });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return mounted ? `${t.h}:${t.m}:${t.s}` : "04:32:18";
}

/* ---------- Stars ---------- */
function StarRow({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-1 text-xs">
      <Star className="h-3.5 w-3.5 fill-[#C9B59C] text-[#C9B59C]" />
      <span className="font-medium text-[#1A1A1A]">{value}</span>
      <span className="text-[#6B6B6B]">({count.toLocaleString()})</span>
    </div>
  );
}

/* ---------- Main page ---------- */
export default function CategoryLandingPage({ slug }: { slug: string }) {
  const cat = useMemo(() => getCategoryConfig(slug), [slug]);
  const countdown = useDealsCountdown();
  const [cartCount, setCartCount] = useState(0);
  const [wish, setWish] = useState<Record<string, boolean>>({});
  const [tab, setTab] = useState<"all" | "under50" | "under200" | "under500" | "premium" | "new">("all");
  const [shown, setShown] = useState(10);

  const tabs: { id: typeof tab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "under50", label: "Under $50" },
    { id: "under200", label: "Under $200" },
    { id: "under500", label: "Under $500" },
    { id: "premium", label: "Premium" },
    { id: "new", label: "New Arrivals" },
  ];

  const filtered = useMemo(() => {
    if (tab === "all") return cat.trending;
    return cat.trending.filter((p) => p.tier === tab);
  }, [cat.trending, tab]);

  // grow list by duplicating for "Load More" demo
  const grid = useMemo(() => {
    const list = filtered.length ? filtered : cat.trending;
    const out: typeof list = [];
    for (let i = 0; i < shown; i++) out.push({ ...list[i % list.length], name: list[i % list.length].name });
    return out;
  }, [filtered, cat.trending, shown]);

  return (
    <div style={{ backgroundColor: "#F9F8F6", color: "#1A1A1A" }} className="min-h-screen">
      <AnnouncementBar />
      <Navbar />

      {/* SECTION 1 — HERO */}
      <section className="relative overflow-hidden px-4 sm:px-8 py-16" style={{ backgroundColor: "#1A1A1A" }}>
        <div aria-hidden className="absolute rounded-full" style={{ width: 384, height: 384, right: -100, top: -100, backgroundColor: "#C9B59C", opacity: 0.1 }} />
        <div aria-hidden className="absolute rounded-full" style={{ width: 256, height: 256, left: -50, bottom: -50, backgroundColor: "#C9B59C", opacity: 0.05 }} />

        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          {/* Left */}
          <div>
            <div className="text-xs mb-4" style={{ color: "#6B6B6B" }}>
              <Link to="/" className="hover:underline">Home</Link>
              <span className="mx-1">›</span>
              <span>{cat.title}</span>
            </div>

            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ backgroundColor: "#C9B59C", color: "#1A1A1A" }}>
              {cat.icon} Department
            </span>

            <h1 className="text-5xl font-bold leading-tight mb-3 text-white">{cat.title}</h1>
            <p className="text-lg mb-6" style={{ color: "#9a9a9a" }}>{cat.subtitle}</p>

            <div className="flex flex-wrap gap-6 mb-6">
              {[
                { v: "50,000+", l: "Products" },
                { v: "500+", l: "Brands" },
                { v: "✦", l: "Nova Prime Eligible" },
              ].map((s) => (
                <div key={s.l}>
                  <div className="text-white font-bold text-lg">{s.v}</div>
                  <div className="text-sm" style={{ color: "#6B6B6B" }}>{s.l}</div>
                </div>
              ))}
            </div>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex w-full max-w-[480px] bg-white rounded-full overflow-hidden"
            >
              <input
                type="search"
                placeholder={`Search in ${cat.title}...`}
                className="flex-1 px-5 py-3 text-sm outline-none bg-white text-[#1A1A1A]"
                aria-label={`Search in ${cat.title}`}
              />
              <button type="submit" className="px-5 flex items-center justify-center" style={{ backgroundColor: "#C9B59C", color: "#1A1A1A" }} aria-label="Search">
                <Search className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Right showcase 2x2 */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {cat.showcase.map((s) => (
              <div
                key={s.name}
                className="rounded-2xl p-4 backdrop-blur text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <div className="text-5xl mb-2">{s.emoji}</div>
                <div className="text-white text-sm font-medium">{s.name}</div>
                <div className="font-bold" style={{ color: "#C9B59C" }}>{s.price}</div>
                <Link to="/search" search={{ q: s.name }} className="text-xs hover:underline" style={{ color: "#C9B59C" }}>
                  Shop Now →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2 — SUBCATEGORY GRID */}
      <section className="px-4 sm:px-8 py-12" style={{ backgroundColor: "#F9F8F6" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6">
            <h2 className="text-2xl font-bold">Shop by Category</h2>
            <Link to="/search" className="text-sm hover:underline" style={{ color: "#C9B59C" }}>See all subcategories →</Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {cat.subcategories.map((s) => (
              <Link
                key={s.slug}
                to="/search"
                search={{ q: s.name }}
                className="group rounded-2xl p-5 text-center transition-all duration-200"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9CFC7" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#EFE9E3";
                  e.currentTarget.style.borderColor = "#C9B59C";
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFFFFF";
                  e.currentTarget.style.borderColor = "#D9CFC7";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="text-4xl mb-3">{s.emoji}</div>
                <div className="font-medium text-sm">{s.name}</div>
                <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>{s.count}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — DEALS OF THE DAY */}
      <section className="px-4 sm:px-8 py-12" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid #D9CFC7" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">⚡ Deals of the Day</h2>
              <div className="text-sm" style={{ color: "#6B6B6B" }}>in {cat.title}</div>
            </div>
            <div className="rounded-full px-4 py-2 font-mono text-sm" style={{ backgroundColor: "#1A1A1A", color: "white" }}>
              Ends in: {countdown}
            </div>
            <Link to="/search" className="text-sm hover:underline" style={{ color: "#C9B59C" }}>View all deals →</Link>
          </div>

          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
            {cat.deals.map((d) => {
              const pct = Math.round(((d.was - d.sale) / d.was) * 100);
              return (
                <div
                  key={d.name}
                  className="snap-start shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  style={{ minWidth: 220, backgroundColor: "#FFFFFF", border: "1px solid #D9CFC7" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C9B59C")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D9CFC7")}
                >
                  <div className="relative h-48 flex items-center justify-center" style={{ backgroundColor: "#EFE9E3" }}>
                    <span className="text-6xl">{d.emoji}</span>
                    <span className="absolute top-3 left-3 rounded-full px-2 py-1 text-xs" style={{ backgroundColor: "#1A1A1A", color: "white" }}>
                      −{pct}%
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="text-xs uppercase tracking-wider" style={{ color: "#C9B59C" }}>{d.brand}</div>
                    <div className="text-sm font-medium line-clamp-2 mb-2">{d.name}</div>
                    <StarRow value={d.rating} count={d.reviews} />
                    <div className="flex items-baseline gap-2 mt-2">
                      <span className="font-bold text-lg">${d.sale}</span>
                      <span className="text-sm line-through" style={{ color: "#6B6B6B" }}>${d.was}</span>
                    </div>
                    <div className="mt-2">
                      <div className="text-xs" style={{ color: "#6B6B6B" }}>{d.claimed}% claimed</div>
                      <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: "#EFE9E3" }}>
                        <div className="h-full rounded-full" style={{ width: `${d.claimed}%`, backgroundColor: "#C9B59C" }} />
                      </div>
                    </div>
                    <button
                      onClick={() => setCartCount((c) => c + 1)}
                      className="w-full mt-3 rounded-full py-2 text-sm font-medium transition-colors"
                      style={{ backgroundColor: "#1A1A1A", color: "white" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#C9B59C"; e.currentTarget.style.color = "#1A1A1A"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#1A1A1A"; e.currentTarget.style.color = "white"; }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 — FEATURED BRANDS */}
      <section className="px-4 sm:px-8 py-12" style={{ backgroundColor: "#EFE9E3" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold mb-8">Top Brands in {cat.title}</h2>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {cat.brands.map((b) => (
              <Link
                key={b}
                to="/search"
                search={{ q: b }}
                className="shrink-0 rounded-2xl p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
                style={{ minWidth: 140, backgroundColor: "#FFFFFF", border: "1px solid #D9CFC7" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#C9B59C")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D9CFC7")}
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EFE9E3" }}>
                  <span className="text-2xl font-bold">{b.charAt(0)}</span>
                </div>
                <div className="text-sm font-medium">{b}</div>
                <div className="text-xs mt-1" style={{ color: "#C9B59C" }}>Shop →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — EDITORIAL PICKS */}
      <section className="px-4 sm:px-8 py-12" style={{ backgroundColor: "#F9F8F6" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold">Editor's Picks 🏆</h2>
          <p className="text-sm mb-8" style={{ color: "#6B6B6B" }}>Handpicked by our experts</p>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Big card */}
            <div className="lg:col-span-1 lg:row-span-2 rounded-2xl p-8 flex flex-col" style={{ backgroundColor: "#1A1A1A", minHeight: 400 }}>
              <span className="inline-flex self-start rounded-full px-3 py-1 text-xs mb-4" style={{ backgroundColor: "#C9B59C", color: "#1A1A1A" }}>
                {cat.editor.big.tag}
              </span>
              <div className="text-7xl mb-4">{cat.editor.big.emoji}</div>
              <h3 className="text-2xl font-bold text-white mb-2">{cat.editor.big.name}</h3>
              <p className="text-sm mb-6" style={{ color: "#9a9a9a" }}>{cat.editor.big.desc}</p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-2xl font-bold" style={{ color: "#C9B59C" }}>{cat.editor.big.price}</span>
                <span className="text-sm line-through" style={{ color: "#6B6B6B" }}>{cat.editor.big.was}</span>
              </div>
              <Link
                to="/search"
                className="self-start rounded-full px-6 py-3 font-semibold transition-colors"
                style={{ backgroundColor: "#C9B59C", color: "#1A1A1A" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#B8A08A")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#C9B59C")}
              >
                Shop Now →
              </Link>
            </div>

            {/* Two stacked cards */}
            <div className="lg:col-span-2 grid gap-6">
              {[cat.editor.a, cat.editor.b].map((c) => (
                <div key={c.name} className="rounded-2xl p-6 flex items-center gap-5" style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9CFC7" }}>
                  <div className="text-5xl shrink-0">{c.emoji}</div>
                  <div className="flex-1">
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: "#C9B59C" }}>{c.tag}</div>
                    <div className="font-bold text-lg">{c.name}</div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-bold">{c.price}</span>
                      <span className="text-sm line-through" style={{ color: "#6B6B6B" }}>{c.was}</span>
                    </div>
                  </div>
                  <Link to="/search" className="text-sm hover:underline shrink-0" style={{ color: "#C9B59C" }}>
                    Shop →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 — TRENDING NOW */}
      <section className="px-4 sm:px-8 py-12" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid #D9CFC7" }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <h2 className="text-2xl font-bold">Trending in {cat.title} 🔥</h2>
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => {
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => { setTab(t.id); setShown(10); }}
                    className="rounded-full px-4 py-1.5 text-sm transition-colors"
                    style={
                      active
                        ? { backgroundColor: "#1A1A1A", color: "white", border: "1px solid #1A1A1A" }
                        : { backgroundColor: "transparent", color: "#6B6B6B", border: "1px solid #D9CFC7" }
                    }
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {grid.length === 0 ? (
            <div className="text-center py-12" style={{ color: "#6B6B6B" }}>No products in this filter.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {grid.map((p, i) => {
                const id = `${p.name}-${i}`;
                const liked = !!wish[id];
                return (
                  <div
                    key={id}
                    className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md group"
                    style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9CFC7", animation: "fade-in .4s ease both" }}
                  >
                    <div className="relative h-40 flex items-center justify-center" style={{ backgroundColor: "#EFE9E3" }}>
                      <span className="text-5xl">{p.emoji}</span>
                      <button
                        onClick={() => setWish((w) => ({ ...w, [id]: !w[id] }))}
                        aria-label="Add to wishlist"
                        className="absolute top-2 right-2 bg-white/90 rounded-full p-1.5 transition-transform active:scale-125"
                      >
                        <Heart className="h-4 w-4" style={{ color: liked ? "#E11D48" : "#6B6B6B", fill: liked ? "#E11D48" : "transparent" }} />
                      </button>
                    </div>
                    <div className="p-3">
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: "#C9B59C" }}>{p.brand}</div>
                      <div className="text-sm font-medium line-clamp-2 mb-1">{p.name}</div>
                      <StarRow value={p.rating} count={p.reviews} />
                      <div className="flex items-baseline gap-2 mt-2">
                        <span className="font-bold">${p.price}</span>
                        {p.was && <span className="text-xs line-through" style={{ color: "#6B6B6B" }}>${p.was}</span>}
                      </div>
                      <button
                        onClick={() => setCartCount((c) => c + 1)}
                        className="w-full mt-2 rounded-full py-1.5 text-xs font-medium"
                        style={{ backgroundColor: "#1A1A1A", color: "white" }}
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {shown < 30 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShown((n) => n + 10)}
                className="rounded-full px-8 py-3 text-sm transition-colors"
                style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EFE9E3")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 7 — BUYING GUIDES */}
      <section className="px-4 sm:px-8 py-12" style={{ backgroundColor: "#EFE9E3" }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold">Buying Guides & Reviews</h2>
          <p className="text-sm mb-8" style={{ color: "#6B6B6B" }}>Expert advice to help you choose</p>

          <div className="grid md:grid-cols-3 gap-6">
            {cat.guides.map((g) => (
              <article
                key={g.title}
                className="rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-md cursor-pointer"
                style={{ backgroundColor: "#FFFFFF", border: "1px solid #D9CFC7" }}
              >
                <div className="h-40 flex items-center justify-center" style={{ backgroundColor: "#1A1A1A" }}>
                  <span className="text-5xl">{g.emoji}</span>
                </div>
                <div className="p-5">
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: "#C9B59C" }}>BUYING GUIDE</div>
                  <h3 className="font-semibold mb-2">{g.title}</h3>
                  <p className="text-sm line-clamp-2 mb-4" style={{ color: "#6B6B6B" }}>{g.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "#6B6B6B" }}>By ShopNova Experts · 8 min read</span>
                    <span className="text-sm" style={{ color: "#C9B59C" }}>Read Guide →</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 8 — NOVA PRIME BANNER */}
      <section className="px-4 sm:px-8 py-12" style={{ backgroundColor: "#1A1A1A" }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-sm uppercase tracking-wider mb-3" style={{ color: "#C9B59C" }}>✦ Nova Prime</div>
            <h2 className="text-3xl font-bold text-white mb-3">Get FREE Same-Day Delivery on {cat.title}</h2>
            <ul className="space-y-1 mb-6">
              {[
                "Free same-day delivery on 1M+ items",
                "Exclusive member-only deals",
                "Early access to flash sales",
              ].map((line) => (
                <li key={line} className="text-sm py-1 flex items-center gap-2" style={{ color: "#9a9a9a" }}>
                  <ChevronRight className="h-4 w-4" style={{ color: "#C9B59C" }} />
                  {line}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3">
              <Link to="/" className="rounded-full px-6 py-3 font-semibold" style={{ backgroundColor: "#C9B59C", color: "#1A1A1A" }}>
                Try Prime Free →
              </Link>
              <Link to="/" className="rounded-full px-6 py-3 font-semibold text-white" style={{ border: "1px solid white" }}>
                Learn More
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { v: "10M+", l: "Prime Members" },
              { v: "Free", l: "Same-Day" },
              { v: "Daily", l: "Exclusive Deals" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl p-5 text-center" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div className="text-2xl font-bold text-white">{s.v}</div>
                <div className="text-xs mt-1" style={{ color: "#9a9a9a" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
