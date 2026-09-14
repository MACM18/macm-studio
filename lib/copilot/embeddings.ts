import { DEFAULT_OPENROUTER_EMBEDDING_MODELS, getCopilotConfig } from "./config.ts";

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const config = getCopilotConfig();
  if (!config.embeddingApiKey) {
    return null;
  }

  const endpoint = config.embeddingApiUrl.endsWith("/embeddings")
    ? config.embeddingApiUrl
    : `${config.embeddingApiUrl.replace(/\/+$/, "")}/embeddings`;

  const modelsToTry = [
    config.embeddingModel,
    ...DEFAULT_OPENROUTER_EMBEDDING_MODELS.filter((m) => m !== config.embeddingModel),
  ];

  for (const model of modelsToTry) {
    try {
      const bodyPayload: Record<string, unknown> = {
        model,
        input: text.slice(0, 8000),
      };

      if (process.env.EMBEDDING_DIMENSIONS) {
        bodyPayload.dimensions = config.embeddingDimensions;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.embeddingApiKey}`,
          "HTTP-Referer": "https://macm.lk",
          "X-Title": "MACM Studio Copilot",
        },
        body: JSON.stringify(bodyPayload),
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        data?: Array<{ embedding?: number[] }>;
      };

      const vector = data.data?.[0]?.embedding;
      if (Array.isArray(vector) && vector.length > 0) {
        return vector;
      }
    } catch {
      continue;
    }
  }

  return null;
}
