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

  // Calculate date range from actual event data - timezone-safe using UTC
  const { startDate, endDate } = useMemo(() => {
    // Use fixed UTC dates as defaults
    const defaultStart = new Date(Date.UTC(2024, 0, 15, 6, 0, 0));
    const defaultEnd = new Date(Date.UTC(2024, 0, 15, 20, 0, 0));

    if (!data || data.events.length === 0) {
      return { startDate: defaultStart, endDate: defaultEnd };
    }

    const allDates = data.events.flatMap((e) => [
      new Date(e.startDate),
      new Date(e.endDate),
    ]).filter(d => !isNaN(d.getTime()));

    if (allDates.length === 0) {
      return { startDate: defaultStart, endDate: defaultEnd };
    }

    const minTime = Math.min(...allDates.map((d) => d.getTime()));
    const maxTime = Math.max(...allDates.map((d) => d.getTime()));
    
    // Add padding: 2 hours before min, 2 hours after max (using milliseconds for timezone safety)
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const ONE_WEEK = 7 * ONE_DAY;
    
    let viewStartTime = minTime;
    let viewEndTime = maxTime;

    switch (viewPreset) {
      case "dag":
        // Day view - 2 hours padding on each side
        viewStartTime = minTime - TWO_HOURS;
        viewEndTime = maxTime + TWO_HOURS;
        break;
      case "vecka":
        // Week view - round to week boundaries
        viewStartTime = minTime - ONE_DAY;
        viewEndTime = minTime + ONE_WEEK;
        break;
      case "14dagar":
        // 14 days view
        viewStartTime = minTime - ONE_DAY;
        viewEndTime = minTime + (14 * ONE_DAY);
        break;
      case "manad":
        // Month view - approximately 30 days
        viewStartTime = minTime - ONE_DAY;
        viewEndTime = minTime + (30 * ONE_DAY);
        break;
      default:
        viewStartTime = minTime - TWO_HOURS;
        viewEndTime = maxTime + TWO_HOURS;
    }

    const viewStart = new Date(viewStartTime);
    const viewEnd = new Date(viewEndTime);
    
    // Safety check: ensure end is always after start
    if (viewEnd.getTime() <= viewStart.getTime()) {
      return { startDate: defaultStart, endDate: defaultEnd };
    }

    return { startDate: viewStart, endDate: viewEnd };
  }, [data, viewPreset]);

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
    renderData.style = `background-color: ${color}; border-left: 3px solid ${color}dd;`;

    return eventRecord.name || "";
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
