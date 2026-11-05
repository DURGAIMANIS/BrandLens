"use client";

import React, { useEffect, useState } from "react";
import { fetchInsights, InsightsResponse } from "@/lib/api";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, ShieldCheck, Flame, PieChart } from "lucide-react";

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchInsights();
        setInsights(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !insights) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading Brand Compliance Analytics...</p>
      </div>
    );
  }

  const categoryEntries = Object.entries(insights.by_category);
  const maxCategoryCount = Math.max(...categoryEntries.map(([_, v]) => v), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Compliance Insights & Analytics</h1>
        <p className="text-xs text-gray-500 mt-1">
          Repeated violations, highest-dismissal clauses, and guideline friction patterns across Nova Outdoor Gear content.
        </p>
      </div>

      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">
            Total Flagged Issues
          </span>
          <div className="text-3xl font-extrabold text-[#1B4332]">{insights.total_findings}</div>
          <p className="text-[11px] text-gray-400 mt-1">Across all drafts & reviews</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">
            Accepted Fixes
          </span>
          <div className="text-3xl font-extrabold text-emerald-700">
            {insights.status_counts.accepted || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Human-verified corrections applied</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">
            Custom Edits
          </span>
          <div className="text-3xl font-extrabold text-blue-700">
            {insights.status_counts.edited || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Custom copy rewrites saved</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-1">
            Dismissed Exceptions
          </span>
          <div className="text-3xl font-extrabold text-amber-700">
            {insights.status_counts.dismissed || 0}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Documented exception rationale</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="w-4 h-4 text-[#1B4332]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Violations by Category
            </h2>
          </div>

          <div className="space-y-3">
            {categoryEntries.map(([cat, count]) => {
              const pct = Math.round((count / maxCategoryCount) * 100);
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold capitalize text-gray-800">{cat}</span>
                    <span className="font-mono text-gray-500 font-bold">{count} issues</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#1B4332] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-[#1B4332]" />
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Issues by Severity
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <span className="text-xs uppercase font-bold text-red-700 block mb-1">High</span>
              <span className="text-2xl font-extrabold text-red-800">
                {insights.by_severity.high || 0}
              </span>
              <p className="text-[10px] text-red-600 mt-1">Regulatory & Fact Violations</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-xs uppercase font-bold text-amber-700 block mb-1">Medium</span>
              <span className="text-2xl font-extrabold text-amber-800">
                {insights.by_severity.medium || 0}
              </span>
              <p className="text-[10px] text-amber-600 mt-1">Brand Voice & Terminology</p>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-xs uppercase font-bold text-blue-700 block mb-1">Low</span>
              <span className="text-2xl font-extrabold text-blue-800">
                {insights.by_severity.low || 0}
              </span>
              <p className="text-[10px] text-blue-600 mt-1">Stylistic Polish</p>
            </div>
          </div>
        </div>

        {/* Most Dismissed Clauses & Guidelines (Friction Analysis) (12 cols) */}
        <div className="lg:col-span-12 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Most Dismissed Guidelines & Friction Points
              </h2>
            </div>
            <span className="text-xs text-gray-500">
              Clauses with high dismissal rates indicate potential guideline misalignment.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-gray-50 text-[11px] uppercase font-bold text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Guideline / Fact Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Total Times Flagged</th>
                  <th className="py-3 px-4">Dismissed Exceptions</th>
                  <th className="py-3 px-4">Dismissal Rate</th>
                  <th className="py-3 px-4">Guideline Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {insights.dismissal_rate_per_clause.map((item) => (
                  <tr key={item.source_code} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#1B4332]">
                      {item.source_code}
                    </td>
                    <td className="py-3 px-4 capitalize">{item.category}</td>
                    <td className="py-3 px-4 font-mono font-semibold">{item.total_flagged}</td>
                    <td className="py-3 px-4 font-mono text-amber-700 font-semibold">
                      {item.dismissed_count}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold">
                      {item.dismissal_rate_pct}%
                    </td>
                    <td className="py-3 px-4">
                      {item.dismissal_rate_pct > 50 ? (
                        <span className="text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          High Friction — Review Guideline
                        </span>
                      ) : item.dismissal_rate_pct > 20 ? (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Moderate Exceptions
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Healthy Compliance
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

