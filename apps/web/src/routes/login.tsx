import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In — ShopNova" },
      { name: "description", content: "Sign in to your ShopNova account." },
    ],
  }),
  component: LoginPage,
});

function AuthLeftPanel() {
  return (
    <div
      className="hidden md:flex relative w-1/2 flex-col items-center justify-center p-12 overflow-hidden"
      style={{ backgroundColor: "#1A1A1A" }}
    >
      <div className="max-w-md w-full relative z-10">
        <div className="text-white font-bold text-3xl mb-4">✦ ShopNova</div>
        <div className="text-lg mb-12" style={{ color: "#6B6B6B" }}>
          Everything. Everywhere. Delivered.
        </div>
        <ul className="space-y-3">
          {[
            "Shop 50M+ products from global sellers",
            "Track orders in real-time worldwide",
            "Exclusive Nova Prime member deals",
          ].map((t) => (
            <li key={t} className="flex items-center gap-3 py-3">
              <span className="text-2xl" style={{ color: "#C9B59C" }}>✦</span>
              <span className="text-white text-sm">{t}</span>
            </li>
          ))}
        </ul>
      </div>
      <div
        className="absolute bottom-10 right-10 text-[10rem] leading-none pointer-events-none"
        style={{ color: "#C9B59C", opacity: 0.05 }}
      >
        ✦
      </div>
    </div>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return;
    setLoading(true);
    setTimeout(() => navigate({ to: "/account/dashboard" }), 600);
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F9F8F6" }}>
      <AuthLeftPanel />
      <div className="flex-1 flex items-center justify-center p-6">
        <div
          className="w-full max-w-[420px] rounded-3xl p-10 shadow-lg bg-white"
          style={{ border: "1px solid #D9CFC7" }}
        >
          <h2 className="text-2xl font-bold mb-1" style={{ color: "#1A1A1A" }}>
            Welcome back
          </h2>
          <p className="text-sm mb-8" style={{ color: "#6B6B6B" }}>
            Sign in to your ShopNova account
          </p>

          <div className="grid grid-cols-2 gap-3">
            {[
              { l: "G", t: "Google" },
              { l: "", t: "Apple" },
            ].map((o) => (
              <button
                key={o.t}
                className="rounded-xl py-3 font-medium text-sm bg-white transition-colors hover:bg-[#EFE9E3]"
                style={{ border: "1px solid #D9CFC7", color: "#1A1A1A" }}
              >
                {o.l} {o.t}
              </button>
            ))}
          </div>

          <div className="flex items-center my-6 gap-3">
            <div className="flex-1" style={{ borderTop: "1px solid #D9CFC7" }} />
            <span className="text-xs" style={{ color: "#6B6B6B" }}>or continue with email</span>
            <div className="flex-1" style={{ borderTop: "1px solid #D9CFC7" }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block" style={{ color: "#1A1A1A" }}>
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2"
                style={{
                  backgroundColor: "#F9F8F6",
                  border: "1px solid #D9CFC7",
                  ["--tw-ring-color" as any]: "rgba(201,181,156,0.2)",
                }}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium" style={{ color: "#1A1A1A" }}>
                  Password
                </label>
                <a href="#" className="text-sm" style={{ color: "#C9B59C" }}>
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-2"
                  style={{
                    backgroundColor: "#F9F8F6",
                    border: "1px solid #D9CFC7",
                    ["--tw-ring-color" as any]: "rgba(201,181,156,0.2)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#6B6B6B" }}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "#6B6B6B" }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded accent-[#1A1A1A]"
              />
              Remember me for 30 days
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-base text-white mt-2 transition-colors hover:bg-[#333]"
              style={{ backgroundColor: "#1A1A1A" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-sm text-center mt-4" style={{ color: "#6B6B6B" }}>
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium" style={{ color: "#C9B59C" }}>
              Create one free →
            </Link>
          </p>
          <p className="text-xs text-center mt-6" style={{ color: "#6B6B6B" }}>
            🔒 Your data is encrypted and secure
          </p>
        </div>
      </div>
    </div>
  );
}

export { AuthLeftPanel };
