import { spawn } from "node:child_process";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type PredictionRequest = {
  features?: unknown;
  labels?: unknown;
  dataFile?: unknown;
  targetFile?: unknown;
};

const BACKEND_DIR = path.join(process.cwd(), "app", "backend");
const predictionCache = new Map<string, unknown>();
const inFlightPredictions = new Map<string, Promise<unknown>>();

function stableStringify(value: unknown): string {
  if (!value || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  return `{${Object.keys(objectValue)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`)
    .join(",")}}`;
}

function getPythonCandidates() {
  const venvPythonParts =
    process.platform === "win32" ? [".venv", "Scripts", "python.exe"] : [".venv", "bin", "python"];

  return [
    process.env.PYTHON_PATH,
    path.join(BACKEND_DIR, ...venvPythonParts),
    "python3",
    "python",
  ].filter((candidate): candidate is string => Boolean(candidate));
}

function runPythonPrediction(payload: {
  features: string[];
  labels: Record<string, string>;
  dataFile: "df_train.csv" | "df_train_partial.csv";
  targetFile: "df_train.csv" | "df_train_partial.csv" | "df_test.csv";
}) {
  const scriptPath = path.join(BACKEND_DIR, "predict_test.py");
  const pythonCandidates = getPythonCandidates();

  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    let candidateIndex = 0;

    const tryCandidate = () => {
      const command = pythonCandidates[candidateIndex];

      if (!command) {
        reject(new Error("No Python interpreter could run the test prediction."));
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

        if (candidateIndex < pythonCandidates.length) {
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

  try {
    const payload: {
      features: string[];
      labels: Record<string, string>;
      dataFile: "df_train.csv" | "df_train_partial.csv";
      targetFile: "df_train.csv" | "df_train_partial.csv" | "df_test.csv";
    } = { features, labels, dataFile, targetFile };
    const cacheKey = stableStringify(payload);
    const cachedResponse = predictionCache.get(cacheKey);

    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    const existingRequest = inFlightPredictions.get(cacheKey);

    if (existingRequest) {
      return NextResponse.json(await existingRequest);
    }

    const nextRequest = runPythonPrediction(payload).then(({ stdout }) => JSON.parse(stdout) as unknown);
    inFlightPredictions.set(cacheKey, nextRequest);

    try {
      const response = await nextRequest;
      predictionCache.set(cacheKey, response);
      return NextResponse.json(response);
    } finally {
      inFlightPredictions.delete(cacheKey);
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to compute test predictions.",
      },
      { status: 500 },
    );
  }
}
