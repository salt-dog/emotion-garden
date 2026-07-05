/**
 * 验证编排逻辑（不调用模型 API）
 * 用法: npm run verify
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assessFlow,
  assessUserRichness,
  buildSystemPrompt,
  guardResponse,
  stripQuestionMarks,
  toPromptMaterials,
} from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ragMaterials = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "rag-materials.seed.json"), "utf-8"),
);
const materials = toPromptMaterials(ragMaterials);

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

console.log("\n=== 1. 流动状态判定 ===\n");

const shortFirst = assessFlow([{ role: "user", content: "今天上班又被骂了，心累。" }]);
assert("简短首轮 → listening", shortFirst.state === "listening");

const directQuestion = assessFlow([
  { role: "user", content: "我很喜欢《被讨厌的勇气》，你觉得这本书怎么样？" },
]);
assert("明确提问首轮 → conversation", directQuestion.state === "conversation");

const severeShort = assessFlow([
  { role: "user", content: "我觉得活着没意思，可能我真的挺废的。" },
]);
assert("严重但简短首轮 → 仍 listening", severeShort.state === "listening");

const longNarrative = assessFlow([
  {
    role: "user",
    content:
      "就是啊，我那个主管今天当众说我方案没逻辑。大家都看着我，太丢人了。我觉得我可能真的很蠢，混到毕业也找不到工作。",
  },
]);
assert("长段倾诉首轮 → resonance", longNarrative.state === "resonance");

const manyShort = assessFlow([
  { role: "user", content: "又被骂了" },
  { role: "assistant", content: "唉，今天真的辛苦你了。" },
  { role: "user", content: "烦" },
  { role: "assistant", content: "这种气确实窝火。" },
  { role: "user", content: "还行吧" },
]);
assert("多轮仍零碎 → listening", manyShort.state === "listening");

console.log("\n=== 2. 丰富度评估 ===\n");

const r1 = assessUserRichness("心累");
assert("极短 → 非详细倾诉", !r1.isDetailedNarrative);

const r2 = assessUserRichness(
  "就是啊，我那个主管今天当众说我方案没逻辑。大家都看着我，太丢人了。我觉得我可能真的很蠢，混到毕业也找不到工作。",
);
assert("有情节+委屈 → 详细倾诉", r2.isDetailedNarrative);

console.log("\n=== 3. Prompt 注入 ===\n");

const { systemPrompt: p1 } = buildSystemPrompt([
  { role: "user", content: "心累" },
]);
assert("状态一 prompt 含「状态一」", p1.includes("状态一"));
assert("状态一 prompt 禁止素材", p1.includes("禁止") && p1.includes("电影"));

const { systemPrompt: p2 } = buildSystemPrompt(
  [
    { role: "user", content: "我很喜欢《被讨厌的勇气》，你觉得这本书怎么样？" },
  ],
);
assert("状态二 prompt 含「正常交流」", p2.includes("正常交流与直接回应"));
assert("状态二 prompt 允许直接回应", p2.includes("第一二句就要直接回答用户此刻的问题"));
assert("状态二 prompt 禁止客服式空话", p2.includes("我在这儿听着"));

const { systemPrompt: p3 } = buildSystemPrompt(
  [
    {
      role: "user",
      content:
        "主管当众骂我方案没逻辑，大家都看着，太丢人，我觉得自己很蠢找不到工作。",
    },
  ],
  { materials },
);
assert("状态三 prompt 含「状态三」", p3.includes("状态三"));
assert("状态三 prompt 含素材候选", p3.includes("当幸福来敲门") || p3.includes("可选文化素材"));

console.log("\n=== 4. 输出红线 ===\n");

const bad = "你要相信自己！《心灵奇旅》说火花不是目标。你觉得呢？";
const g = guardResponse(bad, "listening");
assert("检出问号+素材", !g.ok && g.violations.length >= 2);

const cleaned = stripQuestionMarks("今天还好吗？");
assert("去问号", !cleaned.includes("？") && !cleaned.includes("?"));

const conversationBad = "我在这儿听着，你想怎么聊都行。";
const g2 = guardResponse(conversationBad, "conversation");
assert("检出状态二空话", !g2.ok && g2.violations.some((v) => v.includes("空话")));

console.log("\n" + "=".repeat(40));
console.log(`结果: ${passed} 通过, ${failed} 失败`);
if (failed > 0) process.exit(1);
console.log("\n逻辑验证通过。要测真实模型回复请运行: npm run chat\n");