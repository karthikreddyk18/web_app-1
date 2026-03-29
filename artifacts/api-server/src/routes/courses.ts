import { Router } from "express";
import { db, coursesTable, usersTable, enrollmentsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireInstructor } from "../middlewares/auth.js";
import type { ModuleData } from "@workspace/db";

const router = Router();

/** Helper: fetch a course with instructor info and enrollment count */
async function getCourseWithDetails(courseId: number) {
  const [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);

  if (!course) return null;

  const [instructor] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.id, course.instructorId))
    .limit(1);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.courseId, courseId));

  /* Compute totalLessons from nested module/lesson structure */
  const totalLessons = (course.modules as ModuleData[]).reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );

  return {
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail,
    level: course.level,
    category: course.category,
    totalLessons,
    instructor: instructor ?? null,
    modules: course.modules,
    createdAt: course.createdAt,
    enrolledCount: count,
  };
}

/**
 * GET /api/courses
 * Returns all courses with instructor info and enrollment count.
 */
router.get("/", async (_req, res) => {
  const courses = await db.select().from(coursesTable);

  const detailed = await Promise.all(
    courses.map((c) => getCourseWithDetails(c.id)),
  );

  res.json(detailed.filter(Boolean));
});

/**
 * GET /api/courses/:courseId
 * Returns a single course by ID.
 */
router.get("/:courseId", async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const course = await getCourseWithDetails(courseId);
  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  res.json(course);
});

/**
 * POST /api/courses
 * Create a new course. Instructors only.
 */
router.post("/", requireAuth, requireInstructor, async (req, res) => {
  const { title, description, thumbnail, level = "beginner", category, modules = [] } = req.body;

  if (!title || !description || !category) {
    res.status(400).json({ error: "title, description, and category are required" });
    return;
  }

  /* Build modules with generated IDs */
  let moduleId = 1;
  let lessonId = 1;
  const builtModules: ModuleData[] = (modules as Array<{ title: string; lessons: Array<{ title: string; videoUrl: string; duration?: number }> }>).map(
    (mod, mIdx) => ({
      id: moduleId++,
      title: mod.title,
      order: mIdx + 1,
      lessons: mod.lessons.map((lesson, lIdx) => ({
        id: lessonId++,
        title: lesson.title,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration ?? 0,
        order: lIdx + 1,
      })),
    }),
  );

  const [course] = await db
    .insert(coursesTable)
    .values({
      title,
      description,
      thumbnail,
      level,
      category,
      instructorId: req.user!.userId,
      modules: builtModules,
    })
    .returning();

  const courseDetails = await getCourseWithDetails(course.id);
  res.status(201).json(courseDetails);
});

export default router;
