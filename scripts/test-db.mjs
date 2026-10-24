// Ejecuta las pruebas pgTAP de supabase/tests contra el proyecto vinculado sin Docker
// (ver design.md D12). Uso: npm run test:db [-- archivo.test.sql ...]
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const TESTS_DIR = path.resolve("supabase/tests");
const helpers = readFileSync(path.join(TESTS_DIR, "_helpers.sql"), "utf8");

const requested = process.argv.slice(2);
const files = (requested.length > 0
  ? requested.map((f) => path.basename(f))
  : readdirSync(TESTS_DIR).filter((f) => f.endsWith(".test.sql"))
).sort();

if (files.length === 0) {
  console.error("No hay archivos *.test.sql en supabase/tests");
  process.exit(1);
}

const workDir = mkdtempSync(path.join(tmpdir(), "test-db-"));
let failedFiles = 0;

for (const file of files) {
  const body = readFileSync(path.join(TESTS_DIR, file), "utf8");
  // reset role: el ultimo select corre con el rol de conexion aunque la prueba haya cambiado de rol
  const sql = `begin;\n${helpers}\n${body}\nreset role;\nselect n, line from _tap order by n;\nrollback;\n`;
  const sqlPath = path.join(workDir, file);
  writeFileSync(sqlPath, sql);

  const result = spawnSync(
    "npx",
    ["supabase", "db", "query", "--linked", "-f", `"${sqlPath}"`],
    { encoding: "utf8", shell: true },
  );

  const lines = parseRows(result.stdout);
  const problems = evaluate(result, lines);

  console.log(`\n# ${file}`);
  for (const line of lines) console.log(line);

  if (problems.length > 0) {
    failedFiles++;
    for (const p of problems) console.log(`FALLO: ${p}`);
  }
}

rmSync(workDir, { recursive: true, force: true });

console.log(
  failedFiles === 0
    ? `\nOK: ${files.length} archivo(s) de prueba pasaron`
    : `\nFALLARON ${failedFiles} de ${files.length} archivo(s)`,
);
process.exit(failedFiles === 0 ? 0 : 1);

function parseRows(stdout) {
  const start = stdout.indexOf("{");
  if (start === -1) return [];
  try {
    const parsed = JSON.parse(stdout.slice(start));
    return (parsed.rows ?? []).map((r) => r.line);
  } catch {
    return [];
  }
}

function evaluate(result, lines) {
  const problems = [];

  if (result.status !== 0) {
    const out = `${result.stdout}\n${result.stderr}`;
    const match = out.match(/"message":"((?:[^"\\]|\\.)*)"/g);
    problems.push(`error de ejecucion SQL: ${match ? match.at(-1) : out.trim()}`);
    return problems;
  }

  const plan = lines.find((l) => /^1\.\.\d+$/.test(l));
  if (!plan) problems.push("no se encontro la linea de plan (falta select plan(n)?)");

  const notOk = lines.filter((l) => l.startsWith("not ok"));
  if (notOk.length > 0) problems.push(`${notOk.length} prueba(s) con "not ok"`);

  if (lines.some((l) => l.startsWith("# Looks like"))) {
    problems.push("pgTAP reporta fallos o un numero de pruebas distinto al plan");
  }

  return problems;
}
