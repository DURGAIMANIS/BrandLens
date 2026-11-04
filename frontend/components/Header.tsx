"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRole, UserRole } from "@/lib/roleContext";
import { checkHealth } from "@/lib/api";
import { ShieldCheck, BookOpen, CheckSquare, BarChart3, RefreshCw, User, Sparkles } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const { role, setRole } = useRole();
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "waking">("checking");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      try {
        await checkHealth();
        if (mounted) setServerStatus("online");
      } catch {
        if (mounted) setServerStatus("waking");
      }
    };
    probe();
    const interval = setInterval(probe, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const roles: UserRole[] = ["Creator", "Reviewer", "Manager", "Admin"];

  const navLinks = [
    { href: "/", label: "Review Workspace", icon: ShieldCheck },
    { href: "/library", label: "Brand Library", icon: BookOpen },
    { href: "/approvals", label: "Approvals Queue", icon: CheckSquare },
    { href: "/insights", label: "Insights", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-lg bg-[#1B4332] text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-[#40916C] transition-colors">
              B
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-xl text-gray-900 tracking-tight">BrandLens</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider bg-[#E8F5EE] text-[#1B4332] px-2 py-0.5 rounded-full border border-[#40916C]/20">
                  Nova Gear
                </span>
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-gray-100 text-[#1B4332] font-semibold"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side controls: Server status + Demo Role Switcher */}
        <div className="flex items-center space-x-3">
          {/* Server status pill */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50">
            {serverStatus === "online" && (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-gray-700">Server Online</span>
              </>
            )}
            {serverStatus === "waking" && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-amber-800">Waking Server...</span>
              </>
            )}
            {serverStatus === "checking" && (
              <>
                <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" />
                <span className="text-gray-500">Connecting</span>
              </>
            )}
          </div>

          {/* Demo Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-800 shadow-sm transition"
              title="Demo Role Switcher (No password required)"
            >
              <User className="w-4 h-4 text-[#1B4332]" />
              <span>Role: <strong className="text-[#1B4332]">{role}</strong></span>
              <span className="text-xs text-gray-400">▼</span>
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="px-3 py-1.5 border-b border-gray-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    Switch Demo Role
                  </p>
                  <p className="text-xs text-gray-400">No login required</p>
                </div>
                {roles.map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                      role === r ? "bg-[#E8F5EE] text-[#1B4332] font-semibold" : "text-gray-700"
                    }`}
                  >
                    <span>{r}</span>
                    {role === r && <span className="text-xs text-[#1B4332]">✓ Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
