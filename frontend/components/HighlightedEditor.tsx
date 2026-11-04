"use client";

import React from "react";
import { Finding } from "@/lib/api";

interface HighlightedEditorProps {
  content: string;
  findings: Finding[];
  selectedFindingId: number | null;
  onSelectFinding: (findingId: number) => void;
  isEditing: boolean;
  onChangeContent: (text: string) => void;
}

const CATEGORY_STYLES: Record<string, string> = {
  tone: "bg-amber-100 text-amber-950 border-b-2 border-amber-500 hover:bg-amber-200",
  claims: "bg-red-100 text-red-950 border-b-2 border-red-500 hover:bg-red-200",
  terminology: "bg-purple-100 text-purple-950 border-b-2 border-purple-500 hover:bg-purple-200",
  accessibility: "bg-blue-100 text-blue-950 border-b-2 border-blue-500 hover:bg-blue-200",
  visual: "bg-teal-100 text-teal-950 border-b-2 border-teal-500 hover:bg-teal-200",
  messaging: "bg-emerald-100 text-emerald-950 border-b-2 border-emerald-500 hover:bg-emerald-200",
};

export default function HighlightedEditor({
  content,
  findings,
  selectedFindingId,
  onSelectFinding,
  isEditing,
  onChangeContent,
}: HighlightedEditorProps) {
  if (isEditing) {
    return (
      <div className="relative h-full flex flex-col">
        <textarea
          value={content}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Paste or write your draft here..."
          className="w-full h-full min-h-[360px] p-4 text-sm font-sans leading-relaxed border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#1B4332] focus:outline-none resize-y"
        />
      </div>
    );
  }

  // Active open findings only for highlight rendering
  const activeFindings = findings
    .filter((f) => f.status === "open" && f.span_end > f.span_start)
    .sort((a, b) => a.span_start - b.span_start);

  if (activeFindings.length === 0) {
    return (
      <div className="p-4 text-sm font-sans leading-relaxed whitespace-pre-wrap text-gray-800 bg-white border border-gray-200 rounded-xl min-h-[360px]">
        {content || <span className="text-gray-400 italic">No content loaded yet.</span>}
      </div>
    );
  }

  // Segment content by spans
  const elements: React.ReactNode[] = [];
  let cursor = 0;

  activeFindings.forEach((finding, idx) => {
    const start = Math.max(0, Math.min(finding.span_start, content.length));
    const end = Math.max(start, Math.min(finding.span_end, content.length));

    // Text prior to highlight
    if (start > cursor) {
      elements.push(
        <span key={`text-${cursor}`}>
          {content.slice(cursor, start)}
        </span>
      );
    }

    // Highlighted span
    const isSelected = selectedFindingId === finding.id;
    const styleClass =
      CATEGORY_STYLES[finding.category.toLowerCase()] ||
      "bg-yellow-100 text-yellow-900 border-b-2 border-yellow-500";

    elements.push(
      <mark
        key={`finding-${finding.id}-${idx}`}
        onClick={() => onSelectFinding(finding.id)}
        className={`cursor-pointer px-1 py-0.5 rounded transition-all duration-150 inline-block font-medium ${styleClass} ${
          isSelected ? "ring-2 ring-offset-1 ring-[#1B4332] shadow-sm font-bold" : ""
        }`}
        title={`Click to view: ${finding.source_code} (${finding.category})`}
      >
        {content.slice(start, end)}
      </mark>
    );

    cursor = end;
  });

  // Remaining text
  if (cursor < content.length) {
    elements.push(
      <span key={`text-end`}>
        {content.slice(cursor)}
      </span>
    );
  }

  return (
    <div className="p-4 text-sm font-sans leading-relaxed whitespace-pre-wrap text-gray-800 bg-white border border-gray-200 rounded-xl min-h-[360px] select-text">
      {elements}
    </div>
  );
}
