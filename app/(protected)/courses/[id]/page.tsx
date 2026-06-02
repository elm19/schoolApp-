import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCourseCode, getCourseName } from "@/lib/course-display";
import { createClient } from "@/lib/supabase/server";

type CoursePageProps = {
  params: Promise<{
    id: string;
  }>;
};

type CourseRow = {
  id?: string | number | null;
  code?: string | null;
  course_code?: string | null;
  name?: string | null;
  title?: string | null;
};

export default async function CoursePage({ params }: CoursePageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("code", id)
    .maybeSingle<CourseRow>();

  if (!course) {
    notFound();
  }

  const code = getCourseCode(course);
  const name = getCourseName(course);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Back to dashboard
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          Course details
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{code}</CardTitle>
          <CardDescription>
            Course information from the courses table.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <CourseInfo label="Course code" value={code} />
          <CourseInfo label="Course name" value={name} />
        </CardContent>
      </Card>
    </div>
  );
}

function CourseInfo({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="border bg-background p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 wrap-break-word font-medium">
        {value || "Unavailable"}
      </p>
    </div>
  );
}
