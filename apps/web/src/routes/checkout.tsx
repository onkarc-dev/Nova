import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ArrowRight, ArrowLeft, CreditCard, Lock, Loader2 } from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "./index";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — ShopNova" },
      { name: "description", content: "Complete your purchase with secure ShopNova checkout." },
    ],
  }),
  component: CheckoutPage,
});

const SUMMARY_ITEMS = [
  { emoji: "🎧", name: "Sony WH-1000XM6 Headphones", qty: 1, price: 329 },
  { emoji: "💻", name: "MacBook Air M4 13-inch", qty: 1, price: 999 },
  { emoji: "👟", name: "AirGlide Running Sneakers", qty: 1, price: 119 },
  { emoji: "🕯️", name: "Tuscan Fig Soy Candle", qty: 2, price: 32 },
  { emoji: "🧘", name: "Pro Grip Yoga Mat", qty: 1, price: 49 },
];

const SAVED_ADDRESSES = [
  {
    id: "a1", label: "Home", isDefault: true,
    name: "Jay Mahajan", line1: "42 Willow Lane, Apt 3B", city: "Brooklyn", state: "NY", zip: "11201", country: "United States",
    phone: "+1 (415) 555-0142",
  },
  {
    id: "a2", label: "Work", isDefault: false,
    name: "Jay Mahajan", line1: "1200 Market Street, Floor 12", city: "San Francisco", state: "CA", zip: "94103", country: "United States",
    phone: "+1 (415) 555-0142",
  },
];

const SAVED_CARDS = [
  { id: "c1", brand: "Visa", last4: "4242", exp: "08/28" },
  { id: "c2", brand: "Mastercard", last4: "8891", exp: "03/27" },
];

const DELIVERY_OPTIONS = [
  { id: "std", name: "Standard Delivery", eta: "Arrives Mon, Jul 6 - Wed, Jul 8", price: 0, badge: null as string | null },
  { id: "exp", name: "Express Delivery", eta: "Arrives Thu, Jul 2", price: 9.99, badge: "RECOMMENDED" },
  { id: "sd", name: "Same-Day Delivery ✦", eta: "Arrives TODAY by 9 PM · Nova Prime exclusive", price: 19.99, badge: null },
];

function CheckoutPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [addressId, setAddressId] = useState("a1");
  const [addingNew, setAddingNew] = useState(false);
  const [delivery, setDelivery] = useState("exp");
  const [payTab, setPayTab] = useState<"card" | "paypal" | "apple" | "upi" | "cod">("card");
  const [cardId, setCardId] = useState<string | null>("c1");
  const [newCard, setNewCard] = useState({ number: "", name: "", exp: "", cvv: "" });
  const [billingSame, setBillingSame] = useState(true);
  const [gift, setGift] = useState(false);
  const [giftMsg, setGiftMsg] = useState("");
  const [terms, setTerms] = useState(false);
  const [termsErr, setTermsErr] = useState(false);
  const [placing, setPlacing] = useState(false);

  const subtotal = SUMMARY_ITEMS.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveryFee = DELIVERY_OPTIONS.find((d) => d.id === delivery)!.price;
  const tax = +(subtotal * 0.08).toFixed(2);
  const discount = +(subtotal * 0.1).toFixed(2);
  const total = +(subtotal + deliveryFee + tax - discount).toFixed(2);

  const placeOrder = () => {
    if (!terms) { setTermsErr(true); return; }
    setPlacing(true);
    setTimeout(() => navigate({ to: "/checkout/confirmation" }), 1500);
  };

  return (
    <div className="min-h-screen bg-[#F9F8F6]">
      <AnnouncementBar />
      <Navbar />

      <div className="sticky top-16 z-30 border-b border-[#D9CFC7] bg-[#F9F8F6]/95 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <StepIndicator step={step} onJump={(s) => s < step && setStep(s)} />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          <div>
            <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-300">
              {step === 1 && (
                <ShippingStep
                  addresses={SAVED_ADDRESSES}
                  addressId={addressId}
                  setAddressId={setAddressId}
                  addingNew={addingNew}
                  setAddingNew={setAddingNew}
                  onContinue={() => setStep(2)}
                />
              )}
              {step === 2 && (
                <DeliveryStep
                  delivery={delivery}
                  setDelivery={setDelivery}
                  gift={gift} setGift={setGift}
                  giftMsg={giftMsg} setGiftMsg={setGiftMsg}
                  onBack={() => setStep(1)}
                  onContinue={() => setStep(3)}
                />
              )}
              {step === 3 && (
                <PaymentStep
                  payTab={payTab} setPayTab={setPayTab}
                  cardId={cardId} setCardId={setCardId}
                  newCard={newCard} setNewCard={setNewCard}
                  billingSame={billingSame} setBillingSame={setBillingSame}
                  onBack={() => setStep(2)}
                  onContinue={() => setStep(4)}
                />
              )}
              {step === 4 && (
                <ReviewStep
                  address={SAVED_ADDRESSES.find((a) => a.id === addressId)!}
                  delivery={DELIVERY_OPTIONS.find((d) => d.id === delivery)!}
                  payTab={payTab}
                  cardId={cardId}
                  terms={terms} setTerms={(v: boolean) => { setTerms(v); if (v) setTermsErr(false); }}
                  termsErr={termsErr}
                  placing={placing}
                  onBack={() => setStep(3)}
                  onEdit={setStep}
                  onPlace={placeOrder}
                />
              )}
            </div>
          </div>

          <aside className="lg:sticky lg:top-40 lg:self-start">
            <SummaryCard subtotal={subtotal} deliveryFee={deliveryFee} tax={tax} discount={discount} total={total} />
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
}

