import { type NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs/promises";
import path from "path";
import type { OptimizationRequest, RouteResult } from "@/lib/types";
import { DistanceService } from "@/lib/services/distance-service";

export async function POST(request: NextRequest) {
  try {
    const body: OptimizationRequest = await request.json();

    // 1. Validate request
    if (!body.stops || body.stops.length < 3) {
      return NextResponse.json({ error: "At least 3 stops are required" }, { status: 400 });
    }
    if (body.stops.length > 7) {
      // More than 7 stops will be very slow for the real QAOA solver
      return NextResponse.json({ error: "For the Qiskit solver demo, please use a maximum of 7 stops." }, { status: 400 });
    }

    // 2. Calculate distance matrix
    const distanceService = DistanceService.getInstance();
    const matrix = await distanceService.calculateMatrix({
      stops: body.stops,
      mode: body.optimizeFor,
      source: body.distanceSource,
    });

    // 3. Create a temporary input file for the Python script
    const tempId = `tsp-input-${Date.now()}`;
    const inputFilePath = path.join("/tmp", `${tempId}.json`);
    await fs.writeFile(inputFilePath, JSON.stringify({ distance_matrix: matrix.distances }));

    // 4. Execute the Python script
    const scriptPath = path.resolve("./scripts/qaoa_solver.py");
    const command = `python3 ${scriptPath} --input ${inputFilePath} --p ${body.quantum.p || 2}`;

    const executionPromise = new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`Exec error: ${error}`);
          return reject(new Error(`Failed to execute Qiskit solver: ${stderr}`));
        }
        resolve({ stdout, stderr });
      });
    });

    const { stdout, stderr } = await executionPromise;

    // 5. Clean up the temporary file
    await fs.unlink(inputFilePath);

    if (stderr) {
      console.warn(`Qiskit solver stderr: ${stderr}`);
    }

    // 6. Parse the output from the script
    const result = JSON.parse(stdout);

    if (result.error) {
      throw new Error(result.error);
    }

    // 7. Format the result into a RouteResult
    const qiskitRoute: RouteResult = {
      solver: "quantum",
      name: `Qiskit QAOA p=${body.quantum.p || 2}`,
      tour: result.tour,
      length: result.length,
      feasible: result.feasible,
      violations: result.violations,
      runtimeMs: 0, // The python script doesn't report this, we could measure it here if needed
      parameters: {
        ...body.quantum,
        backend: "qiskit_aer",
        details: result.details,
      },
    };

    return NextResponse.json(qiskitRoute);

  } catch (error) {
    console.error("Qiskit optimization error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to run Qiskit optimization";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
