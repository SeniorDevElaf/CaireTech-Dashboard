"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  TopBar,
  KpiPanel,
  JsonPanel,
  LoadingOverlay,
  ErrorMessage,
  SchedulerView,
  Sidebar,
} from "@/components";
import type { NavSection, NewVisitData } from "@/components/Sidebar";
import { FilterBar, EventStatusFilter, EntityFilter } from "@/components/FilterBar";
import { OptimizationSpeed, OPTIMIZATION_SPEEDS, SchedulerViewPreset } from "@/components/TopBar";
import {
  mapInputToBaselineSchedule,
  mapRoutePlanToOptimizedSchedule,
  computeKpis,
  simulateOptimizedSchedule,
  formatMinutesToDuration,
} from "@/lib/mapping";
import type {
  TimefoldDemoDataMeta,
  TimefoldModelInput,
  TimefoldRoutePlan,
  SchedulerData,
  SchedulerEvent,
  AppStatus,
  ViewMode,
  KpiSummary,
} from "@/lib/types";

// Polling configuration
const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 300000;

export default function HomePage() {
  // Dataset state
  const [datasets, setDatasets] = useState<TimefoldDemoDataMeta[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  
  // Model and schedule state
  const [inputModel, setInputModel] = useState<TimefoldModelInput | null>(null);
  const [baselineSchedule, setBaselineSchedule] = useState<SchedulerData | null>(null);
  const [optimizedSchedule, setOptimizedSchedule] = useState<SchedulerData | null>(null);
  const [routePlan, setRoutePlan] = useState<TimefoldRoutePlan | null>(null);
  
  // UI state
  const [currentView, setCurrentView] = useState<ViewMode>("baseline");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KpiSummary | null>(null);
  const [optimizationSpeed, setOptimizationSpeed] = useState<OptimizationSpeed>("standard");
  
  // Polling state
  const [routePlanId, setRoutePlanId] = useState<string | null>(null);

  // Date navigation state
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    return new Date("2024-01-15T00:00:00Z");
  });
  
  // View preset state for scheduler zoom
  const [viewPreset, setViewPreset] = useState<SchedulerViewPreset>("dag");
  
  // Filter states
  const [activeStatusFilters, setActiveStatusFilters] = useState<Set<EventStatusFilter>>(
    new Set<EventStatusFilter>(["oplanerad", "planerad"])
  );
  const [activeEntityFilter, setActiveEntityFilter] = useState<EntityFilter>("personal");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Mobile KPI panel state
  const [showMobileKpi, setShowMobileKpi] = useState(false);
  
  // Sidebar navigation state
  const [activeSection, setActiveSection] = useState<NavSection>("schedule");
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Ref to track initial load
  const initialLoadRef = useRef(false);

  const updateDateFromSchedule = useCallback((schedule: SchedulerData) => {
    if (schedule.events.length > 0) {
      const firstEvent = schedule.events.find(e => e.eventType === "visit");
      if (firstEvent) {
        const eventDate = new Date(firstEvent.startDate);
        if (!isNaN(eventDate.getTime())) {
          setCurrentDate(eventDate);
        }
      }
    }
  }, []);

  const loadDataset = useCallback(async (id: string) => {
    if (!id) return;
    
    setStatus("loading-demo");
    setErrorMessage(null);
    
    try {
      const response = await fetch(`/api/timefold/demo-data/${id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to load dataset");
      }
      
      const model = data.modelInput as TimefoldModelInput;
      setInputModel(model);
      
      const baseline = mapInputToBaselineSchedule(model);
      setBaselineSchedule(baseline);
      updateDateFromSchedule(baseline);
      
      setOptimizedSchedule(null);
      setRoutePlan(null);
      setCurrentView("baseline");
      
      const initialKpis = computeKpis(model, null, baseline, null);
      setKpis(initialKpis);
      
      setStatus("idle");
    } catch (error) {
      console.error("Error loading dataset:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load dataset"
      );
      setStatus("error");
    }
  }, [updateDateFromSchedule]);

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    async function fetchDatasets() {
      try {
        const response = await fetch("/api/timefold/demo-data");
        const data = await response.json();
        
        if (data.success && data.datasets && data.datasets.length > 0) {
          setDatasets(data.datasets);
          const firstId = data.datasets[0].id;
          setSelectedDatasetId(firstId);
          loadDataset(firstId);
        } else {
           setDatasets([{ id: "local-demo", name: "Local Demo" }]);
           setSelectedDatasetId("local-demo");
           loadDataset("local-demo");
        }
      } catch (error) {
        console.error("Failed to fetch datasets:", error);
        setDatasets([{ id: "local-demo", name: "Local Demo (Stockholm Home Care)" }]);
        setSelectedDatasetId("local-demo");
        loadDataset("local-demo");
      }
    }
    
    fetchDatasets();
  }, [loadDataset]);

  const startOptimization = useCallback(async () => {
    if (!inputModel) {
      setErrorMessage("No dataset loaded. Please load a dataset first.");
      return;
    }

    if (selectedDatasetId === "local-demo") {
      setErrorMessage("Local demo data cannot be optimized. Please select a Timefold demo dataset.");
      return;
    }
    
    setStatus("optimizing");
    setErrorMessage(null);
    
    try {
      const terminationLimit = OPTIMIZATION_SPEEDS[optimizationSpeed].limit;
      
      const response = await fetch("/api/timefold/route-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          modelInput: inputModel, 
          datasetId: selectedDatasetId,
          terminationLimit,
        }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || "Failed to start optimization");
      }
      
      setRoutePlanId(data.id);
      setStatus("polling");
    } catch (error) {
      console.error("Error starting optimization:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to start optimization"
      );
      setStatus("error");
    }
  }, [inputModel, selectedDatasetId, optimizationSpeed]);

  const simulateLocally = useCallback(() => {
    if (!inputModel || !baselineSchedule) {
      setErrorMessage("No dataset loaded. Please load a dataset first.");
      return;
    }
    
    setStatus("optimizing");
    setErrorMessage(null);
    
    setTimeout(() => {
      try {
        const optimized = simulateOptimizedSchedule(inputModel, baselineSchedule);
        setOptimizedSchedule(optimized);
        
        const simulatedKpis: KpiSummary = {
          totalVisitsBaseline: baselineSchedule.events.filter(e => e.eventType === "visit").length,
          totalVisitsOptimized: optimized.events.filter(e => e.eventType === "visit").length,
          assignedVisitsBaseline: baselineSchedule.events.filter(e => e.eventType === "visit").length,
          assignedVisitsOptimized: optimized.events.filter(e => e.eventType === "visit").length,
          unassignedVisitsBaseline: 0,
          unassignedVisitsOptimized: 0,
          totalTravelTimeBaseline: 180,
          totalTravelTimeOptimized: 108,
          totalServiceTimeBaseline: 480,
          totalServiceTimeOptimized: 480,
          totalWaitTimeBaseline: 60,
          totalWaitTimeOptimized: 30,
          totalWorkTimeBaseline: 720,
          totalWorkTimeOptimized: 618,
          totalCostBaseline: 5400,
          totalCostOptimized: 4635,
          utilizationByResourceBaseline: new Map(),
          utilizationByResourceOptimized: new Map(),
          avgUtilizationBaseline: 65,
          avgUtilizationOptimized: 82,
        };
        setKpis(simulatedKpis);
        
        setCurrentView("optimized");
        setStatus("complete");
      } catch (error) {
        console.error("Error simulating optimization:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to simulate optimization"
        );
        setStatus("error");
      }
    }, 1500);
  }, [inputModel, baselineSchedule]);

  useEffect(() => {
    if (status !== "polling" || !routePlanId) return;
    
    let timeoutId: NodeJS.Timeout;
    let pollCount = 0;
    const maxPolls = Math.ceil(POLL_TIMEOUT_MS / POLL_INTERVAL_MS);
    
    async function pollForResults() {
      try {
        const response = await fetch(`/api/timefold/route-plans/${routePlanId}?_t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        });
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || "Failed to fetch route plan");
        }
        
        const plan = data.routePlan as TimefoldRoutePlan;
        
        if (plan.solverStatus === "DATASET_INVALID") {
          throw new Error("DATASET_INVALID: Map coverage issue. Use 'Simulate Locally'.");
        }
        
        if (data.isComplete) {
          setRoutePlan(plan);
          
          if (inputModel) {
            console.log(`[Optimization Complete] Routes: ${plan.routes?.length ?? 0}`);
            const optimized = mapRoutePlanToOptimizedSchedule(plan, inputModel);
            console.log(`[Optimization Complete] Optimized events: ${optimized.events.length}, resources: ${optimized.resources.length}`);
            
            if (optimized.events.length > 0) {
              console.log(`[Optimization Complete] First event:`, optimized.events[0]);
            } else {
              console.warn(`[Optimization Complete] WARNING: No events in optimized schedule!`);
            }
            
            setOptimizedSchedule(optimized);
            
            if (baselineSchedule) {
              const finalKpis = computeKpis(inputModel, plan, baselineSchedule, optimized);
              setKpis(finalKpis);
            }
          }
          
          // Enable the "optimerad" filter so optimized events are visible
          setActiveStatusFilters(new Set<EventStatusFilter>(["optimerad"]));
          
          setCurrentView("optimized");
          setStatus("complete");
          return;
        }
        
        if (plan.solverStatus === "EXCEPTION") {
          throw new Error("Solver encountered an error during optimization");
        }
        
        pollCount++;
        if (pollCount >= maxPolls) {
          throw new Error("Optimization timed out. Please try again.");
        }
        
        timeoutId = setTimeout(pollForResults, POLL_INTERVAL_MS);
      } catch (error) {
        console.error("Error polling for results:", error);
        setErrorMessage(
          error instanceof Error ? error.message : "Error during optimization"
        );
        setStatus("error");
      }
    }
    
    pollForResults();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [status, routePlanId, inputModel, baselineSchedule]);

  const handleEventUpdate = useCallback((updatedEvent: SchedulerEvent) => {
    if (!optimizedSchedule) return;
    
    setOptimizedSchedule((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        events: prev.events.map((e) =>
          e.id === updatedEvent.id ? { ...e, ...updatedEvent, isAdjusted: true } : e
        ),
      };
    });
    
    if (inputModel && baselineSchedule) {
      const newKpis = computeKpis(inputModel, routePlan, baselineSchedule, optimizedSchedule);
      setKpis(newKpis);
    }
  }, [optimizedSchedule, inputModel, routePlan, baselineSchedule]);

  const dismissError = useCallback(() => {
    setErrorMessage(null);
    if (status === "error") setStatus("idle");
  }, [status]);

  const toggleStatusFilter = useCallback((filter: EventStatusFilter) => {
    setActiveStatusFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filter)) {
        newSet.delete(filter);
      } else {
        newSet.add(filter);
      }
      return newSet;
    });
  }, []);

  const filteredSchedule = useMemo(() => {
    const sourceSchedule = currentView === "baseline" ? baselineSchedule : optimizedSchedule;
    if (!sourceSchedule) return null;
    
    // If all filters are off, show nothing. If all are on, show everything.
    // Filter events based on activeStatusFilters
    const filteredEvents = sourceSchedule.events.filter(event => {
      // Always show travel and break events if their parent visit is shown
      if (event.eventType === "travel" || event.eventType === "break") {
        return true;
      }
      
      // For visit events, check status filters
      const isBaseline = event.status === "baseline";
      const isOptimized = event.status === "optimized";
      const isAdjusted = event.isAdjusted === true;
      
      // Map filter types to event conditions:
      // - oplanerad: baseline events (unplanned/not yet optimized)
      // - planerad: scheduled events (baseline view shows scheduled visits)
      // - optimerad: optimized events
      // - utford: manually adjusted events (drag-dropped)
      
      if (isAdjusted && activeStatusFilters.has("utford")) {
        return true;
      }
      if (isOptimized && activeStatusFilters.has("optimerad")) {
        return true;
      }
      if (isBaseline && activeStatusFilters.has("planerad")) {
        return true;
      }
      if (isBaseline && !isOptimized && activeStatusFilters.has("oplanerad")) {
        return true;
      }
      
      // If no status filter matches and we have at least one filter active, hide the event
      if (activeStatusFilters.size > 0) {
        return false;
      }
      
      // If no filters are active, show all
      return true;
    });
    
    // Filter resources based on entity filter
    let filteredResources = sourceSchedule.resources;
    if (activeEntityFilter === "personal") {
      // Show all staff/resources (default view)
      filteredResources = sourceSchedule.resources;
    } else if (activeEntityFilter === "kunder") {
      // For customer view, only show resources that have events
      const resourcesWithEvents = new Set(filteredEvents.map(e => e.resourceId));
      filteredResources = sourceSchedule.resources.filter(r => resourcesWithEvents.has(r.id));
    }
    
    return {
      ...sourceSchedule,
      events: filteredEvents,
      resources: filteredResources,
    };
  }, [baselineSchedule, optimizedSchedule, currentView, activeStatusFilters, activeEntityFilter]);

  const displayedSchedule = filteredSchedule;

  const loadingMessage = status === "polling" 
    ? "Running Timefold Optimization" 
    : "Processing...";
  
  const loadingSubMessage = status === "polling"
    ? optimizationSpeed === "full"
      ? "Finding best possible solution..."
      : `Optimizing (${OPTIMIZATION_SPEEDS[optimizationSpeed].label})...`
    : undefined;

  // Sidebar navigation handler
  const handleSidebarNavigate = (section: NavSection) => {
    setActiveSection(section);
    
    // Close other panels when switching
    if (section !== "team") setShowTeamPanel(false);
    if (section !== "settings") setShowSettingsPanel(false);
    
    // Handle specific section actions
    if (section === "schedule") {
      // Focus on main schedule view
      setShowTeamPanel(false);
      setShowSettingsPanel(false);
    }
  };

  // Handle creating a new visit
  const handleNewVisit = useCallback((visitData: NewVisitData) => {
    if (!baselineSchedule) {
      setToast({ message: "Ladda ett dataset först", type: "error" });
      return;
    }

    // Create a unique ID for the new visit
    const newVisitId = `visit-${Date.now()}`;
    
    // Parse date and time to create start/end dates
    const startDateTime = new Date(`${visitData.date}T${visitData.startTime}:00`);
    const endDateTime = new Date(startDateTime.getTime() + visitData.duration * 60 * 1000);

    // Find resource name for the toast
    const resourceName = baselineSchedule.resources.find(r => r.id === visitData.resourceId)?.name || "personal";

    // Create the new event
    const newEvent: SchedulerEvent = {
      id: newVisitId,
      resourceId: visitData.resourceId,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      name: visitData.name,
      eventType: "visit",
      status: currentView === "optimized" ? "optimized" : "baseline",
      visitId: newVisitId,
      address: visitData.address,
      isAdjusted: true,
    };

    // Add to the appropriate schedule
    if (currentView === "optimized" && optimizedSchedule) {
      setOptimizedSchedule(prev => prev ? {
        ...prev,
        events: [...prev.events, newEvent],
      } : prev);
    } else {
      setBaselineSchedule(prev => prev ? {
        ...prev,
        events: [...prev.events, newEvent],
      } : prev);
    }

    // Update the current date to show the new visit
    setCurrentDate(startDateTime);

    // Show success toast
    setToast({ 
      message: `Besök "${visitData.name}" skapat och tilldelat ${resourceName}`, 
      type: "success" 
    });
  }, [baselineSchedule, optimizedSchedule, currentView]);

  return (
    <>
      {/* Mobile Header */}
      <MobileHeader onMenuClick={() => setShowSettingsPanel(true)} />
      
      {/* Desktop Sidebar */}
      <Sidebar 
        activeSection={activeSection}
        onNavigate={handleSidebarNavigate}
        onOpenTeam={() => setShowTeamPanel(true)}
        onOpenSettings={() => setShowSettingsPanel(true)}
        onNewVisit={handleNewVisit}
        availableResources={baselineSchedule?.resources || []}
      />

      {/* Main Flex Container */}
      <div className="flex flex-1 h-screen overflow-hidden bg-background pt-14 md:pt-0">
        
        {/* Center Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">
          {/* Header Area */}
          <TopBar
            datasets={datasets}
            selectedDatasetId={selectedDatasetId}
            onDatasetChange={(id) => {
              setSelectedDatasetId(id);
              loadDataset(id);
            }}
            onLoadDataset={() => loadDataset(selectedDatasetId)}
            onOptimize={startOptimization}
            onSimulate={simulateLocally}
            status={status}
            canOptimize={!!inputModel}
            optimizationSpeed={optimizationSpeed}
            onSpeedChange={setOptimizationSpeed}
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            viewPreset={viewPreset}
            onViewPresetChange={setViewPreset}
            inputModel={inputModel}
            routePlan={routePlan}
          />
          
          {/* Filters - scrollable on mobile */}
          <div className="px-3 sm:px-6 pb-2 overflow-x-auto">
            <FilterBar
              scheduleData={displayedSchedule}
              kpis={kpis}
              currentView={currentView}
              activeStatusFilters={activeStatusFilters}
              onToggleStatusFilter={toggleStatusFilter}
              activeEntityFilter={activeEntityFilter}
              onEntityFilterChange={setActiveEntityFilter}
              onAdvancedClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              showAdvanced={showAdvancedFilters}
            />
          </div>

          {/* Advanced Filters Panel (collapsible) */}
          {showAdvancedFilters && (
            <div className="px-3 sm:px-6 pb-4 animate-fade-in">
              <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-slate-900 text-sm sm:text-base">Avancerade Filter</h3>
                  <button 
                    onClick={() => setShowAdvancedFilters(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Visa</label>
                    <select 
                      value={currentView}
                      onChange={(e) => setCurrentView(e.target.value as ViewMode)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    >
                      <option value="baseline">Baseline</option>
                      <option value="optimized" disabled={!optimizedSchedule}>Optimerad</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Resurs</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="all">Alla</option>
                      {baselineSchedule?.resources.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Kompetens</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="all">Alla</option>
                      <option value="medication">Medication</option>
                      <option value="wound-care">Wound Care</option>
                      <option value="mobility-support">Mobility Support</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Prioritet</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                      <option value="all">Alla</option>
                      <option value="high">Hög</option>
                      <option value="medium">Medium</option>
                      <option value="low">Låg</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Workspace (Scheduler) */}
          <main className="flex-1 p-3 sm:p-6 pt-2 overflow-hidden flex flex-col gap-3 sm:gap-4">
            {errorMessage && (
              <ErrorMessage message={errorMessage} onDismiss={dismissError} />
            )}

            <div className="flex-1 min-h-0 relative animate-fade-in">
              <SchedulerView
                data={displayedSchedule}
                mode={currentView}
                onEventUpdate={handleEventUpdate}
                isLoading={status === "loading-demo"}
                viewPreset={viewPreset}
              />
            </div>

            {/* Collapsible JSON Panel - hidden on mobile by default */}
            <div className="shrink-0 hidden sm:block">
               <JsonPanel inputModel={inputModel} routePlan={routePlan} />
            </div>
          </main>
        </div>

        {/* Right Sidebar (Insights) - Desktop only */}
        <div className="hidden xl:block">
          <KpiPanel
            kpis={kpis}
            currentView={currentView}
            onViewChange={setCurrentView}
            hasOptimizedData={!!optimizedSchedule}
          />
        </div>
      </div>

      {/* Mobile KPI FAB Button */}
      <button
        onClick={() => setShowMobileKpi(true)}
        className="xl:hidden fixed bottom-4 right-4 z-40 w-14 h-14 bg-brand-500 text-white rounded-full shadow-lg shadow-brand-500/30 flex items-center justify-center hover:bg-brand-600 active:scale-95 transition-all"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        {kpis && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {kpis.avgUtilizationOptimized || kpis.avgUtilizationBaseline || 0}%
          </span>
        )}
      </button>

      {/* Mobile KPI Bottom Sheet */}
      {showMobileKpi && (
        <div className="xl:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowMobileKpi(false)}
          />
          
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-hidden flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-slate-300 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h2 className="font-display font-bold text-slate-900">Insikter</h2>
              </div>
              <button 
                onClick={() => setShowMobileKpi(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <MobileKpiContent kpis={kpis} currentView={currentView} />
            </div>
          </div>
        </div>
      )}

      {/* Team Panel (Slide-over) */}
      {showTeamPanel && (
        <SlideOverPanel 
          title="Personal" 
          onClose={() => setShowTeamPanel(false)}
        >
          <TeamPanelContent resources={baselineSchedule?.resources || []} />
        </SlideOverPanel>
      )}

      {/* Settings Panel (Slide-over) */}
      {showSettingsPanel && (
        <SlideOverPanel 
          title="Inställningar" 
          onClose={() => setShowSettingsPanel(false)}
        >
          <SettingsPanelContent />
        </SlideOverPanel>
      )}

      {/* Global Loading Overlay */}
      <LoadingOverlay
        isVisible={status === "optimizing" || status === "polling"}
        message={loadingMessage}
        subMessage={loadingSubMessage}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </>
  );
}

// Mobile Header Component
function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-50 safe-area-inset-top">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg flex items-center justify-center shadow-lg shadow-brand-500/20">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="font-display font-bold text-slate-900">Caire</span>
      </div>
      
      <button 
        onClick={onMenuClick}
        className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>
  );
}

// Mobile KPI Content Component
function MobileKpiContent({ kpis, currentView }: { kpis: KpiSummary | null; currentView: ViewMode }) {
  const utilization = currentView === "optimized" ? kpis?.avgUtilizationOptimized : kpis?.avgUtilizationBaseline;
  const visits = currentView === "optimized" ? kpis?.assignedVisitsOptimized : kpis?.assignedVisitsBaseline;
  const unassigned = currentView === "optimized" ? kpis?.unassignedVisitsOptimized : kpis?.unassignedVisitsBaseline;
  const travelTime = currentView === "optimized" ? kpis?.totalTravelTimeOptimized : kpis?.totalTravelTimeBaseline;
  
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-brand-50 rounded-2xl p-4 border border-brand-100">
        <div className="text-xs text-brand-600 font-medium mb-1">Utnyttjande</div>
        <div className="text-2xl font-bold text-brand-800">{utilization || 0}%</div>
      </div>
      <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
        <div className="text-xs text-blue-600 font-medium mb-1">Tilldelade</div>
        <div className="text-2xl font-bold text-blue-800">{visits || 0}</div>
      </div>
      <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
        <div className="text-xs text-emerald-600 font-medium mb-1">Restid</div>
        <div className="text-2xl font-bold text-emerald-800">{formatTime(travelTime || 0)}</div>
      </div>
      <div className={`rounded-2xl p-4 border ${(unassigned || 0) > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
        <div className={`text-xs font-medium mb-1 ${(unassigned || 0) > 0 ? 'text-red-600' : 'text-slate-600'}`}>Ej tilldelade</div>
        <div className={`text-2xl font-bold ${(unassigned || 0) > 0 ? 'text-red-800' : 'text-slate-800'}`}>{unassigned || 0}</div>
      </div>
    </div>
  );
}

// Slide Over Panel Component
function SlideOverPanel({ 
  title, 
  onClose, 
  children 
}: { 
  title: string; 
  onClose: () => void; 
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl animate-slide-in-left flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-bold text-slate-900 text-lg">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  );
}

// Team Panel Content
function TeamPanelContent({ resources }: { resources: { id: string; name: string; skills?: string[] }[] }) {
  return (
    <div className="space-y-3">
      <div className="text-sm text-slate-500 mb-4">
        {resources.length} personal tillgänglig
      </div>
      
      {resources.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p>Ladda ett dataset för att se personal</p>
        </div>
      ) : (
        resources.map((resource) => (
          <div 
            key={resource.id}
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
              {resource.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-900">{resource.name}</div>
              <div className="text-xs text-slate-500">
                {resource.skills?.join(", ") || "Allmän kompetens"}
              </div>
            </div>
            <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))
      )}
    </div>
  );
}

// Settings Panel Content
function SettingsPanelContent() {
  // Settings state with persistence
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("sv");
  const [notifications, setNotifications] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Load settings on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("caire-theme") || "light";
    const savedLang = localStorage.getItem("caire-language") || "sv";
    const savedNotif = localStorage.getItem("caire-notifications");
    
    setTheme(savedTheme);
    setLanguage(savedLang);
    setNotifications(savedNotif !== null ? savedNotif === "true" : true);

    // Apply theme - remove all theme classes first
    document.documentElement.classList.remove('dark', 'ocean');
    
    if (savedTheme === "dark") {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === "ocean") {
      document.documentElement.classList.add('ocean');
    }
    // 'light' has no class - it uses the default :root styles
  }, []);

  // Handle setting changes
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem("caire-theme", newTheme);
    
    // Remove all theme classes first
    document.documentElement.classList.remove('dark', 'ocean');
    
    if (newTheme === "dark") {
      document.documentElement.classList.add('dark');
    } else if (newTheme === "ocean") {
      document.documentElement.classList.add('ocean');
    }
    // 'light' has no class - it uses the default :root styles
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    localStorage.setItem("caire-language", newLang);
    // In a real app, this would trigger a context update or reload
    if (newLang !== "sv") {
      alert("Language change saved. (Translation support coming soon)");
    }
  };

  const handleNotificationChange = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem("caire-notifications", String(enabled));
    // In a real app, this would request permissions
    if (enabled && "Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  };

  const handleLogout = () => {
    if (confirm("Vill du logga ut?")) {
      // Clear session (simulated)
      localStorage.removeItem("caire-theme");
      localStorage.removeItem("caire-language");
      localStorage.removeItem("caire-notifications");
      window.location.reload();
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Profil</h3>
        <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-slate-200 overflow-hidden">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full" />
          </div>
          <div>
            <div className="font-medium text-slate-900">Anna Lindberg</div>
            <div className="text-sm text-slate-500">anna.lindberg@caire.se</div>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Utseende</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm text-slate-700">Tema</span>
            <select 
              value={theme} 
              onChange={(e) => handleThemeChange(e.target.value)}
              className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="light">Ljust</option>
              <option value="dark">Mörkt</option>
              <option value="ocean">Hav</option>
            </select>
          </label>
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
            <span className="text-sm text-slate-700">Språk</span>
            <select 
              value={language} 
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="sv">Svenska</option>
              <option value="en">English</option>
            </select>
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Notiser</h3>
        <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
          <div>
            <span className="text-sm text-slate-700 block">Push-notiser</span>
            <span className="text-xs text-slate-500">Få påminnelser om schemaändringar</span>
          </div>
          <button 
            onClick={() => handleNotificationChange(!notifications)}
            className={`w-11 h-6 rounded-full transition-colors relative ${notifications ? 'bg-brand-500' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifications ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'}`} />
          </button>
        </label>
      </div>

      {/* About */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Om</h3>
        <div className="p-4 bg-slate-50 rounded-xl space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Version</span>
            <span className="text-slate-900 font-medium">1.0.0 beta</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Byggd med</span>
            <span className="text-slate-900 font-medium">Next.js + Timefold</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button 
        onClick={handleLogout}
        className="w-full p-3 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        Logga ut
      </button>
    </div>
  );
}

// Toast Notification Component
function Toast({ 
  message, 
  type, 
  onClose 
}: { 
  message: string; 
  type: "success" | "error" | "info"; 
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-emerald-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-brand-500 text-white",
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl ${styles[type]}`}>
        <div className="shrink-0">
          {icons[type]}
        </div>
        <span className="font-medium text-sm">{message}</span>
        <button 
          onClick={onClose}
          className="shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors ml-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
