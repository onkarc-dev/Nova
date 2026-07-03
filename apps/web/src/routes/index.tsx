import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, MapPin, User, Package, ShoppingCart, ChevronDown,
  ChevronLeft, ChevronRight, Heart, Star, Mail,
  Laptop, Shirt, Home as HomeIcon, BookOpen, Dumbbell, Sparkles, Gamepad2, Apple,
  Twitter, Instagram, Facebook, Linkedin, Youtube, Zap, Sparkle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ShopNova — Everything. Everywhere. Delivered." },
      { name: "description", content: "Shop millions of products globally with flash deals, trending picks, and fast worldwide shipping on orders over $49." },
      { property: "og:title", content: "ShopNova — Everything. Everywhere. Delivered." },
      { property: "og:description", content: "A premium global marketplace. Free shipping over $49, 30-day returns, 190+ countries." },
    ],
  }),
  component: HomePage,
});

/* ---------------- Reveal-on-scroll wrapper ---------------- */
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(14px)",
        transition: `opacity .7s ease ${delay}ms, transform .7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- Stars ---------------- */
function Stars({ value, count }: { value: number; count?: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className="h-3.5 w-3.5"
            style={{
              color: "#C9B59C",
              fill: i < Math.round(value) ? "#C9B59C" : "transparent",
            }}
          />
        ))}
      </div>
      {count !== undefined && <span className="text-xs text-[#6B6B6B]">({count.toLocaleString()})</span>}
    </div>
  );
}

/* ---------------- Countdown ---------------- */
function useCountdown(hours: number) {
  const [mounted, setMounted] = useState(false);
  const [end, setEnd] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    const e = Date.now() + hours * 3600 * 1000;
    setEnd(e);
    setNow(Date.now());
    setMounted(true);
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hours]);
  if (!mounted) return "--:--:--";
  const diff = Math.max(0, end - now);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}


/* ---------------- Data ---------------- */
const HERO_SLIDES = [
  {
    tag: "Summer Collection 2026",
    title: "Up to 70% Off Everything",
    sub: "Shop millions of products from global sellers, delivered to your door.",
    cta: "Shop the Sale",
    bg: "linear-gradient(135deg, #EFE9E3 0%, #F9F8F6 100%)",
    dark: false,
    visual: "grid",
  },
  {
    tag: "New Arrivals",
    title: "Latest Tech, Just Landed",
    sub: "Explore the newest electronics from the world's most loved brands.",
    cta: "Explore Now",
    bg: "linear-gradient(135deg, #F9F8F6 0%, #EFE9E3 100%)",
    dark: false,
    visual: "single",
  },
  {
    tag: "For Sellers",
    title: "Reach 200M+ Buyers Worldwide",
    sub: "Start your store in minutes. No setup fees, no monthly minimums.",
    cta: "Start Selling",
    bg: "#1A1A1A",
    dark: true,
    visual: "dashboard",
  },
] as const;

const CATEGORIES = [
  { name: "Electronics", icon: Laptop },
  { name: "Fashion", icon: Shirt },
  { name: "Home", icon: HomeIcon },
  { name: "Beauty", icon: Sparkles },
  { name: "Sports", icon: Dumbbell },
  { name: "Books", icon: BookOpen },
  { name: "Toys", icon: Gamepad2 },
  { name: "Grocery", icon: Apple },
];

const FLASH = [
  { emoji: "🎧", name: "Studio Wireless Noise-Cancel Headphones", price: 89, original: 259, rating: 4.7, count: 12480, claimed: 73, discount: 65 },
  { emoji: "⌚", name: "NovaFit Smart Watch Series 9 — 45mm", price: 149, original: 399, rating: 4.8, count: 8932, claimed: 58, discount: 62 },
  { emoji: "📷", name: "Mirrorless 4K Camera with 50mm Lens Kit", price: 599, original: 1299, rating: 4.6, count: 3210, claimed: 81, discount: 54 },
  { emoji: "🔊", name: "PortaBoom Bluetooth Speaker Waterproof", price: 39, original: 119, rating: 4.5, count: 21034, claimed: 92, discount: 67 },
  { emoji: "🪞", name: "Smart Mirror LED Ring Vanity Set", price: 79, original: 199, rating: 4.4, count: 5621, claimed: 44, discount: 60 },
  { emoji: "💻", name: "UltraSlim 14\" Laptop 16GB / 512GB SSD", price: 749, original: 1499, rating: 4.7, count: 9871, claimed: 67, discount: 50 },
];

const TRENDING = [
  { cat: "Electronics", emoji: "🎮", seller: "PixelHaus", name: "Pro Wireless Gaming Controller Edition X", price: 79, rating: 4.8, count: 14200, prime: true },
  { cat: "Fashion", emoji: "👟", seller: "Solestreet", name: "AirGlide Running Sneakers — Cloud Foam", price: 119, rating: 4.7, count: 9342, prime: true },
  { cat: "Home", emoji: "🕯️", seller: "Hearth & Vale", name: "Tuscan Fig Soy Candle 12oz, Hand-poured", price: 32, rating: 4.9, count: 4810, prime: false },
  { cat: "Electronics", emoji: "📱", seller: "NovaTech", name: "Nova X Pro Smartphone 256GB Titanium", price: 899, rating: 4.6, count: 23110, prime: true },
  { cat: "Sports", emoji: "🧘", seller: "ZenFlow", name: "Pro Grip Yoga Mat 6mm — Eco TPE", price: 49, rating: 4.8, count: 6720, prime: true },
  { cat: "Fashion", emoji: "👜", seller: "Maison Lior", name: "Soft Leather Crossbody Bag — Caramel", price: 189, rating: 4.7, count: 2103, prime: false },
  { cat: "Home", emoji: "☕", seller: "Brewhaus", name: "Italian Espresso Machine 15-Bar with Frother", price: 229, rating: 4.6, count: 7841, prime: true },
  { cat: "Electronics", emoji: "📺", seller: "NovaVision", name: "55\" 4K OLED Smart TV with HDR10+", price: 999, rating: 4.7, count: 5421, prime: true },
  { cat: "Sports", emoji: "🏋️", seller: "IronCore", name: "Adjustable Dumbbell Set 5-52.5 lb Pair", price: 349, rating: 4.8, count: 3920, prime: false },
  { cat: "Fashion", emoji: "🧥", seller: "North & Wool", name: "Merino Wool Overcoat — Camel Tailored", price: 279, rating: 4.6, count: 1284, prime: true },
  { cat: "Beauty", emoji: "💄", seller: "Lumière", name: "Velvet Matte Lipstick Set — 6 Shades", price: 39, rating: 4.7, count: 8210, prime: true },
  { cat: "Beauty", emoji: "🧴", seller: "GlowLab", name: "Hydra-Glow Vitamin C Serum 30ml", price: 28, rating: 4.8, count: 11420, prime: false },
];

/* ---------------- Page ---------------- */
function HomePage() {
  return (
    <div className="min-h-screen bg-[#F9F8F6] text-[#1A1A1A] antialiased">
      <AnnouncementBar />
      <Navbar />
      <main>
        <Hero />
        <StatsBar />
        <ShopByCategory />
        <FlashDeals />
        <Trending />
        <FeaturedCollections />
        <SellerBanner />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}

/* ---------------- 1. Announcement bar ---------------- */
export function AnnouncementBar() {
  return (
    <div className="w-full bg-[#1A1A1A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-2 text-center text-xs font-medium tracking-wide">
        <span className="mx-2">✦ Free Worldwide Shipping on orders over $49</span>
        <span className="mx-2 hidden sm:inline">✦ 30-Day Returns</span>
        <span className="mx-2 hidden md:inline">✦ Secure Payments</span>
      </div>
    </div>
  );
}

/* ---------------- 2. Navbar ---------------- */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 8);
    f(); window.addEventListener("scroll", f);
    return () => window.removeEventListener("scroll", f);
  }, []);
  const navLinks = ["All Departments","Today's Deals","Electronics","Fashion","Home & Kitchen","Beauty","Sports","Books","Toys","Automotive","Sell on ShopNova"];
  return (
    <header className={`sticky top-0 z-40 bg-white border-b border-[#D9CFC7] transition-shadow duration-200 ${scrolled ? "shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]" : ""}`}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center gap-4">
          {/* Logo */}
          <a href="#" className="flex items-center gap-1.5 shrink-0">
            <Sparkle className="h-5 w-5 fill-[#C9B59C] text-[#C9B59C]" />
            <span className="font-bold text-xl tracking-tight text-[#1A1A1A]" style={{ fontFamily: "'Inter', serif", letterSpacing: "-0.02em" }}>
              ShopNova
            </span>
          </a>
          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <div className="flex w-full items-center rounded-full border-[1.5px] border-[#D9CFC7] bg-[#F9F8F6] pl-5 pr-1 py-1 focus-within:border-[#C9B59C] transition-colors">
              <input
                type="text"
                placeholder="Search for products, brands and more..."
                className="flex-1 bg-transparent text-sm text-[#1A1A1A] placeholder:text-[#6B6B6B] outline-none py-2"
              />
              <button className="ml-2 inline-flex h-9 items-center justify-center rounded-full bg-[#1A1A1A] px-5 text-white hover:bg-[#C9B59C] hover:text-[#1A1A1A] transition-colors duration-200">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </div>
          {/* Right */}
          <div className="ml-auto flex items-center gap-4 lg:gap-6 text-sm text-[#1A1A1A]">
            <button className="hidden lg:flex items-center gap-1.5 hover:text-[#C9B59C] transition-colors">
              <MapPin className="h-4 w-4" />
              <div className="text-left leading-tight">
                <div className="text-[10px] text-[#6B6B6B]">Deliver to</div>
                <div className="text-xs font-semibold">United States</div>
              </div>
            </button>
            <button className="hidden md:flex items-center gap-1.5 hover:text-[#C9B59C] transition-colors">
              <User className="h-4 w-4" />
              <div className="text-left leading-tight">
                <div className="text-[10px] text-[#6B6B6B]">Hello, sign in</div>
                <div className="text-xs font-semibold flex items-center gap-0.5">Account & Lists <ChevronDown className="h-3 w-3" /></div>
              </div>
            </button>
            <button className="hidden lg:flex items-center gap-1.5 hover:text-[#C9B59C] transition-colors">
              <Package className="h-4 w-4" />
              <div className="text-left leading-tight">
                <div className="text-[10px] text-[#6B6B6B]">Returns</div>
                <div className="text-xs font-semibold">& Orders</div>
              </div>
            </button>
            <button className="relative flex items-center gap-1.5 hover:text-[#C9B59C] transition-colors">
              <div className="relative">
                <ShoppingCart className="h-5 w-5" />
                <span className="absolute -top-1.5 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#C9B59C] px-1 text-[10px] font-bold text-[#1A1A1A]">3</span>
              </div>
              <span className="hidden md:inline text-xs font-semibold">Cart</span>
            </button>
          </div>
        </div>
      </div>
      {/* Row 2 */}
      <div className="bg-[#F9F8F6] border-t border-[#D9CFC7]">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-6 overflow-x-auto no-scrollbar py-2.5 text-xs">
            {navLinks.map((l) => (
              <a
                key={l}
                href="#"
                className={`whitespace-nowrap hover:underline decoration-[#C9B59C] decoration-2 underline-offset-4 transition-colors ${l === "Today's Deals" ? "font-semibold text-[#C9B59C] hover:text-[#1A1A1A]" : "text-[#1A1A1A]"}`}
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------------- 3. Hero ---------------- */
function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(t);
  }, []);
  const slide = HERO_SLIDES[i];
  const heroTime = useCountdown(3);
  return (
    <section className="relative">
      <div className="mx-auto max-w-7xl px-4 pt-8">
        <div
          className="relative overflow-hidden rounded-3xl border border-[#D9CFC7]"
          style={{ background: slide.bg }}
        >
          {/* Decorative blob */}
          {!slide.dark && (
            <div
              aria-hidden
              className="pointer-events-none absolute -top-32 -left-24 h-[28rem] w-[28rem] rounded-full"
              style={{ background: "#D9CFC7", opacity: 0.2, filter: "blur(2px)" }}
            />
          )}
          <div className="relative grid gap-8 lg:grid-cols-2 items-center px-6 py-12 md:px-12 md:py-16 min-h-[420px]">
            <div key={i} className="animate-fade-in">
              {/* Limited Time badge */}
              <span
                className="inline-flex items-center gap-2 rounded-full border border-[#D9CFC7] bg-white px-3 py-1 text-xs font-medium shadow-sm mb-3"
                style={{ color: slide.dark ? "#1A1A1A" : "#1A1A1A" }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                🏷️ Limited Time
              </span>
              <span
                className="block w-fit rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wider uppercase"
                style={{
                  color: slide.dark ? "#C9B59C" : "#1A1A1A",
                  borderColor: slide.dark ? "#C9B59C" : "#D9CFC7",
                  background: slide.dark ? "transparent" : "#FFFFFF",
                }}
              >
                {slide.tag}
              </span>
              <h1
                className="mt-5 text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight"
                style={{ color: slide.dark ? "#FFFFFF" : "#1A1A1A" }}
              >
                {slide.title}
              </h1>
              <p className="mt-4 max-w-lg text-base md:text-lg" style={{ color: slide.dark ? "#A0A0A0" : "#6B6B6B" }}>
                {slide.sub}
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold transition-colors duration-200"
                  style={
                    slide.dark
                      ? { background: "#FFFFFF", color: "#1A1A1A" }
                      : { background: "#1A1A1A", color: "#FFFFFF" }
                  }
                >
                  {slide.cta} <ChevronRight className="h-4 w-4" />
                </button>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1A1A1A] text-white text-xs font-semibold px-3 py-2 tabular-nums">
                  🔥 Ends in {heroTime}
                </span>
              </div>
            </div>
            {/* Visual */}
            <div key={`v-${i}`} className="animate-fade-in">
              {slide.visual === "grid" && <HeroGrid />}
              {slide.visual === "single" && <HeroSingle />}
              {slide.visual === "dashboard" && <HeroDashboard />}
            </div>
          </div>

          {/* Arrows */}
          <button
            aria-label="Previous"
            onClick={() => setI((p) => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white border border-[#D9CFC7] flex items-center justify-center text-[#1A1A1A] hover:bg-[#EFE9E3] transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-label="Next"
            onClick={() => setI((p) => (p + 1) % HERO_SLIDES.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white border border-[#D9CFC7] flex items-center justify-center text-[#1A1A1A] hover:bg-[#EFE9E3] transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Slide ${idx + 1}`}
                className="h-2 rounded-full transition-all duration-200"
                style={{
                  width: idx === i ? 24 : 8,
                  background: idx === i ? "#C9B59C" : "#D9CFC7",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function HeroGrid() {
  const items = [
    { e: "🎧", l: "Studio Headphones", price: 89, bg: "linear-gradient(135deg,#EFE9E3 0%,#D9CFC7 100%)" },
    { e: "👟", l: "AirGlide Sneakers", price: 119, bg: "linear-gradient(135deg,#F0EBE3 0%,#E8DDD4 100%)" },
    { e: "📱", l: "Nova X Pro", price: 899, bg: "linear-gradient(135deg,#EDE8E3 0%,#DDD5CA 100%)" },
    { e: "⌚", l: "NovaFit Watch", price: 149, bg: "linear-gradient(135deg,#EAE5E0 0%,#DAD0C5 100%)" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((it) => (
        <div
          key={it.l}
          className="rounded-2xl border border-[#D9CFC7] aspect-square flex flex-col items-center justify-center shadow-sm p-3 text-center"
          style={{ background: it.bg }}
        >
          <div className="text-5xl">{it.e}</div>
          <div className="mt-2 text-xs font-semibold text-[#1A1A1A] line-clamp-1">{it.l}</div>
          <div className="text-sm font-bold text-[#1A1A1A]">${it.price}</div>
        </div>
      ))}
    </div>
  );
}
function HeroSingle() {
  return (
    <div className="relative rounded-2xl bg-white border border-[#D9CFC7] aspect-[4/3] flex items-center justify-center shadow-sm">
      <div className="text-[10rem] leading-none">📱</div>
      <div className="absolute top-4 right-4 rounded-full bg-[#C9B59C] text-[#1A1A1A] text-[10px] font-bold px-2.5 py-1">NEW</div>
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between bg-white/70 backdrop-blur-md rounded-xl px-3 py-2 border border-[#D9CFC7]">
        <span className="text-xs font-semibold text-[#1A1A1A]">Nova X Pro</span>
        <span className="text-sm font-bold text-[#1A1A1A]">$899</span>
      </div>
    </div>
  );
}
function HeroDashboard() {
  return (
    <div className="rounded-2xl bg-[#0F0F0F] border border-[#2A2A2A] p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-xs text-[#A0A0A0]">Seller Dashboard</div>
        <div className="flex gap-1"><span className="h-2 w-2 rounded-full bg-[#C9B59C]" /><span className="h-2 w-2 rounded-full bg-[#3A3A3A]" /><span className="h-2 w-2 rounded-full bg-[#3A3A3A]" /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[#1A1A1A] p-3">
          <div className="text-[10px] text-[#A0A0A0]">Revenue</div>
          <div className="text-lg font-bold text-white">$48.2k</div>
          <div className="text-[10px] text-[#C9B59C]">+12.4%</div>
        </div>
        <div className="rounded-xl bg-[#1A1A1A] p-3">
          <div className="text-[10px] text-[#A0A0A0]">Orders</div>
          <div className="text-lg font-bold text-white">1,284</div>
          <div className="text-[10px] text-[#C9B59C]">+8.1%</div>
        </div>
        <div className="rounded-xl bg-[#1A1A1A] p-3 col-span-2">
          <div className="text-[10px] text-[#A0A0A0] mb-2">Sales — last 7 days</div>
          <div className="flex items-end gap-1.5 h-16">
            {[40,65,50,80,55,90,72].map((h, idx) => (
              <div key={idx} className="flex-1 rounded-sm bg-[#C9B59C]" style={{ height: `${h}%`, opacity: 0.4 + idx * 0.08 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 4. Stats bar ---------------- */
function StatsBar() {
  const stats = [
    { e: "🛍", n: "2M+", l: "Sellers" },
    { e: "📦", n: "50M+", l: "Products" },
    { e: "🌍", n: "190+", l: "Countries" },
    { e: "⭐", n: "4.8", l: "Customer Rating" },
  ];
  return (
    <section className="bg-[#EFE9E3] mt-16">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#D9CFC7]">
          {stats.map((s) => (
            <div key={s.l} className="flex items-center justify-center gap-3 py-4 md:py-2 px-4">
              <span className="text-2xl">{s.e}</span>
              <div className="text-center md:text-left">
                <div className="text-xl md:text-2xl font-bold text-[#1A1A1A] leading-tight">{s.n}</div>
                <div className="text-xs text-[#6B6B6B]">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 5. Shop by Category ---------------- */
function ShopByCategory() {
  return (
    <section className="bg-[#F9F8F6] py-12">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <div className="flex items-end justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">Shop by Department</h2>
            <a href="#" className="text-sm font-medium text-[#C9B59C] hover:underline">See all categories →</a>
          </div>
        </Reveal>
        <Reveal>
          <div className="flex md:grid md:grid-cols-8 gap-4 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map(({ name, icon: Icon }) => (
              <a key={name} href="#" className="group flex flex-col items-center gap-3 shrink-0 w-24 md:w-auto cursor-pointer">
                <div className="h-20 w-20 rounded-full bg-[#EFE9E3] flex items-center justify-center transition-all duration-200 group-hover:bg-[#C9B59C] group-hover:scale-110 group-hover:shadow-md">
                  <Icon className="h-8 w-8 transition-colors duration-200 group-hover:text-white" style={{ color: "#1A1A1A" }} strokeWidth={2} />
                </div>
                <span className="text-xs font-medium text-[#1A1A1A] transition-colors duration-200 group-hover:text-[#C9B59C]">{name}</span>
              </a>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- 6. Flash Deals ---------------- */
function FlashDeals() {
  const time = useCountdown(6);
  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight flex items-center gap-2">
                <Zap className="h-6 w-6 fill-[#C9B59C] text-[#C9B59C]" /> Flash Deals
              </h2>
              <span className="rounded-full bg-[#1A1A1A] text-white text-xs font-mono font-semibold px-3 py-1.5 tabular-nums">
                {time}
              </span>
            </div>
            <a href="#" className="text-sm font-medium text-[#C9B59C] hover:underline">View All →</a>
          </div>
        </Reveal>

        <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 snap-x">
          {FLASH.map((p, idx) => (
            <Reveal key={p.name} delay={idx * 60} className="shrink-0 w-[260px] snap-start">
              <div className="group rounded-2xl bg-white border border-[#D9CFC7] p-3 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-[#C9B59C] transition-all duration-200">
                <div className="relative aspect-square rounded-xl bg-[#EFE9E3] flex items-center justify-center text-7xl overflow-hidden">
                  <span className="transition-transform duration-200 group-hover:scale-105">{p.emoji}</span>
                  <span className="absolute top-2 left-2 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold px-2 py-1">
                    −{p.discount}%
                  </span>
                </div>
                <div className="pt-3 px-1 space-y-2">
                  <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 leading-snug min-h-[2.5rem]">{p.name}</h3>
                  <Stars value={p.rating} count={p.count} />
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-[#1A1A1A]">${p.price}</span>
                    <span className="text-xs text-[#6B6B6B] line-through">${p.original}</span>
                  </div>
                  <div>
                    <div className="h-1.5 w-full rounded-full bg-[#EFE9E3] overflow-hidden">
                      <div className="h-full bg-[#C9B59C]" style={{ width: `${p.claimed}%` }} />
                    </div>
                    <div className="text-[10px] text-[#6B6B6B] mt-1">{p.claimed}% claimed</div>
                  </div>
                  <button className="w-full rounded-full bg-[#1A1A1A] text-white text-xs font-semibold py-2.5 group-hover:bg-[#C9B59C] transition-colors duration-200">
                    Add to Cart
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- 7. Trending ---------------- */
function Trending() {
  const tabs = [
    { label: "All", cat: "All" },
    { label: "Electronics", cat: "Electronics" },
    { label: "Fashion", cat: "Fashion" },
    { label: "Home & Kitchen", cat: "Home" },
    { label: "Sports", cat: "Sports" },
    { label: "Beauty", cat: "Beauty" },
  ] as const;
  const [tab, setTab] = useState<(typeof tabs)[number]["cat"]>("All");
  const items = useMemo(
    () => (tab === "All" ? TRENDING : TRENDING.filter((p) => p.cat === tab)),
    [tab],
  );
  return (
    <section className="bg-[#F9F8F6] py-12">
      <div className="mx-auto max-w-7xl px-4">
        <Reveal>
          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight mb-4">Trending Right Now</h2>
            <div className="flex gap-2 pb-4 border-b border-[#D9CFC7] overflow-x-auto no-scrollbar">
              {tabs.map((t) => {
                const active = tab === t.cat;
                return (
                  <button
                    key={t.cat}
                    onClick={() => setTab(t.cat)}
                    className={`shrink-0 px-4 py-2 rounded-full text-sm border transition-colors duration-200 ${
                      active
                        ? "bg-[#1A1A1A] text-white border-[#1A1A1A]"
                        : "bg-transparent text-[#6B6B6B] border-[#D9CFC7] hover:bg-[#EFE9E3] hover:text-[#1A1A1A]"
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {items.map((p, idx) => (
            <Reveal key={p.name} delay={(idx % 5) * 60}>
              <article className="group rounded-2xl bg-white border border-[#D9CFC7] p-3 shadow-sm hover:shadow-lg transition-shadow duration-200">
                <div className="relative aspect-square rounded-xl bg-[#EFE9E3] flex items-center justify-center text-7xl overflow-hidden">
                  {p.emoji}
                  <button
                    aria-label="Wishlist"
                    className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-white/90 border border-[#D9CFC7] flex items-center justify-center text-[#6B6B6B] hover:text-[#C9B59C] transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                  </button>
                  {p.prime && (
                    <span className="absolute top-2 left-2 rounded-full bg-[#C9B59C] text-[#1A1A1A] text-[10px] font-bold px-2 py-1 tracking-wide">
                      Nova Prime ✦
                    </span>
                  )}
                  <button className="absolute left-0 right-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-[#1A1A1A] text-white text-xs font-semibold py-2 rounded-b-xl">
                    Add to Cart
                  </button>
                </div>
                <div className="pt-3 px-1 space-y-1.5">
                  <div className="text-[10px] text-[#6B6B6B] uppercase tracking-wider">{p.seller}</div>
                  <h3 className="text-sm font-medium text-[#1A1A1A] line-clamp-2 leading-snug min-h-[2.5rem]">{p.name}</h3>
                  <Stars value={p.rating} count={p.count} />
                  <div className="text-base font-bold text-[#1A1A1A]">${p.price}</div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ---------------- 8. Featured Collections ---------------- */
function FeaturedCollections() {
  const cards = [
    { tag: "New Season", title: "Fashion Essentials", sub: "Curated styles for every occasion", emoji: "👗" },
    { tag: "Best Sellers", title: "Tech Must-Haves", sub: "Top rated electronics this month", emoji: "🎧" },
  ];
  return (
    <section className="bg-[#EFE9E3] py-16">
      <div className="mx-auto max-w-7xl px-4 grid md:grid-cols-2 gap-6">
        {cards.map((c, idx) => (
          <Reveal key={c.title} delay={idx * 100}>
            <div className="rounded-2xl bg-white border border-[#D9CFC7] p-8 md:p-10 flex items-center gap-6 h-full">
              <div className="flex-1">
                <span className="inline-block rounded-full bg-[#EFE9E3] text-[#1A1A1A] text-[11px] font-semibold uppercase tracking-wider px-3 py-1">
                  {c.tag}
                </span>
                <h3 className="mt-4 text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">{c.title}</h3>
                <p className="mt-2 text-sm text-[#6B6B6B]">{c.sub}</p>
                <a href="#" className="inline-block mt-5 text-sm font-semibold text-[#C9B59C] hover:underline">
                  Shop Collection →
                </a>
              </div>
              <div className="hidden sm:flex h-32 w-32 md:h-40 md:w-40 rounded-2xl bg-[#EFE9E3] items-center justify-center text-6xl md:text-7xl shrink-0">
                {c.emoji}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ---------------- 9. Seller Banner ---------------- */
function SellerBanner() {
  return (
    <section className="bg-[#1A1A1A] py-20">
      <div className="mx-auto max-w-4xl px-4 text-center">
        <Reveal>
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9B59C]">
            For Businesses
          </div>
          <h2 className="mt-4 text-3xl md:text-5xl font-bold text-white tracking-tight">
            Grow Your Business with ShopNova
          </h2>
          <p className="mt-4 text-base text-[#A0A0A0] max-w-2xl mx-auto">
            Join 2M+ sellers. Set up in minutes. Sell to the world.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button className="rounded-full bg-[#C9B59C] text-[#1A1A1A] text-sm font-semibold px-7 py-3.5 hover:opacity-90 transition-opacity">
              Start Selling Free →
            </button>
            <button className="rounded-full border border-white text-white text-sm font-semibold px-7 py-3.5 hover:bg-white hover:text-[#1A1A1A] transition-colors">
              Learn More
            </button>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { n: "2M+", l: "Sellers" },
              { n: "190+", l: "Countries" },
              { n: "$4.2B+", l: "Revenue" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl md:text-3xl font-bold text-white">{s.n}</div>
                <div className="text-xs text-[#A0A0A0] mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- 10. Newsletter ---------------- */
function Newsletter() {
  return (
    <section className="bg-[#EFE9E3] py-20">
      <div className="mx-auto max-w-2xl px-4 text-center">
        <Reveal>
          <div className="mx-auto h-14 w-14 rounded-full bg-[#D9CFC7] flex items-center justify-center">
            <Mail className="h-6 w-6 text-[#1A1A1A]" />
          </div>
          <h3 className="mt-5 text-2xl md:text-3xl font-semibold text-[#1A1A1A] tracking-tight">
            Get Exclusive Deals First
          </h3>
          <p className="mt-2 text-sm text-[#6B6B6B]">Join 10M+ shoppers. No spam, ever.</p>
          <form className="mt-7 flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 rounded-full bg-white border border-[#D9CFC7] px-5 py-3 text-sm text-[#1A1A1A] placeholder:text-[#6B6B6B] outline-none focus:border-[#C9B59C]"
            />
            <button className="rounded-full bg-[#1A1A1A] text-white text-sm font-semibold px-6 py-3 hover:bg-[#C9B59C] hover:text-[#1A1A1A] transition-colors">
              Subscribe
            </button>
          </form>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- 11. Footer ---------------- */
export function Footer() {
  const cols = [
    { title: "Get to Know Us", links: ["About", "Careers", "Press", "Blog", "Investor Relations"] },
    { title: "Make Money With Us", links: ["Sell on ShopNova", "Affiliate Program", "Advertise", "Brand Registry"] },
    { title: "Let Us Help You", links: ["Your Account", "Track Orders", "Returns", "Shipping", "Help Center"] },
  ];
  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkle className="h-5 w-5 fill-[#C9B59C] text-[#C9B59C]" />
              <span className="font-bold text-xl tracking-tight">ShopNova</span>
            </div>
            <p className="mt-3 text-sm text-[#A0A0A0] leading-relaxed">
              Everything. Everywhere. Delivered.
            </p>
            <div className="mt-5 flex gap-2.5">
              {[Instagram, Twitter, Facebook, Youtube, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social"
                  className="h-9 w-9 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white hover:bg-[#C9B59C] hover:text-[#1A1A1A] transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm text-[#A0A0A0] hover:text-[#C9B59C] transition-colors">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-[#2A2A2A]">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#6B6B6B]">© 2026 ShopNova. All rights reserved.</div>
          <div className="flex items-center gap-3 text-xs text-[#6B6B6B]">
            {["Visa", "Mastercard", "PayPal", "Apple Pay", "Google Pay", "UPI"].map((p) => (
              <span key={p} className="rounded-md border border-[#2A2A2A] bg-[#0F0F0F] px-2.5 py-1 font-medium">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
