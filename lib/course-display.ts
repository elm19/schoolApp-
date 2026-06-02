export type StudentCourseDisplay = {
  code: string;
  name: string | null;
};

export type CourseRowLike = {
  id?: string | number | null;
  code?: string | null;
  course_code?: string | null;
  name?: string | null;
  title?: string | null;
};

export function getCourseCode(course: CourseRowLike) {
  return String(course.code ?? course.course_code ?? course.id ?? "");
}

export function getCourseName(course: CourseRowLike) {
  return course.name ?? course.title ?? null;
}

export function getCourseLabel(course: StudentCourseDisplay) {
  return course.name ? `${course.code} - ${course.name}` : course.code;
}