/* --- Step Indicator --- */
function StepIndicator({ step, onJump }: { step: number; onJump: (s: number) => void }) {
  const steps = ["Shipping", "Delivery", "Payment", "Review"];
  return (
    <div className="flex items-center gap-2 sm:gap-4">
      {steps.map((label, i) => {
        const n = i + 1;
        const state = n < step ? "done" : n === step ? "active" : "future";
        return (
          <div key={n} className="flex flex-1 items-center gap-2 sm:gap-3">
            <button
              onClick={() => onJump(n)}
              disabled={state === "future"}
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors ${
                state === "done" ? "bg-[#C9B59C] text-white" :
                state === "active" ? "bg-[#1A1A1A] text-white" :
                "bg-[#EFE9E3] text-[#6B6B6B]"
              }`}
            >
              {state === "done" ? <Check className="h-4 w-4" /> : n}
            </button>
            <span className={`hidden text-sm sm:inline ${state === "active" ? "font-semibold text-[#1A1A1A]" : "text-[#6B6B6B]"}`}>{label}</span>
            {n < 4 && <div className={`h-0.5 flex-1 ${n < step ? "bg-[#C9B59C]" : "bg-[#D9CFC7]"}`} />}
          </div>
        );
      })}
    </div>
  );
}

/* --- Step 1 --- */
function ShippingStep({
  addresses, addressId, setAddressId, addingNew, setAddingNew, onContinue,
}: any) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A1A]">Where should we deliver?</h2>
      <div className="mt-6 space-y-3">
        {addresses.map((a: any) => (
          <label
            key={a.id}
            className={`flex cursor-pointer gap-3 rounded-2xl border-2 bg-white p-4 transition-colors ${
              addressId === a.id ? "border-[#1A1A1A]" : "border-[#D9CFC7]"
            }`}
          >
            <input type="radio" name="addr" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-[#1A1A1A]" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-[#EFE9E3] px-2 py-0.5 text-xs font-semibold text-[#1A1A1A]">{a.label}</span>
                {a.isDefault && <span className="rounded-full bg-[#C9B59C]/20 px-2 py-0.5 text-xs text-[#1A1A1A]">Default</span>}
              </div>
              <div className="mt-2 text-sm font-medium text-[#1A1A1A]">{a.name}</div>
              <div className="text-xs text-[#6B6B6B]">{a.line1}, {a.city}, {a.state} {a.zip}</div>
              <div className="text-xs text-[#6B6B6B]">{a.country} · {a.phone}</div>
            </div>
            <button className="text-xs text-[#C9B59C] hover:underline">Edit</button>
          </label>
        ))}
      </div>

      {!addingNew ? (
        <button onClick={() => setAddingNew(true)} className="mt-4 rounded-full border border-[#D9CFC7] px-5 py-2.5 text-sm font-medium text-[#1A1A1A] hover:border-[#1A1A1A]">
          + Add New Address
        </button>
      ) : (
        <div className="mt-4 rounded-2xl border border-[#D9CFC7] bg-white p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Full Name" />
            <Field label="Phone" />
            <Field label="Street Address" className="sm:col-span-2" />
            <Field label="Apartment (optional)" className="sm:col-span-2" />
            <Field label="City" />
            <Field label="State" />
            <Field label="Postal Code" />
            <Field label="Country" />
          </div>
          <label className="mt-3 flex items-center gap-2 text-xs text-[#6B6B6B]">
            <input type="checkbox" className="accent-[#1A1A1A]" defaultChecked /> Save this address for future orders
          </label>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <button onClick={onContinue} className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-8 py-3.5 font-semibold text-white hover:bg-[#333]">
          Continue to Delivery <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, className = "" }: { label: string; className?: string }) {
  return (
    <label className={`block text-xs text-[#6B6B6B] ${className}`}>
      {label}
      <input className="mt-1 w-full rounded-lg border border-[#D9CFC7] bg-white px-3 py-2 text-sm text-[#1A1A1A] outline-none focus:border-[#1A1A1A]" />
    </label>
  );
}

/* --- Step 2 --- */
function DeliveryStep({ delivery, setDelivery, gift, setGift, giftMsg, setGiftMsg, onBack, onContinue }: any) {
  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A1A]">Choose your delivery speed</h2>
      <div className="mt-6 space-y-3">
        {DELIVERY_OPTIONS.map((d) => {
          const active = delivery === d.id;
          const recommended = d.badge === "RECOMMENDED";
          return (
            <label
              key={d.id}
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 p-5 transition-colors ${
                recommended ? "bg-[#EFE9E3] border-[#C9B59C]" : "bg-white"
              } ${active && !recommended ? "border-[#1A1A1A]" : ""} ${!active && !recommended ? "border-[#D9CFC7]" : ""}`}
            >
              <input type="radio" checked={active} onChange={() => setDelivery(d.id)} className="accent-[#1A1A1A]" />
              <div className="flex-1">
                {d.badge && <span className="mb-1 inline-block rounded-full bg-[#C9B59C] px-2 py-0.5 text-[10px] font-semibold text-[#1A1A1A]">{d.badge}</span>}
                <div className="font-medium text-[#1A1A1A]">{d.name}</div>
                <div className="text-xs text-[#6B6B6B]">{d.eta}</div>
              </div>
              <div className={`font-bold ${d.price === 0 ? "text-[#00A86B]" : "text-[#1A1A1A]"}`}>
                {d.price === 0 ? "FREE" : `$${d.price.toFixed(2)}`}
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-6 rounded-2xl border border-[#D9CFC7] bg-white p-5">
        <label className="flex cursor-pointer items-center justify-between">
          <span className="font-medium text-[#1A1A1A]">🎁 This is a gift</span>
          <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="accent-[#1A1A1A]" />
        </label>
        {gift && (
          <div className="mt-3 space-y-3">
            <textarea
              value={giftMsg} onChange={(e) => setGiftMsg(e.target.value)}
              placeholder="Add a personal gift message…"
              className="min-h-20 w-full rounded-lg border border-[#D9CFC7] p-3 text-sm outline-none focus:border-[#1A1A1A]"
            />
            <label className="flex items-center gap-2 text-xs text-[#6B6B6B]">
              <input type="checkbox" className="accent-[#1A1A1A]" /> Hide prices on packing slip
            </label>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-[#D9CFC7] px-6 py-3 text-sm font-medium text-[#1A1A1A] hover:border-[#1A1A1A]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onContinue} className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-8 py-3.5 font-semibold text-white hover:bg-[#333]">
          Continue to Payment <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* --- Step 3 --- */
function PaymentStep({ payTab, setPayTab, cardId, setCardId, newCard, setNewCard, billingSame, setBillingSame, onBack, onContinue }: any) {
  const tabs = [
    { id: "card", label: "💳 Card" },
    { id: "paypal", label: "PayPal" },
    { id: "apple", label: "Apple Pay" },
    { id: "upi", label: "UPI" },
    { id: "cod", label: "Cash on Delivery" },
  ] as const;

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A1A]">How would you like to pay?</h2>

      <div className="mt-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setPayTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              payTab === t.id ? "bg-[#1A1A1A] text-white" : "border border-[#D9CFC7] bg-white text-[#1A1A1A] hover:border-[#1A1A1A]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-[#D9CFC7] bg-white p-5">
        {payTab === "card" && (
          <div className="space-y-4">
            <div className="space-y-2">
              {SAVED_CARDS.map((c) => (
                <label key={c.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${cardId === c.id ? "border-[#1A1A1A]" : "border-[#D9CFC7]"}`}>
                  <input type="radio" checked={cardId === c.id} onChange={() => setCardId(c.id)} className="accent-[#1A1A1A]" />
                  <CreditCard className="h-5 w-5 text-[#6B6B6B]" />
                  <div className="flex-1 text-sm">
                    <div className="font-medium text-[#1A1A1A]">{c.brand} •••• {c.last4}</div>
                    <div className="text-xs text-[#6B6B6B]">Expires {c.exp}</div>
                  </div>
                </label>
              ))}
              <label className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3 ${cardId === null ? "border-[#1A1A1A]" : "border-[#D9CFC7]"}`}>
                <input type="radio" checked={cardId === null} onChange={() => setCardId(null)} className="accent-[#1A1A1A]" />
                <span className="text-sm font-medium text-[#1A1A1A]">+ Add New Card</span>
              </label>
            </div>

            {cardId === null && (
              <div className="grid gap-3 border-t border-[#D9CFC7] pt-4 sm:grid-cols-2">
                <label className="block text-xs text-[#6B6B6B] sm:col-span-2">
                  Card Number
                  <input
                    value={newCard.number}
                    onChange={(e) => setNewCard({ ...newCard, number: formatCard(e.target.value) })}
                    placeholder="1234 5678 9012 3456"
                    className="mt-1 w-full rounded-lg border border-[#D9CFC7] px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]"
                  />
                </label>
                <label className="block text-xs text-[#6B6B6B] sm:col-span-2">
                  Name on Card
                  <input value={newCard.name} onChange={(e) => setNewCard({ ...newCard, name: e.target.value })} className="mt-1 w-full rounded-lg border border-[#D9CFC7] px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
                </label>
                <label className="block text-xs text-[#6B6B6B]">
                  Expiry (MM/YY)
                  <input value={newCard.exp} onChange={(e) => setNewCard({ ...newCard, exp: e.target.value })} placeholder="08/28" className="mt-1 w-full rounded-lg border border-[#D9CFC7] px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
                </label>
                <label className="block text-xs text-[#6B6B6B]">
                  CVV
                  <input value={newCard.cvv} onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} placeholder="123" className="mt-1 w-full rounded-lg border border-[#D9CFC7] px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
                </label>
                <label className="flex items-center gap-2 text-xs text-[#6B6B6B] sm:col-span-2">
                  <input type="checkbox" className="accent-[#1A1A1A]" defaultChecked /> Save card for future purchases
                </label>
              </div>
            )}
          </div>
        )}
        {payTab === "paypal" && (
          <div className="text-center">
            <p className="text-sm text-[#6B6B6B]">You'll be redirected to PayPal to complete your purchase.</p>
            <button className="mt-4 rounded-full bg-[#0070BA] px-8 py-3 font-semibold text-white">Continue with PayPal</button>
          </div>
        )}
        {payTab === "apple" && (
          <div className="text-center text-sm text-[#6B6B6B]">Confirm with Apple Pay at the review step.</div>
        )}
        {payTab === "upi" && (
          <label className="block text-xs text-[#6B6B6B]">
            UPI ID
            <input placeholder="yourname@bank" className="mt-1 w-full rounded-lg border border-[#D9CFC7] px-3 py-2 text-sm outline-none focus:border-[#1A1A1A]" />
          </label>
        )}
        {payTab === "cod" && (
          <div className="rounded-xl bg-[#FFF3E0] p-4 text-sm text-[#E05A20]">
            ⚠ Cash on Delivery may incur a $2.99 handling fee.
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-[#D9CFC7] bg-white p-5">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[#1A1A1A]">
          <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="accent-[#1A1A1A]" />
          Billing address same as shipping
        </label>
        {!billingSame && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Street Address" className="sm:col-span-2" />
            <Field label="City" />
            <Field label="Postal Code" />
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-[#D9CFC7] px-6 py-3 text-sm font-medium text-[#1A1A1A] hover:border-[#1A1A1A]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button onClick={onContinue} className="inline-flex items-center gap-2 rounded-full bg-[#1A1A1A] px-8 py-3.5 font-semibold text-white hover:bg-[#333]">
          Review Order <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* --- Step 4 --- */
function ReviewStep({ address, delivery, payTab, cardId, terms, setTerms, termsErr, placing, onBack, onEdit, onPlace }: any) {
  const card = SAVED_CARDS.find((c) => c.id === cardId);
  const payLabel =
    payTab === "card" ? (card ? `${card.brand} •••• ${card.last4}` : "New card") :
    payTab === "paypal" ? "PayPal" :
    payTab === "apple" ? "Apple Pay" :
    payTab === "upi" ? "UPI" : "Cash on Delivery";

  return (
    <div>
      <h2 className="text-xl font-bold text-[#1A1A1A]">Review your order</h2>

      <div className="mt-6 space-y-4">
        <SummaryBox title="Shipping Address" onEdit={() => onEdit(1)}>
          <div className="text-sm font-medium text-[#1A1A1A]">{address.name}</div>
          <div className="text-xs text-[#6B6B6B]">{address.line1}, {address.city}, {address.state} {address.zip}</div>
          <div className="text-xs text-[#6B6B6B]">{address.phone}</div>
        </SummaryBox>

        <SummaryBox title="Delivery Method" onEdit={() => onEdit(2)}>
          <div className="text-sm font-medium text-[#1A1A1A]">{delivery.name}</div>
          <div className="text-xs text-[#6B6B6B]">{delivery.eta}</div>
        </SummaryBox>

        <SummaryBox title="Payment Method" onEdit={() => onEdit(3)}>
          <div className="text-sm font-medium text-[#1A1A1A]">{payLabel}</div>
        </SummaryBox>

        <div className="rounded-2xl border border-[#D9CFC7] bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A1A1A]">Items in your order</h3>
            <Link to="/cart" className="text-xs text-[#C9B59C] hover:underline">Edit Cart</Link>
          </div>
          <div className="space-y-2">
            {SUMMARY_ITEMS.map((i, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#EFE9E3] text-lg">{i.emoji}</div>
                <div className="min-w-0 flex-1 truncate text-[#1A1A1A]">{i.name}</div>
                <div className="text-xs text-[#6B6B6B]">×{i.qty}</div>
                <div className="w-16 text-right text-[#1A1A1A]">${(i.price * i.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <label className={`mt-6 flex items-start gap-2 text-sm ${termsErr ? "animate-pulse text-[#E05A20]" : "text-[#6B6B6B]"}`}>
        <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 accent-[#1A1A1A]" />
        I agree to ShopNova's Terms of Sale and Return Policy
      </label>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-full border border-[#D9CFC7] px-6 py-3 text-sm font-medium text-[#1A1A1A] hover:border-[#1A1A1A]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <button
          onClick={onPlace}
          disabled={placing}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1A1A1A] py-4 text-lg font-bold text-white hover:bg-[#333] disabled:opacity-70 sm:w-auto sm:px-10"
        >
          {placing ? (<><Loader2 className="h-5 w-5 animate-spin" /> Processing your order…</>) : (<>Place Your Order <ArrowRight className="h-5 w-5" /></>)}
        </button>
      </div>
    </div>
  );
}

function SummaryBox({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#D9CFC7] bg-white p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
        <button onClick={onEdit} className="text-xs text-[#C9B59C] hover:underline">Edit</button>
      </div>
      {children}
    </div>
  );
}

/* --- Summary --- */
function SummaryCard({ subtotal, deliveryFee, tax, discount, total }: any) {
  return (
    <div className="rounded-2xl border border-[#D9CFC7] bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#1A1A1A]">Order Summary</h2>
        <Link to="/cart" className="text-xs text-[#C9B59C] hover:underline">Edit Cart</Link>
      </div>

      <div className="mt-4 space-y-2 max-h-52 overflow-y-auto pr-1">
        {SUMMARY_ITEMS.map((i, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#EFE9E3] text-base">{i.emoji}</div>
            <div className="min-w-0 flex-1 truncate text-[#1A1A1A]">{i.name}</div>
            <div className="text-[#6B6B6B]">×{i.qty}</div>
          </div>
        ))}
      </div>

      <div className="my-4 border-t border-[#D9CFC7]" />

      <div className="rounded-xl border border-[#00A86B]/40 bg-[#E8F5E9] p-2 text-xs text-[#00A86B]">
        ✓ Promo applied: NOVA10
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <SRow l="Subtotal" v={`$${subtotal.toFixed(2)}`} />
        <SRow l="Shipping" v={deliveryFee === 0 ? "FREE" : `$${deliveryFee.toFixed(2)}`} />
        <SRow l="Estimated Tax" v={`$${tax.toFixed(2)}`} />
        <SRow l="Promo (NOVA10)" v={`−$${discount.toFixed(2)}`} success />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-[#D9CFC7] pt-3 text-xl font-bold text-[#1A1A1A]">
        <span>Order Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#6B6B6B]">
        <Lock className="h-3 w-3" /> Secure checkout · 256-bit SSL
      </div>
    </div>
  );
}
function SRow({ l, v, success }: { l: string; v: string; success?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#6B6B6B]">{l}</span>
      <span className={success ? "font-medium text-[#00A86B]" : "font-medium text-[#1A1A1A]"}>{v}</span>
    </div>
  );
}
