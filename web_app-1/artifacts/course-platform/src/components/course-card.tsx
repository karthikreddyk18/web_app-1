import * as React from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, User, PlayCircle, CheckCircle2, ChevronRight } from "lucide-react";
import type { Course } from "@workspace/api-client-react/src/generated/api.schemas";
import { ProgressBar } from "./ui/progress-bar";

interface CourseCardProps {
  course: Course;
  progress?: number;
  isEnrolled?: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-emerald-100 text-emerald-700 border-emerald-200",
  intermediate: "bg-amber-100 text-amber-700 border-amber-200",
  advanced: "bg-rose-100 text-rose-700 border-rose-200",
};

export function CourseCard({ course, progress, isEnrolled }: CourseCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: "0 12px 32px -4px rgba(30,58,138,0.18)" }}
      transition={{ duration: 0.2 }}
      className="group flex flex-col h-full overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_-2px_rgba(30,58,138,0.08)] transition-all"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #dbeafe, #e0f2fe)" }}
          >
            <BookOpen className="w-10 h-10 text-blue-300" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold rounded-md border uppercase tracking-wider ${
              LEVEL_COLORS[course.level] ?? "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {course.level}
          </span>
        </div>

        {/* Category pill — bottom right */}
        <span
          className="absolute bottom-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full text-white"
          style={{ background: "rgba(30,58,138,0.85)", backdropFilter: "blur(6px)" }}
        >
          {course.category}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-display text-base font-bold text-slate-800 line-clamp-2 leading-snug mb-1.5 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1 leading-relaxed">
          {course.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-accent" />
            <span className="font-medium">{course.instructor?.name || "Instructor"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <PlayCircle size={12} className="text-primary" />
            <span>{course.totalLessons} Lessons</span>
          </div>
        </div>

        {isEnrolled ? (
          <div className="space-y-3 mt-auto">
            <ProgressBar value={progress || 0} showLabel />
            <Link href={`/learn/${course.id}`}>
              <span className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all text-white"
                style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
              >
                {progress === 100 ? (
                  <><CheckCircle2 size={15} className="text-cyan-300" /> Review Course</>
                ) : (
                  <><PlayCircle size={15} /> Continue Learning</>
                )}
              </span>
            </Link>
          </div>
        ) : (
          <div className="mt-auto">
            <Link href={`/courses/${course.id}`}>
              <span className="flex w-full items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all text-primary border-2 border-primary/20 hover:bg-primary hover:text-white hover:border-primary group-hover:bg-primary group-hover:text-white group-hover:border-primary">
                View Details <ChevronRight size={14} />
              </span>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
