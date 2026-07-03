import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Star, Minus, Plus, Heart, Gift, Lock, RotateCcw, Check, Share2, Mail, MessageCircle, Link as LinkIcon, ShoppingCart } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "./index";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Sony WH-1000XM6 Wireless Headphones — ShopNova" },
      { name: "description", content: "Sony WH-1000XM6 Wireless Noise-Cancelling Headphones. 30hr battery, LDAC, multipoint. Free delivery on ShopNova." },
      { property: "og:title", content: "Sony WH-1000XM6 — ShopNova" },
      { property: "og:description", content: "Industry-leading noise cancellation. 30hr battery. Free delivery." },
    ],
  }),
  component: ProductPage,
});

const PALETTE = {
  bg: "#F9F8F6",
  card: "#FFFFFF",
  alt: "#EFE9E3",
  border: "#D9CFC7",
  accent: "#C9B59C",
  ink: "#1A1A1A",
  muted: "#6B6B6B",
  warn: "#E05A20",
  ok: "#00A86B",
};

const THUMBS = ["🎧", "🎵", "📦", "🔌", "📋"];
const COLORS = [
  { name: "Midnight Black", swatch: "#1A1A1A", stock: true },
  { name: "Platinum Silver", swatch: "#D9D9D9", stock: true, low: true },
  { name: "Warm Brown", swatch: "#7A4E2D", stock: false },
];

