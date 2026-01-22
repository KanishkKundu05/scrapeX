"use client";

import { useState } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";
import SessionList from "./SessionList";
import RoutingRules from "./RoutingRules";
import TweetInbox from "./TweetInbox";

type TabType = "inbox" | "routing" | "sessions" | "login";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("inbox");

  const tabs: { id: TabType; label: string }[] = [
    { id: "inbox", label: "Inbox" },
    { id: "routing", label: "Routing Rules" },
    { id: "sessions", label: "Sessions" },
    { id: "login", label: "Login" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200">
                IndiGo Support Dashboard
              </h1>
            </div>
            <Link
              href="/"
              className="text-sm text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
          <nav className="flex gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-lg">
          {activeTab === "inbox" && <TweetInbox />}
          {activeTab === "routing" && <RoutingRules />}
          {activeTab === "sessions" && <SessionList />}
          {activeTab === "login" && <LoginForm />}
        </div>
      </div>
    </div>
  );
}
