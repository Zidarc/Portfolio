# Setting up the sketchpad's AI mode

The AI behind `POST /api/ask` runs only on **free tiers**, with **no billing set up anywhere**. When a free
allowance runs out, the sketchpad says "I'm out of crayons for today" until it resets; nothing is ever
charged. There are two providers: Gemini is tried first, and Cloudflare takes over when Gemini is used up
or down. One of them is enough to start.

What it answers from lives in [`content/ai/`](../content/ai/README.md).

## 1. Gemini (first choice)

1. Go to **Google AI Studio** (aistudio.google.com), sign in, and choose **Get API key → Create API key**.
   Don't add a billing account to that Google Cloud project: without one, it stays on the free tier.
2. Put it in `.env.local` as `GEMINI_API_KEY=...`.
3. Optional: `GEMINI_MODEL` picks the model (default `gemini-3.5-flash`). Free models change from time to
   time; if the test below says the model wasn't found, pick a current free "Flash" model from AI Studio.

Two things to know about the free tier:
- **Google may use free-tier prompts to improve its products.** The sketchpad will say so next to AI mode.
- **Regions:** the free tier may not serve visitors in the EEA, Switzerland or the UK. Check the current
  Gemini API terms. Cloudflare still answers for them if it's set up.

## 2. Cloudflare Workers AI (backup)

1. Make a free Cloudflare account. Its **Account ID** is on the dashboard's overview page (right-hand side).
2. **My Profile → API Tokens → Create Token → Custom token**. Give it the permission
   *Account → Workers AI → Read* (that is enough to run models), for your account only.
3. Put them in `.env.local` as `CF_ACCOUNT_ID=...` and `CF_AI_TOKEN=...`.
4. The vision model (Llama 3.2 Vision) needs Meta's licence accepted once. Run this once, using your own
   account ID and token:

   ```sh
   curl https://api.cloudflare.com/client/v4/accounts/$CF_ACCOUNT_ID/ai/run/@cf/meta/llama-3.2-11b-vision-instruct \
     -H "Authorization: Bearer $CF_AI_TOKEN" -d '{"prompt":"agree"}'
   ```

The free plan gives 10,000 "neurons" a day (roughly a few hundred questions) and resets at midnight UTC.
Stay on the free Workers plan: on a paid plan, usage past the allowance would be charged.

## 3. Try it

```sh
npm run dev
node scripts/ask-test.mjs                                    # typed questions
node scripts/ask-test.mjs http://localhost:5173 note.png 1   # plus a picture of handwriting
```

Without any keys, local dev replies with **practice answers** (marked as such), so the sketchpad can be
built and tested offline. The live site replies "The AI isn't set up yet" instead.

## 4. Going live

Add the same variables on Netlify (**Site configuration → Environment variables**), or pass them to Docker
with `--env-file`. Then run the test script against the live address.

## Limits built in

- Each visitor: 6 questions a minute, 60 a day (per server instance).
- At most 30 things per request, 600 characters per typed note, about 1 MB of picture.
- The whole answer has to arrive within 9 seconds, because Netlify stops functions after 10.
