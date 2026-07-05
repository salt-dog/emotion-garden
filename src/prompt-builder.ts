import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { assessFlow } from "./flow-state.js";
import type {
  BuildPromptOptions,
  ChatMessage,
  CulturalMaterial,
  FlowState,
} from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadSystemTemplate(): string {
  const path = join(__dirname, "..", "prompts", "system.md");
  return readFileSync(path, "utf-8");
}

function stateLabel(state: FlowState): string {
  if (state === "listening") return "状态一 · 初识倾听与垫话";
  if (state === "conversation") return "状态二 · 正常交流与直接回应";
  return "状态三 · 偶遇知音与隐喻托抱";
}

function buildListeningBlock(
  userTurnCount: number,
  richnessSummary: string,
): string {
  return [
    "## 【本回合系统判定 · 必须严格执行】",
    "",
    `- **流动状态**：${stateLabel("listening")}`,
    `- **用户已发言轮次**：第 ${userTurnCount} 轮`,
    `- **用户本轮信息密度**：${richnessSummary}`,
    "",
    "### 本回合硬性要求",
    "",
    "1. 回复控制在 **40–60 字**（汉字为主，不要写长段）。",
    "2. 仅用大白话垫话、体谅，顺着她说，**不反驳、不升华、不给方案**。",
    "3. **禁止**出现任何电影、书籍、歌词、名人语录、哲理金句（包括片名、书名、《》）。",
    "4. **禁止**出现问号（？或 ?）。",
    "5. **禁止**心理学专业词汇。",
    "6. 用陈述句收尾，把话筒留给用户，不要替她往下编故事。",
  ].join("\n");
}

function buildConversationBlock(
  userTurnCount: number,
  richnessSummary: string,
): string {
  return [
    "## 【本回合系统判定 · 必须严格执行】",
    "",
    `- **流动状态**：${stateLabel("conversation")}`,
    `- **用户已发言轮次**：第 ${userTurnCount} 轮`,
    `- **用户本轮信息密度**：${richnessSummary}`,
    "- **进入原因**：用户正在明确提问，或主动发起一个具体话题交流",
    "",
    "### 本回合要求",
    "",
    "1. 第一二句就要直接回答用户此刻的问题，**先表态，再展开**，不要假装没听懂。",
    "2. 回复以 **100–180 字** 为宜；优先给出明确结论，再补 2–3 句理由或保留，不要写成长文。",
    "3. 把自己当成一个正常、有判断的人，可以喜欢、可以不完全认同，也可以说出保留意见。",
    "4. 如果用户主动提到了书、电影、歌词、观点，你可以顺着聊它本身；这不算越级。",
    "5. **禁止**用这些空话开头或收尾：`我在这儿听着`、`你想怎么聊都行`、`慢慢说`、`我接住你`、`我陪着你`。",
    "6. **禁止**出现问号（？或 ?），不要反问式把球踢回去。",
    "7. **禁止**心理学专业词汇、治疗口吻和高高在上的说教。",
    "8. 若用户在交流里带着一点情绪，可以顺手接一下，但重点仍是把当前问题回答到位。",
  ].join("\n");
}

function scoreMaterial(material: CulturalMaterial, userText: string): number {
  return material.themes.reduce(
    (score, theme) => (userText.includes(theme) ? score + 1 : score),
    0,
  );
}

function pickMaterials(
  userText: string,
  materials: CulturalMaterial[],
  max: number,
): CulturalMaterial[] {
  return [...materials]
    .sort((a, b) => scoreMaterial(b, userText) - scoreMaterial(a, userText))
    .filter((m) => scoreMaterial(m, userText) > 0)
    .slice(0, max);
}

function buildResonanceBlock(
  userTurnCount: number,
  richnessSummary: string,
  enteredViaNarrative: boolean,
  materials: CulturalMaterial[],
): string {
  const lines = [
    "## 【本回合系统判定 · 必须严格执行】",
    "",
    `- **流动状态**：${stateLabel("resonance")}`,
    `- **用户已发言轮次**：第 ${userTurnCount} 轮`,
    `- **用户本轮信息密度**：${richnessSummary}`,
    `- **进入原因**：${
      enteredViaNarrative
        ? "用户已主动倒出较完整的情节与细腻感受（水到渠成）"
        : "对话积累达到可共鸣深度"
    }`,
    "",
    "### 本回合要求",
    "",
    "1. 先用大白话接住她的具体委屈和情境，**不要贴心理学标签**。",
    "2. 可自然带入 **至多一条** 文化素材（电影台词/歌词/书摘），像顺口提起，严禁语文老师式讲解。",
    "3. **禁止**出现问号（？或 ?）。",
    "4. **禁止**心理学专业词汇与作诗腔。",
    "5. 素材是嘴替，不是药方；不要堆砌多条金句。",
  ];

  if (materials.length > 0) {
    lines.push("", "### 可选文化素材（择一，可改写口语，勿照搬讲解）", "");
    for (const m of materials) {
      lines.push(
        `- **${m.title}**（${m.type}）：「${m.excerpt}」`,
      );
    }
  } else {
    lines.push(
      "",
      "### 文化素材",
      "",
      "知识库未命中时，可仅用大白话深度陪伴，**不要**为了用素材而硬编片名台词。",
    );
  }

  return lines.join("\n");
}

/**
 * 构建完整 system prompt：静态人格 + 本回合流动状态注入。
 */
export function buildSystemPrompt(
  messages: ChatMessage[],
  options: BuildPromptOptions = {},
): { systemPrompt: string; assessment: ReturnType<typeof assessFlow> } {
  const assessment = assessFlow(messages);
  const { state, userTurnCount, richness, enteredViaNarrative } = assessment;
  const latestUser = messages.filter((m) => m.role === "user").at(-1)?.content ?? "";

  let runtimeBlock: string;
  if (state === "listening") {
    runtimeBlock = buildListeningBlock(userTurnCount, richness.summary);
  } else if (state === "conversation") {
    runtimeBlock = buildConversationBlock(userTurnCount, richness.summary);
  } else {
    const max = options.maxMaterials ?? 3;
    const picked = options.materials
      ? pickMaterials(latestUser, options.materials, max)
      : [];
    runtimeBlock = buildResonanceBlock(
      userTurnCount,
      richness.summary,
      enteredViaNarrative,
      picked,
    );
  }

  const template = loadSystemTemplate();
  const systemPrompt = template.replace("{{RUNTIME_BLOCK}}", runtimeBlock);

  return { systemPrompt, assessment };
}

/**
 * 组装发往模型的 messages 数组（system + 历史）。
 */
export function buildChatPayload(
  messages: ChatMessage[],
  options?: BuildPromptOptions,
): {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  assessment: ReturnType<typeof assessFlow>;
} {
  const { systemPrompt, assessment } = buildSystemPrompt(messages, options);
  return {
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ],
    assessment,
  };
}
