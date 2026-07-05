import type { FlowState, GuardResult } from "./types.js";

const QUESTION_MARK = /[?？]/;

/** 常见「前戏不足」素材痕迹 */
const CULTURE_MARKERS =
  /《[^》]{1,24}》|当幸福来敲门|心灵奇旅|肖申克的救赎|活着|小王子/;

const PSYCHOLOGY_TERMS =
  /灾难化|认知偏差|依恋|焦虑障碍|抑郁障碍|躯体化|反刍|心理症状|触发/;

const CONVERSATION_FILLER =
  /我在这儿听着|你想怎么聊都行|慢慢说|我接住你|我陪着你/;

/**
 * 对模型输出做红线校验（可在后处理或重试前调用）。
 */
export function guardResponse(
  text: string,
  state: FlowState,
): GuardResult {
  const violations: string[] = [];

  if (QUESTION_MARK.test(text)) {
    violations.push("包含问号，违反零提问原则");
  }

  if (PSYCHOLOGY_TERMS.test(text)) {
    violations.push("包含心理学专业表述");
  }

  if (state === "listening") {
    if (CULTURE_MARKERS.test(text)) {
      violations.push("状态一中出现文化素材或片名/书名");
    }
    const chars = text.replace(/\s/g, "").length;
    if (chars > 160) {
      violations.push(`状态一回复过长（约 ${chars} 字，建议 60 字左右）`);
    }
  } else if (state === "conversation") {
    const chars = text.replace(/\s/g, "").length;
    if (chars > 180) {
      violations.push(`状态二回复过长（约 ${chars} 字，建议自然但别写成长文）`);
    }
    if (CONVERSATION_FILLER.test(text)) {
      violations.push("状态二出现客服式陪聊空话");
    }
  }

  return { ok: violations.length === 0, violations };
}

/** 去掉问号，改为句号（兜底后处理） */
export function stripQuestionMarks(text: string): string {
  return text.replace(/[?？]+/g, "。");
}
