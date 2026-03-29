import { pgTable, serial, text, integer, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

/* Level enum for course difficulty */
export const levelEnum = pgEnum("level", ["beginner", "intermediate", "advanced"]);

/* Individual lesson type (stored as JSONB inside modules) */
export type LessonData = {
  id: number;
  title: string;
  videoUrl: string;
  duration: number; // seconds
  order: number;
};

/* Module type (stored as JSONB in courses table) */
export type ModuleData = {
  id: number;
  title: string;
  order: number;
  lessons: LessonData[];
};

/* Courses table */
export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  thumbnail: text("thumbnail"),
  level: levelEnum("level").notNull().default("beginner"),
  category: text("category").notNull(),
  instructorId: integer("instructor_id")
    .notNull()
    .references(() => usersTable.id),
  /* Modules (with nested lessons) stored as JSONB for simplicity */
  modules: jsonb("modules").$type<ModuleData[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({
  id: true,
  createdAt: true,
});

export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
