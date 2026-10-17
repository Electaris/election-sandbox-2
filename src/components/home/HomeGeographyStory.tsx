import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { states2024 } from "../../data/states";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const codes = ["WI", "MI", "PA"] as const;
const chapters = [
  { code: "WI", heading: "A margin smaller than a percentage point.", text: "Wisconsin offers the closest statewide result of the three detailed models. Open the ward reconstruction to examine the local geography, with estimated values clearly identified." },
  { code: "MI", heading: "Local votes. Statewide consequences.", text: "Michigan’s result combines millions of ballots across cities, suburbs, and rural communities. Inspect precinct returns to see where a statewide assumption has its greatest effect." },
  { code: "PA", heading: "Nineteen electoral votes. One statewide result.", text: "Pennsylvania carries the largest electoral allocation in this three-state foundation. Explore the certified result, then test how local changes propagate to the Electoral College." },
] as const;
const battlegrounds = ["WI", "MI", "PA", "GA", "NV", "NC", "AZ"].map(code => states2024.find(state => state.code === code)!);
const number = new Intl.NumberFormat("en-US");

export function HomeGeographyStory({ onState }: { onState: (code: string) => void }) {
  const scope = useRef<HTMLElement>(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      const root = scope.current!;
      chapters.forEach(chapter => {
        const article = root.querySelector<HTMLElement>(`[data-chapter="${chapter.code}"]`)!;
        const emphasize = () => { root.dataset.focus = chapter.code; };
        ScrollTrigger.create({ id: `atlas-chapter-${chapter.code}`, trigger: article, start: "top 55%", end: "bottom 55%", onEnter: emphasize, onEnterBack: emphasize });
      });
      gsap.fromTo(".geography-reading-progress i", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { id: "atlas-geography-progress", trigger: root, start: "top center", end: "bottom center", scrub: true } });
      return () => { delete root.dataset.focus; };
    }, scope);
    return () => media.revert();
  }, { scope });

  return <section className="home-geography-story" ref={scope} aria-labelledby="geography-heading">
    <div className="home-section-rule"><span className="home-kicker">THE GEOGRAPHY OF VICTORY</span><span>01 / READ THE RESULT</span></div>
    <div className="geography-layout">
      <figure className="geography-comparison">
        <figcaption><span className="home-kicker">CERTIFIED 2024 RESULTS</span><h2 id="geography-heading">Close margins.<br /><em>Lasting consequences.</em></h2><p>Seven battlegrounds, ordered by Trump’s statewide winning margin.</p></figcaption>
        <div className="geography-axis" aria-hidden="true"><span>Trump margin</span><div><span>0</span><span>3</span><span>6 pts</span></div></div>
        <ol className="geography-margin-list" aria-label="Certified battleground margins">
          {battlegrounds.map(state => {
            const margin = (state.trumpVotes - state.harrisVotes) / state.totalVotes * 100;
            return <li className="geography-margin-row" data-state={state.code} key={state.code}>
              <span>{state.name}<small>{state.harrisElectoralVotes + state.trumpElectoralVotes} EV</small></span>
              <div className="geography-margin-track" aria-hidden="true"><i style={{ width: `${margin / 6 * 100}%` }} /></div>
              <strong>+{margin.toFixed(2)}<span className="visually-hidden"> percentage points</span></strong>
            </li>;
          })}
        </ol>
        <p className="home-data-caption">Trump minus Harris, divided by all presidential ballots. Electoral votes are the state’s full allocation. Source: certified statewide totals compiled by the FEC.</p>
        <nav className="geography-chapter-nav" aria-label="Read a detailed state chapter">{codes.map(code => <a href={`#chapter-${code}`} key={code}>{code}<span aria-hidden="true"> ↓</span></a>)}</nav>
      </figure>
      <div className="geography-chapters">
        <span className="geography-reading-progress" aria-hidden="true"><i /></span>
        {chapters.map((chapter, index) => {
          const state = states2024.find(item => item.code === chapter.code)!;
          return <article className="geography-chapter" id={`chapter-${chapter.code}`} data-chapter={chapter.code} key={chapter.code}>
            <span className="home-kicker">0{index + 1} / {state.name.toUpperCase()}</span>
            <h3>{chapter.heading}</h3><p>{chapter.text}</p>
            <dl><div><dt>Trump’s vote advantage</dt><dd>{number.format(state.trumpVotes - state.harrisVotes)}<small> ballots</small></dd></div><div><dt>Electoral votes</dt><dd>{state.harrisElectoralVotes + state.trumpElectoralVotes}</dd></div></dl>
            <button className="home-text-link" type="button" onClick={() => onState(chapter.code)}>Inspect {state.name}<span aria-hidden="true">↗</span></button>
          </article>;
        })}
      </div>
    </div>
  </section>;
}
