import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const backendDir = path.join(rootDir, "app", "backend");
const venvDir = path.join(backendDir, ".venv");
const requirementsPath = path.join(backendDir, "requirements.txt");
const isWindows = process.platform === "win32";
const venvPython = path.join(venvDir, isWindows ? "Scripts/python.exe" : "bin/python");
const pythonCandidates = isWindows ? ["py", "python"] : ["python3", "python"];

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: "inherit",
    shell: false,
  });

  return result.status === 0;
}

function createVenv() {
  for (const candidate of pythonCandidates) {
    const args = candidate === "py" ? ["-3", "-m", "venv", venvDir] : ["-m", "venv", venvDir];

    if (run(candidate, args)) {
      return;
    }
  }

  throw new Error("Unable to create backend virtual environment. Install Python 3 and try again.");
}

createVenv();

if (!run(venvPython, ["-m", "pip", "install", "--upgrade", "pip"])) {
  throw new Error("Unable to upgrade pip in the backend virtual environment.");
}

if (!run(venvPython, ["-m", "pip", "install", "-r", requirementsPath])) {
  throw new Error("Unable to install backend requirements.");
}
