import { DEFAULT_OPENROUTER_EMBEDDING_MODELS, getCopilotConfig } from "./config.ts";

function normalizeVector(vec: number[]): number[] {
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0 || !Number.isFinite(norm)) return vec;
  return vec.map((val) => Number((val / norm).toFixed(6)));
}

function adjustVectorDimensions(vec: number[], targetDim: number): number[] {
  if (vec.length === targetDim) {
    return normalizeVector(vec);
  }
  if (vec.length > targetDim) {
    // Matryoshka truncation for models returning higher dimensions (e.g., 2048 -> 1024)
    return normalizeVector(vec.slice(0, targetDim));
  }
  // Zero-padding for lower dimensions
  const padded = [...vec, ...new Array(targetDim - vec.length).fill(0)];
  return normalizeVector(padded);
}

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
        return adjustVectorDimensions(vector, config.embeddingDimensions);
      }
    } catch {
      continue;
    }
  }

  return null;
}
