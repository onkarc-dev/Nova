import { createFileRoute, Link } from "@tanstack/react-router";
import { AccountLayout, StatusBadge } from "@/components/AccountLayout";
import { mockOrders, mockWishlist } from "@/components/accountMockData";
import { Package, Heart, DollarSign, Star } from "lucide-react";

export const Route = createFileRoute("/account/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ShopNova" }] }),
  component: DashboardPage,
});

const stats = [
  { icon: Package, value: "12", label: "Total Orders" },
  { icon: Heart, value: "8", label: "Wishlist Items" },
  { icon: DollarSign, value: "$2,847", label: "Total Spent" },
  { icon: Star, value: "6", label: "Reviews Written" },
];

const trackSteps = ["Ordered", "Confirmed", "Shipped", "Delivered"];

function ProgressTracker({ current }: { current: number }) {
  return (
    <div className="mt-4 flex items-center">
      {trackSteps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: done || active ? (active ? "#1A1A1A" : "#C9B59C") : "#D9CFC7" }}
              />
              <span className="text-[10px] mt-1" style={{ color: "#6B6B6B" }}>{s}</span>
            </div>
            {i < trackSteps.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 -mt-3" style={{ backgroundColor: i < current ? "#C9B59C" : "#D9CFC7" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function DashboardPage() {
  const recent = mockOrders.slice(0, 3);
  const wishPreview = mockWishlist.slice(0, 4);

  return (
    <AccountLayout>
      <header>
        <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>
          Good morning, Jay! 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>
          Wednesday, June 25, 2026
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-2xl p-5" style={{ border: "1px solid #D9CFC7" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EFE9E3" }}>
                <Icon className="w-5 h-5" style={{ color: "#C9B59C" }} />
              </div>
              <div className="text-2xl font-bold mt-3" style={{ color: "#1A1A1A" }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>{s.label}</div>
            </div>
          );
        })}
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Recent Orders</h2>
          <Link to="/account/orders" className="text-sm" style={{ color: "#C9B59C" }}>View all →</Link>
        </div>
        {recent.map((o) => {
          const step = o.status === "Delivered" ? 4 : o.status === "Shipped" ? 2 : o.status === "Cancelled" ? -1 : 1;
          return (
            <div key={o.id} className="bg-white rounded-2xl p-5 mb-4" style={{ border: "1px solid #D9CFC7" }}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono" style={{ color: "#6B6B6B" }}>Order #{o.id}</span>
                <StatusBadge status={o.status} />
              </div>
              <div className="flex gap-4 mt-3">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "#EFE9E3" }}>
                  {o.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" style={{ color: "#1A1A1A" }}>{o.name}</div>
                  <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>Qty: {o.qty} · {o.variant}</div>
                  <div className="text-xs" style={{ color: "#6B6B6B" }}>Ordered: {o.date}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold" style={{ color: "#1A1A1A" }}>${o.price}</div>
                  <Link to="/account/order/$id" params={{ id: o.id }} className="text-xs block mt-1" style={{ color: "#C9B59C" }}>Track Order →</Link>
                  <button className="text-xs rounded-full px-3 py-1 mt-2" style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}>Buy Again</button>
                </div>
              </div>
              {o.status !== "Delivered" && o.status !== "Cancelled" && <ProgressTracker current={step} />}
            </div>
          );
        })}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Your Wishlist</h2>
          <Link to="/account/wishlist" className="text-sm" style={{ color: "#C9B59C" }}>View all 8 →</Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {wishPreview.map((w) => (
            <div key={w.id} className="bg-white rounded-2xl p-4 shrink-0" style={{ border: "1px solid #D9CFC7", minWidth: 180 }}>
              <div className="aspect-square rounded-xl flex items-center justify-center text-4xl mb-3" style={{ backgroundColor: "#EFE9E3" }}>
                {w.emoji}
              </div>
              <div className="text-sm font-medium line-clamp-2" style={{ color: "#1A1A1A" }}>{w.name}</div>
              <div className="font-bold mt-1" style={{ color: "#1A1A1A" }}>${w.price}</div>
              <div className="flex flex-col gap-2 mt-3">
                <button className="text-xs rounded-full px-3 py-1.5 text-white" style={{ backgroundColor: "#1A1A1A" }}>Add to Cart</button>
                <button className="text-xs" style={{ color: "#6B6B6B" }}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold" style={{ color: "#1A1A1A" }}>Recommended For You</h2>
        <p className="text-sm" style={{ color: "#6B6B6B" }}>Based on your browsing history</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
          {[
            { e: "🎧", n: "Sennheiser Momentum 5", p: 379 },
            { e: "⌨️", n: "Logitech MX Keys S", p: 119 },
            { e: "🖱️", n: "Logitech MX Master 4", p: 99 },
            { e: "💡", n: "Philips Hue Starter Kit", p: 199 },
            { e: "🔋", n: "Anker 737 Power Bank", p: 149 },
          ].map((p) => (
            <div key={p.n} className="bg-white rounded-2xl p-4" style={{ border: "1px solid #D9CFC7" }}>
              <div className="aspect-square rounded-xl flex items-center justify-center text-4xl mb-3" style={{ backgroundColor: "#EFE9E3" }}>{p.e}</div>
              <div className="text-sm font-medium line-clamp-2" style={{ color: "#1A1A1A" }}>{p.n}</div>
              <div className="font-bold mt-1" style={{ color: "#1A1A1A" }}>${p.p}</div>
            </div>
          ))}
        </div>
      </section>
    </AccountLayout>
  );
}
