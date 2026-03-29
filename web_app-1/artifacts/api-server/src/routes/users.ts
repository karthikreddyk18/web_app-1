import { Router } from "express";
import { db, enrollmentsTable, activityTable } from "@workspace/db";
import { eq, gte, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

/** Day names for the weekly graph */
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * GET /api/users/activity
 * Returns the last 7 days of study activity for the current user.
 */
router.get("/activity", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  /* Date 7 days ago at midnight */
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  /* Query activity grouped by date */
  const rows = await db
    .select({
      date: sql<string>`DATE(${activityTable.completedAt})`,
      lessonsCompleted: sql<number>`count(*)::int`,
      minutesStudied: sql<number>`sum(${activityTable.minutesStudied})::int`,
    })
    .from(activityTable)
    .where(
      sql`${activityTable.userId} = ${userId} AND ${activityTable.completedAt} >= ${sevenDaysAgo}`,
    )
    .groupBy(sql`DATE(${activityTable.completedAt})`)
    .orderBy(sql`DATE(${activityTable.completedAt})`);

  /* Build a full 7-day result (fill in zeros for days with no activity) */
  const activityByDate = new Map(rows.map((r) => [r.date, r]));

  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const key = date.toISOString().split("T")[0];
    const dayName = DAY_NAMES[date.getDay()];

    const row = activityByDate.get(key);
    result.push({
      day: dayName,
      lessonsCompleted: row?.lessonsCompleted ?? 0,
      minutesStudied: row?.minutesStudied ?? 0,
    });
  }

  res.json(result);
});

/**
 * GET /api/users/stats
 * Returns overall study stats for the current user.
 */
router.get("/stats", requireAuth, async (req, res) => {
  const userId = req.user!.userId;

  const enrollments = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.studentId, userId));

  const totalEnrolled = enrollments.length;
  const totalCompleted = enrollments.filter((e) => e.progressPercentage === 100).length;
  const totalInProgress = enrollments.filter(
    (e) => e.progressPercentage > 0 && e.progressPercentage < 100,
  ).length;

  const totalLessonsCompleted = enrollments.reduce(
    (sum, e) => sum + (e.completedLessons as number[]).length,
    0,
  );

  const averageProgress =
    totalEnrolled > 0
      ? Math.round(
          enrollments.reduce((sum, e) => sum + e.progressPercentage, 0) / totalEnrolled,
        )
      : 0;

  /* Simple streak: count consecutive days with activity going back from today */
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activityRows = await db
    .select({ date: sql<string>`DATE(${activityTable.completedAt})` })
    .from(activityTable)
    .where(eq(activityTable.userId, userId))
    .groupBy(sql`DATE(${activityTable.completedAt})`)
    .orderBy(sql`DATE(${activityTable.completedAt}) DESC`);

  let streakDays = 0;
  const check = new Date(today);
  for (const row of activityRows) {
    const rowDate = new Date(row.date + "T00:00:00");
    if (rowDate.getTime() === check.getTime()) {
      streakDays++;
      check.setDate(check.getDate() - 1);
    } else {
      break;
    }
  }

  res.json({
    totalEnrolled,
    totalCompleted,
    totalInProgress,
    totalLessonsCompleted,
    averageProgress,
    streakDays,
  });
});

export default router;
