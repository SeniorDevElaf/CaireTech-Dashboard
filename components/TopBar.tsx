"use client";

import { useState } from "react";
import type { AppStatus, TimefoldDemoDataMeta, TimefoldModelInput, TimefoldRoutePlan } from "@/lib/types";

export type OptimizationSpeed = "quick" | "standard" | "full";

export const OPTIMIZATION_SPEEDS: Record<OptimizationSpeed, { label: string; limit: string | undefined; description: string }> = {
  quick: { label: "Quick (1 min)", limit: "PT1M", description: "Fast results, good quality" },
  standard: { label: "Standard (2 min)", limit: "PT2M", description: "Balanced speed and quality" },
  full: { label: "Full (no limit)", limit: undefined, description: "Best quality, takes longer" },
};

export type SchedulerViewPreset = "dag" | "vecka" | "14dagar" | "manad" | "anpassad";

interface TopBarProps {
  datasets: TimefoldDemoDataMeta[];
  selectedDatasetId: string;
  onDatasetChange: (id: string) => void;
  onLoadDataset: () => void;
  onOptimize: () => void;
  onSimulate?: () => void;
  status: AppStatus;
  canOptimize: boolean;
  optimizationSpeed: OptimizationSpeed;
  onSpeedChange: (speed: OptimizationSpeed) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewPreset: SchedulerViewPreset;
  onViewPresetChange: (preset: SchedulerViewPreset) => void;
  inputModel: TimefoldModelInput | null;
  routePlan: TimefoldRoutePlan | null;
}

