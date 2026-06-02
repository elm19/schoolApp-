import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard-client";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TeacherSessionActions } from "@/components/teacher-session-actions";
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

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;
  const role = user?.user_metadata?.role;

  const { data: studentCourses } = await supabase
    .from("student_courses")
    .select("*");
  const courseCodes =
    studentCourses
      ?.map((course) => String((course as StudentCourseRow).course_id ?? ""))
      .filter(Boolean) ?? [];

  if (role !== "student") {
    const { data: staffRows } = await supabase
      .from("staff")
      .select("name")
      .limit(1);
    const { data: courses } = await supabase.from("courses").select("*");

    return (
      <TeacherDashboard
        staff={staffRows?.[0] as StaffRow | undefined}
        studentCourses={(studentCourses ?? []) as StudentCourseRow[]}
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
        initialCourseCodes={courseCodes}
        platformError={params?.platformError}
        shouldImportCourses={Boolean(profile) && courseCodes.length === 0}
      />
    </div>
  );
}

function TeacherDashboard({
  courses,
  staff,
  studentCourses,
}: {
  courses: CourseRow[];
  staff?: StaffRow;
  studentCourses: StudentCourseRow[];
}) {
  const courseOptions = courses
    .map((course) => {
      const code = String(course.code ?? course.course_code ?? course.id ?? "");
      return {
        code,
        name: course.name ?? course.title ?? null,
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
              <div key={`${course.course_id ?? index}`} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
                  <p className="text-sm font-medium text-muted-foreground">
                    Course ID
                  </p>
                  <p className="break-words font-medium">
                    {String(course.course_id ?? "Unavailable")}
                  </p>
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
