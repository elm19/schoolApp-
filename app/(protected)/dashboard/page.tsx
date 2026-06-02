import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardClient } from "@/components/dashboard-client";
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

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = await searchParams;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", user?.email ?? "")
    .maybeSingle<Profile>();
  const { data: studentCourses } = await supabase
    .from("student_courses")
    .select("course_id");
  const courseCodes =
    studentCourses?.map((course) => String(course.course_id)) ?? [];

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
        shouldImportCourses={params?.uncompleted === "true" && Boolean(profile)}
      />
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
