// Built-in AI-tell detector. Runs in the browser, costs nothing, needs no key.
//
// It doesn't guess "AI or not" from vibes; it counts the specific habits that
// commercial detectors and human readers both latch onto (em dashes, stock
// vocabulary, even sentence rhythm, tidy triads...) and turns each one into an
// instruction the rewriter can act on. The score is 0-100, higher = more AI.

const AI_WORDS = [
  'delve', 'tapestry', 'testament', 'realm', 'landscape', 'leverage', 'harness',
  'utilize', 'optimize', 'streamline', 'facilitate', 'comprehensive', 'robust',
  'seamless', 'holistic', 'intricate', 'intricacies', 'pivotal', 'crucial', 'vital',
  'paramount', 'beacon', 'moreover', 'furthermore', 'notably', 'indeed', 'thereby',
  'hence', 'thus', 'unlock', 'empower', 'enhance', 'elevate', 'amplify', 'foster',
  'bolster', 'dynamic', 'vibrant', 'nuanced', 'multifaceted', 'synergy', 'paradigm',
  'catalyst', 'cacophony', 'meticulous', 'groundbreaking', 'cutting-edge',
  'game-changer', 'game-changing', 'revolutionary', 'transformative', 'illuminate',
  'elucidate', 'underscore', 'embark', 'showcase', 'myriad', 'plethora', 'invaluable',
  'commendable', 'noteworthy', 'captivating', 'resonate', 'encompass', 'cornerstone',
  'interplay', 'ever-evolving', 'endeavor', 'endeavour', 'garner', 'bustling',
  'unwavering', 'symphony', 'labyrinth', 'nestled', 'spearhead', 'unparalleled',
  'additionally', 'consequently', 'navigating', 'insightful', 'poised',
];

const AI_PHRASES = [
  "it's important to note", 'it is important to note', "it's worth noting",
  'it is worth noting', 'worth noting that', "in today's", 'fast-paced world',
  'in this day and age', 'a deeper understanding', 'navigate the', 'unlock the',
  'at the intersection of', 'the power of', 'the future of', "here's the truth",
  "here's the thing", 'have you ever wondered', 'what if i told you', "let's dive",
  'dive into', 'diving into', 'deep dive', 'in this article', 'in this post',
  "in this essay, i will", "in this essay, we", 'generally speaking',
  'from a broader perspective', 'some may argue', 'it could be said', 'in recent years',
  'one of the most important', 'in conclusion', 'to sum up', 'in summary',
  'plays a crucial role', 'plays a vital role', 'plays a pivotal role',
  'plays a key role', 'play a crucial role', 'play a vital role', 'a testament to',
  'stands as a', 'serves as a', 'in the realm of', 'rich tapestry', 'ever-changing',
  'when it comes to', 'at the end of the day', 'first and foremost',
  'last but not least', 'embark on', 'key takeaways', 'it is essential to',
  "it's essential to", 'it is crucial to', "it's crucial to", 'in an era',
  'a myriad of', 'a plethora of', 'a wide range of', 'a wide array of',
  'shed light on', 'sheds light on', 'pave the way', 'paves the way',
  'double-edged sword', 'ahead of the curve', 'look no further', "whether you're",
  'whether you are', 'i hope this helps', 'great question', 'as an ai',
  'feel free to', 'in essence', 'overall, ', 'ultimately, ', 'all in all',
  'not to mention', 'the realm of', 'a crucial role', 'navigating the',
];

