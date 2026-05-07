import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GiniRequest = {
  features?: unknown;
  labels?: unknown;
};

const PYTHON_CANDIDATES = [
  process.env.PYTHON_PATH,
  path.join(process.cwd(), ".venv", "bin", "python"),
  "python3",
  "python",
].filter((candidate): candidate is string => Boolean(candidate));

function runPythonGini(payload: { features: string[]; labels: Record<string, string> }) {
  const scriptPath = path.join(process.cwd(), "app", "backend", "compute_gini.py");

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    let candidateIndex = 0;

    const tryCandidate = () => {
      const command = PYTHON_CANDIDATES[candidateIndex];

      if (!command) {
        reject(new Error("No Python interpreter could run the Gini computation."));
        return;
      }

      const child = spawn(command, [scriptPath], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          MPLCONFIGDIR: "/tmp/matplotlib",
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      child.on("error", () => {
        candidateIndex += 1;
        tryCandidate();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
          return;
        }

        candidateIndex += 1;

        if (candidateIndex < PYTHON_CANDIDATES.length) {
          tryCandidate();
          return;
        }

        reject(new Error(stderr || `Python exited with code ${code}`));
      });

      child.stdin.write(JSON.stringify(payload));
      child.stdin.end();
    };

    tryCandidate();
  });
}

export async function POST(request: Request) {
  const body = (await request.json()) as GiniRequest;
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

  if (features.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { stdout } = await runPythonGini({ features, labels });
    return NextResponse.json(JSON.parse(stdout));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to compute Gini impurity.",
      },
      { status: 500 },
    );
  }
}
