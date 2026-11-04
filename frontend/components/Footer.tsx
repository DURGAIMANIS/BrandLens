import React from "react";
import { ShieldCheck, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#1B4332]" />
          <span className="font-medium text-gray-700">BrandLens</span>
          <span>• Brand compliance & guideline verification for Nova Outdoor Gear</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
            AI-assisted. Final decisions are made by people.
          </span>
        </div>
      </div>
    </footer>
  );
}
