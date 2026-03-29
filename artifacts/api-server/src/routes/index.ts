import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import coursesRouter from "./courses.js";
import enrollmentsRouter from "./enrollments.js";
import usersRouter from "./users.js";
import instructorRouter from "./instructor.js";

const router: IRouter = Router();

/* Health check */
router.use(healthRouter);

/* Auth routes: /api/auth/... */
router.use("/auth", authRouter);

/* Course routes: /api/courses/... */
router.use("/courses", coursesRouter);

/* Enrollment routes: /api/enrollments/... */
router.use("/enrollments", enrollmentsRouter);

/* User stats routes: /api/users/... */
router.use("/users", usersRouter);

/* Instructor routes: /api/instructor/... */
router.use("/instructor", instructorRouter);

export default router;
