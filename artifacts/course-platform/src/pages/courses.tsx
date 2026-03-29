import * as React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useListCourses } from "@workspace/api-client-react";
import { getAuthOptions } from "@/lib/api-utils";
import { CourseCard } from "@/components/course-card";
import { Search, Filter } from "lucide-react";

export default function Courses() {
  const { data: courses, isLoading } = useListCourses(getAuthOptions());
  const [search, setSearch] = React.useState("");

  const filteredCourses = React.useMemo(() => {
    if (!courses) return [];
    if (!search) return courses;
    return courses.filter(c => 
      c.title.toLowerCase().includes(search.toLowerCase()) || 
      c.description.toLowerCase().includes(search.toLowerCase())
    );
  }, [courses, search]);

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">Course Catalog</h1>
            <p className="text-muted-foreground">Discover new skills and expand your knowledge.</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>
            <button className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse rounded-2xl glass-panel h-[350px] bg-white/5" />
            ))}
          </div>
        ) : filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
