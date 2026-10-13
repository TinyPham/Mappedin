const INTERVAL=10000,IMAGE_RATIO=1672/868;
const slides=[
  {name:'01-luong-di-tang-3',flow:'departure',floor:'3'},
  {name:'02-luong-di-tang-2',flow:'departure',floor:'2'},
  {name:'03-luong-den-tang-1',flow:'arrival',floor:'1'},
  {name:'04-luong-den-tang-tret',flow:'arrival',floor:'ground'}
];
const copy={
  vn:{departure:'Luồng đi',arrival:'Luồng đến',floor:'Tầng',ground:'Tầng trệt',guide:'Luồng hành khách',
    minimize:'Thu nhỏ',expand:'Mở rộng',dismiss:'Ẩn hướng dẫn',previous:'Ảnh trước',next:'Ảnh tiếp theo',
    pause:'Tạm dừng tự chuyển',resume:'Tiếp tục tự chuyển',images:'Ảnh hướng dẫn',image:'Ảnh',failed:'Không tải được ảnh. Vui lòng thử lại.',retry:'Thử lại'},
  en:{departure:'Departure',arrival:'Arrival',floor:'Level',ground:'Ground floor',guide:'Passenger flows',
    minimize:'Minimize',expand:'Expand',dismiss:'Hide guide',previous:'Previous image',next:'Next image',
    pause:'Pause slideshow',resume:'Resume slideshow',images:'Guide images',image:'Image',failed:'The image could not load. Please retry.',retry:'Retry'}
};
const normalizeLanguage=value=>/^(vn|vi)(-|$)/i.test(String(value||'vn'))?'vn':'en';

