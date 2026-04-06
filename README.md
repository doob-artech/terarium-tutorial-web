# Terarium Tutorial UI

React + Vite based tutorial/start interface.

## OpenAI Vision JSON Extraction Setup

1. Create `.env` in the project root.
2. Add your key:

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run:

```bash
npm install
npm run dev
```

## JSON Output Schema (English)

When a photo is captured, the app sends the webcam frame to OpenAI Responses API and requests strict JSON schema output:

- `hair_style`: enum (`short_cut`, `bob`, `long`, `ponytail`, `unknown`)
- `has_bangs`: boolean
- `hair_color`: enum color family
- `top_type`: enum
- `bottom_type`: enum
- `clothing_color.top_color`: enum color family
- `clothing_color.bottom_color`: enum color family
- `glasses_type`: enum (`thick_frame`, `metal_frame`, `rimless`, `none`)
- `has_hat`: boolean

## Notes

- Current model in code: `gpt-4.1-mini`
- API key is used only on server (`server.js`) and not exposed to the browser bundle.
