import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Minus, Plus, Trash2, Lock, ShieldCheck, Gift, ArrowRight, X } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "./index";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart — ShopNova" },
      { name: "description", content: "Review the items in your ShopNova cart and proceed to secure checkout." },
    ],
  }),
  component: CartPage,
});

type CartItem = {
  id: string;
  seller: string;
  name: string;
  variant: string;
  emoji: string;
  price: number;
  original?: number;
  qty: number;
  stock: "in" | "low";
  delivery: string;
  prime?: boolean;
  priceAlert?: boolean;
};

const INITIAL_CART: CartItem[] = [
  { id: "c1", seller: "Sony Official", name: "Sony WH-1000XM6 Wireless Noise Cancelling Headphones", variant: "Color: Black", emoji: "🎧", price: 329, original: 399, qty: 1, stock: "in", delivery: "FREE delivery Tue, Jul 1", prime: true },
  { id: "c2", seller: "Apple Store", name: "MacBook Air M4 13-inch — 256GB", variant: "Color: Midnight · 8GB / 256GB", emoji: "💻", price: 999, original: 1099, qty: 1, stock: "in", delivery: "FREE delivery Wed, Jul 2", prime: true, priceAlert: true },
  { id: "c3", seller: "AirGlide Athletics", name: "AirGlide Ultra Running Sneakers", variant: "Color: Cloud White · Size: 9", emoji: "👟", price: 119, original: 149, qty: 1, stock: "low", delivery: "FREE delivery Thu, Jul 3" },
  { id: "c4", seller: "Tuscan Home", name: "Tuscan Fig Soy Candle 8oz", variant: "Scent: Fig & Amber", emoji: "🕯️", price: 32, qty: 2, stock: "in", delivery: "Delivery Fri, Jul 4" },
  { id: "c5", seller: "Pro Grip", name: "Pro Grip Non-Slip Yoga Mat 6mm", variant: "Color: Sage", emoji: "🧘", price: 49, qty: 1, stock: "in", delivery: "FREE delivery Tue, Jul 1", prime: true },
];

const INITIAL_SAVED: CartItem[] = [
  { id: "s1", seller: "IronForge", name: "Adjustable Dumbbell Set 5-52.5 lbs", variant: "Weight: Pair", emoji: "🏋️", price: 349, qty: 1, stock: "in", delivery: "Ships in 3-5 days" },
  { id: "s2", seller: "Bellissimo Café", name: "Italian Espresso Machine 15-Bar", variant: "Color: Stainless", emoji: "☕", price: 229, qty: 1, stock: "in", delivery: "Ships in 2-3 days" },
];

const SUGGESTIONS = [
  { emoji: "⌚", name: "Nova Fit Smartwatch", price: 149 },
  { emoji: "🎒", name: "Everyday Commuter Backpack", price: 79 },
  { emoji: "🔋", name: "Fast-Charge Power Bank 20K", price: 39 },
  { emoji: "🎮", name: "Wireless Pro Controller", price: 69 },
];

const FREE_SHIP_THRESHOLD = 49;

