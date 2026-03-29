import * as React from "react";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetCourse, useEnrollInCourse, useGetMyEnrollments } from "@workspace/api-client-react";
import { getAuthOptions } from "@/lib/api-utils";
import { PlayCircle, Clock, BookOpen, CheckCircle, ShieldCheck, Loader2, X, Rocket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDuration } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

/* ── Confetti burst ──────────────────────────────────────────────── */
function fireConfetti() {
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
  const rng = (min: number, max: number) => Math.random() * (max - min) + min;
  confetti({ ...defaults, particleCount: 80, origin: { x: rng(0.2, 0.4), y: 0.6 } });
  confetti({ ...defaults, particleCount: 80, origin: { x: rng(0.6, 0.8), y: 0.6 } });
}

/* ── Enrollment modal ────────────────────────────────────────────── */
function EnrolledModal({ course, onClose, onStart }: {
  course: { title: string }; onClose: () => void; onStart: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative z-10 w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl"
        initial={{ y: 80, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 60, opacity: 0, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
      >
        {/* Top accent bar */}
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #1E3A8A, #06B6D4)" }} />

        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>

        <div className="p-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
            className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center shadow-xl"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #06B6D4)" }}
          >
            <Rocket className="w-9 h-9 text-white" />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
            className="text-2xl font-bold text-slate-800 mb-1.5"
          >
            You're Enrolled! 🎉
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="text-slate-500 text-sm mb-6 leading-relaxed"
          >
            Welcome to <span className="font-semibold text-primary">{course.title}</span>.<br />
            Your learning journey starts now.
          </motion.p>

          <motion.ul
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.32 }}
            className="text-left space-y-2 mb-6 px-2"
          >
            {["Full lifetime access to all lessons", "Track your progress in real-time", "Earn a completion certificate"].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                {item}
              </li>
            ))}
          </motion.ul>

          <motion.button
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            onClick={onStart}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
            style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB, #06B6D4)" }}
          >
            <PlayCircle size={18} /> Start Learning Now
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Main page ──────────────────────────────────────────────────── */
export default function CourseDetail() {
  const { courseId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const id = parseInt(courseId || "0");
  const { data: course, isLoading } = useGetCourse(id, getAuthOptions());
  const { data: enrollments, refetch: refetchEnrollments } = useGetMyEnrollments(getAuthOptions());
  const enrollMutation = useEnrollInCourse(getAuthOptions());

  const isEnrolled = enrollments?.some((e) => e.courseId === id);
  const [showModal, setShowModal] = React.useState(false);

  if (isLoading) return (
    <AppLayout>
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-primary w-8 h-8" />
      </div>
    </AppLayout>
  );

  if (!course) return <AppLayout><div className="p-8 text-slate-700">Course not found.</div></AppLayout>;

  const handleEnroll = () => {
    if (isEnrolled) { setLocation(`/learn/${id}`); return; }
    enrollMutation.mutate({ courseId: id }, {
      onSuccess: () => {
        refetchEnrollments();
        fireConfetti();
        setTimeout(fireConfetti, 350);
        setShowModal(true);
      },
      onError: () => toast({ title: "Failed to enroll", variant: "destructive" }),
    });
  };

  const totalDuration = course.modules.reduce(
    (acc, mod) => acc + mod.lessons.reduce((lAcc, l) => lAcc + (l.duration || 0), 0), 0
  );

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto pb-20">
        {/* ── Hero ── */}
        <div className="relative rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-[0_2px_20px_-4px_rgba(30,58,138,0.1)] mb-10">
          {/* BG thumbnail blur */}
          {course.thumbnail && (
            <div className="absolute inset-0 z-0">
              <img src={course.thumbnail} alt="" className="w-full h-full object-cover opacity-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
            </div>
          )}
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg, #1E3A8A, #06B6D4)" }} />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 p-8 lg:p-12 items-center">
            <div>
              <div className="flex gap-2 mb-4">
                <span className="px-3 py-1 text-xs font-bold rounded-full text-primary bg-blue-50 border border-blue-200 uppercase tracking-wider">
                  {course.category}
                </span>
                <span className="px-3 py-1 text-xs font-bold rounded-full text-cyan-700 bg-cyan-50 border border-cyan-200 uppercase tracking-wider">
                  {course.level}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-800 mb-4 leading-tight">
                {course.title}
              </h1>
              <p className="text-slate-600 text-base mb-7 leading-relaxed">{course.description}</p>

              <div className="flex flex-wrap items-center gap-5 mb-7 text-sm text-slate-600">
                <div className="flex items-center gap-2"><BookOpen size={16} className="text-primary" /> {course.totalLessons} Lessons</div>
                <div className="flex items-center gap-2"><Clock size={16} className="text-cyan-500" /> {formatDuration(totalDuration)}</div>
                <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-500" /> Certificate</div>
              </div>

              <motion.button
                onClick={handleEnroll}
                disabled={enrollMutation.isPending}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3.5 rounded-xl text-white font-bold text-base shadow-xl flex items-center gap-3 disabled:opacity-50 transition-all"
                style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 60%, #06B6D4 100%)", boxShadow: "0 8px 24px rgba(30,58,138,0.3)" }}
              >
                {enrollMutation.isPending ? <Loader2 className="animate-spin" /> : (
                  <>{isEnrolled ? "Continue Learning" : "Enroll Now"}<PlayCircle size={18} /></>
                )}
              </motion.button>
            </div>

            <div className="hidden lg:block">
              {course.thumbnail ? (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-xl border border-slate-200">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50">
                  <PlayCircle className="w-16 h-16 text-slate-300" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-display font-bold text-slate-800 mb-5">Course Curriculum</h2>
              <div className="space-y-3">
                {course.modules.map((module, mIdx) => (
                  <div key={module.id} className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <div className="px-5 py-4 bg-slate-50 flex items-center justify-between border-b border-slate-200">
                      <h3 className="font-semibold text-slate-800">Module {mIdx + 1}: {module.title}</h3>
                      <span className="text-xs text-slate-500 font-medium">{module.lessons.length} lessons</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {module.lessons.map((lesson, lIdx) => (
                        <div key={lesson.id} className="px-5 py-3.5 flex items-start gap-3.5 hover:bg-slate-50 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs text-slate-500 font-semibold border border-slate-200">
                            {lIdx + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-slate-700 font-medium text-sm mb-0.5">{lesson.title}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1"><PlayCircle size={12} /> Video</span>
                              {lesson.duration && <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(lesson.duration)}</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            {/* Instructor */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">Instructor</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow"
                  style={{ background: "linear-gradient(135deg, #1E3A8A, #06B6D4)" }}
                >
                  {course.instructor?.name?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{course.instructor?.name}</p>
                  <p className="text-xs text-slate-500">Expert Educator</p>
                </div>
              </div>
            </div>

            {/* Includes */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wide">This course includes</h3>
              <ul className="space-y-2.5">
                {[
                  "Full lifetime access",
                  "Access on all devices",
                  "Certificate of completion",
                  `${course.totalLessons} on-demand lessons`,
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <EnrolledModal
            course={course}
            onClose={() => setShowModal(false)}
            onStart={() => { setShowModal(false); setLocation(`/learn/${id}`); }}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}
