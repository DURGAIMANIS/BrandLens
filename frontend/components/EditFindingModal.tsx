"use client";

import React, { useState } from "react";
import { Finding } from "@/lib/api";
import { X, Edit3 } from "lucide-react";

interface EditFindingModalProps {
  finding: Finding;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customText: string) => void;
}

export default function EditFindingModal({ finding, isOpen, onClose, onConfirm }: EditFindingModalProps) {
  const [customText, setCustomText] = useState(finding.suggestion || finding.excerpt);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">Custom Rewrite</h3>
              <p className="text-xs text-gray-500">Fine-tune the replacement text before applying it.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Original Excerpt */}
        <div className="mt-4 p-3 bg-red-50/60 rounded-lg border border-red-200 text-xs">
          <span className="font-semibold text-red-900 block mb-0.5">Original Flagged Excerpt:</span>
          <p className="text-red-950 font-mono">&quot;{finding.excerpt}&quot;</p>
        </div>

        {/* Custom Edit Input */}
        <div className="mt-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Replacement Text <span className="text-red-500">*</span>
          </label>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={3}
            placeholder="Type your compliant replacement text..."
            className="w-full text-sm border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-[#1B4332] focus:outline-none"
          />
          <p className="text-[11px] text-gray-500 mt-1">
            Defaulted to BrandLens suggestion: &quot;{finding.suggestion}&quot;
          </p>
        </div>

        {/* Actions */}
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
              if (customText.trim()) {
                onConfirm(customText.trim());
              }
            }}
            disabled={!customText.trim()}
            className="px-4 py-2 bg-[#1B4332] hover:bg-[#132E22] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Apply Fix & Save Version
          </button>
        </div>
      </div>
    </div>
  );
}
