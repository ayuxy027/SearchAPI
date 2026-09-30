
export type Source = "linkedin" | "instagram";

export type Signal = {
  text: string;
  kind: "observed" | "inferred";
  source: Source;
};

export type Analysis = {
  summary: string;
  interests: Signal[];
  hobbies: Signal[];
  lifestyle: Signal[];
  needs: Signal[];
  personality: Signal[];
  constraints: Signal[];
};

export type SourceData = {
  linkedin: {
    url: string;
    ok: boolean;
    error?: string;
    name?: string;
    headline?: string;
    location?: string;
    about?: string;
    photo?: string;
    experience?: string[];
    education?: string[];
  };
  instagram: {
    url: string;
    ok: boolean;
    error?: string;
    username?: string;
    fullName?: string;
    bio?: string;
    photo?: string;
    followers?: number;
    posts?: { caption: string; hashtags: string[]; location?: string }[];
  };
};

export type Person = {
  id: string;
  name: string;
  photo?: string;
  headline?: string;
  linkedinUrl: string;
  instagramUrl: string;
  sources: SourceData;
  analysis: Analysis | null;
};

export type Turn = { speaker: "a" | "b"; text: string };

export type DateResult = {
  a: string;
  b: string;
  aConsidersB: string;
  bConsidersA: string;
  transcript: Turn[];
  verdict: {
    score: number;
    aScore: number;
    bScore: number;
    sharedInterests: string[];
    complementaryTraits: string[];
    concerns: string[];
    summary: string;
  };
};

export type RankingEntry = {
  candidate: string;
  score: number;
  summary: string;
  sharedInterests: string[];
  complementaryTraits: string[];
  concerns: string[];
};
