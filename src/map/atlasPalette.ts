export type MajorParty = "DEM" | "GOP";
export type AtlasPlurality = MajorParty | "GRN" | "LIB" | "OTHER" | "TIE";

export interface AtlasCandidateResult {
  harrisVotes: number;
  trumpVotes: number;
  totalVotes: number;
  steinVotes?: number;
  oliverVotes?: number;
  residualOtherVotes?: number;
}

export const ATLAS_NEUTRAL = "#dfe2da";
export const ATLAS_GREEN = "#4f815d";
export const ATLAS_LIBERTARIAN = "#b78335";
export const ATLAS_OTHER = "#77647d";

export const majorPartyBands = [
  { max: 1, dem: "#dde9df", gop: "#f1e4bc" },
  { max: 3, dem: "#c9e2e1", gop: "#f2da9c" },
  { max: 5, dem: "#b2d9de", gop: "#f3ce82" },
  { max: 10, dem: "#98cbd7", gop: "#f2be6d" },
  { max: 15, dem: "#7ebacf", gop: "#eeaa5e" },
  { max: 20, dem: "#67a9c5", gop: "#e99553" },
  { max: 30, dem: "#5195b8", gop: "#e17e4a" },
  { max: 40, dem: "#3d7fab", gop: "#d56743" },
  { max: 50, dem: "#2e699c", gop: "#c6503d" },
  { max: 60, dem: "#22558a", gop: "#b43d38" },
  { max: Number.POSITIVE_INFINITY, dem: "#173f74", gop: "#982f32" },
] as const;

const thirdPartyBands = [
  { max: 1, grn: "#e4ece2", lib: "#f0e7d6", other: "#e9e3eb" },
  { max: 3, grn: "#d2e2d1", lib: "#ead9bd", other: "#ddd2e1" },
  { max: 5, grn: "#bfd7be", lib: "#e2cba3", other: "#d1c1d6" },
  { max: 10, grn: "#a8c9a7", lib: "#d8bb87", other: "#c2adca" },
  { max: 15, grn: "#90ba91", lib: "#cca96e", other: "#b198bb" },
  { max: 20, grn: "#78aa7b", lib: "#bf9859", other: "#9f82aa" },
  { max: 30, grn: "#619765", lib: "#af8444", other: "#8c6e98" },
  { max: 40, grn: ATLAS_GREEN, lib: ATLAS_LIBERTARIAN, other: ATLAS_OTHER },
  { max: 50, grn: "#3f714d", lib: "#9e6f2c", other: "#695472" },
  { max: 60, grn: "#346441", lib: "#916224", other: "#5d4867" },
  { max: Number.POSITIVE_INFINITY, grn: "#285536", lib: "#80531d", other: "#503c59" },
] as const;

export function atlasMarginColor(margin: number, party: MajorParty | null) {
  if (!party || !Number.isFinite(margin)) return ATLAS_NEUTRAL;
  const band = majorPartyBands.find((entry) => Math.abs(margin) < entry.max) ?? majorPartyBands.at(-1)!;
  return party === "DEM" ? band.dem : band.gop;
}

export function atlasPluralityMarginColor(
  margin: number,
  plurality: Exclude<AtlasPlurality, "TIE"> | null,
) {
  if (!plurality || !Number.isFinite(margin)) return ATLAS_NEUTRAL;
  if (plurality === "DEM" || plurality === "GOP") return atlasMarginColor(margin, plurality);
  const band = thirdPartyBands.find((entry) => Math.abs(margin) < entry.max)
    ?? thirdPartyBands.at(-1)!;
  if (plurality === "GRN") return band.grn;
  if (plurality === "LIB") return band.lib;
  return band.other;
}

export function atlasPlurality(result: AtlasCandidateResult): AtlasPlurality {
  const candidates: Array<{
    plurality: Exclude<AtlasPlurality, "TIE">;
    votes: number;
  }> = [
    { plurality: "DEM" as const, votes: result.harrisVotes },
    { plurality: "GOP" as const, votes: result.trumpVotes },
  ];
  const hasNamedCandidateVector = [
    result.steinVotes,
    result.oliverVotes,
    result.residualOtherVotes,
  ].every((votes) => Number.isSafeInteger(votes) && (votes ?? -1) >= 0);
  if (hasNamedCandidateVector) {
    candidates.push(
      { plurality: "GRN" as const, votes: result.steinVotes! },
      { plurality: "LIB" as const, votes: result.oliverVotes! },
      { plurality: "OTHER" as const, votes: result.residualOtherVotes! },
    );
  }
  const ranked = [...candidates].sort((left, right) => right.votes - left.votes);
  if (ranked.length < 2 || ranked[0].votes === ranked[1].votes) return "TIE";
  return ranked[0].plurality;
}

export function atlasPluralityMargin(result: AtlasCandidateResult) {
  const plurality = atlasPlurality(result);
  if (plurality === "TIE" || result.totalVotes <= 0) return 0;
  const candidates = [
    { plurality: "DEM" as const, votes: result.harrisVotes },
    { plurality: "GOP" as const, votes: result.trumpVotes },
  ];
  const namedCandidates = [result.steinVotes, result.oliverVotes, result.residualOtherVotes]
    .every((votes) => Number.isSafeInteger(votes) && votes! >= 0)
    ? [
        { plurality: "GRN" as const, votes: result.steinVotes! },
        { plurality: "LIB" as const, votes: result.oliverVotes! },
        { plurality: "OTHER" as const, votes: result.residualOtherVotes! },
      ]
    : [];
  const ranked = [...candidates, ...namedCandidates]
    .sort((left, right) => right.votes - left.votes);
  return ((ranked[0].votes - (ranked[1]?.votes ?? 0)) / result.totalVotes) * 100;
}

export function atlasResultColor(result: AtlasCandidateResult | undefined) {
  if (!result || !Number.isSafeInteger(result.totalVotes) || result.totalVotes <= 0) {
    return ATLAS_NEUTRAL;
  }
  const plurality = atlasPlurality(result);
  if (plurality === "TIE") return ATLAS_NEUTRAL;
  return atlasPluralityMarginColor(atlasPluralityMargin(result), plurality);
}

export function hexToDeckColor(hex: string, alpha = 255): [number, number, number, number] {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, alpha];
}
