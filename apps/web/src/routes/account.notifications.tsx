import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AccountLayout } from "@/components/AccountLayout";

export const Route = createFileRoute("/account/notifications")({
  head: () => ({ meta: [{ title: "Notifications — ShopNova" }] }),
  component: NotificationsPage,
});

type Notif = { id: string; icon: string; title: string; body: string; time: string; unread: boolean };

const seed: Notif[] = [
  { id: "n1", icon: "📦", title: "Your order has shipped", body: "Order #SN-2847102 (MacBook Air M4) is on its way. Expected Jun 28.", time: "2h ago", unread: true },
  { id: "n2", icon: "📉", title: "Price drop on your wishlist", body: "Bose QuietComfort Ultra is now $329 (was $449). Grab it before it's gone!", time: "5h ago", unread: true },
  { id: "n3", icon: "✅", title: "Delivered: Sony WH-1000XM6", body: "Order #SN-2847193 was delivered today. Tap to rate your purchase.", time: "1d ago", unread: false },
  { id: "n4", icon: "🎁", title: "Nova Prime member deal", body: "Exclusive 20% off Apple accessories this weekend.", time: "2d ago", unread: false },
  { id: "n5", icon: "🔒", title: "New sign-in detected", body: "A new device signed in from New York, NY. If this wasn't you, secure your account.", time: "3d ago", unread: false },
];

function NotificationsPage() {
  const [items, setItems] = useState(seed);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const filtered = tab === "unread" ? items.filter((i) => i.unread) : items;
  const markAll = () => setItems((p) => p.map((i) => ({ ...i, unread: false })));

  return (
    <AccountLayout>
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Notifications</h1>
          <p className="text-sm" style={{ color: "#6B6B6B" }}>{items.filter((i) => i.unread).length} unread</p>
        </div>
        <button onClick={markAll} className="text-sm rounded-full px-4 py-2" style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}>
          Mark all as read
        </button>
      </div>

      <div className="flex gap-2 mt-6">
        {(["all", "unread"] as const).map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="rounded-full px-4 py-2 text-sm capitalize"
              style={{
                backgroundColor: active ? "#1A1A1A" : "transparent",
                color: active ? "white" : "#6B6B6B",
                border: active ? "1px solid #1A1A1A" : "1px solid #D9CFC7",
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            className="bg-white rounded-2xl p-5 flex gap-4 transition-colors hover:bg-[#F9F8F6]"
            style={{ border: "1px solid #D9CFC7" }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: "#EFE9E3" }}>
              {n.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-3">
                <div className="font-semibold flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                  {n.title}
                  {n.unread && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#C9B59C" }} />}
                </div>
                <span className="text-xs shrink-0" style={{ color: "#6B6B6B" }}>{n.time}</span>
              </div>
              <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>{n.body}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid #D9CFC7", color: "#6B6B6B" }}>
            You're all caught up. 🎉
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
