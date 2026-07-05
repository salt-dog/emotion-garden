import type { ChatMessage, RichnessAssessment } from "./types.js";

/** 叙述型用词：有具体情境，而非纯情绪词 */
const NARRATIVE_MARKERS = [
  "今天",
  "昨天",
  "当时",
  "因为",
  "所以",
  "主管",
  "老板",
  "同事",
  "当众",
  "大家",
  "看着",
  "方案",
  "面试",
  "毕业",
  "觉得",
  "以为",
  "其实",
  "就是",
];

/** 自我暴露 / 委屈细节 */
const VULNERABILITY_MARKERS = [
  "丢人",
  "尴尬",
  "蠢",
  "废物",
  "没用",
  "配不上",
  "不被",
  "认可",
  "心累",
  "委屈",
  "崩溃",
  "睡不着",
  "找不到",
];

function countMeaningfulChars(text: string): number {
  return text.replace(/\s/g, "").length;
}

function countHits(text: string, markers: string[]): number {
  return markers.reduce((n, m) => (text.includes(m) ? n + 1 : n), 0);
}

/**
 * 判断用户是否「主动倒出了较完整的感受」。
 * 注意：这不是心理诊断，只衡量信息密度与叙述完整度。
 */
export function assessUserRichness(
  userText: string,
  _allUserTexts?: string[],
): RichnessAssessment {
  const charCount = countMeaningfulChars(userText);
  const narrativeHits = countHits(userText, NARRATIVE_MARKERS);
  const vulnerabilityHits = countHits(userText, VULNERABILITY_MARKERS);
  const sentenceLike = (userText.match(/[。！；\n]/g) ?? []).length >= 1;
  const longEnough = charCount >= 72;
  const richEnough =
    charCount >= 48 &&
    narrativeHits >= 2 &&
    (vulnerabilityHits >= 1 || sentenceLike);

  const isDetailedNarrative =
    longEnough || (richEnough && vulnerabilityHits >= 1);

  let summary: string;
  if (isDetailedNarrative) {
    summary = `详细倾诉（约 ${charCount} 字，含具体情境与感受）`;
  } else if (charCount >= 36) {
    summary = `中等长度（约 ${charCount} 字），仍偏零碎`;
  } else {
    summary = `简略吐槽（约 ${charCount} 字）`;
  }

  return { charCount, isDetailedNarrative, summary };
}

export function getUserMessages(messages: ChatMessage[]): string[] {
  return messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean);
}

export function getLatestUserMessage(messages: ChatMessage[]): string {
  const users = getUserMessages(messages);
  return users[users.length - 1] ?? "";
}
