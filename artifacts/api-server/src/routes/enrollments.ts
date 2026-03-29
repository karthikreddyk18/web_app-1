import { Router } from "express";
import { db, enrollmentsTable, coursesTable, usersTable, activityTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import type { ModuleData } from "@workspace/db";

const router = Router();

/** Helper: build enrollment response with full course details */
async function buildEnrollmentResponse(enrollment: typeof enrollmentsTable.$inferSelect) {
  const [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, enrollment.courseId))
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
    .where(eq(enrollmentsTable.courseId, course.id));

  const totalLessons = (course.modules as ModuleData[]).reduce(
    (sum, m) => sum + m.lessons.length,
    0,
  );

  return {
    id: enrollment.id,
    studentId: enrollment.studentId,
    courseId: enrollment.courseId,
    course: {
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
    },
    completedLessons: enrollment.completedLessons as number[],
    progressPercentage: enrollment.progressPercentage,
    enrolledAt: enrollment.enrolledAt,
    lastAccessedAt: enrollment.lastAccessedAt,
  };
}

/**
 * GET /api/enrollments
 * Returns all enrollments for the current student.
 */
router.get("/", requireAuth, async (req, res) => {
  const enrollments = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.studentId, req.user!.userId));

  const detailed = await Promise.all(enrollments.map(buildEnrollmentResponse));
  res.json(detailed.filter(Boolean));
});

/**
 * POST /api/enrollments/:courseId
 * Enroll the current user in a course.
 */
router.post("/:courseId", requireAuth, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  /* Check course exists */
  const [course] = await db
    .select({ id: coursesTable.id })
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  /* Check already enrolled */
  const existing = await db
    .select({ id: enrollmentsTable.id })
    .from(enrollmentsTable)
    .where(
      and(
        eq(enrollmentsTable.studentId, req.user!.userId),
        eq(enrollmentsTable.courseId, courseId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Already enrolled in this course" });
    return;
  }

  const [enrollment] = await db
    .insert(enrollmentsTable)
    .values({
      studentId: req.user!.userId,
      courseId,
      completedLessons: [],
      progressPercentage: 0,
    })
    .returning();

  const result = await buildEnrollmentResponse(enrollment);
  res.status(201).json(result);
});

/**
 * POST /api/enrollments/:courseId/lessons/:lessonId/complete
 * Mark a lesson as completed and recalculate progress.
 */
router.post("/:courseId/lessons/:lessonId/complete", requireAuth, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  const lessonId = parseInt(req.params.lessonId, 10);

  if (isNaN(courseId) || isNaN(lessonId)) {
    res.status(400).json({ error: "Invalid course or lesson ID" });
    return;
  }

  /* Find the enrollment */
  const [enrollment] = await db
    .select()
    .from(enrollmentsTable)
    .where(
      and(
        eq(enrollmentsTable.studentId, req.user!.userId),
        eq(enrollmentsTable.courseId, courseId),
      ),
    )
    .limit(1);

  if (!enrollment) {
    res.status(404).json({ error: "Not enrolled in this course" });
    return;
  }

  /* Get course to compute total lessons and lesson duration */
  const [course] = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);

  const modules = (course.modules as ModuleData[]);
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);

  /* Find the lesson for its duration */
  let lessonDuration = 0;
  for (const mod of modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) {
      lessonDuration = Math.round(lesson.duration / 60); // convert seconds to minutes
      break;
    }
  }

  /* Add lesson to completedLessons (avoid duplicates) */
  const completedLessons = enrollment.completedLessons as number[];
  if (!completedLessons.includes(lessonId)) {
    completedLessons.push(lessonId);

    /* Log activity for analytics */
    await db.insert(activityTable).values({
      userId: req.user!.userId,
      courseId,
      lessonId,
      minutesStudied: lessonDuration,
    });
  }

  /* Recalculate progress */
  const progressPercentage =
    totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;

  /* Update enrollment */
  const [updated] = await db
    .update(enrollmentsTable)
    .set({
      completedLessons,
      progressPercentage,
      lastAccessedAt: new Date(),
    })
    .where(eq(enrollmentsTable.id, enrollment.id))
    .returning();

  const result = await buildEnrollmentResponse(updated);
  res.json(result);
});

/**
 * GET /api/enrollments/:courseId/progress
 * Get progress for a specific enrolled course.
 */
router.get("/:courseId/progress", requireAuth, async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  const [enrollment] = await db
    .select()
    .from(enrollmentsTable)
    .where(
      and(
        eq(enrollmentsTable.studentId, req.user!.userId),
        eq(enrollmentsTable.courseId, courseId),
      ),
    )
    .limit(1);

  if (!enrollment) {
    res.status(404).json({ error: "Not enrolled in this course" });
    return;
  }

  const result = await buildEnrollmentResponse(enrollment);
  res.json(result);
});

export default router;
