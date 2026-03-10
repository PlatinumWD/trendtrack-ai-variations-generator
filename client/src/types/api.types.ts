export interface GenerateResponseUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_cost: number;
}

export interface GenerateResponse {
  generatedImages: string[];
  model?: string;
  usage?: GenerateResponseUsage;
}

export interface ErrorResponse {
  error: string;
}
