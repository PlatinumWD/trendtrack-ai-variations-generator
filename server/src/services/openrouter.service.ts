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

const BASE_PROMPT_NO_REFS =
  "You receive product(s) to showcase. Create creative ad variations. The product(s) must remain the hero. Each output must be distinctly different. Be original and inventive. " +
  MARKETING_STYLE;

const FUSION_HINT =
  " When multiple products are provided, merge them CREATIVELY: one product can adopt the colors, design, or style of another. Create a cohesive creative ensemble — not just placing them side by side.";

const buildPrompt = (fusion: boolean, hasReferences: boolean, visualDirection: string, index: number, userContext?: string): string => {
  const base = hasReferences
    ? "You receive two groups of images. FIRST: product(s) to showcase. SECOND: creative reference (ad). HIGHLY IMPORTANT: You MUST strongly draw inspiration from the reference for layout, style, composition, lighting, and mood. The reference dictates the visual language. Create a new image using the product(s), matching the aesthetic and structure of the reference as closely as possible without violating other rules. The product(s) must remain the hero. Each output must be distinctly different. " + MARKETING_STYLE
    : BASE_PROMPT_NO_REFS;

  const peopleOptions = [
    "Do NOT include any people.",
    "Include a single Caucasian person interacting with the product.",
    "Include a single Asian person interacting with the product.",
    "Include a single Black person interacting with the product.",
    "Include a single person of mixed ethnicity interacting with the product.",
    "Include a couple or duo with mixed ethnicities.",
    "Include a diverse group or family (mix of Caucasian, Asian, Black, etc.)."
  ];
  const peopleConstraint = peopleOptions[index % peopleOptions.length];

  let visualDirectionPrompt = "";
  switch (visualDirection) {
    case 'comparison':
      visualDirectionPrompt = "VISUAL DIRECTION: 'Comparison / Before & After' style. Show a clear split layout. Use visual cues like lines or split screens to emphasize difference. Ensure the product is central to the positive outcome.";
      break;
    case 'focus':
      visualDirectionPrompt = "VISUAL DIRECTION: 'Product Focus / Macro' style. Extreme close-up or highly detailed focus on the product itself. Minimalist background, high contrast lighting, emphasizing texture and premium quality. ABSOLUTELY NO PEOPLE in this specific generation.";
      break;
    case 'mix':
      visualDirectionPrompt = "VISUAL DIRECTION: 'Creative Mix' style. Blend lifestyle elements with bold graphic design. Expect the unexpected: unusual angles, striking colors, or abstract geometric framing.";
      break;
    case 'marketing':
      visualDirectionPrompt = "VISUAL DIRECTION: 'Classic Marketing' style. Clean, highly professional ad layout. Focus on strong composition, space for copy, and clear value proposition.";
      break;
    case 'auto':
    default:
      visualDirectionPrompt = "VISUAL DIRECTION: 'Auto / AI Choice'. Choose the best visual layout for the product. Feel free to be creative.";
      break;
  }

  const parts = [
    base,
    visualDirectionPrompt,
    visualDirection !== 'focus' ? `Human presence constraint for this specific image: ${peopleConstraint}` : ''
  ];
  if (fusion) parts.push(FUSION_HINT);
  if (userContext) parts.push(`ADDITIONAL USER CONTEXT (prioritize these instructions): ${userContext}`);
  return parts.join(" ");
};

export const openrouterService = {
  generateVariations: async (
    productBase64: string[],
    referenceBase64: string[],
    count: number = 1,
    maxInputDimension: number = 1024,
    fusion: boolean = false,
    variationIndex?: number,
    visualDirection: string = 'marketing',
    userContext?: string,
    aspectRatio: string = '1:1'
  ): Promise<GenerateVariationsResult> => {
    const outputSize = resolveOutputSize();

    const hasReferences = referenceBase64.length > 0;
    const buildPayload = (index: number) => {
      const textPrompt = buildPrompt(fusion, hasReferences, visualDirection, index, userContext);
      const content: OpenRouterContent[] = [{ type: 'text', text: textPrompt }];
      for (const url of productBase64) {
        content.push({ type: 'image_url', image_url: { url } });
      }
      referenceBase64.forEach((url, idx) => {
        content.push({ type: 'image_url', image_url: { url }, tag: `reference_${idx}` });
      });
      return {
        model: MODEL_ID,
        messages: [{ role: 'user', content }],
        modalities: ['image', 'text'],
        max_tokens: 512,
        image_config: { image_size: outputSize, aspect_ratio: aspectRatio },
        system: "You are an expert marketing graphic designer that generates marketing graphics for products. You are given a product (either in a single file or multiple files, while still being the same product) and optionally a reference image. You must follow the visual direction provided and the human presence constraint for each generation."
      };
    };

    const MAX_RETRIES = 2;

    const generateSingle = async (index: number): Promise<{ image: string | null; usage: OpenRouterUsage }> => {
      const payload = buildPayload(index);
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
