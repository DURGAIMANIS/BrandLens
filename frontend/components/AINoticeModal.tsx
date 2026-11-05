"use client";

import React from "react";
import { AINotice } from "@/lib/api";
import { X, Sparkles, Cpu, ShieldCheck } from "lucide-react";

interface AINoticeModalProps {
  notice: AINotice;
  isOpen: boolean;
  onClose: () => void;
}

export default function AINoticeModal({ notice, isOpen, onClose }: AINoticeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-gray-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              notice.ai_used ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
            }`}>
              {notice.ai_used ? <Sparkles className="w-4 h-4" /> : <Cpu className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                {notice.ai_used ? "AI Review Audit Notice" : "Rule-Based Engine Notice"}
              </h3>
              <p className="text-xs text-gray-500">Full disclosure of engines and text payload.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-xs">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-500 block mb-0.5 uppercase tracking-wider text-[10px]">
              Engine / Model:
            </span>
            <p className="font-mono text-gray-900 font-medium">{notice.model_name}</p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
            <span className="font-semibold text-gray-500 block mb-0.5 uppercase tracking-wider text-[10px]">
              Text Sent for Review:
            </span>
            <p className="font-mono text-gray-800 bg-white p-2 rounded border border-gray-100 whitespace-pre-wrap">
              {notice.text_sent || "(No draft snippet available)"}
            </p>
          </div>

          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Human in the Loop Guarantee:</strong>
              BrandLens never alters text automatically. AI and rule outputs are suggestions only, requiring an explicit Accept or Edit click by a human.
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1B4332] hover:bg-[#132E22] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Close Notice
          </button>
        </div>
      </div>
    </div>
  );
}

