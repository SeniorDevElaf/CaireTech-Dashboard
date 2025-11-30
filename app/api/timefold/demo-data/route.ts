/**
 * GET /api/timefold/demo-data
 * 
 * Fetches the list of available demo datasets from Timefold.
 * Falls back to a local demo dataset if the external API is unavailable.
 */

import { NextResponse } from "next/server";
import { fetchDemoDataList } from "@/lib/timefoldClient";
import type { TimefoldDemoDataMeta } from "@/lib/types";

export async function GET() {
  try {
    // Local demo for when API is unavailable (display only, cannot optimize)
    const localDemo: TimefoldDemoDataMeta = { 
      id: "local-demo", 
      name: "Local Demo (Stockholm Home Care) - Display Only" 
    };

    // Check if Timefold API is configured
    if (!process.env.TIMEFOLD_API_KEY) {
      // Return only local demo when API key is not set
      return NextResponse.json({
        success: true,
        datasets: [localDemo],
        warning: "Timefold API key not configured - using local demo data only",
      });
    }

    // Attempt to fetch demo data list from Timefold API
    const datasets = await fetchDemoDataList();
    
    // Put Timefold datasets first (they can be optimized), local demo last
    const allDatasets: TimefoldDemoDataMeta[] = [
      ...datasets,
      localDemo,
    ];
    
    return NextResponse.json({
      success: true,
      datasets: allDatasets,
    });
  } catch (error) {
    // Log the error but don't expose details to client
    console.error("Failed to fetch Timefold demo data list:", error);
    
    // Return only local demo as fallback
    return NextResponse.json({
      success: true,
      datasets: [
        { id: "local-demo", name: "Local Demo (Stockholm Home Care) - Display Only" },
      ],
      warning: "Timefold API unavailable - using local demo data only",
    });
  }
}
