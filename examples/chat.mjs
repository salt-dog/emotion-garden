/**
 * 用真实模型 API 验证端到端对话
 *
 * 1. 复制 .env.example → .env，填写 LLM_API_KEY / LLM_BASE_URL / LLM_MODEL
 * 2. npm run chat
 * 3. 可选: npm run chat -- --scenario short
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./load-env.mjs";
import {
  buildChatPayload,
  guardResponse,
  loadLlmConfig,
  stripQuestionMarks,
  chatCompletionsStream,
  toPromptMaterials,
} from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile();

const ragMaterials = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "rag-materials.seed.json"), "utf-8"),
);
const materials = toPromptMaterials(ragMaterials);

const SCENARIOS = {
  short: {
    label: "场景：简短吐槽（应状态一，无金句）",
    history: [{ role: "user", content: "今天上班又被骂了，心累。" }],
  },
  severe: {
    label: "场景：严重但简短（仍应状态一）",
    history: [{ role: "user", content: "我觉得活着没意思，可能我真的挺废的。" }],
  },
  long: {
    label: "场景：长段倾诉（应状态二，可带素材）",
    history: [
      {
        role: "user",
        content:
          "就是啊，我那个主管今天当众说我方案没逻辑。大家都看着我，太丢人了。我觉得我可能真的很蠢，混到毕业也找不到工作。",
      },
    ],
  },
};

const arg = process.argv.find((a) => a.startsWith("--scenario="));
const scenarioKey = arg?.split("=")[1] ?? "short";
const scenario = SCENARIOS[scenarioKey];

if (!scenario) {
  console.error(`未知场景: ${scenarioKey}，可选: ${Object.keys(SCENARIOS).join(", ")}`);
  process.exit(1);
}

const config = loadLlmConfig();
console.log("\n--- 模型配置 ---");
console.log(`BASE_URL: ${config.baseUrl}`);
console.log(`MODEL:    ${config.model}`);
console.log(`API_KEY:  ${config.apiKey.slice(0, 8)}...（已隐藏）\n`);

console.log(`--- ${scenario.label} ---\n`);
console.log("用户:", scenario.history.at(-1).content, "\n");

const { messages, assessment } = buildChatPayload(scenario.history, { materials });

console.log("--- 编排层判定 ---");
console.log(`流动状态: ${assessment.state}`);
console.log(`用户轮次: ${assessment.userTurnCount}`);
console.log(`信息密度: ${assessment.richness.summary}\n`);

process.stdout.write("--- 请求模型中...\n\n");

let rawReply = "";
const streamStart = Date.now();

for await (const token of chatCompletionsStream(messages, { config, temperature: 0.7 })) {
  rawReply += token;
  process.stdout.write(token);
}

const elapsed = Date.now() - streamStart;
// 先对原始回复做红线校验，再去除问号
const rawCheck = guardResponse(rawReply, assessment.state);
const cleaned = stripQuestionMarks(rawReply);

console.log(`\n\n--- 红线校验 --- (总耗时 ${elapsed}ms)`);
if (rawCheck.ok) {
  console.log("✓ 通过");
} else {
  console.log("✗ 未通过:", rawCheck.violations.join("；"));
  if (rawCheck.violations.some((v) => v.includes("问号"))) {
    console.log("  （已自动去除问号）");
  }
  console.log("\n提示: 可调整 temperature 或在产品里对 violations 自动重试一轮。");
}

console.log("\n--- 清理后回复 ---\n");
console.log(cleaned);

console.log(
  "\n其他场景: npm run chat -- --scenario=severe  |  npm run chat -- --scenario=long\n",
);
