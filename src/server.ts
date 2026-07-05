import "dotenv/config";
import express from "express";
import type { Request, Response } from "express";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { buildChatPayload } from "./prompt-builder.js";
import { chatCompletions } from "./llm-client.js";
import { guardResponse, stripQuestionMarks } from "./response-guard.js";
import type { ChatMessage, FlowState } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PlantStage {
  asset: string;
  /** 前端 asset key：pot / seed / bud / water / flower */
  key: "pot" | "seed" | "bud" | "water" | "flower";
}

interface SessionData {
  id: string;
  messages: ChatMessage[];
  createdAt: number;
}

interface RecommendationItem {
  title: string;
  reason: string;
}


interface MemoryRecord {
  id: string;
  title: string;
  dialogueSummary: string;
  userOneSentence: string;
  flowerType: string;
  flowerAsset: string;
  recommendations: { title: string; reason: string; url?: string }[];
  createdAt: string;
}

interface MemoryDraft {
  title: string;
  dialogueSummary: string;
  userOneSentence: string;
  recommendations: RecommendationItem[];
}

// ---------------------------------------------------------------------------
// Session store (in-memory)
// ---------------------------------------------------------------------------

const sessions = new Map<string, SessionData>();

function createSession(): SessionData {
  const id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const session: SessionData = { id, messages: [], createdAt: Date.now() };
  sessions.set(id, session);
  return session;
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Memory persistence (JSON file)
// ---------------------------------------------------------------------------

const DATA_DIR = join(__dirname, "..", "data");
const MEMORY_FILE = join(DATA_DIR, "memories.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadMemories() {
  ensureDataDir();
  if (!existsSync(MEMORY_FILE)) return [];
  try {
    return JSON.parse(readFileSync(MEMORY_FILE, "utf-8"));
  } catch {
    console.warn("Memory file corrupted, reset");
    writeFileSync(MEMORY_FILE, "[]", "utf-8");
    return [];
  }
}

function saveMemories(memories: MemoryRecord[]) {
  ensureDataDir();
  writeFileSync(MEMORY_FILE, JSON.stringify(memories, null, 2), "utf-8");
}

function addMemoryRecord(memory: MemoryRecord) {
  const memories = loadMemories();
  memories.unshift(memory);
  saveMemories(memories);
}

// Load RAG materials for diverse recommendations
const RAG_SEED: any[] = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'rag-materials.seed.json'), 'utf-8')
);

const FLOWER_IMAGES = ["./assets/memory/lily-card-flower.png", "./assets/interaction/flower-lily.png", "./assets/interaction/bud.png", "./assets/interaction/seed.png", "./assets/interaction/pot.png", "./assets/interaction/water.png"];
function getFlowerImage(id: string): string { return FLOWER_IMAGES[Math.abs(id.split("").reduce(function(a: number, c: string): number { return a + c.charCodeAt(0); }, 0)) % FLOWER_IMAGES.length]; }

function pickRecs(n: number): any[] {
  const arr = [...RAG_SEED];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}


// Plant stage helpers
// ---------------------------------------------------------------------------

function derivePlantStage(
  userTurnCount: number,
  prevStage: PlantStage["key"] | undefined,
): PlantStage {
  if (userTurnCount === 1) return { key: "seed", asset: "seed" };
  if (userTurnCount === 2) return { key: "bud", asset: "bud" };
  // Turn 3+: alternate bud / water
  return prevStage === "bud" || prevStage === "seed"
    ? { key: "water", asset: "water" }
    : { key: "bud", asset: "bud" };
}

