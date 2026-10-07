# Humanizer

Paste AI-written text in, get human-sounding text out. Claude and ChatGPT do the rewriting, then the result goes through every check this app can run for free: Claude and ChatGPT both judge it, four open-source AI detectors score it inside your browser, ZeroGPT scores it, and a built-in style check hunts for the usual tells. Anything that still says "AI" gets fed back into the next rewrite. It keeps going until every check passes or it runs out of rounds, and then hands you the best version.

It costs nothing to use and you don't need a single API key.

## How it's free

Claude and ChatGPT run through [Puter](https://puter.com), which gives every account free Claude and GPT usage. On the Railway version, once the server has a Puter token (see below), the server makes those calls itself and nobody using the site signs in to anything. Without one, the first time you hit Humanize a Puter window opens; sign up free (one click with Google, Microsoft or Apple) and you're done. No API key, no card, either way.

The open-source detectors run on your machine with [Transformers.js](https://huggingface.co/docs/transformers.js). The model files download once from Hugging Face's free CDN and the browser caches them, so the first run is slow (a few hundred MB) and every run after is quick.

ZeroGPT is called through its free public checker, the same request zerogpt.com's own page sends. ZeroGPT refuses that call when it comes straight from a browser, so the Railway server makes it. The GitHub Pages copy has no server and skips ZeroGPT.

The yeah-but: Puter's free allowance isn't infinite. Heavy use in one month can run it dry, and then Puter asks the account to top up. The app defaults to Claude Sonnet (half the price of Opus on Puter, nearly as good at this job) so the free allowance stretches further. Switch to Opus under Settings if you want.

## The checks

| Check | Runs where | Cost |
| --- | --- | --- |
| Claude says human or AI | Puter | free |
| ChatGPT says human or AI | Puter | free |
| RAID RoBERTa (trained on the RAID benchmark: GPT-4, ChatGPT, Llama, Mistral and more) | your browser | free |
| ModernBERT AI detector | your browser | free |
| Perplexity + burstiness on GPT-2 (GPTZero's original method) | your browser | free |
| OpenAI RoBERTa detector (the classic GPT-2 era one) | your browser | free |
| ZeroGPT | the optional server (browsers are blocked) | free |
| Built-in style check (em dashes, stock AI words, even rhythm, triads, "not only... but also"...) | your browser | free |
| GPTZero, Originality.ai, Copyleaks, Winston AI, Sapling | the server | only if you already pay for one |

The paid ones are optional. If you have a key, paste it under Settings (it stays in your browser and only goes to this app's own server) or set it as a Railway variable.

## What a round looks like

1. Claude rewrites the text with a long list of rules about how people actually write: uneven sentence lengths, plain words, no em dashes, no stock phrases, no tidy summary at the end, and every fact kept exactly as it was.
2. Every check runs on the new draft at the same time.
3. If anything fails, the next rewrite gets told exactly what: which words, which sentences a detector blamed, what Claude or ChatGPT said gave it away. Whichever model still calls it AI does the next rewrite, since it knows what it's looking for. If both do, they take turns.
4. Repeat until it all passes, or until the round limit (5 by default, up to 10).

The results table shows every check for every round. Click View on any round to load that draft.

## Honest limits

No tool can promise that every detector on earth will pass a text forever. Detectors retrain, disagree with each other, and some flag plenty of genuinely human writing. What this does is keep rewriting until everything it can check passes, then tell you plainly which ones did. If it runs out of rounds, it says which checks still complain, and "Run again on this output" picks up from there.

ZeroGPT's free endpoint is unofficial. If they block it, that check gets skipped and the run carries on.

## Tested against the real services

`tools/live-check.mjs` drives the page in a real browser against Puter, Hugging Face and ZeroGPT, and `.github/workflows/humanizer-live.yml` runs it on GitHub Actions (this sandbox can't reach those services, Actions can). On a ChatGPT-style paragraph versus a human-written one, the in-browser detectors scored:

| Detector | ChatGPT-style text | Human text |
| --- | --- | --- |
| RAID RoBERTa | 99% AI | 3% AI |
| ModernBERT | 100% AI | 0% AI |
| Perplexity + burstiness | 77% AI (perplexity 15.3) | 0% AI (perplexity 61.8) |
| OpenAI RoBERTa | 81% AI | 0% AI |
| ZeroGPT (from a server) | 100% AI | 0% AI |

Add a `PUTER_AUTH_TOKEN` repository secret (copy it from puter.com/dashboard#account) and the same workflow also runs Claude, ChatGPT and a full humanize loop for real.

If you're using this on schoolwork, check your school's rules. Getting caught for AI use has nothing to do with detectors half the time; teachers notice when the voice doesn't match your other work.

## Running it

**Use it here: https://humanizer-production-e796.up.railway.app**

That's the full version on Railway, deployed automatically from `main` whenever something under `humanizer/` changes. It sleeps when nobody's using it, so the first visit after a quiet spell takes a few seconds to wake up. A server-less copy also lives on GitHub Pages at https://elliotread250-source.github.io/Blackjack/humanizer/ (same app, minus ZeroGPT and the no-sign-in mode).

### Turn on no-sign-in mode

1. Make a free account at [puter.com](https://puter.com).
2. Copy the Auth Token from puter.com/dashboard#account.
3. In Railway, open the `humanizer` project, then the `humanizer` service, then Variables, and add `PUTER_AUTH_TOKEN` with that value.

Railway redeploys, and from then on Claude and ChatGPT run on that one account's free allowance. Every visitor shares it, so the server caps each visitor at 200 model and detector calls an hour (`RATE_PER_HOUR`). That's several full runs; it stops a stranger from draining it. If the allowance runs out, the app says so plainly.

To run it on your own machine:

```bash
cd humanizer
pip install -r requirements.txt   # only needed if you add API keys
python server.py                  # http://localhost:8080
```

Add `?mock=1` to the URL to run the whole loop offline with stand-in models, handy for checking the UI.

### Optional server settings (Railway variables)

All optional. `PUTER_AUTH_TOKEN` is the free one; the rest are for anyone who'd rather pay for API calls or already pays for a detector.

| Variable | What it does |
| --- | --- |
| `PUTER_AUTH_TOKEN` | free: the server runs Claude and ChatGPT on this Puter account, so visitors skip the sign-in (pin models with `PUTER_CLAUDE_MODEL` / `PUTER_GPT_MODEL`; default is the newest Sonnet and the newest GPT) |
| `RATE_PER_HOUR` | per-visitor cap on model and detector calls through the server (default 200) |
| `ANTHROPIC_API_KEY` | Claude calls go through your key instead of Puter (model: `ANTHROPIC_MODEL`, default `claude-opus-5-5`) |
| `OPENAI_API_KEY` | ChatGPT calls go through your key (model: `OPENAI_MODEL`, default the newest `gpt-N`) |
| `GPTZERO_API_KEY`, `ORIGINALITY_API_KEY`, `WINSTON_API_KEY`, `SAPLING_API_KEY`, `ZEROGPT_API_KEY`, `HF_TOKEN` | turn on that paid detector for everyone |
| `COPYLEAKS_EMAIL` + `COPYLEAKS_API_KEY` | Copyleaks |
| `APP_PASSWORD` | lock the server endpoints behind a password (worth it if you add paid keys) |

## Tests

```bash
node tools/test.mjs              # style check, prompts, model picking, the full loop with mock models
python tools/test_server.py      # server routes, password, rate limit, the Puter route, every detector adapter
```

## Files

`index.html`, `style.css`, `js/app.js` are the page. `js/pipeline.js` is the loop. `js/prompts.js` holds the rewrite and judge prompts, so tuning the humanizer means editing that one file. `js/tells.js` is the built-in style check. `js/local-detectors.worker.js` runs the open-source detectors. `server.py` serves the page and forwards anything that needs a key; `detectors.py`, `llm.py` and `puter.py` hold the API adapters. `tools/live-check.mjs` is the real-service test the GitHub Actions workflow runs.
