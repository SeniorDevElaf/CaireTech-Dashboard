"use client";

import { useMemo } from "react";
import type { SchedulerData, KpiSummary, ViewMode } from "@/lib/types";

export type EventStatusFilter = "oplanerad" | "planerad" | "optimerad" | "utford";
export type EntityFilter = "personal" | "kunder";

interface FilterBarProps {
  scheduleData: SchedulerData | null;
  kpis: KpiSummary | null;
  currentView: ViewMode;
  activeStatusFilters: Set<EventStatusFilter>;
  onToggleStatusFilter: (filter: EventStatusFilter) => void;
  activeEntityFilter: EntityFilter;
  onEntityFilterChange: (filter: EntityFilter) => void;
  onAdvancedClick: () => void;
  showAdvanced: boolean;
}

export function FilterBar({
  scheduleData,
  kpis,
  currentView,
  activeStatusFilters,
  onToggleStatusFilter,
  activeEntityFilter,
  onEntityFilterChange,
  onAdvancedClick,
  showAdvanced,
}: FilterBarProps) {
  // Calculate dynamic counts from the schedule data
  const counts = useMemo(() => {
    if (!scheduleData || !kpis) {
      return {
        oplanerad: 0,
        planerad: 0,
        optimerad: 0,
        utford: 0,
        total: 0,
      };
    }

    const visitEvents = scheduleData.events.filter(e => e.eventType === "visit");
    const total = visitEvents.length;
    
    // Count by status
    const baselineCount = visitEvents.filter(e => e.status === "baseline").length;
    const adjustedCount = visitEvents.filter(e => e.isAdjusted).length;
    
    return {
      oplanerad: currentView === "baseline" ? Math.round((baselineCount / Math.max(total, 1)) * 100) : 0,
      planerad: currentView === "baseline" ? 100 : Math.round(((kpis.assignedVisitsOptimized || 0) / Math.max(kpis.totalVisitsOptimized || 1, 1)) * 100),
      optimerad: currentView === "optimized" ? Math.round(kpis.avgUtilizationOptimized || 0) : 0,
      utford: adjustedCount > 0 ? Math.round((adjustedCount / Math.max(total, 1)) * 100) : 0,
      total,
    };
  }, [scheduleData, kpis, currentView]);

  // Dynamic utilization percentage
  const utilization = currentView === "optimized" 
    ? kpis?.avgUtilizationOptimized 
    : kpis?.avgUtilizationBaseline;

  return (
    <div className="flex items-center gap-2 py-2 overflow-x-auto no-scrollbar min-w-0">
      {/* Status Filters - responsive grid on very small screens */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <FilterPill 
          label="Oplanerad" 
          shortLabel="Opl"
          count={`${counts.oplanerad}%`} 
          color="warning" 
          active={activeStatusFilters.has("oplanerad")}
          onClick={() => onToggleStatusFilter("oplanerad")}
        />
        <FilterPill 
          label="Planerad" 
          shortLabel="Plan"
          count={`${counts.planerad}%`} 
          color="info" 
          active={activeStatusFilters.has("planerad")}
          onClick={() => onToggleStatusFilter("planerad")}
        />
        <FilterPill 
          label="Optimerad" 
          shortLabel="Opt"
          count={`${counts.optimerad}%`} 
          color="success" 
          active={activeStatusFilters.has("optimerad")}
          onClick={() => onToggleStatusFilter("optimerad")}
        />
        <FilterPill 
          label="Utförd" 
          shortLabel="Utf"
          count={`${counts.utford}%`} 
          color="purple" 
          active={activeStatusFilters.has("utford")}
          onClick={() => onToggleStatusFilter("utford")}
        />
      </div>
      
      <div className="w-px h-6 bg-slate-200 mx-1 sm:mx-2 shrink-0 hidden sm:block" />
      
      {/* Active Selection - shows current view status */}
      <div className="flex items-center bg-emerald-50 border border-emerald-200 rounded-lg px-2 sm:px-3 py-1.5 gap-1.5 sm:gap-2 shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wide hidden xs:inline">
          {currentView === "optimized" ? "Optimerad" : "Baseline"}
        </span>
        <span className="bg-white px-1.5 rounded text-emerald-700 text-[10px] sm:text-xs font-bold shadow-sm">
          {utilization || 0}%
        </span>
      </div>

      <div className="w-px h-6 bg-slate-200 mx-1 sm:mx-2 shrink-0 hidden sm:block" />

      {/* Entity Filters - hidden on mobile, show in advanced panel instead */}
      <div className="hidden sm:flex items-center gap-2 shrink-0">
        <FilterButton 
          icon={<UserIcon />} 
          label="Personal" 
          active={activeEntityFilter === "personal"}
          onClick={() => onEntityFilterChange("personal")}
        />
        <FilterButton 
          icon={<UsersIcon />} 
          label="Kunder" 
          active={activeEntityFilter === "kunder"}
          onClick={() => onEntityFilterChange("kunder")}
        />
      </div>
      
      <div className="ml-auto shrink-0">
        <FilterButton 
          icon={<AdjustmentsIcon />} 
          label="Filter" 
          shortLabel=""
          active={showAdvanced}
          onClick={onAdvancedClick}
        />
      </div>
    </div>
  );
}

interface FilterPillProps {
  label: string;
  shortLabel?: string;
  count: string;
  color: string;
  active: boolean;
  onClick: () => void;
}

function FilterPill({ label, shortLabel, count, color, active, onClick }: FilterPillProps) {
  const colors: Record<string, string> = {
    warning: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
    info: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
    purple: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  };

  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-medium transition-all cursor-pointer
        ${colors[color] || colors.info}
        ${!active && "opacity-50 grayscale"}
      `}
    >
      {active && (
        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel || label}</span>
      <span className="bg-white/50 px-1 sm:px-1.5 rounded text-[9px] sm:text-[10px] font-bold">{count}</span>
    </button>
  );
}

interface FilterButtonProps {
  icon: React.ReactNode;
  label: string;
  shortLabel?: string;
  active: boolean;
  onClick: () => void;
}

function FilterButton({ icon, label, shortLabel, active, onClick }: FilterButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border text-[10px] sm:text-xs font-medium transition-all cursor-pointer
        ${active 
          ? "bg-white text-brand-700 border-brand-200 shadow-sm ring-1 ring-brand-100" 
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
        }
      `}
    >
      <span className={active ? "text-brand-500" : "text-slate-400"}>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
      {shortLabel !== undefined && <span className="sm:hidden">{shortLabel}</span>}
    </button>
  );
}

function UserIcon() {
  return (
    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function AdjustmentsIcon() {
  return (
    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  );
}
