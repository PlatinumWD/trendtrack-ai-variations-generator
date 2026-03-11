# AI Tokens & Cost Management

## Overview

TrendTrack uses OpenRouter with Google Gemini 3.1 Flash Image for image generation. Each API call consumes **prompt tokens** (input) and **completion tokens** (output). This document describes where costs come from, how they are tracked, and how the app optimizes usage.

---

## Where Costs Come From

### Token Types

| Type | Description | Cost (per token) |
|------|-------------|------------------|
| **Prompt tokens** | Text prompt + all input images | $0.30 / 1M tokens |
| **Completion tokens** | Generated image(s) | $2.50 / 1M tokens |

### Cost Drivers

1. **Text prompt** — System instructions, creative directions, fusion hints. Fixed per request.
2. **Product images** — Each product image is encoded in base64 and sent to the API. Larger images = more tokens.
3. **Reference images** — Optional. Each reference adds tokens. More references = higher cost.
4. **Output** — `max_tokens: 512` per generated image. One image per API call.

### Formula

```
total_cost = (prompt_tokens × 0.30 / 1_000_000) + (completion_tokens × 2.50 / 1_000_000)
```

---

## How Costs Are Managed

### Usage Tracking

- OpenRouter returns `usage` in each response: `prompt_tokens`, `completion_tokens`, `total_cost` (or `cost`).
- The app aggregates usage across multiple parallel generations (e.g. 4 variations = 4 API calls).
- If the API does not return `total_cost`, a fallback is computed via `computeCost()` in `openrouter.service.ts`.

### Response Structure

```typescript
usage: {
  prompt_tokens: number;
  completion_tokens: number;
  total_cost: number;
}
```

- Returned to the client in `GenerateResponse.usage`.
- Displayed in the ResultGallery (tokens + cost).

---

## Cost Optimization Strategies

### 1. Image Resizing Before Upload

**File**: `server/src/services/image.service.ts`

- Images are resized to a maximum dimension of **1536px** before encoding.
- `resizeForInput()` uses Sharp with `fit: 'inside'` and `withoutEnlargement: true`.
- Smaller images = fewer tokens = lower cost.

### 2. Output Size

**File**: `server/src/services/openrouter.service.ts`

- `image_config.image_size` is set to `'2K'`.
- Limits output resolution to reduce completion token usage.

### 3. Regeneration by Index

- When the user regenerates a single variation, only **one** API call is made (`variationIndex`).
- Avoids regenerating all variations when only one needs to change.

### 4. References Are Optional

- Reference images increase prompt tokens significantly.
- Users can omit references to reduce cost when inspiration is not needed.

---

## Reference Handling (With / Without Refs)

### Two Prompt Modes

| Mode | Constant | When Used |
|------|----------|-----------|
| **With references** | `BASE_PROMPT_WITH_REFS` | `referenceBase64.length > 0` |
| **Without references** | `BASE_PROMPT_NO_REFS` | No reference images |

### `buildPrompt(creativeDirection, fusion, hasReferences)`

- **`hasReferences`** selects the base prompt.
- **With refs**: Instructs the model to use references as *inspiration only* — mood, palette, composition — and to create something new. Explicitly forbids copying or pasting elements.
- **Without refs**: Simpler prompt, no reference-related instructions.

### Impact on Cost

- **With refs**: More images in the payload → more prompt tokens → higher cost.
- **Without refs**: Fewer images → fewer tokens → lower cost.

### Creative Directions

- `CREATIVE_DIRECTIONS` defines 6 styles (TOFU, MOFU, BOFU, Creative mix, Storytelling, Minimalist).
- Each variation uses `CREATIVE_DIRECTIONS[index % 6]` for variety.
- Regenerating a single variation reuses the same creative direction via `variationIndex`.

---

## Constants (openrouter.service.ts)

| Constant | Value | Purpose |
|----------|-------|---------|
| `INPUT_COST_PER_TOKEN` | 0.30 / 1M | Input token pricing |
| `OUTPUT_COST_PER_TOKEN` | 2.50 / 1M | Output token pricing |
| `max_tokens` | 512 | Max tokens per image generation |
| `image_config.image_size` | `'2K'` | Output resolution |

---

## Constants (image.service.ts)

| Constant | Value | Purpose |
|----------|-------|---------|
| `MAX_INPUT_DIMENSION` | 1536 | Max width/height before resize |

---

## Summary

| Optimization | Effect |
|--------------|--------|
| Resize input images to 2048px | Fewer prompt tokens |
| Output size 2K | Lower completion cost |
| Optional references | User can skip to save tokens |
| Single-variation regeneration | 1 call instead of N |
| Fallback cost computation | Usage tracked even when API omits cost |
