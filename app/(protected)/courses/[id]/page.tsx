import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCourseLabel } from "@/lib/course-display";
import {
  getAccessibleCourses,
  getPeriodLabel,
  getSessionEventLabels,
  getStaffNameByUserId,
  type SessionRow,
} from "@/lib/school-data";
import { createClient } from "@/lib/supabase/server";

type CoursePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const courseCode = decodeURIComponent(id);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <UnavailableCourse />;
  }

  const courses = await getAccessibleCourses(supabase, user);
  const course = courses.find((item) => item.code === courseCode);

  if (!course) {
    return <UnavailableCourse />;
  }

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*")
    .eq("courses_id", course.code)
    .order("date", { ascending: false });

  const sessionRows = (sessions ?? []) as SessionRow[];
  const teacherNames = new Map<string, string>();

  for (const teacherId of [...new Set(sessionRows.map((session) => session.teacher_id))]) {
    teacherNames.set(teacherId, await getStaffNameByUserId(supabase, teacherId));
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/courses"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Back to courses
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          {course.code}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {course.name ?? "Course name unavailable"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course details</CardTitle>
          <CardDescription>
            {getCourseLabel(course)}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <InfoBlock label="Course code" value={course.code} />
          <InfoBlock label="Course name" value={course.name ?? "Unavailable"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions and events</CardTitle>
          <CardDescription>
            Roll call and presentation sessions for this course.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessionRows.length > 0 ? (
            sessionRows.map((session) => (
              <Link
                key={session.id}
                href={`/sessions/${session.id}`}
                className="block rounded-md border bg-background p-4 hover:bg-muted"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {session.date ?? "No date"} ·{" "}
                      {getPeriodLabel(session.isTP, Number(session.period))}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {session.isTP ? "TP" : "course"} · Teacher:{" "}
                      {teacherNames.get(session.teacher_id) ?? "Unavailable"} · Class:{" "}
                      {session.class}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getSessionEventLabels(session.event).map((label) => (
                      <Badge key={label} variant="secondary">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No sessions found for this course.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UnavailableCourse() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Course not found or unavailable.</CardTitle>
        <CardDescription>
          The course may not exist, or your account may not have access to it.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}
