"use client";

import type * as React from "react";
import { useMemo, useState } from "react";

import { SessionCard } from "@/components/session-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import type { SessionRow } from "@/lib/school-data";

type SessionFilterProps = {
  sessions: SessionRow[];
  teacherNames: Record<string, string>;
};

type Filter = "all" | "roll" | "presentation";

export function SessionFilter({ sessions, teacherNames }: SessionFilterProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const filteredSessions = useMemo(() => {
    if (filter === "all") {
      return sessions;
    }

    return sessions.filter((session) => {
      if (session.event === "both") {
        return true;
      }

      return filter === "roll"
        ? session.event === "roll"
        : session.event === "presentation";
    });
  }, [filter, sessions]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterButton>
        <FilterButton active={filter === "roll"} onClick={() => setFilter("roll")}>
          Roll call
        </FilterButton>
        <FilterButton
          active={filter === "presentation"}
          onClick={() => setFilter("presentation")}
        >
          Presentation
        </FilterButton>
      </div>

      {filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              teacherName={teacherNames[session.teacher_id] ?? "Unavailable"}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No matching sessions"
          description="Try another filter to see roll call or presentation sessions."
        />
      )}
    </div>
  );
}

function FilterButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "default" : "outline"}
      className="rounded-full"
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
