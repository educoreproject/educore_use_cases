import { UseCaseState } from "./types";

export function generateMarkdown(s: UseCaseState): string {
  const swim =
    `### **6. Interaction Swimlane**\n\n` +
    `<table class="swimlane-table"><thead><tr><th>#</th>${s.actors
      .map((a) => `<th>${a.name}</th>`)
      .join("")}</tr></thead><tbody>` +
    s.steps
      .map(
        (st, i) =>
          `<tr><td>${i + 1}</td>${s.actors
            .map((_, ai) =>
              ai == st.actorIdx
                ? `<td><strong>${st.action}</strong>${st.dataIn ? `<br><em>In: ${st.dataIn}</em>` : ""}${st.dataOut ? `<br><em>Out: ${st.dataOut}</em>` : ""}</td>`
                : `<td></td>`
            )
            .join("")}</tr>`
      )
      .join("") +
    `</tbody></table>`;

  const userStoriesMd =
    s.userStories.length > 0
      ? `### **12. User Stories**\n\n| ID | Actor | Action | Data Implications | Acceptance Criteria |\n| :--- | :--- | :--- | :--- | :--- |\n${s.userStories.map((us) => `| ${us.id} | ${us.actor} | ${us.action} | ${us.dataImplications} | ${us.acceptanceCriteria} |`).join("\n")}`
      : `### **12. User Stories**\n\n_No user stories defined._`;

  const standardsMd =
    s.standardsMappings.length > 0
      ? `### **14. Standards & Data Mappings**\n\n| Data Element | Standard | Mapped Field | Notes |\n| :--- | :--- | :--- | :--- |\n${s.standardsMappings.map((m) => `| ${m.dataElement} | ${m.standard} | ${m.mappedField} | ${m.mappingNotes} |`).join("\n")}`
      : `### **14. Standards & Data Mappings**\n\n_No mappings defined._`;

  const catMd = `### **13. Categories**\n**Primary Category:** ${s.primaryCategory || "None"}\n\n**Tags:** ${s.tags.join(", ") || "None"}\n\n| Code Ref | Code Type | Code Value | Code Value Ref |\n| :--- | :--- | :--- | :--- |\n${s.codes.map((c) => `| ${c.ref} | ${c.type} | ${c.val} | ${c.vRef} |`).join("\n")}`;

  const anchoredMd = s.topic || s.businessDriver
    ? `### **0. Anchored Model**\n**Topic:** ${s.topic || "—"}\n\n**Business Driver (The "Why"):** ${s.businessDriver || "—"}`
    : "";

  const sections = [
    `## **Use Case: ${s.title}**`,
    ...(anchoredMd ? [anchoredMd] : []),
    `### **1. Introduction**\n${s.intro}`,
    `### **2. Objectives**\n${s.objectives}`,
    `### **3. Scenario**\n${s.scenario}`,
    `### **4. Actors**\n| Actor | Role |\n| :--- | :--- |\n${s.actors.map((a) => `| **${a.name}** | ${a.desc} |`).join("\n")}`,
    `### **5. Steps**\n| # | Actor | Action | Data In | Data Out |\n| :--- | :--- | :--- | :--- | :--- |\n${s.steps.map((st, i) => `| ${i + 1} | ${s.actors[st.actorIdx]?.name ?? ""} | ${st.action} | ${st.dataIn ?? ""} | ${st.dataOut ?? ""} |`).join("\n")}`,
    swim,
    `### **7. Key Concepts**\n${s.concepts.map((c) => `* ${c}`).join("\n")}`,
    `### **8. Data**\n| Name | Definition | URL |\n| :--- | :--- | :--- |\n${s.dataElements.map((d) => `| ${d.name} | ${d.def} | ${d.url} |`).join("\n")}`,
    `### **9. Dependencies**\n${s.deps.map((d) => `* ${d}`).join("\n")}`,
    `### **10. Outcomes**\n${s.outcomes.map((o) => `* ${o}`).join("\n")}`,
    `### **11. References**\n${s.references.map((r) => `* [${r.title}](${r.url})`).join("\n")}`,
    userStoriesMd,
    catMd,
    standardsMd,
  ];

  return sections.join("\n\n---\n\n");
}
