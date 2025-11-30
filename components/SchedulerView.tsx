"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import type { SchedulerData, SchedulerEvent, ViewMode } from "@/lib/types";
import type { SchedulerViewPreset } from "./TopBar";

// Dynamically import BryntumScheduler with SSR disabled
const BryntumScheduler = dynamic(
  () => import("./BryntumScheduler").then((mod) => mod.BryntumScheduler),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center bg-white rounded-xl sm:rounded-2xl border border-slate-200/60">
        <div className="text-center">
          <div className="animate-spin w-6 h-6 sm:w-8 sm:h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-2 sm:mb-3" />
          <p className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider">Loading Scheduler...</p>
        </div>
      </div>
    ),
  }
);

interface SchedulerViewProps {
  data: SchedulerData | null;
  mode: ViewMode;
  onEventUpdate?: (event: SchedulerEvent) => void;
  isLoading?: boolean;
  viewPreset?: SchedulerViewPreset;
  currentDate?: Date;
}

export function SchedulerView({
  data,
  mode,
  onEventUpdate,
  isLoading = false,
  viewPreset = "dag",
}: SchedulerViewProps) {
  const [bryntumError, setBryntumError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Calculate display date from data
  const displayDate = useMemo(() => {
    if (!data || data.events.length === 0) return null;
    const firstEvent = data.events.find(e => e.eventType === "visit");
    if (firstEvent) {
      return new Date(firstEvent.startDate);
    }
    return null;
  }, [data]);

  // Handle zoom in/out
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.25));
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 sm:w-10 sm:h-10 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-3 sm:mb-4" />
          <p className="text-xs sm:text-sm font-medium text-slate-500">Loading schedule data...</p>
        </div>
      </div>
    );
  }

  if (bryntumError) {
    return (
      <div className="h-full w-full bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 p-4 sm:p-8">
        <FallbackScheduler 
          data={data} 
          mode={mode} 
          isLoading={false} 
          viewPreset={viewPreset}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white rounded-xl sm:rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden relative">
      {/* Toolbar Actions inside the card (Zoom, Filters etc) */}
      <div className="absolute top-0 right-0 p-1.5 sm:p-2 z-10 flex gap-0.5 sm:gap-1 bg-white/80 backdrop-blur-sm rounded-bl-lg border-l border-b border-slate-100">
        <IconButton icon={<SearchIcon />} title="Search" className="hidden sm:flex" />
        <IconButton icon={<FilterIcon />} title="Filter" className="hidden sm:flex" />
        <div className="w-px h-4 bg-slate-200 my-auto mx-0.5 sm:mx-1 hidden sm:block" />
        <IconButton icon={<ZoomOutIcon />} title="Zoom Out" onClick={handleZoomOut} />
        <span className="text-[10px] sm:text-xs text-slate-400 my-auto mx-0.5 sm:mx-1">{Math.round(zoomLevel * 100)}%</span>
        <IconButton icon={<ZoomInIcon />} title="Zoom In" onClick={handleZoomIn} />
      </div>

      <div className="h-full w-full">
        <BryntumScheduler
          data={data}
          mode={mode}
          onEventUpdate={onEventUpdate}
          viewPreset={viewPreset}
          zoomLevel={zoomLevel}
        />
      </div>

      {!data && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-20">
          <EmptyState />
        </div>
      )}
    </div>
  );
}

function IconButton({ 
  icon, 
  title, 
  onClick, 
  className = "" 
}: { 
  icon: React.ReactNode; 
  title?: string; 
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button 
      onClick={onClick}
      title={title}
      className={`p-1 sm:p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md sm:rounded-lg transition-colors flex items-center justify-center ${className}`}
    >
      {icon}
    </button>
  );
}

// Icons - responsive sizes
const SearchIcon = () => <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const FilterIcon = () => <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>;
const ZoomInIcon = () => <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const ZoomOutIcon = () => <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>;

/**
 * Fallback table-based scheduler when Bryntum is not available
 */
