/* Arcade-mode level layouts.
 *
 * Every row is exactly 13 characters (the arcade grid is 13 bricks wide).
 *   .  empty
 *   w o c g r b p m y   one-hit bricks (white, orange, cyan, green, red, blue, purple, magenta, yellow)
 *   x   two-hit silver brick
 *   X   three-hit gold brick
 *   #   indestructible steel
 *
 * Works as a browser global (window.BreakoutLevels) and as a CommonJS module so
 * the headless physics test can load the same data.
 */
(function (root) {
  'use strict';

  var LEVELS = [
    {
      name: 'First Light',
      rows: [
        'wwwwwwwwwwwww',
        'rrrrrrrrrrrrr',
        'ooooooooooooo',
        'yyyyyyyyyyyyy',
        'ggggggggggggg',
        'ccccccccccccc',
      ],
    },
    {
      name: 'Pyramid',
      rows: [
        '......w......',
        '.....wcw.....',
        '....wcbcw....',
        '...wcbpbcw...',
        '..wcbpmpbcw..',
        '.wcbpmrmpbcw.',
        'xxxxxxxxxxxxx',
      ],
    },
    {
      name: 'Invader',
      rows: [
        '...m.....m...',
        '....m...m....',
        '...ggggggg...',
        '..gg.ggg.gg..',
        '.ggggggggggg.',
        '.g.ggxxxgg.g.',
        '.g.g.....g.g.',
        '....cc.cc....',
      ],
    },
    {
      name: 'Checkerboard',
      rows: [
        'x.x.x.x.x.x.x',
        '.r.r.r.r.r.r.',
        'o.o.o.o.o.o.o',
        '.y.y.y.y.y.y.',
        'g.g.g.g.g.g.g',
        '.c.c.c.c.c.c.',
        'b.b.b.b.b.b.b',
      ],
    },
    {
      name: 'Rainbow',
      rows: [
        '...rrrrrrr...',
        '..rooooooor..',
        '.royyyyyyyor.',
        'roygggggggyor',
        'royg.....gyor',
        'royg.....gyor',
        'xxxx.....xxxx',
      ],
    },
    {
      name: 'Heart',
      rows: [
        '..mmm...mmm..',
        '.mrrrm.mrrrm.',
        'mrwwrrmrrrrrm',
        'mrwrrrrrrrrrm',
        'mrrrrrrrrrrrm',
        '.mrrrrrrrrrm.',
        '..mrrrrrrrm..',
        '...mrrrrrm...',
        '....mrrrm....',
        '.....mXm.....',
        '......m......',
      ],
    },
    {
      name: 'Pillars',
      rows: [
        'r.o.y.g.c.b.p',
        'r.o.y.g.c.b.p',
        'x.x.x.x.x.x.x',
        'r.o.y.g.c.b.p',
        'r.o.y.g.c.b.p',
        'x.x.x.x.x.x.x',
        'r.o.y.g.c.b.p',
        '#.#.#.#.#.#.#',
      ],
    },
    {
      name: 'Fortress',
      rows: [
        '#...........#',
        '#.bbbbbbbbb.#',
        '#.bxxxxxxxb.#',
        '#.bxcccccxb.#',
        '#.bxcXXXcxb.#',
        '#.bxcccccxb.#',
        '#.bxxxxxxxb.#',
        '#.bbbbbbbbb.#',
        '###..###..###',
      ],
    },
    {
      name: 'Have a Nice Day',
      rows: [
        '...yyyyyyy...',
        '..yyyyyyyyy..',
        '.yyybyyybyyy.',
        '.yyybyyybyyy.',
        '.yyyyyyyyyyy.',
        '.yryyyyyyyry.',
        '..yryyyyyry..',
        '...yrrrrry...',
        '....yyyyy....',
      ],
    },
    {
      name: 'Diamond Mine',
      rows: [
        '..p.......p..',
        '.pyp.....pyp.',
        'pyXyp...pyXyp',
        '.pyp..p..pyp.',
        '..p..pyp..p..',
        '....pyXyp....',
        '.....pyp.....',
        '......p......',
        '#####...#####',
      ],
    },
    {
      name: 'Labyrinth',
      rows: [
        'ccccccccccccc',
        'c#####.#####c',
        'cbbbbbbbbbbbc',
        'cbb#######bbc',
        'cbbbbbbbbbbbc',
        'c#####.#####c',
        'ppppp...ppppp',
      ],
    },
    {
      name: 'Mothership',
      rows: [
        '....XXXXX....',
        '..XXxxxxxXX..',
        '.XxxmmmmmxxX.',
        'XxmmpwpwpmmxX',
        'XxxxxxxxxxxxX',
        '.#xx#xxx#xx#.',
        '..r..r.r..r..',
      ],
    },
  ];

  if (typeof module === 'object' && module.exports) module.exports = LEVELS;
  else root.BreakoutLevels = LEVELS;
})(typeof self !== 'undefined' ? self : this);
