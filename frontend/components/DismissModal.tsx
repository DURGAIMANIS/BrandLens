"use client";

import React, { useState } from "react";
import { Finding } from "@/lib/api";
import { X, AlertTriangle } from "lucide-react";

interface DismissModalProps {
  finding: Finding;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const PRESET_REASONS = [
  "Approved clearance exception",
  "Brand voice context exception",
  "Verified with marketing director",
  "Intentional stylistic campaign choice",
  "Non-product narrative usage"
];

export default function DismissModal({ finding, isOpen, onClose, onConfirm }: DismissModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Dismiss Finding</h3>
              <p className="text-xs text-gray-500">Provide an audit trail rationale for dismissing this issue.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Excerpt Details */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="font-mono uppercase font-bold text-[#1B4332]">{finding.source_code}</span>
            <span className="capitalize px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 text-[10px] font-medium">
              {finding.category}
            </span>
          </div>
          <p className="text-gray-800 font-medium">Flagged text: &quot;{finding.excerpt}&quot;</p>
        </div>

        {/* Quick Presets */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Quick Presets</label>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_REASONS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReason(p)}
                className={`text-xs px-2.5 py-1 rounded-full border transition ${
                  reason === p
                    ? "bg-[#1B4332] text-white border-[#1B4332]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Reason Input */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Reason for Dismissal <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g. Approved temporary exception by head of brand..."
            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1B4332] focus:outline-none"
          />
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (reason.trim()) {
                onConfirm(reason.trim());
              }
            }}
            disabled={!reason.trim()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Confirm Dismissal
          </button>
        </div>
      </div>
    </div>
  );
}
