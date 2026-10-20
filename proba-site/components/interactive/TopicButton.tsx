"use client";

import { reachGoal, type Goal } from "@/lib/analytics";
import type { TOPICS } from "@/lib/lead-schema";
import { chooseTopic } from "@/lib/topic-bus";

export function TopicButton({
  topic,
  goal,
  className,
  children,
}: {
  topic: (typeof TOPICS)[number];
  goal?: Goal;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-topic={topic}
      className={className}
      onClick={() => {
        if (goal) reachGoal(goal);
        chooseTopic(topic);
      }}
    >
      {children}
    </button>
  );
}
