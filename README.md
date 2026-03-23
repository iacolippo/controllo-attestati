# Controllo Attestati

Web app to extract structured data from documents (PDF/images) using OpenAI's vision models with structured outputs.

## Features

- Upload PDF or image files
- Define custom output schema (field name, description, type)
- Extract data using GPT-4o with structured outputs
- Results displayed as a table with raw JSON view

## Deploy to Vercel

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create controllo-attestati --public --push --source=.
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com) and sign in with GitHub
   - Click **"Add New Project"**
   - Import the `controllo-attestati` repository
   - Click **"Deploy"** — no configuration needed, Vercel auto-detects Next.js

3. **Use the app**: Users enter their own OpenAI API key in the browser (stored in localStorage, never sent to Vercel).

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. User uploads a PDF (converted to images client-side via pdf.js) or an image
2. User defines the fields they want to extract (name, optional description, type)
3. The app sends the images + schema to an API route that calls OpenAI's GPT-4o with `response_format: json_schema` for structured extraction
4. Results are displayed in a table
