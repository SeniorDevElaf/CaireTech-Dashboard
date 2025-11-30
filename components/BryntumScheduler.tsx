"use client";

import { useRef, useMemo, useCallback } from "react";
import { BryntumSchedulerPro, BryntumSchedulerProProps } from "@bryntum/schedulerpro-react";
import type { SchedulerData, SchedulerEvent, ViewMode } from "@/lib/types";
import type { SchedulerViewPreset } from "./TopBar";

interface BryntumSchedulerProps {
  data: SchedulerData | null;
  mode: ViewMode;
  onEventUpdate?: (event: SchedulerEvent) => void;
  viewPreset?: SchedulerViewPreset;
  currentDate?: Date;
  zoomLevel?: number;
}

/**
 * BryntumScheduler - A React wrapper for Bryntum SchedulerPro
 */
export function BryntumScheduler({
  data,
  mode,
  onEventUpdate,
  viewPreset = "dag",
  zoomLevel = 1,
}: BryntumSchedulerProps) {
  const schedulerRef = useRef<BryntumSchedulerPro | null>(null);

  // Transform data for Bryntum format
  const resources = useMemo(() => {
    if (!data) return [];
    return data.resources.map((r) => ({
      id: r.id,
      name: r.name,
    }));
  }, [data]);

  const events = useMemo(() => {
    if (!data) return [];
    return data.events.map((e) => ({
      id: e.id,
      resourceId: e.resourceId,
      startDate: new Date(e.startDate),
      endDate: new Date(e.endDate),
      name: e.name,
      eventType: e.eventType,
      status: e.status,
      visitId: e.visitId,
      address: e.address,
      travelTime: e.travelTime,
      isAdjusted: e.isAdjusted,
    }));
  }, [data]);

  // Calculate date range from actual event data - simple and bulletproof
  const { startDate, endDate } = useMemo(() => {
    // Fixed default: Jan 15, 2024, 6:00 AM to 8:00 PM (as ISO strings to avoid timezone issues)
    const DEFAULT_START = "2024-01-15T06:00:00.000Z";
    const DEFAULT_END = "2024-01-15T20:00:00.000Z";
    
    if (!data || !data.events || data.events.length === 0) {
      return { 
        startDate: new Date(DEFAULT_START), 
        endDate: new Date(DEFAULT_END) 
      };
    }

    // Get all valid timestamps from events
    const timestamps: number[] = [];
    for (const e of data.events) {
      const start = new Date(e.startDate).getTime();
      const end = new Date(e.endDate).getTime();
      if (!isNaN(start)) timestamps.push(start);
      if (!isNaN(end)) timestamps.push(end);
    }

    if (timestamps.length === 0) {
      return { 
        startDate: new Date(DEFAULT_START), 
        endDate: new Date(DEFAULT_END) 
      };
    }

    // Find min and max timestamps
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps);
    
    // Ensure max is after min (sanity check)
    if (maxTime <= minTime) {
      return { 
        startDate: new Date(DEFAULT_START), 
        endDate: new Date(DEFAULT_END) 
      };
    }

    // Add padding in milliseconds (2 hours = 7200000ms)
    const PADDING = 2 * 60 * 60 * 1000;
    const paddedStart = minTime - PADDING;
    const paddedEnd = maxTime + PADDING;

    return { 
      startDate: new Date(paddedStart), 
      endDate: new Date(paddedEnd) 
    };
  }, [data]);

  const extractEventFromRecord = useCallback((record: Record<string, unknown>): SchedulerEvent => {
    return {
      id: String(record.id),
      resourceId: String(record.resourceId),
      startDate: record.startDate instanceof Date 
        ? record.startDate.toISOString() 
        : String(record.startDate),
      endDate: record.endDate instanceof Date 
        ? record.endDate.toISOString() 
        : String(record.endDate),
      name: String(record.name || ""),
      eventType: (record.eventType as SchedulerEvent["eventType"]) || "visit",
      status: "optimized",
      visitId: String(record.visitId || ""),
      address: String(record.address || ""),
      isAdjusted: true,
    };
  }, []);

  const handleEventDrop = useCallback((event: { context?: { valid: boolean }; eventRecords?: Record<string, unknown>[] }) => {
    if (!event.context?.valid || !onEventUpdate) return;
    const eventRecords = event.eventRecords || [];
    eventRecords.forEach((record: Record<string, unknown>) => {
      onEventUpdate(extractEventFromRecord(record));
    });
  }, [onEventUpdate, extractEventFromRecord]);

  const handleEventResize = useCallback((event: { eventRecord?: Record<string, unknown> }) => {
    if (!onEventUpdate || !event.eventRecord) return;
    onEventUpdate(extractEventFromRecord(event.eventRecord));
  }, [onEventUpdate, extractEventFromRecord]);

  const eventRenderer = useCallback((renderEvent: { 
    eventRecord: Record<string, unknown>; 
    renderData: { wrapperCls: { add: (cls: string) => void }; style: string } 
  }) => {
    const { eventRecord, renderData } = renderEvent;
    const status = (eventRecord.status as string) || mode;
    const isAdjusted = eventRecord.isAdjusted as boolean;
    const eventType = eventRecord.eventType as string;

    renderData.wrapperCls.add(status);
    if (isAdjusted) {
      renderData.wrapperCls.add("adjusted");
    }

    const colors: Record<string, string> = {
      baseline: "#94A3B8",
      optimized: "#14B8A6",
      adjusted: "#F59E0B",
    };

    const color = isAdjusted ? colors.adjusted : colors[status] || colors.baseline;
    const darkerColor = isAdjusted ? "#D97706" : (status === "optimized" ? "#0D9488" : "#64748B");
    renderData.style = `background-color: ${color}; border-left: 3px solid ${color}dd;`;

    // Get initials from event name (first letter of first two words, or first two letters)
    const name = (eventRecord.name as string) || "";
    const words = name.split(" ");
    const initials = words.length > 1 
      ? (words[0][0] + words[1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();

    // Icon based on event type
    const getIcon = () => {
      if (eventType === "break") {
        // Coffee cup icon for breaks
        return `<svg viewBox="0 0 20 20" fill="currentColor" class="event-icon-svg">
          <path fill-rule="evenodd" d="M15 8a3 3 0 10-2.977-2.63l-4.94.494a3 3 0 00-2.93 2.631l-.443 4.022A3 3 0 006.688 16H9v1a1 1 0 001 1h0a1 1 0 001-1v-1h2.312a3 3 0 002.978-3.483l-.443-4.022z" clip-rule="evenodd"/>
        </svg>`;
      }
      if (eventType === "travel") {
        // Car icon for travel
        return `<svg viewBox="0 0 20 20" fill="currentColor" class="event-icon-svg">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
        </svg>`;
      }
      // Person icon for visits (default)
      return `<svg viewBox="0 0 20 20" fill="currentColor" class="event-icon-svg">
        <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
      </svg>`;
    };

    // Return HTML with icon badge and name
    return `
      <div class="event-content-wrapper">
        <div class="event-icon-badge" style="background-color: ${darkerColor};">
          ${getIcon()}
        </div>
        <span class="event-label">${name}</span>
        ${isAdjusted ? '<div class="event-adjusted-indicator"></div>' : ''}
      </div>
    `;
  }, [mode]);

  const tooltipTemplate = useCallback((eventData: { eventRecord: Record<string, unknown> }) => {
    const event = eventData.eventRecord;
    const statusLabel = String(event.status || mode);
    return `
      <div class="p-2">
        <div class="font-semibold mb-1">${event.name || "Event"}</div>
        <div class="text-sm text-gray-600 space-y-0.5">
          <div>📍 ${event.address || "No address"}</div>
          <div>🏷️ ${event.visitId || ""}</div>
          <div>📊 ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}</div>
          ${event.travelTime ? `<div>🚗 ${event.travelTime} min travel</div>` : ""}
        </div>
      </div>
    `;
  }, [mode]);

  const rowHeight = Math.round(60 * zoomLevel);

  // Use simple string presets that Bryntum recognizes
  const getBryntumPreset = (): string => {
    switch (viewPreset) {
      case "dag":
        return "hourAndDay";
      case "vecka":
        return "dayAndWeek"; 
      case "14dagar":
        return "weekAndDay";
      case "manad":
        return "weekAndMonth";
      default:
        return "hourAndDay";
    }
  };

  const schedulerConfig = {
    startDate,
    endDate,
    viewPreset: getBryntumPreset(),
    rowHeight,
    barMargin: 8,
    eventStyle: 'border',
    zoomOnMouseWheel: false,
    zoomOnTimeAxisDoubleClick: false,
    forceFit: false,
    tickSize: 100, // Force wider tick columns
    
    columns: [
      {
        type: "resourceInfo",
        text: "Personal",
        width: 180,
        showEventCount: false,
        showImage: false,
      },
    ],

    features: {
      eventDrag: {
        constrainDragToResource: false,
        showExactDropPosition: true,
      },
      eventResize: true,
      eventTooltip: {
        template: tooltipTemplate,
      },
      nonWorkingTime: false,
      timeRanges: false,
      dependencies: false,
    },

    eventRenderer,
  };

  const schedulerProps = {
    ...schedulerConfig,
    resources,
    events,
    onEventDrop: handleEventDrop,
    onEventResizeEnd: handleEventResize,
  } as unknown as BryntumSchedulerProProps;

  return (
    <BryntumSchedulerPro
      ref={schedulerRef}
      {...schedulerProps}
    />
  );
}

export default BryntumScheduler;