function deriveCanBloom(
  flowState: FlowState,
  userTurnCount: number,
): boolean {
  if (flowState === "resonance") return true;
  if (flowState === "conversation" && userTurnCount >= 2) return true;
  if (flowState === "listening" && userTurnCount >= 3) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Bloom: generate recommendations via LLM
// ---------------------------------------------------------------------------

const BLOOM_SYSTEM_PROMPT = `你是一个温柔、有文学感知力的助手。你会阅读一段用户与AI的疗愈对话，然后生成一个"开花记忆"。

请严格输出 JSON 对象（不要 markdown 包裹），格式如下：

{
  "title": "一句话标题（10字内，有画面感，不要用'开花'字眼）",
  "dialogueSummary": "对话总结（60字内，概括用户说了什么、AI如何回应）",
  "userOneSentence": "替用户提炼一句话感受（用'我'开头，15字内）",
  "recommendations": [
    { "title": "作品名（书/电影/歌词/台词片段名）", "reason": "为什么推荐（30字内，贴合用户处境）" }
  ]
}

规则：
- 只输出 JSON，不要任何解释
- recommendations 2-3 条
- 不要虚构不存在的作品，推荐经典、有共鸣的作品
- reason 要具体贴合用户的处境，不要泛泛而谈`;

async function generateBloom(session: SessionData): Promise<MemoryDraft> {
  const userMessages = session.messages.filter((m) => m.role === "user");
  const dialogueText = session.messages
    .map((m) => `${m.role === "user" ? "用户" : "AI"}：${m.content}`)
    .join("\n");

  const prompt = [
    "以下是一段疗愈对话，请根据它生成开花记忆：",
    "",
    dialogueText,
    "",
    "请输出 JSON。",
  ].join("\n");

  const messages = [
    { role: "system" as const, content: BLOOM_SYSTEM_PROMPT },
    { role: "user" as const, content: prompt },
  ];

  try {
    const raw = await chatCompletions(messages, {
      temperature: 0.7,
      maxTokens: 800,
    });
    return parseBloomJson(raw);
  } catch {
    // Fallback: build from raw conversation
    const lastUser =
      userMessages[userMessages.length - 1]?.content ?? "我想把这段感受先安放在这里。";
    return {
      title: lastUser.slice(0, 18) + (lastUser.length > 18 ? "..." : ""),
      dialogueSummary: userMessages
        .map((m) => m.content)
        .join("；")
        .slice(0, 120),
      userOneSentence: lastUser.slice(0, 40),
      recommendations: [
        {
          title: lastUser.slice(0, 18) + (lastUser.length > 18 ? '...' : ''),
          reason: (pickRecs(1)[0]?.healing_logic || '').slice(0, 80),
        },
      ],
    };
  }
}

function parseBloomJson(raw: string): MemoryDraft {
  // Strip markdown fences
  let json = raw.trim();
  const fence = json.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) json = fence[1].trim();

  const parsed = JSON.parse(json) as Record<string, unknown>;

  const recommendations = (Array.isArray(parsed.recommendations)
    ? parsed.recommendations
    : []
  ) as Array<Record<string, unknown>>;

  return {
    title: String(parsed.title ?? "一次倾诉").slice(0, 30),
    dialogueSummary: String(parsed.dialogueSummary ?? "").slice(0, 180),
    userOneSentence: String(parsed.userOneSentence ?? "").slice(0, 80),
    recommendations: recommendations.slice(0, 3).map((r) => ({
      title: String(r.title ?? "").slice(0, 60),
      reason: String(r.reason ?? "").slice(0, 80),
    })),
  };
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();
app.use(express.json());

// Serve garden-ui static files from project root (disable browser cache for dev)
const uiPath = join(__dirname, "..", "garden-ui");
app.use(
  express.static(uiPath, {
    setHeaders: (res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    },
  }),
);

// CORS for dev
app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// Create session
app.post("/api/sessions", (_req: Request, res: Response) => {
  const session = createSession();
  res.json({
    sessionId: session.id,
    message: {
      role: "ai",
      content: "这里是一只空花盆。可以先把最近的烦恼放在这里，我会慢慢听你展开。",
    },
    plantStage: { key: "pot", asset: "pot" },
    canBloom: false,
  });
});

// Send message
app.post("/api/sessions/:id/chat", async (req: Request, res: Response) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "会话不存在" });
    return;
  }

  const { content } = req.body as { content?: string };
  if (!content?.trim()) {
    res.status(400).json({ error: "消息不能为空" });
    return;
  }

  // Append user message
  session.messages.push({ role: "user", content: content.trim() });

  // Build prompt + assess flow
  const { messages: payload, assessment } = buildChatPayload(session.messages);
  const { state: flowState, userTurnCount } = assessment;

  // Call LLM
  let reply: string;
  try {
    reply = await chatCompletions(payload, { temperature: 0.7, maxTokens: 512 });
  } catch (err) {
    console.error("LLM 调用失败:", err);
    reply = mockAssistantReply(session.messages, userTurnCount, flowState);
  }

  // Guard + fix
  const guard = guardResponse(reply, flowState);
  if (!guard.ok) {
    for (const v of guard.violations) console.warn(`[guard:${flowState}] ${v}`);
    reply = stripQuestionMarks(reply);
  }

  // Append AI response
  session.messages.push({ role: "assistant", content: reply });

  // Derive plant stage & canBloom
  const prevStage = derivePlantStageFromSession(session);
  const plantStage = derivePlantStage(userTurnCount, prevStage);
  const canBloom = deriveCanBloom(flowState, userTurnCount);

  res.json({
    reply,
    plantStage,
    canBloom,
    flowState,
    assessment: {
      userTurnCount,
      enteredViaNarrative: assessment.enteredViaNarrative,
      enteredViaQuestion: assessment.enteredViaQuestion,
    },
  });
});

function derivePlantStageFromSession(
  session: SessionData,
): PlantStage["key"] | undefined {
  // We track plant stage via a simple counter stored as part of the flow.
  // Derive from user turn count: turn 1 seed, turn 2 bud, rest alternate.
  // But we need the *previous* turn's stage. We can compute from turn-1.
  const userTurns = session.messages.filter((m) => m.role === "user").length - 1;
  if (userTurns === 0) return "pot";
  if (userTurns === 1) return "seed";
  if (userTurns === 2) return "bud";
  // alternate starting from bud
  return userTurns % 2 === 1 ? "bud" : "water";
}

