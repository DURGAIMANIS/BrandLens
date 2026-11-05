"use client";

import React from "react";
import { Finding } from "@/lib/api";
import { Check, Edit2, XCircle, AlertCircle, Quote, Sparkles, CheckCircle2 } from "lucide-react";

interface FindingCardProps {
  finding: Finding;
  isSelected: boolean;
  onSelect: () => void;
  onAccept: (finding: Finding) => void;
  onOpenEdit: (finding: Finding) => void;
  onOpenDismiss: (finding: Finding) => void;
  isProcessing?: boolean;
}

const SEVERITY_BADGE = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-blue-50 text-blue-700 border-blue-200",
};

const CATEGORY_COLORS = {
  tone: "bg-amber-100 text-amber-800",
  claims: "bg-red-100 text-red-800",
  terminology: "bg-purple-100 text-purple-800",
  accessibility: "bg-blue-100 text-blue-800",
  visual: "bg-teal-100 text-teal-800",
  messaging: "bg-emerald-100 text-emerald-800",
};

export default function FindingCard({
  finding,
  isSelected,
  onSelect,
  onAccept,
  onOpenEdit,
  onOpenDismiss,
  isProcessing,
}: FindingCardProps) {
  const isResolved = finding.status !== "open";

  return (
    <div
      id={`finding-card-${finding.id}`}
      onClick={onSelect}
      className={`rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
        isSelected
          ? "border-[#1B4332] ring-2 ring-[#1B4332]/20 bg-emerald-50/20 shadow-md"
          : isResolved
          ? "border-gray-200 bg-gray-50/70 opacity-80"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {/* Header: Category, Severity, and Status */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5 flex-wrap gap-1">
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
              CATEGORY_COLORS[finding.category as keyof typeof CATEGORY_COLORS] || "bg-gray-100 text-gray-800"
            }`}
          >
            {finding.category}
          </span>
          <span
            className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full border ${
              SEVERITY_BADGE[finding.severity]
            }`}
          >
            {finding.severity}
          </span>
        </div>

        {/* Status badge */}
        <div>
          {finding.status === "accepted" && (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              <Check className="w-3 h-3" />
              <span>Accepted</span>
            </span>
          )}
          {finding.status === "edited" && (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
              <Edit2 className="w-3 h-3" />
              <span>Custom Fix</span>
            </span>
          )}
          {finding.status === "dismissed" && (
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
              <XCircle className="w-3 h-3" />
              <span>Dismissed</span>
            </span>
          )}
        </div>
      </div>

      {/* Flagged Excerpt */}
      <div className="text-xs mb-2">
        <span className="text-gray-500 font-medium mr-1">Flagged:</span>
        <span className="font-mono bg-red-50 text-red-900 px-1.5 py-0.5 rounded border border-red-200 font-semibold line-through">
          &quot;{finding.excerpt}&quot;
        </span>
      </div>

      {/* Explanation */}
      <p className="text-xs text-gray-700 leading-relaxed mb-3">
        {finding.explanation}
      </p>

      {/* Source Citation (ID + exact quote) */}
      <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 text-xs mb-3">
        <div className="flex items-center space-x-1 text-[11px] font-semibold text-[#1B4332] mb-1">
          <Quote className="w-3 h-3" />
          <span>
            {finding.source_type === "fact" ? "Approved Fact:" : "Guideline Clause:"}{" "}
            <strong>{finding.source_code}</strong>
          </span>
        </div>
        <p className="text-gray-600 italic text-[11px] border-l-2 border-[#1B4332]/40 pl-2">
          &quot;{finding.source_quote}&quot;
        </p>
      </div>

      {/* Diff-style Suggestion */}
      {finding.suggestion && (
        <div className="p-2.5 bg-[#E8F5EE]/60 rounded-lg border border-[#40916C]/30 text-xs mb-3">
          <div className="flex items-center space-x-1 text-[11px] font-semibold text-[#1B4332] mb-1">
            <Sparkles className="w-3 h-3 text-[#40916C]" />
            <span>Suggested Replacement:</span>
          </div>
          <div className="flex items-baseline flex-wrap gap-1 font-mono text-[11px]">
            <del className="text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded">
              {finding.excerpt}
            </del>
            <span className="text-gray-400">→</span>
            <ins className="text-[#1B4332] bg-emerald-100 px-1.5 py-0.5 rounded font-bold no-underline">
              {finding.suggestion}
            </ins>
          </div>
        </div>
      )}

      {/* Dismissal Reason Note if dismissed */}
      {finding.status === "dismissed" && finding.dismiss_reason && (
        <div className="p-2 bg-gray-100 rounded text-[11px] text-gray-600 mb-2 italic">
          <strong>Reason:</strong> {finding.dismiss_reason}
        </div>
      )}

      {/* Action Buttons (when open) */}
      {!isResolved && (
        <div className="flex items-center justify-end space-x-2 pt-1 border-t border-gray-100">
          <button
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              onOpenDismiss(finding);
            }}
            className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition"
          >
            Dismiss
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              onOpenEdit(finding);
            }}
            className="px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-md transition"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={(e) => {
              e.stopPropagation();
              onAccept(finding);
            }}
            className="px-3 py-1 text-xs font-semibold text-white bg-[#1B4332] hover:bg-[#132E22] rounded-md shadow-sm transition flex items-center space-x-1"
          >
            <Check className="w-3 h-3" />
            <span>Accept</span>
          </button>
        </div>
      )}
    </div>
  );
}

