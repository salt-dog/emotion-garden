export type FlowState = "listening" | "conversation" | "resonance";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: MessageRole;
  content: string;
}

export interface RichnessAssessment {
  /** 本轮用户消息字数（去空白） */
  charCount: number;
  /** 是否像「详细倾诉」：情节 + 感受，而非一句带过 */
  isDetailedNarrative: boolean;
  /** 简要说明，写入 runtime 块供模型感知 */
  summary: string;
}

export interface FlowAssessment {
  state: FlowState;
  userTurnCount: number;
  richness: RichnessAssessment;
  /** 是否因用户本轮长叙述而进入共鸣（与轮次无关） */
  enteredViaNarrative: boolean;
  /** 是否因用户明确提问/交流请求而进入正常回应模式 */
  enteredViaQuestion: boolean;
}

export interface CulturalMaterial {
  id: string;
  type: "movie" | "book" | "lyric" | "quote";
  title: string;
  excerpt: string;
  /** 适合托住的脆弱点关键词，用于粗匹配 */
  themes: string[];
}

export interface BuildPromptOptions {
  materials?: CulturalMaterial[];
  maxMaterials?: number;
}

export interface GuardResult {
  ok: boolean;
  violations: string[];
}
