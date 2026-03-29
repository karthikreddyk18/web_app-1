import { pgTable, serial, integer, real, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

/* Enrollments table - tracks student progress per course */
export const enrollmentsTable = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey(),
    studentId: integer("student_id")
      .notNull()
      .references(() => usersTable.id),
    courseId: integer("course_id")
      .notNull()
      .references(() => coursesTable.id),
    /* Array of completed lesson IDs */
    completedLessons: jsonb("completed_lessons").$type<number[]>().notNull().default([]),
    /* Calculated percentage 0-100 */
    progressPercentage: real("progress_percentage").notNull().default(0),
    enrolledAt: timestamp("enrolled_at").notNull().defaultNow(),
    lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  },
  (table) => [unique("unique_enrollment").on(table.studentId, table.courseId)],
);

export const insertEnrollmentSchema = createInsertSchema(enrollmentsTable).omit({
  id: true,
  enrolledAt: true,
  lastAccessedAt: true,
});

export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type Enrollment = typeof enrollmentsTable.$inferSelect;
