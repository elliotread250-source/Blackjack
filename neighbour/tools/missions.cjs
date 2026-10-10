const assert=require('node:assert/strict');
const {World}=require('../js/world.js');
const {buildLevel}=require('../js/level.js');
const {solveLevel}=require('../js/puzzle.js');
for(const mission of [1,2]) {
 const level=buildLevel(mission), solved=solveLevel(level);
 for(const id of level.targets) assert(solved.have.has(id),`Mission ${mission+1}: ${id} physically reachable`);
 const w=new World({mission,seed:7});
 w.step(1/60,{}); assert(!w.flags.won,'cannot win at spawn');
 if(mission===1) {
  for(const id of level.targets) assert(w.pickUp(w.propById[id]));
 } else {
  assert(w.pickUp(w.propById.missionRadio)); w.step(1/60,{}); assert(!w.flags.won,'radio alone insufficient'); w.setPower(true);
 }
 const save=w.serialize(), copy=new World({mission:save.mission}); assert(copy.load(save)); assert.equal(copy.level.mission,mission);
 copy.step(1/60,{}); assert(copy.flags.won,'saved mission completes at home');
 w.player.z=-8; w.step(1/60,{}); assert(!w.flags.won,'must escape');
 Object.assign(w.player,w.level.spawn); w.step(1/60,{}); assert(w.flags.won,'mission wins at home');
 console.log(`Mission ${mission+1}: reachable targets, objectives, escape and save/load passed`);
}