function CartPage() {
  const [items, setItems] = useState<CartItem[]>(INITIAL_CART);
  const [saved, setSaved] = useState<CartItem[]>(INITIAL_SAVED);
  const [selected, setSelected] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(INITIAL_CART.map((i) => [i.id, true])),
  );
  const [promo, setPromo] = useState("");
  const [applied, setApplied] = useState<{ code: string; pct: number } | null>({ code: "NOVA10", pct: 0.1 });
  const [promoErr, setPromoErr] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);
  const shipping = subtotal >= FREE_SHIP_THRESHOLD ? 0 : 5.99;
  const tax = +(subtotal * 0.08).toFixed(2);
  const discount = applied ? +(subtotal * applied.pct).toFixed(2) : 0;
  const total = +(subtotal + shipping + tax - discount).toFixed(2);

  const setQty = (id: string, d: number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(9, i.qty + d)) } : i)));
  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const saveForLater = (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    setItems((p) => p.filter((i) => i.id !== id));
    setSaved((p) => [it, ...p]);
  };
  const moveToCart = (id: string) => {
    const it = saved.find((i) => i.id === id);
    if (!it) return;
    setSaved((p) => p.filter((i) => i.id !== id));
    setItems((p) => [...p, it]);
    setSelected((s) => ({ ...s, [id]: true }));
  };

  const allSelected = items.length > 0 && items.every((i) => selected[i.id]);
  const toggleAll = () => {
    const v = !allSelected;
    setSelected(Object.fromEntries(items.map((i) => [i.id, v])));
  };
  const removeSelected = () => {
    setItems((p) => p.filter((i) => !selected[i.id]));
  };

  const applyPromo = () => {
    if (!promo.trim()) return;
    setPromoLoading(true);
    setPromoErr("");
    setTimeout(() => {
      setPromoLoading(false);
      const c = promo.trim().toUpperCase();
      if (c === "NOVA10") setApplied({ code: c, pct: 0.1 });
      else if (c === "NOVA20") setApplied({ code: c, pct: 0.2 });
      else setPromoErr("Invalid or expired promo code");
    }, 500);
  };

  const remainingForFree = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const freeProgress = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);

  if (items.length === 0 && saved.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F8F6]">
        <AnnouncementBar />
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="text-8xl opacity-20">🛒</div>
          <h1 className="mt-6 text-xl font-bold text-[#1A1A1A]">Your cart is empty</h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">Looks like you haven't added anything yet</p>
          <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-8 py-3 text-white hover:bg-[#333]">
            Start Shopping <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <AnnouncementBar />
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A]">Shopping Cart</h1>
        <p className="mt-1 text-sm text-[#6B6B6B]">{items.length} items in your cart</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* LEFT */}
          <div>
            {/* Free ship progress */}
            {remainingForFree > 0 ? (
              <div className="mb-6 rounded-2xl border border-[#D9CFC7] bg-[#EFE9E3] p-4">
                <div className="text-sm font-medium text-[#1A1A1A]">🚚 Add ${remainingForFree.toFixed(2)} more for FREE shipping!</div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#D9CFC7]">
                  <div className="h-full rounded-full bg-[#C9B59C] transition-all" style={{ width: `${freeProgress}%` }} />
                </div>
              </div>
            ) : (
              <div className="mb-6 rounded-2xl border border-[#00A86B]/30 bg-[#E8F5E9] p-4 text-sm font-medium text-[#00A86B]">
                ✓ You've unlocked FREE shipping!
              </div>
            )}

            {/* Select all */}
            <div className="mb-4 flex items-center justify-between border-b border-[#D9CFC7] pb-3 text-sm text-[#6B6B6B]">
              <label className="flex cursor-pointer items-center gap-3">
                <CheckBox checked={allSelected} onChange={toggleAll} />
                <span>Select All ({items.length} items)</span>
              </label>
              <button onClick={removeSelected} className="text-[#E05A20] hover:underline">
                Remove Selected
              </button>
            </div>

            {/* Items */}
            <div className="space-y-4">
              {items.map((it) => (
                <CartRow
                  key={it.id}
                  item={it}
                  checked={!!selected[it.id]}
                  onCheck={(v) => setSelected((s) => ({ ...s, [it.id]: v }))}
                  onQty={(d) => setQty(it.id, d)}
                  onRemove={() => remove(it.id)}
                  onSave={() => saveForLater(it.id)}
                />
              ))}
            </div>

            {/* Saved for Later */}
            {saved.length > 0 && (
              <>
                <div className="my-8 border-t-2 border-[#D9CFC7]" />
                <h2 className="text-lg font-semibold text-[#1A1A1A]">Saved for Later ({saved.length} items)</h2>
                <div className="mt-4 space-y-3">
                  {saved.map((it) => (
                    <div key={it.id} className="flex items-center gap-4 rounded-2xl border border-[#D9CFC7] bg-white p-4">
                      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-[#EFE9E3] text-2xl">{it.emoji}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[#1A1A1A]">{it.name}</div>
                        <div className="mt-0.5 text-xs text-[#6B6B6B]">{it.variant}</div>
                        <div className="mt-1 text-sm font-bold text-[#1A1A1A]">${it.price.toFixed(2)}</div>
                      </div>
                      <button
                        onClick={() => moveToCart(it.id)}
                        className="shrink-0 rounded-full border border-[#1A1A1A] px-4 py-2 text-xs font-medium text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white"
                      >
                        Move to Cart
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* You might also like */}
            <div className="mt-10">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">You Might Also Like</h2>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {SUGGESTIONS.map((s, i) => (
                  <div key={i} className="w-48 shrink-0 rounded-2xl border border-[#D9CFC7] bg-white p-3">
                    <div className="grid h-32 place-items-center rounded-xl bg-[#EFE9E3] text-5xl">{s.emoji}</div>
                    <div className="mt-3 line-clamp-2 text-sm font-medium text-[#1A1A1A]">{s.name}</div>
                    <div className="mt-1 text-sm font-bold text-[#1A1A1A]">${s.price}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT — Summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-[#D9CFC7] bg-white p-6">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Order Summary</h2>

              {/* Promo */}
              <div className="mt-4">
                {applied ? (
                  <div className="flex items-center justify-between rounded-xl border border-[#00A86B]/40 bg-[#E8F5E9] p-3 text-sm text-[#00A86B]">
                    <span>✓ {applied.code} applied — {Math.round(applied.pct * 100)}% off</span>
                    <button onClick={() => setApplied(null)} className="text-[#00A86B] hover:opacity-70">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex overflow-hidden rounded-xl border border-[#D9CFC7]">
                      <input
                        value={promo}
                        onChange={(e) => setPromo(e.target.value)}
                        placeholder="Enter promo code"
                        className="min-w-0 flex-1 bg-white px-3 py-2 text-sm outline-none"
                      />
                      <button onClick={applyPromo} disabled={promoLoading} className="bg-[#1A1A1A] px-4 text-sm font-medium text-white hover:bg-[#333] disabled:opacity-60">
                        {promoLoading ? "…" : "Apply"}
                      </button>
                    </div>
                    {promoErr && <div className="mt-2 text-xs text-[#E05A20]">{promoErr}</div>}
                  </>
                )}
              </div>

              <div className="my-4 border-t border-[#D9CFC7]" />

              <div className="space-y-2 text-sm">
                <Row label={`Subtotal (${items.length} items)`} value={`$${subtotal.toFixed(2)}`} />
                <Row label="Shipping" value={shipping === 0 ? "FREE" : `$${shipping.toFixed(2)}`} />
                <Row label="Estimated Tax" value={`$${tax.toFixed(2)}`} />
                {applied && <Row label={`Promo (${applied.code})`} value={`−$${discount.toFixed(2)}`} success />}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[#D9CFC7] pt-3 text-xl font-bold text-[#1A1A1A]">
                <span>Order Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <div className="mt-4 rounded-xl bg-[#EFE9E3] p-3 text-sm">
                <span className="text-[#1A1A1A]">✦ Nova Prime members save an extra $45 on this order.</span>{" "}
                <a href="#" className="font-medium text-[#C9B59C] hover:underline">Join Nova Prime →</a>
              </div>

              <Link
                to="/checkout"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#1A1A1A] py-4 text-lg font-semibold text-white transition-colors hover:bg-[#333]"
              >
                Proceed to Checkout <ArrowRight className="h-5 w-5" />
              </Link>

              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#6B6B6B]">
                <Lock className="h-3 w-3" /> Secure checkout · 256-bit SSL encrypted
              </div>

              <div className="mt-4 flex items-center justify-center gap-3 text-xs text-[#6B6B6B] opacity-60">
                <span>Visa</span>·<span>MC</span>·<span>PayPal</span>·<span>Apple Pay</span>·<span>G Pay</span>·<span>UPI</span>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Row({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[#6B6B6B]">{label}</span>
      <span className={success ? "font-medium text-[#00A86B]" : "font-medium text-[#1A1A1A]"}>{value}</span>
    </div>
  );
}

function CheckBox({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`grid h-5 w-5 place-items-center rounded border transition-colors ${
        checked ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#D9CFC7] bg-white"
      }`}
      aria-pressed={checked}
    >
      {checked && <Check className="h-3.5 w-3.5" />}
    </button>
  );
}

function CartRow({
  item, checked, onCheck, onQty, onRemove, onSave,
}: {
  item: CartItem;
  checked: boolean;
  onCheck: (v: boolean) => void;
  onQty: (d: number) => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  const [gift, setGift] = useState(false);
  return (
    <div className="rounded-2xl border border-[#D9CFC7] bg-white p-5 transition-all">
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-3">
          <CheckBox checked={checked} onChange={onCheck} />
          <div className="grid h-24 w-24 shrink-0 place-items-center rounded-xl bg-[#EFE9E3] text-4xl">{item.emoji}</div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-[#6B6B6B]">{item.seller}</div>
          <div className="mt-1 text-base font-medium text-[#1A1A1A]">{item.name}</div>
          <div className="mt-1 text-xs text-[#6B6B6B]">{item.variant}</div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            {item.stock === "in" ? (
              <span className="text-xs font-medium text-[#00A86B]">✓ In Stock</span>
            ) : (
              <span className="text-xs font-medium text-[#E05A20]">Only 2 left</span>
            )}
            {item.prime && (
              <span className="rounded-full bg-[#EFE9E3] px-2 py-0.5 text-[10px] font-semibold text-[#1A1A1A]">✦ Nova Prime</span>
            )}
          </div>
          <div className="mt-1 text-xs text-[#6B6B6B]">📦 {item.delivery}</div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            <button onClick={onSave} className="text-[#C9B59C] hover:underline">Save for Later</button>
            <button onClick={onRemove} className="text-[#E05A20] hover:underline">Remove</button>
            <button className="text-[#C9B59C] hover:underline">Compare with similar</button>
          </div>

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-[#6B6B6B]">
            <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="accent-[#1A1A1A]" />
            <Gift className="h-3 w-3" /> Add gift wrap (+$4.99)
          </label>

          {item.priceAlert && (
            <div className="mt-2 rounded-xl border-l-4 border-[#E05A20] bg-[#FFF3E0] p-3 text-xs text-[#1A1A1A]">
              ⚠ Price increased by $10 since you added this item
            </div>
          )}
        </div>

        <div className="flex flex-col items-end justify-between">
          <div className="flex items-center gap-1 rounded-lg border border-[#D9CFC7]">
            <button onClick={() => onQty(-1)} className="p-2 hover:bg-[#EFE9E3]"><Minus className="h-3 w-3" /></button>
            <span className="w-8 text-center text-sm">{item.qty}</span>
            <button onClick={() => onQty(1)} className="p-2 hover:bg-[#EFE9E3]"><Plus className="h-3 w-3" /></button>
          </div>
          <div className="mt-3 text-right">
            <div className="text-lg font-bold text-[#1A1A1A]">${(item.price * item.qty).toFixed(2)}</div>
            {item.original && (
              <>
                <div className="text-sm text-[#6B6B6B] line-through">${(item.original * item.qty).toFixed(2)}</div>
                <div className="text-xs text-[#00A86B]">You save ${((item.original - item.price) * item.qty).toFixed(2)}</div>
              </>
            )}
          </div>
          <button onClick={onRemove} className="mt-2 text-[#6B6B6B] hover:text-[#E05A20]" aria-label="Remove item">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
