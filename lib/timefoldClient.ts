/**
 * Timefold API Client
 * 
 * Low-level HTTP client for interacting with the Timefold Field Service Routing API.
 * This module runs ONLY on the server side - never import in client components.
 * 
 * All API keys and sensitive data are handled here and never exposed to the browser.
 */

import type {
  TimefoldDemoDataMeta,
  TimefoldModelInput,
  TimefoldRoutePlan,
} from "./types";

/**
 * Configuration object for Timefold API
 */
interface TimefoldConfig {
  apiKey: string;
  baseUrl: string;
  configId: string;
}

/**
 * Gets configuration from environment variables.
 * Returns null if API key is not set (instead of throwing).
 */
function getConfig(): TimefoldConfig | null {
  const apiKey = process.env.TIMEFOLD_API_KEY;
  const baseUrl = process.env.TIMEFOLD_BASE_URL || "https://app.timefold.ai/models/field-service-routing/v1";
  const configId = process.env.TIMEFOLD_CONFIG_ID || "6ba51ef5-6642-44d5-8cef-9be1caa05389";

  if (!apiKey) {
    return null;
  }

  return { apiKey, baseUrl, configId };
}

/**
 * Gets configuration or throws a descriptive error
 */
function requireConfig(): TimefoldConfig {
  const config = getConfig();
  if (!config) {
    throw new Error(
      "TIMEFOLD_API_KEY is not configured. Please add it to your .env.local file."
    );
  }
  return config;
}

/**
 * Checks if Timefold API is configured
 */
export function isTimefoldConfigured(): boolean {
  return getConfig() !== null;
}

/**
 * Makes an authenticated request to the Timefold API
 */
async function timefoldFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = requireConfig();
  
  const url = `${config.baseUrl}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    cache: 'no-store', // Prevent caching for real-time status updates
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": config.apiKey,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      ...options.headers,
    },
  });

  // Get the response text first
  const responseText = await response.text();

  // Check if it looks like JSON (starts with { or [)
  const trimmedResponse = responseText.trim();
  const isJson = trimmedResponse.startsWith("{") || trimmedResponse.startsWith("[");

  if (!response.ok) {
    // If it's HTML (error page), provide a cleaner error message
    if (!isJson || trimmedResponse.includes("<!DOCTYPE")) {
      throw new Error(
        `Timefold API error (${response.status}): Server returned HTML instead of JSON. ` +
        `This usually means authentication failed or the endpoint doesn't exist.`
      );
    }
    throw new Error(
      `Timefold API error (${response.status}): ${responseText}`
    );
  }

  // Try to parse as JSON
  if (!isJson) {
    throw new Error(
      `Timefold API returned unexpected response format. Expected JSON but got: ${trimmedResponse.substring(0, 100)}...`
    );
  }

  try {
    return JSON.parse(responseText) as T;
  } catch {
    throw new Error(
      `Failed to parse Timefold API response as JSON: ${trimmedResponse.substring(0, 100)}...`
    );
  }
}

/**
 * Fetches the list of available demo datasets from Timefold
 */
export async function fetchDemoDataList(): Promise<TimefoldDemoDataMeta[]> {
  // The Timefold demo-data endpoint returns an array of dataset identifiers
  const data = await timefoldFetch<TimefoldDemoDataMeta[] | { datasets: TimefoldDemoDataMeta[] }>("/demo-data");
  
  // Handle both array response and wrapped response
  if (Array.isArray(data)) {
    return data;
  }
  
  if (data && "datasets" in data) {
    return data.datasets;
  }
  
  // Fallback: return as single-item array if it's an object with id
  if (data && typeof data === "object" && "id" in data) {
    return [data as unknown as TimefoldDemoDataMeta];
  }
  
  return [];
}

/**
 * Fetches a specific demo dataset's model input
 */
export async function fetchDemoDataInput(datasetId: string): Promise<TimefoldModelInput> {
  try {
    // Try the /demo-data/{id}/input endpoint first (standard pattern)
    const data = await timefoldFetch<TimefoldModelInput | { modelInput: TimefoldModelInput }>(
      `/demo-data/${datasetId}/input`
    );
    
    // Handle wrapped response
    if (data && "modelInput" in data) {
      return data.modelInput;
    }
    
    return data as TimefoldModelInput;
  } catch (error) {
    // If input endpoint fails, try fetching the full dataset
    console.warn("Input endpoint failed, trying full dataset:", error);
    
    const fullData = await timefoldFetch<{ modelInput: TimefoldModelInput } | TimefoldModelInput>(
      `/demo-data/${datasetId}`
    );
    
    if ("modelInput" in fullData) {
      return fullData.modelInput;
    }
    
    return fullData;
  }
}

