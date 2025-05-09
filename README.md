# MovieLens Recommender Frontend

This is the frontend application for the MovieLens Recommender system, built with Next.js, TypeScript, and Tailwind CSS.

## Development Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment variables:
   ```bash
   cp .env.example .env
   ```

3. Update the environment variables in `.env` with your actual values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_API_URL=http://localhost:8000  # Local API URL
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment (Render.com)

The application is configured to be deployed on Render.com:

1. Make sure your repository contains the `render.yaml` file at the root level.

2. In the Render.com dashboard, create a new Blueprint deployment pointing to your GitHub repository.

3. Render will automatically detect and deploy both the frontend and backend services defined in `render.yaml`.

4. Ensure the following environment variables are set in the Render.com dashboard:
   - `NEXT_PUBLIC_API_URL` - URL of your backend API (e.g., https://movielens-recommender-api.onrender.com)
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Features

- User authentication via Supabase
- Movie browsing and searching
- Personalized movie recommendations
- User ratings and interactions
- Similar movie recommendations 