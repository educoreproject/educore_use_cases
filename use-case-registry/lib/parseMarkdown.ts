import { UseCaseState, defaultState } from "./types";

export function parseMarkdownToState(title: string, body: string): UseCaseState {
  const state: UseCaseState = JSON.parse(JSON.stringify(defaultState));
  state.title = title.replace("Use Case: ", "").trim();

  const parts = body.split(/\n---\n/);
  const find = (n: number | string) =>
    parts.find((p) => p.includes(`### **${n}.`)) || "";
  const clean = (t: string) =>
    t.replace(/### \*\*\d+\. .*?\*\*/, "").trim();

  // Parse anchored model section (section 0)
  const anchoredPart = find(0);
  if (anchoredPart) {
    const topicMatch = anchoredPart.match(/\*\*Topic:\*\*\s*(.*)/);
    const driverMatch = anchoredPart.match(/\*\*Business Driver.*?\*\*\s*(.*)/);
    if (topicMatch) state.topic = topicMatch[1].trim();
    if (driverMatch) state.businessDriver = driverMatch[1].trim();
  }

  state.intro = clean(find(1));
  state.objectives = clean(find(2));
  state.scenario = clean(find(3));

  const pTable = (c: string) =>
    c
      .split("\n")
      .filter(
        (r) =>
          r.includes("|") &&
          !r.includes(":---") &&
          !r.includes("| Actor |") &&
          !r.includes("| # |") &&
          !r.includes("| Name |") &&
          !r.includes("| Code Ref |") &&
          !r.includes("| ID |") &&
          !r.includes("| Data Element |")
      )
      .map((r) =>
        r
          .split("|")
          .map((x) => x.trim())
          .filter((x) => x !== "")
      );

  const aRows = pTable(find(4));
  state.actors = aRows.map((r) => ({
    name: r[0]?.replace(/\*\*/g, "") ?? "",
    desc: r[1] ?? "",
  }));
  if (state.actors.length === 0) {
    state.actors = [{ name: "User", desc: "" }];
  }

  const sRows = pTable(find(5));
  state.steps = sRows.map((r) => ({
    actorIdx: Math.max(
      0,
      state.actors.findIndex((a) => a.name === r[1])
    ),
    action: r[2] ?? "",
    dataIn: r[3] ?? "",
    dataOut: r[4] ?? "",
    logic: "",
  }));
  if (state.steps.length === 0) {
    state.steps = [{ actorIdx: 0, action: "", dataIn: "", dataOut: "", logic: "" }];
  }

  const dRows = pTable(find(8));
  state.dataElements = dRows.map((r) => ({
    name: r[0] ?? "",
    def: r[1] ?? "",
    url: r[2] ?? "",
  }));

  const refSection = clean(find(11));
  state.references = refSection
    .split("\n")
    .filter((line) => line.startsWith("* "))
    .map((line) => {
      const match = line.match(/\* \[([^\]]+)\]\(([^)]+)\)/);
      return match ? { title: match[1], url: match[2] } : { title: "", url: "" };
    });

  const parseList = (section: string) =>
    section
      .split("\n")
      .filter((line) => line.trim())
      .map((line) => (line.startsWith("* ") ? line.substring(2) : line));

  state.concepts = parseList(clean(find(7)));
  state.deps = parseList(clean(find(9)));
  state.outcomes = parseList(clean(find(10)));

  // Section 12 - User Stories
  const usPart = find(12);
  if (usPart) {
    const usRows = pTable(usPart);
    state.userStories = usRows.map((r) => ({
      id: r[0] ?? "",
      actor: r[1] ?? "",
      action: r[2] ?? "",
      dataImplications: r[3] ?? "",
      acceptanceCriteria: r[4] ?? "",
    }));
  }

  // Section 13 - Categories
  const catPart = find(13);
  if (catPart) {
    state.primaryCategory =
      catPart.match(/\*\*Primary Category:\*\* (.*)/)?.[1] || "";
    const tagsRaw =
      catPart.match(/\*\*Tags:\*\* (.*)/)?.[1] || "";
    state.tags =
      tagsRaw === "None" || !tagsRaw
        ? []
        : tagsRaw.split(",").map((t) => t.trim());
    const cRows = pTable(catPart);
    state.codes = cRows.map((r) => ({
      ref: r[0] ?? "",
      type: r[1] ?? "",
      val: r[2] ?? "",
      vRef: r[3] ?? "",
    }));
  }

  // Section 14 - Standards Mappings
  const mappingPart = find(14);
  if (mappingPart) {
    const mRows = pTable(mappingPart);
    state.standardsMappings = mRows.map((r) => ({
      dataElement: r[0] ?? "",
      standard: r[1] ?? "",
      mappedField: r[2] ?? "",
      mappingNotes: r[3] ?? "",
    }));
  }

  return state;
}
