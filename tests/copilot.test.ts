import { describe, expect, it } from "vitest";
import { COPILOT_TOOLS } from "../lib/copilot/tools";
import { DEFAULT_OPENROUTER_MODELS, DEFAULT_OPENROUTER_EMBEDDING_MODELS, getCopilotConfig } from "../lib/copilot/config";

describe("MACM Helper Copilot", () => {
  it("defines required tool definitions and parameter schemas", () => {
    const toolNames = COPILOT_TOOLS.map((t) => t.function.name);
    expect(toolNames).toContain("search_studio_knowledge");
    expect(toolNames).toContain("configure_estimator");
    expect(toolNames).toContain("open_sample_preview");
    expect(toolNames).toContain("scroll_to_section");
    expect(toolNames).toContain("prefill_enquiry_form");
    expect(toolNames).toContain("get_booking_schedule");

    const estimatorTool = COPILOT_TOOLS.find((t) => t.function.name === "configure_estimator");
    expect(estimatorTool?.function.parameters).toBeDefined();

    const searchTool = COPILOT_TOOLS.find((t) => t.function.name === "search_studio_knowledge");
    expect(searchTool?.function.parameters).toBeDefined();
  });

  it("prioritizes updated free models and includes openrouter/free as the final fallback", () => {
    expect(DEFAULT_OPENROUTER_MODELS[0]).toBe("nvidia/nemotron-3.5-lightning:free");
    expect(DEFAULT_OPENROUTER_MODELS).toContain("poolside/laguna-xs-2.1:free");
    expect(DEFAULT_OPENROUTER_MODELS).toContain("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free");
    expect(DEFAULT_OPENROUTER_MODELS).toContain("google/gemma-4-26b-a4b-it:free");
    expect(DEFAULT_OPENROUTER_MODELS[DEFAULT_OPENROUTER_MODELS.length - 1]).toBe("openrouter/free");
  });

  it("configures OpenRouter free embedding models", () => {
    expect(DEFAULT_OPENROUTER_EMBEDDING_MODELS).toContain("liquid/lfm-2.5-embedding-350m:free");
    expect(DEFAULT_OPENROUTER_EMBEDDING_MODELS).toContain("nvidia/nemotron-3-embed-1b:free");
    expect(DEFAULT_OPENROUTER_EMBEDDING_MODELS).toContain("nvidia/llama-nemotron-embed-vl-1b-v2:free");
  });

  it("loads copilot configuration with proper defaults", () => {
    delete process.env.OPENROUTER_MODELS;
    delete process.env.EMBEDDING_MODEL_NAME;
    delete process.env.EMBEDDING_DIMENSIONS;
    const config = getCopilotConfig();
    expect(config.models).toEqual([...DEFAULT_OPENROUTER_MODELS]);
    expect(config.openRouterBaseUrl).toBe("https://openrouter.ai/api/v1");
    expect(config.embeddingModel).toBe("liquid/lfm-2.5-embedding-350m:free");
    expect(config.embeddingDimensions).toBe(1024);
  });

  it("supports custom model chains via environment variable", () => {
    process.env.OPENROUTER_MODELS = "custom/model-1,custom/model-2";
    const config = getCopilotConfig();
    expect(config.models).toEqual(["custom/model-1", "custom/model-2"]);
    delete process.env.OPENROUTER_MODELS;
  });
});
