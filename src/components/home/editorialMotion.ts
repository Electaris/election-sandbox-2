import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { RefObject } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Read-only development evidence for lifecycle tests; unused in the production UI.
export function editorialMotionDiagnostics() {
  return { chapterTriggers: ScrollTrigger.getAll().filter(trigger => String(trigger.vars.id ?? "").startsWith("atlas-")).length };
}

/** Presentation only: never tween vote counts or mutate a scenario. */
export function useEditorialMotion(scope: RefObject<HTMLElement | null>, home: boolean) {
  useGSAP(() => {
    if (!home || !scope.current) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      // Treat headline and terrain as one composition; controls never wait to appear.
      const intro = gsap.timeline({ defaults: { duration: .45, ease: "power2.out", clearProps: "transform,opacity" } });
      intro.from(".home-eyebrow", { opacity: .7, y: 4 })
        .from(".home-introduction h1", { y: 8, opacity: .8 }, 0)
        .from(".home-baseline", { y: 6, opacity: .8 }, .04);
      // No map translation: geography stays anchored while it becomes interactive.
    }, scope);
    return () => media.revert();
  }, { scope, dependencies: [home], revertOnUpdate: true });
}
