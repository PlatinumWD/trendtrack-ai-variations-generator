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

const BASE_PROMPT = "You receive images. Identify which are products and which are supports or contexts. When multiple products are provided, merge them CREATIVELY: one product can adopt the colors, design, or style of another (e.g. a wallet taking the colors of a card). Create a cohesive creative ensemble with a creative rendering around it — not just placing them side by side. Place onto supports seamlessly. Products must remain the hero. Infer roles from the images — no order assumed.";

const STYLE_HINTS = [
  "Create a lifestyle shot: all products together in real-world use (equipment, kitchen, accessories). Professional, aspirational. No text overlays.",
  "Create a conceptual marketing creative: all products centered in a creative arrangement. Add a compelling headline and a CTA button. Editorial, brand-forward style.",
  "Create an e-commerce promo ad: all products with promotional elements — discount badge, gift offer, short promo copy. Dark or rich background. Conversion-focused.",
  "Create a clean product shot: all products in a minimalist setup, premium lighting. Elegant, high-end. Optional subtle tagline.",
];

const buildPrompt = (styleHint: string, promptAddition?: string): string => {
  const parts = [BASE_PROMPT, styleHint];
  if (promptAddition) parts.push(promptAddition);
  return parts.join(" ");
};

export const openrouterService = {
  generateVariations: async (base64Images: string[], promptAddition?: string, count: number = 1, maxInputDimension: number = 1024): Promise<GenerateVariationsResult> => {
    const outputSize = resolveOutputSize(maxInputDimension);

    const buildPayload = (styleHint: string) => {
      const textPrompt = buildPrompt(styleHint, promptAddition);
      const content: OpenRouterContent[] = [{ type: 'text', text: textPrompt }];
      for (const base64Image of base64Images) {
        content.push({ type: 'image_url', image_url: { url: base64Image } });
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
      const styleHint = STYLE_HINTS[index % STYLE_HINTS.length];
      const payload = buildPayload(styleHint);
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
