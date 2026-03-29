import * as React from "react";
import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { getAuthOptions, removeAuthToken } from "@/lib/api-utils";
import { LayoutDashboard, Compass, GraduationCap, LogOut, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

/* ── EduNode Logo — hexagon with 75% progress ring ─────────────── */
function EduNodeLogo({ size = 36 }: { size?: number }) {
  /* Circle maths: r=10, circumference=62.83, 75%=47.12 */
  const r = 10;
  const circ = 2 * Math.PI * r; /* 62.83 */
  const fill75 = circ * 0.75;   /* 47.12 */

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Hexagon body — navy fill with slight cyan glow */}
      <path
        d="M20 2L35.59 11V29L20 38L4.41 29V11L20 2Z"
        fill="#1E3A8A"
        filter="url(#glow)"
      />
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.2" result="blur" />
          <feFlood floodColor="#06B6D4" floodOpacity="0.35" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="shadow" />
          <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Progress ring track */}
      <circle
        cx="20" cy="20" r={r}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="2.4"
      />

      {/* Progress ring fill — 75% cyan */}
      <circle
        cx="20" cy="20" r={r}
        fill="none"
        stroke="#06B6D4"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={`${fill75} ${circ}`}
        transform="rotate(-90 20 20)"
      />

      {/* Small dot marker at 75% */}
      <circle cx="20" cy="10" r="1.4" fill="white" opacity="0.8"
        transform={`rotate(${0.75 * 360} 20 20)`} />
    </svg>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe(getAuthOptions());

  React.useEffect(() => {
    if (isError) {
      removeAuthToken();
      setLocation("/login");
    }
  }, [isError, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    removeAuthToken();
    setLocation("/login");
  };

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/courses", label: "Browse Courses", icon: Compass },
    ...(user.role === "instructor"
      ? [{ href: "/instructor/dashboard", label: "Instructor Panel", icon: GraduationCap }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Dark navy sidebar ── */}
      <aside className="fixed inset-y-0 left-0 w-64 sidebar-panel flex flex-col z-40">

        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-white/[0.07]">
          <EduNodeLogo size={36} />
          <div>
            <span className="font-display font-bold text-[1.15rem] tracking-tight text-white leading-none">
              Edu<span style={{ color: "#06B6D4" }}>Node</span>
            </span>
            <p className="text-[10px] text-white/35 leading-none mt-0.5 font-medium tracking-wide">
              Connecting Knowledge & Progress
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-sm font-medium ${
                    isActive
                      ? "text-white"
                      : "text-white/45 hover:text-white/80 hover:bg-white/[0.06]"
                  }`}
                  style={isActive ? {
                    background: "linear-gradient(135deg, rgba(6,182,212,0.18), rgba(30,58,138,0.35))",
                    borderLeft: "3px solid #06B6D4",
                    paddingLeft: "calc(0.875rem - 3px)",
                  } : {}}
                >
                  <item.icon
                    size={17}
                    style={isActive ? { color: "#06B6D4" } : {}}
                  />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Role badge */}
        <div className="px-4 pb-2">
          <div
            className="px-3 py-1.5 rounded-lg text-center text-xs font-semibold tracking-wider uppercase"
            style={{
              background: user.role === "instructor"
                ? "rgba(6,182,212,0.15)"
                : "rgba(255,255,255,0.06)",
              color: user.role === "instructor" ? "#06B6D4" : "rgba(255,255,255,0.4)",
              border: user.role === "instructor"
                ? "1px solid rgba(6,182,212,0.3)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {user.role === "instructor" ? "⚡ Instructor" : "Student"}
          </div>
        </div>

        {/* User card */}
        <div className="p-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.06]">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ background: "linear-gradient(135deg, #1E3A8A, #06B6D4)" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate leading-tight">{user.name}</p>
              <p className="text-xs text-white/35 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="text-white/30 hover:text-red-400 transition-colors shrink-0"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content area ── */}
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top accent bar */}
        <div className="h-1 w-full" style={{
          background: "linear-gradient(90deg, #1E3A8A, #06B6D4, #1E3A8A)",
        }} />

        <div className="flex-1 p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
