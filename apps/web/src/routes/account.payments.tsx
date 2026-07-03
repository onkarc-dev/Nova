import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AccountLayout } from "@/components/AccountLayout";

export const Route = createFileRoute("/account/payments")({
  head: () => ({ meta: [{ title: "Payment Methods — ShopNova" }] }),
  component: PaymentsPage,
});

const cards = [
  { id: "c1", network: "VISA", last4: "4242", holder: "JAY MAHAJAN", exp: "09/28", isDefault: true },
  { id: "c2", network: "MC", last4: "8801", holder: "JAY MAHAJAN", exp: "03/27", isDefault: false },
];

function PaymentsPage() {
  const [open, setOpen] = useState(false);

  return (
    <AccountLayout>
      <div className="flex justify-between items-start flex-wrap gap-3">
        <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Payment Methods</h1>
        <button onClick={() => setOpen(true)} className="rounded-full px-5 py-2.5 text-sm text-white" style={{ backgroundColor: "#1A1A1A" }}>
          + Add Payment Method
        </button>
      </div>

      <h2 className="font-semibold mt-8 mb-4" style={{ color: "#1A1A1A" }}>Saved Cards</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((c) => (
          <div key={c.id}>
            <div
              className="rounded-2xl p-6 text-white relative overflow-hidden shadow-md"
              style={{
                aspectRatio: "1.586",
                background: c.network === "VISA" ? "linear-gradient(135deg, #1A1A1A, #2D2D2D)" : "linear-gradient(135deg, #1A1A1A, #1A1A1A)",
              }}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ backgroundColor: "rgba(201,181,156,0.08)" }} />
              <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full" style={{ backgroundColor: "rgba(201,181,156,0.05)" }} />

              <div className="flex justify-end">
                <div className="font-bold text-xl tracking-wider">{c.network}</div>
              </div>
              <div className="w-10 h-8 rounded-md mt-6" style={{ backgroundColor: "rgba(201,181,156,0.6)" }} />
              <div className="font-mono text-lg tracking-widest mt-4">•••• •••• •••• {c.last4}</div>
              <div className="flex justify-between mt-4">
                <div>
                  <div className="text-[10px] opacity-70">CARD HOLDER</div>
                  <div className="text-sm">{c.holder}</div>
                </div>
                <div>
                  <div className="text-[10px] opacity-70">EXPIRES</div>
                  <div className="text-sm">{c.exp}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3 text-sm">
              {c.isDefault && <span className="text-xs rounded-full px-3 py-1 text-white" style={{ backgroundColor: "#1A1A1A" }}>Default</span>}
              <button style={{ color: "#C9B59C" }}>Edit</button>
              <button style={{ color: "#E05A20" }}>Remove</button>
            </div>
          </div>
        ))}
      </div>
      <button className="text-sm mt-4" style={{ color: "#C9B59C" }}>Why is my card saved? →</button>

      <h2 className="font-semibold mt-8 mb-4" style={{ color: "#1A1A1A" }}>Other Methods</h2>
      <div className="space-y-3">
        <div className="bg-white rounded-2xl p-5 flex justify-between items-center" style={{ border: "1px solid #D9CFC7" }}>
          <div>
            <div className="font-semibold" style={{ color: "#1A1A1A" }}>PayPal</div>
            <div className="text-xs" style={{ color: "#6B6B6B" }}>jaymahajan987@gmail.com</div>
          </div>
          <button className="text-sm" style={{ color: "#E05A20" }}>Disconnect</button>
        </div>
        <div className="bg-white rounded-2xl p-5 flex justify-between items-center" style={{ border: "1px solid #D9CFC7" }}>
          <div>
            <div className="font-semibold" style={{ color: "#1A1A1A" }}>UPI</div>
            <div className="text-xs" style={{ color: "#6B6B6B" }}>jay@okaxis</div>
          </div>
          <button className="text-sm" style={{ color: "#E05A20" }}>Remove</button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6" style={{ color: "#1A1A1A" }}>Add Payment Method</h2>
            <div className="space-y-3">
              {["Card Number", "Name on Card", "Expiry (MM/YY)", "CVV"].map((p) => (
                <input key={p} placeholder={p} className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={{ backgroundColor: "#F9F8F6", border: "1px solid #D9CFC7" }} />
              ))}
              <label className="flex items-center gap-2 text-sm" style={{ color: "#6B6B6B" }}>
                <input type="checkbox" defaultChecked className="accent-[#1A1A1A]" />
                Save this card for future purchases
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-full py-2.5 text-sm text-white" style={{ backgroundColor: "#1A1A1A" }}>Add Card</button>
              <button onClick={() => setOpen(false)} className="flex-1 rounded-full py-2.5 text-sm" style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
