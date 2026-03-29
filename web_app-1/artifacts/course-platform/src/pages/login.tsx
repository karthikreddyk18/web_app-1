import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useLogin } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/api-utils";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ── Zod schema ─────────────────────────────────────────────────── */
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type LoginForm = z.infer<typeof loginSchema>;

/* ── EduNode SVG Logo ───────────────────────────────────────────── */
function EduNodeLogo({ size = 52 }: { size?: number }) {
  const r = 10;
  const circ = 2 * Math.PI * r;
  const fill75 = circ * 0.75;

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d="M20 2L35.59 11V29L20 38L4.41 29V11L20 2Z" fill="#1E3A8A" />
      <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" />
      <circle
        cx="20" cy="20" r={r} fill="none"
        stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round"
        strokeDasharray={`${fill75} ${circ}`}
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}

/* ── Floating particles (cyan + navy palette) ───────────────────── */
function ParticleBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    type Particle = {
      x: number; y: number; r: number; vx: number; vy: number;
      alpha: number; alphaDir: number; color: string;
    };

    const COLORS = ["rgba(30,58,138,{a})", "rgba(6,182,212,{a})", "rgba(37,99,235,{a})"];
    const COUNT = 48;

    const particles: Particle[] = Array.from({ length: COUNT }, () => {
      const template = COLORS[Math.floor(Math.random() * COLORS.length)];
      const alpha = Math.random() * 0.25 + 0.06;
      return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        r: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.22,
        vy: -(Math.random() * 0.2 + 0.06),
        alpha,
        alphaDir: Math.random() > 0.5 ? 1 : -1,
        color: template.replace("{a}", String(alpha)),
      };
    });

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.alpha += p.alphaDir * 0.003;
        if (p.alpha > 0.35 || p.alpha < 0.04) p.alphaDir *= -1;

        const alpha = Math.max(0.04, Math.min(0.35, p.alpha));
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -4) p.y = canvas.height + 4;
        if (p.x < -4) p.x = canvas.width + 4;
        if (p.x > canvas.width + 4) p.x = -4;

        const colorStr = p.color.replace(/rgba\((\d+),(\d+),(\d+),[^)]+\)/, `rgba($1,$2,$3,${alpha})`);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = colorStr;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
}

/* ── Framer variants ─────────────────────────────────────────────── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};
const cardIn = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

/* ── Input style helper ──────────────────────────────────────────── */
const inputBase =
  "w-full px-4 py-3 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border border-slate-200";

/* ── Main component ──────────────────────────────────────────────── */
export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate({ data }, {
      onSuccess: (res) => {
        setAuthToken(res.token);
        toast({ title: "Welcome to EduNode!", description: "Successfully logged in." });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({
          title: "Login failed",
          description: err.response?.data?.error || "Invalid credentials",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, #F8FAFC 0%, #EFF6FF 50%, #ECFEFF 100%)" }}
    >
      {/* Particles */}
      <ParticleBackground />

      {/* Subtle dot-grid overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: "radial-gradient(#1E3A8A 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Left decorative panel (hidden on mobile) ── */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] relative z-10 p-12"
        style={{ background: "linear-gradient(160deg, #1E3A8A 0%, #1d4ed8 60%, #0891b2 100%)" }}
      >
        {/* Top brand */}
        <div className="flex items-center gap-3">
          <EduNodeLogo size={40} />
          <span className="font-display font-bold text-2xl text-white tracking-tight">
            Edu<span style={{ color: "#06B6D4" }}>Node</span>
          </span>
        </div>

        {/* Centre copy */}
        <div>
          <h2 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Connecting<br />Knowledge &<br />Progress.
          </h2>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            A structured learning platform built for students who value clarity, progress, and results.
          </p>

          {/* Fake stat pills */}
          <div className="mt-8 flex flex-col gap-3">
            {[
              { label: "Active Learners", value: "2,400+" },
              { label: "Courses Available", value: "120+" },
              { label: "Avg. Completion Rate", value: "78%" },
            ].map((s) => (
              <div key={s.label}
                className="flex items-center justify-between px-4 py-2.5 rounded-xl"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <span className="text-white/60 text-xs">{s.label}</span>
                <span className="text-white font-bold text-sm">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-white/30 text-xs">© 2025 EduNode · KITSW</p>
      </div>

      {/* ── Right: Login form ── */}
      <div className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div
          variants={cardIn}
          initial="hidden"
          animate="show"
          className="w-full max-w-sm"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <EduNodeLogo size={32} />
            <span className="font-display font-bold text-xl text-slate-800">
              Edu<span className="text-cyan-500">Node</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-[0_8px_40px_-8px_rgba(30,58,138,0.18)] border border-slate-100 p-8">
            {/* Heading */}
            <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-7">
              <h1 className="font-display text-2xl font-bold text-slate-800 mb-1">
                Sign in to your account
              </h1>
              <p className="text-sm text-slate-500">
                Welcome back — ready to learn something new?
              </p>
            </motion.div>

            {/* Staggered form */}
            <motion.form
              onSubmit={handleSubmit(onSubmit)}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="space-y-4"
            >
              {/* Email */}
              <motion.div variants={fadeUp} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  {...register("email")}
                  type="email"
                  placeholder="you@example.com"
                  className={inputBase}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1E3A8A";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30,58,138,0.1)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.background = "";
                  }}
                />
                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
              </motion.div>

              {/* Password */}
              <motion.div variants={fadeUp} className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <input
                  {...register("password")}
                  type="password"
                  placeholder="••••••••"
                  className={inputBase}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#1E3A8A";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(30,58,138,0.1)";
                    e.currentTarget.style.background = "#fff";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "";
                    e.currentTarget.style.boxShadow = "";
                    e.currentTarget.style.background = "";
                  }}
                />
                {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
              </motion.div>

              {/* Demo hint */}
              <motion.div variants={fadeUp}>
                <div className="rounded-lg px-3 py-2 text-xs text-cyan-700 bg-cyan-50 border border-cyan-200/60">
                  <strong>Demo:</strong> student@demo.com · instructor@demo.com · password123
                </div>
              </motion.div>

              {/* Submit */}
              <motion.div variants={fadeUp} className="pt-1">
                <motion.button
                  type="submit"
                  disabled={loginMutation.isPending}
                  whileHover={{ scale: 1.01, y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-sm transition-opacity disabled:opacity-50"
                  style={{
                    background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #06B6D4 100%)",
                    boxShadow: "0 4px 16px rgba(30,58,138,0.3)",
                  }}
                >
                  {loginMutation.isPending
                    ? <Loader2 className="animate-spin w-4 h-4" />
                    : <><span>Sign In</span><ArrowRight size={15} /></>
                  }
                </motion.button>
              </motion.div>
            </motion.form>

            {/* Footer link */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="show"
              transition={{ delay: 0.65 }}
              className="mt-6 text-center text-sm text-slate-500"
            >
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Create one free
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
