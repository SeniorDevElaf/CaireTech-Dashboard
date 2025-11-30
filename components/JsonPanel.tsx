"use client";

import { useState } from "react";
import type { TimefoldModelInput, TimefoldRoutePlan } from "@/lib/types";

interface JsonPanelProps {
  inputModel: TimefoldModelInput | null;
  routePlan: TimefoldRoutePlan | null;
}

type TabId = "input" | "output";

/**
 * JsonPanel Component
 * 
 * Collapsible panel showing raw JSON data for input model and route plan output.
 * Useful for debugging and understanding the data structure.
 */
export function JsonPanel({ inputModel, routePlan }: JsonPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("input");

  return (
    <div className="card overflow-hidden border-slate-200 mt-4 sm:mt-6">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors group"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-slate-100 p-1.5 sm:p-2 rounded-lg group-hover:bg-slate-200 transition-colors">
             <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div>
            <span className="font-semibold text-slate-700 text-xs sm:text-sm block">
              Inspector Mode
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">
              View raw input/output JSON data
            </span>
          </div>
        </div>
        <svg
          className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform duration-300 ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 animate-fade-in">
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
            <button
              onClick={() => setActiveTab("input")}
              className={`
                px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200
                ${activeTab === "input" 
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }
              `}
            >
              <span>Input</span>
              {inputModel && (
                <span className="ml-1 sm:ml-2 opacity-70 font-normal normal-case hidden sm:inline">
                  ({inputModel.vehicles.length}v, {inputModel.visits.length}b)
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("output")}
              className={`
                px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-200
                ${activeTab === "output" 
                  ? "bg-white text-primary shadow-sm ring-1 ring-black/5" 
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                }
                ${!routePlan && "opacity-50 cursor-not-allowed"}
              `}
              disabled={!routePlan}
            >
              <span>Output</span>
              {routePlan && (
                <span className="ml-1 sm:ml-2 opacity-70 font-normal normal-case hidden sm:inline">
                  ({routePlan.solverStatus})
                </span>
              )}
            </button>
          </div>

          {/* JSON Content */}
          <div className="p-3 sm:p-4">
            {activeTab === "input" ? (
              inputModel ? (
                <JsonViewer data={inputModel} />
              ) : (
                <EmptyState message="No input data loaded" />
              )
            ) : routePlan ? (
              <JsonViewer data={routePlan} />
            ) : (
              <EmptyState message="No optimization results yet" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Formatted JSON viewer with syntax highlighting
 */
function JsonViewer({ data }: { data: unknown }) {
  const jsonString = JSON.stringify(data, null, 2);

  return (
    <div className="json-panel text-[10px] sm:text-[11px] leading-relaxed max-h-[40vh] overflow-auto shadow-inner">
      <pre className="whitespace-pre-wrap break-words">
        <code>{syntaxHighlight(jsonString)}</code>
      </pre>
    </div>
  );
}

/**
 * Simple syntax highlighting for JSON
 * Returns string with span-wrapped tokens
 */
function syntaxHighlight(json: string): React.ReactNode {
  // Split by tokens while preserving them
  const tokenized = json.split(/("(?:[^"\\]|\\.)*"|\b(?:true|false|null)\b|-?\d+\.?\d*)/g);

  return tokenized.map((token, i) => {
    // String values
    if (/^"/.test(token)) {
      // Check if it's a key (followed by colon)
      const isKey = json.indexOf(token + ":") > -1 || json.indexOf(token + " :") > -1;
      if (isKey) {
        return (
          <span key={i} className="text-sky-300 font-semibold">
            {token}
          </span>
        );
      }
      return (
        <span key={i} className="text-emerald-300">
          {token}
        </span>
      );
    }
    // Numbers
    if (/^-?\d/.test(token)) {
      return (
        <span key={i} className="text-amber-300">
          {token}
        </span>
      );
    }
    // Booleans and null
    if (/^(true|false|null)$/.test(token)) {
      return (
        <span key={i} className="text-violet-300 font-bold">
          {token}
        </span>
      );
    }
    // Everything else (brackets, commas, etc)
    return <span key={i} className="text-slate-500">{token}</span>;
  });
}

/**
 * Empty state placeholder
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 sm:py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
      <p className="text-slate-400 text-xs sm:text-sm font-medium">{message}</p>
    </div>
  );
}
