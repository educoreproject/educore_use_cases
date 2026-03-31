"use client";

import { UseCaseState, STANDARDS_OPTIONS, CATEGORY_OPTIONS } from "@/lib/types";

interface Props {
  state: UseCaseState;
  onChange: (s: UseCaseState) => void;
}

export default function EditorPane({ state, onChange }: Props) {
  const set = (patch: Partial<UseCaseState>) => onChange({ ...state, ...patch });

  // ── Actors ─────────────────────────────────────────────────────────────────
  const addActor = () => set({ actors: [...state.actors, { name: "", desc: "" }] });
  const removeActor = (i: number) => set({ actors: state.actors.filter((_, idx) => idx !== i) });
  const updateActor = (i: number, field: "name" | "desc", val: string) => {
    const actors = state.actors.map((a, idx) => (idx === i ? { ...a, [field]: val } : a));
    set({ actors });
  };

  // ── Steps ──────────────────────────────────────────────────────────────────
  const addStep = () =>
    set({ steps: [...state.steps, { actorIdx: 0, action: "", dataIn: "", dataOut: "", logic: "" }] });
  const removeStep = (i: number) => set({ steps: state.steps.filter((_, idx) => idx !== i) });
  const moveStep = (i: number, dir: -1 | 1) => {
    const n = i + dir;
    if (n < 0 || n >= state.steps.length) return;
    const steps = [...state.steps];
    [steps[i], steps[n]] = [steps[n], steps[i]];
    set({ steps });
  };
  const updateStep = (i: number, field: keyof (typeof state.steps)[0], val: string | number) => {
    const steps = state.steps.map((s, idx) => (idx === i ? { ...s, [field]: val } : s));
    set({ steps });
  };

  // ── User Stories ───────────────────────────────────────────────────────────
  const addUserStory = () =>
    set({
      userStories: [
        ...state.userStories,
        { id: `US-${String(state.userStories.length + 1).padStart(3, "0")}`, actor: "", action: "", dataImplications: "", acceptanceCriteria: "" },
      ],
    });
  const removeUserStory = (i: number) =>
    set({ userStories: state.userStories.filter((_, idx) => idx !== i) });
  const updateUserStory = (i: number, field: keyof (typeof state.userStories)[0], val: string) => {
    const userStories = state.userStories.map((us, idx) =>
      idx === i ? { ...us, [field]: val } : us
    );
    set({ userStories });
  };

  // ── Standards Mappings ─────────────────────────────────────────────────────
  const addMapping = () =>
    set({
      standardsMappings: [
        ...state.standardsMappings,
        { dataElement: "", standard: "", mappedField: "", mappingNotes: "" },
      ],
    });
  const removeMapping = (i: number) =>
    set({ standardsMappings: state.standardsMappings.filter((_, idx) => idx !== i) });
  const updateMapping = (i: number, field: keyof (typeof state.standardsMappings)[0], val: string) => {
    const standardsMappings = state.standardsMappings.map((m, idx) =>
      idx === i ? { ...m, [field]: val } : m
    );
    set({ standardsMappings });
  };

  // ── Generic list helpers ───────────────────────────────────────────────────
  const listSection = (
    key: "concepts" | "deps" | "outcomes",
    label: string
  ) => {
    const arr = state[key] as string[];
    return (
      <div className="section-card">
        <div className="section-title">{label}</div>
        <table className="widget-table">
          <tbody>
            {arr.map((it, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="ghost-input"
                    value={it}
                    onChange={(e) => {
                      const next = [...arr];
                      next[i] = e.target.value;
                      set({ [key]: next } as Partial<UseCaseState>);
                    }}
                  />
                </td>
                <td style={{ width: 32 }}>
                  <button
                    className="btn-danger"
                    onClick={() => set({ [key]: arr.filter((_, idx) => idx !== i) } as Partial<UseCaseState>)}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn-ghost mt-2"
          onClick={() => set({ [key]: [...arr, ""] } as Partial<UseCaseState>)}
        >
          + Add
        </button>
      </div>
    );
  };

  // ── Tags ───────────────────────────────────────────────────────────────────
  let tagInput = "";

  return (
    <div className="space-y-0">
      {/* ── 0. Anchored Modeling Framework ─────────────────────────────── */}
      <div className="section-card border-l-4 border-l-blue-600">
        <div className="section-title text-blue-600">Anchored Modeling Framework</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Topic</label>
            <input
              className="input-base"
              placeholder="e.g., SEDM, P20W+ LER"
              value={state.topic}
              onChange={(e) => set({ topic: e.target.value })}
            />
            <p className="text-[10px] text-slate-400 mt-1">A way of organizing work.</p>
          </div>
          <div>
            <label className="field-label">Business Driver — The &ldquo;Why&rdquo;</label>
            <input
              className="input-base"
              placeholder="e.g., Federal reporting, credential verification"
              value={state.businessDriver}
              onChange={(e) => set({ businessDriver: e.target.value })}
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Motivation for why an actor engages with this use case.
            </p>
          </div>
        </div>
      </div>

      {/* ── 0b. Title ──────────────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">0. Title</div>
        <input
          className="input-base text-base font-semibold"
          placeholder="Use case title…"
          value={state.title}
          onChange={(e) => set({ title: e.target.value })}
        />
      </div>

      {/* ── 1. Introduction ────────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">1. Introduction</div>
        <textarea
          className="textarea-base"
          rows={4}
          placeholder="Describe the use case context and background…"
          value={state.intro}
          onChange={(e) => set({ intro: e.target.value })}
        />
      </div>

      {/* ── 2. Objectives ─────────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">2. Objectives</div>
        <textarea
          className="textarea-base"
          rows={4}
          placeholder="What goals does this use case achieve?"
          value={state.objectives}
          onChange={(e) => set({ objectives: e.target.value })}
        />
      </div>

      {/* ── 3. Scenario ───────────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">3. Scenario</div>
        <textarea
          className="textarea-base"
          rows={4}
          placeholder="Describe the real-world scenario…"
          value={state.scenario}
          onChange={(e) => set({ scenario: e.target.value })}
        />
      </div>

      {/* ── 4. Actors ─────────────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">4. Actors</div>
        <table className="widget-table">
          <thead>
            <tr>
              <th style={{ width: "30%" }}>Actor</th>
              <th>Role / Description</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {state.actors.map((actor, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="ghost-input font-semibold"
                    value={actor.name}
                    onChange={(e) => updateActor(i, "name", e.target.value)}
                    placeholder="Actor name"
                  />
                </td>
                <td>
                  <input
                    className="ghost-input"
                    value={actor.desc}
                    onChange={(e) => updateActor(i, "desc", e.target.value)}
                    placeholder="Role description"
                  />
                </td>
                <td>
                  <button className="btn-danger" onClick={() => removeActor(i)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn-ghost mt-2" onClick={addActor}>
          + Add Actor
        </button>
      </div>

      {/* ── 5. Steps ──────────────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">5. Steps / Process Flow</div>
        <table className="widget-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>#</th>
              <th style={{ width: "18%" }}>Actor</th>
              <th>Action</th>
              <th style={{ width: "15%" }}>Data In</th>
              <th style={{ width: "15%" }}>Data Out</th>
              <th style={{ width: "12%" }}>Logic / Transform</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {state.steps.map((step, i) => (
              <tr key={i}>
                <td className="text-center text-[10px] font-black text-slate-400">{i + 1}</td>
                <td>
                  <select
                    className="ghost-input"
                    value={step.actorIdx}
                    onChange={(e) => updateStep(i, "actorIdx", Number(e.target.value))}
                  >
                    {state.actors.map((a, ai) => (
                      <option key={ai} value={ai}>
                        {a.name || `Actor ${ai + 1}`}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="ghost-input"
                    value={step.action}
                    onChange={(e) => updateStep(i, "action", e.target.value)}
                    placeholder="Describe the action…"
                  />
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px] text-slate-500"
                    value={step.dataIn ?? ""}
                    onChange={(e) => updateStep(i, "dataIn", e.target.value)}
                    placeholder="Input data…"
                  />
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px] text-slate-500"
                    value={step.dataOut ?? ""}
                    onChange={(e) => updateStep(i, "dataOut", e.target.value)}
                    placeholder="Output data…"
                  />
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px] text-slate-500"
                    value={step.logic ?? ""}
                    onChange={(e) => updateStep(i, "logic", e.target.value)}
                    placeholder="Validation, API…"
                  />
                </td>
                <td>
                  <div className="flex items-center gap-1 justify-center">
                    <button
                      className="text-blue-400 hover:text-blue-600 text-xs"
                      onClick={() => moveStep(i, -1)}
                    >
                      ↑
                    </button>
                    <button
                      className="text-blue-400 hover:text-blue-600 text-xs"
                      onClick={() => moveStep(i, 1)}
                    >
                      ↓
                    </button>
                    <button className="btn-danger" onClick={() => removeStep(i)}>
                      ×
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn-ghost mt-2" onClick={addStep}>
          + Add Step
        </button>
      </div>

      {/* ── 6. Swimlane note ──────────────────────────────────────────── */}
      <div className="section-card bg-slate-50">
        <div className="section-title">6. Interaction Swimlane</div>
        <p className="text-xs text-slate-500">
          Auto-generated in Preview &rarr; Swimlane tab from actors and steps above.
        </p>
      </div>

      {/* ── 7. Key Concepts ───────────────────────────────────────────── */}
      {listSection("concepts", "7. Key Concepts")}

      {/* ── 8. Data Elements ──────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">8. Data Elements</div>
        <table className="widget-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Definition</th>
              <th>URL</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {state.dataElements.map((de, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="ghost-input"
                    value={de.name}
                    onChange={(e) => {
                      const de2 = state.dataElements.map((d, idx) =>
                        idx === i ? { ...d, name: e.target.value } : d
                      );
                      set({ dataElements: de2 });
                    }}
                  />
                </td>
                <td>
                  <input
                    className="ghost-input"
                    value={de.def}
                    onChange={(e) => {
                      const de2 = state.dataElements.map((d, idx) =>
                        idx === i ? { ...d, def: e.target.value } : d
                      );
                      set({ dataElements: de2 });
                    }}
                  />
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px]"
                    value={de.url}
                    onChange={(e) => {
                      const de2 = state.dataElements.map((d, idx) =>
                        idx === i ? { ...d, url: e.target.value } : d
                      );
                      set({ dataElements: de2 });
                    }}
                    placeholder="https://…"
                  />
                </td>
                <td>
                  <button
                    className="btn-danger"
                    onClick={() =>
                      set({ dataElements: state.dataElements.filter((_, idx) => idx !== i) })
                    }
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn-ghost mt-2"
          onClick={() =>
            set({ dataElements: [...state.dataElements, { name: "", def: "", url: "" }] })
          }
        >
          + Add Data Element
        </button>
      </div>

      {/* ── 9. Dependencies ───────────────────────────────────────────── */}
      {listSection("deps", "9. Dependencies")}

      {/* ── 10. Outcomes ──────────────────────────────────────────────── */}
      {listSection("outcomes", "10. Outcomes")}

      {/* ── 11. References ────────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">11. References</div>
        <table className="widget-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>URL</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {state.references.map((ref, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="ghost-input"
                    value={ref.title}
                    onChange={(e) => {
                      const refs = state.references.map((r, idx) =>
                        idx === i ? { ...r, title: e.target.value } : r
                      );
                      set({ references: refs });
                    }}
                  />
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px]"
                    value={ref.url}
                    onChange={(e) => {
                      const refs = state.references.map((r, idx) =>
                        idx === i ? { ...r, url: e.target.value } : r
                      );
                      set({ references: refs });
                    }}
                    placeholder="https://…"
                  />
                </td>
                <td>
                  <button
                    className="btn-danger"
                    onClick={() =>
                      set({ references: state.references.filter((_, idx) => idx !== i) })
                    }
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="btn-ghost mt-2"
          onClick={() => set({ references: [...state.references, { title: "", url: "" }] })}
        >
          + Add Reference
        </button>
      </div>

      {/* ── 12. User Stories ──────────────────────────────────────────── */}
      <div className="section-card border-l-4 border-l-green-500">
        <div className="section-title text-green-600">
          12. User Stories — The &ldquo;Who&rdquo; / Executable Units
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Granular descriptions of a step a single actor takes with specific data implications.
        </p>
        <table className="widget-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ID</th>
              <th style={{ width: "15%" }}>Actor</th>
              <th style={{ width: "25%" }}>Action / Story</th>
              <th>Data Implications</th>
              <th style={{ width: "20%" }}>Acceptance Criteria</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {state.userStories.map((us, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="ghost-input font-mono text-[11px]"
                    value={us.id}
                    onChange={(e) => updateUserStory(i, "id", e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="ghost-input"
                    value={us.actor}
                    onChange={(e) => updateUserStory(i, "actor", e.target.value)}
                    placeholder="Actor…"
                  />
                </td>
                <td>
                  <input
                    className="ghost-input"
                    value={us.action}
                    onChange={(e) => updateUserStory(i, "action", e.target.value)}
                    placeholder="As a [actor], I need to…"
                  />
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px]"
                    value={us.dataImplications}
                    onChange={(e) => updateUserStory(i, "dataImplications", e.target.value)}
                    placeholder="Data elements involved…"
                  />
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px]"
                    value={us.acceptanceCriteria}
                    onChange={(e) => updateUserStory(i, "acceptanceCriteria", e.target.value)}
                    placeholder="Given/When/Then…"
                  />
                </td>
                <td>
                  <button className="btn-danger" onClick={() => removeUserStory(i)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn-ghost mt-2" onClick={addUserStory}>
          + Add User Story
        </button>
      </div>

      {/* ── 13. Categories ────────────────────────────────────────────── */}
      <div className="section-card">
        <div className="section-title">13. Categories</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="field-label">Primary Category</label>
            <select
              className="input-base"
              value={state.primaryCategory}
              onChange={(e) => set({ primaryCategory: e.target.value })}
            >
              <option value="">-- Select Category --</option>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Tags</label>
            <div className="flex flex-wrap gap-1 mb-2 min-h-[28px]">
              {state.tags.map((tag, i) => (
                <span key={i} className="tag-pill">
                  {tag}
                  <button
                    onClick={() => set({ tags: state.tags.filter((_, idx) => idx !== i) })}
                    className="text-blue-400 hover:text-blue-700 leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                id="tagInputField"
                className="input-base flex-1"
                placeholder="New tag…"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      set({ tags: [...state.tags, val] });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
              <button
                className="btn-primary whitespace-nowrap"
                onClick={() => {
                  const el = document.getElementById("tagInputField") as HTMLInputElement;
                  if (el?.value.trim()) {
                    set({ tags: [...state.tags, el.value.trim()] });
                    el.value = "";
                  }
                }}
              >
                Add Tag
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <label className="field-label">Codes</label>
          <table className="widget-table">
            <thead>
              <tr>
                <th>Code Ref (URL)</th>
                <th>Code Type</th>
                <th>Code Value</th>
                <th>Value Ref (URL)</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {state.codes.map((code, i) => (
                <tr key={i}>
                  {(["ref", "type", "val", "vRef"] as const).map((field) => (
                    <td key={field}>
                      <input
                        className="ghost-input text-[11px]"
                        value={code[field]}
                        onChange={(e) => {
                          const codes = state.codes.map((c, idx) =>
                            idx === i ? { ...c, [field]: e.target.value } : c
                          );
                          set({ codes });
                        }}
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      className="btn-danger"
                      onClick={() =>
                        set({ codes: state.codes.filter((_, idx) => idx !== i) })
                      }
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="btn-ghost mt-2"
            onClick={() =>
              set({ codes: [...state.codes, { ref: "", type: "", val: "", vRef: "" }] })
            }
          >
            + Add Code
          </button>
        </div>
      </div>

      {/* ── 14. Standards & Data Mappings ─────────────────────────────── */}
      <div className="section-card border-l-4 border-l-purple-500">
        <div className="section-title text-purple-600">
          14. Standards &amp; Data Mappings
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Map data elements to standards such as CEDS, Credential Engine, SIF, Ed-Fi, and more.
        </p>
        <table className="widget-table">
          <thead>
            <tr>
              <th style={{ width: "20%" }}>Data Element</th>
              <th style={{ width: "18%" }}>Standard</th>
              <th style={{ width: "22%" }}>Mapped Field / URI</th>
              <th>Mapping Notes / Transform Logic</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {state.standardsMappings.map((m, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="ghost-input"
                    value={m.dataElement}
                    onChange={(e) => updateMapping(i, "dataElement", e.target.value)}
                    placeholder="Element name…"
                  />
                </td>
                <td>
                  <select
                    className="ghost-input"
                    value={m.standard}
                    onChange={(e) => updateMapping(i, "standard", e.target.value)}
                  >
                    <option value="">Select…</option>
                    {STANDARDS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px]"
                    value={m.mappedField}
                    onChange={(e) => updateMapping(i, "mappedField", e.target.value)}
                    placeholder="Field name or URI…"
                  />
                </td>
                <td>
                  <input
                    className="ghost-input text-[11px]"
                    value={m.mappingNotes}
                    onChange={(e) => updateMapping(i, "mappingNotes", e.target.value)}
                    placeholder="Notes, transform, validation logic…"
                  />
                </td>
                <td>
                  <button className="btn-danger" onClick={() => removeMapping(i)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn-ghost mt-2" onClick={addMapping}>
          + Add Mapping
        </button>
      </div>
    </div>
  );
}
