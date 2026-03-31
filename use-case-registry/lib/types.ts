export interface Actor {
  name: string;
  desc: string;
}

export interface Step {
  actorIdx: number;
  action: string;
  dataIn?: string;
  dataOut?: string;
  logic?: string;
}

export interface DataElement {
  name: string;
  def: string;
  url: string;
}

export interface StandardsMapping {
  dataElement: string;
  standard: string;    // CEDS, Credential Engine, SIF, IMS, etc.
  mappedField: string;
  mappingNotes: string;
}

export interface Code {
  ref: string;
  type: string;
  val: string;
  vRef: string;
}

export interface UserStory {
  id: string;
  actor: string;
  action: string;
  dataImplications: string;
  acceptanceCriteria: string;
}

export interface UseCaseState {
  // Anchored Modeling Framework
  topic: string;
  businessDriver: string;

  // Core fields
  title: string;
  intro: string;
  objectives: string;
  scenario: string;

  // Actors & Process
  actors: Actor[];
  steps: Step[];

  // User Stories
  userStories: UserStory[];

  // Content sections
  concepts: string[];
  dataElements: DataElement[];
  deps: string[];
  outcomes: string[];
  references: { title: string; url: string }[];

  // Standards & Data Mapping
  standardsMappings: StandardsMapping[];

  // Categories
  primaryCategory: string;
  tags: string[];
  codes: Code[];
}

export const defaultState: UseCaseState = {
  topic: "",
  businessDriver: "",
  title: "",
  intro: "",
  objectives: "",
  scenario: "",
  actors: [{ name: "User", desc: "" }],
  steps: [{ actorIdx: 0, action: "", dataIn: "", dataOut: "", logic: "" }],
  userStories: [],
  concepts: [],
  dataElements: [],
  deps: [],
  outcomes: [],
  references: [],
  standardsMappings: [],
  primaryCategory: "",
  tags: [],
  codes: [],
};

export const STANDARDS_OPTIONS = [
  "CEDS",
  "Credential Engine (CTDL)",
  "SIF",
  "IMS Global (1EdTech)",
  "Ed-Fi",
  "PESC",
  "Open Badges",
  "CLR Standard",
  "xAPI / TinCan",
  "HR Open Standards",
  "Other",
];

export const CATEGORY_OPTIONS = [
  "All Learning Counts",
  "AI-Empowered Learning",
  "Government & Administrative",
  "Health Care",
  "Workforce Development",
  "K-12 Education",
  "Higher Education",
  "Credentialing & Certification",
];
