import * as React from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useRegister } from "@workspace/api-client-react";
import { setAuthToken } from "@/lib/api-utils";
import { BookOpen, Loader2, UserPlus, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["student", "instructor"])
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "student" }
  });

  const selectedRole = watch("role");

  const onSubmit = (data: RegisterForm) => {
    registerMutation.mutate({ data }, {
      onSuccess: (res) => {
        setAuthToken(res.token);
        toast({ title: "Account created!", description: "Welcome to LuminaLearn." });
        setLocation("/");
      },
      onError: (err: any) => {
        toast({ 
          title: "Registration failed", 
          description: err.response?.data?.error || "An error occurred", 
          variant: "destructive" 
        });
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background py-10">
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} alt="Background" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-8 sm:p-10 glass-panel rounded-3xl"
      >
        <div className="flex flex-col items-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-muted-foreground text-center">Join thousands of learners and creators.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setValue("role", "student")}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                selectedRole === "student" 
                  ? "bg-primary/20 border-primary shadow-inner shadow-primary/20 text-white" 
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              }`}
            >
              <BookOpen size={24} className={selectedRole === "student" ? "text-primary" : ""} />
              <span className="font-medium text-sm">Student</span>
            </button>
            <button
              type="button"
              onClick={() => setValue("role", "instructor")}
              className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all ${
                selectedRole === "instructor" 
                  ? "bg-accent/20 border-accent shadow-inner shadow-accent/20 text-white" 
                  : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10"
              }`}
            >
              <Sparkles size={24} className={selectedRole === "instructor" ? "text-accent" : ""} />
              <span className="font-medium text-sm">Instructor</span>
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/90 ml-1">Full Name</label>
            <input 
              {...register("name")}
              type="text"
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {errors.name && <p className="text-red-400 text-xs ml-1">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/90 ml-1">Email Address</label>
            <input 
              {...register("email")}
              type="email"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {errors.email && <p className="text-red-400 text-xs ml-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-white/90 ml-1">Password</label>
            <input 
              {...register("password")}
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {errors.password && <p className="text-red-400 text-xs ml-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={registerMutation.isPending}
            className="w-full mt-6 flex items-center justify-center gap-2 py-4 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-white font-semibold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {registerMutation.isPending ? <Loader2 className="animate-spin" /> : (
              <>Create Account <UserPlus size={18} /></>
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
