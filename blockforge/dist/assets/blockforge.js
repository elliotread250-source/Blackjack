"use strict";(()=>{var Nb={low:{renderDistance:4,fancyLeaves:!1,smoothLighting:!0,shadows:!1,waving:!1,clouds:!0,resolutionScale:1,mipmaps:!0},medium:{renderDistance:6,fancyLeaves:!0,smoothLighting:!0,shadows:!1,waving:!0,clouds:!0,resolutionScale:1,mipmaps:!0},high:{renderDistance:8,fancyLeaves:!0,smoothLighting:!0,shadows:!0,shadowQuality:2048,waving:!0,clouds:!0,resolutionScale:1,mipmaps:!0}},zf={controls:"keyboard",touchSensitivity:1,touchButtonScale:1,preset:"low",renderDistance:4,fov:70,sensitivity:1,invertY:!1,viewBobbing:!0,brightness:.5,fancyLeaves:!1,smoothLighting:!0,shadows:!1,shadowQuality:1024,waving:!1,clouds:!0,resolutionScale:1,mipmaps:!0,guiScale:2,fullscreen:!1,volume:.6,showFps:!1,maxFps:0},Hf="blockforge.settings.v1";function Gf(){try{let i=localStorage.getItem(Hf);if(i)return{...zf,...JSON.parse(i)}}catch{}return{...zf}}function na(i){try{localStorage.setItem(Hf,JSON.stringify(i))}catch{}}function sl(i,t){return Object.assign(i,Nb[t]),i.preset=t,i}var Qs=(i,t=0,e=255)=>i<t?t:i>e?e:i,x=i=>{let t=parseInt(i.replace("#",""),16);return[t>>16&255,t>>8&255,t&255]},W=(i,t)=>[Qs(i[0]*t),Qs(i[1]*t),Qs(i[2]*t)],kn=(i,t,e)=>[i[0]+(t[0]-i[0])*e,i[1]+(t[1]-i[1])*e,i[2]+(t[2]-i[2])*e],al=(i,t)=>[Qs(i[0]+t),Qs(i[1]+t),Qs(i[2]+t)],en=i=>[i,i,i];function Bb(i){let t=2166136261;for(let e=0;e<i.length;e++)t^=i.charCodeAt(e),t=Math.imul(t,16777619);return t>>>0}function Hh(i){let t=i>>>0;return()=>{t=t+1831565813>>>0;let e=t;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}}var Pt=class i{constructor(){this.d=new Uint8ClampedArray(1024)}set(t,e,n,s=255){t&=15,e&=15;let r=(e*16+t)*4;this.d[r]=n[0],this.d[r+1]=n[1],this.d[r+2]=n[2],this.d[r+3]=s}get(t,e){t&=15,e&=15;let n=(e*16+t)*4;return[this.d[n],this.d[n+1],this.d[n+2]]}a(t,e){return this.d[((e&15)*16+(t&15))*4+3]}setA(t,e,n){this.d[((e&15)*16+(t&15))*4+3]=n}fill(t,e=255){for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=t(s,n);r&&this.set(s,n,r,e)}return this}rect(t,e,n,s,r,a=255){for(let o=e;o<=s;o++)for(let l=t;l<=n;l++)this.set(l,o,r,a);return this}outline(t,e,n,s,r){for(let a=t;a<=n;a++)this.set(a,e,r),this.set(a,s,r);for(let a=e;a<=s;a++)this.set(t,a,r),this.set(n,a,r);return this}shadeRect(t,e,n,s,r){for(let a=e;a<=s;a++)for(let o=t;o<=n;o++)this.set(o,a,W(this.get(o,a),r),this.a(o,a));return this}bevel(t,e,n,s,r,a){for(let o=t;o<=n;o++)this.set(o,e,W(this.get(o,e),r)),this.set(o,s,W(this.get(o,s),a));for(let o=e+1;o<s;o++)this.set(t,o,W(this.get(t,o),r)),this.set(n,o,W(this.get(n,o),a));return this}clear(){return this.d.fill(0),this}copy(){let t=new i;return t.d.set(this.d),t}rotate(t){let e=this.copy();for(let n=0;n<(t&3);n++){let s=n===0?e:this.copy();for(let r=0;r<16;r++)for(let a=0;a<16;a++){let o=(r*16+a)*4,l=((15-a)*16+r)*4;for(let c=0;c<4;c++)this.d[o+c]=s.d[l+c]}}return this}};function vn(i,t,e=t){let n=new Float32Array(t*e);for(let o=0;o<n.length;o++)n[o]=i();let s=16/t,r=16/e,a=o=>o*o*(3-2*o);return(o,l)=>{let c=(o+.5)/s-.5,h=(l+.5)/r-.5,u=Math.floor(c),f=Math.floor(h),d=a(c-u),g=a(h-f),b=(u%t+t)%t,p=(b+1)%t,m=(f%e+e)%e,_=(m+1)%e,y=n[m*t+b]+(n[m*t+p]-n[m*t+b])*d,v=n[_*t+b]+(n[_*t+p]-n[_*t+b])*d;return y+(v-y)*g}}function ne(i,t,e=.35){let n=[];for(let s=0;s<t;s++)n.push(W(i,1-e+2*e*s/(t-1)));return n}function Fb(i,t={}){var l,c,h,u;let e=((l=t.layers)!=null?l:[[4,.6],[8,.4]]).map(([f,d])=>[vn(i,f),d]),n=(c=t.white)!=null?c:.35,s=(h=t.contrast)!=null?h:1.6,r=(u=t.bias)!=null?u:0,a=e.reduce((f,d)=>f+d[1],0)+n,o=new Float32Array(256);for(let f=0;f<16;f++)for(let d=0;d<16;d++){let g=0;for(let[b,p]of e)g+=b(d,f)*p;g+=i()*n,g=g/a,o[f*16+d]=Qs(.5+(g-.5)*s+r,0,.9999)}return(f,d)=>o[(d&15)*16+(f&15)]}function St(i,t,e={}){let n=Fb(i,e);return new Pt().fill((s,r)=>t[Math.floor(n(s,r)*t.length)])}var de={stone:x("#7d7d7d"),dirt:x("#86603e"),sand:x("#dccf9e"),redSand:x("#bf6a26"),deepslate:x("#4d4d52"),netherrack:x("#6e2d2b"),endStone:x("#dcdf9e"),granite:x("#9a6b57"),diorite:x("#c9c9c6"),andesite:x("#868787"),tuff:x("#6c6d65"),calcite:x("#dfe0dc"),clay:x("#a0a6b4"),mud:x("#3c3a3c"),snow:x("#f4fbfb"),blackstone:x("#2e2a30"),basalt:x("#4b4a4f"),obsidian:x("#140f1f")};function ap(i,t=de.stone){return St(i,ne(t,5,.18),{layers:[[4,.5],[8,.5]],white:.5,contrast:1.7})}function js(i,t=de.dirt){let e=St(i,ne(t,5,.28),{layers:[[4,.4],[16,.6]],white:.6,contrast:1.5});for(let n=0;n<7;n++){let s=i()*16|0,r=i()*16|0;e.set(s,r,W(t,.62))}for(let n=0;n<4;n++){let s=i()*16|0,r=i()*16|0;e.set(s,r,W(t,1.25))}return e}function Wf(i,t=de.sand){let e=St(i,ne(t,4,.08),{layers:[[8,.4],[16,.6]],white:.8,contrast:1.4});for(let n=0;n<6;n++)e.set(i()*16|0,i()*16|0,W(t,.84));return e}function Ob(i){let t=St(i,[en(118),en(140),en(160),en(178),en(196)],{layers:[[4,.3],[16,.7]],white:.9,contrast:1.5});for(let e=0;e<256;e++)t.d[e*4+3]=0;return t}function Vf(i,t=!1){let e=js(i),n=[];for(let s=0;s<16;s++)n.push(3+(i()<.55?1:0)+(i()<.2?1:0));for(let s=0;s<16;s++)for(let r=0;r<n[s];r++)t?e.set(s,r,W(de.snow,.93+i()*.07)):e.set(s,r,en(140+i()*50),0);return e}function $f(i){return St(i,[x("#4a3015"),x("#5f3e1c"),x("#7a5226"),x("#8d6433"),x("#a0753c")],{layers:[[4,.5],[16,.5]],white:.7})}function Xf(i,t,e,n=3){let s=e.copy();for(let r=0;r<16;r++){let a=n+(i()<.5?1:0);for(let o=0;o<a;o++)s.set(r,o,t.get(r,o+r*3&15))}return s}function zb(i){let t=St(i,ne(x("#827d7b"),4,.15),{white:.8}),e=[x("#6a6460"),x("#9a9592"),x("#5c5654"),x("#b0a9a6"),x("#7d726c")];for(let n=0;n<22;n++){let s=i()*16|0,r=i()*16|0,a=e[i()*e.length|0],o=1+(i()*2|0),l=1+(i()*2|0);for(let c=0;c<=l;c++)for(let h=0;h<=o;h++){let u=c===0||h===0?1.15:c===l||h===o?.78:1;t.set(s+h,r+c,W(a,u))}}return t}function Ch(i,t=de.stone,e=!1){let s=[];for(let o=0;o<9;o++)s.push([i()*16,i()*16,.82+i()*.3]);let r=new Pt,a=vn(i,8);for(let o=0;o<16;o++)for(let l=0;l<16;l++){let c=99,h=99,u=0;for(let m=0;m<9;m++){let _=Math.abs(l+.5-s[m][0]);_=Math.min(_,16-_);let y=Math.abs(o+.5-s[m][1]);y=Math.min(y,16-y);let v=Math.sqrt(_*_+y*y);v<c?(h=c,c=v,u=m):v<h&&(h=v)}let f=s[u];if(h-c<1.1){r.set(l,o,W(t,.52+a(l,o)*.12));continue}let d=l+.5-f[0];d>8&&(d-=16),d<-8&&(d+=16);let g=o+.5-f[1];g>8&&(g-=16),g<-8&&(g+=16);let b=1-(d+g)*.035,p=f[2]*b*(.92+a(l,o)*.16);p=Math.round(p*8)/8,r.set(l,o,W(t,p))}return e&&lp(i,r,.45),r}function lp(i,t,e){let n=vn(i,4),s=vn(i,8),r=[x("#4f6b2c"),x("#5f7d34"),x("#6f8f3c"),x("#567532")];for(let a=0;a<16;a++)for(let o=0;o<16;o++)n(o,a)*.7+s(o,a)*.3>1-e&&t.set(o,a,r[i()*r.length|0])}function kh(i,t=de.stone,e="plain"){let n=St(i,ne(t,4,.08),{white:.6}),s=W(t,.6);for(let a=0;a<16;a++)n.set(a,7,s),n.set(a,15,s);for(let a=0;a<7;a++)n.set(15,a,s);for(let a=8;a<15;a++)n.set(7,a,s);let r=(a,o,l,c)=>n.bevel(a,o,l,c,1.12,.86);return r(0,0,14,6),r(8,8,15,14),r(0,8,6,14),e==="mossy"&&lp(i,n,.4),e==="cracked"&&cp(i,n,W(t,.45),3),n}function cp(i,t,e,n){for(let s=0;s<n;s++){let r=i()*16|0,a=i()*16|0,o=5+(i()*6|0);for(let l=0;l<o;l++)t.set(r,a,e),r+=i()<.5?i()<.5?-1:1:0,a+=i()<.7?1:0}}function Ci(i,t=x("#965a49"),e=x("#b4aca4"),n=4,s=8){let r=new Pt,a=16/n;for(let o=0;o<a;o++){let l=o%2?s/2:0;for(let c=0;c<16/s+1;c++){let h=.88+i()*.22;for(let u=o*n;u<o*n+n;u++)for(let f=0;f<s;f++){let d=c*s+f+l&15;if(u===o*n+n-1||f===s-1)r.set(d,u,W(e,.9+i()*.12));else{let b=h*(.93+i()*.12);u===o*n&&(b*=1.1),r.set(d,u,W(t,b))}}}}return r}function jn(i,t){let e=new Pt,n=vn(i,2,16);for(let s=0;s<4;s++){let r=.93+i()*.12,a=i()*16|0;for(let o=s*4;o<s*4+4;o++)for(let l=0;l<16;l++){let c=r*(.9+n(l,o)*.18);o===s*4+3?c*=.72:o===s*4&&(c*=1.06),l===a&&o!==s*4+3&&(c*=.75),c=Math.round(c*14)/14,e.set(l,o,W(t,c))}i()<.6&&e.set(a+2+(i()*10|0)&15,s*4+1,W(t,.78))}return e}function qf(i,t,e=!1){let n=new Pt,s=[];for(let a=0;a<16;a++)s.push(.82+i()*.3);let r=vn(i,8,4);for(let a=0;a<16;a++)for(let o=0;o<16;o++){let l=s[o]*(.88+r(o,a)*.24);!e&&(o%4===0||o%4===3)&&i()<.6&&(l*=.78),l=Math.round(l*10)/10,n.set(o,a,W(t,l))}if(e)for(let a=0;a<7;a++){let o=i()*16|0,l=i()*14|0,c=2+(i()*3|0);for(let h=0;h<c;h++)n.set(l+h,o,x("#2b2a26"));i()<.5&&n.set(l+1,o+1,x("#45433d"))}return n}function Hb(i,t,e,n=!1){let s=new Pt;for(let r=0;r<16;r++)for(let a=0;a<16;a++){let o=a-7.5,l=r-7.5,c=Math.max(Math.abs(o),Math.abs(l))*.7+Math.sqrt(o*o+l*l)*.3;if(c>7.2&&!n){s.set(a,r,W(e,.9+i()*.2));continue}let h=Math.floor(c/1.6)%2;s.set(a,r,W(t,(h?.88:1.02)*(.95+i()*.08)*(n&&c>7.2?.85:1)))}return s}function Gb(i,t,e=.24){let n=new Pt,s=vn(i,8);for(let r=0;r<16;r++)for(let a=0;a<16;a++){let o=s(a,r)*.5+i()*.5;if(o<e){n.set(a,r,W(t,.35),0);continue}let l=o>.82?1.22:o>.6?1.05:o>.42?.9:.74;n.set(a,r,W(t,l))}return n}function Wb(i,t,e,n=5){var a;let s=t.copy(),r=[];for(let o=0;o<n;o++){let l=0,c=0;for(let g=0;g<20&&(l=2+(i()*12|0),c=2+(i()*12|0),!r.every(([b,p])=>Math.abs(b-l)+Math.abs(p-c)>4));g++);r.push([l,c]);let h=[[l,c]],u=3+(i()*3|0);for(;h.length<u;){let[g,b]=h[i()*h.length|0],p=i()*4|0,m=g+(p===0?1:p===1?-1:0),_=b+(p===2?1:p===3?-1:0);h.some(([y,v])=>y===m&&v===_)||h.push([m,_])}for(let[g,b]of h){let p=h.some(([v,w])=>v===g&&w===b-1),m=h.some(([v,w])=>v===g-1&&w===b),_=!p||!m?e[0]:e[1];s.set(g,b,_),h.some(([v,w])=>v===g&&w===b+1)||s.set(g,b+1,W(s.get(g,b+1),.7))}let[f,d]=h[0];s.set(f,d,(a=e[2])!=null?a:al(e[0],40))}return s}function Fh(i,t,e=!0){let n=St(i,ne(t,3,.04),{white:.6});return e&&n.outline(0,0,15,15,W(t,.82)),n}function Wr(i,t){let e=St(i,ne(t,4,.1),{layers:[[4,.7],[8,.3]],white:.4});return e.bevel(0,0,15,15,1.15,.78),e}function Gh(i,t,e=8){let n=St(i,ne(t,3,.08),{white:.6});for(let s=0;s<16;s+=e)for(let r=0;r<16;r+=e){let a=.9+i()*.2;n.shadeRect(r,s,r+e-1,s+e-1,a),n.bevel(r,s,r+e-1,s+e-1,1.12,.62)}return n}function Jn(i,t,e="plate"){let n=St(i,ne(t,4,.12),{layers:[[2,.4],[8,.6]],white:.4});if(e==="plate"){n.bevel(0,0,15,15,1.25,.7),n.bevel(1,1,14,14,1.08,.88);for(let s=3;s<13;s+=3)n.set(s,s,al(t,50))}else if(e==="gem"){n.bevel(0,0,15,15,1.3,.65);for(let s=2;s<14;s+=4)for(let r=2;r<14;r+=4)n.rect(r,s,r+2,s+2,W(t,1.15)),n.set(r,s,al(t,70)),n.set(r+2,s+2,W(t,.7))}else if(e==="rough")for(let s=0;s<18;s++)n.set(i()*16|0,i()*16|0,W(t,i()<.5?.7:1.3));else{for(let s=0;s<16;s+=4)for(let r=0;r<16;r++)n.set(r,s,W(t,.75));for(let s=0;s<16;s+=4)n.set(s*5&15,s+1,al(t,60))}return n}var Vb={white:[233,236,236],orange:[240,118,19],magenta:[189,68,179],light_blue:[58,175,217],yellow:[248,197,39],lime:[112,185,25],pink:[237,141,172],gray:[62,68,71],light_gray:[142,142,134],cyan:[21,137,145],purple:[121,42,172],blue:[53,57,157],brown:[114,71,40],green:[84,109,27],red:[161,39,34],black:[21,21,26]};function $b(i,t){let e=new Pt,n=vn(i,8);for(let s=0;s<16;s++)for(let r=0;r<16;r++){let o=((r+(s>>1)*2&3)<2?1.05:.95)*(.92+n(r,s)*.1+(i()-.5)*.06);e.set(r,s,W(t,o))}return e}function Xb(i,t){return new Pt().fill(()=>W(t,.97+i()*.05))}function qb(i,t){let e=kn(t,[255,255,255],.12),n=new Pt().fill(()=>W(e,.86+i()*.22));for(let s=0;s<18;s++)n.set(i()*16|0,i()*16|0,kn(e,[255,255,255],.35));for(let s=0;s<12;s++)n.set(i()*16|0,i()*16|0,W(e,.7));return n}function Yb(i){return W(kn(i,[152,94,67],.55),.9)}function hp(i,t){let e=vn(i,4);return new Pt().fill((n,s)=>W(t,.93+e(n,s)*.08+i()*.04))}function Kb(i,t){let e=kn(t,[255,255,255],.45),n=W(t,.55),s=kn(t,[255,220,120],.35),r=[];for(let l=0;l<8;l++){r.push([]);for(let c=0;c<8;c++)r[l].push(t)}let a=i()*4|0;for(let l=0;l<8;l++)for(let c=0;c<8;c++){let h=c+l,u=Math.max(c,l),f=Math.abs(c-l),d=t;a===0?d=h===7||h===3?n:u===0?e:f===0&&c>3?s:t:a===1?d=u===2||u===6&&(c+l)%2?n:c===l?e:u<2?s:t:a===2?d=c===0||l===0?n:h%4===0?e:c===4||l===4?s:t:d=u===7?n:Math.abs(c-4)+Math.abs(l-4)===2?e:h===10?s:t,r[l][c]=W(d,.95+i()*.08)}let o=new Pt;for(let l=0;l<8;l++)for(let c=0;c<8;c++)o.set(c,l,r[l][c]),o.set(15-l,c,r[l][c]),o.set(15-c,15-l,r[l][c]),o.set(l,15-c,r[l][c]);return o}function Zb(i,t){let e=new Pt;for(let n=0;n<16;n++)for(let s=0;s<16;s++)s===0||n===0||s===15||n===15?e.set(s,n,W(t,.85),225):e.set(s,n,kn(t,[255,255,255],.12),130);for(let n=0;n<4;n++)e.set(3+n,11-n,kn(t,[255,255,255],.5),190);return e.set(10,4,kn(t,[255,255,255],.5),190),e.set(11,3,kn(t,[255,255,255],.5),190),e}function Jb(i){let t=new Pt,e=x("#d9eef2");for(let n=0;n<16;n++)t.set(n,0,e),t.set(n,15,W(e,.8));for(let n=0;n<16;n++)t.set(0,n,e),t.set(15,n,W(e,.8));for(let n=0;n<4;n++)t.set(3+n,7-n,x("#ffffff"));return t.set(4,7,x("#cfe9ef")),t.set(10,11,x("#ffffff")),t.set(11,10,x("#ffffff")),t.set(12,9,x("#cfe9ef")),t}var ll={oak:{planks:x("#b38d58"),bark:x("#6b5232"),stripped:x("#b18e57"),leaves:en(150),tinted:!0},spruce:{planks:x("#735632"),bark:x("#3c2a15"),stripped:x("#76593a"),leaves:x("#4b6f48"),tinted:!1},birch:{planks:x("#c8b67a"),bark:x("#d8d6cf"),stripped:x("#c4ad73"),leaves:x("#7ca052"),tinted:!1},jungle:{planks:x("#a07350"),bark:x("#584519"),stripped:x("#ab8455"),leaves:en(158),tinted:!0},acacia:{planks:x("#a85a32"),bark:x("#686056"),stripped:x("#ae5d3b"),leaves:en(146),tinted:!0},dark_oak:{planks:x("#432b14"),bark:x("#3c2e1a"),stripped:x("#60492f"),leaves:en(130),tinted:!0},mangrove:{planks:x("#763630"),bark:x("#5a3d2c"),stripped:x("#7a382f"),leaves:en(140),tinted:!0},cherry:{planks:x("#e3b2ac"),bark:x("#38212c"),stripped:x("#d8939a"),leaves:x("#eab0c8"),tinted:!1}};function Yf(i,t,e){let n=jn(i,t.planks).rotate(1);if(n.outline(0,0,15,15,W(t.planks,.6)),e){for(let s of[2,9])n.rect(s,2,s+4,8,W(t.planks,.2),0);n.rect(2,10,13,13,W(t.planks,.85)),n.outline(2,10,13,13,W(t.planks,.7))}else n.outline(2,1,13,7,W(t.planks,.7)),n.outline(2,9,13,14,W(t.planks,.7)),n.set(12,0,x("#3a3a3a")),n.set(12,1,x("#5a5a5a"));return n}function jb(i,t){let e=jn(i,t.planks);e.outline(0,0,15,15,W(t.planks,.62));for(let[n,s]of[[3,3],[9,3],[3,9],[9,9]])e.rect(n,s,n+3,s+3,W(t.planks,.2),0);return e}function Qb(i,t){let e=new Pt,n=W(t.bark,1.1);for(let a=9;a<16;a++)e.set(7+(a>12,0),a,n);e.set(8,12,n),e.set(6,11,n);let s=t.tinted?kn(t.leaves,x("#3f8f2a"),.75):t.leaves,r=(a,o,l)=>{for(let c=-l;c<=l;c++)for(let h=-l;h<=l;h++)h*h+c*c>l*l+1||i()<.15||e.set(a+h,o+c,W(s,.8+i()*.4))};return r(7,6,3),r(4,8,2),r(10,8,2),r(7,3,2),e}function Zn(i,t,e,n,s){for(let r=e;r<=n;r++)i.set(t,r,s)}function ty(i,t){let e=new Pt,n=x("#3f7d2a"),s=x("#56a03a"),r=(o,l,c,h,u)=>{if(u==="round")e.rect(o-1,l-1,o+1,l+1,c),e.set(o,l-2,c),e.set(o,l+2,c),e.set(o-2,l,c),e.set(o+2,l,c),e.set(o-1,l-1,W(c,1.15));else if(u==="cup")e.rect(o-1,l-2,o+1,l+1,c),e.set(o-2,l-3,c),e.set(o,l-3,W(c,1.1)),e.set(o+2,l-3,c),e.set(o-2,l-2,W(c,.85)),e.set(o+2,l-2,W(c,.85)),e.set(o,l-1,W(c,.75));else if(u==="star"){for(let[f,d]of[[0,-2],[0,2],[-2,0],[2,0],[-1,-1],[1,1],[1,-1],[-1,1]])e.set(o+f,l+d,c);e.set(o-2,l-2,W(c,.9)),e.set(o+2,l+2,W(c,.9))}else if(u==="ball"){for(let f=-2;f<=2;f++)for(let d=-2;d<=2;d++)d*d+f*f<=5&&(d+f)%2===0&&e.set(o+d,l+f,W(c,.85+i()*.3));for(let f=-2;f<=2;f++)for(let d=-2;d<=2;d++)d*d+f*f<=5&&(d+f)%2!==0&&e.set(o+d,l+f,W(c,.6))}else e.set(o,l,c),e.set(o-1,l+1,c),e.set(o,l+1,W(c,.9)),e.set(o+1,l+1,c);h&&e.set(o,l,h)},a=(o,l)=>{e.set(o-1,l,s),e.set(o-2,l-1,s),e.set(o+1,l+1,n),e.set(o+2,l,s)};switch(t){case"dandelion":Zn(e,7,9,15,n),a(7,13),r(7,7,x("#f6d320"),x("#e09a12"),"round");break;case"poppy":Zn(e,7,9,15,n),a(7,12),r(7,6,x("#d8231c"),x("#2a1610"),"round"),e.set(5,5,x("#b81c16")),e.set(9,7,x("#b81c16"));break;case"blue_orchid":Zn(e,7,9,15,n),Zn(e,9,11,15,n),a(8,13),r(6,6,x("#30b0e8"),x("#d0f0ff"),"star"),r(10,9,x("#2a9ad4"),null,"star");break;case"allium":Zn(e,7,7,15,n),a(7,13),r(7,4,x("#b05ae0"),null,"ball");break;case"azure_bluet":Zn(e,5,9,15,n),Zn(e,9,8,15,n),Zn(e,11,11,15,n),Zn(e,7,11,15,s);for(let[o,l]of[[5,8],[9,7],[11,10],[7,10]])r(o,l,x("#eef0f8"),x("#e8d34c"),"bell");break;case"red_tulip":case"orange_tulip":case"white_tulip":case"pink_tulip":{let o=x(t==="red_tulip"?"#d63420":t==="orange_tulip"?"#ee8a1c":t==="white_tulip"?"#ecf0ee":"#eca4c0");Zn(e,7,8,15,n),e.set(6,13,s),e.set(5,12,s),e.set(5,11,s),e.set(8,12,s),e.set(9,11,s),r(7,7,o,null,"cup");break}case"oxeye_daisy":Zn(e,7,9,15,n),a(7,13),r(7,6,x("#f2f3ee"),x("#f0c822"),"star"),e.set(7,5,x("#f2f3ee"));break;case"cornflower":Zn(e,7,8,15,n),a(7,13),r(7,6,x("#4a6ee0"),x("#2a3c9c"),"star");break;case"lily_of_the_valley":for(let o=5;o<16;o++)e.set(o<8?6+(8-o):6,o,n);e.set(4,10,s),e.set(3,11,s),e.set(10,12,s),e.set(11,13,s);for(let[o,l]of[[8,5],[9,8],[6,9],[10,4]])e.set(o,l,x("#f6f8f2")),e.set(o,l+1,x("#e6e8e0"));break}return e}function Oh(i,t=!1){let e=new Pt;if(t){for(let[n,s]of[[7,0],[4,-1],[11,1]]){let r=2+(i()*4|0);for(let a=r;a<16;a++){let o=n+Math.round(s*(15-a)*.25);e.set(o,a,en(150+i()*40)),(a-r)%2===0&&a<14&&(e.set(o-1,a,en(130+i()*50)),e.set(o+1,a+1,en(130+i()*50)))}}return e}for(let n=0;n<11;n++){let s=1+(i()*14|0),r=3+(i()*9|0),a=i()<.5?-1:1;for(let o=15;o>=r;o--)e.set(s,o,en(130+(15-o)/(15-r)*70+i()*20)),i()<.18&&(s+=a)}return e}function ey(i){let t=new Pt,e=x("#7a5328"),n=x("#94683a"),s=(r,a,o,l)=>{for(let c=0;c<l;c++)t.set(r,a,c%2?n:e),a--,c%2&&(r+=o)};return s(7,15,0,6),s(7,11,-1,7),s(8,11,1,7),s(7,9,1,5),s(6,12,-1,4),t}function ny(i){let t=new Pt,e=x("#8fc35a"),n=x("#6d9c3c"),s=x("#a9d873");for(let r of[3,8,12])for(let a=0;a<16;a++){let o=(a+r)%5===0;t.set(r,a,o?n:e),t.set(r+1,a,o?n:W(e,.85))}for(let[r,a]of[[5,4],[6,3],[10,9],[11,8],[2,12],[1,11],[14,2]])t.set(r,a,s);return t}function Kf(i,t){let e=new Pt,n=x("#d8cfc0");e.rect(7,10,8,15,n),e.set(8,15,W(n,.85));let s=x(t?"#c8221c":"#9a6c4c");if(t){e.rect(4,6,11,9,s),e.rect(5,5,10,5,s),e.rect(6,4,9,4,s);for(let[r,a]of[[6,6],[9,5],[10,8],[5,8],[8,7]])e.set(r,a,x("#f4f0ea"))}else e.rect(4,8,11,9,s),e.rect(5,7,10,7,W(s,1.1)),e.rect(6,6,9,6,W(s,1.15));return e}function iy(i){let t=new Pt;for(let e=0;e<16;e++)for(let n=0;n<16;n++){let s=n-7.5,r=e-7.5,a=Math.sqrt(s*s+r*r);if(a>7.4||s>0&&Math.abs(r)<s*.35)continue;let o=Math.abs(s)<.6||Math.abs(r)<.6||Math.abs(s-r)<.7;t.set(n,e,en(o?190:140+i()*30+(a<4?15:0)))}return t}function sy(i){let t=new Pt;for(let e=0;e<5;e++){let n=2+(i()*12|0);for(let s=15;s>1+i()*6;s--)t.set(n,s,kn(x("#2f7a3a"),x("#4fa45a"),i())),i()<.3&&(n+=i()<.5?-1:1)}return t}function ry(i){let t=new Pt,e=x("#e8e8ec");for(let n=0;n<16;n++)t.set(n,n,e,220),t.set(15-n,n,e,220),t.set(7,n,e,200),t.set(n,8,e,200);for(let n of[3,6])for(let s=0;s<32;s++){let r=Math.round(7.5+Math.cos(s/5.1)*n),a=Math.round(7.5+Math.sin(s/5.1)*n);t.set(r,a,e,200)}return t}function oy(i){let t=ll.oak.planks,e=jn(i,t),n=[x("#8a2b22"),x("#2d4e8a"),x("#3f6b2a"),x("#b0892c"),x("#5c2f6e"),x("#3a3a3a"),x("#a35a2a"),x("#cfc4a4")];for(let s of[1,9]){e.rect(0,s,15,s+5,W(t,.38));let r=1;for(;r<15;){let a=1+(i()*2|0),o=4+(i()*2|0),l=n[i()*n.length|0];for(let c=0;c<a&&r<15;c++,r++){for(let h=s+6-o;h<s+6;h++)e.set(r,h,W(l,c===0?1.15:.95));e.set(r,s+6-o+1,W(l,.7))}i()<.2&&r++}for(let a=0;a<16;a++)e.set(a,s+6,W(t,.85))}return e}function ay(i){let t=ll.oak.planks,e=jn(i,W(t,1.05));e.outline(0,0,15,15,W(t,.55));for(let n=1;n<15;n++)e.set(5,n,W(t,.62)),e.set(10,n,W(t,.62)),e.set(n,5,W(t,.62)),e.set(n,10,W(t,.62));return e}function Zf(i,t){let e=ll.oak.planks,n=jn(i,e);if(n.rect(0,0,15,2,W(e,.72)),n.bevel(0,0,15,2,1.1,.7),t){for(let s=3;s<8;s++)n.set(s,6,x("#b8b8b8"));for(let s=3;s<8;s+=1)n.set(s,7,s%2?x("#8a8a8a"):x("#b8b8b8"));n.rect(8,5,9,7,x("#5a3a1e")),n.rect(11,5,13,6,x("#7a7a7a")),n.rect(12,7,12,11,x("#5a3a1e"))}else n.rect(3,6,12,7,x("#6a6a6a")),n.rect(5,8,6,12,x("#5a3a1e")),n.rect(10,8,10,12,x("#5a3a1e"));return n}function Vr(i,t,e=x("#7a7a7a"),n=!1){let s=Fh(i,e,!1);if(s.bevel(0,0,15,15,1.15,.72),t==="top")return s.outline(2,2,13,13,W(e,.85)),s;if(t==="side")return s.rect(0,0,15,1,W(e,.9)),s.bevel(0,0,15,15,1.1,.75),n&&s.rect(3,5,12,6,W(e,.6)),s;s.rect(3,2,12,5,W(e,.55)),s.bevel(3,2,12,5,.7,1.2),s.rect(3,8,12,13,x("#1e1c1c")),s.bevel(3,8,12,13,.7,1.25);for(let r=4;r<12;r++)s.set(r,12,r%2?x("#ff9a2a"):x("#c8521c"));for(let r=4;r<12;r+=3)s.set(r,11,x("#ffd060"));if(n)for(let r=3;r<=12;r+=3)for(let a=8;a<=13;a++)s.set(r,a,W(e,.75));return s}function Rh(i,t){let e=x("#a2742f"),n=jn(i,e),s=W(e,.48);if(n.outline(1,t==="top"?1:2,14,t==="top"?14:15,s),t!=="top")for(let r=1;r<15;r++)n.set(r,7,s);return t==="front"&&(n.rect(7,6,8,9,x("#c8c8c8")),n.set(7,6,x("#ffffff")),n.set(8,9,x("#7a7a7a"))),n}function rl(i,t){let e=x("#d8811a"),n=new Pt;for(let s=0;s<16;s++)for(let r=0;r<16;r++){let a=r%4===0?.78:r%4===2?1.08:.96;n.set(r,s,W(e,a*(.94+i()*.1)))}if(t==="top"){let s=new Pt;for(let r=0;r<16;r++)for(let a=0;a<16;a++){let o=Math.max(Math.abs(a-7.5),Math.abs(r-7.5));s.set(a,r,W(e,(o%3<1?.82:1)*(.94+i()*.1)))}return s.rect(7,7,8,8,x("#5a6a20")),s.set(8,6,x("#6e7e28")),s}if(t==="face"||t==="lit"){let s=x(t==="lit"?"#ffd34a":"#3a2108"),r=x(t==="lit"?"#ffb020":"#2a1604");n.rect(3,4,5,6,s),n.rect(10,4,12,6,s),n.set(5,6,r),n.set(12,6,r),n.rect(3,9,12,11,s),n.set(3,9,W(e,.9)),n.set(12,9,W(e,.9)),n.set(5,9,W(e,.95)),n.set(9,11,W(e,.95)),n.set(6,11,r),n.set(11,10,r)}return n}function Jf(i,t){let e=x("#6f9a26"),n=x("#4a6e12"),s=new Pt;for(let r=0;r<16;r++)for(let a=0;a<16;a++){let o=t?(Math.max(Math.abs(a-7.5),Math.abs(r-7.5))|0)%3===0:(a+(r*.2|0))%4<2;s.set(a,r,W(o?n:e,.9+i()*.2))}return s}function Lh(i,t){let e=x("#c8321e"),n=new Pt;if(t==="side"){for(let s=0;s<16;s++)for(let r=0;r<16;r++)n.set(r,s,W(e,r%4===3?.78:.95+i()*.08));n.rect(0,5,15,10,x("#e8e4dc")),n.rect(6,6,9,9,x("#2a2a2a")),n.set(10,6,x("#2a2a2a")),n.set(11,5,x("#f0a020")),n.rect(2,7,4,8,x("#c8321e")),n.rect(11,7,13,8,x("#c8321e"))}else{for(let s=0;s<16;s++)for(let r=0;r<16;r++)n.set(r,s,W(e,.9+i()*.1));for(let[s,r]of[[4,4],[11,4],[4,11],[11,11]])n.rect(s-2,r-2,s+1,r+1,x("#8a2010")),n.rect(s-1,r-1,s,r,x("#e8e4dc"));t==="top"&&n.rect(7,7,8,8,x("#3a3a3a"))}return n}function ly(i){let t=[x("#8a5a2a"),x("#b8823c"),x("#e0b860"),x("#f8de8c"),x("#fff4c0")];return St(i,t,{layers:[[4,.4],[8,.6]],white:.8,contrast:1.9})}function cy(i){let t=new Pt,e=x("#a8c8c0"),n=x("#e4f4f0"),s=x("#d0e8e4");for(let r=0;r<16;r++)for(let a=0;a<16;a++)t.set(a,r,W(s,.95+i()*.08));t.outline(0,0,15,15,e);for(let r=3;r<=12;r++)for(let a=3;a<=12;a++)((a+r)%3===0||(a-r+15)%4===0)&&t.set(a,r,n);return t.outline(2,2,13,13,W(e,1.05)),t}function jf(i,t=!1){let e=new Pt,n=x("#6b4a26"),s=x("#8a6234");for(let l=8;l<16;l++)e.set(7,l,s),e.set(8,l,n);let r=x(t?"#7ff4f8":"#ffe070"),a=x(t?"#2ab8d0":"#ff9a20"),o=x(t?"#ffffff":"#fff8d0");return e.set(7,6,r),e.set(8,6,a),e.set(7,7,a),e.set(8,7,r),e.set(7,5,o,230),e.set(8,5,r,200),e.set(7,4,r,150),e}function Qf(i,t=!1){let e=new Pt,n=x("#3c4048"),s=x("#5a6070"),r=x(t?"#6ee8f0":"#ffcf5a"),a=x(t?"#c8fcff":"#fff0b0");return e.rect(5,9,10,15,n),e.rect(6,10,9,14,r),e.rect(7,11,8,12,a),e.set(5,9,s),e.set(10,15,W(n,.7)),e.rect(6,7,9,8,s),e.set(7,6,n),e.set(8,6,n),e.rect(0,0,5,5,n),e.rect(1,1,4,4,s),e.rect(2,2,3,3,W(r,.8)),e}function hy(){let i=new Pt;for(let t=0;t<16;t++)i.set(7,t,x("#f4f0e8")),i.set(8,t,x("#d8d0c8"));return i.rect(0,0,3,3,x("#c8b8d8")),i.rect(1,1,2,2,x("#e8dcf0")),i}function $r(i,t,e){let n=new Pt;for(let s=0;s<16;s++)for(let r=0;r<16;r++){let a=e?Math.max(Math.abs(r-7.5),Math.abs(s-7.5)):0,o=e?(a|0)%3===0:(r+s*2)%7<2;n.set(r,s,W(t,(o?.85:1.05)*(.95+i()*.08)))}return e||n.outline(0,0,15,15,W(t,.8)),n}function Ph(i,t){let e=x("#c4a028"),n=x("#7a4a1c"),s=new Pt;for(let r=0;r<16;r++)for(let a=0;a<16;a++)if(t){let o=Math.max(Math.abs(a-7.5),Math.abs(r-7.5));s.set(a,r,W(e,(o|0)%2?.88:1.02+i()*.06))}else s.set(a,r,W(e,(a%3===0?.85:1)*(.92+i()*.14)));return t||(s.rect(0,3,15,4,n),s.rect(0,11,15,12,n)),s}function tp(i,t){let e=x(t?"#a8a43c":"#c8c048"),n=St(i,ne(e,4,.12),{white:.4});for(let s=0;s<14;s++){let r=i()*15|0,a=i()*15|0;n.rect(r,a,r+1,a+(i()<.5?0:1),W(e,.55))}return n}function uy(i){let t=new Pt,e=x("#6cc04c");for(let n=0;n<16;n++)for(let s=0;s<16;s++)t.set(s,n,W(e,.95+i()*.1),170);t.outline(0,0,15,15,W(e,.8));for(let n=0;n<16;n++)t.setA(n,0,230),t.setA(n,15,230),t.setA(0,n,230),t.setA(15,n,230);t.outline(3,3,12,12,W(e,.75));for(let n=3;n<=12;n++)t.setA(n,3,220),t.setA(n,12,220),t.setA(3,n,220),t.setA(12,n,220);return t.set(4,4,x("#c8f0b0"),230),t.set(5,4,x("#c8f0b0"),230),t}function dy(i){let t=new Pt,e=x("#f0a82a");for(let n=0;n<16;n++)for(let s=0;s<16;s++)t.set(s,n,W(e,.92+i()*.12),200);t.outline(0,0,15,15,W(e,.8));for(let n=0;n<16;n++)t.setA(n,0,240),t.setA(n,15,240),t.setA(0,n,240),t.setA(15,n,240);return t.set(4,3,x("#ffe6a0"),230),t.set(3,4,x("#ffe6a0"),230),t}function fy(i){let t=x("#e09a28"),e=new Pt;for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=n>>2,a=r%2?2:0,o=(n&3)===3||(s+a&3)===3;e.set(s,n,o?W(t,.68):W(t,1+i()*.08))}return e}function ep(i,t=!1){let e=x("#6a4426"),n=jn(i,e);return n.outline(0,0,15,15,W(e,.55)),t?(n.rect(4,4,11,11,x("#2a1a10")),n.rect(5,5,10,10,x("#3a2a20"))):(n.rect(5,6,6,11,x("#2a1a10")),n.rect(7,4,11,5,x("#2a1a10")),n.rect(10,5,11,10,x("#2a1a10")),n.rect(3,10,6,12,x("#2a1a10")),n.rect(8,9,11,11,x("#2a1a10"))),n}function py(i,t){let e=new Pt;for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=Math.sqrt((s-7.5)**2+(n-7.5)**2),a=t?1:Math.floor(r/2.2)%2;e.set(s,n,W(x(a?"#e8dcc8":"#d2342a"),.95+i()*.08))}if(t){let n=Oh(i);for(let s=0;s<1024;s+=4)n.d[s+3]}return e}function np(i,t){let e=x("#86603a");if(t){let s=jn(i,e).rotate(1);return s.outline(0,0,15,15,W(e,.5)),s.outline(1,1,14,14,W(e,.8)),s.rect(6,6,9,9,W(e,.45)),s}let n=jn(i,e).rotate(1);for(let s of[2,13])for(let r=0;r<16;r++)n.set(r,s,x("#4a4a4e"));return n}function ip(i,t){let e=x("#3a4a24"),n=St(i,ne(e,4,.2),{white:.5});if(t)n.outline(0,0,15,15,W(e,.7)),n.outline(4,4,11,11,W(e,.8));else for(let s=0;s<16;s+=5)for(let r=0;r<16;r++)n.set(r,s,W(e,.65));return n}function Ih(i,t){if(t==="stem"){let s=St(i,ne(x("#cfc8b8"),4,.06),{layers:[[2,.6],[16,.4]],white:.5});for(let r=0;r<16;r+=3)for(let a=0;a<16;a++)i()<.25&&s.set(r,a,x("#b8b0a0"));return s}let e=x(t==="red"?"#c42a22":"#97704e"),n=St(i,ne(e,3,.06),{white:.4});if(t==="red")for(let[s,r,a]of[[2,3,3],[10,2,2],[6,8,3],[12,10,2],[2,12,2]])n.rect(s,r,s+a-1,r+a-1,x("#ece8e0"));return n}function Dh(i,t){let e=x("#5a8a2c"),n=new Pt;if(t==="side"){for(let s=0;s<16;s++)for(let r=0;r<16;r++){let a=r%4===1?1.12:r%4===3?.82:1;n.set(r,s,W(e,a*(.92+i()*.1)))}for(let s=0;s<10;s++){let r=(i()*4|0)*4+1,a=i()*16|0;n.set(r,a,x("#e8e0b8"))}return n}for(let s=0;s<16;s++)for(let r=0;r<16;r++){let a=Math.max(Math.abs(r-7.5),Math.abs(s-7.5));n.set(r,s,W(e,(a>6?.8:a<2?1.2:1)*(.94+i()*.08)))}return t==="top"&&(n.set(7,7,x("#d8e080")),n.set(8,8,x("#d8e080"))),n}function my(i){let t=[x("#5a3c8c"),x("#7a54b0"),x("#9a70d0"),x("#c4a0f0"),x("#e8d4ff")],e=St(i,t,{layers:[[4,.7],[8,.3]],white:.4,contrast:1.8});for(let n=0;n<6;n++){let s=i()*15|0,r=i()*15|0;e.set(s,r,t[4]),e.set(s+1,r+1,t[3])}return e}function gy(i){let t=St(i,[x("#3a1408"),x("#5a1c0c"),x("#7a2a10"),x("#8a3412")],{white:.5}),e=vn(i,4);for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=e(s,n);r>.62&&r<.7?t.set(s,n,x("#ff7a1a")):r>=.7&&r<.74&&t.set(s,n,x("#ffb040"))}return t}function by(i){let t=St(i,[x("#0c0814"),x("#160e22"),x("#24163a"),x("#3a2460")],{white:.6});for(let e=0;e<9;e++){let n=i()*16|0,s=i()*14|0;t.set(n,s,x("#8a3ae0")),t.set(n,s+1,x("#c070ff"))}return t}function yy(){let i=new Pt,t=Hh(77),e=vn(t,4,8);for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=e(s,n);i.set(s,n,en(r>.6?220:r>.4?190:170),200)}return i}function _y(){let i=new Pt,t=Hh(99),e=vn(t,4),n=vn(t,8);for(let s=0;s<16;s++)for(let r=0;r<16;r++){let a=e(r,s)*.6+n(r,s)*.4;i.set(r,s,a>.62?x("#ffd24a"):a>.5?x("#ff9a1e"):a>.38?x("#e8641a"):x("#c8461a"))}return i}function vy(i){return St(i,[x("#1e1e1e"),x("#3a3a3a"),x("#575757"),x("#7a7a7a"),x("#a0a0a0")],{layers:[[4,.5],[8,.5]],white:.5,contrast:2.2})}function zh(i,t){return t?St(i,ne(de.deepslate,4,.14),{layers:[[4,.5],[8,.5]],white:.5}):St(i,ne(de.deepslate,4,.16),{layers:[[8,.3],[16,.2]],white:.2,contrast:1.7}).fill((e,n)=>null)&&(()=>{let e=new Pt,n=vn(i,2,8);for(let s=0;s<16;s++)for(let r=0;r<16;r++){let a=n(r,s)*.7+i()*.3;e.set(r,s,W(de.deepslate,.78+Math.round(a*4)/4*.38))}return e})()}function xy(i){return St(i,[x("#e4eef2"),x("#eef6f8"),x("#f6fbfc"),x("#ffffff")],{white:.6})}function Uh(i,t){let e=x(t==="blue"?"#74a8f4":t==="packed"?"#8eb4f0":"#90b8f8"),n=St(i,ne(e,3,.06),{white:.4});for(let s=0;s<5;s++){let r=i()*16|0,a=i()*16|0;for(let o=0;o<6;o++)n.set(r,a,kn(e,[255,255,255],.5)),r++,i()<.5&&a++}if(t==="ice")for(let s=0;s<1024;s+=4)n.d[s+3]=175;return n}function Ti(i,t,e){if(e==="top")return St(i,ne(t,3,.05),{white:.6});if(e==="bottom")return St(i,ne(t,4,.1),{white:.6}).bevel(0,0,15,15,1,.85);let n=St(i,ne(t,3,.06),{white:.5});if(e==="side"){n.rect(0,0,15,2,W(t,1.04)),n.rect(0,13,15,15,W(t,.92));for(let s=0;s<16;s++)n.set(s,3,W(t,.84)),n.set(s,12,W(t,.86)),i()<.4&&n.set(s,8,W(t,.92))}else e==="cut"?(n.outline(0,0,15,15,W(t,.85)),n.outline(0,0,15,7,W(t,.85))):(n.outline(0,0,15,15,W(t,.82)),n.rect(0,0,15,2,W(t,.95)),n.rect(0,13,15,15,W(t,.95)),n.outline(4,5,11,10,W(t,.75)),n.rect(6,7,9,8,W(t,.7)));return n}function Js(i,t){let e=x("#ebe5de"),n=St(i,ne(e,3,.03),{white:.6});if(t==="side"&&n.bevel(0,0,15,15,1.02,.92),(t==="chiseled"||t==="chiseled_top")&&(n.outline(0,0,15,15,W(e,.85)),n.outline(3,3,12,12,W(e,.85)),t==="chiseled"&&n.outline(5,5,10,10,W(e,.9))),t==="pillar")for(let s=0;s<16;s++)n.set(0,s,W(e,.85)),n.set(15,s,W(e,.85)),n.set(4,s,W(e,.92)),n.set(11,s,W(e,.92));return t==="pillar_top"&&(n.outline(0,0,15,15,W(e,.85)),n.outline(3,3,12,12,W(e,.9))),t==="bricks"?Ci(i,e,W(e,.82),4,8):n}function Nh(i,t){if(t==="plain"){let n=[x("#3e7a6c"),x("#4f9284"),x("#63a596"),x("#79b4a0"),x("#5a8aa0")];return St(i,n,{layers:[[4,.6],[8,.4]],white:.4,contrast:1.8})}if(t==="bricks")return Ci(i,x("#62a898"),x("#3c7a6c"),8,8);let e=St(i,ne(x("#335a4c"),3,.08),{white:.4});e.outline(0,0,15,15,x("#1e3a30")),e.outline(4,4,11,11,x("#264a3e"));for(let n=0;n<16;n+=8)for(let s=0;s<16;s++)e.set(n,s,x("#1e3a30"));return e}function Bh(i,t){let e=x("#a77aa7");if(t==="block")return Gh(i,e,8);let n=St(i,ne(e,3,.06),{white:.5});if(t==="pillar")for(let s=0;s<16;s++)for(let r of[0,5,10,15])n.set(r,s,W(e,.82));else n.outline(0,0,15,15,W(e,.8)),n.outline(4,4,11,11,W(e,.85));return n}function wy(i){let t=de.stone,e=St(i,ne(t,3,.06),{white:.5});return e.bevel(0,0,15,15,1.15,.6),e.outline(3,3,12,12,W(t,.68)),e.bevel(4,4,11,11,1.12,.8),e.outline(6,6,9,9,W(t,.7)),e}function My(i){let t=x("#2e1418"),e=Gh(i,t,16);return e.outline(3,3,12,12,W(t,1.6)),e.rect(6,6,9,9,W(t,1.4)),e.rect(7,7,8,8,W(t,.6)),e}function ol(i,t){let e=x("#c06a4c"),n=x("#52a088"),s=kn(e,n,t),r=Jn(i,s,"plate");if(t>0&&t<1)for(let a=0;a<30;a++)r.set(i()*16|0,i()*16|0,kn(s,t>.5?e:n,.4));return r}function Sy(i){let t=jn(i,x("#4a2a14"));for(let e=0;e<26;e++)t.set(i()*16|0,i()*16|0,i()<.5?x("#ff8a20"):x("#ffc040"));return t}function Ay(){let i=new Pt,t=x("#6a6c70"),e=x("#a0a2a8");for(let n of[1,5,9,13])for(let s=0;s<16;s++)i.set(n,s,e),i.set(n+1,s,t);for(let n of[0,15])for(let s=0;s<16;s++)i.set(s,n,t);return i}function up(){return new Pt().fill((i,t)=>((i>>3)+(t>>3))%2?[248,0,248]:[0,0,0])}function sp(i,t){let e=x("#947a46");if(t)return St(i,ne(e,4,.12),{white:.6});let n=js(i);for(let s=0;s<16;s++)for(let r=0;r<3;r++)n.set(s,r,W(e,.92+i()*.12));for(let s=0;s<16;s++)n.set(s,0,x("#00000000".slice(0,7)),0);return n}function rp(i,t){let e=x(t?"#4a3a2e":"#584234"),n=St(i,ne(e,4,.22),{white:.6});if(!t)for(let s=0;s<4;s++){let r=1+(i()*12|0),a=1+(i()*12|0),o=W(e,.55);n.set(r,a,o),n.set(r+2,a,o),n.set(r,a+2,o),n.set(r+1,a+2,o),n.set(r+2,a+2,o)}return n}var op={coal:[x("#2a2a2a"),x("#1a1a1a"),x("#4a4a4a")],iron:[x("#d8af93"),x("#b88a6c"),x("#f0d8c4")],copper:[x("#e07a4a"),x("#4a9a7a"),x("#ffb088")],gold:[x("#fcd84a"),x("#d8a020"),x("#fff6b0")],redstone:[x("#e01a10"),x("#a00a08"),x("#ff6a50")],lapis:[x("#2450c0"),x("#1a3490"),x("#6a90f0")],diamond:[x("#5ae8e0"),x("#2ab8b0"),x("#c8fff8")],emerald:[x("#28d860"),x("#10a040"),x("#a0ffc0")],nether_gold:[x("#fcd84a"),x("#d8a020"),x("#fff6b0")],nether_quartz:[x("#ece6dc"),x("#c8c0b4"),x("#ffffff")]},Ey={missing:()=>up(),grass_top:Ob,grass_side:i=>Vf(i),grass_side_snowy:i=>Vf(i,!0),dirt:i=>js(i),coarse_dirt:i=>{let t=js(i);for(let e=0;e<30;e++)t.set(i()*16|0,i()*16|0,i()<.5?x("#5a3e24"):x("#8a7a6a"));return t},rooted_dirt:i=>{let t=js(i);for(let e=0;e<4;e++){let n=i()*16|0,s=i()*16|0;for(let r=0;r<5;r++)t.set(n,s,x("#9a7a54")),s++,i()<.4&&(n+=i()<.5?-1:1)}return t},podzol_top:$f,podzol_side:i=>Xf(i,$f(i),js(i)),mycelium_top:i=>St(i,[x("#5a4a5a"),x("#6e5e6a"),x("#857580"),x("#9a8c98"),x("#b0a4b0")],{white:.8}),mycelium_side:i=>Xf(i,St(i,[x("#6e5e6a"),x("#857580"),x("#9a8c98")],{white:.8}),js(i)),path_top:i=>sp(i,!0),path_side:i=>sp(i,!1),mud:i=>St(i,ne(de.mud,4,.1),{layers:[[4,.7],[8,.3]],white:.3}),packed_mud:i=>St(i,ne(x("#8e6a4e"),4,.12),{white:.5}),mud_bricks:i=>Ci(i,x("#8a6a4c"),x("#6a4e38"),4,8),clay:i=>St(i,ne(de.clay,4,.06),{layers:[[4,.8],[8,.2]],white:.3}),moss:i=>St(i,[x("#46602a"),x("#567430"),x("#668a38"),x("#76983e"),x("#86a848")],{white:.6}),sand:i=>Wf(i),red_sand:i=>Wf(i,de.redSand),gravel:zb,stone:i=>ap(i),granite:i=>St(i,[x("#6e4636"),x("#8a5a48"),x("#9e6c58"),x("#b07e6a"),x("#c49a88")],{layers:[[8,.4],[16,.6]],white:.9,contrast:1.8}),diorite:i=>{let t=St(i,[x("#a8a8a4"),x("#c4c4c0"),x("#d4d4d0"),x("#e4e4e0")],{white:.7});for(let e=0;e<14;e++){let n=i()*16|0,s=i()*16|0;t.set(n,s,x("#6e6e6c")),i()<.5&&t.set(n+1,s,x("#8a8a88"))}return t},andesite:i=>St(i,[x("#666868"),x("#787a7a"),x("#888a8a"),x("#9a9c9c"),x("#aaacac")],{layers:[[4,.4],[8,.6]],white:.8,contrast:1.7}),deepslate:i=>zh(i,!1),deepslate_top:i=>zh(i,!0),tuff:i=>{let t=St(i,ne(de.tuff,5,.16),{white:.7});for(let e=0;e<10;e++)t.set(i()*16|0,i()*16|0,x("#9a9a88"));return t},calcite:i=>St(i,ne(de.calcite,4,.06),{layers:[[4,.6],[8,.4]],white:.4}),dripstone:i=>St(i,ne(x("#866a5c"),5,.18),{layers:[[2,.3],[16,.7]],white:.4}),bedrock:vy,snow:xy,ice:i=>Uh(i,"ice"),packed_ice:i=>Uh(i,"packed"),blue_ice:i=>Uh(i,"blue"),obsidian:i=>{let t=St(i,[x("#0c0a14"),x("#140f1f"),x("#1e1630"),x("#2a2042")],{white:.6});for(let e=0;e<6;e++)t.set(i()*16|0,i()*16|0,x("#4a3a6e"));return t},crying_obsidian:by,netherrack:i=>St(i,ne(de.netherrack,5,.22),{layers:[[4,.4],[16,.6]],white:.8}),soul_sand:i=>rp(i,!1),soul_soil:i=>rp(i,!0),magma:gy,basalt_top:i=>{let t=St(i,ne(de.basalt,4,.14),{white:.5});return t.outline(1,1,14,14,W(de.basalt,.75)),t},basalt_side:i=>{let t=new Pt,e=vn(i,8,2);return t.fill((n,s)=>W(de.basalt,.8+Math.round(e(n,s)*4)/4*.35))},blackstone:i=>St(i,ne(de.blackstone,5,.25),{white:.6}),blackstone_top:i=>St(i,ne(de.blackstone,4,.18),{layers:[[4,.8],[16,.2]],white:.4}),end_stone:i=>{let t=St(i,ne(de.endStone,4,.08),{white:.6});for(let e=0;e<12;e++)t.set(i()*16|0,i()*16|0,W(de.endStone,.8));return t},amethyst:my,bone_top:i=>{let t=St(i,ne(x("#e4dec8"),3,.05),{white:.5});return t.rect(5,5,10,10,x("#c8c0a6")),t.rect(6,6,9,9,x("#e4dec8")),t},bone_side:i=>{let t=St(i,ne(x("#e4dec8"),3,.05),{white:.5});for(let e=0;e<16;e++)t.set(3,e,x("#c8c0a6")),t.set(12,e,x("#c8c0a6"));return t},cobblestone:i=>Ch(i),mossy_cobblestone:i=>Ch(i,de.stone,!0),cobbled_deepslate:i=>Ch(i,x("#56565c")),smooth_stone:i=>Fh(i,x("#a0a0a0")),smooth_stone_slab_side:i=>{let t=Fh(i,x("#a0a0a0"));for(let e=0;e<16;e++)t.set(e,7,x("#8a8a8a"));return t},stone_bricks:i=>kh(i),mossy_stone_bricks:i=>kh(i,de.stone,"mossy"),cracked_stone_bricks:i=>kh(i,de.stone,"cracked"),chiseled_stone_bricks:wy,bricks:i=>Ci(i),polished_granite:i=>Wr(i,x("#9a6a56")),polished_diorite:i=>Wr(i,x("#cdcdca")),polished_andesite:i=>Wr(i,x("#848686")),polished_deepslate:i=>Wr(i,x("#48484d")),polished_tuff:i=>Wr(i,x("#62645c")),polished_blackstone:i=>Wr(i,x("#36303a")),deepslate_bricks:i=>Ci(i,x("#4c4c50"),x("#2e2e32"),4,8),deepslate_tiles:i=>Gh(i,x("#3a3a3e"),4),polished_blackstone_bricks:i=>Ci(i,x("#3a3440"),x("#221e26"),8,8),prismarine:i=>Nh(i,"plain"),prismarine_bricks:i=>Nh(i,"bricks"),dark_prismarine:i=>Nh(i,"dark"),nether_bricks:i=>Ci(i,x("#2e1418"),x("#160a0c"),4,8),red_nether_bricks:i=>Ci(i,x("#4a0a0c"),x("#2a0406"),4,8),cracked_nether_bricks:i=>{let t=Ci(i,x("#2e1418"),x("#160a0c"),4,8);return cp(i,t,x("#0a0405"),4),t},chiseled_nether_bricks:My,end_stone_bricks:i=>Ci(i,x("#dadc9c"),x("#b4b47a"),8,8),purpur:i=>Bh(i,"block"),purpur_pillar:i=>Bh(i,"pillar"),purpur_pillar_top:i=>Bh(i,"pillar_top"),terracotta:i=>hp(i,x("#985e43")),sandstone:i=>Ti(i,x("#d8cb94"),"side"),sandstone_top:i=>Ti(i,x("#dccf9a"),"top"),sandstone_bottom:i=>Ti(i,x("#d8cb94"),"bottom"),chiseled_sandstone:i=>Ti(i,x("#d8cb94"),"chiseled"),cut_sandstone:i=>Ti(i,x("#d8cb94"),"cut"),red_sandstone:i=>Ti(i,x("#b8622a"),"side"),red_sandstone_top:i=>Ti(i,x("#bc642c"),"top"),red_sandstone_bottom:i=>Ti(i,x("#b8622a"),"bottom"),chiseled_red_sandstone:i=>Ti(i,x("#b8622a"),"chiseled"),cut_red_sandstone:i=>Ti(i,x("#b8622a"),"cut"),quartz_top:i=>Js(i,"top"),quartz_side:i=>Js(i,"side"),chiseled_quartz:i=>Js(i,"chiseled"),chiseled_quartz_top:i=>Js(i,"chiseled_top"),quartz_pillar:i=>Js(i,"pillar"),quartz_pillar_top:i=>Js(i,"pillar_top"),quartz_bricks:i=>Js(i,"bricks"),glass:Jb,tinted_glass:i=>{let t=new Pt;for(let e=0;e<16;e++)for(let n=0;n<16;n++)t.set(n,e,W(x("#2a2430"),.9+i()*.2),n===0||e===0||n===15||e===15?235:190);return t},iron_bars:()=>Ay(),coal_block:i=>Jn(i,x("#1c1c1e"),"rough"),iron_block:i=>Jn(i,x("#d8d8d8"),"plate"),copper_block:i=>ol(i,0),exposed_copper:i=>ol(i,.3),weathered_copper:i=>ol(i,.62),oxidized_copper:i=>ol(i,1),gold_block:i=>Jn(i,x("#f6d23e"),"plate"),redstone_block:i=>Jn(i,x("#b0140a"),"gem"),lapis_block:i=>Jn(i,x("#1e4aa6"),"rough"),diamond_block:i=>Jn(i,x("#62dcd6"),"gem"),emerald_block:i=>Jn(i,x("#2ac25c"),"gem"),netherite_block:i=>Jn(i,x("#42393a"),"ingot"),raw_iron_block:i=>Jn(i,x("#a6876a"),"rough"),raw_copper_block:i=>Jn(i,x("#9a5a3c"),"rough"),raw_gold_block:i=>Jn(i,x("#dca23a"),"rough"),glowstone:ly,sea_lantern:cy,torch:i=>jf(i),soul_torch:i=>jf(i,!0),lantern:i=>Qf(i),soul_lantern:i=>Qf(i,!0),shroomlight:i=>St(i,[x("#c8662a"),x("#e88a3a"),x("#f4a84c"),x("#ffcc70"),x("#fff0b0")],{white:.6,contrast:1.8}),pumpkin_top:i=>rl(i,"top"),pumpkin_side:i=>rl(i,"side"),carved_pumpkin:i=>rl(i,"face"),jack_o_lantern:i=>rl(i,"lit"),redstone_lamp_on:i=>{let t=St(i,[x("#8a5a2a"),x("#c8862e"),x("#f0c060"),x("#fff0b0")],{white:.6});t.outline(0,0,15,15,x("#5a3a1a"));for(let e=3;e<13;e+=4)t.rect(e,3,e+1,12,x("#fff4c8"));return t},froglight_ochre:i=>$r(i,x("#f4dc8c"),!1),froglight_ochre_top:i=>$r(i,x("#f4dc8c"),!0),froglight_verdant:i=>$r(i,x("#d0ecc0"),!1),froglight_verdant_top:i=>$r(i,x("#d0ecc0"),!0),froglight_pearl:i=>$r(i,x("#f0dcf0"),!1),froglight_pearl_top:i=>$r(i,x("#f0dcf0"),!0),end_rod:()=>hy(),embers:Sy,bookshelf:oy,crafting_table_top:ay,crafting_table_side:i=>Zf(i,!1),crafting_table_front:i=>Zf(i,!0),furnace_top:i=>Vr(i,"top"),furnace_side:i=>Vr(i,"side"),furnace_front:i=>Vr(i,"front"),blast_furnace_top:i=>Vr(i,"top",x("#5e5e62"),!0),blast_furnace_side:i=>Vr(i,"side",x("#5e5e62"),!0),blast_furnace_front:i=>Vr(i,"front",x("#5e5e62"),!0),chest_top:i=>Rh(i,"top"),chest_side:i=>Rh(i,"side"),chest_front:i=>Rh(i,"front"),barrel_top:i=>np(i,!0),barrel_side:i=>np(i,!1),note_block:i=>ep(i),jukebox_top:i=>ep(i,!0),jukebox_side:i=>{let t=jn(i,x("#6a4426"));return t.outline(0,0,15,15,x("#3a2416")),t.outline(1,1,14,14,x("#4a3020")),t},tnt_top:i=>Lh(i,"top"),tnt_bottom:i=>Lh(i,"bottom"),tnt_side:i=>Lh(i,"side"),target_top:i=>Ph(i,!0),target_side:i=>py(i,!1),melon_top:i=>Jf(i,!0),melon_side:i=>Jf(i,!1),hay_top:i=>Ph(i,!0),hay_side:i=>Ph(i,!1),sponge:i=>tp(i,!1),wet_sponge:i=>tp(i,!0),slime:uy,honey:dy,honeycomb:fy,kelp_top:i=>ip(i,!0),kelp_side:i=>ip(i,!1),mushroom_brown:i=>Ih(i,"brown"),mushroom_red:i=>Ih(i,"red"),mushroom_stem:i=>Ih(i,"stem"),cobweb:ry,cactus_top:i=>Dh(i,"top"),cactus_bottom:i=>Dh(i,"bottom"),cactus_side:i=>Dh(i,"side"),sugar_cane:ny,tall_grass:i=>Oh(i),fern:i=>Oh(i,!0),dead_bush:ey,brown_mushroom:i=>Kf(i,!1),red_mushroom:i=>Kf(i,!0),lily_pad:iy,seagrass:sy,water:()=>yy(),lava:()=>_y()};function di(i){var s;let t=Hh(Bb(i)),e=Ey[i];if(e)return e(t).d;let n;if(n=i.match(/^ore_(stone|deepslate|nether)_(.+)$/)){let r=n[1]==="stone"?ap(t):n[1]==="deepslate"?zh(t,!1):St(t,ne(de.netherrack,5,.22),{layers:[[4,.4],[16,.6]],white:.8}),a=n[1]==="nether"?`nether_${n[2]}`:n[2];return Wb(t,r,(s=op[a])!=null?s:op.coal,n[2]==="diamond"||n[2]==="emerald"?4:5).d}if(n=i.match(/^(wool|concrete|powder|terracotta|glazed|stained_glass)_(.+)$/)){let r=Vb[n[2]];if(r)switch(n[1]){case"wool":return $b(t,r).d;case"concrete":return Xb(t,W(r,.92)).d;case"powder":return qb(t,r).d;case"terracotta":return hp(t,Yb(r)).d;case"glazed":return Kb(t,r).d;case"stained_glass":return Zb(t,r).d}}if(n=i.match(/^flower_(.+)$/))return ty(t,n[1]).d;if(n=i.match(/^(stripped_)?(.+?)_(log|log_top|planks|leaves|door_top|door_bottom|trapdoor|sapling)$/)){let r=ll[n[2]];if(r){let a=!!n[1];switch(n[3]){case"log":return a?qf(t,r.stripped).d:qf(t,r.bark,n[2]==="birch").d;case"log_top":return Hb(t,a?r.stripped:r.planks,r.bark,a).d;case"planks":return jn(t,r.planks).d;case"leaves":return Gb(t,r.leaves,n[2]==="cherry"?.2:.25).d;case"door_top":return Yf(t,r,!0).d;case"door_bottom":return Yf(t,r,!1).d;case"trapdoor":return jb(t,r).d;case"sapling":return Qb(t,r).d}}}return typeof console!="undefined"&&console.warn("[textures] no generator for",i),up().d}var Qn={grass:x("#7bbd56"),foliage:x("#5fab36"),water:x("#3f76e4")};var mp=2,ia={u:2,uDev:2,gw:640,gh:360,cx:320,cy:180,qh:90,dpr:1},dp=!1,$h=new Set,oe=i=>`calc(var(--u)*${i})`;function Ty(i,t,e,n){let s=Math.round(t*n),r=Math.round(e*n),a=Math.max(1,Math.floor(Math.min(s/320,r/240))),o=Math.max(1,Math.min(Math.round(Math.max(1,i)*n),a)),l=Math.floor(s/o),c=Math.floor(r/o);return l-=l&1,c-=c&1,{u:o/n,uDev:o,gw:l,gh:c,cx:l/2,cy:c/2,qh:Math.floor(c/4),dpr:n}}function Rn(){return ia}function gp(i){return $h.add(i),()=>$h.delete(i)}function Wh(){if(typeof window=="undefined")return;let i=Ty(mp,window.innerWidth||1280,window.innerHeight||720,window.devicePixelRatio||1),t=i.u!==ia.u||i.gw!==ia.gw||i.gh!==ia.gh;ia=i;let e=document.documentElement.style;if(e.setProperty("--u",`${i.u}px`),e.setProperty("--gw",String(i.gw)),e.setProperty("--gh",String(i.gh)),e.setProperty("--cx",String(i.cx)),e.setProperty("--cy",String(i.cy)),e.setProperty("--qh",String(i.qh)),t)for(let n of $h)try{n(i)}catch(s){console.warn(s)}}function sa(i,t,e){let n=document.createElement("canvas");n.width=i,n.height=t;let s=n.getContext("2d");if(!s)return"";let r=s.createImageData(i,t);return e(r.data),s.putImageData(r,0,0),n.toDataURL("image/png")}function fp(i){let t=di("dirt");return sa(16,16,e=>{for(let n=0;n<256;n++)e[n*4]=t[n*4]*i,e[n*4+1]=t[n*4+1]*i,e[n*4+2]=t[n*4+2]*i,e[n*4+3]=255})}function pp(i,t,e){let n=i*374761393+t*668265263+e*2147483647|0;return n=Math.imul(n^n>>>13,1274126177),((n^n>>>16)>>>0)/4294967296}function Vh(i,t,e){return sa(16,16,n=>{for(let s=0;s<16;s++)for(let r=0;r<16;r++){let a=(pp(r,s,e)-.5)*2*t+(pp(r>>2,s>>1,e+7)-.5)*t,o=(s*16+r)*4;n[o]=i[0]+a,n[o+1]=i[1]+a,n[o+2]=i[2]+a,n[o+3]=255}})}function Xh(i,t){let e=i.length,n=i[0].length;return sa(n,e,s=>{var r;for(let a=0;a<e;a++)for(let o=0;o<n;o++){let l=(r=t[i[a][o]])!=null?r:[0,0,0,0],c=(a*n+o)*4;s[c]=l[0],s[c+1]=l[1],s[c+2]=l[2],s[c+3]=l[3]}})}var bp={".":[0,0,0,0],K:[0,0,0,255],W:[255,255,255,255],S:[85,85,85,255],c:[198,198,198,255]},Cy=["..KKKKK..",".KWWWWWK.","KWWWWWWcK","KWWccccSK","KWWccccSK","KWWccccSK","KWcSSSSSK",".KSSSSSK.","..KKKKK.."];function cl(i,t){let e=[];for(let r=0;r<32;r++){let a="";for(let o=0;o<28;o++){let l=r===0&&(o<2||o>25)||r===1&&(o<1||o>26),c="c";l?c=".":r===0||r===1&&(o===1||o===26)||o===0||o===27||r===1&&(o===2||o===25)?c="K":r<=2||o<=2?c="W":o>=25&&(c="S"),!i&&c==="c"&&(c="d"),!i&&c==="W"&&(c="w"),!i&&c==="S"&&(c="s"),!i&&r>=28&&c!=="."&&(c=r===31?"K":c),a+=c}e.push(a)}return t&&e.reverse(),Xh(e,{...bp,d:[158,158,158,255],w:[214,214,214,255],s:[70,70,70,255]})}function ky(){return sa(182,22,e=>{let n=(s,r,a)=>{let o=(r*182+s)*4;e[o]=a[0],e[o+1]=a[1],e[o+2]=a[2],e[o+3]=a[3]};for(let s=0;s<22;s++)for(let r=0;r<182;r++){if(r===0||s===0||r===181||s===21){n(r,s,[10,10,10,230]);continue}let o=(r-1)%20,l=s-1;o===0||o===19||l===0||l===19?n(r,s,[72,72,72,225]):o===1||l===1?n(r,s,[24,24,24,200]):o===18||l===18?n(r,s,[118,118,118,200]):n(r,s,[36,36,36,150])}})}function Ry(){return sa(24,24,t=>{let e=(n,s,r)=>{let a=(s*24+n)*4;t[a]=r[0],t[a+1]=r[1],t[a+2]=r[2],t[a+3]=r[3]};for(let n=0;n<24;n++)for(let s=0;s<24;s++){let r=Math.min(s,n,23-s,23-n);(s===0||s===23)&&(n===0||n===23)||(r===0?e(s,n,[0,0,0,255]):r===1?e(s,n,s===1||n===1?[255,255,255,255]:[208,208,208,255]):r===2?e(s,n,s===2||n===2?[232,232,232,255]:[168,168,168,255]):r===3&&e(s,n,[0,0,0,160]))}})}var Ly=[".KKKKKKK.","KKGGGGGKK","KGKKKKKgK","KGKKKKKgK","KGKKKKKgK","KGKKKKKgK","KGKKKKKgK","KKgggggKK",".KKKKKKK."];function Py(){let i=oe,t=`${i(1)} ${i(1)} 0 var(--sh)`;return`
:root{--u:2px;--gw:640;--gh:360;--cx:320;--cy:180;--qh:90;--sh:#3f3f3f}
#game{display:block;outline:none}
.bf-gui,.bf-full{position:fixed;left:0;top:0}
.bf-gui{width:${i("var(--gw)")};height:${i("var(--gh)")}}
.bf-full{right:0;bottom:0}
.bf-font,.bf-font input,.bf-font button{font-family:BlockForge,monospace;font-size:${i(8)};line-height:${i(9)};font-weight:normal;font-style:normal;
  letter-spacing:0;word-spacing:0;font-kerning:none;font-variant-ligatures:none;font-feature-settings:"kern" 0,"liga" 0;
  text-rendering:optimizeSpeed;-webkit-font-smoothing:none;-moz-osx-font-smoothing:unset;color:#fff;--sh:#3f3f3f;text-shadow:${t};
  white-space:pre;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}
.bf-font *{box-sizing:border-box}
.bf-abs{position:absolute}
.bf-c-white{color:#fff;--sh:#3f3f3f}
.bf-c-gray{color:#a0a0a0;--sh:#282828}
.bf-c-dim{color:#808080;--sh:#202020}
.bf-c-yellow{color:#ffff55;--sh:#3f3f15}
.bf-c-gold{color:#ffaa00;--sh:#2a1c00}
.bf-c-green{color:#55ff55;--sh:#153f15}
.bf-c-red{color:#ff5555;--sh:#3f1515}
.bf-c-dark{color:#404040;text-shadow:none}
.bf-noshadow{text-shadow:none}
.bf-center{text-align:center}
.bf-right{text-align:right}
.bf-pixel{image-rendering:pixelated;image-rendering:crisp-edges}

/* ---------------- backgrounds */
.bf-dirt{background:#2b2219 var(--bf-dirt) repeat;background-size:${i(32)} ${i(32)};image-rendering:pixelated}
.bf-dirt-dark{background:#16110c var(--bf-dirt-dark) repeat;background-size:${i(32)} ${i(32)};image-rendering:pixelated}
.bf-dim{background:linear-gradient(rgba(16,16,16,.75),rgba(16,16,16,.82))}

/* ---------------- buttons */
.bf-btn{position:absolute;display:block;height:${i(20)};width:${i(200)};margin:0;padding:${i(4)} 0 0;border:${i(1)} solid #000;border-radius:0;
  background:#717171 var(--bf-btn) repeat;background-size:${i(16)} ${i(16)};image-rendering:pixelated;
  box-shadow:inset ${i(1)} ${i(1)} 0 rgba(255,255,255,.36),inset ${i(-1)} ${i(-2)} 0 rgba(0,0,0,.38);
  color:#fff;--sh:#3f3f3f;text-align:center;cursor:default;outline:none;overflow:hidden;-webkit-appearance:none;appearance:none;text-decoration:none}
.bf-btn:hover,.bf-btn:focus-visible,.bf-btn.bf-hot{border-color:#fff;background-color:#8a8f99;background-image:var(--bf-btn-hot);color:#ffffa0;--sh:#3f3f28}
.bf-btn:active{box-shadow:inset ${i(1)} ${i(1)} 0 rgba(0,0,0,.3),inset ${i(-1)} ${i(-1)} 0 rgba(255,255,255,.18)}
.bf-btn:disabled,.bf-btn.bf-off{background:#2e2e2e var(--bf-btn-off) repeat;background-size:${i(16)} ${i(16)};border-color:#000;color:#a0a0a0;--sh:#282828;
  box-shadow:inset ${i(1)} ${i(1)} 0 rgba(255,255,255,.08),inset ${i(-1)} ${i(-1)} 0 rgba(0,0,0,.3)}
a.bf-btn{color:#fff}

/* ---------------- sliders */
.bf-slider{position:absolute;height:${i(20)};width:${i(150)};touch-action:none;outline:none}
.bf-slider .bf-track{position:absolute;inset:0;border:${i(1)} solid #000;background:#2e2e2e var(--bf-btn-off) repeat;background-size:${i(16)} ${i(16)};
  box-shadow:inset ${i(1)} ${i(1)} 0 rgba(0,0,0,.45),inset ${i(-1)} ${i(-1)} 0 rgba(255,255,255,.1)}
.bf-slider .bf-knob{position:absolute;top:0;width:${i(8)};height:${i(20)};border:${i(1)} solid #000;background:#8d8d8d var(--bf-btn) repeat;background-size:${i(16)} ${i(16)};
  box-shadow:inset ${i(1)} ${i(1)} 0 rgba(255,255,255,.45),inset ${i(-1)} ${i(-2)} 0 rgba(0,0,0,.4)}
.bf-slider .bf-lbl{position:absolute;left:0;top:${i(5)};width:100%;text-align:center;pointer-events:none}
.bf-slider:hover .bf-knob,.bf-slider:focus-visible .bf-knob,.bf-slider.bf-drag .bf-knob{border-color:#fff;background-image:var(--bf-btn-hot)}
.bf-slider:hover .bf-lbl,.bf-slider:focus-visible .bf-lbl,.bf-slider.bf-drag .bf-lbl{color:#ffffa0;--sh:#3f3f28}

/* ---------------- text fields */
.bf-field{position:absolute;height:${i(20)};width:${i(200)};margin:0;padding:${i(5)} ${i(4)} 0;border:${i(1)} solid #a0a0a0;border-radius:0;background:#000;
  color:#e0e0e0;--sh:#383838;outline:none;caret-color:#e0e0e0;-webkit-user-select:text;user-select:text;-webkit-appearance:none;appearance:none}
.bf-field:focus{border-color:#fff}
.bf-field::placeholder{color:#575757;text-shadow:none;opacity:1}
.bf-field::selection{background:#3050c0;color:#fff}
.bf-label{position:absolute;color:#a0a0a0;--sh:#282828}

/* ---------------- scroll lists */
.bf-list{position:absolute;overflow:hidden;touch-action:none}
.bf-list.bf-sunk{background:#16110c var(--bf-dirt-dark) repeat;background-size:${i(32)} ${i(32)}}
.bf-list .bf-list-in{position:absolute;left:0;right:0;top:0}
.bf-list .bf-shade-t,.bf-list .bf-shade-b{position:absolute;left:0;right:0;height:${i(4)};pointer-events:none;z-index:2}
.bf-list .bf-shade-t{top:0;background:linear-gradient(rgba(0,0,0,.85),rgba(0,0,0,0))}
.bf-list .bf-shade-b{bottom:0;background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.85))}
.bf-sbar{position:absolute;width:${i(6)};background:#000;z-index:3;touch-action:none}
.bf-sbar .bf-thumb{position:absolute;left:0;width:${i(6)};background:#808080;box-shadow:inset ${i(-1)} ${i(-1)} 0 #c0c0c0;box-shadow:inset 0 0 0 0 transparent}
.bf-sbar .bf-thumb::after{content:"";position:absolute;left:0;top:0;right:${i(1)};bottom:${i(1)};background:#c0c0c0}
.bf-sbar.bf-none{display:none}

/* ---------------- menus */
.bf-menus{z-index:30;display:none}
.bf-menus.bf-open{display:block}
.bf-screen{position:fixed;inset:0;overflow:hidden}
.bf-screen .bf-gui{position:absolute}
.bf-h1{position:absolute;left:0;width:${i("var(--gw)")};text-align:center}
.bf-hline{position:absolute;left:0;width:${i("var(--gw)")};height:${i(2)};background:linear-gradient(rgba(0,0,0,.6) 50%,rgba(255,255,255,.12) 50%)}
.bf-logo{position:absolute;image-rendering:pixelated}
.bf-splash{position:absolute;color:#ffff00;--sh:#3f3f00;transform-origin:50% 50%;animation:bf-splash .5s ease-in-out infinite alternate;white-space:pre;pointer-events:none}
@keyframes bf-splash{from{transform:translate(-50%,-50%) rotate(-20deg) scale(var(--ss,1.8))}to{transform:translate(-50%,-50%) rotate(-20deg) scale(calc(var(--ss,1.8)*.93))}}
.bf-pano{position:absolute;left:0;top:0;height:100%;background-repeat:repeat-x;image-rendering:pixelated;will-change:transform;
  animation:bf-pano-move 90s linear infinite}
@keyframes bf-pano-move{from{transform:translateX(0)}to{transform:translateX(var(--pano-w,-2048px))}}
.bf-vignette{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(0,0,0,0) 30%,rgba(0,0,0,.55) 100%),linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.05) 40%,rgba(0,0,0,.4))}
.bf-pause-bg{position:absolute;inset:0;background:linear-gradient(rgba(16,16,16,.66),rgba(16,16,16,.78))}
.bf-row{position:absolute;box-sizing:border-box;border:${i(1)} solid transparent;outline:none}
.bf-row:hover{background:rgba(255,255,255,.06)}
.bf-row.bf-sel{border-color:#c0c0c0;background:rgba(0,0,0,.55)}
.bf-row.bf-sel:focus-visible,.bf-row:focus-visible{border-color:#fff}
.bf-row .bf-thumbimg{position:absolute;left:${i(1)};top:${i(1)};width:${i(32)};height:${i(32)};image-rendering:pixelated}
.bf-row:hover .bf-thumbimg::after{content:"";position:absolute;inset:0;background:rgba(255,255,255,.15)}
.bf-row .bf-play{position:absolute;left:${i(1)};top:${i(1)};width:${i(32)};height:${i(32)};display:none;background:rgba(0,0,0,.45)}
.bf-row:hover .bf-play,.bf-row.bf-sel .bf-play{display:block}
.bf-play::after{content:"";position:absolute;left:${i(12)};top:${i(8)};border-style:solid;border-color:transparent transparent transparent #fff;border-width:${i(8)} 0 ${i(8)} ${i(10)}}
.bf-keycap{position:absolute;height:${i(20)};width:${i(90)};border:${i(1)} solid #000;padding-top:${i(4)};text-align:center;
  background:#3a3a3a var(--bf-btn-off) repeat;background-size:${i(16)} ${i(16)};box-shadow:inset ${i(1)} ${i(1)} 0 rgba(255,255,255,.14),inset ${i(-1)} ${i(-2)} 0 rgba(0,0,0,.35)}
.bf-progress{position:absolute;height:${i(10)};border:${i(1)} solid #000;background:#262626;box-shadow:inset ${i(1)} ${i(1)} 0 #111,inset ${i(-1)} ${i(-1)} 0 #4a4a4a}
.bf-progress .bf-fill{position:absolute;left:${i(1)};top:${i(1)};bottom:${i(1)};width:0;background:#5bbf3a;box-shadow:inset 0 ${i(2)} 0 #8ee060,inset 0 ${i(-2)} 0 #3a8a22}
.bf-blink{animation:bf-blink 1s steps(1) infinite}
@keyframes bf-blink{50%{opacity:0}}

/* ---------------- HUD */
.bf-hud{z-index:16;pointer-events:none}
.bf-hud.bf-hidden,.bf-cross.bf-hidden{display:none}
.bf-cross{position:fixed;z-index:16;pointer-events:none;mix-blend-mode:difference;width:${i(9)};height:${i(9)};
  left:${i("(var(--cx) - 4)")};top:${i("(var(--cy) - 4)")}}
.bf-cross::before,.bf-cross::after{content:"";position:absolute;background:#fff}
.bf-cross::before{left:0;top:${i(4)};width:${i(9)};height:${i(1)}}
.bf-cross::after{left:${i(4)};top:0;width:${i(1)};height:${i(9)}}
.bf-hotbar{position:absolute;width:${i(182)};height:${i(22)};left:${i("(var(--cx) - 91)")};top:${i("(var(--gh) - 22)")};
  background:var(--bf-hotbar) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-hotbar .bf-hslot{position:absolute;top:${i(1)};width:${i(20)};height:${i(20)}}
.bf-hotbar .bf-hslot .bf-icon{position:absolute;left:${i(2)};top:${i(2)};width:${i(16)};height:${i(16)}}
.bf-hotbar .bf-num{position:absolute;left:${i(1)};top:0;color:rgba(255,255,255,.62);--sh:rgba(0,0,0,.7)}
.bf-hotbar .bf-hsel{position:absolute;top:${i(-1)};width:${i(24)};height:${i(24)};background:var(--bf-select) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-itemname{position:absolute;left:0;width:${i("var(--gw)")};top:${i("(var(--gh) - 45)")};text-align:center;opacity:0}
.bf-chat{position:absolute;left:${i(2)};bottom:${i(40)};width:${i(320)}}
.bf-chat .bf-msg{position:relative;width:${i(320)};min-height:${i(9)};padding:0 ${i(2)};background:rgba(0,0,0,.5);white-space:pre-wrap;word-break:break-word}
.bf-debug{position:absolute;left:${i(2)};top:${i(2)};right:${i(2)};display:none}
.bf-debug.bf-on{display:block}
.bf-debug .bf-col{position:absolute;top:0}
.bf-debug .bf-col.bf-r{right:0;text-align:right}
.bf-debug .bf-line{height:${i(9)};color:#e0e0e0;text-shadow:none}
.bf-debug .bf-line span{display:inline-block;height:${i(9)};padding:0 ${i(1)};background:rgba(80,80,80,.56)}
.bf-fps{position:absolute;left:${i(2)};top:${i(2)};display:none;color:#e0e0e0}
.bf-fps.bf-on{display:block}
.bf-water{position:fixed;inset:0;z-index:15;pointer-events:none;opacity:0;transition:opacity .25s;
  background:radial-gradient(ellipse at 50% 50%,rgba(20,60,140,.16) 40%,rgba(5,20,70,.5) 100%)}
.bf-water.bf-on{opacity:1}
@media (pointer:coarse){.bf-hotbar .bf-hslot{pointer-events:auto;touch-action:none}}

/* ---------------- icons and slots */
.bf-icon{background-image:var(--bf-icons);background-size:var(--bf-icons-size);background-repeat:no-repeat;image-rendering:pixelated}
.bf-slot{position:absolute;width:${i(18)};height:${i(18)};background:#8b8b8b;box-shadow:inset ${i(1)} ${i(1)} 0 #373737,inset ${i(-1)} ${i(-1)} 0 #fff}
.bf-slot .bf-icon{position:absolute;left:${i(1)};top:${i(1)};width:${i(16)};height:${i(16)};pointer-events:none}
.bf-slot.bf-hover::after{content:"";position:absolute;left:${i(1)};top:${i(1)};width:${i(16)};height:${i(16)};background:rgba(255,255,255,.5);pointer-events:none}

/* ---------------- creative inventory */
.bf-inv-root{z-index:20;display:none;touch-action:none}
.bf-inv-root.bf-open{display:block}
.bf-inv-panel{position:absolute;width:${i(195)};height:${i(136)};left:${i("(var(--cx) - 98)")};top:${i("(var(--cy) - 68)")}}
.bf-inv-close{position:absolute;left:${i(198)};top:${i(4)};width:${i(16)};height:${i(16)};display:flex;align-items:center;justify-content:center;
  background:#8b8b8b;color:#fff;font-size:${i(9)};line-height:1;text-shadow:${i(1)} ${i(1)} 0 #3f3f3f;cursor:pointer;
  box-shadow:inset ${i(1)} ${i(1)} 0 #d8d8d8,inset ${i(-1)} ${i(-1)} 0 #565656,0 0 0 ${i(1)} #000}
.bf-inv-close:hover{background:#9aa6d4}
.bf-inv-bg{position:absolute;inset:0;border-style:solid;border-width:${i(4)};border-image:var(--bf-panel) 4 fill stretch;image-rendering:pixelated}
.bf-inv-title{position:absolute;left:${i(8)};top:${i(5)}}
.bf-tab{position:absolute;width:${i(28)};height:${i(32)};background:var(--bf-tab) no-repeat;background-size:100% 100%;image-rendering:pixelated}
.bf-tab.bf-bottom{background-image:var(--bf-tab-b)}
.bf-tab.bf-sel{background-image:var(--bf-tab-sel);z-index:2}
.bf-tab.bf-bottom.bf-sel{background-image:var(--bf-tab-b-sel)}
.bf-tab .bf-icon{position:absolute;left:${i(6)};width:${i(16)};height:${i(16)};pointer-events:none}
.bf-tab:not(.bf-bottom) .bf-icon{top:${i(9)}}
.bf-tab.bf-bottom .bf-icon{top:${i(7)}}
.bf-tab:not(.bf-sel):hover{filter:brightness(1.12)}
.bf-inv-search{position:absolute;left:${i(81)};top:${i(4)};width:${i(90)};height:${i(12)};padding:${i(1)} ${i(2)} 0;border:${i(1)} solid #000;
  background:#000;box-shadow:inset 0 0 0 ${i(1)} #3d3d3d;color:#fff;outline:none;caret-color:#fff;-webkit-user-select:text;user-select:text;border-radius:0;margin:0}
.bf-inv-search:focus{box-shadow:inset 0 0 0 ${i(1)} #a0a0a0}
.bf-inv-search::placeholder{color:#6c6c6c;text-shadow:none}
.bf-inv-track{position:absolute;left:${i(174)};top:${i(17)};width:${i(14)};height:${i(112)};background:#8b8b8b;
  box-shadow:inset ${i(1)} ${i(1)} 0 #373737,inset ${i(-1)} ${i(-1)} 0 #fff;touch-action:none}
.bf-inv-thumb{position:absolute;left:${i(1)};width:${i(12)};height:${i(15)};border:${i(1)} solid #000;background:#c6c6c6;
  box-shadow:inset ${i(1)} ${i(1)} 0 #fff,inset ${i(-1)} ${i(-1)} 0 #555}
.bf-inv-thumb.bf-off{background:#9a9a9a;box-shadow:inset ${i(1)} ${i(1)} 0 #b8b8b8,inset ${i(-1)} ${i(-1)} 0 #5a5a5a}
.bf-inv-empty{position:absolute;left:${i(9)};top:${i(54)};width:${i(162)};text-align:center}
.bf-tip{position:absolute;z-index:5;padding:${i(4)} ${i(5)} ${i(3)};border-style:solid;border-width:${i(3)};margin:0;
  border-image:var(--bf-tip) 3 fill stretch;image-rendering:pixelated;pointer-events:none;display:none;line-height:${i(10)}}
.bf-tip.bf-on{display:block}
.bf-held{position:absolute;z-index:6;width:${i(16)};height:${i(16)};pointer-events:none;display:none}
.bf-held.bf-on{display:block}
`}function ra(i){if(mp=Number.isFinite(i)?Math.max(1,Math.min(6,i)):2,typeof document!="undefined"){if(!dp){dp=!0;let t=document.getElementById("bf-ui-css");t||(t=document.createElement("style"),t.id="bf-ui-css",document.head.appendChild(t)),t.textContent=Py();let e=document.documentElement.style;try{e.setProperty("--bf-dirt",`url(${fp(.27)})`),e.setProperty("--bf-dirt-dark",`url(${fp(.14)})`),e.setProperty("--bf-btn",`url(${Vh([112,112,112],7,1)})`),e.setProperty("--bf-btn-hot",`url(${Vh([128,136,152],7,2)})`),e.setProperty("--bf-btn-off",`url(${Vh([44,44,44],4,3)})`),e.setProperty("--bf-panel",`url(${Xh(Cy,bp)})`),e.setProperty("--bf-tab",`url(${cl(!1,!1)})`),e.setProperty("--bf-tab-sel",`url(${cl(!0,!1)})`),e.setProperty("--bf-tab-b",`url(${cl(!1,!0)})`),e.setProperty("--bf-tab-b-sel",`url(${cl(!0,!0)})`),e.setProperty("--bf-hotbar",`url(${ky()})`),e.setProperty("--bf-select",`url(${Ry()})`),e.setProperty("--bf-tip",`url(${Xh(Ly,{".":[0,0,0,0],K:[16,10,6,240],G:[214,150,48,255],g:[120,72,18,255]})})`)}catch(s){console.warn("[ui] could not paint UI textures",s)}window.addEventListener("resize",Wh);let n=()=>{try{let s=matchMedia(`(resolution: ${window.devicePixelRatio||1}dppx)`),r=()=>{s.removeEventListener("change",r),Wh(),n()};s.addEventListener("change",r)}catch{}};n()}Wh()}}var ul={" ":"...","!":"#|#|#|#|#|.|#",'"':"#.#|#.#","#":".#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.",$:"..#..|.####|#....|.###.|....#|####.|..#..","%":"##..#|##.#.|...#.|..#..|.#...|.#.##|#..##","&":".##..|#..#.|.##..|.##.#|#..#.|#..#.|.##.#","'":"#|#","(":"..#|.#.|#..|#..|#..|.#.|..#",")":"#..|.#.|..#|..#|..#|.#.|#..","*":".....|..#..|#.#.#|.###.|#.#.#|..#..","+":".....|..#..|..#..|#####|..#..|..#..",",":"..|..|..|..|..|.#|.#|#.","-":".....|.....|.....|#####",".":".|.|.|.|.|.|#","/":"....#|...#.|...#.|..#..|.#...|.#...|#....",0:".###.|#...#|#..##|#.#.#|##..#|#...#|.###.",1:"..#..|.##..|..#..|..#..|..#..|..#..|#####",2:".###.|#...#|....#|..##.|.#...|#....|#####",3:".###.|#...#|....#|..##.|....#|#...#|.###.",4:"...##|..#.#|.#..#|#...#|#####|....#|....#",5:"#####|#....|####.|....#|....#|#...#|.###.",6:"..##.|.#...|#....|####.|#...#|#...#|.###.",7:"#####|#...#|....#|...#.|..#..|..#..|..#..",8:".###.|#...#|#...#|.###.|#...#|#...#|.###.",9:".###.|#...#|#...#|.####|....#|...#.|.##..",":":".|.|#|.|.|.|#",";":"..|..|.#|..|..|..|.#|#.","<":"...#|..#.|.#..|#...|.#..|..#.|...#","=":".....|.....|#####|.....|.....|#####",">":"#...|.#..|..#.|...#|..#.|.#..|#...","?":".###.|#...#|....#|...#.|..#..|.....|..#..","@":".###.|#...#|#.###|#.#.#|#.###|#....|.####",A:".###.|#...#|#...#|#####|#...#|#...#|#...#",B:"####.|#...#|#...#|####.|#...#|#...#|####.",C:".###.|#...#|#....|#....|#....|#...#|.###.",D:"###..|#..#.|#...#|#...#|#...#|#..#.|###..",E:"#####|#....|#....|####.|#....|#....|#####",F:"#####|#....|#....|####.|#....|#....|#....",G:".####|#....|#....|#..##|#...#|#...#|.####",H:"#...#|#...#|#...#|#####|#...#|#...#|#...#",I:"###|.#.|.#.|.#.|.#.|.#.|###",J:"....#|....#|....#|....#|#...#|#...#|.###.",K:"#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#",L:"#....|#....|#....|#....|#....|#....|#####",M:"#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#",N:"#...#|##..#|#.#.#|#..##|#...#|#...#|#...#",O:".###.|#...#|#...#|#...#|#...#|#...#|.###.",P:"####.|#...#|#...#|####.|#....|#....|#....",Q:".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#",R:"####.|#...#|#...#|####.|#.#..|#..#.|#...#",S:".####|#....|#....|.###.|....#|....#|####.",T:"#####|..#..|..#..|..#..|..#..|..#..|..#..",U:"#...#|#...#|#...#|#...#|#...#|#...#|.###.",V:"#...#|#...#|#...#|#...#|.#.#.|.#.#.|..#..",W:"#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#",X:"#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",Y:"#...#|#...#|.#.#.|..#..|..#..|..#..|..#..",Z:"#####|....#|...#.|..#..|.#...|#....|#####","[":"###|#..|#..|#..|#..|#..|###","\\":"#....|.#...|.#...|..#..|...#.|...#.|....#","]":"###|..#|..#|..#|..#|..#|###","^":"..#..|.#.#.|#...#",_:".....|.....|.....|.....|.....|.....|.....|#####","`":"#.|.#",a:".....|.....|.###.|....#|.####|#...#|.####",b:"#....|#....|#.##.|##..#|#...#|#...#|####.",c:".....|.....|.###.|#...#|#....|#...#|.###.",d:"....#|....#|.##.#|#..##|#...#|#...#|.####",e:".....|.....|.###.|#...#|#####|#....|.###.",f:"..##|.#..|####|.#..|.#..|.#..|.#..",g:".....|.....|.####|#...#|#...#|.####|....#|####.",h:"#....|#....|#.##.|##..#|#...#|#...#|#...#",i:"#|.|#|#|#|#|#",j:"...#|....|...#|...#|...#|...#|#..#|.##.",k:"#...|#...|#..#|#.#.|##..|#.#.|#..#",l:"#.|#.|#.|#.|#.|#.|.#",m:".....|.....|##.#.|#.#.#|#.#.#|#...#|#...#",n:".....|.....|####.|#...#|#...#|#...#|#...#",o:".....|.....|.###.|#...#|#...#|#...#|.###.",p:".....|.....|#.##.|##..#|#...#|####.|#....|#....",q:".....|.....|.##.#|#..##|#...#|.####|....#|....#",r:".....|.....|#.##.|##..#|#....|#....|#....",s:".....|.....|.####|#....|.###.|....#|####.",t:".#.|.#.|###|.#.|.#.|.#.|..#",u:".....|.....|#...#|#...#|#...#|#...#|.####",v:".....|.....|#...#|#...#|#...#|.#.#.|..#..",w:".....|.....|#...#|#.#.#|#.#.#|#.#.#|.#.#.",x:".....|.....|#...#|.#.#.|..#..|.#.#.|#...#",y:".....|.....|#...#|#...#|#...#|.####|....#|####.",z:".....|.....|#####|...#.|..#..|.#...|#####","{":"..##|.#..|.#..|#...|.#..|.#..|..##","|":"#|#|#|#|#|#|#|#","}":"##..|..#.|..#.|...#|..#.|..#.|##..","~":"......|......|.##..#|#..##.","\xA0":"...","\u200A":"","\xB7":".|.|.|#","\u2026":".....|.....|.....|.....|.....|.....|#.#.#","\u2190":".....|..#..|.#...|#####|.#...|..#..","\u2191":"..#..|.###.|#.#.#|..#..|..#..|..#..|..#..","\u2192":".....|..#..|...#.|#####|...#.|..#..","\u2193":"..#..|..#..|..#..|..#..|#.#.#|.###.|..#.."},Iy=["###|#.#|#.#|#.#|###",".#.|##.|.#.|.#.|###","###|..#|###|#..|###","###|..#|.##|..#|###","#.#|#.#|###|..#|..#","###|#..|###|..#|###","###|#..|###|#.#|###","###|..#|..#|.#.|.#.","###|#.#|###|#.#|###","###|#.#|###|..#|###"];Iy.forEach((i,t)=>{ul[String.fromCharCode(57344+t)]=i});function Dy(i){let t=ul[i];return t===void 0?6:t.split("|")[0].length+1}function Uy(i){var n;let t=[],e=new Map;for(let s=0;s<=i.length;s++){let r=(n=i[s])!=null?n:"",a=[],o=0;for(;o<r.length;)if(r[o]==="#"){let c=o;for(;o<r.length&&r[o]==="#";)o++;a.push([c,o])}else o++;let l=new Set;for(let[c,h]of a){let u=c+","+h;l.add(u);let f=e.get(u);f?f[3]=s+1:e.set(u,[c,s,h,s+1])}for(let[c,h]of e)l.has(c)||(t.push(h),e.delete(c))}for(let s of e.values())t.push(s);return t}function yp(i){let t=i.split("|"),e=t[0].length,n=Uy(t);if(!n.length)return{data:new Uint8Array(0),advance:(e+1)*128,xMin:0,yMin:0,xMax:0,yMax:0,points:0,contours:0};let s=[],r=[],a=[];for(let[m,_,y,v]of n){let w=m*128,S=y*128,A=(7-_)*128,L=(7-v)*128;s.push(w,w,S,S),r.push(L,A,A,L),a.push(s.length-1)}let o=Math.min(...s),l=Math.max(...s),c=Math.min(...r),h=Math.max(...r),u=s.length,f=10+a.length*2+2+u+u*4,d=new DataView(new ArrayBuffer(f+(4-f%4)%4)),g=0;d.setInt16(g,a.length),g+=2,d.setInt16(g,o),g+=2,d.setInt16(g,c),g+=2,d.setInt16(g,l),g+=2,d.setInt16(g,h),g+=2;for(let m of a)d.setUint16(g,m),g+=2;d.setUint16(g,0),g+=2;for(let m=0;m<u;m++)d.setUint8(g++,1);let b=0,p=0;for(let m=0;m<u;m++)d.setInt16(g,s[m]-b),b=s[m],g+=2;for(let m=0;m<u;m++)d.setInt16(g,r[m]-p),p=r[m],g+=2;return{data:new Uint8Array(d.buffer),advance:(e+1)*128,xMin:o,yMin:c,xMax:l,yMax:h,points:u,contours:a.length}}var zn=class{constructor(){this.bytes=[]}u8(t){return this.bytes.push(t&255),this}u16(t){return this.bytes.push(t>>8&255,t&255),this}i16(t){return this.u16(t<0?t+65536:t)}u32(t){return this.bytes.push(t>>>24&255,t>>>16&255,t>>>8&255,t&255),this}tag(t){for(let e=0;e<4;e++)this.u8(t.charCodeAt(e));return this}raw(t){for(let e=0;e<t.length;e++)this.bytes.push(t[e]);return this}get length(){return this.bytes.length}out(){return new Uint8Array(this.bytes)}};function _p(i){var n,s,r,a;let t=0,e=Math.ceil(i.length/4)*4;for(let o=0;o<e;o+=4)t=t+(((n=i[o])!=null?n:0)<<24|((s=i[o+1])!=null?s:0)<<16|((r=i[o+2])!=null?r:0)<<8|((a=i[o+3])!=null?a:0))>>>0;return t>>>0}function Ny(i){let t=[];for(let e=0;e<i.length;e++){let n=i.charCodeAt(e);t.push(n>>8,n&255)}return t}function By(){let i=Object.keys(ul).map(Q=>Q.charCodeAt(0)).sort((Q,ft)=>Q-ft),t=[];t.push(yp("#####|#...#|#...#|#...#|#...#|#...#|#####"));let e=new Map;for(let Q of i)e.set(Q,t.length),t.push(yp(ul[String.fromCharCode(Q)]));let n=t.length,s=new zn,r=new zn;for(let Q of t)r.u32(s.length),s.raw(Q.data);r.u32(s.length);let a=t.filter(Q=>Q.contours>0),o=Math.min(...a.map(Q=>Q.xMin)),l=Math.min(...a.map(Q=>Q.yMin)),c=Math.max(...a.map(Q=>Q.xMax)),h=Math.max(...a.map(Q=>Q.yMax)),u=Math.max(...t.map(Q=>Q.advance)),f=Math.min(...a.map(Q=>Q.advance-Q.xMax)),d=Math.max(...t.map(Q=>Q.points)),g=Math.max(...t.map(Q=>Q.contours)),b=new zn;b.u32(65536).u32(65536).u32(0).u32(1594834165),b.u16(11).u16(1024);let p=3849984e3;b.u32(0).u32(p).u32(0).u32(p),b.i16(o).i16(l).i16(c).i16(h),b.u16(0).u16(8).i16(2).i16(1).i16(0);let m=new zn;m.u32(65536).i16(1024).i16(-128).i16(0).u16(u).i16(0).i16(f).i16(c),m.i16(1).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).i16(0).u16(n);let _=new zn;_.u32(65536).u16(n).u16(d).u16(g).u16(0).u16(0).u16(2).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0).u16(0);let y=new zn;for(let Q of t)y.u16(Q.advance).i16(Q.contours?Q.xMin:0);let v=Math.round(t.reduce((Q,ft)=>Q+ft.advance,0)/n),w=new zn;w.u16(4).i16(v).u16(400).u16(5).u16(0),w.i16(128*4).i16(128*4).i16(0).i16(128).i16(128*4).i16(128*4).i16(0).i16(128*3),w.i16(128).i16(128*3),w.i16(0),w.raw([2,0,5,0,0,0,0,0,0,0]),w.u32(1).u32(0).u32(0).u32(0),w.tag("BLKF"),w.u16(192),w.u16(i[0]).u16(Math.min(65535,i[i.length-1])),w.i16(1024).i16(-128).i16(0),w.u16(1024).u16(128),w.u32(1).u32(0),w.i16(128*5).i16(128*7).u16(0).u16(32).u16(1);let S=[[1,"BlockForge"],[2,"Regular"],[3,"BlockForge Regular 1.0"],[4,"BlockForge Regular"],[5,"Version 1.000"],[6,"BlockForge-Regular"]],A=new zn,L=[];A.u16(0).u16(S.length).u16(6+S.length*12);for(let[Q,ft]of S){let ht=Ny(ft);A.u16(3).u16(1).u16(1033).u16(Q).u16(ht.length).u16(L.length),L.push(...ht)}A.raw(L);let P=[];for(let Q of i){let ft=e.get(Q),ht=P[P.length-1];ht&&Q===ht.end+1&&ft===Q+ht.delta?ht.end=Q:P.push({start:Q,end:Q,delta:ft-Q})}P.push({start:65535,end:65535,delta:1});let M=P.length,T=Math.floor(Math.log2(M)),I=2*(1<<T),F=new zn,k=16+M*8;F.u16(4).u16(k).u16(0).u16(M*2).u16(I).u16(T).u16(M*2-I);for(let Q of P)F.u16(Q.end);F.u16(0);for(let Q of P)F.u16(Q.start);for(let Q of P)F.u16(Q.delta+65536&65535);for(let Q=0;Q<M;Q++)F.u16(0);let U=new zn;U.u16(0).u16(1).u16(3).u16(1).u32(12).raw(F.out());let N=new zn;N.u32(196608).u32(0).i16(-128).i16(128).u32(0).u32(0).u32(0).u32(0).u32(0);let D=[["OS/2",w.out()],["cmap",U.out()],["glyf",s.out()],["head",b.out()],["hhea",m.out()],["hmtx",y.out()],["loca",r.out()],["maxp",_.out()],["name",A.out()],["post",N.out()]];D.sort((Q,ft)=>Q[0]<ft[0]?-1:Q[0]>ft[0]?1:0);let z=D.length,$=Math.floor(Math.log2(z)),nt=16*(1<<$),rt=12+z*16,bt=[];for(let[,Q]of D)bt.push(rt),rt+=Math.ceil(Q.length/4)*4;let G=new Uint8Array(rt),tt=new DataView(G.buffer);tt.setUint32(0,65536),tt.setUint16(4,z),tt.setUint16(6,nt),tt.setUint16(8,$),tt.setUint16(10,z*16-nt);let at=0;return D.forEach(([Q,ft],ht)=>{let Ht=12+ht*16;for(let Et=0;Et<4;Et++)tt.setUint8(Ht+Et,Q.charCodeAt(Et));tt.setUint32(Ht+4,_p(ft)),tt.setUint32(Ht+8,bt[ht]),tt.setUint32(Ht+12,ft.length),G.set(ft,bt[ht]),Q==="head"&&(at=bt[ht])}),tt.setUint32(at+8,2981146554-_p(G)>>>0),G.buffer}var hl=null;function vp(){return hl||(hl=new Promise(i=>{let t=()=>i();try{if(typeof FontFace=="undefined"||!document.fonts){t();return}let e=new FontFace("BlockForge",By(),{style:"normal",weight:"400",display:"block"}),n=setTimeout(t,4e3);e.load().then(s=>{document.fonts.add(s),document.documentElement.classList.add("bf-font-ready")}).catch(s=>{console.warn("[font] pixel font rejected, using fallback",s)}).then(()=>{clearTimeout(n),t()})}catch(e){console.warn("[font] could not build pixel font",e),t()}}),hl)}function tr(i){let t=0;for(let e of i)t+=Dy(e);return t}function Ke(i,t){return t-tr(i)&1?i+"\u200A":i}var vs=["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"],Fy=["oak","spruce","birch","jungle","acacia","dark_oak","mangrove","cherry"],$i=i=>i.split("_").map(t=>t[0].toUpperCase()+t.slice(1)).join(" "),xs=[],Z=i=>(xs.push(i),i);Z({name:"air",display:"Air",cat:"natural",tex:"missing",solid:!1,transparent:!0,opacity:0,replaceable:!0,item:!1,layer:"cutout",shape:"cross"});Z({name:"grass_block",display:"Grass Block",cat:"natural",tex:{top:"grass_top",bottom:"dirt",side:"grass_side"},tint:"grass",tintMask:!0,sound:"grass"});Z({name:"snowy_grass_block",display:"Snowy Grass Block",cat:"natural",tex:{top:"snow",bottom:"dirt",side:"grass_side_snowy"},sound:"snow"});Z({name:"dirt",display:"Dirt",cat:"natural",tex:"dirt",sound:"gravel"});Z({name:"coarse_dirt",display:"Coarse Dirt",cat:"natural",tex:"coarse_dirt",sound:"gravel"});Z({name:"podzol",display:"Podzol",cat:"natural",tex:{top:"podzol_top",bottom:"dirt",side:"podzol_side"},sound:"gravel"});Z({name:"rooted_dirt",display:"Rooted Dirt",cat:"natural",tex:"rooted_dirt",sound:"gravel"});Z({name:"mycelium",display:"Mycelium",cat:"natural",tex:{top:"mycelium_top",bottom:"dirt",side:"mycelium_side"},sound:"grass"});Z({name:"dirt_path",display:"Dirt Path",cat:"natural",tex:{top:"path_top",bottom:"dirt",side:"path_side"},sound:"grass"});Z({name:"mud",display:"Mud",cat:"natural",tex:"mud",sound:"gravel"});Z({name:"clay",display:"Clay",cat:"natural",tex:"clay",sound:"gravel"});Z({name:"moss_block",display:"Moss Block",cat:"natural",tex:"moss",sound:"grass"});Z({name:"sand",display:"Sand",cat:"natural",tex:"sand",sound:"sand"});Z({name:"red_sand",display:"Red Sand",cat:"natural",tex:"red_sand",sound:"sand"});Z({name:"gravel",display:"Gravel",cat:"natural",tex:"gravel",sound:"gravel"});Z({name:"stone",display:"Stone",cat:"natural",tex:"stone"});Z({name:"granite",display:"Granite",cat:"natural",tex:"granite"});Z({name:"diorite",display:"Diorite",cat:"natural",tex:"diorite"});Z({name:"andesite",display:"Andesite",cat:"natural",tex:"andesite"});Z({name:"deepslate",display:"Deepslate",cat:"natural",tex:{top:"deepslate_top",bottom:"deepslate_top",side:"deepslate"},orient:"axis"});Z({name:"tuff",display:"Tuff",cat:"natural",tex:"tuff"});Z({name:"calcite",display:"Calcite",cat:"natural",tex:"calcite"});Z({name:"dripstone_block",display:"Dripstone Block",cat:"natural",tex:"dripstone"});Z({name:"bedrock",display:"Bedrock",cat:"natural",tex:"bedrock"});Z({name:"snow_block",display:"Snow Block",cat:"natural",tex:"snow",sound:"snow"});Z({name:"snow",display:"Snow",cat:"natural",tex:"snow",shape:"layer",sound:"snow",replaceable:!0,support:"solid"});Z({name:"ice",display:"Ice",cat:"natural",tex:"ice",layer:"translucent",cullSelf:!0,opacity:1,sound:"glass"});Z({name:"packed_ice",display:"Packed Ice",cat:"natural",tex:"packed_ice",sound:"glass"});Z({name:"blue_ice",display:"Blue Ice",cat:"natural",tex:"blue_ice",sound:"glass"});Z({name:"obsidian",display:"Obsidian",cat:"natural",tex:"obsidian"});Z({name:"crying_obsidian",display:"Crying Obsidian",cat:"natural",tex:"crying_obsidian",light:10});Z({name:"netherrack",display:"Netherrack",cat:"natural",tex:"netherrack"});Z({name:"soul_sand",display:"Soul Sand",cat:"natural",tex:"soul_sand",sound:"sand"});Z({name:"soul_soil",display:"Soul Soil",cat:"natural",tex:"soul_soil",sound:"sand"});Z({name:"magma_block",display:"Magma Block",cat:"natural",tex:"magma",light:3});Z({name:"basalt",display:"Basalt",cat:"natural",tex:{end:"basalt_top",side:"basalt_side"},orient:"axis"});Z({name:"blackstone",display:"Blackstone",cat:"natural",tex:{top:"blackstone_top",bottom:"blackstone_top",side:"blackstone"}});Z({name:"end_stone",display:"End Stone",cat:"natural",tex:"end_stone"});Z({name:"amethyst_block",display:"Block of Amethyst",cat:"natural",tex:"amethyst",sound:"glass"});Z({name:"bone_block",display:"Bone Block",cat:"natural",tex:{end:"bone_top",side:"bone_side"},orient:"axis"});var zp=[["coal","Coal"],["iron","Iron"],["copper","Copper"],["gold","Gold"],["redstone","Redstone"],["lapis","Lapis Lazuli"],["diamond","Diamond"],["emerald","Emerald"]];for(let[i,t]of zp)Z({name:`${i}_ore`,display:`${t} Ore`,cat:"ores",tex:`ore_stone_${i}`,light:0});for(let[i,t]of zp)Z({name:`deepslate_${i}_ore`,display:`Deepslate ${t} Ore`,cat:"ores",tex:`ore_deepslate_${i}`});Z({name:"nether_gold_ore",display:"Nether Gold Ore",cat:"ores",tex:"ore_nether_gold"});Z({name:"nether_quartz_ore",display:"Nether Quartz Ore",cat:"ores",tex:"ore_nether_quartz"});var Oy=[["coal_block","Block of Coal"],["iron_block","Block of Iron"],["copper_block","Block of Copper"],["gold_block","Block of Gold"],["redstone_block","Block of Redstone"],["lapis_block","Block of Lapis Lazuli"],["diamond_block","Block of Diamond"],["emerald_block","Block of Emerald"],["netherite_block","Block of Netherite"],["raw_iron_block","Block of Raw Iron"],["raw_copper_block","Block of Raw Copper"],["raw_gold_block","Block of Raw Gold"],["exposed_copper","Exposed Copper"],["weathered_copper","Weathered Copper"],["oxidized_copper","Oxidized Copper"]];for(let[i,t]of Oy)Z({name:i,display:t,cat:"ores",tex:i,sound:"metal"});for(let i of Fy){let t=$i(i),e=i;Z({name:`${i}_log`,display:`${t} Log`,cat:"wood",tex:{end:`${e}_log_top`,side:`${e}_log`},orient:"axis",sound:"wood"}),Z({name:`${i}_wood`,display:`${t} Wood`,cat:"wood",tex:`${e}_log`,orient:"axis",sound:"wood"}),Z({name:`stripped_${i}_log`,display:`Stripped ${t} Log`,cat:"wood",tex:{end:`stripped_${i}_log_top`,side:`stripped_${i}_log`},orient:"axis",sound:"wood"}),Z({name:`${i}_planks`,display:`${t} Planks`,cat:"wood",tex:`${i}_planks`,sound:"wood"});let n=i!=="spruce"&&i!=="birch"&&i!=="cherry";Z({name:`${i}_leaves`,display:`${t} Leaves`,cat:"wood",tex:`${i}_leaves`,layer:"cutout",opacity:1,tint:n?"foliage":"none",sound:"grass",wave:"leaves"}),Z({name:`${i}_slab`,display:`${t} Slab`,cat:"wood",tex:`${i}_planks`,shape:"slab",sound:"wood"}),Z({name:`${i}_stairs`,display:`${t} Stairs`,cat:"wood",tex:`${i}_planks`,shape:"stairs",sound:"wood"}),Z({name:`${i}_fence`,display:`${t} Fence`,cat:"wood",tex:`${i}_planks`,shape:"fence",family:"wood_fence",sound:"wood"}),Z({name:`${i}_door`,display:`${t} Door`,cat:"wood",tex:{top:`${i}_door_top`,bottom:`${i}_door_bottom`,side:`${i}_door_bottom`},shape:"door",layer:"cutout",sound:"wood"}),Z({name:`${i}_trapdoor`,display:`${t} Trapdoor`,cat:"wood",tex:`${i}_trapdoor`,shape:"trapdoor",layer:"cutout",sound:"wood"}),Z({name:`${i}_sapling`,display:`${t} Sapling`,cat:"wood",tex:`${i}_sapling`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"})}var zy=[["cobblestone","Cobblestone","cobblestone"],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone"],["smooth_stone","Smooth Stone","smooth_stone"],["stone_bricks","Stone Bricks","stone_bricks"],["mossy_stone_bricks","Mossy Stone Bricks","mossy_stone_bricks"],["cracked_stone_bricks","Cracked Stone Bricks","cracked_stone_bricks"],["chiseled_stone_bricks","Chiseled Stone Bricks","chiseled_stone_bricks"],["bricks","Bricks","bricks"],["polished_granite","Polished Granite","polished_granite"],["polished_diorite","Polished Diorite","polished_diorite"],["polished_andesite","Polished Andesite","polished_andesite"],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate"],["polished_deepslate","Polished Deepslate","polished_deepslate"],["deepslate_bricks","Deepslate Bricks","deepslate_bricks"],["deepslate_tiles","Deepslate Tiles","deepslate_tiles"],["polished_tuff","Polished Tuff","polished_tuff"],["mud_bricks","Mud Bricks","mud_bricks"],["packed_mud","Packed Mud","packed_mud"],["prismarine","Prismarine","prismarine"],["prismarine_bricks","Prismarine Bricks","prismarine_bricks"],["dark_prismarine","Dark Prismarine","dark_prismarine"],["nether_bricks","Nether Bricks","nether_bricks"],["red_nether_bricks","Red Nether Bricks","red_nether_bricks"],["cracked_nether_bricks","Cracked Nether Bricks","cracked_nether_bricks"],["chiseled_nether_bricks","Chiseled Nether Bricks","chiseled_nether_bricks"],["polished_blackstone","Polished Blackstone","polished_blackstone"],["polished_blackstone_bricks","Polished Blackstone Bricks","polished_blackstone_bricks"],["end_stone_bricks","End Stone Bricks","end_stone_bricks"],["purpur_block","Purpur Block","purpur"],["terracotta","Terracotta","terracotta"]];for(let[i,t,e]of zy)Z({name:i,display:t,cat:"building",tex:e});Z({name:"sandstone",display:"Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_bottom",side:"sandstone"}});Z({name:"chiseled_sandstone",display:"Chiseled Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"chiseled_sandstone"}});Z({name:"cut_sandstone",display:"Cut Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"cut_sandstone"}});Z({name:"smooth_sandstone",display:"Smooth Sandstone",cat:"building",tex:"sandstone_top"});Z({name:"red_sandstone",display:"Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_bottom",side:"red_sandstone"}});Z({name:"chiseled_red_sandstone",display:"Chiseled Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"chiseled_red_sandstone"}});Z({name:"cut_red_sandstone",display:"Cut Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"cut_red_sandstone"}});Z({name:"smooth_red_sandstone",display:"Smooth Red Sandstone",cat:"building",tex:"red_sandstone_top"});Z({name:"quartz_block",display:"Block of Quartz",cat:"building",tex:{top:"quartz_top",bottom:"quartz_top",side:"quartz_side"}});Z({name:"chiseled_quartz_block",display:"Chiseled Quartz Block",cat:"building",tex:{end:"chiseled_quartz_top",side:"chiseled_quartz"},orient:"axis"});Z({name:"quartz_pillar",display:"Quartz Pillar",cat:"building",tex:{end:"quartz_pillar_top",side:"quartz_pillar"},orient:"axis"});Z({name:"quartz_bricks",display:"Quartz Bricks",cat:"building",tex:"quartz_bricks"});Z({name:"smooth_quartz",display:"Smooth Quartz Block",cat:"building",tex:"quartz_top"});Z({name:"purpur_pillar",display:"Purpur Pillar",cat:"building",tex:{end:"purpur_pillar_top",side:"purpur_pillar"},orient:"axis"});Z({name:"glass",display:"Glass",cat:"building",tex:"glass",layer:"cutout",cullSelf:!0,sound:"glass"});Z({name:"tinted_glass",display:"Tinted Glass",cat:"building",tex:"tinted_glass",layer:"translucent",cullSelf:!0,opacity:15,sound:"glass"});Z({name:"glass_pane",display:"Glass Pane",cat:"building",tex:"glass",shape:"pane",layer:"cutout",family:"pane",sound:"glass"});Z({name:"iron_bars",display:"Iron Bars",cat:"building",tex:"iron_bars",shape:"pane",layer:"cutout",family:"pane",sound:"metal"});var Hy=[["stone","Stone","stone",!1],["cobblestone","Cobblestone","cobblestone",!0],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone",!0],["smooth_stone","Smooth Stone","smooth_stone_slab_side",!1],["stone_brick","Stone Brick","stone_bricks",!0],["brick","Brick","bricks",!0],["sandstone","Sandstone","sandstone_top",!0],["red_sandstone","Red Sandstone","red_sandstone_top",!0],["quartz","Quartz","quartz_top",!1],["granite","Granite","granite",!0],["diorite","Diorite","diorite",!0],["andesite","Andesite","andesite",!0],["polished_andesite","Polished Andesite","polished_andesite",!1],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate",!0],["deepslate_brick","Deepslate Brick","deepslate_bricks",!0],["prismarine","Prismarine","prismarine",!0],["nether_brick","Nether Brick","nether_bricks",!0],["blackstone","Blackstone","blackstone",!0],["end_stone_brick","End Stone Brick","end_stone_bricks",!0],["purpur","Purpur","purpur",!1],["mud_brick","Mud Brick","mud_bricks",!0]];for(let[i,t,e,n]of Hy){let s=i==="smooth_stone"?{top:"smooth_stone",bottom:"smooth_stone",side:e}:e;Z({name:`${i}_slab`,display:`${t} Slab`,cat:"building",tex:s,shape:"slab"}),i!=="smooth_stone"&&Z({name:`${i}_stairs`,display:`${t} Stairs`,cat:"building",tex:e,shape:"stairs"}),n&&Z({name:`${i}_wall`,display:`${t} Wall`,cat:"building",tex:e,shape:"wall",family:"wall"})}for(let i of vs)Z({name:`${i}_wool`,display:`${$i(i)} Wool`,cat:"colored",tex:`wool_${i}`,sound:"wool"});for(let i of vs)Z({name:`${i}_carpet`,display:`${$i(i)} Carpet`,cat:"colored",tex:`wool_${i}`,shape:"carpet",sound:"wool",support:"solid"});for(let i of vs)Z({name:`${i}_concrete`,display:`${$i(i)} Concrete`,cat:"colored",tex:`concrete_${i}`});for(let i of vs)Z({name:`${i}_concrete_powder`,display:`${$i(i)} Concrete Powder`,cat:"colored",tex:`powder_${i}`,sound:"sand"});for(let i of vs)Z({name:`${i}_terracotta`,display:`${$i(i)} Terracotta`,cat:"colored",tex:`terracotta_${i}`});for(let i of vs)Z({name:`${i}_glazed_terracotta`,display:`${$i(i)} Glazed Terracotta`,cat:"colored",tex:`glazed_${i}`,orient:"horizontal"});for(let i of vs)Z({name:`${i}_stained_glass`,display:`${$i(i)} Stained Glass`,cat:"colored",tex:`stained_glass_${i}`,layer:"translucent",cullSelf:!0,sound:"glass"});for(let i of vs)Z({name:`${i}_stained_glass_pane`,display:`${$i(i)} Stained Glass Pane`,cat:"colored",tex:`stained_glass_${i}`,shape:"pane",layer:"translucent",family:"pane",sound:"glass"});Z({name:"glowstone",display:"Glowstone",cat:"light",tex:"glowstone",light:15,sound:"glass"});Z({name:"sea_lantern",display:"Sea Lantern",cat:"light",tex:"sea_lantern",light:15,sound:"glass"});Z({name:"torch",display:"Torch",cat:"light",tex:"torch",shape:"torch",layer:"cutout",light:14,solid:!1,sound:"wood"});Z({name:"soul_torch",display:"Soul Torch",cat:"light",tex:"soul_torch",shape:"torch",layer:"cutout",light:10,solid:!1,sound:"wood"});Z({name:"lantern",display:"Lantern",cat:"light",tex:"lantern",shape:"lantern",layer:"cutout",light:15,sound:"metal"});Z({name:"soul_lantern",display:"Soul Lantern",cat:"light",tex:"soul_lantern",shape:"lantern",layer:"cutout",light:10,sound:"metal"});Z({name:"shroomlight",display:"Shroomlight",cat:"light",tex:"shroomlight",light:15,sound:"wool"});Z({name:"jack_o_lantern",display:"Jack o'Lantern",cat:"light",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"jack_o_lantern"},orient:"horizontal",light:15,sound:"wood"});Z({name:"redstone_lamp",display:"Redstone Lamp",cat:"light",tex:"redstone_lamp_on",light:15,sound:"glass"});Z({name:"ochre_froglight",display:"Ochre Froglight",cat:"light",tex:{end:"froglight_ochre_top",side:"froglight_ochre"},orient:"axis",light:15});Z({name:"verdant_froglight",display:"Verdant Froglight",cat:"light",tex:{end:"froglight_verdant_top",side:"froglight_verdant"},orient:"axis",light:15});Z({name:"pearlescent_froglight",display:"Pearlescent Froglight",cat:"light",tex:{end:"froglight_pearl_top",side:"froglight_pearl"},orient:"axis",light:15});Z({name:"end_rod",display:"End Rod",cat:"light",tex:"end_rod",shape:"rod",layer:"cutout",light:14,sound:"glass"});Z({name:"campfire_log_glow",display:"Glowing Embers",cat:"light",tex:"embers",light:12,sound:"wood"});Z({name:"bookshelf",display:"Bookshelf",cat:"decor",tex:{top:"oak_planks",bottom:"oak_planks",side:"bookshelf"},sound:"wood"});Z({name:"crafting_table",display:"Crafting Table",cat:"decor",tex:{top:"crafting_table_top",bottom:"oak_planks",side:"crafting_table_side",front:"crafting_table_front"},orient:"horizontal",sound:"wood"});Z({name:"furnace",display:"Furnace",cat:"decor",tex:{top:"furnace_top",bottom:"furnace_top",side:"furnace_side",front:"furnace_front"},orient:"horizontal"});Z({name:"blast_furnace",display:"Blast Furnace",cat:"decor",tex:{top:"blast_furnace_top",bottom:"blast_furnace_top",side:"blast_furnace_side",front:"blast_furnace_front"},orient:"horizontal"});Z({name:"chest",display:"Chest",cat:"decor",tex:{top:"chest_top",bottom:"chest_top",side:"chest_side",front:"chest_front"},shape:"chest",orient:"horizontal",layer:"cutout",sound:"wood"});Z({name:"barrel",display:"Barrel",cat:"decor",tex:{end:"barrel_top",side:"barrel_side"},orient:"axis",sound:"wood"});Z({name:"note_block",display:"Note Block",cat:"decor",tex:"note_block",sound:"wood"});Z({name:"jukebox",display:"Jukebox",cat:"decor",tex:{top:"jukebox_top",bottom:"jukebox_side",side:"jukebox_side"},sound:"wood"});Z({name:"tnt",display:"TNT",cat:"decor",tex:{top:"tnt_top",bottom:"tnt_bottom",side:"tnt_side"},sound:"grass"});Z({name:"target",display:"Target",cat:"decor",tex:{top:"target_top",bottom:"target_top",side:"target_side"},sound:"grass"});Z({name:"pumpkin",display:"Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side"},sound:"wood"});Z({name:"carved_pumpkin",display:"Carved Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"carved_pumpkin"},orient:"horizontal",sound:"wood"});Z({name:"melon",display:"Melon",cat:"decor",tex:{top:"melon_top",bottom:"melon_top",side:"melon_side"},sound:"wood"});Z({name:"hay_block",display:"Hay Bale",cat:"decor",tex:{end:"hay_top",side:"hay_side"},orient:"axis",sound:"grass"});Z({name:"sponge",display:"Sponge",cat:"decor",tex:"sponge",sound:"grass"});Z({name:"wet_sponge",display:"Wet Sponge",cat:"decor",tex:"wet_sponge",sound:"grass"});Z({name:"slime_block",display:"Slime Block",cat:"decor",tex:"slime",layer:"translucent",cullSelf:!0,sound:"slime"});Z({name:"honey_block",display:"Honey Block",cat:"decor",tex:"honey",layer:"translucent",cullSelf:!0,sound:"slime"});Z({name:"honeycomb_block",display:"Honeycomb Block",cat:"decor",tex:"honeycomb",sound:"wool"});Z({name:"dried_kelp_block",display:"Dried Kelp Block",cat:"decor",tex:{top:"kelp_top",bottom:"kelp_top",side:"kelp_side"},sound:"grass"});Z({name:"brown_mushroom_block",display:"Brown Mushroom Block",cat:"decor",tex:"mushroom_brown",sound:"wood"});Z({name:"red_mushroom_block",display:"Red Mushroom Block",cat:"decor",tex:"mushroom_red",sound:"wood"});Z({name:"mushroom_stem",display:"Mushroom Stem",cat:"decor",tex:"mushroom_stem",sound:"wood"});Z({name:"cobweb",display:"Cobweb",cat:"decor",tex:"cobweb",shape:"cross",layer:"cutout",solid:!1,sound:"wool"});Z({name:"cactus",display:"Cactus",cat:"decor",tex:{top:"cactus_top",bottom:"cactus_bottom",side:"cactus_side"},shape:"cactus",layer:"cutout",support:"cactus",sound:"wool"});Z({name:"sugar_cane",display:"Sugar Cane",cat:"decor",tex:"sugar_cane",shape:"cross",layer:"cutout",solid:!1,support:"cane",sound:"grass"});Z({name:"short_grass",display:"Short Grass",cat:"decor",tex:"tall_grass",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});Z({name:"fern",display:"Fern",cat:"decor",tex:"fern",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});Z({name:"dead_bush",display:"Dead Bush",cat:"decor",tex:"dead_bush",shape:"cross",layer:"cutout",solid:!1,replaceable:!0,support:"sand",sound:"grass",wave:"plant"});var Gy=[["dandelion","Dandelion"],["poppy","Poppy"],["blue_orchid","Blue Orchid"],["allium","Allium"],["azure_bluet","Azure Bluet"],["red_tulip","Red Tulip"],["orange_tulip","Orange Tulip"],["white_tulip","White Tulip"],["pink_tulip","Pink Tulip"],["oxeye_daisy","Oxeye Daisy"],["cornflower","Cornflower"],["lily_of_the_valley","Lily of the Valley"]];for(let[i,t]of Gy)Z({name:i,display:t,cat:"decor",tex:`flower_${i}`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"});Z({name:"brown_mushroom",display:"Brown Mushroom",cat:"decor",tex:"brown_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});Z({name:"red_mushroom",display:"Red Mushroom",cat:"decor",tex:"red_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});Z({name:"lily_pad",display:"Lily Pad",cat:"decor",tex:"lily_pad",shape:"lily",layer:"cutout",solid:!0,tint:"foliage",support:"water",sound:"grass"});Z({name:"seagrass",display:"Seagrass",cat:"decor",tex:"seagrass",shape:"cross",layer:"cutout",solid:!1,item:!1,sound:"grass",wave:"plant"});Z({name:"water",display:"Water",cat:"fluids",tex:"water",shape:"fluid",layer:"water",fluid:!0,solid:!1,opacity:1,replaceable:!0,cullSelf:!0,tint:"water",sound:"liquid"});Z({name:"lava",display:"Lava",cat:"fluids",tex:"lava",shape:"fluid",layer:"lava",fluid:!0,solid:!1,light:15,opacity:0,replaceable:!0,cullSelf:!0,sound:"liquid"});var Le=xs,vt=xs.length,_t={};xs.forEach((i,t)=>{_t[i.name]=t});var Wy=["cube","slab","stairs","fence","wall","cross","torch","door","trapdoor","pane","fluid","layer","carpet","cactus","lantern","chest","rod","lily"],J=Object.fromEntries(Wy.map((i,t)=>[i,t])),Vy=["opaque","cutout","translucent","water","lava"],xn=Object.fromEntries(Vy.map((i,t)=>[i,t])),jt=new Uint8Array(vt),nn=new Uint8Array(vt),Yh=new Uint8Array(vt),fl=new Uint8Array(vt),ws=new Uint8Array(vt),ge=new Uint8Array(vt),ce=new Uint8Array(vt),pl=new Uint8Array(vt),aa=new Uint8Array(vt),Xi=new Uint8Array(vt),er=new Uint8Array(vt),Xr=new Uint8Array(vt),Kh=new Uint8Array(vt),ti=new Uint8Array(vt),nr=new Uint8Array(vt),Zh=new Uint8Array(vt),qh=[""],$y=["none","grass","foliage","water"],wp,Mp,Sp,Ap,Ep,Tp;for(let i=0;i<vt;i++){let t=xs[i],e=(wp=t.shape)!=null?wp:"cube",n=(Mp=t.layer)!=null?Mp:"opaque";jt[i]=J[e],nn[i]=xn[n],Yh[i]=(Sp=t.light)!=null?Sp:0;let s=e==="cube"&&n==="opaque";if(ws[i]=s&&t.transparent!==!0?1:0,fl[i]=(Ap=t.opacity)!=null?Ap:s?15:0,ge[i]=(Ep=t.solid)==null||Ep?1:0,ce[i]=t.fluid?1:0,pl[i]=t.cullSelf?1:0,aa[i]=t.replaceable?1:0,Xi[i]=$y.indexOf((Tp=t.tint)!=null?Tp:"none"),er[i]=t.tintMask?1:0,Xr[i]=t.orient==="axis"?1:t.orient==="horizontal"?2:0,Kh[i]=t.wave==="plant"?1:t.wave==="leaves"?2:0,ti[i]=t.name.endsWith("_leaves")?1:0,t.family){let r=qh.indexOf(t.family);r<0&&(r=qh.length,qh.push(t.family)),nr[i]=r}Zh[i]=i!==0&&!t.fluid?1:0}ge[0]=0;fl[0]=0;var _s=[],xp=new Map;function dl(i){let t=xp.get(i);return t===void 0&&(t=_s.length,_s.push(i),xp.set(i,t)),t}dl("missing");var It=new Uint16Array(vt*6),Cp,kp,Rp,Lp,Pp,Ip,Dp,Up,Np,Bp,Fp,Op;for(let i=0;i<vt;i++){let t=xs[i].tex,e;if(typeof t=="string")e=[t,t,t,t,t,t];else{let n=(Rp=(kp=(Cp=t.side)!=null?Cp:t.all)!=null?kp:t.end)!=null?Rp:"missing",s=(Pp=(Lp=t.top)!=null?Lp:t.end)!=null?Pp:n,r=(Dp=(Ip=t.bottom)!=null?Ip:t.end)!=null?Dp:s;e=[(Up=t.east)!=null?Up:n,(Np=t.west)!=null?Np:n,s,r,(Bp=t.south)!=null?Bp:n,(Op=(Fp=t.north)!=null?Fp:t.front)!=null?Op:n]}for(let n=0;n<6;n++)It[i*6+n]=dl(e[n])}var Jh={water_still:dl("water"),lava_still:dl("lava")},oa=new Uint8Array(1024);for(let i=0;i<vt;i++){let t=nn[i]===xn.cutout?1:nn[i]===xn.translucent?2:0;for(let e=0;e<6;e++){let n=It[i*6+e];t>oa[n]&&(oa[n]=t)}}function jh(i){var t,e;return(e=(t=xs[i])==null?void 0:t.display)!=null?e:"Unknown"}function qr(i){return i>0&&xs[i].item!==!1}var Ot=1023,Hp=10,Ce=(i,t=0)=>i|t<<Hp,wn=i=>i&Ot,Gp=i=>i>>Hp;if(vt>1024)throw new Error("Too many blocks for 10-bit ids");var Pe=64,la=32,ml={search:vt,missing:vt+1},Wp=vt+2,Vp=[-28,-14],$p=[28,-14],Xy=[0,-34],qy=32,Yy=63,Qh=(i,t)=>qy+Vp[0]*i+$p[0]*t,tu=(i,t,e)=>Yy+Vp[1]*i+$p[1]*e+Xy[1]*t,eu=(i,t,e)=>-(i+e)*.6124+t*.5;var gl=class{constructor(){this.px=new Uint8ClampedArray(Pe*Pe*4);this.z=new Float32Array(Pe*Pe)}clear(){this.px.fill(0),this.z.fill(-1e9)}put(t,e,n,s){let r=e.tile,a=r[n+3],o=r[n],l=r[n+1],c=r[n+2];if(e.alpha===0)e.mask&&a<128&&e.tint&&(o=o*e.tint[0]/255,l=l*e.tint[1]/255,c=c*e.tint[2]/255),a=255;else{if(e.alpha===1){if(a<128)return;a=255}else if(a===0)return;e.tint&&(o=o*e.tint[0]/255,l=l*e.tint[1]/255,c=c*e.tint[2]/255)}if(s<=this.z[t])return;o*=e.shade,l*=e.shade,c*=e.shade;let h=t*4,u=this.px;if(e.alpha===2){a=Math.max(a,e.minAlpha);let f=a/255,d=u[h+3]/255,g=f+d*(1-f);if(g<=0)return;u[h]=(o*f+u[h]*d*(1-f))/g,u[h+1]=(l*f+u[h+1]*d*(1-f))/g,u[h+2]=(c*f+u[h+2]*d*(1-f))/g,u[h+3]=g*255}else u[h]=o,u[h+1]=l,u[h+2]=c,u[h+3]=255,this.z[t]=s}quad(t,e,n,s,r,a,o,l,c,h,u,f,d,g){let b=Qh(t,n),p=tu(t,e,n),m=Qh(t+s,n+a)-b,_=tu(t+s,e+r,n+a)-p,y=Qh(t+o,n+c)-b,v=tu(t+o,e+l,n+c)-p,w=m*v-y*_;if(Math.abs(w)<1e-6)return;let S=eu(t,e,n),A=eu(t+s,e+r,n+a)-S,L=eu(t+o,e+l,n+c)-S,P=[b,b+m,b+y,b+m+y],M=[p,p+_,p+v,p+_+v],T=Math.max(0,Math.floor(Math.min(...P))),I=Math.min(Pe-1,Math.ceil(Math.max(...P))),F=Math.max(0,Math.floor(Math.min(...M))),k=Math.min(Pe-1,Math.ceil(Math.max(...M))),U=1e-4,N=Math.min(h,u),D=Math.max(h,u),z=Math.min(f,d),$=Math.max(f,d);for(let nt=F;nt<=k;nt++){let et=nt+.5-p;for(let rt=T;rt<=I;rt++){let bt=rt+.5-b,G=(bt*v-et*y)/w,tt=(m*et-_*bt)/w;if(G<-U||G>=1+U||tt<-U||tt>=1+U)continue;let at=Math.floor(h+(u-h)*Math.min(Math.max(G,0),.99999)),Q=Math.floor(f+(d-f)*Math.min(Math.max(tt,0),.99999));u<h&&(at=Math.min(Math.max(at,N),Math.ceil(D)-1)),d<f&&(Q=Math.min(Math.max(Q,z),Math.ceil($)-1)),at=at<0?0:at>15?15:at,Q=Q<0?0:Q>15?15:Q,this.put(nt*Pe+rt,g,(Q*16+at)*4,S+G*A+tt*L)}}}sprite(t,e,n,s,r,a){for(let o=0;o<16;o++)for(let l=0;l<16;l++)if(!(a&&!a(l,o)))for(let c=0;c<r;c++)for(let h=0;h<r;h++){let u=n+l*r+h,f=s+o*r+c;u<0||f<0||u>=Pe||f>=Pe||this.put(f*Pe+u,{...e,tile:t},(o*16+l)*4,0)}}};function Xp(i){switch(Xi[i]){case 1:return Qn.grass;case 2:return Qn.foliage;case 3:return Qn.water;default:return null}}function nu(i){let t=nn[i];return t===xn.cutout?1:t===xn.translucent||t===xn.water?2:0}var qp=1,Yp=.8,Kp=.6;function Mn(i,t,e,n,s={}){var b,p,m;let[r,a,o,l,c,h]=n,u={alpha:nu(t),tint:Xp(t),mask:!!er[t],minAlpha:ce[t]?185:0},f=(b=s.top)!=null?b:It[t*6+2],d=(p=s.north)!=null?p:It[t*6+5],g=(m=s.west)!=null?m:It[t*6+1];i.quad(r,l,c,a-r,0,0,0,0,h-c,16*r,16*a,16*c,16*h,{...u,tile:e(f),shade:qp}),i.quad(a,l,c,r-a,0,0,0,o-l,0,16*(1-a),16*(1-r),16*(1-l),16*(1-o),{...u,tile:e(d),shade:Yp}),i.quad(r,l,c,0,0,h-c,0,o-l,0,16*c,16*h,16*(1-l),16*(1-o),{...u,tile:e(g),shade:Kp})}var ae=1/16,Ky=["................","....######......","...#gggggg#.....","..#gwwgggggr....","..#gwggggggr....","..#ggggggggr....","..#ggggggggr....","..#ggggggggr....","...#ggggggr.....","....#rrrrrhh....","..........hHh...","...........hHh..","............hHh.",".............hh.","................","................"],Zy={"#":[58,58,64,255],r:[130,130,140,255],g:[150,204,236,200],w:[240,250,255,255],h:[92,62,30,255],H:[140,98,52,255]};function Zp(i,t){let e=new Uint8ClampedArray(1024);for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=t[i[n][s]];if(!r)continue;let a=(n*16+s)*4;e[a]=r[0],e[a+1]=r[1],e[a+2]=r[2],e[a+3]=r[3]}return e}function Jy(i,t){let e=16,n=16,s=-1,r=-1;for(let a=0;a<16;a++)for(let o=0;o<16;o++)t&&!t(o,a)||i[(a*16+o)*4+3]>=128&&(e=Math.min(e,o),n=Math.min(n,a),s=Math.max(s,o),r=Math.max(r,a));return s<0?{x0:0,y0:0,x1:15,y1:15}:{x0:e,y0:n,x1:s,y1:r}}function Jp(i,t,e){if(i.clear(),t<=0||t>=vt)return;let n=jt[t],s={alpha:nu(t)===0?1:nu(t),tint:Xp(t),mask:!1,shade:1,minAlpha:0},r=It[t*6+5];switch(n){case J.slab:Mn(i,t,e,[0,1,0,.5,0,1]);return;case J.stairs:Mn(i,t,e,[0,1,0,.5,0,1]),Mn(i,t,e,[0,1,.5,1,.5,1]);return;case J.fence:Mn(i,t,e,[6*ae,10*ae,0,1,0,4*ae]),Mn(i,t,e,[6*ae,10*ae,0,1,12*ae,1]),Mn(i,t,e,[7*ae,9*ae,12*ae,15*ae,4*ae,12*ae]),Mn(i,t,e,[7*ae,9*ae,6*ae,9*ae,4*ae,12*ae]);return;case J.wall:Mn(i,t,e,[4*ae,12*ae,0,1,4*ae,12*ae]),Mn(i,t,e,[5*ae,11*ae,0,14*ae,0,1]);return;case J.layer:Mn(i,t,e,[0,1,0,2*ae,0,1]);return;case J.carpet:Mn(i,t,e,[0,1,0,ae,0,1]);return;case J.trapdoor:Mn(i,t,e,[0,1,0,3*ae,0,1],{north:It[t*6+2],west:It[t*6+2]});return;case J.chest:Mn(i,t,e,[ae,15*ae,0,14*ae,ae,15*ae]);return;case J.cactus:{let a={alpha:1,tint:null,mask:!1,minAlpha:0};i.quad(0,1,0,1,0,0,0,0,1,0,16,0,16,{...a,tile:e(It[t*6+2]),shade:qp}),i.quad(1,1,ae,-1,0,0,0,-1,0,0,16,0,16,{...a,tile:e(It[t*6+5]),shade:Yp}),i.quad(ae,1,0,0,0,1,0,-1,0,0,16,0,16,{...a,tile:e(It[t*6+1]),shade:Kp});return}case J.door:{let a=e(It[t*6+2]),o=e(It[t*6+3]);i.sprite(a,{...s,tile:a,alpha:1},16,0,2),i.sprite(o,{...s,tile:o,alpha:1},16,32,2);return}case J.torch:case J.lantern:{let a=e(r),o=n===J.lantern?(u,f)=>!(u<=5&&f<=5):void 0,l=Jy(a,o),c=Math.round((16-(l.x1-l.x0+1))/2)-l.x0,h=Math.round((16-(l.y1-l.y0+1))/2)-l.y0;i.sprite(a,{...s,tile:a,alpha:1},c*4,h*4,4,o);return}case J.rod:{let a=e(r),o=(h,u)=>[a[(u*16+h)*4],a[(u*16+h)*4+1],a[(u*16+h)*4+2],255],l=Zp(Array.from({length:16},()=>".".repeat(16)),{}),c=(h,u,f)=>{let d=(u*16+h)*4;l[d]=f[0],l[d+1]=f[1],l[d+2]=f[2],l[d+3]=255};for(let h=0;h<11;h++)c(4+h,11-h,o(7,4)),c(5+h,11-h,o(8,4));for(let h=0;h<4;h++)c(1+h,11+h-1,o(1,1)),c(2+h,12+h-1,o(2,2));i.sprite(l,{...s,tile:l,alpha:1},0,0,4);return}case J.cross:case J.pane:case J.lily:{let a=e(r);i.sprite(a,{...s,tile:a,alpha:n===J.pane&&nn[t]===xn.translucent?2:1},0,0,4);return}default:Mn(i,t,e,[0,1,0,1,0,1])}}function jp(i,t){let e=new gl;Jp(e,i,t);let n=document.createElement("canvas");n.width=Pe,n.height=Pe;let s=n.getContext("2d");if(s){let r=s.createImageData(Pe,Pe);r.data.set(e.px),s.putImageData(r,0,0)}return n}function jy(i){let t=Math.ceil(Wp/la),e=la*Pe,n=t*Pe,s=new Uint8ClampedArray(e*n*4),r=new gl,a=l=>{let c=l%la,h=Math.floor(l/la);for(let u=0;u<Pe;u++)s.set(r.px.subarray(u*Pe*4,(u+1)*Pe*4),((h*Pe+u)*e+c*Pe)*4)};for(let l=1;l<vt;l++){try{Jp(r,l,i)}catch(c){r.clear(),console.warn("[icons] failed",l,c)}a(l)}r.clear();let o=Zp(Ky,Zy);return r.sprite(o,{tile:o,alpha:2,tint:null,mask:!1,shade:1,minAlpha:0},0,0,4),a(ml.search),r.clear(),Mn(r,1,()=>i(0),[0,1,0,1,0,1]),a(ml.missing),{data:s,width:e,height:n,cols:la,rows:t}}function Qy(i,t,e){let s=new ArrayBuffer(122+t*e*4),r=new DataView(s);r.setUint8(0,66),r.setUint8(1,77),r.setUint32(2,s.byteLength,!0),r.setUint32(10,122,!0),r.setUint32(14,108,!0),r.setInt32(18,t,!0),r.setInt32(22,-e,!0),r.setUint16(26,1,!0),r.setUint16(28,32,!0),r.setUint32(30,3,!0),r.setUint32(34,t*e*4,!0),r.setInt32(38,2835,!0),r.setInt32(42,2835,!0),r.setUint32(54,16711680,!0),r.setUint32(58,65280,!0),r.setUint32(62,255,!0),r.setUint32(66,4278190080,!0),r.setUint32(70,1934772034,!0);let a=new Uint8Array(s,122);for(let o=0;o<i.length;o+=4)a[o]=i[o+2],a[o+1]=i[o+1],a[o+2]=i[o],a[o+3]=i[o+3];return s}function Qp(i){let t=new Uint8ClampedArray(1024),e=u=>{var f,d;return(d=(f=i.tiles[u])!=null?f:i.tiles[0])!=null?d:t},{data:n,width:s,height:r,cols:a,rows:o}=jy(e),l={url:"",size:Pe,cols:a,apply(u,f){if(!(f>0&&f<Wp)){u.classList.remove("bf-icon"),u.style.backgroundPosition="",u.removeAttribute("data-icon");return}u.classList.add("bf-icon");let d=f%a,g=Math.floor(f/a);u.style.backgroundPosition=`${a>1?d*100/(a-1):0}% ${o>1?g*100/(o-1):0}%`,u.setAttribute("data-icon",String(f))}},c=u=>{l.url=u,document.documentElement.style.setProperty("--bf-icons",`url("${u}")`)};document.documentElement.style.setProperty("--bf-icons-size",`${a*100}% ${o*100}%`);let h=()=>{let u=document.createElement("canvas");u.width=s,u.height=r;let f=u.getContext("2d");if(!f)return;let d=f.createImageData(s,r);d.data.set(n),f.putImageData(d,0,0),u.toBlob?u.toBlob(g=>{c(g?URL.createObjectURL(g):u.toDataURL())},"image/png"):c(u.toDataURL()),h=()=>{}};try{let u=URL.createObjectURL(new Blob([Qy(n,s,r)],{type:"image/bmp"}));c(u);let f=new Image;f.onerror=()=>h(),f.src=u}catch{h()}return l}function sr(i,t,e,n){let s=document.createElement(i);return t&&(s.className=t),n!==void 0&&(s.textContent=n),e&&e.appendChild(s),s}var Ut=(i,t,e)=>sr("div",i,t,e);function zt(i,t,e,n,s){i.style.left=oe(t),i.style.top=oe(e),n!==void 0&&(i.style.width=oe(n)),s!==void 0&&(i.style.height=oe(s))}function iu(i,t){let e=[];for(let n of i.split(`
`)){let s="";for(let r of n.split(" ")){let a=s?s+" "+r:r;s&&tr(a)-1>t?(e.push(s),s=r):s=a}e.push(s)}return e}function ca(i,t){if(tr(i)-1<=t)return i;let e=i;for(;e.length>1&&tr(e+"...")-1>t;)e=e.slice(0,-1);return e.trimEnd()+"..."}function qi(i,t,e,n=""){let s=Ut("bf-h1 "+n,i);return s.textContent=Ke(t,0),s.style.top=oe(e-1),s}function Ie(i,t,e,n,s){let r=sr("button","bf-btn",i);r.type="button",r.style.width=oe(e);let a={el:r,w:e,set(o){let l=Ke(o,e);r.textContent!==l&&(r.textContent=l)},enable(o){r.disabled=!o}};return a.set(t),s&&(r.dataset.tip=s),r.addEventListener("click",o=>{o.preventDefault(),r.disabled||n()}),a}function t_(i,t,e,n){let s=sr("a","bf-btn",i);return s.href=n,s.setAttribute("download","blockforge.html"),s.style.width=oe(e),s.textContent=Ke(t,e),{el:s,w:e,set(r){s.textContent=Ke(r,e)},enable(){}}}function e_(i,t,e,n,s,r,a,o,l){let c=Ut("bf-slider",i);c.tabIndex=0,c.style.width=oe(t),Ut("bf-track",c);let h=Ut("bf-knob",c),u=Ut("bf-lbl",c);l&&(c.dataset.tip=l);let f=p=>Math.max(e,Math.min(n,Math.round((p-e)/s)*s+e)),d=()=>{let p=r(),m=(Math.max(e,Math.min(n,p))-e)/(n-e||1);h.style.left=oe(Math.round(m*(t-8))),u.textContent=Ke(o(p),t)},g=p=>{let m=c.getBoundingClientRect(),_=Rn().u,y=(p-m.left-4*_)/(m.width-8*_),v=f(e+Math.max(0,Math.min(1,y))*(n-e));v!==r()&&(a(v),d())};c.addEventListener("pointerdown",p=>{if(p.button===0){p.preventDefault(),p.stopPropagation(),c.focus({preventScroll:!0}),c.classList.add("bf-drag");try{c.setPointerCapture(p.pointerId)}catch{}g(p.clientX)}}),c.addEventListener("pointermove",p=>{c.classList.contains("bf-drag")&&g(p.clientX)});let b=()=>c.classList.remove("bf-drag");return c.addEventListener("pointerup",b),c.addEventListener("pointercancel",b),c.addEventListener("keydown",p=>{let m=p.key==="ArrowLeft"||p.key==="ArrowDown"?-1:p.key==="ArrowRight"||p.key==="ArrowUp"?1:0;if(!m)return;p.preventDefault(),p.stopPropagation();let _=f(r()+m*s);_!==r()&&(a(_),d())}),d(),{el:c,refresh:d}}var da=class{constructor(t,e){this.top=0;this.height=0;this.content=0;this.scroll=0;this.acc=0;this.dragThumb=null;this.touch=null;this.swallowClick=!1;this.el=Ut("bf-list"+(e?" bf-sunk":""),t),this.inner=Ut("bf-list-in",this.el),e&&(Ut("bf-shade-t",this.el),Ut("bf-shade-b",this.el)),this.bar=Ut("bf-sbar",this.el),this.thumb=Ut("bf-thumb",this.bar),this.el.addEventListener("wheel",s=>{s.preventDefault();let r=s.deltaMode===1?s.deltaY*33:s.deltaMode===2?s.deltaY*300:s.deltaY;this.acc+=r*.2;let a=Math.trunc(this.acc);a&&(this.acc-=a,this.scrollTo(this.scroll+a))},{passive:!1}),this.thumb.addEventListener("pointerdown",s=>{s.preventDefault(),s.stopPropagation(),this.dragThumb={y:s.clientY,s:this.scroll};try{this.thumb.setPointerCapture(s.pointerId)}catch{}}),this.thumb.addEventListener("pointermove",s=>{if(!this.dragThumb)return;let r=Rn().u,a=this.height-this.thumbH(),o=Math.max(0,this.content-this.height);a>0&&this.scrollTo(this.dragThumb.s+(s.clientY-this.dragThumb.y)/r*(o/a))}),this.thumb.addEventListener("pointerup",()=>{this.dragThumb=null}),this.bar.addEventListener("pointerdown",s=>{if(s.target!==this.bar)return;let r=this.bar.getBoundingClientRect(),a=(s.clientY-r.top)/r.height;this.scrollTo(a*(this.content-this.height))}),this.el.addEventListener("pointerdown",s=>{s.pointerType!=="mouse"&&(this.touch={id:s.pointerId,y:s.clientY,s:this.scroll,moved:!1})},!0),this.el.addEventListener("pointermove",s=>{let r=this.touch;if(!r||r.id!==s.pointerId)return;let a=Rn().u;Math.abs(s.clientY-r.y)>6*a&&(r.moved=!0),r.moved&&this.scrollTo(r.s-(s.clientY-r.y)/a)},!0);let n=()=>{var s;(s=this.touch)!=null&&s.moved&&(this.swallowClick=!0),this.touch=null};this.el.addEventListener("pointerup",n,!0),this.el.addEventListener("pointercancel",n,!0),this.el.addEventListener("click",s=>{this.swallowClick&&(s.stopPropagation(),s.preventDefault(),this.swallowClick=!1)},!0),this.el.addEventListener("focusin",s=>{var l,c;let r=s.target,a=parseFloat((l=r.dataset.y)!=null?l:"NaN"),o=parseFloat((c=r.dataset.h)!=null?c:"20");Number.isNaN(a)||this.ensureVisible(a,o)})}place(t,e,n,s){this.top=e,this.height=Math.max(20,n),zt(this.el,0,e,t.gw,this.height),zt(this.bar,s,0,6,this.height),this.scrollTo(this.scroll)}setContent(t){this.content=t,this.scrollTo(this.scroll)}thumbH(){return Math.max(32,Math.min(this.height-8,Math.round(this.height*this.height/Math.max(1,this.content))))}scrollTo(t){let e=Math.max(0,this.content-this.height);if(this.scroll=Math.max(0,Math.min(e,Math.round(t))),this.inner.style.top=oe(-this.scroll),this.bar.classList.toggle("bf-none",e<=0),e>0){let n=this.thumbH();zt(this.thumb,0,Math.round((this.height-n)*this.scroll/e),6,n)}}ensureVisible(t,e){t<this.scroll?this.scrollTo(t-4):t+e>this.scroll+this.height&&this.scrollTo(t+e-this.height+4)}get scrollTop(){return this.scroll}get offsetTop(){return this.top}},ru=class{constructor(t,e,n,s=()=>{}){this.name=e;this.layout=s;this.root=Ut("bf-screen",t),this.root.style.display="none",this.bg=Ut("bf-full "+n,this.root),this.bg.style.position="absolute",this.gui=Ut("bf-gui",this.root),this.gui.style.position="absolute"}setBg(t){this.bg.className="bf-full "+t,this.bg.style.position="absolute"}},bl=null,n_=i=>{var e;bl||(bl=new Map);let t=bl.get(i);return t||(t=di((e=_s[i])!=null?e:"missing"),bl.set(i,t)),t},tm=new Map,yl=["grass_block","oak_log","cherry_leaves","sand","snowy_grass_block","stone_bricks","birch_log","mossy_cobblestone","spruce_planks","podzol"];function i_(i){var s;let t=yl[((i|0)%yl.length+yl.length)%yl.length],e=(s=_t[t])!=null?s:_t.grass_block,n=tm.get(e);if(!n){try{n=jp(e,n_).toDataURL()}catch{n=""}tm.set(e,n)}return n}var s_={B:["#####.","##..##","##..##","#####.","##..##","##..##","#####."],L:["##....","##....","##....","##....","##....","##....","######"],O:[".####.","##..##","##..##","##..##","##..##","##..##",".####."],C:[".#####","##....","##....","##....","##....","##....",".#####"],K:["##..##","##.##.","####..","###...","####..","##.##.","##..##"],F:["######","##....","##....","#####.","##....","##....","##...."],R:["#####.","##..##","##..##","#####.","##.##.","##..##","##..##"],G:[".#####","##....","##....","##.###","##..##","##..##",".#####"],E:["######","##....","##....","#####.","##....","##....","######"]},ou="BLOCKFORGE",Ms=8,vl=10,Ze=(ou.length*7-1)*Ms+vl+4,ki=7*Ms+vl+4,ha=null;function r_(){if(ha!==null)return ha;try{let i=document.createElement("canvas");i.width=Ze,i.height=ki;let t=i.getContext("2d"),e=t.createImageData(Ze,ki),n=e.data,s=di("stone_bricks"),r=di("cobblestone"),a=di("gold_block"),o=di("magma"),l=new Uint8Array(Ze*ki),c=new Int8Array(Ze*ki).fill(-1),h=2;for(let g=0;g<ou.length;g++){let b=s_[ou[g]];for(let p=0;p<7;p++)for(let m=0;m<6;m++)if(b[p][m]==="#")for(let _=0;_<Ms;_++)for(let y=0;y<Ms;y++){let v=h+m*Ms+y,w=2+p*Ms+_;c[w*Ze+v]=g;for(let S=1;S<=vl;S++)l[(w+S)*Ze+v+(S>>2)]=1}h+=7*Ms}let u=(g,b,p,m)=>{n[g*4]=b,n[g*4+1]=p,n[g*4+2]=m,n[g*4+3]=255},f=(g,b,p)=>((p&15)*16+(b&15))*4;for(let g=0;g<ki;g++)for(let b=0;b<Ze;b++){let p=g*Ze+b,m=c[p];if(m>=0){let _=m>=5,y=_?((b>>3)+(g>>3))%5===0?o:a:(b>>4)+(g>>4)&1?r:s,v=f(y,b,g),w=g>0?c[p-Ze]:-1,S=g<ki-1?c[p+Ze]:-1,A=b>0?c[p-1]:-1,L=1;w<0||A<0?L=1.28:S<0&&(L=.82);let P=y[v]*L,M=y[v+1]*L,T=y[v+2]*L;_&&(P=P*1.05+10,M=M*.82,T=T*.55),u(p,Math.min(255,P),Math.min(255,M),Math.min(255,T))}else if(l[p]){let _=0;for(;_<vl&&g-_-1>=0&&c[(g-_-1)*Ze+b-(_+1>>2)]<0;)_++;let y=b<5*7*Ms?s:a,v=f(y,b,g),w=.36-_*.012;u(p,y[v]*w+6,y[v+1]*w+4,y[v+2]*w+4)}}let d=new Uint8Array(Ze*ki);for(let g=0;g<d.length;g++)d[g]=n[g*4+3]?1:0;for(let g=0;g<ki;g++)for(let b=0;b<Ze;b++){let p=g*Ze+b;if(d[p])continue;(b>0&&d[p-1]||b<Ze-1&&d[p+1]||g>0&&d[p-Ze]||g<ki-1&&d[p+Ze])&&(n[p*4]=12,n[p*4+1]=10,n[p*4+2]=10,n[p*4+3]=255)}t.putImageData(e,0,0),ha=i.toDataURL()}catch{ha=""}return ha}var ei=1024,ir=256,ua=null;function o_(){if(ua!==null)return ua;try{let i=document.createElement("canvas");i.width=ei,i.height=ir;let t=i.getContext("2d"),e=t.createImageData(ei,ir),n=e.data,s=(T,I,F,k,U,N=255)=>{if(I<0||I>=ir)return;let D=(I*ei+(T%ei+ei)%ei)*4,z=N/255;n[D]=n[D]*(1-z)+F*z,n[D+1]=n[D+1]*(1-z)+k*z,n[D+2]=n[D+2]*(1-z)+U*z,n[D+3]=255};for(let T=0;T<ir;T++){let I=T/ir,F=104+I*110,k=160+I*70,U=236+I*14;for(let N=0;N<ei;N++)s(N,T,F,k,U)}let r=(T,I)=>I.reduce((F,[k,U,N])=>F+k*Math.sin(T/ei*Math.PI*2*U+N),0),a=[[118,[150,176,206],[[22,3,.4],[10,7,1.3],[6,13,2.1]]],[138,[116,146,170],[[18,2,2.2],[9,5,.3],[5,11,4]]]];for(let[T,I,F]of a)for(let k=0;k<ei;k+=4){let U=Math.round((T-r(k,F))/4)*4;for(let N=U;N<ir;N++)for(let D=0;D<4;D++)s(k+D,N,I[0],I[1],I[2])}for(let T=0;T<9;T++){let I=(T*113+37)%ei,F=18+T*53%46,k=40+T*29%50;for(let U=0;U<8;U++)for(let N=0;N<k;N++)U<4&&(N<8||N>k-12)||U>5&&N>k-20||s(I+N,F+U,255,255,255,215)}let o=T=>di(T),l=o("grass_side"),c=o("dirt"),h=o("stone"),u=o("sand"),f=o("water"),d=o("oak_log"),g=o("oak_leaves"),b=o("birch_log"),p=o("ore_stone_coal"),m=o("flower_poppy"),_=o("flower_dandelion"),y=o("tall_grass"),v=[123,189,86],w=[95,171,54],S=[63,118,228],A=(T,I,F,k,U=!1,N=1,D=!1)=>{for(let z=0;z<16;z++)for(let $=0;$<16;$++){let nt=(z*16+$)*4,et=T[nt],rt=T[nt+1],bt=T[nt+2],G=T[nt+3];D&&G<128||(k&&(!U||G<128)&&(et=et*k[0]/255,rt=rt*k[1]/255,bt=bt*k[2]/255),s(I+$,F+z,et,rt,bt,Math.round(N*(D?255:N<1?Math.max(G,150):255))))}},L=12,P=ei/16,M=[];for(let T=0;T<P;T++){let I=11-r(T*16,[[2.2,2,.7],[1.4,5,2.4],[.8,9,.2]]);M.push(Math.round(I))}for(let T=0;T<P;T++){let I=M[T],F=T*16,k=I>=L-1;for(let U=I;U<16;U++){let N=U*16;U===I?A(k?u:l,F,N,k?void 0:v,!0):U<I+3?A(k?u:c,F,N):A((T*7+U*3)%11===0?p:h,F,N)}for(let U=L;U<I;U++)A(f,F,U*16,S,!1,.75);if(!k&&T%9===3){let U=T%2?b:d;for(let N=1;N<=4;N++)A(U,F,(I-N)*16);for(let N=-2;N<=2;N++)for(let D=3;D<=6;D++)Math.abs(N)===2&&(D===6||D===3)||D===6&&Math.abs(N)===1&&T%3===0||N===0&&D<5||A(g,F+N*16,(I-D)*16,w,!1,1,!0)}else!k&&T*5%7===1&&A(T%3?y:T%2?m:_,F,(I-1)*16,T%3?v:void 0,!1,1,!0)}t.putImageData(e,0,0),ua=i.toDataURL()}catch{ua=""}return ua}var _l=[`${vt-1} blocks!`,"Made of 16x16 pixels!","Runs in a browser tab!","Infinite worlds!","Double-tap W to sprint!","Visit a cherry grove!","Every texture drawn by code!","No downloads needed!","Works offline too!","Build a castle!","Mind the Ctrl+W!","Cubes all the way down!","Fly with a double-tap!","Lava + water = obsidian!","Press F3 for numbers!","Square sun, square moon!","Forged in TypeScript!","Sixty frames, hopefully!","Snowy peaks!","Built for Chromebooks!","Plant a flower!","Glass panes connect!","Pixel perfect!","Hello, builder!","Fancy leaves!","Stairs face you!","Try a sunset!","Shift-click to the hotbar!","Seeds can be words!","Watch the clouds!"],em=["Double-tap Space to start or stop flying.","Middle-click a block to put it in your hotbar.","Press E for the creative inventory. Type to search.","Double-tap W to sprint without touching Ctrl.","Press F1 to hide the HUD for screenshots, F2 to take one.","Press F3 to see coordinates, chunk and GPU info.","Shift-click an item to send it to your hotbar.","Pick a time of day from the pause menu.","Worlds are saved in this browser automatically.","Low graphics runs best on school laptops and Chromebooks."],a_={cycle:"Day Cycle",sunrise:"Sunrise",noon:"Noon",sunset:"Sunset",midnight:"Midnight"},su=["cycle","sunrise","noon","sunset","midnight"],l_={low:"Low",medium:"Medium",high:"High",custom:"Custom"},c_=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];function h_(i){if(!i)return"never";let t=new Date(i),e=new Date,n=`${String(t.getHours()).padStart(2,"0")}:${String(t.getMinutes()).padStart(2,"0")}`,s=a=>new Date(a.getFullYear(),a.getMonth(),a.getDate()).getTime(),r=Math.round((s(e)-s(t))/864e5);return r===0?`today, ${n}`:r===1?`yesterday, ${n}`:`${t.getDate()} ${c_[t.getMonth()]} ${t.getFullYear()}, ${n}`}function u_(){try{return matchMedia("(pointer: coarse)").matches&&!matchMedia("(any-pointer: fine)").matches&&(navigator.maxTouchPoints||0)>0}catch{return!1}}var nm=[["Movement",[["Walk forward / back","W / S"],["Strafe left / right","A / D"],["Jump, fly up","Space"],["Toggle flying","Space x2"],["Sneak, fly down","Shift"],["Sprint","Ctrl or W x2"]]],["Building",[["Break block (hold)","Left Click"],["Place block, open door","Right Click"],["Pick block","Middle Click"],["Choose hotbar slot","1 to 9"],["Next / previous slot","Mouse Wheel"]]],["Inventory",[["Creative inventory","E"],["Hovered item to slot","1 to 9"],["Item to hotbar","Shift+Click"],["Clear hotbar slot","Right Click"],["Search blocks","T"],["Close","E or Esc"]]],["Interface",[["Pause menu","Esc"],["Hide HUD","F1"],["Screenshot","F2"],["Debug screen","F3"]]]],im=[["Move (push far to sprint)","Left stick"],["Look around","Drag right"],["Jump, x2 to fly","Jump"],["Sneak, fly down","Sneak"],["Break block (hold)","Break"],["Place block, use","Place"],["Pick block","Pick"],["Change slot","Tap hotbar"],["Inventory","Grid button"],["Pause","Pause button"]],xl=class{constructor(t,e,n){this.handlers=e;this.settings=n;this.screens=new Map;this.cur=null;this.optionsBack=()=>{};this.overGame=!1;this.controlsBack=()=>{};this.tipTimer=0;this.settingsUI=null;this.worlds=[];this.selected=null;this.confirmDelete=null;this.busy=!1;this.loadingState={text:"",progress:-2};this.root=Ut("bf-menus bf-full bf-font",t),this.buildTitle(),this.buildWorlds(),this.buildCreate(),this.buildOptions(),this.buildControls(),this.buildPause(),this.buildLoading(),this.tip=Ut("bf-tip",this.root),this.tip.style.position="absolute",this.root.addEventListener("pointerover",s=>this.onTipOver(s)),this.root.addEventListener("pointerdown",()=>this.hideTip()),gp(s=>{this.cur&&this.screens.get(this.cur).layout(s)})}showTitle(){this.show("title")}showWorlds(){this.confirmDelete=null,this.show("worlds"),this.reloadWorlds()}showPause(){this.busy=!1,this.show("pause")}showOptions(t){this.optionsBack=t,this.screens.get("options").setBg(this.overGame?"bf-pause-bg":"bf-dirt"),this.show("options")}showControls(t){this.controlsBack=t,this.screens.get("controls").setBg(this.overGame?"bf-pause-bg":"bf-dirt"),this.show("controls")}showLoading(t,e){let n=e===void 0?-1:Math.max(0,Math.min(1,e));this.cur!=="loading"&&(this.loadingState={text:"",progress:-2},this.pickHint(),this.show("loading")),this.updateLoading(t,n)}hide(){this.cur&&(this.screens.get(this.cur).root.style.display="none"),this.cur=null,this.root.classList.remove("bf-open"),this.hideTip()}isOpen(){return this.cur!==null}current(){return this.cur}back(){switch(this.cur){case"options":na(this.settings),this.optionsBack();break;case"controls":this.controlsBack();break;case"create":this.showWorlds();break;case"worlds":this.confirmDelete?(this.confirmDelete=null,this.renderWorlds()):this.showTitle();break;case"pause":this.handlers.resume();break;default:break}}show(t){t==="pause"?this.overGame=!0:t!=="options"&&t!=="controls"&&(this.overGame=!1);let e=this.cur;e&&e!==t&&(this.screens.get(e).root.style.display="none");let n=this.screens.get(t);this.cur=t,this.root.classList.add("bf-open"),n.root.style.display="",this.hideTip(),n.layout(Rn()),document.activeElement instanceof HTMLElement&&this.root.contains(document.activeElement)&&document.activeElement.blur();let s=n.onShow;s&&s()}add(t,e){let n=new ru(this.root,t,e);return this.screens.set(t,n),n}onTipOver(t){let e=t.target.closest("[data-tip]");clearTimeout(this.tipTimer),this.tip.classList.remove("bf-on"),!(!e||t.pointerType!=="mouse")&&(this.tipTimer=window.setTimeout(()=>{if(!e.isConnected||!this.cur)return;let n=Rn();this.tip.textContent="";for(let c of iu(e.dataset.tip,200))Ut("",this.tip,c);this.tip.classList.add("bf-on");let s=e.getBoundingClientRect(),r=Math.ceil(this.tip.offsetWidth/n.u),a=Math.ceil(this.tip.offsetHeight/n.u),o=Math.floor(s.left/n.u),l=Math.floor(s.bottom/n.u)+4;o+r>n.gw-4&&(o=n.gw-4-r),l+a>n.gh-4&&(l=Math.floor(s.top/n.u)-a-4),zt(this.tip,Math.max(4,o),Math.max(4,l))},550))}hideTip(){clearTimeout(this.tipTimer),this.tip.classList.remove("bf-on")}buildTitle(){let t=this.add("title","bf-dirt"),e=Ut("bf-pano",t.bg);Ut("bf-vignette",t.bg);let n=sr("img","bf-logo",t.gui);n.alt="BlockForge",n.draggable=!1;let s=Ut("bf-splash bf-font",t.gui),r=Ie(t.gui,"Singleplayer",200,()=>this.showWorlds(),"Create a world or continue one you have played before."),a=this.handlers.offlineDownloadUrl?t_(t.gui,"Download offline version",200,this.handlers.offlineDownloadUrl):null;a&&(a.el.dataset.tip="One HTML file that plays without internet. Handy when a school network blocks the site.");let o=Ie(t.gui,"Options...",98,()=>this.showOptions(()=>this.showTitle())),l=Ie(t.gui,"Controls",98,()=>this.showControls(()=>this.showTitle())),c=Ut("bf-abs",t.gui,`BlockForge ${this.handlers.version}`),h=Ut("bf-abs bf-right",t.gui,"An original game. Every pixel made in code."),u=u_()?Ut("bf-h1 bf-c-yellow",t.gui):null;u&&(u.textContent=Ke("On a touchscreen? Turn on Touch in Options.",0));let f="";t.layout=d=>{let g=o_();if(g){let v=window.innerHeight,w=ei*v/ir;e.style.backgroundImage=`url(${g})`,e.style.backgroundSize=`${w}px ${v}px`,e.style.width=`${Math.ceil(window.innerWidth+w)+2}px`,e.style.setProperty("--pano-w",`${-w}px`),e.style.animationDuration=`${Math.round(w/12)}s`}let b=r_();b&&n.src!==b&&(n.src=b);let p=Math.round(Ze/2),m=Math.round(ki/2);zt(n,d.cx-(p>>1),28,p,m),f||(f=_l[Math.floor(Math.random()*_l.length)]),s.textContent=f,zt(s,d.cx+104,28+m-2),s.style.setProperty("--ss",String(Math.min(1.8,1.8*100/(tr(f)+32))));let _=d.qh+48;zt(r.el,d.cx-100,_);let y=_+24;a&&(zt(a.el,d.cx-100,y),y+=24),y+=12,zt(o.el,d.cx-100,y),zt(l.el,d.cx+2,y),zt(c,2,d.gh-10),zt(h,d.gw-2-tr(h.textContent),d.gh-10),u&&(u.style.top=oe(Math.min(d.gh-24,y+30)))},t.onShow=()=>{f=_l[Math.floor(Math.random()*_l.length)],t.layout(Rn())}}buildWorlds(){let t=this.add("worlds","bf-dirt"),e=qi(t.gui,"Select World",8),n=new da(t.gui,!0),s=Ut("bf-h1 bf-c-gray",n.inner),r=Ie(t.gui,"Play Selected World",150,()=>this.playSelected()),a=Ie(t.gui,"Create New World",150,()=>this.showCreate()),o=Ie(t.gui,"Delete",150,()=>{let d=this.worlds.find(g=>g.id===this.selected);d&&(this.confirmDelete=d,this.renderWorlds())}),l=Ie(t.gui,"Back",150,()=>this.showTitle()),c=Ut("bf-abs",t.gui);c.style.inset="0";let h=Ut("bf-abs",c);h.style.inset="0";let u=Ie(c,"Delete",150,()=>void this.deleteConfirmed()),f=Ie(c,"Cancel",150,()=>{this.confirmDelete=null,this.renderWorlds()});this.worldsUI={list:n,title:e,empty:s,play:r,create:a,del:o,back:l,confirm:c,confirmLines:h,yes:u,no:f,rows:[]},t.layout=d=>{n.place(d,32,d.gh-64-32,d.cx+140),zt(r.el,d.cx-154,d.gh-52),zt(a.el,d.cx+4,d.gh-52),zt(o.el,d.cx-154,d.gh-28),zt(l.el,d.cx+4,d.gh-28),zt(u.el,d.cx-154,d.cy+24),zt(f.el,d.cx+4,d.cy+24),this.renderWorlds()},n.el.addEventListener("keydown",d=>{var g;if(d.key==="Enter")d.preventDefault(),this.playSelected();else if(d.key==="Delete"&&this.selected)d.preventDefault(),o.el.click();else if(d.key==="ArrowDown"||d.key==="ArrowUp"){d.preventDefault();let b=this.worlds.findIndex(m=>m.id===this.selected),p=Math.max(0,Math.min(this.worlds.length-1,b+(d.key==="ArrowDown"?1:-1)));this.worlds[p]&&(this.selected=this.worlds[p].id,this.renderWorlds(),(g=this.worldsUI.rows[p])==null||g.focus({preventScroll:!0}))}})}async reloadWorlds(){var t,e;this.worlds=[],this.worldsUI.empty.textContent=Ke("Loading worlds...",0),this.renderWorlds(!1);try{this.worlds=await this.handlers.listWorlds()}catch(n){console.warn("[menus] listWorlds failed",n),this.worlds=[],this.worldsUI.empty.textContent=Ke("Could not read saved worlds in this browser.",0),this.renderWorlds(!1);return}this.worlds.sort((n,s)=>(s.lastPlayed||0)-(n.lastPlayed||0)),this.worlds.some(n=>n.id===this.selected)||(this.selected=(e=(t=this.worlds[0])==null?void 0:t.id)!=null?e:null),this.worldsUI.empty.textContent=Ke("No worlds yet. Create one to start building!",0),this.cur==="worlds"&&this.renderWorlds()}renderWorlds(t=!0){let e=this.worldsUI,n=Rn(),s=!!this.confirmDelete;e.confirm.style.display=s?"":"none";for(let r of[e.list.el,e.play.el,e.create.el,e.del.el,e.back.el,e.title])r.style.display=s?"none":"";if(s){let r=this.confirmDelete;e.confirmLines.textContent="";let a=n.cy-40;qi(e.confirmLines,"Delete this world?",a),a+=20;for(let o of iu(`"${ca(r.name,200)}" and everything built in it will be gone for good.`,300))qi(e.confirmLines,o,a,"bf-c-gray"),a+=10;e.yes.el.classList.add("bf-c-red");return}for(let r of e.rows)r.remove();e.rows=[],e.empty.style.display=(this.worlds.length||!t)&&this.worlds.length?"none":"",e.empty.style.top=oe(12),this.worlds.forEach((r,a)=>{let o=Ut("bf-row",e.list.inner);o.tabIndex=0,o.dataset.y=String(4+a*36),o.dataset.h="36",zt(o,n.cx-135,4+a*36,270,36),o.classList.toggle("bf-sel",r.id===this.selected);let l=sr("img","bf-thumbimg",o);l.src=i_(r.seed),l.alt="",l.draggable=!1,Ut("bf-play",o).addEventListener("click",d=>{d.stopPropagation(),this.selected=r.id,this.playSelected()});let h=Ut("bf-abs",o,ca(r.name||"World",228));zt(h,35,0);let u=Ut("bf-abs bf-c-gray",o,ca(`Last played ${h_(r.lastPlayed)}`,228));zt(u,35,11);let f=Ut("bf-abs bf-c-gray",o,ca(`Creative mode, seed ${r.seed}`,228));zt(f,35,22),o.addEventListener("click",()=>{if(this.selected!==r.id){this.selected=r.id;for(let d of e.rows)d.classList.toggle("bf-sel",d===o);this.updateWorldButtons()}}),o.addEventListener("dblclick",()=>{this.selected=r.id,this.playSelected()}),e.rows.push(o)}),e.list.setContent(this.worlds.length*36+8),this.updateWorldButtons()}updateWorldButtons(){let t=!!this.selected&&this.worlds.some(e=>e.id===this.selected);this.worldsUI.play.enable(t&&!this.busy),this.worldsUI.del.enable(t&&!this.busy),this.worldsUI.create.enable(!this.busy)}playSelected(){let t=this.selected;!t||this.busy||(this.busy=!0,this.updateWorldButtons(),this.handlers.playWorld(t).catch(e=>{console.warn("[menus] playWorld failed",e),this.showWorlds()}).finally(()=>{this.busy=!1}))}async deleteConfirmed(){let t=this.confirmDelete;if(t){this.worldsUI.yes.enable(!1);try{await this.handlers.deleteWorld(t.id)}catch(e){console.warn("[menus] deleteWorld failed",e)}this.worldsUI.yes.enable(!0),this.confirmDelete=null,this.selected===t.id&&(this.selected=null),await this.reloadWorlds(),this.renderWorlds()}}showCreate(){this.createUI.name.value="New World",this.createUI.seed.value="",this.createUI.go.enable(!0),this.show("create"),this.createUI.name.focus({preventScroll:!0}),this.createUI.name.select()}buildCreate(){let t=this.add("create","bf-dirt");qi(t.gui,"Create New World",20);let e=Ut("bf-label",t.gui,"World Name"),n=sr("input","bf-field",t.gui);n.type="text",n.maxLength=32,n.spellcheck=!1,n.autocomplete="off";let s=Ut("bf-label",t.gui,"Seed for the world generator"),r=sr("input","bf-field",t.gui);r.type="text",r.maxLength=64,r.spellcheck=!1,r.autocomplete="off",r.placeholder="Leave blank for a random seed";let a=Ut("bf-label",t.gui,"Numbers and words both work."),o=Ie(t.gui,"Game Mode: Creative",200,()=>{},"Unlimited blocks, flying and instant breaking. The only mode in BlockForge.");o.el.classList.add("bf-off");let l=Ut("bf-label",t.gui),c=Ie(t.gui,"Create New World",150,()=>void this.doCreate()),h=Ie(t.gui,"Cancel",150,()=>this.showWorlds());this.createUI={name:n,seed:r,go:c};for(let u of[n,r])u.addEventListener("keydown",f=>{f.key==="Enter"?(f.preventDefault(),this.doCreate()):f.key!=="Escape"&&f.stopPropagation()});t.layout=u=>{let f=Math.max(36,Math.min(60,u.qh));zt(e,u.cx-100,f-13),zt(n,u.cx-100,f),zt(s,u.cx-100,f+31),zt(r,u.cx-100,f+44),zt(a,u.cx-100,f+67),zt(o.el,u.cx-100,f+84),l.textContent="",zt(l,u.cx-100,f+107),zt(c.el,u.cx-154,u.gh-28),zt(h.el,u.cx+4,u.gh-28)}}async doCreate(){if(this.busy)return;this.busy=!0,this.createUI.go.enable(!1);let t=this.createUI.name.value.trim()||"New World";try{await this.handlers.createWorld(t,this.createUI.seed.value)}catch(e){console.warn("[menus] createWorld failed",e),this.showWorlds()}finally{this.busy=!1,this.createUI.go.enable(!0)}}buildOptions(){let t=this.add("options","bf-dirt"),e=qi(t.gui,"Options",13),n=new da(t.gui,!1),s=Ie(t.gui,"Done",200,()=>this.back()),r=this.settings,a=["renderDistance","fancyLeaves","smoothLighting","shadows","shadowQuality","waving","clouds","resolutionScale","mipmaps"],o=v=>{v&&a.includes(v)&&(r.preset="custom"),na(r);try{this.handlers.settingsChanged(r)}catch(w){console.warn("[menus] settingsChanged failed",w)}v==="guiScale"&&ra(r.guiScale),u()},l=v=>v?"ON":"OFF",c=[],h=[],u=()=>{for(let v of h)v()},f=150,d=(v,w,S,A)=>{let L=Ie(n.inner,"",f,()=>{r[w]=!r[w],A==null||A(),o(w)},S);return h.push(()=>L.set(`${v}: ${l(!!r[w])}`)),L.el},g=(v,w,S,A,L,P,M,T)=>{let I=Ie(n.inner,"",f,()=>{let F=w.indexOf(S());A(w[(F+1)%w.length]),o(P)},M);return h.push(()=>{I.set(`${v}: ${L(S())}`),T&&I.enable(T())}),I.el},b=(v,w,S,A,L,P,M=1)=>{let T=e_(n.inner,f,w,S,A,()=>Math.round(r[v]*M/A)*A,I=>{r[v]=I/M,o(v)},L,P);return h.push(T.refresh),T.el},p=(v,w)=>c.push({kind:"pair",a:v,b:w}),m=v=>c.push({kind:"header",text:v});m("Graphics"),p(g("Graphics",["low","medium","high"],()=>r.preset,v=>sl(r,v),v=>l_[v],"preset","Low runs at 60 fps on most school laptops. Medium adds see-through leaves and waving plants, High adds sun shadows."),b("renderDistance",2,12,1,v=>`Render Distance: ${v} chunks`,"How far you can see. Lower is faster.")),p(b("fov",50,110,1,v=>`FOV: ${v===70?"Normal":v}`,"Field of view in degrees."),b("brightness",0,100,1,v=>`Brightness: ${v===0?"Moody":v===100?"Bright":v+"%"}`,"Lifts dark caves and nights.",100)),p(d("Smooth Lighting","smoothLighting","Soft light and shadows in corners (ambient occlusion)."),d("Fancy Leaves","fancyLeaves","See-through leaves. Off draws solid leaves, which is faster.")),p(d("Shadows","shadows","Real-time sun shadows. Needs a strong graphics chip."),g("Shadow Quality",[1024,2048],()=>r.shadowQuality,v=>{r.shadowQuality=v},v=>v===2048?"High":"Normal","shadowQuality","Sharper shadows cost more graphics memory.",()=>r.shadows)),p(d("Waving Plants","waving","Grass, leaves and water move in the wind."),d("Clouds","clouds","Blocky clouds drifting overhead.")),p(d("Mipmaps","mipmaps","Smooths distant textures and stops shimmering."),b("resolutionScale",50,100,5,v=>`Resolution: ${v}%`,"Renders fewer pixels and scales up. Lower is faster.",100)),p(d("View Bobbing","viewBobbing","The camera bobs while you walk."),b("maxFps",0,240,10,v=>`Max Framerate: ${v===0?"VSync":v+" fps"}`,"Cap the frame rate to save battery. VSync follows the screen.")),m("Controls"),p(g("Controls",["keyboard","touch"],()=>r.controls,v=>{r.controls=v},v=>v==="touch"?"Touch":"Keyboard & Mouse","controls","Touch shows on-screen sticks and buttons for phones and tablets."),b("sensitivity",10,200,5,v=>`Sensitivity: ${v}%`,"Mouse look speed.",100)),p(d("Invert Mouse","invertY","Moving the mouse up looks down."),d("Fullscreen on Play","fullscreen","Go fullscreen when a world starts. In fullscreen the game can keep Ctrl+W from closing the tab.")),p(b("touchSensitivity",25,300,5,v=>`Touch Look: ${v}%`,"How fast dragging turns the camera.",100),b("touchButtonScale",75,150,5,v=>`Touch Buttons: ${v}%`,"Size of the on-screen buttons.",100));let _=Ie(n.inner,"Key Bindings...",f,()=>this.showControls(()=>this.showOptions(this.optionsBack)),"Every key and mouse button.");p(_.el,null),m("Interface and Sound"),p(g("GUI Scale",[2,3,4],()=>r.guiScale,v=>{r.guiScale=v},v=>{let w=Rn(),S=Math.round(w.uDev/w.dpr);return S<v?`${v} (fits ${S})`:String(v)},"guiScale","Size of menus and the HUD. Small screens use the largest size that fits."),d("Show FPS","showFps","Frames per second in the corner (F3 shows more).")),p(b("volume",0,100,1,v=>`Volume: ${v===0?"OFF":v+"%"}`,"Sound effects volume.",100),null);let y=[];for(let v of c)if(v.kind==="header"){let w=Ut("bf-h1 bf-c-yellow",n.inner);w.textContent=Ke(v.text,0),y.push(w)}this.settingsUI={refresh:u},u(),t.layout=v=>{n.place(v,32,v.gh-64,v.cx+160);let w=4,S=0;for(let A of c)if(A.kind==="header"){let L=y[S++];L.style.top=oe(w+5),w+=18}else A.a&&(zt(A.a,v.cx-155,w),A.a.dataset.y=String(w)),A.b&&(zt(A.b,v.cx+5,w),A.b.dataset.y=String(w)),w+=24;n.setContent(w+4),zt(s.el,v.cx-100,v.gh-26),u()},t.onShow=()=>{n.scrollTo(0),u()}}buildControls(){let t=this.add("controls","bf-dirt");qi(t.gui,"Controls",13);let e=new da(t.gui,!1),n=Ie(t.gui,"Done",200,()=>this.back()),s=Ut("bf-abs",e.inner);s.style.left="0",s.style.right="0",t.layout=r=>{e.place(r,32,r.gh-64,r.cx+160),s.textContent="";let a=4,o=this.settings.controls==="touch"?[["Touch controls",im],...nm]:[...nm,["Touch controls",im]];for(let[l,c]of o){let h=Ut("bf-h1 bf-c-yellow",s);h.textContent=Ke(l,0),h.style.top=oe(a+5),a+=18;for(let[u,f]of c){let d=Ut("bf-abs",s,ca(u,200));zt(d,r.cx-155,a+5);let g=Ut("bf-keycap",s);g.textContent=Ke(f,90),zt(g,r.cx+65,a,90,20),a+=22}a+=4}e.setContent(a+4),zt(n.el,r.cx-100,r.gh-26)},t.onShow=()=>e.scrollTo(0)}buildPause(){let t=this.add("pause","bf-pause-bg"),e=qi(t.gui,"Game Menu",40),n=Ie(t.gui,"Back to Game",204,()=>this.handlers.resume()),s=Ie(t.gui,"Options...",98,()=>this.showOptions(()=>this.showPause())),r=Ie(t.gui,"Controls",98,()=>this.showControls(()=>this.showPause())),a=Ie(t.gui,"",204,()=>{let h=this.handlers.getTimeMode();this.handlers.setTimeMode(su[(su.indexOf(h)+1)%su.length]),c()},"Keep the sun moving, or stop the clock at a time you like."),o=Ie(t.gui,"Save and Quit to Title",204,()=>{this.busy||(this.busy=!0,o.enable(!1),this.handlers.saveAndQuit().catch(h=>{console.warn("[menus] saveAndQuit failed",h),this.showTitle()}).finally(()=>{this.busy=!1,o.enable(!0)}))}),l=Ut("bf-abs",t.gui);l.style.left="0";let c=()=>{var h;return a.set(`Time of Day: ${(h=a_[this.handlers.getTimeMode()])!=null?h:"Day Cycle"}`)};t.layout=h=>{let u=Math.max(56,h.qh+8);e.style.top=oe(Math.min(40,u-22)-1),zt(n.el,h.cx-102,u),zt(s.el,h.cx-102,u+24),zt(r.el,h.cx+4,u+24),zt(a.el,h.cx-102,u+48),zt(o.el,h.cx-102,u+84),l.textContent="";let f=u+118,d=iu("Ctrl+W closes the tab in browsers: sprint with a double-tap of W, or turn on Fullscreen on Play in Options.",Math.min(300,h.gw-20));qi(l,"Tip",f,"bf-c-yellow"),f+=11;for(let g of d)qi(l,g,f,"bf-c-gray"),f+=10;c()},t.onShow=()=>{o.enable(!0),c()}}buildLoading(){let t=this.add("loading","bf-dirt"),e=Ut("bf-h1",t.gui),n=Ut("bf-progress",t.gui),s=Ut("bf-fill",n),r=Ut("bf-h1 bf-c-gray",t.gui),a=Ut("bf-h1 bf-c-gray",t.gui);this.loadingUI={text:e,bar:n,fill:s,pct:r,hint:a},t.layout=o=>{e.style.top=oe(o.cy-26),zt(n,o.cx-101,o.cy-6,202,10),r.style.top=oe(o.cy+10),a.style.top=oe(o.gh-24)}}pickHint(){let t=em[Math.floor(Math.random()*em.length)];this.loadingUI.hint.textContent=Ke(t,0)}updateLoading(t,e){let n=this.loadingUI,s=this.loadingState;if(t!==s.text&&(s.text=t,n.text.textContent=Ke(t,0)),e!==s.progress){s.progress=e;let r=e>=0;n.bar.style.display=r?"":"none",n.pct.style.display=r?"":"none",r&&(n.fill.style.width=oe(Math.round(e*198)),n.pct.textContent=Ke(`${Math.round(e*100)}%`,0))}}};var d_=2,sm=10,f_=10;function hn(i,t){let e=document.createElement("div");return e.className=i,t&&t.appendChild(e),e}var wl=class{constructor(t,e,n){this.icons=e;this.hotbar=n;this.slotIcons=[];this.slotIds=[];this.nameTime=0;this.nameOpacity=-1;this.msgs=[];this.debugLines=[[],[]];this._debugVisible=!1;this.visible=!0;this.water=hn("bf-water",t),this.cross=hn("bf-cross",t),this.el=hn("bf-gui bf-hud bf-font",t),this.hotbarEl=hn("bf-hotbar",this.el);for(let s=0;s<9;s++){let r=hn("bf-hslot",this.hotbarEl);r.style.left=oe(1+s*20),r.dataset.slot=String(s);let a=hn("bf-icon",r);this.slotIcons.push(a),this.slotIds.push(-1);let o=hn("bf-num",r);o.textContent=String.fromCharCode(57345+s),r.addEventListener("pointerdown",l=>{l.preventDefault(),l.stopPropagation(),this.hotbar.select(s)})}this.sel=hn("bf-hsel",this.hotbarEl),this.nameEl=hn("bf-itemname",this.el),this.chat=hn("bf-chat",this.el),this.debugEl=hn("bf-debug",this.el),this.debugCols=[hn("bf-col",this.debugEl),hn("bf-col bf-r",this.debugEl)],this.fpsEl=hn("bf-fps",this.el),n.onChange(()=>this.refreshHotbar()),this.refreshHotbar()}get debugVisible(){return this._debugVisible}refreshHotbar(){var t;for(let e=0;e<9;e++){let n=(t=this.hotbar.slots[e])!=null?t:0;this.slotIds[e]!==n&&(this.slotIds[e]=n,this.icons.apply(this.slotIcons[e],n))}this.sel.style.left=oe(-1+this.hotbar.selected*20)}setVisible(t){this.visible=t,this.el.classList.toggle("bf-hidden",!t),this.cross.classList.toggle("bf-hidden",!t)}update(t){if(this.nameTime>0){this.nameTime=Math.max(0,this.nameTime-t);let e=Math.min(1,this.nameTime/.5),n=Math.round(e*20)/20;n!==this.nameOpacity&&(this.nameOpacity=n,this.nameEl.style.opacity=String(n))}for(let e=this.msgs.length-1;e>=0;e--){let n=this.msgs[e];n.age+=t;let s=Math.max(0,Math.min(1,sm-n.age)),r=Math.round(s*20)/20;r!==n.opacity&&(n.opacity=r,n.el.style.opacity=String(r)),n.age>=sm&&(n.el.remove(),this.msgs.splice(e,1))}}showItemName(t){if(!t){this.nameTime=0,this.nameOpacity=0,this.nameEl.style.opacity="0";return}this.nameEl.textContent=Ke(t,p_()),this.nameTime=d_,this.nameOpacity=1,this.nameEl.style.opacity="1"}message(t){let e=hn("bf-msg");for(e.textContent=t,this.chat.appendChild(e),this.msgs.push({el:e,age:0,opacity:1});this.msgs.length>f_;)this.msgs.shift().el.remove()}setDebugVisible(t){this._debugVisible=t,this.debugEl.classList.toggle("bf-on",t),t&&this.setFps(null)}setDebug(t,e){this.fillColumn(0,t),this.fillColumn(1,e)}fillColumn(t,e){let n=this.debugCols[t],s=this.debugLines[t];for(;s.length<e.length;){let r=hn("bf-line",n);r.appendChild(document.createElement("span")),s.push(r)}for(;s.length>e.length;)s.pop().remove();for(let r=0;r<e.length;r++){let a=s[r].firstChild,o=e[r];a.textContent!==o&&(a.textContent=o,a.style.display=o?"":"none")}}setFps(t){t&&!this._debugVisible?(this.fpsEl.textContent!==t&&(this.fpsEl.textContent=t),this.fpsEl.classList.add("bf-on")):this.fpsEl.classList.remove("bf-on")}setUnderwaterTint(t){this.water.classList.contains("bf-on")!==t&&this.water.classList.toggle("bf-on",t)}get isVisible(){return this.visible}};function p_(){return 0}var fa=5,Ri=9,rm=8,m_=17,g_=111,om=95,Li=[{key:"building",title:"Building Blocks",tip:"Building",icon:_t.bricks},{key:"colored",title:"Coloured Blocks",tip:"Coloured",icon:_t.cyan_wool},{key:"natural",title:"Natural Blocks",tip:"Natural",icon:_t.grass_block},{key:"ores",title:"Ores & Minerals",tip:"Ores & Minerals",icon:_t.diamond_ore},{key:"wood",title:"Wood",tip:"Wood",icon:_t.oak_log},{key:"light",title:"Lighting",tip:"Lighting",icon:_t.lantern},{key:"decor",title:"Decoration",tip:"Decoration",icon:_t.poppy},{key:"fluids",title:"Fluids",tip:"Fluids",icon:_t.water},{key:"search",title:"Search Items",tip:"Search",icon:ml.search}],b_=[[0,-28,!1],[29,-28,!1],[58,-28,!1],[87,-28,!1],[116,-28,!1],[0,132,!0],[29,132,!0],[58,132,!0],[167,-28,!1]],y_={building:"Building",colored:"Coloured",natural:"Natural",ores:"Ores & Minerals",wood:"Wood",light:"Lighting",decor:"Decoration",fluids:"Fluids"},au=[],lu=new Map;for(let i=1;i<vt;i++){if(!qr(i))continue;au.push(i);let t=Le[i].cat,e=lu.get(t);e||(e=[],lu.set(t,e)),e.push(i)}var __=Le.map(i=>i.display.toLowerCase());function am(i){let t=i.toLowerCase().trim().split(/\s+/).filter(Boolean);return t.length?au.filter(e=>t.every(n=>__[e].includes(n))):au.slice()}function sn(i,t){let e=document.createElement("div");return e.className=i,t&&t.appendChild(e),e}var Ml=class{constructor(t,e,n){this.icons=e;this.hotbar=n;this.onClose=null;this._open=!1;this.tabEls=[];this.gridSlots=[];this.gridIcons=[];this.gridIds=[];this.barSlots=[];this.barIcons=[];this.barIds=[];this.tab=0;this.scroll=0;this.items=[];this.query="";this.held=0;this.hover=null;this.hoverEl=null;this.drag=null;this.thumbDrag=null;this.mouse={x:-100,y:-100};this.wheelAcc=0;this.tipTarget=null;this.hoverTab=-1;this.root=sn("bf-inv-root bf-full bf-dim bf-font",t),this.gui=sn("bf-gui",this.root),this.panel=sn("bf-inv-panel",this.gui),Li.forEach((r,a)=>{let[o,l,c]=b_[a],h=sn("bf-tab"+(c?" bf-bottom":""),this.panel);h.style.left=oe(o),h.style.top=oe(l),h.dataset.k="t"+a;let u=sn("bf-icon",h);e.apply(u,r.icon),this.tabEls.push(h)}),sn("bf-inv-bg",this.panel),this.titleEl=sn("bf-inv-title bf-c-dark",this.panel),this.search=document.createElement("input"),this.search.className="bf-inv-search",this.search.type="text",this.search.spellcheck=!1,this.search.autocomplete="off",this.search.maxLength=50,this.search.placeholder="Search...",this.search.setAttribute("aria-label","Search items"),this.panel.appendChild(this.search),this.search.addEventListener("input",()=>this.setQuery(this.search.value)),this.search.addEventListener("keydown",r=>{r.key!=="Escape"&&!/^(Digit|Numpad)[1-9]$/.test(r.code)&&r.stopPropagation()});for(let r=0;r<fa;r++)for(let a=0;a<Ri;a++){let o=r*Ri+a,l=sn("bf-slot",this.panel);l.style.left=oe(rm+a*18),l.style.top=oe(m_+r*18),l.dataset.k="g"+o,this.gridSlots.push(l),this.gridIcons.push(sn("bf-icon",l)),this.gridIds.push(-1)}for(let r=0;r<Ri;r++){let a=sn("bf-slot",this.panel);a.style.left=oe(rm+r*18),a.style.top=oe(g_),a.dataset.k="h"+r,this.barSlots.push(a),this.barIcons.push(sn("bf-icon",a)),this.barIds.push(-1)}this.emptyEl=sn("bf-inv-empty bf-c-dark",this.panel),this.emptyEl.textContent="No blocks match",this.track=sn("bf-inv-track",this.panel),this.track.dataset.k="track",this.thumb=sn("bf-inv-thumb",this.track);let s=sn("bf-inv-close",this.panel);s.dataset.k="close",s.textContent="X",s.setAttribute("aria-label","Close inventory"),this.tip=sn("bf-tip",this.gui),this.heldEl=sn("bf-held",this.gui),this.root.addEventListener("pointerdown",r=>this.onDown(r)),this.root.addEventListener("pointermove",r=>this.onMove(r)),this.root.addEventListener("pointerup",r=>this.onUp(r)),this.root.addEventListener("pointercancel",()=>{this.drag=null,this.thumbDrag=null}),this.root.addEventListener("pointerleave",()=>{this.setHover(null,null)}),this.root.addEventListener("contextmenu",r=>r.preventDefault()),this.root.addEventListener("wheel",r=>this.onWheel(r),{passive:!1}),this.root.addEventListener("dragstart",r=>r.preventDefault()),n.onChange(()=>{this._open&&this.renderHotbar()}),this.selectTab(0)}get isOpen(){return this._open}open(){this._open||(this._open=!0,this.held=0,this.drag=null,this.root.classList.add("bf-open"),this.renderAll(),Li[this.tab].key==="search"&&this.focusSearch())}close(){var t;this._open&&(this._open=!1,this.held=0,this.drag=null,this.thumbDrag=null,this.setHover(null,null),this.search.blur(),this.root.classList.remove("bf-open"),this.renderHeld(),(t=this.onClose)==null||t.call(this))}toggle(){this._open?this.close():this.open()}handleKey(t){var n;if(!this._open)return!1;if(t==="Escape")return this.close(),!0;let e=/^(?:Digit|Numpad)([1-9])$/.exec(t);if(e&&this.hover){let s=Number(e[1])-1;if(this.hover.kind==="grid"){let r=(n=this.items[this.scroll*Ri+this.hover.index])!=null?n:0;r&&this.hotbar.set(s,r)}else if(this.hover.index!==s){let r=this.hotbar.slots[this.hover.index],a=this.hotbar.slots[s];this.hotbar.set(s,r),this.hotbar.set(this.hover.index,a)}return this.updateTooltip(),!0}return document.activeElement===this.search?!1:t==="KeyE"?(this.close(),!0):t==="KeyT"||t==="Slash"||t==="KeyF"?(this.selectTab(Li.length-1),this.focusSearch(),!0):Li[this.tab].key==="search"&&/^(Key[A-Z]|Digit\d|Space|Minus|Quote)$/.test(t)?(this.focusSearch(),!1):t==="ArrowDown"||t==="PageDown"?(this.setScroll(this.scroll+(t==="PageDown"?fa:1)),!0):t==="ArrowUp"||t==="PageUp"?(this.setScroll(this.scroll-(t==="PageUp"?fa:1)),!0):!1}get visibleItems(){return this.items.slice()}get heldItem(){return this.held}get currentTab(){return this.tab}selectTab(t){var s;t=Math.max(0,Math.min(Li.length-1,t)),this.tab=t;let e=Li[t];this.tabEls.forEach((r,a)=>r.classList.toggle("bf-sel",a===t)),this.titleEl.textContent=e.title;let n=e.key==="search";this.search.style.display=n?"":"none",this.items=n?am(this.query):((s=lu.get(e.key))!=null?s:[]).slice(),this.scroll=0,n?this._open&&this.focusSearch():document.activeElement===this.search&&this.search.blur(),this.renderGrid()}setQuery(t){if(this.query=t,this.search.value!==t&&(this.search.value=t),Li[this.tab].key!=="search"){this.selectTab(Li.length-1);return}this.items=am(t),this.scroll=0,this.renderGrid()}focusSearch(){this.search.style.display="";try{this.search.focus({preventScroll:!0})}catch{this.search.focus()}}maxScroll(){return Math.max(0,Math.ceil(this.items.length/Ri)-fa)}setScroll(t){let e=Math.max(0,Math.min(this.maxScroll(),Math.round(t)));e!==this.scroll&&(this.scroll=e,this.renderGrid(),this.updateTooltip())}renderAll(){this.renderGrid(),this.renderHotbar(),this.renderHeld()}renderGrid(){var n;let t=this.scroll*Ri;for(let s=0;s<fa*Ri;s++){let r=(n=this.items[t+s])!=null?n:0;this.gridIds[s]!==r&&(this.gridIds[s]=r,this.icons.apply(this.gridIcons[s],r))}let e=this.maxScroll();this.thumb.classList.toggle("bf-off",e===0),this.thumb.style.top=oe(e?Math.round(om*this.scroll/e):0),this.emptyEl.style.display=this.items.length?"none":""}renderHotbar(){var t;for(let e=0;e<Ri;e++){let n=(t=this.hotbar.slots[e])!=null?t:0;this.barIds[e]!==n&&(this.barIds[e]=n,this.icons.apply(this.barIcons[e],n))}}renderHeld(){this.held?(this.icons.apply(this.heldEl,this.held),this.heldEl.classList.add("bf-on"),this.placeHeld()):this.heldEl.classList.remove("bf-on"),this.updateTooltip()}placeHeld(){this.heldEl.style.left=oe(this.mouse.x-8),this.heldEl.style.top=oe(this.mouse.y-8)}setHover(t,e){this.hoverEl&&this.hoverEl!==e&&this.hoverEl.classList.remove("bf-hover"),this.hover=t,this.hoverEl=e,e&&t&&e.classList.add("bf-hover"),this.updateTooltip()}updateTooltip(){let t=null,e=null;if(!this.held&&!this.drag)if(this.hover){let l=this.slotId(this.hover);l&&(t=Le[l].display,e=y_[Le[l].cat])}else this.hoverTab>=0&&(t=Li[this.hoverTab].tip);if(!t){this.tip.classList.remove("bf-on"),this.tipTarget=null;return}let n=t+"|"+e;if(this.tipTarget!==n){this.tipTarget=n,this.tip.textContent="";let l=document.createElement("div");if(l.textContent=t,this.tip.appendChild(l),e){let c=document.createElement("div");c.className="bf-c-gray",c.textContent=e,this.tip.appendChild(c)}}this.tip.classList.add("bf-on");let s=Rn(),r=Math.ceil(this.tip.offsetWidth/s.u),a=this.mouse.x+12,o=this.mouse.y-12;a+r>s.gw-2&&(a=Math.max(2,this.mouse.x-16-r)),o=Math.max(2,Math.min(s.gh-26,o)),this.tip.style.left=oe(a),this.tip.style.top=oe(o)}slotId(t){var e,n;return t.kind==="grid"?(e=this.items[this.scroll*Ri+t.index])!=null?e:0:(n=this.hotbar.slots[t.index])!=null?n:0}toGui(t){let e=Rn().u;return{x:Math.floor(t.clientX/e),y:Math.floor(t.clientY/e)}}hit(t,e){let n=document.elementFromPoint(t,e);if(!n||!this.root.contains(n))return{k:"outside",el:null};let s=n.closest("[data-k]");return s&&this.root.contains(s)?{k:s.dataset.k,el:s}:n===this.search?{k:"search",el:n}:this.panel.contains(n)?{k:"panel",el:null}:{k:"outside",el:null}}trackHover(t,e){let{k:n,el:s}=this.hit(t,e);this.hoverTab=n[0]==="t"&&n!=="track"?Number(n.slice(1)):-1,n[0]==="g"?this.setHover({kind:"grid",index:Number(n.slice(1))},s):n[0]==="h"?this.setHover({kind:"hotbar",index:Number(n.slice(1))},s):this.setHover(null,null)}onDown(t){var a,o;if(!this._open)return;let e=this.toGui(t);this.mouse=e;let{k:n,el:s}=this.hit(t.clientX,t.clientY);if(n==="search")return;if(t.preventDefault(),n==="close"){this.close();return}if(document.activeElement===this.search&&Li[this.tab].key!=="search"&&this.search.blur(),n==="track"){this.thumbDrag=t.pointerId;try{this.root.setPointerCapture(t.pointerId)}catch{}this.scrollToPointer(e.y);return}if(n[0]==="t"){this.selectTab(Number(n.slice(1)));return}let r=t.button===2;if(!(t.button!==0&&!r)){if(n[0]==="g"){let l=Number(n.slice(1)),c=(a=this.items[this.scroll*Ri+l])!=null?a:0;if(t.shiftKey&&c){let h=this.hotbar.firstFree();this.hotbar.set(h>=0?h:this.hotbar.selected,c)}else c?this.held&&this.held!==c&&!r?this.held=c:(this.held=c,this.drag={from:"grid",index:l,id:c,x:t.clientX,y:t.clientY,moved:!1,pointer:t.pointerId}):this.held=0}else if(n[0]==="h"){let l=Number(n.slice(1)),c=(o=this.hotbar.slots[l])!=null?o:0;t.shiftKey||r?this.hotbar.set(l,0):this.held?(this.hotbar.set(l,this.held),this.held=c):c&&(this.hotbar.set(l,0),this.held=c,this.drag={from:"hotbar",index:l,id:c,x:t.clientX,y:t.clientY,moved:!1,pointer:t.pointerId})}else n==="outside"&&(this.held=0);if(this.drag)try{this.root.setPointerCapture(t.pointerId)}catch{}this.renderHeld(),s&&this.trackHover(t.clientX,t.clientY)}}onMove(t){if(this._open){if(this.mouse=this.toGui(t),this.thumbDrag===t.pointerId){this.scrollToPointer(this.mouse.y);return}if(this.drag&&t.pointerId===this.drag.pointer&&!this.drag.moved){let e=Rn().u;Math.hypot(t.clientX-this.drag.x,t.clientY-this.drag.y)>3*e&&(this.drag.moved=!0)}this.held&&this.placeHeld(),this.trackHover(t.clientX,t.clientY)}}onUp(t){var s;if(!this._open)return;if(this.thumbDrag===t.pointerId){this.thumbDrag=null;return}let e=this.drag;if(!e||e.pointer!==t.pointerId)return;if(this.drag=null,!e.moved){this.renderHeld();return}let{k:n}=this.hit(t.clientX,t.clientY);if(n[0]==="h"){let r=Number(n.slice(1));e.from==="hotbar"&&e.index!==r&&this.hotbar.set(e.index,(s=this.hotbar.slots[r])!=null?s:0),this.hotbar.set(r,e.id)}this.held=0,this.renderHeld(),this.trackHover(t.clientX,t.clientY)}onWheel(t){if(this._open)if(t.preventDefault(),t.deltaMode===0){this.wheelAcc+=t.deltaY;let e=Math.trunc(this.wheelAcc/50);e&&(this.wheelAcc-=e*50,this.setScroll(this.scroll+e))}else t.deltaY&&this.setScroll(this.scroll+Math.sign(t.deltaY))}scrollToPointer(t){let n=Rn().cy-68,s=(t-n-18-7)/om;this.setScroll(Math.max(0,Math.min(1,s))*this.maxScroll())}};var v_={jump:'<path d="M12 4l7 8h-4v7H9v-7H5z"/>',sneak:'<path d="M12 20l-7-8h4V5h6v7h4z"/>',fly:'<path d="M3 14c4-1 6-4 9-9 1 4 0 8-3 11 3 0 6-1 9-4-1 5-6 8-12 8z"/>',break:'<path d="M4 6c4-3 10-3 15 1l-2 2c-1-1-3-2-5-2l-7 13-2-1 6-13c-2 0-3 1-4 2z"/>',place:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9zM12 5.3L6.5 8.4 12 11.5l5.5-3.1zM6 10.2v5.2l5 2.8v-5.2zm12 0l-5 2.8v5.2l5-2.8z"/>',pick:'<path d="M17 3l4 4-3 3-1-1-7 7H7v-3l7-7-1-1zM5 19h3v2H3v-5h2z"/>',inventory:'<path d="M4 4h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 10h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4zM4 16h4v4H4zm6 0h4v4h-4zm6 0h4v4h-4z"/>',pause:'<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>',prev:'<path d="M15 4l-8 8 8 8z"/>',next:'<path d="M9 4l8 8-8 8z"/>'},x_=`
.bf-touch{position:fixed;inset:0;z-index:15;touch-action:none;user-select:none;-webkit-user-select:none;
  -webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;display:none;--s:1}
.bf-touch.on{display:block}
.bf-touch .bt{position:absolute;width:calc(var(--s)*clamp(48px,13vmin,84px));height:calc(var(--s)*clamp(48px,13vmin,84px));
  border-radius:18%;background:rgba(20,20,24,.42);border:2px solid rgba(255,255,255,.38);box-shadow:inset 0 -3px 0 rgba(0,0,0,.35);
  display:flex;align-items:center;justify-content:center;touch-action:none}
.bf-touch .bt svg{width:58%;height:58%;fill:rgba(255,255,255,.92);filter:drop-shadow(1px 1px 0 rgba(0,0,0,.6))}
.bf-touch .bt.down{background:rgba(255,255,255,.32);border-color:#fff}
.bf-touch .bt.latched{background:rgba(120,200,255,.35);border-color:#bfe6ff}
.bf-touch .bt.small{width:calc(var(--s)*clamp(40px,10vmin,60px));height:calc(var(--s)*clamp(40px,10vmin,60px))}
.bf-touch .stick{position:absolute;width:calc(var(--s)*clamp(110px,30vmin,170px));height:calc(var(--s)*clamp(110px,30vmin,170px));
  border-radius:50%;background:rgba(20,20,24,.28);border:2px solid rgba(255,255,255,.3);transform:translate(-50%,-50%);pointer-events:none}
.bf-touch .knob{position:absolute;left:50%;top:50%;width:42%;height:42%;border-radius:50%;background:rgba(255,255,255,.45);
  border:2px solid rgba(255,255,255,.75);transform:translate(-50%,-50%)}
.bf-touch .stick.idle{opacity:.55}
.bf-touch .hint{position:absolute;left:50%;top:max(10px,env(safe-area-inset-top));transform:translateX(-50%);
  color:#fff;font:14px BlockForge,monospace;text-shadow:2px 2px 0 #000;opacity:.85;pointer-events:none;text-align:center;
  transition:opacity 1s}
`,Sl=class{constructor(t,e,n,s,r){this.buttons=new Map;this.tracks=new Map;this.keys=new Set;this.stickHome={x:0,y:0};this.sneakLatched=!1;this.enabled=!1;this.longPress=null;this.sens=1;this.pendingClicks=[];this.releaseClicks=[];if(this.input=e,this.hotbar=n,this.hooks=r,!document.getElementById("bf-touch-css")){let o=document.createElement("style");o.id="bf-touch-css",o.textContent=x_,document.head.appendChild(o)}let a=document.createElement("div");a.className="bf-touch",this.el=a,this.stick=document.createElement("div"),this.stick.className="stick idle",this.knob=document.createElement("div"),this.knob.className="knob",this.stick.appendChild(this.knob),a.appendChild(this.stick),this.hint=document.createElement("div"),this.hint.className="hint",this.hint.textContent="Left thumb moves. Drag right side to look. Tap to place, hold to break.",a.appendChild(this.hint),this.addButton("pause","small",{top:"max(10px,env(safe-area-inset-top))",right:"max(10px,env(safe-area-inset-right))"}),this.addButton("inventory","small",{top:"max(10px,env(safe-area-inset-top))",right:"calc(max(10px,env(safe-area-inset-right)) + var(--s)*clamp(48px,12vmin,72px))"}),this.addButton("jump","",{right:"calc(max(14px,env(safe-area-inset-right)) + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px))"}),this.addButton("sneak","",{right:"calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px) + 2vmin)",bottom:"calc(var(--s)*clamp(40px,9vmin,70px))"}),this.addButton("fly","small",{right:"calc(max(14px,env(safe-area-inset-right)) + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px))"}),this.addButton("break","",{right:"calc(max(14px,env(safe-area-inset-right)) + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)"}),this.addButton("place","",{right:"calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px) + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)"}),this.addButton("pick","small",{right:"calc(max(14px,env(safe-area-inset-right)) + var(--s)*clamp(56px,15vmin,98px)*2 + 2vmin)",bottom:"calc(var(--s)*clamp(64px,16vmin,110px) + var(--s)*clamp(56px,15vmin,98px)*2)"}),a.addEventListener("pointerdown",o=>this.onDown(o)),a.addEventListener("pointermove",o=>this.onMove(o)),a.addEventListener("pointerup",o=>this.onUp(o)),a.addEventListener("pointercancel",o=>this.onUp(o)),a.addEventListener("contextmenu",o=>o.preventDefault()),t.appendChild(a),this.applySettings(s),this.placeStickHome(),window.addEventListener("resize",()=>this.placeStickHome())}addButton(t,e,n){var r;let s=document.createElement("div");s.className=`bt ${e}`.trim(),s.dataset.btn=t,s.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${(r=v_[t])!=null?r:""}</svg>`,s.setAttribute("aria-label",t);for(let[a,o]of Object.entries(n))s.style[a]=o;this.el.appendChild(s),this.buttons.set(t,s)}placeStickHome(){let t=innerWidth,e=innerHeight,n=Math.min(Math.max(110,Math.min(t,e)*.3),170)/2;this.stickHome={x:Math.max(24,t*.05)+n*1.15,y:e-Math.max(24,e*.06)-n*1.25},this.tracksHas("stick")||this.showStick(this.stickHome.x,this.stickHome.y,0,0,!0)}tracksHas(t){for(let e of this.tracks.values())if(e.role===t)return!0;return!1}applySettings(t){var e,n;this.sens=(e=t.touchSensitivity)!=null?e:1,this.el.style.setProperty("--s",String((n=t.touchButtonScale)!=null?n:1))}setEnabled(t){t!==this.enabled&&(this.enabled=t,this.el.classList.toggle("on",t),t?(this.hint.style.opacity="0.85",setTimeout(()=>{this.hint.style.opacity="0"},6e3)):this.releaseAll())}get isEnabled(){return this.enabled}key(t,e){if(e===this.keys.has(t))return;e?this.keys.add(t):this.keys.delete(t);let n=t==="Space"?" ":t.startsWith("Key")?t.slice(3).toLowerCase():t.replace("Left","");window.dispatchEvent(new KeyboardEvent(e?"keydown":"keyup",{code:t,key:n,bubbles:!0}))}tapKey(t){this.key(t,!0),setTimeout(()=>this.key(t,!1),40)}releaseAll(){for(let t of Array.from(this.keys))this.key(t,!1);this.tracks.clear(),this.input.buttons[0]=this.input.buttons[1]=this.input.buttons[2]=!1,this.sneakLatched=!1,this.buttons.forEach(t=>t.classList.remove("down","latched")),this.longPress=null,this.showStick(this.stickHome.x,this.stickHome.y,0,0,!0)}stickRadius(){return this.stick.getBoundingClientRect().width/2||60}onDown(t){var r;if(!this.enabled)return;t.preventDefault();try{this.el.setPointerCapture(t.pointerId)}catch{}let e=t.target.closest(".bt"),n=performance.now();if(!e)for(let a of document.elementsFromPoint(t.clientX,t.clientY)){let o=(r=a.dataset)==null?void 0:r.slot;if(o!==void 0&&a.closest(".bf-hotbar, .bf-hud, [data-slot]")){this.hotbar.select(Number(o));return}}if(e){let a=e.dataset.btn;this.tracks.set(t.pointerId,{role:a,x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,t:n,moved:!1}),e.classList.add("down"),this.buttonDown(a);return}if(t.clientX<innerWidth*.42&&t.clientY>innerHeight*.3&&!this.tracksHas("stick")){this.tracks.set(t.pointerId,{role:"stick",x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,t:n,moved:!1}),this.showStick(t.clientX,t.clientY,0,0,!1);return}this.tracks.set(t.pointerId,{role:"look",x:t.clientX,y:t.clientY,sx:t.clientX,sy:t.clientY,t:n,moved:!1}),this.longPress||(this.longPress={id:t.pointerId,fired:!1})}onMove(t){var r;let e=this.tracks.get(t.pointerId);if(!e||!this.enabled)return;t.preventDefault();let n=t.clientX-e.x,s=t.clientY-e.y;e.x=t.clientX,e.y=t.clientY,Math.hypot(e.x-e.sx,e.y-e.sy)>12&&(e.moved=!0),e.role==="stick"?this.updateStick(e):e.role==="look"&&(this.input.mouseDX+=n*2.2*this.sens,this.input.mouseDY+=s*2.2*this.sens,e.moved&&((r=this.longPress)==null?void 0:r.id)===t.pointerId&&!this.longPress.fired&&(this.longPress=null))}onUp(t){var n;let e=this.tracks.get(t.pointerId);if(e){if(this.tracks.delete(t.pointerId),e.role==="stick"){for(let s of["KeyW","KeyA","KeyS","KeyD","ControlLeft"])this.key(s,!1);this.showStick(this.stickHome.x,this.stickHome.y,0,0,!0);return}if(e.role==="look"){let s=this.longPress;s&&s.id===t.pointerId&&(s.fired?this.input.buttons[0]=!1:!e.moved&&performance.now()-e.t<350&&this.click(2),this.longPress=null);return}(n=this.buttons.get(e.role))==null||n.classList.remove("down"),this.buttonUp(e.role)}}showStick(t,e,n,s,r){this.stick.style.left=`${t}px`,this.stick.style.top=`${e}px`,this.knob.style.transform=`translate(calc(-50% + ${n}px), calc(-50% + ${s}px))`,this.stick.classList.toggle("idle",r)}updateStick(t){let e=this.stickRadius(),n=t.x-t.sx,s=t.y-t.sy,r=Math.hypot(n,s);r>e&&(t.sx+=n/r*(r-e),t.sy+=s/r*(r-e),n=t.x-t.sx,s=t.y-t.sy);let a=n/e,o=s/e;this.showStick(t.sx,t.sy,n,s,!1);let l=.28;this.key("KeyW",o<-l),this.key("KeyS",o>l),this.key("KeyA",a<-l),this.key("KeyD",a>l),this.key("ControlLeft",o<-.88&&Math.abs(a)<.55)}click(t){this.input.clicked[t]=!0,this.input.buttons[t]=!0,this.pendingClicks.push(t)}buttonDown(t){switch(t){case"jump":this.key("Space",!0);break;case"sneak":this.hooks.isFlying()?this.key("ShiftLeft",!0):(this.sneakLatched=!this.sneakLatched,this.key("ShiftLeft",this.sneakLatched),this.buttons.get("sneak").classList.toggle("latched",this.sneakLatched));break;case"fly":this.hooks.toggleFly();break;case"break":this.input.clicked[0]=!0,this.input.buttons[0]=!0;break;case"place":this.input.clicked[2]=!0,this.input.buttons[2]=!0;break;case"pick":this.click(1);break;case"inventory":this.releaseAll(),this.hooks.openInventory();break;case"pause":this.releaseAll(),this.hooks.pause();break;case"prev":this.hotbar.scroll(-1);break;case"next":this.hotbar.scroll(1);break}}buttonUp(t){switch(t){case"jump":this.key("Space",!1);break;case"sneak":this.sneakLatched||this.key("ShiftLeft",!1);break;case"break":this.input.buttons[0]=!1;break;case"place":this.input.buttons[2]=!1;break}}update(t){if(!this.enabled)return;for(let n of this.releaseClicks)this.buttonHeldByControl(n)||(this.input.buttons[n]=!1);this.releaseClicks=this.pendingClicks,this.pendingClicks=[];let e=this.longPress;if(e&&!e.fired){let n=this.tracks.get(e.id);if(!n)this.longPress=null;else if(!n.moved&&performance.now()-n.t>380&&(e.fired=!0,this.input.clicked[0]=!0,this.input.buttons[0]=!0,navigator.vibrate))try{navigator.vibrate(12)}catch{}}}buttonHeldByControl(t){var e;for(let n of this.tracks.values())if(t===0&&(n.role==="break"||n.role==="look"&&((e=this.longPress)!=null&&e.fired))||t===2&&n.role==="place")return!0;return!1}dispose(){this.releaseAll(),this.el.remove()}};var Ad="162";var w_=0,lm=1,M_=2;var I0=1,S_=2,Qi=3,fn=0,Dn=1,je=2,Di=0,is=1,go=2,cm=3,hm=4,A_=5,dr=100,E_=101,T_=102,um=103,dm=104,C_=200,k_=201,R_=202,L_=203,Gu=204,Wu=205,P_=206,I_=207,D_=208,U_=209,N_=210,B_=211,F_=212,O_=213,z_=214,H_=0,G_=1,W_=2,Kl=3,V_=4,$_=5,X_=6,q_=7,D0=0,Y_=1,K_=2,Ps=0,Z_=1,J_=2,j_=3,Q_=4,tv=5,ev=6,nv=7;var U0=300,bo=301,yo=302,Vu=303,$u=304,yc=306,Xu=1e3,on=1001,qu=1002,ke=1003,fm=1004;var fr=1005;var Pn=1006,cu=1007;var mr=1008;var ii=1009,iv=1010,sv=1011,Ed=1012,N0=1013,Ls=1014,es=1015,va=1016,B0=1017,F0=1018,gr=1020,rv=1021,An=1023,ov=1024,av=1025,br=1026,_o=1027,lv=1028,O0=1029,cv=1030,z0=1031,H0=1033,hu=33776,uu=33777,du=33778,fu=33779,pm=35840,mm=35841,gm=35842,bm=35843,G0=36196,ym=37492,_m=37496,vm=37808,xm=37809,wm=37810,Mm=37811,Sm=37812,Am=37813,Em=37814,Tm=37815,Cm=37816,km=37817,Rm=37818,Lm=37819,Pm=37820,Im=37821,pu=36492,Dm=36494,Um=36495,hv=36283,Nm=36284,Bm=36285,Fm=36286;var Zl=2300,Jl=2301,mu=2302,Om=2400,zm=2401,Hm=2402;var uv=3200,dv=3201,fv=0,pv=1,Rs="",Pi="srgb",Ni="srgb-linear",Td="display-p3",_c="display-p3-linear",jl="linear",ye="srgb",Ql="rec709",tc="p3";var Yr=7680;var Gm=519,mv=512,gv=513,bv=514,W0=515,yv=516,_v=517,vv=518,xv=519,Wm=35044,V0=35048;var Vm="300 es",Yu=1035,ns=2e3,ec=2001,Is=class{addEventListener(t,e){this._listeners===void 0&&(this._listeners={});let n=this._listeners;n[t]===void 0&&(n[t]=[]),n[t].indexOf(e)===-1&&n[t].push(e)}hasEventListener(t,e){if(this._listeners===void 0)return!1;let n=this._listeners;return n[t]!==void 0&&n[t].indexOf(e)!==-1}removeEventListener(t,e){if(this._listeners===void 0)return;let s=this._listeners[t];if(s!==void 0){let r=s.indexOf(e);r!==-1&&s.splice(r,1)}}dispatchEvent(t){if(this._listeners===void 0)return;let n=this._listeners[t.type];if(n!==void 0){t.target=this;let s=n.slice(0);for(let r=0,a=s.length;r<a;r++)s[r].call(this,t);t.target=null}}},un=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];var gu=Math.PI/180,Ku=180/Math.PI;function Aa(){let i=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(un[i&255]+un[i>>8&255]+un[i>>16&255]+un[i>>24&255]+"-"+un[t&255]+un[t>>8&255]+"-"+un[t>>16&15|64]+un[t>>24&255]+"-"+un[e&63|128]+un[e>>8&255]+"-"+un[e>>16&255]+un[e>>24&255]+un[n&255]+un[n>>8&255]+un[n>>16&255]+un[n>>24&255]).toLowerCase()}function In(i,t,e){return Math.max(t,Math.min(e,i))}function wv(i,t){return(i%t+t)%t}function bu(i,t,e){return(1-e)*i+e*t}function $m(i){return(i&i-1)===0&&i!==0}function Zu(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function pa(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function Ln(i,t){switch(t.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}var qt=class i{constructor(t=0,e=0){i.prototype.isVector2=!0,this.x=t,this.y=e}get width(){return this.x}set width(t){this.x=t}get height(){return this.y}set height(t){this.y=t}set(t,e){return this.x=t,this.y=e,this}setScalar(t){return this.x=t,this.y=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y)}copy(t){return this.x=t.x,this.y=t.y,this}add(t){return this.x+=t.x,this.y+=t.y,this}addScalar(t){return this.x+=t,this.y+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this}subScalar(t){return this.x-=t,this.y-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this}multiply(t){return this.x*=t.x,this.y*=t.y,this}multiplyScalar(t){return this.x*=t,this.y*=t,this}divide(t){return this.x/=t.x,this.y/=t.y,this}divideScalar(t){return this.multiplyScalar(1/t)}applyMatrix3(t){let e=this.x,n=this.y,s=t.elements;return this.x=s[0]*e+s[3]*n+s[6],this.y=s[1]*e+s[4]*n+s[7],this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(t){return this.x*t.x+this.y*t.y}cross(t){return this.x*t.y-this.y*t.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(In(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y;return e*e+n*n}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this}equals(t){return t.x===this.x&&t.y===this.y}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this}rotateAround(t,e){let n=Math.cos(e),s=Math.sin(e),r=this.x-t.x,a=this.y-t.y;return this.x=r*n-a*s+t.x,this.y=r*s+a*n+t.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}},te=class i{constructor(t,e,n,s,r,a,o,l,c){i.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c)}set(t,e,n,s,r,a,o,l,c){let h=this.elements;return h[0]=t,h[1]=s,h[2]=o,h[3]=e,h[4]=r,h[5]=l,h[6]=n,h[7]=a,h[8]=c,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],this}extractBasis(t,e,n){return t.setFromMatrix3Column(this,0),e.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(t){let e=t.elements;return this.set(e[0],e[4],e[8],e[1],e[5],e[9],e[2],e[6],e[10]),this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[3],l=n[6],c=n[1],h=n[4],u=n[7],f=n[2],d=n[5],g=n[8],b=s[0],p=s[3],m=s[6],_=s[1],y=s[4],v=s[7],w=s[2],S=s[5],A=s[8];return r[0]=a*b+o*_+l*w,r[3]=a*p+o*y+l*S,r[6]=a*m+o*v+l*A,r[1]=c*b+h*_+u*w,r[4]=c*p+h*y+u*S,r[7]=c*m+h*v+u*A,r[2]=f*b+d*_+g*w,r[5]=f*p+d*y+g*S,r[8]=f*m+d*v+g*A,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[3]*=t,e[6]*=t,e[1]*=t,e[4]*=t,e[7]*=t,e[2]*=t,e[5]*=t,e[8]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8];return e*a*h-e*o*c-n*r*h+n*o*l+s*r*c-s*a*l}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=h*a-o*c,f=o*l-h*r,d=c*r-a*l,g=e*u+n*f+s*d;if(g===0)return this.set(0,0,0,0,0,0,0,0,0);let b=1/g;return t[0]=u*b,t[1]=(s*c-h*n)*b,t[2]=(o*n-s*a)*b,t[3]=f*b,t[4]=(h*e-s*l)*b,t[5]=(s*r-o*e)*b,t[6]=d*b,t[7]=(n*l-c*e)*b,t[8]=(a*e-n*r)*b,this}transpose(){let t,e=this.elements;return t=e[1],e[1]=e[3],e[3]=t,t=e[2],e[2]=e[6],e[6]=t,t=e[5],e[5]=e[7],e[7]=t,this}getNormalMatrix(t){return this.setFromMatrix4(t).invert().transpose()}transposeIntoArray(t){let e=this.elements;return t[0]=e[0],t[1]=e[3],t[2]=e[6],t[3]=e[1],t[4]=e[4],t[5]=e[7],t[6]=e[2],t[7]=e[5],t[8]=e[8],this}setUvTransform(t,e,n,s,r,a,o){let l=Math.cos(r),c=Math.sin(r);return this.set(n*l,n*c,-n*(l*a+c*o)+a+t,-s*c,s*l,-s*(-c*a+l*o)+o+e,0,0,1),this}scale(t,e){return this.premultiply(yu.makeScale(t,e)),this}rotate(t){return this.premultiply(yu.makeRotation(-t)),this}translate(t,e){return this.premultiply(yu.makeTranslation(t,e)),this}makeTranslation(t,e){return t.isVector2?this.set(1,0,t.x,0,1,t.y,0,0,1):this.set(1,0,t,0,1,e,0,0,1),this}makeRotation(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,n,e,0,0,0,1),this}makeScale(t,e){return this.set(t,0,0,0,e,0,0,0,1),this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<9;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<9;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t}clone(){return new this.constructor().fromArray(this.elements)}},yu=new te;function $0(i){for(let t=i.length-1;t>=0;--t)if(i[t]>=65535)return!0;return!1}function nc(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function Mv(){let i=nc("canvas");return i.style.display="block",i}var Xm={};function Sv(i){i in Xm||(Xm[i]=!0,console.warn(i))}var qm=new te().set(.8224621,.177538,0,.0331941,.9668058,0,.0170827,.0723974,.9105199),Ym=new te().set(1.2249401,-.2249404,0,-.0420569,1.0420571,0,-.0196376,-.0786361,1.0982735),Al={[Ni]:{transfer:jl,primaries:Ql,toReference:i=>i,fromReference:i=>i},[Pi]:{transfer:ye,primaries:Ql,toReference:i=>i.convertSRGBToLinear(),fromReference:i=>i.convertLinearToSRGB()},[_c]:{transfer:jl,primaries:tc,toReference:i=>i.applyMatrix3(Ym),fromReference:i=>i.applyMatrix3(qm)},[Td]:{transfer:ye,primaries:tc,toReference:i=>i.convertSRGBToLinear().applyMatrix3(Ym),fromReference:i=>i.applyMatrix3(qm).convertLinearToSRGB()}},Av=new Set([Ni,_c]),he={enabled:!0,_workingColorSpace:Ni,get workingColorSpace(){return this._workingColorSpace},set workingColorSpace(i){if(!Av.has(i))throw new Error(`Unsupported working color space, "${i}".`);this._workingColorSpace=i},convert:function(i,t,e){if(this.enabled===!1||t===e||!t||!e)return i;let n=Al[t].toReference,s=Al[e].fromReference;return s(n(i))},fromWorkingColorSpace:function(i,t){return this.convert(i,this._workingColorSpace,t)},toWorkingColorSpace:function(i,t){return this.convert(i,t,this._workingColorSpace)},getPrimaries:function(i){return Al[i].primaries},getTransfer:function(i){return i===Rs?jl:Al[i].transfer}};function po(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function _u(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}var Kr,ic=class{static getDataURL(t){if(/^data:/i.test(t.src)||typeof HTMLCanvasElement=="undefined")return t.src;let e;if(t instanceof HTMLCanvasElement)e=t;else{Kr===void 0&&(Kr=nc("canvas")),Kr.width=t.width,Kr.height=t.height;let n=Kr.getContext("2d");t instanceof ImageData?n.putImageData(t,0,0):n.drawImage(t,0,0,t.width,t.height),e=Kr}return e.width>2048||e.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",t),e.toDataURL("image/jpeg",.6)):e.toDataURL("image/png")}static sRGBToLinear(t){if(typeof HTMLImageElement!="undefined"&&t instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&t instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&t instanceof ImageBitmap){let e=nc("canvas");e.width=t.width,e.height=t.height;let n=e.getContext("2d");n.drawImage(t,0,0,t.width,t.height);let s=n.getImageData(0,0,t.width,t.height),r=s.data;for(let a=0;a<r.length;a++)r[a]=po(r[a]/255)*255;return n.putImageData(s,0,0),e}else if(t.data){let e=t.data.slice(0);for(let n=0;n<e.length;n++)e instanceof Uint8Array||e instanceof Uint8ClampedArray?e[n]=Math.floor(po(e[n]/255)*255):e[n]=po(e[n]);return{data:e,width:t.width,height:t.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),t}},Ev=0,sc=class{constructor(t=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Ev++}),this.uuid=Aa(),this.data=t,this.dataReady=!0,this.version=0}set needsUpdate(t){t===!0&&this.version++}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.images[this.uuid]!==void 0)return t.images[this.uuid];let n={uuid:this.uuid,url:""},s=this.data;if(s!==null){let r;if(Array.isArray(s)){r=[];for(let a=0,o=s.length;a<o;a++)s[a].isDataTexture?r.push(vu(s[a].image)):r.push(vu(s[a]))}else r=vu(s);n.url=r}return e||(t.images[this.uuid]=n),n}};function vu(i){return typeof HTMLImageElement!="undefined"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&i instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&i instanceof ImageBitmap?ic.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}var Tv=0,Wn=class i extends Is{constructor(t=i.DEFAULT_IMAGE,e=i.DEFAULT_MAPPING,n=on,s=on,r=Pn,a=mr,o=An,l=ii,c=i.DEFAULT_ANISOTROPY,h=Rs){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Tv++}),this.uuid=Aa(),this.name="",this.source=new sc(t),this.mipmaps=[],this.mapping=e,this.channel=0,this.wrapS=n,this.wrapT=s,this.magFilter=r,this.minFilter=a,this.anisotropy=c,this.format=o,this.internalFormat=null,this.type=l,this.offset=new qt(0,0),this.repeat=new qt(1,1),this.center=new qt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new te,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=h,this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(t=null){this.source.data=t}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(t){return this.name=t.name,this.source=t.source,this.mipmaps=t.mipmaps.slice(0),this.mapping=t.mapping,this.channel=t.channel,this.wrapS=t.wrapS,this.wrapT=t.wrapT,this.magFilter=t.magFilter,this.minFilter=t.minFilter,this.anisotropy=t.anisotropy,this.format=t.format,this.internalFormat=t.internalFormat,this.type=t.type,this.offset.copy(t.offset),this.repeat.copy(t.repeat),this.center.copy(t.center),this.rotation=t.rotation,this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrix.copy(t.matrix),this.generateMipmaps=t.generateMipmaps,this.premultiplyAlpha=t.premultiplyAlpha,this.flipY=t.flipY,this.unpackAlignment=t.unpackAlignment,this.colorSpace=t.colorSpace,this.userData=JSON.parse(JSON.stringify(t.userData)),this.needsUpdate=!0,this}toJSON(t){let e=t===void 0||typeof t=="string";if(!e&&t.textures[this.uuid]!==void 0)return t.textures[this.uuid];let n={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(t).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),e||(t.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(t){if(this.mapping!==U0)return t;if(t.applyMatrix3(this.matrix),t.x<0||t.x>1)switch(this.wrapS){case Xu:t.x=t.x-Math.floor(t.x);break;case on:t.x=t.x<0?0:1;break;case qu:Math.abs(Math.floor(t.x)%2)===1?t.x=Math.ceil(t.x)-t.x:t.x=t.x-Math.floor(t.x);break}if(t.y<0||t.y>1)switch(this.wrapT){case Xu:t.y=t.y-Math.floor(t.y);break;case on:t.y=t.y<0?0:1;break;case qu:Math.abs(Math.floor(t.y)%2)===1?t.y=Math.ceil(t.y)-t.y:t.y=t.y-Math.floor(t.y);break}return this.flipY&&(t.y=1-t.y),t}set needsUpdate(t){t===!0&&(this.version++,this.source.needsUpdate=!0)}};Wn.DEFAULT_IMAGE=null;Wn.DEFAULT_MAPPING=U0;Wn.DEFAULT_ANISOTROPY=1;var an=class i{constructor(t=0,e=0,n=0,s=1){i.prototype.isVector4=!0,this.x=t,this.y=e,this.z=n,this.w=s}get width(){return this.z}set width(t){this.z=t}get height(){return this.w}set height(t){this.w=t}set(t,e,n,s){return this.x=t,this.y=e,this.z=n,this.w=s,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this.w=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setW(t){return this.w=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;case 3:this.w=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this.w=t.w!==void 0?t.w:1,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this.w+=t.w,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this.w+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this.w=t.w+e.w,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this.w+=t.w*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this.w-=t.w,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this.w-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this.w=t.w-e.w,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this.w*=t.w,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this.w*=t,this}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=this.w,a=t.elements;return this.x=a[0]*e+a[4]*n+a[8]*s+a[12]*r,this.y=a[1]*e+a[5]*n+a[9]*s+a[13]*r,this.z=a[2]*e+a[6]*n+a[10]*s+a[14]*r,this.w=a[3]*e+a[7]*n+a[11]*s+a[15]*r,this}divideScalar(t){return this.multiplyScalar(1/t)}setAxisAngleFromQuaternion(t){this.w=2*Math.acos(t.w);let e=Math.sqrt(1-t.w*t.w);return e<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=t.x/e,this.y=t.y/e,this.z=t.z/e),this}setAxisAngleFromRotationMatrix(t){let e,n,s,r,l=t.elements,c=l[0],h=l[4],u=l[8],f=l[1],d=l[5],g=l[9],b=l[2],p=l[6],m=l[10];if(Math.abs(h-f)<.01&&Math.abs(u-b)<.01&&Math.abs(g-p)<.01){if(Math.abs(h+f)<.1&&Math.abs(u+b)<.1&&Math.abs(g+p)<.1&&Math.abs(c+d+m-3)<.1)return this.set(1,0,0,0),this;e=Math.PI;let y=(c+1)/2,v=(d+1)/2,w=(m+1)/2,S=(h+f)/4,A=(u+b)/4,L=(g+p)/4;return y>v&&y>w?y<.01?(n=0,s=.707106781,r=.707106781):(n=Math.sqrt(y),s=S/n,r=A/n):v>w?v<.01?(n=.707106781,s=0,r=.707106781):(s=Math.sqrt(v),n=S/s,r=L/s):w<.01?(n=.707106781,s=.707106781,r=0):(r=Math.sqrt(w),n=A/r,s=L/r),this.set(n,s,r,e),this}let _=Math.sqrt((p-g)*(p-g)+(u-b)*(u-b)+(f-h)*(f-h));return Math.abs(_)<.001&&(_=1),this.x=(p-g)/_,this.y=(u-b)/_,this.z=(f-h)/_,this.w=Math.acos((c+d+m-1)/2),this}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this.w=Math.min(this.w,t.w),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this.w=Math.max(this.w,t.w),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this.w=Math.max(t.w,Math.min(e.w,this.w)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this.w=Math.max(t,Math.min(e,this.w)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z+this.w*t.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this.w+=(t.w-this.w)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this.w=t.w+(e.w-t.w)*n,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z&&t.w===this.w}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this.w=t[e+3],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t[e+3]=this.w,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this.w=t.getW(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}},Ju=class extends Is{constructor(t=1,e=1,n={}){super(),this.isRenderTarget=!0,this.width=t,this.height=e,this.depth=1,this.scissor=new an(0,0,t,e),this.scissorTest=!1,this.viewport=new an(0,0,t,e);let s={width:t,height:e,depth:1};n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Pn,depthBuffer:!0,stencilBuffer:!1,depthTexture:null,samples:0,count:1},n);let r=new Wn(s,n.mapping,n.wrapS,n.wrapT,n.magFilter,n.minFilter,n.format,n.type,n.anisotropy,n.colorSpace);r.flipY=!1,r.generateMipmaps=n.generateMipmaps,r.internalFormat=n.internalFormat,this.textures=[];let a=n.count;for(let o=0;o<a;o++)this.textures[o]=r.clone(),this.textures[o].isRenderTargetTexture=!0;this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.depthTexture=n.depthTexture,this.samples=n.samples}get texture(){return this.textures[0]}set texture(t){this.textures[0]=t}setSize(t,e,n=1){if(this.width!==t||this.height!==e||this.depth!==n){this.width=t,this.height=e,this.depth=n;for(let s=0,r=this.textures.length;s<r;s++)this.textures[s].image.width=t,this.textures[s].image.height=e,this.textures[s].image.depth=n;this.dispose()}this.viewport.set(0,0,t,e),this.scissor.set(0,0,t,e)}clone(){return new this.constructor().copy(this)}copy(t){this.width=t.width,this.height=t.height,this.depth=t.depth,this.scissor.copy(t.scissor),this.scissorTest=t.scissorTest,this.viewport.copy(t.viewport),this.textures.length=0;for(let n=0,s=t.textures.length;n<s;n++)this.textures[n]=t.textures[n].clone(),this.textures[n].isRenderTargetTexture=!0;let e=Object.assign({},t.texture.image);return this.texture.source=new sc(e),this.depthBuffer=t.depthBuffer,this.stencilBuffer=t.stencilBuffer,t.depthTexture!==null&&(this.depthTexture=t.depthTexture.clone()),this.samples=t.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}},gi=class extends Ju{constructor(t=1,e=1,n={}){super(t,e,n),this.isWebGLRenderTarget=!0}},rc=class extends Wn{constructor(t=null,e=1,n=1,s=1){super(null),this.isDataArrayTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ke,this.minFilter=ke,this.wrapR=on,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var ju=class extends Wn{constructor(t=null,e=1,n=1,s=1){super(null),this.isData3DTexture=!0,this.image={data:t,width:e,height:n,depth:s},this.magFilter=ke,this.minFilter=ke,this.wrapR=on,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var Ds=class{constructor(t=0,e=0,n=0,s=1){this.isQuaternion=!0,this._x=t,this._y=e,this._z=n,this._w=s}static slerpFlat(t,e,n,s,r,a,o){let l=n[s+0],c=n[s+1],h=n[s+2],u=n[s+3],f=r[a+0],d=r[a+1],g=r[a+2],b=r[a+3];if(o===0){t[e+0]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u;return}if(o===1){t[e+0]=f,t[e+1]=d,t[e+2]=g,t[e+3]=b;return}if(u!==b||l!==f||c!==d||h!==g){let p=1-o,m=l*f+c*d+h*g+u*b,_=m>=0?1:-1,y=1-m*m;if(y>Number.EPSILON){let w=Math.sqrt(y),S=Math.atan2(w,m*_);p=Math.sin(p*S)/w,o=Math.sin(o*S)/w}let v=o*_;if(l=l*p+f*v,c=c*p+d*v,h=h*p+g*v,u=u*p+b*v,p===1-o){let w=1/Math.sqrt(l*l+c*c+h*h+u*u);l*=w,c*=w,h*=w,u*=w}}t[e]=l,t[e+1]=c,t[e+2]=h,t[e+3]=u}static multiplyQuaternionsFlat(t,e,n,s,r,a){let o=n[s],l=n[s+1],c=n[s+2],h=n[s+3],u=r[a],f=r[a+1],d=r[a+2],g=r[a+3];return t[e]=o*g+h*u+l*d-c*f,t[e+1]=l*g+h*f+c*u-o*d,t[e+2]=c*g+h*d+o*f-l*u,t[e+3]=h*g-o*u-l*f-c*d,t}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get w(){return this._w}set w(t){this._w=t,this._onChangeCallback()}set(t,e,n,s){return this._x=t,this._y=e,this._z=n,this._w=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(t){return this._x=t.x,this._y=t.y,this._z=t.z,this._w=t.w,this._onChangeCallback(),this}setFromEuler(t,e=!0){let n=t._x,s=t._y,r=t._z,a=t._order,o=Math.cos,l=Math.sin,c=o(n/2),h=o(s/2),u=o(r/2),f=l(n/2),d=l(s/2),g=l(r/2);switch(a){case"XYZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"YXZ":this._x=f*h*u+c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"ZXY":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u-f*d*g;break;case"ZYX":this._x=f*h*u-c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u+f*d*g;break;case"YZX":this._x=f*h*u+c*d*g,this._y=c*d*u+f*h*g,this._z=c*h*g-f*d*u,this._w=c*h*u-f*d*g;break;case"XZY":this._x=f*h*u-c*d*g,this._y=c*d*u-f*h*g,this._z=c*h*g+f*d*u,this._w=c*h*u+f*d*g;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+a)}return e===!0&&this._onChangeCallback(),this}setFromAxisAngle(t,e){let n=e/2,s=Math.sin(n);return this._x=t.x*s,this._y=t.y*s,this._z=t.z*s,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(t){let e=t.elements,n=e[0],s=e[4],r=e[8],a=e[1],o=e[5],l=e[9],c=e[2],h=e[6],u=e[10],f=n+o+u;if(f>0){let d=.5/Math.sqrt(f+1);this._w=.25/d,this._x=(h-l)*d,this._y=(r-c)*d,this._z=(a-s)*d}else if(n>o&&n>u){let d=2*Math.sqrt(1+n-o-u);this._w=(h-l)/d,this._x=.25*d,this._y=(s+a)/d,this._z=(r+c)/d}else if(o>u){let d=2*Math.sqrt(1+o-n-u);this._w=(r-c)/d,this._x=(s+a)/d,this._y=.25*d,this._z=(l+h)/d}else{let d=2*Math.sqrt(1+u-n-o);this._w=(a-s)/d,this._x=(r+c)/d,this._y=(l+h)/d,this._z=.25*d}return this._onChangeCallback(),this}setFromUnitVectors(t,e){let n=t.dot(e)+1;return n<Number.EPSILON?(n=0,Math.abs(t.x)>Math.abs(t.z)?(this._x=-t.y,this._y=t.x,this._z=0,this._w=n):(this._x=0,this._y=-t.z,this._z=t.y,this._w=n)):(this._x=t.y*e.z-t.z*e.y,this._y=t.z*e.x-t.x*e.z,this._z=t.x*e.y-t.y*e.x,this._w=n),this.normalize()}angleTo(t){return 2*Math.acos(Math.abs(In(this.dot(t),-1,1)))}rotateTowards(t,e){let n=this.angleTo(t);if(n===0)return this;let s=Math.min(1,e/n);return this.slerp(t,s),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(t){return this._x*t._x+this._y*t._y+this._z*t._z+this._w*t._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let t=this.length();return t===0?(this._x=0,this._y=0,this._z=0,this._w=1):(t=1/t,this._x=this._x*t,this._y=this._y*t,this._z=this._z*t,this._w=this._w*t),this._onChangeCallback(),this}multiply(t){return this.multiplyQuaternions(this,t)}premultiply(t){return this.multiplyQuaternions(t,this)}multiplyQuaternions(t,e){let n=t._x,s=t._y,r=t._z,a=t._w,o=e._x,l=e._y,c=e._z,h=e._w;return this._x=n*h+a*o+s*c-r*l,this._y=s*h+a*l+r*o-n*c,this._z=r*h+a*c+n*l-s*o,this._w=a*h-n*o-s*l-r*c,this._onChangeCallback(),this}slerp(t,e){if(e===0)return this;if(e===1)return this.copy(t);let n=this._x,s=this._y,r=this._z,a=this._w,o=a*t._w+n*t._x+s*t._y+r*t._z;if(o<0?(this._w=-t._w,this._x=-t._x,this._y=-t._y,this._z=-t._z,o=-o):this.copy(t),o>=1)return this._w=a,this._x=n,this._y=s,this._z=r,this;let l=1-o*o;if(l<=Number.EPSILON){let d=1-e;return this._w=d*a+e*this._w,this._x=d*n+e*this._x,this._y=d*s+e*this._y,this._z=d*r+e*this._z,this.normalize(),this}let c=Math.sqrt(l),h=Math.atan2(c,o),u=Math.sin((1-e)*h)/c,f=Math.sin(e*h)/c;return this._w=a*u+this._w*f,this._x=n*u+this._x*f,this._y=s*u+this._y*f,this._z=r*u+this._z*f,this._onChangeCallback(),this}slerpQuaternions(t,e,n){return this.copy(t).slerp(e,n)}random(){let t=2*Math.PI*Math.random(),e=2*Math.PI*Math.random(),n=Math.random(),s=Math.sqrt(1-n),r=Math.sqrt(n);return this.set(s*Math.sin(t),s*Math.cos(t),r*Math.sin(e),r*Math.cos(e))}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._w===this._w}fromArray(t,e=0){return this._x=t[e],this._y=t[e+1],this._z=t[e+2],this._w=t[e+3],this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._w,t}fromBufferAttribute(t,e){return this._x=t.getX(e),this._y=t.getY(e),this._z=t.getZ(e),this._w=t.getW(e),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}},V=class i{constructor(t=0,e=0,n=0){i.prototype.isVector3=!0,this.x=t,this.y=e,this.z=n}set(t,e,n){return n===void 0&&(n=this.z),this.x=t,this.y=e,this.z=n,this}setScalar(t){return this.x=t,this.y=t,this.z=t,this}setX(t){return this.x=t,this}setY(t){return this.y=t,this}setZ(t){return this.z=t,this}setComponent(t,e){switch(t){case 0:this.x=e;break;case 1:this.y=e;break;case 2:this.z=e;break;default:throw new Error("index is out of range: "+t)}return this}getComponent(t){switch(t){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+t)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(t){return this.x=t.x,this.y=t.y,this.z=t.z,this}add(t){return this.x+=t.x,this.y+=t.y,this.z+=t.z,this}addScalar(t){return this.x+=t,this.y+=t,this.z+=t,this}addVectors(t,e){return this.x=t.x+e.x,this.y=t.y+e.y,this.z=t.z+e.z,this}addScaledVector(t,e){return this.x+=t.x*e,this.y+=t.y*e,this.z+=t.z*e,this}sub(t){return this.x-=t.x,this.y-=t.y,this.z-=t.z,this}subScalar(t){return this.x-=t,this.y-=t,this.z-=t,this}subVectors(t,e){return this.x=t.x-e.x,this.y=t.y-e.y,this.z=t.z-e.z,this}multiply(t){return this.x*=t.x,this.y*=t.y,this.z*=t.z,this}multiplyScalar(t){return this.x*=t,this.y*=t,this.z*=t,this}multiplyVectors(t,e){return this.x=t.x*e.x,this.y=t.y*e.y,this.z=t.z*e.z,this}applyEuler(t){return this.applyQuaternion(Km.setFromEuler(t))}applyAxisAngle(t,e){return this.applyQuaternion(Km.setFromAxisAngle(t,e))}applyMatrix3(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[3]*n+r[6]*s,this.y=r[1]*e+r[4]*n+r[7]*s,this.z=r[2]*e+r[5]*n+r[8]*s,this}applyNormalMatrix(t){return this.applyMatrix3(t).normalize()}applyMatrix4(t){let e=this.x,n=this.y,s=this.z,r=t.elements,a=1/(r[3]*e+r[7]*n+r[11]*s+r[15]);return this.x=(r[0]*e+r[4]*n+r[8]*s+r[12])*a,this.y=(r[1]*e+r[5]*n+r[9]*s+r[13])*a,this.z=(r[2]*e+r[6]*n+r[10]*s+r[14])*a,this}applyQuaternion(t){let e=this.x,n=this.y,s=this.z,r=t.x,a=t.y,o=t.z,l=t.w,c=2*(a*s-o*n),h=2*(o*e-r*s),u=2*(r*n-a*e);return this.x=e+l*c+a*u-o*h,this.y=n+l*h+o*c-r*u,this.z=s+l*u+r*h-a*c,this}project(t){return this.applyMatrix4(t.matrixWorldInverse).applyMatrix4(t.projectionMatrix)}unproject(t){return this.applyMatrix4(t.projectionMatrixInverse).applyMatrix4(t.matrixWorld)}transformDirection(t){let e=this.x,n=this.y,s=this.z,r=t.elements;return this.x=r[0]*e+r[4]*n+r[8]*s,this.y=r[1]*e+r[5]*n+r[9]*s,this.z=r[2]*e+r[6]*n+r[10]*s,this.normalize()}divide(t){return this.x/=t.x,this.y/=t.y,this.z/=t.z,this}divideScalar(t){return this.multiplyScalar(1/t)}min(t){return this.x=Math.min(this.x,t.x),this.y=Math.min(this.y,t.y),this.z=Math.min(this.z,t.z),this}max(t){return this.x=Math.max(this.x,t.x),this.y=Math.max(this.y,t.y),this.z=Math.max(this.z,t.z),this}clamp(t,e){return this.x=Math.max(t.x,Math.min(e.x,this.x)),this.y=Math.max(t.y,Math.min(e.y,this.y)),this.z=Math.max(t.z,Math.min(e.z,this.z)),this}clampScalar(t,e){return this.x=Math.max(t,Math.min(e,this.x)),this.y=Math.max(t,Math.min(e,this.y)),this.z=Math.max(t,Math.min(e,this.z)),this}clampLength(t,e){let n=this.length();return this.divideScalar(n||1).multiplyScalar(Math.max(t,Math.min(e,n)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(t){return this.x*t.x+this.y*t.y+this.z*t.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(t){return this.normalize().multiplyScalar(t)}lerp(t,e){return this.x+=(t.x-this.x)*e,this.y+=(t.y-this.y)*e,this.z+=(t.z-this.z)*e,this}lerpVectors(t,e,n){return this.x=t.x+(e.x-t.x)*n,this.y=t.y+(e.y-t.y)*n,this.z=t.z+(e.z-t.z)*n,this}cross(t){return this.crossVectors(this,t)}crossVectors(t,e){let n=t.x,s=t.y,r=t.z,a=e.x,o=e.y,l=e.z;return this.x=s*l-r*o,this.y=r*a-n*l,this.z=n*o-s*a,this}projectOnVector(t){let e=t.lengthSq();if(e===0)return this.set(0,0,0);let n=t.dot(this)/e;return this.copy(t).multiplyScalar(n)}projectOnPlane(t){return xu.copy(this).projectOnVector(t),this.sub(xu)}reflect(t){return this.sub(xu.copy(t).multiplyScalar(2*this.dot(t)))}angleTo(t){let e=Math.sqrt(this.lengthSq()*t.lengthSq());if(e===0)return Math.PI/2;let n=this.dot(t)/e;return Math.acos(In(n,-1,1))}distanceTo(t){return Math.sqrt(this.distanceToSquared(t))}distanceToSquared(t){let e=this.x-t.x,n=this.y-t.y,s=this.z-t.z;return e*e+n*n+s*s}manhattanDistanceTo(t){return Math.abs(this.x-t.x)+Math.abs(this.y-t.y)+Math.abs(this.z-t.z)}setFromSpherical(t){return this.setFromSphericalCoords(t.radius,t.phi,t.theta)}setFromSphericalCoords(t,e,n){let s=Math.sin(e)*t;return this.x=s*Math.sin(n),this.y=Math.cos(e)*t,this.z=s*Math.cos(n),this}setFromCylindrical(t){return this.setFromCylindricalCoords(t.radius,t.theta,t.y)}setFromCylindricalCoords(t,e,n){return this.x=t*Math.sin(e),this.y=n,this.z=t*Math.cos(e),this}setFromMatrixPosition(t){let e=t.elements;return this.x=e[12],this.y=e[13],this.z=e[14],this}setFromMatrixScale(t){let e=this.setFromMatrixColumn(t,0).length(),n=this.setFromMatrixColumn(t,1).length(),s=this.setFromMatrixColumn(t,2).length();return this.x=e,this.y=n,this.z=s,this}setFromMatrixColumn(t,e){return this.fromArray(t.elements,e*4)}setFromMatrix3Column(t,e){return this.fromArray(t.elements,e*3)}setFromEuler(t){return this.x=t._x,this.y=t._y,this.z=t._z,this}setFromColor(t){return this.x=t.r,this.y=t.g,this.z=t.b,this}equals(t){return t.x===this.x&&t.y===this.y&&t.z===this.z}fromArray(t,e=0){return this.x=t[e],this.y=t[e+1],this.z=t[e+2],this}toArray(t=[],e=0){return t[e]=this.x,t[e+1]=this.y,t[e+2]=this.z,t}fromBufferAttribute(t,e){return this.x=t.getX(e),this.y=t.getY(e),this.z=t.getZ(e),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){let t=Math.random()*Math.PI*2,e=Math.random()*2-1,n=Math.sqrt(1-e*e);return this.x=n*Math.cos(t),this.y=e,this.z=n*Math.sin(t),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}},xu=new V,Km=new Ds,yr=class{constructor(t=new V(1/0,1/0,1/0),e=new V(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=t,this.max=e}set(t,e){return this.min.copy(t),this.max.copy(e),this}setFromArray(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e+=3)this.expandByPoint(fi.fromArray(t,e));return this}setFromBufferAttribute(t){this.makeEmpty();for(let e=0,n=t.count;e<n;e++)this.expandByPoint(fi.fromBufferAttribute(t,e));return this}setFromPoints(t){this.makeEmpty();for(let e=0,n=t.length;e<n;e++)this.expandByPoint(t[e]);return this}setFromCenterAndSize(t,e){let n=fi.copy(e).multiplyScalar(.5);return this.min.copy(t).sub(n),this.max.copy(t).add(n),this}setFromObject(t,e=!1){return this.makeEmpty(),this.expandByObject(t,e)}clone(){return new this.constructor().copy(this)}copy(t){return this.min.copy(t.min),this.max.copy(t.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(t){return this.isEmpty()?t.set(0,0,0):t.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(t){return this.isEmpty()?t.set(0,0,0):t.subVectors(this.max,this.min)}expandByPoint(t){return this.min.min(t),this.max.max(t),this}expandByVector(t){return this.min.sub(t),this.max.add(t),this}expandByScalar(t){return this.min.addScalar(-t),this.max.addScalar(t),this}expandByObject(t,e=!1){t.updateWorldMatrix(!1,!1);let n=t.geometry;if(n!==void 0){let r=n.getAttribute("position");if(e===!0&&r!==void 0&&t.isInstancedMesh!==!0)for(let a=0,o=r.count;a<o;a++)t.isMesh===!0?t.getVertexPosition(a,fi):fi.fromBufferAttribute(r,a),fi.applyMatrix4(t.matrixWorld),this.expandByPoint(fi);else t.boundingBox!==void 0?(t.boundingBox===null&&t.computeBoundingBox(),El.copy(t.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),El.copy(n.boundingBox)),El.applyMatrix4(t.matrixWorld),this.union(El)}let s=t.children;for(let r=0,a=s.length;r<a;r++)this.expandByObject(s[r],e);return this}containsPoint(t){return!(t.x<this.min.x||t.x>this.max.x||t.y<this.min.y||t.y>this.max.y||t.z<this.min.z||t.z>this.max.z)}containsBox(t){return this.min.x<=t.min.x&&t.max.x<=this.max.x&&this.min.y<=t.min.y&&t.max.y<=this.max.y&&this.min.z<=t.min.z&&t.max.z<=this.max.z}getParameter(t,e){return e.set((t.x-this.min.x)/(this.max.x-this.min.x),(t.y-this.min.y)/(this.max.y-this.min.y),(t.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(t){return!(t.max.x<this.min.x||t.min.x>this.max.x||t.max.y<this.min.y||t.min.y>this.max.y||t.max.z<this.min.z||t.min.z>this.max.z)}intersectsSphere(t){return this.clampPoint(t.center,fi),fi.distanceToSquared(t.center)<=t.radius*t.radius}intersectsPlane(t){let e,n;return t.normal.x>0?(e=t.normal.x*this.min.x,n=t.normal.x*this.max.x):(e=t.normal.x*this.max.x,n=t.normal.x*this.min.x),t.normal.y>0?(e+=t.normal.y*this.min.y,n+=t.normal.y*this.max.y):(e+=t.normal.y*this.max.y,n+=t.normal.y*this.min.y),t.normal.z>0?(e+=t.normal.z*this.min.z,n+=t.normal.z*this.max.z):(e+=t.normal.z*this.max.z,n+=t.normal.z*this.min.z),e<=-t.constant&&n>=-t.constant}intersectsTriangle(t){if(this.isEmpty())return!1;this.getCenter(ma),Tl.subVectors(this.max,ma),Zr.subVectors(t.a,ma),Jr.subVectors(t.b,ma),jr.subVectors(t.c,ma),Ss.subVectors(Jr,Zr),As.subVectors(jr,Jr),rr.subVectors(Zr,jr);let e=[0,-Ss.z,Ss.y,0,-As.z,As.y,0,-rr.z,rr.y,Ss.z,0,-Ss.x,As.z,0,-As.x,rr.z,0,-rr.x,-Ss.y,Ss.x,0,-As.y,As.x,0,-rr.y,rr.x,0];return!wu(e,Zr,Jr,jr,Tl)||(e=[1,0,0,0,1,0,0,0,1],!wu(e,Zr,Jr,jr,Tl))?!1:(Cl.crossVectors(Ss,As),e=[Cl.x,Cl.y,Cl.z],wu(e,Zr,Jr,jr,Tl))}clampPoint(t,e){return e.copy(t).clamp(this.min,this.max)}distanceToPoint(t){return this.clampPoint(t,fi).distanceTo(t)}getBoundingSphere(t){return this.isEmpty()?t.makeEmpty():(this.getCenter(t.center),t.radius=this.getSize(fi).length()*.5),t}intersect(t){return this.min.max(t.min),this.max.min(t.max),this.isEmpty()&&this.makeEmpty(),this}union(t){return this.min.min(t.min),this.max.max(t.max),this}applyMatrix4(t){return this.isEmpty()?this:(Yi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(t),Yi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(t),Yi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(t),Yi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(t),Yi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(t),Yi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(t),Yi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(t),Yi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(t),this.setFromPoints(Yi),this)}translate(t){return this.min.add(t),this.max.add(t),this}equals(t){return t.min.equals(this.min)&&t.max.equals(this.max)}},Yi=[new V,new V,new V,new V,new V,new V,new V,new V],fi=new V,El=new yr,Zr=new V,Jr=new V,jr=new V,Ss=new V,As=new V,rr=new V,ma=new V,Tl=new V,Cl=new V,or=new V;function wu(i,t,e,n,s){for(let r=0,a=i.length-3;r<=a;r+=3){or.fromArray(i,r);let o=s.x*Math.abs(or.x)+s.y*Math.abs(or.y)+s.z*Math.abs(or.z),l=t.dot(or),c=e.dot(or),h=n.dot(or);if(Math.max(-Math.max(l,c,h),Math.min(l,c,h))>o)return!1}return!0}var Cv=new yr,ga=new V,Mu=new V,Ui=class{constructor(t=new V,e=-1){this.isSphere=!0,this.center=t,this.radius=e}set(t,e){return this.center.copy(t),this.radius=e,this}setFromPoints(t,e){let n=this.center;e!==void 0?n.copy(e):Cv.setFromPoints(t).getCenter(n);let s=0;for(let r=0,a=t.length;r<a;r++)s=Math.max(s,n.distanceToSquared(t[r]));return this.radius=Math.sqrt(s),this}copy(t){return this.center.copy(t.center),this.radius=t.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(t){return t.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(t){return t.distanceTo(this.center)-this.radius}intersectsSphere(t){let e=this.radius+t.radius;return t.center.distanceToSquared(this.center)<=e*e}intersectsBox(t){return t.intersectsSphere(this)}intersectsPlane(t){return Math.abs(t.distanceToPoint(this.center))<=this.radius}clampPoint(t,e){let n=this.center.distanceToSquared(t);return e.copy(t),n>this.radius*this.radius&&(e.sub(this.center).normalize(),e.multiplyScalar(this.radius).add(this.center)),e}getBoundingBox(t){return this.isEmpty()?(t.makeEmpty(),t):(t.set(this.center,this.center),t.expandByScalar(this.radius),t)}applyMatrix4(t){return this.center.applyMatrix4(t),this.radius=this.radius*t.getMaxScaleOnAxis(),this}translate(t){return this.center.add(t),this}expandByPoint(t){if(this.isEmpty())return this.center.copy(t),this.radius=0,this;ga.subVectors(t,this.center);let e=ga.lengthSq();if(e>this.radius*this.radius){let n=Math.sqrt(e),s=(n-this.radius)*.5;this.center.addScaledVector(ga,s/n),this.radius+=s}return this}union(t){return t.isEmpty()?this:this.isEmpty()?(this.copy(t),this):(this.center.equals(t.center)===!0?this.radius=Math.max(this.radius,t.radius):(Mu.subVectors(t.center,this.center).setLength(t.radius),this.expandByPoint(ga.copy(t.center).add(Mu)),this.expandByPoint(ga.copy(t.center).sub(Mu))),this)}equals(t){return t.center.equals(this.center)&&t.radius===this.radius}clone(){return new this.constructor().copy(this)}},Ki=new V,Su=new V,kl=new V,Es=new V,Au=new V,Rl=new V,Eu=new V,oc=class{constructor(t=new V,e=new V(0,0,-1)){this.origin=t,this.direction=e}set(t,e){return this.origin.copy(t),this.direction.copy(e),this}copy(t){return this.origin.copy(t.origin),this.direction.copy(t.direction),this}at(t,e){return e.copy(this.origin).addScaledVector(this.direction,t)}lookAt(t){return this.direction.copy(t).sub(this.origin).normalize(),this}recast(t){return this.origin.copy(this.at(t,Ki)),this}closestPointToPoint(t,e){e.subVectors(t,this.origin);let n=e.dot(this.direction);return n<0?e.copy(this.origin):e.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(t){return Math.sqrt(this.distanceSqToPoint(t))}distanceSqToPoint(t){let e=Ki.subVectors(t,this.origin).dot(this.direction);return e<0?this.origin.distanceToSquared(t):(Ki.copy(this.origin).addScaledVector(this.direction,e),Ki.distanceToSquared(t))}distanceSqToSegment(t,e,n,s){Su.copy(t).add(e).multiplyScalar(.5),kl.copy(e).sub(t).normalize(),Es.copy(this.origin).sub(Su);let r=t.distanceTo(e)*.5,a=-this.direction.dot(kl),o=Es.dot(this.direction),l=-Es.dot(kl),c=Es.lengthSq(),h=Math.abs(1-a*a),u,f,d,g;if(h>0)if(u=a*l-o,f=a*o-l,g=r*h,u>=0)if(f>=-g)if(f<=g){let b=1/h;u*=b,f*=b,d=u*(u+a*f+2*o)+f*(a*u+f+2*l)+c}else f=r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;else f=-r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;else f<=-g?(u=Math.max(0,-(-a*r+o)),f=u>0?-r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c):f<=g?(u=0,f=Math.min(Math.max(-r,-l),r),d=f*(f+2*l)+c):(u=Math.max(0,-(a*r+o)),f=u>0?r:Math.min(Math.max(-r,-l),r),d=-u*u+f*(f+2*l)+c);else f=a>0?-r:r,u=Math.max(0,-(a*f+o)),d=-u*u+f*(f+2*l)+c;return n&&n.copy(this.origin).addScaledVector(this.direction,u),s&&s.copy(Su).addScaledVector(kl,f),d}intersectSphere(t,e){Ki.subVectors(t.center,this.origin);let n=Ki.dot(this.direction),s=Ki.dot(Ki)-n*n,r=t.radius*t.radius;if(s>r)return null;let a=Math.sqrt(r-s),o=n-a,l=n+a;return l<0?null:o<0?this.at(l,e):this.at(o,e)}intersectsSphere(t){return this.distanceSqToPoint(t.center)<=t.radius*t.radius}distanceToPlane(t){let e=t.normal.dot(this.direction);if(e===0)return t.distanceToPoint(this.origin)===0?0:null;let n=-(this.origin.dot(t.normal)+t.constant)/e;return n>=0?n:null}intersectPlane(t,e){let n=this.distanceToPlane(t);return n===null?null:this.at(n,e)}intersectsPlane(t){let e=t.distanceToPoint(this.origin);return e===0||t.normal.dot(this.direction)*e<0}intersectBox(t,e){let n,s,r,a,o,l,c=1/this.direction.x,h=1/this.direction.y,u=1/this.direction.z,f=this.origin;return c>=0?(n=(t.min.x-f.x)*c,s=(t.max.x-f.x)*c):(n=(t.max.x-f.x)*c,s=(t.min.x-f.x)*c),h>=0?(r=(t.min.y-f.y)*h,a=(t.max.y-f.y)*h):(r=(t.max.y-f.y)*h,a=(t.min.y-f.y)*h),n>a||r>s||((r>n||isNaN(n))&&(n=r),(a<s||isNaN(s))&&(s=a),u>=0?(o=(t.min.z-f.z)*u,l=(t.max.z-f.z)*u):(o=(t.max.z-f.z)*u,l=(t.min.z-f.z)*u),n>l||o>s)||((o>n||n!==n)&&(n=o),(l<s||s!==s)&&(s=l),s<0)?null:this.at(n>=0?n:s,e)}intersectsBox(t){return this.intersectBox(t,Ki)!==null}intersectTriangle(t,e,n,s,r){Au.subVectors(e,t),Rl.subVectors(n,t),Eu.crossVectors(Au,Rl);let a=this.direction.dot(Eu),o;if(a>0){if(s)return null;o=1}else if(a<0)o=-1,a=-a;else return null;Es.subVectors(this.origin,t);let l=o*this.direction.dot(Rl.crossVectors(Es,Rl));if(l<0)return null;let c=o*this.direction.dot(Au.cross(Es));if(c<0||l+c>a)return null;let h=-o*Es.dot(Eu);return h<0?null:this.at(h/a,r)}applyMatrix4(t){return this.origin.applyMatrix4(t),this.direction.transformDirection(t),this}equals(t){return t.origin.equals(this.origin)&&t.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}},ve=class i{constructor(t,e,n,s,r,a,o,l,c,h,u,f,d,g,b,p){i.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],t!==void 0&&this.set(t,e,n,s,r,a,o,l,c,h,u,f,d,g,b,p)}set(t,e,n,s,r,a,o,l,c,h,u,f,d,g,b,p){let m=this.elements;return m[0]=t,m[4]=e,m[8]=n,m[12]=s,m[1]=r,m[5]=a,m[9]=o,m[13]=l,m[2]=c,m[6]=h,m[10]=u,m[14]=f,m[3]=d,m[7]=g,m[11]=b,m[15]=p,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new i().fromArray(this.elements)}copy(t){let e=this.elements,n=t.elements;return e[0]=n[0],e[1]=n[1],e[2]=n[2],e[3]=n[3],e[4]=n[4],e[5]=n[5],e[6]=n[6],e[7]=n[7],e[8]=n[8],e[9]=n[9],e[10]=n[10],e[11]=n[11],e[12]=n[12],e[13]=n[13],e[14]=n[14],e[15]=n[15],this}copyPosition(t){let e=this.elements,n=t.elements;return e[12]=n[12],e[13]=n[13],e[14]=n[14],this}setFromMatrix3(t){let e=t.elements;return this.set(e[0],e[3],e[6],0,e[1],e[4],e[7],0,e[2],e[5],e[8],0,0,0,0,1),this}extractBasis(t,e,n){return t.setFromMatrixColumn(this,0),e.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this}makeBasis(t,e,n){return this.set(t.x,e.x,n.x,0,t.y,e.y,n.y,0,t.z,e.z,n.z,0,0,0,0,1),this}extractRotation(t){let e=this.elements,n=t.elements,s=1/Qr.setFromMatrixColumn(t,0).length(),r=1/Qr.setFromMatrixColumn(t,1).length(),a=1/Qr.setFromMatrixColumn(t,2).length();return e[0]=n[0]*s,e[1]=n[1]*s,e[2]=n[2]*s,e[3]=0,e[4]=n[4]*r,e[5]=n[5]*r,e[6]=n[6]*r,e[7]=0,e[8]=n[8]*a,e[9]=n[9]*a,e[10]=n[10]*a,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromEuler(t){let e=this.elements,n=t.x,s=t.y,r=t.z,a=Math.cos(n),o=Math.sin(n),l=Math.cos(s),c=Math.sin(s),h=Math.cos(r),u=Math.sin(r);if(t.order==="XYZ"){let f=a*h,d=a*u,g=o*h,b=o*u;e[0]=l*h,e[4]=-l*u,e[8]=c,e[1]=d+g*c,e[5]=f-b*c,e[9]=-o*l,e[2]=b-f*c,e[6]=g+d*c,e[10]=a*l}else if(t.order==="YXZ"){let f=l*h,d=l*u,g=c*h,b=c*u;e[0]=f+b*o,e[4]=g*o-d,e[8]=a*c,e[1]=a*u,e[5]=a*h,e[9]=-o,e[2]=d*o-g,e[6]=b+f*o,e[10]=a*l}else if(t.order==="ZXY"){let f=l*h,d=l*u,g=c*h,b=c*u;e[0]=f-b*o,e[4]=-a*u,e[8]=g+d*o,e[1]=d+g*o,e[5]=a*h,e[9]=b-f*o,e[2]=-a*c,e[6]=o,e[10]=a*l}else if(t.order==="ZYX"){let f=a*h,d=a*u,g=o*h,b=o*u;e[0]=l*h,e[4]=g*c-d,e[8]=f*c+b,e[1]=l*u,e[5]=b*c+f,e[9]=d*c-g,e[2]=-c,e[6]=o*l,e[10]=a*l}else if(t.order==="YZX"){let f=a*l,d=a*c,g=o*l,b=o*c;e[0]=l*h,e[4]=b-f*u,e[8]=g*u+d,e[1]=u,e[5]=a*h,e[9]=-o*h,e[2]=-c*h,e[6]=d*u+g,e[10]=f-b*u}else if(t.order==="XZY"){let f=a*l,d=a*c,g=o*l,b=o*c;e[0]=l*h,e[4]=-u,e[8]=c*h,e[1]=f*u+b,e[5]=a*h,e[9]=d*u-g,e[2]=g*u-d,e[6]=o*h,e[10]=b*u+f}return e[3]=0,e[7]=0,e[11]=0,e[12]=0,e[13]=0,e[14]=0,e[15]=1,this}makeRotationFromQuaternion(t){return this.compose(kv,t,Rv)}lookAt(t,e,n){let s=this.elements;return Hn.subVectors(t,e),Hn.lengthSq()===0&&(Hn.z=1),Hn.normalize(),Ts.crossVectors(n,Hn),Ts.lengthSq()===0&&(Math.abs(n.z)===1?Hn.x+=1e-4:Hn.z+=1e-4,Hn.normalize(),Ts.crossVectors(n,Hn)),Ts.normalize(),Ll.crossVectors(Hn,Ts),s[0]=Ts.x,s[4]=Ll.x,s[8]=Hn.x,s[1]=Ts.y,s[5]=Ll.y,s[9]=Hn.y,s[2]=Ts.z,s[6]=Ll.z,s[10]=Hn.z,this}multiply(t){return this.multiplyMatrices(this,t)}premultiply(t){return this.multiplyMatrices(t,this)}multiplyMatrices(t,e){let n=t.elements,s=e.elements,r=this.elements,a=n[0],o=n[4],l=n[8],c=n[12],h=n[1],u=n[5],f=n[9],d=n[13],g=n[2],b=n[6],p=n[10],m=n[14],_=n[3],y=n[7],v=n[11],w=n[15],S=s[0],A=s[4],L=s[8],P=s[12],M=s[1],T=s[5],I=s[9],F=s[13],k=s[2],U=s[6],N=s[10],D=s[14],z=s[3],$=s[7],nt=s[11],et=s[15];return r[0]=a*S+o*M+l*k+c*z,r[4]=a*A+o*T+l*U+c*$,r[8]=a*L+o*I+l*N+c*nt,r[12]=a*P+o*F+l*D+c*et,r[1]=h*S+u*M+f*k+d*z,r[5]=h*A+u*T+f*U+d*$,r[9]=h*L+u*I+f*N+d*nt,r[13]=h*P+u*F+f*D+d*et,r[2]=g*S+b*M+p*k+m*z,r[6]=g*A+b*T+p*U+m*$,r[10]=g*L+b*I+p*N+m*nt,r[14]=g*P+b*F+p*D+m*et,r[3]=_*S+y*M+v*k+w*z,r[7]=_*A+y*T+v*U+w*$,r[11]=_*L+y*I+v*N+w*nt,r[15]=_*P+y*F+v*D+w*et,this}multiplyScalar(t){let e=this.elements;return e[0]*=t,e[4]*=t,e[8]*=t,e[12]*=t,e[1]*=t,e[5]*=t,e[9]*=t,e[13]*=t,e[2]*=t,e[6]*=t,e[10]*=t,e[14]*=t,e[3]*=t,e[7]*=t,e[11]*=t,e[15]*=t,this}determinant(){let t=this.elements,e=t[0],n=t[4],s=t[8],r=t[12],a=t[1],o=t[5],l=t[9],c=t[13],h=t[2],u=t[6],f=t[10],d=t[14],g=t[3],b=t[7],p=t[11],m=t[15];return g*(+r*l*u-s*c*u-r*o*f+n*c*f+s*o*d-n*l*d)+b*(+e*l*d-e*c*f+r*a*f-s*a*d+s*c*h-r*l*h)+p*(+e*c*u-e*o*d-r*a*u+n*a*d+r*o*h-n*c*h)+m*(-s*o*h-e*l*u+e*o*f+s*a*u-n*a*f+n*l*h)}transpose(){let t=this.elements,e;return e=t[1],t[1]=t[4],t[4]=e,e=t[2],t[2]=t[8],t[8]=e,e=t[6],t[6]=t[9],t[9]=e,e=t[3],t[3]=t[12],t[12]=e,e=t[7],t[7]=t[13],t[13]=e,e=t[11],t[11]=t[14],t[14]=e,this}setPosition(t,e,n){let s=this.elements;return t.isVector3?(s[12]=t.x,s[13]=t.y,s[14]=t.z):(s[12]=t,s[13]=e,s[14]=n),this}invert(){let t=this.elements,e=t[0],n=t[1],s=t[2],r=t[3],a=t[4],o=t[5],l=t[6],c=t[7],h=t[8],u=t[9],f=t[10],d=t[11],g=t[12],b=t[13],p=t[14],m=t[15],_=u*p*c-b*f*c+b*l*d-o*p*d-u*l*m+o*f*m,y=g*f*c-h*p*c-g*l*d+a*p*d+h*l*m-a*f*m,v=h*b*c-g*u*c+g*o*d-a*b*d-h*o*m+a*u*m,w=g*u*l-h*b*l-g*o*f+a*b*f+h*o*p-a*u*p,S=e*_+n*y+s*v+r*w;if(S===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);let A=1/S;return t[0]=_*A,t[1]=(b*f*r-u*p*r-b*s*d+n*p*d+u*s*m-n*f*m)*A,t[2]=(o*p*r-b*l*r+b*s*c-n*p*c-o*s*m+n*l*m)*A,t[3]=(u*l*r-o*f*r-u*s*c+n*f*c+o*s*d-n*l*d)*A,t[4]=y*A,t[5]=(h*p*r-g*f*r+g*s*d-e*p*d-h*s*m+e*f*m)*A,t[6]=(g*l*r-a*p*r-g*s*c+e*p*c+a*s*m-e*l*m)*A,t[7]=(a*f*r-h*l*r+h*s*c-e*f*c-a*s*d+e*l*d)*A,t[8]=v*A,t[9]=(g*u*r-h*b*r-g*n*d+e*b*d+h*n*m-e*u*m)*A,t[10]=(a*b*r-g*o*r+g*n*c-e*b*c-a*n*m+e*o*m)*A,t[11]=(h*o*r-a*u*r-h*n*c+e*u*c+a*n*d-e*o*d)*A,t[12]=w*A,t[13]=(h*b*s-g*u*s+g*n*f-e*b*f-h*n*p+e*u*p)*A,t[14]=(g*o*s-a*b*s-g*n*l+e*b*l+a*n*p-e*o*p)*A,t[15]=(a*u*s-h*o*s+h*n*l-e*u*l-a*n*f+e*o*f)*A,this}scale(t){let e=this.elements,n=t.x,s=t.y,r=t.z;return e[0]*=n,e[4]*=s,e[8]*=r,e[1]*=n,e[5]*=s,e[9]*=r,e[2]*=n,e[6]*=s,e[10]*=r,e[3]*=n,e[7]*=s,e[11]*=r,this}getMaxScaleOnAxis(){let t=this.elements,e=t[0]*t[0]+t[1]*t[1]+t[2]*t[2],n=t[4]*t[4]+t[5]*t[5]+t[6]*t[6],s=t[8]*t[8]+t[9]*t[9]+t[10]*t[10];return Math.sqrt(Math.max(e,n,s))}makeTranslation(t,e,n){return t.isVector3?this.set(1,0,0,t.x,0,1,0,t.y,0,0,1,t.z,0,0,0,1):this.set(1,0,0,t,0,1,0,e,0,0,1,n,0,0,0,1),this}makeRotationX(t){let e=Math.cos(t),n=Math.sin(t);return this.set(1,0,0,0,0,e,-n,0,0,n,e,0,0,0,0,1),this}makeRotationY(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,0,n,0,0,1,0,0,-n,0,e,0,0,0,0,1),this}makeRotationZ(t){let e=Math.cos(t),n=Math.sin(t);return this.set(e,-n,0,0,n,e,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(t,e){let n=Math.cos(e),s=Math.sin(e),r=1-n,a=t.x,o=t.y,l=t.z,c=r*a,h=r*o;return this.set(c*a+n,c*o-s*l,c*l+s*o,0,c*o+s*l,h*o+n,h*l-s*a,0,c*l-s*o,h*l+s*a,r*l*l+n,0,0,0,0,1),this}makeScale(t,e,n){return this.set(t,0,0,0,0,e,0,0,0,0,n,0,0,0,0,1),this}makeShear(t,e,n,s,r,a){return this.set(1,n,r,0,t,1,a,0,e,s,1,0,0,0,0,1),this}compose(t,e,n){let s=this.elements,r=e._x,a=e._y,o=e._z,l=e._w,c=r+r,h=a+a,u=o+o,f=r*c,d=r*h,g=r*u,b=a*h,p=a*u,m=o*u,_=l*c,y=l*h,v=l*u,w=n.x,S=n.y,A=n.z;return s[0]=(1-(b+m))*w,s[1]=(d+v)*w,s[2]=(g-y)*w,s[3]=0,s[4]=(d-v)*S,s[5]=(1-(f+m))*S,s[6]=(p+_)*S,s[7]=0,s[8]=(g+y)*A,s[9]=(p-_)*A,s[10]=(1-(f+b))*A,s[11]=0,s[12]=t.x,s[13]=t.y,s[14]=t.z,s[15]=1,this}decompose(t,e,n){let s=this.elements,r=Qr.set(s[0],s[1],s[2]).length(),a=Qr.set(s[4],s[5],s[6]).length(),o=Qr.set(s[8],s[9],s[10]).length();this.determinant()<0&&(r=-r),t.x=s[12],t.y=s[13],t.z=s[14],pi.copy(this);let c=1/r,h=1/a,u=1/o;return pi.elements[0]*=c,pi.elements[1]*=c,pi.elements[2]*=c,pi.elements[4]*=h,pi.elements[5]*=h,pi.elements[6]*=h,pi.elements[8]*=u,pi.elements[9]*=u,pi.elements[10]*=u,e.setFromRotationMatrix(pi),n.x=r,n.y=a,n.z=o,this}makePerspective(t,e,n,s,r,a,o=ns){let l=this.elements,c=2*r/(e-t),h=2*r/(n-s),u=(e+t)/(e-t),f=(n+s)/(n-s),d,g;if(o===ns)d=-(a+r)/(a-r),g=-2*a*r/(a-r);else if(o===ec)d=-a/(a-r),g=-a*r/(a-r);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=c,l[4]=0,l[8]=u,l[12]=0,l[1]=0,l[5]=h,l[9]=f,l[13]=0,l[2]=0,l[6]=0,l[10]=d,l[14]=g,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(t,e,n,s,r,a,o=ns){let l=this.elements,c=1/(e-t),h=1/(n-s),u=1/(a-r),f=(e+t)*c,d=(n+s)*h,g,b;if(o===ns)g=(a+r)*u,b=-2*u;else if(o===ec)g=r*u,b=-1*u;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=2*c,l[4]=0,l[8]=0,l[12]=-f,l[1]=0,l[5]=2*h,l[9]=0,l[13]=-d,l[2]=0,l[6]=0,l[10]=b,l[14]=-g,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(t){let e=this.elements,n=t.elements;for(let s=0;s<16;s++)if(e[s]!==n[s])return!1;return!0}fromArray(t,e=0){for(let n=0;n<16;n++)this.elements[n]=t[n+e];return this}toArray(t=[],e=0){let n=this.elements;return t[e]=n[0],t[e+1]=n[1],t[e+2]=n[2],t[e+3]=n[3],t[e+4]=n[4],t[e+5]=n[5],t[e+6]=n[6],t[e+7]=n[7],t[e+8]=n[8],t[e+9]=n[9],t[e+10]=n[10],t[e+11]=n[11],t[e+12]=n[12],t[e+13]=n[13],t[e+14]=n[14],t[e+15]=n[15],t}},Qr=new V,pi=new ve,kv=new V(0,0,0),Rv=new V(1,1,1),Ts=new V,Ll=new V,Hn=new V,Zm=new ve,Jm=new Ds,rs=class i{constructor(t=0,e=0,n=0,s=i.DEFAULT_ORDER){this.isEuler=!0,this._x=t,this._y=e,this._z=n,this._order=s}get x(){return this._x}set x(t){this._x=t,this._onChangeCallback()}get y(){return this._y}set y(t){this._y=t,this._onChangeCallback()}get z(){return this._z}set z(t){this._z=t,this._onChangeCallback()}get order(){return this._order}set order(t){this._order=t,this._onChangeCallback()}set(t,e,n,s=this._order){return this._x=t,this._y=e,this._z=n,this._order=s,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(t){return this._x=t._x,this._y=t._y,this._z=t._z,this._order=t._order,this._onChangeCallback(),this}setFromRotationMatrix(t,e=this._order,n=!0){let s=t.elements,r=s[0],a=s[4],o=s[8],l=s[1],c=s[5],h=s[9],u=s[2],f=s[6],d=s[10];switch(e){case"XYZ":this._y=Math.asin(In(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-h,d),this._z=Math.atan2(-a,r)):(this._x=Math.atan2(f,c),this._z=0);break;case"YXZ":this._x=Math.asin(-In(h,-1,1)),Math.abs(h)<.9999999?(this._y=Math.atan2(o,d),this._z=Math.atan2(l,c)):(this._y=Math.atan2(-u,r),this._z=0);break;case"ZXY":this._x=Math.asin(In(f,-1,1)),Math.abs(f)<.9999999?(this._y=Math.atan2(-u,d),this._z=Math.atan2(-a,c)):(this._y=0,this._z=Math.atan2(l,r));break;case"ZYX":this._y=Math.asin(-In(u,-1,1)),Math.abs(u)<.9999999?(this._x=Math.atan2(f,d),this._z=Math.atan2(l,r)):(this._x=0,this._z=Math.atan2(-a,c));break;case"YZX":this._z=Math.asin(In(l,-1,1)),Math.abs(l)<.9999999?(this._x=Math.atan2(-h,c),this._y=Math.atan2(-u,r)):(this._x=0,this._y=Math.atan2(o,d));break;case"XZY":this._z=Math.asin(-In(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(f,c),this._y=Math.atan2(o,r)):(this._x=Math.atan2(-h,d),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+e)}return this._order=e,n===!0&&this._onChangeCallback(),this}setFromQuaternion(t,e,n){return Zm.makeRotationFromQuaternion(t),this.setFromRotationMatrix(Zm,e,n)}setFromVector3(t,e=this._order){return this.set(t.x,t.y,t.z,e)}reorder(t){return Jm.setFromEuler(this),this.setFromQuaternion(Jm,t)}equals(t){return t._x===this._x&&t._y===this._y&&t._z===this._z&&t._order===this._order}fromArray(t){return this._x=t[0],this._y=t[1],this._z=t[2],t[3]!==void 0&&(this._order=t[3]),this._onChangeCallback(),this}toArray(t=[],e=0){return t[e]=this._x,t[e+1]=this._y,t[e+2]=this._z,t[e+3]=this._order,t}_onChange(t){return this._onChangeCallback=t,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}};rs.DEFAULT_ORDER="XYZ";var ac=class{constructor(){this.mask=1}set(t){this.mask=(1<<t|0)>>>0}enable(t){this.mask|=1<<t|0}enableAll(){this.mask=-1}toggle(t){this.mask^=1<<t|0}disable(t){this.mask&=~(1<<t|0)}disableAll(){this.mask=0}test(t){return(this.mask&t.mask)!==0}isEnabled(t){return(this.mask&(1<<t|0))!==0}},Lv=0,jm=new V,to=new Ds,Zi=new ve,Pl=new V,ba=new V,Pv=new V,Iv=new Ds,Qm=new V(1,0,0),t0=new V(0,1,0),e0=new V(0,0,1),Dv={type:"added"},Uv={type:"removed"},Tu={type:"childadded",child:null},Cu={type:"childremoved",child:null},si=class i extends Is{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Lv++}),this.uuid=Aa(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=i.DEFAULT_UP.clone();let t=new V,e=new rs,n=new Ds,s=new V(1,1,1);function r(){n.setFromEuler(e,!1)}function a(){e.setFromQuaternion(n,void 0,!1)}e._onChange(r),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:t},rotation:{configurable:!0,enumerable:!0,value:e},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:s},modelViewMatrix:{value:new ve},normalMatrix:{value:new te}}),this.matrix=new ve,this.matrixWorld=new ve,this.matrixAutoUpdate=i.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=i.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new ac,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(t){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(t),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(t){return this.quaternion.premultiply(t),this}setRotationFromAxisAngle(t,e){this.quaternion.setFromAxisAngle(t,e)}setRotationFromEuler(t){this.quaternion.setFromEuler(t,!0)}setRotationFromMatrix(t){this.quaternion.setFromRotationMatrix(t)}setRotationFromQuaternion(t){this.quaternion.copy(t)}rotateOnAxis(t,e){return to.setFromAxisAngle(t,e),this.quaternion.multiply(to),this}rotateOnWorldAxis(t,e){return to.setFromAxisAngle(t,e),this.quaternion.premultiply(to),this}rotateX(t){return this.rotateOnAxis(Qm,t)}rotateY(t){return this.rotateOnAxis(t0,t)}rotateZ(t){return this.rotateOnAxis(e0,t)}translateOnAxis(t,e){return jm.copy(t).applyQuaternion(this.quaternion),this.position.add(jm.multiplyScalar(e)),this}translateX(t){return this.translateOnAxis(Qm,t)}translateY(t){return this.translateOnAxis(t0,t)}translateZ(t){return this.translateOnAxis(e0,t)}localToWorld(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(this.matrixWorld)}worldToLocal(t){return this.updateWorldMatrix(!0,!1),t.applyMatrix4(Zi.copy(this.matrixWorld).invert())}lookAt(t,e,n){t.isVector3?Pl.copy(t):Pl.set(t,e,n);let s=this.parent;this.updateWorldMatrix(!0,!1),ba.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?Zi.lookAt(ba,Pl,this.up):Zi.lookAt(Pl,ba,this.up),this.quaternion.setFromRotationMatrix(Zi),s&&(Zi.extractRotation(s.matrixWorld),to.setFromRotationMatrix(Zi),this.quaternion.premultiply(to.invert()))}add(t){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.add(arguments[e]);return this}return t===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",t),this):(t&&t.isObject3D?(t.parent!==null&&t.parent.remove(t),t.parent=this,this.children.push(t),t.dispatchEvent(Dv),Tu.child=t,this.dispatchEvent(Tu),Tu.child=null):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",t),this)}remove(t){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}let e=this.children.indexOf(t);return e!==-1&&(t.parent=null,this.children.splice(e,1),t.dispatchEvent(Uv),Cu.child=t,this.dispatchEvent(Cu),Cu.child=null),this}removeFromParent(){let t=this.parent;return t!==null&&t.remove(this),this}clear(){return this.remove(...this.children)}attach(t){return this.updateWorldMatrix(!0,!1),Zi.copy(this.matrixWorld).invert(),t.parent!==null&&(t.parent.updateWorldMatrix(!0,!1),Zi.multiply(t.parent.matrixWorld)),t.applyMatrix4(Zi),this.add(t),t.updateWorldMatrix(!1,!0),this}getObjectById(t){return this.getObjectByProperty("id",t)}getObjectByName(t){return this.getObjectByProperty("name",t)}getObjectByProperty(t,e){if(this[t]===e)return this;for(let n=0,s=this.children.length;n<s;n++){let a=this.children[n].getObjectByProperty(t,e);if(a!==void 0)return a}}getObjectsByProperty(t,e,n=[]){this[t]===e&&n.push(this);let s=this.children;for(let r=0,a=s.length;r<a;r++)s[r].getObjectsByProperty(t,e,n);return n}getWorldPosition(t){return this.updateWorldMatrix(!0,!1),t.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ba,t,Pv),t}getWorldScale(t){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(ba,Iv,t),t}getWorldDirection(t){this.updateWorldMatrix(!0,!1);let e=this.matrixWorld.elements;return t.set(e[8],e[9],e[10]).normalize()}raycast(){}traverse(t){t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverse(t)}traverseVisible(t){if(this.visible===!1)return;t(this);let e=this.children;for(let n=0,s=e.length;n<s;n++)e[n].traverseVisible(t)}traverseAncestors(t){let e=this.parent;e!==null&&(t(e),e.traverseAncestors(t))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(t){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||t)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,t=!0);let e=this.children;for(let n=0,s=e.length;n<s;n++){let r=e[n];(r.matrixWorldAutoUpdate===!0||t===!0)&&r.updateMatrixWorld(t)}}updateWorldMatrix(t,e){let n=this.parent;if(t===!0&&n!==null&&n.matrixWorldAutoUpdate===!0&&n.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),e===!0){let s=this.children;for(let r=0,a=s.length;r<a;r++){let o=s[r];o.matrixWorldAutoUpdate===!0&&o.updateWorldMatrix(!1,!0)}}}toJSON(t){let e=t===void 0||typeof t=="string",n={};e&&(t={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});let s={};s.uuid=this.uuid,s.type=this.type,this.name!==""&&(s.name=this.name),this.castShadow===!0&&(s.castShadow=!0),this.receiveShadow===!0&&(s.receiveShadow=!0),this.visible===!1&&(s.visible=!1),this.frustumCulled===!1&&(s.frustumCulled=!1),this.renderOrder!==0&&(s.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(s.userData=this.userData),s.layers=this.layers.mask,s.matrix=this.matrix.toArray(),s.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(s.matrixAutoUpdate=!1),this.isInstancedMesh&&(s.type="InstancedMesh",s.count=this.count,s.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(s.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(s.type="BatchedMesh",s.perObjectFrustumCulled=this.perObjectFrustumCulled,s.sortObjects=this.sortObjects,s.drawRanges=this._drawRanges,s.reservedRanges=this._reservedRanges,s.visibility=this._visibility,s.active=this._active,s.bounds=this._bounds.map(o=>({boxInitialized:o.boxInitialized,boxMin:o.box.min.toArray(),boxMax:o.box.max.toArray(),sphereInitialized:o.sphereInitialized,sphereRadius:o.sphere.radius,sphereCenter:o.sphere.center.toArray()})),s.maxGeometryCount=this._maxGeometryCount,s.maxVertexCount=this._maxVertexCount,s.maxIndexCount=this._maxIndexCount,s.geometryInitialized=this._geometryInitialized,s.geometryCount=this._geometryCount,s.matricesTexture=this._matricesTexture.toJSON(t),this.boundingSphere!==null&&(s.boundingSphere={center:s.boundingSphere.center.toArray(),radius:s.boundingSphere.radius}),this.boundingBox!==null&&(s.boundingBox={min:s.boundingBox.min.toArray(),max:s.boundingBox.max.toArray()}));function r(o,l){return o[l.uuid]===void 0&&(o[l.uuid]=l.toJSON(t)),l.uuid}if(this.isScene)this.background&&(this.background.isColor?s.background=this.background.toJSON():this.background.isTexture&&(s.background=this.background.toJSON(t).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(s.environment=this.environment.toJSON(t).uuid);else if(this.isMesh||this.isLine||this.isPoints){s.geometry=r(t.geometries,this.geometry);let o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){let l=o.shapes;if(Array.isArray(l))for(let c=0,h=l.length;c<h;c++){let u=l[c];r(t.shapes,u)}else r(t.shapes,l)}}if(this.isSkinnedMesh&&(s.bindMode=this.bindMode,s.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(r(t.skeletons,this.skeleton),s.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){let o=[];for(let l=0,c=this.material.length;l<c;l++)o.push(r(t.materials,this.material[l]));s.material=o}else s.material=r(t.materials,this.material);if(this.children.length>0){s.children=[];for(let o=0;o<this.children.length;o++)s.children.push(this.children[o].toJSON(t).object)}if(this.animations.length>0){s.animations=[];for(let o=0;o<this.animations.length;o++){let l=this.animations[o];s.animations.push(r(t.animations,l))}}if(e){let o=a(t.geometries),l=a(t.materials),c=a(t.textures),h=a(t.images),u=a(t.shapes),f=a(t.skeletons),d=a(t.animations),g=a(t.nodes);o.length>0&&(n.geometries=o),l.length>0&&(n.materials=l),c.length>0&&(n.textures=c),h.length>0&&(n.images=h),u.length>0&&(n.shapes=u),f.length>0&&(n.skeletons=f),d.length>0&&(n.animations=d),g.length>0&&(n.nodes=g)}return n.object=s,n;function a(o){let l=[];for(let c in o){let h=o[c];delete h.metadata,l.push(h)}return l}}clone(t){return new this.constructor().copy(this,t)}copy(t,e=!0){if(this.name=t.name,this.up.copy(t.up),this.position.copy(t.position),this.rotation.order=t.rotation.order,this.quaternion.copy(t.quaternion),this.scale.copy(t.scale),this.matrix.copy(t.matrix),this.matrixWorld.copy(t.matrixWorld),this.matrixAutoUpdate=t.matrixAutoUpdate,this.matrixWorldAutoUpdate=t.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=t.matrixWorldNeedsUpdate,this.layers.mask=t.layers.mask,this.visible=t.visible,this.castShadow=t.castShadow,this.receiveShadow=t.receiveShadow,this.frustumCulled=t.frustumCulled,this.renderOrder=t.renderOrder,this.animations=t.animations.slice(),this.userData=JSON.parse(JSON.stringify(t.userData)),e===!0)for(let n=0;n<t.children.length;n++){let s=t.children[n];this.add(s.clone())}return this}};si.DEFAULT_UP=new V(0,1,0);si.DEFAULT_MATRIX_AUTO_UPDATE=!0;si.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;var mi=new V,Ji=new V,ku=new V,ji=new V,eo=new V,no=new V,n0=new V,Ru=new V,Lu=new V,Pu=new V,ho=class i{constructor(t=new V,e=new V,n=new V){this.a=t,this.b=e,this.c=n}static getNormal(t,e,n,s){s.subVectors(n,e),mi.subVectors(t,e),s.cross(mi);let r=s.lengthSq();return r>0?s.multiplyScalar(1/Math.sqrt(r)):s.set(0,0,0)}static getBarycoord(t,e,n,s,r){mi.subVectors(s,e),Ji.subVectors(n,e),ku.subVectors(t,e);let a=mi.dot(mi),o=mi.dot(Ji),l=mi.dot(ku),c=Ji.dot(Ji),h=Ji.dot(ku),u=a*c-o*o;if(u===0)return r.set(0,0,0),null;let f=1/u,d=(c*l-o*h)*f,g=(a*h-o*l)*f;return r.set(1-d-g,g,d)}static containsPoint(t,e,n,s){return this.getBarycoord(t,e,n,s,ji)===null?!1:ji.x>=0&&ji.y>=0&&ji.x+ji.y<=1}static getInterpolation(t,e,n,s,r,a,o,l){return this.getBarycoord(t,e,n,s,ji)===null?(l.x=0,l.y=0,"z"in l&&(l.z=0),"w"in l&&(l.w=0),null):(l.setScalar(0),l.addScaledVector(r,ji.x),l.addScaledVector(a,ji.y),l.addScaledVector(o,ji.z),l)}static isFrontFacing(t,e,n,s){return mi.subVectors(n,e),Ji.subVectors(t,e),mi.cross(Ji).dot(s)<0}set(t,e,n){return this.a.copy(t),this.b.copy(e),this.c.copy(n),this}setFromPointsAndIndices(t,e,n,s){return this.a.copy(t[e]),this.b.copy(t[n]),this.c.copy(t[s]),this}setFromAttributeAndIndices(t,e,n,s){return this.a.fromBufferAttribute(t,e),this.b.fromBufferAttribute(t,n),this.c.fromBufferAttribute(t,s),this}clone(){return new this.constructor().copy(this)}copy(t){return this.a.copy(t.a),this.b.copy(t.b),this.c.copy(t.c),this}getArea(){return mi.subVectors(this.c,this.b),Ji.subVectors(this.a,this.b),mi.cross(Ji).length()*.5}getMidpoint(t){return t.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(t){return i.getNormal(this.a,this.b,this.c,t)}getPlane(t){return t.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(t,e){return i.getBarycoord(t,this.a,this.b,this.c,e)}getInterpolation(t,e,n,s,r){return i.getInterpolation(t,this.a,this.b,this.c,e,n,s,r)}containsPoint(t){return i.containsPoint(t,this.a,this.b,this.c)}isFrontFacing(t){return i.isFrontFacing(this.a,this.b,this.c,t)}intersectsBox(t){return t.intersectsTriangle(this)}closestPointToPoint(t,e){let n=this.a,s=this.b,r=this.c,a,o;eo.subVectors(s,n),no.subVectors(r,n),Ru.subVectors(t,n);let l=eo.dot(Ru),c=no.dot(Ru);if(l<=0&&c<=0)return e.copy(n);Lu.subVectors(t,s);let h=eo.dot(Lu),u=no.dot(Lu);if(h>=0&&u<=h)return e.copy(s);let f=l*u-h*c;if(f<=0&&l>=0&&h<=0)return a=l/(l-h),e.copy(n).addScaledVector(eo,a);Pu.subVectors(t,r);let d=eo.dot(Pu),g=no.dot(Pu);if(g>=0&&d<=g)return e.copy(r);let b=d*c-l*g;if(b<=0&&c>=0&&g<=0)return o=c/(c-g),e.copy(n).addScaledVector(no,o);let p=h*g-d*u;if(p<=0&&u-h>=0&&d-g>=0)return n0.subVectors(r,s),o=(u-h)/(u-h+(d-g)),e.copy(s).addScaledVector(n0,o);let m=1/(p+b+f);return a=b*m,o=f*m,e.copy(n).addScaledVector(eo,a).addScaledVector(no,o)}equals(t){return t.a.equals(this.a)&&t.b.equals(this.b)&&t.c.equals(this.c)}},X0={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Cs={h:0,s:0,l:0},Il={h:0,s:0,l:0};function Iu(i,t,e){return e<0&&(e+=1),e>1&&(e-=1),e<1/6?i+(t-i)*6*e:e<1/2?t:e<2/3?i+(t-i)*6*(2/3-e):i}var Nt=class{constructor(t,e,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(t,e,n)}set(t,e,n){if(e===void 0&&n===void 0){let s=t;s&&s.isColor?this.copy(s):typeof s=="number"?this.setHex(s):typeof s=="string"&&this.setStyle(s)}else this.setRGB(t,e,n);return this}setScalar(t){return this.r=t,this.g=t,this.b=t,this}setHex(t,e=Pi){return t=Math.floor(t),this.r=(t>>16&255)/255,this.g=(t>>8&255)/255,this.b=(t&255)/255,he.toWorkingColorSpace(this,e),this}setRGB(t,e,n,s=he.workingColorSpace){return this.r=t,this.g=e,this.b=n,he.toWorkingColorSpace(this,s),this}setHSL(t,e,n,s=he.workingColorSpace){if(t=wv(t,1),e=In(e,0,1),n=In(n,0,1),e===0)this.r=this.g=this.b=n;else{let r=n<=.5?n*(1+e):n+e-n*e,a=2*n-r;this.r=Iu(a,r,t+1/3),this.g=Iu(a,r,t),this.b=Iu(a,r,t-1/3)}return he.toWorkingColorSpace(this,s),this}setStyle(t,e=Pi){function n(r){r!==void 0&&parseFloat(r)<1&&console.warn("THREE.Color: Alpha component of "+t+" will be ignored.")}let s;if(s=/^(\w+)\(([^\)]*)\)/.exec(t)){let r,a=s[1],o=s[2];switch(a){case"rgb":case"rgba":if(r=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(255,parseInt(r[1],10))/255,Math.min(255,parseInt(r[2],10))/255,Math.min(255,parseInt(r[3],10))/255,e);if(r=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setRGB(Math.min(100,parseInt(r[1],10))/100,Math.min(100,parseInt(r[2],10))/100,Math.min(100,parseInt(r[3],10))/100,e);break;case"hsl":case"hsla":if(r=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(o))return n(r[4]),this.setHSL(parseFloat(r[1])/360,parseFloat(r[2])/100,parseFloat(r[3])/100,e);break;default:console.warn("THREE.Color: Unknown color model "+t)}}else if(s=/^\#([A-Fa-f\d]+)$/.exec(t)){let r=s[1],a=r.length;if(a===3)return this.setRGB(parseInt(r.charAt(0),16)/15,parseInt(r.charAt(1),16)/15,parseInt(r.charAt(2),16)/15,e);if(a===6)return this.setHex(parseInt(r,16),e);console.warn("THREE.Color: Invalid hex color "+t)}else if(t&&t.length>0)return this.setColorName(t,e);return this}setColorName(t,e=Pi){let n=X0[t.toLowerCase()];return n!==void 0?this.setHex(n,e):console.warn("THREE.Color: Unknown color "+t),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(t){return this.r=t.r,this.g=t.g,this.b=t.b,this}copySRGBToLinear(t){return this.r=po(t.r),this.g=po(t.g),this.b=po(t.b),this}copyLinearToSRGB(t){return this.r=_u(t.r),this.g=_u(t.g),this.b=_u(t.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(t=Pi){return he.fromWorkingColorSpace(dn.copy(this),t),Math.round(In(dn.r*255,0,255))*65536+Math.round(In(dn.g*255,0,255))*256+Math.round(In(dn.b*255,0,255))}getHexString(t=Pi){return("000000"+this.getHex(t).toString(16)).slice(-6)}getHSL(t,e=he.workingColorSpace){he.fromWorkingColorSpace(dn.copy(this),e);let n=dn.r,s=dn.g,r=dn.b,a=Math.max(n,s,r),o=Math.min(n,s,r),l,c,h=(o+a)/2;if(o===a)l=0,c=0;else{let u=a-o;switch(c=h<=.5?u/(a+o):u/(2-a-o),a){case n:l=(s-r)/u+(s<r?6:0);break;case s:l=(r-n)/u+2;break;case r:l=(n-s)/u+4;break}l/=6}return t.h=l,t.s=c,t.l=h,t}getRGB(t,e=he.workingColorSpace){return he.fromWorkingColorSpace(dn.copy(this),e),t.r=dn.r,t.g=dn.g,t.b=dn.b,t}getStyle(t=Pi){he.fromWorkingColorSpace(dn.copy(this),t);let e=dn.r,n=dn.g,s=dn.b;return t!==Pi?`color(${t} ${e.toFixed(3)} ${n.toFixed(3)} ${s.toFixed(3)})`:`rgb(${Math.round(e*255)},${Math.round(n*255)},${Math.round(s*255)})`}offsetHSL(t,e,n){return this.getHSL(Cs),this.setHSL(Cs.h+t,Cs.s+e,Cs.l+n)}add(t){return this.r+=t.r,this.g+=t.g,this.b+=t.b,this}addColors(t,e){return this.r=t.r+e.r,this.g=t.g+e.g,this.b=t.b+e.b,this}addScalar(t){return this.r+=t,this.g+=t,this.b+=t,this}sub(t){return this.r=Math.max(0,this.r-t.r),this.g=Math.max(0,this.g-t.g),this.b=Math.max(0,this.b-t.b),this}multiply(t){return this.r*=t.r,this.g*=t.g,this.b*=t.b,this}multiplyScalar(t){return this.r*=t,this.g*=t,this.b*=t,this}lerp(t,e){return this.r+=(t.r-this.r)*e,this.g+=(t.g-this.g)*e,this.b+=(t.b-this.b)*e,this}lerpColors(t,e,n){return this.r=t.r+(e.r-t.r)*n,this.g=t.g+(e.g-t.g)*n,this.b=t.b+(e.b-t.b)*n,this}lerpHSL(t,e){this.getHSL(Cs),t.getHSL(Il);let n=bu(Cs.h,Il.h,e),s=bu(Cs.s,Il.s,e),r=bu(Cs.l,Il.l,e);return this.setHSL(n,s,r),this}setFromVector3(t){return this.r=t.x,this.g=t.y,this.b=t.z,this}applyMatrix3(t){let e=this.r,n=this.g,s=this.b,r=t.elements;return this.r=r[0]*e+r[3]*n+r[6]*s,this.g=r[1]*e+r[4]*n+r[7]*s,this.b=r[2]*e+r[5]*n+r[8]*s,this}equals(t){return t.r===this.r&&t.g===this.g&&t.b===this.b}fromArray(t,e=0){return this.r=t[e],this.g=t[e+1],this.b=t[e+2],this}toArray(t=[],e=0){return t[e]=this.r,t[e+1]=this.g,t[e+2]=this.b,t}fromBufferAttribute(t,e){return this.r=t.getX(e),this.g=t.getY(e),this.b=t.getZ(e),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}},dn=new Nt;Nt.NAMES=X0;var Nv=0,_r=class extends Is{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Nv++}),this.uuid=Aa(),this.name="",this.type="Material",this.blending=is,this.side=fn,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=Gu,this.blendDst=Wu,this.blendEquation=dr,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new Nt(0,0,0),this.blendAlpha=0,this.depthFunc=Kl,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Gm,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Yr,this.stencilZFail=Yr,this.stencilZPass=Yr,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(t){this._alphaTest>0!=t>0&&this.version++,this._alphaTest=t}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(t){if(t!==void 0)for(let e in t){let n=t[e];if(n===void 0){console.warn(`THREE.Material: parameter '${e}' has value of undefined.`);continue}let s=this[e];if(s===void 0){console.warn(`THREE.Material: '${e}' is not a property of THREE.${this.type}.`);continue}s&&s.isColor?s.set(n):s&&s.isVector3&&n&&n.isVector3?s.copy(n):this[e]=n}}toJSON(t){let e=t===void 0||typeof t=="string";e&&(t={textures:{},images:{}});let n={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&this.emissiveIntensity!==1&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(t).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(t).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(t).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(n.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(t).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(t).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(t).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(t).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(t).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(t).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(t).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(t).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(t).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(t).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(t).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(t).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(t).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(t).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(t).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(t).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(t).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(t).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(t).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(t).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(t).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.shadowSide!==null&&(n.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),this.blending!==is&&(n.blending=this.blending),this.side!==fn&&(n.side=this.side),this.vertexColors===!0&&(n.vertexColors=!0),this.opacity<1&&(n.opacity=this.opacity),this.transparent===!0&&(n.transparent=!0),this.blendSrc!==Gu&&(n.blendSrc=this.blendSrc),this.blendDst!==Wu&&(n.blendDst=this.blendDst),this.blendEquation!==dr&&(n.blendEquation=this.blendEquation),this.blendSrcAlpha!==null&&(n.blendSrcAlpha=this.blendSrcAlpha),this.blendDstAlpha!==null&&(n.blendDstAlpha=this.blendDstAlpha),this.blendEquationAlpha!==null&&(n.blendEquationAlpha=this.blendEquationAlpha),this.blendColor&&this.blendColor.isColor&&(n.blendColor=this.blendColor.getHex()),this.blendAlpha!==0&&(n.blendAlpha=this.blendAlpha),this.depthFunc!==Kl&&(n.depthFunc=this.depthFunc),this.depthTest===!1&&(n.depthTest=this.depthTest),this.depthWrite===!1&&(n.depthWrite=this.depthWrite),this.colorWrite===!1&&(n.colorWrite=this.colorWrite),this.stencilWriteMask!==255&&(n.stencilWriteMask=this.stencilWriteMask),this.stencilFunc!==Gm&&(n.stencilFunc=this.stencilFunc),this.stencilRef!==0&&(n.stencilRef=this.stencilRef),this.stencilFuncMask!==255&&(n.stencilFuncMask=this.stencilFuncMask),this.stencilFail!==Yr&&(n.stencilFail=this.stencilFail),this.stencilZFail!==Yr&&(n.stencilZFail=this.stencilZFail),this.stencilZPass!==Yr&&(n.stencilZPass=this.stencilZPass),this.stencilWrite===!0&&(n.stencilWrite=this.stencilWrite),this.rotation!==void 0&&this.rotation!==0&&(n.rotation=this.rotation),this.polygonOffset===!0&&(n.polygonOffset=!0),this.polygonOffsetFactor!==0&&(n.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(n.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(n.linewidth=this.linewidth),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.dithering===!0&&(n.dithering=!0),this.alphaTest>0&&(n.alphaTest=this.alphaTest),this.alphaHash===!0&&(n.alphaHash=!0),this.alphaToCoverage===!0&&(n.alphaToCoverage=!0),this.premultipliedAlpha===!0&&(n.premultipliedAlpha=!0),this.forceSinglePass===!0&&(n.forceSinglePass=!0),this.wireframe===!0&&(n.wireframe=!0),this.wireframeLinewidth>1&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(n.flatShading=!0),this.visible===!1&&(n.visible=!1),this.toneMapped===!1&&(n.toneMapped=!1),this.fog===!1&&(n.fog=!1),Object.keys(this.userData).length>0&&(n.userData=this.userData);function s(r){let a=[];for(let o in r){let l=r[o];delete l.metadata,a.push(l)}return a}if(e){let r=s(t.textures),a=s(t.images);r.length>0&&(n.textures=r),a.length>0&&(n.images=a)}return n}clone(){return new this.constructor().copy(this)}copy(t){this.name=t.name,this.blending=t.blending,this.side=t.side,this.vertexColors=t.vertexColors,this.opacity=t.opacity,this.transparent=t.transparent,this.blendSrc=t.blendSrc,this.blendDst=t.blendDst,this.blendEquation=t.blendEquation,this.blendSrcAlpha=t.blendSrcAlpha,this.blendDstAlpha=t.blendDstAlpha,this.blendEquationAlpha=t.blendEquationAlpha,this.blendColor.copy(t.blendColor),this.blendAlpha=t.blendAlpha,this.depthFunc=t.depthFunc,this.depthTest=t.depthTest,this.depthWrite=t.depthWrite,this.stencilWriteMask=t.stencilWriteMask,this.stencilFunc=t.stencilFunc,this.stencilRef=t.stencilRef,this.stencilFuncMask=t.stencilFuncMask,this.stencilFail=t.stencilFail,this.stencilZFail=t.stencilZFail,this.stencilZPass=t.stencilZPass,this.stencilWrite=t.stencilWrite;let e=t.clippingPlanes,n=null;if(e!==null){let s=e.length;n=new Array(s);for(let r=0;r!==s;++r)n[r]=e[r].clone()}return this.clippingPlanes=n,this.clipIntersection=t.clipIntersection,this.clipShadows=t.clipShadows,this.shadowSide=t.shadowSide,this.colorWrite=t.colorWrite,this.precision=t.precision,this.polygonOffset=t.polygonOffset,this.polygonOffsetFactor=t.polygonOffsetFactor,this.polygonOffsetUnits=t.polygonOffsetUnits,this.dithering=t.dithering,this.alphaTest=t.alphaTest,this.alphaHash=t.alphaHash,this.alphaToCoverage=t.alphaToCoverage,this.premultipliedAlpha=t.premultipliedAlpha,this.forceSinglePass=t.forceSinglePass,this.visible=t.visible,this.toneMapped=t.toneMapped,this.userData=JSON.parse(JSON.stringify(t.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(t){t===!0&&this.version++}},lc=class extends _r{constructor(t){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new Nt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new rs,this.combine=D0,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.lightMap=t.lightMap,this.lightMapIntensity=t.lightMapIntensity,this.aoMap=t.aoMap,this.aoMapIntensity=t.aoMapIntensity,this.specularMap=t.specularMap,this.alphaMap=t.alphaMap,this.envMap=t.envMap,this.envMapRotation.copy(t.envMapRotation),this.combine=t.combine,this.reflectivity=t.reflectivity,this.refractionRatio=t.refractionRatio,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.wireframeLinecap=t.wireframeLinecap,this.wireframeLinejoin=t.wireframeLinejoin,this.fog=t.fog,this}};var Fe=new V,Dl=new qt,Vt=class{constructor(t,e,n=!1){if(Array.isArray(t))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=t,this.itemSize=e,this.count=t!==void 0?t.length/e:0,this.normalized=n,this.usage=Wm,this._updateRange={offset:0,count:-1},this.updateRanges=[],this.gpuType=es,this.version=0}onUploadCallback(){}set needsUpdate(t){t===!0&&this.version++}get updateRange(){return Sv("THREE.BufferAttribute: updateRange() is deprecated and will be removed in r169. Use addUpdateRange() instead."),this._updateRange}setUsage(t){return this.usage=t,this}addUpdateRange(t,e){this.updateRanges.push({start:t,count:e})}clearUpdateRanges(){this.updateRanges.length=0}copy(t){return this.name=t.name,this.array=new t.array.constructor(t.array),this.itemSize=t.itemSize,this.count=t.count,this.normalized=t.normalized,this.usage=t.usage,this.gpuType=t.gpuType,this}copyAt(t,e,n){t*=this.itemSize,n*=e.itemSize;for(let s=0,r=this.itemSize;s<r;s++)this.array[t+s]=e.array[n+s];return this}copyArray(t){return this.array.set(t),this}applyMatrix3(t){if(this.itemSize===2)for(let e=0,n=this.count;e<n;e++)Dl.fromBufferAttribute(this,e),Dl.applyMatrix3(t),this.setXY(e,Dl.x,Dl.y);else if(this.itemSize===3)for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyMatrix3(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}applyMatrix4(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyMatrix4(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}applyNormalMatrix(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.applyNormalMatrix(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}transformDirection(t){for(let e=0,n=this.count;e<n;e++)Fe.fromBufferAttribute(this,e),Fe.transformDirection(t),this.setXYZ(e,Fe.x,Fe.y,Fe.z);return this}set(t,e=0){return this.array.set(t,e),this}getComponent(t,e){let n=this.array[t*this.itemSize+e];return this.normalized&&(n=pa(n,this.array)),n}setComponent(t,e,n){return this.normalized&&(n=Ln(n,this.array)),this.array[t*this.itemSize+e]=n,this}getX(t){let e=this.array[t*this.itemSize];return this.normalized&&(e=pa(e,this.array)),e}setX(t,e){return this.normalized&&(e=Ln(e,this.array)),this.array[t*this.itemSize]=e,this}getY(t){let e=this.array[t*this.itemSize+1];return this.normalized&&(e=pa(e,this.array)),e}setY(t,e){return this.normalized&&(e=Ln(e,this.array)),this.array[t*this.itemSize+1]=e,this}getZ(t){let e=this.array[t*this.itemSize+2];return this.normalized&&(e=pa(e,this.array)),e}setZ(t,e){return this.normalized&&(e=Ln(e,this.array)),this.array[t*this.itemSize+2]=e,this}getW(t){let e=this.array[t*this.itemSize+3];return this.normalized&&(e=pa(e,this.array)),e}setW(t,e){return this.normalized&&(e=Ln(e,this.array)),this.array[t*this.itemSize+3]=e,this}setXY(t,e,n){return t*=this.itemSize,this.normalized&&(e=Ln(e,this.array),n=Ln(n,this.array)),this.array[t+0]=e,this.array[t+1]=n,this}setXYZ(t,e,n,s){return t*=this.itemSize,this.normalized&&(e=Ln(e,this.array),n=Ln(n,this.array),s=Ln(s,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this}setXYZW(t,e,n,s,r){return t*=this.itemSize,this.normalized&&(e=Ln(e,this.array),n=Ln(n,this.array),s=Ln(s,this.array),r=Ln(r,this.array)),this.array[t+0]=e,this.array[t+1]=n,this.array[t+2]=s,this.array[t+3]=r,this}onUpload(t){return this.onUploadCallback=t,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){let t={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(t.name=this.name),this.usage!==Wm&&(t.usage=this.usage),t}};var cc=class extends Vt{constructor(t,e,n){super(new Uint16Array(t),e,n)}};var hc=class extends Vt{constructor(t,e,n){super(new Uint32Array(t),e,n)}};var ss=class extends Vt{constructor(t,e,n){super(new Float32Array(t),e,n)}},Bv=0,ni=new ve,Du=new si,io=new V,Gn=new yr,ya=new yr,Je=new V,Re=class i extends Is{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Bv++}),this.uuid=Aa(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(t){return Array.isArray(t)?this.index=new($0(t)?hc:cc)(t,1):this.index=t,this}getAttribute(t){return this.attributes[t]}setAttribute(t,e){return this.attributes[t]=e,this}deleteAttribute(t){return delete this.attributes[t],this}hasAttribute(t){return this.attributes[t]!==void 0}addGroup(t,e,n=0){this.groups.push({start:t,count:e,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(t,e){this.drawRange.start=t,this.drawRange.count=e}applyMatrix4(t){let e=this.attributes.position;e!==void 0&&(e.applyMatrix4(t),e.needsUpdate=!0);let n=this.attributes.normal;if(n!==void 0){let r=new te().getNormalMatrix(t);n.applyNormalMatrix(r),n.needsUpdate=!0}let s=this.attributes.tangent;return s!==void 0&&(s.transformDirection(t),s.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(t){return ni.makeRotationFromQuaternion(t),this.applyMatrix4(ni),this}rotateX(t){return ni.makeRotationX(t),this.applyMatrix4(ni),this}rotateY(t){return ni.makeRotationY(t),this.applyMatrix4(ni),this}rotateZ(t){return ni.makeRotationZ(t),this.applyMatrix4(ni),this}translate(t,e,n){return ni.makeTranslation(t,e,n),this.applyMatrix4(ni),this}scale(t,e,n){return ni.makeScale(t,e,n),this.applyMatrix4(ni),this}lookAt(t){return Du.lookAt(t),Du.updateMatrix(),this.applyMatrix4(Du.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(io).negate(),this.translate(io.x,io.y,io.z),this}setFromPoints(t){let e=[];for(let n=0,s=t.length;n<s;n++){let r=t[n];e.push(r.x,r.y,r.z||0)}return this.setAttribute("position",new ss(e,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new yr);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new V(-1/0,-1/0,-1/0),new V(1/0,1/0,1/0));return}if(t!==void 0){if(this.boundingBox.setFromBufferAttribute(t),e)for(let n=0,s=e.length;n<s;n++){let r=e[n];Gn.setFromBufferAttribute(r),this.morphTargetsRelative?(Je.addVectors(this.boundingBox.min,Gn.min),this.boundingBox.expandByPoint(Je),Je.addVectors(this.boundingBox.max,Gn.max),this.boundingBox.expandByPoint(Je)):(this.boundingBox.expandByPoint(Gn.min),this.boundingBox.expandByPoint(Gn.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ui);let t=this.attributes.position,e=this.morphAttributes.position;if(t&&t.isGLBufferAttribute){console.error("THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new V,1/0);return}if(t){let n=this.boundingSphere.center;if(Gn.setFromBufferAttribute(t),e)for(let r=0,a=e.length;r<a;r++){let o=e[r];ya.setFromBufferAttribute(o),this.morphTargetsRelative?(Je.addVectors(Gn.min,ya.min),Gn.expandByPoint(Je),Je.addVectors(Gn.max,ya.max),Gn.expandByPoint(Je)):(Gn.expandByPoint(ya.min),Gn.expandByPoint(ya.max))}Gn.getCenter(n);let s=0;for(let r=0,a=t.count;r<a;r++)Je.fromBufferAttribute(t,r),s=Math.max(s,n.distanceToSquared(Je));if(e)for(let r=0,a=e.length;r<a;r++){let o=e[r],l=this.morphTargetsRelative;for(let c=0,h=o.count;c<h;c++)Je.fromBufferAttribute(o,c),l&&(io.fromBufferAttribute(t,c),Je.add(io)),s=Math.max(s,n.distanceToSquared(Je))}this.boundingSphere.radius=Math.sqrt(s),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){let t=this.index,e=this.attributes;if(t===null||e.position===void 0||e.normal===void 0||e.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}let n=e.position,s=e.normal,r=e.uv;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Vt(new Float32Array(4*n.count),4));let a=this.getAttribute("tangent"),o=[],l=[];for(let L=0;L<n.count;L++)o[L]=new V,l[L]=new V;let c=new V,h=new V,u=new V,f=new qt,d=new qt,g=new qt,b=new V,p=new V;function m(L,P,M){c.fromBufferAttribute(n,L),h.fromBufferAttribute(n,P),u.fromBufferAttribute(n,M),f.fromBufferAttribute(r,L),d.fromBufferAttribute(r,P),g.fromBufferAttribute(r,M),h.sub(c),u.sub(c),d.sub(f),g.sub(f);let T=1/(d.x*g.y-g.x*d.y);isFinite(T)&&(b.copy(h).multiplyScalar(g.y).addScaledVector(u,-d.y).multiplyScalar(T),p.copy(u).multiplyScalar(d.x).addScaledVector(h,-g.x).multiplyScalar(T),o[L].add(b),o[P].add(b),o[M].add(b),l[L].add(p),l[P].add(p),l[M].add(p))}let _=this.groups;_.length===0&&(_=[{start:0,count:t.count}]);for(let L=0,P=_.length;L<P;++L){let M=_[L],T=M.start,I=M.count;for(let F=T,k=T+I;F<k;F+=3)m(t.getX(F+0),t.getX(F+1),t.getX(F+2))}let y=new V,v=new V,w=new V,S=new V;function A(L){w.fromBufferAttribute(s,L),S.copy(w);let P=o[L];y.copy(P),y.sub(w.multiplyScalar(w.dot(P))).normalize(),v.crossVectors(S,P);let T=v.dot(l[L])<0?-1:1;a.setXYZW(L,y.x,y.y,y.z,T)}for(let L=0,P=_.length;L<P;++L){let M=_[L],T=M.start,I=M.count;for(let F=T,k=T+I;F<k;F+=3)A(t.getX(F+0)),A(t.getX(F+1)),A(t.getX(F+2))}}computeVertexNormals(){let t=this.index,e=this.getAttribute("position");if(e!==void 0){let n=this.getAttribute("normal");if(n===void 0)n=new Vt(new Float32Array(e.count*3),3),this.setAttribute("normal",n);else for(let f=0,d=n.count;f<d;f++)n.setXYZ(f,0,0,0);let s=new V,r=new V,a=new V,o=new V,l=new V,c=new V,h=new V,u=new V;if(t)for(let f=0,d=t.count;f<d;f+=3){let g=t.getX(f+0),b=t.getX(f+1),p=t.getX(f+2);s.fromBufferAttribute(e,g),r.fromBufferAttribute(e,b),a.fromBufferAttribute(e,p),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),o.fromBufferAttribute(n,g),l.fromBufferAttribute(n,b),c.fromBufferAttribute(n,p),o.add(h),l.add(h),c.add(h),n.setXYZ(g,o.x,o.y,o.z),n.setXYZ(b,l.x,l.y,l.z),n.setXYZ(p,c.x,c.y,c.z)}else for(let f=0,d=e.count;f<d;f+=3)s.fromBufferAttribute(e,f+0),r.fromBufferAttribute(e,f+1),a.fromBufferAttribute(e,f+2),h.subVectors(a,r),u.subVectors(s,r),h.cross(u),n.setXYZ(f+0,h.x,h.y,h.z),n.setXYZ(f+1,h.x,h.y,h.z),n.setXYZ(f+2,h.x,h.y,h.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){let t=this.attributes.normal;for(let e=0,n=t.count;e<n;e++)Je.fromBufferAttribute(t,e),Je.normalize(),t.setXYZ(e,Je.x,Je.y,Je.z)}toNonIndexed(){function t(o,l){let c=o.array,h=o.itemSize,u=o.normalized,f=new c.constructor(l.length*h),d=0,g=0;for(let b=0,p=l.length;b<p;b++){o.isInterleavedBufferAttribute?d=l[b]*o.data.stride+o.offset:d=l[b]*h;for(let m=0;m<h;m++)f[g++]=c[d++]}return new Vt(f,h,u)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;let e=new i,n=this.index.array,s=this.attributes;for(let o in s){let l=s[o],c=t(l,n);e.setAttribute(o,c)}let r=this.morphAttributes;for(let o in r){let l=[],c=r[o];for(let h=0,u=c.length;h<u;h++){let f=c[h],d=t(f,n);l.push(d)}e.morphAttributes[o]=l}e.morphTargetsRelative=this.morphTargetsRelative;let a=this.groups;for(let o=0,l=a.length;o<l;o++){let c=a[o];e.addGroup(c.start,c.count,c.materialIndex)}return e}toJSON(){let t={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(t.uuid=this.uuid,t.type=this.type,this.name!==""&&(t.name=this.name),Object.keys(this.userData).length>0&&(t.userData=this.userData),this.parameters!==void 0){let l=this.parameters;for(let c in l)l[c]!==void 0&&(t[c]=l[c]);return t}t.data={attributes:{}};let e=this.index;e!==null&&(t.data.index={type:e.array.constructor.name,array:Array.prototype.slice.call(e.array)});let n=this.attributes;for(let l in n){let c=n[l];t.data.attributes[l]=c.toJSON(t.data)}let s={},r=!1;for(let l in this.morphAttributes){let c=this.morphAttributes[l],h=[];for(let u=0,f=c.length;u<f;u++){let d=c[u];h.push(d.toJSON(t.data))}h.length>0&&(s[l]=h,r=!0)}r&&(t.data.morphAttributes=s,t.data.morphTargetsRelative=this.morphTargetsRelative);let a=this.groups;a.length>0&&(t.data.groups=JSON.parse(JSON.stringify(a)));let o=this.boundingSphere;return o!==null&&(t.data.boundingSphere={center:o.center.toArray(),radius:o.radius}),t}clone(){return new this.constructor().copy(this)}copy(t){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;let e={};this.name=t.name;let n=t.index;n!==null&&this.setIndex(n.clone(e));let s=t.attributes;for(let c in s){let h=s[c];this.setAttribute(c,h.clone(e))}let r=t.morphAttributes;for(let c in r){let h=[],u=r[c];for(let f=0,d=u.length;f<d;f++)h.push(u[f].clone(e));this.morphAttributes[c]=h}this.morphTargetsRelative=t.morphTargetsRelative;let a=t.groups;for(let c=0,h=a.length;c<h;c++){let u=a[c];this.addGroup(u.start,u.count,u.materialIndex)}let o=t.boundingBox;o!==null&&(this.boundingBox=o.clone());let l=t.boundingSphere;return l!==null&&(this.boundingSphere=l.clone()),this.drawRange.start=t.drawRange.start,this.drawRange.count=t.drawRange.count,this.userData=t.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}},i0=new ve,ar=new oc,Ul=new Ui,s0=new V,so=new V,ro=new V,oo=new V,Uu=new V,Nl=new V,Bl=new qt,Fl=new qt,Ol=new qt,r0=new V,o0=new V,a0=new V,zl=new V,Hl=new V,_e=class extends si{constructor(t=new Re,e=new lc){super(),this.isMesh=!0,this.type="Mesh",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),t.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=t.morphTargetInfluences.slice()),t.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},t.morphTargetDictionary)),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}getVertexPosition(t,e){let n=this.geometry,s=n.attributes.position,r=n.morphAttributes.position,a=n.morphTargetsRelative;e.fromBufferAttribute(s,t);let o=this.morphTargetInfluences;if(r&&o){Nl.set(0,0,0);for(let l=0,c=r.length;l<c;l++){let h=o[l],u=r[l];h!==0&&(Uu.fromBufferAttribute(u,t),a?Nl.addScaledVector(Uu,h):Nl.addScaledVector(Uu.sub(e),h))}e.add(Nl)}return e}raycast(t,e){let n=this.geometry,s=this.material,r=this.matrixWorld;s!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),Ul.copy(n.boundingSphere),Ul.applyMatrix4(r),ar.copy(t.ray).recast(t.near),!(Ul.containsPoint(ar.origin)===!1&&(ar.intersectSphere(Ul,s0)===null||ar.origin.distanceToSquared(s0)>(t.far-t.near)**2))&&(i0.copy(r).invert(),ar.copy(t.ray).applyMatrix4(i0),!(n.boundingBox!==null&&ar.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(t,e,ar)))}_computeIntersections(t,e,n){let s,r=this.geometry,a=this.material,o=r.index,l=r.attributes.position,c=r.attributes.uv,h=r.attributes.uv1,u=r.attributes.normal,f=r.groups,d=r.drawRange;if(o!==null)if(Array.isArray(a))for(let g=0,b=f.length;g<b;g++){let p=f[g],m=a[p.materialIndex],_=Math.max(p.start,d.start),y=Math.min(o.count,Math.min(p.start+p.count,d.start+d.count));for(let v=_,w=y;v<w;v+=3){let S=o.getX(v),A=o.getX(v+1),L=o.getX(v+2);s=Gl(this,m,t,n,c,h,u,S,A,L),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,d.start),b=Math.min(o.count,d.start+d.count);for(let p=g,m=b;p<m;p+=3){let _=o.getX(p),y=o.getX(p+1),v=o.getX(p+2);s=Gl(this,a,t,n,c,h,u,_,y,v),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}else if(l!==void 0)if(Array.isArray(a))for(let g=0,b=f.length;g<b;g++){let p=f[g],m=a[p.materialIndex],_=Math.max(p.start,d.start),y=Math.min(l.count,Math.min(p.start+p.count,d.start+d.count));for(let v=_,w=y;v<w;v+=3){let S=v,A=v+1,L=v+2;s=Gl(this,m,t,n,c,h,u,S,A,L),s&&(s.faceIndex=Math.floor(v/3),s.face.materialIndex=p.materialIndex,e.push(s))}}else{let g=Math.max(0,d.start),b=Math.min(l.count,d.start+d.count);for(let p=g,m=b;p<m;p+=3){let _=p,y=p+1,v=p+2;s=Gl(this,a,t,n,c,h,u,_,y,v),s&&(s.faceIndex=Math.floor(p/3),e.push(s))}}}};function Fv(i,t,e,n,s,r,a,o){let l;if(t.side===Dn?l=n.intersectTriangle(a,r,s,!0,o):l=n.intersectTriangle(s,r,a,t.side===fn,o),l===null)return null;Hl.copy(o),Hl.applyMatrix4(i.matrixWorld);let c=e.ray.origin.distanceTo(Hl);return c<e.near||c>e.far?null:{distance:c,point:Hl.clone(),object:i}}function Gl(i,t,e,n,s,r,a,o,l,c){i.getVertexPosition(o,so),i.getVertexPosition(l,ro),i.getVertexPosition(c,oo);let h=Fv(i,t,e,n,so,ro,oo,zl);if(h){s&&(Bl.fromBufferAttribute(s,o),Fl.fromBufferAttribute(s,l),Ol.fromBufferAttribute(s,c),h.uv=ho.getInterpolation(zl,so,ro,oo,Bl,Fl,Ol,new qt)),r&&(Bl.fromBufferAttribute(r,o),Fl.fromBufferAttribute(r,l),Ol.fromBufferAttribute(r,c),h.uv1=ho.getInterpolation(zl,so,ro,oo,Bl,Fl,Ol,new qt)),a&&(r0.fromBufferAttribute(a,o),o0.fromBufferAttribute(a,l),a0.fromBufferAttribute(a,c),h.normal=ho.getInterpolation(zl,so,ro,oo,r0,o0,a0,new V),h.normal.dot(n.direction)>0&&h.normal.multiplyScalar(-1));let u={a:o,b:l,c,normal:new V,materialIndex:0};ho.getNormal(so,ro,oo,u.normal),h.face=u}return h}var xa=class i extends Re{constructor(t=1,e=1,n=1,s=1,r=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:t,height:e,depth:n,widthSegments:s,heightSegments:r,depthSegments:a};let o=this;s=Math.floor(s),r=Math.floor(r),a=Math.floor(a);let l=[],c=[],h=[],u=[],f=0,d=0;g("z","y","x",-1,-1,n,e,t,a,r,0),g("z","y","x",1,-1,n,e,-t,a,r,1),g("x","z","y",1,1,t,n,e,s,a,2),g("x","z","y",1,-1,t,n,-e,s,a,3),g("x","y","z",1,-1,t,e,n,s,r,4),g("x","y","z",-1,-1,t,e,-n,s,r,5),this.setIndex(l),this.setAttribute("position",new ss(c,3)),this.setAttribute("normal",new ss(h,3)),this.setAttribute("uv",new ss(u,2));function g(b,p,m,_,y,v,w,S,A,L,P){let M=v/A,T=w/L,I=v/2,F=w/2,k=S/2,U=A+1,N=L+1,D=0,z=0,$=new V;for(let nt=0;nt<N;nt++){let et=nt*T-F;for(let rt=0;rt<U;rt++){let bt=rt*M-I;$[b]=bt*_,$[p]=et*y,$[m]=k,c.push($.x,$.y,$.z),$[b]=0,$[p]=0,$[m]=S>0?1:-1,h.push($.x,$.y,$.z),u.push(rt/A),u.push(1-nt/L),D+=1}}for(let nt=0;nt<L;nt++)for(let et=0;et<A;et++){let rt=f+et+U*nt,bt=f+et+U*(nt+1),G=f+(et+1)+U*(nt+1),tt=f+(et+1)+U*nt;l.push(rt,bt,tt),l.push(bt,G,tt),z+=6}o.addGroup(d,z,P),d+=z,f+=D}}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.depth,t.widthSegments,t.heightSegments,t.depthSegments)}};function vo(i){let t={};for(let e in i){t[e]={};for(let n in i[e]){let s=i[e][n];s&&(s.isColor||s.isMatrix3||s.isMatrix4||s.isVector2||s.isVector3||s.isVector4||s.isTexture||s.isQuaternion)?s.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),t[e][n]=null):t[e][n]=s.clone():Array.isArray(s)?t[e][n]=s.slice():t[e][n]=s}}return t}function Sn(i){let t={};for(let e=0;e<i.length;e++){let n=vo(i[e]);for(let s in n)t[s]=n[s]}return t}function Ov(i){let t=[];for(let e=0;e<i.length;e++)t.push(i[e].clone());return t}function q0(i){return i.getRenderTarget()===null?i.outputColorSpace:he.workingColorSpace}var zv={clone:vo,merge:Sn},Hv=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,Gv=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`,Ee=class extends _r{constructor(t){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Hv,this.fragmentShader=Gv,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1,clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,t!==void 0&&this.setValues(t)}copy(t){return super.copy(t),this.fragmentShader=t.fragmentShader,this.vertexShader=t.vertexShader,this.uniforms=vo(t.uniforms),this.uniformsGroups=Ov(t.uniformsGroups),this.defines=Object.assign({},t.defines),this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this.fog=t.fog,this.lights=t.lights,this.clipping=t.clipping,this.extensions=Object.assign({},t.extensions),this.glslVersion=t.glslVersion,this}toJSON(t){let e=super.toJSON(t);e.glslVersion=this.glslVersion,e.uniforms={};for(let s in this.uniforms){let a=this.uniforms[s].value;a&&a.isTexture?e.uniforms[s]={type:"t",value:a.toJSON(t).uuid}:a&&a.isColor?e.uniforms[s]={type:"c",value:a.getHex()}:a&&a.isVector2?e.uniforms[s]={type:"v2",value:a.toArray()}:a&&a.isVector3?e.uniforms[s]={type:"v3",value:a.toArray()}:a&&a.isVector4?e.uniforms[s]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?e.uniforms[s]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?e.uniforms[s]={type:"m4",value:a.toArray()}:e.uniforms[s]={value:a}}Object.keys(this.defines).length>0&&(e.defines=this.defines),e.vertexShader=this.vertexShader,e.fragmentShader=this.fragmentShader,e.lights=this.lights,e.clipping=this.clipping;let n={};for(let s in this.extensions)this.extensions[s]===!0&&(n[s]=!0);return Object.keys(n).length>0&&(e.extensions=n),e}},uc=class extends si{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new ve,this.projectionMatrix=new ve,this.projectionMatrixInverse=new ve,this.coordinateSystem=ns}copy(t,e){return super.copy(t,e),this.matrixWorldInverse.copy(t.matrixWorldInverse),this.projectionMatrix.copy(t.projectionMatrix),this.projectionMatrixInverse.copy(t.projectionMatrixInverse),this.coordinateSystem=t.coordinateSystem,this}getWorldDirection(t){return super.getWorldDirection(t).negate()}updateMatrixWorld(t){super.updateMatrixWorld(t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(t,e){super.updateWorldMatrix(t,e),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}},ks=new V,l0=new qt,c0=new qt,rn=class extends uc{constructor(t=50,e=1,n=.1,s=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=t,this.zoom=1,this.near=n,this.far=s,this.focus=10,this.aspect=e,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.fov=t.fov,this.zoom=t.zoom,this.near=t.near,this.far=t.far,this.focus=t.focus,this.aspect=t.aspect,this.view=t.view===null?null:Object.assign({},t.view),this.filmGauge=t.filmGauge,this.filmOffset=t.filmOffset,this}setFocalLength(t){let e=.5*this.getFilmHeight()/t;this.fov=Ku*2*Math.atan(e),this.updateProjectionMatrix()}getFocalLength(){let t=Math.tan(gu*.5*this.fov);return .5*this.getFilmHeight()/t}getEffectiveFOV(){return Ku*2*Math.atan(Math.tan(gu*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(t,e,n){ks.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),e.set(ks.x,ks.y).multiplyScalar(-t/ks.z),ks.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(ks.x,ks.y).multiplyScalar(-t/ks.z)}getViewSize(t,e){return this.getViewBounds(t,l0,c0),e.subVectors(c0,l0)}setViewOffset(t,e,n,s,r,a){this.aspect=t/e,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=this.near,e=t*Math.tan(gu*.5*this.fov)/this.zoom,n=2*e,s=this.aspect*n,r=-.5*s,a=this.view;if(this.view!==null&&this.view.enabled){let l=a.fullWidth,c=a.fullHeight;r+=a.offsetX*s/l,e-=a.offsetY*n/c,s*=a.width/l,n*=a.height/c}let o=this.filmOffset;o!==0&&(r+=t*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(r,r+s,e,e-n,t,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.fov=this.fov,e.object.zoom=this.zoom,e.object.near=this.near,e.object.far=this.far,e.object.focus=this.focus,e.object.aspect=this.aspect,this.view!==null&&(e.object.view=Object.assign({},this.view)),e.object.filmGauge=this.filmGauge,e.object.filmOffset=this.filmOffset,e}},ao=-90,lo=1,Qu=class extends si{constructor(t,e,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;let s=new rn(ao,lo,t,e);s.layers=this.layers,this.add(s);let r=new rn(ao,lo,t,e);r.layers=this.layers,this.add(r);let a=new rn(ao,lo,t,e);a.layers=this.layers,this.add(a);let o=new rn(ao,lo,t,e);o.layers=this.layers,this.add(o);let l=new rn(ao,lo,t,e);l.layers=this.layers,this.add(l);let c=new rn(ao,lo,t,e);c.layers=this.layers,this.add(c)}updateCoordinateSystem(){let t=this.coordinateSystem,e=this.children.concat(),[n,s,r,a,o,l]=e;for(let c of e)this.remove(c);if(t===ns)n.up.set(0,1,0),n.lookAt(1,0,0),s.up.set(0,1,0),s.lookAt(-1,0,0),r.up.set(0,0,-1),r.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),l.up.set(0,1,0),l.lookAt(0,0,-1);else if(t===ec)n.up.set(0,-1,0),n.lookAt(-1,0,0),s.up.set(0,-1,0),s.lookAt(1,0,0),r.up.set(0,0,1),r.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),l.up.set(0,-1,0),l.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+t);for(let c of e)this.add(c),c.updateMatrixWorld()}update(t,e){this.parent===null&&this.updateMatrixWorld();let{renderTarget:n,activeMipmapLevel:s}=this;this.coordinateSystem!==t.coordinateSystem&&(this.coordinateSystem=t.coordinateSystem,this.updateCoordinateSystem());let[r,a,o,l,c,h]=this.children,u=t.getRenderTarget(),f=t.getActiveCubeFace(),d=t.getActiveMipmapLevel(),g=t.xr.enabled;t.xr.enabled=!1;let b=n.texture.generateMipmaps;n.texture.generateMipmaps=!1,t.setRenderTarget(n,0,s),t.render(e,r),t.setRenderTarget(n,1,s),t.render(e,a),t.setRenderTarget(n,2,s),t.render(e,o),t.setRenderTarget(n,3,s),t.render(e,l),t.setRenderTarget(n,4,s),t.render(e,c),n.texture.generateMipmaps=b,t.setRenderTarget(n,5,s),t.render(e,h),t.setRenderTarget(u,f,d),t.xr.enabled=g,n.texture.needsPMREMUpdate=!0}},dc=class extends Wn{constructor(t,e,n,s,r,a,o,l,c,h){t=t!==void 0?t:[],e=e!==void 0?e:bo,super(t,e,n,s,r,a,o,l,c,h),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(t){this.image=t}},td=class extends gi{constructor(t=1,e={}){super(t,t,e),this.isWebGLCubeRenderTarget=!0;let n={width:t,height:t,depth:1},s=[n,n,n,n,n,n];this.texture=new dc(s,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Pn}fromEquirectangularTexture(t,e){this.texture.type=e.type,this.texture.colorSpace=e.colorSpace,this.texture.generateMipmaps=e.generateMipmaps,this.texture.minFilter=e.minFilter,this.texture.magFilter=e.magFilter;let n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},s=new xa(5,5,5),r=new Ee({name:"CubemapFromEquirect",uniforms:vo(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Dn,blending:Di});r.uniforms.tEquirect.value=e;let a=new _e(s,r),o=e.minFilter;return e.minFilter===mr&&(e.minFilter=Pn),new Qu(1,10,this).update(t,a),e.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(t,e,n,s){let r=t.getRenderTarget();for(let a=0;a<6;a++)t.setRenderTarget(this,a),t.clear(e,n,s);t.setRenderTarget(r)}},Nu=new V,Wv=new V,Vv=new te,ts=class{constructor(t=new V(1,0,0),e=0){this.isPlane=!0,this.normal=t,this.constant=e}set(t,e){return this.normal.copy(t),this.constant=e,this}setComponents(t,e,n,s){return this.normal.set(t,e,n),this.constant=s,this}setFromNormalAndCoplanarPoint(t,e){return this.normal.copy(t),this.constant=-e.dot(this.normal),this}setFromCoplanarPoints(t,e,n){let s=Nu.subVectors(n,e).cross(Wv.subVectors(t,e)).normalize();return this.setFromNormalAndCoplanarPoint(s,t),this}copy(t){return this.normal.copy(t.normal),this.constant=t.constant,this}normalize(){let t=1/this.normal.length();return this.normal.multiplyScalar(t),this.constant*=t,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(t){return this.normal.dot(t)+this.constant}distanceToSphere(t){return this.distanceToPoint(t.center)-t.radius}projectPoint(t,e){return e.copy(t).addScaledVector(this.normal,-this.distanceToPoint(t))}intersectLine(t,e){let n=t.delta(Nu),s=this.normal.dot(n);if(s===0)return this.distanceToPoint(t.start)===0?e.copy(t.start):null;let r=-(t.start.dot(this.normal)+this.constant)/s;return r<0||r>1?null:e.copy(t.start).addScaledVector(n,r)}intersectsLine(t){let e=this.distanceToPoint(t.start),n=this.distanceToPoint(t.end);return e<0&&n>0||n<0&&e>0}intersectsBox(t){return t.intersectsPlane(this)}intersectsSphere(t){return t.intersectsPlane(this)}coplanarPoint(t){return t.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(t,e){let n=e||Vv.getNormalMatrix(t),s=this.coplanarPoint(Nu).applyMatrix4(t),r=this.normal.applyMatrix3(n).normalize();return this.constant=-s.dot(r),this}translate(t){return this.constant-=t.dot(this.normal),this}equals(t){return t.normal.equals(this.normal)&&t.constant===this.constant}clone(){return new this.constructor().copy(this)}},lr=new Ui,Wl=new V,xo=class{constructor(t=new ts,e=new ts,n=new ts,s=new ts,r=new ts,a=new ts){this.planes=[t,e,n,s,r,a]}set(t,e,n,s,r,a){let o=this.planes;return o[0].copy(t),o[1].copy(e),o[2].copy(n),o[3].copy(s),o[4].copy(r),o[5].copy(a),this}copy(t){let e=this.planes;for(let n=0;n<6;n++)e[n].copy(t.planes[n]);return this}setFromProjectionMatrix(t,e=ns){let n=this.planes,s=t.elements,r=s[0],a=s[1],o=s[2],l=s[3],c=s[4],h=s[5],u=s[6],f=s[7],d=s[8],g=s[9],b=s[10],p=s[11],m=s[12],_=s[13],y=s[14],v=s[15];if(n[0].setComponents(l-r,f-c,p-d,v-m).normalize(),n[1].setComponents(l+r,f+c,p+d,v+m).normalize(),n[2].setComponents(l+a,f+h,p+g,v+_).normalize(),n[3].setComponents(l-a,f-h,p-g,v-_).normalize(),n[4].setComponents(l-o,f-u,p-b,v-y).normalize(),e===ns)n[5].setComponents(l+o,f+u,p+b,v+y).normalize();else if(e===ec)n[5].setComponents(o,u,b,y).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+e);return this}intersectsObject(t){if(t.boundingSphere!==void 0)t.boundingSphere===null&&t.computeBoundingSphere(),lr.copy(t.boundingSphere).applyMatrix4(t.matrixWorld);else{let e=t.geometry;e.boundingSphere===null&&e.computeBoundingSphere(),lr.copy(e.boundingSphere).applyMatrix4(t.matrixWorld)}return this.intersectsSphere(lr)}intersectsSprite(t){return lr.center.set(0,0,0),lr.radius=.7071067811865476,lr.applyMatrix4(t.matrixWorld),this.intersectsSphere(lr)}intersectsSphere(t){let e=this.planes,n=t.center,s=-t.radius;for(let r=0;r<6;r++)if(e[r].distanceToPoint(n)<s)return!1;return!0}intersectsBox(t){let e=this.planes;for(let n=0;n<6;n++){let s=e[n];if(Wl.x=s.normal.x>0?t.max.x:t.min.x,Wl.y=s.normal.y>0?t.max.y:t.min.y,Wl.z=s.normal.z>0?t.max.z:t.min.z,s.distanceToPoint(Wl)<0)return!1}return!0}containsPoint(t){let e=this.planes;for(let n=0;n<6;n++)if(e[n].distanceToPoint(t)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}};function Y0(){let i=null,t=!1,e=null,n=null;function s(r,a){e(r,a),n=i.requestAnimationFrame(s)}return{start:function(){t!==!0&&e!==null&&(n=i.requestAnimationFrame(s),t=!0)},stop:function(){i.cancelAnimationFrame(n),t=!1},setAnimationLoop:function(r){e=r},setContext:function(r){i=r}}}function $v(i,t){let e=t.isWebGL2,n=new WeakMap;function s(c,h){let u=c.array,f=c.usage,d=u.byteLength,g=i.createBuffer();i.bindBuffer(h,g),i.bufferData(h,u,f),c.onUploadCallback();let b;if(u instanceof Float32Array)b=i.FLOAT;else if(u instanceof Uint16Array)if(c.isFloat16BufferAttribute)if(e)b=i.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else b=i.UNSIGNED_SHORT;else if(u instanceof Int16Array)b=i.SHORT;else if(u instanceof Uint32Array)b=i.UNSIGNED_INT;else if(u instanceof Int32Array)b=i.INT;else if(u instanceof Int8Array)b=i.BYTE;else if(u instanceof Uint8Array)b=i.UNSIGNED_BYTE;else if(u instanceof Uint8ClampedArray)b=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+u);return{buffer:g,type:b,bytesPerElement:u.BYTES_PER_ELEMENT,version:c.version,size:d}}function r(c,h,u){let f=h.array,d=h._updateRange,g=h.updateRanges;if(i.bindBuffer(u,c),d.count===-1&&g.length===0&&i.bufferSubData(u,0,f),g.length!==0){for(let b=0,p=g.length;b<p;b++){let m=g[b];e?i.bufferSubData(u,m.start*f.BYTES_PER_ELEMENT,f,m.start,m.count):i.bufferSubData(u,m.start*f.BYTES_PER_ELEMENT,f.subarray(m.start,m.start+m.count))}h.clearUpdateRanges()}d.count!==-1&&(e?i.bufferSubData(u,d.offset*f.BYTES_PER_ELEMENT,f,d.offset,d.count):i.bufferSubData(u,d.offset*f.BYTES_PER_ELEMENT,f.subarray(d.offset,d.offset+d.count)),d.count=-1),h.onUploadCallback()}function a(c){return c.isInterleavedBufferAttribute&&(c=c.data),n.get(c)}function o(c){c.isInterleavedBufferAttribute&&(c=c.data);let h=n.get(c);h&&(i.deleteBuffer(h.buffer),n.delete(c))}function l(c,h){if(c.isGLBufferAttribute){let f=n.get(c);(!f||f.version<c.version)&&n.set(c,{buffer:c.buffer,type:c.type,bytesPerElement:c.elementSize,version:c.version});return}c.isInterleavedBufferAttribute&&(c=c.data);let u=n.get(c);if(u===void 0)n.set(c,s(c,h));else if(u.version<c.version){if(u.size!==c.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");r(u.buffer,c,h),u.version=c.version}}return{get:a,remove:o,update:l}}var fc=class i extends Re{constructor(t=1,e=1,n=1,s=1){super(),this.type="PlaneGeometry",this.parameters={width:t,height:e,widthSegments:n,heightSegments:s};let r=t/2,a=e/2,o=Math.floor(n),l=Math.floor(s),c=o+1,h=l+1,u=t/o,f=e/l,d=[],g=[],b=[],p=[];for(let m=0;m<h;m++){let _=m*f-a;for(let y=0;y<c;y++){let v=y*u-r;g.push(v,-_,0),b.push(0,0,1),p.push(y/o),p.push(1-m/l)}}for(let m=0;m<l;m++)for(let _=0;_<o;_++){let y=_+c*m,v=_+c*(m+1),w=_+1+c*(m+1),S=_+1+c*m;d.push(y,v,S),d.push(v,w,S)}this.setIndex(d),this.setAttribute("position",new ss(g,3)),this.setAttribute("normal",new ss(b,3)),this.setAttribute("uv",new ss(p,2))}copy(t){return super.copy(t),this.parameters=Object.assign({},t.parameters),this}static fromJSON(t){return new i(t.width,t.height,t.widthSegments,t.heightSegments)}},Xv=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,qv=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Yv=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,Kv=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Zv=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,Jv=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,jv=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,Qv=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,tx=`#ifdef USE_BATCHING
	attribute float batchId;
	uniform highp sampler2D batchingTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,ex=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( batchId );
#endif`,nx=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,ix=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,sx=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,rx=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,ox=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,ax=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,lx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,cx=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,hx=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,ux=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,dx=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,fx=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,px=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,mx=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,gx=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,bx=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,yx=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,_x=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,vx=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,xx=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,wx="gl_FragColor = linearToOutputTexel( gl_FragColor );",Mx=`
const mat3 LINEAR_SRGB_TO_LINEAR_DISPLAY_P3 = mat3(
	vec3( 0.8224621, 0.177538, 0.0 ),
	vec3( 0.0331941, 0.9668058, 0.0 ),
	vec3( 0.0170827, 0.0723974, 0.9105199 )
);
const mat3 LINEAR_DISPLAY_P3_TO_LINEAR_SRGB = mat3(
	vec3( 1.2249401, - 0.2249404, 0.0 ),
	vec3( - 0.0420569, 1.0420571, 0.0 ),
	vec3( - 0.0196376, - 0.0786361, 1.0982735 )
);
vec4 LinearSRGBToLinearDisplayP3( in vec4 value ) {
	return vec4( value.rgb * LINEAR_SRGB_TO_LINEAR_DISPLAY_P3, value.a );
}
vec4 LinearDisplayP3ToLinearSRGB( in vec4 value ) {
	return vec4( value.rgb * LINEAR_DISPLAY_P3_TO_LINEAR_SRGB, value.a );
}
vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}
vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return sRGBTransferOETF( value );
}`,Sx=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Ax=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	uniform mat3 envMapRotation;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ex=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Tx=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Cx=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,kx=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Rx=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Lx=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Px=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Ix=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Dx=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,Ux=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Nx=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Bx=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Fx=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,Ox=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,zx=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Hx=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Gx=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Wx=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,Vx=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,$x=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometryNormal, geometryViewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Xx=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,qx=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometryNormal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Yx=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Kx=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,Zx=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Jx=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,jx=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,Qx=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
	
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,tw=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,ew=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,nw=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,iw=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,sw=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,rw=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[MORPHTARGETS_COUNT];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,ow=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,aw=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,lw=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
	#endif
	#ifdef MORPHTARGETS_TEXTURE
		#ifndef USE_INSTANCING_MORPH
			uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		#endif
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,cw=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,hw=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,uw=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,dw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,fw=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,pw=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,mw=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,gw=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,bw=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,yw=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,_w=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,vw=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,xw=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,ww=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Mw=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,Sw=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Aw=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Ew=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Tw=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Cw=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,kw=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Rw=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Lw=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Pw=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Iw=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Dw=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Uw=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,Nw=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Bw=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Fw=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,Ow=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	float startCompression = 0.8 - 0.04;
	float desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min(color.r, min(color.g, color.b));
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max(color.r, max(color.g, color.b));
	if (peak < startCompression) return color;
	float d = 1. - startCompression;
	float newPeak = 1. - d * d / (peak + d - startCompression);
	color *= newPeak / peak;
	float g = 1. - 1. / (desaturation * (peak - newPeak) + 1.);
	return mix(color, vec3(1, 1, 1), g);
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,zw=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Hw=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Gw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Ww=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Vw=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,$w=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`,Xw=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,qw=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Yw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Kw=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, backgroundRotation * vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, backgroundRotation * vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Zw=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Jw=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jw=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,Qw=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,tM=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,eM=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,nM=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,iM=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,sM=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,rM=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,oM=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,aM=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,lM=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,cM=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,hM=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,uM=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,dM=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,fM=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,pM=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,mM=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gM=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,bM=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecularDirect + sheenSpecularIndirect;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,yM=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_M=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,vM=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,xM=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,wM=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,MM=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,SM=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,AM=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Qt={alphahash_fragment:Xv,alphahash_pars_fragment:qv,alphamap_fragment:Yv,alphamap_pars_fragment:Kv,alphatest_fragment:Zv,alphatest_pars_fragment:Jv,aomap_fragment:jv,aomap_pars_fragment:Qv,batching_pars_vertex:tx,batching_vertex:ex,begin_vertex:nx,beginnormal_vertex:ix,bsdfs:sx,iridescence_fragment:rx,bumpmap_pars_fragment:ox,clipping_planes_fragment:ax,clipping_planes_pars_fragment:lx,clipping_planes_pars_vertex:cx,clipping_planes_vertex:hx,color_fragment:ux,color_pars_fragment:dx,color_pars_vertex:fx,color_vertex:px,common:mx,cube_uv_reflection_fragment:gx,defaultnormal_vertex:bx,displacementmap_pars_vertex:yx,displacementmap_vertex:_x,emissivemap_fragment:vx,emissivemap_pars_fragment:xx,colorspace_fragment:wx,colorspace_pars_fragment:Mx,envmap_fragment:Sx,envmap_common_pars_fragment:Ax,envmap_pars_fragment:Ex,envmap_pars_vertex:Tx,envmap_physical_pars_fragment:Ox,envmap_vertex:Cx,fog_vertex:kx,fog_pars_vertex:Rx,fog_fragment:Lx,fog_pars_fragment:Px,gradientmap_pars_fragment:Ix,lightmap_fragment:Dx,lightmap_pars_fragment:Ux,lights_lambert_fragment:Nx,lights_lambert_pars_fragment:Bx,lights_pars_begin:Fx,lights_toon_fragment:zx,lights_toon_pars_fragment:Hx,lights_phong_fragment:Gx,lights_phong_pars_fragment:Wx,lights_physical_fragment:Vx,lights_physical_pars_fragment:$x,lights_fragment_begin:Xx,lights_fragment_maps:qx,lights_fragment_end:Yx,logdepthbuf_fragment:Kx,logdepthbuf_pars_fragment:Zx,logdepthbuf_pars_vertex:Jx,logdepthbuf_vertex:jx,map_fragment:Qx,map_pars_fragment:tw,map_particle_fragment:ew,map_particle_pars_fragment:nw,metalnessmap_fragment:iw,metalnessmap_pars_fragment:sw,morphinstance_vertex:rw,morphcolor_vertex:ow,morphnormal_vertex:aw,morphtarget_pars_vertex:lw,morphtarget_vertex:cw,normal_fragment_begin:hw,normal_fragment_maps:uw,normal_pars_fragment:dw,normal_pars_vertex:fw,normal_vertex:pw,normalmap_pars_fragment:mw,clearcoat_normal_fragment_begin:gw,clearcoat_normal_fragment_maps:bw,clearcoat_pars_fragment:yw,iridescence_pars_fragment:_w,opaque_fragment:vw,packing:xw,premultiplied_alpha_fragment:ww,project_vertex:Mw,dithering_fragment:Sw,dithering_pars_fragment:Aw,roughnessmap_fragment:Ew,roughnessmap_pars_fragment:Tw,shadowmap_pars_fragment:Cw,shadowmap_pars_vertex:kw,shadowmap_vertex:Rw,shadowmask_pars_fragment:Lw,skinbase_vertex:Pw,skinning_pars_vertex:Iw,skinning_vertex:Dw,skinnormal_vertex:Uw,specularmap_fragment:Nw,specularmap_pars_fragment:Bw,tonemapping_fragment:Fw,tonemapping_pars_fragment:Ow,transmission_fragment:zw,transmission_pars_fragment:Hw,uv_pars_fragment:Gw,uv_pars_vertex:Ww,uv_vertex:Vw,worldpos_vertex:$w,background_vert:Xw,background_frag:qw,backgroundCube_vert:Yw,backgroundCube_frag:Kw,cube_vert:Zw,cube_frag:Jw,depth_vert:jw,depth_frag:Qw,distanceRGBA_vert:tM,distanceRGBA_frag:eM,equirect_vert:nM,equirect_frag:iM,linedashed_vert:sM,linedashed_frag:rM,meshbasic_vert:oM,meshbasic_frag:aM,meshlambert_vert:lM,meshlambert_frag:cM,meshmatcap_vert:hM,meshmatcap_frag:uM,meshnormal_vert:dM,meshnormal_frag:fM,meshphong_vert:pM,meshphong_frag:mM,meshphysical_vert:gM,meshphysical_frag:bM,meshtoon_vert:yM,meshtoon_frag:_M,points_vert:vM,points_frag:xM,shadow_vert:wM,shadow_frag:MM,sprite_vert:SM,sprite_frag:AM},ut={common:{diffuse:{value:new Nt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new te}},envmap:{envMap:{value:null},envMapRotation:{value:new te},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new te}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new te}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new te},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new te},normalScale:{value:new qt(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new te},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new te}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new te}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new te}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new Nt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new Nt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0},uvTransform:{value:new te}},sprite:{diffuse:{value:new Nt(16777215)},opacity:{value:1},center:{value:new qt(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new te},alphaMap:{value:null},alphaMapTransform:{value:new te},alphaTest:{value:0}}},Ii={basic:{uniforms:Sn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.fog]),vertexShader:Qt.meshbasic_vert,fragmentShader:Qt.meshbasic_frag},lambert:{uniforms:Sn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Nt(0)}}]),vertexShader:Qt.meshlambert_vert,fragmentShader:Qt.meshlambert_frag},phong:{uniforms:Sn([ut.common,ut.specularmap,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,ut.lights,{emissive:{value:new Nt(0)},specular:{value:new Nt(1118481)},shininess:{value:30}}]),vertexShader:Qt.meshphong_vert,fragmentShader:Qt.meshphong_frag},standard:{uniforms:Sn([ut.common,ut.envmap,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.roughnessmap,ut.metalnessmap,ut.fog,ut.lights,{emissive:{value:new Nt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Qt.meshphysical_vert,fragmentShader:Qt.meshphysical_frag},toon:{uniforms:Sn([ut.common,ut.aomap,ut.lightmap,ut.emissivemap,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.gradientmap,ut.fog,ut.lights,{emissive:{value:new Nt(0)}}]),vertexShader:Qt.meshtoon_vert,fragmentShader:Qt.meshtoon_frag},matcap:{uniforms:Sn([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,ut.fog,{matcap:{value:null}}]),vertexShader:Qt.meshmatcap_vert,fragmentShader:Qt.meshmatcap_frag},points:{uniforms:Sn([ut.points,ut.fog]),vertexShader:Qt.points_vert,fragmentShader:Qt.points_frag},dashed:{uniforms:Sn([ut.common,ut.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Qt.linedashed_vert,fragmentShader:Qt.linedashed_frag},depth:{uniforms:Sn([ut.common,ut.displacementmap]),vertexShader:Qt.depth_vert,fragmentShader:Qt.depth_frag},normal:{uniforms:Sn([ut.common,ut.bumpmap,ut.normalmap,ut.displacementmap,{opacity:{value:1}}]),vertexShader:Qt.meshnormal_vert,fragmentShader:Qt.meshnormal_frag},sprite:{uniforms:Sn([ut.sprite,ut.fog]),vertexShader:Qt.sprite_vert,fragmentShader:Qt.sprite_frag},background:{uniforms:{uvTransform:{value:new te},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Qt.background_vert,fragmentShader:Qt.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new te}},vertexShader:Qt.backgroundCube_vert,fragmentShader:Qt.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Qt.cube_vert,fragmentShader:Qt.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Qt.equirect_vert,fragmentShader:Qt.equirect_frag},distanceRGBA:{uniforms:Sn([ut.common,ut.displacementmap,{referencePosition:{value:new V},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Qt.distanceRGBA_vert,fragmentShader:Qt.distanceRGBA_frag},shadow:{uniforms:Sn([ut.lights,ut.fog,{color:{value:new Nt(0)},opacity:{value:1}}]),vertexShader:Qt.shadow_vert,fragmentShader:Qt.shadow_frag}};Ii.physical={uniforms:Sn([Ii.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new te},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new te},clearcoatNormalScale:{value:new qt(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new te},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new te},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new te},sheen:{value:0},sheenColor:{value:new Nt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new te},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new te},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new te},transmissionSamplerSize:{value:new qt},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new te},attenuationDistance:{value:0},attenuationColor:{value:new Nt(0)},specularColor:{value:new Nt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new te},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new te},anisotropyVector:{value:new qt},anisotropyMap:{value:null},anisotropyMapTransform:{value:new te}}]),vertexShader:Qt.meshphysical_vert,fragmentShader:Qt.meshphysical_frag};var Vl={r:0,b:0,g:0},cr=new rs,EM=new ve;function TM(i,t,e,n,s,r,a){let o=new Nt(0),l=r===!0?0:1,c,h,u=null,f=0,d=null;function g(p,m){let _=!1,y=m.isScene===!0?m.background:null;y&&y.isTexture&&(y=(m.backgroundBlurriness>0?e:t).get(y)),y===null?b(o,l):y&&y.isColor&&(b(y,1),_=!0);let v=i.xr.getEnvironmentBlendMode();v==="additive"?n.buffers.color.setClear(0,0,0,1,a):v==="alpha-blend"&&n.buffers.color.setClear(0,0,0,0,a),(i.autoClear||_)&&i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil),y&&(y.isCubeTexture||y.mapping===yc)?(h===void 0&&(h=new _e(new xa(1,1,1),new Ee({name:"BackgroundCubeMaterial",uniforms:vo(Ii.backgroundCube.uniforms),vertexShader:Ii.backgroundCube.vertexShader,fragmentShader:Ii.backgroundCube.fragmentShader,side:Dn,depthTest:!1,depthWrite:!1,fog:!1})),h.geometry.deleteAttribute("normal"),h.geometry.deleteAttribute("uv"),h.onBeforeRender=function(w,S,A){this.matrixWorld.copyPosition(A.matrixWorld)},Object.defineProperty(h.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),s.update(h)),cr.copy(m.backgroundRotation),cr.x*=-1,cr.y*=-1,cr.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(cr.y*=-1,cr.z*=-1),h.material.uniforms.envMap.value=y,h.material.uniforms.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,h.material.uniforms.backgroundBlurriness.value=m.backgroundBlurriness,h.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,h.material.uniforms.backgroundRotation.value.setFromMatrix4(EM.makeRotationFromEuler(cr)),h.material.toneMapped=he.getTransfer(y.colorSpace)!==ye,(u!==y||f!==y.version||d!==i.toneMapping)&&(h.material.needsUpdate=!0,u=y,f=y.version,d=i.toneMapping),h.layers.enableAll(),p.unshift(h,h.geometry,h.material,0,0,null)):y&&y.isTexture&&(c===void 0&&(c=new _e(new fc(2,2),new Ee({name:"BackgroundMaterial",uniforms:vo(Ii.background.uniforms),vertexShader:Ii.background.vertexShader,fragmentShader:Ii.background.fragmentShader,side:fn,depthTest:!1,depthWrite:!1,fog:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),s.update(c)),c.material.uniforms.t2D.value=y,c.material.uniforms.backgroundIntensity.value=m.backgroundIntensity,c.material.toneMapped=he.getTransfer(y.colorSpace)!==ye,y.matrixAutoUpdate===!0&&y.updateMatrix(),c.material.uniforms.uvTransform.value.copy(y.matrix),(u!==y||f!==y.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,u=y,f=y.version,d=i.toneMapping),c.layers.enableAll(),p.unshift(c,c.geometry,c.material,0,0,null))}function b(p,m){p.getRGB(Vl,q0(i)),n.buffers.color.setClear(Vl.r,Vl.g,Vl.b,m,a)}return{getClearColor:function(){return o},setClearColor:function(p,m=1){o.set(p),l=m,b(o,l)},getClearAlpha:function(){return l},setClearAlpha:function(p){l=p,b(o,l)},render:g}}function CM(i,t,e,n){let s=i.getParameter(i.MAX_VERTEX_ATTRIBS),r=n.isWebGL2?null:t.get("OES_vertex_array_object"),a=n.isWebGL2||r!==null,o={},l=p(null),c=l,h=!1;function u(k,U,N,D,z){let $=!1;if(a){let nt=b(D,N,U);c!==nt&&(c=nt,d(c.object)),$=m(k,D,N,z),$&&_(k,D,N,z)}else{let nt=U.wireframe===!0;(c.geometry!==D.id||c.program!==N.id||c.wireframe!==nt)&&(c.geometry=D.id,c.program=N.id,c.wireframe=nt,$=!0)}z!==null&&e.update(z,i.ELEMENT_ARRAY_BUFFER),($||h)&&(h=!1,L(k,U,N,D),z!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(z).buffer))}function f(){return n.isWebGL2?i.createVertexArray():r.createVertexArrayOES()}function d(k){return n.isWebGL2?i.bindVertexArray(k):r.bindVertexArrayOES(k)}function g(k){return n.isWebGL2?i.deleteVertexArray(k):r.deleteVertexArrayOES(k)}function b(k,U,N){let D=N.wireframe===!0,z=o[k.id];z===void 0&&(z={},o[k.id]=z);let $=z[U.id];$===void 0&&($={},z[U.id]=$);let nt=$[D];return nt===void 0&&(nt=p(f()),$[D]=nt),nt}function p(k){let U=[],N=[],D=[];for(let z=0;z<s;z++)U[z]=0,N[z]=0,D[z]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:U,enabledAttributes:N,attributeDivisors:D,object:k,attributes:{},index:null}}function m(k,U,N,D){let z=c.attributes,$=U.attributes,nt=0,et=N.getAttributes();for(let rt in et)if(et[rt].location>=0){let G=z[rt],tt=$[rt];if(tt===void 0&&(rt==="instanceMatrix"&&k.instanceMatrix&&(tt=k.instanceMatrix),rt==="instanceColor"&&k.instanceColor&&(tt=k.instanceColor)),G===void 0||G.attribute!==tt||tt&&G.data!==tt.data)return!0;nt++}return c.attributesNum!==nt||c.index!==D}function _(k,U,N,D){let z={},$=U.attributes,nt=0,et=N.getAttributes();for(let rt in et)if(et[rt].location>=0){let G=$[rt];G===void 0&&(rt==="instanceMatrix"&&k.instanceMatrix&&(G=k.instanceMatrix),rt==="instanceColor"&&k.instanceColor&&(G=k.instanceColor));let tt={};tt.attribute=G,G&&G.data&&(tt.data=G.data),z[rt]=tt,nt++}c.attributes=z,c.attributesNum=nt,c.index=D}function y(){let k=c.newAttributes;for(let U=0,N=k.length;U<N;U++)k[U]=0}function v(k){w(k,0)}function w(k,U){let N=c.newAttributes,D=c.enabledAttributes,z=c.attributeDivisors;N[k]=1,D[k]===0&&(i.enableVertexAttribArray(k),D[k]=1),z[k]!==U&&((n.isWebGL2?i:t.get("ANGLE_instanced_arrays"))[n.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](k,U),z[k]=U)}function S(){let k=c.newAttributes,U=c.enabledAttributes;for(let N=0,D=U.length;N<D;N++)U[N]!==k[N]&&(i.disableVertexAttribArray(N),U[N]=0)}function A(k,U,N,D,z,$,nt){nt===!0?i.vertexAttribIPointer(k,U,N,z,$):i.vertexAttribPointer(k,U,N,D,z,$)}function L(k,U,N,D){if(n.isWebGL2===!1&&(k.isInstancedMesh||D.isInstancedBufferGeometry)&&t.get("ANGLE_instanced_arrays")===null)return;y();let z=D.attributes,$=N.getAttributes(),nt=U.defaultAttributeValues;for(let et in $){let rt=$[et];if(rt.location>=0){let bt=z[et];if(bt===void 0&&(et==="instanceMatrix"&&k.instanceMatrix&&(bt=k.instanceMatrix),et==="instanceColor"&&k.instanceColor&&(bt=k.instanceColor)),bt!==void 0){let G=bt.normalized,tt=bt.itemSize,at=e.get(bt);if(at===void 0)continue;let Q=at.buffer,ft=at.type,ht=at.bytesPerElement,Ht=n.isWebGL2===!0&&(ft===i.INT||ft===i.UNSIGNED_INT||bt.gpuType===N0);if(bt.isInterleavedBufferAttribute){let Et=bt.data,O=Et.stride,be=bt.offset;if(Et.isInstancedInterleavedBuffer){for(let xt=0;xt<rt.locationSize;xt++)w(rt.location+xt,Et.meshPerAttribute);k.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=Et.meshPerAttribute*Et.count)}else for(let xt=0;xt<rt.locationSize;xt++)v(rt.location+xt);i.bindBuffer(i.ARRAY_BUFFER,Q);for(let xt=0;xt<rt.locationSize;xt++)A(rt.location+xt,tt/rt.locationSize,ft,G,O*ht,(be+tt/rt.locationSize*xt)*ht,Ht)}else{if(bt.isInstancedBufferAttribute){for(let Et=0;Et<rt.locationSize;Et++)w(rt.location+Et,bt.meshPerAttribute);k.isInstancedMesh!==!0&&D._maxInstanceCount===void 0&&(D._maxInstanceCount=bt.meshPerAttribute*bt.count)}else for(let Et=0;Et<rt.locationSize;Et++)v(rt.location+Et);i.bindBuffer(i.ARRAY_BUFFER,Q);for(let Et=0;Et<rt.locationSize;Et++)A(rt.location+Et,tt/rt.locationSize,ft,G,tt*ht,tt/rt.locationSize*Et*ht,Ht)}}else if(nt!==void 0){let G=nt[et];if(G!==void 0)switch(G.length){case 2:i.vertexAttrib2fv(rt.location,G);break;case 3:i.vertexAttrib3fv(rt.location,G);break;case 4:i.vertexAttrib4fv(rt.location,G);break;default:i.vertexAttrib1fv(rt.location,G)}}}}S()}function P(){I();for(let k in o){let U=o[k];for(let N in U){let D=U[N];for(let z in D)g(D[z].object),delete D[z];delete U[N]}delete o[k]}}function M(k){if(o[k.id]===void 0)return;let U=o[k.id];for(let N in U){let D=U[N];for(let z in D)g(D[z].object),delete D[z];delete U[N]}delete o[k.id]}function T(k){for(let U in o){let N=o[U];if(N[k.id]===void 0)continue;let D=N[k.id];for(let z in D)g(D[z].object),delete D[z];delete N[k.id]}}function I(){F(),h=!0,c!==l&&(c=l,d(c.object))}function F(){l.geometry=null,l.program=null,l.wireframe=!1}return{setup:u,reset:I,resetDefaultState:F,dispose:P,releaseStatesOfGeometry:M,releaseStatesOfProgram:T,initAttributes:y,enableAttribute:v,disableUnusedAttributes:S}}function kM(i,t,e,n){let s=n.isWebGL2,r;function a(h){r=h}function o(h,u){i.drawArrays(r,h,u),e.update(u,r,1)}function l(h,u,f){if(f===0)return;let d,g;if(s)d=i,g="drawArraysInstanced";else if(d=t.get("ANGLE_instanced_arrays"),g="drawArraysInstancedANGLE",d===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}d[g](r,h,u,f),e.update(u,r,f)}function c(h,u,f){if(f===0)return;let d=t.get("WEBGL_multi_draw");if(d===null)for(let g=0;g<f;g++)this.render(h[g],u[g]);else{d.multiDrawArraysWEBGL(r,h,0,u,0,f);let g=0;for(let b=0;b<f;b++)g+=u[b];e.update(g,r,1)}}this.setMode=a,this.render=o,this.renderInstances=l,this.renderMultiDraw=c}function RM(i,t,e){let n;function s(){if(n!==void 0)return n;if(t.has("EXT_texture_filter_anisotropic")===!0){let A=t.get("EXT_texture_filter_anisotropic");n=i.getParameter(A.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else n=0;return n}function r(A){if(A==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";A="mediump"}return A==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let a=typeof WebGL2RenderingContext!="undefined"&&i.constructor.name==="WebGL2RenderingContext",o=e.precision!==void 0?e.precision:"highp",l=r(o);l!==o&&(console.warn("THREE.WebGLRenderer:",o,"not supported, using",l,"instead."),o=l);let c=a||t.has("WEBGL_draw_buffers"),h=e.logarithmicDepthBuffer===!0,u=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),f=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),d=i.getParameter(i.MAX_TEXTURE_SIZE),g=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),b=i.getParameter(i.MAX_VERTEX_ATTRIBS),p=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),m=i.getParameter(i.MAX_VARYING_VECTORS),_=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),y=f>0,v=a||t.has("OES_texture_float"),w=y&&v,S=a?i.getParameter(i.MAX_SAMPLES):0;return{isWebGL2:a,drawBuffers:c,getMaxAnisotropy:s,getMaxPrecision:r,precision:o,logarithmicDepthBuffer:h,maxTextures:u,maxVertexTextures:f,maxTextureSize:d,maxCubemapSize:g,maxAttributes:b,maxVertexUniforms:p,maxVaryings:m,maxFragmentUniforms:_,vertexTextures:y,floatFragmentTextures:v,floatVertexTextures:w,maxSamples:S}}function LM(i){let t=this,e=null,n=0,s=!1,r=!1,a=new ts,o=new te,l={value:null,needsUpdate:!1};this.uniform=l,this.numPlanes=0,this.numIntersection=0,this.init=function(u,f){let d=u.length!==0||f||n!==0||s;return s=f,n=u.length,d},this.beginShadows=function(){r=!0,h(null)},this.endShadows=function(){r=!1},this.setGlobalState=function(u,f){e=h(u,f,0)},this.setState=function(u,f,d){let g=u.clippingPlanes,b=u.clipIntersection,p=u.clipShadows,m=i.get(u);if(!s||g===null||g.length===0||r&&!p)r?h(null):c();else{let _=r?0:n,y=_*4,v=m.clippingState||null;l.value=v,v=h(g,f,y,d);for(let w=0;w!==y;++w)v[w]=e[w];m.clippingState=v,this.numIntersection=b?this.numPlanes:0,this.numPlanes+=_}};function c(){l.value!==e&&(l.value=e,l.needsUpdate=n>0),t.numPlanes=n,t.numIntersection=0}function h(u,f,d,g){let b=u!==null?u.length:0,p=null;if(b!==0){if(p=l.value,g!==!0||p===null){let m=d+b*4,_=f.matrixWorldInverse;o.getNormalMatrix(_),(p===null||p.length<m)&&(p=new Float32Array(m));for(let y=0,v=d;y!==b;++y,v+=4)a.copy(u[y]).applyMatrix4(_,o),a.normal.toArray(p,v),p[v+3]=a.constant}l.value=p,l.needsUpdate=!0}return t.numPlanes=b,t.numIntersection=0,p}}function PM(i){let t=new WeakMap;function e(a,o){return o===Vu?a.mapping=bo:o===$u&&(a.mapping=yo),a}function n(a){if(a&&a.isTexture){let o=a.mapping;if(o===Vu||o===$u)if(t.has(a)){let l=t.get(a).texture;return e(l,a.mapping)}else{let l=a.image;if(l&&l.height>0){let c=new td(l.height);return c.fromEquirectangularTexture(i,a),t.set(a,c),a.addEventListener("dispose",s),e(c.texture,a.mapping)}else return null}}return a}function s(a){let o=a.target;o.removeEventListener("dispose",s);let l=t.get(o);l!==void 0&&(t.delete(o),l.dispose())}function r(){t=new WeakMap}return{get:n,dispose:r}}var wa=class extends uc{constructor(t=-1,e=1,n=1,s=-1,r=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=t,this.right=e,this.top=n,this.bottom=s,this.near=r,this.far=a,this.updateProjectionMatrix()}copy(t,e){return super.copy(t,e),this.left=t.left,this.right=t.right,this.top=t.top,this.bottom=t.bottom,this.near=t.near,this.far=t.far,this.zoom=t.zoom,this.view=t.view===null?null:Object.assign({},t.view),this}setViewOffset(t,e,n,s,r,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=t,this.view.fullHeight=e,this.view.offsetX=n,this.view.offsetY=s,this.view.width=r,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){let t=(this.right-this.left)/(2*this.zoom),e=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,s=(this.top+this.bottom)/2,r=n-t,a=n+t,o=s+e,l=s-e;if(this.view!==null&&this.view.enabled){let c=(this.right-this.left)/this.view.fullWidth/this.zoom,h=(this.top-this.bottom)/this.view.fullHeight/this.zoom;r+=c*this.view.offsetX,a=r+c*this.view.width,o-=h*this.view.offsetY,l=o-h*this.view.height}this.projectionMatrix.makeOrthographic(r,a,o,l,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(t){let e=super.toJSON(t);return e.object.zoom=this.zoom,e.object.left=this.left,e.object.right=this.right,e.object.top=this.top,e.object.bottom=this.bottom,e.object.near=this.near,e.object.far=this.far,this.view!==null&&(e.object.view=Object.assign({},this.view)),e}},uo=4,h0=[.125,.215,.35,.446,.526,.582],pr=20,Bu=new wa,u0=new Nt,Fu=null,Ou=0,zu=0,ur=(1+Math.sqrt(5))/2,co=1/ur,d0=[new V(1,1,1),new V(-1,1,1),new V(1,1,-1),new V(-1,1,-1),new V(0,ur,co),new V(0,ur,-co),new V(co,0,ur),new V(-co,0,ur),new V(ur,co,0),new V(-ur,co,0)],pc=class{constructor(t){this._renderer=t,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(t,e=0,n=.1,s=100){Fu=this._renderer.getRenderTarget(),Ou=this._renderer.getActiveCubeFace(),zu=this._renderer.getActiveMipmapLevel(),this._setSize(256);let r=this._allocateTargets();return r.depthBuffer=!0,this._sceneToCubeUV(t,n,s,r),e>0&&this._blur(r,0,0,e),this._applyPMREM(r),this._cleanup(r),r}fromEquirectangular(t,e=null){return this._fromTexture(t,e)}fromCubemap(t,e=null){return this._fromTexture(t,e)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=m0(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=p0(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(t){this._lodMax=Math.floor(Math.log2(t)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let t=0;t<this._lodPlanes.length;t++)this._lodPlanes[t].dispose()}_cleanup(t){this._renderer.setRenderTarget(Fu,Ou,zu),t.scissorTest=!1,$l(t,0,0,t.width,t.height)}_fromTexture(t,e){t.mapping===bo||t.mapping===yo?this._setSize(t.image.length===0?16:t.image[0].width||t.image[0].image.width):this._setSize(t.image.width/4),Fu=this._renderer.getRenderTarget(),Ou=this._renderer.getActiveCubeFace(),zu=this._renderer.getActiveMipmapLevel();let n=e||this._allocateTargets();return this._textureToCubeUV(t,n),this._applyPMREM(n),this._cleanup(n),n}_allocateTargets(){let t=3*Math.max(this._cubeSize,112),e=4*this._cubeSize,n={magFilter:Pn,minFilter:Pn,generateMipmaps:!1,type:va,format:An,colorSpace:Ni,depthBuffer:!1},s=f0(t,e,n);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==t||this._pingPongRenderTarget.height!==e){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=f0(t,e,n);let{_lodMax:r}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=IM(r)),this._blurMaterial=DM(r,t,e)}return s}_compileMaterial(t){let e=new _e(this._lodPlanes[0],t);this._renderer.compile(e,Bu)}_sceneToCubeUV(t,e,n,s){let o=new rn(90,1,e,n),l=[1,-1,1,1,1,1],c=[1,1,1,-1,-1,-1],h=this._renderer,u=h.autoClear,f=h.toneMapping;h.getClearColor(u0),h.toneMapping=Ps,h.autoClear=!1;let d=new lc({name:"PMREM.Background",side:Dn,depthWrite:!1,depthTest:!1}),g=new _e(new xa,d),b=!1,p=t.background;p?p.isColor&&(d.color.copy(p),t.background=null,b=!0):(d.color.copy(u0),b=!0);for(let m=0;m<6;m++){let _=m%3;_===0?(o.up.set(0,l[m],0),o.lookAt(c[m],0,0)):_===1?(o.up.set(0,0,l[m]),o.lookAt(0,c[m],0)):(o.up.set(0,l[m],0),o.lookAt(0,0,c[m]));let y=this._cubeSize;$l(s,_*y,m>2?y:0,y,y),h.setRenderTarget(s),b&&h.render(g,o),h.render(t,o)}g.geometry.dispose(),g.material.dispose(),h.toneMapping=f,h.autoClear=u,t.background=p}_textureToCubeUV(t,e){let n=this._renderer,s=t.mapping===bo||t.mapping===yo;s?(this._cubemapMaterial===null&&(this._cubemapMaterial=m0()),this._cubemapMaterial.uniforms.flipEnvMap.value=t.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=p0());let r=s?this._cubemapMaterial:this._equirectMaterial,a=new _e(this._lodPlanes[0],r),o=r.uniforms;o.envMap.value=t;let l=this._cubeSize;$l(e,0,0,3*l,2*l),n.setRenderTarget(e),n.render(a,Bu)}_applyPMREM(t){let e=this._renderer,n=e.autoClear;e.autoClear=!1;for(let s=1;s<this._lodPlanes.length;s++){let r=Math.sqrt(this._sigmas[s]*this._sigmas[s]-this._sigmas[s-1]*this._sigmas[s-1]),a=d0[(s-1)%d0.length];this._blur(t,s-1,s,r,a)}e.autoClear=n}_blur(t,e,n,s,r){let a=this._pingPongRenderTarget;this._halfBlur(t,a,e,n,s,"latitudinal",r),this._halfBlur(a,t,n,n,s,"longitudinal",r)}_halfBlur(t,e,n,s,r,a,o){let l=this._renderer,c=this._blurMaterial;a!=="latitudinal"&&a!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");let h=3,u=new _e(this._lodPlanes[s],c),f=c.uniforms,d=this._sizeLods[n]-1,g=isFinite(r)?Math.PI/(2*d):2*Math.PI/(2*pr-1),b=r/g,p=isFinite(r)?1+Math.floor(h*b):pr;p>pr&&console.warn(`sigmaRadians, ${r}, is too large and will clip, as it requested ${p} samples when the maximum is set to ${pr}`);let m=[],_=0;for(let A=0;A<pr;++A){let L=A/b,P=Math.exp(-L*L/2);m.push(P),A===0?_+=P:A<p&&(_+=2*P)}for(let A=0;A<m.length;A++)m[A]=m[A]/_;f.envMap.value=t.texture,f.samples.value=p,f.weights.value=m,f.latitudinal.value=a==="latitudinal",o&&(f.poleAxis.value=o);let{_lodMax:y}=this;f.dTheta.value=g,f.mipInt.value=y-n;let v=this._sizeLods[s],w=3*v*(s>y-uo?s-y+uo:0),S=4*(this._cubeSize-v);$l(e,w,S,3*v,2*v),l.setRenderTarget(e),l.render(u,Bu)}};function IM(i){let t=[],e=[],n=[],s=i,r=i-uo+1+h0.length;for(let a=0;a<r;a++){let o=Math.pow(2,s);e.push(o);let l=1/o;a>i-uo?l=h0[a-i+uo-1]:a===0&&(l=0),n.push(l);let c=1/(o-2),h=-c,u=1+c,f=[h,h,u,h,u,u,h,h,u,u,h,u],d=6,g=6,b=3,p=2,m=1,_=new Float32Array(b*g*d),y=new Float32Array(p*g*d),v=new Float32Array(m*g*d);for(let S=0;S<d;S++){let A=S%3*2/3-1,L=S>2?0:-1,P=[A,L,0,A+2/3,L,0,A+2/3,L+1,0,A,L,0,A+2/3,L+1,0,A,L+1,0];_.set(P,b*g*S),y.set(f,p*g*S);let M=[S,S,S,S,S,S];v.set(M,m*g*S)}let w=new Re;w.setAttribute("position",new Vt(_,b)),w.setAttribute("uv",new Vt(y,p)),w.setAttribute("faceIndex",new Vt(v,m)),t.push(w),s>uo&&s--}return{lodPlanes:t,sizeLods:e,sigmas:n}}function f0(i,t,e){let n=new gi(i,t,e);return n.texture.mapping=yc,n.texture.name="PMREM.cubeUv",n.scissorTest=!0,n}function $l(i,t,e,n,s){i.viewport.set(t,e,n,s),i.scissor.set(t,e,n,s)}function DM(i,t,e){let n=new Float32Array(pr),s=new V(0,1,0);return new Ee({name:"SphericalGaussianBlur",defines:{n:pr,CUBEUV_TEXEL_WIDTH:1/t,CUBEUV_TEXEL_HEIGHT:1/e,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:n},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:s}},vertexShader:Cd(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:Di,depthTest:!1,depthWrite:!1})}function p0(){return new Ee({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:Cd(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:Di,depthTest:!1,depthWrite:!1})}function m0(){return new Ee({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:Cd(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:Di,depthTest:!1,depthWrite:!1})}function Cd(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function UM(i){let t=new WeakMap,e=null;function n(o){if(o&&o.isTexture){let l=o.mapping,c=l===Vu||l===$u,h=l===bo||l===yo;if(c||h)if(o.isRenderTargetTexture&&o.needsPMREMUpdate===!0){o.needsPMREMUpdate=!1;let u=t.get(o);return e===null&&(e=new pc(i)),u=c?e.fromEquirectangular(o,u):e.fromCubemap(o,u),t.set(o,u),u.texture}else{if(t.has(o))return t.get(o).texture;{let u=o.image;if(c&&u&&u.height>0||h&&u&&s(u)){e===null&&(e=new pc(i));let f=c?e.fromEquirectangular(o):e.fromCubemap(o);return t.set(o,f),o.addEventListener("dispose",r),f.texture}else return null}}}return o}function s(o){let l=0,c=6;for(let h=0;h<c;h++)o[h]!==void 0&&l++;return l===c}function r(o){let l=o.target;l.removeEventListener("dispose",r);let c=t.get(l);c!==void 0&&(t.delete(l),c.dispose())}function a(){t=new WeakMap,e!==null&&(e.dispose(),e=null)}return{get:n,dispose:a}}function NM(i){let t={};function e(n){if(t[n]!==void 0)return t[n];let s;switch(n){case"WEBGL_depth_texture":s=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":s=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":s=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":s=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:s=i.getExtension(n)}return t[n]=s,s}return{has:function(n){return e(n)!==null},init:function(n){n.isWebGL2?(e("EXT_color_buffer_float"),e("WEBGL_clip_cull_distance")):(e("WEBGL_depth_texture"),e("OES_texture_float"),e("OES_texture_half_float"),e("OES_texture_half_float_linear"),e("OES_standard_derivatives"),e("OES_element_index_uint"),e("OES_vertex_array_object"),e("ANGLE_instanced_arrays")),e("OES_texture_float_linear"),e("EXT_color_buffer_half_float"),e("WEBGL_multisampled_render_to_texture")},get:function(n){let s=e(n);return s===null&&console.warn("THREE.WebGLRenderer: "+n+" extension not supported."),s}}}function BM(i,t,e,n){let s={},r=new WeakMap;function a(u){let f=u.target;f.index!==null&&t.remove(f.index);for(let g in f.attributes)t.remove(f.attributes[g]);for(let g in f.morphAttributes){let b=f.morphAttributes[g];for(let p=0,m=b.length;p<m;p++)t.remove(b[p])}f.removeEventListener("dispose",a),delete s[f.id];let d=r.get(f);d&&(t.remove(d),r.delete(f)),n.releaseStatesOfGeometry(f),f.isInstancedBufferGeometry===!0&&delete f._maxInstanceCount,e.memory.geometries--}function o(u,f){return s[f.id]===!0||(f.addEventListener("dispose",a),s[f.id]=!0,e.memory.geometries++),f}function l(u){let f=u.attributes;for(let g in f)t.update(f[g],i.ARRAY_BUFFER);let d=u.morphAttributes;for(let g in d){let b=d[g];for(let p=0,m=b.length;p<m;p++)t.update(b[p],i.ARRAY_BUFFER)}}function c(u){let f=[],d=u.index,g=u.attributes.position,b=0;if(d!==null){let _=d.array;b=d.version;for(let y=0,v=_.length;y<v;y+=3){let w=_[y+0],S=_[y+1],A=_[y+2];f.push(w,S,S,A,A,w)}}else if(g!==void 0){let _=g.array;b=g.version;for(let y=0,v=_.length/3-1;y<v;y+=3){let w=y+0,S=y+1,A=y+2;f.push(w,S,S,A,A,w)}}else return;let p=new($0(f)?hc:cc)(f,1);p.version=b;let m=r.get(u);m&&t.remove(m),r.set(u,p)}function h(u){let f=r.get(u);if(f){let d=u.index;d!==null&&f.version<d.version&&c(u)}else c(u);return r.get(u)}return{get:o,update:l,getWireframeAttribute:h}}function FM(i,t,e,n){let s=n.isWebGL2,r;function a(d){r=d}let o,l;function c(d){o=d.type,l=d.bytesPerElement}function h(d,g){i.drawElements(r,g,o,d*l),e.update(g,r,1)}function u(d,g,b){if(b===0)return;let p,m;if(s)p=i,m="drawElementsInstanced";else if(p=t.get("ANGLE_instanced_arrays"),m="drawElementsInstancedANGLE",p===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}p[m](r,g,o,d*l,b),e.update(g,r,b)}function f(d,g,b){if(b===0)return;let p=t.get("WEBGL_multi_draw");if(p===null)for(let m=0;m<b;m++)this.render(d[m]/l,g[m]);else{p.multiDrawElementsWEBGL(r,g,0,o,d,0,b);let m=0;for(let _=0;_<b;_++)m+=g[_];e.update(m,r,1)}}this.setMode=a,this.setIndex=c,this.render=h,this.renderInstances=u,this.renderMultiDraw=f}function OM(i){let t={geometries:0,textures:0},e={frame:0,calls:0,triangles:0,points:0,lines:0};function n(r,a,o){switch(e.calls++,a){case i.TRIANGLES:e.triangles+=o*(r/3);break;case i.LINES:e.lines+=o*(r/2);break;case i.LINE_STRIP:e.lines+=o*(r-1);break;case i.LINE_LOOP:e.lines+=o*r;break;case i.POINTS:e.points+=o*r;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",a);break}}function s(){e.calls=0,e.triangles=0,e.points=0,e.lines=0}return{memory:t,render:e,programs:null,autoReset:!0,reset:s,update:n}}function zM(i,t){return i[0]-t[0]}function HM(i,t){return Math.abs(t[1])-Math.abs(i[1])}function GM(i,t,e){let n={},s=new Float32Array(8),r=new WeakMap,a=new an,o=[];for(let c=0;c<8;c++)o[c]=[c,0];function l(c,h,u){let f=c.morphTargetInfluences;if(t.isWebGL2===!0){let d=h.morphAttributes.position||h.morphAttributes.normal||h.morphAttributes.color,g=d!==void 0?d.length:0,b=r.get(h);if(b===void 0||b.count!==g){let I=function(){M.dispose(),r.delete(h),h.removeEventListener("dispose",I)};b!==void 0&&b.texture.dispose();let p=h.morphAttributes.position!==void 0,m=h.morphAttributes.normal!==void 0,_=h.morphAttributes.color!==void 0,y=h.morphAttributes.position||[],v=h.morphAttributes.normal||[],w=h.morphAttributes.color||[],S=0;p===!0&&(S=1),m===!0&&(S=2),_===!0&&(S=3);let A=h.attributes.position.count*S,L=1;A>t.maxTextureSize&&(L=Math.ceil(A/t.maxTextureSize),A=t.maxTextureSize);let P=new Float32Array(A*L*4*g),M=new rc(P,A,L,g);M.type=es,M.needsUpdate=!0;let T=S*4;for(let F=0;F<g;F++){let k=y[F],U=v[F],N=w[F],D=A*L*4*F;for(let z=0;z<k.count;z++){let $=z*T;p===!0&&(a.fromBufferAttribute(k,z),P[D+$+0]=a.x,P[D+$+1]=a.y,P[D+$+2]=a.z,P[D+$+3]=0),m===!0&&(a.fromBufferAttribute(U,z),P[D+$+4]=a.x,P[D+$+5]=a.y,P[D+$+6]=a.z,P[D+$+7]=0),_===!0&&(a.fromBufferAttribute(N,z),P[D+$+8]=a.x,P[D+$+9]=a.y,P[D+$+10]=a.z,P[D+$+11]=N.itemSize===4?a.w:1)}}b={count:g,texture:M,size:new qt(A,L)},r.set(h,b),h.addEventListener("dispose",I)}if(c.isInstancedMesh===!0&&c.morphTexture!==null)u.getUniforms().setValue(i,"morphTexture",c.morphTexture,e);else{let p=0;for(let _=0;_<f.length;_++)p+=f[_];let m=h.morphTargetsRelative?1:1-p;u.getUniforms().setValue(i,"morphTargetBaseInfluence",m),u.getUniforms().setValue(i,"morphTargetInfluences",f)}u.getUniforms().setValue(i,"morphTargetsTexture",b.texture,e),u.getUniforms().setValue(i,"morphTargetsTextureSize",b.size)}else{let d=f===void 0?0:f.length,g=n[h.id];if(g===void 0||g.length!==d){g=[];for(let y=0;y<d;y++)g[y]=[y,0];n[h.id]=g}for(let y=0;y<d;y++){let v=g[y];v[0]=y,v[1]=f[y]}g.sort(HM);for(let y=0;y<8;y++)y<d&&g[y][1]?(o[y][0]=g[y][0],o[y][1]=g[y][1]):(o[y][0]=Number.MAX_SAFE_INTEGER,o[y][1]=0);o.sort(zM);let b=h.morphAttributes.position,p=h.morphAttributes.normal,m=0;for(let y=0;y<8;y++){let v=o[y],w=v[0],S=v[1];w!==Number.MAX_SAFE_INTEGER&&S?(b&&h.getAttribute("morphTarget"+y)!==b[w]&&h.setAttribute("morphTarget"+y,b[w]),p&&h.getAttribute("morphNormal"+y)!==p[w]&&h.setAttribute("morphNormal"+y,p[w]),s[y]=S,m+=S):(b&&h.hasAttribute("morphTarget"+y)===!0&&h.deleteAttribute("morphTarget"+y),p&&h.hasAttribute("morphNormal"+y)===!0&&h.deleteAttribute("morphNormal"+y),s[y]=0)}let _=h.morphTargetsRelative?1:1-m;u.getUniforms().setValue(i,"morphTargetBaseInfluence",_),u.getUniforms().setValue(i,"morphTargetInfluences",s)}}return{update:l}}function WM(i,t,e,n){let s=new WeakMap;function r(l){let c=n.render.frame,h=l.geometry,u=t.get(l,h);if(s.get(u)!==c&&(t.update(u),s.set(u,c)),l.isInstancedMesh&&(l.hasEventListener("dispose",o)===!1&&l.addEventListener("dispose",o),s.get(l)!==c&&(e.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&e.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,c))),l.isSkinnedMesh){let f=l.skeleton;s.get(f)!==c&&(f.update(),s.set(f,c))}return u}function a(){s=new WeakMap}function o(l){let c=l.target;c.removeEventListener("dispose",o),e.remove(c.instanceMatrix),c.instanceColor!==null&&e.remove(c.instanceColor)}return{update:r,dispose:a}}var mc=class extends Wn{constructor(t,e,n,s,r,a,o,l,c,h){if(h=h!==void 0?h:br,h!==br&&h!==_o)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");n===void 0&&h===br&&(n=Ls),n===void 0&&h===_o&&(n=gr),super(null,s,r,a,o,l,h,n,c),this.isDepthTexture=!0,this.image={width:t,height:e},this.magFilter=o!==void 0?o:ke,this.minFilter=l!==void 0?l:ke,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(t){return super.copy(t),this.compareFunction=t.compareFunction,this}toJSON(t){let e=super.toJSON(t);return this.compareFunction!==null&&(e.compareFunction=this.compareFunction),e}},K0=new Wn,Z0=new mc(1,1);Z0.compareFunction=W0;var J0=new rc,j0=new ju,Q0=new dc,g0=[],b0=[],y0=new Float32Array(16),_0=new Float32Array(9),v0=new Float32Array(4);function So(i,t,e){let n=i[0];if(n<=0||n>0)return i;let s=t*e,r=g0[s];if(r===void 0&&(r=new Float32Array(s),g0[s]=r),t!==0){n.toArray(r,0);for(let a=1,o=0;a!==t;++a)o+=e,i[a].toArray(r,o)}return r}function We(i,t){if(i.length!==t.length)return!1;for(let e=0,n=i.length;e<n;e++)if(i[e]!==t[e])return!1;return!0}function Ve(i,t){for(let e=0,n=t.length;e<n;e++)i[e]=t[e]}function vc(i,t){let e=b0[t];e===void 0&&(e=new Int32Array(t),b0[t]=e);for(let n=0;n!==t;++n)e[n]=i.allocateTextureUnit();return e}function VM(i,t){let e=this.cache;e[0]!==t&&(i.uniform1f(this.addr,t),e[0]=t)}function $M(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2f(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(We(e,t))return;i.uniform2fv(this.addr,t),Ve(e,t)}}function XM(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3f(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else if(t.r!==void 0)(e[0]!==t.r||e[1]!==t.g||e[2]!==t.b)&&(i.uniform3f(this.addr,t.r,t.g,t.b),e[0]=t.r,e[1]=t.g,e[2]=t.b);else{if(We(e,t))return;i.uniform3fv(this.addr,t),Ve(e,t)}}function qM(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4f(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(We(e,t))return;i.uniform4fv(this.addr,t),Ve(e,t)}}function YM(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(We(e,t))return;i.uniformMatrix2fv(this.addr,!1,t),Ve(e,t)}else{if(We(e,n))return;v0.set(n),i.uniformMatrix2fv(this.addr,!1,v0),Ve(e,n)}}function KM(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(We(e,t))return;i.uniformMatrix3fv(this.addr,!1,t),Ve(e,t)}else{if(We(e,n))return;_0.set(n),i.uniformMatrix3fv(this.addr,!1,_0),Ve(e,n)}}function ZM(i,t){let e=this.cache,n=t.elements;if(n===void 0){if(We(e,t))return;i.uniformMatrix4fv(this.addr,!1,t),Ve(e,t)}else{if(We(e,n))return;y0.set(n),i.uniformMatrix4fv(this.addr,!1,y0),Ve(e,n)}}function JM(i,t){let e=this.cache;e[0]!==t&&(i.uniform1i(this.addr,t),e[0]=t)}function jM(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2i(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(We(e,t))return;i.uniform2iv(this.addr,t),Ve(e,t)}}function QM(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3i(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(We(e,t))return;i.uniform3iv(this.addr,t),Ve(e,t)}}function t2(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4i(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(We(e,t))return;i.uniform4iv(this.addr,t),Ve(e,t)}}function e2(i,t){let e=this.cache;e[0]!==t&&(i.uniform1ui(this.addr,t),e[0]=t)}function n2(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y)&&(i.uniform2ui(this.addr,t.x,t.y),e[0]=t.x,e[1]=t.y);else{if(We(e,t))return;i.uniform2uiv(this.addr,t),Ve(e,t)}}function i2(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z)&&(i.uniform3ui(this.addr,t.x,t.y,t.z),e[0]=t.x,e[1]=t.y,e[2]=t.z);else{if(We(e,t))return;i.uniform3uiv(this.addr,t),Ve(e,t)}}function s2(i,t){let e=this.cache;if(t.x!==void 0)(e[0]!==t.x||e[1]!==t.y||e[2]!==t.z||e[3]!==t.w)&&(i.uniform4ui(this.addr,t.x,t.y,t.z,t.w),e[0]=t.x,e[1]=t.y,e[2]=t.z,e[3]=t.w);else{if(We(e,t))return;i.uniform4uiv(this.addr,t),Ve(e,t)}}function r2(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s);let r=this.type===i.SAMPLER_2D_SHADOW?Z0:K0;e.setTexture2D(t||r,s)}function o2(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture3D(t||j0,s)}function a2(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTextureCube(t||Q0,s)}function l2(i,t,e){let n=this.cache,s=e.allocateTextureUnit();n[0]!==s&&(i.uniform1i(this.addr,s),n[0]=s),e.setTexture2DArray(t||J0,s)}function c2(i){switch(i){case 5126:return VM;case 35664:return $M;case 35665:return XM;case 35666:return qM;case 35674:return YM;case 35675:return KM;case 35676:return ZM;case 5124:case 35670:return JM;case 35667:case 35671:return jM;case 35668:case 35672:return QM;case 35669:case 35673:return t2;case 5125:return e2;case 36294:return n2;case 36295:return i2;case 36296:return s2;case 35678:case 36198:case 36298:case 36306:case 35682:return r2;case 35679:case 36299:case 36307:return o2;case 35680:case 36300:case 36308:case 36293:return a2;case 36289:case 36303:case 36311:case 36292:return l2}}function h2(i,t){i.uniform1fv(this.addr,t)}function u2(i,t){let e=So(t,this.size,2);i.uniform2fv(this.addr,e)}function d2(i,t){let e=So(t,this.size,3);i.uniform3fv(this.addr,e)}function f2(i,t){let e=So(t,this.size,4);i.uniform4fv(this.addr,e)}function p2(i,t){let e=So(t,this.size,4);i.uniformMatrix2fv(this.addr,!1,e)}function m2(i,t){let e=So(t,this.size,9);i.uniformMatrix3fv(this.addr,!1,e)}function g2(i,t){let e=So(t,this.size,16);i.uniformMatrix4fv(this.addr,!1,e)}function b2(i,t){i.uniform1iv(this.addr,t)}function y2(i,t){i.uniform2iv(this.addr,t)}function _2(i,t){i.uniform3iv(this.addr,t)}function v2(i,t){i.uniform4iv(this.addr,t)}function x2(i,t){i.uniform1uiv(this.addr,t)}function w2(i,t){i.uniform2uiv(this.addr,t)}function M2(i,t){i.uniform3uiv(this.addr,t)}function S2(i,t){i.uniform4uiv(this.addr,t)}function A2(i,t,e){let n=this.cache,s=t.length,r=vc(e,s);We(n,r)||(i.uniform1iv(this.addr,r),Ve(n,r));for(let a=0;a!==s;++a)e.setTexture2D(t[a]||K0,r[a])}function E2(i,t,e){let n=this.cache,s=t.length,r=vc(e,s);We(n,r)||(i.uniform1iv(this.addr,r),Ve(n,r));for(let a=0;a!==s;++a)e.setTexture3D(t[a]||j0,r[a])}function T2(i,t,e){let n=this.cache,s=t.length,r=vc(e,s);We(n,r)||(i.uniform1iv(this.addr,r),Ve(n,r));for(let a=0;a!==s;++a)e.setTextureCube(t[a]||Q0,r[a])}function C2(i,t,e){let n=this.cache,s=t.length,r=vc(e,s);We(n,r)||(i.uniform1iv(this.addr,r),Ve(n,r));for(let a=0;a!==s;++a)e.setTexture2DArray(t[a]||J0,r[a])}function k2(i){switch(i){case 5126:return h2;case 35664:return u2;case 35665:return d2;case 35666:return f2;case 35674:return p2;case 35675:return m2;case 35676:return g2;case 5124:case 35670:return b2;case 35667:case 35671:return y2;case 35668:case 35672:return _2;case 35669:case 35673:return v2;case 5125:return x2;case 36294:return w2;case 36295:return M2;case 36296:return S2;case 35678:case 36198:case 36298:case 36306:case 35682:return A2;case 35679:case 36299:case 36307:return E2;case 35680:case 36300:case 36308:case 36293:return T2;case 36289:case 36303:case 36311:case 36292:return C2}}var ed=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.setValue=c2(e.type)}},nd=class{constructor(t,e,n){this.id=t,this.addr=n,this.cache=[],this.type=e.type,this.size=e.size,this.setValue=k2(e.type)}},id=class{constructor(t){this.id=t,this.seq=[],this.map={}}setValue(t,e,n){let s=this.seq;for(let r=0,a=s.length;r!==a;++r){let o=s[r];o.setValue(t,e[o.id],n)}}},Hu=/(\w+)(\])?(\[|\.)?/g;function x0(i,t){i.seq.push(t),i.map[t.id]=t}function R2(i,t,e){let n=i.name,s=n.length;for(Hu.lastIndex=0;;){let r=Hu.exec(n),a=Hu.lastIndex,o=r[1],l=r[2]==="]",c=r[3];if(l&&(o=o|0),c===void 0||c==="["&&a+2===s){x0(e,c===void 0?new ed(o,i,t):new nd(o,i,t));break}else{let u=e.map[o];u===void 0&&(u=new id(o),x0(e,u)),e=u}}}var mo=class{constructor(t,e){this.seq=[],this.map={};let n=t.getProgramParameter(e,t.ACTIVE_UNIFORMS);for(let s=0;s<n;++s){let r=t.getActiveUniform(e,s),a=t.getUniformLocation(e,r.name);R2(r,a,this)}}setValue(t,e,n,s){let r=this.map[e];r!==void 0&&r.setValue(t,n,s)}setOptional(t,e,n){let s=e[n];s!==void 0&&this.setValue(t,n,s)}static upload(t,e,n,s){for(let r=0,a=e.length;r!==a;++r){let o=e[r],l=n[o.id];l.needsUpdate!==!1&&o.setValue(t,l.value,s)}}static seqWithValue(t,e){let n=[];for(let s=0,r=t.length;s!==r;++s){let a=t[s];a.id in e&&n.push(a)}return n}};function w0(i,t,e){let n=i.createShader(t);return i.shaderSource(n,e),i.compileShader(n),n}var L2=37297,P2=0;function I2(i,t){let e=i.split(`
`),n=[],s=Math.max(t-6,0),r=Math.min(t+6,e.length);for(let a=s;a<r;a++){let o=a+1;n.push(`${o===t?">":" "} ${o}: ${e[a]}`)}return n.join(`
`)}function D2(i){let t=he.getPrimaries(he.workingColorSpace),e=he.getPrimaries(i),n;switch(t===e?n="":t===tc&&e===Ql?n="LinearDisplayP3ToLinearSRGB":t===Ql&&e===tc&&(n="LinearSRGBToLinearDisplayP3"),i){case Ni:case _c:return[n,"LinearTransferOETF"];case Pi:case Td:return[n,"sRGBTransferOETF"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),[n,"LinearTransferOETF"]}}function M0(i,t,e){let n=i.getShaderParameter(t,i.COMPILE_STATUS),s=i.getShaderInfoLog(t).trim();if(n&&s==="")return"";let r=/ERROR: 0:(\d+)/.exec(s);if(r){let a=parseInt(r[1]);return e.toUpperCase()+`

`+s+`

`+I2(i.getShaderSource(t),a)}else return s}function U2(i,t){let e=D2(t);return`vec4 ${i}( vec4 value ) { return ${e[0]}( ${e[1]}( value ) ); }`}function N2(i,t){let e;switch(t){case Z_:e="Linear";break;case J_:e="Reinhard";break;case j_:e="OptimizedCineon";break;case Q_:e="ACESFilmic";break;case ev:e="AgX";break;case nv:e="Neutral";break;case tv:e="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",t),e="Linear"}return"vec3 "+i+"( vec3 color ) { return "+e+"ToneMapping( color ); }"}function B2(i){return[i.extensionDerivatives||i.envMapCubeUVHeight||i.bumpMap||i.normalMapTangentSpace||i.clearcoatNormalMap||i.flatShading||i.alphaToCoverage||i.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(i.extensionFragDepth||i.logarithmicDepthBuffer)&&i.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",i.extensionDrawBuffers&&i.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(i.extensionShaderTextureLOD||i.envMap||i.transmission)&&i.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(fo).join(`
`)}function F2(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(fo).join(`
`)}function O2(i){let t=[];for(let e in i){let n=i[e];n!==!1&&t.push("#define "+e+" "+n)}return t.join(`
`)}function z2(i,t){let e={},n=i.getProgramParameter(t,i.ACTIVE_ATTRIBUTES);for(let s=0;s<n;s++){let r=i.getActiveAttrib(t,s),a=r.name,o=1;r.type===i.FLOAT_MAT2&&(o=2),r.type===i.FLOAT_MAT3&&(o=3),r.type===i.FLOAT_MAT4&&(o=4),e[a]={type:r.type,location:i.getAttribLocation(t,a),locationSize:o}}return e}function fo(i){return i!==""}function S0(i,t){let e=t.numSpotLightShadows+t.numSpotLightMaps-t.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,t.numDirLights).replace(/NUM_SPOT_LIGHTS/g,t.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,t.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,e).replace(/NUM_RECT_AREA_LIGHTS/g,t.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,t.numPointLights).replace(/NUM_HEMI_LIGHTS/g,t.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,t.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,t.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,t.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,t.numPointLightShadows)}function A0(i,t){return i.replace(/NUM_CLIPPING_PLANES/g,t.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,t.numClippingPlanes-t.numClipIntersection)}var H2=/^[ \t]*#include +<([\w\d./]+)>/gm;function sd(i){return i.replace(H2,W2)}var G2=new Map([["encodings_fragment","colorspace_fragment"],["encodings_pars_fragment","colorspace_pars_fragment"],["output_fragment","opaque_fragment"]]);function W2(i,t){let e=Qt[t];if(e===void 0){let n=G2.get(t);if(n!==void 0)e=Qt[n],console.warn('THREE.WebGLRenderer: Shader chunk "%s" has been deprecated. Use "%s" instead.',t,n);else throw new Error("Can not resolve #include <"+t+">")}return sd(e)}var V2=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function E0(i){return i.replace(V2,$2)}function $2(i,t,e,n){let s="";for(let r=parseInt(t);r<parseInt(e);r++)s+=n.replace(/\[\s*i\s*\]/g,"[ "+r+" ]").replace(/UNROLLED_LOOP_INDEX/g,r);return s}function T0(i){let t=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	`;return i.isWebGL2&&(t+=`precision ${i.precision} sampler3D;
		precision ${i.precision} sampler2DArray;
		precision ${i.precision} sampler2DShadow;
		precision ${i.precision} samplerCubeShadow;
		precision ${i.precision} sampler2DArrayShadow;
		precision ${i.precision} isampler2D;
		precision ${i.precision} isampler3D;
		precision ${i.precision} isamplerCube;
		precision ${i.precision} isampler2DArray;
		precision ${i.precision} usampler2D;
		precision ${i.precision} usampler3D;
		precision ${i.precision} usamplerCube;
		precision ${i.precision} usampler2DArray;
		`),i.precision==="highp"?t+=`
#define HIGH_PRECISION`:i.precision==="mediump"?t+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(t+=`
#define LOW_PRECISION`),t}function X2(i){let t="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===I0?t="SHADOWMAP_TYPE_PCF":i.shadowMapType===S_?t="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Qi&&(t="SHADOWMAP_TYPE_VSM"),t}function q2(i){let t="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case bo:case yo:t="ENVMAP_TYPE_CUBE";break;case yc:t="ENVMAP_TYPE_CUBE_UV";break}return t}function Y2(i){let t="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case yo:t="ENVMAP_MODE_REFRACTION";break}return t}function K2(i){let t="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case D0:t="ENVMAP_BLENDING_MULTIPLY";break;case Y_:t="ENVMAP_BLENDING_MIX";break;case K_:t="ENVMAP_BLENDING_ADD";break}return t}function Z2(i){let t=i.envMapCubeUVHeight;if(t===null)return null;let e=Math.log2(t)-2,n=1/t;return{texelWidth:1/(3*Math.max(Math.pow(2,e),7*16)),texelHeight:n,maxMip:e}}function J2(i,t,e,n){let s=i.getContext(),r=e.defines,a=e.vertexShader,o=e.fragmentShader,l=X2(e),c=q2(e),h=Y2(e),u=K2(e),f=Z2(e),d=e.isWebGL2?"":B2(e),g=F2(e),b=O2(r),p=s.createProgram(),m,_,y=e.glslVersion?"#version "+e.glslVersion+`
`:"";e.isRawShaderMaterial?(m=["#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,b].filter(fo).join(`
`),m.length>0&&(m+=`
`),_=[d,"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,b].filter(fo).join(`
`),_.length>0&&(_+=`
`)):(m=[T0(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,b,e.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",e.batching?"#define USE_BATCHING":"",e.instancing?"#define USE_INSTANCING":"",e.instancingColor?"#define USE_INSTANCING_COLOR":"",e.instancingMorph?"#define USE_INSTANCING_MORPH":"",e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.map?"#define USE_MAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+h:"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.displacementMap?"#define USE_DISPLACEMENTMAP":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.mapUv?"#define MAP_UV "+e.mapUv:"",e.alphaMapUv?"#define ALPHAMAP_UV "+e.alphaMapUv:"",e.lightMapUv?"#define LIGHTMAP_UV "+e.lightMapUv:"",e.aoMapUv?"#define AOMAP_UV "+e.aoMapUv:"",e.emissiveMapUv?"#define EMISSIVEMAP_UV "+e.emissiveMapUv:"",e.bumpMapUv?"#define BUMPMAP_UV "+e.bumpMapUv:"",e.normalMapUv?"#define NORMALMAP_UV "+e.normalMapUv:"",e.displacementMapUv?"#define DISPLACEMENTMAP_UV "+e.displacementMapUv:"",e.metalnessMapUv?"#define METALNESSMAP_UV "+e.metalnessMapUv:"",e.roughnessMapUv?"#define ROUGHNESSMAP_UV "+e.roughnessMapUv:"",e.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+e.anisotropyMapUv:"",e.clearcoatMapUv?"#define CLEARCOATMAP_UV "+e.clearcoatMapUv:"",e.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+e.clearcoatNormalMapUv:"",e.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+e.clearcoatRoughnessMapUv:"",e.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+e.iridescenceMapUv:"",e.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+e.iridescenceThicknessMapUv:"",e.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+e.sheenColorMapUv:"",e.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+e.sheenRoughnessMapUv:"",e.specularMapUv?"#define SPECULARMAP_UV "+e.specularMapUv:"",e.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+e.specularColorMapUv:"",e.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+e.specularIntensityMapUv:"",e.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+e.transmissionMapUv:"",e.thicknessMapUv?"#define THICKNESSMAP_UV "+e.thicknessMapUv:"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.flatShading?"#define FLAT_SHADED":"",e.skinning?"#define USE_SKINNING":"",e.morphTargets?"#define USE_MORPHTARGETS":"",e.morphNormals&&e.flatShading===!1?"#define USE_MORPHNORMALS":"",e.morphColors&&e.isWebGL2?"#define USE_MORPHCOLORS":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+e.morphTextureStride:"",e.morphTargetsCount>0&&e.isWebGL2?"#define MORPHTARGETS_COUNT "+e.morphTargetsCount:"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.sizeAttenuation?"#define USE_SIZEATTENUATION":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(fo).join(`
`),_=[d,T0(e),"#define SHADER_TYPE "+e.shaderType,"#define SHADER_NAME "+e.shaderName,b,e.useFog&&e.fog?"#define USE_FOG":"",e.useFog&&e.fogExp2?"#define FOG_EXP2":"",e.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",e.map?"#define USE_MAP":"",e.matcap?"#define USE_MATCAP":"",e.envMap?"#define USE_ENVMAP":"",e.envMap?"#define "+c:"",e.envMap?"#define "+h:"",e.envMap?"#define "+u:"",f?"#define CUBEUV_TEXEL_WIDTH "+f.texelWidth:"",f?"#define CUBEUV_TEXEL_HEIGHT "+f.texelHeight:"",f?"#define CUBEUV_MAX_MIP "+f.maxMip+".0":"",e.lightMap?"#define USE_LIGHTMAP":"",e.aoMap?"#define USE_AOMAP":"",e.bumpMap?"#define USE_BUMPMAP":"",e.normalMap?"#define USE_NORMALMAP":"",e.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",e.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",e.emissiveMap?"#define USE_EMISSIVEMAP":"",e.anisotropy?"#define USE_ANISOTROPY":"",e.anisotropyMap?"#define USE_ANISOTROPYMAP":"",e.clearcoat?"#define USE_CLEARCOAT":"",e.clearcoatMap?"#define USE_CLEARCOATMAP":"",e.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",e.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",e.iridescence?"#define USE_IRIDESCENCE":"",e.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",e.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",e.specularMap?"#define USE_SPECULARMAP":"",e.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",e.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",e.roughnessMap?"#define USE_ROUGHNESSMAP":"",e.metalnessMap?"#define USE_METALNESSMAP":"",e.alphaMap?"#define USE_ALPHAMAP":"",e.alphaTest?"#define USE_ALPHATEST":"",e.alphaHash?"#define USE_ALPHAHASH":"",e.sheen?"#define USE_SHEEN":"",e.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",e.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",e.transmission?"#define USE_TRANSMISSION":"",e.transmissionMap?"#define USE_TRANSMISSIONMAP":"",e.thicknessMap?"#define USE_THICKNESSMAP":"",e.vertexTangents&&e.flatShading===!1?"#define USE_TANGENT":"",e.vertexColors||e.instancingColor?"#define USE_COLOR":"",e.vertexAlphas?"#define USE_COLOR_ALPHA":"",e.vertexUv1s?"#define USE_UV1":"",e.vertexUv2s?"#define USE_UV2":"",e.vertexUv3s?"#define USE_UV3":"",e.pointsUvs?"#define USE_POINTS_UV":"",e.gradientMap?"#define USE_GRADIENTMAP":"",e.flatShading?"#define FLAT_SHADED":"",e.doubleSided?"#define DOUBLE_SIDED":"",e.flipSided?"#define FLIP_SIDED":"",e.shadowMapEnabled?"#define USE_SHADOWMAP":"",e.shadowMapEnabled?"#define "+l:"",e.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",e.numLightProbes>0?"#define USE_LIGHT_PROBES":"",e.useLegacyLights?"#define LEGACY_LIGHTS":"",e.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",e.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",e.logarithmicDepthBuffer&&e.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",e.toneMapping!==Ps?"#define TONE_MAPPING":"",e.toneMapping!==Ps?Qt.tonemapping_pars_fragment:"",e.toneMapping!==Ps?N2("toneMapping",e.toneMapping):"",e.dithering?"#define DITHERING":"",e.opaque?"#define OPAQUE":"",Qt.colorspace_pars_fragment,U2("linearToOutputTexel",e.outputColorSpace),e.useDepthPacking?"#define DEPTH_PACKING "+e.depthPacking:"",`
`].filter(fo).join(`
`)),a=sd(a),a=S0(a,e),a=A0(a,e),o=sd(o),o=S0(o,e),o=A0(o,e),a=E0(a),o=E0(o),e.isWebGL2&&e.isRawShaderMaterial!==!0&&(y=`#version 300 es
`,m=[g,"precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+m,_=["precision mediump sampler2DArray;","#define varying in",e.glslVersion===Vm?"":"layout(location = 0) out highp vec4 pc_fragColor;",e.glslVersion===Vm?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+_);let v=y+m+a,w=y+_+o,S=w0(s,s.VERTEX_SHADER,v),A=w0(s,s.FRAGMENT_SHADER,w);s.attachShader(p,S),s.attachShader(p,A),e.index0AttributeName!==void 0?s.bindAttribLocation(p,0,e.index0AttributeName):e.morphTargets===!0&&s.bindAttribLocation(p,0,"position"),s.linkProgram(p);function L(I){if(i.debug.checkShaderErrors){let F=s.getProgramInfoLog(p).trim(),k=s.getShaderInfoLog(S).trim(),U=s.getShaderInfoLog(A).trim(),N=!0,D=!0;if(s.getProgramParameter(p,s.LINK_STATUS)===!1)if(N=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(s,p,S,A);else{let z=M0(s,S,"vertex"),$=M0(s,A,"fragment");console.error("THREE.WebGLProgram: Shader Error "+s.getError()+" - VALIDATE_STATUS "+s.getProgramParameter(p,s.VALIDATE_STATUS)+`

Material Name: `+I.name+`
Material Type: `+I.type+`

Program Info Log: `+F+`
`+z+`
`+$)}else F!==""?console.warn("THREE.WebGLProgram: Program Info Log:",F):(k===""||U==="")&&(D=!1);D&&(I.diagnostics={runnable:N,programLog:F,vertexShader:{log:k,prefix:m},fragmentShader:{log:U,prefix:_}})}s.deleteShader(S),s.deleteShader(A),P=new mo(s,p),M=z2(s,p)}let P;this.getUniforms=function(){return P===void 0&&L(this),P};let M;this.getAttributes=function(){return M===void 0&&L(this),M};let T=e.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return T===!1&&(T=s.getProgramParameter(p,L2)),T},this.destroy=function(){n.releaseStatesOfProgram(this),s.deleteProgram(p),this.program=void 0},this.type=e.shaderType,this.name=e.shaderName,this.id=P2++,this.cacheKey=t,this.usedTimes=1,this.program=p,this.vertexShader=S,this.fragmentShader=A,this}var j2=0,rd=class{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(t){let e=t.vertexShader,n=t.fragmentShader,s=this._getShaderStage(e),r=this._getShaderStage(n),a=this._getShaderCacheForMaterial(t);return a.has(s)===!1&&(a.add(s),s.usedTimes++),a.has(r)===!1&&(a.add(r),r.usedTimes++),this}remove(t){let e=this.materialCache.get(t);for(let n of e)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(t),this}getVertexShaderID(t){return this._getShaderStage(t.vertexShader).id}getFragmentShaderID(t){return this._getShaderStage(t.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(t){let e=this.materialCache,n=e.get(t);return n===void 0&&(n=new Set,e.set(t,n)),n}_getShaderStage(t){let e=this.shaderCache,n=e.get(t);return n===void 0&&(n=new od(t),e.set(t,n)),n}},od=class{constructor(t){this.id=j2++,this.code=t,this.usedTimes=0}};function Q2(i,t,e,n,s,r,a){let o=new ac,l=new rd,c=new Set,h=[],u=s.isWebGL2,f=s.logarithmicDepthBuffer,d=s.vertexTextures,g=s.precision,b={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function p(M){return c.add(M),M===0?"uv":`uv${M}`}function m(M,T,I,F,k){let U=F.fog,N=k.geometry,D=M.isMeshStandardMaterial?F.environment:null,z=(M.isMeshStandardMaterial?e:t).get(M.envMap||D),$=z&&z.mapping===yc?z.image.height:null,nt=b[M.type];M.precision!==null&&(g=s.getMaxPrecision(M.precision),g!==M.precision&&console.warn("THREE.WebGLProgram.getParameters:",M.precision,"not supported, using",g,"instead."));let et=N.morphAttributes.position||N.morphAttributes.normal||N.morphAttributes.color,rt=et!==void 0?et.length:0,bt=0;N.morphAttributes.position!==void 0&&(bt=1),N.morphAttributes.normal!==void 0&&(bt=2),N.morphAttributes.color!==void 0&&(bt=3);let G,tt,at,Q;if(nt){let pe=Ii[nt];G=pe.vertexShader,tt=pe.fragmentShader}else G=M.vertexShader,tt=M.fragmentShader,l.update(M),at=l.getVertexShaderID(M),Q=l.getFragmentShaderID(M);let ft=i.getRenderTarget(),ht=k.isInstancedMesh===!0,Ht=k.isBatchedMesh===!0,Et=!!M.map,O=!!M.matcap,be=!!z,xt=!!M.aoMap,wt=!!M.lightMap,kt=!!M.bumpMap,ie=!!M.normalMap,Gt=!!M.displacementMap,Yt=!!M.emissiveMap,we=!!M.metalnessMap,R=!!M.roughnessMap,E=M.anisotropy>0,j=M.clearcoat>0,it=M.iridescence>0,ot=M.sheen>0,st=M.transmission>0,Kt=E&&!!M.anisotropyMap,Dt=j&&!!M.clearcoatMap,dt=j&&!!M.clearcoatNormalMap,mt=j&&!!M.clearcoatRoughnessMap,Zt=it&&!!M.iridescenceMap,lt=it&&!!M.iridescenceThicknessMap,Be=ot&&!!M.sheenColorMap,se=ot&&!!M.sheenRoughnessMap,Rt=!!M.specularMap,At=!!M.specularColorMap,Tt=!!M.specularIntensityMap,le=st&&!!M.transmissionMap,$t=st&&!!M.thicknessMap,Me=!!M.gradientMap,B=!!M.alphaMap,pt=M.alphaTest>0,q=!!M.alphaHash,ct=!!M.extensions,gt=Ps;M.toneMapped&&(ft===null||ft.isXRRenderTarget===!0)&&(gt=i.toneMapping);let re={isWebGL2:u,shaderID:nt,shaderType:M.type,shaderName:M.name,vertexShader:G,fragmentShader:tt,defines:M.defines,customVertexShaderID:at,customFragmentShaderID:Q,isRawShaderMaterial:M.isRawShaderMaterial===!0,glslVersion:M.glslVersion,precision:g,batching:Ht,instancing:ht,instancingColor:ht&&k.instanceColor!==null,instancingMorph:ht&&k.morphTexture!==null,supportsVertexTextures:d,outputColorSpace:ft===null?i.outputColorSpace:ft.isXRRenderTarget===!0?ft.texture.colorSpace:Ni,alphaToCoverage:!!M.alphaToCoverage,map:Et,matcap:O,envMap:be,envMapMode:be&&z.mapping,envMapCubeUVHeight:$,aoMap:xt,lightMap:wt,bumpMap:kt,normalMap:ie,displacementMap:d&&Gt,emissiveMap:Yt,normalMapObjectSpace:ie&&M.normalMapType===pv,normalMapTangentSpace:ie&&M.normalMapType===fv,metalnessMap:we,roughnessMap:R,anisotropy:E,anisotropyMap:Kt,clearcoat:j,clearcoatMap:Dt,clearcoatNormalMap:dt,clearcoatRoughnessMap:mt,iridescence:it,iridescenceMap:Zt,iridescenceThicknessMap:lt,sheen:ot,sheenColorMap:Be,sheenRoughnessMap:se,specularMap:Rt,specularColorMap:At,specularIntensityMap:Tt,transmission:st,transmissionMap:le,thicknessMap:$t,gradientMap:Me,opaque:M.transparent===!1&&M.blending===is&&M.alphaToCoverage===!1,alphaMap:B,alphaTest:pt,alphaHash:q,combine:M.combine,mapUv:Et&&p(M.map.channel),aoMapUv:xt&&p(M.aoMap.channel),lightMapUv:wt&&p(M.lightMap.channel),bumpMapUv:kt&&p(M.bumpMap.channel),normalMapUv:ie&&p(M.normalMap.channel),displacementMapUv:Gt&&p(M.displacementMap.channel),emissiveMapUv:Yt&&p(M.emissiveMap.channel),metalnessMapUv:we&&p(M.metalnessMap.channel),roughnessMapUv:R&&p(M.roughnessMap.channel),anisotropyMapUv:Kt&&p(M.anisotropyMap.channel),clearcoatMapUv:Dt&&p(M.clearcoatMap.channel),clearcoatNormalMapUv:dt&&p(M.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:mt&&p(M.clearcoatRoughnessMap.channel),iridescenceMapUv:Zt&&p(M.iridescenceMap.channel),iridescenceThicknessMapUv:lt&&p(M.iridescenceThicknessMap.channel),sheenColorMapUv:Be&&p(M.sheenColorMap.channel),sheenRoughnessMapUv:se&&p(M.sheenRoughnessMap.channel),specularMapUv:Rt&&p(M.specularMap.channel),specularColorMapUv:At&&p(M.specularColorMap.channel),specularIntensityMapUv:Tt&&p(M.specularIntensityMap.channel),transmissionMapUv:le&&p(M.transmissionMap.channel),thicknessMapUv:$t&&p(M.thicknessMap.channel),alphaMapUv:B&&p(M.alphaMap.channel),vertexTangents:!!N.attributes.tangent&&(ie||E),vertexColors:M.vertexColors,vertexAlphas:M.vertexColors===!0&&!!N.attributes.color&&N.attributes.color.itemSize===4,pointsUvs:k.isPoints===!0&&!!N.attributes.uv&&(Et||B),fog:!!U,useFog:M.fog===!0,fogExp2:!!U&&U.isFogExp2,flatShading:M.flatShading===!0,sizeAttenuation:M.sizeAttenuation===!0,logarithmicDepthBuffer:f,skinning:k.isSkinnedMesh===!0,morphTargets:N.morphAttributes.position!==void 0,morphNormals:N.morphAttributes.normal!==void 0,morphColors:N.morphAttributes.color!==void 0,morphTargetsCount:rt,morphTextureStride:bt,numDirLights:T.directional.length,numPointLights:T.point.length,numSpotLights:T.spot.length,numSpotLightMaps:T.spotLightMap.length,numRectAreaLights:T.rectArea.length,numHemiLights:T.hemi.length,numDirLightShadows:T.directionalShadowMap.length,numPointLightShadows:T.pointShadowMap.length,numSpotLightShadows:T.spotShadowMap.length,numSpotLightShadowsWithMaps:T.numSpotLightShadowsWithMaps,numLightProbes:T.numLightProbes,numClippingPlanes:a.numPlanes,numClipIntersection:a.numIntersection,dithering:M.dithering,shadowMapEnabled:i.shadowMap.enabled&&I.length>0,shadowMapType:i.shadowMap.type,toneMapping:gt,useLegacyLights:i._useLegacyLights,decodeVideoTexture:Et&&M.map.isVideoTexture===!0&&he.getTransfer(M.map.colorSpace)===ye,premultipliedAlpha:M.premultipliedAlpha,doubleSided:M.side===je,flipSided:M.side===Dn,useDepthPacking:M.depthPacking>=0,depthPacking:M.depthPacking||0,index0AttributeName:M.index0AttributeName,extensionDerivatives:ct&&M.extensions.derivatives===!0,extensionFragDepth:ct&&M.extensions.fragDepth===!0,extensionDrawBuffers:ct&&M.extensions.drawBuffers===!0,extensionShaderTextureLOD:ct&&M.extensions.shaderTextureLOD===!0,extensionClipCullDistance:ct&&M.extensions.clipCullDistance===!0&&n.has("WEBGL_clip_cull_distance"),extensionMultiDraw:ct&&M.extensions.multiDraw===!0&&n.has("WEBGL_multi_draw"),rendererExtensionFragDepth:u||n.has("EXT_frag_depth"),rendererExtensionDrawBuffers:u||n.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:u||n.has("EXT_shader_texture_lod"),rendererExtensionParallelShaderCompile:n.has("KHR_parallel_shader_compile"),customProgramCacheKey:M.customProgramCacheKey()};return re.vertexUv1s=c.has(1),re.vertexUv2s=c.has(2),re.vertexUv3s=c.has(3),c.clear(),re}function _(M){let T=[];if(M.shaderID?T.push(M.shaderID):(T.push(M.customVertexShaderID),T.push(M.customFragmentShaderID)),M.defines!==void 0)for(let I in M.defines)T.push(I),T.push(M.defines[I]);return M.isRawShaderMaterial===!1&&(y(T,M),v(T,M),T.push(i.outputColorSpace)),T.push(M.customProgramCacheKey),T.join()}function y(M,T){M.push(T.precision),M.push(T.outputColorSpace),M.push(T.envMapMode),M.push(T.envMapCubeUVHeight),M.push(T.mapUv),M.push(T.alphaMapUv),M.push(T.lightMapUv),M.push(T.aoMapUv),M.push(T.bumpMapUv),M.push(T.normalMapUv),M.push(T.displacementMapUv),M.push(T.emissiveMapUv),M.push(T.metalnessMapUv),M.push(T.roughnessMapUv),M.push(T.anisotropyMapUv),M.push(T.clearcoatMapUv),M.push(T.clearcoatNormalMapUv),M.push(T.clearcoatRoughnessMapUv),M.push(T.iridescenceMapUv),M.push(T.iridescenceThicknessMapUv),M.push(T.sheenColorMapUv),M.push(T.sheenRoughnessMapUv),M.push(T.specularMapUv),M.push(T.specularColorMapUv),M.push(T.specularIntensityMapUv),M.push(T.transmissionMapUv),M.push(T.thicknessMapUv),M.push(T.combine),M.push(T.fogExp2),M.push(T.sizeAttenuation),M.push(T.morphTargetsCount),M.push(T.morphAttributeCount),M.push(T.numDirLights),M.push(T.numPointLights),M.push(T.numSpotLights),M.push(T.numSpotLightMaps),M.push(T.numHemiLights),M.push(T.numRectAreaLights),M.push(T.numDirLightShadows),M.push(T.numPointLightShadows),M.push(T.numSpotLightShadows),M.push(T.numSpotLightShadowsWithMaps),M.push(T.numLightProbes),M.push(T.shadowMapType),M.push(T.toneMapping),M.push(T.numClippingPlanes),M.push(T.numClipIntersection),M.push(T.depthPacking)}function v(M,T){o.disableAll(),T.isWebGL2&&o.enable(0),T.supportsVertexTextures&&o.enable(1),T.instancing&&o.enable(2),T.instancingColor&&o.enable(3),T.instancingMorph&&o.enable(4),T.matcap&&o.enable(5),T.envMap&&o.enable(6),T.normalMapObjectSpace&&o.enable(7),T.normalMapTangentSpace&&o.enable(8),T.clearcoat&&o.enable(9),T.iridescence&&o.enable(10),T.alphaTest&&o.enable(11),T.vertexColors&&o.enable(12),T.vertexAlphas&&o.enable(13),T.vertexUv1s&&o.enable(14),T.vertexUv2s&&o.enable(15),T.vertexUv3s&&o.enable(16),T.vertexTangents&&o.enable(17),T.anisotropy&&o.enable(18),T.alphaHash&&o.enable(19),T.batching&&o.enable(20),M.push(o.mask),o.disableAll(),T.fog&&o.enable(0),T.useFog&&o.enable(1),T.flatShading&&o.enable(2),T.logarithmicDepthBuffer&&o.enable(3),T.skinning&&o.enable(4),T.morphTargets&&o.enable(5),T.morphNormals&&o.enable(6),T.morphColors&&o.enable(7),T.premultipliedAlpha&&o.enable(8),T.shadowMapEnabled&&o.enable(9),T.useLegacyLights&&o.enable(10),T.doubleSided&&o.enable(11),T.flipSided&&o.enable(12),T.useDepthPacking&&o.enable(13),T.dithering&&o.enable(14),T.transmission&&o.enable(15),T.sheen&&o.enable(16),T.opaque&&o.enable(17),T.pointsUvs&&o.enable(18),T.decodeVideoTexture&&o.enable(19),T.alphaToCoverage&&o.enable(20),M.push(o.mask)}function w(M){let T=b[M.type],I;if(T){let F=Ii[T];I=zv.clone(F.uniforms)}else I=M.uniforms;return I}function S(M,T){let I;for(let F=0,k=h.length;F<k;F++){let U=h[F];if(U.cacheKey===T){I=U,++I.usedTimes;break}}return I===void 0&&(I=new J2(i,T,M,r),h.push(I)),I}function A(M){if(--M.usedTimes===0){let T=h.indexOf(M);h[T]=h[h.length-1],h.pop(),M.destroy()}}function L(M){l.remove(M)}function P(){l.dispose()}return{getParameters:m,getProgramCacheKey:_,getUniforms:w,acquireProgram:S,releaseProgram:A,releaseShaderCache:L,programs:h,dispose:P}}function tS(){let i=new WeakMap;function t(r){let a=i.get(r);return a===void 0&&(a={},i.set(r,a)),a}function e(r){i.delete(r)}function n(r,a,o){i.get(r)[a]=o}function s(){i=new WeakMap}return{get:t,remove:e,update:n,dispose:s}}function eS(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.material.id!==t.material.id?i.material.id-t.material.id:i.z!==t.z?i.z-t.z:i.id-t.id}function C0(i,t){return i.groupOrder!==t.groupOrder?i.groupOrder-t.groupOrder:i.renderOrder!==t.renderOrder?i.renderOrder-t.renderOrder:i.z!==t.z?t.z-i.z:i.id-t.id}function k0(){let i=[],t=0,e=[],n=[],s=[];function r(){t=0,e.length=0,n.length=0,s.length=0}function a(u,f,d,g,b,p){let m=i[t];return m===void 0?(m={id:u.id,object:u,geometry:f,material:d,groupOrder:g,renderOrder:u.renderOrder,z:b,group:p},i[t]=m):(m.id=u.id,m.object=u,m.geometry=f,m.material=d,m.groupOrder=g,m.renderOrder=u.renderOrder,m.z=b,m.group=p),t++,m}function o(u,f,d,g,b,p){let m=a(u,f,d,g,b,p);d.transmission>0?n.push(m):d.transparent===!0?s.push(m):e.push(m)}function l(u,f,d,g,b,p){let m=a(u,f,d,g,b,p);d.transmission>0?n.unshift(m):d.transparent===!0?s.unshift(m):e.unshift(m)}function c(u,f){e.length>1&&e.sort(u||eS),n.length>1&&n.sort(f||C0),s.length>1&&s.sort(f||C0)}function h(){for(let u=t,f=i.length;u<f;u++){let d=i[u];if(d.id===null)break;d.id=null,d.object=null,d.geometry=null,d.material=null,d.group=null}}return{opaque:e,transmissive:n,transparent:s,init:r,push:o,unshift:l,finish:h,sort:c}}function nS(){let i=new WeakMap;function t(n,s){let r=i.get(n),a;return r===void 0?(a=new k0,i.set(n,[a])):s>=r.length?(a=new k0,r.push(a)):a=r[s],a}function e(){i=new WeakMap}return{get:t,dispose:e}}function iS(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={direction:new V,color:new Nt};break;case"SpotLight":e={position:new V,direction:new V,color:new Nt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":e={position:new V,color:new Nt,distance:0,decay:0};break;case"HemisphereLight":e={direction:new V,skyColor:new Nt,groundColor:new Nt};break;case"RectAreaLight":e={color:new Nt,position:new V,halfWidth:new V,halfHeight:new V};break}return i[t.id]=e,e}}}function sS(){let i={};return{get:function(t){if(i[t.id]!==void 0)return i[t.id];let e;switch(t.type){case"DirectionalLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qt};break;case"SpotLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qt};break;case"PointLight":e={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new qt,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[t.id]=e,e}}}var rS=0;function oS(i,t){return(t.castShadow?2:0)-(i.castShadow?2:0)+(t.map?1:0)-(i.map?1:0)}function aS(i,t){let e=new iS,n=sS(),s={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let h=0;h<9;h++)s.probe.push(new V);let r=new V,a=new ve,o=new ve;function l(h,u){let f=0,d=0,g=0;for(let I=0;I<9;I++)s.probe[I].set(0,0,0);let b=0,p=0,m=0,_=0,y=0,v=0,w=0,S=0,A=0,L=0,P=0;h.sort(oS);let M=u===!0?Math.PI:1;for(let I=0,F=h.length;I<F;I++){let k=h[I],U=k.color,N=k.intensity,D=k.distance,z=k.shadow&&k.shadow.map?k.shadow.map.texture:null;if(k.isAmbientLight)f+=U.r*N*M,d+=U.g*N*M,g+=U.b*N*M;else if(k.isLightProbe){for(let $=0;$<9;$++)s.probe[$].addScaledVector(k.sh.coefficients[$],N);P++}else if(k.isDirectionalLight){let $=e.get(k);if($.color.copy(k.color).multiplyScalar(k.intensity*M),k.castShadow){let nt=k.shadow,et=n.get(k);et.shadowBias=nt.bias,et.shadowNormalBias=nt.normalBias,et.shadowRadius=nt.radius,et.shadowMapSize=nt.mapSize,s.directionalShadow[b]=et,s.directionalShadowMap[b]=z,s.directionalShadowMatrix[b]=k.shadow.matrix,v++}s.directional[b]=$,b++}else if(k.isSpotLight){let $=e.get(k);$.position.setFromMatrixPosition(k.matrixWorld),$.color.copy(U).multiplyScalar(N*M),$.distance=D,$.coneCos=Math.cos(k.angle),$.penumbraCos=Math.cos(k.angle*(1-k.penumbra)),$.decay=k.decay,s.spot[m]=$;let nt=k.shadow;if(k.map&&(s.spotLightMap[A]=k.map,A++,nt.updateMatrices(k),k.castShadow&&L++),s.spotLightMatrix[m]=nt.matrix,k.castShadow){let et=n.get(k);et.shadowBias=nt.bias,et.shadowNormalBias=nt.normalBias,et.shadowRadius=nt.radius,et.shadowMapSize=nt.mapSize,s.spotShadow[m]=et,s.spotShadowMap[m]=z,S++}m++}else if(k.isRectAreaLight){let $=e.get(k);$.color.copy(U).multiplyScalar(N),$.halfWidth.set(k.width*.5,0,0),$.halfHeight.set(0,k.height*.5,0),s.rectArea[_]=$,_++}else if(k.isPointLight){let $=e.get(k);if($.color.copy(k.color).multiplyScalar(k.intensity*M),$.distance=k.distance,$.decay=k.decay,k.castShadow){let nt=k.shadow,et=n.get(k);et.shadowBias=nt.bias,et.shadowNormalBias=nt.normalBias,et.shadowRadius=nt.radius,et.shadowMapSize=nt.mapSize,et.shadowCameraNear=nt.camera.near,et.shadowCameraFar=nt.camera.far,s.pointShadow[p]=et,s.pointShadowMap[p]=z,s.pointShadowMatrix[p]=k.shadow.matrix,w++}s.point[p]=$,p++}else if(k.isHemisphereLight){let $=e.get(k);$.skyColor.copy(k.color).multiplyScalar(N*M),$.groundColor.copy(k.groundColor).multiplyScalar(N*M),s.hemi[y]=$,y++}}_>0&&(t.isWebGL2?i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=ut.LTC_FLOAT_1,s.rectAreaLTC2=ut.LTC_FLOAT_2):(s.rectAreaLTC1=ut.LTC_HALF_1,s.rectAreaLTC2=ut.LTC_HALF_2):i.has("OES_texture_float_linear")===!0?(s.rectAreaLTC1=ut.LTC_FLOAT_1,s.rectAreaLTC2=ut.LTC_FLOAT_2):i.has("OES_texture_half_float_linear")===!0?(s.rectAreaLTC1=ut.LTC_HALF_1,s.rectAreaLTC2=ut.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),s.ambient[0]=f,s.ambient[1]=d,s.ambient[2]=g;let T=s.hash;(T.directionalLength!==b||T.pointLength!==p||T.spotLength!==m||T.rectAreaLength!==_||T.hemiLength!==y||T.numDirectionalShadows!==v||T.numPointShadows!==w||T.numSpotShadows!==S||T.numSpotMaps!==A||T.numLightProbes!==P)&&(s.directional.length=b,s.spot.length=m,s.rectArea.length=_,s.point.length=p,s.hemi.length=y,s.directionalShadow.length=v,s.directionalShadowMap.length=v,s.pointShadow.length=w,s.pointShadowMap.length=w,s.spotShadow.length=S,s.spotShadowMap.length=S,s.directionalShadowMatrix.length=v,s.pointShadowMatrix.length=w,s.spotLightMatrix.length=S+A-L,s.spotLightMap.length=A,s.numSpotLightShadowsWithMaps=L,s.numLightProbes=P,T.directionalLength=b,T.pointLength=p,T.spotLength=m,T.rectAreaLength=_,T.hemiLength=y,T.numDirectionalShadows=v,T.numPointShadows=w,T.numSpotShadows=S,T.numSpotMaps=A,T.numLightProbes=P,s.version=rS++)}function c(h,u){let f=0,d=0,g=0,b=0,p=0,m=u.matrixWorldInverse;for(let _=0,y=h.length;_<y;_++){let v=h[_];if(v.isDirectionalLight){let w=s.directional[f];w.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),w.direction.sub(r),w.direction.transformDirection(m),f++}else if(v.isSpotLight){let w=s.spot[g];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(m),w.direction.setFromMatrixPosition(v.matrixWorld),r.setFromMatrixPosition(v.target.matrixWorld),w.direction.sub(r),w.direction.transformDirection(m),g++}else if(v.isRectAreaLight){let w=s.rectArea[b];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(m),o.identity(),a.copy(v.matrixWorld),a.premultiply(m),o.extractRotation(a),w.halfWidth.set(v.width*.5,0,0),w.halfHeight.set(0,v.height*.5,0),w.halfWidth.applyMatrix4(o),w.halfHeight.applyMatrix4(o),b++}else if(v.isPointLight){let w=s.point[d];w.position.setFromMatrixPosition(v.matrixWorld),w.position.applyMatrix4(m),d++}else if(v.isHemisphereLight){let w=s.hemi[p];w.direction.setFromMatrixPosition(v.matrixWorld),w.direction.transformDirection(m),p++}}}return{setup:l,setupView:c,state:s}}function R0(i,t){let e=new aS(i,t),n=[],s=[];function r(){n.length=0,s.length=0}function a(u){n.push(u)}function o(u){s.push(u)}function l(u){e.setup(n,u)}function c(u){e.setupView(n,u)}return{init:r,state:{lightsArray:n,shadowsArray:s,lights:e},setupLights:l,setupLightsView:c,pushLight:a,pushShadow:o}}function lS(i,t){let e=new WeakMap;function n(r,a=0){let o=e.get(r),l;return o===void 0?(l=new R0(i,t),e.set(r,[l])):a>=o.length?(l=new R0(i,t),o.push(l)):l=o[a],l}function s(){e=new WeakMap}return{get:n,dispose:s}}var ad=class extends _r{constructor(t){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=uv,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(t)}copy(t){return super.copy(t),this.depthPacking=t.depthPacking,this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this.wireframe=t.wireframe,this.wireframeLinewidth=t.wireframeLinewidth,this}},ld=class extends _r{constructor(t){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(t)}copy(t){return super.copy(t),this.map=t.map,this.alphaMap=t.alphaMap,this.displacementMap=t.displacementMap,this.displacementScale=t.displacementScale,this.displacementBias=t.displacementBias,this}},cS=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,hS=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function uS(i,t,e){let n=new xo,s=new qt,r=new qt,a=new an,o=new ad({depthPacking:dv}),l=new ld,c={},h=e.maxTextureSize,u={[fn]:Dn,[Dn]:fn,[je]:je},f=new Ee({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new qt},radius:{value:4}},vertexShader:cS,fragmentShader:hS}),d=f.clone();d.defines.HORIZONTAL_PASS=1;let g=new Re;g.setAttribute("position",new Vt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));let b=new _e(g,f),p=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=I0;let m=this.type;this.render=function(S,A,L){if(p.enabled===!1||p.autoUpdate===!1&&p.needsUpdate===!1||S.length===0)return;let P=i.getRenderTarget(),M=i.getActiveCubeFace(),T=i.getActiveMipmapLevel(),I=i.state;I.setBlending(Di),I.buffers.color.setClear(1,1,1,1),I.buffers.depth.setTest(!0),I.setScissorTest(!1);let F=m!==Qi&&this.type===Qi,k=m===Qi&&this.type!==Qi;for(let U=0,N=S.length;U<N;U++){let D=S[U],z=D.shadow;if(z===void 0){console.warn("THREE.WebGLShadowMap:",D,"has no shadow.");continue}if(z.autoUpdate===!1&&z.needsUpdate===!1)continue;s.copy(z.mapSize);let $=z.getFrameExtents();if(s.multiply($),r.copy(z.mapSize),(s.x>h||s.y>h)&&(s.x>h&&(r.x=Math.floor(h/$.x),s.x=r.x*$.x,z.mapSize.x=r.x),s.y>h&&(r.y=Math.floor(h/$.y),s.y=r.y*$.y,z.mapSize.y=r.y)),z.map===null||F===!0||k===!0){let et=this.type!==Qi?{minFilter:ke,magFilter:ke}:{};z.map!==null&&z.map.dispose(),z.map=new gi(s.x,s.y,et),z.map.texture.name=D.name+".shadowMap",z.camera.updateProjectionMatrix()}i.setRenderTarget(z.map),i.clear();let nt=z.getViewportCount();for(let et=0;et<nt;et++){let rt=z.getViewport(et);a.set(r.x*rt.x,r.y*rt.y,r.x*rt.z,r.y*rt.w),I.viewport(a),z.updateMatrices(D,et),n=z.getFrustum(),v(A,L,z.camera,D,this.type)}z.isPointLightShadow!==!0&&this.type===Qi&&_(z,L),z.needsUpdate=!1}m=this.type,p.needsUpdate=!1,i.setRenderTarget(P,M,T)};function _(S,A){let L=t.update(b);f.defines.VSM_SAMPLES!==S.blurSamples&&(f.defines.VSM_SAMPLES=S.blurSamples,d.defines.VSM_SAMPLES=S.blurSamples,f.needsUpdate=!0,d.needsUpdate=!0),S.mapPass===null&&(S.mapPass=new gi(s.x,s.y)),f.uniforms.shadow_pass.value=S.map.texture,f.uniforms.resolution.value=S.mapSize,f.uniforms.radius.value=S.radius,i.setRenderTarget(S.mapPass),i.clear(),i.renderBufferDirect(A,null,L,f,b,null),d.uniforms.shadow_pass.value=S.mapPass.texture,d.uniforms.resolution.value=S.mapSize,d.uniforms.radius.value=S.radius,i.setRenderTarget(S.map),i.clear(),i.renderBufferDirect(A,null,L,d,b,null)}function y(S,A,L,P){let M=null,T=L.isPointLight===!0?S.customDistanceMaterial:S.customDepthMaterial;if(T!==void 0)M=T;else if(M=L.isPointLight===!0?l:o,i.localClippingEnabled&&A.clipShadows===!0&&Array.isArray(A.clippingPlanes)&&A.clippingPlanes.length!==0||A.displacementMap&&A.displacementScale!==0||A.alphaMap&&A.alphaTest>0||A.map&&A.alphaTest>0){let I=M.uuid,F=A.uuid,k=c[I];k===void 0&&(k={},c[I]=k);let U=k[F];U===void 0&&(U=M.clone(),k[F]=U,A.addEventListener("dispose",w)),M=U}if(M.visible=A.visible,M.wireframe=A.wireframe,P===Qi?M.side=A.shadowSide!==null?A.shadowSide:A.side:M.side=A.shadowSide!==null?A.shadowSide:u[A.side],M.alphaMap=A.alphaMap,M.alphaTest=A.alphaTest,M.map=A.map,M.clipShadows=A.clipShadows,M.clippingPlanes=A.clippingPlanes,M.clipIntersection=A.clipIntersection,M.displacementMap=A.displacementMap,M.displacementScale=A.displacementScale,M.displacementBias=A.displacementBias,M.wireframeLinewidth=A.wireframeLinewidth,M.linewidth=A.linewidth,L.isPointLight===!0&&M.isMeshDistanceMaterial===!0){let I=i.properties.get(M);I.light=L}return M}function v(S,A,L,P,M){if(S.visible===!1)return;if(S.layers.test(A.layers)&&(S.isMesh||S.isLine||S.isPoints)&&(S.castShadow||S.receiveShadow&&M===Qi)&&(!S.frustumCulled||n.intersectsObject(S))){S.modelViewMatrix.multiplyMatrices(L.matrixWorldInverse,S.matrixWorld);let F=t.update(S),k=S.material;if(Array.isArray(k)){let U=F.groups;for(let N=0,D=U.length;N<D;N++){let z=U[N],$=k[z.materialIndex];if($&&$.visible){let nt=y(S,$,P,M);S.onBeforeShadow(i,S,A,L,F,nt,z),i.renderBufferDirect(L,null,F,nt,S,z),S.onAfterShadow(i,S,A,L,F,nt,z)}}}else if(k.visible){let U=y(S,k,P,M);S.onBeforeShadow(i,S,A,L,F,U,null),i.renderBufferDirect(L,null,F,U,S,null),S.onAfterShadow(i,S,A,L,F,U,null)}}let I=S.children;for(let F=0,k=I.length;F<k;F++)v(I[F],A,L,P,M)}function w(S){S.target.removeEventListener("dispose",w);for(let L in c){let P=c[L],M=S.target.uuid;M in P&&(P[M].dispose(),delete P[M])}}}function dS(i,t,e){let n=e.isWebGL2;function s(){let B=!1,pt=new an,q=null,ct=new an(0,0,0,0);return{setMask:function(gt){q!==gt&&!B&&(i.colorMask(gt,gt,gt,gt),q=gt)},setLocked:function(gt){B=gt},setClear:function(gt,re,pe,tn,Yn){Yn===!0&&(gt*=tn,re*=tn,pe*=tn),pt.set(gt,re,pe,tn),ct.equals(pt)===!1&&(i.clearColor(gt,re,pe,tn),ct.copy(pt))},reset:function(){B=!1,q=null,ct.set(-1,0,0,0)}}}function r(){let B=!1,pt=null,q=null,ct=null;return{setTest:function(gt){gt?ht(i.DEPTH_TEST):Ht(i.DEPTH_TEST)},setMask:function(gt){pt!==gt&&!B&&(i.depthMask(gt),pt=gt)},setFunc:function(gt){if(q!==gt){switch(gt){case H_:i.depthFunc(i.NEVER);break;case G_:i.depthFunc(i.ALWAYS);break;case W_:i.depthFunc(i.LESS);break;case Kl:i.depthFunc(i.LEQUAL);break;case V_:i.depthFunc(i.EQUAL);break;case $_:i.depthFunc(i.GEQUAL);break;case X_:i.depthFunc(i.GREATER);break;case q_:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}q=gt}},setLocked:function(gt){B=gt},setClear:function(gt){ct!==gt&&(i.clearDepth(gt),ct=gt)},reset:function(){B=!1,pt=null,q=null,ct=null}}}function a(){let B=!1,pt=null,q=null,ct=null,gt=null,re=null,pe=null,tn=null,Yn=null;return{setTest:function(me){B||(me?ht(i.STENCIL_TEST):Ht(i.STENCIL_TEST))},setMask:function(me){pt!==me&&!B&&(i.stencilMask(me),pt=me)},setFunc:function(me,_n,Ei){(q!==me||ct!==_n||gt!==Ei)&&(i.stencilFunc(me,_n,Ei),q=me,ct=_n,gt=Ei)},setOp:function(me,_n,Ei){(re!==me||pe!==_n||tn!==Ei)&&(i.stencilOp(me,_n,Ei),re=me,pe=_n,tn=Ei)},setLocked:function(me){B=me},setClear:function(me){Yn!==me&&(i.clearStencil(me),Yn=me)},reset:function(){B=!1,pt=null,q=null,ct=null,gt=null,re=null,pe=null,tn=null,Yn=null}}}let o=new s,l=new r,c=new a,h=new WeakMap,u=new WeakMap,f={},d={},g=new WeakMap,b=[],p=null,m=!1,_=null,y=null,v=null,w=null,S=null,A=null,L=null,P=new Nt(0,0,0),M=0,T=!1,I=null,F=null,k=null,U=null,N=null,D=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS),z=!1,$=0,nt=i.getParameter(i.VERSION);nt.indexOf("WebGL")!==-1?($=parseFloat(/^WebGL (\d)/.exec(nt)[1]),z=$>=1):nt.indexOf("OpenGL ES")!==-1&&($=parseFloat(/^OpenGL ES (\d)/.exec(nt)[1]),z=$>=2);let et=null,rt={},bt=i.getParameter(i.SCISSOR_BOX),G=i.getParameter(i.VIEWPORT),tt=new an().fromArray(bt),at=new an().fromArray(G);function Q(B,pt,q,ct){let gt=new Uint8Array(4),re=i.createTexture();i.bindTexture(B,re),i.texParameteri(B,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(B,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let pe=0;pe<q;pe++)n&&(B===i.TEXTURE_3D||B===i.TEXTURE_2D_ARRAY)?i.texImage3D(pt,0,i.RGBA,1,1,ct,0,i.RGBA,i.UNSIGNED_BYTE,gt):i.texImage2D(pt+pe,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,gt);return re}let ft={};ft[i.TEXTURE_2D]=Q(i.TEXTURE_2D,i.TEXTURE_2D,1),ft[i.TEXTURE_CUBE_MAP]=Q(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),n&&(ft[i.TEXTURE_2D_ARRAY]=Q(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),ft[i.TEXTURE_3D]=Q(i.TEXTURE_3D,i.TEXTURE_3D,1,1)),o.setClear(0,0,0,1),l.setClear(1),c.setClear(0),ht(i.DEPTH_TEST),l.setFunc(Kl),Gt(!1),Yt(lm),ht(i.CULL_FACE),kt(Di);function ht(B){f[B]!==!0&&(i.enable(B),f[B]=!0)}function Ht(B){f[B]!==!1&&(i.disable(B),f[B]=!1)}function Et(B,pt){return d[B]!==pt?(i.bindFramebuffer(B,pt),d[B]=pt,n&&(B===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=pt),B===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=pt)),!0):!1}function O(B,pt){let q=b,ct=!1;if(B){q=g.get(pt),q===void 0&&(q=[],g.set(pt,q));let gt=B.textures;if(q.length!==gt.length||q[0]!==i.COLOR_ATTACHMENT0){for(let re=0,pe=gt.length;re<pe;re++)q[re]=i.COLOR_ATTACHMENT0+re;q.length=gt.length,ct=!0}}else q[0]!==i.BACK&&(q[0]=i.BACK,ct=!0);if(ct)if(e.isWebGL2)i.drawBuffers(q);else if(t.has("WEBGL_draw_buffers")===!0)t.get("WEBGL_draw_buffers").drawBuffersWEBGL(q);else throw new Error("THREE.WebGLState: Usage of gl.drawBuffers() require WebGL2 or WEBGL_draw_buffers extension")}function be(B){return p!==B?(i.useProgram(B),p=B,!0):!1}let xt={[dr]:i.FUNC_ADD,[E_]:i.FUNC_SUBTRACT,[T_]:i.FUNC_REVERSE_SUBTRACT};if(n)xt[um]=i.MIN,xt[dm]=i.MAX;else{let B=t.get("EXT_blend_minmax");B!==null&&(xt[um]=B.MIN_EXT,xt[dm]=B.MAX_EXT)}let wt={[C_]:i.ZERO,[k_]:i.ONE,[R_]:i.SRC_COLOR,[Gu]:i.SRC_ALPHA,[N_]:i.SRC_ALPHA_SATURATE,[D_]:i.DST_COLOR,[P_]:i.DST_ALPHA,[L_]:i.ONE_MINUS_SRC_COLOR,[Wu]:i.ONE_MINUS_SRC_ALPHA,[U_]:i.ONE_MINUS_DST_COLOR,[I_]:i.ONE_MINUS_DST_ALPHA,[B_]:i.CONSTANT_COLOR,[F_]:i.ONE_MINUS_CONSTANT_COLOR,[O_]:i.CONSTANT_ALPHA,[z_]:i.ONE_MINUS_CONSTANT_ALPHA};function kt(B,pt,q,ct,gt,re,pe,tn,Yn,me){if(B===Di){m===!0&&(Ht(i.BLEND),m=!1);return}if(m===!1&&(ht(i.BLEND),m=!0),B!==A_){if(B!==_||me!==T){if((y!==dr||S!==dr)&&(i.blendEquation(i.FUNC_ADD),y=dr,S=dr),me)switch(B){case is:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case go:i.blendFunc(i.ONE,i.ONE);break;case cm:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case hm:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}else switch(B){case is:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case go:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case cm:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case hm:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",B);break}v=null,w=null,A=null,L=null,P.set(0,0,0),M=0,_=B,T=me}return}gt=gt||pt,re=re||q,pe=pe||ct,(pt!==y||gt!==S)&&(i.blendEquationSeparate(xt[pt],xt[gt]),y=pt,S=gt),(q!==v||ct!==w||re!==A||pe!==L)&&(i.blendFuncSeparate(wt[q],wt[ct],wt[re],wt[pe]),v=q,w=ct,A=re,L=pe),(tn.equals(P)===!1||Yn!==M)&&(i.blendColor(tn.r,tn.g,tn.b,Yn),P.copy(tn),M=Yn),_=B,T=!1}function ie(B,pt){B.side===je?Ht(i.CULL_FACE):ht(i.CULL_FACE);let q=B.side===Dn;pt&&(q=!q),Gt(q),B.blending===is&&B.transparent===!1?kt(Di):kt(B.blending,B.blendEquation,B.blendSrc,B.blendDst,B.blendEquationAlpha,B.blendSrcAlpha,B.blendDstAlpha,B.blendColor,B.blendAlpha,B.premultipliedAlpha),l.setFunc(B.depthFunc),l.setTest(B.depthTest),l.setMask(B.depthWrite),o.setMask(B.colorWrite);let ct=B.stencilWrite;c.setTest(ct),ct&&(c.setMask(B.stencilWriteMask),c.setFunc(B.stencilFunc,B.stencilRef,B.stencilFuncMask),c.setOp(B.stencilFail,B.stencilZFail,B.stencilZPass)),R(B.polygonOffset,B.polygonOffsetFactor,B.polygonOffsetUnits),B.alphaToCoverage===!0?ht(i.SAMPLE_ALPHA_TO_COVERAGE):Ht(i.SAMPLE_ALPHA_TO_COVERAGE)}function Gt(B){I!==B&&(B?i.frontFace(i.CW):i.frontFace(i.CCW),I=B)}function Yt(B){B!==w_?(ht(i.CULL_FACE),B!==F&&(B===lm?i.cullFace(i.BACK):B===M_?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Ht(i.CULL_FACE),F=B}function we(B){B!==k&&(z&&i.lineWidth(B),k=B)}function R(B,pt,q){B?(ht(i.POLYGON_OFFSET_FILL),(U!==pt||N!==q)&&(i.polygonOffset(pt,q),U=pt,N=q)):Ht(i.POLYGON_OFFSET_FILL)}function E(B){B?ht(i.SCISSOR_TEST):Ht(i.SCISSOR_TEST)}function j(B){B===void 0&&(B=i.TEXTURE0+D-1),et!==B&&(i.activeTexture(B),et=B)}function it(B,pt,q){q===void 0&&(et===null?q=i.TEXTURE0+D-1:q=et);let ct=rt[q];ct===void 0&&(ct={type:void 0,texture:void 0},rt[q]=ct),(ct.type!==B||ct.texture!==pt)&&(et!==q&&(i.activeTexture(q),et=q),i.bindTexture(B,pt||ft[B]),ct.type=B,ct.texture=pt)}function ot(){let B=rt[et];B!==void 0&&B.type!==void 0&&(i.bindTexture(B.type,null),B.type=void 0,B.texture=void 0)}function st(){try{i.compressedTexImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Kt(){try{i.compressedTexImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Dt(){try{i.texSubImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function dt(){try{i.texSubImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function mt(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Zt(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function lt(){try{i.texStorage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Be(){try{i.texStorage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function se(){try{i.texImage2D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function Rt(){try{i.texImage3D.apply(i,arguments)}catch(B){console.error("THREE.WebGLState:",B)}}function At(B){tt.equals(B)===!1&&(i.scissor(B.x,B.y,B.z,B.w),tt.copy(B))}function Tt(B){at.equals(B)===!1&&(i.viewport(B.x,B.y,B.z,B.w),at.copy(B))}function le(B,pt){let q=u.get(pt);q===void 0&&(q=new WeakMap,u.set(pt,q));let ct=q.get(B);ct===void 0&&(ct=i.getUniformBlockIndex(pt,B.name),q.set(B,ct))}function $t(B,pt){let ct=u.get(pt).get(B);h.get(pt)!==ct&&(i.uniformBlockBinding(pt,ct,B.__bindingPointIndex),h.set(pt,ct))}function Me(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),n===!0&&(i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null)),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),f={},et=null,rt={},d={},g=new WeakMap,b=[],p=null,m=!1,_=null,y=null,v=null,w=null,S=null,A=null,L=null,P=new Nt(0,0,0),M=0,T=!1,I=null,F=null,k=null,U=null,N=null,tt.set(0,0,i.canvas.width,i.canvas.height),at.set(0,0,i.canvas.width,i.canvas.height),o.reset(),l.reset(),c.reset()}return{buffers:{color:o,depth:l,stencil:c},enable:ht,disable:Ht,bindFramebuffer:Et,drawBuffers:O,useProgram:be,setBlending:kt,setMaterial:ie,setFlipSided:Gt,setCullFace:Yt,setLineWidth:we,setPolygonOffset:R,setScissorTest:E,activeTexture:j,bindTexture:it,unbindTexture:ot,compressedTexImage2D:st,compressedTexImage3D:Kt,texImage2D:se,texImage3D:Rt,updateUBOMapping:le,uniformBlockBinding:$t,texStorage2D:lt,texStorage3D:Be,texSubImage2D:Dt,texSubImage3D:dt,compressedTexSubImage2D:mt,compressedTexSubImage3D:Zt,scissor:At,viewport:Tt,reset:Me}}function fS(i,t,e,n,s,r,a){let o=s.isWebGL2,l=t.has("WEBGL_multisampled_render_to_texture")?t.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator=="undefined"?!1:/OculusBrowser/g.test(navigator.userAgent),h=new qt,u=new WeakMap,f,d=new WeakMap,g=!1;try{g=typeof OffscreenCanvas!="undefined"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function b(R,E){return g?new OffscreenCanvas(R,E):nc("canvas")}function p(R,E,j,it){let ot=1,st=we(R);if((st.width>it||st.height>it)&&(ot=it/Math.max(st.width,st.height)),ot<1||E===!0)if(typeof HTMLImageElement!="undefined"&&R instanceof HTMLImageElement||typeof HTMLCanvasElement!="undefined"&&R instanceof HTMLCanvasElement||typeof ImageBitmap!="undefined"&&R instanceof ImageBitmap||typeof VideoFrame!="undefined"&&R instanceof VideoFrame){let Kt=E?Zu:Math.floor,Dt=Kt(ot*st.width),dt=Kt(ot*st.height);f===void 0&&(f=b(Dt,dt));let mt=j?b(Dt,dt):f;return mt.width=Dt,mt.height=dt,mt.getContext("2d").drawImage(R,0,0,Dt,dt),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+st.width+"x"+st.height+") to ("+Dt+"x"+dt+")."),mt}else return"data"in R&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+st.width+"x"+st.height+")."),R;return R}function m(R){let E=we(R);return $m(E.width)&&$m(E.height)}function _(R){return o?!1:R.wrapS!==on||R.wrapT!==on||R.minFilter!==ke&&R.minFilter!==Pn}function y(R,E){return R.generateMipmaps&&E&&R.minFilter!==ke&&R.minFilter!==Pn}function v(R){i.generateMipmap(R)}function w(R,E,j,it,ot=!1){if(o===!1)return E;if(R!==null){if(i[R]!==void 0)return i[R];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+R+"'")}let st=E;if(E===i.RED&&(j===i.FLOAT&&(st=i.R32F),j===i.HALF_FLOAT&&(st=i.R16F),j===i.UNSIGNED_BYTE&&(st=i.R8)),E===i.RED_INTEGER&&(j===i.UNSIGNED_BYTE&&(st=i.R8UI),j===i.UNSIGNED_SHORT&&(st=i.R16UI),j===i.UNSIGNED_INT&&(st=i.R32UI),j===i.BYTE&&(st=i.R8I),j===i.SHORT&&(st=i.R16I),j===i.INT&&(st=i.R32I)),E===i.RG&&(j===i.FLOAT&&(st=i.RG32F),j===i.HALF_FLOAT&&(st=i.RG16F),j===i.UNSIGNED_BYTE&&(st=i.RG8)),E===i.RG_INTEGER&&(j===i.UNSIGNED_BYTE&&(st=i.RG8UI),j===i.UNSIGNED_SHORT&&(st=i.RG16UI),j===i.UNSIGNED_INT&&(st=i.RG32UI),j===i.BYTE&&(st=i.RG8I),j===i.SHORT&&(st=i.RG16I),j===i.INT&&(st=i.RG32I)),E===i.RGBA){let Kt=ot?jl:he.getTransfer(it);j===i.FLOAT&&(st=i.RGBA32F),j===i.HALF_FLOAT&&(st=i.RGBA16F),j===i.UNSIGNED_BYTE&&(st=Kt===ye?i.SRGB8_ALPHA8:i.RGBA8),j===i.UNSIGNED_SHORT_4_4_4_4&&(st=i.RGBA4),j===i.UNSIGNED_SHORT_5_5_5_1&&(st=i.RGB5_A1)}return(st===i.R16F||st===i.R32F||st===i.RG16F||st===i.RG32F||st===i.RGBA16F||st===i.RGBA32F)&&t.get("EXT_color_buffer_float"),st}function S(R,E,j){return y(R,j)===!0||R.isFramebufferTexture&&R.minFilter!==ke&&R.minFilter!==Pn?Math.log2(Math.max(E.width,E.height))+1:R.mipmaps!==void 0&&R.mipmaps.length>0?R.mipmaps.length:R.isCompressedTexture&&Array.isArray(R.image)?E.mipmaps.length:1}function A(R){return R===ke||R===fm||R===fr?i.NEAREST:i.LINEAR}function L(R){let E=R.target;E.removeEventListener("dispose",L),M(E),E.isVideoTexture&&u.delete(E)}function P(R){let E=R.target;E.removeEventListener("dispose",P),I(E)}function M(R){let E=n.get(R);if(E.__webglInit===void 0)return;let j=R.source,it=d.get(j);if(it){let ot=it[E.__cacheKey];ot.usedTimes--,ot.usedTimes===0&&T(R),Object.keys(it).length===0&&d.delete(j)}n.remove(R)}function T(R){let E=n.get(R);i.deleteTexture(E.__webglTexture);let j=R.source,it=d.get(j);delete it[E.__cacheKey],a.memory.textures--}function I(R){let E=n.get(R);if(R.depthTexture&&R.depthTexture.dispose(),R.isWebGLCubeRenderTarget)for(let it=0;it<6;it++){if(Array.isArray(E.__webglFramebuffer[it]))for(let ot=0;ot<E.__webglFramebuffer[it].length;ot++)i.deleteFramebuffer(E.__webglFramebuffer[it][ot]);else i.deleteFramebuffer(E.__webglFramebuffer[it]);E.__webglDepthbuffer&&i.deleteRenderbuffer(E.__webglDepthbuffer[it])}else{if(Array.isArray(E.__webglFramebuffer))for(let it=0;it<E.__webglFramebuffer.length;it++)i.deleteFramebuffer(E.__webglFramebuffer[it]);else i.deleteFramebuffer(E.__webglFramebuffer);if(E.__webglDepthbuffer&&i.deleteRenderbuffer(E.__webglDepthbuffer),E.__webglMultisampledFramebuffer&&i.deleteFramebuffer(E.__webglMultisampledFramebuffer),E.__webglColorRenderbuffer)for(let it=0;it<E.__webglColorRenderbuffer.length;it++)E.__webglColorRenderbuffer[it]&&i.deleteRenderbuffer(E.__webglColorRenderbuffer[it]);E.__webglDepthRenderbuffer&&i.deleteRenderbuffer(E.__webglDepthRenderbuffer)}let j=R.textures;for(let it=0,ot=j.length;it<ot;it++){let st=n.get(j[it]);st.__webglTexture&&(i.deleteTexture(st.__webglTexture),a.memory.textures--),n.remove(j[it])}n.remove(R)}let F=0;function k(){F=0}function U(){let R=F;return R>=s.maxTextures&&console.warn("THREE.WebGLTextures: Trying to use "+R+" texture units while this GPU supports only "+s.maxTextures),F+=1,R}function N(R){let E=[];return E.push(R.wrapS),E.push(R.wrapT),E.push(R.wrapR||0),E.push(R.magFilter),E.push(R.minFilter),E.push(R.anisotropy),E.push(R.internalFormat),E.push(R.format),E.push(R.type),E.push(R.generateMipmaps),E.push(R.premultiplyAlpha),E.push(R.flipY),E.push(R.unpackAlignment),E.push(R.colorSpace),E.join()}function D(R,E){let j=n.get(R);if(R.isVideoTexture&&Gt(R),R.isRenderTargetTexture===!1&&R.version>0&&j.__version!==R.version){let it=R.image;if(it===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(it.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{at(j,R,E);return}}e.bindTexture(i.TEXTURE_2D,j.__webglTexture,i.TEXTURE0+E)}function z(R,E){let j=n.get(R);if(R.version>0&&j.__version!==R.version){at(j,R,E);return}e.bindTexture(i.TEXTURE_2D_ARRAY,j.__webglTexture,i.TEXTURE0+E)}function $(R,E){let j=n.get(R);if(R.version>0&&j.__version!==R.version){at(j,R,E);return}e.bindTexture(i.TEXTURE_3D,j.__webglTexture,i.TEXTURE0+E)}function nt(R,E){let j=n.get(R);if(R.version>0&&j.__version!==R.version){Q(j,R,E);return}e.bindTexture(i.TEXTURE_CUBE_MAP,j.__webglTexture,i.TEXTURE0+E)}let et={[Xu]:i.REPEAT,[on]:i.CLAMP_TO_EDGE,[qu]:i.MIRRORED_REPEAT},rt={[ke]:i.NEAREST,[fm]:i.NEAREST_MIPMAP_NEAREST,[fr]:i.NEAREST_MIPMAP_LINEAR,[Pn]:i.LINEAR,[cu]:i.LINEAR_MIPMAP_NEAREST,[mr]:i.LINEAR_MIPMAP_LINEAR},bt={[mv]:i.NEVER,[xv]:i.ALWAYS,[gv]:i.LESS,[W0]:i.LEQUAL,[bv]:i.EQUAL,[vv]:i.GEQUAL,[yv]:i.GREATER,[_v]:i.NOTEQUAL};function G(R,E,j){if(E.type===es&&t.has("OES_texture_float_linear")===!1&&(E.magFilter===Pn||E.magFilter===cu||E.magFilter===fr||E.magFilter===mr||E.minFilter===Pn||E.minFilter===cu||E.minFilter===fr||E.minFilter===mr)&&console.warn("THREE.WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),j?(i.texParameteri(R,i.TEXTURE_WRAP_S,et[E.wrapS]),i.texParameteri(R,i.TEXTURE_WRAP_T,et[E.wrapT]),(R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY)&&i.texParameteri(R,i.TEXTURE_WRAP_R,et[E.wrapR]),i.texParameteri(R,i.TEXTURE_MAG_FILTER,rt[E.magFilter]),i.texParameteri(R,i.TEXTURE_MIN_FILTER,rt[E.minFilter])):(i.texParameteri(R,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(R,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),(R===i.TEXTURE_3D||R===i.TEXTURE_2D_ARRAY)&&i.texParameteri(R,i.TEXTURE_WRAP_R,i.CLAMP_TO_EDGE),(E.wrapS!==on||E.wrapT!==on)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),i.texParameteri(R,i.TEXTURE_MAG_FILTER,A(E.magFilter)),i.texParameteri(R,i.TEXTURE_MIN_FILTER,A(E.minFilter)),E.minFilter!==ke&&E.minFilter!==Pn&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),E.compareFunction&&(i.texParameteri(R,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(R,i.TEXTURE_COMPARE_FUNC,bt[E.compareFunction])),t.has("EXT_texture_filter_anisotropic")===!0){if(E.magFilter===ke||E.minFilter!==fr&&E.minFilter!==mr||E.type===es&&t.has("OES_texture_float_linear")===!1||o===!1&&E.type===va&&t.has("OES_texture_half_float_linear")===!1)return;if(E.anisotropy>1||n.get(E).__currentAnisotropy){let it=t.get("EXT_texture_filter_anisotropic");i.texParameterf(R,it.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(E.anisotropy,s.getMaxAnisotropy())),n.get(E).__currentAnisotropy=E.anisotropy}}}function tt(R,E){let j=!1;R.__webglInit===void 0&&(R.__webglInit=!0,E.addEventListener("dispose",L));let it=E.source,ot=d.get(it);ot===void 0&&(ot={},d.set(it,ot));let st=N(E);if(st!==R.__cacheKey){ot[st]===void 0&&(ot[st]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,j=!0),ot[st].usedTimes++;let Kt=ot[R.__cacheKey];Kt!==void 0&&(ot[R.__cacheKey].usedTimes--,Kt.usedTimes===0&&T(E)),R.__cacheKey=st,R.__webglTexture=ot[st].texture}return j}function at(R,E,j){let it=i.TEXTURE_2D;(E.isDataArrayTexture||E.isCompressedArrayTexture)&&(it=i.TEXTURE_2D_ARRAY),E.isData3DTexture&&(it=i.TEXTURE_3D);let ot=tt(R,E),st=E.source;e.bindTexture(it,R.__webglTexture,i.TEXTURE0+j);let Kt=n.get(st);if(st.version!==Kt.__version||ot===!0){e.activeTexture(i.TEXTURE0+j);let Dt=he.getPrimaries(he.workingColorSpace),dt=E.colorSpace===Rs?null:he.getPrimaries(E.colorSpace),mt=E.colorSpace===Rs||Dt===dt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,mt);let Zt=_(E)&&m(E.image)===!1,lt=p(E.image,Zt,!1,s.maxTextureSize);lt=Yt(E,lt);let Be=m(lt)||o,se=r.convert(E.format,E.colorSpace),Rt=r.convert(E.type),At=w(E.internalFormat,se,Rt,E.colorSpace,E.isVideoTexture);G(it,E,Be);let Tt,le=E.mipmaps,$t=o&&E.isVideoTexture!==!0&&At!==G0,Me=Kt.__version===void 0||ot===!0,B=st.dataReady,pt=S(E,lt,Be);if(E.isDepthTexture)At=i.DEPTH_COMPONENT,o?E.type===es?At=i.DEPTH_COMPONENT32F:E.type===Ls?At=i.DEPTH_COMPONENT24:E.type===gr?At=i.DEPTH24_STENCIL8:At=i.DEPTH_COMPONENT16:E.type===es&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),E.format===br&&At===i.DEPTH_COMPONENT&&E.type!==Ed&&E.type!==Ls&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),E.type=Ls,Rt=r.convert(E.type)),E.format===_o&&At===i.DEPTH_COMPONENT&&(At=i.DEPTH_STENCIL,E.type!==gr&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),E.type=gr,Rt=r.convert(E.type))),Me&&($t?e.texStorage2D(i.TEXTURE_2D,1,At,lt.width,lt.height):e.texImage2D(i.TEXTURE_2D,0,At,lt.width,lt.height,0,se,Rt,null));else if(E.isDataTexture)if(le.length>0&&Be){$t&&Me&&e.texStorage2D(i.TEXTURE_2D,pt,At,le[0].width,le[0].height);for(let q=0,ct=le.length;q<ct;q++)Tt=le[q],$t?B&&e.texSubImage2D(i.TEXTURE_2D,q,0,0,Tt.width,Tt.height,se,Rt,Tt.data):e.texImage2D(i.TEXTURE_2D,q,At,Tt.width,Tt.height,0,se,Rt,Tt.data);E.generateMipmaps=!1}else $t?(Me&&e.texStorage2D(i.TEXTURE_2D,pt,At,lt.width,lt.height),B&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,lt.width,lt.height,se,Rt,lt.data)):e.texImage2D(i.TEXTURE_2D,0,At,lt.width,lt.height,0,se,Rt,lt.data);else if(E.isCompressedTexture)if(E.isCompressedArrayTexture){$t&&Me&&e.texStorage3D(i.TEXTURE_2D_ARRAY,pt,At,le[0].width,le[0].height,lt.depth);for(let q=0,ct=le.length;q<ct;q++)Tt=le[q],E.format!==An?se!==null?$t?B&&e.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,0,Tt.width,Tt.height,lt.depth,se,Tt.data,0,0):e.compressedTexImage3D(i.TEXTURE_2D_ARRAY,q,At,Tt.width,Tt.height,lt.depth,0,Tt.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):$t?B&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,q,0,0,0,Tt.width,Tt.height,lt.depth,se,Rt,Tt.data):e.texImage3D(i.TEXTURE_2D_ARRAY,q,At,Tt.width,Tt.height,lt.depth,0,se,Rt,Tt.data)}else{$t&&Me&&e.texStorage2D(i.TEXTURE_2D,pt,At,le[0].width,le[0].height);for(let q=0,ct=le.length;q<ct;q++)Tt=le[q],E.format!==An?se!==null?$t?B&&e.compressedTexSubImage2D(i.TEXTURE_2D,q,0,0,Tt.width,Tt.height,se,Tt.data):e.compressedTexImage2D(i.TEXTURE_2D,q,At,Tt.width,Tt.height,0,Tt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):$t?B&&e.texSubImage2D(i.TEXTURE_2D,q,0,0,Tt.width,Tt.height,se,Rt,Tt.data):e.texImage2D(i.TEXTURE_2D,q,At,Tt.width,Tt.height,0,se,Rt,Tt.data)}else if(E.isDataArrayTexture)$t?(Me&&e.texStorage3D(i.TEXTURE_2D_ARRAY,pt,At,lt.width,lt.height,lt.depth),B&&e.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,lt.width,lt.height,lt.depth,se,Rt,lt.data)):e.texImage3D(i.TEXTURE_2D_ARRAY,0,At,lt.width,lt.height,lt.depth,0,se,Rt,lt.data);else if(E.isData3DTexture)$t?(Me&&e.texStorage3D(i.TEXTURE_3D,pt,At,lt.width,lt.height,lt.depth),B&&e.texSubImage3D(i.TEXTURE_3D,0,0,0,0,lt.width,lt.height,lt.depth,se,Rt,lt.data)):e.texImage3D(i.TEXTURE_3D,0,At,lt.width,lt.height,lt.depth,0,se,Rt,lt.data);else if(E.isFramebufferTexture){if(Me)if($t)e.texStorage2D(i.TEXTURE_2D,pt,At,lt.width,lt.height);else{let q=lt.width,ct=lt.height;for(let gt=0;gt<pt;gt++)e.texImage2D(i.TEXTURE_2D,gt,At,q,ct,0,se,Rt,null),q>>=1,ct>>=1}}else if(le.length>0&&Be){if($t&&Me){let q=we(le[0]);e.texStorage2D(i.TEXTURE_2D,pt,At,q.width,q.height)}for(let q=0,ct=le.length;q<ct;q++)Tt=le[q],$t?B&&e.texSubImage2D(i.TEXTURE_2D,q,0,0,se,Rt,Tt):e.texImage2D(i.TEXTURE_2D,q,At,se,Rt,Tt);E.generateMipmaps=!1}else if($t){if(Me){let q=we(lt);e.texStorage2D(i.TEXTURE_2D,pt,At,q.width,q.height)}B&&e.texSubImage2D(i.TEXTURE_2D,0,0,0,se,Rt,lt)}else e.texImage2D(i.TEXTURE_2D,0,At,se,Rt,lt);y(E,Be)&&v(it),Kt.__version=st.version,E.onUpdate&&E.onUpdate(E)}R.__version=E.version}function Q(R,E,j){if(E.image.length!==6)return;let it=tt(R,E),ot=E.source;e.bindTexture(i.TEXTURE_CUBE_MAP,R.__webglTexture,i.TEXTURE0+j);let st=n.get(ot);if(ot.version!==st.__version||it===!0){e.activeTexture(i.TEXTURE0+j);let Kt=he.getPrimaries(he.workingColorSpace),Dt=E.colorSpace===Rs?null:he.getPrimaries(E.colorSpace),dt=E.colorSpace===Rs||Kt===Dt?i.NONE:i.BROWSER_DEFAULT_WEBGL;i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,E.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,E.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,E.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,dt);let mt=E.isCompressedTexture||E.image[0].isCompressedTexture,Zt=E.image[0]&&E.image[0].isDataTexture,lt=[];for(let q=0;q<6;q++)!mt&&!Zt?lt[q]=p(E.image[q],!1,!0,s.maxCubemapSize):lt[q]=Zt?E.image[q].image:E.image[q],lt[q]=Yt(E,lt[q]);let Be=lt[0],se=m(Be)||o,Rt=r.convert(E.format,E.colorSpace),At=r.convert(E.type),Tt=w(E.internalFormat,Rt,At,E.colorSpace),le=o&&E.isVideoTexture!==!0,$t=st.__version===void 0||it===!0,Me=ot.dataReady,B=S(E,Be,se);G(i.TEXTURE_CUBE_MAP,E,se);let pt;if(mt){le&&$t&&e.texStorage2D(i.TEXTURE_CUBE_MAP,B,Tt,Be.width,Be.height);for(let q=0;q<6;q++){pt=lt[q].mipmaps;for(let ct=0;ct<pt.length;ct++){let gt=pt[ct];E.format!==An?Rt!==null?le?Me&&e.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ct,0,0,gt.width,gt.height,Rt,gt.data):e.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ct,Tt,gt.width,gt.height,0,gt.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):le?Me&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ct,0,0,gt.width,gt.height,Rt,At,gt.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ct,Tt,gt.width,gt.height,0,Rt,At,gt.data)}}}else{if(pt=E.mipmaps,le&&$t){pt.length>0&&B++;let q=we(lt[0]);e.texStorage2D(i.TEXTURE_CUBE_MAP,B,Tt,q.width,q.height)}for(let q=0;q<6;q++)if(Zt){le?Me&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,lt[q].width,lt[q].height,Rt,At,lt[q].data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Tt,lt[q].width,lt[q].height,0,Rt,At,lt[q].data);for(let ct=0;ct<pt.length;ct++){let re=pt[ct].image[q].image;le?Me&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ct+1,0,0,re.width,re.height,Rt,At,re.data):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ct+1,Tt,re.width,re.height,0,Rt,At,re.data)}}else{le?Me&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,0,0,Rt,At,lt[q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,0,Tt,Rt,At,lt[q]);for(let ct=0;ct<pt.length;ct++){let gt=pt[ct];le?Me&&e.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ct+1,0,0,Rt,At,gt.image[q]):e.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+q,ct+1,Tt,Rt,At,gt.image[q])}}}y(E,se)&&v(i.TEXTURE_CUBE_MAP),st.__version=ot.version,E.onUpdate&&E.onUpdate(E)}R.__version=E.version}function ft(R,E,j,it,ot,st){let Kt=r.convert(j.format,j.colorSpace),Dt=r.convert(j.type),dt=w(j.internalFormat,Kt,Dt,j.colorSpace);if(!n.get(E).__hasExternalTextures){let Zt=Math.max(1,E.width>>st),lt=Math.max(1,E.height>>st);ot===i.TEXTURE_3D||ot===i.TEXTURE_2D_ARRAY?e.texImage3D(ot,st,dt,Zt,lt,E.depth,0,Kt,Dt,null):e.texImage2D(ot,st,dt,Zt,lt,0,Kt,Dt,null)}e.bindFramebuffer(i.FRAMEBUFFER,R),ie(E)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,it,ot,n.get(j).__webglTexture,0,kt(E)):(ot===i.TEXTURE_2D||ot>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&ot<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,it,ot,n.get(j).__webglTexture,st),e.bindFramebuffer(i.FRAMEBUFFER,null)}function ht(R,E,j){if(i.bindRenderbuffer(i.RENDERBUFFER,R),E.depthBuffer&&!E.stencilBuffer){let it=o===!0?i.DEPTH_COMPONENT24:i.DEPTH_COMPONENT16;if(j||ie(E)){let ot=E.depthTexture;ot&&ot.isDepthTexture&&(ot.type===es?it=i.DEPTH_COMPONENT32F:ot.type===Ls&&(it=i.DEPTH_COMPONENT24));let st=kt(E);ie(E)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,st,it,E.width,E.height):i.renderbufferStorageMultisample(i.RENDERBUFFER,st,it,E.width,E.height)}else i.renderbufferStorage(i.RENDERBUFFER,it,E.width,E.height);i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,R)}else if(E.depthBuffer&&E.stencilBuffer){let it=kt(E);j&&ie(E)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,it,i.DEPTH24_STENCIL8,E.width,E.height):ie(E)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,it,i.DEPTH24_STENCIL8,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_STENCIL,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.RENDERBUFFER,R)}else{let it=E.textures;for(let ot=0;ot<it.length;ot++){let st=it[ot],Kt=r.convert(st.format,st.colorSpace),Dt=r.convert(st.type),dt=w(st.internalFormat,Kt,Dt,st.colorSpace),mt=kt(E);j&&ie(E)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,mt,dt,E.width,E.height):ie(E)?l.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,mt,dt,E.width,E.height):i.renderbufferStorage(i.RENDERBUFFER,dt,E.width,E.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function Ht(R,E){if(E&&E.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(e.bindFramebuffer(i.FRAMEBUFFER,R),!(E.depthTexture&&E.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!n.get(E.depthTexture).__webglTexture||E.depthTexture.image.width!==E.width||E.depthTexture.image.height!==E.height)&&(E.depthTexture.image.width=E.width,E.depthTexture.image.height=E.height,E.depthTexture.needsUpdate=!0),D(E.depthTexture,0);let it=n.get(E.depthTexture).__webglTexture,ot=kt(E);if(E.depthTexture.format===br)ie(E)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,it,0,ot):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,it,0);else if(E.depthTexture.format===_o)ie(E)?l.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,it,0,ot):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,it,0);else throw new Error("Unknown depthTexture format")}function Et(R){let E=n.get(R),j=R.isWebGLCubeRenderTarget===!0;if(R.depthTexture&&!E.__autoAllocateDepthBuffer){if(j)throw new Error("target.depthTexture not supported in Cube render targets");Ht(E.__webglFramebuffer,R)}else if(j){E.__webglDepthbuffer=[];for(let it=0;it<6;it++)e.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer[it]),E.__webglDepthbuffer[it]=i.createRenderbuffer(),ht(E.__webglDepthbuffer[it],R,!1)}else e.bindFramebuffer(i.FRAMEBUFFER,E.__webglFramebuffer),E.__webglDepthbuffer=i.createRenderbuffer(),ht(E.__webglDepthbuffer,R,!1);e.bindFramebuffer(i.FRAMEBUFFER,null)}function O(R,E,j){let it=n.get(R);E!==void 0&&ft(it.__webglFramebuffer,R,R.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),j!==void 0&&Et(R)}function be(R){let E=R.texture,j=n.get(R),it=n.get(E);R.addEventListener("dispose",P);let ot=R.textures,st=R.isWebGLCubeRenderTarget===!0,Kt=ot.length>1,Dt=m(R)||o;if(Kt||(it.__webglTexture===void 0&&(it.__webglTexture=i.createTexture()),it.__version=E.version,a.memory.textures++),st){j.__webglFramebuffer=[];for(let dt=0;dt<6;dt++)if(o&&E.mipmaps&&E.mipmaps.length>0){j.__webglFramebuffer[dt]=[];for(let mt=0;mt<E.mipmaps.length;mt++)j.__webglFramebuffer[dt][mt]=i.createFramebuffer()}else j.__webglFramebuffer[dt]=i.createFramebuffer()}else{if(o&&E.mipmaps&&E.mipmaps.length>0){j.__webglFramebuffer=[];for(let dt=0;dt<E.mipmaps.length;dt++)j.__webglFramebuffer[dt]=i.createFramebuffer()}else j.__webglFramebuffer=i.createFramebuffer();if(Kt)if(s.drawBuffers)for(let dt=0,mt=ot.length;dt<mt;dt++){let Zt=n.get(ot[dt]);Zt.__webglTexture===void 0&&(Zt.__webglTexture=i.createTexture(),a.memory.textures++)}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(o&&R.samples>0&&ie(R)===!1){j.__webglMultisampledFramebuffer=i.createFramebuffer(),j.__webglColorRenderbuffer=[],e.bindFramebuffer(i.FRAMEBUFFER,j.__webglMultisampledFramebuffer);for(let dt=0;dt<ot.length;dt++){let mt=ot[dt];j.__webglColorRenderbuffer[dt]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,j.__webglColorRenderbuffer[dt]);let Zt=r.convert(mt.format,mt.colorSpace),lt=r.convert(mt.type),Be=w(mt.internalFormat,Zt,lt,mt.colorSpace,R.isXRRenderTarget===!0),se=kt(R);i.renderbufferStorageMultisample(i.RENDERBUFFER,se,Be,R.width,R.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+dt,i.RENDERBUFFER,j.__webglColorRenderbuffer[dt])}i.bindRenderbuffer(i.RENDERBUFFER,null),R.depthBuffer&&(j.__webglDepthRenderbuffer=i.createRenderbuffer(),ht(j.__webglDepthRenderbuffer,R,!0)),e.bindFramebuffer(i.FRAMEBUFFER,null)}}if(st){e.bindTexture(i.TEXTURE_CUBE_MAP,it.__webglTexture),G(i.TEXTURE_CUBE_MAP,E,Dt);for(let dt=0;dt<6;dt++)if(o&&E.mipmaps&&E.mipmaps.length>0)for(let mt=0;mt<E.mipmaps.length;mt++)ft(j.__webglFramebuffer[dt][mt],R,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,mt);else ft(j.__webglFramebuffer[dt],R,E,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+dt,0);y(E,Dt)&&v(i.TEXTURE_CUBE_MAP),e.unbindTexture()}else if(Kt){for(let dt=0,mt=ot.length;dt<mt;dt++){let Zt=ot[dt],lt=n.get(Zt);e.bindTexture(i.TEXTURE_2D,lt.__webglTexture),G(i.TEXTURE_2D,Zt,Dt),ft(j.__webglFramebuffer,R,Zt,i.COLOR_ATTACHMENT0+dt,i.TEXTURE_2D,0),y(Zt,Dt)&&v(i.TEXTURE_2D)}e.unbindTexture()}else{let dt=i.TEXTURE_2D;if((R.isWebGL3DRenderTarget||R.isWebGLArrayRenderTarget)&&(o?dt=R.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),e.bindTexture(dt,it.__webglTexture),G(dt,E,Dt),o&&E.mipmaps&&E.mipmaps.length>0)for(let mt=0;mt<E.mipmaps.length;mt++)ft(j.__webglFramebuffer[mt],R,E,i.COLOR_ATTACHMENT0,dt,mt);else ft(j.__webglFramebuffer,R,E,i.COLOR_ATTACHMENT0,dt,0);y(E,Dt)&&v(dt),e.unbindTexture()}R.depthBuffer&&Et(R)}function xt(R){let E=m(R)||o,j=R.textures;for(let it=0,ot=j.length;it<ot;it++){let st=j[it];if(y(st,E)){let Kt=R.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,Dt=n.get(st).__webglTexture;e.bindTexture(Kt,Dt),v(Kt),e.unbindTexture()}}}function wt(R){if(o&&R.samples>0&&ie(R)===!1){let E=R.textures,j=R.width,it=R.height,ot=i.COLOR_BUFFER_BIT,st=[],Kt=R.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,Dt=n.get(R),dt=E.length>1;if(dt)for(let mt=0;mt<E.length;mt++)e.bindFramebuffer(i.FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,null),e.bindFramebuffer(i.FRAMEBUFFER,Dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,null,0);e.bindFramebuffer(i.READ_FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Dt.__webglFramebuffer);for(let mt=0;mt<E.length;mt++){st.push(i.COLOR_ATTACHMENT0+mt),R.depthBuffer&&st.push(Kt);let Zt=Dt.__ignoreDepthValues!==void 0?Dt.__ignoreDepthValues:!1;if(Zt===!1&&(R.depthBuffer&&(ot|=i.DEPTH_BUFFER_BIT),R.stencilBuffer&&(ot|=i.STENCIL_BUFFER_BIT)),dt&&i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,Dt.__webglColorRenderbuffer[mt]),Zt===!0&&(i.invalidateFramebuffer(i.READ_FRAMEBUFFER,[Kt]),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[Kt])),dt){let lt=n.get(E[mt]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,lt,0)}i.blitFramebuffer(0,0,j,it,0,0,j,it,ot,i.NEAREST),c&&i.invalidateFramebuffer(i.READ_FRAMEBUFFER,st)}if(e.bindFramebuffer(i.READ_FRAMEBUFFER,null),e.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),dt)for(let mt=0;mt<E.length;mt++){e.bindFramebuffer(i.FRAMEBUFFER,Dt.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.RENDERBUFFER,Dt.__webglColorRenderbuffer[mt]);let Zt=n.get(E[mt]).__webglTexture;e.bindFramebuffer(i.FRAMEBUFFER,Dt.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+mt,i.TEXTURE_2D,Zt,0)}e.bindFramebuffer(i.DRAW_FRAMEBUFFER,Dt.__webglMultisampledFramebuffer)}}function kt(R){return Math.min(s.maxSamples,R.samples)}function ie(R){let E=n.get(R);return o&&R.samples>0&&t.has("WEBGL_multisampled_render_to_texture")===!0&&E.__useRenderToTexture!==!1}function Gt(R){let E=a.render.frame;u.get(R)!==E&&(u.set(R,E),R.update())}function Yt(R,E){let j=R.colorSpace,it=R.format,ot=R.type;return R.isCompressedTexture===!0||R.isVideoTexture===!0||R.format===Yu||j!==Ni&&j!==Rs&&(he.getTransfer(j)===ye?o===!1?t.has("EXT_sRGB")===!0&&it===An?(R.format=Yu,R.minFilter=Pn,R.generateMipmaps=!1):E=ic.sRGBToLinear(E):(it!==An||ot!==ii)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",j)),E}function we(R){return typeof HTMLImageElement!="undefined"&&R instanceof HTMLImageElement?(h.width=R.naturalWidth||R.width,h.height=R.naturalHeight||R.height):typeof VideoFrame!="undefined"&&R instanceof VideoFrame?(h.width=R.displayWidth,h.height=R.displayHeight):(h.width=R.width,h.height=R.height),h}this.allocateTextureUnit=U,this.resetTextureUnits=k,this.setTexture2D=D,this.setTexture2DArray=z,this.setTexture3D=$,this.setTextureCube=nt,this.rebindTextures=O,this.setupRenderTarget=be,this.updateRenderTargetMipmap=xt,this.updateMultisampleRenderTarget=wt,this.setupDepthRenderbuffer=Et,this.setupFrameBufferTexture=ft,this.useMultisampledRTT=ie}function pS(i,t,e){let n=e.isWebGL2;function s(r,a=Rs){let o,l=he.getTransfer(a);if(r===ii)return i.UNSIGNED_BYTE;if(r===B0)return i.UNSIGNED_SHORT_4_4_4_4;if(r===F0)return i.UNSIGNED_SHORT_5_5_5_1;if(r===iv)return i.BYTE;if(r===sv)return i.SHORT;if(r===Ed)return i.UNSIGNED_SHORT;if(r===N0)return i.INT;if(r===Ls)return i.UNSIGNED_INT;if(r===es)return i.FLOAT;if(r===va)return n?i.HALF_FLOAT:(o=t.get("OES_texture_half_float"),o!==null?o.HALF_FLOAT_OES:null);if(r===rv)return i.ALPHA;if(r===An)return i.RGBA;if(r===ov)return i.LUMINANCE;if(r===av)return i.LUMINANCE_ALPHA;if(r===br)return i.DEPTH_COMPONENT;if(r===_o)return i.DEPTH_STENCIL;if(r===Yu)return o=t.get("EXT_sRGB"),o!==null?o.SRGB_ALPHA_EXT:null;if(r===lv)return i.RED;if(r===O0)return i.RED_INTEGER;if(r===cv)return i.RG;if(r===z0)return i.RG_INTEGER;if(r===H0)return i.RGBA_INTEGER;if(r===hu||r===uu||r===du||r===fu)if(l===ye)if(o=t.get("WEBGL_compressed_texture_s3tc_srgb"),o!==null){if(r===hu)return o.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(r===uu)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(r===du)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(r===fu)return o.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(o=t.get("WEBGL_compressed_texture_s3tc"),o!==null){if(r===hu)return o.COMPRESSED_RGB_S3TC_DXT1_EXT;if(r===uu)return o.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(r===du)return o.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(r===fu)return o.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(r===pm||r===mm||r===gm||r===bm)if(o=t.get("WEBGL_compressed_texture_pvrtc"),o!==null){if(r===pm)return o.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(r===mm)return o.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(r===gm)return o.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(r===bm)return o.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(r===G0)return o=t.get("WEBGL_compressed_texture_etc1"),o!==null?o.COMPRESSED_RGB_ETC1_WEBGL:null;if(r===ym||r===_m)if(o=t.get("WEBGL_compressed_texture_etc"),o!==null){if(r===ym)return l===ye?o.COMPRESSED_SRGB8_ETC2:o.COMPRESSED_RGB8_ETC2;if(r===_m)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:o.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(r===vm||r===xm||r===wm||r===Mm||r===Sm||r===Am||r===Em||r===Tm||r===Cm||r===km||r===Rm||r===Lm||r===Pm||r===Im)if(o=t.get("WEBGL_compressed_texture_astc"),o!==null){if(r===vm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:o.COMPRESSED_RGBA_ASTC_4x4_KHR;if(r===xm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:o.COMPRESSED_RGBA_ASTC_5x4_KHR;if(r===wm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:o.COMPRESSED_RGBA_ASTC_5x5_KHR;if(r===Mm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:o.COMPRESSED_RGBA_ASTC_6x5_KHR;if(r===Sm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:o.COMPRESSED_RGBA_ASTC_6x6_KHR;if(r===Am)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:o.COMPRESSED_RGBA_ASTC_8x5_KHR;if(r===Em)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:o.COMPRESSED_RGBA_ASTC_8x6_KHR;if(r===Tm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:o.COMPRESSED_RGBA_ASTC_8x8_KHR;if(r===Cm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:o.COMPRESSED_RGBA_ASTC_10x5_KHR;if(r===km)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:o.COMPRESSED_RGBA_ASTC_10x6_KHR;if(r===Rm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:o.COMPRESSED_RGBA_ASTC_10x8_KHR;if(r===Lm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:o.COMPRESSED_RGBA_ASTC_10x10_KHR;if(r===Pm)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:o.COMPRESSED_RGBA_ASTC_12x10_KHR;if(r===Im)return l===ye?o.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:o.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(r===pu||r===Dm||r===Um)if(o=t.get("EXT_texture_compression_bptc"),o!==null){if(r===pu)return l===ye?o.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:o.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(r===Dm)return o.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(r===Um)return o.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(r===hv||r===Nm||r===Bm||r===Fm)if(o=t.get("EXT_texture_compression_rgtc"),o!==null){if(r===pu)return o.COMPRESSED_RED_RGTC1_EXT;if(r===Nm)return o.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(r===Bm)return o.COMPRESSED_RED_GREEN_RGTC2_EXT;if(r===Fm)return o.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return r===gr?n?i.UNSIGNED_INT_24_8:(o=t.get("WEBGL_depth_texture"),o!==null?o.UNSIGNED_INT_24_8_WEBGL:null):i[r]!==void 0?i[r]:null}return{convert:s}}var cd=class extends rn{constructor(t=[]){super(),this.isArrayCamera=!0,this.cameras=t}},En=class extends si{constructor(){super(),this.isGroup=!0,this.type="Group"}},mS={type:"move"},_a=class{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new En,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new En,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new V,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new V),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new En,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new V,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new V),this._grip}dispatchEvent(t){return this._targetRay!==null&&this._targetRay.dispatchEvent(t),this._grip!==null&&this._grip.dispatchEvent(t),this._hand!==null&&this._hand.dispatchEvent(t),this}connect(t){if(t&&t.hand){let e=this._hand;if(e)for(let n of t.hand.values())this._getHandJoint(e,n)}return this.dispatchEvent({type:"connected",data:t}),this}disconnect(t){return this.dispatchEvent({type:"disconnected",data:t}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(t,e,n){let s=null,r=null,a=null,o=this._targetRay,l=this._grip,c=this._hand;if(t&&e.session.visibilityState!=="visible-blurred"){if(c&&t.hand){a=!0;for(let b of t.hand.values()){let p=e.getJointPose(b,n),m=this._getHandJoint(c,b);p!==null&&(m.matrix.fromArray(p.transform.matrix),m.matrix.decompose(m.position,m.rotation,m.scale),m.matrixWorldNeedsUpdate=!0,m.jointRadius=p.radius),m.visible=p!==null}let h=c.joints["index-finger-tip"],u=c.joints["thumb-tip"],f=h.position.distanceTo(u.position),d=.02,g=.005;c.inputState.pinching&&f>d+g?(c.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:t.handedness,target:this})):!c.inputState.pinching&&f<=d-g&&(c.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:t.handedness,target:this}))}else l!==null&&t.gripSpace&&(r=e.getPose(t.gripSpace,n),r!==null&&(l.matrix.fromArray(r.transform.matrix),l.matrix.decompose(l.position,l.rotation,l.scale),l.matrixWorldNeedsUpdate=!0,r.linearVelocity?(l.hasLinearVelocity=!0,l.linearVelocity.copy(r.linearVelocity)):l.hasLinearVelocity=!1,r.angularVelocity?(l.hasAngularVelocity=!0,l.angularVelocity.copy(r.angularVelocity)):l.hasAngularVelocity=!1));o!==null&&(s=e.getPose(t.targetRaySpace,n),s===null&&r!==null&&(s=r),s!==null&&(o.matrix.fromArray(s.transform.matrix),o.matrix.decompose(o.position,o.rotation,o.scale),o.matrixWorldNeedsUpdate=!0,s.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(s.linearVelocity)):o.hasLinearVelocity=!1,s.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(s.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(mS)))}return o!==null&&(o.visible=s!==null),l!==null&&(l.visible=r!==null),c!==null&&(c.visible=a!==null),this}_getHandJoint(t,e){if(t.joints[e.jointName]===void 0){let n=new En;n.matrixAutoUpdate=!1,n.visible=!1,t.joints[e.jointName]=n,t.add(n)}return t.joints[e.jointName]}},gS=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,bS=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepthEXT = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepthEXT = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`,hd=class{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(t,e,n){if(this.texture===null){let s=new Wn,r=t.properties.get(s);r.__webglTexture=e.texture,(e.depthNear!=n.depthNear||e.depthFar!=n.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=s}}render(t,e){if(this.texture!==null){if(this.mesh===null){let n=e.cameras[0].viewport,s=new Ee({extensions:{fragDepth:!0},vertexShader:gS,fragmentShader:bS,uniforms:{depthColor:{value:this.texture},depthWidth:{value:n.z},depthHeight:{value:n.w}}});this.mesh=new _e(new fc(20,20),s)}t.render(this.mesh,e)}}reset(){this.texture=null,this.mesh=null}},ud=class extends Is{constructor(t,e){super();let n=this,s=null,r=1,a=null,o="local-floor",l=1,c=null,h=null,u=null,f=null,d=null,g=null,b=new hd,p=e.getContextAttributes(),m=null,_=null,y=[],v=[],w=new qt,S=null,A=new rn;A.layers.enable(1),A.viewport=new an;let L=new rn;L.layers.enable(2),L.viewport=new an;let P=[A,L],M=new cd;M.layers.enable(1),M.layers.enable(2);let T=null,I=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(G){let tt=y[G];return tt===void 0&&(tt=new _a,y[G]=tt),tt.getTargetRaySpace()},this.getControllerGrip=function(G){let tt=y[G];return tt===void 0&&(tt=new _a,y[G]=tt),tt.getGripSpace()},this.getHand=function(G){let tt=y[G];return tt===void 0&&(tt=new _a,y[G]=tt),tt.getHandSpace()};function F(G){let tt=v.indexOf(G.inputSource);if(tt===-1)return;let at=y[tt];at!==void 0&&(at.update(G.inputSource,G.frame,c||a),at.dispatchEvent({type:G.type,data:G.inputSource}))}function k(){s.removeEventListener("select",F),s.removeEventListener("selectstart",F),s.removeEventListener("selectend",F),s.removeEventListener("squeeze",F),s.removeEventListener("squeezestart",F),s.removeEventListener("squeezeend",F),s.removeEventListener("end",k),s.removeEventListener("inputsourceschange",U);for(let G=0;G<y.length;G++){let tt=v[G];tt!==null&&(v[G]=null,y[G].disconnect(tt))}T=null,I=null,b.reset(),t.setRenderTarget(m),d=null,f=null,u=null,s=null,_=null,bt.stop(),n.isPresenting=!1,t.setPixelRatio(S),t.setSize(w.width,w.height,!1),n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(G){r=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(G){o=G,n.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return c||a},this.setReferenceSpace=function(G){c=G},this.getBaseLayer=function(){return f!==null?f:d},this.getBinding=function(){return u},this.getFrame=function(){return g},this.getSession=function(){return s},this.setSession=async function(G){if(s=G,s!==null){if(m=t.getRenderTarget(),s.addEventListener("select",F),s.addEventListener("selectstart",F),s.addEventListener("selectend",F),s.addEventListener("squeeze",F),s.addEventListener("squeezestart",F),s.addEventListener("squeezeend",F),s.addEventListener("end",k),s.addEventListener("inputsourceschange",U),p.xrCompatible!==!0&&await e.makeXRCompatible(),S=t.getPixelRatio(),t.getSize(w),s.renderState.layers===void 0||t.capabilities.isWebGL2===!1){let tt={antialias:s.renderState.layers===void 0?p.antialias:!0,alpha:!0,depth:p.depth,stencil:p.stencil,framebufferScaleFactor:r};d=new XRWebGLLayer(s,e,tt),s.updateRenderState({baseLayer:d}),t.setPixelRatio(1),t.setSize(d.framebufferWidth,d.framebufferHeight,!1),_=new gi(d.framebufferWidth,d.framebufferHeight,{format:An,type:ii,colorSpace:t.outputColorSpace,stencilBuffer:p.stencil})}else{let tt=null,at=null,Q=null;p.depth&&(Q=p.stencil?e.DEPTH24_STENCIL8:e.DEPTH_COMPONENT24,tt=p.stencil?_o:br,at=p.stencil?gr:Ls);let ft={colorFormat:e.RGBA8,depthFormat:Q,scaleFactor:r};u=new XRWebGLBinding(s,e),f=u.createProjectionLayer(ft),s.updateRenderState({layers:[f]}),t.setPixelRatio(1),t.setSize(f.textureWidth,f.textureHeight,!1),_=new gi(f.textureWidth,f.textureHeight,{format:An,type:ii,depthTexture:new mc(f.textureWidth,f.textureHeight,at,void 0,void 0,void 0,void 0,void 0,void 0,tt),stencilBuffer:p.stencil,colorSpace:t.outputColorSpace,samples:p.antialias?4:0});let ht=t.properties.get(_);ht.__ignoreDepthValues=f.ignoreDepthValues}_.isXRRenderTarget=!0,this.setFoveation(l),c=null,a=await s.requestReferenceSpace(o),bt.setContext(s),bt.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(s!==null)return s.environmentBlendMode};function U(G){for(let tt=0;tt<G.removed.length;tt++){let at=G.removed[tt],Q=v.indexOf(at);Q>=0&&(v[Q]=null,y[Q].disconnect(at))}for(let tt=0;tt<G.added.length;tt++){let at=G.added[tt],Q=v.indexOf(at);if(Q===-1){for(let ht=0;ht<y.length;ht++)if(ht>=v.length){v.push(at),Q=ht;break}else if(v[ht]===null){v[ht]=at,Q=ht;break}if(Q===-1)break}let ft=y[Q];ft&&ft.connect(at)}}let N=new V,D=new V;function z(G,tt,at){N.setFromMatrixPosition(tt.matrixWorld),D.setFromMatrixPosition(at.matrixWorld);let Q=N.distanceTo(D),ft=tt.projectionMatrix.elements,ht=at.projectionMatrix.elements,Ht=ft[14]/(ft[10]-1),Et=ft[14]/(ft[10]+1),O=(ft[9]+1)/ft[5],be=(ft[9]-1)/ft[5],xt=(ft[8]-1)/ft[0],wt=(ht[8]+1)/ht[0],kt=Ht*xt,ie=Ht*wt,Gt=Q/(-xt+wt),Yt=Gt*-xt;tt.matrixWorld.decompose(G.position,G.quaternion,G.scale),G.translateX(Yt),G.translateZ(Gt),G.matrixWorld.compose(G.position,G.quaternion,G.scale),G.matrixWorldInverse.copy(G.matrixWorld).invert();let we=Ht+Gt,R=Et+Gt,E=kt-Yt,j=ie+(Q-Yt),it=O*Et/R*we,ot=be*Et/R*we;G.projectionMatrix.makePerspective(E,j,it,ot,we,R),G.projectionMatrixInverse.copy(G.projectionMatrix).invert()}function $(G,tt){tt===null?G.matrixWorld.copy(G.matrix):G.matrixWorld.multiplyMatrices(tt.matrixWorld,G.matrix),G.matrixWorldInverse.copy(G.matrixWorld).invert()}this.updateCamera=function(G){if(s===null)return;b.texture!==null&&(G.near=b.depthNear,G.far=b.depthFar),M.near=L.near=A.near=G.near,M.far=L.far=A.far=G.far,(T!==M.near||I!==M.far)&&(s.updateRenderState({depthNear:M.near,depthFar:M.far}),T=M.near,I=M.far,A.near=T,A.far=I,L.near=T,L.far=I,A.updateProjectionMatrix(),L.updateProjectionMatrix(),G.updateProjectionMatrix());let tt=G.parent,at=M.cameras;$(M,tt);for(let Q=0;Q<at.length;Q++)$(at[Q],tt);at.length===2?z(M,A,L):M.projectionMatrix.copy(A.projectionMatrix),nt(G,M,tt)};function nt(G,tt,at){at===null?G.matrix.copy(tt.matrixWorld):(G.matrix.copy(at.matrixWorld),G.matrix.invert(),G.matrix.multiply(tt.matrixWorld)),G.matrix.decompose(G.position,G.quaternion,G.scale),G.updateMatrixWorld(!0),G.projectionMatrix.copy(tt.projectionMatrix),G.projectionMatrixInverse.copy(tt.projectionMatrixInverse),G.isPerspectiveCamera&&(G.fov=Ku*2*Math.atan(1/G.projectionMatrix.elements[5]),G.zoom=1)}this.getCamera=function(){return M},this.getFoveation=function(){if(!(f===null&&d===null))return l},this.setFoveation=function(G){l=G,f!==null&&(f.fixedFoveation=G),d!==null&&d.fixedFoveation!==void 0&&(d.fixedFoveation=G)},this.hasDepthSensing=function(){return b.texture!==null};let et=null;function rt(G,tt){if(h=tt.getViewerPose(c||a),g=tt,h!==null){let at=h.views;d!==null&&(t.setRenderTargetFramebuffer(_,d.framebuffer),t.setRenderTarget(_));let Q=!1;at.length!==M.cameras.length&&(M.cameras.length=0,Q=!0);for(let ht=0;ht<at.length;ht++){let Ht=at[ht],Et=null;if(d!==null)Et=d.getViewport(Ht);else{let be=u.getViewSubImage(f,Ht);Et=be.viewport,ht===0&&(t.setRenderTargetTextures(_,be.colorTexture,f.ignoreDepthValues?void 0:be.depthStencilTexture),t.setRenderTarget(_))}let O=P[ht];O===void 0&&(O=new rn,O.layers.enable(ht),O.viewport=new an,P[ht]=O),O.matrix.fromArray(Ht.transform.matrix),O.matrix.decompose(O.position,O.quaternion,O.scale),O.projectionMatrix.fromArray(Ht.projectionMatrix),O.projectionMatrixInverse.copy(O.projectionMatrix).invert(),O.viewport.set(Et.x,Et.y,Et.width,Et.height),ht===0&&(M.matrix.copy(O.matrix),M.matrix.decompose(M.position,M.quaternion,M.scale)),Q===!0&&M.cameras.push(O)}let ft=s.enabledFeatures;if(ft&&ft.includes("depth-sensing")){let ht=u.getDepthInformation(at[0]);ht&&ht.isValid&&ht.texture&&b.init(t,ht,s.renderState)}}for(let at=0;at<y.length;at++){let Q=v[at],ft=y[at];Q!==null&&ft!==void 0&&ft.update(Q,tt,c||a)}b.render(t,M),et&&et(G,tt),tt.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:tt}),g=null}let bt=new Y0;bt.setAnimationLoop(rt),this.setAnimationLoop=function(G){et=G},this.dispose=function(){}}},hr=new rs,yS=new ve;function _S(i,t){function e(p,m){p.matrixAutoUpdate===!0&&p.updateMatrix(),m.value.copy(p.matrix)}function n(p,m){m.color.getRGB(p.fogColor.value,q0(i)),m.isFog?(p.fogNear.value=m.near,p.fogFar.value=m.far):m.isFogExp2&&(p.fogDensity.value=m.density)}function s(p,m,_,y,v){m.isMeshBasicMaterial||m.isMeshLambertMaterial?r(p,m):m.isMeshToonMaterial?(r(p,m),u(p,m)):m.isMeshPhongMaterial?(r(p,m),h(p,m)):m.isMeshStandardMaterial?(r(p,m),f(p,m),m.isMeshPhysicalMaterial&&d(p,m,v)):m.isMeshMatcapMaterial?(r(p,m),g(p,m)):m.isMeshDepthMaterial?r(p,m):m.isMeshDistanceMaterial?(r(p,m),b(p,m)):m.isMeshNormalMaterial?r(p,m):m.isLineBasicMaterial?(a(p,m),m.isLineDashedMaterial&&o(p,m)):m.isPointsMaterial?l(p,m,_,y):m.isSpriteMaterial?c(p,m):m.isShadowMaterial?(p.color.value.copy(m.color),p.opacity.value=m.opacity):m.isShaderMaterial&&(m.uniformsNeedUpdate=!1)}function r(p,m){p.opacity.value=m.opacity,m.color&&p.diffuse.value.copy(m.color),m.emissive&&p.emissive.value.copy(m.emissive).multiplyScalar(m.emissiveIntensity),m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.bumpMap&&(p.bumpMap.value=m.bumpMap,e(m.bumpMap,p.bumpMapTransform),p.bumpScale.value=m.bumpScale,m.side===Dn&&(p.bumpScale.value*=-1)),m.normalMap&&(p.normalMap.value=m.normalMap,e(m.normalMap,p.normalMapTransform),p.normalScale.value.copy(m.normalScale),m.side===Dn&&p.normalScale.value.negate()),m.displacementMap&&(p.displacementMap.value=m.displacementMap,e(m.displacementMap,p.displacementMapTransform),p.displacementScale.value=m.displacementScale,p.displacementBias.value=m.displacementBias),m.emissiveMap&&(p.emissiveMap.value=m.emissiveMap,e(m.emissiveMap,p.emissiveMapTransform)),m.specularMap&&(p.specularMap.value=m.specularMap,e(m.specularMap,p.specularMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest);let _=t.get(m),y=_.envMap,v=_.envMapRotation;if(y&&(p.envMap.value=y,hr.copy(v),hr.x*=-1,hr.y*=-1,hr.z*=-1,y.isCubeTexture&&y.isRenderTargetTexture===!1&&(hr.y*=-1,hr.z*=-1),p.envMapRotation.value.setFromMatrix4(yS.makeRotationFromEuler(hr)),p.flipEnvMap.value=y.isCubeTexture&&y.isRenderTargetTexture===!1?-1:1,p.reflectivity.value=m.reflectivity,p.ior.value=m.ior,p.refractionRatio.value=m.refractionRatio),m.lightMap){p.lightMap.value=m.lightMap;let w=i._useLegacyLights===!0?Math.PI:1;p.lightMapIntensity.value=m.lightMapIntensity*w,e(m.lightMap,p.lightMapTransform)}m.aoMap&&(p.aoMap.value=m.aoMap,p.aoMapIntensity.value=m.aoMapIntensity,e(m.aoMap,p.aoMapTransform))}function a(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform))}function o(p,m){p.dashSize.value=m.dashSize,p.totalSize.value=m.dashSize+m.gapSize,p.scale.value=m.scale}function l(p,m,_,y){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.size.value=m.size*_,p.scale.value=y*.5,m.map&&(p.map.value=m.map,e(m.map,p.uvTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function c(p,m){p.diffuse.value.copy(m.color),p.opacity.value=m.opacity,p.rotation.value=m.rotation,m.map&&(p.map.value=m.map,e(m.map,p.mapTransform)),m.alphaMap&&(p.alphaMap.value=m.alphaMap,e(m.alphaMap,p.alphaMapTransform)),m.alphaTest>0&&(p.alphaTest.value=m.alphaTest)}function h(p,m){p.specular.value.copy(m.specular),p.shininess.value=Math.max(m.shininess,1e-4)}function u(p,m){m.gradientMap&&(p.gradientMap.value=m.gradientMap)}function f(p,m){p.metalness.value=m.metalness,m.metalnessMap&&(p.metalnessMap.value=m.metalnessMap,e(m.metalnessMap,p.metalnessMapTransform)),p.roughness.value=m.roughness,m.roughnessMap&&(p.roughnessMap.value=m.roughnessMap,e(m.roughnessMap,p.roughnessMapTransform)),t.get(m).envMap&&(p.envMapIntensity.value=m.envMapIntensity)}function d(p,m,_){p.ior.value=m.ior,m.sheen>0&&(p.sheenColor.value.copy(m.sheenColor).multiplyScalar(m.sheen),p.sheenRoughness.value=m.sheenRoughness,m.sheenColorMap&&(p.sheenColorMap.value=m.sheenColorMap,e(m.sheenColorMap,p.sheenColorMapTransform)),m.sheenRoughnessMap&&(p.sheenRoughnessMap.value=m.sheenRoughnessMap,e(m.sheenRoughnessMap,p.sheenRoughnessMapTransform))),m.clearcoat>0&&(p.clearcoat.value=m.clearcoat,p.clearcoatRoughness.value=m.clearcoatRoughness,m.clearcoatMap&&(p.clearcoatMap.value=m.clearcoatMap,e(m.clearcoatMap,p.clearcoatMapTransform)),m.clearcoatRoughnessMap&&(p.clearcoatRoughnessMap.value=m.clearcoatRoughnessMap,e(m.clearcoatRoughnessMap,p.clearcoatRoughnessMapTransform)),m.clearcoatNormalMap&&(p.clearcoatNormalMap.value=m.clearcoatNormalMap,e(m.clearcoatNormalMap,p.clearcoatNormalMapTransform),p.clearcoatNormalScale.value.copy(m.clearcoatNormalScale),m.side===Dn&&p.clearcoatNormalScale.value.negate())),m.iridescence>0&&(p.iridescence.value=m.iridescence,p.iridescenceIOR.value=m.iridescenceIOR,p.iridescenceThicknessMinimum.value=m.iridescenceThicknessRange[0],p.iridescenceThicknessMaximum.value=m.iridescenceThicknessRange[1],m.iridescenceMap&&(p.iridescenceMap.value=m.iridescenceMap,e(m.iridescenceMap,p.iridescenceMapTransform)),m.iridescenceThicknessMap&&(p.iridescenceThicknessMap.value=m.iridescenceThicknessMap,e(m.iridescenceThicknessMap,p.iridescenceThicknessMapTransform))),m.transmission>0&&(p.transmission.value=m.transmission,p.transmissionSamplerMap.value=_.texture,p.transmissionSamplerSize.value.set(_.width,_.height),m.transmissionMap&&(p.transmissionMap.value=m.transmissionMap,e(m.transmissionMap,p.transmissionMapTransform)),p.thickness.value=m.thickness,m.thicknessMap&&(p.thicknessMap.value=m.thicknessMap,e(m.thicknessMap,p.thicknessMapTransform)),p.attenuationDistance.value=m.attenuationDistance,p.attenuationColor.value.copy(m.attenuationColor)),m.anisotropy>0&&(p.anisotropyVector.value.set(m.anisotropy*Math.cos(m.anisotropyRotation),m.anisotropy*Math.sin(m.anisotropyRotation)),m.anisotropyMap&&(p.anisotropyMap.value=m.anisotropyMap,e(m.anisotropyMap,p.anisotropyMapTransform))),p.specularIntensity.value=m.specularIntensity,p.specularColor.value.copy(m.specularColor),m.specularColorMap&&(p.specularColorMap.value=m.specularColorMap,e(m.specularColorMap,p.specularColorMapTransform)),m.specularIntensityMap&&(p.specularIntensityMap.value=m.specularIntensityMap,e(m.specularIntensityMap,p.specularIntensityMapTransform))}function g(p,m){m.matcap&&(p.matcap.value=m.matcap)}function b(p,m){let _=t.get(m).light;p.referencePosition.value.setFromMatrixPosition(_.matrixWorld),p.nearDistance.value=_.shadow.camera.near,p.farDistance.value=_.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:s}}function vS(i,t,e,n){let s={},r={},a=[],o=e.isWebGL2?i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS):0;function l(_,y){let v=y.program;n.uniformBlockBinding(_,v)}function c(_,y){let v=s[_.id];v===void 0&&(g(_),v=h(_),s[_.id]=v,_.addEventListener("dispose",p));let w=y.program;n.updateUBOMapping(_,w);let S=t.render.frame;r[_.id]!==S&&(f(_),r[_.id]=S)}function h(_){let y=u();_.__bindingPointIndex=y;let v=i.createBuffer(),w=_.__size,S=_.usage;return i.bindBuffer(i.UNIFORM_BUFFER,v),i.bufferData(i.UNIFORM_BUFFER,w,S),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,y,v),v}function u(){for(let _=0;_<o;_++)if(a.indexOf(_)===-1)return a.push(_),_;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function f(_){let y=s[_.id],v=_.uniforms,w=_.__cache;i.bindBuffer(i.UNIFORM_BUFFER,y);for(let S=0,A=v.length;S<A;S++){let L=Array.isArray(v[S])?v[S]:[v[S]];for(let P=0,M=L.length;P<M;P++){let T=L[P];if(d(T,S,P,w)===!0){let I=T.__offset,F=Array.isArray(T.value)?T.value:[T.value],k=0;for(let U=0;U<F.length;U++){let N=F[U],D=b(N);typeof N=="number"||typeof N=="boolean"?(T.__data[0]=N,i.bufferSubData(i.UNIFORM_BUFFER,I+k,T.__data)):N.isMatrix3?(T.__data[0]=N.elements[0],T.__data[1]=N.elements[1],T.__data[2]=N.elements[2],T.__data[3]=0,T.__data[4]=N.elements[3],T.__data[5]=N.elements[4],T.__data[6]=N.elements[5],T.__data[7]=0,T.__data[8]=N.elements[6],T.__data[9]=N.elements[7],T.__data[10]=N.elements[8],T.__data[11]=0):(N.toArray(T.__data,k),k+=D.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,I,T.__data)}}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function d(_,y,v,w){let S=_.value,A=y+"_"+v;if(w[A]===void 0)return typeof S=="number"||typeof S=="boolean"?w[A]=S:w[A]=S.clone(),!0;{let L=w[A];if(typeof S=="number"||typeof S=="boolean"){if(L!==S)return w[A]=S,!0}else if(L.equals(S)===!1)return L.copy(S),!0}return!1}function g(_){let y=_.uniforms,v=0,w=16;for(let A=0,L=y.length;A<L;A++){let P=Array.isArray(y[A])?y[A]:[y[A]];for(let M=0,T=P.length;M<T;M++){let I=P[M],F=Array.isArray(I.value)?I.value:[I.value];for(let k=0,U=F.length;k<U;k++){let N=F[k],D=b(N),z=v%w;z!==0&&w-z<D.boundary&&(v+=w-z),I.__data=new Float32Array(D.storage/Float32Array.BYTES_PER_ELEMENT),I.__offset=v,v+=D.storage}}}let S=v%w;return S>0&&(v+=w-S),_.__size=v,_.__cache={},this}function b(_){let y={boundary:0,storage:0};return typeof _=="number"||typeof _=="boolean"?(y.boundary=4,y.storage=4):_.isVector2?(y.boundary=8,y.storage=8):_.isVector3||_.isColor?(y.boundary=16,y.storage=12):_.isVector4?(y.boundary=16,y.storage=16):_.isMatrix3?(y.boundary=48,y.storage=48):_.isMatrix4?(y.boundary=64,y.storage=64):_.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",_),y}function p(_){let y=_.target;y.removeEventListener("dispose",p);let v=a.indexOf(y.__bindingPointIndex);a.splice(v,1),i.deleteBuffer(s[y.id]),delete s[y.id],delete r[y.id]}function m(){for(let _ in s)i.deleteBuffer(s[_]);a=[],s={},r={}}return{bind:l,update:c,dispose:m}}var Ma=class{constructor(t={}){let{canvas:e=Mv(),context:n=null,depth:s=!0,stencil:r=!0,alpha:a=!1,antialias:o=!1,premultipliedAlpha:l=!0,preserveDrawingBuffer:c=!1,powerPreference:h="default",failIfMajorPerformanceCaveat:u=!1}=t;this.isWebGLRenderer=!0;let f;n!==null?f=n.getContextAttributes().alpha:f=a;let d=new Uint32Array(4),g=new Int32Array(4),b=null,p=null,m=[],_=[];this.domElement=e,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this._outputColorSpace=Pi,this._useLegacyLights=!1,this.toneMapping=Ps,this.toneMappingExposure=1;let y=this,v=!1,w=0,S=0,A=null,L=-1,P=null,M=new an,T=new an,I=null,F=new Nt(0),k=0,U=e.width,N=e.height,D=1,z=null,$=null,nt=new an(0,0,U,N),et=new an(0,0,U,N),rt=!1,bt=new xo,G=!1,tt=!1,at=null,Q=new ve,ft=new qt,ht=new V,Ht={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function Et(){return A===null?D:1}let O=n;function be(C,H){for(let Y=0;Y<C.length;Y++){let K=C[Y],X=e.getContext(K,H);if(X!==null)return X}return null}try{let C={alpha:!0,depth:s,stencil:r,antialias:o,premultipliedAlpha:l,preserveDrawingBuffer:c,powerPreference:h,failIfMajorPerformanceCaveat:u};if("setAttribute"in e&&e.setAttribute("data-engine",`three.js r${Ad}`),e.addEventListener("webglcontextlost",Me,!1),e.addEventListener("webglcontextrestored",B,!1),e.addEventListener("webglcontextcreationerror",pt,!1),O===null){let H=["webgl2","webgl","experimental-webgl"];if(y.isWebGL1Renderer===!0&&H.shift(),O=be(H,C),O===null)throw be(H)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}typeof WebGLRenderingContext!="undefined"&&O instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),O.getShaderPrecisionFormat===void 0&&(O.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(C){throw console.error("THREE.WebGLRenderer: "+C.message),C}let xt,wt,kt,ie,Gt,Yt,we,R,E,j,it,ot,st,Kt,Dt,dt,mt,Zt,lt,Be,se,Rt,At,Tt;function le(){xt=new NM(O),wt=new RM(O,xt,t),xt.init(wt),Rt=new pS(O,xt,wt),kt=new dS(O,xt,wt),ie=new OM(O),Gt=new tS,Yt=new fS(O,xt,kt,Gt,wt,Rt,ie),we=new PM(y),R=new UM(y),E=new $v(O,wt),At=new CM(O,xt,E,wt),j=new BM(O,E,ie,At),it=new WM(O,j,E,ie),lt=new GM(O,wt,Yt),dt=new LM(Gt),ot=new Q2(y,we,R,xt,wt,At,dt),st=new _S(y,Gt),Kt=new nS,Dt=new lS(xt,wt),Zt=new TM(y,we,R,kt,it,f,l),mt=new uS(y,it,wt),Tt=new vS(O,ie,wt,kt),Be=new kM(O,xt,ie,wt),se=new FM(O,xt,ie,wt),ie.programs=ot.programs,y.capabilities=wt,y.extensions=xt,y.properties=Gt,y.renderLists=Kt,y.shadowMap=mt,y.state=kt,y.info=ie}le();let $t=new ud(y,O);this.xr=$t,this.getContext=function(){return O},this.getContextAttributes=function(){return O.getContextAttributes()},this.forceContextLoss=function(){let C=xt.get("WEBGL_lose_context");C&&C.loseContext()},this.forceContextRestore=function(){let C=xt.get("WEBGL_lose_context");C&&C.restoreContext()},this.getPixelRatio=function(){return D},this.setPixelRatio=function(C){C!==void 0&&(D=C,this.setSize(U,N,!1))},this.getSize=function(C){return C.set(U,N)},this.setSize=function(C,H,Y=!0){if($t.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}U=C,N=H,e.width=Math.floor(C*D),e.height=Math.floor(H*D),Y===!0&&(e.style.width=C+"px",e.style.height=H+"px"),this.setViewport(0,0,C,H)},this.getDrawingBufferSize=function(C){return C.set(U*D,N*D).floor()},this.setDrawingBufferSize=function(C,H,Y){U=C,N=H,D=Y,e.width=Math.floor(C*Y),e.height=Math.floor(H*Y),this.setViewport(0,0,C,H)},this.getCurrentViewport=function(C){return C.copy(M)},this.getViewport=function(C){return C.copy(nt)},this.setViewport=function(C,H,Y,K){C.isVector4?nt.set(C.x,C.y,C.z,C.w):nt.set(C,H,Y,K),kt.viewport(M.copy(nt).multiplyScalar(D).round())},this.getScissor=function(C){return C.copy(et)},this.setScissor=function(C,H,Y,K){C.isVector4?et.set(C.x,C.y,C.z,C.w):et.set(C,H,Y,K),kt.scissor(T.copy(et).multiplyScalar(D).round())},this.getScissorTest=function(){return rt},this.setScissorTest=function(C){kt.setScissorTest(rt=C)},this.setOpaqueSort=function(C){z=C},this.setTransparentSort=function(C){$=C},this.getClearColor=function(C){return C.copy(Zt.getClearColor())},this.setClearColor=function(){Zt.setClearColor.apply(Zt,arguments)},this.getClearAlpha=function(){return Zt.getClearAlpha()},this.setClearAlpha=function(){Zt.setClearAlpha.apply(Zt,arguments)},this.clear=function(C=!0,H=!0,Y=!0){let K=0;if(C){let X=!1;if(A!==null){let yt=A.texture.format;X=yt===H0||yt===z0||yt===O0}if(X){let yt=A.texture.type,Ct=yt===ii||yt===Ls||yt===Ed||yt===gr||yt===B0||yt===F0,Lt=Zt.getClearColor(),Ft=Zt.getClearAlpha(),ee=Lt.r,Wt=Lt.g,Xt=Lt.b;Ct?(d[0]=ee,d[1]=Wt,d[2]=Xt,d[3]=Ft,O.clearBufferuiv(O.COLOR,0,d)):(g[0]=ee,g[1]=Wt,g[2]=Xt,g[3]=Ft,O.clearBufferiv(O.COLOR,0,g))}else K|=O.COLOR_BUFFER_BIT}H&&(K|=O.DEPTH_BUFFER_BIT),Y&&(K|=O.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),O.clear(K)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){e.removeEventListener("webglcontextlost",Me,!1),e.removeEventListener("webglcontextrestored",B,!1),e.removeEventListener("webglcontextcreationerror",pt,!1),Kt.dispose(),Dt.dispose(),Gt.dispose(),we.dispose(),R.dispose(),it.dispose(),At.dispose(),Tt.dispose(),ot.dispose(),$t.dispose(),$t.removeEventListener("sessionstart",Yn),$t.removeEventListener("sessionend",me),at&&(at.dispose(),at=null),_n.stop()};function Me(C){C.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),v=!0}function B(){console.log("THREE.WebGLRenderer: Context Restored."),v=!1;let C=ie.autoReset,H=mt.enabled,Y=mt.autoUpdate,K=mt.needsUpdate,X=mt.type;le(),ie.autoReset=C,mt.enabled=H,mt.autoUpdate=Y,mt.needsUpdate=K,mt.type=X}function pt(C){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",C.statusMessage)}function q(C){let H=C.target;H.removeEventListener("dispose",q),ct(H)}function ct(C){gt(C),Gt.remove(C)}function gt(C){let H=Gt.get(C).programs;H!==void 0&&(H.forEach(function(Y){ot.releaseProgram(Y)}),C.isShaderMaterial&&ot.releaseShaderCache(C))}this.renderBufferDirect=function(C,H,Y,K,X,yt){H===null&&(H=Ht);let Ct=X.isMesh&&X.matrixWorld.determinant()<0,Lt=Pb(C,H,Y,K,X);kt.setMaterial(K,Ct);let Ft=Y.index,ee=1;if(K.wireframe===!0){if(Ft=j.getWireframeAttribute(Y),Ft===void 0)return;ee=2}let Wt=Y.drawRange,Xt=Y.attributes.position,Ue=Wt.start*ee,On=(Wt.start+Wt.count)*ee;yt!==null&&(Ue=Math.max(Ue,yt.start*ee),On=Math.min(On,(yt.start+yt.count)*ee)),Ft!==null?(Ue=Math.max(Ue,0),On=Math.min(On,Ft.count)):Xt!=null&&(Ue=Math.max(Ue,0),On=Math.min(On,Xt.count));let Ye=On-Ue;if(Ye<0||Ye===1/0)return;At.setup(X,K,Lt,Y,Ft);let Vi,Te=Be;if(Ft!==null&&(Vi=E.get(Ft),Te=se,Te.setIndex(Vi)),X.isMesh)K.wireframe===!0?(kt.setLineWidth(K.wireframeLinewidth*Et()),Te.setMode(O.LINES)):Te.setMode(O.TRIANGLES);else if(X.isLine){let Jt=K.linewidth;Jt===void 0&&(Jt=1),kt.setLineWidth(Jt*Et()),X.isLineSegments?Te.setMode(O.LINES):X.isLineLoop?Te.setMode(O.LINE_LOOP):Te.setMode(O.LINE_STRIP)}else X.isPoints?Te.setMode(O.POINTS):X.isSprite&&Te.setMode(O.TRIANGLES);if(X.isBatchedMesh)Te.renderMultiDraw(X._multiDrawStarts,X._multiDrawCounts,X._multiDrawCount);else if(X.isInstancedMesh)Te.renderInstances(Ue,Ye,X.count);else if(Y.isInstancedBufferGeometry){let Jt=Y._maxInstanceCount!==void 0?Y._maxInstanceCount:1/0,Sh=Math.min(Y.instanceCount,Jt);Te.renderInstances(Ue,Ye,Sh)}else Te.render(Ue,Ye)};function re(C,H,Y){C.transparent===!0&&C.side===je&&C.forceSinglePass===!1?(C.side=Dn,C.needsUpdate=!0,il(C,H,Y),C.side=fn,C.needsUpdate=!0,il(C,H,Y),C.side=je):il(C,H,Y)}this.compile=function(C,H,Y=null){Y===null&&(Y=C),p=Dt.get(Y),p.init(),_.push(p),Y.traverseVisible(function(X){X.isLight&&X.layers.test(H.layers)&&(p.pushLight(X),X.castShadow&&p.pushShadow(X))}),C!==Y&&C.traverseVisible(function(X){X.isLight&&X.layers.test(H.layers)&&(p.pushLight(X),X.castShadow&&p.pushShadow(X))}),p.setupLights(y._useLegacyLights);let K=new Set;return C.traverse(function(X){let yt=X.material;if(yt)if(Array.isArray(yt))for(let Ct=0;Ct<yt.length;Ct++){let Lt=yt[Ct];re(Lt,Y,X),K.add(Lt)}else re(yt,Y,X),K.add(yt)}),_.pop(),p=null,K},this.compileAsync=function(C,H,Y=null){let K=this.compile(C,H,Y);return new Promise(X=>{function yt(){if(K.forEach(function(Ct){Gt.get(Ct).currentProgram.isReady()&&K.delete(Ct)}),K.size===0){X(C);return}setTimeout(yt,10)}xt.get("KHR_parallel_shader_compile")!==null?yt():setTimeout(yt,10)})};let pe=null;function tn(C){pe&&pe(C)}function Yn(){_n.stop()}function me(){_n.start()}let _n=new Y0;_n.setAnimationLoop(tn),typeof self!="undefined"&&_n.setContext(self),this.setAnimationLoop=function(C){pe=C,$t.setAnimationLoop(C),C===null?_n.stop():_n.start()},$t.addEventListener("sessionstart",Yn),$t.addEventListener("sessionend",me),this.render=function(C,H){if(H!==void 0&&H.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(v===!0)return;C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),H.parent===null&&H.matrixWorldAutoUpdate===!0&&H.updateMatrixWorld(),$t.enabled===!0&&$t.isPresenting===!0&&($t.cameraAutoUpdate===!0&&$t.updateCamera(H),H=$t.getCamera()),C.isScene===!0&&C.onBeforeRender(y,C,H,A),p=Dt.get(C,_.length),p.init(),_.push(p),Q.multiplyMatrices(H.projectionMatrix,H.matrixWorldInverse),bt.setFromProjectionMatrix(Q),tt=this.localClippingEnabled,G=dt.init(this.clippingPlanes,tt),b=Kt.get(C,m.length),b.init(),m.push(b),Ei(C,H,0,y.sortObjects),b.finish(),y.sortObjects===!0&&b.sort(z,$),this.info.render.frame++,G===!0&&dt.beginShadows();let Y=p.state.shadowsArray;if(mt.render(Y,C,H),G===!0&&dt.endShadows(),this.info.autoReset===!0&&this.info.reset(),($t.enabled===!1||$t.isPresenting===!1||$t.hasDepthSensing()===!1)&&Zt.render(b,C),p.setupLights(y._useLegacyLights),H.isArrayCamera){let K=H.cameras;for(let X=0,yt=K.length;X<yt;X++){let Ct=K[X];Df(b,C,Ct,Ct.viewport)}}else Df(b,C,H);A!==null&&(Yt.updateMultisampleRenderTarget(A),Yt.updateRenderTargetMipmap(A)),C.isScene===!0&&C.onAfterRender(y,C,H),At.resetDefaultState(),L=-1,P=null,_.pop(),_.length>0?p=_[_.length-1]:p=null,m.pop(),m.length>0?b=m[m.length-1]:b=null};function Ei(C,H,Y,K){if(C.visible===!1)return;if(C.layers.test(H.layers)){if(C.isGroup)Y=C.renderOrder;else if(C.isLOD)C.autoUpdate===!0&&C.update(H);else if(C.isLight)p.pushLight(C),C.castShadow&&p.pushShadow(C);else if(C.isSprite){if(!C.frustumCulled||bt.intersectsSprite(C)){K&&ht.setFromMatrixPosition(C.matrixWorld).applyMatrix4(Q);let Ct=it.update(C),Lt=C.material;Lt.visible&&b.push(C,Ct,Lt,Y,ht.z,null)}}else if((C.isMesh||C.isLine||C.isPoints)&&(!C.frustumCulled||bt.intersectsObject(C))){let Ct=it.update(C),Lt=C.material;if(K&&(C.boundingSphere!==void 0?(C.boundingSphere===null&&C.computeBoundingSphere(),ht.copy(C.boundingSphere.center)):(Ct.boundingSphere===null&&Ct.computeBoundingSphere(),ht.copy(Ct.boundingSphere.center)),ht.applyMatrix4(C.matrixWorld).applyMatrix4(Q)),Array.isArray(Lt)){let Ft=Ct.groups;for(let ee=0,Wt=Ft.length;ee<Wt;ee++){let Xt=Ft[ee],Ue=Lt[Xt.materialIndex];Ue&&Ue.visible&&b.push(C,Ct,Ue,Y,ht.z,Xt)}}else Lt.visible&&b.push(C,Ct,Lt,Y,ht.z,null)}}let yt=C.children;for(let Ct=0,Lt=yt.length;Ct<Lt;Ct++)Ei(yt[Ct],H,Y,K)}function Df(C,H,Y,K){let X=C.opaque,yt=C.transmissive,Ct=C.transparent;p.setupLightsView(Y),G===!0&&dt.setGlobalState(y.clippingPlanes,Y),yt.length>0&&Lb(X,yt,H,Y),K&&kt.viewport(M.copy(K)),X.length>0&&nl(X,H,Y),yt.length>0&&nl(yt,H,Y),Ct.length>0&&nl(Ct,H,Y),kt.buffers.depth.setTest(!0),kt.buffers.depth.setMask(!0),kt.buffers.color.setMask(!0),kt.setPolygonOffset(!1)}function Lb(C,H,Y,K){if((Y.isScene===!0?Y.overrideMaterial:null)!==null)return;let yt=wt.isWebGL2;at===null&&(at=new gi(1,1,{generateMipmaps:!0,type:xt.has("EXT_color_buffer_half_float")?va:ii,minFilter:mr,samples:yt?4:0})),y.getDrawingBufferSize(ft),yt?at.setSize(ft.x,ft.y):at.setSize(Zu(ft.x),Zu(ft.y));let Ct=y.getRenderTarget();y.setRenderTarget(at),y.getClearColor(F),k=y.getClearAlpha(),k<1&&y.setClearColor(16777215,.5),y.clear();let Lt=y.toneMapping;y.toneMapping=Ps,nl(C,Y,K),Yt.updateMultisampleRenderTarget(at),Yt.updateRenderTargetMipmap(at);let Ft=!1;for(let ee=0,Wt=H.length;ee<Wt;ee++){let Xt=H[ee],Ue=Xt.object,On=Xt.geometry,Ye=Xt.material,Vi=Xt.group;if(Ye.side===je&&Ue.layers.test(K.layers)){let Te=Ye.side;Ye.side=Dn,Ye.needsUpdate=!0,Uf(Ue,Y,K,On,Ye,Vi),Ye.side=Te,Ye.needsUpdate=!0,Ft=!0}}Ft===!0&&(Yt.updateMultisampleRenderTarget(at),Yt.updateRenderTargetMipmap(at)),y.setRenderTarget(Ct),y.setClearColor(F,k),y.toneMapping=Lt}function nl(C,H,Y){let K=H.isScene===!0?H.overrideMaterial:null;for(let X=0,yt=C.length;X<yt;X++){let Ct=C[X],Lt=Ct.object,Ft=Ct.geometry,ee=K===null?Ct.material:K,Wt=Ct.group;Lt.layers.test(Y.layers)&&Uf(Lt,H,Y,Ft,ee,Wt)}}function Uf(C,H,Y,K,X,yt){C.onBeforeRender(y,H,Y,K,X,yt),C.modelViewMatrix.multiplyMatrices(Y.matrixWorldInverse,C.matrixWorld),C.normalMatrix.getNormalMatrix(C.modelViewMatrix),X.onBeforeRender(y,H,Y,K,C,yt),X.transparent===!0&&X.side===je&&X.forceSinglePass===!1?(X.side=Dn,X.needsUpdate=!0,y.renderBufferDirect(Y,H,K,X,C,yt),X.side=fn,X.needsUpdate=!0,y.renderBufferDirect(Y,H,K,X,C,yt),X.side=je):y.renderBufferDirect(Y,H,K,X,C,yt),C.onAfterRender(y,H,Y,K,X,yt)}function il(C,H,Y){H.isScene!==!0&&(H=Ht);let K=Gt.get(C),X=p.state.lights,yt=p.state.shadowsArray,Ct=X.state.version,Lt=ot.getParameters(C,X.state,yt,H,Y),Ft=ot.getProgramCacheKey(Lt),ee=K.programs;K.environment=C.isMeshStandardMaterial?H.environment:null,K.fog=H.fog,K.envMap=(C.isMeshStandardMaterial?R:we).get(C.envMap||K.environment),K.envMapRotation=K.environment!==null&&C.envMap===null?H.environmentRotation:C.envMapRotation,ee===void 0&&(C.addEventListener("dispose",q),ee=new Map,K.programs=ee);let Wt=ee.get(Ft);if(Wt!==void 0){if(K.currentProgram===Wt&&K.lightsStateVersion===Ct)return Bf(C,Lt),Wt}else Lt.uniforms=ot.getUniforms(C),C.onBuild(Y,Lt,y),C.onBeforeCompile(Lt,y),Wt=ot.acquireProgram(Lt,Ft),ee.set(Ft,Wt),K.uniforms=Lt.uniforms;let Xt=K.uniforms;return(!C.isShaderMaterial&&!C.isRawShaderMaterial||C.clipping===!0)&&(Xt.clippingPlanes=dt.uniform),Bf(C,Lt),K.needsLights=Db(C),K.lightsStateVersion=Ct,K.needsLights&&(Xt.ambientLightColor.value=X.state.ambient,Xt.lightProbe.value=X.state.probe,Xt.directionalLights.value=X.state.directional,Xt.directionalLightShadows.value=X.state.directionalShadow,Xt.spotLights.value=X.state.spot,Xt.spotLightShadows.value=X.state.spotShadow,Xt.rectAreaLights.value=X.state.rectArea,Xt.ltc_1.value=X.state.rectAreaLTC1,Xt.ltc_2.value=X.state.rectAreaLTC2,Xt.pointLights.value=X.state.point,Xt.pointLightShadows.value=X.state.pointShadow,Xt.hemisphereLights.value=X.state.hemi,Xt.directionalShadowMap.value=X.state.directionalShadowMap,Xt.directionalShadowMatrix.value=X.state.directionalShadowMatrix,Xt.spotShadowMap.value=X.state.spotShadowMap,Xt.spotLightMatrix.value=X.state.spotLightMatrix,Xt.spotLightMap.value=X.state.spotLightMap,Xt.pointShadowMap.value=X.state.pointShadowMap,Xt.pointShadowMatrix.value=X.state.pointShadowMatrix),K.currentProgram=Wt,K.uniformsList=null,Wt}function Nf(C){if(C.uniformsList===null){let H=C.currentProgram.getUniforms();C.uniformsList=mo.seqWithValue(H.seq,C.uniforms)}return C.uniformsList}function Bf(C,H){let Y=Gt.get(C);Y.outputColorSpace=H.outputColorSpace,Y.batching=H.batching,Y.instancing=H.instancing,Y.instancingColor=H.instancingColor,Y.instancingMorph=H.instancingMorph,Y.skinning=H.skinning,Y.morphTargets=H.morphTargets,Y.morphNormals=H.morphNormals,Y.morphColors=H.morphColors,Y.morphTargetsCount=H.morphTargetsCount,Y.numClippingPlanes=H.numClippingPlanes,Y.numIntersection=H.numClipIntersection,Y.vertexAlphas=H.vertexAlphas,Y.vertexTangents=H.vertexTangents,Y.toneMapping=H.toneMapping}function Pb(C,H,Y,K,X){H.isScene!==!0&&(H=Ht),Yt.resetTextureUnits();let yt=H.fog,Ct=K.isMeshStandardMaterial?H.environment:null,Lt=A===null?y.outputColorSpace:A.isXRRenderTarget===!0?A.texture.colorSpace:Ni,Ft=(K.isMeshStandardMaterial?R:we).get(K.envMap||Ct),ee=K.vertexColors===!0&&!!Y.attributes.color&&Y.attributes.color.itemSize===4,Wt=!!Y.attributes.tangent&&(!!K.normalMap||K.anisotropy>0),Xt=!!Y.morphAttributes.position,Ue=!!Y.morphAttributes.normal,On=!!Y.morphAttributes.color,Ye=Ps;K.toneMapped&&(A===null||A.isXRRenderTarget===!0)&&(Ye=y.toneMapping);let Vi=Y.morphAttributes.position||Y.morphAttributes.normal||Y.morphAttributes.color,Te=Vi!==void 0?Vi.length:0,Jt=Gt.get(K),Sh=p.state.lights;if(G===!0&&(tt===!0||C!==P)){let Kn=C===P&&K.id===L;dt.setState(K,C,Kn)}let Se=!1;K.version===Jt.__version?(Jt.needsLights&&Jt.lightsStateVersion!==Sh.state.version||Jt.outputColorSpace!==Lt||X.isBatchedMesh&&Jt.batching===!1||!X.isBatchedMesh&&Jt.batching===!0||X.isInstancedMesh&&Jt.instancing===!1||!X.isInstancedMesh&&Jt.instancing===!0||X.isSkinnedMesh&&Jt.skinning===!1||!X.isSkinnedMesh&&Jt.skinning===!0||X.isInstancedMesh&&Jt.instancingColor===!0&&X.instanceColor===null||X.isInstancedMesh&&Jt.instancingColor===!1&&X.instanceColor!==null||X.isInstancedMesh&&Jt.instancingMorph===!0&&X.morphTexture===null||X.isInstancedMesh&&Jt.instancingMorph===!1&&X.morphTexture!==null||Jt.envMap!==Ft||K.fog===!0&&Jt.fog!==yt||Jt.numClippingPlanes!==void 0&&(Jt.numClippingPlanes!==dt.numPlanes||Jt.numIntersection!==dt.numIntersection)||Jt.vertexAlphas!==ee||Jt.vertexTangents!==Wt||Jt.morphTargets!==Xt||Jt.morphNormals!==Ue||Jt.morphColors!==On||Jt.toneMapping!==Ye||wt.isWebGL2===!0&&Jt.morphTargetsCount!==Te)&&(Se=!0):(Se=!0,Jt.__version=K.version);let Ks=Jt.currentProgram;Se===!0&&(Ks=il(K,H,X));let Ff=!1,ea=!1,Ah=!1,cn=Ks.getUniforms(),Zs=Jt.uniforms;if(kt.useProgram(Ks.program)&&(Ff=!0,ea=!0,Ah=!0),K.id!==L&&(L=K.id,ea=!0),Ff||P!==C){cn.setValue(O,"projectionMatrix",C.projectionMatrix),cn.setValue(O,"viewMatrix",C.matrixWorldInverse);let Kn=cn.map.cameraPosition;Kn!==void 0&&Kn.setValue(O,ht.setFromMatrixPosition(C.matrixWorld)),wt.logarithmicDepthBuffer&&cn.setValue(O,"logDepthBufFC",2/(Math.log(C.far+1)/Math.LN2)),(K.isMeshPhongMaterial||K.isMeshToonMaterial||K.isMeshLambertMaterial||K.isMeshBasicMaterial||K.isMeshStandardMaterial||K.isShaderMaterial)&&cn.setValue(O,"isOrthographic",C.isOrthographicCamera===!0),P!==C&&(P=C,ea=!0,Ah=!0)}if(X.isSkinnedMesh){cn.setOptional(O,X,"bindMatrix"),cn.setOptional(O,X,"bindMatrixInverse");let Kn=X.skeleton;Kn&&(wt.floatVertexTextures?(Kn.boneTexture===null&&Kn.computeBoneTexture(),cn.setValue(O,"boneTexture",Kn.boneTexture,Yt)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}X.isBatchedMesh&&(cn.setOptional(O,X,"batchingTexture"),cn.setValue(O,"batchingTexture",X._matricesTexture,Yt));let Eh=Y.morphAttributes;if((Eh.position!==void 0||Eh.normal!==void 0||Eh.color!==void 0&&wt.isWebGL2===!0)&&lt.update(X,Y,Ks),(ea||Jt.receiveShadow!==X.receiveShadow)&&(Jt.receiveShadow=X.receiveShadow,cn.setValue(O,"receiveShadow",X.receiveShadow)),K.isMeshGouraudMaterial&&K.envMap!==null&&(Zs.envMap.value=Ft,Zs.flipEnvMap.value=Ft.isCubeTexture&&Ft.isRenderTargetTexture===!1?-1:1),ea&&(cn.setValue(O,"toneMappingExposure",y.toneMappingExposure),Jt.needsLights&&Ib(Zs,Ah),yt&&K.fog===!0&&st.refreshFogUniforms(Zs,yt),st.refreshMaterialUniforms(Zs,K,D,N,at),mo.upload(O,Nf(Jt),Zs,Yt)),K.isShaderMaterial&&K.uniformsNeedUpdate===!0&&(mo.upload(O,Nf(Jt),Zs,Yt),K.uniformsNeedUpdate=!1),K.isSpriteMaterial&&cn.setValue(O,"center",X.center),cn.setValue(O,"modelViewMatrix",X.modelViewMatrix),cn.setValue(O,"normalMatrix",X.normalMatrix),cn.setValue(O,"modelMatrix",X.matrixWorld),K.isShaderMaterial||K.isRawShaderMaterial){let Kn=K.uniformsGroups;for(let Th=0,Ub=Kn.length;Th<Ub;Th++)if(wt.isWebGL2){let Of=Kn[Th];Tt.update(Of,Ks),Tt.bind(Of,Ks)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return Ks}function Ib(C,H){C.ambientLightColor.needsUpdate=H,C.lightProbe.needsUpdate=H,C.directionalLights.needsUpdate=H,C.directionalLightShadows.needsUpdate=H,C.pointLights.needsUpdate=H,C.pointLightShadows.needsUpdate=H,C.spotLights.needsUpdate=H,C.spotLightShadows.needsUpdate=H,C.rectAreaLights.needsUpdate=H,C.hemisphereLights.needsUpdate=H}function Db(C){return C.isMeshLambertMaterial||C.isMeshToonMaterial||C.isMeshPhongMaterial||C.isMeshStandardMaterial||C.isShadowMaterial||C.isShaderMaterial&&C.lights===!0}this.getActiveCubeFace=function(){return w},this.getActiveMipmapLevel=function(){return S},this.getRenderTarget=function(){return A},this.setRenderTargetTextures=function(C,H,Y){Gt.get(C.texture).__webglTexture=H,Gt.get(C.depthTexture).__webglTexture=Y;let K=Gt.get(C);K.__hasExternalTextures=!0,K.__autoAllocateDepthBuffer=Y===void 0,K.__autoAllocateDepthBuffer||xt.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),K.__useRenderToTexture=!1)},this.setRenderTargetFramebuffer=function(C,H){let Y=Gt.get(C);Y.__webglFramebuffer=H,Y.__useDefaultFramebuffer=H===void 0},this.setRenderTarget=function(C,H=0,Y=0){A=C,w=H,S=Y;let K=!0,X=null,yt=!1,Ct=!1;if(C){let Ft=Gt.get(C);Ft.__useDefaultFramebuffer!==void 0?(kt.bindFramebuffer(O.FRAMEBUFFER,null),K=!1):Ft.__webglFramebuffer===void 0?Yt.setupRenderTarget(C):Ft.__hasExternalTextures&&Yt.rebindTextures(C,Gt.get(C.texture).__webglTexture,Gt.get(C.depthTexture).__webglTexture);let ee=C.texture;(ee.isData3DTexture||ee.isDataArrayTexture||ee.isCompressedArrayTexture)&&(Ct=!0);let Wt=Gt.get(C).__webglFramebuffer;C.isWebGLCubeRenderTarget?(Array.isArray(Wt[H])?X=Wt[H][Y]:X=Wt[H],yt=!0):wt.isWebGL2&&C.samples>0&&Yt.useMultisampledRTT(C)===!1?X=Gt.get(C).__webglMultisampledFramebuffer:Array.isArray(Wt)?X=Wt[Y]:X=Wt,M.copy(C.viewport),T.copy(C.scissor),I=C.scissorTest}else M.copy(nt).multiplyScalar(D).floor(),T.copy(et).multiplyScalar(D).floor(),I=rt;if(kt.bindFramebuffer(O.FRAMEBUFFER,X)&&wt.drawBuffers&&K&&kt.drawBuffers(C,X),kt.viewport(M),kt.scissor(T),kt.setScissorTest(I),yt){let Ft=Gt.get(C.texture);O.framebufferTexture2D(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,O.TEXTURE_CUBE_MAP_POSITIVE_X+H,Ft.__webglTexture,Y)}else if(Ct){let Ft=Gt.get(C.texture),ee=H||0;O.framebufferTextureLayer(O.FRAMEBUFFER,O.COLOR_ATTACHMENT0,Ft.__webglTexture,Y||0,ee)}L=-1},this.readRenderTargetPixels=function(C,H,Y,K,X,yt,Ct){if(!(C&&C.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let Lt=Gt.get(C).__webglFramebuffer;if(C.isWebGLCubeRenderTarget&&Ct!==void 0&&(Lt=Lt[Ct]),Lt){kt.bindFramebuffer(O.FRAMEBUFFER,Lt);try{let Ft=C.texture,ee=Ft.format,Wt=Ft.type;if(ee!==An&&Rt.convert(ee)!==O.getParameter(O.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}let Xt=Wt===va&&(xt.has("EXT_color_buffer_half_float")||wt.isWebGL2&&xt.has("EXT_color_buffer_float"));if(Wt!==ii&&Rt.convert(Wt)!==O.getParameter(O.IMPLEMENTATION_COLOR_READ_TYPE)&&!(Wt===es&&(wt.isWebGL2||xt.has("OES_texture_float")||xt.has("WEBGL_color_buffer_float")))&&!Xt){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}H>=0&&H<=C.width-K&&Y>=0&&Y<=C.height-X&&O.readPixels(H,Y,K,X,Rt.convert(ee),Rt.convert(Wt),yt)}finally{let Ft=A!==null?Gt.get(A).__webglFramebuffer:null;kt.bindFramebuffer(O.FRAMEBUFFER,Ft)}}},this.copyFramebufferToTexture=function(C,H,Y=0){let K=Math.pow(2,-Y),X=Math.floor(H.image.width*K),yt=Math.floor(H.image.height*K);Yt.setTexture2D(H,0),O.copyTexSubImage2D(O.TEXTURE_2D,Y,0,0,C.x,C.y,X,yt),kt.unbindTexture()},this.copyTextureToTexture=function(C,H,Y,K=0){let X=H.image.width,yt=H.image.height,Ct=Rt.convert(Y.format),Lt=Rt.convert(Y.type);Yt.setTexture2D(Y,0),O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,Y.flipY),O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,Y.premultiplyAlpha),O.pixelStorei(O.UNPACK_ALIGNMENT,Y.unpackAlignment),H.isDataTexture?O.texSubImage2D(O.TEXTURE_2D,K,C.x,C.y,X,yt,Ct,Lt,H.image.data):H.isCompressedTexture?O.compressedTexSubImage2D(O.TEXTURE_2D,K,C.x,C.y,H.mipmaps[0].width,H.mipmaps[0].height,Ct,H.mipmaps[0].data):O.texSubImage2D(O.TEXTURE_2D,K,C.x,C.y,Ct,Lt,H.image),K===0&&Y.generateMipmaps&&O.generateMipmap(O.TEXTURE_2D),kt.unbindTexture()},this.copyTextureToTexture3D=function(C,H,Y,K,X=0){if(y.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}let yt=Math.round(C.max.x-C.min.x),Ct=Math.round(C.max.y-C.min.y),Lt=C.max.z-C.min.z+1,Ft=Rt.convert(K.format),ee=Rt.convert(K.type),Wt;if(K.isData3DTexture)Yt.setTexture3D(K,0),Wt=O.TEXTURE_3D;else if(K.isDataArrayTexture||K.isCompressedArrayTexture)Yt.setTexture2DArray(K,0),Wt=O.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}O.pixelStorei(O.UNPACK_FLIP_Y_WEBGL,K.flipY),O.pixelStorei(O.UNPACK_PREMULTIPLY_ALPHA_WEBGL,K.premultiplyAlpha),O.pixelStorei(O.UNPACK_ALIGNMENT,K.unpackAlignment);let Xt=O.getParameter(O.UNPACK_ROW_LENGTH),Ue=O.getParameter(O.UNPACK_IMAGE_HEIGHT),On=O.getParameter(O.UNPACK_SKIP_PIXELS),Ye=O.getParameter(O.UNPACK_SKIP_ROWS),Vi=O.getParameter(O.UNPACK_SKIP_IMAGES),Te=Y.isCompressedTexture?Y.mipmaps[X]:Y.image;O.pixelStorei(O.UNPACK_ROW_LENGTH,Te.width),O.pixelStorei(O.UNPACK_IMAGE_HEIGHT,Te.height),O.pixelStorei(O.UNPACK_SKIP_PIXELS,C.min.x),O.pixelStorei(O.UNPACK_SKIP_ROWS,C.min.y),O.pixelStorei(O.UNPACK_SKIP_IMAGES,C.min.z),Y.isDataTexture||Y.isData3DTexture?O.texSubImage3D(Wt,X,H.x,H.y,H.z,yt,Ct,Lt,Ft,ee,Te.data):K.isCompressedArrayTexture?O.compressedTexSubImage3D(Wt,X,H.x,H.y,H.z,yt,Ct,Lt,Ft,Te.data):O.texSubImage3D(Wt,X,H.x,H.y,H.z,yt,Ct,Lt,Ft,ee,Te),O.pixelStorei(O.UNPACK_ROW_LENGTH,Xt),O.pixelStorei(O.UNPACK_IMAGE_HEIGHT,Ue),O.pixelStorei(O.UNPACK_SKIP_PIXELS,On),O.pixelStorei(O.UNPACK_SKIP_ROWS,Ye),O.pixelStorei(O.UNPACK_SKIP_IMAGES,Vi),X===0&&K.generateMipmaps&&O.generateMipmap(Wt),kt.unbindTexture()},this.initTexture=function(C){C.isCubeTexture?Yt.setTextureCube(C,0):C.isData3DTexture?Yt.setTexture3D(C,0):C.isDataArrayTexture||C.isCompressedArrayTexture?Yt.setTexture2DArray(C,0):Yt.setTexture2D(C,0),kt.unbindTexture()},this.resetState=function(){w=0,S=0,A=null,kt.reset(),At.reset()},typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return ns}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(t){this._outputColorSpace=t;let e=this.getContext();e.drawingBufferColorSpace=t===Td?"display-p3":"srgb",e.unpackColorSpace=he.workingColorSpace===_c?"display-p3":"srgb"}get useLegacyLights(){return console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights}set useLegacyLights(t){console.warn("THREE.WebGLRenderer: The property .useLegacyLights has been deprecated. Migrate your lighting according to the following guide: https://discourse.threejs.org/t/updates-to-lighting-in-three-js-r155/53733."),this._useLegacyLights=t}},dd=class extends Ma{};dd.prototype.isWebGL1Renderer=!0;var wo=class extends si{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new rs,this.environmentRotation=new rs,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(t,e){return super.copy(t,e),t.background!==null&&(this.background=t.background.clone()),t.environment!==null&&(this.environment=t.environment.clone()),t.fog!==null&&(this.fog=t.fog.clone()),this.backgroundBlurriness=t.backgroundBlurriness,this.backgroundIntensity=t.backgroundIntensity,this.backgroundRotation.copy(t.backgroundRotation),this.environmentRotation.copy(t.environmentRotation),t.overrideMaterial!==null&&(this.overrideMaterial=t.overrideMaterial.clone()),this.matrixAutoUpdate=t.matrixAutoUpdate,this}toJSON(t){let e=super.toJSON(t);return this.fog!==null&&(e.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(e.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(e.object.backgroundIntensity=this.backgroundIntensity),e.object.backgroundRotation=this.backgroundRotation.toArray(),e.object.environmentRotation=this.environmentRotation.toArray(),e}};var gc=class extends Wn{constructor(t=null,e=1,n=1,s,r,a,o,l,c=ke,h=ke,u,f){super(null,a,o,l,c,h,s,r,u,f),this.isDataTexture=!0,this.image={data:t,width:e,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}};var fd=class extends _r{constructor(t){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new Nt(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(t)}copy(t){return super.copy(t),this.color.copy(t.color),this.map=t.map,this.alphaMap=t.alphaMap,this.size=t.size,this.sizeAttenuation=t.sizeAttenuation,this.fog=t.fog,this}},L0=new ve,pd=new oc,Xl=new Ui,ql=new V,bc=class extends si{constructor(t=new Re,e=new fd){super(),this.isPoints=!0,this.type="Points",this.geometry=t,this.material=e,this.updateMorphTargets()}copy(t,e){return super.copy(t,e),this.material=Array.isArray(t.material)?t.material.slice():t.material,this.geometry=t.geometry,this}raycast(t,e){let n=this.geometry,s=this.matrixWorld,r=t.params.Points.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),Xl.copy(n.boundingSphere),Xl.applyMatrix4(s),Xl.radius+=r,t.ray.intersectsSphere(Xl)===!1)return;L0.copy(s).invert(),pd.copy(t.ray).applyMatrix4(L0);let o=r/((this.scale.x+this.scale.y+this.scale.z)/3),l=o*o,c=n.index,u=n.attributes.position;if(c!==null){let f=Math.max(0,a.start),d=Math.min(c.count,a.start+a.count);for(let g=f,b=d;g<b;g++){let p=c.getX(g);ql.fromBufferAttribute(u,p),P0(ql,p,l,s,t,e,this)}}else{let f=Math.max(0,a.start),d=Math.min(u.count,a.start+a.count);for(let g=f,b=d;g<b;g++)ql.fromBufferAttribute(u,g),P0(ql,g,l,s,t,e,this)}}updateMorphTargets(){let e=this.geometry.morphAttributes,n=Object.keys(e);if(n.length>0){let s=e[n[0]];if(s!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let r=0,a=s.length;r<a;r++){let o=s[r].name||String(r);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=r}}}}};function P0(i,t,e,n,s,r,a){let o=pd.distanceSqToPoint(i);if(o<e){let l=new V;pd.closestPointToPoint(i,l),l.applyMatrix4(n);let c=s.ray.origin.distanceTo(l);if(c<s.near||c>s.far)return;r.push({distance:c,distanceToRay:Math.sqrt(o),point:l,index:t,face:null,object:a})}}function Yl(i,t,e){return!i||!e&&i.constructor===t?i:typeof t.BYTES_PER_ELEMENT=="number"?new t(i):Array.prototype.slice.call(i)}function xS(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}var Mo=class{constructor(t,e,n,s){this.parameterPositions=t,this._cachedIndex=0,this.resultBuffer=s!==void 0?s:new e.constructor(n),this.sampleValues=e,this.valueSize=n,this.settings=null,this.DefaultSettings_={}}evaluate(t){let e=this.parameterPositions,n=this._cachedIndex,s=e[n],r=e[n-1];n:{t:{let a;e:{i:if(!(t<s)){for(let o=n+2;;){if(s===void 0){if(t<r)break i;return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}if(n===o)break;if(r=s,s=e[++n],t<s)break t}a=e.length;break e}if(!(t>=r)){let o=e[1];t<o&&(n=2,r=o);for(let l=n-2;;){if(r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===l)break;if(s=r,r=e[--n-1],t>=r)break t}a=n,n=0;break e}break n}for(;n<a;){let o=n+a>>>1;t<e[o]?a=o:n=o+1}if(s=e[n],r=e[n-1],r===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(s===void 0)return n=e.length,this._cachedIndex=n,this.copySampleValue_(n-1)}this._cachedIndex=n,this.intervalChanged_(n,r,s)}return this.interpolate_(n,r,t,s)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(t){let e=this.resultBuffer,n=this.sampleValues,s=this.valueSize,r=t*s;for(let a=0;a!==s;++a)e[a]=n[r+a];return e}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}},md=class extends Mo{constructor(t,e,n,s){super(t,e,n,s),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:Om,endingEnd:Om}}intervalChanged_(t,e,n){let s=this.parameterPositions,r=t-2,a=t+1,o=s[r],l=s[a];if(o===void 0)switch(this.getSettings_().endingStart){case zm:r=t,o=2*e-n;break;case Hm:r=s.length-2,o=e+s[r]-s[r+1];break;default:r=t,o=n}if(l===void 0)switch(this.getSettings_().endingEnd){case zm:a=t,l=2*n-e;break;case Hm:a=1,l=n+s[1]-s[0];break;default:a=t-1,l=e}let c=(n-e)*.5,h=this.valueSize;this._weightPrev=c/(e-o),this._weightNext=c/(l-n),this._offsetPrev=r*h,this._offsetNext=a*h}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=this._offsetPrev,u=this._offsetNext,f=this._weightPrev,d=this._weightNext,g=(n-e)/(s-e),b=g*g,p=b*g,m=-f*p+2*f*b-f*g,_=(1+f)*p+(-1.5-2*f)*b+(-.5+f)*g+1,y=(-1-d)*p+(1.5+d)*b+.5*g,v=d*p-d*b;for(let w=0;w!==o;++w)r[w]=m*a[h+w]+_*a[c+w]+y*a[l+w]+v*a[u+w];return r}},gd=class extends Mo{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=t*o,c=l-o,h=(n-e)/(s-e),u=1-h;for(let f=0;f!==o;++f)r[f]=a[c+f]*u+a[l+f]*h;return r}},bd=class extends Mo{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t){return this.copySampleValue_(t-1)}},bi=class{constructor(t,e,n,s){if(t===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(e===void 0||e.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+t);this.name=t,this.times=Yl(e,this.TimeBufferType),this.values=Yl(n,this.ValueBufferType),this.setInterpolation(s||this.DefaultInterpolation)}static toJSON(t){let e=t.constructor,n;if(e.toJSON!==this.toJSON)n=e.toJSON(t);else{n={name:t.name,times:Yl(t.times,Array),values:Yl(t.values,Array)};let s=t.getInterpolation();s!==t.DefaultInterpolation&&(n.interpolation=s)}return n.type=t.ValueTypeName,n}InterpolantFactoryMethodDiscrete(t){return new bd(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodLinear(t){return new gd(this.times,this.values,this.getValueSize(),t)}InterpolantFactoryMethodSmooth(t){return new md(this.times,this.values,this.getValueSize(),t)}setInterpolation(t){let e;switch(t){case Zl:e=this.InterpolantFactoryMethodDiscrete;break;case Jl:e=this.InterpolantFactoryMethodLinear;break;case mu:e=this.InterpolantFactoryMethodSmooth;break}if(e===void 0){let n="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(t!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(n);return console.warn("THREE.KeyframeTrack:",n),this}return this.createInterpolant=e,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Zl;case this.InterpolantFactoryMethodLinear:return Jl;case this.InterpolantFactoryMethodSmooth:return mu}}getValueSize(){return this.values.length/this.times.length}shift(t){if(t!==0){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]+=t}return this}scale(t){if(t!==1){let e=this.times;for(let n=0,s=e.length;n!==s;++n)e[n]*=t}return this}trim(t,e){let n=this.times,s=n.length,r=0,a=s-1;for(;r!==s&&n[r]<t;)++r;for(;a!==-1&&n[a]>e;)--a;if(++a,r!==0||a!==s){r>=a&&(a=Math.max(a,1),r=a-1);let o=this.getValueSize();this.times=n.slice(r,a),this.values=this.values.slice(r*o,a*o)}return this}validate(){let t=!0,e=this.getValueSize();e-Math.floor(e)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),t=!1);let n=this.times,s=this.values,r=n.length;r===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),t=!1);let a=null;for(let o=0;o!==r;o++){let l=n[o];if(typeof l=="number"&&isNaN(l)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,o,l),t=!1;break}if(a!==null&&a>l){console.error("THREE.KeyframeTrack: Out of order keys.",this,o,l,a),t=!1;break}a=l}if(s!==void 0&&xS(s))for(let o=0,l=s.length;o!==l;++o){let c=s[o];if(isNaN(c)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,o,c),t=!1;break}}return t}optimize(){let t=this.times.slice(),e=this.values.slice(),n=this.getValueSize(),s=this.getInterpolation()===mu,r=t.length-1,a=1;for(let o=1;o<r;++o){let l=!1,c=t[o],h=t[o+1];if(c!==h&&(o!==1||c!==t[0]))if(s)l=!0;else{let u=o*n,f=u-n,d=u+n;for(let g=0;g!==n;++g){let b=e[u+g];if(b!==e[f+g]||b!==e[d+g]){l=!0;break}}}if(l){if(o!==a){t[a]=t[o];let u=o*n,f=a*n;for(let d=0;d!==n;++d)e[f+d]=e[u+d]}++a}}if(r>0){t[a]=t[r];for(let o=r*n,l=a*n,c=0;c!==n;++c)e[l+c]=e[o+c];++a}return a!==t.length?(this.times=t.slice(0,a),this.values=e.slice(0,a*n)):(this.times=t,this.values=e),this}clone(){let t=this.times.slice(),e=this.values.slice(),n=this.constructor,s=new n(this.name,t,e);return s.createInterpolant=this.createInterpolant,s}};bi.prototype.TimeBufferType=Float32Array;bi.prototype.ValueBufferType=Float32Array;bi.prototype.DefaultInterpolation=Jl;var vr=class extends bi{};vr.prototype.ValueTypeName="bool";vr.prototype.ValueBufferType=Array;vr.prototype.DefaultInterpolation=Zl;vr.prototype.InterpolantFactoryMethodLinear=void 0;vr.prototype.InterpolantFactoryMethodSmooth=void 0;var yd=class extends bi{};yd.prototype.ValueTypeName="color";var _d=class extends bi{};_d.prototype.ValueTypeName="number";var vd=class extends Mo{constructor(t,e,n,s){super(t,e,n,s)}interpolate_(t,e,n,s){let r=this.resultBuffer,a=this.sampleValues,o=this.valueSize,l=(n-e)/(s-e),c=t*o;for(let h=c+o;c!==h;c+=4)Ds.slerpFlat(r,0,a,c-o,a,c,l);return r}},Sa=class extends bi{InterpolantFactoryMethodLinear(t){return new vd(this.times,this.values,this.getValueSize(),t)}};Sa.prototype.ValueTypeName="quaternion";Sa.prototype.DefaultInterpolation=Jl;Sa.prototype.InterpolantFactoryMethodSmooth=void 0;var xr=class extends bi{};xr.prototype.ValueTypeName="string";xr.prototype.ValueBufferType=Array;xr.prototype.DefaultInterpolation=Zl;xr.prototype.InterpolantFactoryMethodLinear=void 0;xr.prototype.InterpolantFactoryMethodSmooth=void 0;var xd=class extends bi{};xd.prototype.ValueTypeName="vector";var wd=class{constructor(t,e,n){let s=this,r=!1,a=0,o=0,l,c=[];this.onStart=void 0,this.onLoad=t,this.onProgress=e,this.onError=n,this.itemStart=function(h){o++,r===!1&&s.onStart!==void 0&&s.onStart(h,a,o),r=!0},this.itemEnd=function(h){a++,s.onProgress!==void 0&&s.onProgress(h,a,o),a===o&&(r=!1,s.onLoad!==void 0&&s.onLoad())},this.itemError=function(h){s.onError!==void 0&&s.onError(h)},this.resolveURL=function(h){return l?l(h):h},this.setURLModifier=function(h){return l=h,this},this.addHandler=function(h,u){return c.push(h,u),this},this.removeHandler=function(h){let u=c.indexOf(h);return u!==-1&&c.splice(u,2),this},this.getHandler=function(h){for(let u=0,f=c.length;u<f;u+=2){let d=c[u],g=c[u+1];if(d.global&&(d.lastIndex=0),d.test(h))return g}return null}}},wS=new wd,Md=class{constructor(t){this.manager=t!==void 0?t:wS,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(t,e){let n=this;return new Promise(function(s,r){n.load(t,s,e,r)})}parse(){}setCrossOrigin(t){return this.crossOrigin=t,this}setWithCredentials(t){return this.withCredentials=t,this}setPath(t){return this.path=t,this}setResourcePath(t){return this.resourcePath=t,this}setRequestHeader(t){return this.requestHeader=t,this}};Md.DEFAULT_MATERIAL_NAME="__DEFAULT";var kd="\\[\\]\\.:\\/",MS=new RegExp("["+kd+"]","g"),Rd="[^"+kd+"]",SS="[^"+kd.replace("\\.","")+"]",AS=/((?:WC+[\/:])*)/.source.replace("WC",Rd),ES=/(WCOD+)?/.source.replace("WCOD",SS),TS=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",Rd),CS=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",Rd),kS=new RegExp("^"+AS+ES+TS+CS+"$"),RS=["material","materials","bones","map"],Sd=class{constructor(t,e,n){let s=n||Ae.parseTrackName(e);this._targetGroup=t,this._bindings=t.subscribe_(e,s)}getValue(t,e){this.bind();let n=this._targetGroup.nCachedObjects_,s=this._bindings[n];s!==void 0&&s.getValue(t,e)}setValue(t,e){let n=this._bindings;for(let s=this._targetGroup.nCachedObjects_,r=n.length;s!==r;++s)n[s].setValue(t,e)}bind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].bind()}unbind(){let t=this._bindings;for(let e=this._targetGroup.nCachedObjects_,n=t.length;e!==n;++e)t[e].unbind()}},Ae=class i{constructor(t,e,n){this.path=e,this.parsedPath=n||i.parseTrackName(e),this.node=i.findNode(t,this.parsedPath.nodeName),this.rootNode=t,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(t,e,n){return t&&t.isAnimationObjectGroup?new i.Composite(t,e,n):new i(t,e,n)}static sanitizeNodeName(t){return t.replace(/\s/g,"_").replace(MS,"")}static parseTrackName(t){let e=kS.exec(t);if(e===null)throw new Error("PropertyBinding: Cannot parse trackName: "+t);let n={nodeName:e[2],objectName:e[3],objectIndex:e[4],propertyName:e[5],propertyIndex:e[6]},s=n.nodeName&&n.nodeName.lastIndexOf(".");if(s!==void 0&&s!==-1){let r=n.nodeName.substring(s+1);RS.indexOf(r)!==-1&&(n.nodeName=n.nodeName.substring(0,s),n.objectName=r)}if(n.propertyName===null||n.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+t);return n}static findNode(t,e){if(e===void 0||e===""||e==="."||e===-1||e===t.name||e===t.uuid)return t;if(t.skeleton){let n=t.skeleton.getBoneByName(e);if(n!==void 0)return n}if(t.children){let n=function(r){for(let a=0;a<r.length;a++){let o=r[a];if(o.name===e||o.uuid===e)return o;let l=n(o.children);if(l)return l}return null},s=n(t.children);if(s)return s}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(t,e){t[e]=this.targetObject[this.propertyName]}_getValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)t[e++]=n[s]}_getValue_arrayElement(t,e){t[e]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(t,e){this.resolvedProperty.toArray(t,e)}_setValue_direct(t,e){this.targetObject[this.propertyName]=t[e]}_setValue_direct_setNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(t,e){this.targetObject[this.propertyName]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++]}_setValue_array_setNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(t,e){let n=this.resolvedProperty;for(let s=0,r=n.length;s!==r;++s)n[s]=t[e++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(t,e){this.resolvedProperty[this.propertyIndex]=t[e]}_setValue_arrayElement_setNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty[this.propertyIndex]=t[e],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(t,e){this.resolvedProperty.fromArray(t,e)}_setValue_fromArray_setNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(t,e){this.resolvedProperty.fromArray(t,e),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(t,e){this.bind(),this.getValue(t,e)}_setValue_unbound(t,e){this.bind(),this.setValue(t,e)}bind(){let t=this.node,e=this.parsedPath,n=e.objectName,s=e.propertyName,r=e.propertyIndex;if(t||(t=i.findNode(this.rootNode,e.nodeName),this.node=t),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!t){console.warn("THREE.PropertyBinding: No target node found for track: "+this.path+".");return}if(n){let c=e.objectIndex;switch(n){case"materials":if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}t=t.material.materials;break;case"bones":if(!t.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}t=t.skeleton.bones;for(let h=0;h<t.length;h++)if(t[h].name===c){c=h;break}break;case"map":if("map"in t){t=t.map;break}if(!t.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!t.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}t=t.material.map;break;default:if(t[n]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}t=t[n]}if(c!==void 0){if(t[c]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,t);return}t=t[c]}}let a=t[s];if(a===void 0){let c=e.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+c+"."+s+" but it wasn't found.",t);return}let o=this.Versioning.None;this.targetObject=t,t.needsUpdate!==void 0?o=this.Versioning.NeedsUpdate:t.matrixWorldNeedsUpdate!==void 0&&(o=this.Versioning.MatrixWorldNeedsUpdate);let l=this.BindingType.Direct;if(r!==void 0){if(s==="morphTargetInfluences"){if(!t.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!t.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}t.morphTargetDictionary[r]!==void 0&&(r=t.morphTargetDictionary[r])}l=this.BindingType.ArrayElement,this.resolvedProperty=a,this.propertyIndex=r}else a.fromArray!==void 0&&a.toArray!==void 0?(l=this.BindingType.HasFromToArray,this.resolvedProperty=a):Array.isArray(a)?(l=this.BindingType.EntireArray,this.resolvedProperty=a):this.propertyName=s;this.getValue=this.GetterByBindingType[l],this.setValue=this.SetterByBindingTypeAndVersioning[l][o]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}};Ae.Composite=Sd;Ae.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};Ae.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};Ae.prototype.GetterByBindingType=[Ae.prototype._getValue_direct,Ae.prototype._getValue_array,Ae.prototype._getValue_arrayElement,Ae.prototype._getValue_toArray];Ae.prototype.SetterByBindingTypeAndVersioning=[[Ae.prototype._setValue_direct,Ae.prototype._setValue_direct_setNeedsUpdate,Ae.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_array,Ae.prototype._setValue_array_setNeedsUpdate,Ae.prototype._setValue_array_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_arrayElement,Ae.prototype._setValue_arrayElement_setNeedsUpdate,Ae.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[Ae.prototype._setValue_fromArray,Ae.prototype._setValue_fromArray_setNeedsUpdate,Ae.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];var qT=new Float32Array(1);typeof __THREE_DEVTOOLS__!="undefined"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Ad}}));typeof window!="undefined"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Ad);var Tn=512,Oe=16,xc=Tn/Oe,Ao=xc*xc,tg=new WeakMap;function Us(i){return[i%xc*Oe,Math.floor(i/xc)*Oe]}function ng(i){let t=_s.length;t>Ao&&console.warn(`[atlas] ${t} textures do not fit in ${Ao} tiles`);let e=[],n=new Uint8Array(Tn*Tn*4);for(let a=0;a<t&&a<Ao;a++){let o;try{o=di(_s[a])}catch(h){console.warn("[atlas] texture failed",_s[a],h),o=eg()}o.length!==Oe*Oe*4&&(o=eg()),e.push(o);let[l,c]=Us(a);for(let h=0;h<Oe;h++)n.set(o.subarray(h*Oe*4,(h+1)*Oe*4),((c+h)*Tn+l)*4)}let s=new gc(n,Tn,Tn,An,ii);s.name="atlas",s.magFilter=ke,s.wrapS=on,s.wrapT=on,s.flipY=!1,s.generateMipmaps=!1,s.unpackAlignment=4;let r={texture:s,tiles:e};return Ld(r,i),r}function Ld(i,t){let e=i.texture,n=t?fr:ke;if(!(e.minFilter===n&&(t?e.mipmaps.length>0:e.mipmaps.length===0)&&e.version>0)){if(t){let s=tg.get(i);s||(s=LS(e.image.data),tg.set(i,s)),e.mipmaps=s}else e.mipmaps=[];e.minFilter=n,e.needsUpdate=!0}}function LS(i){let t=[{data:i,width:Tn,height:Tn}],e=new Float32Array(Ao);for(let s=0;s<Ao;s++){if(oa[s]!==1)continue;let[r,a]=Us(s),o=0;for(let l=0;l<Oe;l++)for(let c=0;c<Oe;c++)i[((a+l)*Tn+r+c)*4+3]>=128&&o++;e[s]=o/(Oe*Oe)}let n=new Float32Array(Oe*Oe);for(let s=1;s<=4;s++){let r=Tn>>s,a=Oe>>s,o=1<<s,l=o*o,c=new Uint8Array(r*r*4);for(let h=0;h<Ao;h++){let u=oa[h],[f,d]=Us(h),g=f>>s,b=d>>s,p=0;for(let m=0;m<a;m++)for(let _=0;_<a;_++){let y=0,v=0,w=0,S=0,A=0,L=0,P=0,M=f+_*o,T=d+m*o;for(let k=0;k<o;k++){let U=((T+k)*Tn+M)*4;for(let N=0;N<o;N++,U+=4){let D=i[U+3];y+=i[U],v+=i[U+1],w+=i[U+2],S+=D,A+=i[U]*D,L+=i[U+1]*D,P+=i[U+2]*D}}let I=((b+m)*r+g+_)*4;u===1&&S>0?(c[I]=Math.round(A/S),c[I+1]=Math.round(L/S),c[I+2]=Math.round(P/S)):(c[I]=Math.round(y/l),c[I+1]=Math.round(v/l),c[I+2]=Math.round(w/l));let F=S/l;u===1?n[p++]=F:c[I+3]=Math.round(F)}if(u===1){let m=PS(n,p,e[h]),_=0;for(let y=0;y<a;y++)for(let v=0;v<a;v++){let w=((b+y)*r+g+v)*4;c[w+3]=Math.min(255,Math.round(n[_++]*m))}}}t.push({data:c,width:r,height:r})}for(let s=5;Tn>>s>=1;s++){let r=t[s-1],a=Tn>>s,o=new Uint8Array(a*a*4);for(let l=0;l<a;l++)for(let c=0;c<a;c++)for(let h=0;h<4;h++){let u=r.data,f=r.width,d=u[(2*l*f+2*c)*4+h]+u[(2*l*f+2*c+1)*4+h]+u[((2*l+1)*f+2*c)*4+h]+u[((2*l+1)*f+2*c+1)*4+h];o[(l*a+c)*4+h]=d+2>>2}t.push({data:o,width:a,height:a})}return t}function PS(i,t,e){if(t===0)return 1;let n=c=>{let h=0;for(let u=0;u<t;u++)i[u]*c>=127.5&&h++;return h/t};if(e<=0)return 1;let s=.25,r=64;if(n(r)<e)return r;for(let c=0;c<24;c++){let h=Math.sqrt(s*r);n(h)>=e?r=h:s=h}let a=n(r),o=n(s),l=Math.abs(o-e)<Math.abs(a-e)?s:r;return Math.max(1,l)}function eg(){let i=new Uint8ClampedArray(Oe*Oe*4);for(let t=0;t<Oe;t++)for(let e=0;e<Oe;e++){let n=(e>>3^t>>3)&1,s=(t*Oe+e)*4;i[s]=n?248:0,i[s+1]=0,i[s+2]=n?248:0,i[s+3]=255}return i}var IS=`#define HP highp
`,DS=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
`,wr=`
uniform HP vec3 uSkyTop;
uniform HP vec3 uSkyHorizon;
uniform HP vec3 uGlowColor;
uniform HP vec3 uGlowDir;
uniform HP float uGlow;
`,Mr=`
vec3 skyColor(vec3 d) {
  float up = clamp(d.y, 0.0, 1.0);
  float k = 1.0 - up;
  vec3 c = mix(uSkyTop, uSkyHorizon, k * k * k);
  if (uGlow > 0.001) {
    vec2 hd = d.xz / max(length(d.xz), 0.0001);
    float f = dot(hd, uGlowDir.xz) * 0.5 + 0.5;
    float g = uGlow * f * f * f * exp(-abs(d.y) * 3.2);
    c = mix(c, uGlowColor, clamp(g, 0.0, 1.0));
  }
  return c;
}
`,US=`
vec4 packDepth(highp float v) {
  highp vec4 r = vec4(fract(v * vec3(16777216.0, 65536.0, 256.0)), v);
  r.yzw -= r.xyz * (1.0 / 256.0);
  return r * (256.0 / 255.0);
}
`,Eo=`
float lightCurve(float l) { return l / (4.0 - 3.0 * l); }
// sum of sky and block light -> final multiplier: ambient floor, then the brightness
// option as a gamma lift (0 = moody, 1 = bright), like the original game's lightmap.
vec3 finishLight(vec3 c) {
  c = clamp(c, 0.0, 1.0) * 0.95 + 0.05;
  vec3 ic = 1.0 - c;
  ic *= ic; ic *= ic;
  return mix(c, 1.0 - ic, uBrightness);
}
`,NS=`
attribute vec2 auv;
attribute vec4 atint;
attribute vec4 alight;

uniform float uTime;
uniform float uAtlasSize;
uniform vec3 uCamWrap;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uFogColor;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
${wr}
#ifdef USE_SHADOWS
uniform mat4 uShadowMatrix;
uniform vec3 uLightDir;
varying HP vec4 vShadow;
varying vec3 vSky;
varying vec3 vBlock;
#endif
#ifdef HAND
uniform vec2 uHandLight;
#endif

varying HP vec2 vUv;
varying vec3 vColor;
varying vec4 vFog;
#ifdef LAYER_OPAQUE
varying vec3 vTint;
#endif
#if defined(LAYER_WATER) || defined(LAYER_LAVA)
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
varying vec3 vTintW;
varying float vSkyVis;
#endif

${Mr}
${Eo}

void main() {
  float flags = floor(alight.w * 255.0 + 0.5);
  float face = mod(flags, 8.0);
  float axis = floor(face * 0.5);
  float sgn = 1.0 - 2.0 * mod(face, 2.0);
  vec3 n = vec3(equal(vec3(axis), vec3(0.0, 1.0, 2.0))) * sgn; // zero for face 6 (no normal)

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
#ifdef HAND
  vec3 rel = vec3(0.0);
#else
  // World-space offset from the camera (precise: modelViewMatrix is built in doubles on the CPU)
  vec3 rel = mv.xyz * mat3(viewMatrix);
  // World position wrapped every 1024 blocks, for animation patterns
  vec3 wpat = uCamWrap + rel;
#ifdef WAVING
  float wave = mod(floor(flags / 8.0), 4.0);
  if (wave > 0.5) {
    float t = uTime;
    vec3 d = vec3(0.0);
    if (wave < 1.5) {
      // plants: only the top vertices sway, with slow gusts
      float top = step(31.5, flags);
      float gust = 0.6 + 0.4 * sin(t * 0.63 + wpat.x * 0.071 + wpat.z * 0.053);
      d.x = (sin(t * 1.93 + wpat.x * 0.73 + wpat.z * 0.41) + 0.4 * sin(t * 3.71 + wpat.z * 1.37)) * 0.07 * gust * top;
      d.z = (sin(t * 1.61 + wpat.z * 0.67 - wpat.x * 0.29) + 0.4 * sin(t * 3.13 + wpat.x * 1.19)) * 0.055 * gust * top;
    } else if (wave < 2.5) {
      // leaves: small wobble; neighbours share corners so the canopy never cracks
      d.x = sin(t * 1.7 + wpat.x * 0.9 + wpat.y * 0.6 + wpat.z * 0.3) * 0.026;
      d.y = sin(t * 2.3 + wpat.z * 0.8 + wpat.x * 0.4 + wpat.y * 0.5) * 0.016;
      d.z = sin(t * 1.9 + wpat.y * 0.7 + wpat.z * 0.9 - wpat.x * 0.3) * 0.026;
    } else {
      // liquid surface: gentle swell, only ever downwards so it stays below the side faces
      float s = sin(t * 1.4 + wpat.x * 0.55 + wpat.z * 0.31) + sin(t * 1.9 - wpat.z * 0.47 + wpat.x * 0.23);
      d.y = -(0.5 + 0.25 * s) * 0.05;
    }
    rel += d;
    wpat += d;
    mv.xyz += mat3(viewMatrix) * d;
  }
#endif
#endif
  gl_Position = projectionMatrix * mv;
  vUv = auv / uAtlasSize;

#ifndef DEPTH
#ifdef HAND
  vec2 lv = uHandLight;
#else
  vec2 lv = alight.xy;
#endif
  float shade = alight.z;
  float sb = lightCurve(lv.x);
  float bb = lightCurve(lv.y);
  vec3 skyL = sb * uSkyLightColor;
  vec3 blkL = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
  float masked = step(0.5, atint.a);
#ifdef LAYER_OPAQUE
  vTint = mix(vec3(1.0), atint.rgb, masked);          // masked tint: applied per texel in the FS
  vec3 faceTint = mix(atint.rgb, vec3(1.0), masked);
#else
  vec3 faceTint = atint.rgb;
#endif
#if defined(LAYER_WATER)
  faceTint = vec3(1.0);
  vTintW = atint.rgb;
  vSkyVis = lv.x * lv.x;
#endif
#if defined(LAYER_LAVA) || defined(FULLBRIGHT)
  vColor = faceTint * mix(1.0, shade, 0.25);
#elif defined(USE_SHADOWS)
  vSky = skyL;
  vBlock = blkL;
  vColor = faceTint * shade;
#else
  vColor = finishLight(skyL + blkL) * shade * faceTint;
#endif

#ifdef HAND
  vFog = vec4(0.0);
#else
  float dist = max(length(rel.xz), abs(rel.y));
  float fog = clamp((dist - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0);
  vFog = vec4(fog > 0.0 ? skyColor(rel / max(length(rel), 0.0001)) : uFogColor, fog);
#endif

#ifdef USE_SHADOWS
  float noNormal = step(5.5, face);
  float ndl = mix(dot(n, uLightDir), 1.0, noNormal);
  vec3 off = mix(n, uLightDir, noNormal);
  vShadow.xyz = (uShadowMatrix * vec4(rel + off * 0.05, 1.0)).xyz;
  // faces turned away from the light are in their own shadow (smoothly, to hide acne at grazing angles)
  vShadow.w = clamp(ndl * 5.0 + 0.5, 0.0, 1.0);
#endif

#if (defined(LAYER_WATER) || defined(LAYER_LAVA)) && !defined(HAND)
  vec3 an = abs(n);
  vFace = an.y > 0.5 ? wpat.xz : (an.x > 0.5 ? wpat.zy : wpat.xy);
  vRel = rel;
  vNormal = n;
#endif
#endif
}
`,BS=`
#ifdef USE_SHADOWS
uniform sampler2D uShadowMap;
uniform float uShadowTexel;
uniform float uShadowStrength;
uniform float uShadowBias;
varying HP vec4 vShadow;
varying vec3 vSky;
varying vec3 vBlock;
HP float unpackDepth(HP vec4 v) {
  return dot(v, vec4(255.0 / 256.0 / 16777216.0, 255.0 / 256.0 / 65536.0, 255.0 / 256.0 / 256.0, 255.0 / 256.0));
}
float shadowTap(HP vec2 uv, HP float z) { return step(z, unpackDepth(texture2D(uShadowMap, uv))); }
float shadowLit() {
  HP vec3 sp = vShadow.xyz;
  if (sp.x <= 0.0 || sp.x >= 1.0 || sp.y <= 0.0 || sp.y >= 1.0 || sp.z >= 1.0) return 1.0;
  HP float z = sp.z - uShadowBias;
  HP vec2 tc = sp.xy / uShadowTexel - 0.5;
  HP vec2 f = fract(tc);
  HP vec2 b = (floor(tc) + 0.5) * uShadowTexel;
  float a0 = shadowTap(b, z);
  float a1 = shadowTap(b + vec2(uShadowTexel, 0.0), z);
  float a2 = shadowTap(b + vec2(0.0, uShadowTexel), z);
  float a3 = shadowTap(b + vec2(uShadowTexel, uShadowTexel), z);
  float s = mix(mix(a0, a1, f.x), mix(a2, a3, f.x), f.y);
  HP vec2 e = abs(sp.xy - 0.5) * 2.0;
  return mix(s, 1.0, smoothstep(0.8, 1.0, max(e.x, e.y)));
}
// sky light dimmed where the sun (or moon) is blocked; block light untouched
vec3 shadowedLight() {
  float lit = vShadow.w > 0.0 ? shadowLit() * vShadow.w : 0.0;
  return finishLight(vSky * mix(1.0 - uShadowStrength, 1.0, lit) + vBlock);
}
#endif
`,Pd=`
precision mediump float;
uniform sampler2D uAtlas;
uniform HP float uBrightness;
varying HP vec2 vUv;
varying vec3 vColor;
varying vec4 vFog;
${Eo}
${BS}
`,wc=`
${Pd}
#ifdef LAYER_OPAQUE
varying vec3 vTint;
#endif
void main() {
  vec4 tex = texture2D(uAtlas, vUv);
#if defined(LAYER_CUTOUT)
  if (tex.a < 0.5) discard;
#endif
  vec3 c = tex.rgb;
#ifdef LAYER_OPAQUE
  c *= mix(vTint, vec3(1.0), tex.a);
#endif
#if defined(USE_SHADOWS) && !defined(FULLBRIGHT)
  c *= vColor * shadowedLight();
#else
  c *= vColor;
#endif
#ifdef LAYER_TRANSLUCENT
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), tex.a);
#else
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
#endif
}
`,FS=`
${Pd}
uniform HP float uAtlasSize;
uniform HP float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform HP vec3 uFogColor;
uniform vec2 uWaterTile;
uniform float uUnderwater;
${wr}
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
varying vec3 vTintW;
varying float vSkyVis;
${Mr}
void main() {
  HP float t = uTime;
  float isTop = step(0.5, abs(vNormal.y));
  // one ripple value per texture pixel (16 per block)
  HP vec2 cell = floor(vFace * 16.0);
  cell.y += (1.0 - isTop) * floor(t * 12.0);   // falling pattern on the sides
  HP vec2 q = cell + 0.5;
  HP float a1 = dot(q, vec2(0.37, 0.21)) + t * 1.9;
  HP float a2 = dot(q, vec2(-0.17, 0.33)) + t * 1.4;
  HP float a3 = dot(q, vec2(0.29, -0.41)) - t * 2.3;
  HP float a4 = dot(q, vec2(0.61, 0.53)) + t * 3.1;
  float h = sin(a1) * 0.45 + sin(a2) * 0.35 + sin(a3) * 0.3 + sin(a4) * 0.12;
  vec2 g = cos(a1) * 0.45 * vec2(0.37, 0.21) + cos(a2) * 0.35 * vec2(-0.17, 0.33)
         + cos(a3) * 0.3 * vec2(0.29, -0.41) + cos(a4) * 0.12 * vec2(0.61, 0.53);
  HP float dist = length(vRel);
  float detail = 1.0 - smoothstep(20.0, 72.0, dist);   // calm far water: no sparkle aliasing
  g *= detail;

  // animated texture pixel (whole-pixel scrolling, like the classic animated water)
  HP vec2 tp = mod(cell + vec2(floor(t * 1.5), floor(t * 2.5)), 16.0);
  // (bias: the quantised uv has huge derivatives at pixel edges, keep the full-size level)
  float tx = mix(0.75, texture2D(uAtlas, (uWaterTile + tp + 0.5) / uAtlasSize, -16.0).r, detail);

  vec3 N;
  if (isTop > 0.5) {
    N = normalize(vec3(-g.x * 1.4, 1.0, -g.y * 1.4)) * sign(vNormal.y);
  } else {
    vec3 tang = vec3(abs(vNormal.z), 0.0, abs(vNormal.x));
    N = normalize(vNormal + tang * g.x * 0.6);
  }
  vec3 V = -vRel / max(dist, 0.0001);
  if (!gl_FrontFacing) N = -N;
  float cosT = clamp(dot(N, V), 0.0, 1.0);
  float ic = 1.0 - cosT;
  float ic2 = ic * ic;
  float fres = 0.02 + 0.98 * ic2 * ic2 * ic;

#ifdef USE_SHADOWS
  float lit = vShadow.w > 0.0 ? shadowLit() * vShadow.w : 0.0;
  vec3 light = vColor * finishLight(vSky * mix(1.0 - uShadowStrength, 1.0, lit) + vBlock);
#else
  float lit = 1.0;
  vec3 light = vColor;
#endif

  vec3 R = reflect(-V, N);
  vec3 refl = skyColor(normalize(vec3(R.x, abs(R.y) + 0.02, R.z))) * vSkyVis;
  vec3 body = vTintW * light * (0.5 + 0.55 * tx + 0.07 * h * detail);
  // deeper-looking water at grazing angles (longer path through the water)
  float absorb = 1.0 - exp(-2.2 / max(cosT, 0.06));
  float alpha = mix(0.48, 0.9, absorb);
  vec3 col = mix(body, refl, fres * 0.8);
  alpha = max(alpha, fres * 0.95);

  // sun glints: tight pixel sparkles plus a soft sheen, suppressed in shade and caves
  float sd = max(dot(R, uSunDir), 0.0);
  float sd2 = sd * sd; float sd4 = sd2 * sd2; float sd8 = sd4 * sd4; float sd16 = sd8 * sd8;
  float sd64 = sd16 * sd16; sd64 *= sd64;
  float spark = sd64 * sd64 * sd16 * (0.6 + 0.4 * h) * detail;   // ~ pow(sd, 144)
  vec3 spec = uSunColor * (spark * 2.5 + sd16 * 0.12) * vSkyVis * lit;
  col += spec;
  alpha = min(1.0, alpha + dot(spec, vec3(0.333)));

  if (!gl_FrontFacing && uUnderwater > 0.5) {
    // looking up from below: Snell's window to the sky, total internal reflection outside it
    float win = smoothstep(0.6, 0.76, cosT) * vSkyVis;
    col = mix(uFogColor * 1.15, mix(uSkyTop, uSkyHorizon, 0.4) * 0.9 + body * 0.25, win);
    alpha = mix(0.92, 0.55, win);
  }
  col = mix(col, vFog.rgb, vFog.a);
  alpha = mix(alpha, 1.0, vFog.a);
  gl_FragColor = vec4(col, alpha);
}
`,OS=`
${Pd}
uniform HP float uAtlasSize;
uniform HP float uTime;
uniform vec2 uLavaTile;
varying HP vec2 vFace;
varying HP vec3 vRel;
varying vec3 vNormal;
void main() {
  HP float t = uTime;
  float side = 1.0 - step(0.5, abs(vNormal.y));
  HP vec2 cell = floor(vFace * 16.0);
  cell.y += side * floor(t * 4.0);              // flowing lava creeps down the sides
  HP vec2 w = cell * 0.19;
  float n1 = sin(w.x + t * 0.55 + 1.7 * sin(w.y * 0.83 + t * 0.31));
  float n2 = sin(w.y * 1.13 - t * 0.47 + 1.9 * sin(w.x * 0.71 - t * 0.37));
  float heat = 0.5 + 0.25 * (n1 + n2);
  // churn: texture pixels displaced by whole pixels along a slowly turning field
  HP vec2 tp = mod(cell + floor(vec2(n2, n1) * 1.6 + 0.5) + vec2(floor(t * 0.7), floor(t * 0.45)), 16.0);
  vec3 tex = texture2D(uAtlas, (uLavaTile + tp + 0.5) / uAtlasSize, -16.0).rgb;
  float h2 = heat * heat; float h4 = h2 * h2;
  vec3 c = tex * (0.78 + 0.5 * heat) + vec3(0.42, 0.16, 0.0) * h4 * h2;
  // far away: the plain (mipmapped) tile, so distant lava lakes do not shimmer
  float far = smoothstep(28.0, 72.0, length(vRel));
  c = mix(c, texture2D(uAtlas, vUv).rgb * 1.05, far);
  c *= vColor;
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
}
`,ig=`
uniform sampler2D uAtlas;
varying HP vec2 vUv;
${US}
void main() {
#ifdef LAYER_CUTOUT
  if (texture2D(uAtlas, vUv).a < 0.5) discard;
#endif
  gl_FragColor = packDepth(gl_FragCoord.z);
}
`;function zS(i){let[t,e]=Us(Jh.water_still),[n,s]=Us(Jh.lava_still);return{uTime:{value:0},uAtlas:{value:i.texture},uAtlasSize:{value:Tn},uSunDir:{value:new V(0,1,0)},uLightDir:{value:new V(0,1,0)},uDaylight:{value:1},uFogColor:{value:new Nt(.75,.85,1)},uFogNear:{value:40},uFogFar:{value:64},uSkyTop:{value:new Nt(.47,.65,1)},uSkyHorizon:{value:new Nt(.75,.85,1)},uGlowColor:{value:new Nt(1,.5,.2)},uGlowDir:{value:new V(1,0,0)},uGlow:{value:0},uBrightness:{value:.5},uBlockLightColor:{value:new Nt(1,1,1)},uSkyLightColor:{value:new Nt(1,1,1)},uSunColor:{value:new Nt(1,.95,.8)},uWaving:{value:0},uUnderwater:{value:0},uCamWrap:{value:new V},uShadowMap:{value:null},uShadowMatrix:{value:new ve},uShadowTexel:{value:1/2048},uShadowStrength:{value:0},uShadowBias:{value:2e-4},uWaterTile:{value:new qt(t,e)},uLavaTile:{value:new qt(n,s)}}}function Ns(i,t,e,n,s={}){let r=new Ee({name:i,uniforms:n,vertexShader:IS+NS,fragmentShader:DS+e,defines:{[t]:1,...s}});return r.side=fn,r.fog=!1,r.lights=!1,r}function sg(i,t,e){let n=t in i.defines;e!==n&&(e?i.defines[t]=1:delete i.defines[t],i.needsUpdate=!0)}function rg(i){let t=zS(i),e=Ns("terrain-opaque","LAYER_OPAQUE",wc,t),n=Ns("terrain-cutout","LAYER_CUTOUT",wc,t),s=Ns("terrain-translucent","LAYER_TRANSLUCENT",wc,t);s.transparent=!0,s.depthWrite=!1,s.blending=is;let r=Ns("terrain-water","LAYER_WATER",FS,t);r.transparent=!0,r.depthWrite=!0,r.side=je,r.blending=is;let a=Ns("terrain-lava","LAYER_LAVA",OS,t),o=Ns("depth-opaque","LAYER_OPAQUE",ig,t,{DEPTH:1}),l=Ns("depth-cutout","LAYER_CUTOUT",ig,t,{DEPTH:1});o.side=je,l.side=je;let c=[e,n,s,r,a,o,l];return{opaque:e,cutout:n,translucent:s,water:r,lava:a,uniforms:t,byLayer:[e,n,s,r,a],depth:{opaque:o,cutout:l},setShadows(h){for(let u of[e,n,s,r])sg(u,"USE_SHADOWS",h);h||(t.uShadowStrength.value=0)},setWaving(h){t.uWaving.value=h?1:0;for(let u of c)sg(u,"WAVING",h)},dispose(){for(let h of c)h.dispose()}}}function og(i){let t={value:new qt(1,0)},e={...i,uHandLight:t},n=(h,u,f={})=>Ns(h,u,wc,e,{HAND:1,...f}),s=n("hand-opaque","LAYER_OPAQUE"),r=n("hand-cutout","LAYER_CUTOUT");r.side=je;let a=n("hand-translucent","LAYER_TRANSLUCENT");a.transparent=!0,a.depthWrite=!1;let o=n("hand-water","LAYER_TRANSLUCENT");o.transparent=!0,o.depthWrite=!1;let l=n("hand-lava","LAYER_CUTOUT",{FULLBRIGHT:1}),c=[s,r,a,o,l];return{byLayer:c,light:t,dispose(){for(let h of c)h.dispose()}}}var HS=new Ui(new V(2048,2048,2048),3547);function Mc(i,t=HS){let e=new Re;return e.setAttribute("position",new Vt(i.positions,3)),e.setAttribute("auv",new Vt(i.uvs,2)),e.setAttribute("atint",new Vt(i.tints,4,!0)),e.setAttribute("alight",new Vt(i.lights,4,!0)),e.setIndex(new Vt(i.indices,1)),e.setDrawRange(0,i.indexCount),t?e.boundingSphere=t.clone():e.computeBoundingSphere(),e}var Ec=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
`,GS=192,WS=4,Sr=12,Id=128,VS=.6,Sc=.38,Bs=45,$S=`
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,XS=`
${Ec}
${wr}
uniform vec3 uSunDir;
uniform vec3 uHaze;
varying vec3 vDir;
${Mr}
void main() {
  vec3 d = normalize(vDir);
  vec3 c = skyColor(d);
  float s = max(dot(d, uSunDir), 0.0);
  float s2 = s * s; float s4 = s2 * s2; float s8 = s4 * s4;
  c += uHaze * (s8 * 0.6 + s8 * s8 * s8 * 0.8);
  // 1/255 dither: no banding in the dusk gradient
  float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  gl_FragColor = vec4(c + (n - 0.5) / 255.0, 1.0);
}
`,ag=`
varying vec2 vUv;
void main() {
  vUv = uv * 2.0 - 1.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,qS=`
${Ec}
uniform vec3 uTint;
uniform float uAlpha;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main() {
  vec2 a = abs(vUv);
  float m = max(a.x, a.y);
  vec2 px = floor((vUv * 0.5 + 0.5) * 32.0);
  float pm = max(abs(px.x - 15.5), abs(px.y - 15.5));  // square distance in pixels (0.5 .. 15.5)
  vec3 col = vec3(0.0);
  if (pm < 5.0) {
    col = vec3(1.0, 0.99, 0.9) - hash(px) * vec3(0.0, 0.03, 0.08);
  } else if (pm < 7.0) {
    col = vec3(1.0, 0.86, 0.42) + (hash(px) - 0.5) * vec3(0.0, 0.06, 0.1);
  } else {
    // stepped halo, one ring per two pixels, fading out
    float ring = floor((pm - 7.0) / 2.0);
    col = uTint * 0.42 * pow(0.62, ring) * (1.0 - smoothstep(0.75, 1.0, m));
  }
  gl_FragColor = vec4(col * uAlpha, 1.0);
}
`,YS=`
${Ec}
uniform float uAlpha;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main() {
  vec2 px = floor((vUv * 0.5 + 0.5) * 24.0);
  float pm = max(abs(px.x - 11.5), abs(px.y - 11.5));
  vec3 col = vec3(0.0);
  if (pm < 6.0) {
    vec2 q = px - 6.0;
    float mare = step(0.72, hash(floor(q / 2.0) + 3.0));
    float spot = step(0.86, hash(q + 17.0));
    col = vec3(0.86, 0.89, 0.96) * (1.0 - 0.28 * mare - 0.16 * spot);
    if (pm >= 5.0) col *= 0.9;
  } else if (pm < 9.0) {
    col = vec3(0.16, 0.19, 0.3) * (9.0 - pm) / 3.0;
  }
  gl_FragColor = vec4(col * uAlpha, 1.0);
}
`,KS=`
attribute float aSize;
attribute float aPhase;
uniform float uAlpha;
uniform float uTime;
uniform float uPixelRatio;
varying float vB;
void main() {
  vec3 dir = normalize(position);
  vec3 wd = normalize(mat3(modelMatrix) * position);
  // hidden behind the moon (which sits at local -X) and faded near the horizon
  float behindMoon = step(dir.x, -0.992);
  float tw = 0.78 + 0.22 * sin(uTime * (1.3 + aPhase) + aPhase * 40.0);
  vB = uAlpha * tw * smoothstep(-0.02, 0.22, wd.y) * (1.0 - behindMoon) * (0.55 + 0.45 * fract(aPhase * 7.31));
  gl_PointSize = aSize * uPixelRatio;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  if (vB <= 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}
`,ZS=`
${Ec}
varying float vB;
void main() { gl_FragColor = vec4(vec3(0.92, 0.94, 1.0) * vB, 1.0); }
`,JS=`
#define HP highp
attribute float aShade;
${wr}
uniform vec3 uFogColor;
uniform float uCloudFar;
uniform vec3 uCloudColor;
varying vec4 vC;
${Mr}
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec3 rel = mv.xyz * mat3(viewMatrix);
  float dist = length(rel.xz);
  float fog = smoothstep(uCloudFar * 0.45, uCloudFar, dist);
  vec3 sky = skyColor(rel / max(length(rel), 0.001));
  // a hint of the sky shows through (the clouds read as slightly translucent)
  vec3 c = mix(uCloudColor * aShade, sky, 0.12);
  vC = vec4(mix(c, sky, fog), 1.0);
  gl_Position = projectionMatrix * mv;
}
`,jS=`
precision mediump float;
varying vec4 vC;
void main() { gl_FragColor = vC; }
`;function lg(i){let t=new Re,e=new Float32Array([Bs,-i,-i,Bs,-i,i,Bs,i,i,Bs,i,-i]),n=new Float32Array([0,0,1,0,1,1,0,1]);return t.setAttribute("position",new Vt(e,3)),t.setAttribute("uv",new Vt(n,2)),t.setIndex([0,1,2,0,2,3]),t}function QS(i){let t=new Re,e=new Float32Array([-i,-i,-i,i,-i,-i,i,i,-i,-i,i,-i,-i,-i,i,i,-i,i,i,i,i,-i,i,i]);return t.setAttribute("position",new Vt(e,3)),t.setIndex([0,1,2,0,2,3,5,4,7,5,7,6,4,0,3,4,3,7,1,5,6,1,6,2,3,2,6,3,6,7,4,5,1,4,1,0]),t}function tA(i=1337){let t=Id,e=i>>>0,n=()=>{e=e+1831565813>>>0;let o=e;return o=Math.imul(o^o>>>15,o|1),o^=o+Math.imul(o^o>>>7,o|61),((o^o>>>14)>>>0)/4294967296},s=new Float32Array(t*t);for(let[o,l]of[[8,.55],[16,.3],[32,.15]]){let c=new Float32Array(o*o);for(let u=0;u<c.length;u++)c[u]=n();let h=t/o;for(let u=0;u<t;u++)for(let f=0;f<t;f++){let d=f/h,g=u/h,b=Math.floor(d),p=Math.floor(g),m=d-b,_=g-p,y=m*m*(3-2*m),v=_*_*(3-2*_),w=b%o,S=(b+1)%o,A=p%o,L=(p+1)%o,P=c[A*o+w]+(c[A*o+S]-c[A*o+w])*y,M=c[L*o+w]+(c[L*o+S]-c[L*o+w])*y;s[u*t+f]+=(P+(M-P)*v)*l}}let r=new Uint8Array(t*t);for(let o=0;o<t*t;o++)r[o]=s[o]>.56?1:0;let a=r.slice();for(let o=0;o<t;o++)for(let l=0;l<t;l++){let c=o*t+l;if(!r[c])continue;r[o*t+(l+1)%t]+r[o*t+(l+t-1)%t]+r[(o+1)%t*t+l]+r[(o+t-1)%t*t+l]===0&&(a[c]=0)}return a}var Ea=(i,t,e)=>{let n=Math.min(1,Math.max(0,(e-i)/(t-i)));return n*n*(3-2*n)},fe=(i,t,e)=>i+(t-i)*e,Ac=class{constructor(t,e){this.group=new En;this.celestial=new En;this.cloudMap=tA();this.cloudKey="";this.cloudRadius=192;this.cloudsOn=!0;this.hidden=!1;this.fog=new Nt;this.axis=new V(0,-Math.sin(Sc),Math.cos(Sc));this.u=e,this.group.name="sky",t.add(this.group),this.hazeU={value:new Nt(0,0,0)};let n=new Ee({name:"sky-dome",uniforms:{...e,uHaze:this.hazeU},vertexShader:$S,fragmentShader:XS,side:je,depthTest:!1,depthWrite:!1,blending:Di});this.dome=new _e(QS(Bs+5),n),this.dome.renderOrder=-100,this.dome.frustumCulled=!1,this.group.add(this.dome),this.sunU={uTint:{value:new Nt(1,.8,.4)},uAlpha:{value:1}},this.sun=new _e(lg(9),new Ee({name:"sky-sun",uniforms:this.sunU,vertexShader:ag,fragmentShader:qS,side:fn,depthTest:!1,depthWrite:!1,blending:go})),this.moonU={uAlpha:{value:1}},this.moon=new _e(lg(5.2),new Ee({name:"sky-moon",uniforms:this.moonU,vertexShader:ag,fragmentShader:YS,side:fn,depthTest:!1,depthWrite:!1,blending:go})),this.moon.rotation.y=Math.PI,this.starU={uAlpha:{value:0},uTime:{value:0},uPixelRatio:{value:1}},this.stars=new bc(this.buildStars(),new Ee({name:"sky-stars",uniforms:this.starU,vertexShader:KS,fragmentShader:ZS,depthTest:!1,depthWrite:!1,blending:go}));for(let s of[this.sun,this.moon,this.stars])s.frustumCulled=!1,this.celestial.add(s);this.stars.renderOrder=-99,this.moon.renderOrder=-98,this.sun.renderOrder=-97,this.group.add(this.celestial),this.cloudU={uCloudFar:{value:192},uCloudColor:{value:new Nt(1,1,1)}},this.cloudMat=new Ee({name:"sky-clouds",uniforms:{...e,...this.cloudU},vertexShader:JS,fragmentShader:jS,side:fn}),this.clouds=new _e(new Re,this.cloudMat),this.clouds.frustumCulled=!1,this.clouds.renderOrder=10,t.add(this.clouds)}setClouds(t,e=this.cloudRadius){this.cloudsOn=t;let n=Math.max(96,Math.min(384,e));n!==this.cloudRadius&&(this.cloudRadius=n,this.cloudKey=""),this.clouds.visible=t&&!this.hidden}setHidden(t){this.hidden=t,this.celestial.visible=!t,this.clouds.visible=this.cloudsOn&&!t}setPixelRatio(t){this.starU.uPixelRatio.value=t}get objects(){return[this.group,this.clouds]}update(t,e,n){let s=this.u,r=t*Math.PI*2,a=Math.sin(r),o=s.uSunDir.value;o.set(Math.cos(r),Math.sin(r)*Math.cos(Sc),Math.sin(r)*Math.sin(Sc)).normalize();let l=Ea(-.22,.28,a),c=Math.min(1,Math.max(0,a/.4*.5+.5)),h=Math.abs(a)<.4?Math.pow(Math.sin(c*Math.PI),2):0,u=c*.3+.7,f=c*c*.62+.22,d=.2;s.uSkyTop.value.setRGB(fe(.012,.45,l),fe(.018,.64,l),fe(.05,1,l));let b=s.uSkyHorizon.value;b.setRGB(fe(.035,.74,l),fe(.045,.84,l),fe(.09,1,l)),b.setRGB(fe(b.r,u*.95,h*.25),fe(b.g,f*.9,h*.25),fe(b.b,.42,h*.25)),s.uGlowColor.value.setRGB(u,f,d),s.uGlow.value=h*.85,s.uGlowDir.value.set(o.x>=0?1:-1,0,0),this.fog.copy(b),s.uFogColor.value.copy(b),this.hazeU.value.setRGB(1,.92,.75).multiplyScalar(.18*Ea(-.1,.2,o.y)*(.5+.5*l)),s.uDaylight.value=l;let m=fe(.2,1,l),_=1-l;s.uSkyLightColor.value.setRGB(m*fe(1,.6,_)*fe(1,1,h),m*fe(1,.68,_)*fe(1,.86,h*l),m*fe(1,1,_)*fe(1,.74,h*l));let v=o.y>0,w=s.uLightDir.value;v?w.copy(o):w.copy(o).multiplyScalar(-1);let S=Math.abs(o.y),A=Ea(.04,.16,S);s.uShadowStrength.value=(v?.5:.22)*A;let L=s.uSunColor.value;return v?L.setRGB(1,fe(.62,.95,c),fe(.35,.82,c)).multiplyScalar(A):L.setRGB(.45,.52,.7).multiplyScalar(A*.6),this.group.position.set(n.x,n.y,n.z),this.celestial.quaternion.setFromAxisAngle(this.axis,r),this.sunU.uAlpha.value=Ea(-.12,.02,o.y),this.sunU.uTint.value.setRGB(1,fe(.55,.85,c),fe(.25,.5,c)),this.moonU.uAlpha.value=Ea(-.12,.02,-o.y)*fe(1,.35,l),this.starU.uAlpha.value=Math.min(1,Math.max(0,(.12-a)*2.6))*.95,this.starU.uTime.value=e%3600,this.group.updateMatrixWorld(!0),this.cloudsOn&&!this.hidden&&this.updateClouds(e,n,l,h,u,f),{fog:this.fog,daylight:l}}updateClouds(t,e,n,s,r,a){let o=this.cloudU.uCloudColor.value,l=fe(.1,1,n);o.setRGB(l*fe(1,r,s*.55)*fe(1,.75,1-n),l*fe(1,a*1.05,s*.55)*fe(1,.8,1-n),l*fe(1,.72,s*.55));let c=t*VS%(Id*Sr),h=Math.floor((e.x-c)/Sr),u=Math.floor(e.z/Sr),f=`${h},${u},${this.cloudRadius}`;f!==this.cloudKey&&(this.cloudKey=f,this.buildClouds(h,u)),this.clouds.position.set(h*Sr+c,GS,u*Sr),this.cloudU.uCloudFar.value=this.cloudRadius,this.clouds.updateMatrixWorld(!0)}buildClouds(t,e){let n=Math.ceil(this.cloudRadius/Sr)+1,s=Id,r=this.cloudMap,a=(b,p)=>r[(p%s+s)%s*s+(b%s+s)%s],o=[],l=[],c=[],h=Sr,u=WS,f=(b,p)=>{let m=o.length/3;o.push(...b),l.push(p,p,p,p),c.push(m,m+1,m+2,m,m+2,m+3)};for(let b=-n;b<=n;b++)for(let p=-n;p<=n;p++){if(p*p+b*b>n*n)continue;let m=t+p,_=e+b;if(!a(m,_))continue;let y=p*h,v=y+h,w=b*h,S=w+h;f([y,u,w,y,u,S,v,u,S,v,u,w],1),f([y,0,w,v,0,w,v,0,S,y,0,S],.72),a(m+1,_)||f([v,0,w,v,u,w,v,u,S,v,0,S],.86),a(m-1,_)||f([y,0,w,y,0,S,y,u,S,y,u,w],.86),a(m,_+1)||f([y,0,S,v,0,S,v,u,S,y,u,S],.93),a(m,_-1)||f([y,0,w,y,u,w,v,u,w,v,0,w],.93)}let d=new Re;d.setAttribute("position",new Vt(new Float32Array(o),3)),d.setAttribute("aShade",new Vt(new Float32Array(l),1));let g=o.length/3;d.setIndex(new Vt(g>65535?new Uint32Array(c):new Uint16Array(c),1)),this.clouds.geometry.dispose(),this.clouds.geometry=d}buildStars(){let e=new Float32Array(4200),n=new Float32Array(1400),s=new Float32Array(1400),r=90210,a=()=>(r=Math.imul(r,1103515245)+12345>>>0,r/4294967296);for(let l=0;l<1400;l++){let c=0,h=0,u=0,f=0;do c=a()*2-1,h=a()*2-1,u=a()*2-1,f=c*c+h*h+u*u;while(f>1||f<.01);f=Math.sqrt(f),e[l*3]=c/f*(Bs-1),e[l*3+1]=h/f*(Bs-1),e[l*3+2]=u/f*(Bs-1);let d=a();n[l]=d<.7?1:d<.95?2:3,s[l]=a()}let o=new Re;return o.setAttribute("position",new Vt(e,3)),o.setAttribute("aSize",new Vt(n,1)),o.setAttribute("aPhase",new Vt(s,1)),o}dispose(){for(let t of[this.dome,this.sun,this.moon,this.clouds])t.geometry.dispose(),t.material.dispose();this.stars.geometry.dispose(),this.stars.material.dispose(),this.group.removeFromParent(),this.clouds.removeFromParent()}};var ze=1024,eA=26,nA=16,iA=.667,sA=`
#define HP highp
attribute vec3 aCenter;
attribute vec2 aCorner;
attribute vec2 aUv;
attribute vec4 aTint;
attribute float aSize;
uniform float uAtlasSize;
uniform vec2 uParticleLight;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
uniform float uFogNear;
uniform float uFogFar;
${wr}
varying vec2 vUv;
varying vec4 vTint;
varying vec3 vColor;
varying vec4 vFog;
${Mr}
${Eo}
void main() {
  vec4 mv = modelViewMatrix * vec4(aCenter, 1.0);
  mv.xy += aCorner * aSize;
  gl_Position = projectionMatrix * mv;
  vUv = aUv / uAtlasSize;
  vTint = aTint;
  float sb = lightCurve(uParticleLight.x);
  float bb = lightCurve(uParticleLight.y);
  vec3 blk = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
  vColor = finishLight(sb * uSkyLightColor + blk) * 0.9;
  vec3 rel = mv.xyz * mat3(viewMatrix);
  float dist = max(length(rel.xz), abs(rel.y));
  vFog = vec4(skyColor(rel / max(length(rel), 0.0001)), clamp((dist - uFogNear) / max(uFogFar - uFogNear, 0.001), 0.0, 1.0));
}
`,rA=`
#ifdef GL_FRAGMENT_PRECISION_HIGH
#define HP highp
#else
#define HP mediump
#endif
precision mediump float;
uniform sampler2D uAtlas;
varying HP vec2 vUv;
varying vec4 vTint;
varying vec3 vColor;
varying vec4 vFog;
void main() {
  vec4 t = texture2D(uAtlas, vUv, -16.0);
  float masked = step(0.5, vTint.a);
  if (masked < 0.5 && t.a < 0.5) discard;
  vec3 c = t.rgb * mix(vTint.rgb, mix(vTint.rgb, vec3(1.0), t.a), masked) * vColor;
  gl_FragColor = vec4(mix(c, vFog.rgb, vFog.a), 1.0);
}
`,Tc=class{constructor(t){this.n=0;this.px=new Float64Array(ze);this.py=new Float64Array(ze);this.pz=new Float64Array(ze);this.vx=new Float32Array(ze);this.vy=new Float32Array(ze);this.vz=new Float32Array(ze);this.age=new Float32Array(ze);this.life=new Float32Array(ze);this.floorY=new Float32Array(ze);this.size=new Float32Array(ze);this.uv=new Float32Array(ze*2);this.tint=new Uint8Array(ze*4);this.aCenter=new Float32Array(ze*12);this.aUv=new Float32Array(ze*8);this.aTint=new Uint8Array(ze*16);this.aSize=new Float32Array(ze*4);this.collider=null;this.seed=12345;this.light={value:new qt(1,0)},this.mat=new Ee({name:"particles",uniforms:{...t,uParticleLight:this.light},vertexShader:sA,fragmentShader:rA});let e=new Re,n=new Float32Array(ze*8),s=new Uint16Array(ze*6);for(let h=0;h<ze;h++){n.set([-1,-1,1,-1,1,1,-1,1],h*8);let u=h*4;s.set([u,u+1,u+2,u,u+2,u+3],h*6)}let r=(h,u,f=!1)=>{let d=new Vt(h,u,f);return d.setUsage(V0),d},a=r(this.aCenter,3),o=r(this.aUv,2),l=r(this.aTint,4,!0),c=r(this.aSize,1);e.setAttribute("aCenter",a),e.setAttribute("position",a),e.setAttribute("aCorner",new Vt(n,2)),e.setAttribute("aUv",o),e.setAttribute("aTint",l),e.setAttribute("aSize",c),e.setIndex(new Vt(s,1)),e.setDrawRange(0,0),this.attrs=[a,o,l,c],this.geo=e,this.mesh=new _e(e,this.mat),this.mesh.frustumCulled=!1,this.mesh.visible=!1,this.mesh.matrixAutoUpdate=!1}get count(){return this.n}setCollider(t){this.collider=t}setLight(t,e){this.light.value.set(t/15,e/15)}rnd(){return this.seed=Math.imul(this.seed,1664525)+1013904223>>>0,this.seed/4294967296}spawnBreak(t,e,n,s){let r=wn(s);if(!r)return;let a=nn[r],o=jt[r],l=o===J.cross||o===J.torch||o===J.lantern||o===J.rod,c=o===J.carpet||o===J.layer||o===J.lily,h=l?.3:.5,u=c?.15:l?.7:1,f=255,d=255,g=255,b=Xi[r];if(b){let m=b===1?Qn.grass:b===2?Qn.foliage:Qn.water;f=m[0],d=m[1],g=m[2]}let p=a===xn.opaque||a===xn.lava?255:0;for(let m=0;m<eA;m++){this.n>=ze&&this.kill(0);let _=this.n++,y=(this.rnd()-.5)*2*h,v=this.rnd()*u,w=(this.rnd()-.5)*2*h;this.px[_]=t+.5+y,this.py[_]=e+v,this.pz[_]=n+.5+w;let S=1.4+this.rnd()*1.8;this.vx[_]=y*S*2+(this.rnd()-.5)*1.2,this.vy[_]=(v-u*.35)*S+1.2+this.rnd()*2.2,this.vz[_]=w*S*2+(this.rnd()-.5)*1.2,this.age[_]=0,this.life[_]=Math.min(1.6,.2/(this.rnd()*.9+.1))+.15,this.size[_]=.05+this.rnd()*.05,this.floorY[_]=e;let A=er[r]?4:this.rnd()<.2?2:4,L=It[r*6+A],[P,M]=Us(L);this.uv[_*2]=P+Math.floor(this.rnd()*13),this.uv[_*2+1]=M+Math.floor(this.rnd()*13),this.tint[_*4]=f,this.tint[_*4+1]=d,this.tint[_*4+2]=g,this.tint[_*4+3]=p}}kill(t){let e=--this.n;if(t!==e){this.px[t]=this.px[e],this.py[t]=this.py[e],this.pz[t]=this.pz[e],this.vx[t]=this.vx[e],this.vy[t]=this.vy[e],this.vz[t]=this.vz[e],this.age[t]=this.age[e],this.life[t]=this.life[e],this.size[t]=this.size[e],this.floorY[t]=this.floorY[e],this.uv[t*2]=this.uv[e*2],this.uv[t*2+1]=this.uv[e*2+1];for(let n=0;n<4;n++)this.tint[t*4+n]=this.tint[e*4+n]}}update(t,e,n,s){let r=Math.pow(iA,t),a=this.collider;for(let d=0;d<this.n;d++){if(this.age[d]+=t,this.age[d]>=this.life[d]){this.kill(d),d--;continue}this.vy[d]-=nA*t,this.vx[d]*=r,this.vy[d]*=r,this.vz[d]*=r;let g=this.px[d]+this.vx[d]*t,b=this.py[d]+this.vy[d]*t,p=this.pz[d]+this.vz[d]*t,m=this.size[d],_=!1;a?(a(Math.floor(g),Math.floor(this.py[d]),Math.floor(this.pz[d]))?this.vx[d]=0:this.px[d]=g,a(Math.floor(this.px[d]),Math.floor(this.py[d]),Math.floor(p))?this.vz[d]=0:this.pz[d]=p,this.vy[d]<0&&a(Math.floor(this.px[d]),Math.floor(b-m),Math.floor(this.pz[d]))?(this.py[d]=Math.floor(b-m)+1+m,_=!0):this.vy[d]>0&&a(Math.floor(this.px[d]),Math.floor(b+m),Math.floor(this.pz[d]))?this.vy[d]=0:this.py[d]=b):(this.px[d]=g,this.pz[d]=p,b-m<this.floorY[d]&&this.vy[d]<0?(this.py[d]=this.floorY[d]+m,_=!0):this.py[d]=b),_&&(this.vy[d]=0,this.vx[d]*=Math.pow(.05,t),this.vz[d]*=Math.pow(.05,t))}let o=this.n;if(this.mesh.visible=o>0,!o)return;let l=this.aCenter,c=this.aUv,h=this.aTint,u=this.aSize;for(let d=0;d<o;d++){let g=this.px[d]-e,b=this.py[d]-n,p=this.pz[d]-s,m=this.uv[d*2],_=this.uv[d*2+1],y=this.size[d];for(let v=0;v<4;v++){let w=d*4+v;l[w*3]=g,l[w*3+1]=b,l[w*3+2]=p,u[w]=y;for(let S=0;S<4;S++)h[w*4+S]=this.tint[d*4+S]}c[d*8]=m,c[d*8+1]=_+4,c[d*8+2]=m+4,c[d*8+3]=_+4,c[d*8+4]=m+4,c[d*8+5]=_,c[d*8+6]=m,c[d*8+7]=_}let f=[3,2,4,1];for(let d=0;d<this.attrs.length;d++){let g=this.attrs[d];g.clearUpdateRanges(),g.addUpdateRange(0,o*4*f[d]),g.needsUpdate=!0}this.geo.setDrawRange(0,o*6),this.mesh.position.set(e,n,s),this.mesh.updateMatrix(),this.mesh.matrixWorld.copy(this.mesh.matrix)}clear(){this.n=0,this.mesh.visible=!1,this.geo.setDrawRange(0,0)}dispose(){this.geo.dispose(),this.mat.dispose()}};var Ta=(i,t)=>t<<4|i,xe=(i,t)=>(i+32768)*65536+(t+32768),os=i=>Math.floor(i/65536)-32768,as=i=>i%65536-32768,mn=(i,t,e)=>xe(i,e)*16+t,To=i=>i%16,Ar=i=>Math.floor(i/16),$e=[0,1,0,-1],Xe=[-1,0,1,0],cg=[1,-1,0,0,0,0],hg=[0,0,1,-1,0,0],ug=[0,0,0,0,1,-1],dg=[1,0,3,2,5,4],Er=[5,0,4,1],Ca=[1,3,-1,-1,2,0],pn=18,ka=pn*pn*pn,Cc=(i,t,e)=>((t+1)*pn+(e+1))*pn+(i+1),Ra=(i,t)=>(t+1)*pn+(i+1),fg=1200;var Os=new Uint8Array(65536),Vn=new Uint8Array(65536),Fs=new Uint8Array(65536),Fd=[[1,0],[0,.5],[.5,1],[0,2/16],[0,1/16]];for(let i=0;i<65536;i++){let t=i&1023;if(t>=vt||t===0)continue;let e=i>>10,n=jt[t],s=nn[t]===xn.opaque;if(ws[t]||n===J.slab&&(e&3)===2){Os[i]=1,Vn[i]=63;continue}s&&(n===J.slab?e&3?(Vn[i]=4,Fs[i]=2):(Vn[i]=8,Fs[i]=1):n===J.stairs?e&4?(Vn[i]=4,Fs[i]=2):(Vn[i]=8,Fs[i]=1):n===J.layer?(Vn[i]=8,Fs[i]=3):n===J.carpet&&(Vn[i]=8,Fs[i]=4))}var Dd=new Uint8Array(vt),yg=new Uint8Array(vt);for(let i=0;i<vt;i++){let t=Le[i].name;t.endsWith("_glazed_terracotta")&&(Dd[i]=1),jt[i]===J.cube&&(t==="glass"||t==="tinted_glass"||t.endsWith("_stained_glass"))&&(yg[i]=1)}var bg,oA=(bg=_t.iron_bars)!=null?bg:-1;function Co(i,t){let e=i&1023,n=Xr[e],s=e*6;if(n===0)return It[s+t];let r=i>>10;if(n===1){let c=r&3;return c===1?t===0?It[s+2]:t===1?It[s+3]:It[s+4]|65536:c===2?t===4?It[s+2]:t===5?It[s+3]:t===0||t===1?It[s+4]|65536:It[s+4]:It[s+t]}let a=r&3;if(t===2)return It[s+2]|(Dd[e]?a+1&3:a)<<16;if(t===3)return It[s+3]|(4-a&3)<<16;let o=Ca[t]-a+4&3,l=It[s+Er[o]];return Dd[e]?l|o<<16:l}var Ud=i=>jt[i&1023]===J.stairs;function Nd(i,t,e){let n=t&1023;if(n===0)return!1;let s=i&1023,r=jt[s],a=jt[n];if(Os[t&65535])return!0;switch(r){case J.fence:if(a===J.fence&&nr[n]===nr[s])return!0;break;case J.pane:if(a===J.pane||yg[n])return!0;break;case J.wall:if(a===J.wall)return!0;break;default:return!1}return r!==J.pane&&a===J.stairs&&(t>>10&3)===(e+2&3)}function Lc(i,t){let e=0;for(let n=0;n<4;n++)Nd(i,t($e[n],0,Xe[n]),n)&&(e|=1<<n);return e}var aA=0,_g=1,vg=2,xg=3,wg=4;function pg(i,t,e){let n=t($e[e],0,Xe[e]);return!Ud(n)||(n>>10&3)!==(i>>10&3)||(n>>12&1)!==(i>>12&1)}function Mg(i,t){let e=i>>10,n=e&3,s=e>>2&1,r=t($e[n],0,Xe[n]);if(Ud(r)&&(r>>12&1)===s){let o=r>>10&3;if((o&1)!==(n&1)&&pg(i,t,o+2&3))return o===(n+3&3)?xg:wg}let a=t(-$e[n],0,-Xe[n]);if(Ud(a)&&(a>>12&1)===s){let o=a>>10&3;if((o&1)!==(n&1)&&pg(i,t,o))return o===(n+3&3)?_g:vg}return aA}function Sg(i,t){let e=Lc(i,t),n=t(0,1,0),s=n&1023,r=jt[s],a=e===5||e===10,o=Os[n&65535]===1,l=0;for(let h=0;h<4;h++)e&1<<h&&(o||r===J.wall&&Nd(n,t($e[h],1,Xe[h]),h))&&(l|=1<<h);let c=!a;if(!c&&s!==0)if(r===J.wall){let h=0;for(let u=0;u<4;u++)Nd(n,t($e[u],1,Xe[u]),u)&&(h|=1<<u);h!==5&&h!==10&&(c=!0)}else(r===J.torch||r===J.lantern||r===J.rod||!o&&ge[s]&&l===0)&&(c=!0);return e|(c?16:0)|l<<5}function Ag(i,t){switch(jt[i&1023]){case J.stairs:return Mg(i,t);case J.fence:case J.pane:return Lc(i,t);case J.wall:return Sg(i,t);default:return 0}}var Bt=(i,t,e,n,s,r)=>[i/16,t/16,e/16,n/16,s/16,r/16];function Tr(i,t){let[e,n,s,r,a,o]=i;for(let l=0;l<(t&3);l++){let c=1-o,h=1-s,u=e,f=r;e=c,r=h,s=u,o=f}return[e,n,s,r,a,o]}var Qe=i=>[i,i,i,i,i,i];function La(i){switch(i&3){case 0:return[0,0,1,.5];case 1:return[.5,0,1,1];case 2:return[0,.5,1,1];default:return[0,0,.5,1]}}function kc(i,t){let e=La(i),n=La(t);return[Math.max(e[0],n[0]),Math.max(e[1],n[1]),Math.min(e[2],n[2]),Math.min(e[3],n[3])]}function Eg(i,t){let e=i>>10,n=e&3,s=e>>2&1,r=[s?[0,.5,0,1,1,1]:[0,0,0,1,.5,1]],a=s?0:.5,o=s?.5:1,l=n+3&3,c=n+1&3,h=n+2&3,u=[];switch(t){case _g:u.push(La(n),kc(h,l));break;case vg:u.push(La(n),kc(h,c));break;case xg:u.push(kc(n,l));break;case wg:u.push(kc(n,c));break;default:u.push(La(n))}for(let f of u)r.push([f[0],a,f[1],f[2],o,f[3]]);return r}function Tg(i){let t=i>>10&3;return t===2?[0,0,0,1,1,1]:t===1?[0,.5,0,1,1,1]:[0,0,0,1,.5,1]}function Cg(i){let t=i>>10,e=t&3,n=t>>2&1,r=t>>4&1?e+1&3:e+3&3,a=e+2&3,o=n?r:a,l=3/16,c;switch(o){case 0:c=[0,0,0,1,1,l];break;case 1:c=[1-l,0,0,1,1,1];break;case 2:c=[0,0,1-l,1,1,1];break;default:c=[0,0,0,l,1,1]}let h=$e[a]+$e[r],u=Xe[a]+Xe[r];return{box:c,hingeX:h>0?1:0,hingeZ:u>0?1:0}}function kg(i){let t=i>>10,e=t&3,n=t>>2&1,s=t>>3&1,r=3/16;if(!n)return s?[0,1-r,0,1,1,1]:[0,0,0,1,r,1];switch(e){case 0:return[0,0,0,1,1,r];case 1:return[1-r,0,0,1,1,1];case 2:return[0,0,1-r,1,1,1];default:return[0,0,0,r,1,1]}}var Rc=22.5*Math.PI/180;function lA(i){switch(i&3){case 1:return{box:[0,.21875,7/16,2/16,.84375,9/16],rotate:{axis:"z",angle:-Rc,origin:[1/16,.21875,.5]}};case 3:return{box:[14/16,.21875,7/16,1,.84375,9/16],rotate:{axis:"z",angle:Rc,origin:[15/16,.21875,.5]}};case 2:return{box:[7/16,.21875,0,9/16,.84375,2/16],rotate:{axis:"x",angle:Rc,origin:[.5,.21875,1/16]}};default:return{box:[7/16,.21875,14/16,9/16,.84375,1],rotate:{axis:"x",angle:-Rc,origin:[.5,.21875,15/16]}}}}var mg=[[7,6,9,16],[7,6,9,16],[7,6,9,8],[7,14,9,16],[7,6,9,16],[7,6,9,16]];function Rg(i,t,e=0){let n=i&1023,s=i>>10,r=n*6,a=It[r];switch(jt[n]){case J.cube:{let o=[];for(let l=0;l<6;l++)o.push(Co(i,l)&65535);return[{box:[0,0,0,1,1,1],tex:o}]}case J.slab:{let o=[It[r],It[r+1],It[r+2],It[r+3],It[r+4],It[r+5]];return[{box:Tg(i),tex:o}]}case J.stairs:{let o=[It[r],It[r+1],It[r+2],It[r+3],It[r+4],It[r+5]];return Eg(i,t).map(l=>({box:l,tex:o.slice()}))}case J.fence:{let o=[{box:Bt(6,0,6,10,16,10),tex:Qe(a)}];for(let l=0;l<4;l++)t&1<<l&&(o.push({box:Tr(Bt(7,12,0,9,15,6),l),tex:Qe(a)}),o.push({box:Tr(Bt(7,6,0,9,9,6),l),tex:Qe(a)}));return o}case J.wall:{let o=[];t&16&&o.push({box:Bt(4,0,4,12,16,12),tex:Qe(a)});for(let l=0;l<4;l++){if(!(t&1<<l))continue;let c=t&1<<5+l?16:14;o.push({box:Tr(Bt(5,0,0,11,c,8),l),tex:Qe(a)})}return o.length||o.push({box:Bt(4,0,4,12,16,12),tex:Qe(a)}),o}case J.pane:{let o=t&15?t&15:15,l=n===oA?1:0,c=[Bt(7,0,7,9,16,9)];for(let h=0;h<4;h++)o&1<<h&&c.push(Tr(Bt(7,0,0,9,16,7),h));return c.map(h=>{let u=Math.round(h[0]*16),f=Math.round(h[3]*16),d=Math.round(h[2]*16),g=Math.round(h[5]*16),b=f-u<=2,p=g-d<=2,m=f-u>=g-d?[u,0,f,1]:[l,d,l+1,g],_=[l,0,l+1,16],y=[p?_:null,p?_:null,m,m,b?_:null,b?_:null];return{box:h,tex:Qe(a),uv:y}})}case J.torch:{if(s===0)return[{box:Bt(7,0,7,9,10,9),tex:Qe(a),uv:mg,shade:!1,ao:!1}];let o=lA(s-1);return[{box:o.box,tex:Qe(a),uv:mg,rotate:o.rotate,shade:!1,ao:!1}]}case J.door:{let o=s>>3&1?It[r+2]:It[r+3],l=Cg(i),[c,,h,u,,f]=l.box,d=[null,null,null,null,null,null],g=u-c<.5,b=g?[0,1]:[4,5];for(let p of b){let m=p===1||p===4,_=g?l.hingeZ===0:l.hingeX===0;d[p]=m===_?[0,0,16,16]:[16,0,0,16]}return[{box:l.box,tex:Qe(o),uv:d}]}case J.trapdoor:return[{box:kg(i),tex:Qe(a)}];case J.layer:return[{box:Bt(0,0,0,16,2,16),tex:Qe(a)}];case J.carpet:return[{box:Bt(0,0,0,16,1,16),tex:Qe(a)}];case J.cactus:{let o=It[r+4],l=It[r+2],c=It[r+3];return[{box:[0,0,0,1,1,1],tex:[-1,-1,l,c,-1,-1]},{box:Bt(0,0,1,16,16,15),tex:[-1,-1,-1,-1,o,o]},{box:Bt(1,0,0,15,16,16),tex:[o,o,-1,-1,-1,-1]}]}case J.lantern:{let o=s&1?1:0,l=[[5,9,11,16],[5,9,11,16],[0,0,6,6],[0,0,6,6],[5,9,11,16],[5,9,11,16]],c=[[6,7,10,9],[6,7,10,9],[1,1,5,5],[1,1,5,5],[6,7,10,9],[6,7,10,9]],h=[[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7]],u=[{box:Bt(5,o,5,11,7+o,11),tex:Qe(a),uv:l},{box:Bt(6,7+o,6,10,9+o,10),tex:Qe(a),uv:c}];return o?u.push({box:Bt(7.5,10,7.5,8.5,16,8.5),tex:[a,a,-1,-1,a,a],uv:h}):u.push({box:Bt(7,9,7,9,10,9),tex:Qe(a),uv:h}),u}case J.chest:{let o=[];for(let l=0;l<6;l++)o.push(Co(i,l)&65535);return[{box:Bt(1,0,1,15,14,15),tex:o}]}case J.rod:{let o=s&3,l=o===1?{axis:"z",angle:-Math.PI/2,origin:[.5,.5,.5]}:o===2?{axis:"x",angle:Math.PI/2,origin:[.5,.5,.5]}:void 0,c=[[0,0,4,1],[0,0,4,1],[0,0,4,4],[0,0,4,4],[0,0,4,1],[0,0,4,1]],h=[[7,0,9,15],[7,0,9,15],[7,0,9,2],[7,0,9,2],[7,0,9,15],[7,0,9,15]];return[{box:Bt(6,0,6,10,1,10),tex:Qe(a),uv:c,rotate:l,ao:!1,shade:!1},{box:Bt(7,1,7,9,16,9),tex:Qe(a),uv:h,rotate:l,ao:!1,shade:!1}]}case J.lily:{let l=e&3;return[{box:[0,.00625,0,1,.00625,1],tex:[-1,-1,a,a,-1,-1],uv:[null,null,[0,0,16,16],[0,16,16,0],null,null],rotate:l?{axis:"y",angle:-l*Math.PI/2,origin:[.5,.5,.5]}:void 0}]}default:return[]}}var Lg=[0,0,0,1,1,1],Bd=new Map;{let i=(t,e)=>{for(let n of t)_t[n]!==void 0&&Bd.set(_t[n],e)};i(["short_grass","fern","dead_bush"],Bt(2,0,2,14,13,14)),i(["dandelion","poppy","blue_orchid","allium","azure_bluet","red_tulip","orange_tulip","white_tulip","pink_tulip","oxeye_daisy","cornflower","lily_of_the_valley"],Bt(5,0,5,11,10,11)),i(["brown_mushroom","red_mushroom"],Bt(5,0,5,11,6,11)),i(["sugar_cane"],Bt(2,0,2,14,16,14)),i(["cobweb"],Lg),i(["seagrass"],Bt(2,0,2,14,12,14));for(let t=0;t<vt;t++)Le[t].name.endsWith("_sapling")&&Bd.set(t,Bt(2,0,2,14,12,14))}function gg(i,t,e){let n=[];t&&n.push(t);for(let s=0;s<4;s++)i&1<<s&&n.push(Tr(e,s));return n}function Pg(i,t,e){let n=i&1023,s=i>>10;if(n===0||n>=vt)return[];switch(jt[n]){case J.cube:return[Lg.slice()];case J.slab:return[Tg(i)];case J.stairs:return Eg(i,Mg(i,t));case J.fence:{let r=e?24:16;return gg(Lc(i,t),Bt(6,0,6,10,r,10),Bt(6,0,0,10,r,6))}case J.pane:{let r=Lc(i,t);return r||(r=15),gg(r,Bt(7,0,7,9,16,9),Bt(7,0,0,9,16,7))}case J.wall:{let r=Sg(i,t),a=[],o=e?24:16;(r&16||!(r&15))&&a.push(Bt(4,0,4,12,o,12));for(let l=0;l<4;l++){if(!(r&1<<l))continue;let c=e?24:r&1<<5+l?16:14;a.push(Tr(Bt(5,0,0,11,c,8),l))}return a}case J.torch:return e?[]:s===0?[Bt(6,0,6,10,10,10)]:[Tr(Bt(5.5,3,11,10.5,13,16),s-1&3)];case J.door:return[Cg(i).box];case J.trapdoor:return[kg(i)];case J.layer:return e?[]:[Bt(0,0,0,16,2,16)];case J.carpet:return[Bt(0,0,0,16,1,16)];case J.cactus:return e?[Bt(1,0,1,15,15,15)]:[Bt(1,0,1,15,16,15)];case J.lantern:{let r=s&1?1:0;return[Bt(5,r,5,11,7+r,11),Bt(6,7+r,6,10,9+r,10)]}case J.chest:return[Bt(1,0,1,15,14,15)];case J.rod:{let r=s&3;return[r===1?Bt(0,6,6,16,10,10):r===2?Bt(6,6,0,10,10,16):Bt(6,0,6,10,16,10)]}case J.lily:return[Bt(1,0,1,15,1.5,15)];case J.cross:{if(e)return[];let r=Bd.get(n);return[r?r.slice():Bt(2,0,2,14,14,14)]}default:return[]}}function Pc(i,t){return ge[i&1023]?Pg(i,t,!0):[]}function Ic(i,t){return Pg(i,t,!1)}var Od=new Uint8Array(vt);for(let i of["short_grass","fern","dandelion","poppy","blue_orchid","allium","azure_bluet","red_tulip","orange_tulip","white_tulip","pink_tulip","oxeye_daisy","cornflower","lily_of_the_valley"])_t[i]!==void 0&&(Od[_t[i]]=1);function Dc(i,t,e,n=0){let s=Math.imul(i|0,668265261)^Math.imul(e|0,374761393)^Math.imul(t|0,2654435761)^n;return s=Math.imul(s^s>>>15,2246822507),s=Math.imul(s^s>>>13,3266489909),(s^s>>>16)>>>0}var ls=1,Bi=pn,zs=pn*pn,Ig=[ls,zs,Bi],Xd=[ls,-ls,zs,-zs,Bi,-Bi],qd=[2,1,8,4,32,16],Fc=[0,0,1,1,2,2],Oc=[.6,.6,1,.5,.8,.8],Og=[.45,.65,.82,1],Dg=[0,17,17/2,17/3,17/4],kr=[[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]],cs=new Uint8Array(72),zg=new Int32Array(24),Hg=new Int32Array(24),Gg=new Uint8Array(6),Wg=new Uint8Array(6);for(let i=0;i<6;i++){let t=Fc[i],e=t===0?1:0,n=t===2?1:2;for(let o=0;o<4;o++){let l=kr[i][o];for(let c=0;c<3;c++)cs[(i*4+o)*3+c]=l[c];zg[i*4+o]=(l[e]?1:-1)*Ig[e],Hg[i*4+o]=(l[n]?1:-1)*Ig[n]}let s=kr[i][0],r=kr[i][1],a=kr[i][3];for(let o=0;o<3;o++)r[o]!==s[o]&&(Gg[i]=o),a[o]!==s[o]&&(Wg[i]=o)}var Nc=[0,16,16,0],Vd=[16,16,0,0],Bc=new Uint8Array(65536);for(let i=0;i<65536;i++){let t=i&1023;t<vt&&(Os[i]||ti[t])&&(Bc[i]=1)}var cA=new Float32Array(Fd.map(i=>i[0])),hA=new Float32Array(Fd.map(i=>i[1])),uA=J.cube,dA=J.slab,fA=J.cross,pA=J.fluid,mA=J.lily,gA=J.pane,bA=J.fence,yA=J.door,_A=J.cactus,Yd=_t.water,Fg,$d=(Fg=_t.seagrass)!=null?Fg:-1,vA=Ce(_t.bedrock),Rr=new Uint16Array(1024);for(let i=0;i<vt;i++)ce[i]&&(Rr[i]=i);$d>=0&&(Rr[$d]=Yd);var Vg=new Uint8Array(vt);for(let i of["grass_block","snowy_grass_block","dirt","sand","red_sand","mycelium","podzol"])_t[i]!==void 0&&(Vg[_t[i]]=1);var Cr=class{constructor(){this.pos=new Int16Array(3*8192);this.uv=new Uint16Array(2*8192);this.tint=new Uint8Array(4*8192);this.light=new Uint8Array(4*8192);this.idx=new Uint32Array(12288);this.vc=0;this.ic=0}reserve(t,e){if((this.vc+t)*3>this.pos.length){let n=Math.max(this.pos.length/3*2,this.vc+t),s=new Int16Array(n*3);s.set(this.pos),this.pos=s;let r=new Uint16Array(n*2);r.set(this.uv),this.uv=r;let a=new Uint8Array(n*4);a.set(this.tint),this.tint=a;let o=new Uint8Array(n*4);o.set(this.light),this.light=o}if(this.ic+e>this.idx.length){let n=new Uint32Array(Math.max(this.idx.length*2,this.ic+e));n.set(this.idx),this.idx=n}}finish(){let t=this.vc,e=this.ic;if(t===0||e===0)return null;let n;return t<=65535?(n=new Uint16Array(e),n.set(this.idx.subarray(0,e))):n=this.idx.slice(0,e),{positions:this.pos.slice(0,t*3),uvs:this.uv.slice(0,t*2),tints:this.tint.slice(0,t*4),lights:this.light.slice(0,t*4),indices:n,vertexCount:t,indexCount:e}}},Ro=[new Cr,new Cr,new Cr,new Cr,new Cr],ci=new Uint16Array(ka),li=new Uint8Array(ka),gn=new Uint8Array(pn*pn*9),$g=!1,Kd=!0,Lr=!1,Xg=0,Ba=255,Fa=255,Oa=255,Zd=0,xA=(i,t,e)=>ci[Xg+i+e*Bi+t*zs];function hs(i,t,e,n,s,r,a,o,l,c){let h=i.vc++,u=h*3,f=h*2,d=h*4;i.pos[u]=t,i.pos[u+1]=e,i.pos[u+2]=n,i.uv[f]=s,i.uv[f+1]=r;let g=i.tint;g[d]=Ba,g[d+1]=Fa,g[d+2]=Oa,g[d+3]=Zd;let b=i.light;b[d]=a,b[d+1]=o,b[d+2]=l,b[d+3]=c}function ko(i,t,e,n){let s=i.idx,r=i.ic;e?(s[r++]=t+1,s[r++]=t+2,s[r++]=t+3,s[r++]=t+1,s[r++]=t+3,s[r++]=t):(s[r++]=t,s[r++]=t+1,s[r++]=t+2,s[r++]=t,s[r++]=t+2,s[r++]=t+3),n&&(e?(s[r++]=t+1,s[r++]=t+3,s[r++]=t+2,s[r++]=t+1,s[r++]=t,s[r++]=t+3):(s[r++]=t,s[r++]=t+2,s[r++]=t+1,s[r++]=t,s[r++]=t+3,s[r++]=t+2)),i.ic=r}function Jd(i,t,e){let n=Xi[i];if(n){let s=Ra(t,e)*9+(n-1)*3;Ba=gn[s],Fa=gn[s+1],Oa=gn[s+2]}else Ba=255,Fa=255,Oa=255;Zd=er[i]?255:0}function jd(i,t){let e=Ra(i,t)*9;return(gn[e]|gn[e+1]<<8|gn[e+2]<<16)^Math.imul(gn[e+3]|gn[e+4]<<8|gn[e+5]<<16,2654435761)^Math.imul(gn[e+6]|gn[e+7]<<8|gn[e+8]<<16,2246822507)}var ri=new Float32Array(4),oi=new Float32Array(4),ai=new Uint8Array(4);function qg(i,t){let e=li[i],n=e>>4,s=e&15,r=t*4;for(let a=0;a<4;a++){let o=zg[r+a],l=Hg[r+a],c=i+o,h=i+l,u=c+l,f=ci[c],d=ci[h],g=ci[u],b=Os[f],p=Os[d],m=n,_=s,y=1;if(!b){let S=li[c];m+=S>>4,_+=S&15,y++}if(!p){let S=li[h];m+=S>>4,_+=S&15,y++}if(!(b&&p)&&!Os[g]){let S=li[u];m+=S>>4,_+=S&15,y++}ri[a]=m*Dg[y],oi[a]=_*Dg[y];let v=Bc[f],w=Bc[d];ai[a]=v&&w?0:3-v-w-Bc[g]}}function wA(i){let t=li[i],e=(t>>4)*17,n=(t&15)*17;ri[0]=ri[1]=ri[2]=ri[3]=e,oi[0]=oi[1]=oi[2]=oi[3]=n,ai[0]=ai[1]=ai[2]=ai[3]=3}function MA(i,t,e,n,s,r){let a=ti[r]===1,o=a&&!$g,l=Ro[o?0:nn[r]],c=pl[r]===1,h=a&&!Lr?16:0;Jd(r,i,e);for(let u=0;u<6;u++){let f=n+Xd[u],d=ci[f];if(Vn[d]&qd[u])continue;if(d!==0){let P=d&1023;if(c&&P===r||o&&ti[P])continue}let g=Co(s,u),b=g&65535,p=g>>>16;u===2&&Vg[r]&&!Lr&&(p=p+Dc(i,t,e,jd(i,e))&3),Kd?qg(f,u):wA(f);let m=(b&31)<<4,_=b>>5<<4;l.reserve(4,6);let y=l.vc,v=Oc[u]*255,w=u|h,S=u*12;for(let P=0;P<4;P++){let M=P+p&3;hs(l,i+cs[S+P*3]<<8,t+cs[S+P*3+1]<<8,e+cs[S+P*3+2]<<8,m+Nc[M],_+Vd[M],ri[P]+.5|0,oi[P]+.5|0,v*Og[ai[P]]+.5|0,w)}let A=ai[0]*64+ri[0]+oi[0]+ai[2]*64+ri[2]+oi[2],L=ai[1]*64+ri[1]+oi[1]+ai[3]*64+ri[3]+oi[3];ko(l,y,A<L,!1)}}function SA(i,t,e,n,s){let r=Ro[nn[s]],a=li[n],o=(a>>4)*17,l=(a&15)*17;Jd(s,i,e);let c=0,h=0;if(Od[s]&&!Lr){let P=Dc(i,t,e,jd(i,e));c=((P&15)/15-.5)*(6/16),h=((P>>>4&15)/15-.5)*(6/16)}let u=Kh[s]===1&&!Lr,f=6|(u?8:0),d=f|(u?32:0),g=Co(s,0)&65535,b=(g&31)<<4,p=g>>5<<4,m=.05,_=.95,y=Math.round((i+m+c)*256),v=Math.round((i+_+c)*256),w=Math.round((e+m+h)*256),S=Math.round((e+_+h)*256),A=t<<8,L=t+1<<8;r.reserve(8,24);for(let P=0;P<2;P++){let M=P?S:w,T=P?w:S,I=r.vc;hs(r,y,A,M,b,p+16,o,l,255,f),hs(r,v,A,T,b+16,p+16,o,l,255,f),hs(r,v,L,T,b+16,p,o,l,255,d),hs(r,y,L,M,b,p,o,l,255,d),ko(r,I,!1,!0)}}var zd=14/16;function Yg(i){let t=i&1023;if(!ce[t])return zd;let e=i>>10;return e&8?zd:zd-(e&7)/9}function Na(i,t){let e=ci[i],n=e&1023;return Rr[n]===t?Rr[ci[i+zs]&1023]===t?1:Yg(e):ge[n]?-1:0}function Uc(i,t,e,n,s){if(t>=1||e>=1)return 1;let r=0,a=0;if(t>0||e>0){let o=Na(n,s);if(o>=1)return 1;o>=.8?(r+=o*10,a+=10):o>=0&&(r+=o,a+=1)}return i>=.8?(r+=i*10,a+=10):i>=0&&(r+=i,a+=1),t>=.8?(r+=t*10,a+=10):t>=0&&(r+=t,a+=1),e>=.8?(r+=e*10,a+=10):e>=0&&(r+=e,a+=1),a>0?r/a:i}var Hd=(i,t)=>Math.max(i>>4,t>>4)<<4|Math.max(i&15,t&15),De=new Float32Array(4),AA=[0,256,256,0],EA=[256,256,0,0],TA=[2,3,1,0];function Ug(i,t,e,n,s,r){let a=r===Yd,o=Ro[nn[r]];if(Xi[r]){let m=Ra(i,e)*9+(Xi[r]-1)*3;Ba=gn[m],Fa=gn[m+1],Oa=gn[m+2]}else Ba=Fa=Oa=255;Zd=0;let l=li[n],c=ci[n+zs],h=Rr[c&1023]===r;if(h)De[0]=De[1]=De[2]=De[3]=1;else{let m=Yg(s),_=Na(n-Bi,r),y=Na(n+Bi,r),v=Na(n-ls,r),w=Na(n+ls,r);De[0]=Uc(m,_,v,n-Bi-ls,r),De[1]=Uc(m,_,w,n-Bi+ls,r),De[2]=Uc(m,y,v,n+Bi-ls,r),De[3]=Uc(m,y,w,n+Bi+ls,r)}let u=Co(r,2)&65535,f=(u&31)<<4,d=u>>5<<4,g=i<<8,b=t<<8,p=e<<8;if(!h&&!(Vn[c]&8&&De[0]>=1&&De[1]>=1&&De[2]>=1&&De[3]>=1)){let m=Hd(l,li[n+zs]),_=(m>>4)*17,y=(m&15)*17,v=2|(a&&!Lr?24:0),w=De[0]+De[2]-De[1]-De[3],S=De[0]+De[1]-De[2]-De[3],A=0;Math.abs(w)+Math.abs(S)>.001&&(A=Math.abs(w)>Math.abs(S)?w>0?3:1:S>0?0:2),o.reserve(4,12);let L=o.vc;for(let P=0;P<4;P++){let M=P+A&3;hs(o,g+AA[P],b+Math.round(De[TA[P]]*256),p+EA[P],f+Nc[M],d+Vd[M],_,y,255,v)}ko(o,L,!1,a)}for(let m=0;m<6;m++){if(m===2||m===3)continue;let _=n+Xd[m],y=ci[_];if(Rr[y&1023]===r||Vn[y]&qd[m])continue;let v=Hd(l,li[_]),w=(v>>4)*17,S=(v&15)*17,A=Oc[m]*255+.5|0;o.reserve(4,12);let L=o.vc,P=m*12;for(let M=0;M<4;M++){let T=cs[P+M*3],I=cs[P+M*3+1],F=cs[P+M*3+2],k=I?De[T+F*2]:0,U=Math.round(16*(1-k));hs(o,g+(T<<8),b+Math.round(k*256),p+(F<<8),f+Nc[M],d+U,w,S,A,m)}ko(o,L,!1,a)}{let m=n-zs,_=ci[m];if(Rr[_&1023]!==r&&!(Vn[_]&4)){let y=Hd(l,li[m]),v=(y>>4)*17,w=(y&15)*17,S=Oc[3]*255+.5|0;o.reserve(4,12);let A=o.vc,L=3*12;for(let P=0;P<4;P++)hs(o,g+(cs[L+P*3]<<8),b,p+(cs[L+P*3+2]<<8),f+Nc[P],d+Vd[P],v,w,S,3);ko(o,A,!1,a)}}}var Ng=new Map;function CA(i,t,e,n,s,r){let a,o;switch(i){case 0:a=1-n,o=1-e;break;case 1:a=n,o=1-e;break;case 2:a=t,o=n;break;case 3:a=t,o=1-n;break;case 4:a=t,o=1-e;break;default:a=1-t,o=1-e}s[r]=Math.min(16,Math.max(0,a*16)),s[r+1]=Math.min(16,Math.max(0,o*16))}var ln=1e-5;function kA(i,t,e){let n=i[t].box,s=Fc[e],r=(e&1)===0,a=r?n[s+3]:n[s],o=(s+1)%3,l=(s+2)%3;for(let c=0;c<i.length;c++){if(c===t)continue;let h=i[c];if(h.rotate)continue;let u=!0;for(let g=0;g<6;g++)if(!(h.tex[g]>=0)){u=!1;break}if(!u)continue;let f=h.box;if(!(f[3]-f[0]<=ln||f[4]-f[1]<=ln||f[5]-f[2]<=ln||!(r?f[s]<=a+ln&&f[s+3]>a+ln:f[s]<a-ln&&f[s+3]>=a-ln))&&f[o]<=n[o]+ln&&f[o+3]>=n[o+3]-ln&&f[l]<=n[l]+ln&&f[l+3]>=n[l+3]-ln)return!0}return!1}function RA(i,t){let e=Math.cos(t.angle),n=Math.sin(t.angle),[s,r,a]=t.origin;for(let o=0;o<4;o++){let l=i[o*3]-s,c=i[o*3+1]-r,h=i[o*3+2]-a,u=l,f=c,d=h;t.axis==="x"?(f=c*e-h*n,d=c*n+h*e):t.axis==="y"?(u=l*e+h*n,d=-l*n+h*e):(u=l*e-c*n,f=l*n+c*e),i[o*3]=u+s,i[o*3+1]=f+r,i[o*3+2]=d+a}}function LA(i,t){let e=jt[t],n=[],s=new Float32Array(8);for(let r=0;r<i.length;r++){let a=i[r],o=a.box;for(let l=0;l<6;l++){let c=a.tex[l];if(!(c>=0))continue;let h=Fc[l],u=(h+1)%3,f=(h+2)%3;if(o[u+3]-o[u]<=ln||o[f+3]-o[f]<=ln||!a.rotate&&kA(i,r,l))continue;let d=new Float32Array(12);for(let k=0;k<4;k++){for(let U=0;U<3;U++)d[k*3+U]=kr[l][k][U]?o[U+3]:o[U];CA(l,d[k*3],d[k*3+1],d[k*3+2],s,k*2)}let g=a.uv?a.uv[l]:null;g&&(s[0]=g[0],s[1]=g[3],s[2]=g[2],s[3]=g[3],s[4]=g[2],s[5]=g[1],s[6]=g[0],s[7]=g[1]);let b=(c&31)<<4,p=c>>5<<4,m=new Uint16Array(8);for(let k=0;k<4;k++)m[k*2]=b+Math.round(s[k*2]),m[k*2+1]=p+Math.round(s[k*2+1]);let _=l,y=!0;if(a.rotate){RA(d,a.rotate);let k=d[3]-d[0],U=d[4]-d[1],N=d[5]-d[2],D=d[9]-d[0],z=d[10]-d[1],$=d[11]-d[2],nt=U*$-N*z,et=N*D-k*$,rt=k*z-U*D,bt=Math.hypot(nt,et,rt)||1,G=Math.abs(nt),tt=Math.abs(et),at=Math.abs(rt);if(G>=tt&&G>=at?_=nt>0?0:1:tt>=at?_=et>0?2:3:_=rt>0?4:5,y=Math.max(G,tt,at)/bt>.9999,y)for(let Q=0;Q<12;Q++)d[Q]=Math.round(d[Q]*4096)/4096}let v=-1,w=Fc[_];if(y){let k=d[w];(_&1?Math.abs(k)<ln:Math.abs(k-1)<ln)&&(v=_)}let S=1,A=0;for(let k=0;k<4;k++)S=Math.min(S,d[k*3+1]),A=Math.max(A,d[k*3+1]);let L=new Float32Array(16),P=Gg[_],M=Wg[_],T=kr[_][0][P],I=kr[_][0][M];for(let k=0;k<4;k++){let U=Math.min(1,Math.max(0,Math.abs(d[k*3+P]-T))),N=Math.min(1,Math.max(0,Math.abs(d[k*3+M]-I)));L[k*4]=(1-U)*(1-N),L[k*4+1]=U*(1-N),L[k*4+2]=U*N,L[k*4+3]=(1-U)*N}let F=0;v>=0&&(e===gA||e===bA?F=2:(e===yA||e===_A)&&(v===2||v===3)&&(F=1)),n.push({p:d,uv:m,w:L,face:_,bface:v,rb0:S,rb1:A,shade:a.shade===!1?1:Oc[_],smooth:a.ao!==!1&&y,cullSame:F})}}return n}var Pa=new Float32Array(48),Ia=new Float32Array(48),Da=new Float32Array(48),Ua=new Float32Array(48),Bg=new Int32Array(12),Gd=0;function PA(i,t,e,n,s,r,a){Xg=n;let o=Ag(s,xA),l=a===mA&&!Lr?Dc(i,t,e,jd(i,e))&3:0,c=s+o*65536+l*33554432,h=Ng.get(c);if(h||(h=LA(Rg(s,o,l),r),Ng.set(c,h)),!h.length)return;let u=Ro[nn[r]];Jd(r,i,e),Gd++;let f=nr[r];for(let d=0;d<h.length;d++){let g=h[d],b=n;if(g.bface>=0){let I=n+Xd[g.bface],F=ci[I];if(Vn[F]&qd[g.bface])continue;if(F!==0){let k=F&1023;if(g.bface!==2&&g.bface!==3){let U=Fs[F];if(U&&g.rb0>=cA[U]-ln&&g.rb1<=hA[U]+ln)continue}if(k===r&&pl[r]||g.cullSame===1&&k===r||g.cullSame===2&&jt[k]===a&&nr[k]===f)continue}b=I}let p=g.face,m=Kd&&g.smooth,_=(p*2+(g.bface>=0?1:0))*4;if(m&&Bg[_>>2]!==Gd){Bg[_>>2]=Gd,qg(b,p);for(let I=0;I<4;I++)Pa[_+I]=ri[I],Ia[_+I]=oi[I],Da[_+I]=Og[ai[I]],Ua[_+I]=ai[I]*64+ri[I]+oi[I]}let y=li[b],v=(y>>4)*17,w=(y&15)*17;u.reserve(4,6);let S=u.vc,A=g.shade*255,L=g.w,P=g.p,M=0,T=0;for(let I=0;I<4;I++){let F=v,k=w,U=1;if(m){let N=L[I*4],D=L[I*4+1],z=L[I*4+2],$=L[I*4+3];F=Pa[_]*N+Pa[_+1]*D+Pa[_+2]*z+Pa[_+3]*$,k=Ia[_]*N+Ia[_+1]*D+Ia[_+2]*z+Ia[_+3]*$,U=Da[_]*N+Da[_+1]*D+Da[_+2]*z+Da[_+3]*$;let nt=Ua[_]*N+Ua[_+1]*D+Ua[_+2]*z+Ua[_+3]*$;I===0||I===2?M+=nt:T+=nt}hs(u,Math.round((i+P[I*3])*256),Math.round((t+P[I*3+1])*256),Math.round((e+P[I*3+2])*256),g.uv[I*2],g.uv[I*2+1],F+.5|0,k+.5|0,A*U+.5|0,p)}ko(u,S,M<T,!1)}}function zc(){return{blocks:new Uint16Array(ka),light:new Uint8Array(ka),tint:new Uint8Array(pn*pn*9)}}function Qd(i,t,e,n,s){let r=s.blocks,a=s.light,o=s.tint,l=i.getChunk(t,n);for(let c=-1;c<=1;c++){let h=c<0?-1:c===0?0:16,u=c<0?-1:c===0?15:16;for(let f=-1;f<=1;f++){let d=f<0?-1:f===0?0:16,g=f<0?-1:f===0?15:16,b=f===0&&c===0?l:i.getChunk(t+f,n+c),p=b?b.blocks:null,m=b?b.light:null;for(let _=-1;_<=16;_++){let y=e*16+_;for(let v=h;v<=u;v++){let w=Cc(d,_,v);if(!p||!m||y>255)for(let S=d;S<=g;S++,w++)r[w]=0,a[w]=240;else if(y<0)for(let S=d;S<=g;S++,w++)r[w]=vA,a[w]=0;else{let S=y<<8|(v&15)<<4;for(let A=d;A<=g;A++,w++){let L=S|A&15;r[w]=p[L],a[w]=m[L]}}}}for(let _=h;_<=u;_++)for(let y=d;y<=g;y++){let v=Ra(y,_)*9,w=null,S=0;if(b?(w=b.tint,S=Ta(y&15,_&15)*9):l&&(w=l.tint,S=Ta(Math.min(15,Math.max(0,y)),Math.min(15,Math.max(0,_)))*9),w)for(let A=0;A<9;A++)o[v+A]=w[S+A];else for(let A=0;A<9;A++)o[v+A]=Kg[A]}}}}var Kg=new Uint8Array([...Qn.grass,...Qn.foliage,...Qn.water].map(i=>Math.round(i)));function Zg(i,t,e){ci=i.blocks,li=i.light,gn=i.tint,$g=!!t.fancyLeaves,Kd=!!t.smoothLighting,Lr=e;for(let n of Ro)n.vc=0,n.ic=0}function Jg(i,t,e,n,s){let r=s&1023;if(r===0||r>=vt)return;let a=jt[r];a===uA||a===dA&&(s>>10&3)===2?MA(i,t,e,n,s,r):a===fA?SA(i,t,e,n,r):a===pA?Ug(i,t,e,n,s,r):PA(i,t,e,n,s,r,a),r===$d&&Ug(i,t,e,n,s,Yd)}function jg(){return Ro.map(i=>i.finish())}function Qg(i,t){Zg(i,t,!1);let e=i.blocks;for(let n=0;n<16;n++)for(let s=0;s<16;s++){let r=Cc(0,n,s);for(let a=0;a<16;a++,r++){let o=e[r];o!==0&&Jg(a,n,s,r,o)}}return jg()}var Wd=null;function t1(i){Wd||(Wd=zc());let t=Wd;t.blocks.fill(0),t.light.fill(240);for(let n=0;n<pn*pn;n++)t.tint.set(Kg,n*9);let e=Cc(0,0,0);return t.blocks[e]=i,Zg(t,{fancyLeaves:!0,smoothLighting:!1},!0),Jg(0,0,0,e,i),jg()}var e1=.3,n1=.14,IA=`
attribute float aShade;
attribute vec2 aPix;
uniform vec2 uHandLight;
uniform vec3 uSkyLightColor;
uniform vec3 uBlockLightColor;
uniform float uBrightness;
varying vec2 vPix;
varying vec3 vColor;
${Eo}
void main() {
  vPix = aPix;
  float sb = lightCurve(uHandLight.x);
  float bb = lightCurve(uHandLight.y);
  vec3 blk = vec3(bb, bb * ((bb * 0.6 + 0.4) * 0.6 + 0.4), bb * (bb * bb * 0.6 + 0.4)) * uBlockLightColor;
  vColor = finishLight(sb * uSkyLightColor + blk) * aShade;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,DA=`
precision mediump float;
varying vec2 vPix;
varying vec3 vColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(37.1, 171.7))) * 43758.5453); }
void main() {
  vec2 p = floor(vPix);
  vec3 skin = vec3(0.84, 0.62, 0.47);
  vec3 c = skin * (0.93 + 0.07 * hash(p));
  if (p.y < 3.0) {
    vec3 cloth = vec3(0.24, 0.47, 0.33);
    c = cloth * (0.86 + 0.14 * hash(p + 5.0)) * (p.y > 1.5 ? 0.85 : 1.0);
  }
  gl_FragColor = vec4(c * vColor, 1.0);
}
`;function UA(){let l=[],c=[],h=[],u=[],f=(b,p,m)=>{let _=l.length/3;l.push(...b),c.push(p,p,p,p),h.push(...m),u.push(_,_+1,_+2,_,_+2,_+3)},d=[0,12,4,12,4,0,0,0];f([.125,-.75,.125,.125,-.75,-.125,.125,0,-.125,.125,0,.125],.6,d),f([-.125,-.75,-.125,-.125,-.75,.125,-.125,0,.125,-.125,0,-.125],.6,d),f([-.125,-.75,.125,.125,-.75,.125,.125,0,.125,-.125,0,.125],.8,d),f([.125,-.75,-.125,-.125,-.75,-.125,-.125,0,-.125,.125,0,-.125],.8,d),f([-.125,0,.125,.125,0,.125,.125,0,-.125,-.125,0,-.125],1,[0,0,4,0,4,2,0,2]),f([-.125,-.75,-.125,.125,-.75,-.125,.125,-.75,.125,-.125,-.75,.125],.5,[0,11,4,11,4,12,0,12]);let g=new Re;return g.setAttribute("position",new Vt(new Float32Array(l),3)),g.setAttribute("aShade",new Vt(new Float32Array(c),1)),g.setAttribute("aPix",new Vt(new Float32Array(h),2)),g.setIndex(u),g.computeBoundingSphere(),g}var Hc=class{constructor(t){this.scene=new wo;this.camera=new rn(70,1,.05,10);this.root=new En;this.pivot=new En;this.item=new En;this.current=-1;this.pending=0;this.equip=1;this.lowering=!1;this.swingT=-1;this.lagYaw=0;this.lagPitch=0;this.lagInit=!1;this.lightCur=new qt(1,0);this.mats=og(t),this.light=this.mats.light,this.armMat=new Ee({name:"hand-arm",uniforms:{...t,uHandLight:this.light},vertexShader:IA,fragmentShader:DA,side:fn}),this.arm=new _e(UA(),this.armMat),this.scene.add(this.root),this.root.add(this.pivot),this.pivot.add(this.item),this.pivot.add(this.arm),this.scene.matrixWorldAutoUpdate=!0,this.setBlock(0)}setBlock(t){let e=wn(t);if(this.current===-1){this.apply(e);return}e===this.current&&!this.lowering||(this.pending=e,this.lowering=!0)}swing(){(this.swingT<0||this.swingT>e1*.5)&&(this.swingT=0)}apply(t){var n;this.current=t;for(let s of this.item.children.slice()){let r=s;r.geometry.dispose(),this.item.remove(r)}if(this.arm.visible=t===0,this.item.visible=t!==0,!t)return;let e=null;try{e=t1(t)}catch(s){console.warn("[hand] meshBlockItem failed",s)}if(e)for(let s=0;s<e.length;s++){let r=e[s];if(!r||!r.indexCount)continue;let a=new _e(Mc(r,null),(n=this.mats.byLayer[s])!=null?n:this.mats.byLayer[0]);a.scale.setScalar(1/256),a.position.set(-.5,-.5,-.5),a.renderOrder=s,a.frustumCulled=!1,this.item.add(a)}}update(t){let e=Math.min(.1,Math.max(0,t.dt));this.camera.aspect!==t.aspect&&(this.camera.aspect=t.aspect,this.camera.updateProjectionMatrix());let n=1-Math.exp(-e*12);this.lightCur.x+=(t.light.sky/15-this.lightCur.x)*n,this.lightCur.y+=(t.light.block/15-this.lightCur.y)*n,this.light.value.copy(this.lightCur),this.lowering?(this.equip-=e/n1,this.equip<=0&&(this.equip=0,this.lowering=!1,this.apply(this.pending))):this.equip<1&&(this.equip=Math.min(1,this.equip+e/n1));let s=0;this.swingT>=0&&(this.swingT+=e,s=this.swingT/e1,s>=1&&(this.swingT=-1,s=0)),this.lagInit||(this.lagYaw=t.yaw,this.lagPitch=t.pitch,this.lagInit=!0);let r=t.yaw-this.lagYaw;r=Math.atan2(Math.sin(r),Math.cos(r));let a=1-Math.exp(-e*14);this.lagYaw+=r*a,this.lagPitch+=(t.pitch-this.lagPitch)*a;let o=Math.max(-.12,Math.min(.12,(t.pitch-this.lagPitch)*.6)),l=Math.max(-.12,Math.min(.12,r*.6)),c=t.bob.phase*Math.PI,h=t.bob.amount;this.root.position.set(Math.sin(c)*h*.5*.6,-Math.abs(Math.cos(c)*h)*.6,0),this.root.rotation.set(o,l,Math.sin(c)*h*.05);let u=Math.sqrt(s),f=Math.sin(u*Math.PI),d=Math.sin(s*s*Math.PI),g=(1-this.equip)*-.6,b=this.pivot;this.current?(b.position.set(.5-.4*f,-.44+g+.2*Math.sin(u*Math.PI*2),-.8-.2*Math.sin(s*Math.PI)),b.rotation.set(.12-f*1.3,-d*.35,-f*.35,"YXZ"),this.item.position.set(0,0,0),this.item.rotation.set(0,Math.PI/4,0),this.item.scale.setScalar(.3)):(b.position.set(.5-.3*f,-.42+g+.12*Math.sin(u*Math.PI*2),-.62-.35*Math.sin(s*Math.PI)),b.rotation.set(0-f*.9,.1+d*.3,0,"YXZ"),this.arm.position.set(.08,.38,.32),this.arm.rotation.set(-1.95,.35,.28,"XYZ"))}render(t){t.clearDepth(),t.render(this.scene,this.camera)}dispose(){for(let t of this.item.children)t.geometry.dispose();this.arm.geometry.dispose(),this.armMat.dispose(),this.mats.dispose()}};var NA=.002,BA=`
attribute vec3 aA;
attribute vec3 aB;
attribute vec2 aCorner;   // x: 0 = start, 1 = end; y: side -1 / 1
uniform vec2 uResolution;
uniform float uWidth;
uniform float uNear;
void main() {
  vec4 a = modelViewMatrix * vec4(aA, 1.0);
  vec4 b = modelViewMatrix * vec4(aB, 1.0);
  float nz = -uNear * 1.05;
  if (a.z > nz && b.z > nz) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  if (a.z > nz) a = mix(a, b, (a.z - nz) / (a.z - b.z));
  if (b.z > nz) b = mix(b, a, (b.z - nz) / (b.z - a.z));
  vec4 ca = projectionMatrix * a;
  vec4 cb = projectionMatrix * b;
  vec2 sa = ca.xy / ca.w * uResolution * 0.5;
  vec2 sb = cb.xy / cb.w * uResolution * 0.5;
  vec2 dir = sb - sa;
  float len = length(dir);
  dir = len > 0.0001 ? dir / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  vec4 c = aCorner.x < 0.5 ? ca : cb;
  vec2 off = (nrm * aCorner.y + dir * (aCorner.x < 0.5 ? -1.0 : 1.0)) * uWidth * 0.5;
  c.xy += off / uResolution * 2.0 * c.w;
  c.z -= 0.0004 * c.w;
  gl_Position = c;
}
`,FA=`
precision mediump float;
uniform vec4 uColor;
void main() { gl_FragColor = uColor; }
`;function OA(i,t=NA){let e=i.map(o=>[o[0]-t,o[1]-t,o[2]-t,o[3]+t,o[4]+t,o[5]+t]),n=o=>{for(let l of e)if(o[0]>l[0]&&o[0]<l[3]&&o[1]>l[1]&&o[1]<l[4]&&o[2]>l[2]&&o[2]<l[5])return!0;return!1},s=[],r=new Set,a=1e-4;for(let o=0;o<3;o++){let l=(o+1)%3,c=(o+2)%3,h=new Set;for(let g of e)h.add(g[o]),h.add(g[o+3]);let u=Array.from(h).sort((g,b)=>g-b),f=new Set,d=new Set;for(let g of e)f.add(g[l]),f.add(g[l+3]),d.add(g[c]),d.add(g[c+3]);for(let g of f)for(let b of d){let p=NaN,m=NaN,_=()=>{if(p===p){let y=`${o}:${g}:${b}:${p}`;if(!r.has(y)){r.add(y);let v=[0,0,0],w=[0,0,0];v[o]=p,w[o]=m,v[l]=w[l]=g,v[c]=w[c]=b,s.push(v[0],v[1],v[2],w[0],w[1],w[2])}}p=m=NaN};for(let y=0;y+1<u.length;y++){let v=u[y],w=u[y+1];if(w-v<1e-9)continue;let S=(v+w)/2,A=[0,0,0,0],L=0;for(let T of[-a,a])for(let I of[-a,a]){let F=[0,0,0];F[o]=S,F[l]=g+T,F[c]=b+I,A[L++]=n(F)?1:0}let P=A[0]+A[1]+A[2]+A[3];P===1||P===3||P===2&&A[0]===A[3]?(m===v||(_(),p=v),m=w):_()}_()}}return s}var Gc=class{constructor(){this.lastKey=[];this.lastNull=!0;this.res={value:new qt(1280,720)},this.width={value:2},this.near={value:.05},this.mat=new Ee({name:"highlight",uniforms:{uResolution:this.res,uWidth:this.width,uNear:this.near,uColor:{value:new Float32Array([0,0,0,.45])}},vertexShader:BA,fragmentShader:FA,transparent:!0,depthWrite:!1,side:je}),this.mesh=new _e(new Re,this.mat),this.mesh.frustumCulled=!1,this.mesh.visible=!1,this.mesh.renderOrder=50,this.mesh.matrixAutoUpdate=!1}setResolution(t,e,n){this.res.value.set(t,e),this.width.value=Math.max(1.5,Math.min(4,e/420)),this.near.value=n}set(t,e,n,s){if(!t||t.length===0){this.mesh.visible=!1,this.lastNull=!0;return}let r=this.lastKey,a=!this.lastNull&&r.length===t.length*6+3&&r[0]===e&&r[1]===n&&r[2]===s;if(a){for(let b=0;b<t.length&&a;b++)for(let p=0;p<6;p++)if(r[3+b*6+p]!==t[b][p]){a=!1;break}}if(this.mesh.visible=!0,this.mesh.position.set(e,n,s),this.mesh.updateMatrix(),this.mesh.matrixWorld.copy(this.mesh.matrix),a)return;this.lastNull=!1,r.length=0,r.push(e,n,s);for(let b of t)r.push(b[0],b[1],b[2],b[3],b[4],b[5]);let o=OA(t),l=o.length/6,c=new Float32Array(l*12),h=new Float32Array(l*12),u=new Float32Array(l*8),f=new Uint16Array(l*6),d=[0,-1,0,1,1,1,1,-1];for(let b=0;b<l;b++){for(let m=0;m<4;m++){for(let _=0;_<3;_++)c[(b*4+m)*3+_]=o[b*6+_],h[(b*4+m)*3+_]=o[b*6+3+_];u[(b*4+m)*2]=d[m*2],u[(b*4+m)*2+1]=d[m*2+1]}let p=b*4;f.set([p,p+1,p+2,p,p+2,p+3],b*6)}let g=new Re;g.setAttribute("aA",new Vt(c,3)),g.setAttribute("aB",new Vt(h,3)),g.setAttribute("aCorner",new Vt(u,2)),g.setAttribute("position",new Vt(c,3)),g.setIndex(new Vt(f,1)),this.mesh.geometry.dispose(),this.mesh.geometry=g}dispose(){this.mesh.geometry.dispose(),this.mat.dispose()}};var Wc=5,zA=8*Math.sqrt(3),i1=.05,s1=1024,us=i=>i-Math.floor(i/s1)*s1;var Vc=class{constructor(t,e,n){this.scene=new wo;this.layerGroups=[];this.sections=new Map;this.columns=new Map;this.frustum=new xo;this.projScreen=new ve;this.sphere=new Ui(new V,zA);this.fogFar=64;this.visibleSections=0;this.shotQueue=[];this.shadowRT=null;this.shadowCam=new wa(-64,64,64,-64,.5,320);this.shadowRadius=64;this.white=new Nt(1,1,1);this.tmpV=new V;this.tmpM=new ve;this.flicker=1;this.flickerTarget=1;this.flickerT=0;this.lastFov=-1;this.lastAspect=-1;this.disposed=!1;var c,h;this.canvas=t,this.atlas=e,this.settings={...n};let s=console.warn;console.warn=(...u)=>{typeof u[0]=="string"&&u[0].includes("WebGL 1 support was deprecated")||s.apply(console,u)};try{this.gl=new Ma({canvas:t,antialias:!1,alpha:!1,depth:!0,stencil:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1,premultipliedAlpha:!0})}finally{console.warn=s}let r=this.gl;r.outputColorSpace=Ni,r.autoClear=!1,r.info.autoReset=!1,r.sortObjects=!0,r.shadowMap.enabled=!1;let a=r.getContext(),o=String((c=a.getParameter(a.RENDERER))!=null?c:"unknown"),l=String((h=a.getParameter(a.VENDOR))!=null?h:"unknown");try{let u=a.getExtension("WEBGL_debug_renderer_info");if(u){let f=a.getParameter(u.UNMASKED_RENDERER_WEBGL),d=a.getParameter(u.UNMASKED_VENDOR_WEBGL);f&&(o=String(f)),d&&(l=String(d))}}catch{}this.info={webgl2:r.capabilities.isWebGL2,renderer:o,vendor:l},this.camera=new rn(n.fov,1,i1,400),this.camera.rotation.order="YXZ",this.mats=rg(e),this.scene.matrixWorldAutoUpdate=!0;for(let u=0;u<Wc;u++){let f=new En;f.name=`layer${u}`,f.matrixAutoUpdate=!1,this.layerGroups.push(f),this.scene.add(f)}this.sky=new Ac(this.scene,this.mats.uniforms),this.particles=new Tc(this.mats.uniforms),this.scene.add(this.particles.mesh),this.highlight=new Gc,this.scene.add(this.highlight.mesh),this.hand=new Hc(this.mats.uniforms),this.applySettings(n),this.resize()}setSection(t,e,n,s){var l;let r=mn(t,e,n),a=this.sections.get(r);if(!s||!s.some(c=>c&&c.indexCount>0)){a&&this.dropSection(r,a);return}if(!a){a={cx:t,sy:e,cz:n,wx:t*16+8,wy:e*16+8,wz:n*16+8,meshes:[null,null,null,null,null],visible:!0},this.sections.set(r,a);let c=xe(t,n),h=this.columns.get(c);h||(h=new Set,this.columns.set(c,h)),h.add(r)}for(let c=0;c<Wc;c++){let h=(l=s[c])!=null?l:null,u=a.meshes[c];if(!h||h.indexCount===0){u&&(u.geometry.dispose(),this.layerGroups[c].remove(u),a.meshes[c]=null);continue}let f=Mc(h);if(u)u.geometry.dispose(),u.geometry=f;else{let d=new _e(f,this.mats.byLayer[c]);d.matrixAutoUpdate=!1,d.matrixWorldAutoUpdate=!1,d.frustumCulled=!1,d.position.set(t*16,e*16,n*16),d.scale.setScalar(1/256),d.updateMatrix(),d.matrixWorld.copy(d.matrix),d.visible=a.visible,this.layerGroups[c].add(d),a.meshes[c]=d}}}dropSection(t,e){for(let r=0;r<Wc;r++){let a=e.meshes[r];a&&(a.geometry.dispose(),this.layerGroups[r].remove(a))}this.sections.delete(t);let n=xe(e.cx,e.cz),s=this.columns.get(n);s&&(s.delete(t),s.size||this.columns.delete(n))}removeColumn(t,e){let n=xe(t,e),s=this.columns.get(n);if(s){for(let r of Array.from(s)){let a=this.sections.get(r);a&&this.dropSection(r,a)}this.columns.delete(n)}}clear(){for(let[t,e]of Array.from(this.sections))this.dropSection(t,e);this.sections.clear(),this.columns.clear(),this.particles.clear(),this.highlight.set(null,0,0,0)}applySettings(t){this.settings={...t};let e=this.mats.uniforms;this.fogFar=Math.max(2,t.renderDistance)*16,e.uBrightness.value=Math.min(1,Math.max(0,t.brightness));let n=Math.min(320,Math.max(160,this.fogFar*2));this.sky.setClouds(t.clouds,n),this.camera.far=Math.max(this.fogFar*1.25+32,n+140),this.lastFov=-1,this.mats.setWaving(!!t.waving),this.setShadows(!!t.shadows,t.shadowQuality||2048),Ld(this.atlas,!!t.mipmaps),this.resize()}setShadows(t,e){var n;if(t){if(!this.shadowRT||this.shadowRT.width!==e){(n=this.shadowRT)==null||n.dispose();let s=new gi(e,e,{format:An,type:ii,minFilter:ke,magFilter:ke,wrapS:on,wrapT:on,depthBuffer:!0,stencilBuffer:!1,generateMipmaps:!1});s.texture.name="shadow",this.shadowRT=s}this.shadowRadius=Math.min(64,Math.max(32,this.fogFar*.75)),this.mats.uniforms.uShadowMap.value=this.shadowRT.texture,this.mats.uniforms.uShadowTexel.value=1/e}else this.shadowRT&&(this.shadowRT.dispose(),this.shadowRT=null,this.mats.uniforms.uShadowMap.value=null);this.mats.setShadows(t)}resize(){let t=Math.max(1,Math.floor(window.innerWidth||this.canvas.clientWidth||1)),e=Math.max(1,Math.floor(window.innerHeight||this.canvas.clientHeight||1)),n=Math.min(window.devicePixelRatio||1,2)*Math.min(1,Math.max(.25,this.settings.resolutionScale||1));this.gl.setPixelRatio(n),this.gl.setSize(t,e,!0),this.camera.aspect=t/e,this.camera.updateProjectionMatrix();let s=this.gl.getContext();this.highlight.setResolution(s.drawingBufferWidth,s.drawingBufferHeight,i1),this.sky.setPixelRatio(n)}setHighlight(t,e,n,s){this.highlight.set(t,e,n,s)}breakParticles(t,e,n,s){this.particles.spawnBreak(t,e,n,s)}setParticleCollider(t){this.particles.setCollider(t)}setHeldBlock(t){this.hand.setBlock(t)}swing(){this.hand.swing()}render(t){if(this.disposed)return;let e=this.gl,n=this.mats.uniforms,s=this.camera;e.info.reset(),s.position.set(t.eye.x,t.eye.y,t.eye.z),s.rotation.set(t.pitch,t.yaw,0,"YXZ");let r=t.bob.amount||0;if(r>0){let f=t.bob.phase*Math.PI;s.updateMatrix(),s.translateX(Math.sin(f)*r*.5),s.translateY(-Math.abs(Math.cos(f)*r)),s.rotation.z=-Math.sin(f)*r*3*Math.PI/180,s.rotation.x=t.pitch-Math.abs(Math.cos(f-.2)*r)*5*Math.PI/180}(t.fov!==this.lastFov||s.aspect!==this.lastAspect)&&(s.fov=t.fov,s.updateProjectionMatrix(),this.lastFov=t.fov,this.lastAspect=s.aspect),s.updateMatrixWorld(!0),n.uTime.value=t.time%14400,this.flickerT-=t.dt,this.flickerT<=0&&(this.flickerT=.08+Math.random()*.12,this.flickerTarget=.96+Math.random()*.06),this.flicker+=(this.flickerTarget-this.flicker)*Math.min(1,t.dt*10),n.uBlockLightColor.value.setRGB(this.flicker,this.flicker*.995,this.flicker*.985);let a=this.sky.update(t.dayTime,t.time,s.position),o=n.uFogColor.value;if(t.inLava)this.overrideFog(.62,.12,.01,0,1.6),n.uUnderwater.value=0,this.sky.setHidden(!0);else if(t.underwater){let f=Math.min(1,Math.max(0,t.handLight.sky/15)),d=.2+.8*Math.max(a.daylight*f,t.handLight.block/30);this.overrideFog(.07*d,.19*d,.42*d,0,12+22*a.daylight*f),n.uUnderwater.value=1,this.sky.setHidden(!0)}else n.uFogNear.value=this.fogFar*.62,n.uFogFar.value=this.fogFar*.98,n.uUnderwater.value=0,this.sky.setHidden(!1);n.uCamWrap.value.set(us(s.position.x),us(s.position.y),us(s.position.z));let l=Math.floor(s.position.x),c=Math.floor(s.position.y),h=Math.floor(s.position.z);this.particles.setLight(t.handLight.sky,t.handLight.block),this.particles.update(t.dt,l,c,h),this.hand.update({dt:t.dt,aspect:s.aspect,yaw:t.yaw,pitch:t.pitch,bob:t.bob,light:t.handLight});let u=!!this.shadowRT&&n.uShadowStrength.value>.001&&!t.underwater&&!t.inLava;this.shadowRT&&!u&&(n.uShadowStrength.value=0),u&&this.renderShadows(s.position),this.cull(s,!0),e.setRenderTarget(null),e.setClearColor(o,1),e.clear(!0,!0,!1),e.render(this.scene,s),t.showHand&&this.hand.render(e),this.shotQueue.length&&this.capture()}overrideFog(t,e,n,s,r){let a=this.mats.uniforms;for(let o of["uFogColor","uSkyTop","uSkyHorizon"])a[o].value.setRGB(t,e,n);a.uGlow.value=0,a.uFogNear.value=s,a.uFogFar.value=r}cull(t,e){this.projScreen.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this.frustum.setFromProjectionMatrix(this.projScreen);let n=this.camera.position.x,s=this.camera.position.z,r=this.fogFar+12,a=r*r,o=0,l=this.sphere;for(let c of this.sections.values()){let h=!0;if(e){let u=c.wx-n,f=c.wz-s;h=u*u+f*f<=a}if(h&&(l.center.set(c.wx,c.wy,c.wz),h=this.frustum.intersectsSphere(l)),h!==c.visible){c.visible=h;for(let u=0;u<Wc;u++){let f=c.meshes[u];f&&(f.visible=h)}}h&&o++}e&&(this.visibleSections=o)}renderShadows(t){let e=this.gl,n=this.mats.uniforms,s=this.shadowRT,r=n.uLightDir.value,a=this.shadowRadius,o=160,l=this.shadowCam;l.left=-a,l.right=a,l.top=a,l.bottom=-a,l.near=1,l.far=o*2,l.updateProjectionMatrix();let c=Math.abs(r.y)>.99?this.tmpV.set(0,0,-1):this.tmpV.set(0,1,0);l.up.copy(c),l.position.set(0,0,0),l.lookAt(-r.x,-r.y,-r.z),l.updateMatrixWorld(!0);let h=2*a/s.width,u=new V().setFromMatrixColumn(l.matrixWorld,0),f=new V().setFromMatrixColumn(l.matrixWorld,1),d=new V().setFromMatrixColumn(l.matrixWorld,2),g=t.x*u.x+t.y*u.y+t.z*u.z,b=t.x*f.x+t.y*f.y+t.z*f.z,p=t.x*d.x+t.y*d.y+t.z*d.z,m=Math.floor(g/h)*h,_=Math.floor(b/h)*h,y=new V().addScaledVector(u,m).addScaledVector(f,_).addScaledVector(d,p);l.position.copy(y).addScaledVector(r,o),l.updateMatrixWorld(!0);let v=this.tmpM.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);n.uShadowMatrix.value.multiplyMatrices(v,l.projectionMatrix).multiply(l.matrixWorldInverse).multiply(new ve().makeTranslation(this.camera.position.x,this.camera.position.y,this.camera.position.z)),n.uShadowBias.value=.03/(l.far-l.near);let S=[...this.sky.objects,this.particles.mesh,this.highlight.mesh,this.layerGroups[2],this.layerGroups[3],this.layerGroups[4]],A=S.map(M=>M.visible);for(let M of S)M.visible=!1;let L=(M,T)=>{for(let I of M.children)I.material=T};L(this.layerGroups[0],this.mats.depth.opaque),L(this.layerGroups[1],this.mats.depth.cutout),this.cull(l,!1),n.uCamWrap.value.set(us(l.position.x),us(l.position.y),us(l.position.z)),e.setRenderTarget(s),e.setClearColor(this.white,1),e.clear(!0,!0,!1),e.render(this.scene,l),e.setRenderTarget(null),L(this.layerGroups[0],this.mats.opaque),L(this.layerGroups[1],this.mats.cutout),S.forEach((M,T)=>{M.visible=A[T]});let P=this.camera.position;n.uCamWrap.value.set(us(P.x),us(P.y),us(P.z))}screenshot(){return new Promise((t,e)=>{this.shotQueue.push({resolve:t,reject:e})})}capture(){let t=this.shotQueue.splice(0);try{this.canvas.toBlob(e=>{for(let n of t)e?n.resolve(e):n.reject(new Error("toBlob failed"))},"image/png")}catch(e){for(let n of t)n.reject(e)}}stats(){let t=this.gl.info.render;return{drawCalls:t.calls,triangles:t.triangles,sections:this.sections.size,visibleSections:this.visibleSections}}get three(){return this.gl}dispose(){var t;if(!this.disposed){this.disposed=!0,this.clear(),this.sky.dispose(),this.particles.dispose(),this.highlight.dispose(),this.hand.dispose(),this.mats.dispose(),(t=this.shadowRT)==null||t.dispose(),this.gl.dispose();for(let e of this.shotQueue.splice(0))e.reject(new Error("renderer disposed"))}}};var HA=new Set(["Tab","Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Slash","Quote","Backspace"]),GA=new Set(["KeyA","KeyB","KeyD","KeyE","KeyF","KeyG","KeyH","KeyJ","KeyK","KeyL","KeyO","KeyP","KeyQ","KeyS","KeyU","KeyW","KeyY","KeyZ","Space","Equal","Minus","NumpadAdd","NumpadSubtract","Digit0","Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9"]),WA=new Set(["button","checkbox","radio","range","submit","reset","color","file","image"]),tf=1300,r1=500;function VA(i){let t=i;if(!t||typeof t.tagName!="string")return!1;let e=t.tagName;return e==="TEXTAREA"||e==="SELECT"?!0:e==="INPUT"?!WA.has(t.type):t.isContentEditable===!0}function o1(i){let t=i;if(!t||typeof t.tagName!="string")return!1;let e=t.tagName;return e==="BUTTON"||e==="INPUT"||e==="SELECT"||e==="TEXTAREA"||e==="A"||t.isContentEditable===!0}function a1(i){if(i.code)return i.code;let t=i.key;if(!t)return"";if(t===" ")return"Space";if(t.length===1){let e=t.toUpperCase();if(e>="A"&&e<="Z")return"Key"+e;if(e>="0"&&e<="9")return"Digit"+e}return t==="Shift"?"ShiftLeft":t==="Control"?"ControlLeft":t==="Alt"?"AltLeft":t==="Esc"?"Escape":t}var l1=i=>new Promise(t=>setTimeout(t,i)),za=()=>typeof performance!="undefined"?performance.now():Date.now(),$c=class{constructor(t){this.mouseDX=0;this.mouseDY=0;this.wheel=0;this.buttons=[!1,!1,!1];this.clicked=[!1,!1,!1];this.onLockChange=null;this.onKey=null;this.lastLockError=null;this._enabled=!0;this._virtualLock=!1;this.held=new Set;this.edges=new Set;this.wasLocked=!1;this.selfExit=!1;this.userExitAt=-1e9;this.anyExitAt=-1e9;this.lockedAt=-1e9;this.lastMoveAt=-1e9;this.lastMoveMag=0;this.wheelAcc=0;this.wheelAt=0;this.unadjusted=null;this.pending=null;this.onLockEvent=()=>{var n;let t=document.pointerLockElement===this.target;if(t===this.wasLocked)return;this.wasLocked=t;let e=za();t?(this.lockedAt=e,this.lastMoveMag=0,this.clearMouse()):(this.anyExitAt=e,this.selfExit||(this.userExitAt=e),this.selfExit=!1,this.buttons[0]=this.buttons[1]=this.buttons[2]=!1),this._virtualLock||(n=this.onLockChange)==null||n.call(this,t)};this.onKeyDown=t=>{let e=a1(t);if(!e)return;let n=VA(t.target);n||this.held.has(e)||(this.held.add(e),this._enabled&&!t.repeat&&this.edges.add(e));let s=this._enabled||this.locked;e==="F1"||e==="F2"||e==="F3"?t.preventDefault():n||((s&&HA.has(e)||!s&&(e==="Space"||e.startsWith("Arrow"))&&!o1(t.target))&&t.preventDefault(),s&&(t.ctrlKey||t.metaKey)&&GA.has(e)&&t.preventDefault()),!t.repeat&&this.onKey&&this.onKey(e,t)};this.onKeyUp=t=>{let e=a1(t);this.held.delete(e),(e==="MetaLeft"||e==="MetaRight")&&this.held.clear()};this.releaseAll=()=>{this.held.clear(),this.edges.clear(),this.buttons[0]=this.buttons[1]=this.buttons[2]=!1};this.onMouseDown=t=>{t.button===1&&t.preventDefault(),!(t.button<0||t.button>2)&&(!this._enabled||document.pointerLockElement!==this.target||(this.buttons[t.button]=!0,this.clicked[t.button]=!0))};this.onMouseUp=t=>{t.button>=0&&t.button<=2&&(this.buttons[t.button]=!1)};this.onMouseMove=t=>{if(document.pointerLockElement!==this.target||!this._enabled)return;let e=t.movementX||0,n=t.movementY||0,s=za(),r=Math.max(Math.abs(e),Math.abs(n));if(r>r1){let a=s-this.lockedAt<400,o=s-this.lastMoveAt>50||this.lastMoveMag<r1*.25;if(a||o){this.lastMoveAt=s,this.lastMoveMag=0;return}}this.lastMoveAt=s,this.lastMoveMag=r,this.mouseDX+=e,this.mouseDY+=n};this.onWheel=t=>{if(t.ctrlKey&&t.preventDefault(),!this._enabled||!this.locked)return;t.preventDefault();let e=t.deltaY;if(!e)return;if(t.deltaMode===1){this.wheel+=Math.sign(e)*Math.max(1,Math.round(Math.abs(e)/3));return}if(t.deltaMode===2){this.wheel+=Math.sign(e);return}let n=za();if(Math.abs(e)>=50)this.wheel+=Math.sign(e)*Math.max(1,Math.round(Math.abs(e)/100)),this.wheelAcc=0;else for((n-this.wheelAt>250||Math.sign(this.wheelAcc)!==Math.sign(e))&&(this.wheelAcc=0),this.wheelAcc+=e;Math.abs(this.wheelAcc)>=50;){let s=Math.sign(this.wheelAcc);this.wheel+=s,this.wheelAcc-=s*50}this.wheelAt=n};this.target=t,window.addEventListener("keydown",this.onKeyDown),window.addEventListener("keyup",this.onKeyUp),window.addEventListener("blur",this.releaseAll),document.addEventListener("visibilitychange",()=>{document.hidden&&this.releaseAll()}),t.addEventListener("mousedown",this.onMouseDown),window.addEventListener("mouseup",this.onMouseUp),document.addEventListener("mousemove",this.onMouseMove),window.addEventListener("wheel",this.onWheel,{passive:!1}),t.addEventListener("contextmenu",e=>e.preventDefault()),document.addEventListener("contextmenu",e=>{(this.locked||this._enabled&&e.target===t)&&e.preventDefault()}),t.addEventListener("auxclick",e=>{e.button===1&&e.preventDefault()}),window.addEventListener("mousedown",e=>{e.button===1&&(this.locked||e.target===t||!o1(e.target))&&e.preventDefault()}),document.addEventListener("pointerlockchange",this.onLockEvent),document.addEventListener("pointerlockerror",()=>{this.lastLockError="pointerlockerror"})}get enabled(){return this._enabled}set enabled(t){t!==this._enabled&&(this._enabled=t,this.edges.clear(),this.clearMouse())}get locked(){return this._virtualLock||typeof document!="undefined"&&document.pointerLockElement===this.target}get virtualLock(){return this._virtualLock}set virtualLock(t){var n;if(t===this._virtualLock)return;let e=this.locked;this._virtualLock=t,this.locked!==e&&((n=this.onLockChange)==null||n.call(this,this.locked))}down(t){return this._enabled&&this.held.has(t)}pressed(t){return this._enabled&&this.edges.has(t)}requestLock(){if(this.locked)return Promise.resolve(!0);if(this.pending)return this.pending;let t=this.lock().catch(e=>(this.lastLockError=String(e),!1));return this.pending=t,t.then(()=>{this.pending===t&&(this.pending=null)}),t}exitLock(){if(typeof document!="undefined"&&document.pointerLockElement===this.target){this.selfExit=!0;try{document.exitPointerLock()}catch{}}}endFrame(){this.edges.clear(),this.mouseDX=0,this.mouseDY=0,this.wheel=0,this.clicked[0]=this.clicked[1]=this.clicked[2]=!1}async lock(){if(typeof this.target.requestPointerLock!="function")return this.lastLockError="pointer lock unsupported",!1;let e=this.userExitAt+tf-za();if(e>0&&(await l1(e),!this._enabled||this.locked))return this.locked;let n=await this.attempt(this.unadjusted!==!1);if(n==="unsupported"&&(this.unadjusted=!1,n=await this.attempt(!1)),n==="ok")return this.unadjusted===null&&(this.unadjusted=!0),!0;let s=za()-this.anyExitAt;return n==="failed"&&s<tf&&this._enabled?(await l1(tf-s),this._enabled?this.locked?!0:await this.attempt(this.unadjusted!==!1)==="ok":this.locked):this.locked}attempt(t){let e=this.target;return new Promise(n=>{let s=!1,r,a=h=>{s||(s=!0,r!==void 0&&clearTimeout(r),document.removeEventListener("pointerlockchange",o),document.removeEventListener("pointerlockerror",l),n(h))},o=()=>{document.pointerLockElement===e&&a("ok")},l=()=>{this.lastLockError="pointerlockerror",a("failed")};document.addEventListener("pointerlockchange",o),document.addEventListener("pointerlockerror",l),r=setTimeout(()=>a(document.pointerLockElement===e?"ok":"failed"),2e3);let c;try{c=t?e.requestPointerLock({unadjustedMovement:!0}):e.requestPointerLock()}catch(h){this.lastLockError=String(h);let u=h==null?void 0:h.name;a(t&&(u==="NotSupportedError"||h instanceof TypeError)?"unsupported":"failed");return}c&&typeof c.then=="function"&&c.then(()=>a("ok"),h=>{this.lastLockError=String(h);let u=h==null?void 0:h.name;a(t&&u==="NotSupportedError"?"unsupported":"failed")})})}clearMouse(){this.mouseDX=0,this.mouseDY=0,this.wheel=0,this.buttons[0]=this.buttons[1]=this.buttons[2]=!1,this.clicked[0]=this.clicked[1]=this.clicked[2]=!1}};var c1={break:{gain:1,len:1},place:{gain:.8,len:.75},step:{gain:.32,len:.55},use:{gain:.75,len:1},splash:{gain:.8,len:1},click:{gain:.5,len:1}},ef=class{constructor(t,e,n,s,r){this.ctx=t;this.out=e;this.noise=n;this.t0=s;this.rnd=r;this.end=0}noiseBurst(t,e,n,s,r,a,o,l=0){let c=this.ctx,h=this.t0+t,u=a+o*6,f=c.createBufferSource();f.buffer=this.noise;let d=c.createBiquadFilter();d.type=e,d.frequency.setValueAtTime(n,h),l>0&&d.frequency.exponentialRampToValueAtTime(l,h+u),d.Q.value=s;let g=c.createGain();g.gain.setValueAtTime(0,h),g.gain.linearRampToValueAtTime(r,h+Math.max(.001,a)),g.gain.setTargetAtTime(0,h+Math.max(.001,a),o),f.connect(d),d.connect(g),g.connect(this.out);let b=this.rnd()*Math.max(0,this.noise.duration-u-.01);f.start(h,b),f.stop(h+u),this.end=Math.max(this.end,h+u)}tone(t,e,n,s,r,a,o,l=.05){let c=this.ctx,h=this.t0+t,u=a+o*6,f=c.createOscillator();f.type=e,f.frequency.setValueAtTime(Math.max(20,n),h),s!==n&&f.frequency.exponentialRampToValueAtTime(Math.max(20,s),h+Math.max(.005,l));let d=c.createGain();d.gain.setValueAtTime(0,h),d.gain.linearRampToValueAtTime(r,h+Math.max(.001,a)),d.gain.setTargetAtTime(0,h+Math.max(.001,a),o),f.connect(d),d.connect(this.out),f.start(h),f.stop(h+u),this.end=Math.max(this.end,h+u)}grains(t,e,n,s,r,a,o){for(let l=0;l<t;l++){let c=l/t*e+this.rnd()*(e/t),h=s*(.7+this.rnd()*.6);this.noiseBurst(c,n,h,r,a*(.5+this.rnd()*.5),.001,o*(.6+this.rnd()*.8))}}},Xc=class{constructor(){this.ctx=null;this.master=null;this.noise=null;this.volume=.6;this.ends=[];this.offline=!1;this.seed=2654435769;this.listening=!1;this.onGesture=()=>{this.unlock();let t=this.ctx;if(t&&t.state==="running"&&this.listening){this.listening=!1;for(let e of["pointerdown","mousedown","keydown","touchend"])window.removeEventListener(e,this.onGesture,!0)}};if(typeof window!="undefined"){this.listening=!0;for(let t of["pointerdown","mousedown","keydown","touchend"])window.addEventListener(t,this.onGesture,!0)}}unlock(){if(typeof window!="undefined")try{if(!this.ctx){let e=window.AudioContext||window.webkitAudioContext;if(!e)return;this.attach(new e({latencyHint:"interactive"}))}let t=this.ctx;t.state==="suspended"&&typeof t.resume=="function"&&t.resume().catch(()=>{})}catch{}}setVolume(t){this.volume=Math.max(0,Math.min(1,Number.isFinite(t)?t:0)),this.master&&this.ctx&&this.master.gain.setTargetAtTime(this.masterGain(),this.ctx.currentTime,.02)}play(t,e,n){var h;let s=this.ctx;if(!s||!this.master||!this.noise||this.volume<=0||!this.offline&&s.state!=="running")return;let r=s.currentTime;if(this.ends=this.ends.filter(u=>u>r),this.ends.length>=24)return;let a=(n!=null?n:1)*(.92+this.rand()*.16),o=s.createGain(),l=(h=c1[t])!=null?h:c1.place;o.gain.value=l.gain,o.connect(this.master);let c=new ef(s,o,this.noise,r+.005,()=>this.rand());try{this.synth(c,t,e,a,l.len)}catch{}this.ends.push(c.end||r+.2)}attach(t,e){this.ctx=t,this.offline=typeof OfflineAudioContext!="undefined"&&t instanceof OfflineAudioContext;let n=t.createDynamicsCompressor();n.threshold.value=-10,n.knee.value=8,n.ratio.value=4,n.attack.value=.002,n.release.value=.15,n.connect(e!=null?e:t.destination),this.master=t.createGain(),this.master.gain.value=this.masterGain(),this.master.connect(n);let s=Math.floor(t.sampleRate*1.5);this.noise=t.createBuffer(1,s,t.sampleRate);let r=this.noise.getChannelData(0);for(let a=0;a<s;a++)r[a]=this.rand()*2-1}masterGain(){return this.volume*this.volume*.9+this.volume*.1}rand(){let t=this.seed;return t^=t<<13,t>>>=0,t^=t>>>17,t^=t<<5,t>>>=0,this.seed=t,t/4294967296}synth(t,e,n,s,r){let a=()=>this.rand();if(e==="click"){t.tone(0,"square",1100*s,900*s,.18,.001,.012,.02),t.tone(0,"sine",2200*s,2e3*s,.12,.001,.008);return}if(e==="splash"||n==="liquid"){this.splash(t,e,s);return}if(e==="use"){this.useSound(t,n,s);return}let o=e==="break",l=e==="step";switch(n){case"stone":{let c=o?3:l?1:2;for(let h=0;h<c;h++)t.noiseBurst(h*.018+a()*.01,"bandpass",(1700+a()*1300)*s,1.1,.9,.001,.025*r);t.tone(0,"triangle",170*s,70*s,o?.5:.35,.001,.03*r),t.noiseBurst(0,"highpass",5e3*s,.7,.25,.001,.008);break}case"wood":{let c=(210+a()*60)*s;t.tone(0,"triangle",c*1.7,c,.6,.001,.045*r,.03),t.tone(0,"sine",c*2.9,c*2.5,.25,.001,.025*r),t.noiseBurst(0,"bandpass",950*s,2.2,.55,.001,.03*r),o&&(t.tone(.045,"triangle",c*1.4,c*.9,.35,.001,.04),t.grains(4,.08,"highpass",2600*s,.8,.25,.012));break}case"grass":t.grains(o?9:l?4:6,(o?.17:.1)*r,"bandpass",4200*s,.7,.75,.014),t.noiseBurst(0,"highpass",2500*s,.6,.25,.006,.04*r);break;case"gravel":t.grains(o?12:l?5:8,(o?.18:.11)*r,"bandpass",1300*s,1,.85,.016),t.noiseBurst(0,"lowpass",700*s,.7,.35,.004,.05*r);break;case"sand":t.noiseBurst(0,"lowpass",2600*s,.6,.55,.02,.07*r),t.grains(o?5:3,.12*r,"bandpass",2200*s,.7,.3,.02);break;case"glass":if(o){t.noiseBurst(0,"highpass",3800*s,.7,.7,.001,.07);for(let c=0;c<6;c++)t.tone(a()*.07,"sine",(2400+a()*3600)*s,(2300+a()*3400)*s,.16,.001,.06+a()*.1)}else t.noiseBurst(0,"bandpass",3400*s,1.4,.7,.001,.018*r),t.tone(0,"sine",(2600+a()*900)*s,2500*s,l?.08:.14,.001,.05*r),t.tone(0,"triangle",220*s,110*s,.2,.001,.02);break;case"wool":t.noiseBurst(0,"lowpass",520*s,.8,.9,.008,.05*r),t.tone(0,"sine",110*s,70*s,.35,.004,.04*r);break;case"metal":{let c=(o?700:1150)*s*(.95+a()*.1);t.tone(0,"sine",c,c,.32,.001,.16*r),t.tone(0,"sine",c*2.76,c*2.76,.18,.001,.08*r),t.tone(0,"sine",c*5.4,c*5.4,.08,.001,.04*r),t.noiseBurst(0,"highpass",5e3*s,.7,.35,.001,.01),o&&t.tone(.03,"triangle",c*.5,c*.45,.25,.001,.08);break}case"snow":t.grains(o?7:l?3:5,.12*r,"lowpass",1500*s,.7,.6,.02),t.noiseBurst(0,"lowpass",900*s,.6,.3,.01,.05*r);break;case"slime":{let c=(180+a()*40)*s;t.tone(0,"sine",c*.7,c*1.6,.5,.005,.06*r,.06),t.tone(.04,"sine",c*1.5,c*.8,.3,.005,.05*r,.05),t.noiseBurst(0,"bandpass",500*s,1.5,.45,.01,.06*r,1600*s);break}default:t.noiseBurst(0,"bandpass",2e3*s,1,.8,.001,.03*r)}}splash(t,e,n){let s=()=>this.rand(),r=e==="step"||e==="place";t.noiseBurst(0,"bandpass",2600*n,.8,r?.5:.85,.01,r?.06:.14,420*n),t.noiseBurst(0,"lowpass",900*n,.6,r?.25:.45,.02,r?.05:.12);let a=r?2:5;for(let o=0;o<a;o++){let l=(350+s()*500)*n;t.tone(.05+s()*.25,"sine",l,l*2.2,.12,.002,.02,.04)}}useSound(t,e,n){if(e==="wood"){let s=(130+this.rand()*30)*n;t.tone(0,"sawtooth",s,s*.8,.09,.03,.06,.2),t.noiseBurst(0,"bandpass",700*n,4,.25,.03,.06),t.tone(.12,"triangle",380*n,200*n,.55,.001,.04,.03),t.noiseBurst(.12,"bandpass",1e3*n,2,.45,.001,.025)}else e==="metal"?(t.tone(0,"square",220*n,180*n,.12,.002,.05),t.tone(.06,"sine",900*n,900*n,.3,.001,.12),t.noiseBurst(.06,"highpass",4e3*n,.7,.3,.001,.015)):this.synth(t,"place",e,n,.8)}};var Ha=["grass_block","stone","oak_planks","oak_log","cobblestone","glass","torch","oak_stairs","bricks"].map(i=>{var t;return(t=_t[i])!=null?t:0}),qc=class{constructor(){this.slots=Ha.slice();this.selected=0;this.listeners=[]}onChange(t){this.listeners.push(t)}emit(){for(let t of this.listeners)t()}current(){var t;return(t=this.slots[this.selected])!=null?t:0}select(t){let e=(t%9+9)%9;e!==this.selected&&(this.selected=e,this.emit())}scroll(t){t&&this.select(this.selected+t)}set(t,e){t<0||t>8||(this.slots[t]=e,this.emit())}firstFree(){return this.slots.indexOf(0)}pick(t){if(!t)return;let e=this.slots.indexOf(t);if(e>=0){this.select(e);return}let n=this.firstFree();if(n>=0){this.slots[n]=t,this.selected=n,this.emit();return}this.set(this.selected,t)}load(t,e){var n;for(let s=0;s<9;s++)this.slots[s]=(n=t[s])!=null?n:0;this.selected=Math.max(0,Math.min(8,e|0)),this.emit()}};var ds=new Uint8Array(65536),yi=new Uint8Array(65536),Lo=new Uint8Array(65536),Pr=4,No=8;(function(){for(let t=0;t<65536;t++){let e=t&1023,n=t>>10;if(e>=vt||e===0)continue;let s=fl[e],r=0,a=jt[e];a===J.slab?n===2?s=nn[e]===xn.opaque?15:s:r=n===1?Pr:No:a===J.stairs&&(r=(n&4?Pr:No)|1<<Er[n&3]),ds[t]=s,yi[t]=s>=15?0:r,Lo[t]=Yh[e]}})();function h1(i){if(yi[i]&Pr)return 0;let t=ds[i];return t===0?15:t>=15?0:15-t}var Ga=class{constructor(t){this.head=0;this.tail=0;this.buf=new Int32Array(1<<t),this.mask=(1<<t)-1}push(t){this.buf[this.tail]=t,this.tail=this.tail+1&this.mask,this.tail===this.head&&this.grow()}grow(){let t=this.buf,e=t.length,n=new Int32Array(e*2);n.set(t.subarray(this.head),0),n.set(t.subarray(0,this.head),e-this.head),this.buf=n,this.mask=e*2-1,this.head=0,this.tail=e}clear(){this.head=this.tail=0}},fs=5,_i=25,Un=12,Po=new Int8Array(_i),Io=new Int8Array(_i),Do=new Int8Array(_i),Uo=new Int8Array(_i),f1=new Uint8Array(_i);for(let i=0;i<_i;i++){let t=i%fs,e=i/fs|0;Po[i]=t<fs-1?i+1:-1,Io[i]=t>0?i-1:-1,Do[i]=e<fs-1?i+fs:-1,Uo[i]=e>0?i-fs:-1,f1[i]=(e+1)*7+t+1}var Yc=2,Kc=1,u1=No,d1=Pr,Zc=32,Jc=16,jc=class{constructor(t){this.ocx=0;this.ocz=0;this.wc=new Array(_i).fill(null);this.wb=new Array(_i).fill(null);this.wl=new Array(_i).fill(null);this.aq=new Ga(15);this.bq=new Ga(15);this.rq=new Ga(14);this.dm=new Uint16Array(49);this.noTouchSlot=-1;this.sunH=new Uint16Array(256);this.work=0;this.host=t}setWindow(t,e,n){var r;this.ocx=t,this.ocz=e;let s=this.host.chunks;for(let a=0;a<_i;a++){let o=a%fs-2,l=(a/fs|0)-2,c=a===Un&&n?n:(r=s.get(xe(t+o,e+l)))!=null?r:null;this.wc[a]=c,this.wb[a]=c?c.blocks:null,this.wl[a]=c?c.light:null}}releaseWindow(){for(let t=0;t<_i;t++)this.wc[t]=null,this.wb[t]=null,this.wl[t]=null}touch(t,e){if(t===this.noTouchSlot)return;let n=e>>8,s=n&15,r=n>>4,a=1<<r;s===0?r>0&&(a|=1<<r-1):s===15&&r<15&&(a|=1<<r+1);let o=this.dm,l=f1[t],c=e&15,h=e>>4&15;o[l]|=a,c===0?o[l-1]|=a:c===15&&(o[l+1]|=a),h===0?(o[l-7]|=a,c===0?o[l-8]|=a:c===15&&(o[l-6]|=a)):h===15&&(o[l+7]|=a,c===0?o[l+6]|=a:c===15&&(o[l+8]|=a))}flushDirty(){var n;let t=this.dm,e=this.host.dirtySections;for(let s=0;s<49;s++){let r=t[s];if(!r)continue;t[s]=0;let a=s%7-3,o=(s/7|0)-3,l=a>=-2&&a<=2&&o>=-2&&o<=2?this.wc[(o+2)*fs+a+2]:(n=this.host.chunks.get(xe(this.ocx+a,this.ocz+o)))!=null?n:null;if(l)for(let c=0;c<16;c++)r&1<<c&&l.counts[c]>0&&e.add(mn(l.cx,c,l.cz))}}relaxSky(t,e,n,s,r){let a=this.wl[t];if(!a)return;let o=this.wb[t][e];if(yi[o]&s)return;let l=ds[o],c=r&&n===15&&l===0?15:n-(l>1?l:1);if(c<=0)return;let h=a[e];h>>4>=c||(a[e]=h&15|c<<4,this.touch(t,e),this.aq.push(t<<16|e))}propagateSky(){let t=this.aq,e=this.wl,n=this.wb,s=0;for(;t.head!==t.tail;){let r=t.buf[t.head];t.head=t.head+1&t.mask,s++;let a=r>>>16,o=r&65535,l=e[a][o]>>4;if(l<=1)continue;let c=yi[n[a][o]],h=o&15,u=o>>4&15,f=o>>8;if(f>0&&!(c&No)&&this.relaxSky(a,o-256,l,d1,!0),f<255&&!(c&Pr)&&this.relaxSky(a,o+256,l,u1,!1),!(c&1))if(h<15)this.relaxSky(a,o+1,l,Yc,!1);else{let d=Po[a];d>=0&&this.relaxSky(d,o-15,l,Yc,!1)}if(!(c&2))if(h>0)this.relaxSky(a,o-1,l,Kc,!1);else{let d=Io[a];d>=0&&this.relaxSky(d,o+15,l,Kc,!1)}if(!(c&16))if(u<15)this.relaxSky(a,o+16,l,Zc,!1);else{let d=Do[a];d>=0&&this.relaxSky(d,o-240,l,Zc,!1)}if(!(c&32))if(u>0)this.relaxSky(a,o-16,l,Jc,!1);else{let d=Uo[a];d>=0&&this.relaxSky(d,o+240,l,Jc,!1)}}t.clear(),this.work+=s}relaxBlock(t,e,n,s){let r=this.wl[t];if(!r)return;let a=this.wb[t][e];if(yi[a]&s)return;let o=ds[a],l=n-(o>1?o:1);if(l<=0)return;let c=r[e];(c&15)>=l||(r[e]=c&240|l,this.touch(t,e),this.bq.push(t<<16|e))}propagateBlock(){let t=this.bq,e=this.wl,n=this.wb,s=0;for(;t.head!==t.tail;){let r=t.buf[t.head];t.head=t.head+1&t.mask,s++;let a=r>>>16,o=r&65535,l=e[a][o]&15;if(l<=1)continue;let c=yi[n[a][o]],h=o&15,u=o>>4&15,f=o>>8;if(f>0&&!(c&No)&&this.relaxBlock(a,o-256,l,d1),f<255&&!(c&Pr)&&this.relaxBlock(a,o+256,l,u1),!(c&1))if(h<15)this.relaxBlock(a,o+1,l,Yc);else{let d=Po[a];d>=0&&this.relaxBlock(d,o-15,l,Yc)}if(!(c&2))if(h>0)this.relaxBlock(a,o-1,l,Kc);else{let d=Io[a];d>=0&&this.relaxBlock(d,o+15,l,Kc)}if(!(c&16))if(u<15)this.relaxBlock(a,o+16,l,Zc);else{let d=Do[a];d>=0&&this.relaxBlock(d,o-240,l,Zc)}if(!(c&32))if(u>0)this.relaxBlock(a,o-16,l,Jc);else{let d=Uo[a];d>=0&&this.relaxBlock(d,o+240,l,Jc)}}t.clear(),this.work+=s}unSky(t,e,n,s){let r=this.wl[t];if(!r)return;let a=r[e],o=a>>4;if(o!==0)if(o<n||s&&n===15&&o===15){if(r[e]=a&15,this.touch(t,e),this.rq.push(t<<20|e<<4|o),e>>8===255){let l=h1(this.wb[t][e]);l>0&&(r[e]=r[e]&15|l<<4,this.aq.push(t<<16|e))}}else this.aq.push(t<<16|e)}unpropagateSky(){let t=this.rq,e=0;for(;t.head!==t.tail;){let n=t.buf[t.head];t.head=t.head+1&t.mask,e++;let s=n>>>20,r=n>>>4&65535,a=n&15,o=r&15,l=r>>4&15,c=r>>8;if(c>0&&this.unSky(s,r-256,a,!0),c<255&&this.unSky(s,r+256,a,!1),o<15)this.unSky(s,r+1,a,!1);else{let h=Po[s];h>=0&&this.unSky(h,r-15,a,!1)}if(o>0)this.unSky(s,r-1,a,!1);else{let h=Io[s];h>=0&&this.unSky(h,r+15,a,!1)}if(l<15)this.unSky(s,r+16,a,!1);else{let h=Do[s];h>=0&&this.unSky(h,r-240,a,!1)}if(l>0)this.unSky(s,r-16,a,!1);else{let h=Uo[s];h>=0&&this.unSky(h,r+240,a,!1)}}t.clear(),this.work+=e}unBlock(t,e,n){let s=this.wl[t];if(!s)return;let r=s[e],a=r&15;if(a!==0)if(a<n){s[e]=r&240,this.touch(t,e),this.rq.push(t<<20|e<<4|a);let o=Lo[this.wb[t][e]];o>0&&(s[e]=s[e]&240|o,this.bq.push(t<<16|e))}else this.bq.push(t<<16|e)}unpropagateBlock(){let t=this.rq,e=0;for(;t.head!==t.tail;){let n=t.buf[t.head];t.head=t.head+1&t.mask,e++;let s=n>>>20,r=n>>>4&65535,a=n&15,o=r&15,l=r>>4&15,c=r>>8;if(c>0&&this.unBlock(s,r-256,a),c<255&&this.unBlock(s,r+256,a),o<15)this.unBlock(s,r+1,a);else{let h=Po[s];h>=0&&this.unBlock(h,r-15,a)}if(o>0)this.unBlock(s,r-1,a);else{let h=Io[s];h>=0&&this.unBlock(h,r+15,a)}if(l<15)this.unBlock(s,r+16,a);else{let h=Do[s];h>=0&&this.unBlock(h,r-240,a)}if(l>0)this.unBlock(s,r-16,a);else{let h=Uo[s];h>=0&&this.unBlock(h,r+240,a)}}t.clear(),this.work+=e}seedAround(t,e,n,s){let r=e&15,a=e>>4&15,o=e>>8;o>0&&this.seedCell(t,e-256,n,s),o<255&&this.seedCell(t,e+256,n,s),r<15?this.seedCell(t,e+1,n,s):this.seedCell(Po[t],e-15,n,s),r>0?this.seedCell(t,e-1,n,s):this.seedCell(Io[t],e+15,n,s),a<15?this.seedCell(t,e+16,n,s):this.seedCell(Do[t],e-240,n,s),a>0?this.seedCell(t,e-16,n,s):this.seedCell(Uo[t],e+240,n,s)}seedCell(t,e,n,s){if(t<0)return;let r=this.wl[t];if(!r)return;let a=r[e];n&&a>>4>1&&this.aq.push(t<<16|e),s&&(a&15)>1&&this.bq.push(t<<16|e)}update(t,e,n,s,r,a){let o=ds[r]!==ds[a]||yi[r]!==yi[a];if(!(o||Lo[r]!==Lo[a]))return;this.setWindow(t.cx,t.cz,t),this.noTouchSlot=-1;let c=n<<8|s<<4|e,h=t.light;if(o){let d=h[c]>>4;if(d>0&&(h[c]&=15,this.touch(Un,c),this.rq.push(Un<<20|c<<4|d),this.unpropagateSky()),this.seedAround(Un,c,!0,!1),n===255){let g=h1(a);g>h[c]>>4&&(h[c]=h[c]&15|g<<4,this.touch(Un,c),this.aq.push(Un<<16|c))}this.propagateSky()}let u=h[c]&15;u>0&&(h[c]&=240,this.touch(Un,c),this.rq.push(Un<<20|c<<4|u),this.unpropagateBlock()),this.seedAround(Un,c,!1,!0);let f=Lo[a];f>(h[c]&15)&&(h[c]=h[c]&240|f,this.touch(Un,c),this.bq.push(Un<<16|c)),this.propagateBlock(),this.flushDirty(),this.releaseWindow()}initChunk(t){this.setWindow(t.cx,t.cz,t),this.noTouchSlot=Un;let e=t.light,n=t.blocks,s=t.counts;e.fill(0);let r=-1;for(let u=15;u>=0;u--)if(s[u]>0){r=u;break}let a=(r+1)*16-1;a<255&&e.fill(240,a+1<<8);let o=this.sunH,l=this.aq,c=this.bq,h=Un<<16;for(let u=0;u<16;u++)for(let f=0;f<16;f++){let d=15,g=0,b=a+1;for(let p=a;p>=0;p--){let m=p<<8|u<<4|f,_=n[m],y=yi[_];if(g&No||y&Pr)break;let v=ds[_];if((d!==15||v!==0)&&(d-=v>1?v:1,d<=0))break;e[m]=d<<4,d===15?b=p:d>1&&l.push(h|m),g=y}o[u<<4|f]=b}for(let u=0;u<16;u++)for(let f=0;f<16;f++){let d=u<<4|f,g=o[d],b=g;f>0&&o[d-1]>b&&(b=o[d-1]),f<15&&o[d+1]>b&&(b=o[d+1]),u>0&&o[d-16]>b&&(b=o[d-16]),u<15&&o[d+16]>b&&(b=o[d+16]);for(let p=g;p<b;p++)l.push(h|p<<8|d)}for(let u=0;u<=r;u++){if(!s[u])continue;let f=u+1<<12;for(let d=u<<12;d<f;d++){let g=Lo[n[d]];g&&(e[d]|=g,c.push(h|d))}}this.borderSeeds(t,r,13,15,0,1),this.borderSeeds(t,r,11,0,15,1),this.borderSeeds(t,r,17,15,0,16),this.borderSeeds(t,r,7,0,15,16),this.propagateSky(),this.propagateBlock(),this.noTouchSlot=-1,this.flushDirty(),t.lit=!0,this.releaseWindow()}borderSeeds(t,e,n,s,r,a){let o=this.wc[n];if(!o)return;let l=-1;for(let v=15;v>=0;v--)if(o.counts[v]>0){l=v;break}let c=Math.min(255,(Math.max(e,l)+1)*16+15),h=t.light,u=t.blocks,f=o.light,d=o.blocks,g,b;a===1?(g=s===15?1:2,b=s===15?2:1):(g=s===15?16:32,b=s===15?32:16);let p=this.aq,m=this.bq,_=Un<<16,y=n<<16;for(let v=0;v<=c;v++)for(let w=0;w<16;w++){let S=a===1?v<<8|w<<4|s:v<<8|s<<4|w,A=a===1?v<<8|w<<4|r:v<<8|r<<4|w,L=u[S],P=d[A];if(yi[L]&g||yi[P]&b)continue;let M=h[S],T=f[A];if(M===T)continue;let I=ds[L],F=ds[P],k=I>1?I:1,U=F>1?F:1,N=M>>4,D=T>>4;N-U>D?p.push(_|S):D-k>N&&p.push(y|A);let z=M&15,$=T&15;$-k>z?m.push(y|A):z-U>$&&m.push(_|S)}}};var Ir=_t.water,ps=_t.lava,nf=8,$A=Ce(_t.obsidian),p1=Ce(_t.bedrock),XA=Ce(_t.cobblestone),qA=Ce(_t.stone),YA=.25,KA=1.5,Dr=new Uint8Array(1024);Dr[0]=1;for(let i=1;i<vt;i++){if(ce[i])continue;let t=(jt[i]===J.cross||jt[i]===J.torch)&&!ge[i];(aa[i]||t)&&(Dr[i]=1)}_t.seagrass!==void 0&&(Dr[_t.seagrass]=0);_t.cobweb!==void 0&&(Dr[_t.cobweb]=0);var Bo=[0,1,0,-1],Fo=[-1,0,1,0],m1=[2,3,0,1],Oo=1048576,Wa=2097152,g1=(i,t,e)=>((i+Oo)*Wa+(e+Oo))*256+t,Qc=class{constructor(){this.keys=new Float64Array(1024);this.due=new Float64Array(1024);this.head=0;this.size=0}push(t,e){this.size===this.keys.length&&this.grow();let n=(this.head+this.size)%this.keys.length;this.keys[n]=t,this.due[n]=e,this.size++}frontDue(){return this.size?this.due[this.head]:1/0}shift(){let t=this.keys[this.head];return this.head=(this.head+1)%this.keys.length,this.size--,t}grow(){let t=this.keys.length,e=new Float64Array(t*2),n=new Float64Array(t*2);for(let s=0;s<this.size;s++){let r=(this.head+s)%t;e[s]=this.keys[r],n[s]=this.due[r]}this.keys=e,this.due=n,this.head=0}clear(){this.head=0,this.size=0}},b1=i=>i===0||i&nf?8:8-(i&7),th=class{constructor(t){this.time=0;this.maxUpdates=512;this.budgetMs=4;this.lastUpdates=0;this.wq=new Qc;this.lq=new Qc;this.wPending=new Set;this.lPending=new Set;this.contact=new Set;this.stamp=1;this.passStamp=new Uint32Array(121);this.passVal=new Uint8Array(121);this.holeStamp=new Uint32Array(121);this.holeVal=new Uint8Array(121);this.sx=0;this.sy=0;this.sz=0;this.skind=0;this.world=t}get(t,e,n){if(e<0)return p1;if(e>255)return 0;let s=this.world.getChunk(t>>4,n>>4);return s?s.blocks[e<<8|(n&15)<<4|t&15]:p1}get pending(){return this.wq.size+this.lq.size+this.contact.size}schedule(t,e,n){if(e<0||e>255)return;let s=this.get(t,e,n)&1023;if(s===Ir){let r=g1(t,e,n);this.wPending.has(r)||(this.wPending.add(r),this.wq.push(r,this.time+YA))}else if(s===ps){let r=g1(t,e,n);this.contact.add(r),this.lPending.has(r)||(this.lPending.add(r),this.lq.push(r,this.time+KA))}}scheduleAround(t,e,n){this.schedule(t,e,n),this.schedule(t+1,e,n),this.schedule(t-1,e,n),this.schedule(t,e+1,n),this.schedule(t,e-1,n),this.schedule(t,e,n+1),this.schedule(t,e,n-1)}clear(){this.wq.clear(),this.lq.clear(),this.wPending.clear(),this.lPending.clear(),this.contact.clear()}tick(t){t>0&&(this.time+=t);let e=this.maxUpdates,n=y1(),s=0;if(this.contact.size){let o=Array.from(this.contact);this.contact.clear();for(let l of o){if(e<=0){this.contact.add(l);continue}e--,s++,this.lavaContact(l)}}let r=this.wq,a=this.lq;for(;e>0;){let o=r.frontDue(),l=a.frontDue(),c=o<=l;if((c?o:l)>this.time+1e-6)break;let u=c?r.shift():a.shift();if((c?this.wPending:this.lPending).delete(u),this.update(u),e--,s++,!(s&15)&&y1()-n>this.budgetMs)break}this.lastUpdates=s}update(t){let e=t%256,n=(t-e)/256,s=n%Wa,r=s-Oo,a=(n-s)/Wa-Oo,o=this.world,l=this.get(a,e,r),c=l&1023;if(!(c!==Ir&&c!==ps)){if(c===ps&&this.touchesWater(a,e,r)){this.solidify(a,e,r,l);return}if(l>>10){let h=this.newLiquid(a,e,r,c);if(h===0){o.setQuiet(a,e,r,0);return}h!==l&&(o.setQuiet(a,e,r,h),l=h)}this.spread(a,e,r,l)}}lavaContact(t){let e=t%256,n=(t-e)/256,s=n%Wa,r=s-Oo,a=(n-s)/Wa-Oo,o=this.get(a,e,r);(o&1023)===ps&&this.touchesWater(a,e,r)&&this.solidify(a,e,r,o)}touchesWater(t,e,n){if((this.get(t,e+1,n)&1023)===Ir)return!0;for(let s=0;s<4;s++)if((this.get(t+Bo[s],e,n+Fo[s])&1023)===Ir)return!0;return!1}solidify(t,e,n,s){this.world.setQuiet(t,e,n,s>>10?XA:$A)}newLiquid(t,e,n,s){let r=0,a=0;for(let l=0;l<4;l++){let c=this.get(t+Bo[l],e,n+Fo[l]);if((c&1023)!==s)continue;let h=c>>10;h===0&&a++;let u=b1(h);u>r&&(r=u)}if(s===Ir&&a>=2){let l=this.get(t,e-1,n),c=l&1023;if(ge[c]&&!ce[c]||c===s&&!(l>>10))return Ce(s,0)}if((this.get(t,e+1,n)&1023)===s)return Ce(s,nf);let o=r-(s===ps?2:1);return o<=0?0:Ce(s,8-o)}canFlowInto(t,e,n){let s=t&1023;return s===0?!0:s===e?!1:ce[s]?n&&e===ps&&s===Ir:Dr[s]===1}spread(t,e,n,s){let r=this.world,a=s&1023,o=s>>10;if(e>0){let l=this.get(t,e-1,n);if(this.canFlowInto(l,a,!0)){if(a===ps&&(l&1023)===Ir)r.setQuiet(t,e-1,n,qA);else{let c=this.newLiquid(t,e-1,n,a);c!==0&&c!==l&&r.setQuiet(t,e-1,n,c)}this.sourceNeighbors(t,e,n,a)>=3&&this.spreadToSides(t,e,n,s);return}}(o===0||!this.isHole(this.get(t,e-1,n),a))&&this.spreadToSides(t,e,n,s)}sourceNeighbors(t,e,n,s){let r=Ce(s,0),a=0;for(let o=0;o<4;o++)this.get(t+Bo[o],e,n+Fo[o])===r&&a++;return a}spreadToSides(t,e,n,s){let r=s&1023,a=s>>10;if((a&nf?7:b1(a)-(r===ps?2:1))<=0)return;let l=this.spreadDirs(t,e,n,r),c=this.world;for(let h=0;h<4;h++){if(!(l&1<<h))continue;let u=t+Bo[h],f=n+Fo[h],d=this.get(u,e,f);if(!this.canFlowInto(d,r,!1))continue;let g=this.newLiquid(u,e,f,r);g!==0&&g!==d&&c.setQuiet(u,e,f,g)}}isHole(t,e){let n=t&1023;return n===0||n===e||ce[n]===1||Dr[n]===1}canPass(t,e){let n=t&1023;return n===e?t>>10!==0:n===0||!ce[n]&&Dr[n]===1}passAt(t,e){let n=(e+5)*11+t+5;return this.passStamp[n]!==this.stamp&&(this.passStamp[n]=this.stamp,this.passVal[n]=this.canPass(this.get(this.sx+t,this.sy,this.sz+e),this.skind)?1:0),this.passVal[n]===1}holeAt(t,e){let n=(e+5)*11+t+5;return this.holeStamp[n]!==this.stamp&&(this.holeStamp[n]=this.stamp,this.holeVal[n]=this.sy>0&&this.isHole(this.get(this.sx+t,this.sy-1,this.sz+e),this.skind)?1:0),this.holeVal[n]===1}slopeDistance(t,e,n,s,r){let a=1e3;for(let o=0;o<4;o++){if(o===s)continue;let l=t+Bo[o],c=e+Fo[o];if(this.passAt(l,c)){if(this.holeAt(l,c))return n;if(n<r){let h=this.slopeDistance(l,c,n+1,m1[o],r);h<a&&(a=h)}}}return a}spreadDirs(t,e,n,s){this.stamp++,this.sx=t,this.sy=e,this.sz=n,this.skind=s;let r=s===ps?2:4,a=1e3,o=0;for(let l=0;l<4;l++){let c=Bo[l],h=Fo[l];if(!this.passAt(c,h))continue;let u=this.holeAt(c,h)?0:this.slopeDistance(c,h,1,m1[l],r);u<a&&(a=u,o=0),u<=a&&(o|=1<<l)}return o}},y1=typeof performance!="undefined"?()=>performance.now():()=>Date.now();var ZA=Ce(_t.bedrock),eh=class{constructor(t){this.chunks=new Map;this.dirtySections=new Set;this.onBlockChange=null;this.lastKey=NaN;this.lastChunk=void 0;this.seed=t,this.lighting=new jc(this),this.fluids=new th(this)}getChunk(t,e){let n=xe(t,e);if(n===this.lastKey)return this.lastChunk;let s=this.chunks.get(n);return this.lastKey=n,this.lastChunk=s,s}get(t,e,n){if(e<0)return ZA;if(e>255)return 0;let s=this.getChunk(t>>4,n>>4);return s?s.blocks[e<<8|(n&15)<<4|t&15]:0}getLight(t,e,n){if(e>255)return 240;if(e<0)return 0;let s=this.getChunk(t>>4,n>>4);return s?s.light[e<<8|(n&15)<<4|t&15]:240}getSky(t,e,n){return this.getLight(t,e,n)>>4}getBlockLight(t,e,n){return this.getLight(t,e,n)&15}set(t,e,n,s){this.apply(t,e,n,s,!0)}setQuiet(t,e,n,s){this.apply(t,e,n,s,!1)}apply(t,e,n,s,r){if(e<0||e>255)return;let a=this.getChunk(t>>4,n>>4);if(!a)return;s&1023||(s=0);let o=t&15,l=n&15,c=a.blocks[e<<8|l<<4|o];c!==s&&(a.set(o,e,l,s),a.modified=!0,a.lit&&this.lighting.update(a,o,e,l,c,s),this.markAround(a,o,e,l),this.fluids.scheduleAround(t,e,n),r&&this.onBlockChange&&this.onBlockChange(t,e,n,c,s))}markAround(t,e,n,s){let r=n>>4,a=n&15;this.dirtySections.add(mn(t.cx,r,t.cz));let o=e===0?-1:0,l=e===15?1:0,c=s===0?-1:0,h=s===15?1:0,u=a===0&&r>0?-1:0,f=a===15&&r<15?1:0;for(let d=c;d<=h;d++)for(let g=o;g<=l;g++){let b=g===0&&d===0?t:this.chunks.get(xe(t.cx+g,t.cz+d));if(b)for(let p=u;p<=f;p++)b.counts[r+p]>0&&this.dirtySections.add(mn(b.cx,r+p,b.cz))}}addChunk(t){let e=xe(t.cx,t.cz);this.chunks.set(e,t),this.lastKey=NaN,this.lastChunk=void 0,this.lighting.initChunk(t);for(let n=0;n<16;n++)t.counts[n]>0&&this.dirtySections.add(mn(t.cx,n,t.cz));for(let n=-1;n<=1;n++)for(let s=-1;s<=1;s++){if(!s&&!n)continue;let r=this.chunks.get(xe(t.cx+s,t.cz+n));if(!(!r||!r.lit))for(let a=0;a<16;a++)r.counts[a]>0&&this.dirtySections.add(mn(r.cx,a,r.cz))}}removeChunk(t,e){let n=xe(t,e),s=this.chunks.get(n);if(s){this.chunks.delete(n),this.lastKey=NaN,this.lastChunk=void 0;for(let r=0;r<16;r++)this.dirtySections.delete(mn(t,r,e));return s}}topY(t,e){let n=this.getChunk(t>>4,e>>4);if(!n)return-1;let s=n.blocks,r=(e&15)<<4|t&15;for(let a=15;a>=0;a--)if(n.counts[a]){for(let o=a*16+15;o>=a*16;o--)if(s[o<<8|r]!==0)return o}return-1}tick(t){this.fluids.tick(t)}};var JA="blockforge",jA=1,Oi="worlds",zi="chunks",QA=5e3,Ur=new Uint8Array(65536),sf=new Int16Array(1024).fill(-1);function tE(i){if(i<=Ur.length)return;let t=Ur.length*2;for(;t<i;)t*=2;let e=new Uint8Array(t);e.set(Ur),Ur=e}function eE(i){let t=[],e=[],n=0,s=i.length,r=0;try{for(;r<s;){let a=i[r],o=r+1;for(;o<s&&i[o]===a;)o++;let l=a&1023,c=sf[l];c<0&&(c=t.length,sf[l]=c,t.push(l<vt?Le[l].name:"air"),e.push(l)),tE(n+8),n=_1(Ur,n,c*64+(a>>10)),n=_1(Ur,n,o-r-1),r=o}}finally{for(let a of e)sf[a]=-1}return{names:t,data:Ur.slice(0,n)}}function _1(i,t,e){for(;e>=128;)i[t++]=e&127|128,e>>>=7;return i[t++]=e,t}function nE(i,t,e=new Uint16Array(65536)){let n=new Uint16Array(i.length);for(let l=0;l<i.length;l++){let c=_t[i[l]];n[l]=c!==void 0&&c<vt?c:0}let s=e.length,r=t.length,a=0,o=0;for(;a<r&&o<s;){let l=0,c=0,h;do h=t[a++],l|=(h&127)<<c,c+=7;while(h&128&&a<r);let u=0;c=0;do h=t[a++],u|=(h&127)<<c,c+=7;while(h&128&&a<r);u+=1;let f=l>>>6,d=l&63,g=f<n.length?n[f]:0,b=g===0?0:g|d<<10,p=o+u>s?s:o+u;if(p-o>16)e.fill(b,o,p);else for(let m=o;m<p;m++)e[m]=b;o=p}return e}function iE(i,t){let{names:e,data:n}=eE(t.blocks);return{w:i,cx:t.cx,cz:t.cz,v:2,names:e,data:n,biome:t.biome.slice(0,256),tint:t.tint.slice(0,256*9)}}var S1=new WeakSet;function v1(i){let t=i;if(!t||t.v!==2||!Array.isArray(t.names)||!(t.data instanceof Uint8Array))return null;let e=nE(t.names,t.data);S1.add(e);let n=new Uint8Array(256);t.biome instanceof Uint8Array&&n.set(t.biome.subarray(0,256));let s=new Uint8Array(256*9);return t.tint instanceof Uint8Array&&s.set(t.tint.subarray(0,256*9)),{blocks:e,biome:n,tint:s}}var zo=null,x1=!1,w1=new Set;function Fi(i,t){w1.has(i)||(w1.add(i),console.warn(`[storage] ${i}`,t))}function sE(){var i;try{return(i=globalThis.indexedDB)!=null?i:null}catch{return null}}function Hs(){return x1?Promise.resolve(null):zo||(zo=new Promise(i=>{let t=!1,e=null,n=(r,a)=>{if(t){if(r)try{r.close()}catch{}return}t=!0,e!==null&&clearTimeout(e),r||(x1=!0,a!==void 0&&Fi("IndexedDB unavailable, worlds are kept in memory for this session",a)),i(r)},s=sE();if(!s){n(null,"no indexedDB");return}try{let r=s.open(JA,jA);r.onupgradeneeded=()=>{try{let a=r.result;a.objectStoreNames.contains(Oi)||a.createObjectStore(Oi,{keyPath:"id"}),a.objectStoreNames.contains(zi)||a.createObjectStore(zi,{keyPath:["w","cx","cz"]})}catch(a){n(null,a)}},r.onsuccess=()=>{let a=r.result;a.onversionchange=()=>{try{a.close()}catch{}zo=null},a.onclose=()=>{zo=null},n(a)},r.onerror=a=>{var o;(o=a.preventDefault)==null||o.call(a),n(null,r.error)},r.onblocked=()=>{},e=setTimeout(()=>n(null,"open timed out"),QA)}catch(r){n(null,r)}}),zo)}function nh(i){return new Promise((t,e)=>{i.onsuccess=()=>t(i.result),i.onerror=n=>{var s;(s=n.preventDefault)==null||s.call(n),e(i.error)}})}function rf(i){return new Promise((t,e)=>{i.oncomplete=()=>t(),i.onerror=n=>{var s;(s=n.preventDefault)==null||s.call(n),e(i.error)},i.onabort=()=>{var n;return e((n=i.error)!=null?n:new Error("transaction aborted"))}})}var of=i=>IDBKeyRange.bound([i,-1/0,-1/0],[i,1/0,1/0]),Ho=new Map,Va=new Map;function af(i){return JSON.parse(JSON.stringify(i))}function rE(i){let t=Va.get(i);return t||(t=new Map,Va.set(i,t)),t}var M1=!1;function oE(){var i,t;if(!M1){M1=!0;try{let e=globalThis.navigator,n=(t=(i=e==null?void 0:e.storage)==null?void 0:i.persist)==null?void 0:t.call(i);n&&n.catch(()=>{})}catch{}}}var Nn={async listWorlds(){let i=new Map,t=await Hs();if(t)try{let e=await nh(t.transaction(Oi,"readonly").objectStore(Oi).getAll());for(let n of e)n&&typeof n.id=="string"&&i.set(n.id,n)}catch(e){Fi("could not list worlds",e)}for(let[e,n]of Ho)i.set(e,af(n));return Array.from(i.values()).sort((e,n)=>(n.lastPlayed||0)-(e.lastPlayed||0))},async getWorld(i){let t=Ho.get(i);if(t)return af(t);let e=await Hs();if(!e)return null;try{let n=await nh(e.transaction(Oi,"readonly").objectStore(Oi).get(i));return n!=null?n:null}catch(n){return Fi("could not read a world",n),null}},async saveWorld(i){let t;try{t=af(i)}catch(n){Fi("world metadata is not serialisable",n);return}Ho.set(t.id,t);let e=await Hs();if(e)try{let n=e.transaction(Oi,"readwrite");n.objectStore(Oi).put(t),await rf(n),Ho.get(t.id)===t&&Ho.delete(t.id),oE()}catch(n){Fi("could not save a world, keeping it in memory",n)}},async deleteWorld(i){Ho.delete(i),Va.delete(i);let t=await Hs();if(t)try{let e=t.transaction([Oi,zi],"readwrite");e.objectStore(Oi).delete(i),e.objectStore(zi).delete(of(i)),await rf(e)}catch(e){Fi("could not delete a world",e)}},async savedChunkKeys(i){let t=new Set,e=await Hs();if(e)try{let s=e.transaction(zi,"readonly").objectStore(zi);if(typeof s.getAllKeys=="function"){let r=await nh(s.getAllKeys(of(i)));for(let a of r){let o=a;t.add(xe(o[1],o[2]))}}else await new Promise((r,a)=>{let o=s.openKeyCursor(of(i));o.onsuccess=()=>{let l=o.result;if(!l){r();return}let c=l.key;t.add(xe(c[1],c[2])),l.continue()},o.onerror=()=>a(o.error)})}catch(s){Fi("could not list saved chunks",s)}let n=Va.get(i);if(n)for(let s of n.keys())t.add(s);return t},async loadChunk(i,t,e){var r;let n=(r=Va.get(i))==null?void 0:r.get(xe(t,e));if(n)return v1(n);let s=await Hs();if(!s)return null;try{let a=await nh(s.transaction(zi,"readonly").objectStore(zi).get([i,t,e]));return v1(a)}catch(a){return Fi("could not read a chunk",a),null}},async saveChunk(i,t){let e;try{e=iE(i,t)}catch(a){Fi("could not encode a chunk",a);return}let n=xe(t.cx,t.cz),s=rE(i);s.set(n,e);let r=await Hs();if(r)try{let a=r.transaction(zi,"readwrite");a.objectStore(zi).put(e),await rf(a),s.get(n)===e&&s.delete(n)}catch(a){Fi("could not save a chunk, keeping it in memory",a)}},remap(i,t){if(S1.has(i))return;let e=new Uint16Array(1024);for(let n=0;n<t.length&&n<1024;n++){let s=_t[t[n]];e[n]=s!==void 0&&s<vt?s:0}for(let n=0;n<i.length;n++){let s=i[n];if(s===0)continue;let r=e[s&1023];i[n]=r===0?0:r|s&64512}},async mode(){return await Hs()?"indexeddb":"memory"}};var aE=.5*(Math.sqrt(3)-1),$a=(3-Math.sqrt(3))/6,lE=1/3,Hi=1/6,hi=new Float64Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]),Go=new Float64Array([1,0,-1,0,0,1,0,-1,.7071067811865476,.7071067811865476,-.7071067811865476,.7071067811865476,.7071067811865476,-.7071067811865476,-.7071067811865476,-.7071067811865476]);function lf(i){return i^=i>>>16,i=Math.imul(i,2146121005),i^=i>>>15,i=Math.imul(i,2221713035),i^=i>>>16,i>>>0}function ms(i,t,e){return lf((i^Math.imul(t|0,668265261)^Math.imul(e|0,374761393))>>>0)}function cf(i,t,e,n){return lf((i^Math.imul(t|0,668265261)^Math.imul(e|0,2654435761)^Math.imul(n|0,374761393))>>>0)}var Wo=class{constructor(t=0){this.s=t>>>0}seed(t){return this.s=t>>>0,this}u32(){let t=this.s=this.s+1831565813>>>0;return t=Math.imul(t^t>>>15,t|1),t^=t+Math.imul(t^t>>>7,t|61),(t^t>>>14)>>>0}next(){return this.u32()/4294967296}int(t){return Math.floor(this.next()*t)}range(t,e){return t+Math.floor(this.next()*(e-t+1))}chance(t){return this.next()<t}},ih=class{constructor(t){this.perm=new Uint8Array(512);this.perm12=new Uint8Array(512);this.perm8=new Uint8Array(512);let e=new Uint8Array(256);for(let s=0;s<256;s++)e[s]=s;let n=new Wo(lf(t>>>0^1540483477));for(let s=255;s>0;s--){let r=n.int(s+1),a=e[s];e[s]=e[r],e[r]=a}for(let s=0;s<512;s++){let r=e[s&255];this.perm[s]=r,this.perm12[s]=r%12,this.perm8[s]=r&7}}noise2(t,e){let n=this.perm,s=this.perm8,r=(t+e)*aE,a=Math.floor(t+r),o=Math.floor(e+r),l=(a+o)*$a,c=t-(a-l),h=e-(o-l),u,f;c>h?(u=1,f=0):(u=0,f=1);let d=c-u+$a,g=h-f+$a,b=c-1+2*$a,p=h-1+2*$a,m=a&255,_=o&255,y=0,v=.5-c*c-h*h;if(v>0){let A=s[m+n[_]]<<1;v*=v,y+=v*v*(Go[A]*c+Go[A+1]*h)}let w=.5-d*d-g*g;if(w>0){let A=s[m+u+n[_+f]]<<1;w*=w,y+=w*w*(Go[A]*d+Go[A+1]*g)}let S=.5-b*b-p*p;if(S>0){let A=s[m+1+n[_+1]]<<1;S*=S,y+=S*S*(Go[A]*b+Go[A+1]*p)}return 99.204*y}noise3(t,e,n){let s=this.perm,r=this.perm12,a=(t+e+n)*lE,o=Math.floor(t+a),l=Math.floor(e+a),c=Math.floor(n+a),h=(o+l+c)*Hi,u=t-(o-h),f=e-(l-h),d=n-(c-h),g,b,p,m,_,y;u>=f?f>=d?(g=1,b=0,p=0,m=1,_=1,y=0):u>=d?(g=1,b=0,p=0,m=1,_=0,y=1):(g=0,b=0,p=1,m=1,_=0,y=1):f<d?(g=0,b=0,p=1,m=0,_=1,y=1):u<d?(g=0,b=1,p=0,m=0,_=1,y=1):(g=0,b=1,p=0,m=1,_=1,y=0);let v=u-g+Hi,w=f-b+Hi,S=d-p+Hi,A=u-m+2*Hi,L=f-_+2*Hi,P=d-y+2*Hi,M=u-1+3*Hi,T=f-1+3*Hi,I=d-1+3*Hi,F=o&255,k=l&255,U=c&255,N=0,D=.6-u*u-f*f-d*d;if(D>0){let et=r[F+s[k+s[U]]]*3;D*=D,N+=D*D*(hi[et]*u+hi[et+1]*f+hi[et+2]*d)}let z=.6-v*v-w*w-S*S;if(z>0){let et=r[F+g+s[k+b+s[U+p]]]*3;z*=z,N+=z*z*(hi[et]*v+hi[et+1]*w+hi[et+2]*S)}let $=.6-A*A-L*L-P*P;if($>0){let et=r[F+m+s[k+_+s[U+y]]]*3;$*=$,N+=$*$*(hi[et]*A+hi[et+1]*L+hi[et+2]*P)}let nt=.6-M*M-T*T-I*I;if(nt>0){let et=r[F+1+s[k+1+s[U+1]]]*3;nt*=nt,N+=nt*nt*(hi[et]*M+hi[et+1]*T+hi[et+2]*I)}return 32*N}},A1=[0,37.17,-91.43,151.9,-203.3,263.7,-317.1,389.5,-431.9,499.3],E1=[0,-53.71,71.29,-127.3,181.7,-241.1,293.9,-347.3,409.1,-461.7];function gs(i,t,e,n,s=2,r=.5){let a=0,o=1,l=0,c=1;for(let h=0;h<n;h++)a+=o*i.noise2(t*c+A1[h%10],e*c+E1[h%10]),l+=o,o*=r,c*=s;return a/l}function T1(i,t,e,n,s=2,r=.5){let a=0,o=1,l=0,c=1,h=1;for(let u=0;u<n;u++){let f=1-Math.abs(i.noise2(t*c+A1[u%10],e*c+E1[u%10]));f*=f,f*=h,h=f*1.6>1?1:f*1.6,a+=f*o,l+=o,o*=r,c*=s}return a/l}var F1=["Ocean","Deep Ocean","Beach","Plains","Forest","Birch Forest","Desert","Snowy Tundra","Mountains","Snowy Peaks","Swamp","Cherry Grove","River","Stony Shore"];var Br=0,bs=1,Fr=2,Gi=3,$s=4,Or=5,Yo=6,Ko=7,Mi=8,Zo=9,qn=10,jo=11,Si=12,Jo=13;function Mt(i){let t=_t[i];if(t===void 0)throw new Error(`generator: unknown block ${i}`);return t}var vi=0,hf=Mt("bedrock"),bn=Mt("stone"),Xa=Mt("deepslate"),Af=Mt("tuff"),rh=Mt("granite"),oh=Mt("diorite"),ah=Mt("andesite"),wi=Mt("dirt"),$n=Mt("grass_block"),Vo=Mt("snowy_grass_block"),qa=Mt("podzol"),uf=Mt("coarse_dirt"),Nr=Mt("mud"),Ws=Mt("clay"),yn=Mt("sand"),df=Mt("sandstone"),Cn=Mt("gravel"),ff=Mt("snow_block"),pf=Mt("snow"),C1=Mt("ice"),Ya=Mt("packed_ice"),cE=Mt("calcite"),$o=Mt("water"),mf=Mt("lava"),gf=Mt("oak_log"),bf=Mt("oak_leaves"),hE=Mt("birch_log"),uE=Mt("birch_leaves"),dE=Mt("spruce_log"),k1=Mt("spruce_leaves"),yf=Mt("cherry_log"),fE=Mt("cherry_leaves"),sh=Mt("dark_oak_log"),pE=Mt("dark_oak_leaves"),Ka=Mt("short_grass"),_f=Mt("fern"),R1=Mt("dead_bush"),L1=Mt("cactus"),mE=Mt("sugar_cane"),gE=Mt("lily_pad"),bE=Mt("seagrass"),yE=Mt("pumpkin"),P1=Mt("brown_mushroom"),_E=Mt("red_mushroom"),Xs=Mt("dandelion"),Hr=Mt("poppy"),vE=Mt("blue_orchid"),O1=Mt("allium"),z1=Mt("azure_bluet"),xE=Mt("red_tulip"),wE=Mt("orange_tulip"),H1=Mt("white_tulip"),Ef=Mt("pink_tulip"),Tf=Mt("oxeye_daisy"),G1=Mt("cornflower"),W1=Mt("lily_of_the_valley"),V1=["coal","iron","copper","gold","redstone","lapis","diamond","emerald"],I1=V1.map(i=>Mt(`${i}_ore`)),D1=V1.map(i=>Mt(`deepslate_${i}_ore`)),U1=[[0,20,15,5,128,0],[0,6,17,60,128,0],[2,12,10,20,96,1],[1,10,9,5,72,1],[1,3,9,5,24,0],[3,2,9,5,32,1],[4,6,8,5,16,0],[5,2,7,5,32,1],[6,1,8,5,16,0]],N1=[[rh,1,2,52,0,64],[oh,1,2,52,0,64],[ah,1,2,52,0,64],[rh,1,.25,52,64,128],[oh,1,.25,52,64,128],[ah,1,.25,52,64,128],[Af,2,2,52,0,16],[wi,1,4,30,0,160],[Cn,1,5,30,0,160]],Vs=-.5,ME=.42,SE=.05,AE=9,xi=0,Za=1,vf=2,B1=3,xf=4,wf=5,Ja=6,Mf=7,Xo=[-1.2,-.62,-.45,-.3,-.2,-.14,-.1,-.06,0,.3,1.2],qo=[29,35,42,48,54,58.5,61.6,63.2,64.8,70,82];function EE(i){if(i<=Xo[0])return qo[0];for(let t=1;t<Xo.length;t++)if(i<Xo[t]){let e=(i-Xo[t-1])/(Xo[t]-Xo[t-1]);return qo[t-1]+(qo[t]-qo[t-1])*e}return qo[qo.length-1]}function He(i,t,e){let n=(e-i)/(t-i);return n<=0?0:n>=1?1:n*n*(3-2*n)}var zr=i=>[parseInt(i.slice(1,3),16),parseInt(i.slice(3,5),16),parseInt(i.slice(5,7),16)],$1=[];function Bn(i,t,e,n){$1[i]=[...zr(t),...zr(e),...zr(n)]}Bn(Br,"#8eb971","#71a74d","#3f76e4");Bn(bs,"#8eb971","#71a74d","#3a69d6");Bn(Fr,"#91bd59","#77ab2f","#3f76e4");Bn(Gi,"#91bd59","#77ab2f","#3f76e4");Bn($s,"#79c05a","#59ae30","#3f76e4");Bn(Or,"#88bb67","#6ba941","#3f76e4");Bn(Yo,"#bfb755","#aea42a","#3f8ee4");Bn(Ko,"#80b497","#60a17b","#3938c9");Bn(Mi,"#8ab689","#6da36b","#3f6ee0");Bn(Zo,"#80b497","#60a17b","#3938c9");Bn(qn,"#6a7039","#6a7039","#617b64");Bn(jo,"#b6db61","#b6db61","#5db7ef");Bn(Si,"#8eb971","#71a74d","#3f76e4");Bn(Jo,"#8ab689","#6da36b","#3d5fd9");var TE=zr("#3d57d6"),CE=zr("#45adf2"),kE=zr("#80b497"),RE=zr("#60a17b"),Wi=[];Wi[Gi]=[Xs,Hr,z1,Tf,G1,xE,wE,H1,Ef,Xs,Hr];Wi[$s]=[Xs,Hr,W1,Hr,Xs];Wi[Or]=[Xs,Hr,W1,Tf];Wi[qn]=[vE];Wi[jo]=[Ef,Ef,H1,O1];Wi[Mi]=[O1,z1,G1,Xs,Tf,Hr];Wi[Si]=[Xs,Hr];Wi[Fr]=[Xs];var LE=461845907,PE=739982445,IE=695872825,DE=1799596469,UE=1597334677,NE=1013904242,BE=2084215391,FE=1327217884,OE=295875524,zE=195936478,Ne=18,Sf=Ne*Ne,Xn=9,ui=65,lh=class{constructor(t){this.sB=0;this.sT=0;this.sHum=0;this.sC=0;this.sMtn=0;this.sChan=0;this.hm=new Int16Array(Sf);this.bm=new Uint8Array(Sf);this.tm=new Float32Array(Sf);this.frozen=new Uint8Array(256);this.slopes=new Uint8Array(256);this.carveTop=new Int16Array(256);this.tintGrid=new Float32Array(Xn*Xn*9);this.tintBlur=new Float32Array(Xn*Xn*9);this.caveC=new Float32Array(25*ui);this.caveA=new Float32Array(25*ui);this.caveB=new Float32Array(25*ui);this.colC=new Float32Array(ui);this.colA=new Float32Array(ui);this.colB=new Float32Array(ui);this.cheeseThr=new Float32Array(257);this.spagW2=new Float32Array(257);this.rng=new Wo;this.rng2=new Wo;this.blocks=new Uint16Array(0);this.X0=0;this.Z0=0;this.fFill=0;this.fDepth=0;this.fUnder=0;this.fUnderDepth=0;this.spawn=null;this.seed=t|0;let e=0,n=()=>new ih(this.seed+Math.imul(++e,2654435761)|0);this.nCont=n(),this.nWarp=n(),this.nEro=n(),this.nRidge=n(),this.nAmp=n(),this.nHill=n(),this.nDet=n(),this.nRiver=n(),this.nSwamp=n(),this.nTemp=n(),this.nHum=n(),this.nVar=n(),this.nJit=n(),this.nPatch=n(),this.nPatch2=n(),this.nFlower=n(),this.nFlowerType=n(),this.nGrass=n(),this.nForest=n(),this.nEnt=n(),this.nSnow=n(),this.nCheese=n(),this.nCheese2=n(),this.nSpagA=n(),this.nSpagB=n(),this.nSpagW=n();for(let s=0;s<=256;s++){this.cheeseThr[s]=.45+.2*He(24,100,s)+.12*He(4,-2,s);let r=.083+.017*He(80,20,s);this.spagW2[s]=r*r}}sample(t,e){let n=this.nJit.noise2(t*.015625,e*.015625)*.026+this.nJit.noise2(t*.058823529411764705+31.7,e*.058823529411764705-11.3)*.004,s=gs(this.nTemp,t*(1/1500),e*(1/1500),3)*1.45+n,r=gs(this.nHum,t*(1/1150),e*(1/1150),3)*1.45-n,a=gs(this.nVar,t*(1/640),e*(1/640),2)*1.55+n,o=t+this.nWarp.noise2(t*(1/420),e*(1/420))*80,l=e+this.nWarp.noise2(e*(1/420)+57.1,t*(1/420)-23.9)*80,c=gs(this.nCont,o*(1/1800),l*(1/1800),5)*1.75+.1,h=gs(this.nEro,t*(1/1250),e*(1/1250),3)*1.55,u=EE(c),f=He(-.12,.25,c),d=He(-.2,.08,c)*He(-.18,-.66,h);if(d>0){let v=T1(this.nRidge,t*.0016129032258064516,e*.0016129032258064516,5),w=.82+.25*this.nAmp.noise2(t*(1/1100),e*(1/1100)),S=d*d*(3-2*d);u+=S*(20+190*v*Math.sqrt(v))*w}let g=f*(3+16*He(.55,-.2,h))*(1-.6*d)+(1-f)*2.5;u+=gs(this.nHill,t*(1/200),e*(1/200),4)*1.35*g,u+=gs(this.nDet,t*(1/40),e*(1/40),2)*(.9+1.4*f);let b=He(.36,.5,r)*He(-.36,-.22,s)*He(-.28,0,h)*(1-He(.04,.2,d))*He(-.07,.03,c);b>0&&(u+=(61.8+this.nSwamp.noise2(t*(1/13),e*(1/13))*1.8-u)*b);let p=0,m=1-He(.25,.6,d);if(m>0){let v=Math.abs(gs(this.nRiver,t*.0014285714285714286,e*.0014285714285714286,3)*1.7);if(v<.2){let w=1-(1-He(.035,.2,v))*m;if(u>63&&(u=63+(u-63)*w),p=(1-He(0,.045,v))*m,p>0){let S=56.5+this.nDet.noise2(t*.043478260869565216,e*.043478260869565216)*1.5;u>S&&(u+=(S-u)*p)}}}u>185&&(u=185+55*(1-Math.exp((185-u)/55)));let _=Math.floor(u);_<2?_=2:_>250&&(_=250);let y;if(_<62&&c<-.13)y=c<-.5?bs:Br;else if(p>.4&&_<=63)y=Si;else if(c<-.03+n&&d>.07&&_<78&&_>=59)y=Jo;else if(c<-.035+n*.6&&_<=66&&_>=60)y=Fr;else if(d>.32&&_>=92){let v=148+this.nSnow.noise2(t*.016666666666666666,e*.016666666666666666)*10-(s<Vs+.1?30:0);y=_>=v?Zo:Mi}else s<Vs?y=Ko:s>ME&&r<SE?y=Yo:b>.5?y=qn:a>.42&&s>-.3&&s<.32&&r>-.3&&r<.36&&h<.12?y=jo:a<-.33&&s>-.42&&s<.3&&r>-.12?y=Or:r>.02?y=$s:y=Gi;return this.sB=y,this.sT=s,this.sHum=r,this.sC=c,this.sMtn=d,this.sChan=p,_}heightAt(t,e){return this.sample(Math.floor(t),Math.floor(e))}biomeAt(t,e){return this.sample(Math.floor(t),Math.floor(e)),this.sB}slopeAt(t,e){let n=this.sample(t+1,e),s=this.sample(t-1,e),r=this.sample(t,e+1),a=this.sample(t,e-1);return Math.max(Math.abs(n-s),Math.abs(r-a))}snowline(t,e){return 122+this.nSnow.noise2(t*(1/37),e*(1/37))*7}isEntrance(t,e){return this.nEnt.noise2(t*(1/85),e*(1/85))>.62}surface(t,e,n,s,r,a){let o=this.nPatch.noise2(t*.09090909090909091,e*.09090909090909091),l=ms(this.seed^OE,t,e),c=3+(l&1);if(this.fFill=wi,this.fDepth=c,this.fUnder=bn,this.fUnderDepth=0,n<62){let h=62-n,u;return s===Br||s===bs?u=h>16||s===bs?o>-.35?Cn:yn:o>.55&&h<12?Ws:o<-.45?Cn:yn:s===Si?u=o>.5?Ws:o<-.4?Cn:yn:s===qn?u=o>-.1?Nr:o<-.55?Ws:wi:s===Yo||s===Fr?u=yn:s===Ko||s===Zo||s===Mi||s===Jo?u=o>.1?Cn:wi:u=o>.55?Ws:o>.05?yn:o>-.45?wi:Cn,this.fFill=u===Ws||u===Nr?wi:u,this.fDepth=u===Ws?2:c,u===yn&&(this.fUnder=df,this.fUnderDepth=2),u}switch(s){case Yo:return this.fFill=yn,this.fDepth=c+1,this.fUnder=df,this.fUnderDepth=3+(l>>>1&1),yn;case Fr:return this.fFill=yn,this.fDepth=c,this.fUnder=df,this.fUnderDepth=2,yn;case Jo:return r>2||o>.15?(this.fFill=bn,bn):(this.fFill=Cn,this.fDepth=2,Cn);case Zo:return r>=6?(this.fFill=bn,o>.5?cE:bn):o>.62?(this.fFill=Cn,this.fDepth=2,Cn):o<-.66&&r<=2?(this.fFill=Ya,this.fDepth=2,Ya):(this.fFill=ff,this.fDepth=1+(l&1),ff);case Mi:if(r>=5||r>=3&&n>128)return this.fFill=bn,o>.66?Cn:bn;if(r>=3&&o>.45)return this.fFill=Cn,this.fDepth=2,Cn;this.fDepth=1+(l&1);{let h=this.nPatch2.noise2(t*.029411764705882353,e*.029411764705882353)+o*.15;if(n<114&&h<-.8)return qa;if(h>.9)return uf}return $n;case Ko:return r>=6?(this.fFill=bn,bn):this.nPatch2.noise2(t*(1/22),e*(1/22))>.86?(this.fFill=Ya,this.fDepth=2,Ya):Vo;case qn:return o>.52?Nr:$n;case Si:return n<=62?a<Vs?Cn:(this.fFill=yn,o>.2?$n:yn):a<Vs?Vo:$n;default:return r>=8?(this.fFill=bn,bn):$n}}generate(t,e){let n=new Uint16Array(65536),s=new Uint8Array(256),r=new Uint8Array(256*9);this.blocks=n;let a=this.X0=t*16,o=this.Z0=e*16,l=this.hm,c=this.bm,h=this.tm;for(let f=0;f<Ne;f++)for(let d=0;d<Ne;d++){let g=f*Ne+d;l[g]=this.sample(a+d-1,o+f-1),c[g]=this.sB,h[g]=this.sT}let u=0;for(let f=0;f<16;f++)for(let d=0;d<16;d++){let g=(f+1)*Ne+d+1,b=l[g],p=c[g],m=h[g],_=a+d,y=o+f;b>u&&(u=b);let v=Math.max(Math.abs(l[g+1]-l[g-1]),Math.abs(l[g+Ne]-l[g-Ne])),w=this.surface(_,y,b,p,v,m),S=f<<4|d;this.slopes[S]=v>255?255:v;let A=b-this.fDepth,L=A-this.fUnderDepth,P=this.fFill,M=this.fUnder;n[S]=hf;for(let I=1;I<b;I++){let F;I>A?F=P:I>L?F=M:I>=20?F=bn:I<12?F=Xa:F=(cf(this.seed^PE,_,I,y)&7)<20-I?Xa:bn,I<=4&&cf(this.seed^LE,_,I,y)%5<5-I&&(F=hf),n[I<<8|S]=F}n[b<<8|S]=w;let T=m<Vs||p===Zo?1:0;if(!T&&(p===Mi||p===Jo)&&b>=this.snowline(_,y)&&(T=1),this.frozen[S]=T,b<62){for(let I=b+1;I<=62;I++)n[I<<8|S]=$o;T&&(!(p===Br||p===bs)||this.nPatch2.noise2(_*(1/44),y*(1/44))*.75+this.nPatch.noise2(_*(1/9),y*(1/9))*.25>-.12)&&(n[15872|S]=C1)}}this.blobs(t,e),this.caves(u),this.ores(t,e),this.trees(),this.decorate(t,e);for(let f=0;f<16;f++)for(let d=0;d<16;d++)s[f<<4|d]=c[(f+1)*Ne+d+1];return this.tints(r),this.blocks=new Uint16Array(0),{cx:t,cz:e,blocks:n,biome:s,tint:r}}vein(t,e,n,s,r,a,o,l,c,h,u){let f=this.X0,d=this.Z0,g=this.blocks,b=t.next()*Math.PI,p=r/8,m=Math.sin(b)*p,_=Math.cos(b)*p,y=e+m,v=e-m,w=s+_,S=s-_,A=n+t.int(3)-1,L=n+t.int(3)-1,P=(2*r/16+1)/2+1;if(Math.max(y,v)+P<f||Math.min(y,v)-P>f+16||Math.max(w,S)+P<d||Math.min(w,S)-P>d+16)return;let M=u;for(let T=0;T<M;T++){let I=M>1?T/(M-1):.5,F=y+(v-y)*I,k=A+(L-A)*I,U=w+(S-w)*I,N=t.next()*r/16,D=((Math.sin(Math.PI*I)+1)*N+1)/2,z=D*D,$=Math.floor(F-D),nt=Math.floor(F+D),et=Math.floor(U-D),rt=Math.floor(U+D),bt=Math.floor(k-D),G=Math.floor(k+D);if($<f&&($=f),nt>f+15&&(nt=f+15),et<d&&(et=d),rt>d+15&&(rt=d+15),bt<c&&(bt=c),G>h&&(G=h),!($>nt||et>rt||bt>G))for(let tt=bt;tt<=G;tt++){let at=tt+.5-k,Q=at*at;if(!(Q>=z))for(let ft=et;ft<=rt;ft++){let ht=ft+.5-U,Ht=Q+ht*ht;if(Ht>=z)continue;let Et=tt<<8|ft-d<<4;for(let O=$;O<=nt;O++){let be=O+.5-F;if(Ht+be*be>=z)continue;let xt=Et|O-f,wt=g[xt];l===4?wt===bn||wt===rh||wt===oh||wt===ah?g[xt]=a:(wt===Xa||wt===Af)&&(g[xt]=o):(l&1&&wt===bn||l&2&&wt===Xa)&&(g[xt]=a)}}}}}blobs(t,e){let n=this.rng,s=this.rng2;for(let r=e-1;r<=e+1;r++)for(let a=t-1;a<=t+1;a++){n.seed(ms(this.seed^UE,a,r));for(let o=0;o<N1.length;o++){let[l,c,h,u,f,d]=N1[o],g=Math.floor(h);n.next()<h-g&&g++;for(let b=0;b<g;b++){let p=a*16+n.int(16),m=r*16+n.int(16),_=f+n.int(d-f+1);s.seed(n.u32()),this.vein(s,p,_,m,u,l,l,c,Math.max(1,f-4),Math.min(255,d+4),12)}}}}ores(t,e){let n=this.rng,s=this.rng2,r=this.blocks;for(let o=e-1;o<=e+1;o++)for(let l=t-1;l<=t+1;l++){n.seed(ms(this.seed^NE,l,o));for(let c=0;c<U1.length;c++){let[h,u,f,d,g,b]=U1[c],p=u,m=f;h===6&&n.next()<.5&&p++;for(let _=0;_<p;_++){let y=l*16+n.int(16),v=o*16+n.int(16),w=g-d,S=b===1?d+Math.floor((n.next()+n.next())*.5*(w+1)):d+n.int(w+1);h===6&&_>0&&(m=4),s.seed(n.u32()),this.vein(s,y,S,v,m,I1[h],D1[h],4,d,g,Math.max(2,Math.ceil(m*.75)))}}}n.seed(ms(this.seed^zE,t,e));let a=3+n.int(6);for(let o=0;o<a;o++){let l=n.int(16),c=n.int(16),h=5+n.int(96),u=this.bm[(c+1)*Ne+l+1];if(u!==Mi&&u!==Zo)continue;let f=h<<8|c<<4|l,d=r[f];d===bn||d===rh||d===oh||d===ah?r[f]=I1[7]:(d===Xa||d===Af)&&(r[f]=D1[7])}}caves(t){let e=this.hm,n=this.blocks,s=this.X0,r=this.Z0,a=0;for(let p=0;p<16;p++)for(let m=0;m<16;m++){let _=(p+1)*Ne+m+1,y=e[_],v=e[_+1],w=e[_-1],S=e[_+Ne],A=e[_-Ne],L=Math.min(y,v,w,S,A),P;L<62?P=L-6:this.isEntrance(s+m,r+p)&&L>=64?P=y:P=y-5,P>250&&(P=250),this.carveTop[p<<4|m]=P,P>a&&(a=P)}if(a<1)return;let o=Math.min(ui,(Math.min(t,a)>>2)+2),l=this.caveC,c=this.caveA,h=this.caveB;for(let p=0;p<5;p++)for(let m=0;m<5;m++){let _=s+m*4,y=r+p*4,v=(p*5+m)*ui;for(let w=0;w<o;w++){let S=w*4;l[v+w]=this.nCheese.noise3(_*(1/88),S*(1/44),y*(1/88))*.68+this.nCheese2.noise3(_*(1/30),S*(1/22),y*(1/30))*.32,c[v+w]=this.nSpagA.noise3(_*(1/52),S*(1/30),y*(1/52)),h[v+w]=this.nSpagB.noise3(_*(1/52),S*(1/30),y*(1/52))}}let u=this.colC,f=this.colA,d=this.colB,g=this.cheeseThr,b=this.spagW2;for(let p=0;p<16;p++){let m=p>>2,_=(p&3)*.25;for(let y=0;y<16;y++){let v=p<<4|y,w=this.carveTop[v];if(w<1)continue;let S=y>>2,A=(y&3)*.25,L=(m*5+S)*ui,P=L+ui,M=L+5*ui,T=M+ui,I=(1-A)*(1-_),F=A*(1-_),k=(1-A)*_,U=A*_,N=Math.min(o,(w>>2)+2);for(let D=0;D<N;D++)u[D]=l[L+D]*I+l[P+D]*F+l[M+D]*k+l[T+D]*U,f[D]=c[L+D]*I+c[P+D]*F+c[M+D]*k+c[T+D]*U,d[D]=h[L+D]*I+h[P+D]*F+h[M+D]*k+h[T+D]*U;for(let D=1;D<=w;D++){let z=D>>2,$=(D&3)*.25,et=u[z]+(u[z+1]-u[z])*$>g[D];if(!et){let G=f[z]+(f[z+1]-f[z])*$;if(G*G<b[D]){let tt=d[z]+(d[z+1]-d[z])*$;et=G*G+tt*tt<b[D]}}if(!et)continue;let rt=D<<8|v,bt=n[rt];bt===hf||bt===$o||(n[rt]=D<=10?mf:vi)}}}}put(t,e,n,s,r){let a=t-this.X0,o=n-this.Z0;if(a<0||a>15||o<0||o>15||e<1||e>255)return;let l=e<<8|o<<4|a,c=this.blocks[l];r?(c===vi||ti[c&1023]||c===$o||c===Ka||c===pf)&&(this.blocks[l]=s):c===vi&&(this.blocks[l]=s)}rootDirt(t,e,n){let s=t-this.X0,r=n-this.Z0;if(s<0||s>15||r<0||r>15||e<1)return;let a=e<<8|r<<4|s,o=this.blocks[a];(o===$n||o===Vo||o===qa||o===Nr)&&(this.blocks[a]=wi)}treeDensity(t,e,n,s){let r=this.nForest.noise2(e*.010416666666666666,n*.010416666666666666);switch(t){case $s:return .5+.32*r;case Or:return .46+.28*r;case Gi:return r>.55?.12:.012;case qn:return .16+.08*r;case Ko:return r>.4?.12:.025;case Mi:return s<116?.13+.15*r:s<126?.04:0;case jo:return .16+.08*r;case Si:return 0;default:return 0}}trees(){let t=this.X0,e=this.Z0,n=AE,s=Math.floor((t-n)/4),r=Math.floor((t+15+n)/4),a=Math.floor((e-n)/4),o=Math.floor((e+15+n)/4),l=this.rng;for(let c=a;c<=o;c++)for(let h=s;h<=r;h++){let u=ms(this.seed^DE,h,c),f=h*4+(u&3),d=c*4+(u>>>2&3);if(f<t-n||f>t+15+n||d<e-n||d>e+15+n)continue;let g=(u>>>8&65535)/65536;if(g>.82)continue;let b=this.sample(f,d),p=this.sB;if(g>=this.treeDensity(p,f,d,b)||b<62-(p===qn?1:0)||b>236||this.isEntrance(f,d))continue;let m=this.sT,_=this.slopeAt(f,d);if(_>3)continue;let y=this.surface(f,d,b,p,_,m);if(b>=62&&y!==$n&&y!==wi&&y!==qa&&y!==Vo&&y!==uf||b<62&&y!==Nr&&y!==wi&&y!==Ws)continue;l.seed(u^2654435769);let v=l.next(),w;switch(p){case $s:w=v<.66?xi:v<.86?Za:v<.95?xf:wf;break;case Or:w=v<.82?Za:v<.97?Mf:xi;break;case Gi:w=v<.88?xi:xf;break;case qn:w=Ja;break;case Ko:w=vf;break;case Mi:w=m>.25?v<.75?xi:Za:v<.88?vf:xi;break;case jo:w=B1;break;default:w=xi}w===wf&&(this.sample(f+1,d)!==b||this.sample(f,d+1)!==b||this.sample(f+1,d+1)!==b)&&(w=xi),this.tree(w,f,b+1,d,l)}}leafDisc(t,e,n,s,r,a,o){for(let l=-s;l<=s;l++)for(let c=-s;c<=s;c++)s>0&&(c===s||c===-s)&&(l===s||l===-s)&&a.next()>=o||this.put(t+c,e,n+l,r,!1)}tree(t,e,n,s,r){switch(t){case xi:case Za:case Mf:case Ja:{let a=t===xi||t===Ja?gf:hE,o=t===xi||t===Ja?bf:uE,l=t===xi?4+r.int(3):t===Za?5+r.int(3):t===Mf?8+r.int(3):5+r.int(3),c=t===Ja?1:0,h=n+l;for(let u=h-3;u<=h;u++){let f=u-h,d=(f>=-1?1:2)+c;this.leafDisc(e,u,s,d,o,r,f===0?0:.5)}for(let u=n;u<h;u++)this.put(e,u,s,a,!0);this.rootDirt(e,n-1,s);return}case vf:{let a=6+r.int(4),o=1+r.int(2),l=2+r.int(2),c=n+a,h=r.int(2),u=1,f=0;this.put(e,c+1,s,k1,!1);for(let d=c;d>=n+o;d--)this.leafDisc(e,d,s,h,k1,r,0),h>=u?(h=f,f=1,u=Math.min(u+1,l)):h++;for(let d=n;d<=c;d++)this.put(e,d,s,dE,!0);this.rootDirt(e,n-1,s);return}case xf:{let a=8+r.int(5),o=n+a,l=3+r.int(3);for(let c=0;c<l;c++){let h=r.next()*Math.PI*2,u=2+r.next()*2.5,f=n+Math.floor(a*(.5+r.next()*.4)),d=Math.round(e+Math.cos(h)*u),g=Math.round(s+Math.sin(h)*u),b=f+1+r.int(2);this.cluster(d,b,g,bf,r,2.6,2);let p=Math.ceil(u)+1,m=Math.abs(Math.cos(h))>Math.abs(Math.sin(h))?1:2;for(let _=1;_<=p;_++){let y=_/p;this.put(Math.round(e+(d-e)*y),Math.round(f+(b-f)*y),Math.round(s+(g-s)*y),Ce(gf,m),!0)}}this.cluster(e,o,s,bf,r,2.8,2);for(let c=n;c<o;c++)this.put(e,c,s,gf,!0);this.rootDirt(e,n-1,s);return}case wf:{let a=6+r.int(3),o=n+a,l=e+.5,c=s+.5;for(let h=o-2;h<=o+1;h++){let u=h-o,f=u===1?2.2:u===0?4.2:u===-1?4.6:3.4,d=Math.ceil(f)+1;for(let g=-d;g<=d+1;g++)for(let b=-d;b<=d+1;b++){let p=e+b-l,m=s+g-c,_=p*p+m*m,y=_>(f-1)*(f-1);_<=f*f&&(!y||r.next()<.6)&&this.put(e+b,h,s+g,pE,!1)}}for(let h=n;h<=o;h++)this.put(e,h,s,sh,!0),this.put(e+1,h,s,sh,!0),this.put(e,h,s+1,sh,!0),this.put(e+1,h,s+1,sh,!0);this.rootDirt(e,n-1,s),this.rootDirt(e+1,n-1,s),this.rootDirt(e,n-1,s+1),this.rootDirt(e+1,n-1,s+1);return}case B1:{let a=4+r.int(2),o=n+a,l=2+r.int(2),c=r.int(4);for(let h=0;h<l;h++){let u=c+h*(l===2?2:1)+(l===3&&h===2?1:0)&3,f=u===1?1:u===3?-1:0,d=u===0?-1:u===2?1:0,g=2+r.int(3),b=o-2+r.int(2),p=f!==0?1:2,m=e,_=s;for(let v=1;v<=g;v++)m=e+f*v,_=s+d*v,this.put(m,b+(v>1?1:0),_,Ce(yf,p),!0);let y=1+r.int(2);for(let v=2;v<=y+1;v++)this.put(m,b+v,_,yf,!0);this.cherryCanopy(m,b+y+2,_,r)}for(let h=n;h<o;h++)this.put(e,h,s,yf,!0);this.cherryCanopy(e,o+1,s,r),this.rootDirt(e,n-1,s);return}}}cluster(t,e,n,s,r,a,o){let l=Math.ceil(a);for(let c=-o;c<=1;c++){let h=c===1?a-1.2:c===-o?a-.9:a,u=h*h;for(let f=-l;f<=l;f++)for(let d=-l;d<=l;d++){let g=d*d+f*f;g>u||g>(h-1)*(h-1)&&r.next()<.25||this.put(t+d,e+c,n+f,s,!1)}}}cherryCanopy(t,e,n,s){for(let a=-2;a<=1;a++){let o=a===1?1.8:a===0?3.3:a===-1?3.1:2.2,l=o*o;for(let c=-3;c<=3;c++)for(let h=-3;h<=3;h++){let u=h*h+c*c;u>l||a===-2&&(u<2||s.next()<.55)||u>(o-1)*(o-1)&&s.next()<.2||this.put(t+h,e+a,n+c,fE,!1)}}}decorate(t,e){let n=this.blocks,s=this.hm,r=this.bm,a=this.X0,o=this.Z0,l=this.seed;for(let c=0;c<16;c++)for(let h=0;h<16;h++){let u=c<<4|h,f=(c+1)*Ne+h+1,d=s[f],g=r[f],b=a+h,p=o+c,m=n[d<<8|u];if(m===vi||m===mf)continue;let _=this.frozen[u],y=ms(l^IE,b,p),v=(y&65535)/65536,w=(y>>>16)/65536;if(d<62){if(_)continue;let A=62-d;if(g===qn&&A<=2)v<.09&&n[16128|u]===vi&&(n[16128|u]=gE);else if(A>=2&&A<=14&&(m===yn||m===Cn||m===wi||m===Ws)){let L=this.nGrass.noise2(b*.07142857142857142,p*.07142857142857142),P=g===Si?.22:.12+.3*He(-.2,.6,L);v<P&&n[d+1<<8|u]===$o&&(n[d+1<<8|u]=bE)}continue}let S=d+1<<8|u;if(!(d>=255||n[S]!==vi)&&!_){if(d===62&&(m===$n||m===yn||m===wi||m===qa||m===Nr)&&this.waterBeside(f,h,c)&&v<.22&&this.nFlower.noise2(b*(1/20),p*(1/20))>-.3){let A=1+(y>>>20)%3;for(let L=1;L<=A&&n[d+L<<8|u]===vi;L++)n[d+L<<8|u]=mE;continue}m===$n?this.plant(g,b,p,d,u,v,w):m===qa||m===uf?v<.1?n[S]=_f:v<.15?n[S]=Ka:v<.16&&(n[S]=P1):m===yn&&g===Yo?v<.012&&(n[S]=R1):m===Nr&&g===qn&&v<.05&&(n[S]=Ka)}}this.cacti(t,e),this.pumpkins(t,e),this.snowCover()}waterBeside(t,e,n){let s=this.hm,r=(a,o,l)=>s[a]>=62?!1:o>=0&&o<16&&l>=0&&l<16?this.blocks[15872|l<<4|o]===$o:this.tm[a]>=Vs;return r(t+1,e+1,n)||r(t-1,e-1,n)||r(t+Ne,e,n+1)||r(t-Ne,e,n-1)}shaded(t,e){let n=this.blocks;for(let s=e+2;s<Math.min(256,e+18);s++)if(ti[n[s<<8|t]&1023])return!0;return!1}plant(t,e,n,s,r,a,o){var p;let l=this.blocks,c=s+1<<8|r,h=this.nGrass.noise2(e*(1/19),n*(1/19)),u=this.nFlower.noise2(e*(1/26),n*(1/26)),f=0,d=0,g=0,b=0;switch(t){case Gi:f=.22+.22*h,g=u>.4?.12:.006;break;case $s:f=.14+.1*h,d=.02,g=u>.5?.05:.005,b=.03;break;case Or:f=.16+.1*h,d=.015,g=u>.45?.06:.006,b=.015;break;case qn:f=.16+.08*h,d=.03,g=.012,b=.02;break;case jo:f=.28+.12*h,g=u>.2?.06:.01;break;case Mi:f=.2+.12*h,d=s<118?.05:.01,g=u>.3?.07:.004;break;case Si:case Fr:f=.1,g=.003;break;default:f=.15}if(a<g){let m=(p=Wi[t])!=null?p:Wi[Gi],_=Math.floor((this.nFlowerType.noise2(e*(1/40),n*(1/40))*.5+.5)*m.length);o<.2&&(_=Math.floor(o*5*m.length)),l[c]=m[Math.max(0,Math.min(m.length-1,_))];return}if(b>0&&a<g+b&&this.shaded(r,s)){l[c]=o<.6?P1:_E;return}if(a<g+b+d){l[c]=_f;return}a<g+b+d+f&&(l[c]=o<.08&&t!==Gi?_f:Ka)}cacti(t,e){let n=this.blocks,s=this.hm,r=this.bm;for(let a=0;a<4;a++)for(let o=0;o<4;o++){let l=ms(this.seed^BE,t*4+o,e*4+a);if((l&65535)/65536>.08)continue;let c=o*4+1+(l>>>16&1),h=a*4+1+(l>>>17&1),u=(h+1)*Ne+c+1,f=s[u];if(r[u]!==Yo||f<63||f>240)continue;let d=h<<4|c;if(n[f<<8|d]!==yn||s[u+1]>f||s[u-1]>f||s[u+Ne]>f||s[u-Ne]>f)continue;let g=1+(l>>>18)%3;for(let b=1;b<=g;b++){let p=f+b<<8|d;if(n[p]!==vi&&n[p]!==R1)break;n[p]=L1}}}pumpkins(t,e){let n=ms(this.seed^FE,t,e);if((n&65535)/65536>.035)return;let s=this.blocks,r=this.hm,a=this.bm,o=4+(n>>>16&7),l=4+(n>>>19&7),c=this.rng2.seed(n);for(let h=-3;h<=3;h++)for(let u=-3;u<=3;u++){let f=c.next()<.22,d=o+u,g=l+h;if(!f)continue;let b=(g+1)*Ne+d+1,p=a[b];if(p!==Gi&&p!==$s&&p!==Or&&p!==Mi)continue;let m=r[b],_=g<<4|d;if(s[m<<8|_]!==$n)continue;let y=m+1<<8|_;(s[y]===vi||s[y]===Ka)&&(s[y]=yE)}}snowCover(){let t=this.blocks,e=this.hm;for(let n=0;n<256;n++){if(!this.frozen[n])continue;let s=n&15,r=n>>4,a=e[(r+1)*Ne+s+1],o=Math.min(254,a+40);for(;o>0&&t[o<<8|n]===vi;)o--;let l=t[o<<8|n];if(l===$n&&(t[o<<8|n]=Vo),!(l===$o||l===C1||l===Ya||l===mf||l===pf||l===ff||l===L1)&&!(o===a&&this.slopes[n]>=5&&l!==$n)&&((ws[l&1023]||ti[l&1023])&&o<255&&t[o+1<<8|n]===vi&&(t[o+1<<8|n]=pf),o>a)){let c=a<<8|n;t[c]===$n&&(t[c]=Vo)}}}tints(t){let e=this.tintGrid,n=this.tintBlur,s=this.X0-8,r=this.Z0-8;for(let a=0;a<Xn;a++)for(let o=0;o<Xn;o++){let l=s+o*4,c=r+a*4,h=this.sample(l,c),u=this.sB,f=this.sT,d=$1[u],g=(a*Xn+o)*9;for(let m=0;m<9;m++)e[g+m]=d[m];if(u===Br||u===bs||u===Si||u===Fr||u===Jo){let m=He(-.15,-.55,f),_=He(.35,.7,f);for(let y=0;y<3;y++)e[g+6+y]=e[g+6+y]+(TE[y]-e[g+6+y])*m,e[g+6+y]=e[g+6+y]+(CE[y]-e[g+6+y])*_*(u===bs?.6:1)}let b=Math.max(He(95,150,h),He(Vs+.25,Vs,f))*(u===qn?0:1);if(b>0)for(let m=0;m<3;m++)e[g+m]+=(kE[m]-e[g+m])*b,e[g+3+m]+=(RE[m]-e[g+3+m])*b;let p=this.sHum*6;e[g]-=p*.5,e[g+1]+=p*.3,e[g+3]-=p*.5,e[g+4]+=p*.3}for(let a=1;a<Xn-1;a++)for(let o=1;o<Xn-1;o++){let l=(a*Xn+o)*9;for(let c=0;c<9;c++){let h=0;for(let u=-1;u<=1;u++)for(let f=-1;f<=1;f++)h+=e[((a+u)*Xn+o+f)*9+c];n[l+c]=h/9}}for(let a=0;a<16;a++){let o=(a+8)/4,l=Math.floor(o),c=o-l;for(let h=0;h<16;h++){let u=(h+8)/4,f=Math.floor(u),d=u-f,g=(l*Xn+f)*9,b=g+9,p=g+Xn*9,m=p+9,_=(1-d)*(1-c),y=d*(1-c),v=(1-d)*c,w=d*c,S=(a<<4|h)*9;for(let A=0;A<9;A++){let L=n[g+A]*_+n[b+A]*y+n[p+A]*v+n[m+A]*w;t[S+A]=L<0?0:L>255?255:Math.round(L)}}}}findSpawn(){var o;if(this.spawn)return{x:this.spawn.x,z:this.spawn.z};let t=8,e=null,n=null,s=l=>l===Gi||l===$s,r=l=>l!==Br&&l!==bs&&l!==Si&&l!==qn;for(let l=0;l<=400&&!n;l++){for(let c=0;c<Math.max(1,l*8)&&!n;c++){let h,u,f=l*2;l===0?(h=0,u=0):c<f?(h=-l+c,u=-l):c<f*2?(h=l,u=-l+(c-f)):c<f*3?(h=l-(c-f*2),u=l):(h=-l,u=l-(c-f*3));let d=h*t,g=u*t,b=this.sample(d,g),p=this.sB;if(!(b<63||b>140||!r(p)||this.isEntrance(d,g))&&!(this.slopeAt(d,g)>2)){if(s(p)){let m=this.verifySpawn(d,g);m&&(n=m)}else!e&&l>0&&(e=this.verifySpawn(d,g));if(!n&&e&&l>128)break}}if(!n&&e&&l>128)break}let a=(o=n!=null?n:e)!=null?o:{x:0,z:0};return this.spawn=a,{x:a.x,z:a.z}}verifySpawn(t,e){let n=Math.floor(t/16),s=Math.floor(e/16),a=this.generate(n,s).blocks,o=null,l=1e9;for(let c=0;c<16;c++)for(let h=0;h<16;h++){let u=n*16+h,f=s*16+c,d=this.sample(u,f);if(d<63||d>250||this.sB===Si||this.sB===Br||this.sB===bs)continue;let g=c<<4|h,b=a[d<<8|g]&1023;if(!ws[b]||ti[b])continue;let p=!0;for(let _=d+1;_<=d+3;_++){let y=a[_<<8|g]&1023;if(ge[y]||ce[y]){p=!1;break}}if(!p)continue;let m=(u-t)*(u-t)+(f-e)*(f-e);m<l&&(l=m,o={x:u,z:f})}return o}};var X1='"use strict";(()=>{var Rs=.5*(Math.sqrt(3)-1),Fe=(3-Math.sqrt(3))/6,Ns=1/3,oe=1/6,X=new Float64Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]),Me=new Float64Array([1,0,-1,0,0,1,0,-1,.7071067811865476,.7071067811865476,-.7071067811865476,.7071067811865476,.7071067811865476,-.7071067811865476,-.7071067811865476,-.7071067811865476]);function at(o){return o^=o>>>16,o=Math.imul(o,2146121005),o^=o>>>15,o=Math.imul(o,2221713035),o^=o>>>16,o>>>0}function le(o,e,s){return at((o^Math.imul(e|0,668265261)^Math.imul(s|0,374761393))>>>0)}function it(o,e,s,t){return at((o^Math.imul(e|0,668265261)^Math.imul(s|0,2654435761)^Math.imul(t|0,374761393))>>>0)}var Te=class{constructor(e=0){this.s=e>>>0}seed(e){return this.s=e>>>0,this}u32(){let e=this.s=this.s+1831565813>>>0;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),(e^e>>>14)>>>0}next(){return this.u32()/4294967296}int(e){return Math.floor(this.next()*e)}range(e,s){return e+Math.floor(this.next()*(s-e+1))}chance(e){return this.next()<e}},Ze=class{constructor(e){this.perm=new Uint8Array(512);this.perm12=new Uint8Array(512);this.perm8=new Uint8Array(512);let s=new Uint8Array(256);for(let n=0;n<256;n++)s[n]=n;let t=new Te(at(e>>>0^1540483477));for(let n=255;n>0;n--){let p=t.int(n+1),m=s[n];s[n]=s[p],s[p]=m}for(let n=0;n<512;n++){let p=s[n&255];this.perm[n]=p,this.perm12[n]=p%12,this.perm8[n]=p&7}}noise2(e,s){let t=this.perm,n=this.perm8,p=(e+s)*Rs,m=Math.floor(e+p),u=Math.floor(s+p),d=(m+u)*Fe,i=e-(m-d),c=s-(u-d),r,l;i>c?(r=1,l=0):(r=0,l=1);let a=i-r+Fe,f=c-l+Fe,g=i-1+2*Fe,y=c-1+2*Fe,b=m&255,x=u&255,_=0,k=.5-i*i-c*c;if(k>0){let E=n[b+t[x]]<<1;k*=k,_+=k*k*(Me[E]*i+Me[E+1]*c)}let S=.5-a*a-f*f;if(S>0){let E=n[b+r+t[x+l]]<<1;S*=S,_+=S*S*(Me[E]*a+Me[E+1]*f)}let v=.5-g*g-y*y;if(v>0){let E=n[b+1+t[x+1]]<<1;v*=v,_+=v*v*(Me[E]*g+Me[E+1]*y)}return 99.204*_}noise3(e,s,t){let n=this.perm,p=this.perm12,m=(e+s+t)*Ns,u=Math.floor(e+m),d=Math.floor(s+m),i=Math.floor(t+m),c=(u+d+i)*oe,r=e-(u-c),l=s-(d-c),a=t-(i-c),f,g,y,b,x,_;r>=l?l>=a?(f=1,g=0,y=0,b=1,x=1,_=0):r>=a?(f=1,g=0,y=0,b=1,x=0,_=1):(f=0,g=0,y=1,b=1,x=0,_=1):l<a?(f=0,g=0,y=1,b=0,x=1,_=1):r<a?(f=0,g=1,y=0,b=0,x=1,_=1):(f=0,g=1,y=0,b=1,x=1,_=0);let k=r-f+oe,S=l-g+oe,v=a-y+oe,E=r-b+2*oe,T=l-x+2*oe,B=a-_+2*oe,z=r-1+3*oe,P=l-1+3*oe,M=a-1+3*oe,O=u&255,j=d&255,V=i&255,ae=0,A=.6-r*r-l*l-a*a;if(A>0){let C=p[O+n[j+n[V]]]*3;A*=A,ae+=A*A*(X[C]*r+X[C+1]*l+X[C+2]*a)}let I=.6-k*k-S*S-v*v;if(I>0){let C=p[O+f+n[j+g+n[V+y]]]*3;I*=I,ae+=I*I*(X[C]*k+X[C+1]*S+X[C+2]*v)}let G=.6-E*E-T*T-B*B;if(G>0){let C=p[O+b+n[j+x+n[V+_]]]*3;G*=G,ae+=G*G*(X[C]*E+X[C+1]*T+X[C+2]*B)}let Z=.6-z*z-P*P-M*M;if(Z>0){let C=p[O+1+n[j+1+n[V+1]]]*3;Z*=Z,ae+=Z*Z*(X[C]*z+X[C+1]*P+X[C+2]*M)}return 32*ae}},$t=[0,37.17,-91.43,151.9,-203.3,263.7,-317.1,389.5,-431.9,499.3],zt=[0,-53.71,71.29,-127.3,181.7,-241.1,293.9,-347.3,409.1,-461.7];function ce(o,e,s,t,n=2,p=.5){let m=0,u=1,d=0,i=1;for(let c=0;c<t;c++)m+=u*o.noise2(e*i+$t[c%10],s*i+zt[c%10]),d+=u,u*=p,i*=n;return m/d}function Gt(o,e,s,t,n=2,p=.5){let m=0,u=1,d=0,i=1,c=1;for(let r=0;r<t;r++){let l=1-Math.abs(o.noise2(e*i+$t[r%10],s*i+zt[r%10]));l*=l,l*=c,c=l*1.6>1?1:l*1.6,m+=l*u,d+=u,u*=p,i*=n}return m/d}var he=["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"],Os=["oak","spruce","birch","jungle","acacia","dark_oak","mangrove","cherry"],de=o=>o.split("_").map(e=>e[0].toUpperCase()+e.slice(1)).join(" "),$e=[],h=o=>($e.push(o),o);h({name:"air",display:"Air",cat:"natural",tex:"missing",solid:!1,transparent:!0,opacity:0,replaceable:!0,item:!1,layer:"cutout",shape:"cross"});h({name:"grass_block",display:"Grass Block",cat:"natural",tex:{top:"grass_top",bottom:"dirt",side:"grass_side"},tint:"grass",tintMask:!0,sound:"grass"});h({name:"snowy_grass_block",display:"Snowy Grass Block",cat:"natural",tex:{top:"snow",bottom:"dirt",side:"grass_side_snowy"},sound:"snow"});h({name:"dirt",display:"Dirt",cat:"natural",tex:"dirt",sound:"gravel"});h({name:"coarse_dirt",display:"Coarse Dirt",cat:"natural",tex:"coarse_dirt",sound:"gravel"});h({name:"podzol",display:"Podzol",cat:"natural",tex:{top:"podzol_top",bottom:"dirt",side:"podzol_side"},sound:"gravel"});h({name:"rooted_dirt",display:"Rooted Dirt",cat:"natural",tex:"rooted_dirt",sound:"gravel"});h({name:"mycelium",display:"Mycelium",cat:"natural",tex:{top:"mycelium_top",bottom:"dirt",side:"mycelium_side"},sound:"grass"});h({name:"dirt_path",display:"Dirt Path",cat:"natural",tex:{top:"path_top",bottom:"dirt",side:"path_side"},sound:"grass"});h({name:"mud",display:"Mud",cat:"natural",tex:"mud",sound:"gravel"});h({name:"clay",display:"Clay",cat:"natural",tex:"clay",sound:"gravel"});h({name:"moss_block",display:"Moss Block",cat:"natural",tex:"moss",sound:"grass"});h({name:"sand",display:"Sand",cat:"natural",tex:"sand",sound:"sand"});h({name:"red_sand",display:"Red Sand",cat:"natural",tex:"red_sand",sound:"sand"});h({name:"gravel",display:"Gravel",cat:"natural",tex:"gravel",sound:"gravel"});h({name:"stone",display:"Stone",cat:"natural",tex:"stone"});h({name:"granite",display:"Granite",cat:"natural",tex:"granite"});h({name:"diorite",display:"Diorite",cat:"natural",tex:"diorite"});h({name:"andesite",display:"Andesite",cat:"natural",tex:"andesite"});h({name:"deepslate",display:"Deepslate",cat:"natural",tex:{top:"deepslate_top",bottom:"deepslate_top",side:"deepslate"},orient:"axis"});h({name:"tuff",display:"Tuff",cat:"natural",tex:"tuff"});h({name:"calcite",display:"Calcite",cat:"natural",tex:"calcite"});h({name:"dripstone_block",display:"Dripstone Block",cat:"natural",tex:"dripstone"});h({name:"bedrock",display:"Bedrock",cat:"natural",tex:"bedrock"});h({name:"snow_block",display:"Snow Block",cat:"natural",tex:"snow",sound:"snow"});h({name:"snow",display:"Snow",cat:"natural",tex:"snow",shape:"layer",sound:"snow",replaceable:!0,support:"solid"});h({name:"ice",display:"Ice",cat:"natural",tex:"ice",layer:"translucent",cullSelf:!0,opacity:1,sound:"glass"});h({name:"packed_ice",display:"Packed Ice",cat:"natural",tex:"packed_ice",sound:"glass"});h({name:"blue_ice",display:"Blue Ice",cat:"natural",tex:"blue_ice",sound:"glass"});h({name:"obsidian",display:"Obsidian",cat:"natural",tex:"obsidian"});h({name:"crying_obsidian",display:"Crying Obsidian",cat:"natural",tex:"crying_obsidian",light:10});h({name:"netherrack",display:"Netherrack",cat:"natural",tex:"netherrack"});h({name:"soul_sand",display:"Soul Sand",cat:"natural",tex:"soul_sand",sound:"sand"});h({name:"soul_soil",display:"Soul Soil",cat:"natural",tex:"soul_soil",sound:"sand"});h({name:"magma_block",display:"Magma Block",cat:"natural",tex:"magma",light:3});h({name:"basalt",display:"Basalt",cat:"natural",tex:{end:"basalt_top",side:"basalt_side"},orient:"axis"});h({name:"blackstone",display:"Blackstone",cat:"natural",tex:{top:"blackstone_top",bottom:"blackstone_top",side:"blackstone"}});h({name:"end_stone",display:"End Stone",cat:"natural",tex:"end_stone"});h({name:"amethyst_block",display:"Block of Amethyst",cat:"natural",tex:"amethyst",sound:"glass"});h({name:"bone_block",display:"Bone Block",cat:"natural",tex:{end:"bone_top",side:"bone_side"},orient:"axis"});var ds=[["coal","Coal"],["iron","Iron"],["copper","Copper"],["gold","Gold"],["redstone","Redstone"],["lapis","Lapis Lazuli"],["diamond","Diamond"],["emerald","Emerald"]];for(let[o,e]of ds)h({name:`${o}_ore`,display:`${e} Ore`,cat:"ores",tex:`ore_stone_${o}`,light:0});for(let[o,e]of ds)h({name:`deepslate_${o}_ore`,display:`Deepslate ${e} Ore`,cat:"ores",tex:`ore_deepslate_${o}`});h({name:"nether_gold_ore",display:"Nether Gold Ore",cat:"ores",tex:"ore_nether_gold"});h({name:"nether_quartz_ore",display:"Nether Quartz Ore",cat:"ores",tex:"ore_nether_quartz"});var Ls=[["coal_block","Block of Coal"],["iron_block","Block of Iron"],["copper_block","Block of Copper"],["gold_block","Block of Gold"],["redstone_block","Block of Redstone"],["lapis_block","Block of Lapis Lazuli"],["diamond_block","Block of Diamond"],["emerald_block","Block of Emerald"],["netherite_block","Block of Netherite"],["raw_iron_block","Block of Raw Iron"],["raw_copper_block","Block of Raw Copper"],["raw_gold_block","Block of Raw Gold"],["exposed_copper","Exposed Copper"],["weathered_copper","Weathered Copper"],["oxidized_copper","Oxidized Copper"]];for(let[o,e]of Ls)h({name:o,display:e,cat:"ores",tex:o,sound:"metal"});for(let o of Os){let e=de(o),s=o;h({name:`${o}_log`,display:`${e} Log`,cat:"wood",tex:{end:`${s}_log_top`,side:`${s}_log`},orient:"axis",sound:"wood"}),h({name:`${o}_wood`,display:`${e} Wood`,cat:"wood",tex:`${s}_log`,orient:"axis",sound:"wood"}),h({name:`stripped_${o}_log`,display:`Stripped ${e} Log`,cat:"wood",tex:{end:`stripped_${o}_log_top`,side:`stripped_${o}_log`},orient:"axis",sound:"wood"}),h({name:`${o}_planks`,display:`${e} Planks`,cat:"wood",tex:`${o}_planks`,sound:"wood"});let t=o!=="spruce"&&o!=="birch"&&o!=="cherry";h({name:`${o}_leaves`,display:`${e} Leaves`,cat:"wood",tex:`${o}_leaves`,layer:"cutout",opacity:1,tint:t?"foliage":"none",sound:"grass",wave:"leaves"}),h({name:`${o}_slab`,display:`${e} Slab`,cat:"wood",tex:`${o}_planks`,shape:"slab",sound:"wood"}),h({name:`${o}_stairs`,display:`${e} Stairs`,cat:"wood",tex:`${o}_planks`,shape:"stairs",sound:"wood"}),h({name:`${o}_fence`,display:`${e} Fence`,cat:"wood",tex:`${o}_planks`,shape:"fence",family:"wood_fence",sound:"wood"}),h({name:`${o}_door`,display:`${e} Door`,cat:"wood",tex:{top:`${o}_door_top`,bottom:`${o}_door_bottom`,side:`${o}_door_bottom`},shape:"door",layer:"cutout",sound:"wood"}),h({name:`${o}_trapdoor`,display:`${e} Trapdoor`,cat:"wood",tex:`${o}_trapdoor`,shape:"trapdoor",layer:"cutout",sound:"wood"}),h({name:`${o}_sapling`,display:`${e} Sapling`,cat:"wood",tex:`${o}_sapling`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"})}var Is=[["cobblestone","Cobblestone","cobblestone"],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone"],["smooth_stone","Smooth Stone","smooth_stone"],["stone_bricks","Stone Bricks","stone_bricks"],["mossy_stone_bricks","Mossy Stone Bricks","mossy_stone_bricks"],["cracked_stone_bricks","Cracked Stone Bricks","cracked_stone_bricks"],["chiseled_stone_bricks","Chiseled Stone Bricks","chiseled_stone_bricks"],["bricks","Bricks","bricks"],["polished_granite","Polished Granite","polished_granite"],["polished_diorite","Polished Diorite","polished_diorite"],["polished_andesite","Polished Andesite","polished_andesite"],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate"],["polished_deepslate","Polished Deepslate","polished_deepslate"],["deepslate_bricks","Deepslate Bricks","deepslate_bricks"],["deepslate_tiles","Deepslate Tiles","deepslate_tiles"],["polished_tuff","Polished Tuff","polished_tuff"],["mud_bricks","Mud Bricks","mud_bricks"],["packed_mud","Packed Mud","packed_mud"],["prismarine","Prismarine","prismarine"],["prismarine_bricks","Prismarine Bricks","prismarine_bricks"],["dark_prismarine","Dark Prismarine","dark_prismarine"],["nether_bricks","Nether Bricks","nether_bricks"],["red_nether_bricks","Red Nether Bricks","red_nether_bricks"],["cracked_nether_bricks","Cracked Nether Bricks","cracked_nether_bricks"],["chiseled_nether_bricks","Chiseled Nether Bricks","chiseled_nether_bricks"],["polished_blackstone","Polished Blackstone","polished_blackstone"],["polished_blackstone_bricks","Polished Blackstone Bricks","polished_blackstone_bricks"],["end_stone_bricks","End Stone Bricks","end_stone_bricks"],["purpur_block","Purpur Block","purpur"],["terracotta","Terracotta","terracotta"]];for(let[o,e,s]of Is)h({name:o,display:e,cat:"building",tex:s});h({name:"sandstone",display:"Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_bottom",side:"sandstone"}});h({name:"chiseled_sandstone",display:"Chiseled Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"chiseled_sandstone"}});h({name:"cut_sandstone",display:"Cut Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"cut_sandstone"}});h({name:"smooth_sandstone",display:"Smooth Sandstone",cat:"building",tex:"sandstone_top"});h({name:"red_sandstone",display:"Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_bottom",side:"red_sandstone"}});h({name:"chiseled_red_sandstone",display:"Chiseled Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"chiseled_red_sandstone"}});h({name:"cut_red_sandstone",display:"Cut Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"cut_red_sandstone"}});h({name:"smooth_red_sandstone",display:"Smooth Red Sandstone",cat:"building",tex:"red_sandstone_top"});h({name:"quartz_block",display:"Block of Quartz",cat:"building",tex:{top:"quartz_top",bottom:"quartz_top",side:"quartz_side"}});h({name:"chiseled_quartz_block",display:"Chiseled Quartz Block",cat:"building",tex:{end:"chiseled_quartz_top",side:"chiseled_quartz"},orient:"axis"});h({name:"quartz_pillar",display:"Quartz Pillar",cat:"building",tex:{end:"quartz_pillar_top",side:"quartz_pillar"},orient:"axis"});h({name:"quartz_bricks",display:"Quartz Bricks",cat:"building",tex:"quartz_bricks"});h({name:"smooth_quartz",display:"Smooth Quartz Block",cat:"building",tex:"quartz_top"});h({name:"purpur_pillar",display:"Purpur Pillar",cat:"building",tex:{end:"purpur_pillar_top",side:"purpur_pillar"},orient:"axis"});h({name:"glass",display:"Glass",cat:"building",tex:"glass",layer:"cutout",cullSelf:!0,sound:"glass"});h({name:"tinted_glass",display:"Tinted Glass",cat:"building",tex:"tinted_glass",layer:"translucent",cullSelf:!0,opacity:15,sound:"glass"});h({name:"glass_pane",display:"Glass Pane",cat:"building",tex:"glass",shape:"pane",layer:"cutout",family:"pane",sound:"glass"});h({name:"iron_bars",display:"Iron Bars",cat:"building",tex:"iron_bars",shape:"pane",layer:"cutout",family:"pane",sound:"metal"});var Ps=[["stone","Stone","stone",!1],["cobblestone","Cobblestone","cobblestone",!0],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone",!0],["smooth_stone","Smooth Stone","smooth_stone_slab_side",!1],["stone_brick","Stone Brick","stone_bricks",!0],["brick","Brick","bricks",!0],["sandstone","Sandstone","sandstone_top",!0],["red_sandstone","Red Sandstone","red_sandstone_top",!0],["quartz","Quartz","quartz_top",!1],["granite","Granite","granite",!0],["diorite","Diorite","diorite",!0],["andesite","Andesite","andesite",!0],["polished_andesite","Polished Andesite","polished_andesite",!1],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate",!0],["deepslate_brick","Deepslate Brick","deepslate_bricks",!0],["prismarine","Prismarine","prismarine",!0],["nether_brick","Nether Brick","nether_bricks",!0],["blackstone","Blackstone","blackstone",!0],["end_stone_brick","End Stone Brick","end_stone_bricks",!0],["purpur","Purpur","purpur",!1],["mud_brick","Mud Brick","mud_bricks",!0]];for(let[o,e,s,t]of Ps){let n=o==="smooth_stone"?{top:"smooth_stone",bottom:"smooth_stone",side:s}:s;h({name:`${o}_slab`,display:`${e} Slab`,cat:"building",tex:n,shape:"slab"}),o!=="smooth_stone"&&h({name:`${o}_stairs`,display:`${e} Stairs`,cat:"building",tex:s,shape:"stairs"}),t&&h({name:`${o}_wall`,display:`${e} Wall`,cat:"building",tex:s,shape:"wall",family:"wall"})}for(let o of he)h({name:`${o}_wool`,display:`${de(o)} Wool`,cat:"colored",tex:`wool_${o}`,sound:"wool"});for(let o of he)h({name:`${o}_carpet`,display:`${de(o)} Carpet`,cat:"colored",tex:`wool_${o}`,shape:"carpet",sound:"wool",support:"solid"});for(let o of he)h({name:`${o}_concrete`,display:`${de(o)} Concrete`,cat:"colored",tex:`concrete_${o}`});for(let o of he)h({name:`${o}_concrete_powder`,display:`${de(o)} Concrete Powder`,cat:"colored",tex:`powder_${o}`,sound:"sand"});for(let o of he)h({name:`${o}_terracotta`,display:`${de(o)} Terracotta`,cat:"colored",tex:`terracotta_${o}`});for(let o of he)h({name:`${o}_glazed_terracotta`,display:`${de(o)} Glazed Terracotta`,cat:"colored",tex:`glazed_${o}`,orient:"horizontal"});for(let o of he)h({name:`${o}_stained_glass`,display:`${de(o)} Stained Glass`,cat:"colored",tex:`stained_glass_${o}`,layer:"translucent",cullSelf:!0,sound:"glass"});for(let o of he)h({name:`${o}_stained_glass_pane`,display:`${de(o)} Stained Glass Pane`,cat:"colored",tex:`stained_glass_${o}`,shape:"pane",layer:"translucent",family:"pane",sound:"glass"});h({name:"glowstone",display:"Glowstone",cat:"light",tex:"glowstone",light:15,sound:"glass"});h({name:"sea_lantern",display:"Sea Lantern",cat:"light",tex:"sea_lantern",light:15,sound:"glass"});h({name:"torch",display:"Torch",cat:"light",tex:"torch",shape:"torch",layer:"cutout",light:14,solid:!1,sound:"wood"});h({name:"soul_torch",display:"Soul Torch",cat:"light",tex:"soul_torch",shape:"torch",layer:"cutout",light:10,solid:!1,sound:"wood"});h({name:"lantern",display:"Lantern",cat:"light",tex:"lantern",shape:"lantern",layer:"cutout",light:15,sound:"metal"});h({name:"soul_lantern",display:"Soul Lantern",cat:"light",tex:"soul_lantern",shape:"lantern",layer:"cutout",light:10,sound:"metal"});h({name:"shroomlight",display:"Shroomlight",cat:"light",tex:"shroomlight",light:15,sound:"wool"});h({name:"jack_o_lantern",display:"Jack o\'Lantern",cat:"light",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"jack_o_lantern"},orient:"horizontal",light:15,sound:"wood"});h({name:"redstone_lamp",display:"Redstone Lamp",cat:"light",tex:"redstone_lamp_on",light:15,sound:"glass"});h({name:"ochre_froglight",display:"Ochre Froglight",cat:"light",tex:{end:"froglight_ochre_top",side:"froglight_ochre"},orient:"axis",light:15});h({name:"verdant_froglight",display:"Verdant Froglight",cat:"light",tex:{end:"froglight_verdant_top",side:"froglight_verdant"},orient:"axis",light:15});h({name:"pearlescent_froglight",display:"Pearlescent Froglight",cat:"light",tex:{end:"froglight_pearl_top",side:"froglight_pearl"},orient:"axis",light:15});h({name:"end_rod",display:"End Rod",cat:"light",tex:"end_rod",shape:"rod",layer:"cutout",light:14,sound:"glass"});h({name:"campfire_log_glow",display:"Glowing Embers",cat:"light",tex:"embers",light:12,sound:"wood"});h({name:"bookshelf",display:"Bookshelf",cat:"decor",tex:{top:"oak_planks",bottom:"oak_planks",side:"bookshelf"},sound:"wood"});h({name:"crafting_table",display:"Crafting Table",cat:"decor",tex:{top:"crafting_table_top",bottom:"oak_planks",side:"crafting_table_side",front:"crafting_table_front"},orient:"horizontal",sound:"wood"});h({name:"furnace",display:"Furnace",cat:"decor",tex:{top:"furnace_top",bottom:"furnace_top",side:"furnace_side",front:"furnace_front"},orient:"horizontal"});h({name:"blast_furnace",display:"Blast Furnace",cat:"decor",tex:{top:"blast_furnace_top",bottom:"blast_furnace_top",side:"blast_furnace_side",front:"blast_furnace_front"},orient:"horizontal"});h({name:"chest",display:"Chest",cat:"decor",tex:{top:"chest_top",bottom:"chest_top",side:"chest_side",front:"chest_front"},shape:"chest",orient:"horizontal",layer:"cutout",sound:"wood"});h({name:"barrel",display:"Barrel",cat:"decor",tex:{end:"barrel_top",side:"barrel_side"},orient:"axis",sound:"wood"});h({name:"note_block",display:"Note Block",cat:"decor",tex:"note_block",sound:"wood"});h({name:"jukebox",display:"Jukebox",cat:"decor",tex:{top:"jukebox_top",bottom:"jukebox_side",side:"jukebox_side"},sound:"wood"});h({name:"tnt",display:"TNT",cat:"decor",tex:{top:"tnt_top",bottom:"tnt_bottom",side:"tnt_side"},sound:"grass"});h({name:"target",display:"Target",cat:"decor",tex:{top:"target_top",bottom:"target_top",side:"target_side"},sound:"grass"});h({name:"pumpkin",display:"Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side"},sound:"wood"});h({name:"carved_pumpkin",display:"Carved Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"carved_pumpkin"},orient:"horizontal",sound:"wood"});h({name:"melon",display:"Melon",cat:"decor",tex:{top:"melon_top",bottom:"melon_top",side:"melon_side"},sound:"wood"});h({name:"hay_block",display:"Hay Bale",cat:"decor",tex:{end:"hay_top",side:"hay_side"},orient:"axis",sound:"grass"});h({name:"sponge",display:"Sponge",cat:"decor",tex:"sponge",sound:"grass"});h({name:"wet_sponge",display:"Wet Sponge",cat:"decor",tex:"wet_sponge",sound:"grass"});h({name:"slime_block",display:"Slime Block",cat:"decor",tex:"slime",layer:"translucent",cullSelf:!0,sound:"slime"});h({name:"honey_block",display:"Honey Block",cat:"decor",tex:"honey",layer:"translucent",cullSelf:!0,sound:"slime"});h({name:"honeycomb_block",display:"Honeycomb Block",cat:"decor",tex:"honeycomb",sound:"wool"});h({name:"dried_kelp_block",display:"Dried Kelp Block",cat:"decor",tex:{top:"kelp_top",bottom:"kelp_top",side:"kelp_side"},sound:"grass"});h({name:"brown_mushroom_block",display:"Brown Mushroom Block",cat:"decor",tex:"mushroom_brown",sound:"wood"});h({name:"red_mushroom_block",display:"Red Mushroom Block",cat:"decor",tex:"mushroom_red",sound:"wood"});h({name:"mushroom_stem",display:"Mushroom Stem",cat:"decor",tex:"mushroom_stem",sound:"wood"});h({name:"cobweb",display:"Cobweb",cat:"decor",tex:"cobweb",shape:"cross",layer:"cutout",solid:!1,sound:"wool"});h({name:"cactus",display:"Cactus",cat:"decor",tex:{top:"cactus_top",bottom:"cactus_bottom",side:"cactus_side"},shape:"cactus",layer:"cutout",support:"cactus",sound:"wool"});h({name:"sugar_cane",display:"Sugar Cane",cat:"decor",tex:"sugar_cane",shape:"cross",layer:"cutout",solid:!1,support:"cane",sound:"grass"});h({name:"short_grass",display:"Short Grass",cat:"decor",tex:"tall_grass",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});h({name:"fern",display:"Fern",cat:"decor",tex:"fern",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});h({name:"dead_bush",display:"Dead Bush",cat:"decor",tex:"dead_bush",shape:"cross",layer:"cutout",solid:!1,replaceable:!0,support:"sand",sound:"grass",wave:"plant"});var Us=[["dandelion","Dandelion"],["poppy","Poppy"],["blue_orchid","Blue Orchid"],["allium","Allium"],["azure_bluet","Azure Bluet"],["red_tulip","Red Tulip"],["orange_tulip","Orange Tulip"],["white_tulip","White Tulip"],["pink_tulip","Pink Tulip"],["oxeye_daisy","Oxeye Daisy"],["cornflower","Cornflower"],["lily_of_the_valley","Lily of the Valley"]];for(let[o,e]of Us)h({name:o,display:e,cat:"decor",tex:`flower_${o}`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"});h({name:"brown_mushroom",display:"Brown Mushroom",cat:"decor",tex:"brown_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});h({name:"red_mushroom",display:"Red Mushroom",cat:"decor",tex:"red_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});h({name:"lily_pad",display:"Lily Pad",cat:"decor",tex:"lily_pad",shape:"lily",layer:"cutout",solid:!0,tint:"foliage",support:"water",sound:"grass"});h({name:"seagrass",display:"Seagrass",cat:"decor",tex:"seagrass",shape:"cross",layer:"cutout",solid:!1,item:!1,sound:"grass",wave:"plant"});h({name:"water",display:"Water",cat:"fluids",tex:"water",shape:"fluid",layer:"water",fluid:!0,solid:!1,opacity:1,replaceable:!0,cullSelf:!0,tint:"water",sound:"liquid"});h({name:"lava",display:"Lava",cat:"fluids",tex:"lava",shape:"fluid",layer:"lava",fluid:!0,solid:!1,light:15,opacity:0,replaceable:!0,cullSelf:!0,sound:"liquid"});var R=$e.length,ut={};$e.forEach((o,e)=>{ut[o.name]=e});var Fs=["cube","slab","stairs","fence","wall","cross","torch","door","trapdoor","pane","fluid","layer","carpet","cactus","lantern","chest","rod","lily"],$s=Object.fromEntries(Fs.map((o,e)=>[o,e])),zs=["opaque","cutout","translucent","water","lava"],ct=Object.fromEntries(zs.map((o,e)=>[o,e])),Gs=new Uint8Array(R),dt=new Uint8Array(R),Hs=new Uint8Array(R),us=new Uint8Array(R),Je=new Uint8Array(R),et=new Uint8Array(R),pt=new Uint8Array(R),Ws=new Uint8Array(R),Ks=new Uint8Array(R),qs=new Uint8Array(R),js=new Uint8Array(R),Vs=new Uint8Array(R),Xs=new Uint8Array(R),Be=new Uint8Array(R),Ys=new Uint8Array(R),Zs=new Uint8Array(R),lt=[""],Qs=["none","grass","foliage","water"],qt,jt,Vt,Xt,Yt,Zt;for(let o=0;o<R;o++){let e=$e[o],s=(qt=e.shape)!=null?qt:"cube",t=(jt=e.layer)!=null?jt:"opaque";Gs[o]=$s[s],dt[o]=ct[t],Hs[o]=(Vt=e.light)!=null?Vt:0;let n=s==="cube"&&t==="opaque";if(Je[o]=n&&e.transparent!==!0?1:0,us[o]=(Xt=e.opacity)!=null?Xt:n?15:0,et[o]=(Yt=e.solid)==null||Yt?1:0,pt[o]=e.fluid?1:0,Ws[o]=e.cullSelf?1:0,Ks[o]=e.replaceable?1:0,qs[o]=Qs.indexOf((Zt=e.tint)!=null?Zt:"none"),js[o]=e.tintMask?1:0,Vs[o]=e.orient==="axis"?1:e.orient==="horizontal"?2:0,Xs[o]=e.wave==="plant"?1:e.wave==="leaves"?2:0,Be[o]=e.name.endsWith("_leaves")?1:0,e.family){let p=lt.indexOf(e.family);p<0&&(p=lt.length,lt.push(e.family)),Ys[o]=p}Zs[o]=o!==0&&!e.fluid?1:0}et[0]=0;us[0]=0;var Ht=[],Wt=new Map;function Qe(o){let e=Wt.get(o);return e===void 0&&(e=Ht.length,Ht.push(o),Wt.set(o,e)),e}Qe("missing");var ps=new Uint16Array(R*6),Qt,Jt,es,ts,ss,os,ns,rs,as,is,ls,cs;for(let o=0;o<R;o++){let e=$e[o].tex,s;if(typeof e=="string")s=[e,e,e,e,e,e];else{let t=(es=(Jt=(Qt=e.side)!=null?Qt:e.all)!=null?Jt:e.end)!=null?es:"missing",n=(ss=(ts=e.top)!=null?ts:e.end)!=null?ss:t,p=(ns=(os=e.bottom)!=null?os:e.end)!=null?ns:n;s=[(rs=e.east)!=null?rs:t,(as=e.west)!=null?as:t,n,p,(is=e.south)!=null?is:t,(cs=(ls=e.north)!=null?ls:e.front)!=null?cs:t]}for(let t=0;t<6;t++)ps[o*6+t]=Qe(s[t])}var Lo={water_still:Qe("water"),lava_still:Qe("lava")},Kt=new Uint8Array(1024);for(let o=0;o<R;o++){let e=dt[o]===ct.cutout?1:dt[o]===ct.translucent?2:0;for(let s=0;s<6;s++){let t=ps[o*6+s];e>Kt[t]&&(Kt[t]=e)}}var Js=10,ht=(o,e=0)=>o|e<<Js;if(R>1024)throw new Error("Too many blocks for 10-bit ids");var mt=18,Po=mt*mt*mt;var we=0,ue=1,Se=2,ne=3,be=4,ve=5,Oe=6,Le=7,te=8,Ie=9,q=10,Ue=11,se=12,Pe=13;function w(o){let e=ut[o];if(e===void 0)throw new Error(`generator: unknown block ${o}`);return e}var Q=0,ft=w("bedrock"),U=w("stone"),ze=w("deepslate"),Dt=w("tuff"),st=w("granite"),ot=w("diorite"),nt=w("andesite"),ee=w("dirt"),W=w("grass_block"),De=w("snowy_grass_block"),Ge=w("podzol"),bt=w("coarse_dirt"),ke=w("mud"),me=w("clay"),F=w("sand"),_t=w("sandstone"),$=w("gravel"),yt=w("snow_block"),gt=w("snow"),hs=w("ice"),He=w("packed_ice"),to=w("calcite"),Ce=w("water"),xt=w("lava"),kt=w("oak_log"),wt=w("oak_leaves"),so=w("birch_log"),oo=w("birch_leaves"),no=w("spruce_log"),ms=w("spruce_leaves"),St=w("cherry_log"),ro=w("cherry_leaves"),tt=w("dark_oak_log"),ao=w("dark_oak_leaves"),We=w("short_grass"),vt=w("fern"),fs=w("dead_bush"),bs=w("cactus"),io=w("sugar_cane"),lo=w("lily_pad"),co=w("seagrass"),uo=w("pumpkin"),_s=w("brown_mushroom"),po=w("red_mushroom"),_e=w("dandelion"),Ee=w("poppy"),ho=w("blue_orchid"),Ss=w("allium"),vs=w("azure_bluet"),mo=w("red_tulip"),fo=w("orange_tulip"),As=w("white_tulip"),Ct=w("pink_tulip"),Rt=w("oxeye_daisy"),Es=w("cornflower"),Ms=w("lily_of_the_valley"),Ts=["coal","iron","copper","gold","redstone","lapis","diamond","emerald"],ys=Ts.map(o=>w(`${o}_ore`)),gs=Ts.map(o=>w(`deepslate_${o}_ore`)),xs=[[0,20,15,5,128,0],[0,6,17,60,128,0],[2,12,10,20,96,1],[1,10,9,5,72,1],[1,3,9,5,24,0],[3,2,9,5,32,1],[4,6,8,5,16,0],[5,2,7,5,32,1],[6,1,8,5,16,0]],ks=[[st,1,2,52,0,64],[ot,1,2,52,0,64],[nt,1,2,52,0,64],[st,1,.25,52,64,128],[ot,1,.25,52,64,128],[nt,1,.25,52,64,128],[Dt,2,2,52,0,16],[ee,1,4,30,0,160],[$,1,5,30,0,160]],fe=-.5,bo=.42,_o=.05,yo=9,J=0,Ke=1,At=2,ws=3,Et=4,Mt=5,qe=6,Tt=7,Re=[-1.2,-.62,-.45,-.3,-.2,-.14,-.1,-.06,0,.3,1.2],Ne=[29,35,42,48,54,58.5,61.6,63.2,64.8,70,82];function go(o){if(o<=Re[0])return Ne[0];for(let e=1;e<Re.length;e++)if(o<Re[e]){let s=(o-Re[e-1])/(Re[e]-Re[e-1]);return Ne[e-1]+(Ne[e]-Ne[e-1])*s}return Ne[Ne.length-1]}function L(o,e,s){let t=(s-o)/(e-o);return t<=0?0:t>=1?1:t*t*(3-2*t)}var Ae=o=>[parseInt(o.slice(1,3),16),parseInt(o.slice(3,5),16),parseInt(o.slice(5,7),16)],Bs=[];function H(o,e,s,t){Bs[o]=[...Ae(e),...Ae(s),...Ae(t)]}H(we,"#8eb971","#71a74d","#3f76e4");H(ue,"#8eb971","#71a74d","#3a69d6");H(Se,"#91bd59","#77ab2f","#3f76e4");H(ne,"#91bd59","#77ab2f","#3f76e4");H(be,"#79c05a","#59ae30","#3f76e4");H(ve,"#88bb67","#6ba941","#3f76e4");H(Oe,"#bfb755","#aea42a","#3f8ee4");H(Le,"#80b497","#60a17b","#3938c9");H(te,"#8ab689","#6da36b","#3f6ee0");H(Ie,"#80b497","#60a17b","#3938c9");H(q,"#6a7039","#6a7039","#617b64");H(Ue,"#b6db61","#b6db61","#5db7ef");H(se,"#8eb971","#71a74d","#3f76e4");H(Pe,"#8ab689","#6da36b","#3d5fd9");var xo=Ae("#3d57d6"),ko=Ae("#45adf2"),wo=Ae("#80b497"),So=Ae("#60a17b"),re=[];re[ne]=[_e,Ee,vs,Rt,Es,mo,fo,As,Ct,_e,Ee];re[be]=[_e,Ee,Ms,Ee,_e];re[ve]=[_e,Ee,Ms,Rt];re[q]=[ho];re[Ue]=[Ct,Ct,As,Ss];re[te]=[Ss,vs,Es,_e,Rt,Ee];re[se]=[_e,Ee];re[Se]=[_e];var vo=461845907,Ao=739982445,Eo=695872825,Mo=1799596469,To=1597334677,Bo=1013904242,Do=2084215391,Co=1327217884,Ro=295875524,No=195936478,N=18,Bt=N*N,K=9,Y=65,rt=class{constructor(e){this.sB=0;this.sT=0;this.sHum=0;this.sC=0;this.sMtn=0;this.sChan=0;this.hm=new Int16Array(Bt);this.bm=new Uint8Array(Bt);this.tm=new Float32Array(Bt);this.frozen=new Uint8Array(256);this.slopes=new Uint8Array(256);this.carveTop=new Int16Array(256);this.tintGrid=new Float32Array(K*K*9);this.tintBlur=new Float32Array(K*K*9);this.caveC=new Float32Array(25*Y);this.caveA=new Float32Array(25*Y);this.caveB=new Float32Array(25*Y);this.colC=new Float32Array(Y);this.colA=new Float32Array(Y);this.colB=new Float32Array(Y);this.cheeseThr=new Float32Array(257);this.spagW2=new Float32Array(257);this.rng=new Te;this.rng2=new Te;this.blocks=new Uint16Array(0);this.X0=0;this.Z0=0;this.fFill=0;this.fDepth=0;this.fUnder=0;this.fUnderDepth=0;this.spawn=null;this.seed=e|0;let s=0,t=()=>new Ze(this.seed+Math.imul(++s,2654435761)|0);this.nCont=t(),this.nWarp=t(),this.nEro=t(),this.nRidge=t(),this.nAmp=t(),this.nHill=t(),this.nDet=t(),this.nRiver=t(),this.nSwamp=t(),this.nTemp=t(),this.nHum=t(),this.nVar=t(),this.nJit=t(),this.nPatch=t(),this.nPatch2=t(),this.nFlower=t(),this.nFlowerType=t(),this.nGrass=t(),this.nForest=t(),this.nEnt=t(),this.nSnow=t(),this.nCheese=t(),this.nCheese2=t(),this.nSpagA=t(),this.nSpagB=t(),this.nSpagW=t();for(let n=0;n<=256;n++){this.cheeseThr[n]=.45+.2*L(24,100,n)+.12*L(4,-2,n);let p=.083+.017*L(80,20,n);this.spagW2[n]=p*p}}sample(e,s){let t=this.nJit.noise2(e*.015625,s*.015625)*.026+this.nJit.noise2(e*.058823529411764705+31.7,s*.058823529411764705-11.3)*.004,n=ce(this.nTemp,e*(1/1500),s*(1/1500),3)*1.45+t,p=ce(this.nHum,e*(1/1150),s*(1/1150),3)*1.45-t,m=ce(this.nVar,e*(1/640),s*(1/640),2)*1.55+t,u=e+this.nWarp.noise2(e*(1/420),s*(1/420))*80,d=s+this.nWarp.noise2(s*(1/420)+57.1,e*(1/420)-23.9)*80,i=ce(this.nCont,u*(1/1800),d*(1/1800),5)*1.75+.1,c=ce(this.nEro,e*(1/1250),s*(1/1250),3)*1.55,r=go(i),l=L(-.12,.25,i),a=L(-.2,.08,i)*L(-.18,-.66,c);if(a>0){let k=Gt(this.nRidge,e*.0016129032258064516,s*.0016129032258064516,5),S=.82+.25*this.nAmp.noise2(e*(1/1100),s*(1/1100)),v=a*a*(3-2*a);r+=v*(20+190*k*Math.sqrt(k))*S}let f=l*(3+16*L(.55,-.2,c))*(1-.6*a)+(1-l)*2.5;r+=ce(this.nHill,e*(1/200),s*(1/200),4)*1.35*f,r+=ce(this.nDet,e*(1/40),s*(1/40),2)*(.9+1.4*l);let g=L(.36,.5,p)*L(-.36,-.22,n)*L(-.28,0,c)*(1-L(.04,.2,a))*L(-.07,.03,i);g>0&&(r+=(61.8+this.nSwamp.noise2(e*(1/13),s*(1/13))*1.8-r)*g);let y=0,b=1-L(.25,.6,a);if(b>0){let k=Math.abs(ce(this.nRiver,e*.0014285714285714286,s*.0014285714285714286,3)*1.7);if(k<.2){let S=1-(1-L(.035,.2,k))*b;if(r>63&&(r=63+(r-63)*S),y=(1-L(0,.045,k))*b,y>0){let v=56.5+this.nDet.noise2(e*.043478260869565216,s*.043478260869565216)*1.5;r>v&&(r+=(v-r)*y)}}}r>185&&(r=185+55*(1-Math.exp((185-r)/55)));let x=Math.floor(r);x<2?x=2:x>250&&(x=250);let _;if(x<62&&i<-.13)_=i<-.5?ue:we;else if(y>.4&&x<=63)_=se;else if(i<-.03+t&&a>.07&&x<78&&x>=59)_=Pe;else if(i<-.035+t*.6&&x<=66&&x>=60)_=Se;else if(a>.32&&x>=92){let k=148+this.nSnow.noise2(e*.016666666666666666,s*.016666666666666666)*10-(n<fe+.1?30:0);_=x>=k?Ie:te}else n<fe?_=Le:n>bo&&p<_o?_=Oe:g>.5?_=q:m>.42&&n>-.3&&n<.32&&p>-.3&&p<.36&&c<.12?_=Ue:m<-.33&&n>-.42&&n<.3&&p>-.12?_=ve:p>.02?_=be:_=ne;return this.sB=_,this.sT=n,this.sHum=p,this.sC=i,this.sMtn=a,this.sChan=y,x}heightAt(e,s){return this.sample(Math.floor(e),Math.floor(s))}biomeAt(e,s){return this.sample(Math.floor(e),Math.floor(s)),this.sB}slopeAt(e,s){let t=this.sample(e+1,s),n=this.sample(e-1,s),p=this.sample(e,s+1),m=this.sample(e,s-1);return Math.max(Math.abs(t-n),Math.abs(p-m))}snowline(e,s){return 122+this.nSnow.noise2(e*(1/37),s*(1/37))*7}isEntrance(e,s){return this.nEnt.noise2(e*(1/85),s*(1/85))>.62}surface(e,s,t,n,p,m){let u=this.nPatch.noise2(e*.09090909090909091,s*.09090909090909091),d=le(this.seed^Ro,e,s),i=3+(d&1);if(this.fFill=ee,this.fDepth=i,this.fUnder=U,this.fUnderDepth=0,t<62){let c=62-t,r;return n===we||n===ue?r=c>16||n===ue?u>-.35?$:F:u>.55&&c<12?me:u<-.45?$:F:n===se?r=u>.5?me:u<-.4?$:F:n===q?r=u>-.1?ke:u<-.55?me:ee:n===Oe||n===Se?r=F:n===Le||n===Ie||n===te||n===Pe?r=u>.1?$:ee:r=u>.55?me:u>.05?F:u>-.45?ee:$,this.fFill=r===me||r===ke?ee:r,this.fDepth=r===me?2:i,r===F&&(this.fUnder=_t,this.fUnderDepth=2),r}switch(n){case Oe:return this.fFill=F,this.fDepth=i+1,this.fUnder=_t,this.fUnderDepth=3+(d>>>1&1),F;case Se:return this.fFill=F,this.fDepth=i,this.fUnder=_t,this.fUnderDepth=2,F;case Pe:return p>2||u>.15?(this.fFill=U,U):(this.fFill=$,this.fDepth=2,$);case Ie:return p>=6?(this.fFill=U,u>.5?to:U):u>.62?(this.fFill=$,this.fDepth=2,$):u<-.66&&p<=2?(this.fFill=He,this.fDepth=2,He):(this.fFill=yt,this.fDepth=1+(d&1),yt);case te:if(p>=5||p>=3&&t>128)return this.fFill=U,u>.66?$:U;if(p>=3&&u>.45)return this.fFill=$,this.fDepth=2,$;this.fDepth=1+(d&1);{let c=this.nPatch2.noise2(e*.029411764705882353,s*.029411764705882353)+u*.15;if(t<114&&c<-.8)return Ge;if(c>.9)return bt}return W;case Le:return p>=6?(this.fFill=U,U):this.nPatch2.noise2(e*(1/22),s*(1/22))>.86?(this.fFill=He,this.fDepth=2,He):De;case q:return u>.52?ke:W;case se:return t<=62?m<fe?$:(this.fFill=F,u>.2?W:F):m<fe?De:W;default:return p>=8?(this.fFill=U,U):W}}generate(e,s){let t=new Uint16Array(65536),n=new Uint8Array(256),p=new Uint8Array(256*9);this.blocks=t;let m=this.X0=e*16,u=this.Z0=s*16,d=this.hm,i=this.bm,c=this.tm;for(let l=0;l<N;l++)for(let a=0;a<N;a++){let f=l*N+a;d[f]=this.sample(m+a-1,u+l-1),i[f]=this.sB,c[f]=this.sT}let r=0;for(let l=0;l<16;l++)for(let a=0;a<16;a++){let f=(l+1)*N+a+1,g=d[f],y=i[f],b=c[f],x=m+a,_=u+l;g>r&&(r=g);let k=Math.max(Math.abs(d[f+1]-d[f-1]),Math.abs(d[f+N]-d[f-N])),S=this.surface(x,_,g,y,k,b),v=l<<4|a;this.slopes[v]=k>255?255:k;let E=g-this.fDepth,T=E-this.fUnderDepth,B=this.fFill,z=this.fUnder;t[v]=ft;for(let M=1;M<g;M++){let O;M>E?O=B:M>T?O=z:M>=20?O=U:M<12?O=ze:O=(it(this.seed^Ao,x,M,_)&7)<20-M?ze:U,M<=4&&it(this.seed^vo,x,M,_)%5<5-M&&(O=ft),t[M<<8|v]=O}t[g<<8|v]=S;let P=b<fe||y===Ie?1:0;if(!P&&(y===te||y===Pe)&&g>=this.snowline(x,_)&&(P=1),this.frozen[v]=P,g<62){for(let M=g+1;M<=62;M++)t[M<<8|v]=Ce;P&&(!(y===we||y===ue)||this.nPatch2.noise2(x*(1/44),_*(1/44))*.75+this.nPatch.noise2(x*(1/9),_*(1/9))*.25>-.12)&&(t[15872|v]=hs)}}this.blobs(e,s),this.caves(r),this.ores(e,s),this.trees(),this.decorate(e,s);for(let l=0;l<16;l++)for(let a=0;a<16;a++)n[l<<4|a]=i[(l+1)*N+a+1];return this.tints(p),this.blocks=new Uint16Array(0),{cx:e,cz:s,blocks:t,biome:n,tint:p}}vein(e,s,t,n,p,m,u,d,i,c,r){let l=this.X0,a=this.Z0,f=this.blocks,g=e.next()*Math.PI,y=p/8,b=Math.sin(g)*y,x=Math.cos(g)*y,_=s+b,k=s-b,S=n+x,v=n-x,E=t+e.int(3)-1,T=t+e.int(3)-1,B=(2*p/16+1)/2+1;if(Math.max(_,k)+B<l||Math.min(_,k)-B>l+16||Math.max(S,v)+B<a||Math.min(S,v)-B>a+16)return;let z=r;for(let P=0;P<z;P++){let M=z>1?P/(z-1):.5,O=_+(k-_)*M,j=E+(T-E)*M,V=S+(v-S)*M,ae=e.next()*p/16,A=((Math.sin(Math.PI*M)+1)*ae+1)/2,I=A*A,G=Math.floor(O-A),Z=Math.floor(O+A),C=Math.floor(V-A),ye=Math.floor(V+A),ge=Math.floor(j-A),ie=Math.floor(j+A);if(G<l&&(G=l),Z>l+15&&(Z=l+15),C<a&&(C=a),ye>a+15&&(ye=a+15),ge<i&&(ge=i),ie>c&&(ie=c),!(G>Z||C>ye||ge>ie))for(let xe=ge;xe<=ie;xe++){let Lt=xe+.5-j,It=Lt*Lt;if(!(It>=I))for(let Ve=C;Ve<=ye;Ve++){let Pt=Ve+.5-V,Ut=It+Pt*Pt;if(Ut>=I)continue;let Cs=xe<<8|Ve-a<<4;for(let Xe=G;Xe<=Z;Xe++){let Ft=Xe+.5-O;if(Ut+Ft*Ft>=I)continue;let Ye=Cs|Xe-l,pe=f[Ye];d===4?pe===U||pe===st||pe===ot||pe===nt?f[Ye]=m:(pe===ze||pe===Dt)&&(f[Ye]=u):(d&1&&pe===U||d&2&&pe===ze)&&(f[Ye]=m)}}}}}blobs(e,s){let t=this.rng,n=this.rng2;for(let p=s-1;p<=s+1;p++)for(let m=e-1;m<=e+1;m++){t.seed(le(this.seed^To,m,p));for(let u=0;u<ks.length;u++){let[d,i,c,r,l,a]=ks[u],f=Math.floor(c);t.next()<c-f&&f++;for(let g=0;g<f;g++){let y=m*16+t.int(16),b=p*16+t.int(16),x=l+t.int(a-l+1);n.seed(t.u32()),this.vein(n,y,x,b,r,d,d,i,Math.max(1,l-4),Math.min(255,a+4),12)}}}}ores(e,s){let t=this.rng,n=this.rng2,p=this.blocks;for(let u=s-1;u<=s+1;u++)for(let d=e-1;d<=e+1;d++){t.seed(le(this.seed^Bo,d,u));for(let i=0;i<xs.length;i++){let[c,r,l,a,f,g]=xs[i],y=r,b=l;c===6&&t.next()<.5&&y++;for(let x=0;x<y;x++){let _=d*16+t.int(16),k=u*16+t.int(16),S=f-a,v=g===1?a+Math.floor((t.next()+t.next())*.5*(S+1)):a+t.int(S+1);c===6&&x>0&&(b=4),n.seed(t.u32()),this.vein(n,_,v,k,b,ys[c],gs[c],4,a,f,Math.max(2,Math.ceil(b*.75)))}}}t.seed(le(this.seed^No,e,s));let m=3+t.int(6);for(let u=0;u<m;u++){let d=t.int(16),i=t.int(16),c=5+t.int(96),r=this.bm[(i+1)*N+d+1];if(r!==te&&r!==Ie)continue;let l=c<<8|i<<4|d,a=p[l];a===U||a===st||a===ot||a===nt?p[l]=ys[7]:(a===ze||a===Dt)&&(p[l]=gs[7])}}caves(e){let s=this.hm,t=this.blocks,n=this.X0,p=this.Z0,m=0;for(let y=0;y<16;y++)for(let b=0;b<16;b++){let x=(y+1)*N+b+1,_=s[x],k=s[x+1],S=s[x-1],v=s[x+N],E=s[x-N],T=Math.min(_,k,S,v,E),B;T<62?B=T-6:this.isEntrance(n+b,p+y)&&T>=64?B=_:B=_-5,B>250&&(B=250),this.carveTop[y<<4|b]=B,B>m&&(m=B)}if(m<1)return;let u=Math.min(Y,(Math.min(e,m)>>2)+2),d=this.caveC,i=this.caveA,c=this.caveB;for(let y=0;y<5;y++)for(let b=0;b<5;b++){let x=n+b*4,_=p+y*4,k=(y*5+b)*Y;for(let S=0;S<u;S++){let v=S*4;d[k+S]=this.nCheese.noise3(x*(1/88),v*(1/44),_*(1/88))*.68+this.nCheese2.noise3(x*(1/30),v*(1/22),_*(1/30))*.32,i[k+S]=this.nSpagA.noise3(x*(1/52),v*(1/30),_*(1/52)),c[k+S]=this.nSpagB.noise3(x*(1/52),v*(1/30),_*(1/52))}}let r=this.colC,l=this.colA,a=this.colB,f=this.cheeseThr,g=this.spagW2;for(let y=0;y<16;y++){let b=y>>2,x=(y&3)*.25;for(let _=0;_<16;_++){let k=y<<4|_,S=this.carveTop[k];if(S<1)continue;let v=_>>2,E=(_&3)*.25,T=(b*5+v)*Y,B=T+Y,z=T+5*Y,P=z+Y,M=(1-E)*(1-x),O=E*(1-x),j=(1-E)*x,V=E*x,ae=Math.min(u,(S>>2)+2);for(let A=0;A<ae;A++)r[A]=d[T+A]*M+d[B+A]*O+d[z+A]*j+d[P+A]*V,l[A]=i[T+A]*M+i[B+A]*O+i[z+A]*j+i[P+A]*V,a[A]=c[T+A]*M+c[B+A]*O+c[z+A]*j+c[P+A]*V;for(let A=1;A<=S;A++){let I=A>>2,G=(A&3)*.25,C=r[I]+(r[I+1]-r[I])*G>f[A];if(!C){let ie=l[I]+(l[I+1]-l[I])*G;if(ie*ie<g[A]){let xe=a[I]+(a[I+1]-a[I])*G;C=ie*ie+xe*xe<g[A]}}if(!C)continue;let ye=A<<8|k,ge=t[ye];ge===ft||ge===Ce||(t[ye]=A<=10?xt:Q)}}}}put(e,s,t,n,p){let m=e-this.X0,u=t-this.Z0;if(m<0||m>15||u<0||u>15||s<1||s>255)return;let d=s<<8|u<<4|m,i=this.blocks[d];p?(i===Q||Be[i&1023]||i===Ce||i===We||i===gt)&&(this.blocks[d]=n):i===Q&&(this.blocks[d]=n)}rootDirt(e,s,t){let n=e-this.X0,p=t-this.Z0;if(n<0||n>15||p<0||p>15||s<1)return;let m=s<<8|p<<4|n,u=this.blocks[m];(u===W||u===De||u===Ge||u===ke)&&(this.blocks[m]=ee)}treeDensity(e,s,t,n){let p=this.nForest.noise2(s*.010416666666666666,t*.010416666666666666);switch(e){case be:return .5+.32*p;case ve:return .46+.28*p;case ne:return p>.55?.12:.012;case q:return .16+.08*p;case Le:return p>.4?.12:.025;case te:return n<116?.13+.15*p:n<126?.04:0;case Ue:return .16+.08*p;case se:return 0;default:return 0}}trees(){let e=this.X0,s=this.Z0,t=yo,n=Math.floor((e-t)/4),p=Math.floor((e+15+t)/4),m=Math.floor((s-t)/4),u=Math.floor((s+15+t)/4),d=this.rng;for(let i=m;i<=u;i++)for(let c=n;c<=p;c++){let r=le(this.seed^Mo,c,i),l=c*4+(r&3),a=i*4+(r>>>2&3);if(l<e-t||l>e+15+t||a<s-t||a>s+15+t)continue;let f=(r>>>8&65535)/65536;if(f>.82)continue;let g=this.sample(l,a),y=this.sB;if(f>=this.treeDensity(y,l,a,g)||g<62-(y===q?1:0)||g>236||this.isEntrance(l,a))continue;let b=this.sT,x=this.slopeAt(l,a);if(x>3)continue;let _=this.surface(l,a,g,y,x,b);if(g>=62&&_!==W&&_!==ee&&_!==Ge&&_!==De&&_!==bt||g<62&&_!==ke&&_!==ee&&_!==me)continue;d.seed(r^2654435769);let k=d.next(),S;switch(y){case be:S=k<.66?J:k<.86?Ke:k<.95?Et:Mt;break;case ve:S=k<.82?Ke:k<.97?Tt:J;break;case ne:S=k<.88?J:Et;break;case q:S=qe;break;case Le:S=At;break;case te:S=b>.25?k<.75?J:Ke:k<.88?At:J;break;case Ue:S=ws;break;default:S=J}S===Mt&&(this.sample(l+1,a)!==g||this.sample(l,a+1)!==g||this.sample(l+1,a+1)!==g)&&(S=J),this.tree(S,l,g+1,a,d)}}leafDisc(e,s,t,n,p,m,u){for(let d=-n;d<=n;d++)for(let i=-n;i<=n;i++)n>0&&(i===n||i===-n)&&(d===n||d===-n)&&m.next()>=u||this.put(e+i,s,t+d,p,!1)}tree(e,s,t,n,p){switch(e){case J:case Ke:case Tt:case qe:{let m=e===J||e===qe?kt:so,u=e===J||e===qe?wt:oo,d=e===J?4+p.int(3):e===Ke?5+p.int(3):e===Tt?8+p.int(3):5+p.int(3),i=e===qe?1:0,c=t+d;for(let r=c-3;r<=c;r++){let l=r-c,a=(l>=-1?1:2)+i;this.leafDisc(s,r,n,a,u,p,l===0?0:.5)}for(let r=t;r<c;r++)this.put(s,r,n,m,!0);this.rootDirt(s,t-1,n);return}case At:{let m=6+p.int(4),u=1+p.int(2),d=2+p.int(2),i=t+m,c=p.int(2),r=1,l=0;this.put(s,i+1,n,ms,!1);for(let a=i;a>=t+u;a--)this.leafDisc(s,a,n,c,ms,p,0),c>=r?(c=l,l=1,r=Math.min(r+1,d)):c++;for(let a=t;a<=i;a++)this.put(s,a,n,no,!0);this.rootDirt(s,t-1,n);return}case Et:{let m=8+p.int(5),u=t+m,d=3+p.int(3);for(let i=0;i<d;i++){let c=p.next()*Math.PI*2,r=2+p.next()*2.5,l=t+Math.floor(m*(.5+p.next()*.4)),a=Math.round(s+Math.cos(c)*r),f=Math.round(n+Math.sin(c)*r),g=l+1+p.int(2);this.cluster(a,g,f,wt,p,2.6,2);let y=Math.ceil(r)+1,b=Math.abs(Math.cos(c))>Math.abs(Math.sin(c))?1:2;for(let x=1;x<=y;x++){let _=x/y;this.put(Math.round(s+(a-s)*_),Math.round(l+(g-l)*_),Math.round(n+(f-n)*_),ht(kt,b),!0)}}this.cluster(s,u,n,wt,p,2.8,2);for(let i=t;i<u;i++)this.put(s,i,n,kt,!0);this.rootDirt(s,t-1,n);return}case Mt:{let m=6+p.int(3),u=t+m,d=s+.5,i=n+.5;for(let c=u-2;c<=u+1;c++){let r=c-u,l=r===1?2.2:r===0?4.2:r===-1?4.6:3.4,a=Math.ceil(l)+1;for(let f=-a;f<=a+1;f++)for(let g=-a;g<=a+1;g++){let y=s+g-d,b=n+f-i,x=y*y+b*b,_=x>(l-1)*(l-1);x<=l*l&&(!_||p.next()<.6)&&this.put(s+g,c,n+f,ao,!1)}}for(let c=t;c<=u;c++)this.put(s,c,n,tt,!0),this.put(s+1,c,n,tt,!0),this.put(s,c,n+1,tt,!0),this.put(s+1,c,n+1,tt,!0);this.rootDirt(s,t-1,n),this.rootDirt(s+1,t-1,n),this.rootDirt(s,t-1,n+1),this.rootDirt(s+1,t-1,n+1);return}case ws:{let m=4+p.int(2),u=t+m,d=2+p.int(2),i=p.int(4);for(let c=0;c<d;c++){let r=i+c*(d===2?2:1)+(d===3&&c===2?1:0)&3,l=r===1?1:r===3?-1:0,a=r===0?-1:r===2?1:0,f=2+p.int(3),g=u-2+p.int(2),y=l!==0?1:2,b=s,x=n;for(let k=1;k<=f;k++)b=s+l*k,x=n+a*k,this.put(b,g+(k>1?1:0),x,ht(St,y),!0);let _=1+p.int(2);for(let k=2;k<=_+1;k++)this.put(b,g+k,x,St,!0);this.cherryCanopy(b,g+_+2,x,p)}for(let c=t;c<u;c++)this.put(s,c,n,St,!0);this.cherryCanopy(s,u+1,n,p),this.rootDirt(s,t-1,n);return}}}cluster(e,s,t,n,p,m,u){let d=Math.ceil(m);for(let i=-u;i<=1;i++){let c=i===1?m-1.2:i===-u?m-.9:m,r=c*c;for(let l=-d;l<=d;l++)for(let a=-d;a<=d;a++){let f=a*a+l*l;f>r||f>(c-1)*(c-1)&&p.next()<.25||this.put(e+a,s+i,t+l,n,!1)}}}cherryCanopy(e,s,t,n){for(let m=-2;m<=1;m++){let u=m===1?1.8:m===0?3.3:m===-1?3.1:2.2,d=u*u;for(let i=-3;i<=3;i++)for(let c=-3;c<=3;c++){let r=c*c+i*i;r>d||m===-2&&(r<2||n.next()<.55)||r>(u-1)*(u-1)&&n.next()<.2||this.put(e+c,s+m,t+i,ro,!1)}}}decorate(e,s){let t=this.blocks,n=this.hm,p=this.bm,m=this.X0,u=this.Z0,d=this.seed;for(let i=0;i<16;i++)for(let c=0;c<16;c++){let r=i<<4|c,l=(i+1)*N+c+1,a=n[l],f=p[l],g=m+c,y=u+i,b=t[a<<8|r];if(b===Q||b===xt)continue;let x=this.frozen[r],_=le(d^Eo,g,y),k=(_&65535)/65536,S=(_>>>16)/65536;if(a<62){if(x)continue;let E=62-a;if(f===q&&E<=2)k<.09&&t[16128|r]===Q&&(t[16128|r]=lo);else if(E>=2&&E<=14&&(b===F||b===$||b===ee||b===me)){let T=this.nGrass.noise2(g*.07142857142857142,y*.07142857142857142),B=f===se?.22:.12+.3*L(-.2,.6,T);k<B&&t[a+1<<8|r]===Ce&&(t[a+1<<8|r]=co)}continue}let v=a+1<<8|r;if(!(a>=255||t[v]!==Q)&&!x){if(a===62&&(b===W||b===F||b===ee||b===Ge||b===ke)&&this.waterBeside(l,c,i)&&k<.22&&this.nFlower.noise2(g*(1/20),y*(1/20))>-.3){let E=1+(_>>>20)%3;for(let T=1;T<=E&&t[a+T<<8|r]===Q;T++)t[a+T<<8|r]=io;continue}b===W?this.plant(f,g,y,a,r,k,S):b===Ge||b===bt?k<.1?t[v]=vt:k<.15?t[v]=We:k<.16&&(t[v]=_s):b===F&&f===Oe?k<.012&&(t[v]=fs):b===ke&&f===q&&k<.05&&(t[v]=We)}}this.cacti(e,s),this.pumpkins(e,s),this.snowCover()}waterBeside(e,s,t){let n=this.hm,p=(m,u,d)=>n[m]>=62?!1:u>=0&&u<16&&d>=0&&d<16?this.blocks[15872|d<<4|u]===Ce:this.tm[m]>=fe;return p(e+1,s+1,t)||p(e-1,s-1,t)||p(e+N,s,t+1)||p(e-N,s,t-1)}shaded(e,s){let t=this.blocks;for(let n=s+2;n<Math.min(256,s+18);n++)if(Be[t[n<<8|e]&1023])return!0;return!1}plant(e,s,t,n,p,m,u){var y;let d=this.blocks,i=n+1<<8|p,c=this.nGrass.noise2(s*(1/19),t*(1/19)),r=this.nFlower.noise2(s*(1/26),t*(1/26)),l=0,a=0,f=0,g=0;switch(e){case ne:l=.22+.22*c,f=r>.4?.12:.006;break;case be:l=.14+.1*c,a=.02,f=r>.5?.05:.005,g=.03;break;case ve:l=.16+.1*c,a=.015,f=r>.45?.06:.006,g=.015;break;case q:l=.16+.08*c,a=.03,f=.012,g=.02;break;case Ue:l=.28+.12*c,f=r>.2?.06:.01;break;case te:l=.2+.12*c,a=n<118?.05:.01,f=r>.3?.07:.004;break;case se:case Se:l=.1,f=.003;break;default:l=.15}if(m<f){let b=(y=re[e])!=null?y:re[ne],x=Math.floor((this.nFlowerType.noise2(s*(1/40),t*(1/40))*.5+.5)*b.length);u<.2&&(x=Math.floor(u*5*b.length)),d[i]=b[Math.max(0,Math.min(b.length-1,x))];return}if(g>0&&m<f+g&&this.shaded(p,n)){d[i]=u<.6?_s:po;return}if(m<f+g+a){d[i]=vt;return}m<f+g+a+l&&(d[i]=u<.08&&e!==ne?vt:We)}cacti(e,s){let t=this.blocks,n=this.hm,p=this.bm;for(let m=0;m<4;m++)for(let u=0;u<4;u++){let d=le(this.seed^Do,e*4+u,s*4+m);if((d&65535)/65536>.08)continue;let i=u*4+1+(d>>>16&1),c=m*4+1+(d>>>17&1),r=(c+1)*N+i+1,l=n[r];if(p[r]!==Oe||l<63||l>240)continue;let a=c<<4|i;if(t[l<<8|a]!==F||n[r+1]>l||n[r-1]>l||n[r+N]>l||n[r-N]>l)continue;let f=1+(d>>>18)%3;for(let g=1;g<=f;g++){let y=l+g<<8|a;if(t[y]!==Q&&t[y]!==fs)break;t[y]=bs}}}pumpkins(e,s){let t=le(this.seed^Co,e,s);if((t&65535)/65536>.035)return;let n=this.blocks,p=this.hm,m=this.bm,u=4+(t>>>16&7),d=4+(t>>>19&7),i=this.rng2.seed(t);for(let c=-3;c<=3;c++)for(let r=-3;r<=3;r++){let l=i.next()<.22,a=u+r,f=d+c;if(!l)continue;let g=(f+1)*N+a+1,y=m[g];if(y!==ne&&y!==be&&y!==ve&&y!==te)continue;let b=p[g],x=f<<4|a;if(n[b<<8|x]!==W)continue;let _=b+1<<8|x;(n[_]===Q||n[_]===We)&&(n[_]=uo)}}snowCover(){let e=this.blocks,s=this.hm;for(let t=0;t<256;t++){if(!this.frozen[t])continue;let n=t&15,p=t>>4,m=s[(p+1)*N+n+1],u=Math.min(254,m+40);for(;u>0&&e[u<<8|t]===Q;)u--;let d=e[u<<8|t];if(d===W&&(e[u<<8|t]=De),!(d===Ce||d===hs||d===He||d===xt||d===gt||d===yt||d===bs)&&!(u===m&&this.slopes[t]>=5&&d!==W)&&((Je[d&1023]||Be[d&1023])&&u<255&&e[u+1<<8|t]===Q&&(e[u+1<<8|t]=gt),u>m)){let i=m<<8|t;e[i]===W&&(e[i]=De)}}}tints(e){let s=this.tintGrid,t=this.tintBlur,n=this.X0-8,p=this.Z0-8;for(let m=0;m<K;m++)for(let u=0;u<K;u++){let d=n+u*4,i=p+m*4,c=this.sample(d,i),r=this.sB,l=this.sT,a=Bs[r],f=(m*K+u)*9;for(let b=0;b<9;b++)s[f+b]=a[b];if(r===we||r===ue||r===se||r===Se||r===Pe){let b=L(-.15,-.55,l),x=L(.35,.7,l);for(let _=0;_<3;_++)s[f+6+_]=s[f+6+_]+(xo[_]-s[f+6+_])*b,s[f+6+_]=s[f+6+_]+(ko[_]-s[f+6+_])*x*(r===ue?.6:1)}let g=Math.max(L(95,150,c),L(fe+.25,fe,l))*(r===q?0:1);if(g>0)for(let b=0;b<3;b++)s[f+b]+=(wo[b]-s[f+b])*g,s[f+3+b]+=(So[b]-s[f+3+b])*g;let y=this.sHum*6;s[f]-=y*.5,s[f+1]+=y*.3,s[f+3]-=y*.5,s[f+4]+=y*.3}for(let m=1;m<K-1;m++)for(let u=1;u<K-1;u++){let d=(m*K+u)*9;for(let i=0;i<9;i++){let c=0;for(let r=-1;r<=1;r++)for(let l=-1;l<=1;l++)c+=s[((m+r)*K+u+l)*9+i];t[d+i]=c/9}}for(let m=0;m<16;m++){let u=(m+8)/4,d=Math.floor(u),i=u-d;for(let c=0;c<16;c++){let r=(c+8)/4,l=Math.floor(r),a=r-l,f=(d*K+l)*9,g=f+9,y=f+K*9,b=y+9,x=(1-a)*(1-i),_=a*(1-i),k=(1-a)*i,S=a*i,v=(m<<4|c)*9;for(let E=0;E<9;E++){let T=t[f+E]*x+t[g+E]*_+t[y+E]*k+t[b+E]*S;e[v+E]=T<0?0:T>255?255:Math.round(T)}}}}findSpawn(){var u;if(this.spawn)return{x:this.spawn.x,z:this.spawn.z};let e=8,s=null,t=null,n=d=>d===ne||d===be,p=d=>d!==we&&d!==ue&&d!==se&&d!==q;for(let d=0;d<=400&&!t;d++){for(let i=0;i<Math.max(1,d*8)&&!t;i++){let c,r,l=d*2;d===0?(c=0,r=0):i<l?(c=-d+i,r=-d):i<l*2?(c=d,r=-d+(i-l)):i<l*3?(c=d-(i-l*2),r=d):(c=-d,r=d-(i-l*3));let a=c*e,f=r*e,g=this.sample(a,f),y=this.sB;if(!(g<63||g>140||!p(y)||this.isEntrance(a,f))&&!(this.slopeAt(a,f)>2)){if(n(y)){let b=this.verifySpawn(a,f);b&&(t=b)}else!s&&d>0&&(s=this.verifySpawn(a,f));if(!t&&s&&d>128)break}}if(!t&&s&&d>128)break}let m=(u=t!=null?t:s)!=null?u:{x:0,z:0};return this.spawn=m,{x:m.x,z:m.z}}verifySpawn(e,s){let t=Math.floor(e/16),n=Math.floor(s/16),m=this.generate(t,n).blocks,u=null,d=1e9;for(let i=0;i<16;i++)for(let c=0;c<16;c++){let r=t*16+c,l=n*16+i,a=this.sample(r,l);if(a<63||a>250||this.sB===se||this.sB===we||this.sB===ue)continue;let f=i<<4|c,g=m[a<<8|f]&1023;if(!Je[g]||Be[g])continue;let y=!0;for(let x=a+1;x<=a+3;x++){let _=m[x<<8|f]&1023;if(et[_]||pt[_]){y=!1;break}}if(!y)continue;let b=(r-e)*(r-e)+(l-s)*(l-s);b<d&&(d=b,u={x:r,z:l})}return u}};var Ot=self,je=null,Nt=[];function Ds(o){var e;try{let s=je.generate(o.cx,o.cz);Ot.postMessage({type:"chunk",id:o.id,cx:s.cx,cz:s.cz,blocks:s.blocks,biome:s.biome,tint:s.tint},[s.blocks.buffer,s.biome.buffer,s.tint.buffer])}catch(s){Ot.postMessage({type:"error",id:o.id,cx:o.cx,cz:o.cz,message:String((e=s==null?void 0:s.message)!=null?e:s)})}}Ot.onmessage=o=>{let e=o.data;if(e){if(e.type==="init"){(!je||je.seed!==(e.seed|0))&&(je=new rt(e.seed));let s=Nt;Nt=[];for(let t of s)Ds(t)}else if(e.type==="gen"){if(!je){Nt.push(e);return}Ds(e)}}};})();\n';var q1='"use strict";(()=>{var ae=["white","orange","magenta","light_blue","yellow","lime","pink","gray","light_gray","cyan","purple","blue","brown","green","red","black"],Uo=["oak","spruce","birch","jungle","acacia","dark_oak","mangrove","cherry"],ee=e=>e.split("_").map(t=>t[0].toUpperCase()+t.slice(1)).join(" "),ye=[],c=e=>(ye.push(e),e);c({name:"air",display:"Air",cat:"natural",tex:"missing",solid:!1,transparent:!0,opacity:0,replaceable:!0,item:!1,layer:"cutout",shape:"cross"});c({name:"grass_block",display:"Grass Block",cat:"natural",tex:{top:"grass_top",bottom:"dirt",side:"grass_side"},tint:"grass",tintMask:!0,sound:"grass"});c({name:"snowy_grass_block",display:"Snowy Grass Block",cat:"natural",tex:{top:"snow",bottom:"dirt",side:"grass_side_snowy"},sound:"snow"});c({name:"dirt",display:"Dirt",cat:"natural",tex:"dirt",sound:"gravel"});c({name:"coarse_dirt",display:"Coarse Dirt",cat:"natural",tex:"coarse_dirt",sound:"gravel"});c({name:"podzol",display:"Podzol",cat:"natural",tex:{top:"podzol_top",bottom:"dirt",side:"podzol_side"},sound:"gravel"});c({name:"rooted_dirt",display:"Rooted Dirt",cat:"natural",tex:"rooted_dirt",sound:"gravel"});c({name:"mycelium",display:"Mycelium",cat:"natural",tex:{top:"mycelium_top",bottom:"dirt",side:"mycelium_side"},sound:"grass"});c({name:"dirt_path",display:"Dirt Path",cat:"natural",tex:{top:"path_top",bottom:"dirt",side:"path_side"},sound:"grass"});c({name:"mud",display:"Mud",cat:"natural",tex:"mud",sound:"gravel"});c({name:"clay",display:"Clay",cat:"natural",tex:"clay",sound:"gravel"});c({name:"moss_block",display:"Moss Block",cat:"natural",tex:"moss",sound:"grass"});c({name:"sand",display:"Sand",cat:"natural",tex:"sand",sound:"sand"});c({name:"red_sand",display:"Red Sand",cat:"natural",tex:"red_sand",sound:"sand"});c({name:"gravel",display:"Gravel",cat:"natural",tex:"gravel",sound:"gravel"});c({name:"stone",display:"Stone",cat:"natural",tex:"stone"});c({name:"granite",display:"Granite",cat:"natural",tex:"granite"});c({name:"diorite",display:"Diorite",cat:"natural",tex:"diorite"});c({name:"andesite",display:"Andesite",cat:"natural",tex:"andesite"});c({name:"deepslate",display:"Deepslate",cat:"natural",tex:{top:"deepslate_top",bottom:"deepslate_top",side:"deepslate"},orient:"axis"});c({name:"tuff",display:"Tuff",cat:"natural",tex:"tuff"});c({name:"calcite",display:"Calcite",cat:"natural",tex:"calcite"});c({name:"dripstone_block",display:"Dripstone Block",cat:"natural",tex:"dripstone"});c({name:"bedrock",display:"Bedrock",cat:"natural",tex:"bedrock"});c({name:"snow_block",display:"Snow Block",cat:"natural",tex:"snow",sound:"snow"});c({name:"snow",display:"Snow",cat:"natural",tex:"snow",shape:"layer",sound:"snow",replaceable:!0,support:"solid"});c({name:"ice",display:"Ice",cat:"natural",tex:"ice",layer:"translucent",cullSelf:!0,opacity:1,sound:"glass"});c({name:"packed_ice",display:"Packed Ice",cat:"natural",tex:"packed_ice",sound:"glass"});c({name:"blue_ice",display:"Blue Ice",cat:"natural",tex:"blue_ice",sound:"glass"});c({name:"obsidian",display:"Obsidian",cat:"natural",tex:"obsidian"});c({name:"crying_obsidian",display:"Crying Obsidian",cat:"natural",tex:"crying_obsidian",light:10});c({name:"netherrack",display:"Netherrack",cat:"natural",tex:"netherrack"});c({name:"soul_sand",display:"Soul Sand",cat:"natural",tex:"soul_sand",sound:"sand"});c({name:"soul_soil",display:"Soul Soil",cat:"natural",tex:"soul_soil",sound:"sand"});c({name:"magma_block",display:"Magma Block",cat:"natural",tex:"magma",light:3});c({name:"basalt",display:"Basalt",cat:"natural",tex:{end:"basalt_top",side:"basalt_side"},orient:"axis"});c({name:"blackstone",display:"Blackstone",cat:"natural",tex:{top:"blackstone_top",bottom:"blackstone_top",side:"blackstone"}});c({name:"end_stone",display:"End Stone",cat:"natural",tex:"end_stone"});c({name:"amethyst_block",display:"Block of Amethyst",cat:"natural",tex:"amethyst",sound:"glass"});c({name:"bone_block",display:"Bone Block",cat:"natural",tex:{end:"bone_top",side:"bone_side"},orient:"axis"});var Yt=[["coal","Coal"],["iron","Iron"],["copper","Copper"],["gold","Gold"],["redstone","Redstone"],["lapis","Lapis Lazuli"],["diamond","Diamond"],["emerald","Emerald"]];for(let[e,t]of Yt)c({name:`${e}_ore`,display:`${t} Ore`,cat:"ores",tex:`ore_stone_${e}`,light:0});for(let[e,t]of Yt)c({name:`deepslate_${e}_ore`,display:`Deepslate ${t} Ore`,cat:"ores",tex:`ore_deepslate_${e}`});c({name:"nether_gold_ore",display:"Nether Gold Ore",cat:"ores",tex:"ore_nether_gold"});c({name:"nether_quartz_ore",display:"Nether Quartz Ore",cat:"ores",tex:"ore_nether_quartz"});var Lo=[["coal_block","Block of Coal"],["iron_block","Block of Iron"],["copper_block","Block of Copper"],["gold_block","Block of Gold"],["redstone_block","Block of Redstone"],["lapis_block","Block of Lapis Lazuli"],["diamond_block","Block of Diamond"],["emerald_block","Block of Emerald"],["netherite_block","Block of Netherite"],["raw_iron_block","Block of Raw Iron"],["raw_copper_block","Block of Raw Copper"],["raw_gold_block","Block of Raw Gold"],["exposed_copper","Exposed Copper"],["weathered_copper","Weathered Copper"],["oxidized_copper","Oxidized Copper"]];for(let[e,t]of Lo)c({name:e,display:t,cat:"ores",tex:e,sound:"metal"});for(let e of Uo){let t=ee(e),n=e;c({name:`${e}_log`,display:`${t} Log`,cat:"wood",tex:{end:`${n}_log_top`,side:`${n}_log`},orient:"axis",sound:"wood"}),c({name:`${e}_wood`,display:`${t} Wood`,cat:"wood",tex:`${n}_log`,orient:"axis",sound:"wood"}),c({name:`stripped_${e}_log`,display:`Stripped ${t} Log`,cat:"wood",tex:{end:`stripped_${e}_log_top`,side:`stripped_${e}_log`},orient:"axis",sound:"wood"}),c({name:`${e}_planks`,display:`${t} Planks`,cat:"wood",tex:`${e}_planks`,sound:"wood"});let o=e!=="spruce"&&e!=="birch"&&e!=="cherry";c({name:`${e}_leaves`,display:`${t} Leaves`,cat:"wood",tex:`${e}_leaves`,layer:"cutout",opacity:1,tint:o?"foliage":"none",sound:"grass",wave:"leaves"}),c({name:`${e}_slab`,display:`${t} Slab`,cat:"wood",tex:`${e}_planks`,shape:"slab",sound:"wood"}),c({name:`${e}_stairs`,display:`${t} Stairs`,cat:"wood",tex:`${e}_planks`,shape:"stairs",sound:"wood"}),c({name:`${e}_fence`,display:`${t} Fence`,cat:"wood",tex:`${e}_planks`,shape:"fence",family:"wood_fence",sound:"wood"}),c({name:`${e}_door`,display:`${t} Door`,cat:"wood",tex:{top:`${e}_door_top`,bottom:`${e}_door_bottom`,side:`${e}_door_bottom`},shape:"door",layer:"cutout",sound:"wood"}),c({name:`${e}_trapdoor`,display:`${t} Trapdoor`,cat:"wood",tex:`${e}_trapdoor`,shape:"trapdoor",layer:"cutout",sound:"wood"}),c({name:`${e}_sapling`,display:`${t} Sapling`,cat:"wood",tex:`${e}_sapling`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"})}var Oo=[["cobblestone","Cobblestone","cobblestone"],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone"],["smooth_stone","Smooth Stone","smooth_stone"],["stone_bricks","Stone Bricks","stone_bricks"],["mossy_stone_bricks","Mossy Stone Bricks","mossy_stone_bricks"],["cracked_stone_bricks","Cracked Stone Bricks","cracked_stone_bricks"],["chiseled_stone_bricks","Chiseled Stone Bricks","chiseled_stone_bricks"],["bricks","Bricks","bricks"],["polished_granite","Polished Granite","polished_granite"],["polished_diorite","Polished Diorite","polished_diorite"],["polished_andesite","Polished Andesite","polished_andesite"],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate"],["polished_deepslate","Polished Deepslate","polished_deepslate"],["deepslate_bricks","Deepslate Bricks","deepslate_bricks"],["deepslate_tiles","Deepslate Tiles","deepslate_tiles"],["polished_tuff","Polished Tuff","polished_tuff"],["mud_bricks","Mud Bricks","mud_bricks"],["packed_mud","Packed Mud","packed_mud"],["prismarine","Prismarine","prismarine"],["prismarine_bricks","Prismarine Bricks","prismarine_bricks"],["dark_prismarine","Dark Prismarine","dark_prismarine"],["nether_bricks","Nether Bricks","nether_bricks"],["red_nether_bricks","Red Nether Bricks","red_nether_bricks"],["cracked_nether_bricks","Cracked Nether Bricks","cracked_nether_bricks"],["chiseled_nether_bricks","Chiseled Nether Bricks","chiseled_nether_bricks"],["polished_blackstone","Polished Blackstone","polished_blackstone"],["polished_blackstone_bricks","Polished Blackstone Bricks","polished_blackstone_bricks"],["end_stone_bricks","End Stone Bricks","end_stone_bricks"],["purpur_block","Purpur Block","purpur"],["terracotta","Terracotta","terracotta"]];for(let[e,t,n]of Oo)c({name:e,display:t,cat:"building",tex:n});c({name:"sandstone",display:"Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_bottom",side:"sandstone"}});c({name:"chiseled_sandstone",display:"Chiseled Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"chiseled_sandstone"}});c({name:"cut_sandstone",display:"Cut Sandstone",cat:"building",tex:{top:"sandstone_top",bottom:"sandstone_top",side:"cut_sandstone"}});c({name:"smooth_sandstone",display:"Smooth Sandstone",cat:"building",tex:"sandstone_top"});c({name:"red_sandstone",display:"Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_bottom",side:"red_sandstone"}});c({name:"chiseled_red_sandstone",display:"Chiseled Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"chiseled_red_sandstone"}});c({name:"cut_red_sandstone",display:"Cut Red Sandstone",cat:"building",tex:{top:"red_sandstone_top",bottom:"red_sandstone_top",side:"cut_red_sandstone"}});c({name:"smooth_red_sandstone",display:"Smooth Red Sandstone",cat:"building",tex:"red_sandstone_top"});c({name:"quartz_block",display:"Block of Quartz",cat:"building",tex:{top:"quartz_top",bottom:"quartz_top",side:"quartz_side"}});c({name:"chiseled_quartz_block",display:"Chiseled Quartz Block",cat:"building",tex:{end:"chiseled_quartz_top",side:"chiseled_quartz"},orient:"axis"});c({name:"quartz_pillar",display:"Quartz Pillar",cat:"building",tex:{end:"quartz_pillar_top",side:"quartz_pillar"},orient:"axis"});c({name:"quartz_bricks",display:"Quartz Bricks",cat:"building",tex:"quartz_bricks"});c({name:"smooth_quartz",display:"Smooth Quartz Block",cat:"building",tex:"quartz_top"});c({name:"purpur_pillar",display:"Purpur Pillar",cat:"building",tex:{end:"purpur_pillar_top",side:"purpur_pillar"},orient:"axis"});c({name:"glass",display:"Glass",cat:"building",tex:"glass",layer:"cutout",cullSelf:!0,sound:"glass"});c({name:"tinted_glass",display:"Tinted Glass",cat:"building",tex:"tinted_glass",layer:"translucent",cullSelf:!0,opacity:15,sound:"glass"});c({name:"glass_pane",display:"Glass Pane",cat:"building",tex:"glass",shape:"pane",layer:"cutout",family:"pane",sound:"glass"});c({name:"iron_bars",display:"Iron Bars",cat:"building",tex:"iron_bars",shape:"pane",layer:"cutout",family:"pane",sound:"metal"});var Go=[["stone","Stone","stone",!1],["cobblestone","Cobblestone","cobblestone",!0],["mossy_cobblestone","Mossy Cobblestone","mossy_cobblestone",!0],["smooth_stone","Smooth Stone","smooth_stone_slab_side",!1],["stone_brick","Stone Brick","stone_bricks",!0],["brick","Brick","bricks",!0],["sandstone","Sandstone","sandstone_top",!0],["red_sandstone","Red Sandstone","red_sandstone_top",!0],["quartz","Quartz","quartz_top",!1],["granite","Granite","granite",!0],["diorite","Diorite","diorite",!0],["andesite","Andesite","andesite",!0],["polished_andesite","Polished Andesite","polished_andesite",!1],["cobbled_deepslate","Cobbled Deepslate","cobbled_deepslate",!0],["deepslate_brick","Deepslate Brick","deepslate_bricks",!0],["prismarine","Prismarine","prismarine",!0],["nether_brick","Nether Brick","nether_bricks",!0],["blackstone","Blackstone","blackstone",!0],["end_stone_brick","End Stone Brick","end_stone_bricks",!0],["purpur","Purpur","purpur",!1],["mud_brick","Mud Brick","mud_bricks",!0]];for(let[e,t,n,o]of Go){let r=e==="smooth_stone"?{top:"smooth_stone",bottom:"smooth_stone",side:n}:n;c({name:`${e}_slab`,display:`${t} Slab`,cat:"building",tex:r,shape:"slab"}),e!=="smooth_stone"&&c({name:`${e}_stairs`,display:`${t} Stairs`,cat:"building",tex:n,shape:"stairs"}),o&&c({name:`${e}_wall`,display:`${t} Wall`,cat:"building",tex:n,shape:"wall",family:"wall"})}for(let e of ae)c({name:`${e}_wool`,display:`${ee(e)} Wool`,cat:"colored",tex:`wool_${e}`,sound:"wool"});for(let e of ae)c({name:`${e}_carpet`,display:`${ee(e)} Carpet`,cat:"colored",tex:`wool_${e}`,shape:"carpet",sound:"wool",support:"solid"});for(let e of ae)c({name:`${e}_concrete`,display:`${ee(e)} Concrete`,cat:"colored",tex:`concrete_${e}`});for(let e of ae)c({name:`${e}_concrete_powder`,display:`${ee(e)} Concrete Powder`,cat:"colored",tex:`powder_${e}`,sound:"sand"});for(let e of ae)c({name:`${e}_terracotta`,display:`${ee(e)} Terracotta`,cat:"colored",tex:`terracotta_${e}`});for(let e of ae)c({name:`${e}_glazed_terracotta`,display:`${ee(e)} Glazed Terracotta`,cat:"colored",tex:`glazed_${e}`,orient:"horizontal"});for(let e of ae)c({name:`${e}_stained_glass`,display:`${ee(e)} Stained Glass`,cat:"colored",tex:`stained_glass_${e}`,layer:"translucent",cullSelf:!0,sound:"glass"});for(let e of ae)c({name:`${e}_stained_glass_pane`,display:`${ee(e)} Stained Glass Pane`,cat:"colored",tex:`stained_glass_${e}`,shape:"pane",layer:"translucent",family:"pane",sound:"glass"});c({name:"glowstone",display:"Glowstone",cat:"light",tex:"glowstone",light:15,sound:"glass"});c({name:"sea_lantern",display:"Sea Lantern",cat:"light",tex:"sea_lantern",light:15,sound:"glass"});c({name:"torch",display:"Torch",cat:"light",tex:"torch",shape:"torch",layer:"cutout",light:14,solid:!1,sound:"wood"});c({name:"soul_torch",display:"Soul Torch",cat:"light",tex:"soul_torch",shape:"torch",layer:"cutout",light:10,solid:!1,sound:"wood"});c({name:"lantern",display:"Lantern",cat:"light",tex:"lantern",shape:"lantern",layer:"cutout",light:15,sound:"metal"});c({name:"soul_lantern",display:"Soul Lantern",cat:"light",tex:"soul_lantern",shape:"lantern",layer:"cutout",light:10,sound:"metal"});c({name:"shroomlight",display:"Shroomlight",cat:"light",tex:"shroomlight",light:15,sound:"wool"});c({name:"jack_o_lantern",display:"Jack o\'Lantern",cat:"light",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"jack_o_lantern"},orient:"horizontal",light:15,sound:"wood"});c({name:"redstone_lamp",display:"Redstone Lamp",cat:"light",tex:"redstone_lamp_on",light:15,sound:"glass"});c({name:"ochre_froglight",display:"Ochre Froglight",cat:"light",tex:{end:"froglight_ochre_top",side:"froglight_ochre"},orient:"axis",light:15});c({name:"verdant_froglight",display:"Verdant Froglight",cat:"light",tex:{end:"froglight_verdant_top",side:"froglight_verdant"},orient:"axis",light:15});c({name:"pearlescent_froglight",display:"Pearlescent Froglight",cat:"light",tex:{end:"froglight_pearl_top",side:"froglight_pearl"},orient:"axis",light:15});c({name:"end_rod",display:"End Rod",cat:"light",tex:"end_rod",shape:"rod",layer:"cutout",light:14,sound:"glass"});c({name:"campfire_log_glow",display:"Glowing Embers",cat:"light",tex:"embers",light:12,sound:"wood"});c({name:"bookshelf",display:"Bookshelf",cat:"decor",tex:{top:"oak_planks",bottom:"oak_planks",side:"bookshelf"},sound:"wood"});c({name:"crafting_table",display:"Crafting Table",cat:"decor",tex:{top:"crafting_table_top",bottom:"oak_planks",side:"crafting_table_side",front:"crafting_table_front"},orient:"horizontal",sound:"wood"});c({name:"furnace",display:"Furnace",cat:"decor",tex:{top:"furnace_top",bottom:"furnace_top",side:"furnace_side",front:"furnace_front"},orient:"horizontal"});c({name:"blast_furnace",display:"Blast Furnace",cat:"decor",tex:{top:"blast_furnace_top",bottom:"blast_furnace_top",side:"blast_furnace_side",front:"blast_furnace_front"},orient:"horizontal"});c({name:"chest",display:"Chest",cat:"decor",tex:{top:"chest_top",bottom:"chest_top",side:"chest_side",front:"chest_front"},shape:"chest",orient:"horizontal",layer:"cutout",sound:"wood"});c({name:"barrel",display:"Barrel",cat:"decor",tex:{end:"barrel_top",side:"barrel_side"},orient:"axis",sound:"wood"});c({name:"note_block",display:"Note Block",cat:"decor",tex:"note_block",sound:"wood"});c({name:"jukebox",display:"Jukebox",cat:"decor",tex:{top:"jukebox_top",bottom:"jukebox_side",side:"jukebox_side"},sound:"wood"});c({name:"tnt",display:"TNT",cat:"decor",tex:{top:"tnt_top",bottom:"tnt_bottom",side:"tnt_side"},sound:"grass"});c({name:"target",display:"Target",cat:"decor",tex:{top:"target_top",bottom:"target_top",side:"target_side"},sound:"grass"});c({name:"pumpkin",display:"Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side"},sound:"wood"});c({name:"carved_pumpkin",display:"Carved Pumpkin",cat:"decor",tex:{top:"pumpkin_top",bottom:"pumpkin_top",side:"pumpkin_side",front:"carved_pumpkin"},orient:"horizontal",sound:"wood"});c({name:"melon",display:"Melon",cat:"decor",tex:{top:"melon_top",bottom:"melon_top",side:"melon_side"},sound:"wood"});c({name:"hay_block",display:"Hay Bale",cat:"decor",tex:{end:"hay_top",side:"hay_side"},orient:"axis",sound:"grass"});c({name:"sponge",display:"Sponge",cat:"decor",tex:"sponge",sound:"grass"});c({name:"wet_sponge",display:"Wet Sponge",cat:"decor",tex:"wet_sponge",sound:"grass"});c({name:"slime_block",display:"Slime Block",cat:"decor",tex:"slime",layer:"translucent",cullSelf:!0,sound:"slime"});c({name:"honey_block",display:"Honey Block",cat:"decor",tex:"honey",layer:"translucent",cullSelf:!0,sound:"slime"});c({name:"honeycomb_block",display:"Honeycomb Block",cat:"decor",tex:"honeycomb",sound:"wool"});c({name:"dried_kelp_block",display:"Dried Kelp Block",cat:"decor",tex:{top:"kelp_top",bottom:"kelp_top",side:"kelp_side"},sound:"grass"});c({name:"brown_mushroom_block",display:"Brown Mushroom Block",cat:"decor",tex:"mushroom_brown",sound:"wood"});c({name:"red_mushroom_block",display:"Red Mushroom Block",cat:"decor",tex:"mushroom_red",sound:"wood"});c({name:"mushroom_stem",display:"Mushroom Stem",cat:"decor",tex:"mushroom_stem",sound:"wood"});c({name:"cobweb",display:"Cobweb",cat:"decor",tex:"cobweb",shape:"cross",layer:"cutout",solid:!1,sound:"wool"});c({name:"cactus",display:"Cactus",cat:"decor",tex:{top:"cactus_top",bottom:"cactus_bottom",side:"cactus_side"},shape:"cactus",layer:"cutout",support:"cactus",sound:"wool"});c({name:"sugar_cane",display:"Sugar Cane",cat:"decor",tex:"sugar_cane",shape:"cross",layer:"cutout",solid:!1,support:"cane",sound:"grass"});c({name:"short_grass",display:"Short Grass",cat:"decor",tex:"tall_grass",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});c({name:"fern",display:"Fern",cat:"decor",tex:"fern",shape:"cross",layer:"cutout",solid:!1,tint:"grass",replaceable:!0,support:"soil",sound:"grass",wave:"plant"});c({name:"dead_bush",display:"Dead Bush",cat:"decor",tex:"dead_bush",shape:"cross",layer:"cutout",solid:!1,replaceable:!0,support:"sand",sound:"grass",wave:"plant"});var Io=[["dandelion","Dandelion"],["poppy","Poppy"],["blue_orchid","Blue Orchid"],["allium","Allium"],["azure_bluet","Azure Bluet"],["red_tulip","Red Tulip"],["orange_tulip","Orange Tulip"],["white_tulip","White Tulip"],["pink_tulip","Pink Tulip"],["oxeye_daisy","Oxeye Daisy"],["cornflower","Cornflower"],["lily_of_the_valley","Lily of the Valley"]];for(let[e,t]of Io)c({name:e,display:t,cat:"decor",tex:`flower_${e}`,shape:"cross",layer:"cutout",solid:!1,support:"soil",sound:"grass",wave:"plant"});c({name:"brown_mushroom",display:"Brown Mushroom",cat:"decor",tex:"brown_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});c({name:"red_mushroom",display:"Red Mushroom",cat:"decor",tex:"red_mushroom",shape:"cross",layer:"cutout",solid:!1,support:"solid",sound:"grass"});c({name:"lily_pad",display:"Lily Pad",cat:"decor",tex:"lily_pad",shape:"lily",layer:"cutout",solid:!0,tint:"foliage",support:"water",sound:"grass"});c({name:"seagrass",display:"Seagrass",cat:"decor",tex:"seagrass",shape:"cross",layer:"cutout",solid:!1,item:!1,sound:"grass",wave:"plant"});c({name:"water",display:"Water",cat:"fluids",tex:"water",shape:"fluid",layer:"water",fluid:!0,solid:!1,opacity:1,replaceable:!0,cullSelf:!0,tint:"water",sound:"liquid"});c({name:"lava",display:"Lava",cat:"fluids",tex:"lava",shape:"fluid",layer:"lava",fluid:!0,solid:!1,light:15,opacity:0,replaceable:!0,cullSelf:!0,sound:"liquid"});var st=ye,S=ye.length,F={};ye.forEach((e,t)=>{F[e.name]=t});var Po=["cube","slab","stairs","fence","wall","cross","torch","door","trapdoor","pane","fluid","layer","carpet","cactus","lantern","chest","rod","lily"],g=Object.fromEntries(Po.map((e,t)=>[e,t])),zo=["opaque","cutout","translucent","water","lava"],Re=Object.fromEntries(zo.map((e,t)=>[e,t])),$=new Uint8Array(S),Q=new Uint8Array(S),Do=new Uint8Array(S),jt=new Uint8Array(S),rt=new Uint8Array(S),xe=new Uint8Array(S),De=new Uint8Array(S),Ne=new Uint8Array(S),No=new Uint8Array(S),Me=new Uint8Array(S),at=new Uint8Array(S),ct=new Uint8Array(S),lt=new Uint8Array(S),Be=new Uint8Array(S),pe=new Uint8Array(S),$o=new Uint8Array(S),nt=[""],Fo=["none","grass","foliage","water"],Et,Ct,Ut,Lt,Ot,Gt;for(let e=0;e<S;e++){let t=ye[e],n=(Et=t.shape)!=null?Et:"cube",o=(Ct=t.layer)!=null?Ct:"opaque";$[e]=g[n],Q[e]=Re[o],Do[e]=(Ut=t.light)!=null?Ut:0;let r=n==="cube"&&o==="opaque";if(rt[e]=r&&t.transparent!==!0?1:0,jt[e]=(Lt=t.opacity)!=null?Lt:r?15:0,xe[e]=(Ot=t.solid)==null||Ot?1:0,De[e]=t.fluid?1:0,Ne[e]=t.cullSelf?1:0,No[e]=t.replaceable?1:0,Me[e]=Fo.indexOf((Gt=t.tint)!=null?Gt:"none"),at[e]=t.tintMask?1:0,ct[e]=t.orient==="axis"?1:t.orient==="horizontal"?2:0,lt[e]=t.wave==="plant"?1:t.wave==="leaves"?2:0,Be[e]=t.name.endsWith("_leaves")?1:0,t.family){let s=nt.indexOf(t.family);s<0&&(s=nt.length,nt.push(t.family)),pe[e]=s}$o[e]=e!==0&&!t.fluid?1:0}xe[0]=0;jt[0]=0;var At=[],vt=new Map;function ze(e){let t=vt.get(e);return t===void 0&&(t=At.length,At.push(e),vt.set(e,t)),t}ze("missing");var R=new Uint16Array(S*6),It,Pt,zt,Dt,Nt,$t,Ft,qt,Ht,Vt,Wt,Xt;for(let e=0;e<S;e++){let t=ye[e].tex,n;if(typeof t=="string")n=[t,t,t,t,t,t];else{let o=(zt=(Pt=(It=t.side)!=null?It:t.all)!=null?Pt:t.end)!=null?zt:"missing",r=(Nt=(Dt=t.top)!=null?Dt:t.end)!=null?Nt:o,s=(Ft=($t=t.bottom)!=null?$t:t.end)!=null?Ft:r;n=[(qt=t.east)!=null?qt:o,(Ht=t.west)!=null?Ht:o,r,s,(Vt=t.south)!=null?Vt:o,(Xt=(Wt=t.north)!=null?Wt:t.front)!=null?Xt:o]}for(let o=0;o<6;o++)R[e*6+o]=ze(n[o])}var An={water_still:ze("water"),lava_still:ze("lava")},Tt=new Uint8Array(1024);for(let e=0;e<S;e++){let t=Q[e]===Re.cutout?1:Q[e]===Re.translucent?2:0;for(let n=0;n<6;n++){let o=R[e*6+n];t>Tt[o]&&(Tt[o]=t)}}var qo=10,Kt=(e,t=0)=>e|t<<qo;if(S>1024)throw new Error("Too many blocks for 10-bit ids");var u=e=>{let t=parseInt(e.replace("#",""),16);return[t>>16&255,t>>8&255,t&255]};var Ae=e=>[e,e,e];var Tn={stone:u("#7d7d7d"),dirt:u("#86603e"),sand:u("#dccf9e"),redSand:u("#bf6a26"),deepslate:u("#4d4d52"),netherrack:u("#6e2d2b"),endStone:u("#dcdf9e"),granite:u("#9a6b57"),diorite:u("#c9c9c6"),andesite:u("#868787"),tuff:u("#6c6d65"),calcite:u("#dfe0dc"),clay:u("#a0a6b4"),mud:u("#3c3a3c"),snow:u("#f4fbfb"),blackstone:u("#2e2a30"),basalt:u("#4b4a4f"),obsidian:u("#140f1f")};var En={oak:{planks:u("#b38d58"),bark:u("#6b5232"),stripped:u("#b18e57"),leaves:Ae(150),tinted:!0},spruce:{planks:u("#735632"),bark:u("#3c2a15"),stripped:u("#76593a"),leaves:u("#4b6f48"),tinted:!1},birch:{planks:u("#c8b67a"),bark:u("#d8d6cf"),stripped:u("#c4ad73"),leaves:u("#7ca052"),tinted:!1},jungle:{planks:u("#a07350"),bark:u("#584519"),stripped:u("#ab8455"),leaves:Ae(158),tinted:!0},acacia:{planks:u("#a85a32"),bark:u("#686056"),stripped:u("#ae5d3b"),leaves:Ae(146),tinted:!0},dark_oak:{planks:u("#432b14"),bark:u("#3c2e1a"),stripped:u("#60492f"),leaves:Ae(130),tinted:!0},mangrove:{planks:u("#763630"),bark:u("#5a3d2c"),stripped:u("#7a382f"),leaves:Ae(140),tinted:!0},cherry:{planks:u("#e3b2ac"),bark:u("#38212c"),stripped:u("#d8939a"),leaves:u("#eab0c8"),tinted:!1}};var Cn={coal:[u("#2a2a2a"),u("#1a1a1a"),u("#4a4a4a")],iron:[u("#d8af93"),u("#b88a6c"),u("#f0d8c4")],copper:[u("#e07a4a"),u("#4a9a7a"),u("#ffb088")],gold:[u("#fcd84a"),u("#d8a020"),u("#fff6b0")],redstone:[u("#e01a10"),u("#a00a08"),u("#ff6a50")],lapis:[u("#2450c0"),u("#1a3490"),u("#6a90f0")],diamond:[u("#5ae8e0"),u("#2ab8b0"),u("#c8fff8")],emerald:[u("#28d860"),u("#10a040"),u("#a0ffc0")],nether_gold:[u("#fcd84a"),u("#d8a020"),u("#fff6b0")],nether_quartz:[u("#ece6dc"),u("#c8c0b4"),u("#ffffff")]};var $e={grass:u("#7bbd56"),foliage:u("#5fab36"),water:u("#3f76e4")};var te=[0,1,0,-1],oe=[-1,0,1,0];var Zt=[5,0,4,1],Qt=[1,3,-1,-1,2,0],V=18,it=V*V*V,Jt=(e,t,n)=>((t+1)*V+(n+1))*V+(e+1),Fe=(e,t)=>(t+1)*V+(e+1);var le=new Uint8Array(65536),q=new Uint8Array(65536),ce=new Uint8Array(65536),pt=[[1,0],[0,.5],[.5,1],[0,2/16],[0,1/16]];for(let e=0;e<65536;e++){let t=e&1023;if(t>=S||t===0)continue;let n=e>>10,o=$[t],r=Q[t]===Re.opaque;if(rt[t]||o===g.slab&&(n&3)===2){le[e]=1,q[e]=63;continue}r&&(o===g.slab?n&3?(q[e]=4,ce[e]=2):(q[e]=8,ce[e]=1):o===g.stairs?n&4?(q[e]=4,ce[e]=2):(q[e]=8,ce[e]=1):o===g.layer?(q[e]=8,ce[e]=3):o===g.carpet&&(q[e]=8,ce[e]=4))}var ut=new Uint8Array(S),so=new Uint8Array(S);for(let e=0;e<S;e++){let t=st[e].name;t.endsWith("_glazed_terracotta")&&(ut[e]=1),$[e]===g.cube&&(t==="glass"||t==="tinted_glass"||t.endsWith("_stained_glass"))&&(so[e]=1)}var no,Ho=(no=F.iron_bars)!=null?no:-1;function ke(e,t){let n=e&1023,o=ct[n],r=n*6;if(o===0)return R[r+t];let s=e>>10;if(o===1){let f=s&3;return f===1?t===0?R[r+2]:t===1?R[r+3]:R[r+4]|65536:f===2?t===4?R[r+2]:t===5?R[r+3]:t===0||t===1?R[r+4]|65536:R[r+4]:R[r+t]}let l=s&3;if(t===2)return R[r+2]|(ut[n]?l+1&3:l)<<16;if(t===3)return R[r+3]|(4-l&3)<<16;let a=Qt[t]-l+4&3,i=R[r+Zt[a]];return ut[n]?i|a<<16:i}var dt=e=>$[e&1023]===g.stairs;function ft(e,t,n){let o=t&1023;if(o===0)return!1;let r=e&1023,s=$[r],l=$[o];if(le[t&65535])return!0;switch(s){case g.fence:if(l===g.fence&&pe[o]===pe[r])return!0;break;case g.pane:if(l===g.pane||so[o])return!0;break;case g.wall:if(l===g.wall)return!0;break;default:return!1}return s!==g.pane&&l===g.stairs&&(t>>10&3)===(n+2&3)}function ro(e,t){let n=0;for(let o=0;o<4;o++)ft(e,t(te[o],0,oe[o]),o)&&(n|=1<<o);return n}var Vo=0,ao=1,co=2,lo=3,io=4;function eo(e,t,n){let o=t(te[n],0,oe[n]);return!dt(o)||(o>>10&3)!==(e>>10&3)||(o>>12&1)!==(e>>12&1)}function Wo(e,t){let n=e>>10,o=n&3,r=n>>2&1,s=t(te[o],0,oe[o]);if(dt(s)&&(s>>12&1)===r){let a=s>>10&3;if((a&1)!==(o&1)&&eo(e,t,a+2&3))return a===(o+3&3)?lo:io}let l=t(-te[o],0,-oe[o]);if(dt(l)&&(l>>12&1)===r){let a=l>>10&3;if((a&1)!==(o&1)&&eo(e,t,a))return a===(o+3&3)?ao:co}return Vo}function Xo(e,t){let n=ro(e,t),o=t(0,1,0),r=o&1023,s=$[r],l=n===5||n===10,a=le[o&65535]===1,i=0;for(let d=0;d<4;d++)n&1<<d&&(a||s===g.wall&&ft(o,t(te[d],1,oe[d]),d))&&(i|=1<<d);let f=!l;if(!f&&r!==0)if(s===g.wall){let d=0;for(let p=0;p<4;p++)ft(o,t(te[p],1,oe[p]),p)&&(d|=1<<p);d!==5&&d!==10&&(f=!0)}else(s===g.torch||s===g.lantern||s===g.rod||!a&&xe[r]&&i===0)&&(f=!0);return n|(f?16:0)|i<<5}function uo(e,t){switch($[e&1023]){case g.stairs:return Wo(e,t);case g.fence:case g.pane:return ro(e,t);case g.wall:return Xo(e,t);default:return 0}}var T=(e,t,n,o,r,s)=>[e/16,t/16,n/16,o/16,r/16,s/16];function qe(e,t){let[n,o,r,s,l,a]=e;for(let i=0;i<(t&3);i++){let f=1-a,d=1-r,p=n,_=s;n=f,s=d,r=p,a=_}return[n,o,r,s,l,a]}var I=e=>[e,e,e,e,e,e];function ve(e){switch(e&3){case 0:return[0,0,1,.5];case 1:return[.5,0,1,1];case 2:return[0,.5,1,1];default:return[0,0,.5,1]}}function He(e,t){let n=ve(e),o=ve(t);return[Math.max(n[0],o[0]),Math.max(n[1],o[1]),Math.min(n[2],o[2]),Math.min(n[3],o[3])]}function Yo(e,t){let n=e>>10,o=n&3,r=n>>2&1,s=[r?[0,.5,0,1,1,1]:[0,0,0,1,.5,1]],l=r?0:.5,a=r?.5:1,i=o+3&3,f=o+1&3,d=o+2&3,p=[];switch(t){case ao:p.push(ve(o),He(d,i));break;case co:p.push(ve(o),He(d,f));break;case lo:p.push(He(o,i));break;case io:p.push(He(o,f));break;default:p.push(ve(o))}for(let _ of p)s.push([_[0],l,_[1],_[2],a,_[3]]);return s}function jo(e){let t=e>>10&3;return t===2?[0,0,0,1,1,1]:t===1?[0,.5,0,1,1,1]:[0,0,0,1,.5,1]}function Ko(e){let t=e>>10,n=t&3,o=t>>2&1,s=t>>4&1?n+1&3:n+3&3,l=n+2&3,a=o?s:l,i=3/16,f;switch(a){case 0:f=[0,0,0,1,1,i];break;case 1:f=[1-i,0,0,1,1,1];break;case 2:f=[0,0,1-i,1,1,1];break;default:f=[0,0,0,i,1,1]}let d=te[l]+te[s],p=oe[l]+oe[s];return{box:f,hingeX:d>0?1:0,hingeZ:p>0?1:0}}function Zo(e){let t=e>>10,n=t&3,o=t>>2&1,r=t>>3&1,s=3/16;if(!o)return r?[0,1-s,0,1,1,1]:[0,0,0,1,s,1];switch(n){case 0:return[0,0,0,1,1,s];case 1:return[1-s,0,0,1,1,1];case 2:return[0,0,1-s,1,1,1];default:return[0,0,0,s,1,1]}}var Ve=22.5*Math.PI/180;function Qo(e){switch(e&3){case 1:return{box:[0,.21875,7/16,2/16,.84375,9/16],rotate:{axis:"z",angle:-Ve,origin:[1/16,.21875,.5]}};case 3:return{box:[14/16,.21875,7/16,1,.84375,9/16],rotate:{axis:"z",angle:Ve,origin:[15/16,.21875,.5]}};case 2:return{box:[7/16,.21875,0,9/16,.84375,2/16],rotate:{axis:"x",angle:Ve,origin:[.5,.21875,1/16]}};default:return{box:[7/16,.21875,14/16,9/16,.84375,1],rotate:{axis:"x",angle:-Ve,origin:[.5,.21875,15/16]}}}}var to=[[7,6,9,16],[7,6,9,16],[7,6,9,8],[7,14,9,16],[7,6,9,16],[7,6,9,16]];function fo(e,t,n=0){let o=e&1023,r=e>>10,s=o*6,l=R[s];switch($[o]){case g.cube:{let a=[];for(let i=0;i<6;i++)a.push(ke(e,i)&65535);return[{box:[0,0,0,1,1,1],tex:a}]}case g.slab:{let a=[R[s],R[s+1],R[s+2],R[s+3],R[s+4],R[s+5]];return[{box:jo(e),tex:a}]}case g.stairs:{let a=[R[s],R[s+1],R[s+2],R[s+3],R[s+4],R[s+5]];return Yo(e,t).map(i=>({box:i,tex:a.slice()}))}case g.fence:{let a=[{box:T(6,0,6,10,16,10),tex:I(l)}];for(let i=0;i<4;i++)t&1<<i&&(a.push({box:qe(T(7,12,0,9,15,6),i),tex:I(l)}),a.push({box:qe(T(7,6,0,9,9,6),i),tex:I(l)}));return a}case g.wall:{let a=[];t&16&&a.push({box:T(4,0,4,12,16,12),tex:I(l)});for(let i=0;i<4;i++){if(!(t&1<<i))continue;let f=t&1<<5+i?16:14;a.push({box:qe(T(5,0,0,11,f,8),i),tex:I(l)})}return a.length||a.push({box:T(4,0,4,12,16,12),tex:I(l)}),a}case g.pane:{let a=t&15?t&15:15,i=o===Ho?1:0,f=[T(7,0,7,9,16,9)];for(let d=0;d<4;d++)a&1<<d&&f.push(qe(T(7,0,0,9,16,7),d));return f.map(d=>{let p=Math.round(d[0]*16),_=Math.round(d[3]*16),b=Math.round(d[2]*16),h=Math.round(d[5]*16),B=_-p<=2,v=h-b<=2,y=_-p>=h-b?[p,0,_,1]:[i,b,i+1,h],m=[i,0,i+1,16],M=[v?m:null,v?m:null,y,y,B?m:null,B?m:null];return{box:d,tex:I(l),uv:M}})}case g.torch:{if(r===0)return[{box:T(7,0,7,9,10,9),tex:I(l),uv:to,shade:!1,ao:!1}];let a=Qo(r-1);return[{box:a.box,tex:I(l),uv:to,rotate:a.rotate,shade:!1,ao:!1}]}case g.door:{let a=r>>3&1?R[s+2]:R[s+3],i=Ko(e),[f,,d,p,,_]=i.box,b=[null,null,null,null,null,null],h=p-f<.5,B=h?[0,1]:[4,5];for(let v of B){let y=v===1||v===4,m=h?i.hingeZ===0:i.hingeX===0;b[v]=y===m?[0,0,16,16]:[16,0,0,16]}return[{box:i.box,tex:I(a),uv:b}]}case g.trapdoor:return[{box:Zo(e),tex:I(l)}];case g.layer:return[{box:T(0,0,0,16,2,16),tex:I(l)}];case g.carpet:return[{box:T(0,0,0,16,1,16),tex:I(l)}];case g.cactus:{let a=R[s+4],i=R[s+2],f=R[s+3];return[{box:[0,0,0,1,1,1],tex:[-1,-1,i,f,-1,-1]},{box:T(0,0,1,16,16,15),tex:[-1,-1,-1,-1,a,a]},{box:T(1,0,0,15,16,16),tex:[a,a,-1,-1,-1,-1]}]}case g.lantern:{let a=r&1?1:0,i=[[5,9,11,16],[5,9,11,16],[0,0,6,6],[0,0,6,6],[5,9,11,16],[5,9,11,16]],f=[[6,7,10,9],[6,7,10,9],[1,1,5,5],[1,1,5,5],[6,7,10,9],[6,7,10,9]],d=[[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7],[7,6,9,7]],p=[{box:T(5,a,5,11,7+a,11),tex:I(l),uv:i},{box:T(6,7+a,6,10,9+a,10),tex:I(l),uv:f}];return a?p.push({box:T(7.5,10,7.5,8.5,16,8.5),tex:[l,l,-1,-1,l,l],uv:d}):p.push({box:T(7,9,7,9,10,9),tex:I(l),uv:d}),p}case g.chest:{let a=[];for(let i=0;i<6;i++)a.push(ke(e,i)&65535);return[{box:T(1,0,1,15,14,15),tex:a}]}case g.rod:{let a=r&3,i=a===1?{axis:"z",angle:-Math.PI/2,origin:[.5,.5,.5]}:a===2?{axis:"x",angle:Math.PI/2,origin:[.5,.5,.5]}:void 0,f=[[0,0,4,1],[0,0,4,1],[0,0,4,4],[0,0,4,4],[0,0,4,1],[0,0,4,1]],d=[[7,0,9,15],[7,0,9,15],[7,0,9,2],[7,0,9,2],[7,0,9,15],[7,0,9,15]];return[{box:T(6,0,6,10,1,10),tex:I(l),uv:f,rotate:i,ao:!1,shade:!1},{box:T(7,1,7,9,16,9),tex:I(l),uv:d,rotate:i,ao:!1,shade:!1}]}case g.lily:{let i=n&3;return[{box:[0,.00625,0,1,.00625,1],tex:[-1,-1,l,l,-1,-1],uv:[null,null,[0,0,16,16],[0,16,16,0],null,null],rotate:i?{axis:"y",angle:-i*Math.PI/2,origin:[.5,.5,.5]}:void 0}]}default:return[]}}var Jo=[0,0,0,1,1,1],oo=new Map;{let e=(t,n)=>{for(let o of t)F[o]!==void 0&&oo.set(F[o],n)};e(["short_grass","fern","dead_bush"],T(2,0,2,14,13,14)),e(["dandelion","poppy","blue_orchid","allium","azure_bluet","red_tulip","orange_tulip","white_tulip","pink_tulip","oxeye_daisy","cornflower","lily_of_the_valley"],T(5,0,5,11,10,11)),e(["brown_mushroom","red_mushroom"],T(5,0,5,11,6,11)),e(["sugar_cane"],T(2,0,2,14,16,14)),e(["cobweb"],Jo),e(["seagrass"],T(2,0,2,14,12,14));for(let t=0;t<S;t++)st[t].name.endsWith("_sapling")&&oo.set(t,T(2,0,2,14,12,14))}var bt=new Uint8Array(S);for(let e of["short_grass","fern","dandelion","poppy","blue_orchid","allium","azure_bluet","red_tulip","orange_tulip","white_tulip","pink_tulip","oxeye_daisy","cornflower","lily_of_the_valley"])F[e]!==void 0&&(bt[F[e]]=1);function We(e,t,n,o=0){let r=Math.imul(e|0,668265261)^Math.imul(n|0,374761393)^Math.imul(t|0,2654435761)^o;return r=Math.imul(r^r>>>15,2246822507),r=Math.imul(r^r>>>13,3266489909),(r^r>>>16)>>>0}var ne=1,J=V,ie=V*V,po=[ne,ie,J],xt=[ne,-ne,ie,-ie,J,-J],kt=[2,1,8,4,32,16],Ke=[0,0,1,1,2,2],Ze=[.6,.6,1,.5,.8,.8],yo=[.45,.65,.82,1],bo=[0,17,17/2,17/3,17/4],me=[[[1,0,1],[1,0,0],[1,1,0],[1,1,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],[[0,1,1],[1,1,1],[1,1,0],[0,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[1,0,0],[0,0,0],[0,1,0],[1,1,0]]],se=new Uint8Array(72),xo=new Int32Array(24),ko=new Int32Array(24),wo=new Uint8Array(6),So=new Uint8Array(6);for(let e=0;e<6;e++){let t=Ke[e],n=t===0?1:0,o=t===2?1:2;for(let a=0;a<4;a++){let i=me[e][a];for(let f=0;f<3;f++)se[(e*4+a)*3+f]=i[f];xo[e*4+a]=(i[n]?1:-1)*po[n],ko[e*4+a]=(i[o]?1:-1)*po[o]}let r=me[e][0],s=me[e][1],l=me[e][3];for(let a=0;a<3;a++)s[a]!==r[a]&&(wo[e]=a),l[a]!==r[a]&&(So[e]=a)}var Ye=[0,16,16,0],gt=[16,16,0,0],je=new Uint8Array(65536);for(let e=0;e<65536;e++){let t=e&1023;t<S&&(le[e]||Be[t])&&(je[e]=1)}var en=new Float32Array(pt.map(e=>e[0])),tn=new Float32Array(pt.map(e=>e[1])),on=g.cube,nn=g.slab,sn=g.cross,rn=g.fluid,an=g.lily,cn=g.pane,ln=g.fence,un=g.door,dn=g.cactus,wt=F.water,go,yt=(go=F.seagrass)!=null?go:-1,Fn=Kt(F.bedrock),he=new Uint16Array(1024);for(let e=0;e<S;e++)De[e]&&(he[e]=e);yt>=0&&(he[yt]=wt);var Ro=new Uint8Array(S);for(let e of["grass_block","snowy_grass_block","dirt","sand","red_sand","mycelium","podzol"])F[e]!==void 0&&(Ro[F[e]]=1);var be=class{constructor(){this.pos=new Int16Array(3*8192);this.uv=new Uint16Array(2*8192);this.tint=new Uint8Array(4*8192);this.light=new Uint8Array(4*8192);this.idx=new Uint32Array(12288);this.vc=0;this.ic=0}reserve(t,n){if((this.vc+t)*3>this.pos.length){let o=Math.max(this.pos.length/3*2,this.vc+t),r=new Int16Array(o*3);r.set(this.pos),this.pos=r;let s=new Uint16Array(o*2);s.set(this.uv),this.uv=s;let l=new Uint8Array(o*4);l.set(this.tint),this.tint=l;let a=new Uint8Array(o*4);a.set(this.light),this.light=a}if(this.ic+n>this.idx.length){let o=new Uint32Array(Math.max(this.idx.length*2,this.ic+n));o.set(this.idx),this.idx=o}}finish(){let t=this.vc,n=this.ic;if(t===0||n===0)return null;let o;return t<=65535?(o=new Uint16Array(n),o.set(this.idx.subarray(0,n))):o=this.idx.slice(0,n),{positions:this.pos.slice(0,t*3),uvs:this.uv.slice(0,t*2),tints:this.tint.slice(0,t*4),lights:this.light.slice(0,t*4),indices:o,vertexCount:t,indexCount:n}}},Se=[new be,new be,new be,new be,new be],K=new Uint16Array(it),j=new Uint8Array(it),D=new Uint8Array(V*V*9),Mo=!1,St=!0,_e=!1,Bo=0,Oe=255,Ge=255,Ie=255,Rt=0,fn=(e,t,n)=>K[Bo+e+n*J+t*ie];function re(e,t,n,o,r,s,l,a,i,f){let d=e.vc++,p=d*3,_=d*2,b=d*4;e.pos[p]=t,e.pos[p+1]=n,e.pos[p+2]=o,e.uv[_]=r,e.uv[_+1]=s;let h=e.tint;h[b]=Oe,h[b+1]=Ge,h[b+2]=Ie,h[b+3]=Rt;let B=e.light;B[b]=l,B[b+1]=a,B[b+2]=i,B[b+3]=f}function we(e,t,n,o){let r=e.idx,s=e.ic;n?(r[s++]=t+1,r[s++]=t+2,r[s++]=t+3,r[s++]=t+1,r[s++]=t+3,r[s++]=t):(r[s++]=t,r[s++]=t+1,r[s++]=t+2,r[s++]=t,r[s++]=t+2,r[s++]=t+3),o&&(n?(r[s++]=t+1,r[s++]=t+3,r[s++]=t+2,r[s++]=t+1,r[s++]=t,r[s++]=t+3):(r[s++]=t,r[s++]=t+2,r[s++]=t+1,r[s++]=t,r[s++]=t+3,r[s++]=t+2)),e.ic=s}function Mt(e,t,n){let o=Me[e];if(o){let r=Fe(t,n)*9+(o-1)*3;Oe=D[r],Ge=D[r+1],Ie=D[r+2]}else Oe=255,Ge=255,Ie=255;Rt=at[e]?255:0}function Bt(e,t){let n=Fe(e,t)*9;return(D[n]|D[n+1]<<8|D[n+2]<<16)^Math.imul(D[n+3]|D[n+4]<<8|D[n+5]<<16,2654435761)^Math.imul(D[n+6]|D[n+7]<<8|D[n+8]<<16,2246822507)}var W=new Float32Array(4),X=new Float32Array(4),Y=new Uint8Array(4);function Ao(e,t){let n=j[e],o=n>>4,r=n&15,s=t*4;for(let l=0;l<4;l++){let a=xo[s+l],i=ko[s+l],f=e+a,d=e+i,p=f+i,_=K[f],b=K[d],h=K[p],B=le[_],v=le[b],y=o,m=r,M=1;if(!B){let A=j[f];y+=A>>4,m+=A&15,M++}if(!v){let A=j[d];y+=A>>4,m+=A&15,M++}if(!(B&&v)&&!le[h]){let A=j[p];y+=A>>4,m+=A&15,M++}W[l]=y*bo[M],X[l]=m*bo[M];let E=je[_],U=je[b];Y[l]=E&&U?0:3-E-U-je[h]}}function pn(e){let t=j[e],n=(t>>4)*17,o=(t&15)*17;W[0]=W[1]=W[2]=W[3]=n,X[0]=X[1]=X[2]=X[3]=o,Y[0]=Y[1]=Y[2]=Y[3]=3}function bn(e,t,n,o,r,s){let l=Be[s]===1,a=l&&!Mo,i=Se[a?0:Q[s]],f=Ne[s]===1,d=l&&!_e?16:0;Mt(s,e,n);for(let p=0;p<6;p++){let _=o+xt[p],b=K[_];if(q[b]&kt[p])continue;if(b!==0){let k=b&1023;if(f&&k===s||a&&Be[k])continue}let h=ke(r,p),B=h&65535,v=h>>>16;p===2&&Ro[s]&&!_e&&(v=v+We(e,t,n,Bt(e,n))&3),St?Ao(_,p):pn(_);let y=(B&31)<<4,m=B>>5<<4;i.reserve(4,6);let M=i.vc,E=Ze[p]*255,U=p|d,A=p*12;for(let k=0;k<4;k++){let G=k+v&3;re(i,e+se[A+k*3]<<8,t+se[A+k*3+1]<<8,n+se[A+k*3+2]<<8,y+Ye[G],m+gt[G],W[k]+.5|0,X[k]+.5|0,E*yo[Y[k]]+.5|0,U)}let P=Y[0]*64+W[0]+X[0]+Y[2]*64+W[2]+X[2],L=Y[1]*64+W[1]+X[1]+Y[3]*64+W[3]+X[3];we(i,M,P<L,!1)}}function mn(e,t,n,o,r){let s=Se[Q[r]],l=j[o],a=(l>>4)*17,i=(l&15)*17;Mt(r,e,n);let f=0,d=0;if(bt[r]&&!_e){let k=We(e,t,n,Bt(e,n));f=((k&15)/15-.5)*(6/16),d=((k>>>4&15)/15-.5)*(6/16)}let p=lt[r]===1&&!_e,_=6|(p?8:0),b=_|(p?32:0),h=ke(r,0)&65535,B=(h&31)<<4,v=h>>5<<4,y=.05,m=.95,M=Math.round((e+y+f)*256),E=Math.round((e+m+f)*256),U=Math.round((n+y+d)*256),A=Math.round((n+m+d)*256),P=t<<8,L=t+1<<8;s.reserve(8,24);for(let k=0;k<2;k++){let G=k?A:U,Z=k?U:A,w=s.vc;re(s,M,P,G,B,v+16,a,i,255,_),re(s,E,P,Z,B+16,v+16,a,i,255,_),re(s,E,L,Z,B+16,v,a,i,255,b),re(s,M,L,G,B,v,a,i,255,b),we(s,w,!1,!0)}}var mt=14/16;function vo(e){let t=e&1023;if(!De[t])return mt;let n=e>>10;return n&8?mt:mt-(n&7)/9}function Le(e,t){let n=K[e],o=n&1023;return he[o]===t?he[K[e+ie]&1023]===t?1:vo(n):xe[o]?-1:0}function Xe(e,t,n,o,r){if(t>=1||n>=1)return 1;let s=0,l=0;if(t>0||n>0){let a=Le(o,r);if(a>=1)return 1;a>=.8?(s+=a*10,l+=10):a>=0&&(s+=a,l+=1)}return e>=.8?(s+=e*10,l+=10):e>=0&&(s+=e,l+=1),t>=.8?(s+=t*10,l+=10):t>=0&&(s+=t,l+=1),n>=.8?(s+=n*10,l+=10):n>=0&&(s+=n,l+=1),l>0?s/l:e}var ht=(e,t)=>Math.max(e>>4,t>>4)<<4|Math.max(e&15,t&15),O=new Float32Array(4),hn=[0,256,256,0],_n=[256,256,0,0],gn=[2,3,1,0];function mo(e,t,n,o,r,s){let l=s===wt,a=Se[Q[s]];if(Me[s]){let y=Fe(e,n)*9+(Me[s]-1)*3;Oe=D[y],Ge=D[y+1],Ie=D[y+2]}else Oe=Ge=Ie=255;Rt=0;let i=j[o],f=K[o+ie],d=he[f&1023]===s;if(d)O[0]=O[1]=O[2]=O[3]=1;else{let y=vo(r),m=Le(o-J,s),M=Le(o+J,s),E=Le(o-ne,s),U=Le(o+ne,s);O[0]=Xe(y,m,E,o-J-ne,s),O[1]=Xe(y,m,U,o-J+ne,s),O[2]=Xe(y,M,E,o+J-ne,s),O[3]=Xe(y,M,U,o+J+ne,s)}let p=ke(s,2)&65535,_=(p&31)<<4,b=p>>5<<4,h=e<<8,B=t<<8,v=n<<8;if(!d&&!(q[f]&8&&O[0]>=1&&O[1]>=1&&O[2]>=1&&O[3]>=1)){let y=ht(i,j[o+ie]),m=(y>>4)*17,M=(y&15)*17,E=2|(l&&!_e?24:0),U=O[0]+O[2]-O[1]-O[3],A=O[0]+O[1]-O[2]-O[3],P=0;Math.abs(U)+Math.abs(A)>.001&&(P=Math.abs(U)>Math.abs(A)?U>0?3:1:A>0?0:2),a.reserve(4,12);let L=a.vc;for(let k=0;k<4;k++){let G=k+P&3;re(a,h+hn[k],B+Math.round(O[gn[k]]*256),v+_n[k],_+Ye[G],b+gt[G],m,M,255,E)}we(a,L,!1,l)}for(let y=0;y<6;y++){if(y===2||y===3)continue;let m=o+xt[y],M=K[m];if(he[M&1023]===s||q[M]&kt[y])continue;let E=ht(i,j[m]),U=(E>>4)*17,A=(E&15)*17,P=Ze[y]*255+.5|0;a.reserve(4,12);let L=a.vc,k=y*12;for(let G=0;G<4;G++){let Z=se[k+G*3],w=se[k+G*3+1],N=se[k+G*3+2],x=w?O[Z+N*2]:0,C=Math.round(16*(1-x));re(a,h+(Z<<8),B+Math.round(x*256),v+(N<<8),_+Ye[G],b+C,U,A,P,y)}we(a,L,!1,l)}{let y=o-ie,m=K[y];if(he[m&1023]!==s&&!(q[m]&4)){let M=ht(i,j[y]),E=(M>>4)*17,U=(M&15)*17,A=Ze[3]*255+.5|0;a.reserve(4,12);let P=a.vc,L=3*12;for(let k=0;k<4;k++)re(a,h+(se[L+k*3]<<8),B,v+(se[L+k*3+2]<<8),_+Ye[k],b+gt[k],E,U,A,3);we(a,P,!1,l)}}}var ho=new Map;function yn(e,t,n,o,r,s){let l,a;switch(e){case 0:l=1-o,a=1-n;break;case 1:l=o,a=1-n;break;case 2:l=t,a=o;break;case 3:l=t,a=1-o;break;case 4:l=t,a=1-n;break;default:l=1-t,a=1-n}r[s]=Math.min(16,Math.max(0,l*16)),r[s+1]=Math.min(16,Math.max(0,a*16))}var z=1e-5;function xn(e,t,n){let o=e[t].box,r=Ke[n],s=(n&1)===0,l=s?o[r+3]:o[r],a=(r+1)%3,i=(r+2)%3;for(let f=0;f<e.length;f++){if(f===t)continue;let d=e[f];if(d.rotate)continue;let p=!0;for(let h=0;h<6;h++)if(!(d.tex[h]>=0)){p=!1;break}if(!p)continue;let _=d.box;if(!(_[3]-_[0]<=z||_[4]-_[1]<=z||_[5]-_[2]<=z||!(s?_[r]<=l+z&&_[r+3]>l+z:_[r]<l-z&&_[r+3]>=l-z))&&_[a]<=o[a]+z&&_[a+3]>=o[a+3]-z&&_[i]<=o[i]+z&&_[i+3]>=o[i+3]-z)return!0}return!1}function kn(e,t){let n=Math.cos(t.angle),o=Math.sin(t.angle),[r,s,l]=t.origin;for(let a=0;a<4;a++){let i=e[a*3]-r,f=e[a*3+1]-s,d=e[a*3+2]-l,p=i,_=f,b=d;t.axis==="x"?(_=f*n-d*o,b=f*o+d*n):t.axis==="y"?(p=i*n+d*o,b=-i*o+d*n):(p=i*n-f*o,_=i*o+f*n),e[a*3]=p+r,e[a*3+1]=_+s,e[a*3+2]=b+l}}function wn(e,t){let n=$[t],o=[],r=new Float32Array(8);for(let s=0;s<e.length;s++){let l=e[s],a=l.box;for(let i=0;i<6;i++){let f=l.tex[i];if(!(f>=0))continue;let d=Ke[i],p=(d+1)%3,_=(d+2)%3;if(a[p+3]-a[p]<=z||a[_+3]-a[_]<=z||!l.rotate&&xn(e,s,i))continue;let b=new Float32Array(12);for(let x=0;x<4;x++){for(let C=0;C<3;C++)b[x*3+C]=me[i][x][C]?a[C+3]:a[C];yn(i,b[x*3],b[x*3+1],b[x*3+2],r,x*2)}let h=l.uv?l.uv[i]:null;h&&(r[0]=h[0],r[1]=h[3],r[2]=h[2],r[3]=h[3],r[4]=h[2],r[5]=h[1],r[6]=h[0],r[7]=h[1]);let B=(f&31)<<4,v=f>>5<<4,y=new Uint16Array(8);for(let x=0;x<4;x++)y[x*2]=B+Math.round(r[x*2]),y[x*2+1]=v+Math.round(r[x*2+1]);let m=i,M=!0;if(l.rotate){kn(b,l.rotate);let x=b[3]-b[0],C=b[4]-b[1],H=b[5]-b[2],ue=b[9]-b[0],de=b[10]-b[1],fe=b[11]-b[2],ge=C*fe-H*de,Qe=H*ue-x*fe,Je=x*de-C*ue,Co=Math.hypot(ge,Qe,Je)||1,et=Math.abs(ge),tt=Math.abs(Qe),ot=Math.abs(Je);if(et>=tt&&et>=ot?m=ge>0?0:1:tt>=ot?m=Qe>0?2:3:m=Je>0?4:5,M=Math.max(et,tt,ot)/Co>.9999,M)for(let Pe=0;Pe<12;Pe++)b[Pe]=Math.round(b[Pe]*4096)/4096}let E=-1,U=Ke[m];if(M){let x=b[U];(m&1?Math.abs(x)<z:Math.abs(x-1)<z)&&(E=m)}let A=1,P=0;for(let x=0;x<4;x++)A=Math.min(A,b[x*3+1]),P=Math.max(P,b[x*3+1]);let L=new Float32Array(16),k=wo[m],G=So[m],Z=me[m][0][k],w=me[m][0][G];for(let x=0;x<4;x++){let C=Math.min(1,Math.max(0,Math.abs(b[x*3+k]-Z))),H=Math.min(1,Math.max(0,Math.abs(b[x*3+G]-w)));L[x*4]=(1-C)*(1-H),L[x*4+1]=C*(1-H),L[x*4+2]=C*H,L[x*4+3]=(1-C)*H}let N=0;E>=0&&(n===cn||n===ln?N=2:(n===un||n===dn)&&(E===2||E===3)&&(N=1)),o.push({p:b,uv:y,w:L,face:m,bface:E,rb0:A,rb1:P,shade:l.shade===!1?1:Ze[m],smooth:l.ao!==!1&&M,cullSame:N})}}return o}var Te=new Float32Array(48),Ee=new Float32Array(48),Ce=new Float32Array(48),Ue=new Float32Array(48),_o=new Int32Array(12),_t=0;function Sn(e,t,n,o,r,s,l){Bo=o;let a=uo(r,fn),i=l===an&&!_e?We(e,t,n,Bt(e,n))&3:0,f=r+a*65536+i*33554432,d=ho.get(f);if(d||(d=wn(fo(r,a,i),s),ho.set(f,d)),!d.length)return;let p=Se[Q[s]];Mt(s,e,n),_t++;let _=pe[s];for(let b=0;b<d.length;b++){let h=d[b],B=o;if(h.bface>=0){let w=o+xt[h.bface],N=K[w];if(q[N]&kt[h.bface])continue;if(N!==0){let x=N&1023;if(h.bface!==2&&h.bface!==3){let C=ce[N];if(C&&h.rb0>=en[C]-z&&h.rb1<=tn[C]+z)continue}if(x===s&&Ne[s]||h.cullSame===1&&x===s||h.cullSame===2&&$[x]===l&&pe[x]===_)continue}B=w}let v=h.face,y=St&&h.smooth,m=(v*2+(h.bface>=0?1:0))*4;if(y&&_o[m>>2]!==_t){_o[m>>2]=_t,Ao(B,v);for(let w=0;w<4;w++)Te[m+w]=W[w],Ee[m+w]=X[w],Ce[m+w]=yo[Y[w]],Ue[m+w]=Y[w]*64+W[w]+X[w]}let M=j[B],E=(M>>4)*17,U=(M&15)*17;p.reserve(4,6);let A=p.vc,P=h.shade*255,L=h.w,k=h.p,G=0,Z=0;for(let w=0;w<4;w++){let N=E,x=U,C=1;if(y){let H=L[w*4],ue=L[w*4+1],de=L[w*4+2],fe=L[w*4+3];N=Te[m]*H+Te[m+1]*ue+Te[m+2]*de+Te[m+3]*fe,x=Ee[m]*H+Ee[m+1]*ue+Ee[m+2]*de+Ee[m+3]*fe,C=Ce[m]*H+Ce[m+1]*ue+Ce[m+2]*de+Ce[m+3]*fe;let ge=Ue[m]*H+Ue[m+1]*ue+Ue[m+2]*de+Ue[m+3]*fe;w===0||w===2?G+=ge:Z+=ge}re(p,Math.round((e+k[w*3])*256),Math.round((t+k[w*3+1])*256),Math.round((n+k[w*3+2])*256),h.uv[w*2],h.uv[w*2+1],N+.5|0,x+.5|0,P*C+.5|0,v)}we(p,A,G<Z,!1)}}var qn=new Uint8Array([...$e.grass,...$e.foliage,...$e.water].map(e=>Math.round(e)));function Rn(e,t,n){K=e.blocks,j=e.light,D=e.tint,Mo=!!t.fancyLeaves,St=!!t.smoothLighting,_e=n;for(let o of Se)o.vc=0,o.ic=0}function Mn(e,t,n,o,r){let s=r&1023;if(s===0||s>=S)return;let l=$[s];l===on||l===nn&&(r>>10&3)===2?bn(e,t,n,o,r,s):l===sn?mn(e,t,n,o,s):l===rn?mo(e,t,n,o,r,s):Sn(e,t,n,o,r,s,l),s===yt&&mo(e,t,n,o,r,wt)}function Bn(){return Se.map(e=>e.finish())}function To(e,t){Rn(e,t,!1);let n=e.blocks;for(let o=0;o<16;o++)for(let r=0;r<16;r++){let s=Jt(0,o,r);for(let l=0;l<16;l++,s++){let a=n[s];a!==0&&Mn(l,o,r,s,a)}}return Bn()}var Eo=self;Eo.onmessage=e=>{let t=e.data;if(!t||typeof t.id!="number")return;let n;try{n=To({blocks:t.blocks,light:t.light,tint:t.tint},t.opts)}catch(r){console.error("[mesh.worker]",r),n=[null,null,null,null,null]}let o=[];for(let r of n)r&&o.push(r.positions.buffer,r.uvs.buffer,r.tints.buffer,r.lights.buffer,r.indices.buffer);Eo.postMessage({id:t.id,mesh:n},o)};})();\n';var ch=class{constructor(t){this.modified=!1;this.lit=!1;this.cx=t.cx,this.cz=t.cz,this.blocks=t.blocks.length===65536?t.blocks:HE(t.blocks),this.light=new Uint8Array(65536),this.biome=t.biome&&t.biome.length>=256?t.biome:new Uint8Array(256),this.tint=t.tint&&t.tint.length>=256*9?t.tint:new Uint8Array(256*9),this.counts=new Uint16Array(16),this.recount()}get(t,e,n){return e<0||e>255?0:this.blocks[e<<8|n<<4|t]}set(t,e,n,s){if(e<0||e>255)return;s&1023||(s=0);let r=e<<8|n<<4|t,a=this.blocks[r];a!==s&&(this.blocks[r]=s,a===0?this.counts[e>>4]++:s===0&&this.counts[e>>4]--,this.modified=!0)}recount(){let t=this.blocks,e=this.counts;for(let n=0;n<16;n++){let s=0,r=n+1<<12;for(let a=n<<12;a<r;a++)t[a]!==0&&s++;e[n]=s}}};function HE(i){let t=new Uint16Array(65536);return t.set(i.subarray(0,Math.min(i.length,65536))),t}var hh=class{constructor(t,e,n){this.onMessage=n;this.workers=[];this.url=URL.createObjectURL(new Blob([t],{type:"text/javascript"}));for(let s=0;s<e;s++){let r=new Worker(this.url),a={w:r,busy:0};r.onmessage=o=>{a.busy=Math.max(0,a.busy-1),this.onMessage(o.data)},r.onerror=o=>{console.error("[worker]",o.message)},this.workers.push(a)}}free(t){let e=null;for(let n of this.workers)n.busy<t&&(!e||n.busy<e.busy)&&(e=n);return e}get inFlight(){return this.workers.reduce((t,e)=>t+e.busy,0)}broadcast(t){for(let e of this.workers)e.w.postMessage(t)}terminate(){for(let t of this.workers)t.w.terminate();URL.revokeObjectURL(this.url)}},uh=class{constructor(t,e,n){this.gen=null;this.genPool=null;this.meshPool=null;this.centerCx=0;this.centerCz=0;this.wanted=[];this.wantedDirty=!0;this.requested=new Set;this.arrived=[];this.nextJob=1;this.meshSeq=new Map;this.meshInFlight=new Map;this.meshJobs=new Map;this.meshed=new Set;this.padded=zc();this.urgent=new Set;this.saving=new Set;this.disposed=!1;this.stats={loaded:0,genQueue:0,meshQueue:0,genMs:0,meshMs:0,lightMs:0};this.world=t,this.renderer=e,this.opts=n;let s=Math.max(2,navigator.hardwareConcurrency||2),r=Math.max(1,Math.min(2,s-2)),a=Math.max(1,Math.min(2,s-2));try{this.genPool=new hh(X1,r,o=>this.onGenMessage(o)),this.genPool.broadcast({type:"init",seed:n.seed})}catch(o){console.warn("[chunks] generation workers unavailable, generating on the main thread",o),this.genPool=null}try{this.meshPool=new hh(q1,a,o=>this.onMeshMessage(o))}catch(o){console.warn("[chunks] mesh workers unavailable, meshing on the main thread",o),this.meshPool=null}t.onBlockChange=(o,l,c)=>{let h=Math.floor(o/16),u=Math.floor(c/16),f=l>>4;for(let d=-1;d<=1;d++)for(let g=-1;g<=1;g++)for(let b=-1;b<=1;b++){let p=f+b;if(p<0||p>=16)continue;let m=mn(h+d,p,u+g);this.world.dirtySections.has(m)&&this.urgent.add(m)}}}mainGen(){return this.gen||(this.gen=new lh(this.opts.seed)),this.gen}get renderDistance(){return this.opts.renderDistance}get meshOptions(){return this.opts.meshOptions}setRenderDistance(t){if(t!==this.opts.renderDistance){this.opts.renderDistance=t,this.wantedDirty=!0;for(let e of Array.from(this.meshed)){let n=Ar(e);this.inViewRange(os(n),as(n))||(this.renderer.setSection(os(n),To(e),as(n),null),this.meshed.delete(e),this.world.dirtySections.add(e))}}}setMeshOptions(t){this.opts.meshOptions={...t},this.remeshAll()}remeshAll(){for(let t of this.world.chunks.values())for(let e=0;e<16;e++)this.world.dirtySections.add(mn(t.cx,e,t.cz))}inViewRange(t,e){let n=t-this.centerCx,s=e-this.centerCz,r=this.opts.renderDistance+.5;return n*n+s*s<=r*r}inLoadRange(t,e,n){let s=t-this.centerCx,r=e-this.centerCz,a=this.opts.renderDistance+n+.5;return s*s+r*r<=a*a}areaReady(t,e,n){let s=Math.floor(t/16),r=Math.floor(e/16);for(let a=-n;a<=n;a++)for(let o=-n;o<=n;o++){let l=this.world.getChunk(s+a,r+o);if(!l||!l.lit)return!1;for(let c=0;c<16;c++){let h=mn(s+a,c,r+o);if(this.world.dirtySections.has(h)||this.meshInFlight.has(h))return!1}}return!0}progress(t,e,n){let s=Math.floor(t/16),r=Math.floor(e/16),a=0,o=0;for(let l=-n;l<=n;l++)for(let c=-n;c<=n;c++){if(a+=2,!this.world.getChunk(s+l,r+c))continue;o++;let u=!0;for(let f=0;f<16&&u;f++){let d=mn(s+l,f,r+c);(this.world.dirtySections.has(d)||this.meshInFlight.has(d))&&(u=!1)}u&&o++}return a?o/a:1}update(t,e,n){if(this.disposed)return;let s=Math.floor(t/16),r=Math.floor(e/16);(s!==this.centerCx||r!==this.centerCz)&&(this.centerCx=s,this.centerCz=r,this.wantedDirty=!0);let a=performance.now();this.wantedDirty&&(this.computeWanted(),this.unloadFar(),this.wantedDirty=!1),this.requestColumns(),this.flushUrgent(),this.integrateArrived(a,n*.5),this.dispatchMeshing(a,n),this.stats.loaded=this.world.chunks.size,this.stats.genQueue=this.requested.size+this.arrived.length,this.stats.meshQueue=this.world.dirtySections.size}computeWanted(){let t=this.opts.renderDistance+1,e=[];for(let n=-t;n<=t;n++)for(let s=-t;s<=t;s++)n*n+s*s>(t+.5)*(t+.5)||e.push([n*n+s*s,xe(this.centerCx+n,this.centerCz+s)]);e.sort((n,s)=>n[0]-s[0]),this.wanted=e.map(n=>n[1])}requestColumns(){for(let t of this.wanted){if(this.world.chunks.has(t)||this.requested.has(t))continue;let e=os(t),n=as(t);if(this.opts.savedKeys.has(t)){this.requested.add(t),this.loadSaved(e,n,t);continue}if(this.genPool){let s=this.genPool.free(2);if(!s)break;s.busy++,this.requested.add(t),s.w.postMessage({type:"gen",id:this.nextJob++,cx:e,cz:n})}else{if(this.arrived.length>0)break;let s=performance.now();this.arrived.push(this.mainGen().generate(e,n)),this.stats.genMs=performance.now()-s;break}}}async loadSaved(t,e,n){try{let s=await Nn.loadChunk(this.opts.worldId,t,e);if(this.disposed)return;if(s){this.opts.remapPalette&&Nn.remap(s.blocks,this.opts.remapPalette),this.arrived.push({cx:t,cz:e,blocks:s.blocks,biome:s.biome,tint:s.tint});return}}catch(s){console.warn("[chunks] failed to load saved chunk",t,e,s)}this.disposed||(this.opts.savedKeys.delete(n),this.requested.delete(n))}onGenMessage(t){this.disposed||!t||t.type!=="chunk"||this.arrived.push({cx:t.cx,cz:t.cz,blocks:t.blocks,biome:t.biome,tint:t.tint})}integrateArrived(t,e){if(this.arrived.length>1){let s=this.centerCx,r=this.centerCz;this.arrived.sort((a,o)=>(a.cx-s)**2+(a.cz-r)**2-((o.cx-s)**2+(o.cz-r)**2))}let n=0;for(;this.arrived.length&&!(n>0&&performance.now()-t>e);){let s=this.arrived.shift(),r=xe(s.cx,s.cz);if(this.requested.delete(r),this.world.chunks.has(r)||!this.inLoadRange(s.cx,s.cz,2))continue;let a=performance.now();this.world.addChunk(new ch(s)),this.stats.lightMs=performance.now()-a,n++}}columnReady(t,e){for(let n=-1;n<=1;n++)for(let s=-1;s<=1;s++){let r=this.world.getChunk(t+n,e+s);if(!r||!r.lit)return!1}return!0}flushUrgent(){if(this.urgent.size){for(let t of this.urgent){if(!this.world.dirtySections.has(t))continue;let e=Ar(t),n=os(e),s=as(e),r=To(t);!this.inViewRange(n,s)||!this.columnReady(n,s)||(this.world.dirtySections.delete(t),this.meshSync(n,r,s,t))}this.urgent.clear()}}meshSync(t,e,n,s){var l;let r=this.world.getChunk(t,n);if(this.meshSeq.set(s,((l=this.meshSeq.get(s))!=null?l:0)+1),this.meshInFlight.delete(s),r.counts[e]===0){this.apply(t,e,n,s,null);return}let a=performance.now();Qd(this.world,t,e,n,this.padded);let o=Qg(this.padded,this.opts.meshOptions);this.stats.meshMs=performance.now()-a,this.apply(t,e,n,s,o)}apply(t,e,n,s,r){let a=!r||r.every(o=>!o);this.renderer.setSection(t,e,n,a?null:r),a?this.meshed.delete(s):this.meshed.add(s)}dispatchMeshing(t,e){var l;let n=this.world.dirtySections;if(!n.size)return;let s=this.centerCx,r=this.centerCz,a=[];for(let c of n){if(this.meshInFlight.has(c))continue;let h=Ar(c),u=os(h),f=as(h);if(!this.inViewRange(u,f))continue;let d=(u-s)**2+(f-r)**2;a.push([d,c])}a.sort((c,h)=>c[0]-h[0]);let o=new Map;for(let[,c]of a){let h=Ar(c),u=os(h),f=as(h),d=To(c),g=o.get(h);if(g===void 0&&(g=this.columnReady(u,f),o.set(h,g)),!g)continue;if(this.world.getChunk(u,f).counts[d]===0){n.delete(c),this.meshed.has(c)&&this.apply(u,d,f,c,null);continue}if(this.meshPool){let p=this.meshPool.free(3);if(!p||performance.now()-t>e)break;n.delete(c);let m=((l=this.meshSeq.get(c))!=null?l:0)+1;this.meshSeq.set(c,m),this.meshInFlight.set(c,m);let _=zc();Qd(this.world,u,d,f,_),p.busy++;let y=this.nextJob++;this.meshJobs.set(y,{k:c,seq:m}),p.w.postMessage({id:y,blocks:_.blocks,light:_.light,tint:_.tint,opts:this.opts.meshOptions},[_.blocks.buffer,_.light.buffer,_.tint.buffer])}else{if(performance.now()-t>e)break;n.delete(c),this.meshSync(u,d,f,c)}}}onMeshMessage(t){if(this.disposed||!t)return;let e=this.meshJobs.get(t.id);if(!e)return;this.meshJobs.delete(t.id);let{k:n,seq:s}=e;if(this.meshInFlight.get(n)!==s)return;this.meshInFlight.delete(n);let r=Ar(n),a=os(r),o=as(r),l=To(n);if(!this.world.getChunk(a,o)||!this.inViewRange(a,o)){this.world.dirtySections.add(n);return}this.apply(a,l,o,n,t.mesh)}unloadFar(){for(let t of Array.from(this.world.chunks.values())){if(this.inLoadRange(t.cx,t.cz,3))continue;let e=xe(t.cx,t.cz);t.modified&&this.saveChunk(t),this.world.removeChunk(t.cx,t.cz),this.renderer.removeColumn(t.cx,t.cz);for(let n=0;n<16;n++){let s=mn(t.cx,n,t.cz);this.world.dirtySections.delete(s),this.meshed.delete(s),this.meshInFlight.delete(s),this.urgent.delete(s)}}}saveChunk(t){let e=xe(t.cx,t.cz);t.modified=!1,this.opts.savedKeys.add(e),this.saving.add(e),Nn.saveChunk(this.opts.worldId,t).catch(n=>{console.warn("[chunks] save failed",n),t.modified=!0}).finally(()=>this.saving.delete(e))}async saveAll(){let t=[];for(let e of this.world.chunks.values())e.modified&&(e.modified=!1,this.opts.savedKeys.add(xe(e.cx,e.cz)),t.push(Nn.saveChunk(this.opts.worldId,e).catch(n=>{console.warn("[chunks] save failed",n),e.modified=!0})));await Promise.all(t)}generator(){return this.mainGen()}dispose(){var t,e;this.disposed=!0,(t=this.genPool)==null||t.terminate(),(e=this.meshPool)==null||e.terminate(),this.world.onBlockChange=null;for(let n of this.meshed){let s=Ar(n);this.renderer.setSection(os(s),To(n),as(s),null)}this.meshed.clear()}};var Ai=.05,GE=5,qs=.3,Y1=1.8,WE=1.5,dh=1.62,VE=1.27,Ys=.6,fh=.08,$E=.98,XE=.42,qE=.1,YE=1.3,ph=.3,K1=.05,KE=.3,ZE=.35,Ge=1e-7,JE=Math.PI/180,Qo=Math.PI/2-.001,Qa=new Float32Array(vt).fill(.6),gh=new Float32Array(vt).fill(1),Cf=new Float32Array(vt).fill(1);function Gr(i,t,e){let n=_t[t];n!==void 0&&(i[n]=e)}Gr(Qa,"ice",.98);Gr(Qa,"packed_ice",.98);Gr(Qa,"blue_ice",.989);Gr(Qa,"slime_block",.8);Gr(gh,"soul_sand",.4);Gr(gh,"honey_block",.4);Gr(Cf,"honey_block",.5);var Q1,mh=(Q1=_t.water)!=null?Q1:-1,tb,jE=(tb=_t.lava)!=null?tb:-1,eb,Z1=(eb=_t.slime_block)!=null?eb:-1,nb,QE=(nb=_t.cobweb)!=null?nb:-1;function J1(i,t){let e=i&Ot;if((t&Ot)===e)return 1;let n=i>>10;return n&8?8/9:(8-(n&7))/9}function tT(i,t){let e=i&Ot;if((t&Ot)===e)return 1;let n=i>>10;return n&8?14/16:Math.max(1/16,14/16-(n&7)/9)}var j1=i=>((i>Math.PI||i<-Math.PI)&&(i-=Math.floor((i+Math.PI)/(2*Math.PI))*2*Math.PI),i),ja=class{constructor(){this.x=0;this.y=80;this.z=0;this.vx=0;this.vy=0;this.vz=0;this.yaw=0;this.pitch=0;this.flying=!1;this.sprinting=!1;this.sneaking=!1;this.onGround=!1;this.inWater=!1;this.inLava=!1;this.headInWater=!1;this.width=.6;this.height=1.8;this.horizontalCollision=!1;this.frozen=!1;this.ox=0;this.oy=80;this.oz=0;this.sx=0;this.sy=80;this.sz=0;this.alpha=0;this.acc=0;this.clock=0;this.eyeH=dh;this.oEyeH=dh;this.fovMod=1;this.oFovMod=1;this.bobAmt=0;this.oBobAmt=0;this.walkDist=0;this.oWalkDist=0;this.kF=!1;this.kB=!1;this.kL=!1;this.kR=!1;this.kJump=!1;this.kShift=!1;this.kSprint=!1;this.jumpLatch=!1;this.flyToggle=!1;this.sprintTap=!1;this.lastSpaceTap=-1e9;this.lastWTap=-1e9;this.tvx=0;this.tvy=0;this.tvz=0;this.noJumpDelay=0;this.crouched=!1;this.minorCollision=!1;this.waterHeight=0;this.lavaHeight=0;this.eyeUnder=!1;this.stuck=!1;this.edgeGuard=!1;this.w=null;this.boxes=new Float64Array(6*128);this.nBoxes=0;this.bb=new Float64Array(6);this.tb=new Float64Array(6);this.eb=new Float64Array(6);this.mb=new Float64Array(6);this.res=new Float64Array(3);this.qx=0;this.qy=0;this.qz=0;this.nb=(t,e,n)=>this.w.get(this.qx+t,this.qy+e,this.qz+n);this.lcx=NaN;this.lcz=NaN;this.lres=!1}toggleFlight(){this.flyToggle=!0}eyeHeight(){return this.oEyeH+(this.eyeH-this.oEyeH)*this.alpha}boxHeight(){return this.crouched?WE:Y1}update(t,e,n,s){if(this.w=n,t>0||(t=0),t>.25&&(t=.25),this.clock+=t,e.enabled){if(e.mouseDX||e.mouseDY){let o=Math.max(0,Math.min(1,(s.sensitivity||1)*.5))*.6+.2,l=o*o*o*8*.15*JE;this.yaw=j1(this.yaw-e.mouseDX*l);let c=this.pitch-e.mouseDY*l*(s.invertY?-1:1);this.pitch=c>Qo?Qo:c<-Qo?-Qo:c}e.pressed("Space")&&(this.jumpLatch=!0,this.clock-this.lastSpaceTap<KE?(this.flyToggle=!this.flyToggle,this.lastSpaceTap=-1e9):this.lastSpaceTap=this.clock),e.pressed("KeyW")&&(this.clock-this.lastWTap<ZE?(this.sprintTap=!0,this.lastWTap=-1e9):this.lastWTap=this.clock),this.kF=e.down("KeyW"),this.kB=e.down("KeyS"),this.kL=e.down("KeyA"),this.kR=e.down("KeyD"),this.kJump=e.down("Space"),this.kShift=e.down("ShiftLeft")||e.down("ShiftRight"),this.kSprint=e.down("ControlLeft")||e.down("ControlRight")}else this.kF=this.kB=this.kL=this.kR=this.kJump=this.kShift=this.kSprint=!1;this.acc+=t;let r=0;for(;this.acc>=Ai&&r<GE;)this.tick(),this.acc-=Ai,r++;this.acc>=Ai&&(this.acc=Ai*.999),this.alpha=this.acc/Ai,this.updateHead()}eye(){let t=this.renderPos();return{x:t[0],y:t[1]+this.eyeHeight(),z:t[2]}}look(){let t=Math.cos(this.pitch);return[-Math.sin(this.yaw)*t,Math.sin(this.pitch),-Math.cos(this.yaw)*t]}fovScale(){return this.oFovMod+(this.fovMod-this.oFovMod)*this.alpha}bob(){let t=this.alpha,e=this.oWalkDist+(this.walkDist-this.oWalkDist)*t,n=this.oBobAmt+(this.bobAmt-this.oBobAmt)*t;return{phase:e*Math.PI,amount:Math.max(0,Math.min(1,n/.1))}}serialize(){return{x:this.x,y:this.y,z:this.z,yaw:this.yaw,pitch:this.pitch,flying:this.flying}}restore(t){let e=(n,s)=>typeof n=="number"&&Number.isFinite(n)?n:s;this.x=e(t.x,.5),this.y=Math.max(0,Math.min(300,e(t.y,80))),this.z=e(t.z,.5),this.yaw=j1(e(t.yaw,0)),this.pitch=Math.max(-Qo,Math.min(Qo,e(t.pitch,0))),this.flying=!!t.flying,this.vx=this.vy=this.vz=0,this.ox=this.sx=this.x,this.oy=this.sy=this.y,this.oz=this.sz=this.z,this.acc=0,this.alpha=0,this.crouched=this.sneaking=this.sprinting=!1,this.eyeH=this.oEyeH=dh,this.fovMod=this.oFovMod=1,this.bobAmt=this.oBobAmt=0,this.onGround=!1,this.noJumpDelay=0,this.flyToggle=this.sprintTap=this.jumpLatch=!1}renderPos(){if(this.x!==this.sx||this.y!==this.sy||this.z!==this.sz)return[this.x,this.y,this.z];let t=this.alpha;return[this.ox+(this.x-this.ox)*t,this.oy+(this.y-this.oy)*t,this.oz+(this.z-this.oz)*t]}tick(){let t=this.w;if(this.ox=this.x,this.oy=this.y,this.oz=this.z,this.oEyeH=this.eyeH,this.oFovMod=this.fovMod,this.oBobAmt=this.bobAmt,this.oWalkDist=this.walkDist,this.lcx=NaN,!this.loadedAt(Math.floor(this.x),Math.floor(this.z))){this.frozen=!0,this.vx=this.vy=this.vz=0,this.sx=this.x,this.sy=this.y,this.sz=this.z,this.jumpLatch=!1;return}this.frozen=!1,this.tvx=this.vx*Ai,this.tvy=this.vy*Ai,this.tvz=this.vz*Ai,this.updateFluids(t),this.noJumpDelay>0&&this.noJumpDelay--,this.flyToggle&&(this.flyToggle=!1,this.flying=!this.flying,this.flying&&this.onGround&&(this.tvy=Math.max(this.tvy,.2),this.onGround=!1));let e=this.kShift;e&&!this.flying?this.crouched=!0:this.crouched&&this.fits(Y1)&&(this.crouched=!1),this.sneaking=this.crouched;let n=(this.kF?1:0)-(this.kB?1:0),s=(this.kL?1:0)-(this.kR?1:0);this.crouched&&(n*=ph,s*=ph);let r=n>1e-5;!this.sprinting&&r&&!this.crouched&&(this.sprintTap&&(this.onGround||this.flying||this.eyeUnder)&&(this.sprinting=!0),this.kSprint&&(!this.inWater||this.eyeUnder||this.flying)&&(this.sprinting=!0)),this.sprintTap=!1,this.sprinting&&(!r||this.crouched||this.horizontalCollision&&!this.minorCollision||this.inWater&&!this.eyeUnder&&!this.flying)&&(this.sprinting=!1);let a=this.kJump||this.jumpLatch;if(this.jumpLatch=!1,this.flying){let c=0;e&&c--,a&&c++,this.tvy+=c*K1*3}else this.inWater&&e&&(this.tvy-=.04);if(Math.abs(this.tvx)<.003&&(this.tvx=0),Math.abs(this.tvy)<.003&&(this.tvy=0),Math.abs(this.tvz)<.003&&(this.tvz=0),a&&!this.flying){let c=this.inLava?this.lavaHeight:this.waterHeight,h=this.inWater&&c>0,u=.4;!h||this.onGround&&!(c>u)?!this.inLava||this.onGround&&!(c>u)?(this.onGround||h&&c<=u)&&this.noJumpDelay===0&&(this.jumpFromGround(t),this.noJumpDelay=10):this.tvy+=.04:this.tvy+=.04}else this.noJumpDelay=0;this.edgeGuard=e&&!this.flying&&this.onGround,this.travel(t,s*.98,n*.98),this.onGround&&this.flying&&(this.flying=!1);let o=Math.min(.1,Math.sqrt(this.tvx*this.tvx+this.tvz*this.tvz));this.bobAmt+=((this.onGround?o:0)-this.bobAmt)*.4;let l=this.sprinting?this.flying?1.15:1.1:1;this.fovMod+=(l-this.fovMod)*.5,this.eyeH+=((this.crouched?VE:dh)-this.eyeH)*.5,this.vx=this.tvx/Ai,this.vy=this.tvy/Ai,this.vz=this.tvz/Ai,this.sx=this.x,this.sy=this.y,this.sz=this.z}jumpFromGround(t){let e=t.get(Math.floor(this.x),Math.floor(this.y),Math.floor(this.z))&Ot,n=Cf[e];n===1&&(n=Cf[this.blockBelow(t,.5000001)]),this.tvy=XE*n,this.sprinting&&(this.tvx-=Math.sin(this.yaw)*.2,this.tvz-=Math.cos(this.yaw)*.2)}travel(t,e,n){if(this.inWater&&!this.flying){let s=this.y,r=this.sprinting?.9:.8;this.moveRelative(.02,e,n),this.move(t,this.tvx,this.tvy,this.tvz),this.tvx*=r,this.tvy*=.8,this.tvz*=r,this.sprinting||(this.tvy-=fh/16),this.horizontalCollision&&this.freeAt(t,this.tvx,this.tvy+.6-this.y+s,this.tvz)&&(this.tvy=.3)}else if(this.inLava&&!this.flying){let s=this.y;this.moveRelative(.02,e,n),this.move(t,this.tvx,this.tvy,this.tvz),this.lavaHeight<=.4?(this.tvx*=.5,this.tvy*=.8,this.tvz*=.5,this.sprinting||(this.tvy-=fh/16)):(this.tvx*=.5,this.tvy*=.5,this.tvz*=.5),this.tvy-=fh/4,this.horizontalCollision&&this.freeAt(t,this.tvx,this.tvy+.6-this.y+s,this.tvz)&&(this.tvy=.3)}else{let s=Qa[this.blockBelow(t,.5000001)],r=this.onGround?s*.91:.91,a=this.onGround?qE*(this.sprinting?YE:1)*(.21600002/(s*s*s)):this.flying?K1*(this.sprinting?2:1):this.sprinting?.026:.02,o=this.tvy;this.moveRelative(a,e,n),this.move(t,this.tvx,this.tvy,this.tvz),this.tvy=this.flying?o*.6:(this.tvy-fh)*$E,this.tvx*=r,this.tvz*=r}}moveRelative(t,e,n){let s=e*e+n*n;if(s<1e-7)return;let r=e,a=n;if(s>1){let c=Math.sqrt(s);r/=c,a/=c}r*=t,a*=t;let o=Math.sin(this.yaw),l=Math.cos(this.yaw);this.tvx+=-a*o-r*l,this.tvz+=-a*l+r*o}setBB(t=this.boxHeight()){let e=this.bb;return e[0]=this.x-qs,e[1]=this.y,e[2]=this.z-qs,e[3]=this.x+qs,e[4]=this.y+t,e[5]=this.z+qs,e}move(t,e,n,s){this.stuck&&(e*=.25,n*=.05,s*=.25,this.tvx=this.tvy=this.tvz=0);let r=this.setBB(),a=Math.abs(e),o=Math.abs(n),l=Math.abs(s);if(this.gather(t,r[0]-a-.01,r[1]-o-Ys-.01,r[2]-l-.01,r[3]+a+.01,r[4]+o+Ys+.01,r[5]+l+.01),this.edgeGuard&&n<=0){let _=e,y=s,v=.05;for(;_!==0&&this.free(_,-Ys,0);)_=_<v&&_>=-v?0:_>0?_-v:_+v;for(;y!==0&&this.free(0,-Ys,y);)y=y<v&&y>=-v?0:y>0?y-v:y+v;for(;_!==0&&y!==0&&this.free(_,-Ys,y);)_=_<v&&_>=-v?0:_>0?_-v:_+v,y=y<v&&y>=-v?0:y>0?y-v:y+v;e=_,s=y}this.collide(e,n,s);let c=this.res[0],h=this.res[1],u=this.res[2];this.x+=c,this.y+=h,this.z+=u;let f=Math.abs(e-c)>1e-5,d=Math.abs(s-u)>1e-5,g=Math.abs(n-h)>1e-5;this.horizontalCollision=f||d,this.onGround=g&&n<0,this.minorCollision=this.horizontalCollision&&this.isMinorCollision(c,u),f&&(this.tvx=0),d&&(this.tvz=0);let b=this.blockId(t,Math.floor(this.x),Math.floor(this.y-.2),Math.floor(this.z));if(g&&(b===Z1&&n<0&&!this.kShift&&this.tvy<0?this.tvy=-this.tvy:this.tvy=0),this.onGround&&b===Z1&&!this.kShift){let _=Math.abs(this.tvy);if(_<.1){let y=.4+_*.2;this.tvx*=y,this.tvz*=y}}this.walkDist+=Math.sqrt(c*c+u*u)*.6;let p=this.blockId(t,Math.floor(this.x),Math.floor(this.y),Math.floor(this.z)),m=p===mh?1:gh[p];m===1&&p!==mh&&(m=gh[this.blockBelow(t,.5000001)]),m!==1&&(this.tvx*=m,this.tvz*=m)}isMinorCollision(t,e){let n=(this.kF?1:0)-(this.kB?1:0),s=(this.kL?1:0)-(this.kR?1:0);this.crouched&&(n*=ph,s*=ph);let r=Math.sin(this.yaw),a=Math.cos(this.yaw),o=-n*r-s*a,l=-n*a+s*r,c=o*o+l*l,h=t*t+e*e;if(c<1e-5||h<1e-5)return!1;let u=(o*t+l*e)/Math.sqrt(c*h);return Math.acos(Math.max(-1,Math.min(1,u)))<.13962634}collide(t,e,n){let s=this.bb;this.sweep(s,t,e,n);let r=this.res[0],a=this.res[1],o=this.res[2],l=Math.abs(r-t)>Ge,c=Math.abs(a-e)>Ge,h=Math.abs(o-n)>Ge;if((this.onGround||c&&e<0)&&(l||h)){this.sweep(s,t,Ys,n);let u=this.res[0],f=this.res[1],d=this.res[2],g=this.eb;g.set(s),t<0?g[0]+=t:g[3]+=t,n<0?g[2]+=n:g[5]+=n;let b=this.clip(g,1,Ys);if(b<Ys){let p=this.mb;p.set(s),p[1]+=b,p[4]+=b,this.sweep(p,t,0,n);let m=this.res[0],_=this.res[2];m*m+_*_>u*u+d*d&&(u=m,f=b,d=_)}if(u*u+d*d>r*r+o*o){let p=this.mb;p.set(s),p[0]+=u,p[3]+=u,p[1]+=f,p[4]+=f,p[2]+=d,p[5]+=d;let m=this.clip(p,1,-f+e);r=u,a=f+m,o=d}}this.res[0]=r,this.res[1]=a,this.res[2]=o}sweep(t,e,n,s){let r=this.tb;r.set(t);let a=this.clip(r,1,n);r[1]+=a,r[4]+=a;let o=this.clip(r,0,e);r[0]+=o,r[3]+=o;let l=this.clip(r,2,s);r[2]+=l,r[5]+=l,this.res[0]=o,this.res[1]=a,this.res[2]=l}clip(t,e,n){if(Math.abs(n)<Ge)return 0;let s=this.boxes,r=this.nBoxes,a=e===0?1:0,o=e===2?1:2;for(let l=0;l<r;l++){let c=l*6;if(!(s[c+a+3]<=t[a]+Ge||s[c+a]>=t[a+3]-Ge)&&!(s[c+o+3]<=t[o]+Ge||s[c+o]>=t[o+3]-Ge))if(n>0){let h=s[c+e]-t[e+3];h>=-Ge&&h<n&&(n=h)}else{let h=s[c+e+3]-t[e];h<=Ge&&h>n&&(n=h)}}return Math.abs(n)<Ge?0:n}free(t,e,n){let s=this.boxes,r=this.nBoxes,a=this.bb,o=a[0]+t,l=a[1]+e,c=a[2]+n,h=a[3]+t,u=a[4]+e,f=a[5]+n;for(let d=0;d<r;d++){let g=d*6;if(s[g]<h-Ge&&s[g+3]>o+Ge&&s[g+1]<u-Ge&&s[g+4]>l+Ge&&s[g+2]<f-Ge&&s[g+5]>c+Ge)return!1}return!0}fits(t){let e=this.w,n=this.setBB(t);this.gather(e,n[0],n[1],n[2],n[3],n[4],n[5]);let s=this.free(0,0,0);return this.setBB(),s}freeAt(t,e,n,s){let r=this.setBB(),a=r[0]+e,o=r[1]+n,l=r[2]+s,c=r[3]+e,h=r[4]+n,u=r[5]+s;if(this.gather(t,a,o,l,c,h,u),!this.free(e,n,s))return!1;for(let f=Math.floor(o);f<=Math.floor(h-Ge);f++)for(let d=Math.floor(l);d<=Math.floor(u-Ge);d++)for(let g=Math.floor(a);g<=Math.floor(c-Ge);g++)if(ce[t.get(g,f,d)&Ot])return!1;return!0}pushBox(t,e,n,s,r,a){let o=this.nBoxes*6;if(o+6>this.boxes.length){let c=new Float64Array(this.boxes.length*2);c.set(this.boxes),this.boxes=c}let l=this.boxes;l[o++]=t,l[o++]=e,l[o++]=n,l[o++]=s,l[o++]=r,l[o]=a,this.nBoxes++}gather(t,e,n,s,r,a,o){this.nBoxes=0;let l=Math.floor(e),c=Math.floor(r),h=Math.floor(s),u=Math.floor(o),f=Math.max(-2,Math.floor(n)-1),d=Math.min(256,Math.floor(a));for(let g=h;g<=u;g++)for(let b=l;b<=c;b++){if(!this.loadedAt(b,g)){this.pushBox(b,f,g,b+1,d+1,g+1);continue}for(let p=f;p<=d;p++){let m=t.get(b,p,g),_=m&Ot;if(!ge[_])continue;if(jt[_]===J.cube){this.pushBox(b,p,g,b+1,p+1,g+1);continue}this.qx=b,this.qy=p,this.qz=g;let y=Pc(m,this.nb);for(let v=0;v<y.length;v++){let w=y[v];this.pushBox(b+w[0],p+w[1],g+w[2],b+w[3],p+w[4],g+w[5])}}}}loadedAt(t,e){let n=t>>4,s=e>>4;return n===this.lcx&&s===this.lcz?this.lres:(this.lcx=n,this.lcz=s,this.lres=this.w.getChunk(n,s)!==void 0,this.lres)}blockId(t,e,n,s){return t.get(e,n,s)&Ot}blockBelow(t,e){return this.blockId(t,Math.floor(this.x),Math.floor(this.y-e),Math.floor(this.z))}updateFluids(t){let e=this.boxHeight(),n=this.x-qs+.001,s=this.x+qs-.001,r=this.y+.001,a=this.y+e-.001,o=this.z-qs+.001,l=this.z+qs-.001,c=!1,h=!1,u=0,f=0,d=!1,g=Math.max(0,Math.floor(r)),b=Math.min(255,Math.floor(a));for(let w=g;w<=b;w++)for(let S=Math.floor(o);S<=Math.floor(l);S++)for(let A=Math.floor(n);A<=Math.floor(s);A++){let L=t.get(A,w,S),P=L&Ot;if(P===QE){d=!0;continue}if(!ce[P])continue;let M=w+J1(L,t.get(A,w+1,S));M<r||(P===jE?(h=!0,M-r>f&&(f=M-r)):(c=!0,M-r>u&&(u=M-r)))}this.inWater=c,this.inLava=h,this.waterHeight=u,this.lavaHeight=f,this.stuck=d;let p=this.y+this.eyeH-.11111111,m=Math.floor(this.x),_=Math.floor(this.z),y=Math.floor(p),v=t.get(m,y,_);this.eyeUnder=(v&Ot)===mh&&p<y+J1(v,t.get(m,y+1,_))}updateHead(){let t=this.w;if(!t)return;let e=this.eye(),n=Math.floor(e.x),s=Math.floor(e.y),r=Math.floor(e.z),a=t.get(n,s,r);this.headInWater=(a&Ot)===mh&&e.y<s+tT(a,t.get(n,s+1,r))}};var eT=[[0,0,0,1,1,1]],nT=[[0,0,0,1,14/16,1]];function bh(i,t,e,n,s,r,a,o,l=!1){let c=Math.sqrt(s*s+r*r+a*a);if(!(c>0)||!(o>0))return null;s/=c,r/=c,a/=c;let h=Math.floor(t),u=Math.floor(e),f=Math.floor(n),d=s>0?1:s<0?-1:0,g=r>0?1:r<0?-1:0,b=a>0?1:a<0?-1:0,p=d?Math.abs(1/s):1/0,m=g?Math.abs(1/r):1/0,_=b?Math.abs(1/a):1/0,y=d>0?(h+1-t)/s:d<0?(t-h)/-s:1/0,v=g>0?(u+1-e)/r:g<0?(e-u)/-r:1/0,w=b>0?(f+1-n)/a:b<0?(n-f)/-a:1/0,S=s>0?1:0,A=r>0?3:2,L=a>0?5:4,P=Math.abs(s),M=Math.abs(r),T=Math.abs(a),I=P>=M&&P>=T?S:M>=T?A:L,F=0,k=0,U=0,N=(G,tt,at)=>i.get(F+G,k+tt,U+at),D=1/0,z=0,$=0,nt=0,et=0,rt=0,bt=0;for(let G=0;G<1024&&!(bt>o||bt>D);G++){if(u>=0&&u<=255){let tt=i.get(h,u,f),at=tt&Ot,Q=null;if(Zh[at]?jt[at]===J.cube?Q=eT:(F=h,k=u,U=f,Q=Ic(tt,N)):l&&ce[at]&&!(tt>>10&7)&&(Q=nT),Q)for(let ft=0;ft<Q.length;ft++){let ht=Q[ft],Ht=-1/0,Et=1/0,O=I,be=!0;for(let wt=0;wt<3&&be;wt++){let kt=wt===0?t:wt===1?e:n,ie=wt===0?s:wt===1?r:a,Gt=wt===0?h:wt===1?u:f,Yt=Gt+ht[wt],we=Gt+ht[wt+3];if(ie===0){(kt<Yt||kt>we)&&(be=!1);continue}let R=(Yt-kt)/ie,E=(we-kt)/ie;if(R>E){let j=R;R=E,E=j}R>Ht&&(Ht=R,O=wt===0?S:wt===1?A:L),E<Et&&(Et=E),Ht>Et&&(be=!1)}if(!be||Et<0)continue;let xt=Ht;xt<0&&(xt=0,O=I),xt<=o&&xt<D&&(D=xt,z=h,$=u,nt=f,et=O,rt=tt)}}if(y<v?y<w?(h+=d,bt=y,y+=p):(f+=b,bt=w,w+=_):v<w?(u+=g,bt=v,v+=m):(f+=b,bt=w,w+=_),bt===1/0)break}return D===1/0?null:{x:z,y:$,z:nt,face:et,px:t+s*D,py:e+r*D,pz:n+a*D,dist:D,block:rt}}var iT=5,ib=.25,sb=.2,Fn=2,ys=3,ta=1e-7,sT=[[0,0,0,1,1,1]],xh=i=>{let t=new Uint8Array(vt);for(let e of i){let n=_t[e];n!==void 0&&(t[n]=1)}return t},Rf=xh(["grass_block","snowy_grass_block","dirt","coarse_dirt","podzol","rooted_dirt","mycelium","moss_block","mud"]),Lf=xh(["sand","red_sand"]),bb=new Uint8Array(vt),rT=xh(["ice","packed_ice"]),oT=xh(["mycelium","podzol"]),yb=0,_b=1,vb=2,xb=3,wb=4,Mb=5,Sb=6,Ab=new Uint8Array(vt);Le.forEach((i,t)=>{Ab[t]=i.support==="soil"?_b:i.support==="sand"?vb:i.support==="solid"?xb:i.support==="water"?wb:i.support==="cactus"?Mb:i.support==="cane"?Sb:yb,(Lf[t]||Rf[t]||i.name==="terracotta"||i.name.endsWith("_terracotta")&&!i.name.endsWith("glazed_terracotta"))&&(bb[t]=1)});var hb,_h=(hb=_t.water)!=null?hb:-1,ub,aT=(ub=_t.lava)!=null?ub:-1,db,lT=(db=_t.ice)!=null?db:-1,fb,cT=(fb=_t.cactus)!=null?fb:-1,pb,hT=(pb=_t.sugar_cane)!=null?pb:-1,mb,Pf=(mb=_t.lily_pad)!=null?mb:-1,gb,rb=(gb=_t.seagrass)!=null?gb:-1,uT=(i,t,e,n)=>(s,r,a)=>i.get(t+s,e+r,n+a);function If(i,t,e,n,s){let r=s&Ot;return ge[r]?jt[r]===J.cube?sT:Pc(s,uT(i,t,e,n)):[]}function Eb(i,t,e,n){let s=t>>1,r=(t&1)===0,a=s===0?1:0,o=s===2?1:2;for(let l of i)if(!(r?l[s+3]<1-1e-6:l[s]>1e-6)&&l[a]<=e&&l[a+3]>=e&&l[o]<=n&&l[o+3]>=n)return!0;return!1}var ob=[.01,.25,.5,.75,.99],ab=[7/16+.01,9/16-.01];function tl(i,t,e,n,s){if(e<0)return!0;if(e>255)return!1;let r=i.get(t,e,n),a=r&Ot;if(!ge[a])return!1;if(jt[a]===J.cube)return!0;let o=If(i,t,e,n,r);for(let l of ob)for(let c of ob)if(!Eb(o,s,l,c))return!1;return!0}function el(i,t,e,n,s){if(e<0)return!0;if(e>255)return!1;let r=i.get(t,e,n),a=r&Ot;if(!ge[a])return!1;if(jt[a]===J.cube)return!0;let o=If(i,t,e,n,r);for(let l of ab)for(let c of ab)if(!Eb(o,s,l,c))return!1;return!0}function yh(i){let t=i&Ot;return ge[t]?jt[t]===J.cube||jt[t]===J.slab&&(i>>10&3)===2:!1}function dT(i){let t=-Math.sin(i.yaw),e=-Math.cos(i.yaw);return Math.abs(t)>Math.abs(e)?t>0?1:3:e>0?2:0}var lb=i=>i<=1?1:i<=3?0:2;function cb(i,t,e,n,s,r){let a=If(i,e,n,s,r);if(!a.length)return!1;let o=t.boxHeight(),l=t.x-.3,c=t.x+.3,h=t.y,u=t.y+o,f=t.z-.3,d=t.z+.3;for(let g of a)if(e+g[0]<c-ta&&e+g[3]>l+ta&&n+g[1]<u-ta&&n+g[4]>h+ta&&s+g[2]<d-ta&&s+g[5]>f+ta)return!0;return!1}function Tb(i,t,e,n,s){let r=s&Ot;if(!r)return!0;let a=s>>10,o=jt[r];if(o===J.torch){if(a===0)return el(i,t,e-1,n,Fn);let u=a-1;return u<0||u>3?!1:tl(i,t-$e[u],e,n-Xe[u],Er[u])}if(o===J.lantern)return a&1?el(i,t,e+1,n,ys):el(i,t,e-1,n,Fn);if(o===J.door){if(a&8){let f=i.get(t,e-1,n);return(f&Ot)===r&&(f>>10&8)===0}let u=i.get(t,e+1,n);return(u&Ot)===r&&(u>>10&8)!==0&&tl(i,t,e-1,n,Fn)}if(o===J.layer){let u=i.get(t,e-1,n)&Ot;return!rT[u]&&tl(i,t,e-1,n,Fn)}if(o===J.carpet){let u=i.get(t,e-1,n)&Ot;return u!==0&&!ce[u]}let l=Ab[r];if(l===yb)return!0;let c=i.get(t,e-1,n),h=c&Ot;switch(l){case _b:return Rf[h]===1;case vb:return bb[h]===1;case xb:return ws[h]===1||oT[h]===1;case wb:{let u=i.get(t,e+1,n)&Ot;return(h===_h&&(c>>10&7)===0||h===lT)&&!ce[u]}case Mb:{for(let u=0;u<4;u++){let f=i.get(t+$e[u],e,n+Xe[u])&Ot;if(ge[f]||f===aT)return!1}return ce[i.get(t,e+1,n)&Ot]?!1:h===cT||Lf[h]===1}case Sb:{if(h===hT)return!0;if(!Rf[h]&&!Lf[h])return!1;for(let u=0;u<4;u++)if((i.get(t+$e[u],e-1,n+Xe[u])&Ot)===_h)return!0;return!1}}return!0}function kf(i,t,e,n){let s=i&Ot;if(s===0)return!0;if(jt[s]===J.slab&&s===t){let r=i>>10&3;if(r===2)return!1;if(!n)return!0;let a=e.py-e.y>.5,o=e.face!==Fn&&e.face!==ys;return r===0?e.face===Fn||a&&o:e.face===ys||!a&&o}return aa[s]?s!==t:!1}function fT(i,t,e,n,s,r,a){let o=r+3&3,l=r+1&3,c=t+$e[o],h=n+Xe[o],u=t+$e[l],f=n+Xe[l],d=i.get(c,e,h),g=i.get(c,e+1,h),b=i.get(u,e,f),p=i.get(u,e+1,f),m=(yh(d)?-1:0)+(yh(g)?-1:0)+(yh(b)?1:0)+(yh(p)?1:0),_=(d&Ot)===s&&(d>>10&8)===0,y=(b&Ot)===s&&(b>>10&8)===0;if((!_||y)&&m<=0){if((!y||_)&&m>=0){let v=$e[r],w=Xe[r],S=a.px-t,A=a.pz-n;return!((v>=0||!(A<.5))&&(v<=0||!(A>.5))&&(w>=0||!(S>.5))&&(w<=0||!(S<.5)))}return!1}return!0}function pT(i,t,e,n){if(!(i>0&&i<vt))return null;let s=jt[i],r=t.face,a=t.block&Ot,o,l,c,h=!1;if(i===Pf&&ce[a]){if(o=t.x,l=t.y+1,c=t.z,n.get(o,l,c)!==0)return null}else if(kf(t.block,i,t,!0))o=t.x,l=t.y,c=t.z,h=!0;else if(o=t.x+cg[r],l=t.y+hg[r],c=t.z+ug[r],l<0||l>255||!kf(n.get(o,l,c),i,t,!1))return null;if(l<0||l>255)return null;let u=n.get(o,l,c),f=u&Ot;if(ce[f]&&(!ge[i]&&!ce[i]||i===Pf)||ce[i]&&f===i)return null;let d=t.py-l>.5,g=dT(e),b=0,p;switch(s){case J.slab:f===i&&(u>>10&3)!==2?b=2:b=r!==ys&&(r===Fn||!d)?0:1;break;case J.stairs:b=g|(r!==ys&&(r===Fn||!d)?0:4);break;case J.torch:if(r===ys)return null;if(r!==Fn){let _=Ca[r];b=tl(n,o-$e[_],l,c-Xe[_],Er[_])?_+1:0}break;case J.lantern:{let _=el(n,o,l+1,c,ys),y=el(n,o,l-1,c,Fn);if(r===ys||r!==Fn&&e.pitch>0?b=_?1:y?0:-1:b=y?0:_?1:-1,b<0)return null;break}case J.door:{if(l+1>255||!kf(n.get(o,l+1,c),i,t,!1)||!tl(n,o,l-1,c,Fn))return null;b=g|(fT(n,o,l,c,i,g,t)?16:0),p={x:o,y:l+1,z:c,v:Ce(i,b|8)};break}case J.trapdoor:{let _,y;!h&&r!==Fn&&r!==ys?(_=Ca[dg[r]],y=d):(_=g,y=r!==Fn),b=_|(y?8:0);break}case J.rod:b=lb(r);break;default:Xr[i]===1?b=lb(r):Xr[i]===2&&(b=g+2&3)}let m=Ce(i,b);return s!==J.door&&!Tb(n,o,l,c,m)||ge[i]&&cb(n,e,o,l,c,m)||p&&cb(n,e,p.x,p.y,p.z,p.v)?null:p?{x:o,y:l,z:c,v:m,extra:p}:{x:o,y:l,z:c,v:m}}var vh=class{constructor(t,e,n,s){this.breakDelay=0;this.useDelay=0;this.world=t,this.player=e,this.hotbar=n,this.hooks=s}update(t,e,n){if(e.clicked[1]&&n){let s=n.block&Ot;qr(s)&&this.hotbar.pick(s)}e.clicked[0]?(this.breakDelay=ib,n&&this.breakBlock(n.x,n.y,n.z),this.hooks.onSwing()):e.buttons[0]?n&&(this.breakDelay-=t,this.breakDelay<=0&&(this.breakDelay=Math.max(0,this.breakDelay+ib),this.breakBlock(n.x,n.y,n.z),this.hooks.onSwing())):this.breakDelay=0,this.useDelay>0&&(this.useDelay-=t),e.clicked[2]?(this.useDelay=sb,this.use(n)):e.buttons[2]&&this.useDelay<=0&&(this.useDelay=Math.max(0,this.useDelay+sb),this.use(n))}breakBlock(t,e,n){let s=this.world,r=s.get(t,e,n),a=r&Ot;if(!(!a||ce[a])){if(s.set(t,e,n,a===rb?Ce(_h,0):0),this.hooks.onBreak(t,e,n,r),jt[a]===J.door){let o=r>>10&8?e-1:e+1,l=s.get(t,o,n);(l&Ot)===a&&(s.set(t,o,n,0),this.hooks.onBreak(t,o,n,l),this.settle(t,o,n))}this.settle(t,e,n)}}use(t){let e=this.player,n=this.world,s=this.hotbar.current();if(t){let o=t.block,l=o&Ot,c=jt[l];if((c===J.door||c===J.trapdoor)&&(!e.sneaking||!s)){this.toggle(t.x,t.y,t.z,o);return}}if(!s)return;let r=t;if(s===Pf){let o=e.eye(),l=e.look(),c=bh(n,o.x,o.y,o.z,l[0],l[1],l[2],iT,!0);c&&ce[c.block&Ot]&&(r=c)}if(!r)return;let a=pT(s,r,e,n);a&&(n.set(a.x,a.y,a.z,a.v),a.extra&&n.set(a.extra.x,a.extra.y,a.extra.z,a.extra.v),this.hooks.onPlace(a.x,a.y,a.z,a.v),this.hooks.onSwing(),this.settle(a.x,a.y,a.z),a.extra&&this.settle(a.extra.x,a.extra.y,a.extra.z))}toggle(t,e,n,s){let r=this.world,a=s&Ot,o=s>>10,l=(o&4)===0,c=Ce(a,o&-5|(l?4:0));if(r.set(t,e,n,c),jt[a]===J.door){let h=o&8?e-1:e+1,u=r.get(t,h,n);(u&Ot)===a&&r.set(t,h,n,Ce(a,u>>10&-5|(l?4:0)))}this.hooks.onUse(t,e,n,c),this.hooks.onSwing()}settle(t,e,n){let s=this.world,r=[t,e,n],a=512;for(;r.length&&a>0;){let o=r.pop(),l=r.pop(),c=r.pop();for(let h=0;h<10;h++){let u=c,f=l,d=o;if(h<4?(u+=$e[h],d+=Xe[h]):h===4?f++:h===5?f--:(u+=$e[h-6],d+=Xe[h-6],f++),f<0||f>255)continue;let g=s.get(u,f,d),b=g&Ot;if(!(!b||ce[b])&&!Tb(s,u,f,d,g)&&(s.set(u,f,d,b===rb?Ce(_h,0):0),this.hooks.onBreak(u,f,d,g),r.push(u,f,d),--a<=0))break}}}};var wh=Le.map(i=>{var t;return(t=i.sound)!=null?t:"stone"}),mT={sunrise:.02,noon:.25,sunset:.48,midnight:.75},gT=["north","east","south","west"],bT=["Towards negative Z","Towards positive X","Towards positive Z","Towards negative X"],Mh=class{constructor(t){this.state="menu";this.menus=null;this.world=null;this.chunks=null;this.meta=null;this.player=new ja;this.interaction=null;this.dayTime=.05;this.timeMode="cycle";this.time=0;this.last=0;this.hit=null;this.hudHidden=!1;this.autosaveAt=0;this.stepDist=0;this.wasInWater=!1;this.fps={frames:0,acc:0,value:0,min:999,max:0,frameMs:0};this.debugAcc=1;this.lastFrameAt=0;this.loadingToken=0;this.d=t,t.hotbar.onChange(()=>this.onHotbarChange()),t.input.onLockChange=e=>this.onLockChange(e),t.input.onKey=(e,n)=>this.onKey(e,n),t.inventory.onClose=()=>{this.state==="playing"&&(this.d.input.enabled=!0,this.lockOrPause())}}get settings(){return this.d.settings}get touchMode(){return this.d.settings.controls==="touch"&&!!this.d.touch}setTouchActive(t){this.d.touch&&(this.d.touch.setEnabled(t&&this.touchMode),this.d.input.virtualLock=t&&this.touchMode)}openInventory(){this.state!=="playing"||this.d.inventory.isOpen||(this.d.input.enabled=!1,this.d.inventory.open(),this.d.input.exitLock(),this.setTouchActive(!1))}async startWorld(t){var f,d,g,b;let e=++this.loadingToken;this.state="loading";let n=this.menus;n.showLoading("Preparing world",0),this.settings.fullscreen&&this.enterFullscreen(),this.d.sounds.unlock();let s=await Nn.savedChunkKeys(t.id).catch(()=>new Set);if(e!==this.loadingToken)return;let r=Le.map(p=>p.name),a=t.palette.length===r.length&&t.palette.every((p,m)=>p===r[m]),o=new eh(t.seed);this.world=o,this.meta=t,this.chunks=new uh(o,this.d.renderer,{worldId:t.id,seed:t.seed,savedKeys:s,remapPalette:a?null:t.palette,meshOptions:{fancyLeaves:this.settings.fancyLeaves,smoothLighting:this.settings.smoothLighting},renderDistance:this.settings.renderDistance}),this.timeMode=(f=t.timeMode)!=null?f:"cycle",this.dayTime=(d=t.dayTime)!=null?d:.05,t.hotbarNames&&t.hotbarNames.length===9?this.d.hotbar.load(t.hotbarNames.map(p=>p&&_t[p]&&qr(_t[p])?_t[p]:0),(g=t.selected)!=null?g:0):t.hotbar&&t.hotbar.length===9&&a&&this.d.hotbar.load(t.hotbar,(b=t.selected)!=null?b:0);let l=new ja;this.player=l;let c=!1;if(t.player)l.restore(t.player);else{let p=this.chunks.generator().findSpawn();l.restore({x:p.x+.5,y:Math.max(63,this.chunks.generator().heightAt(p.x,p.z)+1),z:p.z+.5,yaw:0,pitch:0,flying:!1}),c=!0}this.interaction=new vh(o,l,this.d.hotbar,{onBreak:(p,m,_,y)=>{this.d.renderer.breakParticles(p,m,_,y),this.d.sounds.play("break",wh[wn(y)])},onPlace:(p,m,_,y)=>this.d.sounds.play("place",wh[wn(y)]),onSwing:()=>this.d.renderer.swing(),onUse:(p,m,_,y)=>this.d.sounds.play("use",wh[wn(y)])});let h=Math.min(2,this.settings.renderDistance),u=performance.now();if(await new Promise(p=>{let m=()=>{if(e!==this.loadingToken||!this.chunks){p();return}this.chunks.update(l.x,l.z,30);let _=this.chunks.progress(l.x,l.z,h);n.showLoading(_<.5?"Generating terrain":"Building terrain",_),this.chunks.areaReady(l.x,l.z,h)||performance.now()-u>45e3?p():requestAnimationFrame(m)};requestAnimationFrame(m)}),!(e!==this.loadingToken||!this.chunks)){if(c){let p=this.safeGroundY(Math.floor(l.x),Math.floor(l.z));l.y=p}t.lastPlayed=Date.now(),this.saveMeta(),this.time=0,this.autosaveAt=30,this.onHotbarChange(),this.d.hud.setVisible(!0),this.hudHidden=!1,this.state="playing",n.hide(),this.d.input.enabled=!0,this.d.renderer.applySettings(this.settings),await this.lockOrPause()}}safeGroundY(t,e){let n=this.world;for(let s=250;s>1;s--){let r=wn(n.get(t,s,e));if(!(!r||!ge[r]||ti[r]||ce[r])&&!ge[wn(n.get(t,s+1,e))]&&!ge[wn(n.get(t,s+2,e))])return s+1}return Math.max(63,n.topY(t,e)+1)}async saveMeta(){let t=this.meta;if(t){t.player=this.player.serialize(),t.hotbar=this.d.hotbar.slots.slice(),t.hotbarNames=this.d.hotbar.slots.map(e=>e?Le[e].name:""),t.selected=this.d.hotbar.selected,t.dayTime=this.dayTime,t.timeMode=this.timeMode,t.palette=Le.map(e=>e.name),t.lastPlayed=Date.now();try{await Nn.saveWorld(t)}catch(e){console.warn("[game] could not save world",e)}}}async saveAll(){this.chunks&&await Promise.all([this.chunks.saveAll(),this.saveMeta()])}async saveAndQuit(){var t,e,n;this.loadingToken++,(t=this.menus)==null||t.showLoading("Saving world",1);try{await this.saveAll()}catch(s){console.warn(s)}(e=this.chunks)==null||e.dispose(),this.chunks=null,this.world=null,this.meta=null,this.interaction=null,this.hit=null,this.d.renderer.setHighlight(null,0,0,0),this.d.renderer.clear(),this.state="menu",this.d.input.enabled=!1,this.setTouchActive(!1),this.d.input.exitLock(),this.d.hud.setVisible(!1),this.d.hud.setUnderwaterTint(!1),document.fullscreenElement&&document.exitFullscreen().catch(()=>{}),(n=this.menus)==null||n.showTitle()}pause(){var t;this.state==="playing"&&(this.state="paused",this.d.input.enabled=!1,this.setTouchActive(!1),this.d.inventory.isOpen&&this.d.inventory.close(),(t=this.menus)==null||t.showPause(),this.saveAll())}resume(){var t;this.state==="paused"&&((t=this.menus)==null||t.hide(),this.state="playing",this.d.input.enabled=!0,this.lockOrPause())}async lockOrPause(){var e;if(this.touchMode){this.setTouchActive(!0);return}if(this.d.input.locked)return;!await this.d.input.requestLock()&&this.state==="playing"&&!this.d.inventory.isOpen&&(this.state="paused",this.d.input.enabled=!1,(e=this.menus)==null||e.showPause())}enterFullscreen(){let t=document.documentElement;document.fullscreenElement||!t.requestFullscreen||t.requestFullscreen().then(()=>{var n;let e=navigator.keyboard;(n=e==null?void 0:e.lock)==null||n.call(e).catch(()=>{})}).catch(()=>{})}setTimeMode(t){this.timeMode=t,t!=="cycle"&&(this.dayTime=mT[t])}applySettings(t){var e;if(this.d.renderer.applySettings(t),this.d.sounds.setVolume(t.volume),(e=this.d.touch)==null||e.applySettings(t),this.chunks){this.chunks.setRenderDistance(t.renderDistance);let n={fancyLeaves:t.fancyLeaves,smoothLighting:t.smoothLighting},s=this.chunks.meshOptions;(s.fancyLeaves!==n.fancyLeaves||s.smoothLighting!==n.smoothLighting)&&this.chunks.setMeshOptions(n)}}onLockChange(t){var e;!t&&this.state==="playing"&&!this.d.inventory.isOpen&&!((e=this.menus)!=null&&e.isOpen())&&this.pause()}onKey(t,e){var s;let n=this.d.inventory;if(n.isOpen){if(n.handleKey(t)){e.preventDefault();return}return}if((s=this.menus)!=null&&s.isOpen()){t==="Escape"&&(this.menus.back(),e.preventDefault());return}if(this.state==="playing")switch(t){case"KeyE":this.openInventory(),e.preventDefault();break;case"Escape":this.d.input.locked||this.pause();break;case"F1":this.hudHidden=!this.hudHidden,this.d.hud.setVisible(!this.hudHidden),e.preventDefault();break;case"F2":this.screenshot(),e.preventDefault();break;case"F3":this.d.hud.setDebugVisible(!this.d.hud.debugVisible),this.debugAcc=1,e.preventDefault();break;default:/^Digit[1-9]$/.test(t)?this.d.hotbar.select(Number(t.slice(5))-1):/^Numpad[1-9]$/.test(t)&&this.d.hotbar.select(Number(t.slice(6))-1)}}onHotbarChange(){let t=this.d.hotbar.current();this.d.renderer.setHeldBlock(t),this.d.hud.showItemName(t?jh(t):"")}async screenshot(){try{let t=await this.d.renderer.screenshot(),e=new Date,n=o=>String(o).padStart(2,"0"),s=`blockforge_${e.getFullYear()}-${n(e.getMonth()+1)}-${n(e.getDate())}_${n(e.getHours())}.${n(e.getMinutes())}.${n(e.getSeconds())}.png`,r=URL.createObjectURL(t),a=document.createElement("a");a.href=r,a.download=s,document.body.appendChild(a),a.click(),a.remove(),setTimeout(()=>URL.revokeObjectURL(r),5e3),this.d.hud.message(`Saved screenshot as ${s}`)}catch(t){this.d.hud.message("Could not take a screenshot"),console.warn(t)}}frame(t){var l,c;let e=this.settings.maxFps;if(e>0&&t-this.lastFrameAt<1e3/e-1)return;let n=Math.min(.1,this.last?(t-this.last)/1e3:.016);this.last=t,this.lastFrameAt=t,this.countFps(n);let s=this.world,r=this.chunks;if(!s||!r||this.state==="menu"||this.state==="loading"){this.d.input.endFrame();return}let a=this.player,o=this.d.input;if(this.state==="playing"){this.time+=n,this.timeMode==="cycle"&&(this.dayTime=(this.dayTime+n/fg)%1),(l=this.d.touch)==null||l.update(n),o.enabled&&o.wheel&&this.d.hotbar.scroll(Math.sign(o.wheel));let h={x:a.x,z:a.z};a.update(n,o,s,this.settings),s.tick(n),this.footsteps(h.x,h.z);let u=a.eye(),f=a.look();this.hit=bh(s,u.x,u.y,u.z,f[0],f[1],f[2],5),o.enabled&&o.locked&&((c=this.interaction)==null||c.update(n,o,this.hit)),this.updateHighlight(),this.autosaveAt-=n,this.autosaveAt<=0&&(this.autosaveAt=30,this.saveAll())}r.update(a.x,a.z,this.state==="playing"?6:10),this.d.hud.update(n),this.render(n),this.updateDebug(n),o.endFrame()}footsteps(t,e){let n=this.player,s=this.world;if(n.inWater!==this.wasInWater&&(n.inWater&&this.d.sounds.play("splash","liquid"),this.wasInWater=n.inWater),!n.onGround||n.flying){this.stepDist=0;return}if(this.stepDist+=Math.hypot(n.x-t,n.z-e),this.stepDist>1.7){this.stepDist=0;let r=wn(s.get(Math.floor(n.x),Math.floor(n.y-.2),Math.floor(n.z)));r&&this.d.sounds.play("step",wh[r])}}updateHighlight(){let t=this.hit,e=this.world;if(!t||this.hudHidden){this.d.renderer.setHighlight(null,0,0,0);return}let n=(s,r,a)=>e.get(t.x+s,t.y+r,t.z+a);this.d.renderer.setHighlight(Ic(t.block,n),t.x,t.y,t.z)}render(t){let e=this.player,n=this.world,s=e.eye(),r=Math.floor(s.x),a=Math.floor(s.y),o=Math.floor(s.z),l=n.getLight(r,a,o),c=this.settings.viewBobbing?e.bob():{phase:0,amount:0};this.d.hud.setUnderwaterTint(e.headInWater),this.d.renderer.render({dt:t,time:this.time,dayTime:this.dayTime,eye:s,yaw:e.yaw,pitch:e.pitch,fov:this.settings.fov*e.fovScale(),underwater:e.headInWater,inLava:e.inLava&&wn(n.get(r,a,o))===_t.lava,handLight:{sky:l>>4,block:l&15},bob:c,showHand:!this.hudHidden})}countFps(t){let e=this.fps;e.frames++,e.acc+=t,e.frameMs=t*1e3,t>0&&(e.min=Math.min(e.min,1/t),e.max=Math.max(e.max,1/t)),e.acc>=1&&(e.value=Math.round(e.frames/e.acc),e.frames=0,e.acc=0,this.settings.showFps&&!this.d.hud.debugVisible&&this.state!=="menu"?this.d.hud.setFps(`${e.value} fps`):this.d.hud.setFps(null),e.min=999,e.max=0)}updateDebug(t){var w,S,A;if(!this.d.hud.debugVisible||!this.world||!this.chunks||(this.debugAcc+=t,this.debugAcc<.25))return;this.debugAcc=0;let e=this.player,n=this.world,s=this.d.renderer,r=Math.floor(e.x),a=Math.floor(e.y),o=Math.floor(e.z),l=Math.floor(r/16),c=Math.floor(o/16),h=n.getChunk(l,c),u=h?(w=F1[h.biome[Ta(r&15,o&15)]])!=null?w:"?":"loading",f=(-e.yaw*180/Math.PI%360+360)%360,d=Math.round(f/90)%4,g=n.getLight(r,Math.floor(e.y+.1),o),b=s.stats(),p=this.chunks.stats,m=this.fps,_=[`BlockForge 1.0 (${"2026-10-07T12:41:29.099Z".slice(0,10)})`,`${m.value} fps (${m.frameMs.toFixed(1)} ms)`,`Draw calls: ${b.drawCalls}  Triangles: ${b.triangles.toLocaleString()}`,`Sections: ${b.visibleSections} / ${b.sections} visible`,`Chunks: ${p.loaded} loaded, gen queue ${p.genQueue}, mesh queue ${p.meshQueue}`,"",`XYZ: ${e.x.toFixed(3)} / ${e.y.toFixed(3)} / ${e.z.toFixed(3)}`,`Block: ${r} ${a} ${o}`,`Chunk: ${r&15} ${a&15} ${o&15} in ${l} ${a>>4} ${c}`,`Facing: ${gT[d]} (${bT[d]}) (${f.toFixed(1)} / ${(e.pitch*-180/Math.PI).toFixed(1)})`,`Biome: ${u}`,`Light: ${g>>4} sky, ${g&15} block`,`Time: ${this.clock()} (${this.timeMode})`,`Mode: creative${e.flying?", flying":""}${e.sprinting?", sprinting":""}${e.sneaking?", sneaking":""}`];if(this.hit){let L=this.hit;_.push("",`Looking at: ${L.x} ${L.y} ${L.z}`,`${jh(wn(L.block))} [${Le[wn(L.block)].name}] meta ${Gp(L.block)}`)}let y=performance.memory,v=[`Renderer: ${s.info.webgl2?"WebGL 2":"WebGL 1"}`,`GPU: ${s.info.renderer}`,`Vendor: ${s.info.vendor}`,`Display: ${innerWidth}x${innerHeight} @ ${(window.devicePixelRatio||1).toFixed(2)}x`,y?`Memory: ${Math.round(y.usedJSHeapSize/1048576)} / ${Math.round(y.jsHeapSizeLimit/1048576)} MB`:"Memory: n/a",`CPU threads: ${navigator.hardwareConcurrency||"?"}`,"",`Preset: ${this.settings.preset}, render distance ${this.settings.renderDistance}`,`Shadows: ${this.settings.shadows?"on":"off"}, leaves: ${this.settings.fancyLeaves?"fancy":"fast"}`,`Seed: ${(A=(S=this.meta)==null?void 0:S.seed)!=null?A:""}`,`Blocks in registry: ${vt-1}`,`Gen ${this.chunks.stats.genMs.toFixed(1)} ms, light ${this.chunks.stats.lightMs.toFixed(1)} ms, mesh ${this.chunks.stats.meshMs.toFixed(1)} ms`];this.d.hud.setDebug(_,v)}clock(){let t=Math.floor((this.dayTime*24+6)%24*60);return`${String(Math.floor(t/60)).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`}};var yT="1.0.0",Cb=()=>new Promise(i=>requestAnimationFrame(()=>i())),_T=i=>new Promise(t=>setTimeout(t,i));function kb(i){let t=document.getElementById("boot");t&&(t.textContent=i)}function Rb(i,t){var a;let e=(a=document.getElementById("boot"))!=null?a:document.body.appendChild(document.createElement("div"));e.id="boot",e.innerHTML="";let n=document.createElement("div");n.style.cssText="max-width:640px;padding:24px;line-height:1.5;text-align:center";let s=document.createElement("div");s.style.cssText="font-size:24px;margin-bottom:12px",s.textContent=i;let r=document.createElement("div");r.style.cssText="font-size:16px;opacity:.85;white-space:pre-line",r.textContent=t,n.append(s,r),e.appendChild(n)}function vT(i){let t=i.trim();if(!t){let n=new Uint32Array(1);try{crypto.getRandomValues(n)}catch{n[0]=Math.random()*2**32>>>0}return n[0]|0}if(/^-?\d+$/.test(t)){let n=Number(t);if(Number.isSafeInteger(n))return n|0}let e=0;for(let n=0;n<t.length;n++)e=Math.imul(31,e)+t.charCodeAt(n)|0;return e}function xT(){let i=new Uint32Array(2);try{crypto.getRandomValues(i)}catch{i[0]=Date.now(),i[1]=Math.random()*1e9|0}return"w"+i[0].toString(36)+i[1].toString(36)}async function wT(){var _;let i=Gf();ra(i.guiScale),kb("Painting textures\u2026"),await Cb();let t=vp().catch(()=>{}),e=ng(i.mipmaps);kb("Carving block icons\u2026"),await Cb();let n=Qp(e);await Promise.race([t,_T(1500)]);let s=document.createElement("canvas");s.id="game",s.tabIndex=0,document.body.prepend(s);let r;try{r=new Vc(s,e,i)}catch(y){console.error(y),Rb("BlockForge could not start 3D graphics",`Your browser did not give the page a WebGL context.

Try: Chrome or Edge settings > System > turn on "Use graphics acceleration when available", then restart the browser. On a managed school device, WebGL may be blocked by policy.`);return}let a=document.createElement("div");a.id="ui",document.body.appendChild(a);let o=new qc,l=new $c(s);l.enabled=!1;let c=new wl(a,n,o);c.setVisible(!1);let h=new Ml(a,n,o),u=new Xc;u.setVolume(i.volume);let f=null,d=new Sl(a,l,o,i,{openInventory:()=>f==null?void 0:f.openInventory(),pause:()=>f==null?void 0:f.pause(),isFlying:()=>!!(f!=null&&f.player.flying),toggleFly:()=>f==null?void 0:f.player.toggleFlight()}),g=new Mh({renderer:r,input:l,hud:c,inventory:h,hotbar:o,sounds:u,settings:i,touch:d});f=g;let b={listWorlds:()=>Nn.listWorlds(),async createWorld(y,v){u.unlock();let w={id:xT(),name:y.trim()||"New World",seed:vT(v),created:Date.now(),lastPlayed:Date.now(),player:null,hotbar:Ha.slice(),hotbarNames:Ha.map(S=>S?Le[S].name:""),selected:0,dayTime:.05,timeMode:"cycle",palette:Le.map(S=>S.name),version:1};o.load(Ha,0),await Nn.saveWorld(w),await g.startWorld(w)},async playWorld(y){u.unlock();let v=await Nn.getWorld(y);if(!v){p.showWorlds();return}await g.startWorld(v)},deleteWorld:y=>Nn.deleteWorld(y),resume:()=>g.resume(),saveAndQuit:()=>g.saveAndQuit(),settingsChanged(y){na(y),ra(y.guiScale),g.applySettings(y)},getTimeMode:()=>g.timeMode,setTimeMode:y=>g.setTimeMode(y),offlineDownloadUrl:/^https?:$/.test(location.protocol)?"download":null,version:yT},p=new xl(a,b,i);g.menus=p,s.addEventListener("mousedown",()=>{g.state==="playing"&&!l.locked&&!h.isOpen&&!p.isOpen()&&l.requestLock()}),window.addEventListener("resize",()=>r.resize()),window.addEventListener("beforeunload",y=>{(g.state==="playing"||g.state==="paused")&&(g.saveAll(),y.preventDefault(),y.returnValue="")}),document.addEventListener("visibilitychange",()=>{document.hidden&&(g.state==="playing"||g.state==="paused")&&(g.saveAll(),g.state==="playing"&&g.pause())}),window.addEventListener("pointerdown",()=>u.unlock(),{once:!0}),(_=document.getElementById("boot"))==null||_.remove(),p.showTitle();let m=y=>{requestAnimationFrame(m);try{g.frame(y)}catch(v){console.error("[frame]",v)}};requestAnimationFrame(m),window.blockforge={game:g,renderer:r,settings:i,storage:Nn,handlers:b,hud:c,inventory:h,menus:p,hotbar:o,touch:d,input:l,ID:_t,BLOCKS:Le,applyPreset(y){sl(i,y),b.settingsChanged(i)},debug:{play(){p.hide(),g.state="playing",l.enabled=!0}}}}wT().catch(i=>{console.error(i),Rb("BlockForge failed to start",String(i&&i.message||i))});})();
/*! Bundled license information:

three/build/three.module.js:
  (**
   * @license
   * Copyright 2010-2023 Three.js Authors
   * SPDX-License-Identifier: MIT
   *)
*/
