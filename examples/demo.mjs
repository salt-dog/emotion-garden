import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assessFlow,
  buildSystemPrompt,
  guardResponse,
} from "../dist/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const materials = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "materials.sample.json"), "utf-8"),
);

const scenarios = [
  {
    title: "场景 A：首轮简短吐槽 → 必须状态一",
    messages: [{ role: "user", content: "今天上班又被骂了，心累。" }],
  },
  {
    title: "场景 B：首轮就很严重，但仍应状态一（不越级）",
    messages: [
      {
        role: "user",
        content: "我觉得活着没意思，可能我真的挺废的。",
      },
    ],
  },
  {
    title: "场景 C：用户主动长段倾诉 → 状态二（与轮次无关）",
    messages: [
      {
        role: "user",
        content:
          "就是啊，我那个主管今天当众说我方案没逻辑。大家都看着我，太丢人了。我觉得我可能真的很蠢，混到毕业也找不到工作。",
      },
    ],
  },
  {
    title: "场景 D：多轮后仍零碎 → 继续状态一",
    messages: [
      { role: "user", content: "又被骂了。" },
      { role: "assistant", content: "唉，连着熬本来就够呛，今天真的辛苦你了。" },
      { role: "user", content: "烦。" },
      { role: "assistant", content: "这种气受着确实窝火，先缓缓也好。" },
      { role: "user", content: "还行吧。" },
    ],
  },
];

for (const { title, messages } of scenarios) {
  console.log("\n" + "=".repeat(60));
  console.log(title);
  const flow = assessFlow(messages);
  console.log(
    `→ 流动状态: ${flow.state} | 轮次: ${flow.userTurnCount} | ${flow.richness.summary}`,
  );

  const { systemPrompt } = buildSystemPrompt(messages, { materials });
  const runtimeStart = systemPrompt.indexOf("## 【本回合系统判定");
  console.log("\n--- 注入块预览 ---\n");
  console.log(systemPrompt.slice(runtimeStart, runtimeStart + 600) + "...\n");
}

const badListening =
  "你要相信自己！《心灵奇旅》说火花不是目标。你觉得呢？";
console.log("校验（状态一误用素材+问号）:", guardResponse(badListening, "listening"));
