export const DEFAULT_OPENROUTER_MODELS = [
  "openrouter/free",
  "poolside/laguna-xs-2.1:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-lightning:free",
] as const;

export const DEFAULT_OPENROUTER_EMBEDDING_MODELS = [
  "liquid/lfm-2.5-embedding-350m:free",
  "nvidia/nemotron-3-embed-1b:free",
  "nvidia/llama-nemotron-embed-vl-1b-v2:free",
] as const;

export interface CopilotConfig {
  openRouterApiKey: string | undefined;
  openRouterBaseUrl: string;
  models: string[];
  embeddingApiUrl: string;
  embeddingApiKey: string | undefined;
  embeddingModel: string;
  embeddingDimensions: number;
}

export function getCopilotConfig(): CopilotConfig {
  const customModels = process.env.OPENROUTER_MODELS
    ?.split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return {
    openRouterApiKey: process.env.OPENROUTER_API_KEY?.trim(),
    openRouterBaseUrl: process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1",
    models: customModels && customModels.length > 0 ? customModels : [...DEFAULT_OPENROUTER_MODELS],
    embeddingApiUrl: process.env.EMBEDDING_API_URL?.trim() || process.env.OPENROUTER_BASE_URL?.trim() || "https://openrouter.ai/api/v1",
    embeddingApiKey: process.env.EMBEDDING_API_KEY?.trim() || process.env.OPENROUTER_API_KEY?.trim(),
    embeddingModel: process.env.EMBEDDING_MODEL_NAME?.trim() || "liquid/lfm-2.5-embedding-350m:free",
    embeddingDimensions: Number(process.env.EMBEDDING_DIMENSIONS) || 1024,
  };
}
