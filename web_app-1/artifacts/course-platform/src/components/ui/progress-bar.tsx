import * as React from "react";
import { cn } from "@/lib/utils";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface ProgressBarProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
  showLabel?: boolean;
}

/**
 * EduNode spring-animated progress bar.
 * Animates from 0 → target using spring physics (stiffness 60, damping 18).
 * Uses navy → cyan gradient matching the Oceanic Professional theme.
 */
export function ProgressBar({
  value,
  className,
  indicatorClassName,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const raw = useMotionValue(0);
  const springValue = useSpring(raw, { stiffness: 60, damping: 18, mass: 0.8 });
  const widthPercent = useTransform(springValue, (v) => `${v}%`);

  React.useEffect(() => { raw.set(clamped); }, [clamped, raw]);

  return (
    <div className="w-full">
      <div
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-100", className)}
      >
        <motion.div
          className={cn("h-full rounded-full", indicatorClassName)}
          style={{
            width: widthPercent,
            background: "linear-gradient(90deg, #1E3A8A, #2563EB, #06B6D4)",
          }}
        />
      </div>

      {showLabel && (
        <div className="mt-1.5 flex justify-end">
          <span className="text-xs font-semibold text-slate-500">
            {Math.round(clamped)}% Complete
          </span>
        </div>
      )}
    </div>
  );
}
