import { pgTable, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { coursesTable } from "./courses";

/* Activity log - tracks every lesson completion event for analytics */
export const activityTable = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  courseId: integer("course_id")
    .notNull()
    .references(() => coursesTable.id),
  lessonId: integer("lesson_id").notNull(),
  /* Duration studied in seconds (from lesson.duration) */
  minutesStudied: integer("minutes_studied").notNull().default(0),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const insertActivitySchema = createInsertSchema(activityTable).omit({
  id: true,
  completedAt: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activityTable.$inferSelect;