/**
 * Submits a model input to create a new route plan (starts optimization)
 * 
 * Note: The configurationId is a query parameter that specifies which map service to use.
 * For US-based demo data (like BASIC), use the US Georgia map configuration.
 * 
 * @param modelInput - The model input data
 * @param configurationId - Optional configuration ID for map service
 * @param terminationLimit - Optional time limit for solver (e.g., "PT1M" for 1 minute, "PT30S" for 30 seconds)
 */
export async function createRoutePlan(
  modelInput: TimefoldModelInput,
  configurationId?: string,
  terminationLimit?: string
): Promise<{ id: string; solverStatus: string }> {
  // Build the URL with optional configurationId query parameter
  let url = "/route-plans";
  if (configurationId) {
    url += `?configurationId=${encodeURIComponent(configurationId)}`;
  }

  // Build request body with optional termination config
  const requestBody: {
    modelInput: TimefoldModelInput;
    config?: {
      run?: {
        termination?: {
          spentLimit?: string;
        };
      };
    };
  } = { modelInput };

  // Add termination time limit if specified
  if (terminationLimit) {
    requestBody.config = {
      run: {
        termination: {
          spentLimit: terminationLimit,
        },
      },
    };
  }

  const response = await timefoldFetch<{ id: string; solverStatus: string }>(
    url,
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    }
  );
  
  return response;
}

/**
 * Fetches the current state of a route plan (for polling)
 */
export async function getRoutePlan(routePlanId: string): Promise<TimefoldRoutePlan> {
  // Timefold API returns nested structure with metadata and run
  const data = await timefoldFetch<{
    metadata?: {
      id: string;
      solverStatus: string;
      score?: string;
      validationResult?: {
        summary: string;
        errors?: string[];
      };
    };
    run?: {
      id: string;
      solverStatus: string;
      score?: string;
      validationResult?: {
        summary: string;
        errors?: string[];
      };
    };
    modelOutput?: {
      vehicles?: Array<{
        id: string;
        shifts?: Array<{
          id: string;
          startTime?: string;
          itinerary?: Array<{
            id: string;
            kind: string;
            arrivalTime?: string;
            startServiceTime?: string;
            departureTime?: string;
          }>;
        }>;
      }>;
      unassignedVisits?: string[];
    };
    kpis?: {
      totalTravelTime?: string;
      totalAssignedVisits?: number;
      totalUnassignedVisits?: number;
    };
    // Direct properties (for non-nested response)
    id?: string;
    solverStatus?: string;
    score?: string;
  }>(`/route-plans/${routePlanId}`);

  // Extract status from metadata (primary) or run (fallback)
  const solverStatus = data.metadata?.solverStatus || data.run?.solverStatus || data.solverStatus || "UNKNOWN";
  const routePlanId2 = data.metadata?.id || data.run?.id || data.id || routePlanId;
  const score = data.metadata?.score || data.run?.score || data.score;
  
  // Check for validation errors
  const validationErrors = data.metadata?.validationResult?.errors || data.run?.validationResult?.errors;
  if (validationErrors && validationErrors.length > 0 && solverStatus === "DATASET_INVALID") {
    console.warn("Dataset validation errors:", validationErrors.slice(0, 3));
  }

  // Extract vehicle routes from modelOutput - the actual API structure has shifts[].itinerary
  const routes = data.modelOutput?.vehicles?.map(vehicle => {
    // Flatten all itinerary items from all shifts into visits
    const allVisits: Array<{
      id: string;
      arrivalTime?: string;
      departureTime?: string;
      startServiceTime?: string;
    }> = [];
    
    vehicle.shifts?.forEach(shift => {
      shift.itinerary?.forEach(item => {
        if (item.kind === "VISIT") {
          allVisits.push({
            id: item.id,
            arrivalTime: item.arrivalTime,
            departureTime: item.departureTime,
            startServiceTime: item.startServiceTime,
          });
        }
      });
    });
    
    return {
      vehicleId: vehicle.id,
      visits: allVisits,
    };
  });

  // Map the response to our expected format
  return {
    id: routePlanId2,
    solverStatus: solverStatus as TimefoldRoutePlan["solverStatus"],
    score: score,
    routes: routes,
    unassignedVisits: data.modelOutput?.unassignedVisits?.map(id => ({ id, name: id })),
    validationErrors: validationErrors,
    kpis: data.kpis,
  };
}

/**
 * Checks if the solver has completed (helper for polling)
 * Terminal states from Timefold API: SOLVING_COMPLETED, SOLVING_INCOMPLETE, SOLVING_FAILED, DATASET_INVALID
 */
export function isSolverComplete(status: string): boolean {
  return (
    status === "SOLVING_COMPLETED" ||
    status === "SOLVING_INCOMPLETE" ||
    status === "SOLVING_FAILED" ||
    status === "DATASET_INVALID" ||
    status === "EXCEPTION"
  );
}

/**
 * Checks if the solver is still running
 */
export function isSolverRunning(status: string): boolean {
  return status === "SOLVING_ACTIVE" || status === "SOLVING_SCHEDULED";
}
