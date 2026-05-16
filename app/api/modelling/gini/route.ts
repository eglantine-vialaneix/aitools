import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GiniRequest = {
  features?: unknown;
  labels?: unknown;
  filters?: unknown;
  dataFile?: unknown;
};

type SplitFilter = {
  feature: string;
  operator: "eq" | "gte";
  value: string | number | boolean;
  branch: "yes" | "no";
};

const BACKEND_DIR = path.join(process.cwd(), "app", "backend");

const PYTHON_CANDIDATES = [
  process.env.PYTHON_PATH,
  path.join(BACKEND_DIR, ".venv", "bin", "python"),
  "python3",
  "python",
].filter((candidate): candidate is string => Boolean(candidate));

function isSplitFilter(value: unknown): value is SplitFilter {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.feature === "string" &&
    (candidate.operator === "eq" || candidate.operator === "gte") &&
    (typeof candidate.value === "string" ||
      typeof candidate.value === "number" ||
      typeof candidate.value === "boolean") &&
    (candidate.branch === "yes" || candidate.branch === "no")
  );
}

function runPythonGini(payload: {
  features: string[];
  labels: Record<string, string>;
  filters: SplitFilter[];
  dataFile: "df_train.csv" | "df_train_partial.csv";
}) {
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
  const filters = Array.isArray(body.filters) ? body.filters.filter(isSplitFilter) : [];
  const dataFile = body.dataFile === "df_train_partial.csv" ? "df_train_partial.csv" : "df_train.csv";

  if (features.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const { stdout } = await runPythonGini({ features, labels, filters, dataFile });
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
