import { states2024 } from "../../data/states";
import { HomeGeographyStory } from "./HomeGeographyStory";

type HomeActions = { onEnter: () => void; onState: (code: string) => void; onReplay: () => void };

export function HomeIntroduction({ onEnter }: Pick<HomeActions, "onEnter">) {
  return <section className="home-introduction" aria-labelledby="page-heading">
    <div className="home-eyebrow">THE PRESIDENTIAL ATLAS <span aria-hidden="true">/</span> 2024</div>
    <h1 id="page-heading"><span className="home-headline-line">The result is</span>{" "}<span className="home-headline-line">only the</span>{" "}<span className="home-headline-line"><em>beginning.</em></span></h1>
    <p className="home-deck">Explore the geography behind the vote. Change the assumptions. See how a different election unfolds.</p>
    <div className="home-hero-actions">
      <button className="home-primary-action" onClick={onEnter} type="button">Enter the laboratory <span aria-hidden="true">↗</span></button>
      <a className="home-text-link" href="#explore-states">Explore the states <span aria-hidden="true">↓</span></a>
    </div>
    <p className="home-hero-caption"><span>OFFICIAL RESULTS. EXPLICIT ASSUMPTIONS.</span>Explore the actual election, then build your counterfactual.</p>
  </section>;
}

export function HomeBaseline() {
  const electoral = states2024.reduce((sum, state) => ({ harris: sum.harris + state.harrisElectoralVotes, trump: sum.trump + state.trumpElectoralVotes }), { harris: 0, trump: 0 });
  return <div className="home-baseline" aria-label="Certified 2024 Electoral College baseline">
    <div className="home-baseline-top"><span>2024 PRESIDENTIAL ELECTION</span><span>Certified baseline</span></div>
    <div className="home-baseline-score"><span><i className="home-party-dot democratic" />Harris <strong>{electoral.harris}</strong></span><small>270 TO WIN</small><span><strong>{electoral.trump}</strong> Trump<i className="home-party-dot republican" /></span></div>
    <div className="home-electoral-bar" aria-hidden="true"><span /><span /><i /></div>
  </div>;
}

const stateNotes: Record<string, { unit: string; text: string }> = {
  PA: { unit: "Voting districts", text: "Trace the balance between Philadelphia, Pittsburgh, and the places in between." },
  MI: { unit: "Precincts", text: "Explore how local changes add up across Michigan’s varied electoral landscape." },
  WI: { unit: "Wards", text: "Examine a close statewide result through a detailed, labeled ward reconstruction." },
};

export function HomeSections({ onEnter, onState, onReplay }: HomeActions) {
  return <div className="home-edition-body">
    <div className="home-edition-facts" aria-label="Laboratory coverage"><span><b>2024</b> Historical baseline</span><span><b>50 states + D.C.</b> National results</span><span><b>3 states</b> Detailed local models</span><a href="#methodology">Explore our sources <span aria-hidden="true">↗</span></a></div>

    <HomeGeographyStory onState={onState} />

    <section className="home-foundation home-state-section" id="explore-states" aria-labelledby="home-foundation-heading">
      <div className="home-section-rule"><span className="home-kicker">THE LOCAL PICTURE</span><span>02 / EXPLORE</span></div>
      <div className="home-section-title"><h2 id="home-foundation-heading">Three states. Thousands of stories.</h2><p>Start with the actual result.<br />Find the places that could change it.</p></div>
      <div className="home-state-grid">
        {(["PA", "MI", "WI"] as const).map(code => {
          const state = states2024.find(item => item.code === code)!;
          const margin = (state.trumpVotes - state.harrisVotes) / state.totalVotes * 100;
          return <article className="home-state-story" key={code}>
            <div className="home-state-meta"><span>{code} / {stateNotes[code].unit}</span><span>{state.harrisElectoralVotes + state.trumpElectoralVotes} ELECTORAL VOTES</span></div>
            <h3><button onClick={() => onState(code)} type="button">{state.name}<span aria-hidden="true">↗</span></button></h3>
            <div className="home-state-result"><span className="home-party-dot republican" /><span>Trump</span><strong>+{margin.toFixed(1)}<small>pts</small></strong></div>
            <div className="home-state-vote-bar" aria-hidden="true"><span style={{ width: `${state.harrisVotes / state.totalVotes * 100}%` }} /><span style={{ width: `${state.trumpVotes / state.totalVotes * 100}%` }} /></div>
            <p>{stateNotes[code].text}</p>
            <button className="home-state-link" onClick={() => onState(code)} type="button">Explore {state.name}<span aria-hidden="true">→</span></button>
          </article>;
        })}
      </div>
      <p className="home-data-caption">Certified statewide margins · Local geography and match quality vary by state. Wisconsin’s ward values are reconstructed and explicitly labeled.</p>
    </section>

    <section className="home-capabilities home-experiences" aria-labelledby="home-capabilities-heading">
      <div className="home-section-rule"><span className="home-kicker">THE LABORATORY</span><span>03 / EXPERIMENT</span></div>
      <h2 id="home-capabilities-heading">A different way to understand an election.</h2>
      <div className="home-experience-grid">
        <article className="home-experience home-swing-story">
          <span className="home-kicker">SWINGOMETER</span><h3>What would it take<br />to change the result?</h3>
          <p>Model turnout, two-party preference, and third-party support. Follow the consequences from local votes to the Electoral College.</p>
          <ol className="home-process"><li><span>01</span>Change an assumption</li><li><span>02</span>Inspect the local effect</li><li><span>03</span>Follow the electoral consequence</li></ol>
          <button className="home-primary-action" onClick={onEnter} type="button">Build a scenario<span aria-hidden="true">↗</span></button>
          <small>Historical counterfactual · Exact, reproducible scenarios</small>
        </article>
        <article className="home-experience home-night-story">
          <span className="home-kicker">ELECTION NIGHT</span><h3>The same election.<br />A different night.</h3>
          <p>Watch your scenario arrive through local returns. Direct the order, pace, and pauses as the statewide picture takes shape.</p>
          <ol className="home-process"><li><span>01</span>Lock your scenario</li><li><span>02</span>Watch local returns arrive</li><li><span>03</span>Reach the exact modeled result</li></ol>
          <button className="home-primary-action" onClick={onReplay} type="button">Run election night<span aria-hidden="true">↗</span></button>
          <small>Historical scenario replay · Your assumptions, deterministic returns</small>
        </article>
      </div>
    </section>

    <section className="home-workflow home-method-story" aria-labelledby="home-workflow-heading">
      <div><span className="home-kicker">THE PRINCIPLE</span><h2 id="home-workflow-heading">Every change<br />should be explainable.</h2></div>
      <div><p className="home-method-lead">No changes means the actual result.</p><p>Begin with the certified 2024 baseline. Change an assumption, inspect the places that move, and share a scenario that can be reconstructed from its link.</p><p>Source gaps stay visible. Reconstructed values stay labeled. This is a place to explore historical possibilities, not a forecast.</p><a className="home-text-link" href="#methodology">Read the source foundations <span aria-hidden="true">↗</span></a><span className="home-workflow-label">Analyst workflow · Model → Inspect → Replay</span></div>
    </section>
    <div className="home-endnote"><span>AMERICAN ELECTORATE LABORATORY</span><span>Curiosity, grounded in evidence.</span><a href="#top">Back to top ↑</a></div>
  </div>;
}