const CHATBOT = /\b(certainly!|absolutely!|i hope this helps|as an ai\b|great question|here(?:'s| is) (?:a|an|the) (?:revised|rewritten|humanized|updated) )/i;

const PARTICIPLE_TAIL = /(?:,\s+|\s*\u2014\s*)(highlighting|underscoring|emphasizing|emphasising|showcasing|reflecting|demonstrating|illustrating|signaling|signalling|ensuring|fostering|paving|cementing|solidifying|marking|making it|allowing|enabling|contributing|creating|leaving|offering|providing)\b/gi;

const CONSTRUCTIONS = [
  [/\bnot only\b[^.!?]{0,140}?\bbut(?: also)?\b/gi, '"not only X but also Y"'],
  [/\bnot just\b[^.!?]{0,100}?\bbut\b/gi, '"not just X, but Y"'],
  [/\b(?:it'?s|it is|this is|that'?s|that is|isn'?t|aren'?t) (?:not |just |merely |simply |about )+[^.!?]{1,70}?[,;:—-]\s*(?:it'?s|it is|this is|that'?s|they'?re|but)\b/gi, '"it\'s not X, it\'s Y"'],
  [/(?:^|[.!?]\s+)Whether\b[^.!?]{0,140}?\bor\b/g, '"Whether X or Y" opener'],
];

const EXPANDED = /\b(it is|do not|does not|did not|cannot|can not|i am|you are|we are|they are|is not|are not|was not|were not|will not|would not|should not|could not|that is|there is|let us|i have|you have|we have|have not|has not|i will|you will|we will|it will)\b/gi;
const CONTRACTED = /\b\w+(?:'|’)(?:s|t|re|ve|ll|d|m)\b/gi;

const OPENER_CLICHES = /^(the|this|it|these|in|as|by|with|additionally|furthermore|moreover|however|overall|ultimately)$/i;

function wordPattern(w) {
  const esc = w.replace(/[-]/g, '\\-');
  if (w.endsWith('e')) return `\\b${esc.slice(0, -1)}(?:e|es|ed|ing|ely)\\b`;
  if (w.endsWith('y')) return `\\b${esc.slice(0, -1)}(?:y|ies|ied|ying)\\b`;
  return `\\b${esc}(?:s|es|ed|ing|ly)?\\b`;
}

const WORD_RES = AI_WORDS.map((w) => [w, new RegExp(wordPattern(w), 'gi')]);

export function words(text) {
  return text.match(/[A-Za-z0-9À-ɏ]+(?:['’-][A-Za-z0-9À-ɏ]+)*/g) || [];
}

export function sentences(text) {
  const flat = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|e\.g|i\.e|U\.S|approx|Inc|Ltd|Co)\./g, '$1․')
    .replace(/\n+/g, ' \n ');
  return flat
    .split(/(?<=[.!?]["'”’)\]]*)\s+(?=["'“‘(\[]?[A-Z0-9])|\s\n\s/)
    .map((s) => s.replace(/․/g, '.').trim())
    .filter((s) => words(s).length > 0);
}

export function paragraphs(text) {
  return text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function snippet(text, idx, len) {
  const start = Math.max(0, idx - 25);
  const end = Math.min(text.length, idx + len + 25);
  return (start > 0 ? '…' : '') + text.slice(start, end).replace(/\s+/g, ' ').trim() + (end < text.length ? '…' : '');
}

function stdev(xs) {
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
}

// style: 'natural' | 'casual' | 'professional' | 'academic'
export function analyze(text, style = 'natural') {
  const tells = [];
  let score = 0;
  const add = (points, cap, kind, detail, fix) => {
    const p = Math.min(points, cap);
    if (p <= 0) return;
    score += p;
    tells.push({ kind, points: Math.round(p), detail, fix });
  };

  const ws = words(text);
  const nWords = Math.max(ws.length, 1);
  const per100 = 100 / Math.max(nWords, 120);
  const sents = sentences(text);
  const paras = paragraphs(text);

  // Em dashes and dash-as-punctuation.
  const dashes = [...text.matchAll(/—|\s–\s|\s--\s/g)];
  if (dashes.length) {
    add(dashes.length * 8, 30, 'em-dash',
      `${dashes.length} em/en dash${dashes.length > 1 ? 'es' : ''}, e.g. "${snippet(text, dashes[0].index, 1)}"`,
      'Remove every em dash and spaced en dash. Use a comma, period, colon or parentheses instead.');
  }

  // Stock AI vocabulary.
  const wordHits = [];
  for (const [w, re] of WORD_RES) {
    const m = text.match(re);
    if (m) wordHits.push([w, m.length, m[0]]);
  }
  const wordCount = wordHits.reduce((a, [, n]) => a + n, 0);
  if (wordCount) {
    add(wordCount * per100 * 12, 35, 'ai-words',
      `AI-flavored words: ${wordHits.map(([, n, ex]) => (n > 1 ? `${ex} (x${n})` : ex)).join(', ')}`,
      'Replace these with plain, specific words a person would actually say (e.g. "use" not "leverage", "important" not "crucial").');
  }

  // Stock phrases.
  const lower = text.toLowerCase().replace(/’/g, "'");
  const phraseHits = AI_PHRASES.filter((p) => lower.includes(p));
  if (phraseHits.length) {
    add(phraseHits.length * 8, 30, 'ai-phrases',
      `Stock phrases: ${phraseHits.map((p) => `"${p.trim().replace(/,$/, '')}"`).join(', ')}`,
      'Cut these phrases entirely or say the thing directly.');
  }

  if (CHATBOT.test(text)) {
    add(20, 20, 'chatbot', 'Reads like a chatbot reply (assistant-style opener or sign-off).',
      'Remove any assistant-style framing, preamble or sign-off.');
  }

  // Rhetorical constructions.
  for (const [re, label] of CONSTRUCTIONS) {
    const m = [...text.matchAll(re)];
    if (m.length) {
      add(m.length * 7, 18, 'construction', `${label} construction (x${m.length}): "${snippet(text, m[0].index, m[0][0].length)}"`,
        `Rewrite without the ${label} pattern. State the point plainly.`);
    }
  }
  const fromTo = text.match(/\bfrom\s+[\w'-]+(?:\s+[\w'-]+){0,3}\s+to\s+[\w'-]+/gi) || [];
  if (fromTo.length >= 2) {
    add(fromTo.length * 4, 12, 'construction', `Repeated "from X to Y" (x${fromTo.length})`,
      'Keep at most one "from X to Y" range, and only if it is literal.');
  }

  const tails = [...text.matchAll(PARTICIPLE_TAIL)];
  if (tails.length) {
    add(tails.length * 6, 18, 'participle-tail',
      `Sentence-ending "-ing" commentary (x${tails.length}): "${snippet(text, tails[0].index, tails[0][0].length + 20)}"`,
      'Drop trailing ", highlighting/ensuring/reflecting..." clauses. Make them their own short sentence or cut them.');
  }

  // Rhythm: AI text has very even sentence lengths.
  const lens = sents.map((s) => words(s).length);
  if (lens.length >= 4) {
    const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
    const cv = stdev(lens) / mean;
    if (cv < 0.45) {
      const pts = cv < 0.25 ? 25 : cv < 0.35 ? 16 : 7;
      add(pts, 25, 'rhythm', `Sentence lengths are too even (variation ${cv.toFixed(2)}, avg ${mean.toFixed(0)} words).`,
        'Vary sentence length hard: mix 3-7 word sentences with some 25-35 word ones. Never three similar lengths in a row.');
    }
    let run = 0;
    let worst = 0;
    for (let i = 1; i < lens.length; i++) {
      run = Math.abs(lens[i] - lens[i - 1]) <= 3 ? run + 1 : 0;
      worst = Math.max(worst, run);
    }
    if (worst >= 3) {
      add(6, 6, 'rhythm', `${worst + 1} sentences in a row with nearly the same length.`,
        'Break up the run: split one sentence, merge two others.');
    }
    if (lens.length >= 6 && !lens.some((n) => n <= 6)) {
      add(6, 6, 'rhythm', 'No short sentences at all.', 'Add a couple of very short sentences (3-6 words) where they land naturally.');
    }
  }

  // Openers.
  const firsts = sents.map((s) => (words(s)[0] || '').toLowerCase());
  let repeats = 0;
  for (let i = 1; i < firsts.length; i++) if (firsts[i] && firsts[i] === firsts[i - 1]) repeats++;
  if (repeats) {
    add(repeats * 4, 12, 'openers', `${repeats} pair${repeats > 1 ? 's' : ''} of consecutive sentences start with the same word.`,
      'Start consecutive sentences differently.');
  }
  if (firsts.length >= 5) {
    const cliche = firsts.filter((w) => OPENER_CLICHES.test(w)).length / firsts.length;
    if (cliche > 0.5) {
      add(6, 6, 'openers', `${Math.round(cliche * 100)}% of sentences open with The/This/It/In/As/However...`,
        'Open some sentences with the subject doing something, a name, a number, "And"/"But", or a fragment.');
    }
  }

  // Paragraph uniformity.
  if (paras.length >= 3) {
    const pc = paras.map((p) => sentences(p).length);
    const spread = Math.max(...pc) - Math.min(...pc);
    if (spread <= 1 && Math.min(...pc) >= 3) {
      add(8, 8, 'structure', `Every paragraph is ${Math.min(...pc)}-${Math.max(...pc)} sentences long.`,
        'Make paragraph sizes uneven. A one or two sentence paragraph is fine.');
    }
  }

  // Triads ("X, Y, and Z").
  const triads = text.match(/\b[\w'-]+(?:\s[\w'-]+){0,2},\s[\w'-]+(?:\s[\w'-]+){0,2},?\s(?:and|or)\s[\w'-]+/gi) || [];
  if (sents.length && triads.length / sents.length > 0.2 && triads.length >= 2) {
    add(8, 8, 'triads', `${triads.length} "X, Y, and Z" lists, e.g. "${triads[0]}"`,
      'Break up lists of three. Use two items, or four, or just one specific example.');
  }

  // Markdown in prose.
  if (/\*\*[^*]+\*\*|^#{1,6}\s|^\s*[-*•]\s/m.test(text)) {
    add(5, 5, 'formatting', 'Markdown bold, headers or bullet points in the text.',
      'Write it as normal paragraphs with no bold, headers or bullets (unless the original was a list).');
  }

  // Contractions (skip for academic, where people do write formally).
  if (style !== 'academic') {
    const expanded = (text.match(EXPANDED) || []).length;
    const contracted = (text.match(CONTRACTED) || []).filter((c) => !/'s$/i.test(c) || /^(it|that|there|here|what|who|he|she|let)'s$/i.test(c)).length;
    if (expanded >= 3 && contracted / (contracted + expanded) < 0.3) {
      add(8, 8, 'contractions', `Only ${contracted} contraction${contracted === 1 ? '' : 's'} vs ${expanded} spelled-out forms ("it is", "do not"...).`,
        'Use contractions where a person naturally would (it\'s, don\'t, you\'re, can\'t).');
    }
  }

  // Hedging density.
  const hedges = (text.match(/\b(perhaps|potentially|arguably|seemingly|it seems|tends? to|may well|somewhat|relatively)\b/gi) || []).length;
  if (hedges * per100 > 1.5) {
    add(5, 5, 'hedging', `${hedges} hedging words (perhaps, potentially, arguably...).`, 'Make direct statements. Cut the hedges.');
  }

  score = Math.round(Math.min(100, score));
  const mean = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  return {
    score,
    tells: tells.sort((a, b) => b.points - a.points),
    stats: {
      words: ws.length,
      sentences: sents.length,
      paragraphs: paras.length,
      avgSentence: Math.round(mean * 10) / 10,
      variation: lens.length > 1 ? Math.round((stdev(lens) / mean) * 100) / 100 : 0,
    },
  };
}

// Deterministic cleanup run on every rewrite: the models still slip an em dash
// or a "utilize" in now and then, and these are the cheapest tells to remove.
export function scrub(text) {
  let t = text.replace(/\r\n/g, '\n');
  t = t.replace(/^\s*(?:here(?:'s| is) (?:the|your|a) [^\n]{0,60}(?:version|rewrite|text)[^\n]*:\s*\n+)/i, '');
  t = t.replace(/[ \t]*—[ \t]*/g, ', ').replace(/[ \t]+–[ \t]+/g, ', ').replace(/[ \t]+--[ \t]+/g, ', ');
  t = t.replace(/,\s*([,.;:!?])/g, '$1').replace(/(^|\n)\s*,\s*/g, '$1');
  t = t.replace(/\b([Uu])tiliz(e|es|ed|ing)\b/g, (_, u, s) => `${u === 'U' ? 'U' : 'u'}s${s}`);
  t = t.replace(/\b([Uu])tilis(e|es|ed|ing)\b/g, (_, u, s) => `${u === 'U' ? 'U' : 'u'}s${s}`);
  t = t.replace(/(^|[.!?]\s+)(?:it(?:'|’)s|it is) (?:important|worth noting|worth mentioning) (?:to note |to remember )?that\s+(\w)/gim,
    (_, p, c) => p + c.toUpperCase());
  t = t.replace(/[ \t]{2,}/g, ' ');
  return t.trim();
}
