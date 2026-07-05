import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { loadEnvFile } from "./load-env.mjs";
import {
  buildChatPayload,
  chatCompletionsStream,
  guardResponse,
  loadLlmConfig,
  stripQuestionMarks,
  toPromptMaterials,
} from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile();

const ragMaterials = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "rag-materials.seed.json"), "utf-8"),
);
const materials = toPromptMaterials(ragMaterials);

const SAMPLE_INPUTS = {
  short: "最近压力好大呀。",
  severe: "我觉得学校的作业太多了，但是越多我就越不想写。",
  long:
    "。",
};

const config = loadLlmConfig();
const temperatureArg = process.argv.find((arg) => arg.startsWith("--temperature="));
const temperature = Number.parseFloat(temperatureArg?.split("=")[1] ?? "0.7");
const rl = createInterface({ input, output });
const history = [];

function printWelcome() {
  console.log("\n=== 渐进式知己 · 真实对话模拟 ===");
  console.log(`BASE_URL: ${config.baseUrl}`);
  console.log(`MODEL:    ${config.model}`);
  console.log(`API_KEY:  ${config.apiKey.slice(0, 8)}...（已隐藏）`);
  console.log(`TEMP:     ${Number.isFinite(temperature) ? temperature : 0.7}`);
  console.log("\n直接输入内容开始聊天。可用命令：");
  console.log("/help                查看帮助");
  console.log("/reset               清空当前对话历史");
  console.log("/sample short        注入简短吐槽样例");
  console.log("/sample severe       注入严重但简短样例");
  console.log("/sample long         注入长段倾诉样例");
  console.log("/history             查看当前历史");
  console.log("/exit                退出\n");
}

function printAssessment(assessment) {
  console.log("\n--- 编排层判定 ---");
  console.log(`流动状态: ${assessment.state}`);
  console.log(`用户轮次: ${assessment.userTurnCount}`);
  console.log(`信息密度: ${assessment.richness.summary}`);
  if (assessment.enteredViaNarrative) {
    console.log("进入原因: 用户主动给出了较完整的情节与感受");
  }
}

function printHistory() {
  if (history.length === 0) {
    console.log("\n当前还没有对话历史。\n");
    return;
  }

  console.log("\n--- 当前历史 ---");
  for (const message of history) {
    const role = message.role === "user" ? "你" : "AI";
    console.log(`${role}: ${message.content}`);
  }
  console.log("");
}

function printHelp() {
  console.log("\n说明：");
  console.log("- 每次输入都会带着完整历史发给模型，模拟真实多轮对话。");
  console.log("- `/sample ...` 会先清空历史，再用预设首句直接发起一轮对话。");
  console.log("- `/reset` 适合重新开始一个全新用户会话。\n");
}

function isReadlineClosedError(error) {
  return (
    error instanceof Error &&
    "code" in error &&
    error.code === "ERR_USE_AFTER_CLOSE"
  );
}

async function runTurn(userText) {
  history.push({ role: "user", content: userText });

  const { messages, assessment } = buildChatPayload(history, { materials });
  printAssessment(assessment);

  process.stdout.write("\n--- AI 回复 ---\n\n");

  let rawReply = "";
  const streamStart = Date.now();

  try {
    for await (const token of chatCompletionsStream(messages, {
      config,
      temperature: Number.isFinite(temperature) ? temperature : 0.7,
    })) {
      rawReply += token;
      process.stdout.write(token);
    }
  } catch (error) {
    console.error(
      `\n流式请求中断: ${error instanceof Error ? error.message : String(error)}`,
    );
    const last = history.at(-1);
    if (last?.role === "user") history.pop();
    return;
  }

  const elapsed = Date.now() - streamStart;
  // 先对原始回复做红线校验（含问号检测），再去除问号存储
  const rawCheck = guardResponse(rawReply, assessment.state);
  const cleaned = stripQuestionMarks(rawReply);

  console.log(`\n\n--- 红线校验 --- (总耗时 ${elapsed}ms)`);
  if (rawCheck.ok) {
    console.log("✓ 通过");
  } else {
    console.log(`✗ 未通过: ${rawCheck.violations.join("；")}`);
    if (rawCheck.violations.some((v) => v.includes("问号"))) {
      console.log("  （已自动去除问号）");
    }
  }

  history.push({ role: "assistant", content: cleaned });
  console.log("");
}

function resetHistory() {
  history.length = 0;
  console.log("\n已清空当前对话历史。\n");
}

async function handleCommand(commandText) {
  const [command, ...rest] = commandText.slice(1).trim().split(/\s+/);

  if (command === "exit") {
    rl.close();
    return false;
  }

  if (command === "reset") {
    resetHistory();
    return true;
  }

  if (command === "history") {
    printHistory();
    return true;
  }

  if (command === "help") {
    printHelp();
    return true;
  }

  if (command === "sample") {
    const key = rest[0];
    const sample = SAMPLE_INPUTS[key];
    if (!sample) {
      console.log("\n未知样例，可选：short / severe / long\n");
      return true;
    }

    resetHistory();
    console.log(`你: ${sample}`);
    try {
      await runTurn(sample);
    } catch (error) {
      history.pop();
      console.error(`\n模型请求失败: ${error instanceof Error ? error.message : String(error)}\n`);
    }
    return true;
  }

  console.log("\n未知命令，输入 /help 查看可用命令。\n");
  return true;
}

printWelcome();

while (true) {
  let text;
  try {
    text = (await rl.question("你: ")).trim();
  } catch (error) {
    if (isReadlineClosedError(error)) {
      break;
    }
    throw error;
  }

  if (!text) continue;

  if (text.startsWith("/")) {
    const shouldContinue = await handleCommand(text);
    if (!shouldContinue) break;
    continue;
  }

  try {
    await runTurn(text);
  } catch (error) {
    const last = history.at(-1);
    if (last?.role === "user") {
      history.pop();
    }
    console.error(`\n模型请求失败: ${error instanceof Error ? error.message : String(error)}\n`);
  }
}

rl.close();