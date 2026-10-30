(function(){
  'use strict';
  const query=new URLSearchParams(location.search),preview=query.get('preview')==='beginning',prefix=preview?'chuer-opening-v16:':'';
  if(preview&&query.has('fresh')){localStorage.removeItem(prefix+'chuer-dangjia-v9');query.delete('fresh');history.replaceState(null,'',location.pathname+'?'+query.toString());}
  const canvas=document.getElementById('game'),shell=document.getElementById('game-shell'),controls=document.getElementById('accessible-controls');
  let audio,started=false,theme,game,controlKey='';
  function audioStart(){if(!started){started=true;theme=new Audio('assets/theme.mp3');theme.loop=true;theme.volume=.30;}if(game&&game.inspect().state.sound)theme.play().catch(()=>{});}
  function sound(kind){
    audioStart();try{
      audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(audio.state==='suspended')audio.resume();
      const freqs=kind==='brew-perfect'?[659,880,1318]:kind==='brew-good'?[659,880]:kind==='upgrade'?[392,494,587,784]:kind==='coin'?[784,1046]:kind==='dark'?[146,155]:kind==='story'?[392,523]:[523];
      freqs.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=audio.currentTime+i*.08;o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.055,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.4);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.42);});
    }catch(e){}
  }
  function editName({value,maxChars=8}){
    return new Promise(resolve=>{
      const overlay=document.createElement('div');overlay.className='name-editor';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-labelledby','name-title');
      const form=document.createElement('form');form.className='name-form';const title=document.createElement('h2');title.id='name-title';title.textContent='给自己一个掌柜名';
      const label=document.createElement('label');label.htmlFor='player-name';label.textContent='掌柜名';const input=document.createElement('input');input.id='player-name';input.name='player-name';input.type='text';input.value=value;input.maxLength=maxChars*2;input.autocomplete='off';input.spellcheck=false;
      const help=document.createElement('p');help.textContent='1—8个汉字、字母或数字，也可用间隔点。';const error=document.createElement('p');error.className='name-error';error.setAttribute('role','alert');
      const actions=document.createElement('div');actions.className='name-actions';const cancel=document.createElement('button');cancel.type='button';cancel.id='name-cancel';cancel.textContent='暂不更改';const submit=document.createElement('button');submit.type='submit';submit.id='name-save';submit.textContent='保存掌柜名';actions.append(cancel,submit);form.append(title,label,input,help,error,actions);overlay.append(form);shell.append(overlay);
      const end=result=>{overlay.remove();canvas.focus({preventScroll:true});resolve(result);};cancel.onclick=()=>end(null);input.oninput=()=>{error.textContent='';};form.onsubmit=e=>{e.preventDefault();const r=ChuerProfile.validateName(input.value);if(!r.ok){error.textContent=r.message;return;}end(r.name);};overlay.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();end(null);}if(e.key==='Tab'){const focusable=[input,cancel,submit],i=focusable.indexOf(document.activeElement);e.preventDefault();focusable[(i+(e.shiftKey?-1:1)+3)%3].focus();}};input.focus();input.select();
    });
  }
  const size=()=>{const b=shell.getBoundingClientRect();return{width:b.width,height:b.height,dpr:devicePixelRatio||1};};
  game=ChuerGame.create({canvas,...size(),
    review:query.has('test'),preview,newCampaign:()=>{location.href=location.pathname+'?v=0.21&preview=beginning&fresh=1';},
    read:key=>{try{return JSON.parse(localStorage.getItem(prefix+key));}catch(e){return null;}},
    write:(key,data)=>{try{localStorage.setItem(prefix+key,JSON.stringify(data));}catch(e){}},
    loadImage:src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;}),
    editName,requestFrame:fn=>requestAnimationFrame(fn),cancelFrame:id=>cancelAnimationFrame(id),sound,
    music:enabled=>{if(theme)enabled?theme.play().catch(()=>{}):theme.pause();},
    onReady:()=>document.getElementById('loading').remove(),
    progress:value=>{const node=document.querySelector('#loading span');if(node)node.textContent='绣坊准备中 · '+Math.round(value*100)+'%';},
    onError:()=>{document.getElementById('loading').textContent='画面未能载入，请刷新后重试';},
    controls:list=>{
      const key=list.map(x=>x.id+':'+x.label+':'+x.disabled).join('|');if(key===controlKey)return;controlKey=key;controls.replaceChildren();
      list.forEach(({id,label,disabled})=>{const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.tabIndex=-1;b.onclick=()=>game.click(id);controls.appendChild(b);});
    }
  });
  const point=e=>{const r=canvas.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];};
  canvas.addEventListener('pointerdown',e=>{if(!e.isPrimary||e.button!==0)return;audioStart();canvas.setPointerCapture(e.pointerId);game.pointerDown(...point(e));});
  canvas.addEventListener('pointermove',e=>{if(e.isPrimary)game.pointerMove(...point(e));});
  canvas.addEventListener('pointerup',e=>{if(!e.isPrimary)return;game.pointerUp(...point(e));canvas.focus({preventScroll:true});});
  canvas.addEventListener('pointercancel',()=>game.pointerCancel());
  canvas.addEventListener('keydown',e=>{if(['w','a','s','d','Home','Tab','Enter',' ','Escape','ArrowDown','ArrowUp','ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();game.key(e.key);}});
  new ResizeObserver(()=>{const s=size();game.resize(s.width,s.height,s.dpr);}).observe(shell);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){game.hide();if(theme)theme.pause();}else{game.show();if(started&&game.inspect().state.sound)theme.play().catch(()=>{});}});
  window.addEventListener('pagehide',()=>game.hide());
  if(new URLSearchParams(location.search).has('test'))window.__chuer=game;
})();
