"use client";

import { useState, useEffect } from "react";
import { UseCaseState } from "@/lib/types";
import { generateMarkdown } from "@/lib/generateMarkdown";
import { generateTurtle, generateJSONLD } from "@/lib/generateRDF";

type Tab = "document" | "swimlane" | "rdf" | "tchart" | "standards";

interface Props {
  state: UseCaseState;
}

// ── RDF Format toggle ───────────────────────────────────────────────────────
function RDFView({ state }: { state: UseCaseState }) {
  const [format, setFormat] = useState<"turtle" | "jsonld">("turtle");
  const [copied, setCopied] = useState(false);
  const content = format === "turtle" ? generateTurtle(state) : generateJSONLD(state);

  const copy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900">Model RDF</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Machine-readable representation of this use case. Drives the semantic backbone.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-bold">
            <button
              className={`px-3 py-1.5 ${format === "turtle" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              onClick={() => setFormat("turtle")}
            >
              Turtle
            </button>
            <button
              className={`px-3 py-1.5 ${format === "jsonld" ? "bg-slate-900 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              onClick={() => setFormat("jsonld")}
            >
              JSON-LD
            </button>
          </div>
          <button
            className="btn-primary text-[11px]"
            onClick={copy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Anchored model summary */}
      {(state.topic || state.businessDriver) && (
        <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">Topic</div>
            <div className="font-semibold text-slate-800">{state.topic || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">Business Driver</div>
            <div className="font-semibold text-slate-800">{state.businessDriver || "—"}</div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">Use Case</div>
            <div className="font-semibold text-slate-800">{state.title || "—"}</div>
          </div>
        </div>
      )}

      <pre className="bg-slate-900 text-green-300 text-xs p-5 rounded-xl overflow-auto leading-relaxed font-mono max-h-[600px]">
        {content || "# Fill in use case details to generate RDF output."}
      </pre>
    </div>
  );
}

// ── Swimlane View ──────────────────────────────────────────────────────────
function SwimlaneView({ state }: { state: UseCaseState }) {
  const actors = state.actors.filter((a) => a.name.trim());
  if (actors.length === 0 || state.steps.length === 0) {
    return (
      <div className="text-slate-500 text-sm p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        Add actors and steps in Edit Mode to generate the swimlane diagram.
      </div>
    );
  }

  const LANE_COLORS = [
    "bg-blue-50 border-blue-200",
    "bg-purple-50 border-purple-200",
    "bg-green-50 border-green-200",
    "bg-amber-50 border-amber-200",
    "bg-rose-50 border-rose-200",
    "bg-cyan-50 border-cyan-200",
  ];
  const HEADER_COLORS = [
    "bg-blue-600",
    "bg-purple-600",
    "bg-green-600",
    "bg-amber-600",
    "bg-rose-600",
    "bg-cyan-600",
  ];

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-900">Swimlane Diagram</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Process-oriented view — who does what, with what data.
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-5">
        {actors.map((a, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-semibold">
            <span
              className={`inline-block w-3 h-3 rounded-sm ${HEADER_COLORS[i % HEADER_COLORS.length]}`}
            />
            {a.name}
            {a.desc && <span className="text-slate-400 font-normal">— {a.desc}</span>}
          </div>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: 40 }} />
            {actors.map((_, i) => (
              <col key={i} style={{ width: `${Math.floor(100 / actors.length)}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th className="bg-slate-800 text-white text-[10px] font-black uppercase px-2 py-2 text-center border border-slate-700">
                #
              </th>
              {actors.map((a, i) => (
                <th
                  key={i}
                  className={`${HEADER_COLORS[i % HEADER_COLORS.length]} text-white text-xs font-black px-3 py-2 border border-slate-200`}
                >
                  {a.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {state.steps.map((step, si) => {
              const activeActorOrigIdx = step.actorIdx;
              // Map original actor index to filtered actors index
              const activeActor = state.actors[activeActorOrigIdx];
              const filteredIdx = actors.findIndex((a) => a.name === activeActor?.name);
              return (
                <tr key={si} className={si % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="text-center text-[10px] font-black text-slate-400 border border-slate-200 px-1 py-2">
                    {si + 1}
                  </td>
                  {actors.map((_, ai) => (
                    <td
                      key={ai}
                      className={`border border-slate-200 px-3 py-2 align-top ${ai === filteredIdx ? LANE_COLORS[ai % LANE_COLORS.length] + " border-2" : ""}`}
                    >
                      {ai === filteredIdx && (
                        <div>
                          <div className="text-sm font-semibold text-slate-900 leading-snug">
                            {step.action}
                          </div>
                          {step.dataIn && (
                            <div className="mt-1.5 flex items-start gap-1 text-[11px]">
                              <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold uppercase text-[9px] shrink-0 mt-0.5">
                                IN
                              </span>
                              <span className="text-slate-600">{step.dataIn}</span>
                            </div>
                          )}
                          {step.dataOut && (
                            <div className="mt-1 flex items-start gap-1 text-[11px]">
                              <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold uppercase text-[9px] shrink-0 mt-0.5">
                                OUT
                              </span>
                              <span className="text-slate-600">{step.dataOut}</span>
                            </div>
                          )}
                          {step.logic && (
                            <div className="mt-1 flex items-start gap-1 text-[11px]">
                              <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase text-[9px] shrink-0 mt-0.5">
                                LOGIC
                              </span>
                              <span className="text-slate-500 italic">{step.logic}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── T-Chart View ───────────────────────────────────────────────────────────
function TChartView({ state }: { state: UseCaseState }) {
  const hasData =
    state.title ||
    state.topic ||
    state.businessDriver ||
    state.userStories.length > 0 ||
    state.dataElements.length > 0;

  if (!hasData) {
    return (
      <div className="text-slate-500 text-sm p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        Fill in use case details to generate the T-Chart view.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-900">T-Chart</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          T-shaped example showing the use case within the topic context (vertical) and
          implementation specifics (horizontal).
        </p>
      </div>

      {/* Vertical bar — Topic & Business Driver */}
      <div className="flex gap-6">
        {/* Left stem of T */}
        <div className="flex flex-col items-center gap-0 shrink-0" style={{ width: 200 }}>
          <div className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-t-xl w-full text-center">
            Topic
          </div>
          <div className="bg-slate-800 text-white text-sm font-semibold px-3 py-3 w-full text-center min-h-[60px] flex items-center justify-center">
            {state.topic || "—"}
          </div>
          <div className="bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 w-full text-center">
            Business Driver
          </div>
          <div className="bg-blue-600 text-white text-sm px-3 py-3 w-full text-center min-h-[60px] flex items-center justify-center">
            {state.businessDriver || "—"}
          </div>
          <div className="bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 w-full text-center">
            Use Case
          </div>
          <div className="bg-indigo-600 text-white text-sm px-3 py-3 w-full text-center min-h-[60px] flex items-center justify-center">
            {state.title || "—"}
          </div>
          {/* Vertical connector */}
          <div className="w-1 bg-slate-300 flex-1 my-0" style={{ minHeight: 40 }} />
        </div>

        {/* Right horizontal bar */}
        <div className="flex-1 min-w-0">
          {/* User Stories row */}
          {state.userStories.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-green-600 mb-2">
                User Stories — Executable Units
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {state.userStories.map((us, i) => (
                  <div
                    key={i}
                    className="border border-green-200 rounded-xl p-3 bg-green-50"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[10px] bg-green-700 text-white px-1.5 py-0.5 rounded">
                        {us.id}
                      </span>
                      <span className="text-xs font-bold text-slate-700">{us.actor}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-snug mb-1.5">{us.action}</p>
                    {us.dataImplications && (
                      <p className="text-[11px] text-slate-500 italic">{us.dataImplications}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actors row */}
          {state.actors.filter((a) => a.name).length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-blue-600 mb-2">
                Actors
              </div>
              <div className="flex flex-wrap gap-2">
                {state.actors
                  .filter((a) => a.name)
                  .map((a, i) => (
                    <div
                      key={i}
                      className="border border-blue-200 rounded-lg px-3 py-2 bg-blue-50 text-xs"
                    >
                      <div className="font-bold text-slate-800">{a.name}</div>
                      {a.desc && (
                        <div className="text-slate-500 text-[11px] mt-0.5">{a.desc}</div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Data elements */}
          {state.dataElements.length > 0 && (
            <div className="mb-5">
              <div className="text-[10px] font-black uppercase tracking-wider text-purple-600 mb-2">
                Data Elements
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {state.dataElements.map((de, i) => (
                  <div
                    key={i}
                    className="border border-purple-200 rounded-lg px-3 py-2 bg-purple-50"
                  >
                    <div className="text-xs font-bold text-slate-800">{de.name}</div>
                    {de.def && (
                      <div className="text-[11px] text-slate-500 mt-0.5">{de.def}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outcomes */}
          {state.outcomes.filter((o) => o).length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 mb-2">
                Outcomes
              </div>
              <ul className="space-y-1">
                {state.outcomes.filter((o) => o).map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="text-amber-500 mt-0.5 shrink-0">▸</span> {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Standards Map ──────────────────────────────────────────────────────────
function StandardsMapView({ state }: { state: UseCaseState }) {
  // Group by standard
  const byStandard: Record<string, typeof state.standardsMappings> = {};
  state.standardsMappings.forEach((m) => {
    const key = m.standard || "Unmapped";
    if (!byStandard[key]) byStandard[key] = [];
    byStandard[key].push(m);
  });

  const STANDARD_COLORS: Record<string, string> = {
    CEDS: "bg-blue-100 text-blue-800 border-blue-200",
    "Credential Engine (CTDL)": "bg-purple-100 text-purple-800 border-purple-200",
    SIF: "bg-green-100 text-green-800 border-green-200",
    "IMS Global (1EdTech)": "bg-amber-100 text-amber-800 border-amber-200",
    "Ed-Fi": "bg-rose-100 text-rose-800 border-rose-200",
    PESC: "bg-cyan-100 text-cyan-800 border-cyan-200",
    "Open Badges": "bg-orange-100 text-orange-800 border-orange-200",
    "CLR Standard": "bg-teal-100 text-teal-800 border-teal-200",
    "xAPI / TinCan": "bg-lime-100 text-lime-800 border-lime-200",
    "HR Open Standards": "bg-indigo-100 text-indigo-800 border-indigo-200",
  };

  const getColor = (std: string) =>
    STANDARD_COLORS[std] || "bg-slate-100 text-slate-800 border-slate-200";

  if (state.standardsMappings.length === 0) {
    return (
      <div className="text-slate-500 text-sm p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
        Add standards mappings in Section 14 of Edit Mode to generate this view.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-900">Standards &amp; Data Mappings</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          How this use case&apos;s data elements map to interoperability standards.
        </p>
      </div>

      {/* Standards coverage chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.keys(byStandard).map((std) => (
          <span
            key={std}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getColor(std)}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {std}
            <span className="opacity-60">({byStandard[std].length})</span>
          </span>
        ))}
      </div>

      {/* Per-standard sections */}
      {Object.entries(byStandard).map(([std, mappings]) => (
        <div key={std} className="mb-6">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-t-lg text-xs font-black uppercase tracking-wider border-b-0 border ${getColor(std)}`}
          >
            {std}
          </div>
          <div className="border border-slate-200 rounded-b-xl rounded-tr-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-2 text-left text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                    Data Element
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                    Mapped Field / URI
                  </th>
                  <th className="px-4 py-2 text-left text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                    Notes / Logic
                  </th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                    <td className="px-4 py-2.5 font-semibold text-slate-900 text-xs">
                      {m.dataElement}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono text-slate-700">
                      {m.mappedField}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-600 italic">
                      {m.mappingNotes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Data element × standard matrix */}
      {state.dataElements.length > 0 && state.standardsMappings.length > 0 && (
        <div className="mt-8">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">
            Coverage Matrix
          </div>
          <div className="overflow-x-auto">
            <table className="text-xs border-collapse">
              <thead>
                <tr>
                  <th className="bg-slate-900 text-white px-3 py-2 text-left font-black border border-slate-700">
                    Data Element
                  </th>
                  {Object.keys(byStandard).map((std) => (
                    <th
                      key={std}
                      className="bg-slate-800 text-white px-3 py-2 text-center font-bold border border-slate-700 max-w-[100px]"
                    >
                      <span className="block truncate max-w-[100px]">{std}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {state.dataElements
                  .filter((de) => de.name)
                  .map((de, i) => {
                    return (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2 font-semibold text-slate-800 border border-slate-200">
                          {de.name}
                        </td>
                        {Object.keys(byStandard).map((std) => {
                          const hasMapped = state.standardsMappings.some(
                            (m) => m.dataElement === de.name && m.standard === std
                          );
                          return (
                            <td
                              key={std}
                              className="px-3 py-2 text-center border border-slate-200"
                            >
                              {hasMapped ? (
                                <span className="text-green-600 font-black">✓</span>
                              ) : (
                                <span className="text-slate-200">–</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Document / Markdown View ───────────────────────────────────────────────
function DocumentView({ state }: { state: UseCaseState }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    // Dynamic import to avoid SSR issues
    import("marked").then(({ marked }) => {
      const md = generateMarkdown(state);
      const result = marked(md);
      setHtml(typeof result === "string" ? result : "");
    });
  }, [state]);

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-black text-slate-900">Document View</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Full markdown rendered document — suitable for sharing and review.
        </p>
      </div>
      <div
        className="prose-preview"
        dangerouslySetInnerHTML={{ __html: html || "<p class='text-slate-400 text-sm'>Fill in details in Edit Mode to generate document preview.</p>" }}
      />
    </div>
  );
}

// ── Main Preview Pane ──────────────────────────────────────────────────────
const TABS: { id: Tab; label: string; badge?: string }[] = [
  { id: "document", label: "Document" },
  { id: "swimlane", label: "Swimlane" },
  { id: "tchart", label: "T-Chart" },
  { id: "standards", label: "Standards Map" },
  { id: "rdf", label: "RDF / JSON-LD", badge: "AI-Ready" },
];

export default function PreviewPane({ state }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("document");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto pb-px">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-black uppercase tracking-wider whitespace-nowrap rounded-t-lg transition-colors
              ${activeTab === tab.id
                ? "bg-white border border-slate-200 border-b-white text-blue-600 -mb-px"
                : "text-slate-400 hover:text-slate-700"
              }`}
          >
            {tab.label}
            {tab.badge && (
              <span className="bg-green-100 text-green-700 text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        {activeTab === "document" && <DocumentView state={state} />}
        {activeTab === "swimlane" && <SwimlaneView state={state} />}
        {activeTab === "tchart" && <TChartView state={state} />}
        {activeTab === "standards" && <StandardsMapView state={state} />}
        {activeTab === "rdf" && <RDFView state={state} />}
      </div>
    </div>
  );
}
