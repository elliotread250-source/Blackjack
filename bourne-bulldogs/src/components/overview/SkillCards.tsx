"use client";

import { useState } from "react";
import { DrawIcon } from "@/components/fx/DrawIcon";

type Skill = { key: string; title: string; front: string; back: string };
const icon: Record<string, string> = { team: "team", confidence: "crown", communication: "chat", leadership: "shield", fitness: "bolt", fun: "smile" };

/** Six skills that flip over on hover (desktop) or tap. */
export function SkillCards({ skills }: { skills: Skill[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {skills.map((s, i) => (
        <li key={s.key}>
          <SkillCard skill={s} index={i} />
        </li>
      ))}
    </ul>
  );
}

function SkillCard({ skill, index }: { skill: Skill; index: number }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setFlipped((f) => !f)}
      aria-pressed={flipped}
      className="flip block h-64 w-full text-left"
      data-hover-flip
      data-flipped={flipped}
    >
      <span className="flip-inner block h-full w-full">
        <span className="flip-face absolute inset-0 flex flex-col justify-between rounded-[12px] border border-bone/10 bg-coal p-7">
          <span className="flex items-start justify-between">
            <DrawIcon name={icon[skill.key]} className="h-12 w-12 text-orange" delay={index * 0.1} />
            <span className="display text-4xl text-bone/15" aria-hidden>
              {String(index + 1).padStart(2, "0")}
            </span>
          </span>
          <span>
            <span className="display block text-5xl">{skill.title}</span>
            <span className="mt-2 block text-muted">{skill.front}</span>
          </span>
        </span>
        <span className="flip-face flip-back flex flex-col justify-between rounded-[12px] bg-orange p-7 text-ink">
          <span className="eyebrow">{skill.title}</span>
          <span className="display text-[2.1rem] leading-[1]">{skill.back}</span>
        </span>
      </span>
    </button>
  );
}
