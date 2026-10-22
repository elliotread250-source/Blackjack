/*
 * Card art, drawn as SVG strings (no images, no fonts to download).
 *
 * Two face styles share a 200x280 viewBox:
 *   full    - classic corner indices, standard pip layouts and framed,
 *             double-ended court cards. Used when cards are big enough.
 *   compact - a large rank and suit across the top and one big symbol below,
 *             readable at phone sizes when columns are fanned tightly.
 *
 * Suits are drawn as paths rather than text glyphs so they never turn into
 * emoji on phones and look the same everywhere.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CardArt = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const W = 200, H = 280;
  const RED = '#c8102e';
  const BLACK = '#17191e';
  const GOLD = '#d7a531';
  const GOLD_DARK = '#8a6412';
  const SANS = "'Helvetica Neue', Helvetica, Arial, 'Liberation Sans', 'Nimbus Sans', 'DejaVu Sans', sans-serif";
  const SERIF = "Georgia, 'Times New Roman', 'Liberation Serif', 'Nimbus Roman', 'DejaVu Serif', serif";
  const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

  // Suit outlines in a 100x100 box. 0 spades, 1 hearts, 2 diamonds, 3 clubs.
  function circ(cx, cy, r) {
    return 'M' + (cx - r) + ' ' + cy + 'a' + r + ' ' + r + ' 0 1 0 ' + (2 * r) + ' 0a' + r + ' ' + r + ' 0 1 0 ' + (-2 * r) + ' 0Z';
  }
  const SUIT_PATHS = [
    'M50 3C57 17 70 28 82 38C94 48 99 56 99 66C99 79 90 87 78 87C68 87 60 82 55 74C56 85 61 93 70 98H30C39 93 44 85 45 74C40 82 32 87 22 87C10 87 1 79 1 66C1 56 6 48 18 38C30 28 43 17 50 3Z',
    'M50 95C44 87 30 75 18 63C6 51 2 41 2 29C2 14 13 3 27 3C38 3 46 10 50 19C54 10 62 3 73 3C87 3 98 14 98 29C98 41 94 51 82 63C70 75 56 87 50 95Z',
    'M50 2C60 20 74 36 92 50C74 64 60 80 50 98C40 80 26 64 8 50C26 36 40 20 50 2Z',
    circ(50, 27, 21.5) + circ(25.5, 58, 21.5) + circ(74.5, 58, 21.5) + circ(50, 52, 11) +
      'M45.5 58C45.5 79 40 91 30 98H70C60 91 54.5 79 54.5 58Z',
  ];

  const suitOf = (id) => (id / 13) | 0;
  const rankOf = (id) => (id % 13) + 1;
  const colorOf = (id) => { const s = suitOf(id); return s === 1 || s === 2 ? RED : BLACK; };

  const f = (n) => (Math.round(n * 100) / 100).toString();

  /** A suit symbol of `size` centred on (cx, cy), optionally upside down. */
  function pip(suit, cx, cy, size, flip, fill) {
    const k = size / 100;
    const tr = flip
      ? 'translate(' + f(cx) + ' ' + f(cy) + ') rotate(180) translate(' + f(-size / 2) + ' ' + f(-size / 2) + ') scale(' + f(k) + ')'
      : 'translate(' + f(cx - size / 2) + ' ' + f(cy - size / 2) + ') scale(' + f(k) + ')';
    return '<path d="' + SUIT_PATHS[suit] + '" transform="' + tr + '"' + (fill ? ' fill="' + fill + '"' : '') + '/>';
  }

  // Pip layouts: [column, row] with columns L/M/R and rows from 0 (top) to 1 (bottom).
  const L = 66, M = 100, R = 134;
  const PIPS = {
    2: [[M, 0], [M, 1]],
    3: [[M, 0], [M, 0.5], [M, 1]],
    4: [[L, 0], [R, 0], [L, 1], [R, 1]],
    5: [[L, 0], [R, 0], [M, 0.5], [L, 1], [R, 1]],
    6: [[L, 0], [R, 0], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
    7: [[L, 0], [R, 0], [M, 0.25], [L, 0.5], [R, 0.5], [L, 1], [R, 1]],
    8: [[L, 0], [R, 0], [M, 0.25], [L, 0.5], [R, 0.5], [M, 0.75], [L, 1], [R, 1]],
    9: [[L, 0], [R, 0], [L, 1 / 3], [R, 1 / 3], [M, 0.5], [L, 2 / 3], [R, 2 / 3], [L, 1], [R, 1]],
    10: [[L, 0], [R, 0], [M, 1 / 6], [L, 1 / 3], [R, 1 / 3], [L, 2 / 3], [R, 2 / 3], [M, 5 / 6], [L, 1], [R, 1]],
  };
  const PIP_TOP = 62, PIP_BOTTOM = 218;

  // Small ornaments for the court cards, drawn in a 44x24 box.
  function crown(rank, x, y, scale, suitColor) {
    let body;
    if (rank === 13) {
      body =
        '<path d="M3 23L1 7L12 14L22 1L32 14L43 7L41 23Z" fill="' + GOLD + '" stroke="' + GOLD_DARK + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<path d="M3.5 19H40.5" stroke="' + GOLD_DARK + '" stroke-width="1.2"/>' +
        '<circle cx="1.5" cy="6.5" r="2.6" fill="' + suitColor + '"/><circle cx="22" cy="1.5" r="2.8" fill="' + suitColor + '"/><circle cx="42.5" cy="6.5" r="2.6" fill="' + suitColor + '"/>' +
        '<circle cx="22" cy="15" r="2.3" fill="' + suitColor + '"/>';
    } else if (rank === 12) {
      body =
        '<path d="M4 23C4 16 3 11 2 7C8 10 11 12 13 15C15 9 18 6 22 4C26 6 29 9 31 15C33 12 36 10 42 7C41 11 40 16 40 23Z" fill="' + GOLD + '" stroke="' + GOLD_DARK + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<path d="M5 19.5C16 17.5 28 17.5 39 19.5" fill="none" stroke="' + GOLD_DARK + '" stroke-width="1.2"/>' +
        '<circle cx="2" cy="6.5" r="2.2" fill="' + GOLD + '" stroke="' + GOLD_DARK + '" stroke-width="1"/><circle cx="22" cy="3" r="2.6" fill="' + suitColor + '"/><circle cx="42" cy="6.5" r="2.2" fill="' + GOLD + '" stroke="' + GOLD_DARK + '" stroke-width="1"/>' +
        '<circle cx="13" cy="15" r="1.6" fill="' + suitColor + '"/><circle cx="31" cy="15" r="1.6" fill="' + suitColor + '"/>';
    } else {
      // Jack: a plumed cap.
      body =
        '<path d="M5 23C5 14 12 9 22 9C32 9 39 14 39 23Z" fill="' + GOLD + '" stroke="' + GOLD_DARK + '" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<path d="M5.5 19.5H38.5" stroke="' + GOLD_DARK + '" stroke-width="1.2"/>' +
        '<path d="M24 10C27 3 34 0 42 1C37 3 33 6 30 11Z" fill="' + suitColor + '" stroke="' + GOLD_DARK + '" stroke-width="0.8"/>' +
        '<circle cx="22" cy="15" r="2.2" fill="' + suitColor + '"/>';
    }
    return '<g transform="translate(' + f(x) + ' ' + f(y) + ') scale(' + f(scale) + ')">' + body + '</g>';
  }

  function cardBase(extraDefs) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">' +
      '<defs>' +
      '<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#f4f1ea"/></linearGradient>' +
      (extraDefs || '') +
      '</defs>' +
      '<rect x="1.5" y="1.5" width="197" height="277" rx="13" fill="url(#paper)" stroke="#a9a7a1" stroke-width="2"/>';
  }

  function rankText(rank, x, y, size, anchor, color, family) {
    const label = RANKS[rank];
    const fit = rank === 10 ? ' textLength="' + f(size * 0.92) + '" lengthAdjust="spacingAndGlyphs"' : '';
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-family="' + (family || SANS) + '" font-size="' + f(size) +
      '" font-weight="700" text-anchor="' + anchor + '" fill="' + color + '"' + fit + '>' + label + '</text>';
  }

  function courtPanel(rank, suit, color) {
    const defs =
      '<radialGradient id="cp" cx="0.5" cy="0.5" r="0.75"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.7" stop-color="#f7ebc9"/><stop offset="1" stop-color="#ead39a"/></radialGradient>';
    const half =
      crown(rank, 78, 38, 1, color) +
      pip(suit, 64, 50, 17, false, color) + pip(suit, 136, 50, 17, false, color) +
      '<text x="100" y="128" font-family="' + SERIF + '" font-size="66" font-weight="700" text-anchor="middle" fill="' + color + '">' + RANKS[rank] + '</text>';
    const body =
      '<rect x="46" y="24" width="108" height="232" rx="8" fill="url(#cp)" stroke="' + color + '" stroke-width="2.6"/>' +
      '<rect x="51" y="29" width="98" height="222" rx="5" fill="none" stroke="' + GOLD + '" stroke-width="1.4"/>' +
      '<path d="M58 140H142" stroke="' + color + '" stroke-width="1.4" opacity="0.55"/>' +
      pip(suit, 100, 140, 12, false, color) +
      '<g>' + half + '</g>' +
      '<g transform="rotate(180 100 140)">' + half + '</g>';
    return { defs, body };
  }

  /** Full-size face: corner indices + pips or a court panel. */
  function fullFace(id) {
    const suit = suitOf(id), rank = rankOf(id), color = colorOf(id);
    let defs = '', centre = '';
    if (rank === 1) {
      const big = suit === 0 ? 112 : 84;
      centre = pip(suit, 100, 140, big, false, color);
      if (suit === 0) centre = '<ellipse cx="100" cy="140" rx="70" ry="82" fill="none" stroke="' + color + '" stroke-width="1.2" opacity="0.35"/>' + centre;
    } else if (rank >= 11) {
      const cp = courtPanel(rank, suit, color);
      defs = cp.defs; centre = cp.body;
    } else {
      const size = rank === 10 ? 34 : 36;
      for (const [x, r] of PIPS[rank]) {
        const y = PIP_TOP + (PIP_BOTTOM - PIP_TOP) * r;
        centre += pip(suit, x, y, size, r > 0.5, color);
      }
    }
    const index = rankText(rank, 24, 46, 40, 'middle', color) + pip(suit, 24, 66, 26, false, color);
    return cardBase(defs) + centre +
      '<g>' + index + '</g>' +
      '<g transform="rotate(180 100 140)">' + index + '</g>' +
      '</svg>';
  }

  /** Compact face for small cards: big rank + suit on top, one big symbol below. */
  function compactFace(id) {
    const suit = suitOf(id), rank = rankOf(id), color = colorOf(id);
    let defs = '', centre;
    if (rank >= 11) {
      defs = '<radialGradient id="cp" cx="0.5" cy="0.45" r="0.8"><stop offset="0" stop-color="#fffaf0"/><stop offset="0.7" stop-color="#f6e8c2"/><stop offset="1" stop-color="#e6cc8c"/></radialGradient>';
      centre =
        '<rect x="24" y="112" width="152" height="152" rx="12" fill="url(#cp)" stroke="' + color + '" stroke-width="4"/>' +
        '<rect x="31" y="119" width="138" height="138" rx="8" fill="none" stroke="' + GOLD + '" stroke-width="2"/>' +
        crown(rank, 60, 132, 1.82, color) +
        pip(suit, 100, 214, 66, false, color);
    } else {
      centre = pip(suit, 100, 188, rank === 1 ? 118 : 112, false, color);
    }
    const r = RANKS[rank];
    const rankEl = '<text x="13" y="76" font-family="' + SANS + '" font-size="88" font-weight="700" fill="' + color + '"' +
      (rank === 10 ? ' textLength="100" lengthAdjust="spacingAndGlyphs"' : '') + '>' + r + '</text>';
    return cardBase(defs) + rankEl + pip(suit, 158, 44, 56, false, color) + centre + '</svg>';
  }

  const BACKS = {
    blue: { base: '#1d4f9e', light: '#5f8fdc', dark: '#0e2c5e', name: 'Blue' },
    red: { base: '#a51b2d', light: '#e2707c', dark: '#64101b', name: 'Red' },
    green: { base: '#17673a', light: '#5bb07a', dark: '#0b3d21', name: 'Green' },
    purple: { base: '#5a2d85', light: '#a27dcc', dark: '#341957', name: 'Purple' },
    black: { base: '#25282e', light: '#c9a24c', dark: '#111215', name: 'Black & gold' },
  };

  function backSVG(theme) {
    const t = BACKS[theme] || BACKS.blue;
    const star = (r1, r2, n) => {
      let d = '';
      for (let i = 0; i < n * 2; i++) {
        const a = Math.PI * i / n - Math.PI / 2;
        const r = i % 2 ? r2 : r1;
        d += (i ? 'L' : 'M') + f(100 + Math.cos(a) * r) + ' ' + f(140 + Math.sin(a) * r);
      }
      return d + 'Z';
    };
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280" width="200" height="280">' +
      '<defs>' +
      '<pattern id="lat" width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(45 100 140)">' +
      '<rect width="18" height="18" fill="' + t.base + '"/>' +
      '<path d="M0 9H18M9 0V18" stroke="' + t.light + '" stroke-width="1.6" opacity="0.55"/>' +
      '<circle cx="9" cy="9" r="2.6" fill="' + t.light + '" opacity="0.8"/>' +
      '<circle cx="0" cy="0" r="1.6" fill="' + t.light + '" opacity="0.5"/><circle cx="18" cy="18" r="1.6" fill="' + t.light + '" opacity="0.5"/>' +
      '<circle cx="18" cy="0" r="1.6" fill="' + t.light + '" opacity="0.5"/><circle cx="0" cy="18" r="1.6" fill="' + t.light + '" opacity="0.5"/>' +
      '</pattern>' +
      '<radialGradient id="sh" cx="0.5" cy="0.4" r="0.75"><stop offset="0" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient>' +
      '</defs>' +
      '<rect x="1.5" y="1.5" width="197" height="277" rx="13" fill="#fbfaf6" stroke="#a9a7a1" stroke-width="2"/>' +
      '<rect x="11" y="11" width="178" height="258" rx="8" fill="url(#lat)"/>' +
      '<rect x="11" y="11" width="178" height="258" rx="8" fill="url(#sh)"/>' +
      '<rect x="11" y="11" width="178" height="258" rx="8" fill="none" stroke="' + t.dark + '" stroke-width="3"/>' +
      '<rect x="18" y="18" width="164" height="244" rx="5" fill="none" stroke="' + t.light + '" stroke-width="1.6" opacity="0.9"/>' +
      '<ellipse cx="100" cy="140" rx="44" ry="56" fill="' + t.base + '" stroke="' + t.light + '" stroke-width="3"/>' +
      '<ellipse cx="100" cy="140" rx="37" ry="49" fill="none" stroke="' + t.dark + '" stroke-width="1.5"/>' +
      '<path d="' + star(34, 13, 8) + '" fill="' + t.light + '" opacity="0.95"/>' +
      '<circle cx="100" cy="140" r="9" fill="' + t.base + '" stroke="' + t.light + '" stroke-width="2"/>' +
      '</svg>';
  }

  function dataURL(svg) {
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  return {
    W, H, RED, BLACK, SUIT_PATHS, BACKS,
    fullFace, compactFace, backSVG, dataURL, pip,
  };
});
