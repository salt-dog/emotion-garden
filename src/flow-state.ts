import { assessUserRichness, getLatestUserMessage, getUserMessages } from "./richness.js";
import type { ChatMessage, FlowAssessment } from "./types.js";

/** 前 N 轮用户发言默认只做垫话；但若用户主动长段倾诉，可提前进入状态二 */
export const DEFAULT_LISTENING_TURNS = 3;

const QUESTION_MARK = /[?？]/;
const DIRECT_QUESTION_MARKERS = [
  "怎么看",
  "怎么样",
  "看法",
  "你觉得",
  "你认为",
  "最喜欢",
  "哪一个",
  "哪个",
  "为什么",
  "是什么",
  "什么意思",
  "推荐",
  "介绍",
  "聊聊",
  "说说",
  "评价",
];

function isExplicitQuestion(text: string): boolean {
  if (!text.trim()) return false;
  if (QUESTION_MARK.test(text)) return true;
  return DIRECT_QUESTION_MARKERS.some((marker) => text.includes(marker));
}

/**
 * 渐进式流动判定：单一管线，按「轮次 + 信息丰富度」递进，不做意图分流。
 */
export function assessFlow(
  messages: ChatMessage[],
  options?: { listeningTurnCap?: number },
): FlowAssessment {
  const cap = options?.listeningTurnCap ?? DEFAULT_LISTENING_TURNS;
  const userTexts = getUserMessages(messages);
  const userTurnCount = userTexts.length;
  const latest = getLatestUserMessage(messages);
  const richness = assessUserRichness(latest, userTexts);
  const explicitQuestion = isExplicitQuestion(latest);

  // 用户主动倒出完整故事 → 水到渠成进入共鸣，与轮次无关
  if (richness.isDetailedNarrative) {
    return {
      state: "resonance",
      userTurnCount,
      richness,
      enteredViaNarrative: true,
      enteredViaQuestion: false,
    };
  }

  // 明确是在正常交流、询问看法或追问一个具体问题 → 直接回应
  if (explicitQuestion) {
    return {
      state: "conversation",
      userTurnCount,
      richness,
      enteredViaNarrative: false,
      enteredViaQuestion: true,
    };
  }

  // 前几轮：一律垫话，哪怕听起来很严重
  if (userTurnCount <= cap) {
    return {
      state: "listening",
      userTurnCount,
      richness,
      enteredViaNarrative: false,
      enteredViaQuestion: false,
    };
  }

  // 轮次已过，但用户仍只零碎吐槽 → 继续垫话，不强行上素材
  return {
    state: "listening",
    userTurnCount,
    richness,
    enteredViaNarrative: false,
    enteredViaQuestion: false,
  };
}
