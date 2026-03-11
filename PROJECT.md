# TrendTrack — Project Overview

## Summary

**TrendTrack** is a full-stack web application for generating AI-powered creative variations of product images. Users upload product photos and optional reference images (ads) to guide the AI's artistic direction. The app leverages OpenRouter (Google Gemini 3.1 Flash Image) to produce marketing-style graphics suitable for advertising campaigns.

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Client** | React 18, TypeScript, Vite, Tailwind CSS, Axios, Zod, UUID |
| **Server** | Node.js, Express, TypeScript, Multer, Sharp, Axios |
| **AI** | OpenRouter API (Google Gemini 3.1 Flash Image) |
| **Tooling** | ESLint, Prettier, ts-node-dev |

---

## Architecture

### Monorepo Structure

```
trendtrack/
├── client/                 # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── config/         # App configuration
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API client, utilities
│   │   ├── pages/          # Page components
│   │   ├── services/       # API calls
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Utility functions
│   └── vite.config.ts
├── server/                 # Express API
│   ├── src/
│   │   ├── config/         # Environment config
│   │   ├── controllers/    # API handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Utility functions
│   └── dist/               # Compiled output
└── PROJECT.md
```

### Client Architecture

- **Components**: Atomic, reusable UI components (`ImageUploader`, `ImagePreview`, `ResultGallery`, `Sidebar`, `Loader`)
- **Hooks**: `useImageUpload`, `useAIProcessing` — encapsulate state and logic; no direct network calls in hooks (they call services)
- **Services**: `aiService` — centralizes all API calls
- **Config**: `app.config.ts` — isolates API base URL and env vars
- **Lib**: `apiClient` — Axios instance with base URL and error handling

### Server Architecture

- **Routes**: `ai.routes.ts` — defines `/api/ai/generate` endpoint
- **Controllers**: `ai.controller.ts` — handles request/response, delegates to services
- **Services**: `openrouter.service.ts` (AI), `image.service.ts` (image processing)
- **Middleware**: `upload.middleware` (Multer), `error.middleware` (global error handler)
- **Config**: `env.ts` — Zod-validated environment variables

### Data Flow

1. User uploads product + optional reference images
2. Client sends `FormData` to `POST /api/ai/generate`
3. Server: Multer → encode images → OpenRouter API → save generated images → return URLs
4. Client displays results in gallery with optional regeneration per variation

---

## Path Aliases

### Client (`tsconfig.json` + `vite.config.ts`)

| Alias | Path |
|-------|------|
| `@components/*` | `src/components/*` |
| `@services/*` | `src/services/*` |
| `@hooks/*` | `src/hooks/*` |
| `@types/*` | `src/types/*` |
| `@lib/*` | `src/lib/*` |
| `@config/*` | `src/config/*` |
| `@utils/*` | `src/utils/*` |

### Server (`tsconfig.json`)

| Alias | Path |
|-------|------|
| `@controllers/*` | `src/controllers/*` |
| `@services/*` | `src/services/*` |
| `@routes/*` | `src/routes/*` |
| `@middleware/*` | `src/middleware/*` |
| `@types/*` | `src/types/*` |
| `@config/*` | `src/config/*` |
| `@utils/*` | `src/utils/*` |

---

## Conventions & Rules

### General principles

- **SOLID**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
- **KISS**: Keep It Simple, Stupid
- **DRY**: Don't Repeat Yourself
- **YAGNI**: You Aren't Gonna Need It

### Architecture

- Organize by functional domains
- Use Code Splitting and lazy loading
- Business logic in `/services`, state in `/hooks`
- No complex logic in React components — keep them declarative
- Config in `config/`, constants in `constants/`
- Use `@` aliases for imports

### Components

- Atomic and reusable
- No duplication — factor shared components
- No dead code
- PascalCase for components, camelCase for functions and hooks

### Services & hooks

- API calls in `/services` only
- Hooks call services, never direct network calls
- All data objects have TypeScript interfaces
- Typed functions (arguments and return)
- Single Responsibility per service/hook

### Code quality

- Pure functions
- One clear responsibility per file
- No nested conditionals — prefer early returns
- No logic in JSX — use handlers like `handleActionName`

### Language

- Comments in US English
- Code in US English

### Migrations

- Idempotent: `CREATE IF ...`

---

## Security

### Implemented

- **Secrets**: API keys in `.env` (server-side only)
- **Environment**: Zod validation for `PORT`, `CLIENT_URL`, `OPENROUTER_API_KEY`
- **File upload**: MIME type whitelist (JPEG, PNG, WebP, GIF), max 10MB per file
- **CORS**: Restricted to `CLIENT_URL`
- **Sensitive data**: `.env` and `.env.*` in `.gitignore`

### Recommendations

- HTTPS in production
- Security headers (CSP, X-Frame-Options)
- Input sanitization for user-facing content
- Rate limiting for API endpoints

---

## Naming Conventions

| Type | Convention | Example |
|------|-------------|---------|
| Components | PascalCase | `ImageUploader`, `ResultGallery` |
| Functions / Hooks | camelCase | `generateVariations`, `useAIProcessing` |
| Services | camelCase | `aiService`, `openrouterService` |
| Files / Folders | PascalCase for components | `ImageUploader/ImageUploader.tsx` |
| Types / Interfaces | PascalCase | `GenerateResponse`, `GeneratedImage` |
| Constants | UPPER_SNAKE_CASE | `MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES` |

---

## Environment Variables

### Server

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default: `5000` |
| `CLIENT_URL` | No | Default: `http://localhost:5173` |
| `OPENROUTER_API_KEY` | Yes | OpenRouter API key |

### Client

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (default: `/api` for proxy) |

---

## Scripts

### Client

```bash
npm run dev      # Vite dev server (port 5173)
npm run build    # TypeScript + Vite build
npm run lint     # ESLint
npm run preview  # Preview production build
```

### Server

```bash
npm run dev      # ts-node-dev with hot reload
npm run build    # Compile to dist/
npm run start    # Run compiled server
```

---

## File Limits

| Limit | Value |
|-------|-------|
| Max file size | 10 MB |
| Max product images | 10 |
| Max reference images | 10 |
| Allowed MIME types | JPEG, PNG, WebP, GIF |

---

## Dependencies

- **Client**: React, Axios, Zod, UUID, Tailwind
- **Server**: Express, Multer, Sharp, Axios, Zod, UUID, CORS, dotenv
- **AI**: OpenRouter via Axios

---

## French Compliance

- French regulations (e.g. billing) must be checked before touching sensitive areas.
- Rules and comments in code: US English.

---

## Related Files

- `.gitignore` — Excludes `node_modules`, `.env`, `dist`, `uploads`, `generated`
- `AI_TOKENS.md` — AI tokens, costs, and optimization
