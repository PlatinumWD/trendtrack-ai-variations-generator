# AI Product Image Variations App

This is a full-stack application (React/Vite + Node/Express) allowing users to upload product images and get AI-generated variations or composites using OpenRouter API.

## Project Structure

- `client/`: React + Vite frontend
- `server/`: Node.js + Express backend

## Prerequisites

- Node.js (v18+)
- npm
- An OpenRouter API Key

## Setup

1. Copy the `.env.example` file in the root to `server/.env` and update the `OPENROUTER_API_KEY`:
   ```bash
   cp .env.example server/.env
   ```

2. Install dependencies for both client and server:

   **Frontend:**
   ```bash
   cd client
   npm install
   ```

   **Backend:**
   ```bash
   cd server
   npm install
   ```

## Running the Application

1. Start the Backend server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the Frontend dev server:
   ```bash
   cd client
   npm run dev
   ```

3. Open your browser to the URL shown in the frontend terminal (usually http://localhost:5173).
