import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type SessionType = "course" | "TP";

const periodsBySessionType: Record<SessionType, string[]> = {
  TP: ["08:30 - 11:30", "11:30 - 14:30", "13:30 - 16:30", "16:30 - 19:30"],
  course: ["08:30 - 10:30", "10:30 - 12:30", "14:30 - 16:30", "16:30 - 18:30"],
};

export async function POST(request: NextRequest) {
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

  if (user.user_metadata?.role !== "teacher") {
    return NextResponse.json(
      { success: false, message: "Only teachers can start roll call." },
      { status: 403 },
    );
  }

  const staff = await getConfirmedStaff(supabase, user.id);
  if (!staff) {
    return NextResponse.json(
      { success: false, message: "Teacher status is pending confirmation." },
      { status: 403 },
    );
  }

  const body = (await request.json()) as {
    courseId?: string;
    date?: string;
    period?: string;
    section?: string;
    sessionType?: SessionType;
  };

  if (
    !body.courseId ||
    !body.date ||
    !body.period ||
    !body.section ||
    !body.sessionType
  ) {
    return NextResponse.json(
      { success: false, message: "Missing required roll call fields." },
      { status: 400 },
    );
  }

  const periodIndex = periodsBySessionType[body.sessionType]?.indexOf(body.period);
  if (periodIndex === undefined || periodIndex < 0) {
    return NextResponse.json(
      { success: false, message: "Invalid period for the selected session type." },
      { status: 400 },
    );
  }

  const { error } = await supabase.from("attendence_list").insert({
    date: body.date,
    courses_id: body.courseId,
    isTP: body.sessionType === "TP",
    period: periodIndex + 1,
    class: body.section,
  });

  if (error) {
    return NextResponse.json(
      { success: false, message: "Could not create roll call." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: "Roll call created successfully.",
  });
}

async function getConfirmedStaff(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const userIdColumns = ["user_id", "id", "teacher_id", "auth_user_id"];

  for (const column of userIdColumns) {
    const { data, error } = await supabase
      .from("staff")
      .select("name")
      .eq(column, userId)
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  }

  return null;
}
