const assert=require('node:assert/strict');
const {buildLevel,MISSIONS}=require('../js/level.js');
const {World}=require('../js/world.js');
const {solveLevel}=require('../js/puzzle.js');
const {buildGrid,findNode,playerReach,MAX_L}=require('../js/nav.js');
const {boxesOverlap}=require('../js/geom.js');
let count=0;
const ok=(v,msg)=>{assert(v,msg);count++;};
for(const mission of [3,4]) {
 const l=buildLevel(mission);
 ok(l.mission===mission && l.exit,'map identity and extraction zone');
 ok(l.boxes.length!==buildLevel(0).boxes.length,'separate geometry');
 const solved=solveLevel(l);
 ok(solved.have.has('archive'),'full puzzle is physically reachable');
 for(const disable of [['power'],['item:redkey']])ok(!solveLevel(l,{disable}).have.has('archive'),'cannot bypass required lock '+disable);
 let w=new World({mission,seed:7});
 for(const p of w.pois)ok(w.path(w.ai.x,w.ai.y,w.ai.z,p.x,p.y,p.z)?.complete,'patrol can reach '+p.id);
 w.ai.update=()=>{};
 w.step(1/60,{});ok(!w.flags.won,'no instant win at spawn');
 ok(!w.level.boxes.some(b=>b.col && boxesOverlap(w.playerBox(),b,.005)),'spawn has full standing clearance');
 // Move both directions using the actual 60 Hz player physics, rather than teleporting between stair steps.
 Object.assign(w.player,mission===3?{x:0,y:3.2,z:3.1,yaw:0}:{x:-1,y:3.2,z:-3.3,yaw:0});
 for(let i=0;i<180;i++)w.step(1/60,{mz:1});
 ok(w.player.y<.3,'player descends into basement');
 w.player.yaw=Math.PI;
 for(let i=0;i<180;i++)w.step(1/60,{mz:1});
 ok(w.player.y>3.15,'player climbs back up stairs');
 // Key items remain available after being caught.
 w.pickUp(w.propById.fuse); w.catchPlayer();for(let i=0;i<170;i++)w.step(1/60,{});
 ok(!w.player.caught && !w.propById.fuse.gone,'caught recovery retains fuse');
 w.pickUp(w.propById.archive);w.setPower(true);
 const saved=w.serialize();w=new World({mission:saved.mission});ok(w.load(saved),'save reloads');w.ai.update=()=>{};
 ok(w.propById.archive.gone && w.steps.archive!==undefined && w.flags.power,'saved puzzle progress');
 Object.assign(w.player,{x:0,y:0,z:-10});w.step(1/60,{});ok(!w.flags.won,'records alone do not win away from escape');
 Object.assign(w.player,l.spawn);w.flags.power=false;w.step(1/60,{});ok(!w.flags.won,'power also required');
 w.setPower(true);w.step(1/60,{});ok(w.flags.won,'records plus power plus extraction wins');
 console.log(MISSIONS[mission].name+': puzzle, patrol, stairs, recovery, saves and escape passed');
}
console.log(count+' expansion checks passed');

// Enclosures must block sight, including the stair shaft above the basement ceiling.
const {rayBox}=require('../js/geom.js');
function blocked(l,o,d){return l.boxes.some(b=>b.vis&&b.op&&rayBox(...o,...d,b,1)>=0);}
const cellar=buildLevel(3);
for(const y of [1,3.15,4.5,5.7]) {
 assert(blocked(cellar,[0,y,1],[-2,0,0]),'left stair shaft wall at '+y);
 assert(blocked(cellar,[0,y,1],[2,0,0]),'right stair shaft wall at '+y);
}
assert(blocked(cellar,[0,4.5,0],[0,0,-5]),'stairwell upper end closed');
for(const mission of [3,4]) {
 const l=buildLevel(mission), edge=mission===3?12:11, z=mission===3?-20:-18;
 for(const y of [.5,1.7,2.9])for(const sign of [-1,1])assert(blocked(l,[0,y,z],[sign*(edge+1),0,0]),'basement side enclosure');
}
const house=buildLevel(4);
for(const d of [[-5,0,0],[5,0,0],[0,0,5],[0,4,0]])assert(blocked(house,[5,4.7,9],d),'player home wall / ceiling');
assert(!blocked(house,[5,4.7,9],[0,0,-4]),'player home doorway remains open');
assert(house.roofs.length===2,'both houses have roofs');
const homeWorld=new World({mission:4});homeWorld.ai.update=()=>{};
for(let i=0;i<180;i++)homeWorld.step(1/60,{mz:1});
assert(homeWorld.player.z<5.8,'player can walk out of own house');
console.log('Enclosure rays, two house roofs and player-home exit checks passed');
for(const mission of [3,4]) {
 const w=new World({mission,seed:11});
 for(const zone of w.level.safeZones){
  const x=(zone.x0+zone.x1)/2,z=(zone.z0+zone.z1)/2,y=zone.y0<0?0:zone.y0===0?0:3.2;
  Object.assign(w.player,{x,y,z});
  assert(w.isSafe(x,y,z),'safe zone is height aware');
  assert.equal(w.path(w.ai.x,w.ai.y,w.ai.z,x,y,z),null,'neighbour cannot target refuge');
  assert.equal(w.hear(w.ai,{x,y,z,radius:100,player:true}),0,'refuge noise ignored');
  w.ai.setState('chase');w.ai.lastKnown=[x,y,z];
  for(let i=0;i<300;i++)w.step(1/60,{});
  assert(!w.player.caught,'protected during live chase');
  assert(!w.isSafe(w.ai.x,w.ai.y,w.ai.z),'neighbour never enters refuge');
  w.catchPlayer();assert(!w.player.caught,'contact cannot catch protected player');
 }
}
console.log('Safe-zone pursuit, navigation, noise and catch checks passed');
