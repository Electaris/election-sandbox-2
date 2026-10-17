import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

/** Keep the exact value in the DOM throughout its presentation transition. */
export function EditorialNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(ref.current, { opacity: .55, y: 5, duration: .28, ease: "power2.out", clearProps: "all" });
    });
    return () => media.revert();
  }, { scope: ref, dependencies: [value], revertOnUpdate: true });
  return <strong ref={ref} className={className}>{value}</strong>;
}
