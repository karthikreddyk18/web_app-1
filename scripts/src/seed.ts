/**
 * Seed script: populates the database with sample courses, an instructor,
 * and a demo student account with enrollments and activity.
 *
 * Run: pnpm --filter @workspace/scripts run seed
 */
import bcrypt from "bcryptjs";
import { db, usersTable, coursesTable, enrollmentsTable, activityTable } from "@workspace/db";
import type { ModuleData } from "@workspace/db";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("🌱 Seeding database...");

  /* -----------------------------------------------------------------------
   * 1. Create instructor account
   * --------------------------------------------------------------------- */
  const instructorEmail = "instructor@demo.com";
  const existingInstructor = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, instructorEmail))
    .limit(1);

  let instructorId: number;
  if (existingInstructor.length > 0) {
    instructorId = existingInstructor[0].id;
    console.log("✓ Instructor already exists");
  } else {
    const [instructor] = await db
      .insert(usersTable)
      .values({
        name: "Alex Johnson",
        email: instructorEmail,
        passwordHash: await bcrypt.hash("password123", 10),
        role: "instructor",
      })
      .returning({ id: usersTable.id });
    instructorId = instructor.id;
    console.log("✓ Instructor created");
  }

  /* -----------------------------------------------------------------------
   * 2. Create demo student
   * --------------------------------------------------------------------- */
  const studentEmail = "student@demo.com";
  const existingStudent = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, studentEmail))
    .limit(1);

  let studentId: number;
  if (existingStudent.length > 0) {
    studentId = existingStudent[0].id;
    console.log("✓ Student already exists");
  } else {
    const [student] = await db
      .insert(usersTable)
      .values({
        name: "Sarah Chen",
        email: studentEmail,
        passwordHash: await bcrypt.hash("password123", 10),
        role: "student",
      })
      .returning({ id: usersTable.id });
    studentId = student.id;
    console.log("✓ Demo student created");
  }

  /* -----------------------------------------------------------------------
   * 3. Create sample courses
   * --------------------------------------------------------------------- */
  const sampleCourses: Array<{
    title: string;
    description: string;
    thumbnail: string;
    level: "beginner" | "intermediate" | "advanced";
    category: string;
    modules: ModuleData[];
  }> = [
    {
      title: "Complete React Development Bootcamp",
      description:
        "Master React from the ground up. Learn hooks, state management, routing, and build real-world production applications with modern best practices.",
      thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop",
      level: "beginner",
      category: "Web Development",
      modules: [
        {
          id: 1, title: "React Fundamentals", order: 1,
          lessons: [
            { id: 1, title: "Introduction to React", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 600, order: 1 },
            { id: 2, title: "JSX and Components", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 720, order: 2 },
            { id: 3, title: "Props and State", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 900, order: 3 },
          ],
        },
        {
          id: 2, title: "React Hooks", order: 2,
          lessons: [
            { id: 4, title: "useState and useEffect", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 840, order: 1 },
            { id: 5, title: "useContext and useReducer", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 780, order: 2 },
            { id: 6, title: "Custom Hooks", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 660, order: 3 },
          ],
        },
        {
          id: 3, title: "React Router & Navigation", order: 3,
          lessons: [
            { id: 7, title: "Setting up React Router", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 540, order: 1 },
            { id: 8, title: "Dynamic Routes", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 600, order: 2 },
          ],
        },
      ],
    },
    {
      title: "Node.js & Express API Mastery",
      description:
        "Build robust RESTful APIs with Node.js and Express. Cover authentication, databases, testing, and deployment to production environments.",
      thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=225&fit=crop",
      level: "intermediate",
      category: "Backend Development",
      modules: [
        {
          id: 10, title: "Node.js Core Concepts", order: 1,
          lessons: [
            { id: 20, title: "Event Loop & Async", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 720, order: 1 },
            { id: 21, title: "File System & Streams", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 660, order: 2 },
          ],
        },
        {
          id: 11, title: "Express Framework", order: 2,
          lessons: [
            { id: 22, title: "Routing & Middleware", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 840, order: 1 },
            { id: 23, title: "Error Handling", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 600, order: 2 },
            { id: 24, title: "JWT Authentication", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 900, order: 3 },
          ],
        },
        {
          id: 12, title: "Database Integration", order: 3,
          lessons: [
            { id: 25, title: "PostgreSQL & Drizzle ORM", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 780, order: 1 },
            { id: 26, title: "Query Optimization", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 720, order: 2 },
          ],
        },
      ],
    },
    {
      title: "TypeScript for Professionals",
      description:
        "Go beyond the basics with advanced TypeScript patterns, generics, decorators, and how to design scalable, type-safe architectures.",
      thumbnail: "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=400&h=225&fit=crop",
      level: "advanced",
      category: "Programming Languages",
      modules: [
        {
          id: 20, title: "Advanced Types", order: 1,
          lessons: [
            { id: 40, title: "Conditional Types", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 840, order: 1 },
            { id: 41, title: "Mapped Types & Utility Types", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 780, order: 2 },
            { id: 42, title: "Template Literal Types", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 660, order: 3 },
          ],
        },
        {
          id: 21, title: "Generics Deep Dive", order: 2,
          lessons: [
            { id: 43, title: "Generic Constraints", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 720, order: 1 },
            { id: 44, title: "Infer Keyword", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 600, order: 2 },
          ],
        },
      ],
    },
    {
      title: "Python Data Science Fundamentals",
      description:
        "Start your data science journey with Python. Learn NumPy, Pandas, data visualization, and build your first machine learning models with scikit-learn.",
      thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=225&fit=crop",
      level: "beginner",
      category: "Data Science",
      modules: [
        {
          id: 30, title: "Python for Data", order: 1,
          lessons: [
            { id: 60, title: "NumPy Arrays & Operations", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 900, order: 1 },
            { id: 61, title: "Pandas DataFrames", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 840, order: 2 },
            { id: 62, title: "Data Cleaning", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 720, order: 3 },
          ],
        },
        {
          id: 31, title: "Visualization", order: 2,
          lessons: [
            { id: 63, title: "Matplotlib & Seaborn", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 780, order: 1 },
            { id: 64, title: "Interactive Charts with Plotly", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 660, order: 2 },
          ],
        },
      ],
    },
    {
      title: "UI/UX Design with Figma",
      description:
        "Learn professional UI/UX design principles, wireframing, prototyping, and design systems. Create stunning interfaces using Figma from scratch.",
      thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=225&fit=crop",
      level: "beginner",
      category: "Design",
      modules: [
        {
          id: 40, title: "Design Principles", order: 1,
          lessons: [
            { id: 80, title: "Color Theory & Typography", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 720, order: 1 },
            { id: 81, title: "Layout & Spacing", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 660, order: 2 },
          ],
        },
        {
          id: 41, title: "Figma Mastery", order: 2,
          lessons: [
            { id: 82, title: "Components & Auto Layout", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 840, order: 1 },
            { id: 83, title: "Prototyping & Animations", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 780, order: 2 },
            { id: 84, title: "Design Systems", videoUrl: "https://www.youtube.com/embed/SqcY0GlETPk", duration: 900, order: 3 },
          ],
        },
      ],
    },
  ];

  const courseIds: number[] = [];
  for (const courseData of sampleCourses) {
    const existing = await db
      .select({ id: coursesTable.id })
      .from(coursesTable)
      .where(eq(coursesTable.title, courseData.title))
      .limit(1);

    if (existing.length > 0) {
      courseIds.push(existing[0].id);
      console.log(`✓ Course already exists: ${courseData.title}`);
    } else {
      const [course] = await db
        .insert(coursesTable)
        .values({ ...courseData, instructorId })
        .returning({ id: coursesTable.id });
      courseIds.push(course.id);
      console.log(`✓ Course created: ${courseData.title}`);
    }
  }

  /* -----------------------------------------------------------------------
   * 4. Enroll demo student in first two courses with some progress
   * --------------------------------------------------------------------- */
  if (courseIds.length >= 2) {
    /* Enroll in React course with 50% progress */
    const reactCourseId = courseIds[0];
    const existingEnrollment = await db
      .select({ id: enrollmentsTable.id })
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.studentId, studentId))
      .limit(1);

    if (existingEnrollment.length === 0) {
      await db.insert(enrollmentsTable).values({
        studentId,
        courseId: reactCourseId,
        completedLessons: [1, 2, 3, 4],
        progressPercentage: 50,
      });
      console.log("✓ Student enrolled in React course with progress");

      /* Enroll in Node.js course with 30% progress */
      await db.insert(enrollmentsTable).values({
        studentId,
        courseId: courseIds[1],
        completedLessons: [20, 21],
        progressPercentage: 29,
      });
      console.log("✓ Student enrolled in Node.js course with progress");

      /* Log sample weekly activity for the analytics graph */
      const now = new Date();
      const activityData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        if (i % 2 === 0) {
          activityData.push({
            userId: studentId, courseId: reactCourseId,
            lessonId: i + 1, minutesStudied: 15 + i * 5,
            completedAt: date,
          });
        }
      }

      for (const act of activityData) {
        await db.insert(activityTable).values(act);
      }
      console.log("✓ Sample activity data seeded");
    } else {
      console.log("✓ Enrollments already exist");
    }
  }

  console.log("\n✅ Seed complete!");
  console.log("\nDemo accounts:");
  console.log("  Student:    student@demo.com / password123");
  console.log("  Instructor: instructor@demo.com / password123");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
