/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Mail, FolderSearch, Settings, ShieldAlert, FileText, Database, Shield, Fingerprint } from "lucide-react";
import Dashboard from "./components/Dashboard";
import AnalyzeEmail from "./components/AnalyzeEmail";
import CaseList from "./components/CaseList";
import CaseDetail from "./components/CaseDetail";
import Campaigns from "./components/Campaigns";
import Reports from "./components/Reports";
import Evidence from "./components/Evidence";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function Sidebar() {
  const location = useLocation();
  const navItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Analyze", path: "/analyze", icon: Mail },
    { name: "Cases", path: "/cases", icon: FolderSearch },
    { name: "Campaigns", path: "/campaigns", icon: Database },
    { name: "Reports", path: "/reports", icon: FileText },
    { name: "Evidence", path: "/evidence", icon: Fingerprint },
  ];

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0">
      <div className="p-6 flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-blue-500" />
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Trac<span className="text-blue-500">Phish</span></h1>
          <p className="text-xs text-slate-500 font-medium tracking-wider uppercase">Forensic Platform</p>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (location.pathname.startsWith('/cases') && item.path === '/cases' && location.pathname !== '/');
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 hover:text-slate-300 cursor-pointer">
          <Settings className="w-4 h-4" />
          Settings
        </div>
      </div>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 flex items-center px-8 border-b border-slate-800/50 bg-slate-950/50 sticky top-0 backdrop-blur-sm z-10">
          <div className="flex items-center text-sm font-medium text-slate-400">
            <Shield className="w-4 h-4 mr-2 text-green-500" />
            System Status: Nominal
          </div>
          <div className="ml-auto flex items-center gap-4">
             <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
               OP
             </div>
          </div>
        </header>
        <div className="flex-1 p-8">
           {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<AnalyzeEmail />} />
          <Route path="/cases" element={<CaseList />} />
          <Route path="/cases/:id" element={<CaseDetail />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/evidence" element={<Evidence />} />
          <Route path="*" element={<div className="text-slate-500 p-8 flex items-center justify-center h-full text-xl">404 Not Found</div>} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

