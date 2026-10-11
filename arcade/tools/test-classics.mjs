import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import * as rules from '../games/rules.mjs';
let leaves=0;function explore(b){const r=rules.outcome(b);if(r){assert.notEqual(r,'X');leaves++;return;}for(let i=0;i<9;i++)if(!b[i]){b[i]='X';if(!rules.outcome(b)){const j=rules.bestMove(b);b[j]='O';explore(b);b[j]='';}else {assert.notEqual(rules.outcome(b),'X');leaves++;}b[i]='';}}
explore(Array(9).fill(''));assert(leaves>0);assert.equal(rules.outcome(['X','X','X','','','','','','']),'X');
assert.deepEqual(rules.guess('CAT',['A'],'A'),['A']);assert(rules.wordState('CAT',['C','A','T']).won);assert(rules.wordState('CAT',['B','D','E','F','G','H']).lost);
class El{constructor(){this.style={};this.children=[];this.value='';this.classList={add(){},remove(){},toggle(){}};this.disabled=false;this.textContent='';}set innerHTML(v){this.children=[];this.html=v;if(v.includes('<option>'))this.value=v.match(/<option>(.*?)<\/option>/)[1];}get innerHTML(){return this.html||'';}append(x){this.children.push(x);}setAttribute(){}querySelector(s){return this[s]??=new El();}}
const source=fs.readFileSync(new URL('../games/play.js',import.meta.url),'utf8').replace(/^import .*;\n/,'');
for(const id of ['tic-tac-toe','memory-match','simon','whack-a-mole','hangman']){
 const els={};const get=s=>els[s]??=new El();let time=0,q=[],key;
 const context={...rules,document:{querySelector:get,addEventListener:(n,f)=>key=f,createElement:()=>new El()},location:{search:'?game='+id},URLSearchParams,localStorage:{getItem:()=>null,setItem(){}},performance:{now:()=>time},Math,setTimeout:(f,ms)=>{q.push({f,t:time+ms});return q.length;},clearTimeout:()=>{},console};
 vm.runInNewContext(source,context);
 const tick=ms=>{const end=time+ms;let guard=0;while(q.some(x=>x.t<=end)&&guard++<1000){q.sort((a,b)=>a.t-b.t);const x=q.shift();time=x.t;x.f();}time=end;};
 assert(get('#title').textContent.length);
 if(id==='tic-tac-toe'){get('#board').children[0].onclick();tick(400);assert.equal(get('#board').children.filter(x=>x.textContent==='O').length,1);}
 if(id==='memory-match'){get('#board').children[0].onclick();get('#board').children[1].onclick();tick(900);assert(get('#score').textContent.includes('1 moves'));}
 if(id==='simon'){tick(1200);assert(get('#status').textContent.includes('Your turn'));}
 if(id==='whack-a-mole'){get('#score').children[0].onclick();tick(31000);assert(get('#status').textContent.startsWith('Time!'));}
 if(id==='hangman'){const keys=get('#board').querySelector('.keys');assert.equal(keys.children.length,26);keys.children[0].onclick();assert(keys.children[0].disabled);}
 get('#restart').onclick();tick(2000);assert(get('#board').children.length||id==='hangman');console.log(id+': init, interaction and restart passed');
}
console.log('Smart bot cannot lose across '+leaves+' complete player variations; word win/loss rules passed');
