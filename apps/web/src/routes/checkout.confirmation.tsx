import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "./index";

export const Route = createFileRoute("/checkout/confirmation")({
  head: () => ({
    meta: [
      { title: "Order Confirmed — ShopNova" },
      { name: "description", content: "Your ShopNova order has been placed successfully." },
    ],
  }),
  component: ConfirmationPage,
});

const ITEMS = [
  { emoji: "🎧", name: "Sony WH-1000XM6 Headphones", qty: 1, price: 329 },
  { emoji: "💻", name: "MacBook Air M4 13-inch", qty: 1, price: 999 },
  { emoji: "👟", name: "AirGlide Running Sneakers", qty: 1, price: 119 },
  { emoji: "🕯️", name: "Tuscan Fig Soy Candle", qty: 2, price: 32 },
  { emoji: "🧘", name: "Pro Grip Yoga Mat", qty: 1, price: 49 },
];

const TRACKER = ["Order Placed", "Payment Confirmed", "Preparing to Ship", "Out for Delivery", "Delivered"];

const RECS = [
  { emoji: "🎒", name: "Everyday Commuter Backpack", price: 79 },
  { emoji: "🔋", name: "Fast-Charge Power Bank 20K", price: 39 },
  { emoji: "⌚", name: "Nova Fit Smartwatch", price: 149 },
  { emoji: "🎮", name: "Wireless Pro Controller", price: 69 },
];

function ConfirmationPage() {
  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <AnnouncementBar />
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-[#E8F5E9] animate-in zoom-in duration-500">
            <Check className="h-12 w-12 text-[#00A86B]" strokeWidth={3} />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-[#1A1A1A]">🎉 Order Confirmed!</h1>
          <p className="mt-2 text-base text-[#6B6B6B]">Thank you, Jay! Your order has been placed successfully.</p>
        </div>

        <div className="mt-8 rounded-2xl border border-[#D9CFC7] bg-white p-6">
          <div className="grid gap-6 sm:grid-cols-3 sm:text-center">
            <div>
              <div className="text-xs uppercase text-[#6B6B6B]">Order Number</div>
              <div className="mt-1 font-mono text-lg font-bold text-[#1A1A1A]">#SN-2847294</div>
            </div>
            <div>
              <div className="text-xs uppercase text-[#6B6B6B]">Order Total</div>
              <div className="mt-1 text-lg font-bold text-[#1A1A1A]">$1,222.06</div>
            </div>
            <div>
              <div className="text-xs uppercase text-[#6B6B6B]">Estimated Delivery</div>
              <div className="mt-1 text-lg font-bold text-[#1A1A1A]">Jul 2, 2026</div>
            </div>
          </div>
          <div className="mt-4 border-t border-[#D9CFC7] pt-4 text-center text-sm text-[#6B6B6B]">
            A confirmation email has been sent to jaymahajan987@gmail.com
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#D9CFC7] bg-[#F9F8F6] p-6">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Delivery Progress</h2>
          <div className="mt-4 flex items-center gap-2">
            {TRACKER.map((label, i) => {
              const done = i === 0;
              return (
                <div key={label} className="flex flex-1 items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-semibold ${
                      done ? "bg-[#00A86B] text-white" : "bg-[#EFE9E3] text-[#6B6B6B]"
                    }`}>
                      {done ? <Check className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="mt-1 hidden text-[10px] text-[#6B6B6B] sm:block">{label}</div>
                  </div>
                  {i < TRACKER.length - 1 && <div className={`h-0.5 flex-1 ${done ? "bg-[#00A86B]" : "bg-[#D9CFC7]"}`} />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-[#D9CFC7] bg-white p-6">
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Items Ordered</h2>
          <div className="mt-4 space-y-3">
            {ITEMS.map((i, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className="grid h-12 w-12 place-items-center rounded-lg bg-[#EFE9E3] text-xl">{i.emoji}</div>
                <div className="min-w-0 flex-1 truncate text-[#1A1A1A]">{i.name}</div>
                <div className="text-xs text-[#6B6B6B]">×{i.qty}</div>
                <div className="w-16 text-right font-medium text-[#1A1A1A]">${(i.price * i.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/account/order/$id" params={{ id: "SN-2847294" }} className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-6 py-3 font-semibold text-white hover:bg-[#333]">
            Track Your Order <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-[#D9CFC7] px-6 py-3 font-medium text-[#1A1A1A] hover:border-[#1A1A1A]">
            Continue Shopping
          </Link>
        </div>

        <div className="mt-12">
          <h2 className="text-lg font-semibold text-[#1A1A1A]">You Might Also Need</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {RECS.map((r, i) => (
              <div key={i} className="rounded-2xl border border-[#D9CFC7] bg-white p-3">
                <div className="grid h-32 place-items-center rounded-xl bg-[#EFE9E3] text-5xl">{r.emoji}</div>
                <div className="mt-3 line-clamp-2 text-sm font-medium text-[#1A1A1A]">{r.name}</div>
                <div className="mt-1 text-sm font-bold text-[#1A1A1A]">${r.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
