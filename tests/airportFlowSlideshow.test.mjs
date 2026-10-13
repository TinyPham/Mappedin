import test from 'node:test';
import assert from 'node:assert/strict';
import {mountAirportFlowSlideshow} from '../src/journeys/airportFlowSlideshow.js';
import {mountAirportFlowVideoPlayer} from '../src/journeys/airportFlowVideoPlayer.js';

const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
class Element {
  constructor(tag='div',box=rect(0,0,0,0)) {
    this.tagName=tag.toUpperCase();this.children=[];this.attributes=new Map();this.listeners=new Map();
    this.style={};this.dataset={};this.hidden=false;this.rect=box;this.scrollLeft=0;this.clientWidth=0;
  }
  append(...nodes){for(const node of nodes){node.parentElement=this;this.children.push(node);}}
  setAttribute(k,v){this.attributes.set(k,String(v));}
  getAttribute(k){return this.attributes.get(k)??null;}
  removeAttribute(k){this.attributes.delete(k);}
  addEventListener(k,fn){if(!this.listeners.has(k))this.listeners.set(k,new Set());this.listeners.get(k).add(fn);}
  removeEventListener(k,fn){this.listeners.get(k)?.delete(fn);}
  emit(k,e={}){for(const fn of this.listeners.get(k)||[])fn({target:this,preventDefault(){},stopPropagation(){},...e});}
  getBoundingClientRect(){return this.rect;}
  scrollTo({left}){this.scrollLeft=left;}
  setPointerCapture(){} releasePointerCapture(){}
  focus(){document.activeElement=this;}
  contains(node){return node===this||this.children.some(c=>c.contains(node));}
  remove(){this.parentElement.children=this.parentElement.children.filter(c=>c!==this);}
}
function harness(t,{width=1440,height=1000,sidebar=false}={}) {
  const saved=new Map(['document','window','ResizeObserver','MutationObserver'].map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]));
  const doc=new Element('document');doc.body=new Element('body');doc.hidden=false;
  const trigger=new Element('button',rect(width-50,200,40,40));trigger.setAttribute('aria-controls','previous');
  const map=new Element('div',rect(0,0,width,height));
  const side=new Element('aside',rect(0,0,340,height));side.hidden=!sidebar;
  const camera=new Element('div',rect(width-50,200,40,350));
  const language=new Element('div',rect(width-108,height-56,100,40));
  const ids=new Map([['btn-journey-simulation',trigger],['mappedin-map',map],['main-sidebar-left',side],['camera-controls',camera],['custom-lang-wrapper',language]]);
  doc.getElementById=id=>ids.get(id);doc.createElement=tag=>new Element(tag);globalThis.document=doc;
  const win=new Element('window');win.innerWidth=width;win.innerHeight=height;
  win.getComputedStyle=el=>({display:el.hidden?'none':'block',visibility:'visible'});
  const timers=new Map();let now=0,id=0;
  win.setTimeout=(fn,ms)=>{timers.set(++id,{fn,at:now+ms});return id;};win.clearTimeout=id=>timers.delete(id);
  win.requestAnimationFrame=fn=>win.setTimeout(fn,0);win.cancelAnimationFrame=win.clearTimeout;
  globalThis.window=win;
  class Observer{observe(){}disconnect(){}}globalThis.ResizeObserver=Observer;globalThis.MutationObserver=Observer;
  const modes=[];const player=mountAirportFlowSlideshow({language:'vn',onModeChange:m=>modes.push(m)});
  const all=()=>{const walk=e=>[e,...e.children.flatMap(walk)];return walk(doc.body);};
  const find=name=>all().find(e=>e.className?.split(' ').includes('airport-flow-slideshow-'+name));
  all().filter(e=>e.tagName==='IMG').forEach(e=>e.emit('load'));
  t.after(()=>{player?.destroy();for(const[k,v]of saved){if(v)Object.defineProperty(globalThis,k,v);else delete globalThis[k];}});
  return {player,doc,win,trigger,map,side,camera,language,modes,timers,all,find,
    advance(ms){const end=now+ms;for(;;){const next=[...timers.entries()].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;timers.delete(next[0]);now=next[1].at;next[1].fn();}now=end;}};
}

