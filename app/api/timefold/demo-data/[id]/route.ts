/**
 * GET /api/timefold/demo-data/[id]
 * 
 * Fetches a specific demo dataset's model input.
 * If id is "local-demo", reads from the local JSON file.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchDemoDataInput } from "@/lib/timefoldClient";
import { promises as fs } from "fs";
import path from "path";
import type { TimefoldModelInput } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    let modelInput: TimefoldModelInput;

    if (id === "local-demo") {
      // Read from local JSON file
      const filePath = path.join(process.cwd(), "data", "demoInput.json");
      const fileContent = await fs.readFile(filePath, "utf-8");
      modelInput = JSON.parse(fileContent);
    } else {
      // Check for API key before attempting external API call
      if (!process.env.TIMEFOLD_API_KEY) {
        return NextResponse.json(
          {
            success: false,
            error: "Timefold API key is not configured. Please use the local demo dataset.",
          },
          { status: 500 }
        );
      }
      
      // Fetch from Timefold API
      modelInput = await fetchDemoDataInput(id);
    }

    return NextResponse.json({
      success: true,
      id,
      modelInput,
    });
  } catch (error) {
    console.error(`Failed to fetch demo data for id ${id}:`, error);
    
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    
    // If Timefold API fails, try to fall back to local demo
    if (id !== "local-demo") {
      try {
        const filePath = path.join(process.cwd(), "data", "demoInput.json");
        const fileContent = await fs.readFile(filePath, "utf-8");
        const modelInput = JSON.parse(fileContent);
        
        return NextResponse.json({
          success: true,
          id: "local-demo",
          modelInput,
          warning: `Could not load dataset "${id}", using local demo instead`,
        });
      } catch (fallbackError) {
        console.error("Local fallback also failed:", fallbackError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: `Failed to load demo data: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