function useCountdown(seconds: number) {
  const [mounted, setMounted] = useState(false);
  const [s, setS] = useState(seconds);
  useEffect(() => {
    setMounted(true);
    const i = setInterval(() => setS((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(i);
  }, []);
  if (!mounted) return "--:--:--";
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function ProductPage() {
  const [activeThumb, setActiveThumb] = useState(0);
  const [color, setColor] = useState(0);
  const [style, setStyle] = useState<"with" | "without">("with");
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<"details" | "specs" | "reviews" | "qa" | "brand">("details");
  const [cartCount, setCartCount] = useState(0);
  const [addState, setAddState] = useState<"idle" | "added">("idle");
  const [zoom, setZoom] = useState(false);
  const [bundle, setBundle] = useState([true, true, true]);
  const [helpfulIdx, setHelpfulIdx] = useState<Record<number, number>>({});
  const countdown = useCountdown(3 * 3600 + 42 * 60);

  const basePrice = style === "with" ? 329 : 309;
  const total = basePrice * qty;

  const bundleItems = [
    { emoji: "🎧", name: "Sony WH-1000XM6", price: 329 },
    { emoji: "🔌", name: "USB-C Hub", price: 49 },
    { emoji: "📱", name: "Phone Stand", price: 29 },
  ];
  const bundleTotal = bundleItems.reduce((sum, it, i) => sum + (bundle[i] ? it.price : 0), 0);

  function addToCart() {
    setCartCount((c) => c + qty);
    setAddState("added");
    setTimeout(() => setAddState("idle"), 1500);
  }

  return (
    <div style={{ background: PALETTE.bg, color: PALETTE.ink }} className="min-h-screen">
      <AnnouncementBar />
      <Navbar />
      {cartCount > 0 && (
        <div className="fixed top-4 right-4 z-30 rounded-full px-3 py-1 text-xs font-semibold shadow-lg" style={{ background: PALETTE.ink, color: "#fff" }}>
          Cart: {cartCount}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="border-b" style={{ borderColor: PALETTE.border, background: PALETTE.card }}>
        <div className="mx-auto max-w-7xl px-4 py-3 text-sm flex flex-wrap items-center gap-1.5" style={{ color: PALETTE.muted }}>
          <Link to="/" className="hover:underline">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/category/$name" params={{ name: "electronics" }} className="hover:underline">Electronics</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="hover:underline cursor-pointer">Headphones</span>
          <ChevronRight className="h-3.5 w-3.5" />
          <span style={{ color: PALETTE.ink }} className="font-medium truncate">Sony WH-1000XM6 Wireless Headphones</span>
        </div>
      </div>

      {/* Main two-column */}
      <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-1 lg:grid-cols-[45%_55%] gap-8">
        {/* Left: images */}
        <div className="lg:sticky lg:top-4 self-start">
          <div
            className="aspect-square rounded-2xl flex items-center justify-center overflow-hidden cursor-zoom-in relative"
            style={{ background: PALETTE.alt }}
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
          >
            <div
              className="text-[14rem] transition-transform duration-300 select-none"
              style={{ transform: zoom ? "scale(1.5)" : "scale(1)" }}
            >
              {THUMBS[activeThumb]}
            </div>
          </div>
          <div className="mt-4 flex gap-3 overflow-x-auto">
            {THUMBS.map((t, i) => (
              <button
                key={i}
                onClick={() => setActiveThumb(i)}
                className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0 transition"
                style={{
                  background: PALETTE.alt,
                  border: `${activeThumb === i ? 2 : 1}px solid ${activeThumb === i ? PALETTE.ink : PALETTE.border}`,
                }}
                aria-label={`Thumbnail ${i + 1}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm" style={{ color: PALETTE.muted }}>
            <span>Share this product:</span>
            <button className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"><LinkIcon className="h-4 w-4" /> Copy Link</button>
            <button className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
            <button className="inline-flex items-center gap-1 hover:text-[#1A1A1A]"><Mail className="h-4 w-4" /> Email</button>
          </div>
        </div>

        {/* Right: purchase panel */}
        <div>
          <div className="text-xs uppercase tracking-widest font-medium" style={{ color: PALETTE.accent }}>SONY</div>
          <h1 className="text-2xl font-bold leading-snug mt-1">
            Sony WH-1000XM6 Wireless Noise-Cancelling Headphones — 30hr Battery, LDAC, Multipoint
          </h1>

          <div className="flex flex-wrap items-center gap-2 mt-3 text-sm">
            <div className="flex" style={{ color: PALETTE.accent }}>
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
            </div>
            <span className="font-medium">4.7</span>
            <a className="underline" style={{ color: PALETTE.accent }} href="#reviews">14,832 ratings</a>
            <span style={{ color: PALETTE.border }}>|</span>
            <a className="underline" style={{ color: PALETTE.accent }} href="#qa">2,103 answered questions</a>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs rounded-full px-3 py-1 font-medium" style={{ background: PALETTE.accent, color: PALETTE.ink }}>#1 Best Seller in Headphones</span>
            <span className="text-xs rounded-full px-3 py-1 font-medium" style={{ background: PALETTE.ink, color: "#fff" }}>Nova Prime ✦</span>
            <span className="text-xs rounded-full px-3 py-1" style={{ border: `1px solid ${PALETTE.border}` }}>Climate Pledge Friendly 🌱</span>
          </div>

          <div className="my-4 h-px" style={{ background: PALETTE.border }} />

          <div className="inline-block text-xs rounded-full px-3 py-1 mb-2" style={{ background: PALETTE.ink, color: "#fff" }}>Limited Time Deal</div>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-bold">${basePrice}</span>
            <span className="text-xl line-through" style={{ color: PALETTE.muted }}>$449</span>
            <span className="text-sm font-medium" style={{ color: PALETTE.accent }}>Save ${449 - basePrice} ({Math.round(((449 - basePrice) / 449) * 100)}% off)</span>
          </div>
          <div className="mt-1 text-sm" style={{ color: PALETTE.muted }}>
            ✦ Nova Prime members: ${basePrice - 30} <a className="underline ml-2" style={{ color: PALETTE.accent }}>Join Nova Prime →</a>
          </div>

          {/* Color */}
          <div className="mt-5">
            <div className="text-sm">Color: <span className="font-semibold">{COLORS[color].name}</span></div>
            <div className="flex items-center gap-3 mt-2">
              {COLORS.map((c, i) => (
                <button
                  key={c.name}
                  disabled={!c.stock}
                  onClick={() => c.stock && setColor(i)}
                  className="w-8 h-8 rounded-full relative transition"
                  style={{
                    background: c.swatch,
                    border: `1px solid ${PALETTE.border}`,
                    boxShadow: color === i ? `0 0 0 2px ${PALETTE.bg}, 0 0 0 4px ${PALETTE.ink}` : "none",
                    opacity: c.stock ? 1 : 0.6,
                  }}
                  aria-label={c.name}
                  title={c.name}
                >
                  {!c.stock && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="block w-full h-px rotate-45" style={{ background: PALETTE.ink }} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {COLORS[1] && color !== 1 && (
              <div className="text-xs mt-2" style={{ color: PALETTE.warn }}>Only 2 left in Platinum Silver</div>
            )}
          </div>

          {/* Style */}
          <div className="mt-5">
            <div className="text-sm mb-2">Style:</div>
            <div className="flex gap-2">
              {([
                { key: "with", label: "With Case" },
                { key: "without", label: "Without Case — Save $20" },
              ] as const).map((o) => (
                <button
                  key={o.key}
                  onClick={() => setStyle(o.key)}
                  className="px-4 py-2 rounded-full text-sm transition"
                  style={
                    style === o.key
                      ? { background: PALETTE.ink, color: "#fff" }
                      : { border: `1px solid ${PALETTE.border}`, color: PALETTE.muted }
                  }
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="mt-5">
            <div className="text-sm mb-2">Quantity:</div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: PALETTE.alt, border: `1px solid ${PALETTE.border}` }}
                aria-label="Decrease quantity"
              ><Minus className="h-4 w-4" /></button>
              <div className="w-12 h-10 rounded-lg flex items-center justify-center font-medium" style={{ border: `1px solid ${PALETTE.border}`, background: PALETTE.card }}>{qty}</div>
              <button
                onClick={() => setQty((q) => Math.min(5, q + 1))}
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: PALETTE.alt, border: `1px solid ${PALETTE.border}` }}
                aria-label="Increase quantity"
              ><Plus className="h-4 w-4" /></button>
              <span className="text-xs ml-3" style={{ color: PALETTE.muted }}>Maximum 5 per customer</span>
            </div>
          </div>

          {/* Delivery */}
          <div className="rounded-2xl p-4 mt-4" style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.border}` }}>
            <div className="pb-3 text-sm">
              <div>📦 <span className="font-medium">FREE Delivery</span> — Bold arrival: <span className="font-semibold">Tuesday, July 1</span></div>
              <a className="underline text-xs" style={{ color: PALETTE.accent }}>Deliver to United States</a>
            </div>
            <div className="h-px" style={{ background: PALETTE.border }} />
            <div className="py-3 text-sm">
              <div>⚡ <span className="font-medium">Get it TODAY</span></div>
              <div className="text-xs" style={{ color: PALETTE.muted }}>
                Order within <span className="font-bold" style={{ color: PALETTE.accent }}>{countdown}</span>
              </div>
              <div className="text-xs" style={{ color: PALETTE.muted }}>Choose Express at checkout</div>
            </div>
            <div className="h-px" style={{ background: PALETTE.border }} />
            <div className="pt-3 text-sm">
              <div>🏪 <span className="font-medium">Pick up available</span></div>
              <div className="text-xs" style={{ color: PALETTE.muted }}>ShopNova Fulfillment Center — New York</div>
              <div className="text-xs" style={{ color: PALETTE.muted }}>Usually ready in 2 hours</div>
            </div>
          </div>

          <div className="mt-3 text-sm font-medium" style={{ color: PALETTE.warn }}>⚠ Only 3 left</div>

          {/* Buttons */}
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={addToCart}
              className="w-full py-4 rounded-full text-lg font-semibold transition hover:scale-[1.01]"
              style={
                addState === "added"
                  ? { background: PALETTE.ok, color: "#fff" }
                  : { background: PALETTE.accent, color: PALETTE.ink }
              }
            >
              {addState === "added" ? "✓ Added to Cart!" : "Add to Cart"}
            </button>
            <button
              className="w-full py-4 rounded-full text-lg font-semibold transition hover:scale-[1.01]"
              style={{ background: PALETTE.ink, color: "#fff" }}
            >
              Buy Now
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs" style={{ color: PALETTE.muted }}>
            <span className="inline-flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Secure transaction</span>
            <span>|</span>
            <span className="inline-flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> Free returns</span>
            <span>|</span>
            <span className="inline-flex items-center gap-1"><Check className="h-3.5 w-3.5" /> Fulfilled by ShopNova</span>
          </div>

          <div className="flex justify-center gap-6 mt-3 text-sm">
            <button className="underline inline-flex items-center gap-1" style={{ color: PALETTE.accent }}><Heart className="h-4 w-4" /> Add to Wish List</button>
            <button className="underline inline-flex items-center gap-1" style={{ color: PALETTE.accent }}><Gift className="h-4 w-4" /> Add to Gift Registry</button>
          </div>

          {/* Sold by */}
          <div className="rounded-2xl p-4 mt-4 text-sm" style={{ background: PALETTE.bg, border: `1px solid ${PALETTE.border}` }}>
            <div><span style={{ color: PALETTE.muted }}>Ships from: </span><span className="font-semibold">ShopNova Global</span></div>
            <div className="mt-1">
              <span style={{ color: PALETTE.muted }}>Sold by: </span>
              <span className="font-semibold">SONY Official Store</span>
              <a className="ml-2 underline" style={{ color: PALETTE.accent }}>Visit Store →</a>
            </div>
            <div className="mt-1" style={{ color: PALETTE.muted }}>
              Seller rating: <span style={{ color: PALETTE.accent }}>⭐ 4.9</span> | 98% positive | 142,832 ratings
            </div>
            <a className="block mt-2 underline" style={{ color: PALETTE.accent }}>Other sellers: 3 new from $319 →</a>
          </div>

          <div className="mt-3 text-sm" style={{ color: PALETTE.muted }}>Subtotal ({qty} item{qty > 1 ? "s" : ""}): <span className="font-semibold" style={{ color: PALETTE.ink }}>${total}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10" style={{ background: PALETTE.card, borderBottom: `2px solid ${PALETTE.border}` }}>
        <div className="mx-auto max-w-7xl px-4 flex gap-6 overflow-x-auto">
          {([
            ["details", "Product Details"],
            ["specs", "Specifications"],
            ["reviews", "Reviews"],
            ["qa", "Q&A"],
            ["brand", "From the Brand"],
          ] as const).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="py-4 text-sm whitespace-nowrap transition"
              style={
                tab === k
                  ? { color: PALETTE.ink, fontWeight: 600, borderBottom: `2px solid ${PALETTE.ink}`, marginBottom: -2 }
                  : { color: PALETTE.muted }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {tab === "details" && <DetailsTab />}
        {tab === "specs" && <SpecsTab />}
        {tab === "reviews" && <ReviewsTab helpfulIdx={helpfulIdx} setHelpfulIdx={setHelpfulIdx} />}
        {tab === "qa" && <QATab />}
        {tab === "brand" && <BrandTab />}
      </div>

      {/* FBT */}
      <section className="py-12" style={{ background: PALETTE.card, borderTop: `1px solid ${PALETTE.border}` }}>
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-xl font-bold mb-6">Frequently Bought Together</h2>
          <div className="flex flex-wrap items-center gap-3">
            {bundleItems.map((it, i) => (
              <div key={i} className="flex items-center gap-3">
                <label className="flex items-center gap-3 rounded-2xl p-4" style={{ border: `1px solid ${PALETTE.border}`, background: PALETTE.bg, minWidth: 180 }}>
                  <input
                    type="checkbox"
                    checked={bundle[i]}
                    onChange={() => setBundle((b) => b.map((v, j) => (j === i ? !v : v)))}
                    className="w-4 h-4"
                    style={{ accentColor: PALETTE.ink }}
                  />
                  <div className="text-4xl">{it.emoji}</div>
                  <div>
                    <div className="text-sm font-medium">{it.name}</div>
                    <div className="text-sm" style={{ color: PALETTE.muted }}>${it.price}</div>
                  </div>
                </label>
                {i < bundleItems.length - 1 && <span className="text-2xl" style={{ color: PALETTE.muted }}>+</span>}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-lg">Total: <span className="font-bold">${bundleTotal}.00</span> for selected items</div>
            <button className="px-6 py-3 rounded-full font-semibold" style={{ background: PALETTE.ink, color: "#fff" }}>
              Add all to Cart
            </button>
          </div>
        </div>
      </section>

      {/* Similar / Recently / Also */}
      <CarouselRow title="Customers Also Viewed" items={6} />
      <CarouselRow title="Your Recently Viewed Items" items={4} alt />
      <CarouselRow title="Customers Who Bought This Also Bought" items={6} />

      <Footer />

      {/* Mobile sticky CTA */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-20 p-4 flex items-center gap-3"
        style={{ background: PALETTE.card, borderTop: `1px solid ${PALETTE.border}` }}>
        <div>
          <div className="text-lg font-bold">${basePrice}</div>
          <div className="text-xs" style={{ color: PALETTE.muted }}>FREE delivery</div>
        </div>
        <button onClick={addToCart} className="flex-1 py-3 rounded-full font-semibold inline-flex items-center justify-center gap-2"
          style={addState === "added" ? { background: PALETTE.ok, color: "#fff" } : { background: PALETTE.accent, color: PALETTE.ink }}>
          <ShoppingCart className="h-4 w-4" />
          {addState === "added" ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}

/* -------- Tabs -------- */

function DetailsTab() {
  const bullets = [
    "Industry-leading noise cancellation with HD Noise Cancelling Processor QN3",
    "Up to 30-hour battery life with quick charge (3 min = 3 hours)",
    "Crystal clear hands-free calling with Precise Voice Pickup Technology",
    "Multipoint connection — connect 2 devices simultaneously",
    "LDAC codec for Hi-Res Audio wireless",
    "Speak-to-Chat automatically pauses playback",
    "Foldable design with carrying case included",
  ];
  const info: [string, string][] = [
    ["Brand", "Sony"],
    ["Model", "WH-1000XM6"],
    ["Color", "Midnight Black"],
    ["Connectivity", "Bluetooth 5.3"],
    ["Battery Life", "30 Hours"],
    ["Weight", "250g"],
    ["Noise Cancel", "Active (ANC)"],
    ["Mic", "Built-in, 4 mics"],
    ["Warranty", "1 Year Manufacturer"],
    ["In The Box", "Headphones, Case, USB-C Cable, 3.5mm Cable"],
  ];
  return (
    <div className="grid md:grid-cols-2 gap-10">
      <div>
        <h3 className="font-semibold text-lg mb-3">About this item</h3>
        <ul>
          {bullets.map((b, i) => (
            <li key={i} className="text-sm py-2 flex gap-2" style={{ borderBottom: `1px solid ${PALETTE.bg}` }}>
              <span style={{ color: PALETTE.accent }}>✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-3">Product Information</h3>
        <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${PALETTE.border}` }}>
          {info.map(([k, v], i) => (
            <div key={k} className="grid grid-cols-[160px_1fr] text-sm" style={{ background: i % 2 === 0 ? PALETTE.bg : PALETTE.card }}>
              <div className="px-4 py-3 font-medium">{k}</div>
              <div className="px-4 py-3" style={{ color: PALETTE.muted }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SpecsTab() {
  const groups: { title: string; rows: [string, string][] }[] = [
    { title: "Audio", rows: [["Driver", "30mm dynamic"], ["Frequency Response", "4Hz - 40kHz"], ["Impedance", "48 ohms"], ["Codecs", "LDAC, AAC, SBC"]] },
    { title: "Connectivity", rows: [["Bluetooth", "5.3"], ["Multipoint", "Yes (2 devices)"], ["NFC", "Yes"], ["Wired", "3.5mm + USB-C"]] },
    { title: "Battery", rows: [["Life (ANC on)", "30 hours"], ["Quick Charge", "3 min = 3 hr"], ["Full Charge", "3 hours"], ["USB-C", "PD supported"]] },
    { title: "Physical", rows: [["Weight", "250g"], ["Foldable", "Yes"], ["Case", "Included"], ["Color", "Midnight Black"]] },
  ];
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {groups.map((g) => (
        <div key={g.title}>
          <h3 className="font-semibold mb-2">{g.title}</h3>
          <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${PALETTE.border}` }}>
            {g.rows.map(([k, v], i) => (
              <div key={k} className="grid grid-cols-2 text-sm" style={{ background: i % 2 === 0 ? PALETTE.bg : PALETTE.card }}>
                <div className="px-4 py-3 font-medium">{k}</div>
                <div className="px-4 py-3" style={{ color: PALETTE.muted }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const REVIEWS = [
  { name: "Alex M.", initials: "AM", rating: 5, date: "June 18, 2026", title: "Best headphones I've ever owned", body: "The noise cancellation is genuinely on another level — I can sit next to a running blender and hear nothing. Battery has lasted me over a week of commutes. Comfort is excellent for long flights." , helpful: 234 },
  { name: "Priya S.", initials: "PS", rating: 5, date: "June 10, 2026", title: "Worth every penny", body: "Switched from the XM5 and the call quality jump is real. Multipoint between laptop and phone just works. Sound stage feels wider with LDAC enabled." , helpful: 178 },
  { name: "Daniel R.", initials: "DR", rating: 5, date: "May 30, 2026", title: "Travel essential", body: "Took these on a 14-hour flight. ANC made it feel like a library. Folding case is more compact than expected. Highly recommend for frequent travelers." , helpful: 142 },
  { name: "Jordan K.", initials: "JK", rating: 4, date: "May 22, 2026", title: "Great but pricey", body: "Sound and ANC are top tier. Lost a star because the touch controls take getting used to and the app sometimes disconnects. Otherwise fantastic." , helpful: 89 },
  { name: "Sam L.", initials: "SL", rating: 3, date: "May 14, 2026", title: "Good, not revolutionary", body: "Coming from the XM4, I expected more of a jump. They're comfortable and quiet, but the difference is marginal. If you have older Sony cans, the upgrade is justified." , helpful: 41 },
];

function ReviewsTab({ helpfulIdx, setHelpfulIdx }: { helpfulIdx: Record<number, number>; setHelpfulIdx: React.Dispatch<React.SetStateAction<Record<number, number>>> }) {
  const breakdown = [
    { star: 5, pct: 78 },
    { star: 4, pct: 13 },
    { star: 3, pct: 5 },
    { star: 2, pct: 2 },
    { star: 1, pct: 2 },
  ];
  const tags = ["Sound Quality 😊", "Noise Cancellation 😊", "Battery Life 😊", "Comfort 😐", "Price 😐"];
  return (
    <div id="reviews">
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div>
          <div className="text-6xl font-bold">4.7</div>
          <div className="flex text-2xl" style={{ color: PALETTE.accent }}>★★★★★</div>
          <div className="text-sm" style={{ color: PALETTE.muted }}>out of 5</div>
          <div className="text-sm mt-2">14,832 global ratings</div>
        </div>
        <div className="space-y-2">
          {breakdown.map((b) => (
            <button key={b.star} className="w-full flex items-center gap-3 text-sm">
              <span className="w-8 text-left">{b.star} ★</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: PALETTE.alt }}>
                <div className="h-full" style={{ width: `${b.pct}%`, background: PALETTE.accent }} />
              </div>
              <span className="w-10 text-right" style={{ color: PALETTE.muted }}>{b.pct}%</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <div className="text-sm font-medium mb-2">How customers feel about:</div>
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="text-sm rounded-full px-3 py-1" style={{ background: PALETTE.alt, border: `1px solid ${PALETTE.border}` }}>{t}</span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
        <span style={{ color: PALETTE.muted }}>Sort:</span>
        {["Most Recent", "Top Rated", "Critical"].map((s) => (
          <button key={s} className="px-3 py-1 rounded-full" style={{ border: `1px solid ${PALETTE.border}` }}>{s}</button>
        ))}
        <span className="mx-2" style={{ color: PALETTE.border }}>|</span>
        <span style={{ color: PALETTE.muted }}>Filter:</span>
        {["All", "5★", "4★", "3★", "2★", "1★"].map((s) => (
          <button key={s} className="px-3 py-1 rounded-full" style={{ border: `1px solid ${PALETTE.border}` }}>{s}</button>
        ))}
        <label className="inline-flex items-center gap-2 ml-2"><input type="checkbox" style={{ accentColor: PALETTE.ink }} /> Verified only</label>
      </div>

      <div className="space-y-4">
        {REVIEWS.map((r, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ background: PALETTE.alt }}>{r.initials}</div>
              <div className="flex-1">
                <div className="font-medium">{r.name}</div>
                <div className="text-xs" style={{ color: PALETTE.ok }}>✓ Verified Purchase</div>
              </div>
              <div className="text-xs" style={{ color: PALETTE.muted }}>{r.date}</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex" style={{ color: PALETTE.accent }}>
                {Array.from({ length: 5 }).map((_, j) => <Star key={j} className={`h-4 w-4 ${j < r.rating ? "fill-current" : ""}`} />)}
              </div>
              <span className="font-semibold">{r.title}</span>
            </div>
            <p className="text-sm mt-2 leading-relaxed">{r.body}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs" style={{ color: PALETTE.muted }}>
              <span>👍 {r.helpful + (helpfulIdx[i] || 0)} people found this helpful</span>
              <button
                onClick={() => setHelpfulIdx((p) => ({ ...p, [i]: (p[i] || 0) + 1 }))}
                className="px-3 py-1 rounded-full"
                style={{ border: `1px solid ${PALETTE.border}` }}
              >Helpful</button>
              <button className="px-3 py-1 rounded-full" style={{ border: `1px solid ${PALETTE.border}` }}>Not Helpful</button>
              <button>Report</button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between gap-3 mt-6">
        <button className="px-6 py-3 rounded-full" style={{ border: `1px solid ${PALETTE.border}` }}>See all 14,832 reviews →</button>
        <button className="px-6 py-3 rounded-full font-semibold" style={{ background: PALETTE.ink, color: "#fff" }}>Write a review →</button>
      </div>
    </div>
  );
}

function QATab() {
  const qa = [
    { q: "Does this work with iPhone?", a: "Yes, fully compatible with iOS via Bluetooth. Recommend downloading the Sony Connect app for full features.", meta: "Answered by ShopNova | 142 found helpful" },
    { q: "Can I use it wired?", a: "Yes — a 3.5mm cable is included for wired listening. Wired mode also works without battery.", meta: "Answered by SONY Official | 98 found helpful" },
    { q: "How long does Bluetooth pairing take?", a: "About 5 seconds first time. After that, it auto-connects in under 2 seconds via multipoint.", meta: "Answered by a customer | 67 found helpful" },
    { q: "Are the ear cushions replaceable?", a: "Yes, Sony sells replacement cushions. They snap on without tools.", meta: "Answered by SONY Official | 54 found helpful" },
    { q: "Will these work for calls in a noisy office?", a: "The 4-mic array with Precise Voice Pickup performs very well in noisy environments. Most callers can't tell you're in a busy space.", meta: "Answered by ShopNova | 41 found helpful" },
  ];
  return (
    <div id="qa">
      <h3 className="text-lg font-semibold mb-4">Customer Questions & Answers</h3>
      <input
        placeholder="Search questions..."
        className="w-full rounded-xl px-4 py-3 mb-6 outline-none"
        style={{ border: `1px solid ${PALETTE.border}`, background: PALETTE.card }}
      />
      <div className="space-y-4">
        {qa.map((p, i) => (
          <div key={i} className="rounded-2xl p-5" style={{ border: `1px solid ${PALETTE.border}`, background: PALETTE.card }}>
            <div className="font-semibold">Q: {p.q}</div>
            <div className="mt-2 text-sm" style={{ color: PALETTE.muted }}>A: {p.a}</div>
            <div className="mt-2 text-xs" style={{ color: PALETTE.muted }}>{p.meta}</div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <button className="px-6 py-3 rounded-full" style={{ border: `1px solid ${PALETTE.border}` }}>Ask a question →</button>
      </div>
    </div>
  );
}

function BrandTab() {
  const more = [
    { emoji: "🎧", name: "Sony WF-1000XM5", price: 279 },
    { emoji: "🔊", name: "Sony SRS-XB100", price: 59 },
    { emoji: "📻", name: "Sony ULT Field 7", price: 449 },
    { emoji: "🎤", name: "Sony ECM-M1", price: 349 },
  ];
  return (
    <div>
      <div className="rounded-2xl p-8 flex flex-wrap items-center gap-6" style={{ background: PALETTE.alt }}>
        <div className="text-4xl font-bold tracking-tight">SONY</div>
        <div className="flex-1 min-w-[240px] text-sm" style={{ color: PALETTE.muted }}>
          For over 75 years, Sony has been pioneering audio innovation — from the Walkman to category-defining noise-cancelling headphones. Every product is engineered for music lovers who hear the details.
        </div>
        <button className="px-5 py-3 rounded-full font-semibold" style={{ background: PALETTE.ink, color: "#fff" }}>Explore Sony Store →</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {more.map((p) => (
          <div key={p.name} className="rounded-2xl p-4" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
            <div className="aspect-square rounded-xl flex items-center justify-center text-6xl" style={{ background: PALETTE.alt }}>{p.emoji}</div>
            <div className="mt-3 text-sm font-medium">{p.name}</div>
            <div className="text-sm" style={{ color: PALETTE.muted }}>${p.price}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------- Carousel Row -------- */
function CarouselRow({ title, items, alt }: { title: string; items: number; alt?: boolean }) {
  const products = useMemo(
    () =>
      Array.from({ length: items }).map((_, i) => ({
        emoji: ["🎧", "🔊", "⌚", "📱", "🖱️", "⌨️", "🎮", "📷"][i % 8],
        name: ["Bose QC Ultra", "JBL Flip 6", "Apple Watch", "Pixel 9", "MX Master 3S", "Keychron K2", "DualSense Edge", "Sony A7 IV"][i % 8],
        price: [349, 129, 399, 699, 99, 119, 199, 2499][i % 8],
        rating: 4.5,
      })),
    [items],
  );
  return (
    <section className="py-12" style={{ background: alt ? PALETTE.alt : PALETTE.bg }}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <a className="text-sm underline" style={{ color: PALETTE.accent }}>See more →</a>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {products.map((p, i) => (
            <div key={i} className="shrink-0 w-56 rounded-2xl p-4" style={{ background: PALETTE.card, border: `1px solid ${PALETTE.border}` }}>
              <div className="aspect-square rounded-xl flex items-center justify-center text-6xl" style={{ background: PALETTE.alt }}>{p.emoji}</div>
              <div className="mt-3 text-sm font-medium line-clamp-1">{p.name}</div>
              <div className="text-xs mt-1" style={{ color: PALETTE.accent }}>★ {p.rating}</div>
              <div className="mt-1 font-semibold">${p.price}</div>
              <label className="mt-2 flex items-center gap-2 text-xs" style={{ color: PALETTE.muted }}>
                <input type="checkbox" style={{ accentColor: PALETTE.ink }} /> Compare
              </label>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
