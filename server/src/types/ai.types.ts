export interface OpenRouterImageContent {
  type: 'image_url';
  image_url: { url: string };
}

export interface OpenRouterTextContent {
  type: 'text';
  text: string;
}

export type OpenRouterContent = OpenRouterTextContent | OpenRouterImageContent;

export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | OpenRouterContent[];
}

export interface OpenRouterImageConfig {
  aspect_ratio?: string;
  image_size?: '0.5K' | '1K' | '2K' | '4K';
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  modalities?: string[];
  max_tokens?: number;
  image_config?: OpenRouterImageConfig;
}

export interface OpenRouterImageChoice {
  image_url?: { url: string };
  imageUrl?: { url: string };
}

export interface OpenRouterUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  total_cost?: number;
  cost?: number;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      role: string;
      content: string | null;
      images?: OpenRouterImageChoice[];
    };
  }>;
  usage?: OpenRouterUsage;
}
