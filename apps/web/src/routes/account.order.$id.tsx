import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { AccountLayout, StatusBadge } from "@/components/AccountLayout";
import { mockOrders } from "@/components/accountMockData";

export const Route = createFileRoute("/account/order/$id")({
  head: () => ({ meta: [{ title: "Order Details — ShopNova" }] }),
  component: OrderDetailPage,
});

const steps = [
  { label: "Order Placed", date: "Jun 20, 2026 · 10:23 AM" },
  { label: "Payment Confirmed", date: "Jun 20, 2026 · 10:24 AM" },
  { label: "Shipped", date: "Jun 22, 2026 · 4:15 PM" },
  { label: "Out for Delivery", date: "Expected: Jun 28" },
  { label: "Delivered", date: "Expected: Jun 28" },
];

function OrderDetailPage() {
  const { id } = Route.useParams();
  const order = mockOrders.find((o) => o.id === id) ?? mockOrders[1];
  const currentStep =
    order.status === "Delivered" ? 5 : order.status === "Shipped" ? 3 : order.status === "Cancelled" ? -1 : 2;

  const subtotal = order.price;
  const tax = +(subtotal * 0.08).toFixed(2);
  const discount = 20;
  const total = +(subtotal + tax - discount).toFixed(2);

  return (
    <AccountLayout>
      <Link to="/account/orders" className="text-sm mb-6 inline-block" style={{ color: "#C9B59C" }}>
        ← Back to Orders
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #D9CFC7" }}>
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div>
                <h1 className="text-xl font-bold" style={{ color: "#1A1A1A" }}>Order #{order.id}</h1>
                <p className="text-sm mt-1" style={{ color: "#6B6B6B" }}>Placed on Wednesday, June 20, 2026</p>
              </div>
              <StatusBadge status={order.status} />
            </div>

            <div className="mt-8 overflow-x-auto">
              <div className="flex items-start min-w-[600px]">
                {steps.map((s, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={s.label} className="flex items-start flex-1 last:flex-none">
                      <div className="flex flex-col items-center text-center" style={{ width: 110 }}>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${active ? "ring-4" : ""}`}
                          style={{
                            backgroundColor: done ? "#C9B59C" : active ? "#1A1A1A" : "#EFE9E3",
                            color: done || active ? "white" : "#6B6B6B",
                            ["--tw-ring-color" as any]: "rgba(26,26,26,0.15)",
                            animation: active ? "pulse 2s infinite" : undefined,
                          }}
                        >
                          {done ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">{i + 1}</span>}
                        </div>
                        <div className="text-xs font-medium mt-2" style={{ color: "#1A1A1A" }}>{s.label}</div>
                        <div className="text-[10px] mt-1" style={{ color: "#6B6B6B" }}>{s.date}</div>
                        {i === 2 && done && (
                          <a className="text-[10px] mt-1" style={{ color: "#C9B59C" }}>FedEx #794628372846</a>
                        )}
                      </div>
                      {i < steps.length - 1 && (
                        <div className="flex-1 h-1 mt-5" style={{ backgroundColor: i < currentStep - 1 ? "#C9B59C" : "#D9CFC7" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #D9CFC7" }}>
            <h2 className="font-semibold mb-4" style={{ color: "#1A1A1A" }}>Items in This Order</h2>
            <div className="flex gap-4">
              <div className="w-20 h-20 rounded-xl flex items-center justify-center text-4xl shrink-0" style={{ backgroundColor: "#EFE9E3" }}>
                {order.emoji}
              </div>
              <div className="flex-1">
                <div className="font-medium" style={{ color: "#1A1A1A" }}>{order.name}</div>
                <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>{order.variant} · Qty {order.qty}</div>
                <div className="flex flex-wrap gap-3 mt-3 text-xs">
                  <button style={{ color: "#C9B59C" }}>Write a Review</button>
                  <button style={{ color: "#E05A20" }}>Return This Item</button>
                  <button style={{ color: "#C9B59C" }}>Buy Again</button>
                </div>
              </div>
              <div className="font-bold" style={{ color: "#1A1A1A" }}>${order.price.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #D9CFC7" }}>
            <h3 className="font-semibold mb-4" style={{ color: "#1A1A1A" }}>Order Summary</h3>
            <div className="space-y-2 text-sm">
              <Row label="Items (1)" value={`$${subtotal.toFixed(2)}`} />
              <Row label="Shipping" value="FREE" />
              <Row label="Tax (8%)" value={`$${tax.toFixed(2)}`} />
              <Row label="Nova Prime discount" value={`−$${discount.toFixed(2)}`} accent="#00A86B" />
              <div className="my-2" style={{ borderTop: "1px solid #D9CFC7" }} />
              <div className="flex justify-between font-bold text-base" style={{ color: "#1A1A1A" }}>
                <span>Order Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #D9CFC7" }}>
            <h3 className="font-semibold mb-3" style={{ color: "#1A1A1A" }}>Delivering to</h3>
            <div className="text-sm leading-relaxed" style={{ color: "#6B6B6B" }}>
              Jay Mahajan<br />
              123 Main Street, Apt 4B<br />
              New York, NY 10001<br />
              United States<br />
              📞 +1 (555) 123-4567
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6" style={{ border: "1px solid #D9CFC7" }}>
            <h3 className="font-semibold mb-3" style={{ color: "#1A1A1A" }}>Payment Method</h3>
            <div className="text-sm" style={{ color: "#1A1A1A" }}>💳 Visa ending in 4242</div>
            <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>Charged: ${total.toFixed(2)} on Jun 20, 2026</div>
          </div>

          <div className="rounded-2xl p-6" style={{ backgroundColor: "#EFE9E3", border: "1px solid #D9CFC7" }}>
            <h3 className="font-semibold mb-3" style={{ color: "#1A1A1A" }}>Need help with this order?</h3>
            <div className="flex flex-col gap-2">
              <button className="rounded-full py-2.5 text-sm text-white" style={{ backgroundColor: "#1A1A1A" }}>Track Package</button>
              <button className="rounded-full py-2.5 text-sm bg-white" style={{ border: "1px solid #1A1A1A", color: "#1A1A1A" }}>Contact Seller</button>
              <button className="rounded-full py-2.5 text-sm bg-white" style={{ border: "1px solid #1A1A1A", color: "#1A1A1A" }}>Return or Replace</button>
              <button className="rounded-full py-2.5 text-sm" style={{ color: "#E05A20" }}>Report a Problem</button>
            </div>
          </div>
        </div>
      </div>
    </AccountLayout>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between">
      <span style={{ color: "#6B6B6B" }}>{label}</span>
      <span style={{ color: accent ?? "#1A1A1A" }}>{value}</span>
    </div>
  );
}
