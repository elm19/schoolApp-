import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { scrapeStudentCourseCodes } from "@/lib/scrapper/courses";
import { visitUrl } from "@/lib/scrapper/utils";
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
  const { data: existingCourses } = await supabase
    .from("student_courses")
    .select("course_id")
    .in("course_id", courseCodes);
  const existingCourseIds = new Set(
    existingCourses?.map((course) => course.course_id) ?? [],
  );
  const rowsToInsert = courseCodes
    .filter((courseCode) => !existingCourseIds.has(courseCode))
    .map((courseCode) => ({ course_id: courseCode }));

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

  return NextResponse.json({
    success: true,
    courseCodes,
    message: "Courses imported successfully.",
  });
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
