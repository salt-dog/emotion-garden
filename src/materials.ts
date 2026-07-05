import type { CulturalMaterial } from "./types.js";

export const THEME_CATEGORIES = [
  "职场与学业",
  "存在与意义",
  "亲密与孤独",
  "精神内耗",
  "生活高光与小确幸",
] as const;

export type ThemeCategory = (typeof THEME_CATEGORIES)[number];

export interface RagMaterial {
  id: string | number;
  title: string;
  theme_category: ThemeCategory;
  trigger_scene: string;
  core_vulnerability: string;
  raw_quote: string;
  healing_logic: string;
}

export interface MaterialGenerationRequest {
  theme_category: ThemeCategory;
  count: number;
  focus_scenes: string[];
  special_constraints?: string[];
}

export interface MaterialSearchResult {
  material: RagMaterial;
  score: number;
  matchedFragments: string[];
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, "").toLowerCase();
}

function getBigrams(text: string): string[] {
  const normalized = normalizeText(text);
  const grams = new Set<string>();

  if (normalized.length < 2) {
    if (normalized) grams.add(normalized);
    return [...grams];
  }

  for (let i = 0; i < normalized.length - 1; i++) {
    grams.add(normalized.slice(i, i + 2));
  }
  return [...grams];
}

function includesFragment(haystack: string, needle: string): boolean {
  return normalizeText(haystack).includes(normalizeText(needle));
}

function splitKeywords(text: string): string[] {
  return text
    .split(/[、，,；;。/\n|]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => part.length >= 2 && part.length <= 16);
}

function inferMaterialType(title: string): CulturalMaterial["type"] {
  if (title.includes("电影")) return "movie";
  if (title.includes("歌词") || title.includes("乐队") || title.includes("歌")) return "lyric";
  if (title.includes("传")) return "quote";
  return "book";
}

function buildThemeKeywords(material: RagMaterial): string[] {
  const keywords = new Set<string>();

  keywords.add(material.theme_category);
  for (const keyword of splitKeywords(material.core_vulnerability)) {
    keywords.add(keyword);
  }
  for (const keyword of splitKeywords(material.trigger_scene)) {
    keywords.add(keyword);
  }

  return [...keywords].slice(0, 12);
}

export function validateRagMaterial(material: RagMaterial): string[] {
  const errors: string[] = [];

  if (!material.id && material.id !== 0) errors.push("缺少 id");
  if (!material.title?.trim()) errors.push("缺少 title");
  if (!THEME_CATEGORIES.includes(material.theme_category)) {
    errors.push(`theme_category 不合法: ${material.theme_category}`);
  }
  if (!material.trigger_scene?.trim()) errors.push("缺少 trigger_scene");
  if (!material.core_vulnerability?.trim()) errors.push("缺少 core_vulnerability");
  if (!material.raw_quote?.trim()) errors.push("缺少 raw_quote");
  if (!material.healing_logic?.trim()) errors.push("缺少 healing_logic");
  if (material.raw_quote && material.raw_quote.replace(/\s/g, "").length > 80) {
    errors.push("raw_quote 过长，建议控制在 40 字以内");
  }

  return errors;
}

export function validateRagMaterials(materials: RagMaterial[]): string[] {
  const errors: string[] = [];

  materials.forEach((material, index) => {
    const itemErrors = validateRagMaterial(material);
    for (const itemError of itemErrors) {
      errors.push(`第 ${index + 1} 条: ${itemError}`);
    }
  });

  return errors;
}

export function toPromptMaterials(materials: RagMaterial[]): CulturalMaterial[] {
  return materials.map((material) => ({
    id: String(material.id),
    type: inferMaterialType(material.title),
    title: material.title,
    excerpt: material.raw_quote,
    themes: buildThemeKeywords(material),
  }));
}

export function rankRagMaterials(
  query: string,
  materials: RagMaterial[],
  limit = 5,
): MaterialSearchResult[] {
  const queryText = normalizeText(query);
  const queryBigrams = getBigrams(query);

  const ranked = materials
    .map((material) => {
      const searchable = [
        material.title,
        material.theme_category,
        material.trigger_scene,
        material.core_vulnerability,
        material.raw_quote,
        material.healing_logic,
      ].join(" ");

      const searchText = normalizeText(searchable);
      let score = 0;
      const matchedFragments = new Set<string>();

      for (const gram of queryBigrams) {
        if (gram.length >= 2 && searchText.includes(gram)) {
          score += 1;
          matchedFragments.add(gram);
        }
      }

      if (includesFragment(material.trigger_scene, query)) {
        score += 10;
        matchedFragments.add("trigger_scene");
      }

      if (includesFragment(material.core_vulnerability, query)) {
        score += 8;
        matchedFragments.add("core_vulnerability");
      }

      if (queryText.includes(normalizeText(material.theme_category))) {
        score += 6;
        matchedFragments.add("theme_category");
      }

      return {
        material,
        score,
        matchedFragments: [...matchedFragments],
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}
