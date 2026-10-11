export const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function outcome(b){for(const l of lines)if(b[l[0]]&&l.every(i=>b[i]===b[l[0]]))return b[l[0]];return b.every(Boolean)?'draw':null;}
export function bestMove(b,turn='O'){let best=-Infinity,move=-1;for(let i=0;i<9;i++)if(!b[i]){b[i]=turn;const r=outcome(b);const v=r?(r===turn?1:0):-value(b,turn==='O'?'X':'O');b[i]='';if(v>best){best=v;move=i;}}return move;}
function value(b,t){let best=-Infinity;for(let i=0;i<9;i++)if(!b[i]){b[i]=t;const r=outcome(b);const v=r?(r===t?1:0):-value(b,t==='O'?'X':'O');b[i]='';best=Math.max(best,v);}return best===-Infinity?0:best;}
export function shuffled(a,random=Math.random){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function guess(word,letters,key){if(!/^[A-Z]$/.test(key)||letters.includes(key))return letters;return [...letters,key];}
export function wordState(word,letters){const misses=letters.filter(c=>!word.includes(c)).length;return {misses,won:[...word].every(c=>letters.includes(c)),lost:misses>=6};}
