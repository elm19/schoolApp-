import * as cheerio from "cheerio";
import { NextRequest, NextResponse } from "next/server";

import { extractStudentInfo } from "@/lib/scrapper";
import { createClient } from "@/lib/supabase/server";

const SCHOOL_BASE_URL = "https://schoolapp.ensam-umi.ac.ma";
const LOGIN_URL = `${SCHOOL_BASE_URL}/login`;
const DASHBOARD_URL = `${SCHOOL_BASE_URL}/index`;

const extractSessionId = (headers: Headers): string | null => {
  const setCookie = headers.get("set-cookie");
  if (!setCookie) return null;
  const match = setCookie.match(/JSESSIONID=([^;]+)/);
  return match ? match[1] : null;
};

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 },
      );
    }

    const loginPageRes = await fetch(LOGIN_URL, {
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        "Cache-Control": "no-cache",
      },
    });

    if (!loginPageRes.ok) {
      return NextResponse.json(
        { success: false, message: "Failed to fetch login page" },
        { status: 500 },
      );
    }

    const loginHtml = await loginPageRes.text();
    const $login = cheerio.load(loginHtml);
    const csrfToken = $login('input[name="_csrf"]').val() as string;

    if (!csrfToken) {
      return NextResponse.json(
        { success: false, message: "CSRF token not found" },
        { status: 500 },
      );
    }

    const initialSessionId = extractSessionId(loginPageRes.headers);
    let sessionCookies = initialSessionId
      ? `JSESSIONID=${initialSessionId}`
      : "";

    const formData = new URLSearchParams();
    formData.append("_csrf", csrfToken);
    formData.append("email", email);
    formData.append("password", password);

    const loginRes = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: sessionCookies,
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        Referer: LOGIN_URL,
        Origin: SCHOOL_BASE_URL,
      },
      body: formData.toString(),
      redirect: "manual",
    });

    const sessionId = extractSessionId(loginRes.headers) || initialSessionId;
    sessionCookies = sessionId ? `JSESSIONID=${sessionId}` : "";

    if (loginRes.status !== 302) {
      return NextResponse.json(
        {
          success: false,
          studentInfo: null,
          message: "Invalid credentials or authentication failed",
        },
        { status: 401 },
      );
    }

    const dashboardRes = await fetch(DASHBOARD_URL, {
      headers: {
        Cookie: sessionCookies,
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
        Referer: LOGIN_URL,
      },
    });
    const dashboardContent = await dashboardRes.text();
    const $dashboard = cheerio.load(dashboardContent);
    const isAuthenticated =
      $dashboard('form[action="/login"]').length === 0 &&
      $dashboard('a[href*="logout"]').length > 0;

    if (!isAuthenticated) {
      return NextResponse.json(
        {
          success: false,
          studentInfo: null,
          message: "Invalid credentials or authentication failed",
        },
        { status: 401 },
      );
    }

    const studentInfo = extractStudentInfo(dashboardContent);
    const supabase = await createClient();
    const { error: profileError } = await supabase.from("profiles").upsert({
      email,
      code: studentInfo.Code || null,
      name: studentInfo.name || null,
      section: studentInfo["Filière"] || null,
      year: studentInfo.Niveau ? parseInt(studentInfo.Niveau, 10) : null,
      group_name: studentInfo.Groupe || null,
      subgroup: studentInfo["Sous Groupe"] || null,
      status: studentInfo.Statut || null,
    });

    if (profileError) {
      return NextResponse.json(
        {
          success: false,
          studentInfo,
          message: "Profile could not be created",
        },
        { status: 500 },
      );
    }

    const response = NextResponse.json({
      success: true,
      studentInfo,
      message: "Authentication successful",
    });

    if (sessionId) {
      response.cookies.set("user", JSON.stringify({ sessionId }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
      response.cookies.set("sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
      });
    }

    return response;
  } catch (error: unknown) {
    console.error("Authentication error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
