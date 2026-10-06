# Humanizer

Paste AI-written text in, get human-sounding text out. Claude and ChatGPT do the rewriting, then the result goes through every check this app can run for free: Claude and ChatGPT both judge it, three open-source AI detectors score it inside your browser, ZeroGPT scores it, and a built-in style check hunts for the usual tells. Anything that still says "AI" gets fed back into the next rewrite. It keeps going until every check passes or it runs out of rounds, and then hands you the best version.

It costs nothing to use and you don't need a single API key.

## How it's free

Claude and ChatGPT run through [Puter](https://puter.com). Puter gives every visitor free access to Claude and GPT models on their own free Puter account, so the first time you hit Humanize a small Puter window opens and sets you up with a free guest account automatically. No sign-up form, no API key, no card. (If you'd rather keep your usage on a real Puter account, sign in there instead.)

The open-source detectors run on your machine with [Transformers.js](https://huggingface.co/docs/transformers.js). The model files download once from Hugging Face's free CDN and the browser caches them, so the first run is slow (a few hundred MB) and every run after is quick.

ZeroGPT is called through its free public checker, the same request zerogpt.com's own page sends.

The yeah-but: Puter's free allowance isn't infinite. Heavy use in one month can run it dry, and then Puter asks the account to top up. The app defaults to Claude Sonnet (half the price of Opus on Puter, nearly as good at this job) so the free allowance stretches further. Switch to Opus under Settings if you want.

## The checks

| Check | Runs where | Cost |
| --- | --- | --- |
| Claude says human or AI | Puter | free |
| ChatGPT says human or AI | Puter | free |
| RAID RoBERTa (trained on the RAID benchmark: GPT-4, ChatGPT, Llama, Mistral and more) | your browser | free |
| ModernBERT AI detector | your browser | free |
| Perplexity + burstiness on GPT-2 (GPTZero's original method) | your browser | free |
| OpenAI RoBERTa detector (off by default, easy to fool) | your browser | free |
| ZeroGPT | free public endpoint | free |
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

If you're using this on schoolwork, check your school's rules. Getting caught for AI use has nothing to do with detectors half the time; teachers notice when the voice doesn't match your other work.

## Running it

**Use it here: https://elliotread250-source.github.io/Blackjack/humanizer/**

That's GitHub Pages, free, published automatically on every push to `main`. Everything the free version does happens in your browser, so it doesn't need a server at all.

There's also a small optional Python server, for two things Pages can't do: holding paid API keys so they never touch the browser, and calling ZeroGPT from a server when your browser isn't allowed to call it directly. The Dockerfile and `railway.json` are ready for Railway (set the service's root directory to `humanizer`), but Railway costs $5/month after the trial, so it's off for now. To run it locally:

```bash
cd humanizer
pip install -r requirements.txt   # only needed if you add API keys
python server.py                  # http://localhost:8080
```

Add `?mock=1` to the URL to run the whole loop offline with stand-in models, handy for checking the UI.

### Optional server settings (Railway variables)

None of these are needed, and they only apply when the Python server is running. They're for anyone who'd rather pay for API calls than use Puter.

| Variable | What it does |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude calls go through your key instead of Puter (model: `ANTHROPIC_MODEL`, default `claude-opus-5-5`) |
| `OPENAI_API_KEY` | ChatGPT calls go through your key (model: `OPENAI_MODEL`, default the newest `gpt-N`) |
| `GPTZERO_API_KEY`, `ORIGINALITY_API_KEY`, `WINSTON_API_KEY`, `SAPLING_API_KEY`, `ZEROGPT_API_KEY`, `HF_TOKEN` | turn on that paid detector for everyone |
| `COPYLEAKS_EMAIL` + `COPYLEAKS_API_KEY` | Copyleaks |
| `APP_PASSWORD` | lock the server endpoints behind a password (do this if you add paid keys, or strangers can spend them) |

## Tests

```bash
node tools/test.mjs              # style check, prompts, model picking, the full loop with mock models
python tools/test_server.py      # server routes, password, every detector adapter against sample responses
```

## Files

`index.html`, `style.css`, `js/app.js` are the page. `js/pipeline.js` is the loop. `js/prompts.js` holds the rewrite and judge prompts, so tuning the humanizer means editing that one file. `js/tells.js` is the built-in style check. `js/local-detectors.worker.js` runs the open-source detectors. `server.py` serves the page and forwards anything that needs a key; `detectors.py` and `llm.py` hold the API adapters.
