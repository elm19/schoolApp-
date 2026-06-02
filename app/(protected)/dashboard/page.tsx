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
import { Separator } from "@/components/ui/separator";
import { TeacherSessionActions } from "@/components/teacher-session-actions";
import {
  getCourseCode,
  getCourseLabel,
  getCourseName,
  type StudentCourseDisplay,
} from "@/lib/course-display";
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

type StudentCourseRow = {
  course_id?: string | number | null;
  [key: string]: unknown;
};

type CourseRow = {
  id?: string | number | null;
  code?: string | null;
  course_code?: string | null;
  name?: string | null;
  title?: string | null;
  [key: string]: unknown;
};

type StaffRow = {
  name: string | null;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

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
        studentCourses={courseDisplays}
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
          Student overview
        </h1>
      </div>

      {profile ? (
        <Card>
          <CardHeader>
            <CardTitle>Student profile</CardTitle>
            <CardDescription>
              Stored profile information from your SchoolApp account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[160px_1fr]">
            <div className="flex aspect-square items-center justify-center border bg-muted text-4xl font-semibold text-muted-foreground">
              {getInitials(profile.name)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileInfo label="Name" value={profile.name} />
              <ProfileInfo label="Code" value={profile.code} />
              <ProfileInfo label="Section / Filiere" value={profile.section} />
              <ProfileInfo label="Group" value={profile.group_name} />
              <ProfileInfo label="Subgroup" value={profile.subgroup} />
              <ProfileInfo label="Status" value={profile.status} />
              <ProfileInfo label="Year" value={profile.year} />
              <ProfileInfo label="Email" value={profile.email ?? user?.email} />
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

async function getConfirmedStaff(
  supabase: SupabaseServerClient,
  userId: string,
) {
  const userIdColumns = ["user_id", "id", "teacher_id", "auth_user_id"];

  for (const column of userIdColumns) {
    const { data, error } = await supabase
      .from("staff")
      .select("name")
      .eq(column, userId)
      .maybeSingle<StaffRow>();

    if (!error && data) {
      return data;
    }
  }

  return null;
}

function mapStudentCoursesToDisplay(
  studentCourses: StudentCourseRow[],
  courses: CourseRow[],
) {
  const coursesByCode = new Map(
    courses.map((course) => [getCourseCode(course), getCourseName(course)]),
  );

  return studentCourses
    .map((studentCourse) => {
      const code = String(studentCourse.course_id ?? "");
      if (!code) {
        return null;
      }

      return {
        code,
        name: coursesByCode.get(code) ?? null,
      };
    })
    .filter((course): course is StudentCourseDisplay => Boolean(course));
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
  studentCourses,
}: {
  courses: CourseRow[];
  staff: StaffRow;
  studentCourses: StudentCourseDisplay[];
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
            Teacher overview
          </h1>
        </div>
        <TeacherSessionActions courses={courseOptions} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff information</CardTitle>
          <CardDescription>
            Basic staff details loaded from Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileInfo label="Name" value={staff?.name} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Student courses</CardTitle>
              <CardDescription>
                Current rows from the student_courses table.
              </CardDescription>
            </div>
            <Badge variant="secondary">{studentCourses.length} rows</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {studentCourses.length > 0 ? (
            studentCourses.map((course, index) => (
              <div key={`${course.code}-${index}`} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <p className="text-sm font-medium text-muted-foreground">
                    Course
                  </p>
                  <Link
                    href={`/dashboard/courses/${encodeURIComponent(course.code)}`}
                    className="break-words font-medium underline-offset-4 hover:underline"
                  >
                    {getCourseLabel(course)}
                  </Link>
                </div>
                {index < studentCourses.length - 1 ? <Separator /> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No student courses found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileInfo({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 break-words font-medium">
        {value || "Unavailable"}
      </p>
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
