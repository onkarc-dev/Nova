import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AccountLayout, StatusBadge } from "@/components/AccountLayout";
import { mockOrders } from "@/components/accountMockData";

export const Route = createFileRoute("/account/orders")({
  head: () => ({ meta: [{ title: "My Orders — ShopNova" }] }),
  component: OrdersPage,
});

const filters = ["All Orders", "Active", "Delivered", "Cancelled", "Returns"];

function OrdersPage() {
  const [filter, setFilter] = useState("All Orders");
  const [q, setQ] = useState("");

  const filtered = mockOrders.filter((o) => {
    if (q && !o.name.toLowerCase().includes(q.toLowerCase()) && !o.id.includes(q)) return false;
    if (filter === "All Orders") return true;
    if (filter === "Active") return o.status === "Shipped" || o.status === "Processing";
    if (filter === "Delivered") return o.status === "Delivered";
    if (filter === "Cancelled") return o.status === "Cancelled";
    return true;
  });

  return (
    <AccountLayout>
      <header>
        <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>My Orders</h1>
        <p className="text-sm" style={{ color: "#6B6B6B" }}>{mockOrders.length} orders placed</p>
      </header>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search your orders..."
          className="bg-white rounded-xl py-2.5 px-4 text-sm outline-none w-full md:w-72"
          style={{ border: "1px solid #D9CFC7" }}
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="rounded-full px-4 py-2 text-sm transition-colors"
                style={{
                  backgroundColor: active ? "#1A1A1A" : "transparent",
                  color: active ? "white" : "#6B6B6B",
                  border: active ? "1px solid #1A1A1A" : "1px solid #D9CFC7",
                }}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        {filtered.map((o) => {
          const isProcessing = o.status === "Processing";
          const disabledStyle = { border: "1px solid #D9CFC7", color: "#D9CFC7", cursor: "not-allowed" } as const;
          const enabledOutline = { border: "1px solid #1A1A1A", color: "#1A1A1A" } as const;
          return (
          <div key={o.id} className="bg-white rounded-2xl p-6 mb-4" style={{ border: "1px solid #D9CFC7" }}>
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <div className="font-mono text-sm" style={{ color: "#6B6B6B" }}>Order #{o.id}</div>
                <div className="text-xs mt-0.5" style={{ color: "#6B6B6B" }}>Placed on: {o.date}</div>
              </div>
              <div className="text-right">
                <StatusBadge status={o.status} />
                <div className="font-bold mt-1" style={{ color: "#1A1A1A" }}>Total: ${o.price.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: "#EFE9E3" }}>
                {o.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium" style={{ color: "#1A1A1A" }}>{o.name}</div>
                <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>{o.variant} · Qty {o.qty}</div>
              </div>
              <div className="font-bold self-center" style={{ color: "#1A1A1A" }}>${o.price.toFixed(2)}</div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {isProcessing ? (
                <span className="text-sm rounded-full px-4 py-2" style={disabledStyle}>Track Order</span>
              ) : (
                <Link to="/account/order/$id" params={{ id: o.id }} className="text-sm rounded-full px-4 py-2" style={enabledOutline}>Track Order</Link>
              )}
              <Link to="/account/order/$id" params={{ id: o.id }} className="text-sm rounded-full px-4 py-2" style={enabledOutline}>View Details</Link>
              <button className="text-sm rounded-full px-4 py-2" style={enabledOutline}>Buy Again</button>
              <button disabled={isProcessing} className="text-sm rounded-full px-4 py-2" style={isProcessing ? disabledStyle : { color: "#E05A20" }}>Return/Refund</button>
              <button disabled={isProcessing} className="text-sm rounded-full px-4 py-2" style={isProcessing ? disabledStyle : { color: "#C9B59C" }}>Write Review</button>
            </div>
          </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid #D9CFC7", color: "#6B6B6B" }}>
            No orders match your filters.
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
