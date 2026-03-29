import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, useCreateCourse } from "@workspace/api-client-react";
import { getAuthOptions, getAuthToken } from "@/lib/api-utils";
import {
  Plus, BookOpen, Loader2, Users, BarChart2, ChevronRight, ChevronLeft,
  Trash2, PlusCircle, Check, ArrowLeft, Globe, Lock, GraduationCap, TrendingUp,
} from "lucide-react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "@/components/ui/progress-bar";

/* ── Zod schema ─────────────────────────────────────────────────── */
const lessonSchema = z.object({
  title: z.string().min(2, "Lesson title required"),
  videoUrl: z.string().url("Enter a valid video URL"),
  duration: z.coerce.number().min(0).optional(),
});
const moduleSchema = z.object({
  title: z.string().min(2, "Module title required"),
  lessons: z.array(lessonSchema).min(1, "Add at least one lesson"),
});
const courseSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  thumbnail: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  category: z.string().min(2, "Category required"),
  modules: z.array(moduleSchema).min(1, "Add at least one module"),
  isPublic: z.boolean().default(true),
});
type CourseForm = z.infer<typeof courseSchema>;

/* ── Step indicator ─────────────────────────────────────────────── */
const STEPS = [
  { label: "Metadata", description: "Basic info" },
  { label: "Curriculum", description: "Modules & lessons" },
  { label: "Settings", description: "Visibility & publish" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  background: done
                    ? "linear-gradient(135deg,#059669,#10B981)"
                    : active
                    ? "linear-gradient(135deg,#1E3A8A,#2563EB)"
                    : "#F1F5F9",
                  color: done || active ? "#fff" : "#94a3b8",
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2"
                style={{ borderColor: active ? "#1E3A8A" : done ? "#10B981" : "#e2e8f0" }}
              >
                {done ? <Check size={16} /> : i + 1}
              </motion.div>
              <div className="text-center">
                <p className={`text-xs font-semibold ${active ? "text-primary" : done ? "text-emerald-600" : "text-slate-400"}`}>
                  {step.label}
                </p>
              </div>
            </div>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px mx-2 mt-[-14px]" style={{
                background: done ? "#10B981" : "#e2e8f0",
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ── Form field style ────────────────────────────────────────────── */
const fieldClass =
  "w-full px-3.5 py-2.5 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all bg-slate-50 border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:bg-white";

/* ── Student progress table ─────────────────────────────────────── */
type StudentRow = {
  studentId: number; studentName: string; studentEmail: string;
  completedLessons: number; totalLessons: number;
  progressPercentage: number; enrolledAt: string; lastAccessedAt: string;
};

function StudentProgressPanel({ courseId, courseTitle }: { courseId: number; courseTitle: string }) {
  const [students, setStudents] = React.useState<StudentRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    fetch(`/api/instructor/courses/${courseId}/students`, {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    })
      .then((r) => r.json())
      .then((data) => { setStudents(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setError("Failed to load."); setLoading(false); });
  }, [courseId]);

  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (error) return <p className="text-red-500 text-sm py-4">{error}</p>;
  if (!students.length) return <p className="text-slate-400 text-sm py-6 text-center">No students enrolled yet.</p>;

  return (
    <div>
      <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide flex items-center gap-2">
        <GraduationCap size={16} className="text-primary" /> Students enrolled in "{courseTitle}"
      </h3>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Progress</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden md:table-cell">Lessons</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <motion.tr
                key={s.studentId}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #1E3A8A, #06B6D4)" }}
                    >
                      {s.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700 leading-tight">{s.studentName}</p>
                      <p className="text-slate-400 text-xs">{s.studentEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 min-w-[140px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1"><ProgressBar value={s.progressPercentage} /></div>
                    <span className="text-xs font-bold text-primary w-8 text-right">{Math.round(s.progressPercentage)}%</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-600 text-xs hidden md:table-cell">{s.completedLessons}/{s.totalLessons}</td>
                <td className="px-4 py-3.5 text-slate-400 text-xs hidden lg:table-cell">
                  {new Date(s.lastAccessedAt).toLocaleDateString()}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Instructor course card ─────────────────────────────────────── */
type InstructorCourse = {
  id: number; title: string; description: string; thumbnail?: string | null;
  level: string; category: string; totalLessons: number; enrolledCount: number; createdAt: string;
};

function CourseStatCard({ course, onViewStudents, isSelected }: {
  course: InstructorCourse; onViewStudents: () => void; isSelected: boolean;
}) {
  return (
    <motion.div layout
      className={`bg-white rounded-2xl overflow-hidden border transition-all shadow-sm ${
        isSelected ? "border-primary shadow-[0_4px_16px_rgba(30,58,138,0.15)]" : "border-slate-200 hover:border-slate-300 hover:shadow-md"
      }`}
    >
      <div className="aspect-video relative bg-slate-100">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
            <BookOpen className="w-10 h-10 text-blue-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <span className="absolute bottom-2 left-3 px-2 py-0.5 rounded-md text-[10px] font-bold text-white capitalize"
          style={{ background: "rgba(30,58,138,0.8)" }}
        >
          {course.level}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-slate-800 text-sm mb-0.5 line-clamp-2 leading-snug">{course.title}</h3>
        <p className="text-xs text-slate-500 mb-3">{course.category}</p>

        <div className="flex gap-3 text-xs text-slate-500 mb-3">
          <span className="flex items-center gap-1"><Users size={11} className="text-primary" />{course.enrolledCount} students</span>
          <span className="flex items-center gap-1"><BookOpen size={11} className="text-cyan-500" />{course.totalLessons} lessons</span>
        </div>

        <button onClick={onViewStudents}
          className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            isSelected
              ? "text-white"
              : "text-primary bg-blue-50 hover:bg-blue-100 border border-blue-100"
          }`}
          style={isSelected ? { background: "linear-gradient(135deg, #1E3A8A, #2563EB)" } : {}}
        >
          <BarChart2 size={12} />
          {isSelected ? "Viewing Students" : "View Student Progress"}
        </button>
      </div>
    </motion.div>
  );
}

/* ── Multi-step course builder ───────────────────────────────────── */
function CourseBuilder({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const [step, setStep] = React.useState(0);
  const [direction, setDirection] = React.useState(1);
  const { toast } = useToast();
  const createMutation = useCreateCourse(getAuthOptions());

  const form = useForm<CourseForm>({
    resolver: zodResolver(courseSchema),
    mode: "onChange",
    defaultValues: {
      level: "beginner", isPublic: true,
      modules: [{ title: "", lessons: [{ title: "", videoUrl: "", duration: 0 }] }],
    },
  });
  const { register, control, handleSubmit, watch, trigger, formState: { errors } } = form;
  const { fields: moduleFields, append: appendModule, remove: removeModule } = useFieldArray({ control, name: "modules" });

  const advance = async () => {
    let valid = false;
    if (step === 0) valid = await trigger(["title", "description", "category", "level", "thumbnail"]);
    else if (step === 1) valid = await trigger(["modules"]);
    else valid = true;
    if (valid) setStep((s) => s + 1);
  };

  const onSubmit = (data: CourseForm) => {
    const { isPublic: _unused, ...rest } = data;
    createMutation.mutate({ data: rest as any }, {
      onSuccess: () => {
        toast({ title: "Course published! 🎉" });
        onSuccess();
      },
      onError: (err: any) => toast({ title: "Failed to publish", description: err.message, variant: "destructive" }),
    });
  };

  const thumbnailUrl = watch("thumbnail");
  const isPublic = watch("isPublic");

  const pageVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_-4px_rgba(30,58,138,0.12)] overflow-hidden">
      {/* Top bar */}
      <div className="h-1" style={{ background: "linear-gradient(90deg, #1E3A8A, #06B6D4)" }} />

      <div className="px-6 pt-6 pb-0">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Create New Course</h2>
            <p className="text-xs text-slate-500">Step {step + 1} of {STEPS.length} — {STEPS[step].description}</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors text-sm flex items-center gap-1">
            <ArrowLeft size={14} /> Cancel
          </button>
        </div>
        <StepIndicator current={step} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-6 pb-6 min-h-[360px] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0 */}
            {step === 0 && (
              <motion.div key="s0" custom={direction} variants={pageVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Title *</label>
                    <input {...register("title")} placeholder="e.g. Complete Data Structures Course" className={fieldClass} />
                    {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description *</label>
                    <textarea {...register("description")} rows={3} placeholder="What will students learn?" className={fieldClass} />
                    {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category *</label>
                    <input {...register("category")} placeholder="e.g. Computer Science" className={fieldClass} />
                    {errors.category && <p className="text-red-500 text-xs">{errors.category.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Difficulty</label>
                    <select {...register("level")} className={fieldClass}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thumbnail URL (optional)</label>
                    <div className="flex gap-3">
                      <input {...register("thumbnail")} placeholder="https://images.unsplash.com/..." className={fieldClass} />
                      {thumbnailUrl && (
                        <img src={thumbnailUrl} alt="preview" className="w-16 h-11 rounded-lg object-cover border border-slate-200 shrink-0"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                      )}
                    </div>
                    {errors.thumbnail && <p className="text-red-500 text-xs">{errors.thumbnail.message}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <motion.div key="s1" custom={direction} variants={pageVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-3"
              >
                {moduleFields.map((modField, mIdx) => (
                  <ModuleSection key={modField.id} modIndex={mIdx} control={control} register={register} errors={errors}
                    onRemoveModule={() => removeModule(mIdx)} canRemove={moduleFields.length > 1}
                  />
                ))}
                <button type="button"
                  onClick={() => appendModule({ title: "", lessons: [{ title: "", videoUrl: "", duration: 0 }] })}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-primary/20 text-primary text-sm font-semibold flex items-center justify-center gap-2 hover:border-primary/40 hover:bg-blue-50 transition-colors"
                >
                  <PlusCircle size={15} /> Add Module
                </button>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div key="s2" custom={direction} variants={pageVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="space-y-5"
              >
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Visibility</p>
                  <Controller control={control} name="isPublic" render={({ field }) => (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { val: true, icon: Globe, label: "Public", desc: "Anyone can find & enroll" },
                        { val: false, icon: Lock, label: "Private", desc: "Invite-only access" },
                      ].map(({ val, icon: Icon, label, desc }) => (
                        <button key={String(val)} type="button" onClick={() => field.onChange(val)}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                            field.value === val
                              ? "border-primary bg-blue-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <Icon size={16} className={field.value === val ? "text-primary mt-0.5" : "text-slate-400 mt-0.5"} />
                          <div>
                            <p className={`text-sm font-bold ${field.value === val ? "text-primary" : "text-slate-600"}`}>{label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )} />
                </div>

                {/* Review */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Summary</p>
                  {[
                    { label: "Title", value: watch("title") },
                    { label: "Category", value: watch("category") },
                    { label: "Level", value: watch("level") },
                    { label: "Modules", value: `${moduleFields.length}` },
                    { label: "Total lessons", value: `${watch("modules")?.reduce((s, m) => s + (m.lessons?.length ?? 0), 0) ?? 0}` },
                    { label: "Visibility", value: isPublic ? "Public" : "Private" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{label}</span>
                      <span className="font-semibold text-slate-800 capitalize">{value || "—"}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <button type="button" onClick={() => { setDirection(-1); setStep((s) => s - 1); }}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={15} /> Back
          </button>

          {step < 2 ? (
            <button type="button" onClick={async () => { setDirection(1); await advance(); }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-white text-sm font-bold transition-all"
              style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
            >
              Next <ChevronRight size={15} />
            </button>
          ) : (
            <button type="submit" disabled={createMutation.isPending}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white text-sm font-bold transition-all shadow-lg"
              style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB, #06B6D4)" }}
            >
              {createMutation.isPending && <Loader2 className="animate-spin w-4 h-4" />}
              Publish Course
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ModuleSection({ modIndex, control, register, errors, onRemoveModule, canRemove }: {
  modIndex: number; control: any; register: any; errors: any;
  onRemoveModule: () => void; canRemove: boolean;
}) {
  const { fields, append, remove } = useFieldArray({ control, name: `modules.${modIndex}.lessons` });
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #1E3A8A, #06B6D4)" }}
        >
          {modIndex + 1}
        </div>
        <div className="flex-1">
          <input {...register(`modules.${modIndex}.title`)} placeholder={`Module ${modIndex + 1} title`}
            className={fieldClass + " text-xs py-2"} />
          {errors.modules?.[modIndex]?.title && (
            <p className="text-red-500 text-xs mt-1">{errors.modules[modIndex].title.message}</p>
          )}
        </div>
        {canRemove && (
          <button type="button" onClick={onRemoveModule} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="pl-9 space-y-2">
        {fields.map((lField, lIdx) => (
          <motion.div key={lField.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input {...register(`modules.${modIndex}.lessons.${lIdx}.title`)} placeholder="Lesson title"
                className={fieldClass + " text-xs py-2"} />
              <input {...register(`modules.${modIndex}.lessons.${lIdx}.videoUrl`)} placeholder="Video URL"
                className={fieldClass + " text-xs py-2 sm:col-span-2"} />
            </div>
            {fields.length > 1 && (
              <button type="button" onClick={() => remove(lIdx)} className="text-red-400 hover:text-red-600 transition-colors shrink-0">
                <Trash2 size={12} />
              </button>
            )}
          </motion.div>
        ))}
        <button type="button" onClick={() => append({ title: "", videoUrl: "", duration: 0 })}
          className="text-xs text-primary hover:text-primary/70 flex items-center gap-1 font-medium transition-colors mt-1"
        >
          <Plus size={12} /> Add Lesson
        </button>
      </div>
    </motion.div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function InstructorDashboard() {
  const { data: user } = useGetMe(getAuthOptions());
  const [isCreating, setIsCreating] = React.useState(false);
  const [selectedCourseId, setSelectedCourseId] = React.useState<number | null>(null);
  const [instructorCourses, setInstructorCourses] = React.useState<InstructorCourse[]>([]);
  const [loadingCourses, setLoadingCourses] = React.useState(true);

  const fetchMyCourses = React.useCallback(() => {
    setLoadingCourses(true);
    fetch("/api/instructor/courses", { headers: { Authorization: `Bearer ${getAuthToken()}` } })
      .then((r) => r.json())
      .then((data) => { setInstructorCourses(Array.isArray(data) ? data : []); setLoadingCourses(false); })
      .catch(() => setLoadingCourses(false));
  }, []);

  React.useEffect(() => { fetchMyCourses(); }, [fetchMyCourses]);

  if (user && user.role !== "instructor") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
          <GraduationCap className="w-14 h-14 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-700">Instructor Access Only</h2>
          <p className="text-slate-500 text-sm">This section is for instructors only.</p>
        </div>
      </AppLayout>
    );
  }

  const totalStudents = instructorCourses.reduce((s, c) => s + c.enrolledCount, 0);
  const totalLessons = instructorCourses.reduce((s, c) => s + c.totalLessons, 0);
  const selectedCourse = instructorCourses.find((c) => c.id === selectedCourseId);

  return (
    <AppLayout>
      <div className="space-y-8 pb-16">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-1">Instructor Dashboard</h1>
            <p className="text-slate-500 text-sm">Manage your courses and track student progress, {user?.name}.</p>
          </div>
          {!isCreating && (
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setIsCreating(true); setSelectedCourseId(null); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all"
              style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
            >
              <Plus size={17} /> Create New Course
            </motion.button>
          )}
        </div>

        {/* Stats */}
        {!isCreating && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: BookOpen, label: "Published Courses", value: instructorCourses.length, from: "#1E3A8A", to: "#2563EB" },
              { icon: Users, label: "Total Students", value: totalStudents, from: "#0891B2", to: "#06B6D4" },
              { icon: TrendingUp, label: "Total Lessons", value: totalLessons, from: "#059669", to: "#10B981" },
            ].map(({ icon: Icon, label, value, from, to }, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                >
                  <Icon className="text-white w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Course builder */}
        <AnimatePresence>
          {isCreating && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.28 }}>
              <CourseBuilder onCancel={() => setIsCreating(false)} onSuccess={() => { setIsCreating(false); fetchMyCourses(); }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Course grid */}
        {!isCreating && (
          <section>
            <h2 className="text-base font-bold text-slate-700 mb-4 uppercase tracking-wide flex items-center gap-2">
              <BookOpen size={16} className="text-primary" /> Your Courses
            </h2>
            {loadingCourses ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary w-7 h-7" /></div>
            ) : instructorCourses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {instructorCourses.map((course) => (
                  <CourseStatCard key={course.id} course={course}
                    onViewStudents={() => setSelectedCourseId((p) => p === course.id ? null : course.id)}
                    isSelected={selectedCourseId === course.id}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base font-bold text-slate-600 mb-1.5">No courses published yet</h3>
                <p className="text-slate-400 text-sm mb-4">Share your knowledge with students by creating your first course.</p>
                <button onClick={() => setIsCreating(true)}
                  className="px-5 py-2 rounded-lg text-white text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
                >
                  + Create Course
                </button>
              </div>
            )}
          </section>
        )}

        {/* Student progress panel */}
        <AnimatePresence>
          {selectedCourse && !isCreating && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden"
            >
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <StudentProgressPanel courseId={selectedCourse.id} courseTitle={selectedCourse.title} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
