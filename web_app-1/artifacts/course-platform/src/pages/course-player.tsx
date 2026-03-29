import * as React from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetCourse,
  useGetCourseProgress,
  useCompleteLesson,
} from "@workspace/api-client-react";
import { getAuthOptions } from "@/lib/api-utils";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  Loader2,
  Lock,
  BookOpen,
  Clock,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  Trophy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

/* ─── helpers ────────────────────────────────────────────────────── */
function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ─── component ──────────────────────────────────────────────────── */
export default function CoursePlayer() {
  const { courseId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = parseInt(courseId || "0");

  const { data: course, isLoading: courseLoading } = useGetCourse(id, getAuthOptions());
  const { data: progress, refetch: refetchProgress } = useGetCourseProgress(id, getAuthOptions());
  const completeMutation = useCompleteLesson(getAuthOptions());

  const [activeLessonId, setActiveLessonId] = React.useState<number | null>(null);
  /* Track which modules are expanded in the sidebar */
  const [expandedModules, setExpandedModules] = React.useState<Set<number>>(new Set());
  /* Mobile sidebar toggle */
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  /* Flat ordered lesson list for prev/next navigation */
  const allLessons = React.useMemo(
    () => (course?.modules ?? []).flatMap((m) => m.lessons),
    [course],
  );

  const activeIndex = allLessons.findIndex((l) => l.id === activeLessonId);
  const prevLesson = activeIndex > 0 ? allLessons[activeIndex - 1] : null;
  const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
  const activeLesson = allLessons[activeIndex] ?? null;

  /* Init: open first module containing an incomplete lesson */
  React.useEffect(() => {
    if (!course || !progress || activeLessonId) return;

    const completed = progress.completedLessons ?? [];
    let foundLesson: number | null = null;
    const toOpen = new Set<number>();

    for (const mod of course.modules) {
      for (const les of mod.lessons) {
        if (!completed.includes(les.id) && foundLesson === null) {
          foundLesson = les.id;
          toOpen.add(mod.id);
        }
      }
    }

    if (!foundLesson && course.modules[0]?.lessons[0]) {
      foundLesson = course.modules[0].lessons[0].id;
      toOpen.add(course.modules[0].id);
    }

    setActiveLessonId(foundLesson);
    setExpandedModules(toOpen);
  }, [course, progress, activeLessonId]);

  /* Auto-expand the module of the active lesson */
  React.useEffect(() => {
    if (!course || !activeLessonId) return;
    for (const mod of course.modules) {
      if (mod.lessons.some((l) => l.id === activeLessonId)) {
        setExpandedModules((prev) => new Set([...prev, mod.id]));
        break;
      }
    }
  }, [activeLessonId, course]);

  const toggleModule = (modId: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });
  };

  const handleMarkComplete = () => {
    if (!activeLessonId || isCompleted) return;
    completeMutation.mutate(
      { courseId: id, lessonId: activeLessonId },
      {
        onSuccess: () => {
          toast({ title: "Lesson completed! 🎉", description: "Keep up the great work." });
          refetchProgress();
          /* Auto-advance to next lesson */
          if (nextLesson) setActiveLessonId(nextLesson.id);
        },
      },
    );
  };

  const isCompleted = progress?.completedLessons.includes(activeLessonId ?? 0) ?? false;
  const completedCount = progress?.completedLessons.length ?? 0;
  const totalLessons = course?.totalLessons ?? 0;
  const pct = progress?.progressPercentage ?? 0;

  /* ── loading / error states ─────────────────────────────────────── */
  if (courseLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f0f]">
        <Loader2 className="animate-spin text-purple-500 w-10 h-10" />
      </div>
    );
  }

  if (!course || !progress) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#0f0f0f] text-white gap-4">
        <p className="text-lg text-white/60">Could not load course. Are you enrolled?</p>
        <button
          onClick={() => setLocation(`/courses/${id}`)}
          className="px-6 py-2 bg-purple-600 rounded-lg text-sm font-medium hover:bg-purple-700 transition"
        >
          Go to Course Page
        </button>
      </div>
    );
  }

  /* ── sidebar inner ─────────────────────────────────────────────── */
  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#141414]">
      {/* Sidebar header */}
      <div className="px-5 py-4 border-b border-white/[0.07] shrink-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-1">Course Content</p>
        <h2 className="font-bold text-white text-sm line-clamp-2 leading-snug">{course.title}</h2>

        {/* Overall progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-white/50 mb-1.5">
            <span>{completedCount}/{totalLessons} lessons</span>
            <span>{Math.round(pct)}% done</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>

      {/* Module list */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {course.modules.map((mod, mIdx) => {
          const isOpen = expandedModules.has(mod.id);
          const modCompletedCount = mod.lessons.filter((l) =>
            progress.completedLessons.includes(l.id),
          ).length;
          const modPct = mod.lessons.length > 0 ? (modCompletedCount / mod.lessons.length) * 100 : 0;

          return (
            <div key={mod.id} className="border-b border-white/[0.05]">
              {/* Module header (clickable to expand) */}
              <button
                onClick={() => toggleModule(mod.id)}
                className="w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-white/[0.03] transition-colors group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                      Section {mIdx + 1}
                    </span>
                    <span className="text-[10px] text-white/30">
                      · {modCompletedCount}/{mod.lessons.length}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-white/85 group-hover:text-white leading-snug">
                    {mod.title}
                  </p>

                  {/* Mini progress bar per module */}
                  <div className="mt-2 h-0.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${modPct}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 mt-1 text-white/30 group-hover:text-white/60 transition-colors">
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {/* Lesson list */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {mod.lessons.map((lesson, lIdx) => {
                      const isActive = activeLessonId === lesson.id;
                      const isDone = progress.completedLessons.includes(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            setActiveLessonId(lesson.id);
                            setSidebarOpen(false);
                          }}
                          className={`w-full text-left flex items-start gap-3 px-5 py-3 transition-all relative group/lesson ${
                            isActive
                              ? "bg-purple-600/15 border-l-2 border-purple-500"
                              : "border-l-2 border-transparent hover:bg-white/[0.02]"
                          }`}
                        >
                          {/* Status icon */}
                          <div className="shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full">
                            {isDone ? (
                              <CheckCircle2 size={16} className="text-green-400" />
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-white" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-white/20 group-hover/lesson:border-white/40 transition-colors" />
                            )}
                          </div>

                          {/* Lesson info */}
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-[12.5px] leading-snug font-medium ${
                                isActive ? "text-white" : isDone ? "text-white/50" : "text-white/70"
                              }`}
                            >
                              {lIdx + 1}. {lesson.title}
                            </p>
                            {lesson.duration > 0 && (
                              <p className="text-[11px] text-white/30 mt-0.5 flex items-center gap-1">
                                <Clock size={10} />
                                {fmtDuration(lesson.duration)}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Completion trophy at the bottom */}
        {pct === 100 && (
          <div className="p-5 flex flex-col items-center gap-2 text-center">
            <Trophy className="text-yellow-400 w-8 h-8" />
            <p className="text-sm font-semibold text-white">Course Complete!</p>
            <p className="text-xs text-white/40">You've finished all lessons.</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ── main render ──────────────────────────────────────────────── */
  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] overflow-hidden">
      {/* ── Top Navbar ── */}
      <header className="h-14 shrink-0 flex items-center justify-between px-4 gap-4 z-30 bg-[#0f0f0f]/95 backdrop-blur-md border-b border-white/[0.07]">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setLocation(`/courses/${id}`)}
            className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm shrink-0"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <h1 className="font-semibold text-white text-sm truncate">{course.title}</h1>
        </div>

        {/* Center — global progress */}
        <div className="hidden md:flex items-center gap-3 flex-1 max-w-xs mx-auto">
          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <span className="text-xs font-semibold text-white/60 shrink-0">{Math.round(pct)}%</span>
        </div>

        {/* Right — lesson counter */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-white/40 hidden sm:block">
            {completedCount}/{totalLessons}
          </span>
          <div className="flex items-center gap-1">
            <BookOpen size={14} className="text-purple-400" />
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 380, damping: 40 }}
                className="fixed right-0 top-14 bottom-0 w-80 z-50 lg:hidden shadow-2xl"
              >
                <div className="absolute top-3 left-3 z-10">
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                <SidebarContent />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ── Main video area ── */}
        <main className="flex-1 overflow-y-auto bg-[#0f0f0f]">
          <AnimatePresence mode="wait">
            {activeLesson ? (
              <motion.div
                key={activeLesson.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Netflix-style: video spans full width, dark background */}
                <div className="w-full bg-black">
                  <div className="max-w-[1100px] mx-auto">
                    <div className="aspect-video w-full relative">
                      <iframe
                        key={activeLesson.id}
                        src={activeLesson.videoUrl}
                        title={activeLesson.title}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ border: "none" }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Lesson info panel ── */}
                <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-6">
                  {/* Breadcrumb */}
                  <p className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-2">
                    {course.modules.find((m) => m.lessons.some((l) => l.id === activeLesson.id))?.title}
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-2">
                        {activeLesson.title}
                      </h2>
                      {/* Stats row */}
                      <div className="flex items-center gap-4 text-xs text-white/40 flex-wrap">
                        {activeLesson.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {fmtDuration(activeLesson.duration)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <BarChart2 size={12} />
                          {course.level}
                        </span>
                        <span>Lesson {activeIndex + 1} of {totalLessons}</span>
                      </div>
                    </div>

                    {/* Complete button */}
                    <button
                      onClick={handleMarkComplete}
                      disabled={isCompleted || completeMutation.isPending}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shrink-0 ${
                        isCompleted
                          ? "bg-green-500/15 text-green-400 border border-green-500/25 cursor-default"
                          : "bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/40 hover:-translate-y-0.5 active:translate-y-0"
                      }`}
                    >
                      {completeMutation.isPending ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {isCompleted ? "Completed" : "Mark Complete"}
                    </button>
                  </div>

                  {/* Divider */}
                  <div className="my-5 border-t border-white/[0.07]" />

                  {/* Prev / Next navigation */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => prevLesson && setActiveLessonId(prevLesson.id)}
                      disabled={!prevLesson}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/30 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">
                        {prevLesson ? prevLesson.title : "Previous"}
                      </span>
                      <span className="sm:hidden">Prev</span>
                    </button>

                    {/* Dot progress */}
                    <div className="hidden sm:flex items-center gap-1">
                      {allLessons.map((l) => {
                        const done = progress.completedLessons.includes(l.id);
                        const active = l.id === activeLessonId;
                        return (
                          <button
                            key={l.id}
                            onClick={() => setActiveLessonId(l.id)}
                            className={`rounded-full transition-all duration-200 ${
                              active
                                ? "w-4 h-2 bg-purple-500"
                                : done
                                ? "w-2 h-2 bg-green-500/60"
                                : "w-2 h-2 bg-white/15 hover:bg-white/30"
                            }`}
                            title={l.title}
                          />
                        );
                      })}
                    </div>

                    <button
                      onClick={() => nextLesson && setActiveLessonId(nextLesson.id)}
                      disabled={!nextLesson}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/30 disabled:opacity-25 disabled:cursor-not-allowed transition-all"
                    >
                      <span className="hidden sm:inline">
                        {nextLesson ? nextLesson.title : "Next"}
                      </span>
                      <span className="sm:hidden">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-white/30 h-64">
                <div className="text-center">
                  <PlayCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Select a lesson to begin</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Desktop sidebar ── */}
        <aside className="hidden lg:flex flex-col w-80 xl:w-96 shrink-0 border-l border-white/[0.07] overflow-hidden">
          <SidebarContent />
        </aside>
      </div>
    </div>
  );
}
