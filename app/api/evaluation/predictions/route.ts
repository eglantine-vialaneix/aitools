// OLD APPROACH: import spawn and path to run Python as a subprocess
// import { spawn } from "node:child_process";
// import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// NEW APPROACH: the Python backend is now a FastAPI server running separately.
// Next.js just forwards requests to it over HTTP instead of spawning a process.
const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

type PredictionRequest = {
  features?: unknown;
  labels?: unknown;
  dataFile?: unknown;
  targetFile?: unknown;
};

// OLD APPROACH: find a Python interpreter on the machine to run the script directly
// const BACKEND_DIR = path.join(process.cwd(), "app", "backend");
//
// function getPythonCandidates() {
//   const venvPythonParts =
//     process.platform === "win32" ? [".venv", "Scripts", "python.exe"] : [".venv", "bin", "python"];
//
//   return [
//     process.env.PYTHON_PATH,
//     path.join(BACKEND_DIR, ...venvPythonParts),
//     "python3",
//     "python",
//   ].filter((candidate): candidate is string => Boolean(candidate));
// }

// OLD APPROACH: spawn a Python child process, pipe JSON in via stdin, read result from stdout
// function runPythonPrediction(payload: {
//   features: string[];
//   labels: Record<string, string>;
//   dataFile: "df_train.csv" | "df_train_partial.csv";
//   targetFile: "df_train.csv" | "df_train_partial.csv" | "df_test.csv";
// }) {
//   const scriptPath = path.join(BACKEND_DIR, "predict_test.py");
//   const pythonCandidates = getPythonCandidates();
//
//   return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
//     let candidateIndex = 0;
//
//     const tryCandidate = () => {
//       const command = pythonCandidates[candidateIndex];
//
//       if (!command) {
//         reject(new Error("No Python interpreter could run the test prediction."));
//         return;
//       }
//
//       const child = spawn(command, [scriptPath], {
//         cwd: process.cwd(),
//         env: {
//           ...process.env,
//           MPLCONFIGDIR: "/tmp/matplotlib",
//         },
//         stdio: ["pipe", "pipe", "pipe"],
//       });
//       let stdout = "";
//       let stderr = "";
//
//       child.stdout.on("data", (data: Buffer) => {
//         stdout += data.toString();
//       });
//
//       child.stderr.on("data", (data: Buffer) => {
//         stderr += data.toString();
//       });
//
//       child.on("error", () => {
//         candidateIndex += 1;
//         tryCandidate();
//       });
//
//       child.on("close", (code) => {
//         if (code === 0) {
//           resolve({ stdout, stderr });
//           return;
//         }
//
//         candidateIndex += 1;
//
//         if (candidateIndex < pythonCandidates.length) {
//           tryCandidate();
//           return;
//         }
//
//         reject(new Error(stderr || `Python exited with code ${code}`));
//       });
//
//       child.stdin.write(JSON.stringify(payload));
//       child.stdin.end();
//     };
//
//     tryCandidate();
//   });
// }

export async function POST(request: Request) {
  const body = (await request.json()) as PredictionRequest;
  const features = Array.isArray(body.features)
    ? body.features.filter((feature): feature is string => typeof feature === "string")
    : [];
  const labels =
    body.labels && typeof body.labels === "object" && !Array.isArray(body.labels)
      ? Object.fromEntries(
          Object.entries(body.labels).filter(
            (entry): entry is [string, string] =>
              typeof entry[0] === "string" &&
              (entry[1] === "herbivore" || entry[1] === "carnivore"),
          ),
        )
      : {};
  const dataFile = body.dataFile === "df_train_partial.csv" ? "df_train_partial.csv" : "df_train.csv";
  const targetFile =
    body.targetFile === "df_train.csv" || body.targetFile === "df_train_partial.csv"
      ? body.targetFile
      : "df_test.csv";

  // OLD APPROACH: call the local Python subprocess directly
  // try {
  //   const { stdout } = await runPythonPrediction({ features, labels, dataFile, targetFile });
  //   return NextResponse.json(JSON.parse(stdout));
  // } catch (error) {
  //   return NextResponse.json(
  //     { error: error instanceof Error ? error.message : "Unable to compute test predictions." },
  //     { status: 500 },
  //   );
  // }

  // NEW APPROACH: forward the request to the FastAPI backend and return the response
  try {
    const response = await fetch(`${FASTAPI_URL}/predictions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ features, labels, dataFile, targetFile }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to reach the Python backend. Is it running on port 8000?",
      },
      { status: 500 },
    );
  }
}
