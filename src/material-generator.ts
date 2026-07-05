import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chatCompletions, type ChatCompletionMessage, type ChatOptions } from "./llm-client.js";
import {
  type MaterialGenerationRequest,
  type RagMaterial,
  THEME_CATEGORIES,
  validateRagMaterials,
} from "./materials.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadMaterialExtractorPrompt(): string {
  const path = join(__dirname, "..", "prompts", "material-extractor.md");
  return readFileSync(path, "utf-8");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 从模型输出中解析 JSON：支持根为数组、或 { materials } / { items }。
 */
export function parseMaterialsPayload(content: string): unknown[] {
  const trimmed = content.trim();
  let parsed: unknown;

  const tryParse = (slice: string) => {
    parsed = JSON.parse(slice) as unknown;
  };

  try {
    tryParse(trimmed);
  } catch {
    const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) {
      tryParse(fence[1].trim());
    } else {
      const objStart = trimmed.indexOf("{");
      const objEnd = trimmed.lastIndexOf("}");
      if (objStart >= 0 && objEnd > objStart) {
        tryParse(trimmed.slice(objStart, objEnd + 1));
      } else {
        const arrStart = trimmed.indexOf("[");
        const arrEnd = trimmed.lastIndexOf("]");
        if (arrStart >= 0 && arrEnd > arrStart) {
          tryParse(trimmed.slice(arrStart, arrEnd + 1));
        } else {
          throw new Error("无法从模型输出中定位 JSON");
        }
      }
    }
  }

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (isRecord(parsed)) {
    const materials = parsed.materials ?? parsed.items;
    if (Array.isArray(materials)) {
      return materials;
    }
  }

  throw new Error("JSON 根须为数组，或含 materials / items 数组字段的对象");
}

function coerceThemeCategory(value: unknown): RagMaterial["theme_category"] | null {
  if (typeof value !== "string") return null;
  return (THEME_CATEGORIES as readonly string[]).includes(value)
    ? (value as RagMaterial["theme_category"])
    : null;
}

export function coerceRagMaterial(entry: unknown, fallbackIndex: number): RagMaterial | null {
  if (!isRecord(entry)) return null;

  const theme_category = coerceThemeCategory(entry.theme_category);
  if (!theme_category) return null;

  const id = entry.id;
  const title = typeof entry.title === "string" ? entry.title.trim() : "";
  const trigger_scene =
    typeof entry.trigger_scene === "string" ? entry.trigger_scene.trim() : "";
  const core_vulnerability =
    typeof entry.core_vulnerability === "string" ? entry.core_vulnerability.trim() : "";
  const raw_quote = typeof entry.raw_quote === "string" ? entry.raw_quote.trim() : "";
  const healing_logic =
    typeof entry.healing_logic === "string" ? entry.healing_logic.trim() : "";

  return {
    id: typeof id === "number" || typeof id === "string" ? id : `gen-${fallbackIndex}`,
    title,
    theme_category,
    trigger_scene,
    core_vulnerability,
    raw_quote,
    healing_logic,
  };
}

export function buildMaterialGenerationUserMessage(
  request: MaterialGenerationRequest,
): string {
  const lines = [
    "请根据系统提示中的角色与红线，生成文化心理素材。",
    "",
    `- **目标板块**：${request.theme_category}`,
    `- **生成条数**：${request.count}`,
  ];

  if (request.focus_scenes.length > 0) {
    lines.push("", "**须覆盖或贴近以下痛点 / 高光场景（可一条对应一类，勿重复堆砌同一情绪）：**");
    request.focus_scenes.forEach((scene, i) => {
      lines.push(`${i + 1}. ${scene}`);
    });
  }

  if (request.special_constraints?.length) {
    lines.push("", "**额外约束：**");
    request.special_constraints.forEach((c, i) => {
      lines.push(`${i + 1}. ${c}`);
    });
  }

  lines.push(
    "",
    `请严格输出 JSON 对象，且根字段 materials 数组长度必须等于 ${request.count}。`,
  );

  return lines.join("\n");
}

export interface GenerateRagMaterialsResult {
  materials: RagMaterial[];
  rawContent: string;
  validationErrors: string[];
}

/**
 * 调用 LLM 按提取器提示词批量生成 RAG 素材条目。
 */
export async function generateRagMaterials(
  request: MaterialGenerationRequest,
  options: ChatOptions & { useJsonObjectMode?: boolean } = {},
): Promise<GenerateRagMaterialsResult> {
  const system = loadMaterialExtractorPrompt();
  const user = buildMaterialGenerationUserMessage(request);

  const messages: ChatCompletionMessage[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  const useJson = options.useJsonObjectMode ?? true;
  const rawContent = await chatCompletions(messages, {
    ...options,
    temperature: options.temperature ?? 0.65,
    maxTokens: options.maxTokens ?? 4096,
    responseFormat: useJson ? { type: "json_object" } : undefined,
  });

  const entries = parseMaterialsPayload(rawContent);
  const materials = entries
    .map((entry, index) => coerceRagMaterial(entry, index + 1))
    .filter((m): m is RagMaterial => m !== null);

  const validationErrors = validateRagMaterials(materials);

  return { materials, rawContent, validationErrors };
}
