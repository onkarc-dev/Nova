import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AccountLayout } from "@/components/AccountLayout";

export const Route = createFileRoute("/account/settings")({
  head: () => ({ meta: [{ title: "Account Settings — ShopNova" }] }),
  component: SettingsPage,
});

const inputStyle = { backgroundColor: "#F9F8F6", border: "1px solid #D9CFC7" };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl p-6 mb-8" style={{ border: "1px solid #D9CFC7" }}>
      <h2 className="font-bold text-lg mb-4" style={{ color: "#1A1A1A" }}>{title}</h2>
      {children}
    </section>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="w-11 h-6 rounded-full relative transition-colors"
      style={{ backgroundColor: on ? "#1A1A1A" : "#D9CFC7" }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all"
        style={{ left: on ? "calc(100% - 22px)" : "2px" }}
      />
    </button>
  );
}

function SettingsPage() {
  const [twofa, setTwofa] = useState(false);
  const [notifs, setNotifs] = useState({
    orders: true,
    deals: true,
    drops: true,
    arrivals: false,
    activity: true,
    newsletter: false,
  });
  const set = (k: keyof typeof notifs) => (v: boolean) => setNotifs((p) => ({ ...p, [k]: v }));

  return (
    <AccountLayout>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "#1A1A1A" }}>Account Settings</h1>

      <Card title="Personal Information">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl" style={{ backgroundColor: "#EFE9E3", color: "#1A1A1A" }}>JM</div>
          <button className="rounded-full px-4 py-2 text-sm" style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}>Change Photo</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input placeholder="First name" defaultValue="Jay" className="rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
          <input placeholder="Last name" defaultValue="Mahajan" className="rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
        </div>
        <div className="mt-3 relative">
          <input defaultValue="jaymahajan987@gmail.com" className="w-full rounded-xl px-4 py-3 pr-24 text-sm outline-none" style={inputStyle} />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: "#00A86B" }}>Verified ✓</span>
        </div>
        <input defaultValue="+1 (555) 123-4567" className="w-full mt-3 rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <input type="date" defaultValue="1992-05-14" className="rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
          <select className="rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle}>
            <option>Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option>
          </select>
        </div>
        <button className="mt-4 rounded-full px-5 py-2.5 text-sm text-white" style={{ backgroundColor: "#1A1A1A" }}>Save Changes</button>
      </Card>

      <Card title="Security">
        <h3 className="font-medium mb-3" style={{ color: "#1A1A1A" }}>Change Password</h3>
        <div className="space-y-3">
          <input type="password" placeholder="Current password" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
          <input type="password" placeholder="New password" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
          <input type="password" placeholder="Confirm new password" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
        </div>
        <button className="mt-4 rounded-full px-5 py-2.5 text-sm text-white" style={{ backgroundColor: "#1A1A1A" }}>Update Password</button>

        <div className="my-6" style={{ borderTop: "1px solid #D9CFC7" }} />

        <div className="flex justify-between items-start">
          <div>
            <div className="font-medium" style={{ color: "#1A1A1A" }}>Two-Factor Authentication</div>
            <div className="text-sm mt-1" style={{ color: "#6B6B6B" }}>Add extra security to your account</div>
          </div>
          <Toggle on={twofa} onChange={setTwofa} />
        </div>
      </Card>

      <Card title="Notifications">
        {[
          { k: "orders", l: "Order updates", s: "Get notified about your order status" },
          { k: "deals", l: "Deals & promotions", s: "Special offers and discounts" },
          { k: "drops", l: "Price drop alerts", s: "When wishlist items go on sale" },
          { k: "arrivals", l: "New arrivals", s: "Be the first to know" },
          { k: "activity", l: "Account activity", s: "Sign-ins and security events" },
          { k: "newsletter", l: "Newsletter", s: "Weekly digest from ShopNova" },
        ].map((n) => (
          <div key={n.k} className="flex justify-between items-start py-3" style={{ borderTop: "1px solid #F9F8F6" }}>
            <div>
              <div className="font-medium text-sm" style={{ color: "#1A1A1A" }}>{n.l}</div>
              <div className="text-xs mt-0.5" style={{ color: "#6B6B6B" }}>{n.s}</div>
            </div>
            <Toggle on={notifs[n.k as keyof typeof notifs]} onChange={set(n.k as keyof typeof notifs)} />
          </div>
        ))}
      </Card>

      <Card title="Privacy">
        <div className="flex flex-wrap gap-3">
          <button className="rounded-full px-5 py-2.5 text-sm bg-white" style={{ border: "1px solid #1A1A1A", color: "#1A1A1A" }}>Download My Data</button>
          <button className="rounded-full px-5 py-2.5 text-sm bg-white" style={{ border: "1px solid #E05A20", color: "#E05A20" }}>Delete Account</button>
        </div>
      </Card>
    </AccountLayout>
  );
}
