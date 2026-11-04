"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  fetchLibrary,
  createDraft,
  getDraft,
  reviewDraft,
  patchFinding,
  submitDraft,
  uploadFile,
  Finding,
  SampleDraft,
  AINotice,
  DraftDetailResponse,
} from "@/lib/api";
import { useRole } from "@/lib/roleContext";
import HighlightedEditor from "@/components/HighlightedEditor";
import FindingCard from "@/components/FindingCard";
import DismissModal from "@/components/DismissModal";
import EditFindingModal from "@/components/EditFindingModal";
import AINoticeModal from "@/components/AINoticeModal";
import {
  Sparkles,
  Upload,
  Send,
  History,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Edit,
  Eye,
  RefreshCw,
  Info,
} from "lucide-react";

export default function ReviewWorkspace() {
  const { role } = useRole();

  // State
  const [draftId, setDraftId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState("Apex Jacket Q4 Launch Announcement");
  const [targetIntent, setTargetIntent] = useState("announce Q4 launch, friendly tone");
  const [content, setContent] = useState("");
  const [versionNum, setVersionNum] = useState(1);
  const [draftStatus, setDraftStatus] = useState<string>("draft");
  
  const [sampleDrafts, setSampleDrafts] = useState<SampleDraft[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [selectedFindingId, setSelectedFindingId] = useState<number | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFinding, setIsProcessingFinding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [aiNotice, setAiNotice] = useState<AINotice | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [dismissModalFinding, setDismissModalFinding] = useState<Finding | null>(null);
  const [editModalFinding, setEditModalFinding] = useState<Finding | null>(null);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Library on initial mount
  useEffect(() => {
    async function loadInitial() {
      try {
        const lib = await fetchLibrary();
        setSampleDrafts(lib.sample_drafts);

        // Pre-load Sample Draft 1 if empty
        if (lib.sample_drafts.length > 0) {
          const sample = lib.sample_drafts[0];
          setDraftTitle(sample.title);
          setContent(sample.content);
          setTargetIntent(sample.target_intent);

          // Create draft in backend
          const draftRes = await createDraft({
            title: sample.title,
            content: sample.content,
            author_role: role,
            target_intent: sample.target_intent,
          });
          setDraftId(draftRes.id);
          setVersionNum(draftRes.current_version?.version_num || 1);
          setDraftStatus(draftRes.status);
        }
      } catch (err: any) {
        setNotification({
          type: "error",
          message: `Failed to load brand guidelines: ${err.message}`,
        });
      }
    }
    loadInitial();
  }, []);

  // Show auto-dismiss notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load a selected sample draft
  const handleLoadSample = async (sample: SampleDraft) => {
    setDraftTitle(sample.title);
    setContent(sample.content);
    setTargetIntent(sample.target_intent);
    setFindings([]);
    setSelectedFindingId(null);
    setIsEditing(false);

    try {
      const res = await createDraft({
        title: sample.title,
        content: sample.content,
        author_role: role,
        target_intent: sample.target_intent,
      });
      setDraftId(res.id);
      setVersionNum(res.current_version?.version_num || 1);
      setDraftStatus(res.status);
      setNotification({
        type: "info",
        message: `Loaded "${sample.title}" with planted brand issues. Click "Check content" to analyze.`,
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    }
  };

  // Run Review Pipeline
  const handleCheckContent = async () => {
    if (!draftId) {
      // Create first
      try {
        const created = await createDraft({
          title: draftTitle,
          content,
          author_role: role,
          target_intent: targetIntent,
        });
        setDraftId(created.id);
      } catch (e: any) {
        setNotification({ type: "error", message: e.message });
        return;
      }
    }

    setIsChecking(true);
    setIsEditing(false);
    try {
      const res = await reviewDraft(draftId!, {
        content,
        target_intent: targetIntent,
      });
      setFindings(res.findings);
      setAiNotice(res.ai_notice);
      if (res.findings.length > 0) {
        setSelectedFindingId(res.findings[0].id);
      }
      setNotification({
        type: "success",
        message: `Analysis completed: Found ${res.findings.length} brand compliance issue(s).`,
      });
    } catch (err: any) {
      setNotification({
        type: "error",
        message: `Review error: ${err.message}`,
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Accept Finding
  const handleAcceptFinding = async (finding: Finding) => {
    setIsProcessingFinding(true);
    try {
      const res = await patchFinding(finding.id, {
        action: "accept",
        user_role: role,
      });
      // Update local findings
      setFindings((prev) =>
        prev.map((f) => (f.id === finding.id ? res.finding : f))
      );
      if (res.updated_draft_content) {
        setContent(res.updated_draft_content);
      }
      if (res.new_version_num) {
        setVersionNum(res.new_version_num);
      }
      setNotification({
        type: "success",
        message: `Accepted suggestion for ${finding.source_code}. Created Version ${res.new_version_num}.`,
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsProcessingFinding(false);
    }
  };

  // Custom Edit Finding
  const handleConfirmEdit = async (customText: string) => {
    if (!editModalFinding) return;
    setIsProcessingFinding(true);
    try {
      const res = await patchFinding(editModalFinding.id, {
        action: "edit",
        custom_text: customText,
        user_role: role,
      });
      setFindings((prev) =>
        prev.map((f) => (f.id === editModalFinding.id ? res.finding : f))
      );
      if (res.updated_draft_content) {
        setContent(res.updated_draft_content);
      }
      if (res.new_version_num) {
        setVersionNum(res.new_version_num);
      }
      setEditModalFinding(null);
      setNotification({
        type: "success",
        message: `Applied custom edit for ${editModalFinding.source_code}. Created Version ${res.new_version_num}.`,
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsProcessingFinding(false);
    }
  };

  // Dismiss Finding
  const handleConfirmDismiss = async (reason: string) => {
    if (!dismissModalFinding) return;
    setIsProcessingFinding(true);
    try {
      const res = await patchFinding(dismissModalFinding.id, {
        action: "dismiss",
        dismiss_reason: reason,
        user_role: role,
      });
      setFindings((prev) =>
        prev.map((f) => (f.id === dismissModalFinding.id ? res.finding : f))
      );
      setDismissModalFinding(null);
      setNotification({
        type: "info",
        message: `Dismissed ${dismissModalFinding.source_code}: "${reason}".`,
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsProcessingFinding(false);
    }
  };

  // Submit Draft for Approval
  const handleSubmitForApproval = async () => {
    if (!draftId) return;
    setIsSubmitting(true);
    try {
      const res = await submitDraft(draftId, {
        user_role: role,
        note: `Submitted by ${role} for Manager review`,
      });
      setDraftStatus(res.status);
      setNotification({
        type: "success",
        message: `Draft successfully submitted for approval! Managers can now approve or request changes.`,
      });
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // File Upload (.txt, .docx, images)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadRes = await uploadFile(file);
      if (uploadRes.extracted_text) {
        setContent(uploadRes.extracted_text);
        setDraftTitle(file.name.replace(/\.[^/.]+$/, ""));
        setIsEditing(false);
        setFindings([]);

        if (uploadRes.image_analysis) {
          setNotification({
            type: "info",
            message: `Image analyzed: Dominant colors extracted. Missing alt text descriptor flagged.`,
          });
        } else {
          setNotification({
            type: "success",
            message: `Extracted content from ${file.name}. Ready to check.`,
          });
        }
      }
    } catch (err: any) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Filtered findings
  const filteredFindings = findings.filter((f) => {
    if (activeCategoryFilter === "all") return true;
    return f.category.toLowerCase() === activeCategoryFilter.toLowerCase();
  });

  const openFindingsCount = findings.filter((f) => f.status === "open").length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Banner Notice if AI is in fallback mode */}
      {aiNotice?.banner_message && (
        <div className="bg-amber-100 border-b border-amber-300 px-4 py-2 text-amber-900 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              <strong>{aiNotice.banner_message}</strong> — running 100% deterministic rules & approved facts verifier.
            </span>
          </div>
          <button
            onClick={() => setShowAiModal(true)}
            className="underline hover:text-amber-950 font-semibold text-[11px]"
          >
            Engine Details
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-50 max-w-md p-4 rounded-xl shadow-lg border text-xs flex items-start space-x-2 animate-in slide-in-from-bottom duration-200 ${
            notification.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : notification.type === "error"
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-blue-50 border-blue-200 text-blue-900"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1 font-medium">{notification.message}</div>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
      )}

      {/* Workspace Header Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Draft Title, Intent, and Sample Selector */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center space-x-3 flex-wrap gap-y-2">
              <input
                type="text"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                placeholder="Draft Title"
                className="font-bold text-lg text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-[#1B4332] focus:outline-none transition bg-transparent"
              />
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-semibold border border-gray-200">
                v{versionNum}
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  draftStatus === "approved"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : draftStatus === "submitted"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {draftStatus.replace("_", " ")}
              </span>

              {/* Sample Drafts Dropdown */}
              <div className="relative inline-block text-left">
                <select
                  onChange={(e) => {
                    const sel = sampleDrafts.find((s) => s.id_key === e.target.value);
                    if (sel) handleLoadSample(sel);
                  }}
                  defaultValue=""
                  className="text-xs bg-[#E8F5EE] text-[#1B4332] font-semibold px-3 py-1.5 rounded-lg border border-[#40916C]/30 hover:bg-[#d8ede1] transition cursor-pointer focus:outline-none"
                >
                  <option value="" disabled>
                    ⚡ Load sample draft with planted errors...
                  </option>
                  {sampleDrafts.map((s) => (
                    <option key={s.id_key} value={s.id_key}>
                      {s.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Intent Input */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500 font-medium">Target Intent:</span>
              <input
                type="text"
                value={targetIntent}
                onChange={(e) => setTargetIntent(e.target.value)}
                placeholder="e.g. announce Q4 launch, friendly tone, maintain high-value positioning"
                className="text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1 flex-1 max-w-xl focus:bg-white focus:ring-1 focus:ring-[#1B4332] focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            {/* Upload File Input (.txt, .docx, images) */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.docx,.png,.jpg,.jpeg,.webp"
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 transition disabled:opacity-50"
              title="Upload text, Word (.docx) or Image asset"
            >
              <Upload className={`w-3.5 h-3.5 ${isUploading ? "animate-spin" : ""}`} />
              <span>{isUploading ? "Uploading..." : "Upload File"}</span>
            </button>

            {/* View History link */}
            {draftId && (
              <Link
                href={`/history/${draftId}`}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5 transition"
              >
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </Link>
            )}

            {/* Check Content Primary Button */}
            <button
              type="button"
              disabled={isChecking || !content.trim()}
              onClick={handleCheckContent}
              className="px-4 py-2 bg-[#1B4332] hover:bg-[#132E22] text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isChecking ? "animate-spin text-[#DDA15E]" : ""}`} />
              <span>{isChecking ? "Checking Guidelines..." : "Check content"}</span>
            </button>

            {/* Submit for Approval Button */}
            {draftId && draftStatus === "draft" && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitForApproval}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Submitting..." : "Submit for approval"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Split View */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* LEFT COLUMN: Draft Editor / Interactive Highlights (7 cols) */}
          <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            {/* Editor mode tabs and metadata */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-3">
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    !isEditing
                      ? "bg-[#1B4332] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Annotated Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isEditing
                      ? "bg-[#1B4332] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Edit Text</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-500 flex items-center space-x-3">
                <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                <span>•</span>
                <span>{content.length} chars</span>
              </div>
            </div>

            {/* Instruction tooltip banner */}
            <div className="text-[11px] text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 mb-3 flex items-center justify-between">
              <span>
                {isEditing
                  ? "Editing Mode: Modify copy directly. Click 'Check content' to re-verify."
                  : "Interactive Mode: Click highlighted phrases below to view corresponding guideline citations."}
              </span>
              {openFindingsCount > 0 && !isEditing && (
                <span className="font-semibold text-amber-800">
                  {openFindingsCount} open issue(s)
                </span>
              )}
            </div>

            {/* Editor Container */}
            <div className="flex-1 flex flex-col">
              <HighlightedEditor
                content={content}
                findings={findings}
                selectedFindingId={selectedFindingId}
                onSelectFinding={(id) => {
                  setSelectedFindingId(id);
                  const el = document.getElementById(`finding-card-${id}`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
                isEditing={isEditing}
                onChangeContent={setContent}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Finding Cards & AI Audit Info (5 cols) */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            {/* Header: Filters and AI Notice Pill */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <h2 className="font-bold text-gray-900 text-sm">Guidelines Findings</h2>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                    {findings.length}
                  </span>
                </div>

                {/* AI Audit Pill */}
                {aiNotice && (
                  <button
                    type="button"
                    onClick={() => setShowAiModal(true)}
                    className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition"
                  >
                    <Sparkles className="w-3 h-3 text-purple-500" />
                    <span>{aiNotice.ai_used ? "AI Used" : "Rule Engine"}</span>
                    <Info className="w-3 h-3 ml-0.5 text-purple-400" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1 text-xs">
                {["all", "tone", "claims", "terminology", "accessibility", "visual"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryFilter(cat)}
                    className={`capitalize px-2.5 py-1 rounded-lg font-medium transition ${
                      activeCategoryFilter === cat
                        ? "bg-[#1B4332] text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Findings List */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
              {filteredFindings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
                  <CheckCircle2 className="w-8 h-8 text-[#40916C] mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 text-sm">No issues found</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                    {findings.length > 0
                      ? "No findings in this category filter."
                      : "Paste your text or load a sample draft, then click 'Check content' to verify against brand guidelines."}
                  </p>
                </div>
              ) : (
                filteredFindings.map((f) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    isSelected={selectedFindingId === f.id}
                    onSelect={() => setSelectedFindingId(f.id)}
                    onAccept={handleAcceptFinding}
                    onOpenEdit={(finding) => setEditModalFinding(finding)}
                    onOpenDismiss={(finding) => setDismissModalFinding(finding)}
                    isProcessing={isProcessingFinding}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {dismissModalFinding && (
        <DismissModal
          finding={dismissModalFinding}
          isOpen={!!dismissModalFinding}
          onClose={() => setDismissModalFinding(null)}
          onConfirm={handleConfirmDismiss}
        />
      )}

      {editModalFinding && (
        <EditFindingModal
          finding={editModalFinding}
          isOpen={!!editModalFinding}
          onClose={() => setEditModalFinding(null)}
          onConfirm={handleConfirmEdit}
        />
      )}

      {aiNotice && (
        <AINoticeModal
          notice={aiNotice}
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
        />
      )}
    </div>
  );
}
