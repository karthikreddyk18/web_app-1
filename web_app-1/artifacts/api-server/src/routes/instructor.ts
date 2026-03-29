import { Router } from "express";
import { db, coursesTable, enrollmentsTable, usersTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAuth, requireInstructor } from "../middlewares/auth.js";
import type { ModuleData } from "@workspace/db";

const router = Router();

/* All instructor routes require auth + instructor role */
router.use(requireAuth, requireInstructor);

/**
 * GET /api/instructor/courses
 * Returns all courses created by the authenticated instructor,
 * each with total enrollment count and total lesson count.
 */
router.get("/courses", async (req, res) => {
  const courses = await db
    .select()
    .from(coursesTable)
    .where(eq(coursesTable.instructorId, req.user!.userId));

  const result = await Promise.all(
    courses.map(async (course) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.courseId, course.id));

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
        enrolledCount: count,
        createdAt: course.createdAt,
      };
    }),
  );

  res.json(result);
});

/**
 * GET /api/instructor/courses/:courseId/students
 * Returns a list of students enrolled in the given course,
 * with their progress percentage and completed lesson count.
 * Only the owning instructor can access this.
 */
router.get("/courses/:courseId/students", async (req, res) => {
  const courseId = parseInt(req.params.courseId, 10);
  if (isNaN(courseId)) {
    res.status(400).json({ error: "Invalid course ID" });
    return;
  }

  /* Verify the course belongs to this instructor */
  const [course] = await db
    .select({ id: coursesTable.id, instructorId: coursesTable.instructorId, modules: coursesTable.modules })
    .from(coursesTable)
    .where(eq(coursesTable.id, courseId))
    .limit(1);

  if (!course) {
    res.status(404).json({ error: "Course not found" });
    return;
  }

  if (course.instructorId !== req.user!.userId) {
    res.status(403).json({ error: "You do not own this course" });
    return;
  }

  /* Fetch all enrollments for this course */
  const enrollments = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.courseId, courseId));

  /* Fetch each enrolled student's info */
  const students = await Promise.all(
    enrollments.map(async (enr) => {
      const [student] = await db
        .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email })
        .from(usersTable)
        .where(eq(usersTable.id, enr.studentId))
        .limit(1);

      return {
        studentId: enr.studentId,
        studentName: student?.name ?? "Unknown",
        studentEmail: student?.email ?? "",
        completedLessons: (enr.completedLessons as number[]).length,
        totalLessons: (course.modules as ModuleData[]).reduce((s, m) => s + m.lessons.length, 0),
        progressPercentage: enr.progressPercentage,
        enrolledAt: enr.enrolledAt,
        lastAccessedAt: enr.lastAccessedAt,
      };
    }),
  );

  res.json(students);
});

export default router;
