import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getAuthToken } from "@/lib/api-utils";
import { useGetMe } from "@workspace/api-client-react";
import { getAuthOptions } from "@/lib/api-utils";

import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Courses from "@/pages/courses";
import CourseDetail from "@/pages/course-detail";
import CoursePlayer from "@/pages/course-player";
import InstructorDashboard from "@/pages/instructor-dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: false },
  },
});

/* ── Standard protected route: requires any valid JWT ── */
const ProtectedRoute = ({ component: Component, ...rest }: any) => (
  <Route
    {...rest}
    component={(props: any) => {
      const token = getAuthToken();
      if (!token) return <Redirect to="/login" />;
      return <Component {...props} />;
    }}
  />
);

/* ── Instructor-only route: requires role === 'instructor' ── */
function InstructorRouteInner({ component: Component, ...props }: any) {
  const { data: user, isLoading } = useGetMe(getAuthOptions());

  if (isLoading) {
    /* Avoid flash — render nothing while user loads */
    return <div className="min-h-screen bg-background" />;
  }

  if (!user || user.role !== "instructor") {
    return <Redirect to="/" />;
  }

  return <Component {...props} />;
}

const InstructorRoute = ({ component: Component, ...rest }: any) => (
  <Route
    {...rest}
    component={(props: any) => {
      const token = getAuthToken();
      if (!token) return <Redirect to="/login" />;
      return <InstructorRouteInner component={Component} {...props} />;
    }}
  />
);

function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Student routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/courses" component={Courses} />
      <ProtectedRoute path="/courses/:courseId" component={CourseDetail} />
      <ProtectedRoute path="/learn/:courseId" component={CoursePlayer} />

      {/* Instructor-only route */}
      <InstructorRoute path="/instructor/dashboard" component={InstructorDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