function FallbackScheduler({
  data,
  mode,
  isLoading,
  viewPreset,
}: {
  data: SchedulerData | null;
  mode: ViewMode;
  isLoading: boolean;
  viewPreset?: SchedulerViewPreset;
}) {
  // Group events by resource
  const eventsByResource = useMemo(() => {
    if (!data) return new Map<string, SchedulerEvent[]>();
    
    const grouped = new Map<string, SchedulerEvent[]>();
    data.events
      .filter((e) => e.eventType === "visit")
      .forEach((event) => {
        const existing = grouped.get(event.resourceId) || [];
        grouped.set(event.resourceId, [...existing, event]);
      });
    
    // Sort events by start time
    grouped.forEach((events, key) => {
      grouped.set(key, events.sort((a, b) => 
        new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      ));
    });
    
    return grouped;
  }, [data]);

  // Get display date from first event
  const displayDate = useMemo(() => {
    if (!data || data.events.length === 0) return new Date();
    const firstEvent = data.events.find(e => e.eventType === "visit");
    return firstEvent ? new Date(firstEvent.startDate) : new Date();
  }, [data]);

  // Generate time slots based on view preset
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    const hoursPerSlot = viewPreset === "dag" ? 1 : viewPreset === "vecka" ? 2 : 4;
    for (let h = 6; h <= 20; h += hoursPerSlot) {
      slots.push(`${h.toString().padStart(2, "0")}:00`);
    }
    return slots;
  }, [viewPreset]);

  if (isLoading) return null;

  if (!data || data.events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="text-xs sm:text-sm font-bold text-slate-700">
          {displayDate.toLocaleDateString("sv-SE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] sm:text-xs text-slate-500">{data.resources.length} personal</span>
          <span className="text-[10px] sm:text-xs text-slate-400">•</span>
          <span className="text-[10px] sm:text-xs text-slate-500">{data.events.filter(e => e.eventType === "visit").length} besök</span>
        </div>
      </div>

      {/* Timeline header - hidden on mobile */}
      <div className="hidden sm:flex border-b border-slate-200 pb-2 mb-2">
        <div className="w-36 lg:w-48 shrink-0" />
        <div className="flex-1 flex">
          {timeSlots.map((slot) => (
            <div key={slot} className="flex-1 text-center text-[10px] sm:text-xs text-slate-400 font-medium">
              {slot}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 sm:pr-2 no-scrollbar">
        {data.resources.map((resource) => {
          const events = eventsByResource.get(resource.id) || [];
          
          return (
            <div key={resource.id} className="bg-slate-50 rounded-lg border border-slate-100 p-2 sm:p-3 flex flex-col sm:flex-row gap-2 sm:gap-4">
              {/* Resource Info */}
              <div className="flex items-center gap-2 sm:gap-3 sm:w-36 lg:w-48 shrink-0 sm:border-r sm:border-slate-200 sm:pr-4">
                 <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-600">
                    {resource.name.charAt(0)}
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="text-[10px] sm:text-xs font-bold text-slate-700 truncate">{resource.name}</div>
                   <div className="text-[9px] sm:text-[10px] text-slate-400">{events.length} besök</div>
                 </div>
              </div>

              {/* Events timeline */}
              <div className="flex-1 flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`
                      flex-shrink-0 px-1.5 sm:px-2 py-1 sm:py-1.5 rounded text-[9px] sm:text-[10px] font-medium cursor-pointer
                      hover:scale-105 transition-transform active:scale-100
                      ${mode === "baseline"
                        ? "bg-slate-200 text-slate-600 border-l-2 border-slate-400"
                        : event.isAdjusted
                          ? "bg-amber-100 text-amber-700 border-l-2 border-amber-500"
                          : "bg-emerald-100 text-emerald-700 border-l-2 border-emerald-500"
                      }
                    `}
                    style={{ minWidth: "60px", maxWidth: "100px" }}
                    title={`${event.name} (${formatTime(event.startDate)} - ${formatTime(event.endDate)})`}
                  >
                    <div className="truncate">{event.name}</div>
                    <div className="text-[8px] sm:text-[9px] opacity-75">{formatTime(event.startDate)}</div>
                  </div>
                ))}
                {events.length === 0 && (
                  <div className="text-[10px] sm:text-xs text-slate-300 italic">Inga besök</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center px-4">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 border border-slate-100">
        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="font-bold text-slate-900 text-sm sm:text-base">No Schedule Data</h3>
      <p className="text-xs sm:text-sm text-slate-500 mt-1">Load a dataset to visualize.</p>
    </div>
  );
}

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return isoString;
  }
}
