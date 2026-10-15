const assert = require('node:assert/strict');
const L = require('../js/logic.js'), B = require('../js/bot.js');
for (const moves of [[0,1,0,1,0,1,0],[0,0,1,1,2,2,3],[0,1,1,2,4,2,2,3,4,3,5,3,3]]) {
 const g=L.fromMoves(moves); assert.equal(g.result,1); assert.equal(L.play(g,6),null); L.undo(g); assert.equal(g.result,0);
}
let g=L.newGame(); for(let i=0;i<6;i++) L.play(g,0); assert.equal(L.play(g,0),null); assert.equal(L.play(g,7),null);
for(const level of ['medium','hard','impossible']) {
 assert.equal(B.chooseMove([0,1,0,1,0,2],level,{budget:100}).col,0);
 assert.equal(B.chooseMove([1,0,1,0,2,0],level,{budget:100}).col,0);
}
for(let n=0;n<100;n++) {let g=L.newGame(); while(!g.result){ const legal=L.legalMoves(g.board); L.play(g,legal[Math.floor(Math.random()*legal.length)]); } assert.deepEqual(L.fromMoves(g.moves),g); while(g.moves.length) L.undo(g); assert.deepEqual(g.board,L.createBoard()); }
console.log('Connect 4 wins, full columns, undo, bot tactics and 100 complete games passed');
