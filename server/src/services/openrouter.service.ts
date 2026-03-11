import axios from 'axios';
import { env } from '@config/env';
import { OpenRouterRequest, OpenRouterResponse, OpenRouterContent, OpenRouterImageConfig, OpenRouterUsage } from '../types/ai.types';

type ImageSize = NonNullable<OpenRouterImageConfig['image_size']>;

const resolveOutputSize = (): ImageSize => '2K';

const MODEL_ID = 'google/gemini-3.1-flash-image-preview';
const INPUT_COST_PER_TOKEN = 0.50 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 3.00 / 1_000_000;

const computeCost = (promptTokens: number, completionTokens: number): number =>
  promptTokens * INPUT_COST_PER_TOKEN + completionTokens * OUTPUT_COST_PER_TOKEN;

export interface GenerateVariationsResult {
  images: string[];
  model: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_cost: number };
}

const TEXT_PRESERVATION =
  "CRITICAL — Product integrity: DO NOT modify the product itself. The product image, including its shape, label, and ALL text on it, must remain exactly 100% identical to the input. DO NOT alter, rewrite, guess, blur, or reconstruct the product's text. Treat the product as a fixed, untouchable layer. Only change the background and surrounding elements.";

const MARKETING_STYLE =
  "Output must be a MARKETING GRAPHIC: clean, designed ad layout. Use solid or gradient backgrounds — NO blurred rooms, furniture, or environmental clutter. Prefer graphic-style compositions with headline, benefits, or CTA when fitting. People are OPTIONAL: sometimes include zero people, sometimes one, sometimes a group, decided randomly. No unrelated objects. " +
  TEXT_PRESERVATION;

const BASE_PROMPT_WITH_REFS =
  "You receive two groups of images. FIRST: product(s) to showcase. SECOND: creative references (ads) for INSPIRATION ONLY. Do NOT copy, replicate, or paste elements from the references. Use them only as loose inspiration for mood, color palette, and composition ideas. Create something NEW and original. The product(s) must remain the hero. Each output must be distinctly different. " +
  MARKETING_STYLE;

const BASE_PROMPT_NO_REFS =
  "You receive product(s) to showcase. Create creative ad variations. The product(s) must remain the hero. Each output must be distinctly different. Be original and inventive. " +
  MARKETING_STYLE;

const FUSION_HINT =
  " When multiple products are provided, merge them CREATIVELY: one product can adopt the colors, design, or style of another. Create a cohesive creative ensemble — not just placing them side by side.";

const CREATIVE_DIRECTIONS = [
  "Focus: TOFU (Top of funnel — awareness). Soft gradient or solid background. Optional headline. No hard sell. Aspirational mood.",
  "Focus: MOFU (Middle of funnel — consideration). Graphic layout. Clean background with 2–4 benefit icons or short lines. Focus on value props.",
  "Focus: BOFU (Bottom of funnel — conversion). Bold CTA, promo badge, or offer. Dark or rich solid background.",
  "Focus: Creative mix. Premium graphic ad. Headline + benefits + CTA. Gradient or solid background.",
  "Focus: Storytelling. Showcase the product in a dynamic, highly graphical way with abstract geometric shapes.",
  "Focus: Minimalist. Extremely clean, lots of negative space, focus entirely on the product's premium feel.",
];

const buildPrompt = (creativeDirection: string, fusion: boolean, hasReferences: boolean): string => {
  const base = hasReferences ? BASE_PROMPT_WITH_REFS : BASE_PROMPT_NO_REFS;
  // Add dynamic random assignment for people to ensure variety across any number of generations
  const peopleOptions = [
    "Do NOT include any people.",
    "Include a single person interacting with the product.",
    "Include a couple or duo.",
    "Include a diverse group or family."
  ];
  const randomPeople = peopleOptions[Math.floor(Math.random() * peopleOptions.length)];
  
  const parts = [base, creativeDirection, `Human presence constraint for this specific image: ${randomPeople}`];
  if (fusion) parts.push(FUSION_HINT);
  return parts.join(" ");
};

export const openrouterService = {
  generateVariations: async (
    productBase64: string[],
    referenceBase64: string[],
    count: number = 1,
    maxInputDimension: number = 1024,
    fusion: boolean = false,
    variationIndex?: number
  ): Promise<GenerateVariationsResult> => {
    const outputSize = resolveOutputSize();

    const hasReferences = referenceBase64.length > 0;
    const buildPayload = (creativeDirection: string) => {
      const textPrompt = buildPrompt(creativeDirection, fusion, hasReferences);
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
        system: "You are a helpful assistant that generates marketing graphics for products. You are given a product and a set of references, and you need to generate a marketing graphic for the product. You are also given a creative direction, and you need to generate a marketing graphic for the product that matches the creative direction. You are also given a human presence constraint, and you need to generate a marketing graphic for the product that matches the human presence constraint."
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
      const indices = variationIndex !== undefined ? [variationIndex] : Array.from({ length: count }, (_, i) => i);
      const promises = indices.map((i) => generateSingle(i));
      
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