export function TopBar({
  datasets,
  selectedDatasetId,
  onDatasetChange,
  onOptimize,
  onSimulate,
  status,
  canOptimize,
  optimizationSpeed,
  onSpeedChange,
  currentDate,
  onDateChange,
  viewPreset,
  onViewPresetChange,
  inputModel,
  routePlan,
}: TopBarProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const validDatasets = datasets.filter(d => d && d.id);

  const formattedDate = currentDate.toLocaleDateString("sv-SE", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const exportAsJson = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      inputModel,
      routePlan,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-export-${currentDate.toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportAsCsv = () => {
    if (!inputModel) return;
    
    const headers = ["Visit ID", "Visit Name", "Address", "Duration", "Required Skills", "Assigned To", "Start Time", "End Time"];
    const rows: string[][] = [];
    
    inputModel.visits.forEach(visit => {
      let assignedTo = "Unassigned";
      let startTime = "";
      let endTime = "";
      
      if (routePlan?.routes) {
        for (const route of routePlan.routes) {
          const plannedVisit = route.visits.find(v => v.id === visit.id || v.visitId === visit.id);
          if (plannedVisit) {
            assignedTo = route.vehicleId;
            startTime = plannedVisit.arrivalTime || plannedVisit.startServiceTime || "";
            endTime = plannedVisit.departureTime || "";
            break;
          }
        }
      }
      
      const address = Array.isArray(visit.location) 
        ? `${visit.location[0]}, ${visit.location[1]}`
        : (visit.location as { address?: string })?.address || "";
      
      const skills = Array.isArray(visit.requiredSkills) 
        ? visit.requiredSkills.map(s => typeof s === "string" ? s : s.name).join("; ")
        : "";
      
      rows.push([
        visit.id,
        visit.name,
        address,
        visit.serviceDuration,
        skills,
        assignedTo,
        startTime,
        endTime,
      ]);
    });
    
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-export-${currentDate.toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const copyToClipboard = async () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      inputModel,
      routePlan,
    };
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    setShowMoreMenu(false);
  };

  const viewPresets: { id: SchedulerViewPreset; label: string; shortLabel: string }[] = [
    { id: "dag", label: "Dag", shortLabel: "D" },
    { id: "vecka", label: "Vecka", shortLabel: "V" },
    { id: "14dagar", label: "14 Dagar", shortLabel: "14D" },
    { id: "manad", label: "Månad", shortLabel: "M" },
    { id: "anpassad", label: "Anpassad", shortLabel: "..." },
  ];

  return (
    <div className="flex flex-col gap-3 sm:gap-4 lg:gap-6 pb-3 sm:pb-4 bg-background sticky top-0 z-30 px-3 sm:px-6 pt-3 sm:pt-6">
      {/* Row 1: Title + Mobile Menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-display font-bold text-slate-900">Schemaläggning</h1>
        </div>
        
        {/* Mobile Menu Button */}
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showMobileMenu ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Row 2: Controls - Scrollable on mobile */}
      <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-3 lg:gap-4">
        {/* Date Navigation */}
        <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-slate-200 shrink-0">
          <button 
            onClick={goToPreviousDay}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-slate-50 rounded text-slate-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 border-l border-r border-slate-100 h-6">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">{formattedDate}</span>
          </div>
          <button 
            onClick={goToToday}
            className="px-2 sm:px-3 h-7 sm:h-8 text-[10px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 border-r border-slate-100 transition-colors"
          >
            Idag
          </button>
          <button 
            onClick={goToNextDay}
            className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center hover:bg-slate-50 rounded text-slate-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* View Toggles - Compact on mobile */}
        <div className="flex items-center bg-white rounded-lg p-1 shadow-sm border border-slate-200 overflow-x-auto shrink-0">
          {viewPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onViewPresetChange(preset.id)}
              className={`
                px-2 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium rounded-md transition-all whitespace-nowrap
                ${viewPreset === preset.id 
                  ? "bg-slate-900 text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }
              `}
            >
              <span className="sm:hidden">{preset.shortLabel}</span>
              <span className="hidden sm:inline">{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Dataset Selector */}
        <div className="relative group z-50 shrink-0">
          <button className="flex items-center gap-2 bg-brand-50 text-brand-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold border border-brand-100 hover:bg-brand-100 transition-colors shadow-sm w-full sm:w-auto sm:min-w-[180px] sm:max-w-[260px] justify-between">
            <div className="flex items-center gap-2 truncate">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">
                {datasets.find(d => d.id === selectedDatasetId)?.name || "Select Dataset"}
              </span>
            </div>
            <svg className="w-3 h-3 opacity-70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <div className="absolute top-full left-0 pt-2 w-full sm:w-64 hidden group-hover:block z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 max-h-[300px] overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-50 mb-1 sticky top-0 bg-white z-10">
                Available Datasets
              </div>
              {validDatasets.length > 0 ? (
                validDatasets.map(d => (
                  <button
                    key={d.id}
                    onClick={() => { onDatasetChange(d.id); }}
                    className={`
                      w-full text-left px-3 py-2 text-xs sm:text-sm rounded-lg mb-0.5 transition-colors break-words
                      ${selectedDatasetId === d.id 
                        ? "bg-brand-50 text-brand-700 font-medium" 
                        : "text-slate-600 hover:bg-slate-50"
                      }
                    `}
                  >
                    {d.name || d.id}
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-slate-400 italic">
                  No datasets available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Action Buttons */}
      <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${showMobileMenu ? 'flex' : 'hidden lg:flex'}`}>
        {/* Optimize Button */}
        <div className="flex rounded-lg shadow-sm overflow-visible relative z-40">
          <button
            onClick={onOptimize}
            disabled={!canOptimize || status === "optimizing" || status === "polling"}
            className="flex items-center gap-1.5 sm:gap-2 bg-success-light text-success-dark px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-l-lg border-r border-green-200"
          >
            {status === "optimizing" || status === "polling" ? (
              <LoadingSpinner />
            ) : (
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            <span>Optimera</span>
          </button>
          <div className="bg-success-light flex items-center px-1.5 sm:px-2 hover:bg-green-100 cursor-pointer relative group rounded-r-lg">
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <div className="absolute top-full left-0 pt-2 w-44 sm:w-48 hidden group-hover:block z-50">
              <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-1.5 sm:p-2">
                <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 sm:px-3 py-1.5 sm:py-2 border-b border-slate-50 mb-1">
                  Optimization Speed
                </div>
                {(Object.keys(OPTIMIZATION_SPEEDS) as OptimizationSpeed[]).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => onSpeedChange(speed)}
                    className={`
                      w-full text-left px-2 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs font-medium rounded-lg mb-0.5 transition-colors flex items-center justify-between
                      ${optimizationSpeed === speed ? "bg-brand-50 text-brand-600" : "text-slate-600 hover:bg-slate-50"}
                    `}
                  >
                    <span>{OPTIMIZATION_SPEEDS[speed].label}</span>
                    {optimizationSpeed === speed && (
                      <svg className="w-3 h-3 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="relative">
          <div className="flex rounded-lg shadow-sm overflow-hidden">
            <button 
              onClick={exportAsJson}
              disabled={!inputModel}
              className="flex items-center gap-1.5 sm:gap-2 bg-warning-light text-warning-dark px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="hidden sm:inline">Exportera</span>
            </button>
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={!inputModel}
              className="bg-warning-light border-l border-amber-200 flex items-center px-1.5 sm:px-2 hover:bg-amber-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {showExportMenu && inputModel && (
            <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-50 mb-1">
                Export Format
              </div>
              <button
                onClick={exportAsJson}
                className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span>JSON</span>
              </button>
              <button
                onClick={exportAsCsv}
                className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>CSV</span>
              </button>
            </div>
          )}
        </div>

        {/* More Button */}
        <div className="relative">
          <button 
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 text-slate-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-slate-200 transition-colors shadow-sm"
          >
            <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
            <span className="hidden sm:inline">Mer</span>
          </button>
          
          {showMoreMenu && (
            <div className="absolute top-full right-0 sm:left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-2 z-50">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 border-b border-slate-50 mb-1">
                Fler alternativ
              </div>
              <button
                onClick={copyToClipboard}
                disabled={!inputModel}
                className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Kopiera till urklipp</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Skriv ut</span>
              </button>
              <button
                onClick={() => {
                  if (confirm("Vill du återställa alla filter?")) {
                    window.location.reload();
                  }
                  setShowMoreMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs font-medium rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Återställ</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Simulate Button (Dev Only) */}
        {onSimulate && (
          <button 
            onClick={onSimulate}
            className="ml-auto text-[10px] sm:text-xs text-slate-400 hover:text-brand-500 underline whitespace-nowrap"
          >
            Simulate (Dev)
          </button>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
