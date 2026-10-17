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
      const intro = gsap.timeline({ defaults: { duration: .65, ease: "power2.out", clearProps: "transform,opacity" } });
      intro.from(".home-eyebrow", { opacity: .3, y: 8 })
        .from(".home-headline-line", { yPercent: 24, opacity: .35, stagger: .08 }, .08)
        .from(".home-deck, .home-hero-actions", { y: 12, opacity: .4, stagger: .07 }, .2)
        .from(".home-baseline, .home-cartography-caption", { y: 10, opacity: .4, stagger: .08 }, .25);
      // Translate the map's wrapper, leaving deck.gl as the sole camera owner.
      intro.from(".map-stage", { y: 16, opacity: .55, duration: .9 }, .15);
    }, scope);
    return () => media.revert();
  }, { scope, dependencies: [home], revertOnUpdate: true });
}