/** Four approved, cropped stills; one persistent expanded/miniature carousel. */
export function mountAirportFlowSlideshow({language='vn',onModeChange}={}){
  const trigger=document.getElementById('btn-journey-simulation'),map=document.getElementById('mappedin-map');
  if(!trigger||!map)return null;
  let lang=normalizeLanguage(language),mode='hidden',slideIndex=0,paused=false,destroyed=false;
  let timer=null,placementFrame=null,scrollTimer=null,drag=null;
  const listeners=[];
  const listen=(target,type,fn,options)=>{target.addEventListener(type,fn,options);listeners.push(()=>target.removeEventListener(type,fn,options));};
  const node=(tag,name,parent)=>{const el=document.createElement(tag);el.className=`airport-flow-slideshow-${name}`;parent?.append(el);return el;};
  const button=(name,parent)=>{const el=node('button',name,parent);el.type='button';return el;};
  const savedAttributes=new Map(['aria-controls','aria-expanded','aria-haspopup','aria-label','title'].map(n=>[n,trigger.getAttribute(n)]));
  const root=node('section','player',document.body);root.id='airport-flow-video-player';root.hidden=true;
  root.setAttribute('role','dialog');root.setAttribute('aria-modal','false');root.setAttribute('aria-labelledby','airport-flow-slideshow-title');
  const header=node('header','header',root),title=node('strong','title',header);title.id='airport-flow-slideshow-title';
  const minimizeButton=button('minimize',header);minimizeButton.textContent='×';
  const frame=node('div','frame',root),track=node('div','track',frame);track.setAttribute('aria-roledescription','carousel');
  const loaded=slides.map(()=>false),failed=slides.map(()=>false);
  const pages=slides.map((slide,index)=>{
    const page=node('div','slide',track);page.setAttribute('role','group');page.setAttribute('aria-roledescription','slide');
    const image=node('img','image',page);image.src=`/media/passenger-flows/slides/${slide.name}.svg`;
    image.draggable=false;image.decoding='async';image.loading='eager';image.setAttribute('lang','vi');
    listen(image,'load',()=>{loaded[index]=true;failed[index]=false;if(slideIndex===index){render();restartTimer();}});
    listen(image,'error',()=>{loaded[index]=false;failed[index]=true;if(slideIndex===index){render();restartTimer();}});
    return {page,image};
  });
  const expandButton=button('expand',frame);expandButton.textContent='↗';
  const dismissButton=button('dismiss',root);dismissButton.textContent='×';
  const notice=node('div','notice',frame),message=node('p','message',notice);message.setAttribute('role','alert');
  const retryButton=button('retry',notice),controls=node('div','controls',root);
  const previousButton=button('previous',controls);previousButton.textContent='‹';
  const dots=node('div','dots',controls);dots.setAttribute('role','group');
  const dotButtons=slides.map((_,i)=>{const el=button('dot',dots);el.dataset.index=String(i);return el;});
  const nextButton=button('next',controls);nextButton.textContent='›';const pauseButton=button('pause',controls);
  const caption=slide=>`${copy[lang][slide.flow]} · ${slide.floor==='ground'?copy[lang].ground:`${copy[lang].floor} ${slide.floor}`}`;
  const clearTimer=()=>{if(timer!==null)window.clearTimeout(timer);timer=null;};
  const restartTimer=()=>{
    clearTimer();
    if(!destroyed&&mode!=='hidden'&&!paused&&!document.hidden&&!drag&&loaded[slideIndex]&&!failed[slideIndex]){
      timer=window.setTimeout(()=>{timer=null;goTo(slideIndex+1);},INTERVAL);
    }
  };
  const render=()=>{
    const text=copy[lang];root.lang=lang==='vn'?'vi':'en';root.dataset.mode=mode;root.hidden=mode==='hidden';
    header.hidden=mode!=='expanded';expandButton.hidden=dismissButton.hidden=mode!=='mini';
    previousButton.hidden=nextButton.hidden=pauseButton.hidden=mode!=='expanded';title.textContent=caption(slides[slideIndex]);
    track.setAttribute('aria-label',text.images);dots.setAttribute('aria-label',text.images);
    pages.forEach(({page,image},i)=>{page.setAttribute('aria-label',`${i+1} / 4 — ${caption(slides[i])}`);page.setAttribute('aria-hidden',String(i!==slideIndex));image.alt=caption(slides[i]);});
    dotButtons.forEach((el,i)=>{el.setAttribute('aria-label',`${text.image} ${i+1} / 4 — ${caption(slides[i])}`);el.setAttribute('aria-current',String(i===slideIndex));});
    for(const[el,label]of [[minimizeButton,text.minimize],[expandButton,text.expand],[dismissButton,text.dismiss],
      [previousButton,text.previous],[nextButton,text.next],[pauseButton,paused?text.resume:text.pause]]){el.setAttribute('aria-label',label);el.title=label;}
    pauseButton.textContent=paused?'▶':'Ⅱ';pauseButton.setAttribute('aria-pressed',String(paused));
    notice.hidden=!failed[slideIndex]||mode==='hidden';message.textContent=text.failed;retryButton.textContent=text.retry;
    trigger.setAttribute('aria-controls',root.id);trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-expanded',String(mode==='expanded'));
    const label=mode==='expanded'?text.minimize:mode==='mini'?text.expand:text.guide;trigger.setAttribute('aria-label',label);trigger.title=label;
  };
  const trackWidth=()=>track.clientWidth||parseFloat(root.style.width)||1;
  const align=(smooth=false)=>track.scrollTo({left:slideIndex*trackWidth(),behavior:smooth&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches?'smooth':'auto'});
  const goTo=value=>{
    if(destroyed||!Number.isFinite(Number(value)))return;
    slideIndex=((Math.trunc(Number(value))%4)+4)%4;render();align(mode==='expanded');restartTimer();
  };
  const visibleBox=id=>{
    const el=document.getElementById(id);if(!el||el.hidden)return null;
    const style=window.getComputedStyle(el);if(style.display==='none'||style.visibility==='hidden')return null;
    const box=el.getBoundingClientRect();return box.width>0&&box.height>0?box:null;
  };
  const place=()=>{
    if(destroyed||mode==='hidden')return;
    const viewport=window.visualViewport,box=map.getBoundingClientRect(),vl=viewport?.offsetLeft||0,vt=viewport?.offsetTop||0;
    let left=Math.max(vl,box.left)+8,top=Math.max(vt,box.top)+8;
    let right=Math.min(vl+(viewport?.width||window.innerWidth),box.right)-8,bottom=Math.min(vt+(viewport?.height||window.innerHeight),box.bottom)-8;
    const side=visibleBox('main-sidebar-left');
    if(side&&side.left<=left&&side.right>left&&side.top<bottom&&side.bottom>top){
      if(side.width>=right-left)top=Math.max(top,side.bottom+8);
      else left=Math.max(left,Math.min(right,side.right+12));
    }
    for(const id of ['camera-controls','camera-actions','mobile-camera-stack']){
      const b=visibleBox(id);if(b&&b.right>right-80&&b.left>left&&b.top<bottom&&b.bottom>top)right=Math.min(right,b.left-12);
    }
    for(const id of ['custom-floor-wrapper','custom-lang-wrapper']){
      const b=visibleBox(id);if(b&&b.bottom>bottom-80&&b.right>left&&b.left<right)bottom=Math.min(bottom,b.top-12);
    }
    const aw=Math.max(0,right-left),ah=Math.max(0,bottom-top),mini=mode==='mini';
    const chrome=mini?24:88,maxWidth=mini?(window.innerWidth<=768?160:220):1240;
    const width=Math.max(0,Math.min(maxWidth,aw,Math.max(0,ah-chrome)*IMAGE_RATIO)),height=width/IMAGE_RATIO+chrome;
    root.style.width=`${width}px`;root.style.height=`${height}px`;
    root.style.left=`${mini?right-width:left+(aw-width)/2}px`;root.style.top=`${mini?bottom-height:top+(ah-height)/2}px`;align();
  };
  const schedulePlacement=()=>{if(destroyed||mode==='hidden'||placementFrame!==null)return;placementFrame=window.requestAnimationFrame(()=>{placementFrame=null;place();});};
  const setMode=next=>{if(destroyed)return;const changed=mode!==next;mode=next;render();place();restartTimer();if(changed)onModeChange?.(mode);};
  const open=()=>{if(!destroyed){setMode('expanded');minimizeButton.focus({preventScroll:true});}};
  const minimize=()=>{if(!destroyed&&mode!=='hidden'){setMode('mini');expandButton.focus({preventScroll:true});}};
  const hide=()=>{
    if(destroyed)return;setMode('hidden');if(placementFrame!==null)window.cancelAnimationFrame(placementFrame);placementFrame=null;
    if(scrollTimer!==null)window.clearTimeout(scrollTimer);scrollTimer=null;drag=null;trigger.focus({preventScroll:true});
  };
  const settleScroll=()=>{
    scrollTimer=null;if(destroyed||mode==='hidden'||drag)return;
    const nearest=Math.max(0,Math.min(3,Math.round(track.scrollLeft/trackWidth())));
    if(nearest!==slideIndex){slideIndex=nearest;render();restartTimer();}
  };
  listen(track,'scroll',()=>{if(scrollTimer!==null)window.clearTimeout(scrollTimer);scrollTimer=window.setTimeout(settleScroll,140);});
  listen(track,'pointerdown',event=>{
    if(mode!=='expanded'||(event.button!==undefined&&event.button!==0))return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,index:slideIndex,left:track.scrollLeft};clearTimer();track.setPointerCapture?.(event.pointerId);
  });
  listen(track,'pointermove',event=>{
    if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8){event.preventDefault();track.style.scrollSnapType='none';track.scrollLeft=drag.left-dx;}
  });
  const endDrag=(event,cancel=false)=>{
    if(!drag||event.pointerId!==drag.id)return;const start=drag;drag=null;track.style.scrollSnapType='';track.releasePointerCapture?.(event.pointerId);
    const dx=event.clientX-start.x,dy=event.clientY-start.y,horizontal=!cancel&&Math.abs(dx)>=36&&Math.abs(dx)>Math.abs(dy);
    goTo(horizontal?start.index+(dx<0?1:-1):start.index);
  };
  listen(track,'pointerup',event=>endDrag(event));listen(track,'pointercancel',event=>endDrag(event,true));
  listen(track,'lostpointercapture',event=>{if(drag?.id===event.pointerId)endDrag(event,true);});
  for(const type of ['pointerdown','pointermove','pointerup','click','wheel'])listen(root,type,event=>event.stopPropagation());
  listen(trigger,'click',()=>mode==='expanded'?minimize():open());listen(minimizeButton,'click',minimize);
  listen(expandButton,'click',open);listen(dismissButton,'click',hide);dotButtons.forEach((el,i)=>listen(el,'click',()=>goTo(i)));
  listen(previousButton,'click',()=>goTo(slideIndex-1));listen(nextButton,'click',()=>goTo(slideIndex+1));
  listen(pauseButton,'click',()=>{paused=!paused;render();restartTimer();});
  listen(retryButton,'click',()=>{
    loaded[slideIndex]=false;failed[slideIndex]=false;pages[slideIndex].image.src=`/media/passenger-flows/slides/${slides[slideIndex].name}.svg?retry=${Date.now()}`;
    render();restartTimer();
  });
  listen(document,'keydown',event=>{
    if(event.key==='Escape'&&mode==='expanded'){event.preventDefault();minimize();}
    else if(mode==='expanded'&&root.contains(event.target)&&['ArrowLeft','ArrowRight'].includes(event.key)){event.preventDefault();goTo(slideIndex+(event.key==='ArrowRight'?1:-1));}
  });
  listen(document,'visibilitychange',restartTimer);listen(window,'resize',schedulePlacement);listen(window,'scroll',schedulePlacement,true);
  if(window.visualViewport){listen(window.visualViewport,'resize',schedulePlacement);listen(window.visualViewport,'scroll',schedulePlacement);}
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedulePlacement);observer?.observe(map);
  for(const id of ['main-sidebar-left','camera-controls','camera-actions','mobile-camera-stack','custom-floor-wrapper','custom-lang-wrapper']){const el=document.getElementById(id);if(el)observer?.observe(el);}
  const mutations=typeof MutationObserver==='undefined'?null:new MutationObserver(schedulePlacement),sidebar=document.getElementById('main-sidebar-left');
  if(sidebar){mutations?.observe(sidebar,{attributes:true,attributeFilter:['class','style','hidden']});listen(sidebar,'transitionend',schedulePlacement);}
  render();
  return {open,minimize,close:minimize,hide,goTo,
    setLanguage(value){if(!destroyed){lang=normalizeLanguage(value);render();}},setRoute(){},setPosition(){},
    getState:()=>({mode,slideIndex,flow:slides[slideIndex].flow,language:lang,paused,view:'slideshow',intervalMs:INTERVAL,error:failed[slideIndex]?'image':''}),
    destroy(){
      if(destroyed)return;const restoreFocus=root.contains(document.activeElement),changed=mode!=='hidden';destroyed=true;mode='hidden';clearTimer();
      if(scrollTimer!==null)window.clearTimeout(scrollTimer);if(placementFrame!==null)window.cancelAnimationFrame(placementFrame);
      observer?.disconnect();mutations?.disconnect();listeners.splice(0).forEach(remove=>remove());root.remove();
      for(const[name,value]of savedAttributes){if(value===null)trigger.removeAttribute(name);else trigger.setAttribute(name,value);}
      if(restoreFocus)trigger.focus({preventScroll:true});if(changed)onModeChange?.('hidden');
    }
  };
}
