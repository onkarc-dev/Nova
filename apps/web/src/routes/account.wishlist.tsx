import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { AccountLayout } from "@/components/AccountLayout";
import { mockWishlist } from "@/components/accountMockData";

export const Route = createFileRoute("/account/wishlist")({
  head: () => ({ meta: [{ title: "Wishlist — ShopNova" }] }),
  component: WishlistPage,
});

const cats = ["All", "Electronics", "Fashion", "Home", "Beauty"];

function WishlistPage() {
  const [cat, setCat] = useState("All");
  const [items, setItems] = useState(mockWishlist);
  const [removing, setRemoving] = useState<string | null>(null);

  const filtered = cat === "All" ? items : items.filter((i) => i.category === cat);
  const drops = items.filter((i) => i.oldPrice).length;

  const remove = (id: string) => {
    setRemoving(id);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 300);
  };

  return (
    <AccountLayout>
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1A1A1A" }}>My Wishlist</h1>
          <p className="text-sm" style={{ color: "#6B6B6B" }}>{items.length} items saved</p>
        </div>
        <div className="flex gap-3">
          <select className="rounded-xl px-4 py-2 text-sm bg-white outline-none" style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}>
            <option>Sort by: Date Added</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
          </select>
          <button className="rounded-xl px-4 py-2 text-sm bg-white" style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}>Share Wishlist</button>
        </div>
      </div>

      {drops > 0 && (
        <div className="rounded-xl p-4 mt-6" style={{ backgroundColor: "#EFE9E3", borderLeft: "4px solid #C9B59C" }}>
          <span className="text-sm" style={{ color: "#1A1A1A" }}>
            📉 Price drop alert! {drops} items in your wishlist are now on sale.
          </span>{" "}
          <a className="text-sm font-medium" style={{ color: "#C9B59C" }}>View Sale Items →</a>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-6">
        {cats.map((c) => {
          const active = cat === c;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className="rounded-full px-4 py-2 text-sm transition-colors"
              style={{
                backgroundColor: active ? "#1A1A1A" : "transparent",
                color: active ? "white" : "#6B6B6B",
                border: active ? "1px solid #1A1A1A" : "1px solid #D9CFC7",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filtered.map((w) => (
          <div
            key={w.id}
            className="bg-white rounded-2xl p-4 relative transition-all"
            style={{
              border: "1px solid #D9CFC7",
              opacity: removing === w.id ? 0 : 1,
              transform: removing === w.id ? "scale(0.95)" : "scale(1)",
            }}
          >
            <button
              onClick={() => remove(w.id)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white transition-colors hover:text-[#E05A20]"
              style={{ border: "1px solid #D9CFC7", color: "#6B6B6B" }}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="aspect-square rounded-xl flex items-center justify-center text-6xl" style={{ backgroundColor: "#EFE9E3" }}>
              {w.emoji}
            </div>
            <div className="mt-3 font-medium" style={{ color: "#1A1A1A" }}>{w.name}</div>
            <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>Added {w.addedOn}</div>
            <div className="text-xs mt-1" style={{ color: w.inStock ? "#00A86B" : "#E05A20" }}>
              {w.inStock ? "In Stock ✓" : "Out of Stock"}
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="font-bold" style={{ color: "#1A1A1A" }}>${w.price}</span>
              {w.oldPrice && <span className="text-xs line-through" style={{ color: "#6B6B6B" }}>${w.oldPrice}</span>}
            </div>
            {w.oldPrice && (
              <div className="inline-block text-xs rounded-full px-3 py-1 mt-2" style={{ backgroundColor: "#E8F5E9", border: "1px solid #00A86B", color: "#00A86B" }}>
                Price dropped! Was ${w.oldPrice} → ${w.price}
              </div>
            )}
            <button className="w-full text-sm rounded-full py-2 mt-3 text-white" style={{ backgroundColor: "#1A1A1A" }}>
              Move to Cart
            </button>
          </div>
        ))}
      </div>
    </AccountLayout>
  );
}
