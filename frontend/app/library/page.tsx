"use client";

import React, { useEffect, useState } from "react";
import { fetchLibrary, LibraryResponse, Clause, Fact, Term, BrandColor } from "@/lib/api";
import { BookOpen, ShieldAlert, CheckCircle2, AlertTriangle, Palette, Layers, Info } from "lucide-react";

export default function LibraryPage() {
  const [library, setLibrary] = useState<LibraryResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"clauses" | "facts" | "terms" | "palette">("clauses");
  const [clauseCategory, setClauseCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLibrary();
        setLibrary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !library) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading Nova Outdoor Gear Brand Library...</p>
      </div>
    );
  }

  // Filter clauses
  const filteredClauses = library.clauses.filter((c) => {
    const matchesCat = clauseCategory === "all" || c.category.toLowerCase() === clauseCategory.toLowerCase();
    const matchesQuery =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.text.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  // Filter facts
  const filteredFacts = library.facts.filter((f) => {
    return (
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.statement.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.source.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Filter terms
  const filteredTerms = library.terms.filter((t) => {
    return (
      t.banned_term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.preferred_term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Brand Library</h1>
            <span className="text-xs bg-[#E8F5EE] text-[#1B4332] font-semibold px-2.5 py-0.5 rounded-full border border-[#40916C]/20">
              {library.company_name}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Official guidelines, approved facts, terminology standards, and brand assets repository.
          </p>
        </div>

        {/* Global Search within library */}
        <div className="w-full md:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search guidelines, facts, terms..."
            className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-1 focus:ring-[#1B4332] focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="border-b border-gray-200 mb-6 flex space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("clauses")}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "clauses"
              ? "border-[#1B4332] text-[#1B4332]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Guideline Clauses ({library.clauses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("facts")}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "facts"
              ? "border-[#1B4332] text-[#1B4332]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Approved Facts ({library.facts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("terms")}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "terms"
              ? "border-[#1B4332] text-[#1B4332]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Terminology Rules ({library.terms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("palette")}
          className={`pb-3 transition-colors border-b-2 flex items-center space-x-1.5 ${
            activeTab === "palette"
              ? "border-[#1B4332] text-[#1B4332]"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Color Palette ({library.brand_palette.length})</span>
        </button>
      </div>

      {/* TAB 1: GUIDELINE CLAUSES */}
      {activeTab === "clauses" && (
        <div>
          {/* Subcategory Pills */}
          <div className="flex flex-wrap gap-1.5 mb-6">
            {["all", "tone", "terminology", "messaging", "claims", "visual", "accessibility"].map((cat) => (
              <button
                key={cat}
                onClick={() => setClauseCategory(cat)}
                className={`capitalize text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                  clauseCategory === cat
                    ? "bg-[#1B4332] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClauses.map((c) => (
              <div
                key={c.code}
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-[#1B4332] bg-[#E8F5EE] px-2 py-0.5 rounded border border-[#40916C]/20">
                      {c.code}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">
                      {c.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{c.title}</h3>
                  <p className="text-xs text-gray-700 leading-relaxed italic border-l-2 border-[#1B4332]/40 pl-2 mb-3">
                    &quot;{c.text}&quot;
                  </p>
                </div>
                {c.rationale && (
                  <div className="text-[11px] text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                    <strong className="text-gray-700">Rationale:</strong> {c.rationale}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: APPROVED FACTS */}
      {activeTab === "facts" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-[11px] uppercase font-bold text-gray-500 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Topic</th>
                <th className="py-3 px-4">Approved Statement</th>
                <th className="py-3 px-4">Approved Value</th>
                <th className="py-3 px-4">Source Documentation</th>
                <th className="py-3 px-4">Validity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredFacts.map((f) => {
                const isExpired = f.valid_until && f.valid_until !== "permanent" && new Date(f.valid_until) < new Date("2024-01-01");
                return (
                  <tr key={f.code} className="hover:bg-gray-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-[#1B4332] whitespace-nowrap">
                      {f.code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">{f.topic}</td>
                    <td className="py-3 px-4 italic text-gray-800">&quot;{f.statement}&quot;</td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-800">{f.value}</td>
                    <td className="py-3 px-4 text-gray-500">{f.source}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {isExpired ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Expired ({f.valid_until})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Valid ({f.valid_until})</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: TERMINOLOGY */}
      {activeTab === "terms" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 text-[11px] uppercase font-bold text-gray-500 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="py-3 px-4">Banned / Discouraged Term</th>
                <th className="py-3 px-4">Preferred Brand Term</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Reason & Policy Rationale</th>
                <th className="py-3 px-4">Guideline Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTerms.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50/80 transition">
                  <td className="py-3 px-4 font-mono font-bold text-red-700 line-through">
                    {t.banned_term}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#1B4332] bg-emerald-50/50">
                    {t.preferred_term}
                  </td>
                  <td className="py-3 px-4 capitalize">{t.category}</td>
                  <td className="py-3 px-4 text-gray-600">{t.reason}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#40916C]">
                    {t.rule_code || "NOV-TERM-01"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: BRAND COLOR PALETTE */}
      {activeTab === "palette" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {library.brand_palette.map((color) => {
            const isGold = color.name.includes("Gold");
            return (
              <div
                key={color.name}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow transition"
              >
                <div
                  className="h-28 w-full flex items-end justify-between p-3"
                  style={{ backgroundColor: color.hex }}
                >
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded shadow-sm ${
                      color.hex === "#F8F9FA" ? "text-gray-900 bg-white" : "text-white bg-black/40"
                    }`}
                  >
                    {color.hex}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{color.name}</h3>
                    <span className="text-[10px] uppercase font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {color.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{color.usage}</p>
                  {isGold && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded border border-amber-200 flex items-start space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>WCAG AA Notice:</strong> Contrast ratio is ~2.1:1 on white. Never use as text color on light backgrounds (NOV-ACC-02).
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
