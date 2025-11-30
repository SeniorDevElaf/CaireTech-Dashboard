/**
 * POST /api/timefold/route-plans
 * 
 * Submits a model input to Timefold to create a new route plan.
 * This starts the optimization process.
 */

import { NextRequest, NextResponse } from "next/server";
import { createRoutePlan } from "@/lib/timefoldClient";
import type { TimefoldModelInput } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // Check for API key first before doing anything
    if (!process.env.TIMEFOLD_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          error: "Timefold API key is not configured. Please add TIMEFOLD_API_KEY to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const modelInput = body.modelInput as TimefoldModelInput;
    const datasetId = body.datasetId as string | undefined;
    const terminationLimit = body.terminationLimit as string | undefined;

    if (!modelInput) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing modelInput in request body",
        },
        { status: 400 }
      );
    }

    // Check if this is local demo data - it can't be optimized
    if (datasetId === "local-demo") {
      return NextResponse.json(
        {
          success: false,
          error: "Local demo data cannot be optimized. Please select a Timefold demo dataset (e.g., BASIC) to use the optimization feature.",
        },
        { status: 400 }
      );
    }

    // Validate that we have vehicles and visits
    if (!modelInput.vehicles?.length || !modelInput.visits?.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Model input must contain vehicles and visits",
        },
        { status: 400 }
      );
    }

    // Configuration ID for US Map (required for Timefold demo data)
    // This enables the OSRM US Georgia map service for routing
    const US_MAP_CONFIGURATION_ID = "6ba51ef5-6642-44d5-8cef-9be1caa05389";

    // Submit to Timefold with the US map configuration and optional termination limit
    const result = await createRoutePlan(modelInput, US_MAP_CONFIGURATION_ID, terminationLimit);

    return NextResponse.json({
      success: true,
      id: result.id,
      solverStatus: result.solverStatus,
    });
  } catch (error) {
    console.error("Failed to create route plan:", error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred";

    // Check for various API key related errors
    if (errorMessage.includes("TIMEFOLD_API_KEY") || errorMessage.includes("API key") || errorMessage.includes("API_KEY")) {
      return NextResponse.json(
        {
          success: false,
          error: "Timefold API key is not configured. Please add TIMEFOLD_API_KEY to your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Check for authentication/authorization errors from Timefold
    if (errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Unauthorized")) {
      return NextResponse.json(
        {
          success: false,
          error: "Timefold API authentication failed. Please verify your API key is correct.",
        },
        { status: 500 }
      );
    }

    // Check if Timefold returned HTML instead of JSON (auth failure)
    if (errorMessage.includes("Expected JSON but got") || errorMessage.includes("<!DOCTYPE")) {
      return NextResponse.json(
        {
          success: false,
          error: "Timefold API authentication failed. Please verify your TIMEFOLD_API_KEY is correct and active.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to start optimization: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
