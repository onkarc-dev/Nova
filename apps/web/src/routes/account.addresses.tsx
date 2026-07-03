import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { AccountLayout } from "@/components/AccountLayout";
import { mockAddresses, MockAddress } from "@/components/accountMockData";

export const Route = createFileRoute("/account/addresses")({
  head: () => ({ meta: [{ title: "Addresses — ShopNova" }] }),
  component: AddressesPage,
});

function AddressesPage() {
  const [addresses, setAddresses] = useState<MockAddress[]>(mockAddresses);
  const [open, setOpen] = useState(false);

  const setDefault = (id: string) =>
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  const remove = (id: string) => setAddresses((prev) => prev.filter((a) => a.id !== id));

  return (
    <AccountLayout>
      <div className="flex justify-between items-start flex-wrap gap-3">
        <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>Saved Addresses</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded-full px-5 py-2.5 text-sm text-white"
          style={{ backgroundColor: "#1A1A1A" }}
        >
          + Add New Address
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {addresses.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-6" style={{ border: "1px solid #D9CFC7" }}>
            <div className="flex justify-between items-start">
              <div className="flex gap-2">
                <span className="text-xs rounded-full px-3 py-1" style={{ backgroundColor: "#EFE9E3", color: "#1A1A1A" }}>
                  {a.type === "Home" ? "🏠" : a.type === "Work" ? "🏢" : "📍"} {a.type}
                </span>
                {a.isDefault && (
                  <span className="text-xs rounded-full px-3 py-1 text-white" style={{ backgroundColor: "#1A1A1A" }}>
                    Default
                  </span>
                )}
              </div>
              <button className="transition-colors hover:text-[#1A1A1A]" style={{ color: "#6B6B6B" }}>
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="font-semibold mt-3" style={{ color: "#1A1A1A" }}>{a.name}</div>
            <div className="text-sm leading-relaxed mt-2" style={{ color: "#6B6B6B" }}>
              {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
              {a.city}, {a.state} {a.zip}<br />
              {a.country}
            </div>
            <div className="text-sm mt-1" style={{ color: "#6B6B6B" }}>{a.phone}</div>
            <div className="flex gap-4 mt-4 text-sm">
              <button style={{ color: "#C9B59C" }}>Edit</button>
              <button onClick={() => remove(a.id)} style={{ color: "#E05A20" }}>Remove</button>
              {!a.isDefault && (
                <button onClick={() => setDefault(a.id)} style={{ color: "#C9B59C" }}>Set as Default</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} onClick={() => setOpen(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6" style={{ color: "#1A1A1A" }}>Add New Address</h2>
            <div className="space-y-3">
              {["Full Name", "Phone", "Street Address", "Apartment/Suite (optional)", "City", "State/Province", "Postal Code", "Country"].map((p) => (
                <input
                  key={p}
                  placeholder={p}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                  style={{ backgroundColor: "#F9F8F6", border: "1px solid #D9CFC7" }}
                />
              ))}
              <div className="flex gap-2">
                {["Home", "Work", "Other"].map((t) => (
                  <button key={t} className="rounded-full px-4 py-2 text-sm" style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}>
                    {t}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 text-sm" style={{ color: "#6B6B6B" }}>
                <input type="checkbox" className="accent-[#1A1A1A]" />
                Set as default delivery address
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-full py-2.5 text-sm text-white" style={{ backgroundColor: "#1A1A1A" }}>
                Save Address
              </button>
              <button onClick={() => setOpen(false)} className="flex-1 rounded-full py-2.5 text-sm bg-white" style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </AccountLayout>
  );
}
