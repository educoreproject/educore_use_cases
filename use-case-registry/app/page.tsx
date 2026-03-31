"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { UseCaseState, defaultState } from "@/lib/types";
import { generateMarkdown } from "@/lib/generateMarkdown";
import { parseMarkdownToState } from "@/lib/parseMarkdown";
import EditorPane from "@/components/EditorPane";
import PreviewPane from "@/components/PreviewPane";

const REPO = "educoreproject/educore_use_cases";
const STORAGE_KEY = "educore_v5_draft";
const STORAGE_URL_KEY = "educore_v5_url";
const STORAGE_SYNC_KEY = "educore_v5_sync";

type Mode = "edit" | "preview";
type SaveStatus = "ready" | "unsaved" | "synced" | "saving";

interface GHIssue {
  title: string;
  url: string;
  parentUrl: string | null;
}

export default function HomePage() {
  const [state, setState] = useState<UseCaseState>(defaultState);
  const [mode, setMode] = useState<Mode>("edit");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("ready");
  const [currentIssueUrl, setCurrentIssueUrl] = useState<string>("new");
  const [lastSyncedState, setLastSyncedState] = useState<string>("");
  const [ghToken, setGhToken] = useState<string>("");
  const [issues, setIssues] = useState<GHIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGHPanel, setShowGHPanel] = useState(false);
  const tokenInputRef = useRef<HTMLInputElement>(null);

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem("educore_gh_token") || "";
    setGhToken(savedToken);
    const draft = localStorage.getItem(STORAGE_KEY);
    const url = localStorage.getItem(STORAGE_URL_KEY);
    const sync = localStorage.getItem(STORAGE_SYNC_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft) as UseCaseState;
        if (!parsed.tags) parsed.tags = [];
        if (!parsed.codes) parsed.codes = [];
        if (!parsed.userStories) parsed.userStories = [];
        if (!parsed.standardsMappings) parsed.standardsMappings = [];
        setState(parsed);
      } catch {}
    }
    if (url) setCurrentIssueUrl(url);
    if (sync) setLastSyncedState(sync);
  }, []);

  // ── Persist state changes ─────────────────────────────────────────────────
  const saveToLocal = useCallback(
    (s: UseCaseState, url: string, sync: string) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
      localStorage.setItem(STORAGE_URL_KEY, url);
      localStorage.setItem(STORAGE_SYNC_KEY, sync);
    },
    []
  );

  const handleStateChange = useCallback(
    (next: UseCaseState) => {
      setState(next);
      setSaveStatus("unsaved");
      saveToLocal(next, currentIssueUrl, lastSyncedState);
    },
    [currentIssueUrl, lastSyncedState, saveToLocal]
  );

  // ── GitHub: fetch issues ──────────────────────────────────────────────────
  const fetchIssues = useCallback(async (token?: string) => {
    const t = token ?? ghToken;
    const [owner, name] = REPO.split("/");
    setLoading(true);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (t) headers["Authorization"] = `token ${t}`;
      // Try GraphQL first
      const gql = `query { repository(owner: "${owner}", name: "${name}") { issues(first: 100, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) { nodes { title, url, parent { url } } } } }`;
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({ query: gql }),
      });
      const data = await res.json();
      if (res.ok && data.data) {
        const nodes = data.data.repository.issues.nodes as Array<{
          title: string;
          url: string;
          parent?: { url: string };
        }>;
        setIssues(
          nodes.map((n) => ({
            title: n.title,
            url: n.url,
            parentUrl: n.parent?.url ?? null,
          }))
        );
      } else {
        // REST fallback
        const restHeaders: Record<string, string> = t ? { Authorization: `token ${t}` } : {};
        const rr = await fetch(`https://api.github.com/repos/${owner}/${name}/issues`, {
          headers: restHeaders,
        });
        if (rr.ok) {
          const arr = await rr.json() as Array<{ title: string; html_url: string; body: string }>;
          setIssues(
            arr.map((i) => {
              const m = i.body?.match(
                /Parent:\s*(https:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+)/
              );
              return { title: i.title, url: i.html_url, parentUrl: m ? m[1] : null };
            })
          );
        }
      }
    } catch (e) {
      console.error("fetchIssues failed", e);
    } finally {
      setLoading(false);
    }
  }, [ghToken]);

  // ── GitHub: fetch specific issue ──────────────────────────────────────────
  const fetchIssue = async (url: string) => {
    const id = url.split("/").pop();
    setLoading(true);
    try {
      const headers: Record<string, string> = ghToken ? { Authorization: `token ${ghToken}` } : {};
      const res = await fetch(`https://api.github.com/repos/${REPO}/issues/${id}`, { headers });
      const data = await res.json();
      const parsed = parseMarkdownToState(data.title, data.body);
      const syncStr = JSON.stringify(parsed);
      setState(parsed);
      setLastSyncedState(syncStr);
      setCurrentIssueUrl(url);
      setSaveStatus("synced");
      saveToLocal(parsed, url, syncStr);
      setMode("edit");
    } catch {
      alert("Failed to fetch issue.");
    } finally {
      setLoading(false);
    }
  };

  // ── GitHub: publish / update ──────────────────────────────────────────────
  const publish = async () => {
    if (!ghToken) {
      alert("A GitHub Personal Access Token (PAT) is required to publish.");
      return;
    }
    const isUpdate = currentIssueUrl !== "new";
    const apiUrl = isUpdate
      ? `https://api.github.com/repos/${REPO}/issues/${currentIssueUrl.split("/").pop()}`
      : `https://api.github.com/repos/${REPO}/issues`;
    setSaveStatus("saving");
    try {
      const res = await fetch(apiUrl, {
        method: isUpdate ? "PATCH" : "POST",
        headers: { Authorization: `token ${ghToken}` },
        body: JSON.stringify({ title: `Use Case: ${state.title}`, body: generateMarkdown(state) }),
      });
      if (res.ok) {
        const d = await res.json();
        const newUrl = d.html_url;
        const syncStr = JSON.stringify(state);
        setCurrentIssueUrl(newUrl);
        setLastSyncedState(syncStr);
        setSaveStatus("synced");
        saveToLocal(state, newUrl, syncStr);
        await fetchIssues();
      } else if (res.status === 403 || res.status === 401) {
        alert(
          "Publish failed: no write access. Leave a comment on the GitHub issue to request changes."
        );
        if (currentIssueUrl !== "new") window.open(currentIssueUrl, "_blank");
        setSaveStatus("unsaved");
      } else {
        alert(`Publish failed (status ${res.status}).`);
        setSaveStatus("unsaved");
      }
    } catch {
      alert("An error occurred during publish.");
      setSaveStatus("unsaved");
    }
  };

  const resetForm = () => {
    if (!confirm("Clear the form and start a new use case?")) return;
    const fresh = JSON.parse(JSON.stringify(defaultState)) as UseCaseState;
    const syncStr = JSON.stringify(fresh);
    setState(fresh);
    setCurrentIssueUrl("new");
    setLastSyncedState(syncStr);
    setSaveStatus("ready");
    saveToLocal(fresh, "new", syncStr);
  };

  // ── Build hierarchical issue list for selector ────────────────────────────
  const issueTree = (() => {
    const map = new Map<string, GHIssue[]>();
    const topLevel: GHIssue[] = [];
    issues.forEach((issue) => {
      if (!issue.parentUrl) {
        topLevel.push(issue);
      } else {
        if (!map.has(issue.parentUrl)) map.set(issue.parentUrl, []);
        map.get(issue.parentUrl)!.push(issue);
      }
    });
    const flat: { issue: GHIssue; depth: number }[] = [];
    const walk = (issue: GHIssue, depth: number) => {
      flat.push({ issue, depth });
      (map.get(issue.url) ?? []).forEach((c) => walk(c, depth + 1));
    };
    topLevel.forEach((i) => walk(i, 0));
    return flat;
  })();

  const statusColors: Record<SaveStatus, string> = {
    ready: "bg-slate-700 text-slate-300",
    unsaved: "bg-amber-500 text-white",
    synced: "bg-green-600 text-white",
    saving: "bg-blue-600 text-white animate-pulse",
  };
  const statusLabels: Record<SaveStatus, string> = {
    ready: "Ready",
    unsaved: "Unsaved",
    synced: "Synced",
    saving: "Saving…",
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-xl">
        <div className="max-w-full px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-xl font-black italic text-blue-400 tracking-tighter">
                EDUCORE
              </span>
              <span className="text-slate-400 text-[10px] uppercase tracking-widest ml-2 font-bold">
                Use Case Registry
              </span>
            </div>
            <span
              className={`text-[9px] px-2.5 py-1 rounded-full uppercase font-black tracking-wider ${statusColors[saveStatus]}`}
            >
              {statusLabels[saveStatus]}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* GH Panel toggle */}
            <button
              onClick={() => setShowGHPanel((v) => !v)}
              className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors ${showGHPanel ? "bg-slate-600 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-300"}`}
            >
              GitHub {loading && "…"}
            </button>

            <button onClick={resetForm} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors">
              New
            </button>

            <button onClick={publish} className="btn-primary">
              Publish / Update
            </button>
          </div>
        </div>

        {/* GitHub panel */}
        {showGHPanel && (
          <div className="bg-slate-800 border-t border-slate-700 px-4 md:px-6 py-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">
                GitHub PAT
              </label>
              <input
                ref={tokenInputRef}
                type="password"
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs w-48 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="ghp_…"
                value={ghToken}
                onChange={(e) => setGhToken(e.target.value)}
                onBlur={(e) => {
                  localStorage.setItem("educore_gh_token", e.target.value);
                  fetchIssues(e.target.value);
                }}
              />
            </div>

            <div>
              <label className="block text-[9px] text-slate-400 uppercase font-bold mb-1">
                Load Existing
              </label>
              <select
                className="bg-slate-700 text-white border border-slate-600 rounded px-2 py-1 text-xs w-72 focus:outline-none"
                value={currentIssueUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "new") return;
                  if (confirm("Load this use case from GitHub?")) fetchIssue(val);
                }}
              >
                <option value="new">-- Select a use case --</option>
                {issueTree.map(({ issue, depth }) => (
                  <option key={issue.url} value={issue.url}>
                    {"\u2014".repeat(depth)}
                    {depth > 0 ? " " : ""}
                    {issue.title.replace("Use Case: ", "").trim()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => fetchIssues()}
              className="bg-slate-600 hover:bg-slate-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded transition-colors"
            >
              Refresh
            </button>

            {currentIssueUrl !== "new" && (
              <a
                href={currentIssueUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-slate-600 hover:bg-slate-500 text-white text-[10px] font-black uppercase px-3 py-1.5 rounded transition-colors"
              >
                View on GitHub ↗
              </a>
            )}
          </div>
        )}
      </header>

      {/* ── Mode tab bar ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 sticky top-[56px] z-40 shadow-sm">
        <div className="max-w-full px-4 md:px-6 flex gap-0">
          {(["edit", "preview"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-6 py-3.5 text-xs font-black uppercase tracking-widest border-b-2 transition-colors
                ${mode === m
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-400 hover:text-slate-700"
                }`}
            >
              {m === "edit" ? "1. Edit Mode" : "2. Preview Mode"}
            </button>
          ))}
          {state.title && (
            <div className="flex items-center ml-4 text-sm font-semibold text-slate-600 truncate max-w-xs">
              {state.title}
              {state.topic && (
                <span className="ml-2 text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {state.topic}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-full px-4 md:px-6 py-6">
        {mode === "edit" ? (
          <div className="max-w-5xl mx-auto">
            {/* Anchored model breadcrumb */}
            {(state.topic || state.businessDriver || state.title) && (
              <div className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500 flex-wrap">
                {state.topic && (
                  <>
                    <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                      📂 {state.topic}
                    </span>
                    <span className="text-slate-300">›</span>
                  </>
                )}
                {state.businessDriver && (
                  <>
                    <span className="bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full text-blue-700">
                      💡 {state.businessDriver}
                    </span>
                    <span className="text-slate-300">›</span>
                  </>
                )}
                {state.title && (
                  <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full text-indigo-700">
                    📋 {state.title}
                  </span>
                )}
              </div>
            )}
            <EditorPane state={state} onChange={handleStateChange} />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <PreviewPane state={state} />
          </div>
        )}
      </main>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-500 text-[10px] text-center py-3 font-mono">
        EDUcore Use Case Registry &mdash; Community Interoperability Tool &mdash;{" "}
        <a
          href={`https://github.com/${REPO}`}
          className="text-blue-500 hover:text-blue-400"
          target="_blank"
          rel="noreferrer"
        >
          {REPO}
        </a>
      </footer>
    </div>
  );
}
