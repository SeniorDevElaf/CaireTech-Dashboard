"use client";

import { useState } from "react";
import { formatMinutesToDuration } from "@/lib/mapping";
import type { KpiSummary, ViewMode } from "@/lib/types";

interface KpiPanelProps {
  kpis: KpiSummary | null;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  hasOptimizedData: boolean;
}

/**
 * KpiPanel Component
 * 
 * Collapsible right sidebar showing insights and KPIs.
 */
export function KpiPanel({
  kpis,
  currentView,
  onViewChange,
  hasOptimizedData,
}: KpiPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(amount);
  };

  // Get values based on current view or default to 0
  const utilization = currentView === "optimized" ? kpis?.avgUtilizationOptimized : kpis?.avgUtilizationBaseline;
  const utilizationComparison = `${kpis?.avgUtilizationBaseline || 0}% → ${kpis?.avgUtilizationOptimized || 0}%`;
  
  const workTime = currentView === "optimized" ? kpis?.totalWorkTimeOptimized : kpis?.totalWorkTimeBaseline;
  const workTimeComparison = `${formatMinutesToDuration(kpis?.totalWorkTimeBaseline || 0)} / ${formatMinutesToDuration(kpis?.totalWorkTimeOptimized || 0)}`;
  
  const serviceTime = currentView === "optimized" ? kpis?.totalServiceTimeOptimized : kpis?.totalServiceTimeBaseline;
  const travelTime = currentView === "optimized" ? kpis?.totalTravelTimeOptimized : kpis?.totalTravelTimeBaseline;
  const waitTime = currentView === "optimized" ? kpis?.totalWaitTimeOptimized : kpis?.totalWaitTimeBaseline;
  
  // Non-billable is Travel + Wait
  const nonBillable = (travelTime || 0) + (waitTime || 0);
  
  const unassigned = currentView === "optimized" ? kpis?.unassignedVisitsOptimized : kpis?.unassignedVisitsBaseline;
  const visitsTotal = currentView === "optimized" ? kpis?.totalVisitsOptimized : kpis?.totalVisitsBaseline;
  const visitsAssigned = currentView === "optimized" ? kpis?.assignedVisitsOptimized : kpis?.assignedVisitsBaseline;
  
  const cost = currentView === "optimized" ? kpis?.totalCostOptimized : kpis?.totalCostBaseline;
  const savings = (kpis?.totalCostBaseline || 0) - (kpis?.totalCostOptimized || 0);

  // Collapsed view - just a thin bar with expand button
  if (isCollapsed) {
    return (
      <div className="w-12 bg-white border-l border-slate-200 h-full flex flex-col items-center py-6 shrink-0 hidden xl:flex shadow-xl shadow-slate-200/50 z-20">
        <button 
          onClick={() => setIsCollapsed(false)}
          className="p-2 text-slate-400 hover:text-brand-500 hover:bg-brand-50 rounded-lg transition-all"
          title="Visa Insikter"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Vertical text label */}
        <div 
          className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-brand-500"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          onClick={() => setIsCollapsed(false)}
        >
          Insikter
        </div>
        
        {/* Quick stats when collapsed */}
        <div className="mt-auto space-y-3">
          <div 
            className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-[10px] font-bold text-brand-600 cursor-pointer hover:bg-brand-100"
            title={`Utnyttjande: ${utilization || 0}%`}
            onClick={() => setIsCollapsed(false)}
          >
            {utilization || 0}%
          </div>
          <div 
            className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-600 cursor-pointer hover:bg-blue-100"
            title={`Besök: ${visitsAssigned || 0}`}
            onClick={() => setIsCollapsed(false)}
          >
            {visitsAssigned || 0}
          </div>
          {(unassigned || 0) > 0 && (
            <div 
              className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-[10px] font-bold text-red-600 cursor-pointer hover:bg-red-100 animate-pulse"
              title={`Ej tilldelade: ${unassigned}`}
              onClick={() => setIsCollapsed(false)}
            >
              {unassigned}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Expanded view
  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full overflow-y-auto flex flex-col shrink-0 hidden xl:flex p-6 gap-6 shadow-xl shadow-slate-200/50 z-20 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="font-display font-bold text-slate-900 text-lg">Insikter</h2>
        </div>
        <button 
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          title="Minimera"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
      <div className="flex items-center justify-between -mt-4">
        <button 
          onClick={() => onViewChange(currentView === "optimized" ? "baseline" : "optimized")}
          disabled={!hasOptimizedData}
          className={`text-xs font-medium uppercase tracking-wider px-2 py-1 rounded transition-colors ${
            hasOptimizedData 
              ? "text-brand-600 bg-brand-50 hover:bg-brand-100 cursor-pointer" 
              : "text-slate-400"
          }`}
        >
          {currentView === "optimized" ? "Optimerad" : "Baseline"}
        </button>
        {hasOptimizedData && (
          <div className="text-[10px] text-slate-400">
            Klicka för att byta vy
          </div>
        )}
      </div>

      {/* Effektivitet (Efficiency) Card */}
      <div className="bg-brand-50/50 rounded-2xl p-5 space-y-4 border border-brand-100">
        <div className="flex items-center gap-2 text-brand-800 font-bold text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3>Effektivitet</h3>
        </div>
        
        <div className="space-y-3">
          <Row 
            label="UTNYTTJANDE" 
            value={`${utilization || 0}%`} 
            subValue={hasOptimizedData ? utilizationComparison : undefined} 
            highlight 
          />
          <Row 
            label="ARBETSTIMMAR" 
            value={formatMinutesToDuration(workTime || 0)} 
            subValue={hasOptimizedData ? workTimeComparison : undefined}
          />
          <Row label="SERVICETIMMAR" value={formatMinutesToDuration(serviceTime || 0)} />
        </div>
      </div>

      {/* Tidfördelning (Time Distribution) Card */}
      <div className="bg-emerald-50/50 rounded-2xl p-5 space-y-4 border border-emerald-100">
        <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Tidfördelning</h3>
        </div>
        
        <div className="space-y-3">
          <Row label="RESA" value={formatMinutesToDuration(travelTime || 0)} />
          <Row label="VÄNTAN" value={formatMinutesToDuration(waitTime || 0)} />
          <Row label="ICKE-FAKTURERBAR TID" value={formatMinutesToDuration(nonBillable)} subValue="Resa + Väntan" />
          
          <div className="pt-2 border-t border-emerald-200/50">
             <Row 
               label="EJ TILLDELAD SERVICE" 
               value={unassigned ? `${unassigned} st` : "0 st"} 
               subValue={unassigned ? "Kräver åtgärd" : "Alla tilldelade"} 
               warning={(unassigned || 0) > 0} 
             />
          </div>
        </div>
      </div>

      {/* Besök (Visits) Card */}
      <div className="bg-blue-50/50 rounded-2xl p-5 space-y-4 border border-blue-100">
         <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3>Besök</h3>
        </div>

        <div className="space-y-3">
          <Row label="PLANERADE" value={(visitsTotal || 0).toString()} />
          <Row label="TILLDELADE" value={(visitsAssigned || 0).toString()} />
          <Row label="EJ TILLDELADE" value={(unassigned || 0).toString()} warning={(unassigned || 0) > 0} />
        </div>
      </div>

      {/* Ekonomi (Economy) Card */}
      <div className="bg-orange-50/50 rounded-2xl p-5 space-y-4 border border-orange-100">
         <div className="flex items-center gap-2 text-orange-800 font-bold text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Ekonomi</h3>
        </div>

         <div className="space-y-3">
          <Row label="KOSTNAD" value={formatCurrency(cost || 0)} />
          {hasOptimizedData && savings > 0 && (
            <Row label="BESPARING" value={formatCurrency(savings)} positive />
          )}
        </div>
      </div>

    </div>
  );
}

function Row({ label, value, subValue, highlight, warning, positive }: { label: string; value: string; subValue?: string; highlight?: boolean; warning?: boolean; positive?: boolean }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1">{label}</span>
      <div className="text-right">
        <div className={`font-bold text-sm ${highlight ? "text-xl" : ""} ${warning ? "text-red-600" : positive ? "text-emerald-600" : "text-slate-800"}`}>
          {value}
        </div>
        {subValue && <div className="text-[10px] text-slate-400 font-medium">{subValue}</div>}
      </div>
    </div>
  );
}
