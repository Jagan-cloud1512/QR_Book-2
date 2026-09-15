<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/856f516c-faa2-4b11-b3e3-1ef0da219feb

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Copy `.env.example` to `.env.local` and fill in the Gemini and Firebase values from the appropriate Google Cloud/Firebase projects.
3. Run the app:
   `npm run dev`

Firebase browser configuration is read from environment variables at build time. These values are still delivered to the browser, so restrict the API keys by application and API in Google Cloud Console. Never commit `.env.local` or other `.env` files.
