/**
 * TypeScript interfaces for Timefold Field Service Routing API
 * and internal UI state management.
 * 
 * ASSUMPTIONS:
 * - Timefold FSR API returns vehicles/technicians with shifts
 * - Visits have time windows and service durations
 * - Route plans contain assignments of visits to vehicles with timing
 * 
 * These types are based on typical FSR API patterns and may need
 * adjustment based on actual Timefold response structure.
 */

// ============================================================
// TIMEFOLD API TYPES
// ============================================================

/**
 * Metadata for a demo dataset available from Timefold
 */
export interface TimefoldDemoDataMeta {
  id: string;
  name?: string;
  description?: string;
}

/**
 * Geographic location with coordinates
 */
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * A shift defines when a vehicle/technician is available to work
 * Supports both local format (startTime/endTime) and Timefold format (minStartTime/maxEndTime)
 */
export interface Shift {
  id: string;
  // Local format
  startTime?: string;  // ISO datetime
  endTime?: string;    // ISO datetime
  // Timefold format
  minStartTime?: string;  // ISO datetime
  maxEndTime?: string;    // ISO datetime
  startLocation?: Location | number[];  // Object or [lat, lon] array
  endLocation?: Location | number[];
  // Timefold additional fields
  skills?: Array<{ name: string; level?: number }>;
  tags?: Array<{ name: string }>;
  requiredBreaks?: unknown[];
}

/**
 * A vehicle or technician that can be assigned visits
 */
export interface Vehicle {
  id: string;
  name?: string;  // Optional in Timefold format (uses id as name)
  shifts: Shift[];
  skills?: string[];
  capacity?: number;
  vehicleType?: string;  // Timefold format
}

/**
 * Time window constraint for a visit
 * Supports both local format and Timefold format
 */
export interface TimeWindow {
  // Local format
  startTime?: string;  // ISO datetime
  endTime?: string;    // ISO datetime
  // Timefold format  
  minStartTime?: string;
  maxEndTime?: string;
}

/**
 * A visit/job that needs to be scheduled and assigned to a vehicle
 */
export interface Visit {
  id: string;
  name: string;
  location: Location | number[];  // Object or [lat, lon] array
  serviceDuration: string;  // ISO duration (e.g., "PT30M" for 30 minutes)
  timeWindows?: TimeWindow[];
  requiredSkills?: string[] | Array<{ name: string; minLevel?: number }>;
  priority?: string | number;
  pinningRequested?: boolean;
  requiredTags?: string[];
}

/**
 * The complete model input sent to Timefold for optimization
 */
export interface TimefoldModelInput {
  vehicles: Vehicle[];
  visits: Visit[];
  // Additional configuration options
  options?: {
    maxDrivingTimePerShift?: string;
    balanceWorkload?: boolean;
  };
}

/**
 * Solver status returned by Timefold
 */
export type SolverStatus = 
  | "NOT_STARTED"
  | "DATASET_CREATED"
  | "DATASET_VALIDATED"
  | "DATASET_COMPUTED"
  | "SOLVING_SCHEDULED"
  | "SOLVING_STARTED"
  | "SOLVING_ACTIVE"
  | "SOLVING_COMPLETED"
  | "SOLVING_INCOMPLETE"
  | "SOLVING_FAILED"
  | "DATASET_INVALID"
  | "EXCEPTION"
  | "UNKNOWN";

/**
 * A visit with its assigned timing in the solution
 */
export interface PlannedVisit {
  id: string;
  visitId?: string;
  vehicleId?: string;
  arrivalTime?: string;      // ISO datetime
  departureTime?: string;    // ISO datetime
  startServiceTime?: string; // ISO datetime
  travelTimeFromPrevious?: string;  // ISO duration
  travelDistanceFromPrevious?: number;  // meters
}

/**
 * The route assigned to a single vehicle
 */
