/**
 * RAG 文化素材库自动生成（需 .env 配置 LLM）
 *
 * 用法:
 *   npm run generate-rag -- --theme=职场与学业 --count=5
 *   npm run generate-rag -- --theme=精神内耗 --count=3 --scenes="失眠反复想一件事|怕让家人失望"
 *   npm run generate-rag -- --theme=存在与意义 --count=4 --merge --out=data/rag-materials.json
 *   npm run generate-rag -- ... --no-json-mode   （网关不支持 response_format 时）
 *   npm run generate-rag -- ... --dry-run         （只打印，不写文件）
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./load-env.mjs";
import {
  THEME_CATEGORIES,
  generateRagMaterials,
  validateRagMaterials,
} from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function getArg(name, fallback = null) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  if (!hit) return fallback;
  return hit.slice(prefix.length) || fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function normalizeDedupeKey(title, quote) {
  return `${title.replace(/\s+/g, "")}|${quote.replace(/\s+/g, "")}`.toLowerCase();
}

function loadRagArray(path) {
  if (!existsSync(path)) return [];
  const raw = JSON.parse(readFileSync(path, "utf-8"));
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray(raw.materials)) {
    return raw.materials;
  }
  return [];
}

loadEnvFile();

const theme = getArg("theme");
const countRaw = getArg("count", "5");
const count = Number.parseInt(countRaw, 10);
const scenesArg = getArg("scenes", "");
const outPath = getArg(
  "out",
  join(__dirname, "..", "data", "rag-materials.generated.json"),
);
const merge = hasFlag("merge");
const dryRun = hasFlag("dry-run");
const noJsonMode = hasFlag("no-json-mode");

if (!theme || !THEME_CATEGORIES.includes(theme)) {
  console.error(
    "请指定合法 --theme= 五大板块之一：",
    THEME_CATEGORIES.join(" / "),
  );
  process.exit(1);
}

if (!Number.isFinite(count) || count < 1 || count > 30) {
  console.error("--count 须为 1–30 之间的整数");
  process.exit(1);
}

const focus_scenes = scenesArg
  ? scenesArg.split("|").map((s) => s.trim()).filter(Boolean)
  : [];

console.log("\n--- RAG 素材生成 ---");
console.log(`板块: ${theme}`);
console.log(`条数: ${count}`);
if (focus_scenes.length) {
  console.log("场景:", focus_scenes.join("；"));
}
console.log(`JSON 模式: ${noJsonMode ? "关闭" : "开启"}`);
console.log(`输出: ${outPath}`);
console.log(`合并已有: ${merge ? "是" : "否"}\n`);

let result;
try {
  result = await generateRagMaterials(
    { theme_category: theme, count, focus_scenes },
    { useJsonObjectMode: !noJsonMode, temperature: 0.65, maxTokens: 4096 },
  );
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error("调用模型失败:", msg);
  if (!noJsonMode) {
    console.error("\n若网关不支持 response_format，请重试: 追加 --no-json-mode");
  }
  process.exit(1);
}

const errors = validateRagMaterials(result.materials);
if (errors.length) {
  console.warn("--- 校验警告（仍写入，便于你人工筛） ---");
  for (const e of errors) console.warn("-", e);
  console.warn("");
}

if (result.materials.length !== count) {
  console.warn(
    `警告: 期望 ${count} 条，实际解析 ${result.materials.length} 条（可检查模型是否截断）。\n`,
  );
}

let toWrite = result.materials;

if (merge) {
  const existing = loadRagArray(outPath);
  const keys = new Set(
    existing.map((m) => normalizeDedupeKey(m.title ?? "", m.raw_quote ?? "")),
  );
  const appended = [];
  let nextId =
    existing.reduce((max, m) => {
      const n = Number(m.id);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;

  for (const m of result.materials) {
    const key = normalizeDedupeKey(m.title, m.raw_quote);
    if (keys.has(key)) continue;
    keys.add(key);
    const id = typeof m.id === "number" && Number.isFinite(m.id) ? m.id : nextId++;
    appended.push({ ...m, id });
  }

  toWrite = [...existing, ...appended];
  console.log(`合并: 原有 ${existing.length} 条，新增 ${appended.length} 条（去重后）。\n`);
}

const json = `${JSON.stringify(toWrite, null, 2)}\n`;

if (dryRun) {
  console.log("--- dry-run：预览前 2 条 ---\n");
  console.log(JSON.stringify(toWrite.slice(0, 2), null, 2));
  console.log("\n（未写入文件）\n");
} else {
  writeFileSync(outPath, json, "utf-8");
  console.log(`已写入: ${outPath}`);
}

console.log(
  "编排接入示例: 读取 JSON → rankRagMaterials(userText, ragList) → toPromptMaterials(...) → buildChatPayload(..., { materials })",
);
