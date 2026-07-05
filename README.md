# 渐进式知己（Progressive Confidant）

**一条随多轮对话自然流动的管线**——不做「日常吐槽 / 心理症状」意图分流，不在前两轮「精准诊断」。

## 设计要点

| 旧思路（已废弃） | 新思路 |
|----------------|--------|
| 意图开关、双链路 | 单一管线，按轮次 + 信息丰富度递进 |
| 一两句话就判定认知偏差 | 先垫话，等用户**自己**倒出完整故事 |
| 突然贤者模式甩金句 | 状态二才允许顺口提起一条素材 |

### 状态一 · 倾听垫话

- 默认：用户前 **3** 轮发言
- 行为：40–60 字大白话，**零**电影/歌词/哲理，**零**问号
- 即使用户说得很严重，也先接住情绪，不越级

### 状态二 · 隐喻托抱

- 触发：用户**主动**给出较完整的情节 + 感受（约 ≥72 字或情境词 + 委屈细节）
- 与轮次无关：第 1 轮若就是长段倾诉，也可进入状态二
- 行为：可带入至多一条文化素材，仍禁止问号与心理学术语

## 快速接入

```ts
import { buildChatPayload, guardResponse, stripQuestionMarks } from "progressive-confidant";
import materials from "./data/materials.json";

const history = [
  { role: "user", content: "今天上班又被骂了，心累。" },
];

const { messages, assessment } = buildChatPayload(history, { materials });

// messages[0] 为完整 system prompt（含本回合流动状态注入）
// 将 messages 发给 OpenAI / Claude / 自建模型 API

const reply = await callLLM(messages);
const cleaned = stripQuestionMarks(reply);
const { ok, violations } = guardResponse(cleaned, assessment.state);
if (!ok) {
  // 可选：带 violations 重试一轮，或强制截断/改写
}
```

## 目录

- `prompts/system.md` — 人格与红线（运行时块由代码注入）
- `src/flow-state.ts` — 流动状态判定
- `src/richness.ts` — 信息丰富度（非心理诊断）
- `src/prompt-builder.ts` — 组装 system prompt
- `src/response-guard.ts` — 输出红线校验
- `data/materials.sample.json` — 文化素材库示例（精简 `CulturalMaterial` 形态）
- `data/rag-materials.seed.json` — RAG 全字段示例（与生成脚本输出同结构）
- `prompts/material-extractor.md` — 批量生成素材时用的「提取器」系统提示词

## RAG 素材库自动生成

仓库内已接好 **提取器提示词 → OpenAI 兼容 Chat Completions → JSON 校验 → 写入文件** 的小流水线，字段与你定义的 `RagMaterial` 一致（`theme_category`、`trigger_scene`、`core_vulnerability`、`raw_quote`、`healing_logic`）。

1. 配置好根目录 `.env`（与 `npm run chat` 相同：`LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL`）。
2. 执行：

```bash
npm run generate-rag -- --theme=职场与学业 --count=5
```

常用参数：

| 参数 | 说明 |
|------|------|
| `--theme=` | 必填，五大板块之一（与 `THEME_CATEGORIES` 一致） |
| `--count=` | 条数，默认 `5`，上限 `30` |
| `--scenes=` | 可选，多个场景用 `\|` 分隔，例如 `方案被否\|怕毕不了业` |
| `--out=` | 输出路径，默认 `data/rag-materials.generated.json` |
| `--merge` | 与 `--out` 指向的已有文件合并（按 `title`+`raw_quote` 去重） |
| `--no-json-mode` | 关闭 `response_format: json_object`（部分自建网关不支持时加） |
| `--dry-run` | 只打印预览，不写文件 |

生成结果接入编排层：将 JSON 读为 `RagMaterial[]`，对用户最新一轮用 `rankRagMaterials(userText, ragList)` 粗排，再 `toPromptMaterials(命中项)` 转成 `buildChatPayload` 所需的 `CulturalMaterial[]` 即可（与 README 顶部「可替换为你的向量检索，接口保持不变」一致）。

## 配置 API Key 与 Base URL

在项目根目录（与 `package.json` 同级）：

```bash
# 1. 复制模板
copy .env.example .env    # Windows
# cp .env.example .env    # macOS / Linux

# 2. 编辑 .env，填入三项
```

| 变量 | 说明 | 示例 |
|------|------|------|
| `LLM_API_KEY` | 服务商提供的 Key | `sk-...` |
| `LLM_BASE_URL` | OpenAI 兼容接口根路径，**含 `/v1`** | `https://api.openai.com/v1` |
| `LLM_MODEL` | 模型名 | `gpt-4o-mini` |

也支持 `OPENAI_API_KEY` / `OPENAI_BASE_URL` / `OPENAI_MODEL`（与常见 SDK 一致）。

**常见 Base URL：**

| 服务商 | `LLM_BASE_URL` |
|--------|----------------|
| OpenAI | `https://api.openai.com/v1` |
| DeepSeek | `https://api.deepseek.com/v1` |
| 通义（DashScope 兼容模式） | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| 本地 Ollama | `http://127.0.0.1:11434/v1` |

代码读取位置：`src/llm-config.ts` → `loadLlmConfig()`；请求封装在 `src/llm-client.ts`。

## 怎么验证

分两层：**不花钱的编排逻辑** + **真实模型端到端**。

### ① 编排逻辑（不调 API）

```bash
cd C:\Users\Lenovo\progressive-confidant
npm install
npm run verify
```

自动检查：首轮短吐槽 → 状态一；严重但短 → 仍状态一；长段倾诉 → 状态二；红线校验等。

再看各场景注入的 prompt 片段：

```bash
npm run demo
```

### ② 真实模型回复（需 `.env`）

```bash
npm run chat
# 或指定场景
npm run chat -- --scenario=short
npm run chat -- --scenario=severe
npm run chat -- --scenario=long
```

终端会打印：**编排判定**（状态/轮次/密度）→ **模型回复** → **红线是否通过**。  
用来肉眼确认：短场景不该出现《片名》；长场景可以自然带一句素材。

### ③ 多轮真实对话模拟（交互式）

```bash
npm run live
```

启动后可直接连续输入，脚本会带着**完整历史**调用模型，更接近真实聊天流。

可用命令：

- `/sample short`：注入简短吐槽样例
- `/sample severe`：注入严重但简短样例
- `/sample long`：注入长段倾诉样例
- `/history`：查看当前对话历史
- `/reset`：清空当前会话
- `/exit`：退出

也支持调温度：

```bash
node examples/live-chat.mjs --temperature=0.9
```

## 本地演示（仅 prompt 预览）

```bash
cd progressive-confidant
npm install
npm run demo
```

## 调参

- `DEFAULT_LISTENING_TURNS`（默认 3）：前几轮强制垫话
- `richness.ts` 中字数与 `NARRATIVE_MARKERS`：控制何时视为「详细倾诉」
- 素材匹配为关键词粗排，可替换为你的向量检索，**接口保持不变**

## 与产品的关系

编排层只负责：**本回合该用什么陪伴强度**。  
「像不像老朋友」仍取决于基座模型 + `prompts/system.md`；本库避免模型在后台「算计用户该走哪条链路」。
