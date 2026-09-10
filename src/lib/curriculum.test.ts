import { describe, expect, it } from "vitest";
import { CURRICULUM_MODULES } from "./curriculum";
import { LESSONS } from "./repertoire";

describe("curriculum modules", () => {
  it("keeps independent practical paths with real missions", () => {
    expect(CURRICULUM_MODULES).toHaveLength(5);
    const lessonIds = new Set(LESSONS.map((lesson) => lesson.id));
    for (const module of CURRICULUM_MODULES) {
      expect(module.title.length).toBeGreaterThan(5);
      expect(module.steps.length).toBeGreaterThanOrEqual(2);
      expect(module.sources.length).toBeGreaterThan(0);
      expect(module.sources.every((source) => source.href.startsWith("https://"))).toBe(true);
      for (const step of module.steps) {
        expect(step.theory.length).toBeGreaterThan(20);
        expect(step.practice.length).toBeGreaterThan(20);
        expect(step.mission.length).toBeGreaterThan(10);
        expect(lessonIds.has(step.lessonId)).toBe(true);
      }
    }
  });
});
