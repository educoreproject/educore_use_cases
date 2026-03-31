"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { UseCaseState, defaultState } from "@/lib/types";
import { parseMarkdownToState } from "@/lib/parseMarkdown";
import PreviewPane from "@/components/PreviewPane";

const REPO = "educoreproject/educore_use_cases";

export default function PreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [state, setState] = useState<UseCaseState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIssue() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `https://api.github.com/repos/${REPO}/issues/${id}`,
          { headers: { Accept: "application/vnd.github.v3+json" } }
        );
        if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
        const data = await res.json();
        const parsed = parseMarkdownToState(data.title, data.body);
        setState(parsed);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load use case");
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchIssue();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-xl">
        <div className="max-w-full px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-black italic text-blue-400 tracking-tighter hover:text-blue-300">
              EDUCORE
            </a>
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              Use Case Preview
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/table.html"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors"
            >
              Back to Table
            </a>
            <a
              href={`https://github.com/${REPO}/issues/${id}`}
              target="_blank"
              rel="noreferrer"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-colors"
            >
              View on GitHub ↗
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-full px-4 md:px-6 py-6">
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-sm text-gray-400 font-semibold uppercase tracking-wider">
              Loading use case #{id}...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 font-semibold mb-2">Failed to load use case</p>
            <p className="text-sm text-gray-400">{error}</p>
          </div>
        )}

        {state && !loading && (
          <div className="max-w-6xl mx-auto">
            <PreviewPane state={state} />
          </div>
        )}
      </main>

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
