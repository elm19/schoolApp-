"use client";

import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ActionType = "roll_call" | "presentation";
type SessionType = "course" | "TP";

type CourseOption = {
  code: string;
  name: string | null;
};

type TeacherSessionActionsProps = {
  courses: CourseOption[];
};

const years = ["1", "2", "3", "4", "5"];
const sections = ["sec1", "sec2", "sec3", "sec4", "sec5", "sec6", "sec7", "sec8"];
const periodsBySessionType: Record<SessionType, string[]> = {
  TP: ["08:30 - 11:30", "11:30 - 14:30", "13:30 - 16:30", "16:30 - 19:30"],
  course: ["08:30 - 10:30", "10:30 - 12:30", "14:30 - 16:30", "16:30 - 18:30"],
};

export function TeacherSessionActions({ courses }: TeacherSessionActionsProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <SessionSheet
        actionType="roll_call"
        buttonLabel="Start roll call"
        courses={courses}
        title="Start roll call"
      />
      <SessionSheet
        actionType="presentation"
        buttonLabel="Start presentation session"
        courses={courses}
        title="Start presentation session"
      />
    </div>
  );
}

function SessionSheet({
  actionType,
  buttonLabel,
  courses,
  title,
}: {
  actionType: ActionType;
  buttonLabel: string;
  courses: CourseOption[];
  title: string;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(years[0]);
  const [section, setSection] = useState(sections[0]);
  const [courseId, setCourseId] = useState(courses[0]?.code ?? "");
  const [sessionType, setSessionType] = useState<SessionType>("course");
  const [period, setPeriod] = useState(periodsBySessionType.course[0]);

  function handleSessionTypeChange(value: SessionType) {
    setSessionType(value);
    setPeriod(periodsBySessionType[value][0]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    console.log({
      actionType,
      year,
      section,
      group: String(formData.get("group") ?? ""),
      courseId,
      sessionType,
      date: String(formData.get("date") ?? ""),
      period,
    });
    setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant={actionType === "roll_call" ? "default" : "outline"}>
          {buttonLabel}
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>
            Choose the class, course, date, and period for this session.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 px-8 pb-8">
          <SelectField label="Year" value={year} onValueChange={setYear} values={years} />
          <SelectField
            label="Section"
            value={section}
            onValueChange={setSection}
            values={sections}
          />

          <div className="space-y-2">
            <Label htmlFor={`${actionType}-group`}>Group</Label>
            <Input id={`${actionType}-group`} name="group" placeholder="Optional" />
          </div>

          <div className="space-y-2">
            <Label>Element / Course</Label>
            <Select value={courseId} onValueChange={setCourseId} disabled={courses.length === 0}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.code} value={course.code}>
                    {course.name ? `${course.code} - ${course.name}` : course.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No courses found in the courses table.
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Session type</Label>
            <Select value={sessionType} onValueChange={handleSessionTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="course">course</SelectItem>
                <SelectItem value="TP">TP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${actionType}-date`}>Date</Label>
            <Input id={`${actionType}-date`} name="date" type="date" required />
          </div>

          <div className="space-y-2">
            <Label>Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodsBySessionType[sessionType].map((periodOption) => (
                  <SelectItem key={periodOption} value={periodOption}>
                    {periodOption}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={!courseId}>
            Create session
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function SelectField({
  label,
  onValueChange,
  value,
  values,
}: {
  label: string;
  onValueChange: (value: string) => void;
  value: string;
  values: string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {values.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
