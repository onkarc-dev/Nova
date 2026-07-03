import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { AuthLeftPanel } from "@/routes/login";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Account — ShopNova" },
      { name: "description", content: "Create your ShopNova account in seconds." },
    ],
  }),
  component: SignupPage,
});

const inputStyle = {
  backgroundColor: "#F9F8F6",
  border: "1px solid #D9CFC7",
  ["--tw-ring-color" as any]: "rgba(201,181,156,0.2)",
};

function strengthScore(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

function SignupPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const score = useMemo(() => strengthScore(pw), [pw]);
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["#E53935", "#E05A20", "#C9B59C", "#00A86B"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== confirm || score < 2) return;
    navigate({ to: "/account/dashboard" });
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F9F8F6" }}>
      <AuthLeftPanel />
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className="w-full max-w-[460px] rounded-3xl p-10 shadow-lg bg-white"
          style={{ border: "1px solid #D9CFC7" }}
        >
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A1A1A" }}>
            Create your account
          </h2>
          <p className="text-sm mb-8" style={{ color: "#6B6B6B" }}>
            Join 10M+ shoppers on ShopNova
          </p>

          <div className="grid grid-cols-2 gap-3">
            {["G Google", " Apple"].map((t) => (
              <button
                key={t}
                className="rounded-xl py-3 font-medium text-sm bg-white transition-colors hover:bg-[#EFE9E3]"
                style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center my-6 gap-3">
            <div className="flex-1" style={{ borderTop: "1px solid #D9CFC7" }} />
            <span className="text-xs" style={{ color: "#6B6B6B" }}>or sign up with email</span>
            <div className="flex-1" style={{ borderTop: "1px solid #D9CFC7" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="First name" required className="rounded-xl px-4 py-3 text-sm outline-none focus:ring-2" style={inputStyle} />
              <input placeholder="Last name" required className="rounded-xl px-4 py-3 text-sm outline-none focus:ring-2" style={inputStyle} />
            </div>

            <input type="email" placeholder="you@example.com" required className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2" style={inputStyle} />

            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid #D9CFC7", backgroundColor: "#F9F8F6" }}>
              <select className="px-3 py-3 text-sm bg-transparent outline-none" style={{ borderRight: "1px solid #D9CFC7" }}>
                <option>🇺🇸 +1</option>
                <option>🇬🇧 +44</option>
                <option>🇮🇳 +91</option>
                <option>🇩🇪 +49</option>
              </select>
              <input type="tel" placeholder="Phone number" className="flex-1 px-4 py-3 text-sm bg-transparent outline-none" />
            </div>

            <div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Create password"
                  required
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-2"
                  style={inputStyle}
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "#6B6B6B" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pw && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full"
                        style={{ backgroundColor: i < score ? colors[score - 1] : "#D9CFC7" }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
                    Password strength: {labels[Math.max(0, score - 1)]}
                  </p>
                </div>
              )}
            </div>

            <div>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                style={inputStyle}
              />
              {confirm && confirm !== pw && (
                <p className="text-xs mt-1" style={{ color: "#E05A20" }}>Passwords don't match</p>
              )}
            </div>

            <div>
              <label className="text-xs mb-1 block" style={{ color: "#6B6B6B" }}>Date of birth (optional)</label>
              <div className="grid grid-cols-3 gap-2">
                <select className="rounded-xl px-3 py-3 text-sm outline-none" style={inputStyle}>
                  <option>Day</option>
                  {Array.from({ length: 31 }, (_, i) => <option key={i}>{i + 1}</option>)}
                </select>
                <select className="rounded-xl px-3 py-3 text-sm outline-none" style={inputStyle}>
                  <option>Month</option>
                  {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => <option key={m}>{m}</option>)}
                </select>
                <select className="rounded-xl px-3 py-3 text-sm outline-none" style={inputStyle}>
                  <option>Year</option>
                  {Array.from({ length: 80 }, (_, i) => <option key={i}>{2026 - 16 - i}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-start gap-2 text-xs leading-relaxed cursor-pointer" style={{ color: "#6B6B6B" }}>
                <input type="checkbox" required className="mt-0.5 accent-[#1A1A1A]" defaultChecked />
                <span>I agree to ShopNova's <a className="underline" style={{ color: "#C9B59C" }}>Terms of Service</a> and <a className="underline" style={{ color: "#C9B59C" }}>Privacy Policy</a></span>
              </label>
              <label className="flex items-start gap-2 text-xs leading-relaxed cursor-pointer" style={{ color: "#6B6B6B" }}>
                <input type="checkbox" className="mt-0.5 accent-[#1A1A1A]" />
                <span>Send me deals, updates and personalised recommendations</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl font-semibold text-base text-white mt-2 transition-colors hover:bg-[#333]"
              style={{ backgroundColor: "#1A1A1A" }}
            >
              Create Free Account →
            </button>
          </form>

          <p className="text-sm text-center mt-4" style={{ color: "#6B6B6B" }}>
            Already have an account?{" "}
            <Link to="/login" className="font-medium" style={{ color: "#C9B59C" }}>
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
