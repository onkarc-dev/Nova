import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown, ChevronRight, ChevronLeft, Heart, Star, Search as SearchIcon,
  LayoutGrid, List as ListIcon, X, BadgeCheck, SlidersHorizontal,
} from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/routes/index";

/* ---------- Types ---------- */
type Product = {
  id: number;
  title: string;
  seller: string;
  emoji: string;
  price: number;
  was?: number;
  rating: number;
  reviews: number;
  prime: boolean;
  delivery: string;
  today?: boolean;
  lowStock?: number;
  brand: string;
  category: string;
  sponsored?: boolean;
};

/* ---------- Mock data ---------- */
const PRODUCTS: Product[] = [
  { id: 1, title: "Sony WH-1000XM6 Wireless Noise Cancelling Headphones", seller: "Sony Official Store", emoji: "🎧", price: 349, was: 449, rating: 4.7, reviews: 12480, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Sony", category: "Headphones", sponsored: true },
  { id: 2, title: "Apple AirPods Pro 3rd Generation with USB-C", seller: "Apple Store", emoji: "🎧", price: 249, rating: 4.8, reviews: 28930, prime: true, delivery: "Get it TODAY", today: true, brand: "Apple", category: "Headphones" },
  { id: 3, title: "Bose QuietComfort Ultra Headphones Immersive Audio", seller: "Bose Direct", emoji: "🎧", price: 329, was: 429, rating: 4.6, reviews: 8421, prime: true, delivery: "FREE delivery Wed, Jul 2", brand: "Bose", category: "Headphones" },
  { id: 4, title: "Samsung Galaxy Buds 3 Pro AI-Powered Earbuds", seller: "Samsung Global", emoji: "🎧", price: 199, rating: 4.4, reviews: 5421, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Samsung", category: "Headphones" },
  { id: 5, title: "JBL Charge 6 Portable Waterproof Bluetooth Speaker", seller: "JBL Official", emoji: "🔊", price: 149, was: 199, rating: 4.7, reviews: 14209, prime: true, delivery: "Get it TODAY", today: true, lowStock: 3, brand: "JBL", category: "Speakers" },
  { id: 6, title: "Sennheiser HD 660S2 Open-Back Audiophile Headphones", seller: "Sennheiser Audio", emoji: "🎧", price: 499, rating: 4.9, reviews: 2104, prime: false, delivery: "FREE delivery Fri, Jul 4", brand: "Sennheiser", category: "Headphones" },
  { id: 7, title: "Anker Soundcore Liberty 4 NC Wireless Earbuds", seller: "Anker Direct", emoji: "🎧", price: 79, was: 129, rating: 4.5, reviews: 19842, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Anker", category: "Headphones" },
  { id: 8, title: "Sony WF-1000XM6 True Wireless Noise Cancelling Earbuds", seller: "Sony Official Store", emoji: "🎧", price: 279, rating: 4.6, reviews: 9120, prime: true, delivery: "FREE delivery Wed, Jul 2", brand: "Sony", category: "Headphones" },
  { id: 9, title: "Audio-Technica ATH-M70x Professional Studio Headphones", seller: "Audio-Technica", emoji: "🎧", price: 299, rating: 4.7, reviews: 3204, prime: false, delivery: "FREE delivery Thu, Jul 3", brand: "Audio-Technica", category: "Headphones" },
  { id: 10, title: "Jabra Evolve2 85 Wireless Headset for Business", seller: "Jabra Pro", emoji: "🎧", price: 449, rating: 4.5, reviews: 1842, prime: true, delivery: "FREE delivery Wed, Jul 2", brand: "Jabra", category: "Headphones" },
  { id: 11, title: "Canon EOS R8 Full-Frame Mirrorless Camera Body", seller: "Canon Camera Store", emoji: "📷", price: 1499, was: 1699, rating: 4.8, reviews: 1240, prime: true, delivery: "FREE delivery Mon, Jul 7", brand: "Canon", category: "Cameras" },
  { id: 12, title: "Sony Alpha a7 IV Mirrorless Digital Camera", seller: "Sony Official Store", emoji: "📷", price: 1999, rating: 4.9, reviews: 3902, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Sony", category: "Cameras" },
  { id: 13, title: "Fujifilm X-T5 26.1MP Mirrorless Camera with Lens", seller: "Fujifilm Imaging", emoji: "📷", price: 1699, was: 1899, rating: 4.7, reviews: 942, prime: true, delivery: "FREE delivery Wed, Jul 2", brand: "Fujifilm", category: "Cameras" },
  { id: 14, title: "GoPro HERO 13 Black Action Camera Waterproof 5.3K", seller: "GoPro Official", emoji: "📷", price: 399, was: 499, rating: 4.6, reviews: 8421, prime: true, delivery: "Get it TODAY", today: true, brand: "GoPro", category: "Cameras" },
  { id: 15, title: "Sonos Era 300 Spatial Audio Smart Speaker", seller: "Sonos Direct", emoji: "🔊", price: 449, rating: 4.6, reviews: 2104, prime: true, delivery: "FREE delivery Wed, Jul 2", brand: "Sonos", category: "Speakers" },
  { id: 16, title: "Bose SoundLink Flex Bluetooth Portable Speaker", seller: "Bose Direct", emoji: "🔊", price: 149, rating: 4.7, reviews: 12480, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Bose", category: "Speakers" },
  { id: 17, title: "Marshall Stanmore III Wireless Bluetooth Speaker", seller: "Marshall Audio", emoji: "🔊", price: 379, was: 449, rating: 4.5, reviews: 4204, prime: false, delivery: "FREE delivery Thu, Jul 3", brand: "Marshall", category: "Speakers" },
  { id: 18, title: "Apple HomePod (2nd Generation) Smart Speaker", seller: "Apple Store", emoji: "🔊", price: 299, rating: 4.6, reviews: 6210, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Apple", category: "Speakers" },
  { id: 19, title: "Anker Soundcore Motion+ Hi-Res Portable Speaker", seller: "Anker Direct", emoji: "🔊", price: 99, was: 129, rating: 4.4, reviews: 8910, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Anker", category: "Speakers", lowStock: 5 },
  { id: 20, title: "DJI Osmo Action 5 Pro Dual-Screen Action Camera", seller: "DJI Store", emoji: "📷", price: 349, rating: 4.5, reviews: 1820, prime: true, delivery: "FREE delivery Wed, Jul 2", brand: "DJI", category: "Cameras" },
  { id: 21, title: "Logitech MX Master 4S Wireless Performance Mouse", seller: "Logitech Official", emoji: "🖱️", price: 99, was: 119, rating: 4.8, reviews: 18420, prime: true, delivery: "Get it TODAY", today: true, brand: "Logitech", category: "Accessories" },
  { id: 22, title: "Anker 737 Power Bank 24,000mAh 140W PD Fast Charge", seller: "Anker Direct", emoji: "🔋", price: 149, was: 199, rating: 4.7, reviews: 9421, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Anker", category: "Accessories" },
  { id: 23, title: "Samsung T9 Portable SSD 2TB USB 3.2 Gen 2x2", seller: "Samsung Global", emoji: "💾", price: 229, rating: 4.6, reviews: 4280, prime: true, delivery: "FREE delivery Wed, Jul 2", brand: "Samsung", category: "Accessories" },
  { id: 24, title: "Apple Magic Keyboard with Touch ID and Numeric Keypad", seller: "Apple Store", emoji: "⌨️", price: 199, rating: 4.5, reviews: 6820, prime: true, delivery: "FREE delivery Tue, Jul 1", brand: "Apple", category: "Accessories" },
];

const SORT_OPTIONS = [
  "Featured", "Price: Low to High", "Price: High to Low",
  "Avg. Customer Review", "Newest Arrivals", "Best Sellers",
];

const DEPARTMENTS = [
  { name: "Electronics", count: 4832, sub: false },
  { name: "Headphones & Earphones", count: 1204, sub: true },
  { name: "Speakers", count: 892, sub: true },
  { name: "Cameras", count: 743, sub: true },
  { name: "Televisions", count: 621, sub: true },
  { name: "Computers", count: 540, sub: true },
  { name: "Accessories", count: 832, sub: true },
];

const BRANDS = [
  { name: "Sony", count: 412 },
  { name: "Apple", count: 389 },
  { name: "Samsung", count: 334 },
  { name: "Bose", count: 298 },
  { name: "JBL", count: 276 },
  { name: "Sennheiser", count: 198 },
  { name: "Anker", count: 187 },
];

const PRICE_PILLS = [
  { label: "Under $25", min: 0, max: 25 },
  { label: "Under $50", min: 0, max: 50 },
  { label: "Under $100", min: 0, max: 100 },
  { label: "$100–$500", min: 100, max: 500 },
  { label: "Over $500", min: 500, max: 10000 },
];

/* ---------- Stars ---------- */
function StarRow({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          style={{
            width: size, height: size,
            color: i < Math.round(value) ? "#C9B59C" : "#D9CFC7",
            fill: i < Math.round(value) ? "#C9B59C" : "transparent",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- Section header (collapsible) ---------- */
function FilterSection({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="py-4 border-b border-[#D9CFC7] last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium text-sm text-[#1A1A1A]">{title}</span>
        <ChevronDown
          className="h-4 w-4 text-[#6B6B6B] transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? 1000 : 0, opacity: open ? 1 : 0, marginTop: open ? 12 : 0 }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------- Custom checkbox ---------- */
function Checkbox({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: React.ReactNode; count?: number }) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <span
        onClick={onChange}
        className="inline-flex h-4 w-4 items-center justify-center rounded border transition-colors"
        style={{
          background: checked ? "#1A1A1A" : "#fff",
          borderColor: checked ? "#1A1A1A" : "#D9CFC7",
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className="flex-1 text-sm text-[#6B6B6B] group-hover:text-[#1A1A1A] transition-colors">
        {label}
      </span>
      {count !== undefined && <span className="text-xs text-[#6B6B6B]">({count.toLocaleString()})</span>}
    </label>
  );
}

/* ---------- Toggle ---------- */
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#1A1A1A]">{label}</span>
      <button
        onClick={onChange}
        className="relative h-5 w-9 rounded-full transition-colors"
        style={{ background: checked ? "#1A1A1A" : "#D9CFC7" }}
        aria-pressed={checked}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
          style={{ transform: checked ? "translateX(18px)" : "translateX(2px)" }}
        />
      </button>
    </div>
  );
}

/* ---------- Product card (grid) ---------- */
function ProductCard({ p, onWish, wished, onCart }: { p: Product; onWish: () => void; wished: boolean; onCart: () => void }) {
  const discount = p.was ? Math.round(((p.was - p.price) / p.was) * 100) : 0;
  return (
    <div className="group relative rounded-2xl border border-[#D9CFC7] bg-white p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-[#C9B59C]">
      {p.sponsored && (
        <span className="absolute left-3 top-2 z-10 text-[10px] uppercase tracking-wide text-[#6B6B6B]">Sponsored</span>
      )}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-[#EFE9E3]">
        <div className="flex h-full items-center justify-center text-5xl">{p.emoji}</div>
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-[#1A1A1A] px-2 py-1 text-[10px] font-semibold text-white">
            −{discount}%
          </span>
        )}
        <button
          onClick={onWish}
          className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white shadow-sm transition-transform hover:scale-110"
          aria-label="Wishlist"
        >
          <Heart
            className="h-4 w-4 transition-all"
            style={{
              color: wished ? "#E05A20" : "#6B6B6B",
              fill: wished ? "#E05A20" : "transparent",
              transform: wished ? "scale(1.15)" : "scale(1)",
            }}
          />
        </button>
        {p.prime && (
          <span className="absolute left-2 bottom-2 rounded-full bg-[#C9B59C] px-2 py-0.5 text-[10px] font-semibold text-[#1A1A1A]">
            Nova Prime ✦
          </span>
        )}
        <button
          onClick={onCart}
          className="absolute inset-x-0 bottom-0 translate-y-full bg-[#1A1A1A] py-2 text-xs font-medium text-white transition-transform duration-200 group-hover:translate-y-0 rounded-b-xl"
        >
          Add to Cart
        </button>
      </div>

      <div className="mt-2 text-[10px] uppercase tracking-wide text-[#6B6B6B]">{p.seller}</div>
      <div className="mt-1 line-clamp-2 text-sm font-medium text-[#1A1A1A] min-h-[2.5rem]">{p.title}</div>

      <div className="mt-1 flex items-center gap-1.5">
        <StarRow value={p.rating} />
        <span className="text-xs text-[#6B6B6B]">({p.rating})</span>
        <span className="text-xs text-[#6B6B6B]">· {p.reviews.toLocaleString()}</span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-lg font-bold text-[#1A1A1A]">${p.price}</span>
        {p.was && <span className="text-sm text-[#6B6B6B] line-through">${p.was}</span>}
        {discount > 0 && <span className="text-xs font-medium text-[#C9B59C]">-{discount}%</span>}
      </div>

      <div className="mt-1 text-xs" style={{ color: p.today ? "#00A86B" : "#6B6B6B" }}>
        {p.delivery}
      </div>
      {p.lowStock !== undefined && (
        <div className="mt-1 text-xs font-medium" style={{ color: "#E05A20" }}>
          Only {p.lowStock} left in stock
        </div>
      )}
    </div>
  );
}

/* ---------- Product row (list) ---------- */
function ProductRow({ p, onWish, wished, onCart }: { p: Product; onWish: () => void; wished: boolean; onCart: () => void }) {
  const discount = p.was ? Math.round(((p.was - p.price) / p.was) * 100) : 0;
  return (
    <div className="flex gap-4 rounded-2xl border border-[#D9CFC7] bg-white p-4 transition-all duration-200 hover:shadow-md hover:border-[#C9B59C]">
      <div className="relative w-[200px] shrink-0 aspect-square rounded-xl bg-[#EFE9E3] overflow-hidden">
        <div className="flex h-full items-center justify-center text-6xl">{p.emoji}</div>
        {discount > 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-[#1A1A1A] px-2 py-1 text-[10px] font-semibold text-white">
            −{discount}%
          </span>
        )}
        {p.prime && (
          <span className="absolute left-2 bottom-2 rounded-full bg-[#C9B59C] px-2 py-0.5 text-[10px] font-semibold text-[#1A1A1A]">
            Nova Prime ✦
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#6B6B6B]">{p.seller}</div>
            <h3 className="text-base font-semibold text-[#1A1A1A] mt-0.5">{p.title}</h3>
          </div>
          <label className="flex items-center gap-1.5 text-xs text-[#6B6B6B] cursor-pointer">
            <input type="checkbox" className="accent-[#1A1A1A]" /> Compare
          </label>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <StarRow value={p.rating} />
          <span className="text-xs text-[#6B6B6B]">({p.rating}) · {p.reviews.toLocaleString()} reviews</span>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-[#6B6B6B]">
          Premium {p.category.toLowerCase()} from {p.brand}. Industry-leading build quality with up to 40 hours of battery life, immersive sound, and intuitive controls — engineered for everyday excellence and rigorously quality-tested by ShopNova.
        </p>
        <div className="mt-2 flex items-center gap-2 text-xs text-[#6B6B6B]">
          <BadgeCheck className="h-3.5 w-3.5 text-[#C9B59C]" />
          Fulfilled by ShopNova · Seller rating 4.8★
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-[#1A1A1A]">${p.price}</span>
          {p.was && <span className="text-sm text-[#6B6B6B] line-through">${p.was}</span>}
          {discount > 0 && <span className="text-xs font-medium text-[#C9B59C]">-{discount}%</span>}
        </div>
        <div className="text-xs mt-1" style={{ color: p.today ? "#00A86B" : "#6B6B6B" }}>{p.delivery}</div>
        <div className="mt-3 flex items-center gap-2">
          <button onClick={onCart} className="rounded-lg bg-[#1A1A1A] px-4 py-2 text-sm font-medium text-white hover:bg-[#C9B59C] hover:text-[#1A1A1A] transition-colors">
            Add to Cart
          </button>
          <button onClick={onWish} className="rounded-lg border border-[#D9CFC7] px-4 py-2 text-sm font-medium text-[#1A1A1A] hover:border-[#C9B59C] transition-colors inline-flex items-center gap-1.5">
            <Heart className="h-4 w-4" style={{ color: wished ? "#E05A20" : "#6B6B6B", fill: wished ? "#E05A20" : "transparent" }} />
            {wished ? "Wishlisted" : "Add to Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Main page ---------- */
export default function SearchResultsPage({
  query = "wireless headphones",
  categoryPath,
}: {
  query?: string;
  categoryPath?: string[];
}) {
  const crumbs = categoryPath ?? ["Electronics", "Headphones"];
  const isCategory = !!categoryPath;

  /* state */
  const [sort, setSort] = useState("Featured");
  const [sortOpen, setSortOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeDept, setActiveDept] = useState("Headphones & Earphones");
  const [minRating, setMinRating] = useState(0);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(2000);
  const [activePill, setActivePill] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set(["Sony", "Apple"]));
  const [inStock, setInStock] = useState(true);
  const [primeOnly, setPrimeOnly] = useState(false);
  const [conditions, setConditions] = useState<Set<string>>(new Set(["New"]));
  const [delivery, setDelivery] = useState<Set<string>>(new Set());
  const [sellers, setSellers] = useState<Set<string>>(new Set());
  const [wishlist, setWishlist] = useState<Set<number>>(new Set());
  const [cartCount, setCartCount] = useState(0);
  const [mobileFilters, setMobileFilters] = useState(false);
  const [page, setPage] = useState(1);

  const toggle = <T,>(set: Set<T>, val: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  /* derived */
  const filtered = useMemo(() => {
    let list = [...PRODUCTS];
    if (selectedBrands.size > 0) list = list.filter((p) => selectedBrands.has(p.brand));
    if (minRating > 0) list = list.filter((p) => p.rating >= minRating);
    list = list.filter((p) => p.price >= priceMin && p.price <= priceMax);
    if (primeOnly) list = list.filter((p) => p.prime);

    switch (sort) {
      case "Price: Low to High": list.sort((a, b) => a.price - b.price); break;
      case "Price: High to Low": list.sort((a, b) => b.price - a.price); break;
      case "Avg. Customer Review": list.sort((a, b) => b.rating - a.rating); break;
      case "Newest Arrivals": list.sort((a, b) => b.id - a.id); break;
      case "Best Sellers": list.sort((a, b) => b.reviews - a.reviews); break;
    }
    return list;
  }, [selectedBrands, minRating, priceMin, priceMax, primeOnly, sort]);

  /* active filter pills */
  const activePills: { label: string; clear: () => void }[] = [];
  if (selectedBrands.size > 0) activePills.push({ label: Array.from(selectedBrands).join(", "), clear: () => setSelectedBrands(new Set()) });
  if (minRating > 0) activePills.push({ label: `${minRating}★ & Up`, clear: () => setMinRating(0) });
  if (activePill) activePills.push({ label: activePill, clear: () => { setActivePill(null); setPriceMin(0); setPriceMax(2000); } });
  if (primeOnly) activePills.push({ label: "Nova Prime ✦", clear: () => setPrimeOnly(false) });

  const clearAll = () => {
    setSelectedBrands(new Set()); setMinRating(0); setPriceMin(0); setPriceMax(2000);
    setActivePill(null); setPrimeOnly(false); setConditions(new Set(["New"])); setDelivery(new Set()); setSellers(new Set());
  };

  const filteredBrands = BRANDS.filter((b) => b.name.toLowerCase().includes(brandSearch.toLowerCase()));

  /* Filter sidebar content (reused on desktop + mobile drawer) */
  const SidebarContent = (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-[#1A1A1A]">Filters</h2>
        <button onClick={clearAll} className="text-sm text-[#C9B59C] hover:text-[#1A1A1A] transition-colors">Clear All</button>
      </div>

      <FilterSection title="Department">
        <ul className="space-y-1">
          {DEPARTMENTS.map((d) => (
            <li key={d.name}>
              <button
                onClick={() => setActiveDept(d.name)}
                className="flex w-full items-center justify-between py-1 text-sm transition-colors"
                style={{
                  paddingLeft: d.sub ? 12 : 0,
                  color: activeDept === d.name ? "#C9B59C" : "#6B6B6B",
                  fontWeight: activeDept === d.name ? 500 : 400,
                }}
              >
                <span className="text-left hover:text-[#1A1A1A]">{d.sub ? `› ${d.name}` : d.name}</span>
                <span className="text-xs text-[#6B6B6B]">({d.count.toLocaleString()})</span>
              </button>
            </li>
          ))}
        </ul>
      </FilterSection>

      <FilterSection title="Avg. Customer Review">
        <div className="space-y-1">
          {[4, 3, 2, 1].map((r) => (
            <button
              key={r}
              onClick={() => setMinRating(r === minRating ? 0 : r)}
              className="flex w-full items-center gap-2 py-1.5 pl-2 transition-all"
              style={{ borderLeft: minRating === r ? "2px solid #C9B59C" : "2px solid transparent" }}
            >
              <StarRow value={r} />
              <span className="text-sm text-[#6B6B6B]">& Up</span>
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price">
        <div className="px-1">
          <div className="relative h-1.5 rounded-full bg-[#D9CFC7]">
            <div
              className="absolute h-full rounded-full bg-[#C9B59C]"
              style={{ left: `${(priceMin / 2000) * 100}%`, right: `${100 - (priceMax / 2000) * 100}%` }}
            />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(Math.max(0, +e.target.value))}
              className="w-full rounded border border-[#D9CFC7] bg-white px-3 py-1 text-sm focus:border-[#C9B59C] outline-none"
              placeholder="Min"
            />
            <span className="text-[#6B6B6B]">–</span>
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(Math.min(2000, +e.target.value))}
              className="w-full rounded border border-[#D9CFC7] bg-white px-3 py-1 text-sm focus:border-[#C9B59C] outline-none"
              placeholder="Max"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {PRICE_PILLS.map((pp) => {
              const active = activePill === pp.label;
              return (
                <button
                  key={pp.label}
                  onClick={() => {
                    if (active) { setActivePill(null); setPriceMin(0); setPriceMax(2000); }
                    else { setActivePill(pp.label); setPriceMin(pp.min); setPriceMax(pp.max); }
                  }}
                  className="rounded-full border px-3 py-1 text-xs transition-colors"
                  style={{
                    borderColor: active ? "#1A1A1A" : "#D9CFC7",
                    background: active ? "#1A1A1A" : "transparent",
                    color: active ? "#fff" : "#6B6B6B",
                  }}
                >
                  {pp.label}
                </button>
              );
            })}
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Brand">
        <input
          type="text"
          value={brandSearch}
          onChange={(e) => setBrandSearch(e.target.value)}
          placeholder="Search brands..."
          className="mb-2 w-full rounded border border-[#D9CFC7] bg-white px-3 py-1.5 text-sm placeholder:text-[#6B6B6B] focus:border-[#C9B59C] outline-none"
        />
        <div>
          {filteredBrands.map((b) => (
            <Checkbox
              key={b.name}
              checked={selectedBrands.has(b.name)}
              onChange={() => toggle(selectedBrands, b.name, setSelectedBrands)}
              label={b.name}
              count={b.count}
            />
          ))}
        </div>
        <button className="mt-1 text-xs text-[#C9B59C] hover:text-[#1A1A1A] transition-colors">See 24 more brands</button>
      </FilterSection>

      <FilterSection title="Availability">
        <Toggle checked={inStock} onChange={() => setInStock(!inStock)} label="In Stock Only" />
        <Toggle checked={primeOnly} onChange={() => setPrimeOnly(!primeOnly)} label={<>Nova Prime <span className="text-[#C9B59C]">✦</span> Eligible</>} />
      </FilterSection>

      <FilterSection title="Condition">
        {["New", "Refurbished", "Used - Like New", "Used - Good"].map((c) => (
          <Checkbox key={c} checked={conditions.has(c)} onChange={() => toggle(conditions, c, setConditions)} label={c} />
        ))}
      </FilterSection>

      <FilterSection title="Delivery">
        {["Get it Today", "Get it by Tomorrow", "Free Shipping", "Nova Prime ✦ Shipping"].map((d) => (
          <Checkbox key={d} checked={delivery.has(d)} onChange={() => toggle(delivery, d, setDelivery)} label={d} />
        ))}
      </FilterSection>

      <FilterSection title="Seller">
        {[
          { label: <span className="inline-flex items-center gap-1">ShopNova Global <BadgeCheck className="h-3.5 w-3.5 text-[#C9B59C]" /></span>, key: "shopnova" },
          { label: "Nova Verified Sellers", key: "verified" },
          { label: "International Sellers", key: "international" },
        ].map((s) => (
          <Checkbox key={s.key} checked={sellers.has(s.key)} onChange={() => toggle(sellers, s.key, setSellers)} label={s.label} />
        ))}
      </FilterSection>
    </>
  );

  /* Cart pop animation */
  const [cartPop, setCartPop] = useState(false);
  const addToCart = () => {
    setCartCount((c) => c + 1);
    setCartPop(true);
    setTimeout(() => setCartPop(false), 250);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A]">
      <AnnouncementBar />
      <Navbar />

      {/* Breadcrumb */}
      <div className="w-full border-b border-[#D9CFC7] bg-[#F9F8F6]">
        <div className="mx-auto max-w-7xl px-6 py-3 overflow-x-auto whitespace-nowrap">
          <nav className="flex items-center gap-2 text-sm text-[#6B6B6B]">
            <a href="/" className="hover:text-[#1A1A1A] transition-colors">Home</a>
            {crumbs.map((c, i) => (
              <span key={c} className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-[#D9CFC7]" />
                {i === crumbs.length - 1 ? (
                  <span className="font-medium text-[#1A1A1A]">{c}</span>
                ) : (
                  <a href="#" className="hover:text-[#1A1A1A] transition-colors">{c}</a>
                )}
              </span>
            ))}
          </nav>
        </div>
      </div>

      {/* Results header */}
      <div className="w-full bg-[#F9F8F6]">
        <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A]">
              {isCategory ? crumbs[crumbs.length - 1] : <>Results for <span className="italic">"{query}"</span></>}
            </h1>
            <p className="text-sm text-[#6B6B6B] mt-0.5">Showing 1–24 of 4,832 results</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 rounded-lg border border-[#D9CFC7] bg-white px-4 py-2 text-sm hover:border-[#C9B59C] transition-colors"
              >
                <span className="text-[#6B6B6B]">Sort by:</span>
                <span className="font-medium text-[#1A1A1A]">{sort}</span>
                <ChevronDown className="h-4 w-4 text-[#6B6B6B]" />
              </button>
              {sortOpen && (
                <div className="absolute right-0 z-30 mt-1 w-56 rounded-lg border border-[#D9CFC7] bg-white py-1 shadow-lg">
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSort(s); setSortOpen(false); }}
                      className="block w-full px-4 py-2 text-left text-sm hover:bg-[#EFE9E3] transition-colors"
                      style={{ color: sort === s ? "#1A1A1A" : "#6B6B6B", fontWeight: sort === s ? 500 : 400 }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {[
                { v: "grid" as const, Icon: LayoutGrid },
                { v: "list" as const, Icon: ListIcon },
              ].map(({ v, Icon }) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="rounded p-2 transition-colors"
                  style={{
                    background: view === v ? "#1A1A1A" : "transparent",
                    color: view === v ? "#fff" : "#1A1A1A",
                    border: view === v ? "1px solid #1A1A1A" : "1px solid #D9CFC7",
                  }}
                  aria-label={`${v} view`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-0 md:px-6 flex gap-6">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-[280px] shrink-0">
          <div className="sticky top-[120px] max-h-[calc(100vh-120px)] overflow-y-auto rounded-r-2xl border border-[#D9CFC7] bg-white p-6">
            {SidebarContent}
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 min-w-0 px-4 md:px-0 pb-16">
          {activePills.length > 0 && (
            <div className="flex flex-wrap gap-2 py-4">
              {activePills.map((p) => (
                <button
                  key={p.label}
                  onClick={p.clear}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D9CFC7] bg-[#EFE9E3] px-3 py-1 text-sm text-[#1A1A1A] hover:border-[#C9B59C] transition-colors"
                >
                  {p.label}
                  <X className="h-3.5 w-3.5 text-[#6B6B6B]" />
                </button>
              ))}
              <button onClick={clearAll} className="ml-2 text-sm text-[#C9B59C] hover:text-[#1A1A1A] transition-colors">Clear all</button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-[#D9CFC7] bg-white p-12 text-center">
              <SearchIcon className="mx-auto h-10 w-10 text-[#C9B59C]" />
              <h2 className="mt-3 text-lg font-semibold text-[#1A1A1A]">No results found</h2>
              <p className="mt-1 text-sm text-[#6B6B6B]">Try removing filters or searching for something else.</p>
              <button onClick={clearAll} className="mt-4 rounded-lg bg-[#1A1A1A] px-5 py-2 text-sm font-medium text-white hover:bg-[#C9B59C] hover:text-[#1A1A1A] transition-colors">Clear all filters</button>
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  p={p}
                  wished={wishlist.has(p.id)}
                  onWish={() => toggle(wishlist, p.id, setWishlist)}
                  onCart={addToCart}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map((p) => (
                <ProductRow
                  key={p.id}
                  p={p}
                  wished={wishlist.has(p.id)}
                  onWish={() => toggle(wishlist, p.id, setWishlist)}
                  onCart={addToCart}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-sm text-[#6B6B6B]">Showing 1–24 of 4,832 results</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded border border-[#D9CFC7] bg-transparent px-3 py-1.5 text-sm text-[#1A1A1A] hover:bg-[#EFE9E3] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className="h-9 w-9 rounded text-sm transition-colors"
                  style={{
                    background: page === n ? "#1A1A1A" : "transparent",
                    color: page === n ? "#fff" : "#1A1A1A",
                    border: page === n ? "1px solid #1A1A1A" : "1px solid #D9CFC7",
                  }}
                >
                  {n}
                </button>
              ))}
              <span className="px-2 text-[#6B6B6B]">…</span>
              <button
                onClick={() => setPage(201)}
                className="h-9 w-9 rounded border border-[#D9CFC7] text-sm text-[#1A1A1A] hover:bg-[#EFE9E3] transition-colors"
                style={page === 201 ? { background: "#1A1A1A", color: "#fff", borderColor: "#1A1A1A" } : {}}
              >
                201
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded border border-[#D9CFC7] bg-transparent px-3 py-1.5 text-sm text-[#1A1A1A] hover:bg-[#EFE9E3] transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile filters FAB */}
      <button
        onClick={() => setMobileFilters(true)}
        className="lg:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-30 inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-5 py-3 text-sm font-medium text-white shadow-lg"
      >
        <SlidersHorizontal className="h-4 w-4" /> Filters
        {activePills.length > 0 && (
          <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C9B59C] px-1.5 text-xs font-bold text-[#1A1A1A]">
            {activePills.length}
          </span>
        )}
      </button>

      {/* Mobile drawer */}
      {mobileFilters && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setMobileFilters(false)}>
          <div
            className="max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Filters</h2>
              <button onClick={() => setMobileFilters(false)} className="grid h-8 w-8 place-items-center rounded-full bg-[#EFE9E3]">
                <X className="h-4 w-4 text-[#1A1A1A]" />
              </button>
            </div>
            {SidebarContent}
            <button
              onClick={() => setMobileFilters(false)}
              className="mt-4 w-full rounded-lg bg-[#1A1A1A] py-3 text-sm font-medium text-white"
            >
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}

      {/* Floating cart pop indicator */}
      {cartPop && (
        <div className="pointer-events-none fixed top-20 right-6 z-50 rounded-full bg-[#1A1A1A] px-4 py-2 text-xs font-medium text-white shadow-lg animate-bounce">
          Added to cart · {cartCount}
        </div>
      )}

      <Footer />
    </div>
  );
}
