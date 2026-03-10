import axios from 'axios';
import { env } from '@config/env';
import { OpenRouterRequest, OpenRouterResponse, OpenRouterContent, OpenRouterImageConfig, OpenRouterUsage } from '../types/ai.types';

type ImageSize = NonNullable<OpenRouterImageConfig['image_size']>;

const resolveOutputSize = (maxInputDimension: number): ImageSize => {
  if (maxInputDimension <= 512) return '1K';
  if (maxInputDimension <= 1024) return '1K';
  if (maxInputDimension <= 2048) return '2K';
  return '2K';
};

const MODEL_ID = 'google/gemini-2.5-flash-image';
const INPUT_COST_PER_TOKEN = 0.30 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 2.50 / 1_000_000;

const computeCost = (promptTokens: number, completionTokens: number): number =>
  promptTokens * INPUT_COST_PER_TOKEN + completionTokens * OUTPUT_COST_PER_TOKEN;

export interface GenerateVariationsResult {
  images: string[];
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_cost: number };
}

const BASE_PROMPT = "You receive two groups of images. FIRST: product(s) to showcase. SECOND: creative references (ads) for INSPIRATION ONLY. Do NOT copy, replicate, or paste elements from the references. Use them only as loose inspiration for mood, color palette, and composition ideas. Create something NEW and original. The product(s) must remain the hero. Each output must be distinctly different.";

const FUSION_HINT = " When multiple products are provided, merge them CREATIVELY: one product can adopt the colors, design, or style of another. Create a cohesive creative ensemble — not just placing them side by side.";

const CREATIVE_DIRECTIONS = [
  "Create a completely original creative: draw inspiration from the references for mood only, but invent a fresh layout. Surprise the viewer. Avoid copying any element from the references.",
  "Create a radically different creative: take one idea from the references (e.g. a color or composition) and reinterpret it in your own way. The result must look nothing like the references.",
  "Create a bold, unexpected creative: subvert the references. If they are minimal, go rich. If they are dark, go light. Make it distinctly yours.",
  "Create a unique creative: mix influences from the references with entirely new ideas. The final image must be original and unrecognizable from the source references.",
];

const buildPrompt = (creativeDirection: string, fusion: boolean): string => {
  const parts = [BASE_PROMPT, creativeDirection];
  if (fusion) parts.push(FUSION_HINT);
  return parts.join(" ");
};

export const openrouterService = {
  generateVariations: async (
    productBase64: string[],
    referenceBase64: string[],
    count: number = 1,
    maxInputDimension: number = 1024,
    fusion: boolean = false
  ): Promise<GenerateVariationsResult> => {
    const outputSize = resolveOutputSize(maxInputDimension);

    const buildPayload = (creativeDirection: string) => {
      const textPrompt = buildPrompt(creativeDirection, fusion);
      const content: OpenRouterContent[] = [{ type: 'text', text: textPrompt }];
      for (const url of productBase64) {
        content.push({ type: 'image_url', image_url: { url } });
      }
      for (const url of referenceBase64) {
        content.push({ type: 'image_url', image_url: { url } });
      }
      return {
        model: MODEL_ID,
        messages: [{ role: 'user', content }],
        modalities: ['image', 'text'],
        max_tokens: 512,
        image_config: { image_size: outputSize },
      };
    };

    const MAX_RETRIES = 2;

    const generateSingle = async (index: number): Promise<{ image: string | null; usage: OpenRouterUsage }> => {
      const creativeDirection = CREATIVE_DIRECTIONS[index % CREATIVE_DIRECTIONS.length];
      const payload = buildPayload(creativeDirection);
      const headers = {
        'Authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': env.CLIENT_URL,
        'X-Title': 'AI Product Image Variations App'
      };

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const response = await axios.post<OpenRouterResponse>(
          'https://openrouter.ai/api/v1/chat/completions',
          payload as OpenRouterRequest,
          { headers }
        );

        const usage = response.data.usage || {};
        const choices = response.data.choices;
        let image: string | null = null;
        if (choices && choices.length > 0) {
          const message = choices[0].message;
          if (message.images && message.images.length > 0) {
            const url = message.images[0].image_url?.url || message.images[0].imageUrl?.url;
            if (url) image = url;
          }
        }
        if (image) return { image, usage };
        if (attempt < MAX_RETRIES) {
          console.warn(`OpenRouter returned no image for variation ${index + 1}, retry ${attempt + 1}/${MAX_RETRIES}`);
        }
      }
      return { image: null, usage: {} };
    };

    try {
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(generateSingle(i));
      }
      
      const results = await Promise.all(promises);
      const generatedBase64Images = results
        .map(r => r.image)
        .filter((url): url is string => url !== null);
      
      const aggregatedUsage = results.reduce(
        (acc, r) => {
          const promptTokens = r.usage.prompt_tokens ?? 0;
          const completionTokens = r.usage.completion_tokens ?? 0;
          const apiCost = r.usage.total_cost ?? r.usage.cost ?? 0;
          const fallbackCost = apiCost > 0 ? apiCost : computeCost(promptTokens, completionTokens);
          return {
            prompt_tokens: acc.prompt_tokens + promptTokens,
            completion_tokens: acc.completion_tokens + completionTokens,
            total_cost: acc.total_cost + fallbackCost,
          };
        },
        { prompt_tokens: 0, completion_tokens: 0, total_cost: 0 }
      );
      
      return { images: generatedBase64Images, model: MODEL_ID, usage: aggregatedUsage };
    } catch (error: any) {
      console.error('OpenRouter API error:', error.response?.data || error.message);
      throw new Error('Failed to generate image variations via OpenRouter');
    }
  }
};
