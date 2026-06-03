import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCourseLabel } from "@/lib/course-display";
import { getAccessibleCourses } from "@/lib/school-data";
import { createClient } from "@/lib/supabase/server";

export default async function CoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const courses = await getAccessibleCourses(supabase, user);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Courses</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          All courses
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Courses</CardTitle>
          <CardDescription>
            Courses available to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {courses.length > 0 ? (
            courses.map((course) => (
              <Link
                key={course.code}
                href={`/courses/${encodeURIComponent(course.code)}`}
                className="rounded-md border bg-background p-4 underline-offset-4 hover:bg-muted hover:underline"
              >
                <p className="font-medium">{course.code}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {course.name ?? getCourseLabel(course)}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No courses are available.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
