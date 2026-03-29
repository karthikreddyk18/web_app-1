import * as React from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, useGetMyEnrollments, useGetUserStats, useGetWeeklyActivity, useListCourses } from "@workspace/api-client-react";
import { getAuthOptions } from "@/lib/api-utils";
import { BookOpen, Trophy, Clock, Flame, ArrowRight } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: user } = useGetMe(getAuthOptions());
  const { data: stats } = useGetUserStats(getAuthOptions());
  const { data: enrollments } = useGetMyEnrollments(getAuthOptions());
  const { data: activity } = useGetWeeklyActivity(getAuthOptions());
  const { data: courses } = useListCourses(getAuthOptions());

  const activeEnrollments = enrollments?.filter(e => e.progressPercentage < 100) || [];
  const popularCourses = courses?.slice(0, 3) || [];

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        {/* ── Header ── */}
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 mb-1">
            Welcome back,{" "}
            <span style={{ background: "linear-gradient(135deg, #1E3A8A, #06B6D4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {user?.name?.split(" ")[0]}
            </span>{" "}
            👋
          </h1>
          <p className="text-slate-500 text-sm">Continue your learning journey and achieve your goals.</p>
        </div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: "Enrolled Courses", value: stats?.totalEnrolled || 0, from: "#1E3A8A", to: "#2563EB" },
            { icon: Trophy, label: "Completed Courses", value: stats?.totalCompleted || 0, from: "#059669", to: "#10B981" },
            { icon: Clock, label: "Lessons Completed", value: stats?.totalLessonsCompleted || 0, from: "#7C3AED", to: "#8B5CF6" },
            { icon: Flame, label: "Day Streak", value: stats?.streakDays || 0, from: "#EA580C", to: "#F97316" },
          ].map(({ icon: Icon, label, value, from, to }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-2px_rgba(30,58,138,0.08)] p-5 flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
              >
                <Icon className="text-white w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
                <p className="text-2xl font-display font-bold text-slate-800">{value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Column ── */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-display font-bold text-slate-800">Continue Learning</h2>
              </div>

              {activeEnrollments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {activeEnrollments.slice(0, 2).map(enrollment => (
                    <CourseCard
                      key={enrollment.id}
                      course={enrollment.course}
                      progress={enrollment.progressPercentage}
                      isEnrolled
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-200">
                    <BookOpen className="w-7 h-7 text-slate-400" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-700 mb-1.5">No active courses yet</h3>
                  <p className="text-sm text-slate-500 mb-5">Enroll in a course to start tracking your progress.</p>
                  <Link href="/courses">
                    <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                      style={{ background: "linear-gradient(135deg, #1E3A8A, #2563EB)" }}
                    >
                      Browse Catalog <ArrowRight size={15} />
                    </span>
                  </Link>
                </div>
              )}
            </section>

            {/* Recommended */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-display font-bold text-slate-800">Recommended For You</h2>
                <Link href="/courses">
                  <span className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                    View All <ArrowRight size={14} />
                  </span>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {popularCourses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            {/* Activity chart */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-2px_rgba(30,58,138,0.07)] p-5">
              <h2 className="text-sm font-display font-bold text-slate-700 mb-5 uppercase tracking-wide">Weekly Study Activity</h2>
              <div className="h-[220px] w-full">
                {activity && activity.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={activity} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                      <XAxis
                        dataKey="day"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => v.substring(0, 3)}
                      />
                      <YAxis
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `${v}m`}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(30,58,138,0.04)" }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          color: "#1e293b",
                          fontSize: "12px",
                        }}
                        itemStyle={{ color: "#1E3A8A" }}
                      />
                      <Bar
                        dataKey="minutesStudied"
                        name="Minutes"
                        fill="url(#barGrad)"
                        radius={[4, 4, 0, 0]}
                      />
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06B6D4" />
                          <stop offset="100%" stopColor="#1E3A8A" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                    No activity data this week.
                  </div>
                )}
              </div>
            </section>

            {/* Quick links */}
            <section className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-2px_rgba(30,58,138,0.07)] p-5">
              <h2 className="text-sm font-display font-bold text-slate-700 mb-4 uppercase tracking-wide">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/courses">
                  <span className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group">
                    <span className="flex items-center gap-2.5">
                      <Flame size={15} className="text-orange-500" /> Browse All Courses
                    </span>
                    <ArrowRight size={13} className="text-slate-400 group-hover:text-primary transition-colors" />
                  </span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
