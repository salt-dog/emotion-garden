export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * 从环境变量读取模型配置。
 * 支持 LLM_* 或 OPENAI_*（与多数 SDK 习惯兼容）。
 */
export function loadLlmConfig(): LlmConfig {
  const apiKey =
    process.env.LLM_API_KEY?.trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    "";

  const baseUrl = trimTrailingSlash(
    process.env.LLM_BASE_URL?.trim() ||
      process.env.OPENAI_BASE_URL?.trim() ||
      "https://api.zetatechs.com/v1",
  );

  const model =
    process.env.LLM_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o-mini";

  if (!apiKey) {
    throw new Error(
      "未配置 API Key。请在项目根目录创建 .env，设置 LLM_API_KEY=sk-...（可参考 .env.example）",
    );
  }

  return { apiKey, baseUrl, model };
}
