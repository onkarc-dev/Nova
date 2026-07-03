export type MockOrder = {
  id: string;
  date: string;
  status: "Delivered" | "Shipped" | "Processing" | "Cancelled";
  emoji: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  expected?: string;
};

export const mockOrders: MockOrder[] = [
  {
    id: "SN-2847193",
    date: "Jun 22, 2026",
    status: "Delivered",
    emoji: "🎧",
    name: "Sony WH-1000XM6 Wireless Headphones",
    variant: "Color: Black",
    price: 329,
    qty: 1,
  },
  {
    id: "SN-2847102",
    date: "Jun 20, 2026",
    status: "Shipped",
    emoji: "💻",
    name: "MacBook Air M4 13-inch",
    variant: "Color: Midnight · 256GB",
    price: 999,
    qty: 1,
    expected: "Jun 28, 2026",
  },
  {
    id: "SN-2846891",
    date: "Jun 19, 2026",
    status: "Processing",
    emoji: "📱",
    name: "Samsung Galaxy S25 Ultra",
    variant: "Color: Titanium Gray · 512GB",
    price: 899,
    qty: 1,
  },
  {
    id: "SN-2846501",
    date: "Jun 12, 2026",
    status: "Delivered",
    emoji: "⌚",
    name: "Apple Watch Series 11",
    variant: "Size: 45mm",
    price: 449,
    qty: 1,
  },
  {
    id: "SN-2845998",
    date: "Jun 02, 2026",
    status: "Delivered",
    emoji: "👟",
    name: "Nike Pegasus 41 Running Shoes",
    variant: "Size: US 10 · Black",
    price: 139,
    qty: 1,
  },
  {
    id: "SN-2845712",
    date: "May 28, 2026",
    status: "Cancelled",
    emoji: "📷",
    name: "Canon EOS R8 Mirrorless Camera",
    variant: "Body only",
    price: 1499,
    qty: 1,
  },
  {
    id: "SN-2845001",
    date: "May 15, 2026",
    status: "Delivered",
    emoji: "🎮",
    name: "PlayStation 5 Slim",
    variant: "Disc Edition",
    price: 499,
    qty: 1,
  },
  {
    id: "SN-2844503",
    date: "May 02, 2026",
    status: "Delivered",
    emoji: "📚",
    name: "Kindle Paperwhite 12th Gen",
    variant: "16GB · Black",
    price: 149,
    qty: 1,
  },
];

export type MockWishlist = {
  id: string;
  emoji: string;
  name: string;
  price: number;
  oldPrice?: number;
  addedOn: string;
  inStock: boolean;
  category: string;
};

export const mockWishlist: MockWishlist[] = [
  { id: "w1", emoji: "🎧", name: "Bose QuietComfort Ultra", price: 329, oldPrice: 449, addedOn: "Jun 18, 2026", inStock: true, category: "Electronics" },
  { id: "w2", emoji: "👟", name: "Adidas Ultraboost 24", price: 189, addedOn: "Jun 15, 2026", inStock: true, category: "Fashion" },
  { id: "w3", emoji: "⌚", name: "Garmin Fenix 8", price: 899, addedOn: "Jun 10, 2026", inStock: false, category: "Electronics" },
  { id: "w4", emoji: "💄", name: "Charlotte Tilbury Pillow Talk Set", price: 95, addedOn: "Jun 08, 2026", inStock: true, category: "Beauty" },
  { id: "w5", emoji: "🪑", name: "Herman Miller Aeron Chair", price: 1395, addedOn: "Jun 05, 2026", inStock: true, category: "Home" },
  { id: "w6", emoji: "📱", name: "iPhone 17 Pro", price: 1199, oldPrice: 1299, addedOn: "Jun 02, 2026", inStock: true, category: "Electronics" },
  { id: "w7", emoji: "🕶️", name: "Ray-Ban Meta Smart Glasses", price: 299, addedOn: "May 28, 2026", inStock: true, category: "Fashion" },
  { id: "w8", emoji: "☕", name: "Breville Barista Touch", price: 999, addedOn: "May 20, 2026", inStock: true, category: "Home" },
];

export type MockAddress = {
  id: string;
  type: "Home" | "Work" | "Other";
  isDefault: boolean;
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
};

export const mockAddresses: MockAddress[] = [
  {
    id: "a1",
    type: "Home",
    isDefault: true,
    name: "Jay Mahajan",
    line1: "123 Main Street",
    line2: "Apt 4B",
    city: "New York",
    state: "NY",
    zip: "10001",
    country: "United States",
    phone: "+1 (555) 123-4567",
  },
  {
    id: "a2",
    type: "Work",
    isDefault: false,
    name: "Jay Mahajan",
    line1: "500 Madison Avenue",
    line2: "Floor 12",
    city: "New York",
    state: "NY",
    zip: "10022",
    country: "United States",
    phone: "+1 (555) 987-6543",
  },
];
