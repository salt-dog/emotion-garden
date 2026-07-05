import { loadLlmConfig, type LlmConfig } from "./llm-config.js";

export interface ChatCompletionMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  config?: LlmConfig;
  temperature?: number;
  maxTokens?: number;
  /** OpenAI 兼容：部分网关支持，可约束模型只输出 JSON */
  responseFormat?: { type: "json_object" };
}

/**
 * 调用 OpenAI 兼容的 POST /v1/chat/completions
 */
export async function chatCompletions(
  messages: ChatCompletionMessage[],
  options: ChatOptions = {},
): Promise<string> {
  const config = options.config ?? loadLlmConfig();
  const url = `${config.baseUrl}/chat/completions`;
  const requestBody = JSON.stringify({
    model: config.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 512,
    ...(options.responseFormat
      ? { response_format: options.responseFormat }
      : {}),
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: requestBody,
  });

  const body = (await res.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!res.ok) {
    const msg = body.error?.message ?? res.statusText;
    throw new Error(`模型请求失败 (${res.status}): ${msg}`);
  }

  const content = body.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("模型返回为空");
  }

  return content;
}

/**
 * 流式调用 OpenAI 兼容的 POST /v1/chat/completions，逐 token 产出。
 * 用于对话交互场景，让用户看到实时生成的内容，消除等待体感。
 *
 * 注意：stream 模式与 response_format: json_object 通常不兼容，
 * 若同时传入会忽略 responseFormat，仅以纯文本流式返回。
 */
export async function* chatCompletionsStream(
  messages: ChatCompletionMessage[],
  options: ChatOptions = {},
): AsyncGenerator<string, void, undefined> {
  const config = options.config ?? loadLlmConfig();
  const url = `${config.baseUrl}/chat/completions`;

  const body: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 512,
    stream: true,
  };

  // stream + json_object 同时开启不被多数网关支持，仅在不冲突时传入
  if (options.responseFormat && !body.stream) {
    body.response_format = options.responseFormat;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const errBody = (await res.json()) as { error?: { message?: string } };
      msg = errBody?.error?.message ?? msg;
    } catch {
      // 无法解析错误体时保留 statusText
    }
    throw new Error(`模型请求失败 (${res.status}): ${msg}`);
  }

  if (!res.body) {
    throw new Error("响应体为空，无法流式读取");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // 最后一段可能为不完整的行，保留到下次拼接
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") return;

        try {
          const parsed = JSON.parse(data) as {
            error?: { message?: string };
            choices?: Array<{ delta?: { content?: string } }>;
          };

          if (parsed.error) {
            throw new Error(
              `模型流式错误: ${parsed.error.message ?? JSON.stringify(parsed.error)}`,
            );
          }

          const content = parsed?.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // 若错误已在上面抛出则继续传播
          if (e instanceof Error && e.message.startsWith("模型流式错误")) throw e;
          // 其余无法解析的行跳过（非致命）
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
