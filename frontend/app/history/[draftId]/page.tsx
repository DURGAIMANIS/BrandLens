"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getDraft, DraftDetailResponse, DraftVersion } from "@/lib/api";
import { History, ArrowLeft, CheckCircle2, AlertTriangle, MessageSquare, Clock, FileText } from "lucide-react";

export default function DraftHistoryPage() {
  const params = useParams();
  const draftId = Number(params.draftId);

  const [draft, setDraft] = useState<DraftDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<DraftVersion | null>(null);

  useEffect(() => {
    async function load() {
      if (!draftId) return;
      try {
        const d = await getDraft(draftId);
        setDraft(d);
        if (d.versions.length > 0) {
          setSelectedVersion(d.versions[d.versions.length - 1]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [draftId]);

  if (loading || !draft) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading Draft Audit History...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button & Title */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{draft.title}</h1>
              <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                {draft.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Comprehensive audit trail: versions, applied fixes, editorial comments, and manager decisions.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="px-3.5 py-2 bg-[#1B4332] hover:bg-[#132E22] text-white rounded-lg text-xs font-semibold shadow-sm transition"
        >
          Open in Review Workspace
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Versions Timeline (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-[#1B4332]" />
              <span>Version History ({draft.versions.length})</span>
            </h2>

            <div className="space-y-2">
              {draft.versions.map((v) => {
                const isSelected = selectedVersion?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVersion(v)}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "border-[#1B4332] bg-emerald-50/40 ring-1 ring-[#1B4332]"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900">Version {v.version_num}</span>
                      <span className="text-[11px] text-gray-400">
                        {new Date(v.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {v.change_summary || "No change summary recorded."}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decisions Log */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#1B4332]" />
              <span>Manager Decisions ({draft.decisions.length})</span>
            </h2>

            {draft.decisions.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No formal decisions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {draft.decisions.map((dec) => (
                  <div key={dec.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold capitalize text-gray-900">
                        {dec.action.replace("_", " ")}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(dec.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 italic">&quot;{dec.reason}&quot;</p>
                    <span className="text-[10px] text-gray-500 block mt-1">
                      By: {dec.reviewer_role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments Log */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-[#1B4332]" />
              <span>Comments ({draft.comments.length})</span>
            </h2>

            {draft.comments.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No comments posted.</p>
            ) : (
              <div className="space-y-2">
                {draft.comments.map((c) => (
                  <div key={c.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                    <div className="flex items-center justify-between text-gray-500 mb-1">
                      <span className="font-semibold text-gray-700">{c.author_role}</span>
                      <span className="text-[10px]">{new Date(c.created_at).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-gray-800">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Selected Version View & Resolved Findings (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  Version {selectedVersion?.version_num || 1} Content
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedVersion?.change_summary || "Initial version."}
                </p>
              </div>
              <span className="text-xs text-gray-400 font-mono">
                {selectedVersion?.created_at && new Date(selectedVersion.created_at).toLocaleString()}
              </span>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-sans text-gray-800">
              {selectedVersion?.content}
            </div>
          </div>

          {/* Audit Trail of Findings for this draft */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
              All Findings & Actions Taken ({draft.findings.length})
            </h3>

            <div className="space-y-3">
              {draft.findings.map((f) => (
                <div
                  key={f.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-mono font-bold text-[#1B4332]">{f.source_code}</span>
                      <span className="capitalize px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-[10px]">
                        {f.category}
                      </span>
                      <span className="font-medium text-gray-800">&quot;{f.excerpt}&quot;</span>
                    </div>
                    <p className="text-gray-600">{f.explanation}</p>
                    {f.dismiss_reason && (
                      <p className="text-amber-800 text-[11px] italic mt-0.5">
                        Dismissal: {f.dismiss_reason}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap self-start md:self-auto ${
                      f.status === "accepted"
                        ? "bg-emerald-100 text-emerald-800"
                        : f.status === "dismissed"
                        ? "bg-gray-200 text-gray-700"
                        : f.status === "edited"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {f.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

