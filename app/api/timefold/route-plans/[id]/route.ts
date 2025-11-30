/**
 * GET /api/timefold/route-plans/[id]
 * 
 * Fetches the current state of a route plan.
 * Used for polling during optimization.
 */

import { NextRequest, NextResponse } from "next/server";
import { getRoutePlan, isSolverComplete, isSolverRunning } from "@/lib/timefoldClient";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    // Check for API key first
    if (!process.env.TIMEFOLD_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Timefold API key is not configured.",
        },
        { status: 500 }
      );
    }

    const routePlan = await getRoutePlan(id);

    // Check for DATASET_INVALID status and return validation errors
    if (routePlan.solverStatus === "DATASET_INVALID") {
      const errorMsg = routePlan.validationErrors?.length 
        ? `Dataset validation failed: ${routePlan.validationErrors[0]}${routePlan.validationErrors.length > 1 ? ` (and ${routePlan.validationErrors.length - 1} more errors)` : ''}`
        : "Dataset is invalid. The locations may be outside the supported map coverage.";
      
      return NextResponse.json({
        success: false,
        error: errorMsg,
        routePlan,
        isComplete: true,
        isRunning: false,
        solverStatus: routePlan.solverStatus,
        validationErrors: routePlan.validationErrors,
      });
    }

    return NextResponse.json({
      success: true,
      routePlan,
      isComplete: isSolverComplete(routePlan.solverStatus),
      isRunning: isSolverRunning(routePlan.solverStatus),
      solverStatus: routePlan.solverStatus,
    });
  } catch (error) {
    console.error(`Failed to get route plan ${id}:`, error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred";

    return NextResponse.json(
      {
        success: false,
        error: `Failed to fetch route plan: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
