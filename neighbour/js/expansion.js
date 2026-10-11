// Two separate collision maps. Basement floors use y=0; the house and stair landing
// sit at y=3.2, allowing the existing stair, item and navigation physics to be shared.
import { makeBox } from './geom.js';

export function buildExpansion(mission) {
  const cellar = mission === 3, H = 3.2;
  const L = { mission, boxes: [], doors: [], windows: [], items: [], decor: [], lights: [], lightZones: [], hides: [], pois: [], camMounts: [], roofs: [], regions: [], holes: [], entries: {}, targets: ['archive'], outdoorLight: cellar ? 0.3 : 0.65,
    indoor: cellar, groundVisualY: cellar ? -0.05 : H - 0.02,
    titleCamera: cellar ? { from: [0, 2.2, -3], to: [0, 1.3, -16] } : { from: [16, 8, 12], to: [0, 4.7, -12] },
    collectTargets: true, requirePower: true,
    objectiveName: cellar ? 'Below the Floorboards' : 'The House on the Hill' };
  const box = (x0,y0,z0,x1,y1,z1,m='concrete',c=0xffffff,extra={}) => {
    const b=makeBox(x0,y0,z0,x1,y1,z1,{m,c,col:true,vis:true,op:true,...extra});L.boxes.push(b);return b;
  };
  const detail=(...args)=>{const b=box(...args);b.col=false;b.op=false;return b;};
  function wall(axis,t,a,b,y,h,opening,mat='brick',color=0x8c8276) {
    const seg=(u,v,lo,hi)=> {if(v<=u||hi<=lo)return; if(axis==='x')box(u,lo,t,v,hi,t+.2,mat,color);else box(t,lo,u,t+.2,hi,v,mat,color);};
    if(opening){const [c,w,lo,hi]=opening;seg(a,c-w/2,y,y+h);seg(c+w/2,b,y,y+h);seg(c-w/2,c+w/2,y,lo);seg(c-w/2,c+w/2,hi,y+h);}
    else seg(a,b,y,y+h);
  }
  function door(id,axis,t,c,y,lock=null,name='Door') {
    L.doors.push({id,axis,c,t0:t,t1:t+.2,y,w:1.6,h:2.2,swing:1,hinge:-1,lock,open:false,name,mat:'door',tint:lock==='red'?0x922e32:0x53766f,inside:-1,chained:false});
    return [c,1.6,y,y+2.2];
  }
  function lamp(name,x,y,z,color=0xffce8b,powered=false) {
    detail(x-.35,y-.08,z-.17,x+.35,y+.08,z+.17,'emissive',color);
    L.lights.push({name,x,y:y-.15,z,color,intensity:3.5,dist:9,power:powered});
  }
  function table(x,y,z,color=0x775b3f) {
    box(x-1,y+.72,z-.48,x+1,y+.86,z+.48,'woodfloor',color);
    for(const dx of [-.82,.82])for(const dz of [-.34,.34])box(x+dx-.06,y,z+dz-.06,x+dx+.06,y+.72,z+dz+.06,'wood',color);
  }
  function shelves(x,y,z) {
    box(x-.8,y,z-.34,x-.7,y+2.1,z+.34,'metal',0x45565b);box(x+.7,y,z-.34,x+.8,y+2.1,z+.34,'metal',0x45565b);
    for(const sy of [.15,.8,1.5,2.05])box(x-.8,y+sy,z-.34,x+.8,y+sy+.08,z+.34,'board',0x92765a);
    for(const [dx,dy,c] of [[-.3,.9,0x728a73],[.3,1.6,0x9c7150]])box(x+dx-.2,y+dy,z-.25,x+dx+.2,y+dy+.35,z+.25,'board',c);
  }
  function item(id,type,x,y,z,name){L.items.push({id,type,x,y,z,missionName:name});}
  function hide(id,x,y,z) {
    // Open-front locker. Geometry leaves room for the player's hide position.
    box(x-.55,y,z-.5,x-.47,y+2.05,z+.45,'board',0x476469);
    box(x+.47,y,z-.5,x+.55,y+2.05,z+.45,'board',0x476469);
    box(x-.55,y,z-.5,x+.55,y+2.05,z-.42,'board',0x476469);
    box(x-.55,y+2.05,z-.5,x+.55,y+2.15,z+.45,'board',0x476469);
    L.hides.push({id,name:'Locker',x,y,z,face:[x,z+1]});
  }
  const poi=(id,x,y,z,w=1)=>L.pois.push({id,x,y,z,look:0,dur:5,anim:'idle',w});
  function stairs(x0,x1,z0) {
    // North is the low end. Sixteen 20 cm risers, 40 cm treads.
    for(let i=0;i<16;i++)box(x0,0,z0+i*.4,x1,(i+1)*.2,z0+(i+1)*.4,'concrete',0x858b90,{tag:'stair'});
  }
  function roomRegion(x0,y0,z0,x1,y1,z1,light=.4){L.regions.push(makeBox(x0,y0,z0,x1,y1,z1));L.lightZones.push({box:makeBox(x0,y0,z0,x1,y1,z1),level:light});}
  if(cellar) {
    // Entry stair, central service corridor, workshop, store, boiler room and locked archive.
    box(-12,-.3,-24,12,0,4,'concrete',0x777d82);
    wall('x',-24,-12,12,0,3.2);wall('x',3.8,-12,12,0,6.2);
    wall('z',-12,-24,4,0,6.2);wall('z',11.8,-24,4,0,6.2);
    box(-12,3.05,-24,12,3.3,-4,'concrete',0x747677);
    box(-12,3.05,-4,-1.2,3.3,4,'concrete',0x747677);box(1.2,3.05,-4,12,3.3,4,'concrete',0x747677);
    box(-1.2,5.9,-4,1.2,6.1,4,'plaster',0xaeb2a8);
    stairs(-1,1,-3.6);box(-1,3,2.8,1,3.2,3.8,'woodfloor',0x866445);
    // Stair shaft side walls stop accidental falls onto the cellar ceiling.
    wall('z',-1.2,-4,4,0,5.9);wall('z',1,-4,4,0,5.9);
    // Close the upper end of the shaft; the opening below leads into the corridor.
    wall('x',-4,-1.2,1.2,3.05,2.85);
    // A full-height end wall seals the landing against the outer shell.
    wall('x',3.8,-1.2,1.2,0,5.9);
    for (let i=0;i<16;i++) detail(-.98,(i+1)*.2,-3.6+i*.4,.98,(i+1)*.2+.012,-3.54+i*.4,'trim',0xd9bc72);
    lamp('stairwell',0,4.9,-1,0xc5dfdf);
    wall('z',-3,-16,-4,0,3.05,door('study','z',-3,-11,0,'power','Workshop electric door'));
    wall('z',3,-16,-4,0,3.05,door('storage','z',3,-6,0,null,'Storage door'));
    wall('x',-8,-12,-3,0,3.05,null); // workshop has only its powered entrance
    wall('x',-16,-12,12,0,3.05,door('basement','x',-16,0,0,'red','Archive red lock'));
    table(-8,0,-12);item('redkey','redkey',-8,.87,-12,'Archive key');
    table(8,0,-5);item('fuse','fuse',8,.87,-5,'Workshop fuse');
    table(7,0,-21);item('archive','book',7,.87,-21,'Basement records');
    L.fusebox={x:2.8,y:1.35,z:-9};
    for(const [x,z] of [[-9,-20],[-6,-22],[8,-9],[8,-14]])shelves(x,0,z);
    // Boiler bank and overhead pipes create distinctive industrial silhouettes.
    for(const x of [-10,-8]){box(x,0,-5.9,x+1.2,1.9,-4.6,'metal',0x597781);detail(x+.15,1.1,-4.58,x+1.05,1.2,-4.5,'emissive',0xe6a344);}
    for(const x of [-2.4,2.4])detail(x,2.6,-23,x+.15,2.8,1,'metal',0x8e5c42);
    hide('cellarLocker',9.8,0,-12);hide('workshopLocker',-10,0,-14.8);
    lamp('home',0,5.7,2,0x94e1cc);lamp('living',0,2.7,-6);lamp('kitchen',-7,2.7,-12,0xa7d1dd,true);lamp('basement',4,2.7,-20,0xe49777);lamp('porch',8,2.7,-10);
    L.spawn={x:0,y:H,z:3.15,yaw:0}; L.exit=makeBox(-.9,3,2.75,.9,5.5,3.75);
    L.navBounds={x0:-11.7,z0:-23.7,x1:11.7,z1:3.7};L.reachBounds=L.navBounds;
    poi('stove',7,0,-11,3);poi('corridor',0,0,-9,3);poi('boiler',-5,0,-6);poi('workshop',-7,0,-14);
    roomRegion(-12,-.1,-24,12,6.2,4,.38);L.holes=[[-13,-25,13,5]];
  } else {
    // A new teal bungalow on a raised hillside; a real lower floor sits beneath it.
    // Yard slabs stop at the footprint so the basement remains hollow.
    box(-20,0,-30,-11,H,14,'grass',0x75905c);box(11,0,-30,20,H,14,'grass',0x75905c);
    box(-11,0,-30,11,H,-22,'grass',0x75905c);box(-11,0,-2,11,H,14,'grass',0x75905c);
    L.holes=[[-11,-22,11,-2]];
    box(-11,-.25,-22,11,0,-2,'concrete',0x707b81);
    // Upper slab leaves a long stairwell open.
    box(-11,3,-22,11,H,-10.2,'woodfloor',0xa1855b);
    box(-11,3,-10.2,-2.2,H,-2,'woodfloor',0xa1855b);
    box(.2,3,-10.2,11,H,-2,'woodfloor',0xa1855b);
    box(-2.2,3,-3.6,.2,H,-2,'woodfloor',0xa1855b);
    stairs(-2,0,-10);
    for(const y of [0,H]) {
      wall('z',-11,-22,-2,y,3.0,null,y?'siding':'brick',y?0x69a197:0x777273);
      wall('z',10.8,-22,-2,y,3.0,null,y?'siding':'brick',y?0x69a197:0x777273);
      wall('x',-22,-11,11,y,3.0,null,y?'siding':'brick',y?0x69a197:0x777273);
      if (!y) wall('x',-2.2,-11,11,0,3,null,'brick',0x777273);
      else {
        wall('x',-2.2,-11,2,H,3,[-6,2.4,H+.9,H+2.1],'siding',0x69a197);
        wall('x',-2.2,2,7,H,3,door('front','x',-2.2,5,H,null,'Front door'),'siding',0x69a197);
        wall('x',-2.2,7,11,H,3,[9,1.6,H+.9,H+2.1],'siding',0x69a197);
        for (const [id,c,w] of [['frontWest',-6,2.4],['frontEast',9,1.6]]) L.windows.push({id,axis:'x',c,t0:-2.2,t1:-2,sill:H+.9,top:H+2.1,w,glass:true,boards:false,breakable:true,name:'Front window',outside:1,learned:false});
      }
    }
    // Continuous foundation rim joins basement walls to the upper slab.
    wall('z',-11,-22,-2,2.95,.3,null,'brick',0x777273);
    wall('z',10.8,-22,-2,2.95,.3,null,'brick',0x777273);
    wall('x',-22,-11,11,2.95,.3,null,'brick',0x777273);
    wall('x',-2.2,-11,11,2.95,.25,null,'brick',0x777273);
    // Front windows with actual openings, not glass pasted over solid walls.
    // Side rooms are divided from the foyer; the kitchen holds a fuse.
    wall('z',1,-22,-10.5,H,3,door('bedroom','z',1,-16,H,null,'Bedroom door'),'paper2',0xd1b89b);
    wall('x',-10.5,-11,1,H,3,door('kitchen','x',-10.5,-6,H,null,'Kitchen door'),'paper1',0xd6d8bd);
    // Balcony-style stair rail, open at the south landing and north foot.
    box(-2.28,H,-10.15,-2.18,H+.85,-3.7,'trim',0x587369);
    box(.18,H,-10.15,.28,H+.85,-3.7,'trim',0x587369);
    box(-2.28,H,-10.25,.28,H+.85,-10.15,'trim',0x587369);
    for(let i=0;i<16;i++) detail(-1.98,(i+1)*.2,-10+i*.4,-.02,(i+1)*.2+.012,-9.94+i*.4,'trim',0xd9bc72);
    box(-11,6.2,-22,11,6.4,-2,'plaster',0xe3e0d1);
    L.roofs.push({x0:-11.6,x1:11.6,z0:-22.6,z1:-1.4,y:6.4,h:3,ridge:'x',tint:0x344e61,gable:0x69a197});
    wall('x',-13,-11,11,0,3,door('basement','x',-13,4,0,'red','Cellar vault'));
    wall('z',-3,-22,-13,0,3,door('study','z',-3,-17,0,'power','Records room electric door'));
    table(-7,H,-17);item('fuse','fuse',-7,H+.87,-17,'Cellar fuse');
    table(6,H,-19);item('redkey','redkey',6,H+.87,-19,'Cellar key');
    table(-7,0,-19);item('archive','book',-7,.87,-19,'The neighbour’s ledger');
    L.fusebox={x:10.6,y:1.35,z:-7};
    // Living-room sofa, bed, kitchen counter, garden planters, and cellar storage.
    box(5,H,-8,9,H+.48,-6.2,'fabric',0xb36e50);box(5,H+.48,-8,9,H+1.25,-7.6,'fabric',0xa45d43);
    box(4,H,-16,7,H+.45,-13,'wood',0x866442);box(4,H+.45,-16,7,H+.75,-13,'fabric',0x667d9d);
    box(-10.7,H,-20.8,-8.7,H+.9,-12,'counter',0xb6c6b4);
    for(const x of [-8,-3,9]){box(x-1,H,2,x+1,H+.45,3,'brick',0x996552);detail(x-.9,H+.45,2.1,x+.9,H+.8,2.9,'hedge',0x4c7045);}
    for(const [x,z]of [[-8,-6],[8,-17],[8,-20]])shelves(x,0,z);
    hide('foyerLocker',9.5,H,-4);hide('cellarLocker',-9,0,-10.5);hide('bedroomLocker',9,H,-20.5);
    lamp('home',5,H+2.4,0,0xf1d0a0);lamp('living',6,H+2.65,-7);lamp('kitchen',-6,H+2.65,-16);lamp('porch',6,H+2.65,-18);
    lamp('basement',4,2.7,-17,0x96bad5,true);lamp('home',-6,2.7,-18,0xe5c788,true);lamp('living',-5,2.7,-6,0x88b9b0);
    // Player's own home: an open front doorway faces the neighbour across the path.
    box(1,H-.12,6,9,H,13,'woodfloor',0xb69972);
    wall('x',6,1,9,H,2.9,[5,2,H,H+2.35],'siding',0xd4b17a);
    wall('x',12.8,1,9,H,2.9,null,'siding',0xd4b17a);
    wall('z',1,6,13,H,2.9,null,'siding',0xd4b17a);
    wall('z',8.8,6,13,H,2.9,null,'siding',0xd4b17a);
    box(1,H+2.9,6,9,H+3.05,13,'plaster',0xe9e1cc);
    L.roofs.push({x0:.5,x1:9.5,z0:5.5,z1:13.4,y:H+3.05,h:1.65,ridge:'x',tint:0x965b49,gable:0xd4b17a});
    // Bright porch, doormat, sofa, side table and bookshelf identify the return point.
    detail(4,H+.006,5,6,H+.025,6.6,'fabric',0x5b8875);
    box(1.5,H,9,3,H+.45,12,'fabric',0x548784);
    box(1.5,H+.45,9,1.85,H+1.1,12,'fabric',0x446f73);
    table(7,H,11.5);shelves(2.5,H,7);
    lamp('playerHome',5,H+2.65,10,0xffd6a0);
    lamp('playerPorch',5,H+2.5,5.8,0xffdfa6);
    roomRegion(1,H,6,9,H+2.9,13,.85);
    detail(4.15,H+.006,-1.9,5.85,H+.018,5,'paving',0xb8b3a1);
    // Pale fascia and corner posts make the neighbour's silhouette read clearly.
    for(const x of [-11,10.7])detail(x,H,-22,x+.3,6.25,-2,'trim',0xe4e4d4);
    detail(-11.1,6,-2.25,11.1,6.25,-1.94,'trim',0xe4e4d4);
    L.spawn={x:5,y:H,z:9,yaw:0};L.exit=makeBox(3,H-.15,7,7,H+2.5,12);
    // Perimeter hedge walls keep every reachable surface inside the map.
    wall('x',-29.8,-20,20,H,2.2,null,'hedge',0x45634a);wall('x',13.8,-20,20,H,2.2,null,'hedge',0x45634a);
    wall('z',-20,-30,14,H,2.2,null,'hedge',0x45634a);wall('z',19.8,-30,14,H,2.2,null,'hedge',0x45634a);
    L.navBounds={x0:-19.5,z0:-29.5,x1:19.5,z1:13.5};L.reachBounds=L.navBounds;
    poi('stove',-6,H,-14,3);poi('living',7,H,-5,2);poi('bedroom',5,H,-17,2);poi('cellar',3,0,-8,3);poi('garden',8,H,5);
    roomRegion(-11,0,-22,11,3,-2,.32);roomRegion(-11,H,-22,11,6.2,-2,.65);
    L.entries.frontDoor={name:'front door',kind:'door',ref:'front',x:5,z:-1,y:H};
  }
  // Industrial wall bands and ceiling beams give both cellars a finished enclosure.
  const edge=cellar?12:11, back=cellar?-24:-22, front=cellar?3.8:-2.2;
  for(const x of [-edge+.21,edge-.3]) {
    detail(x,.12,back+.2,x+.08,.28,front,'metal',0x53686a);
    detail(x,2.65,back+.2,x+.08,2.78,front,'trim',0xa7b2aa);
  }
  for(const z of (cellar?[-22,-18]:[-20,-15]))detail(-edge+.2,2.85,z,edge-.2,3.02,z+.18,'wood',0x66594d);
  // These are useful distractions on both maps and do not replace mission items.
  item('can1','can',2,0,-6);item('bottle1','bottle',1,0,-12);item('crate1','crate',-5,0,-5);
  L.basementTrigger=makeBox(0,-100,0,1,-99,1); // expansion wins use its explicit extraction zone
  return L;
}