// Bloom
app.post("/api/sessions/:id/bloom", async (req: Request, res: Response) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "会话不存在" });
    return;
  }

  const { userOneSentence } = (req.body ?? {}) as {
    userOneSentence?: string;
  };

  const draft = await generateBloom(session);

  // If user provided a custom one-liner, use it
  if (userOneSentence?.trim()) {
    draft.userOneSentence = userOneSentence.trim();
  }

  const memory = {
    id: `m_${Date.now()}`,
    title: draft.title,
    dialogueSummary: draft.dialogueSummary,
    userOneSentence: draft.userOneSentence,
    flowerType: "lily",
    flowerAsset: getFlowerImage("m_" + Date.now()),
    recommendations: draft.recommendations,
    createdAt: new Date().toISOString(),
  };

  res.json({ memory });
});

// List sessions (for debugging)
app.get("/api/sessions", (_req: Request, res: Response) => {
  const list = [...sessions.values()].map((s) => ({
    id: s.id,
    messageCount: s.messages.length,
    createdAt: s.createdAt,
  }));
  res.json(list);
});

// ---------------------------------------------------------------------------

// Complete interaction: save memory to persistent store
app.post("/api/sessions/:id/complete", (req: Request, res: Response) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  const { memory } = req.body || {};
  if (!memory || !memory.title) {
    res.status(400).json({ error: "Invalid memory data" });
    return;
  }

  addMemoryRecord({
    id: memory.id || ("m_" + Date.now()),
    title: memory.title,
    dialogueSummary: memory.dialogueSummary || "",
    userOneSentence: memory.userOneSentence || "",
    flowerType: memory.flowerType || "lily",
    flowerAsset: memory.flowerAsset || "./assets/memory/lily-card-flower.png",
    recommendations: memory.recommendations || [],
    createdAt: memory.createdAt || new Date().toISOString(),
  });

  console.log("  Memory saved:", memory.title);
  res.json({ ok: true });
});

// Get all memories
app.get("/api/memories", (req: Request, res: Response) => {
  const memories = loadMemories();
  res.json(memories);
});

// Start
// ---------------------------------------------------------------------------

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;


// Mock assistant reply for when no API key is configured
function mockAssistantReply(messages: ChatMessage[], turnCount: number, flowState: string): string {
  // Extract the last few user messages for context
  const userMsgs = messages.filter(m => m.role === "user").map(m => m.content);
  const lastMsg = userMsgs[userMsgs.length - 1] || "";
  const secondLast = userMsgs[userMsgs.length - 2] || "";

  // Use flow state to determine response style
  const isListening = flowState === "listening";
  const isResonance = flowState === "resonance";

  // Responses for listening phase (state 1) - warm, open-ended, no metaphors
  const listeningReplies = [
    `嗯，你提到${lastMsg.slice(0, 15)}…我听到了。还有吗？你可以继续说，我在这儿。`,
    `这种感觉不轻松。谢谢你愿意说出来。`,
    `嗯，我明白了。这件事听上去确实让人不好受。`,
    `是这样啊…你愿意多说一点吗？`,
  ];

  // Responses for resonance phase (state 2) - deeper, with metaphors
  const resonanceReplies = [
    `听起来这件事不只是表面那么简单。${secondLast ? "从" + secondLast.slice(0, 10) + "到这" : "这"}里有一种被慢慢压住的感觉，像一层一层叠起来。`,
    `我能感觉到你在那情境里的位置——不是旁观者，是身在其中的人。`,
    `你给自己留了这个空间来说这些，这本身就很不容易。`,
    `这种感觉像不像你明明在往前走，但有些东西一直挂在肩上？`,
  ];

  // Bloom-ready responses
  const readyReplies = [
    `到这里，这朵花已经有了自己的形状。你可以继续补充，也可以把它整理成花。`,
    `我能感觉到这朵花已经准备好了。整理成花的按钮就在那里，你自己决定什么时候绽放。`,
  ];

  // Select based on flow state and turn count
  let pool;
  if (turnCount >= 4 && Math.random() < 0.4) {
    pool = readyReplies;
  } else if (isResonance || turnCount >= 3) {
    pool = resonanceReplies;
  } else {
    pool = listeningReplies;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

const apiKey = process.env.LLM_API_KEY || process.env.OPENAI_API_KEY;

// API key check for startup message

app.listen(PORT, () => {
  console.log(`\n🌡  Garden server started -> http://localhost:${PORT}`);
  console.log(`    UI path -> http://localhost:${PORT}/index.html`);
  if (!apiKey) {
    console.log(`    ⚠ No LLM_API_KEY found, running in local mock mode`);
    console.log(`       Set LLM_API_KEY in .env to enable real AI responses\n`);
  } else {
    console.log(`    ✅ LLM configured, real AI responses enabled\n`);
  }
});