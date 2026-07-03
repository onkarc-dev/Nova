import { ReactNode } from "react";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Heart,
  MapPin,
  CreditCard,
  Bell,
  Settings,
  Gift,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { AnnouncementBar, Navbar, Footer } from "@/routes/index";

const navItems = [
  { to: "/account/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/account/orders", label: "My Orders", icon: Package },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart },
  { to: "/account/addresses", label: "Addresses", icon: MapPin },
  { to: "/account/payments", label: "Payment Methods", icon: CreditCard },
  { to: "/account/notifications", label: "Notifications", icon: Bell },
  { to: "/account/settings", label: "Account Settings", icon: Settings },
];

const secondaryItems = [
  { to: "/account/dashboard", label: "Nova Prime", icon: Gift, color: "#1A1A1A" },
  { to: "/account/dashboard", label: "Help & Support", icon: MessageCircle, color: "#6B6B6B" },
];

export function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F9F8F6" }}>
      <AnnouncementBar />
      <Navbar />
      <div className="mx-auto max-w-[1280px] px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-[260px] shrink-0">
            <div
              className="bg-white rounded-2xl p-6 lg:sticky lg:top-[90px]"
              style={{ border: "1px solid #D9CFC7", height: "fit-content" }}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl"
                  style={{ backgroundColor: "#EFE9E3", color: "#1A1A1A" }}
                >
                  JM
                </div>
                <button className="text-xs mt-1 cursor-pointer" style={{ color: "#C9B59C" }}>
                  Edit Photo
                </button>
                <div className="font-bold mt-3" style={{ color: "#1A1A1A" }}>
                  Jay Mahajan
                </div>
                <div className="text-xs" style={{ color: "#6B6B6B" }}>
                  jaymahajan987@gmail.com
                </div>
                <div
                  className="text-xs rounded-full px-3 py-1 mt-2 text-white"
                  style={{ backgroundColor: "#1A1A1A" }}
                >
                  ✦ Nova Prime Member
                </div>
              </div>
              <div className="my-4" style={{ borderTop: "1px solid #D9CFC7" }} />

              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const active = pathname.startsWith(item.to);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all"
                      style={{
                        backgroundColor: active ? "#EFE9E3" : "transparent",
                        color: active ? "#1A1A1A" : "#6B6B6B",
                        fontWeight: active ? 500 : 400,
                        borderLeft: active ? "3px solid #C9B59C" : "3px solid transparent",
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <div className="my-2" style={{ borderTop: "1px solid #D9CFC7" }} />
                {secondaryItems.map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={i}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-[#F9F8F6]"
                      style={{ color: item.color }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
                <button
                  onClick={() => navigate({ to: "/login" })}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all hover:bg-[#F9F8F6]"
                  style={{ color: "#E05A20" }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </nav>

              <div
                className="rounded-xl p-4 mt-6"
                style={{ backgroundColor: "#EFE9E3", border: "1px solid #D9CFC7" }}
              >
                <div className="text-sm font-semibold" style={{ color: "#1A1A1A" }}>
                  ✦ Upgrade to Prime
                </div>
                <div className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
                  Get free same-day delivery
                </div>
                <button
                  className="rounded-full px-4 py-2 text-xs mt-3 w-full text-white"
                  style={{ backgroundColor: "#1A1A1A" }}
                >
                  Try Free for 30 Days →
                </button>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    Delivered: { bg: "#E8F5E9", text: "#00A86B" },
    Shipped: { bg: "#EFE9E3", text: "#C9B59C" },
    Processing: { bg: "#FFF3E0", text: "#E05A20" },
    Cancelled: { bg: "#FFEBEE", text: "#E53935" },
  };
  const c = colors[status] ?? colors.Processing;
  return (
    <span
      className="text-xs font-medium rounded-full px-3 py-1"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {status}
    </span>
  );
}