test('legacy mount is compatible and widget has four images and four selectable dots, no video',t=>{
  assert.equal(mountAirportFlowVideoPlayer,mountAirportFlowSlideshow);
  const h=harness(t);h.trigger.emit('click');
  assert.equal(h.player.getState().mode,'expanded');
  assert.equal(h.all().filter(e=>e.tagName==='IMG').length,4);
  assert.equal(h.all().filter(e=>e.className==='airport-flow-slideshow-dot').length,4);
  assert.equal(h.all().filter(e=>e.tagName==='VIDEO').length,0);
  assert.equal(h.trigger.getAttribute('aria-expanded'),'true');
});
test('advances only at ten seconds and loops from fourth image to first',t=>{
  const h=harness(t);h.player.open();h.advance(9999);assert.equal(h.player.getState().slideIndex,0);
  h.advance(1);assert.equal(h.player.getState().slideIndex,1);
  h.advance(30000);assert.equal(h.player.getState().slideIndex,0);
});
test('dot selection restarts the full ten-second reading interval',t=>{
  const h=harness(t);h.player.open();h.advance(9000);
  const dots=h.all().filter(e=>e.className==='airport-flow-slideshow-dot');dots[2].emit('click');
  assert.equal(h.player.getState().slideIndex,2);assert.equal(dots[2].getAttribute('aria-current'),'true');
  h.advance(9999);assert.equal(h.player.getState().slideIndex,2);h.advance(1);assert.equal(h.player.getState().slideIndex,3);
});
test('pause holds the slide; resume starts a fresh interval',t=>{
  const h=harness(t);h.player.open();h.find('pause').emit('click');h.advance(40000);
  assert.equal(h.player.getState().slideIndex,0);assert.equal(h.player.getState().paused,true);
  h.find('pause').emit('click');h.advance(10000);assert.equal(h.player.getState().slideIndex,1);
});
test('horizontal pointer swipes navigate once, vertical and cancelled gestures do not',t=>{
  const h=harness(t);h.player.open();const track=h.find('track');
  track.emit('pointerdown',{pointerId:1,clientX:300,clientY:200,button:0});
  track.emit('pointermove',{pointerId:1,clientX:190,clientY:204});
  track.emit('pointerup',{pointerId:1,clientX:190,clientY:204});assert.equal(h.player.getState().slideIndex,1);
  track.emit('pointerdown',{pointerId:2,clientX:190,clientY:200,button:0});
  track.emit('pointerup',{pointerId:2,clientX:310,clientY:202});assert.equal(h.player.getState().slideIndex,0);
  track.emit('pointerdown',{pointerId:3,clientX:300,clientY:200,button:0});
  track.emit('pointerup',{pointerId:3,clientX:320,clientY:380});assert.equal(h.player.getState().slideIndex,0);
  track.emit('pointerdown',{pointerId:4,clientX:300,clientY:200,button:0});
  track.emit('pointercancel',{pointerId:4});assert.equal(h.player.getState().slideIndex,0);
});
test('miniature preserves the current slide, keeps looping, and expands without restarting',t=>{
  const h=harness(t);h.player.open();h.player.goTo(2);h.player.minimize();
  assert.equal(h.player.getState().mode,'mini');assert.equal(h.player.getState().slideIndex,2);
  assert.ok(parseFloat(h.find('player').style.width)<=220);
  h.advance(10000);assert.equal(h.player.getState().slideIndex,3);
  h.find('expand').emit('click');assert.equal(h.player.getState().mode,'expanded');assert.equal(h.player.getState().slideIndex,3);
});
test('hide and hidden document suspend timers; reopening restores the same slide',t=>{
  const h=harness(t);h.player.open();h.player.goTo(1);h.doc.hidden=true;h.doc.emit('visibilitychange');h.advance(30000);
  assert.equal(h.player.getState().slideIndex,1);h.doc.hidden=false;h.doc.emit('visibilitychange');h.advance(10000);
  assert.equal(h.player.getState().slideIndex,2);h.player.hide();h.advance(30000);assert.equal(h.player.getState().slideIndex,2);
  h.player.open();assert.equal(h.player.getState().slideIndex,2);
});
test('image failure shows retry and stops automatic navigation until a successful load',t=>{
  const h=harness(t);h.player.open();const img=h.all().find(e=>e.tagName==='IMG');img.emit('error');h.advance(20000);
  assert.equal(h.player.getState().slideIndex,0);assert.equal(h.find('notice').hidden,false);
  h.find('retry').emit('click');img.emit('load');h.advance(10000);assert.equal(h.player.getState().slideIndex,1);
});
test('language changes affect UI labels without replacing approved images or changing the slide',t=>{
  const h=harness(t);h.player.open();h.player.goTo(3);const urls=h.all().filter(e=>e.tagName==='IMG').map(e=>e.src);
  h.player.setLanguage('en');assert.equal(h.player.getState().slideIndex,3);
  assert.deepEqual(h.all().filter(e=>e.tagName==='IMG').map(e=>e.src),urls);assert.match(h.find('title').textContent,/Arrival/);
});
test('mobile miniature stays clear of right map controls and bottom language controls',t=>{
  const h=harness(t,{width:390,height:740});h.player.open();h.player.minimize();const root=h.find('player');
  const width=parseFloat(root.style.width),height=parseFloat(root.style.height);
  assert.ok(width<=160);assert.ok(parseFloat(root.style.left)>=8);
  assert.ok(parseFloat(root.style.left)+width<=h.camera.rect.left);
  assert.ok(parseFloat(root.style.top)+height<=h.language.rect.top);
});
test('escape minimizes, arrow keys navigate only inside the widget, teardown cancels all work',t=>{
  const h=harness(t);h.player.open();h.doc.emit('keydown',{key:'ArrowRight',target:h.map});assert.equal(h.player.getState().slideIndex,0);
  h.doc.emit('keydown',{key:'ArrowRight',target:h.find('pause')});assert.equal(h.player.getState().slideIndex,1);
  h.doc.emit('keydown',{key:'Escape'});assert.equal(h.player.getState().mode,'mini');
  h.player.destroy();assert.equal(h.doc.body.children.length,0);assert.equal(h.timers.size,0);
  assert.equal(h.trigger.getAttribute('aria-controls'),'previous');h.trigger.emit('click');assert.equal(h.doc.body.children.length,0);
});
test('missing map or trigger makes no changes',t=>{
  const h=harness(t);h.player.destroy();h.doc.getElementById=()=>null;assert.equal(mountAirportFlowSlideshow(),null);
});
test('full-width mobile search header leaves a usable slideshow below it',t=>{
 const h=harness(t,{width:390,height:844,sidebar:true});h.side.rect=rect(0,0,390,135);h.player.open();
 const root=h.find('player');assert.ok(parseFloat(root.style.width)>300);assert.ok(parseFloat(root.style.top)>=143);
 h.player.minimize();assert.equal(parseFloat(root.style.width),160);
});
