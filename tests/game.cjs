const fs = require('fs');
const path = require('path');
const vm = require('vm');
const dir = path.join(__dirname, '..', 'src');
const html = fs.readFileSync(path.join(dir, 'echo-courier.html'), 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
new vm.Script(source);
const assert = (condition,message) => { if(!condition) throw new Error(message+' '+(typeof game!=='undefined'?JSON.stringify(game.state()):'')); };
assert(!html.includes('\\"'),'literal markup');
assert(!/<!doctype|<html|<body|<head>/i.test(html),'fragment format');
const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
for(const m of source.matchAll(/el\('([^']+)'\)/g)) assert(ids.has('ec-'+m[1]),'missing element '+m[1]);
const context2d = new Proxy({}, {get: (o,k)=> k==='createLinearGradient'?()=>({addColorStop(){}}):(()=>{}),set:()=>true});
const elements = {};
for(const id of ids) elements[id]={style:{},classList:{add(){},remove(){}},setAttribute(){},addEventListener(){},setPointerCapture(){},getBoundingClientRect:()=>({width:736,height:400}),getContext:()=>context2d,hidden:false};
elements['echo-courier'].querySelector=s=>elements[s.slice(1)];
elements['echo-courier'].appendChild=()=>{};
const sandbox={console,Math,Number,String,Object,Array,Set,JSON,window:{addEventListener(){}},document:{getElementById:id=>elements[id],createElement:()=>({style:{},remove(){}}),documentElement:{},addEventListener(){}},matchMedia:()=>({matches:false,addEventListener(){}}),getComputedStyle:()=>({color:'#808080'}),devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},ResizeObserver:class{observe(){}},MutationObserver:class{observe(){}}};
vm.runInNewContext(source,sandbox);
const game=elements['echo-courier'].echoGame;
const step=(n=1)=>{for(let i=0;i<n;i++)game.step();};
const state=()=>game.state();
const moveTo=(target,frames=450)=>{
  for(let i=0;i<frames;i++){
    const s=state();if(s.mode==='complete'||s.mode==='won'||Math.abs(s.player.x-target)<5){game.input(false,false,false);return;}
    game.input(s.player.x>target,s.player.x<target,false);step();
  }
  throw new Error('cannot walk to '+target+' from '+JSON.stringify(state()));
};
const jumpTo=(target,second=true,max=160)=>{
  game.input(state().player.x>target,state().player.x<target,true);step();
  for(let i=1;i<max;i++){
    const s=state(),difference=target-s.player.x;
    game.input(difference<-4,difference>4,second&&i===18);step();
    if(i>18&&state().player.grounded&&Math.abs(state().player.x-target)<6){game.input(false,false,false);return;}
  }
  throw new Error('cannot jump to '+target+' '+JSON.stringify(state()));
};
function echoPad(target){moveTo(target);step(5);game.record();step(10);game.record();step(12);assert(state().echoes.length>0,'echo created');}
game.load(0);step(5);moveTo(168);echoPad(286);assert(state().pads.A,'pad A held');moveTo(373);jumpTo(438);moveTo(490);jumpTo(656);assert(state().collected[1],'level 1 upper shard');moveTo(934);jumpTo(1150);jumpTo(1274);moveTo(1480);step(5);assert(state().mode==='complete','level 1 completion');assert(state().deaths===0,'level 1 no deaths');
console.log('PASS level 1: three shards, pressure gate, double jump, gap, goal');
game.load(1);step(5);echoPad(282);moveTo(340);jumpTo(430);jumpTo(560);moveTo(805);moveTo(1010);jumpTo(1202);jumpTo(1390);jumpTo(1620);moveTo(1715);step(5);assert(state().mode==='complete','level 2 completion');assert(state().deaths===0,'level 2 no deaths');
console.log('PASS level 2: echo bridge, elevated shards, spikes, goal');
game.load(2);step(5);echoPad(242);moveTo(306);jumpTo(428);jumpTo(585);moveTo(746);jumpTo(990);moveTo(1030);jumpTo(1218);game.record();step(8);game.record();step(10);assert(state().pads.A&&state().pads.B,'both pads held');jumpTo(1444);jumpTo(1555);moveTo(1725);jumpTo(1900);moveTo(1960);step(4);assert(state().mode==='won','level 3 victory');assert(state().deaths===0,'level 3 no deaths');
console.log('PASS level 3: two simultaneous echoes, both gates, victory');
game.load(0);step(5);echoPad(286);game.undo();assert(state().echoes.length===0,'undo removes echo');game.record();step(365);assert(!state().recording&&state().echoes.length===1,'auto finishes at six seconds');game.restart();assert(state().echoes.length===0&&state().collected.every(v=>!v),'restart resets level');
echoPad(286);moveTo(960);game.input(false,true,false);step(110);assert(state().deaths>=2,'falling respawns');game.draw();console.log('PASS record timeout, undo, restart, falling, draw, IDs, syntax');
