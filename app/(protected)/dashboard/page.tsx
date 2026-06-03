import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { DashboardClient } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { TeacherSessionActions } from "@/components/teacher-session-actions";
import {
  getCourseCode,
  getCourseLabel,
  getCourseName,
} from "@/lib/course-display";
import {
  getConfirmedStaff,
  mapStudentCoursesToDisplay,
  type StaffRow,
  type StudentCourseRow,
} from "@/lib/school-data";
import { createClient } from "@/lib/supabase/server";

type DashboardPageProps = {
  searchParams?: Promise<{
    uncompleted?: string;
    platformError?: string;
  }>;
};

type Profile = {
  email: string | null;
  name: string | null;
  code: string | null;
  section: string | null;
  group_name: string | null;
  subgroup: string | null;
  status: string | null;
  year: number | string | null;
};

type CourseRow = {
  id?: string | number | null;
  code?: string | null;
  course_code?: string | null;
  name?: string | null;
  title?: string | null;
  [key: string]: unknown;
};

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;
  const role = user?.user_metadata?.role;

  const { data: studentCourses } = await supabase.from("student_courses").select("*");
  const { data: courses } = await supabase.from("courses").select("*");
  const courseDisplays = mapStudentCoursesToDisplay(
    (studentCourses ?? []) as StudentCourseRow[],
    (courses ?? []) as CourseRow[],
  );

  if (role === "teacher") {
    const staff = user?.id
      ? await getConfirmedStaff(supabase, user.id)
      : null;

    if (!staff) {
      return <PendingTeacherDashboard />;
    }

    return (
      <TeacherDashboard
        staff={staff}
        courses={(courses ?? []) as CourseRow[]}
      />
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user?.email ?? "")
    .maybeSingle<Profile>();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Welcome back{profile?.name ? `, ${profile.name}` : ""}
        </h1>
      </div>

      {profile ? (
        <Card size="sm">
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
                {getInitials(profile.name)}
              </div>
              <div>
                <p className="font-semibold">{profile.name ?? "Student"}</p>
                <p className="text-sm text-muted-foreground">
                  {profile.code ?? "No student code"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{profile.section ?? "No section"}</Badge>
              <Badge variant="secondary">{profile.group_name ?? "No group"}</Badge>
              {profile.subgroup ? (
                <Badge variant="secondary">{profile.subgroup}</Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <DashboardClient
        hasProfile={Boolean(profile)}
        initialCourses={courseDisplays}
        platformError={params?.platformError}
        shouldImportCourses={Boolean(profile) && courseDisplays.length === 0}
      />
    </div>
  );
}

function PendingTeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Teacher approval pending
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waiting for admin confirmation</CardTitle>
          <CardDescription>
            Your teacher account was created, but an admin still needs to
            confirm your teacher status before you can use teacher features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Once your account is confirmed in the staff table, this dashboard
            will show roll call and presentation tools.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TeacherDashboard({
  courses,
  staff,
}: {
  courses: CourseRow[];
  staff: StaffRow;
}) {
  const courseOptions = courses
    .map((course) => {
      const code = getCourseCode(course);
      return {
        code,
        name: getCourseName(course),
      };
    })
    .filter((course) => course.code);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Dashboard</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Welcome, {staff.name ?? "Teacher"}
          </h1>
          <Badge className="mt-3" variant="secondary">Teacher</Badge>
        </div>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Teacher actions</CardTitle>
          <CardDescription>
            Start classroom sessions for roll call or presentations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TeacherSessionActions courses={courseOptions} />
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Courses</CardTitle>
              <CardDescription>
                A quick preview of available courses.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">{courseOptions.length} courses</Badge>
              <Link href="/courses" className="text-sm font-medium underline-offset-4 hover:underline">
                View all courses
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {courseOptions.length > 0 ? (
            courseOptions.slice(0, 5).map((course) => (
              <Link
                key={course.code}
                href={`/courses/${encodeURIComponent(course.code)}`}
                className="block rounded-md border bg-background px-3 py-2 text-sm font-medium underline-offset-4 hover:bg-muted hover:underline"
              >
                {getCourseLabel(course)}
              </Link>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No courses found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getInitials(name?: string | null) {
  if (!name) {
    return "SP";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
