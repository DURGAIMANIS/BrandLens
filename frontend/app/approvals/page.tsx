"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  listDrafts,
  getDraft,
  recordDecision,
  addComment,
  DraftDetailResponse,
} from "@/lib/api";
import { useRole } from "@/lib/roleContext";
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  MessageSquare,
  History,
  ShieldCheck,
  AlertTriangle,
  User,
  ExternalLink,
} from "lucide-react";

export default function ApprovalsPage() {
  const { role } = useRole();
  const [drafts, setDrafts] = useState<DraftDetailResponse[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [decisionAction, setDecisionAction] = useState<"approve" | "request_changes" | null>(null);
  const [decisionReason, setDecisionReason] = useState("");
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Comment State
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const allDrafts = await listDrafts();
      setDrafts(allDrafts);
      if (allDrafts.length > 0 && !selectedDraftId) {
        setSelectedDraftId(allDrafts[0].id);
        const detailed = await getDraft(allDrafts[0].id);
        setSelectedDraft(detailed);
      } else if (selectedDraftId) {
        const detailed = await getDraft(selectedDraftId);
        setSelectedDraft(detailed);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectDraft = async (id: number) => {
    setSelectedDraftId(id);
    try {
      const detailed = await getDraft(id);
      setSelectedDraft(detailed);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmDecision = async () => {
    if (!selectedDraft || !decisionAction || !decisionReason.trim()) return;
    setIsSubmittingDecision(true);
    try {
      await recordDecision(selectedDraft.id, {
        reviewer_role: role,
        action: decisionAction,
        reason: decisionReason.trim(),
      });
      setNotification(`Decision recorded: ${decisionAction.replace("_", " ")}.`);
      setDecisionAction(null);
      setDecisionReason("");
      await loadData();
    } catch (err: any) {
      alert(`Decision error: ${err.message}`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDraft || !commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      await addComment(selectedDraft.id, {
        author_role: role,
        content: commentText.trim(),
      });
      setCommentText("");
      const refreshed = await getDraft(selectedDraft.id);
      setSelectedDraft(refreshed);
    } catch (err: any) {
      alert(`Comment error: ${err.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading Approvals Queue...</p>
      </div>
    );
  }

  const isManager = role === "Manager" || role === "Admin";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast */}
      {notification && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs flex items-center justify-between">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="text-emerald-700 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Approvals & Editorial Review</h1>
          <p className="text-xs text-gray-500 mt-1">
            Review submitted content against brand findings, examine audit history, and authorize publication.
          </p>
        </div>

        {/* Manager Mode Notice */}
        <div className="flex items-center space-x-2">
          {!isManager && (
            <div className="text-xs text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>
                You are viewing as <strong>{role}</strong>. Switch to <strong>Manager</strong> in header to approve.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Drafts List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Drafts Queue ({drafts.length})
          </div>
          {drafts.map((d) => {
            const isSelected = selectedDraftId === d.id;
            return (
              <div
                key={d.id}
                onClick={() => handleSelectDraft(d.id)}
                className={`p-4 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? "border-[#1B4332] bg-emerald-50/30 ring-1 ring-[#1B4332] shadow-sm"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-sm text-gray-900 truncate mr-2">{d.title}</span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      d.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : d.status === "submitted"
                        ? "bg-amber-100 text-amber-800"
                        : d.status === "changes_requested"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {d.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Author: {d.author_role}</span>
                  <span>v{d.current_version?.version_num || 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: Detailed Review & Approval Actions (8 cols) */}
        <div className="lg:col-span-8">
          {selectedDraft ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
              {/* Draft Info Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4 gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-gray-900">{selectedDraft.title}</h2>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-md font-semibold text-gray-700">
                      v{selectedDraft.current_version?.version_num || 1}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Intent: {selectedDraft.target_intent || "Not specified"}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/history/${selectedDraft.id}`}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <History className="w-3.5 h-3.5" />
                    <span>View Audit History</span>
                  </Link>

                  {isManager && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setDecisionAction("request_changes");
                          setDecisionReason("");
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Request Changes</span>
                      </button>

                      <button
                        onClick={() => {
                          setDecisionAction("approve");
                          setDecisionReason("All guideline clauses and facts verified. Complies with brand standards.");
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#1B4332] hover:bg-[#132E22] text-white rounded-lg text-xs font-semibold shadow-sm transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Draft</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Draft Content Preview */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Current Version Content
                </h3>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm whitespace-pre-wrap leading-relaxed font-sans text-gray-800">
                  {selectedDraft.current_version?.content || "No content."}
                </div>
              </div>

              {/* Findings Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Compliance Findings ({selectedDraft.findings.length})
                  </h3>
                </div>

                {selectedDraft.findings.length === 0 ? (
                  <p className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                    No findings recorded. Draft has not been scanned yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedDraft.findings.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-mono font-bold text-[#1B4332]">{f.source_code}</span>
                            <span className="text-[10px] uppercase font-semibold text-gray-600 bg-gray-200 px-1.5 py-0.2 rounded">
                              {f.category}
                            </span>
                            <span className="font-medium text-gray-800">&quot;{f.excerpt}&quot;</span>
                          </div>
                          <p className="text-gray-600 text-[11px]">{f.explanation}</p>
                          {f.dismiss_reason && (
                            <p className="text-amber-800 text-[11px] italic mt-0.5">
                              Dismissal Reason: {f.dismiss_reason}
                            </p>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
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
                )}
              </div>

              {/* Comments Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3 flex items-center space-x-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Review Comments ({selectedDraft.comments.length})</span>
                </h3>

                <div className="space-y-2 mb-3">
                  {selectedDraft.comments.map((c) => (
                    <div key={c.id} className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                      <div className="flex items-center justify-between text-gray-500 mb-1">
                        <span className="font-semibold text-gray-700 flex items-center space-x-1">
                          <User className="w-3 h-3 text-[#1B4332]" />
                          <span>{c.author_role}</span>
                        </span>
                        <span className="text-[10px]">{new Date(c.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-gray-800">{c.content}</p>
                    </div>
                  ))}
                </div>

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="flex space-x-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={`Add an editorial comment as ${role}...`}
                    className="flex-1 text-xs border border-gray-300 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#1B4332] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !commentText.trim()}
                    className="px-3.5 py-2 bg-[#1B4332] hover:bg-[#132E22] text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition"
                  >
                    Post
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 text-sm">
              Select a draft from the queue to review.
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {decisionAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
            <h3 className="font-bold text-gray-900 text-base mb-1">
              {decisionAction === "approve" ? "Authorize Draft Publication" : "Request Editorial Changes"}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              {decisionAction === "approve"
                ? "Confirm that this content complies with Nova Outdoor Gear brand standards."
                : "Specify what changes the creator must make before re-submitting."}
            </p>

            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Decision Rationale / Feedback <span className="text-red-500">*</span>
            </label>
            <textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              rows={3}
              placeholder="e.g. Approved price and claim references verified against Fact Library..."
              className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1B4332] focus:outline-none mb-4"
            />

            <div className="flex items-center justify-end space-x-2">
              <button
                type="button"
                onClick={() => setDecisionAction(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDecision || !decisionReason.trim()}
                onClick={handleConfirmDecision}
                className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-sm transition disabled:opacity-50 ${
                  decisionAction === "approve" ? "bg-[#1B4332] hover:bg-[#132E22]" : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {isSubmittingDecision ? "Saving..." : `Confirm ${decisionAction.replace("_", " ")}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