export interface VehicleRoute {
  vehicleId: string;
  shiftId?: string;
  visits: PlannedVisit[];
  totalTravelTime?: string;    // ISO duration
  totalTravelDistance?: number; // meters
  totalServiceTime?: string;   // ISO duration
}

/**
 * KPIs/metrics included in the route plan response
 */
export interface RoutePlanMetrics {
  totalTravelTime?: string;
  totalTravelDistance?: number;
  totalServiceTime?: string;
  unassignedVisits?: number;
  assignedVisits?: number;
  utilizationPercentage?: number;
}

/**
 * Complete route plan response from Timefold
 */
export interface TimefoldRoutePlan {
  id: string;
  solverStatus: SolverStatus;
  score?: string;  // Timefold score format
  routes?: VehicleRoute[];
  unassignedVisits?: Array<{ id: string; name?: string }> | Visit[];
  metrics?: RoutePlanMetrics;
  // Original input for reference
  modelInput?: TimefoldModelInput;
  // Validation errors (e.g., locations out of map coverage)
  validationErrors?: string[];
  // KPIs from Timefold response
  kpis?: {
    totalTravelTime?: string;
    totalAssignedVisits?: number;
    totalUnassignedVisits?: number;
    totalTravelDistanceMeters?: number;
    workingTimeFairnessPercentage?: number;
  };
}

// ============================================================
// BRYNTUM SCHEDULER TYPES
// ============================================================

/**
 * A resource in Bryntum SchedulerPro (represents a vehicle/technician)
 */
export interface SchedulerResource {
  id: string;
  name: string;
  // Additional metadata for display
  skills?: string[];
  shiftStart?: string;
  shiftEnd?: string;
}

/**
 * An event in Bryntum SchedulerPro (represents a visit/job)
 */
export interface SchedulerEvent {
  id: string;
  resourceId: string;
  startDate: string;
  endDate: string;
  name: string;
  // Custom fields for styling and interaction
  eventType: "visit" | "travel" | "break";
  status: "baseline" | "optimized" | "adjusted";
  visitId?: string;
  address?: string;
  travelTime?: number;  // minutes
  isAdjusted?: boolean; // Flag for drag-drop modifications
}

/**
 * Complete scheduler data structure
 */
export interface SchedulerData {
  resources: SchedulerResource[];
  events: SchedulerEvent[];
}

// ============================================================
// UI STATE TYPES
// ============================================================

/**
 * Application status for loading states
 */
export type AppStatus = 
  | "idle"
  | "loading-demo"
  | "optimizing"
  | "polling"
  | "error"
  | "complete";

/**
 * View mode toggle
 */
export type ViewMode = "baseline" | "optimized";

/**
 * KPI summary for before/after comparison
 */
export interface KpiSummary {
  // Visit counts
  totalVisitsBaseline: number;
  totalVisitsOptimized: number;
  assignedVisitsBaseline: number;
  assignedVisitsOptimized: number;
  unassignedVisitsBaseline: number;
  unassignedVisitsOptimized: number;
  
  // Time metrics (in minutes)
  totalTravelTimeBaseline: number;
  totalTravelTimeOptimized: number;
  totalServiceTimeBaseline: number;
  totalServiceTimeOptimized: number;
  totalWaitTimeBaseline: number;
  totalWaitTimeOptimized: number;
  
  // Calculated Work metrics (minutes)
  totalWorkTimeBaseline: number;
  totalWorkTimeOptimized: number;
  
  // Financials (SEK)
  totalCostBaseline: number;
  totalCostOptimized: number;
  
  // Utilization per resource (percentage 0-100)
  utilizationByResourceBaseline: Map<string, number>;
  utilizationByResourceOptimized: Map<string, number>;
  
  // Average utilization
  avgUtilizationBaseline: number;
  avgUtilizationOptimized: number;
}

/**
 * Single KPI card data
 */
export interface KpiCardData {
  title: string;
  baselineValue: number | string;
  optimizedValue: number | string;
  unit?: string;
  improvementDirection: "up" | "down" | "neutral";  // Which direction is "better"
}
