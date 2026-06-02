import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { scrapeStudentCourseCodes } from "@/lib/scrapper/courses";
import { visitUrl } from "@/lib/scrapper/utils";
import { getCourseName, type StudentCourseDisplay } from "@/lib/course-display";
import { createClient } from "@/lib/supabase/server";

const COURSE_REGISTRATION_URL =
  "https://schoolapp.ensam-umi.ac.ma/student/inscriptioncours";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, message: "You must be signed in." },
      { status: 401 },
    );
  }

  const { data: savedCourses, error: savedCoursesError } = await supabase
    .from("student_courses")
    .select("course_id");

  if (savedCoursesError) {
    return NextResponse.json(
      { success: false, message: "Could not check saved courses. Try again." },
      { status: 500 },
    );
  }

  if (savedCourses && savedCourses.length > 0) {
    const courseCodes = savedCourses.map((course) => String(course.course_id));
    const courses = await getCoursesByCode(supabase, courseCodes);

    return NextResponse.json({
      success: true,
      courseCodes,
      courses,
      message: "Loaded saved courses.",
    });
  }

  const sessionId = await getStoredSessionId();

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        message: "SchoolApp session is missing. Please reconnect your profile.",
      },
      { status: 400 },
    );
  }

  const visitResult = await visitUrl({
    toVisiteUrl: COURSE_REGISTRATION_URL,
    returnContent: true,
    sessionId,
  });

  if (!visitResult || typeof visitResult === "boolean") {
    return NextResponse.json(
      {
        success: false,
        message: "Could not fetch courses from SchoolApp. Please reconnect and try again.",
      },
      { status: 502 },
    );
  }

  const courseCodes = scrapeStudentCourseCodes(visitResult.data);
  const rowsToInsert = courseCodes.map((courseCode) => ({
    course_id: courseCode,
  }));

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("student_courses")
      .insert(rowsToInsert);

    if (insertError) {
      return NextResponse.json(
        { success: false, message: "Could not import courses. Try again." },
        { status: 500 },
      );
    }
  }

  const courses = await getCoursesByCode(supabase, courseCodes);

  return NextResponse.json({
    success: true,
    courseCodes,
    courses,
    message: "Courses imported successfully.",
  });
}

async function getCoursesByCode(
  supabase: Awaited<ReturnType<typeof createClient>>,
  courseCodes: string[],
) {
  const { data } = await supabase
    .from("courses")
    .select("*")
    .in("code", courseCodes);
  const coursesByCode = new Map(
    (data ?? []).map((course) => [
      String(course.code ?? ""),
      getCourseName(course),
    ]),
  );

  return courseCodes.map((code) => ({
    code,
    name: coursesByCode.get(code) ?? null,
  })) satisfies StudentCourseDisplay[];
}

async function getStoredSessionId() {
  const cookieStore = await cookies();
  const directSessionId = cookieStore.get("sessionId")?.value;

  if (directSessionId) {
    return directSessionId;
  }

  const userCookie = cookieStore.get("user")?.value;
  if (!userCookie) {
    return null;
  }

  try {
    const parsed = JSON.parse(userCookie) as { sessionId?: string };
    return parsed.sessionId ?? null;
  } catch {
    return null;
  }
}
