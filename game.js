(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./service.js'),require('./art.js'),require('./intro.js'),require('./street.js'),require('./street-art.js'));
  else root.ChuerGame=factory(root.ChuerCore,root.ChuerService,root.ChuerArt,root.ChuerOpening,root.ChuerStreet,root.ChuerStreetArt);
})(typeof globalThis!=='undefined'?globalThis:this,function(C,S,ART,Opening,Street,StreetArt){
  'use strict';
  const World=C.WORLD,Growth=C.GROWTH,Energy=C.ENERGY,Catalog=C.CATALOG,Guide=C.GUIDE,Events=C.EVENTS,Profile=C.PROFILE;
  const Needle=C.NEEDLEWORK,Story=C.STORYLINE;
  const INK='#65434a',TEAL='#9b6474',GOLD='#cfb477',PAPER='#fff1e9',FADE='#866157',RED='#b3636c';
  const FONT='"Songti SC","STSong","SimSun",serif';
  const KEY='chuer-dangjia-v9',LEGACY_KEYS=['chuer-dangjia-v8','chuer-dangjia-v7','chuer-dangjia-v6','chuer-dangjia-v5','chuer-dangjia-v4','chuer-dangjia-v31','chuer-dangjia-v3','chuer-dangjia-v1'];
  const INTRO=Opening.SHOTS;
  function create(env){
    const canvas=env.canvas,ctx=canvas.getContext('2d');
    let state=C.restore(env.read(KEY)||LEGACY_KEYS.map(key=>env.read(key)).find(Boolean)),screen='title',modal=null,selectedShop=0,images={},ready=false,loadProgress=0,loadFailed=false;
    let musicRevision=0,lastMusicKey='';
    let W=390,H=780,scale=1,safe=0,bottom=0,hits=[],focus=-1,frame=0,introAt=0,lastIntro=-1,introPausedAt=null,introPauseTotal=0,introAutoPause=false;
    let tick=Date.now(),saved=tick,hidden=false,raf=null,toast=null,effects=[],pendingOffline=C.offline(state,tick);
    let storyIndex=0,storyStep=0,confirmSku=null,returnTo=null,modalScroll=0;
    let service=null,serviceResult=null,serviceFX=[],serviceHint='',pressedId=null,pressedUntil=0,crewPage=0,decorPage=0,selectedSlot='table1',selectedActivity='daily',bookTab='recipes',bookPage=0,bookReturn=null,mapSelected=0,energyReturn=null,bookShop=0,stockSlot=0,stockPage=0,stockReturn=null,guideFlow=null,tradeRegion=0,tradeShop=0,tradeSlot='left',regionalReturn=null;
    let journalPage=0,guideReview=null,paragraphReview=[],quietReview=[],needleMotion=null;
    let needleMode='simple',needleSupplyMode='simple',needlePage=0,needleStroke=null,panelTransform=null,panelReview=null,paintReview=[],needleReview=null;
    const streetCamera=Street.create(),streetArt=StreetArt.create(id=>env.loadImage(ART.sources['streetTile'+id]));let streetGesture=null,pointerSuppressed=false;
    const reduced=()=>state.reducedMotion;
    function persist(){if(service&&!service.finished&&(service.tutorial||service.festivalRun||service.rainRun)){service.guideStep=guideFlow?.step||0;service.recipeXPBase=state.recipeXP.slice();state.activeSession={kind:service.tutorial?'guide':service.festivalRun?'festival':'rain',service:JSON.parse(JSON.stringify(service))};}state.visitedAt=Date.now();env.write(KEY,state);saved=Date.now();}
    function rect(x,y,w,h,r=0,fill,stroke){
      ctx.beginPath();r=Math.min(r,w/2,h/2);
      ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);
      if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=.8;ctx.stroke();}
    }
    function text(s,x,y,size=14,color=INK,align='left',bold=false){s=playerText(s);ctx.font=`${bold?'bold ':''}${size}px ${FONT}`;ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(String(s),x,y);if(env.review){const width=ctx.measureText(String(s)).width,left=align==='center'?x-width/2:align==='right'?x-width:x;paintReview.push({text:String(s),scope:panelReview?(panelTransform?'body':'overlay'):'screen',...uiBox(left,y-size*.56,width,size*1.12)});}}
    function uiBox(x,y,w,h){const t=panelTransform;return t?{x:195+(x-195)*t.q,y:t.y+(y-t.y)*t.q,w:w*t.q,h:h*t.q}:{x,y,w,h};}
    function fitText(s,x,y,size,width,color=INK,align='left',bold=false){let actual=size;ctx.font=`${bold?'bold ':''}${actual}px ${FONT}`;const measured=ctx.measureText(playerText(s)).width;if(measured>width)actual*=width/measured;text(s,x,y,actual,color,align,bold);return actual;}
    function closeControl(id,label,cx,cy,fn){button(id,label,cx-22,cy-22,44,44,fn,{paint:false});art(id===pressedId&&Date.now()<pressedUntil?'panelCloseDown':'panelClose',cx-17,cy-17,34,34);ctx.save();ctx.strokeStyle='#8f596c';ctx.lineWidth=1.55;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-4.5,cy-4.5);ctx.lineTo(cx+4.5,cy+4.5);ctx.moveTo(cx+4.5,cy-4.5);ctx.lineTo(cx-4.5,cy+4.5);ctx.stroke();ctx.restore();}
    function lines(s,x,y,width,size=14,color=INK,line=23,max=8){
      const source=playerText(s);let actual=size;
      function wrap(){ctx.font=`${actual}px ${FONT}`;const out=[];for(const para of source.split('\n')){const rows=[];let row='';for(const ch of para){if(row&&ctx.measureText(row+ch).width>width){if(/[，。！？；：、）》」』】〕…,.!?;:%]/.test(ch)||/[（《「『【]$/.test(row)){const tail=row.slice(-1);rows.push(row.slice(0,-1));row=tail+ch;}else{rows.push(row);row=ch;}}else row+=ch;}rows.push(row);if(rows.length>1&&rows.at(-1).length<=2&&rows.at(-2).length>=6){rows[rows.length-1]=rows[rows.length-2].slice(-2)+rows.at(-1);rows[rows.length-2]=rows[rows.length-2].slice(0,-2);}out.push(...rows);}return out;}
      let out=wrap();while(out.length>max&&actual>Math.min(10,size)){actual=Math.max(Math.min(10,size),actual-.5);out=wrap();}
      out.slice(0,max).forEach((r,i)=>text(r,x,y+i*line,actual,color));
      if(env.review)paragraphReview.push({text:source,rows:out,font:actual,shown:Math.min(out.length,max),cropped:out.length>max,scope:panelReview?'panel':'screen',...uiBox(x,y-actual*.56,width,Math.min(out.length,max)*line)});
      return Math.min(out.length,max)*line;
    }
    function paperNotice(title,body,x,y,w=252){const inner=38,font=12,line=21,h=132;artPlate('scroll',x,y,w,h,true);text(title,x+inner,y+28,14,TEAL,'left',true);lines(body,x+inner,y+62,w-inner*2,font,INK,line,3);}
    function gradient(y,h,a,b){const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
    function cover(img,x,y,w,h,zoom=1,crop){
      if(!img)return;
      const sw=crop?crop[2]:img.width,sh=crop?crop[3]:img.height,sx=crop?crop[0]:0,sy=crop?crop[1]:0;
      const f=Math.max(w/sw,h/sh)*zoom;
      ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.drawImage(img,sx,sy,sw,sh,x+(w-sw*f)/2,y+(h-sh*f)/2,sw*f,sh*f);ctx.restore();
    }
    function portrait(x,y,w,h,panel=2){const img=images.prologue;if(!img)return;cover(img,x,y,w,h,1,[img.width/3*panel,img.height*.08,img.width/3,img.height*.6]);}
    function artSource(name){const a=ART.frames[name],img=a&&images[a.sheet];return img?{img,sx:a.u*img.width,sy:a.v*img.height,sw:a.w*img.width,sh:a.h*img.height}:null;}
    function art(name,x,y,w,h,alpha=1){
      const a=artSource(name);if(!a)return;
      const f=Math.min(w/a.sw,h/a.sh),dw=a.sw*f,dh=a.sh*f;
      ctx.save();ctx.globalAlpha*=alpha;ctx.drawImage(a.img,a.sx,a.sy,a.sw,a.sh,x+(w-dw)/2,y+(h-dh)/2,dw,dh);ctx.restore();
    }
    function leftArrow(x,y,size,alpha=1){ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x+size/2,y+size/2);ctx.scale(-1,1);art('arrow',-size/2,-size/2,size,size);ctx.restore();}
    function artPlate(name,x,y,w,h,paper=false){
      const a=artSource(name);if(!a)return;
      // Preserve carved ends and scroll rollers; stretch only quiet interior material.
      const bx=a.sw*(paper?.09:name==='ribbon'?.34:name==='secondary'?.32:.30),by=paper?a.sh*(name==='ledger'?.06:.19):0,dx=paper?Math.min(24,w*.27):plateInset(w,h),dy=paper?Math.min(26,h*.2):0;
      const sx=[a.sx,a.sx+bx,a.sx+a.sw-bx],sy=[a.sy,a.sy+by,a.sy+a.sh-by],sw=[bx,a.sw-2*bx,bx],sh=paper?[by,a.sh-2*by,by]:[a.sh];
      const xx=[x,x+dx,x+w-dx],yy=[y,y+dy,y+h-dy],ww=[dx,w-2*dx,dx],hh=paper?[dy,h-2*dy,dy]:[h];
      for(let row=0;row<(paper?3:1);row++)for(let col=0;col<3;col++)ctx.drawImage(a.img,sx[col],paper?sy[row]:a.sy,sw[col],sh[row],xx[col],paper?yy[row]:y,ww[col],hh[row]);
    }
    function plateInset(w,h){return Math.min(h*.65,w*.18);}
    function quietLabel(s,x,y,size,w,h,color=INK,bold=true){
      const inset=plateInset(w,h)+7,available=w-inset*2,actual=fitText(s,x+w/2,y+h/2,size,available,color,'center',bold);
      if(env.review)quietReview.push({text:playerText(s),...uiBox(x+inset,y+h*.25,available,h*.5),font:actual});
    }
    function guideEllipse(target){const v=target.visual||target;return{cx:v.x+v.w/2,cy:v.y+v.h/2,rx:Math.max(27,v.w/2+8),ry:Math.max(27,v.h/2+8)};}
    function circlePath(g,pad=0){ctx.moveTo(g.cx+g.rx+pad,g.cy);ctx.ellipse(g.cx,g.cy,g.rx+pad,g.ry+pad,0,0,Math.PI*2);}
    function circleGuide(target,now,dim=false,kind='lesson'){
      const g=guideEllipse(target),pulse=reduced()?0:(Math.sin(now/290)+1)*1.5;
      ctx.save();if(panelTransform){ctx.translate(195,panelTransform.y);ctx.scale(1/panelTransform.q,1/panelTransform.q);ctx.translate(-195,-panelTransform.y);}if(dim){ctx.beginPath();ctx.rect(0,0,W,H);circlePath(g,3);ctx.fillStyle='#633c4659';ctx.fill('evenodd');}
      ctx.shadowColor='#ffe0a5';ctx.shadowBlur=8;ctx.strokeStyle='#a86468';ctx.lineWidth=5;ctx.beginPath();circlePath(g,pulse);ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#ffe7ac';ctx.lineWidth=2.5;ctx.beginPath();circlePath(g,pulse);ctx.stroke();ctx.restore();
      if(env.review)guideReview={kind,target:target.id,shape:'ellipse',...g,pulse};return g;
    }
    function guideHand(target,now){
      const v=target.visual||target,tip=target.guidePoint||{x:v.x+v.w/2,y:v.y+v.h/2},a=ART.frames.guideHand;
      const h=34*(reduced()?1:1+Math.sin(now/290)*.025),w=h*a.w/a.h*images[a.sheet].width/images[a.sheet].height;
      const x=tip.x-w*.945,y=tip.y-h*.055;art('guideHand',x,y,w,h);
      ctx.beginPath();ctx.arc(tip.x,tip.y,2.2,0,Math.PI*2);ctx.fillStyle='#fff1b8';ctx.fill();
      if(env.review&&guideReview)guideReview.hand={target:target.id,tip,bounds:{x,y,w,h}};
    }
    function icon(name,x,y,s=20,color=GOLD){
      if(ART.frames[name]){art(name,x,y,s,s);return;}
      if(name==='tea'||name==='pastry'){foodSprite(name==='tea'?0:2,x+s/2,y+s/2,s);return;}
      if(name==='incense'){
        const a=artSource('kettleIdle');if(a)ctx.drawImage(a.img,a.sx,a.sy+a.sh*.57,a.sw,a.sh*.43,x,y+s*.45,s,s*.55);
        ctx.save();ctx.strokeStyle='#a9884f';ctx.lineWidth=Math.max(1,s/20);ctx.beginPath();for(const xx of [.35,.54,.71]){ctx.moveTo(x+s*xx,y+s*.55);ctx.lineTo(x+s*xx,y+s*.15);}ctx.stroke();ctx.strokeStyle='#b8b5a4';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(x+s*.5,y+s*.17);ctx.bezierCurveTo(x+s*.3,y,x+s*.7,y+s*.08,x+s*.48,y);ctx.stroke();ctx.restore();return;
      }
      ctx.save();ctx.translate(x,y);ctx.scale(s/24,s/24);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.5;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
      if(name==='coin'){ctx.arc(12,12,9,0,Math.PI*2);ctx.stroke();ctx.strokeRect(9,9,6,6);}
      else if(name==='gem'){ctx.moveTo(4,8);ctx.lineTo(9,3);ctx.lineTo(17,3);ctx.lineTo(21,8);ctx.lineTo(12,21);ctx.closePath();ctx.stroke();ctx.moveTo(4,8);ctx.lineTo(21,8);ctx.moveTo(9,3);ctx.lineTo(9,8);ctx.lineTo(12,21);ctx.lineTo(16,8);ctx.lineTo(17,3);ctx.stroke();}
      else if(name==='tea'){ctx.moveTo(4,10);ctx.lineTo(18,10);ctx.lineTo(16,19);ctx.lineTo(7,19);ctx.closePath();ctx.stroke();ctx.moveTo(18,11);ctx.quadraticCurveTo(25,9,21,16);ctx.lineTo(17,16);ctx.moveTo(3,22);ctx.lineTo(20,22);ctx.moveTo(8,6);ctx.quadraticCurveTo(6,3,9,1);ctx.moveTo(13,6);ctx.quadraticCurveTo(11,3,14,1);ctx.stroke();}
      else if(name==='incense'){ctx.moveTo(5,11);ctx.lineTo(19,11);ctx.lineTo(16,20);ctx.lineTo(8,20);ctx.closePath();ctx.moveTo(8,20);ctx.lineTo(6,23);ctx.moveTo(16,20);ctx.lineTo(18,23);ctx.moveTo(11,11);ctx.lineTo(11,3);ctx.moveTo(15,11);ctx.lineTo(15,5);ctx.moveTo(10,0);ctx.quadraticCurveTo(7,3,10,4);ctx.stroke();}
      else if(name==='pastry'){ctx.arc(12,13,8,0,Math.PI*2);ctx.moveTo(9,7);ctx.lineTo(9,19);ctx.moveTo(15,7);ctx.lineTo(15,19);ctx.moveTo(5,10);ctx.lineTo(19,10);ctx.moveTo(5,16);ctx.lineTo(19,16);ctx.stroke();}
      else if(name==='street'){ctx.moveTo(2,10);ctx.lineTo(12,3);ctx.lineTo(22,10);ctx.moveTo(4,10);ctx.lineTo(20,10);ctx.moveTo(6,10);ctx.lineTo(6,21);ctx.lineTo(18,21);ctx.lineTo(18,10);ctx.moveTo(10,21);ctx.lineTo(10,15);ctx.lineTo(14,15);ctx.lineTo(14,21);ctx.stroke();}
      else if(name==='orders'||name==='case'){ctx.rect(5,3,15,19);ctx.moveTo(3,6);ctx.lineTo(7,6);ctx.moveTo(3,11);ctx.lineTo(7,11);ctx.moveTo(3,16);ctx.lineTo(7,16);ctx.moveTo(10,8);ctx.lineTo(16,8);ctx.moveTo(10,12);ctx.lineTo(16,12);if(name==='case'){ctx.moveTo(11,17);ctx.lineTo(16,17);}ctx.stroke();}
      else if(name==='partners'){ctx.arc(12,7,4,0,Math.PI*2);ctx.moveTo(4,22);ctx.quadraticCurveTo(4,13,12,13);ctx.quadraticCurveTo(20,13,20,22);ctx.stroke();}
      else if(name==='fame'){for(let i=0;i<5;i++){const a=-Math.PI/2+i*Math.PI*2/5,b=a+Math.PI/5;ctx.lineTo(12+10*Math.cos(a),12+10*Math.sin(a));ctx.lineTo(12+4*Math.cos(b),12+4*Math.sin(b));}ctx.closePath();ctx.stroke();}
      else if(name==='settings'){ctx.arc(12,12,8,0,Math.PI*2);ctx.moveTo(12,7);ctx.lineTo(12,12);ctx.lineTo(16,14);ctx.stroke();}
      else if(name==='clothes'){ctx.moveTo(8,3);ctx.lineTo(3,6);ctx.lineTo(1,13);ctx.lineTo(6,15);ctx.lineTo(7,10);ctx.lineTo(6,22);ctx.lineTo(18,22);ctx.lineTo(17,10);ctx.lineTo(18,15);ctx.lineTo(23,13);ctx.lineTo(21,6);ctx.lineTo(16,3);ctx.quadraticCurveTo(12,10,8,3);ctx.stroke();}
      else if(name==='close'){ctx.moveTo(6,6);ctx.lineTo(18,18);ctx.moveTo(18,6);ctx.lineTo(6,18);ctx.stroke();}
      else if(name==='lock'){ctx.rect(5,10,14,12);ctx.moveTo(8,10);ctx.lineTo(8,6);ctx.quadraticCurveTo(12,-1,16,6);ctx.lineTo(16,10);ctx.stroke();}
      else{ctx.moveTo(7,4);ctx.lineTo(17,12);ctx.lineTo(7,20);ctx.stroke();}
      ctx.restore();
    }
    function button(id,label,x,y,w,h,fn,opt={}){
      label=playerText(label);const disabled=!!opt.disabled;
      if(opt.paint!==false){
        ctx.save();if(disabled)ctx.globalAlpha=.48;
        if(id===pressedId&&Date.now()<pressedUntil){ctx.translate(x+w/2,y+h/2);ctx.scale(.97,.96);ctx.translate(-x-w/2,-y-h/2);}
        artPlate(opt.type==='gold'?'primary':'secondary',x-3,y-8,w+6,h+16);
        quietLabel(label,x-3,y-8,opt.size||14,w+6,h+16,opt.type==='gold'?'#674422':'#714754');ctx.restore();
      }
      const pad=Math.max(0,(44-h)/2);
      const box=uiBox(x,y-pad,w,h+pad*2),targetH=Math.max(44,box.h),f=opt.guideFocus,point=opt.guidePoint||(opt.paint!==false?{x:x+w*.82,y:y+h*.38}:null),p=point?uiBox(point.x,point.y,0,0):null;hits.push({id,label,x:box.x,y:box.y-(targetH-box.h)/2,w:box.w,h:targetH,visual:f?uiBox(f.x,f.y,f.w,f.h):uiBox(x,y,w,h),guidePoint:p?{x:p.x,y:p.y}:null,painted:opt.paint!==false,fn,disabled});
      if(focus===hits.length-1){ctx.strokeStyle='#fce3a1';ctx.lineWidth=2;ctx.strokeRect(x+3,y+2,w-6,h-4);}
    }
    function currency(n){return Math.floor(n).toLocaleString('zh-CN');}
    function hudCurrency(n){return n>=1e8?(n/1e8).toFixed(n%1e8?1:0).replace(/\.0$/,'')+'亿':n>=1e4?(n/1e4).toFixed(n%1e4?1:0).replace(/\.0$/,'')+'万':currency(n);}
    function say(message,big=false){toast={message,until:Date.now()+(big?4000:2800)};}
    function chime(type){if(state.sound&&env.sound)env.sound(type);}
    function pop(label,x=195,y=H*.5,color=GOLD){effects=[{label,x,y,color,start:Date.now()}];chime('coin');}
    function saveChange(){persist();}
    function open(name){pointerCancel();if(name==='map')mapSelected=state.district;if(name==='service-brief')selectedActivity=Growth.activity(selectedActivity,state.shops[selectedShop].level||1).id;modal=name;focus=-1;modalScroll=0;chime('tap');}
    function close(){modal=null;confirmSku=null;focus=-1;}
    function openBook(page=selectedShop){bookReturn=modal;bookTab='recipes';bookShop=page;bookPage=0;open('growth');}
    function leaveBook(){if(bookReturn)open(bookReturn);else close();}
    function openStock(){stockReturn=modal;stockPage=0;stockSlot=0;open('stock');}
    function leaveStock(){if(stockReturn)open(stockReturn);else close();}
    function openEnergy(){energyReturn=modal;open('energy');}
    function leaveEnergy(){if(energyReturn)open(energyReturn);else close();}
    function streetBackdrop(time){
      const prosperous=screen==='title'||screen==='intro'||state.shops[1].level>0||state.skin;
      const view=districtView(state.district,prosperous);cover(view.img,0,0,W,H,1,view.crop);
      if(!state.skin&&state.clues<2){ctx.fillStyle='#acaa6b0b';ctx.fillRect(0,0,W,H);}
      if(state.skin||state.clues>=3){ctx.fillStyle='#efbe3b0b';ctx.fillRect(0,0,W,H);}
      if(state.skin){
        for(const [lx,ly] of [[34,H*.57],[349,H*.36],[282,H*.65]]){
          const drift=reduced()?0:Math.sin(time/1800+lx)*3;
          ctx.save();ctx.translate(lx+drift,ly);ctx.strokeStyle='#caa26c';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(0,-46);ctx.lineTo(0,-19);ctx.stroke();
          const glow=ctx.createRadialGradient(0,0,1,0,0,34);glow.addColorStop(0,'#ffcb6670');glow.addColorStop(1,'#ffcb6600');ctx.fillStyle=glow;ctx.fillRect(-34,-34,68,68);
          if(images.lantern)ctx.drawImage(images.lantern,-22,-42,44,88);ctx.restore();
        }
      }
      if(!reduced())for(let i=0;i<13;i++){
        const x=(i*91+Math.sin(time/3600+i)*36)%W,y=(i*137-time/(110+i*5))%(H+40);
        ctx.beginPath();ctx.fillStyle=i%3?'#f8d98977':'#ffddaa99';ctx.ellipse(x,y<0?y+H:y,1.8,2.5,Math.sin(i+time/3000),0,Math.PI*2);ctx.fill();
      }
    }
    function foodSprite(id,x,y,size=48,alpha=1){
      if(id>=3){art('product'+id,x-size/2,y-size/2,size,size,alpha);return;}
      const img=images.foods;if(!img)return;
      ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(img,id*img.width/3+img.width*.008,0,img.width/3-img.width*.016,img.height,x-size/2,y-size/2,size,size);ctx.restore();
    }
    function guestSprite(kind,x,y,h=136){
      if(kind>=9){const a=artSource('guest'+kind);if(!a)return;const sh=a.sh*.65,ww=h*a.sw/sh;ctx.drawImage(a.img,a.sx,a.sy,a.sw,sh,x-ww/2,y-h,ww,h);return;}
      const img=kind<3?images.guests:kind<9?images.newGuests:images.frontierGuests;if(!img)return;
      const index=kind<3?kind:kind<9?kind-3:kind-9,sw=img.width/3,cell=kind>=3&&kind<9?img.height/2:img.height,sh=cell*.65,ww=h*sw/sh;
      ctx.drawImage(img,index%3*sw,Math.floor(index/3)*cell,sw,sh,x-ww/2,y-h,ww,h);
    }
    function staffPortrait(p,x,y,size=48){
      const img=images.crew;if(!img)return;const sw=img.width/3,sh=img.height/2;
      ctx.save();ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.fillStyle='#e8dcc4';ctx.fill();cover(img,x,y,size,size,1,[p.portrait%3*sw+sw*.12,Math.floor(p.portrait/3)*sh+sh*.015,sw*.76,sh*.66]);ctx.restore();
    }
    function roomBackdrop(shop,offset=0){
      if(offset<0){ctx.save();ctx.beginPath();ctx.rect(0,H+offset,W,-offset);ctx.clip();roomBackdrop(shop,0);ctx.restore();}
      if(!shop)cover(images.restaurant,0,offset,W,H);
      else{const img=images.rooms;ctx.drawImage(img,(shop-1)*img.width/2,0,img.width/2,img.height,0,offset,W,H);}
    }
    function decorOffset(){return screen==='decorate'&&selectedSlot==='counter'?Math.min(-80,H-bottom-276-(selectedShop===0?.866:.919)*H):0;}
    function tableFrame(shop,i){const id=state.decorEquipped[shop]['table'+i];return(id==='default'?'tableBase':World.DECOR.find(d=>d.id===id).frame)+i;}
    function tableGeometry(i,editing=false){const l=serviceLayout();return{x:l.xs[i],y:l.tableY-3+(editing?decorOffset():0),w:138,h:103};}
    function drawTable(shop,i,editing=false){
      const r=tableGeometry(i,editing),a=artSource(tableFrame(shop,i));if(a)ctx.drawImage(a.img,a.sx,a.sy,a.sw,a.sh,r.x-r.w/2,r.y,r.w,r.h);
      if(editing&&selectedSlot!=='counter'){const active=selectedSlot==='table'+i;ctx.beginPath();ctx.ellipse(r.x,r.y+27,47,15,0,0,Math.PI*2);ctx.strokeStyle=active?'#f6dfa2':'#e7d39c77';ctx.lineWidth=active?2:1;ctx.stroke();button('decor-slot-table'+i,World.SLOTS[i].name,r.x-54,r.y+4,108,95,()=>{selectedSlot='table'+i;decorPage=0;},{paint:false});}
    }
    function drawFurnishing(shop,editing=false){
      const equipped=state.decorEquipped[shop],offset=editing?decorOffset():0;
      if(equipped.rug!=='none')art('decoRug',110,H*.60-64+offset,170,64);
      for(const slot of ['left','right']){
        const x=slot==='left'?38:352,y=H*.36+offset,id=equipped[slot],d=World.DECOR.find(d=>d.id===id);
        if(d)art(d.frame,x-33,y-96,66,96);
        else if(editing&&selectedSlot!=='counter'){artPlate('secondary',x-26,y-56,52,38);text('+',x,y-37,22,'#627d62','center');}
        if(editing&&selectedSlot!=='counter'){if(selectedSlot===slot){ctx.strokeStyle='#edcf8b';ctx.lineWidth=1.4;ctx.strokeRect(x-33,y-96,66,96);}button('decor-slot-'+slot,slot==='left'?'左侧装饰位':'右侧装饰位',x-33,y-96,66,96,()=>{selectedSlot=slot;decorPage=0;},{paint:false});}
      }
      const cy=(shop===0?H*.792:H*.756)+offset,ch=shop===0?H*.074:H*.163,id=equipped.counter;
      if(id!=='default'){const a=artSource(World.DECOR.find(d=>d.id===id).frame);if(a)ctx.drawImage(a.img,a.sx,a.sy,a.sw,a.sh,0,cy,W,ch);}
      if(editing){
        button('decor-slot-counter','柜台正面',10,cy+3,W-20,Math.max(44,ch-6),()=>{selectedSlot='counter';decorPage=0;},{paint:false});
        if(selectedSlot==='counter'){ctx.strokeStyle='#f2d798';ctx.lineWidth=1.5;ctx.strokeRect(8,cy+2,W-16,ch-4);}
        const ry=H*.60-64+offset;
        if(selectedSlot!=='counter'){if(equipped.rug==='none'){artPlate('secondary',157,ry+22,76,31);text('地毯位',195,ry+38,10,INK,'center');}
        button('decor-slot-rug','地毯位',110,ry,170,64,()=>{selectedSlot='rug';decorPage=0;},{paint:false});}
      }
    }
    function startService(practice=false){
      if(!practice&&selectedShop>0&&!state.guide.lessons[selectedShop]){beginGuide(selectedShop,false);return;}
      selectedActivity=Growth.activity(selectedActivity,state.shops[selectedShop].level||1).id;
      const cost=Energy.cost(state,selectedActivity,practice);Energy.sync(state);
      if(!practice&&state.energy<cost){openEnergy();say('体力不足，补给或免费练手后再来');persist();return;}
      if(practice&&selectedShop>0&&!state.shops[selectedShop].level){say('先开张本店，再来练手');return;}
      if(!practice&&!state.shops[selectedShop].level){const r=C.upgrade(state,selectedShop);if(!r.ok){say(r.message);return;}}
      const paid=Energy.spend(state,cost);if(!paid.ok){openEnergy();return;}
      service=S.start({menu:Catalog.menu(state,selectedShop),districts:state.districts,practice,activity:selectedActivity,recipeXP:state.recipeXP,guestVisits:state.guestVisits,shop:selectedShop,district:state.district,level:state.shops[selectedShop].level||1,round:state.bestByShop[selectedShop]>=2?state.serviceByShop[selectedShop]:0,...World.buffs(state,selectedShop)});
      service.day=state.serviceByShop[selectedShop]+1;service.energyCost=cost;
      serviceResult=null;serviceFX=[];effects=[];toast=null;screen='service';modal=null;tick=Date.now();S.step(service,.1);persist();
    }
    function finishService(){
      if(service.tutorial&&service.served<service.total){skipGuide();return;}
      const result=S.settle(service);if(!result)return;state.activeSession=null;
      if(service.festivalRun){const a=Events.settle(state,service.festivalRun,result);if(!a)return;serviceResult={...C.awardService(state,result,service.shop),festival:a};Events.invite(state);modal='festival-result';}
      else if(service.rainRun){const a=Events.settleRain(state,service.rainRun,result);if(!a)return;serviceResult={...C.awardService(state,{...result,silver:a.silver,fame:a.fame,sideStory:true},service.shop),rain:a};modal='rain-result';}
      else{serviceResult=C.awardService(state,result,service.shop);if(service.tutorial){serviceResult.guideGift=Guide.complete(state,service.shop,service.guideReplay);guideFlow=null;}else if(!service.practice)Events.invite(state);modal='service-result';}
      persist();chime('upgrade');
    }
    function needleHome(){state.activeTrade='needlework';state.district=0;screen='needle-lobby';close();persist();}
    function needleMap(){state.activeTrade='needlework';screen='game';close();focusStreetHome();persist();}
    function focusStreetHome(){const v=streetViewport();if(state.activeTrade==='needlework'&&state.district===0){streetCamera.x=Needle.POSITION.x-v.w/(2*streetCamera.zoom);streetCamera.y=Needle.POSITION.y-v.h/(2*streetCamera.zoom);streetCamera.region=0;Street.stop(streetCamera);Street.constrain(streetCamera,v);}else Street.focus(streetCamera,v,state.district);}
    function startNeedle(mode='simple',practice=false,tutorial=false){
      const n=state.needlework;if(n.run?.finished&&!n.run.settled){settleNeedle();return;}if(n.run&&!n.run.finished){screen='needlework';close();tick=Date.now();persist();return;}
      if(!n.tutorialDone&&!practice)tutorial=true;
      if(n.tutorialDone&&!n.businessGuideDone&&!practice&&!tutorial&&mode!=='repair'){needleMode=mode;open('needle-business-guide');return;}
      const m=Needle.mode(mode);if(n.level<m.level){say('绣坊'+m.level+'级后可接这一类绣单');return;}
      Energy.sync(state);const free=practice||tutorial,cost=free?0:m.energy;if(state.energy<cost){energyReturn='needle-brief';open('energy');say('体力不足，歇一会儿或领取补给');return;}
      const r=Needle.start(state,{mode,practice,tutorial});if(!r.ok){if(r.supply){needleSupplyMode=mode;open('needle-supply');}say(r.message);return;}
      Energy.spend(state,cost);screen='needlework';close();needleMode=m.id;tick=Date.now();persist();chime('tap');
    }
    function settleNeedle(){const r=Needle.settle(state);if(!r)return;persist();open(r.grand?'needle-grand-story':'needle-result');chime('upgrade');}
    function openNeedleSupply(){needleSupplyMode=Needle.recommend(state);open('needle-supply');}
    function openTea(){if(!state.needlework.teaUnlocked){say(Needle.goal(state));return;}state.activeTrade='shops';selectedShop=0;screen='game';open('shop');persist();}

    function needleAction(fn){const run=state.needlework.run,before=run?.stitched||0,r=fn();if(r.ok&&run===state.needlework.run&&run?.stitched>before)queueNeedleMotion(run,before);if(!r.ok)say(r.message);else{if(r.message)say(r.message);chime(r.perfect?'brew-perfect':'tap');persist();}if(state.needlework.run?.finished)settleNeedle();}
    function needleCraftLayout(){const palette=H-bottom-147,top=safe+(state.needlework.run?.active?215:state.needlework.run?.tutorial?250:274),size=Math.max(144,Math.min(344,palette-top-34)),y=top+Math.max(0,(palette-top-size-34)*.30);return{size,x:(W-size)/2,y,cx:195,cy:y+size*.455,f:size/300,palette};}
    function needleBackdrop(){cover(images.needleScene,0,0,W,H);ctx.fillStyle=gradient(0,150+safe,'#69444edb','#69444e00');ctx.fillRect(0,0,W,150+safe);ctx.fillStyle=gradient(H-280,280,'#2e271500','#5e3c469e');ctx.fillRect(0,H-280,W,280);}
    function drawNeedleLobby(){
      needleBackdrop();drawHUD();const n=state.needlework,y=H-bottom-254,m=Needle.mode(Needle.recommend(state));
      artPlate('ribbon',66,safe+126,258,42);quietLabel('楚绣坊 · 一针一线',66,safe+126,14,258,42,'#fff2d8');
      artPlate('scroll',24,y,342,60,true);text('绣坊 '+n.level+' 级',55,y+23,16,INK,'left',true);fitText('库房 '+n.stock.cloth+'绢 / '+n.stock.thread+'线 · 交付 '+n.delivered+'件',55,y+45,11,193,'#786a51');
      button('needle-book','绣样册',264,y+13,78,36,()=>{needlePage=0;open('needle-book');},{type:'outline',size:12});
      const teaPending=n.teaUnlocked&&!state.shops[0].level&&!(n.run&&!n.run.finished);const expand=n.tutorialDone&&n.level<6&&!Needle.upgradeRequirement(state)&&state.silver>=Needle.COSTS[n.level]&&!(n.run&&!n.run.finished);
      rect(24,y+67,342,29,14,'#69434dda');fitText(teaPending?'现在可开茶铺 · 绣坊保留，继续升级':expand?'绣作已达标 · 点下方扩建，学新手艺':Needle.goal(state),195,y+82,11,316,'#fff1ce','center',true);
      const active=n.run&&!n.run.finished,label=active?'接着上次的绣单':!n.tutorialDone?'绣第一方帕':(m.id==='grand'?'花朝成衣大单':'正式营业')+' · '+m.energy+'体力';
      if(teaPending)button('needle-tea','开茶铺 · '+Needle.TEA_PRICE+'两',24,y+104,280,43,openTea,{type:'gold',size:17});else button('needle-open',label,24,y+104,280,43,()=>startNeedle(m.id),{type:'gold',size:17});
      button('needle-contracts','接单册',314,y+104,52,43,()=>open('needle-brief'),{paint:false});art('orders',324,y+104,32,31);text('接单册',340,y+141,10,'#fff0dc','center',true);
      button('needle-supply','进货',24,y+161,98,36,openNeedleSupply,{type:'outline',size:13});
      button('needle-upgrade',n.level>=6?'已满级':'扩建'+Needle.COSTS[n.level]+'两',135,y+161,120,36,()=>needleAction(()=>Needle.upgrade(state)),{type:'outline',size:12,disabled:n.level>=6});
      button('needle-street','逛商街',268,y+161,98,36,needleMap,{type:'outline',size:13});
      if(!modal&&(teaPending||expand)){const target=hits.find(b=>b.id===(teaPending?'needle-tea':'needle-upgrade'));if(target)circleGuide(target,Date.now(),false,teaPending?'open-tea':'expansion');}
      if(teaPending){button('needle-open','继续绣坊营业',26,H-bottom-43,338,31,()=>startNeedle(m.id),{paint:false});text('先经营绣坊也可以 · 荷包、成衣照常解锁',195,H-bottom-28,11,'#f2dfbb','center');}
      else if(n.teaUnlocked){button('needle-tea',state.shops[0].level?'去茶铺经营':'筹开茶铺 · '+Needle.TEA_PRICE+'两',26,H-bottom-43,338,31,openTea,{paint:false});text(state.shops[0].level?'去茶铺，也可继续经营绣坊':'首轮绣单已成 · 绣坊与茶铺可以一起经营',195,H-bottom-28,11,'#f2dfbb','center');}
      else text('首轮绣帕 → 开茶铺 · 双店一起经营',195,H-bottom-28,11,'#f2dfbb','center');
    }

    function needleCursor(x,y,color,pin=true){
      if(pin)art('stitchPin',x-6,y-6,12,12);ctx.save();ctx.beginPath();ctx.moveTo(x-4,y+2);ctx.lineTo(x+1,y+5);ctx.lineTo(x+50,y-42);ctx.lineTo(x+44,y-49);ctx.closePath();ctx.clip();art('sewingNeedle',x-3,y-46,65,49);ctx.restore();
      ctx.save();ctx.lineCap='round';ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+43,y-42);ctx.bezierCurveTo(x+69,y-36,x+62,y-16,x+48,y-14);ctx.quadraticCurveTo(x+43,y-12,x+47,y-7);ctx.stroke();ctx.restore();
    }
    function queueNeedleMotion(r,from){
      if(reduced())return;const now=Date.now();if(!needleMotion||needleMotion.run!==r||needleMotion.order!==r.active)needleMotion={run:r,order:r.active,queue:[],pausedAt:null};
      let start=Math.max(now,needleMotion.queue[needleMotion.queue.length-1]?.end||0);for(let i=from;i<r.stitched;i++){needleMotion.queue.push({index:i,start,end:start+600});start+=600;}
      const waiting=needleMotion.queue.filter(e=>e.end>now);if(waiting.length>2){let end=waiting[0].end;const duration=Math.max(120,480/(waiting.length-1));for(const e of waiting.slice(1)){e.start=end;e.end=end+duration;end=e.end;}}
    }
    function needleMotionFrame(r,now){
      const m=needleMotion;if(!m||m.run!==r||m.order!==r.active||reduced()){needleMotion=null;return{completed:r.stitched,active:null};}
      if(modal||hidden){if(m.pausedAt===null)m.pausedAt=now;}else if(m.pausedAt!==null){const dt=now-m.pausedAt;for(const e of m.queue){e.start+=dt;e.end+=dt;}m.pausedAt=null;}
      const stamp=m.pausedAt??now,pending=m.queue.filter(e=>e.end>stamp),e=pending[0];if(!e){needleMotion=null;return{completed:r.stitched,active:null};}
      return{completed:e.index,active:e.index,progress:Math.max(0,Math.min(1,(stamp-e.start)/(e.end-e.start))),pending:pending.length};
    }
    function movingNeedle(g,r,l,v){
      if(v.active===null)return;const p=Needle.nodes(g.id)[v.active],x=l.cx+p.x*l.f,y=l.cy+p.y*l.f,t=v.progress,color=Needle.THREADS[r.selectedColor??g.color].color;
      const dip=t<.3?t/.3:t<.48?1:Math.max(0,1-(t-.48)/.32),pull=Math.max(0,(t-.58)/.42),lift=(1-dip)*22,dx=pull*31,dy=-lift-pull*13;
      ctx.save();ctx.beginPath();ctx.arc(l.cx,l.cy,94*l.f,0,Math.PI*2);ctx.clip();
      ctx.beginPath();ctx.ellipse(x,y,5+dip*3,1.5+dip,0,0,Math.PI*2);ctx.fillStyle='rgba(90,55,44,'+(Math.sin(t*Math.PI)*.22)+')';ctx.fill();
      const loop=Math.sin(Math.PI*t)*25*(1-pull);ctx.lineCap='round';ctx.strokeStyle='#593e372b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+1);ctx.bezierCurveTo(x-loop,y-loop*.45,x+dx+loop,y+dy-loop,x+dx+12,y+dy-10);ctx.stroke();
      ctx.strokeStyle=color;ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-loop,y-loop*.6,x+dx+loop,y+dy-loop,x+dx+12,y+dy-11);ctx.stroke();
      ctx.globalAlpha=t>.93?(1-t)/.07:1;ctx.translate(x+dx,y+dy);ctx.rotate(-.12+dip*.16);const length=1-dip*.72;ctx.scale(length,length);needleCursor(0,0,color,false);ctx.restore();
    }
    function needlePattern(g,r,l,v){
      const a=Needle.artwork(g.id),x=l.cx-a.width*l.f/2,y=l.cy-a.height*l.f/2;
      art(a.frame,x,y,a.width*l.f,a.height*l.f,.13);
      if(v.completed){ctx.save();if(v.completed<g.stitches){ctx.beginPath();for(const region of a.regions.slice(0,v.completed)){region.forEach((p,i)=>i?ctx.lineTo(l.cx+p[0]*l.f,l.cy+p[1]*l.f):ctx.moveTo(l.cx+p[0]*l.f,l.cy+p[1]*l.f));ctx.closePath();}ctx.clip();}art(a.frame,x,y,a.width*l.f,a.height*l.f);ctx.restore();}
      if(v.active!==null){const region=a.regions[v.active],p=Needle.nodes(g.id)[v.active],px=l.cx+p.x*l.f,py=l.cy+p.y*l.f,max=Math.max(...region.map(q=>Math.hypot(q[0]-p.x,q[1]-p.y)))*l.f,progress=Math.max(0,(v.progress-.23)/.77);ctx.save();ctx.beginPath();region.forEach((q,i)=>i?ctx.lineTo(l.cx+q[0]*l.f,l.cy+q[1]*l.f):ctx.moveTo(l.cx+q[0]*l.f,l.cy+q[1]*l.f));ctx.closePath();ctx.clip();ctx.beginPath();ctx.arc(px,py,max*(1-Math.pow(1-progress,2)),0,Math.PI*2);ctx.clip();art(a.frame,x,y,a.width*l.f,a.height*l.f);ctx.restore();movingNeedle(g,r,l,v);}
      if(env.review)needleReview={good:g.id,frame:a.frame,completed:r.stitched,total:g.stitches,motion:{completed:v.completed,active:v.active,progress:v.progress??1,pending:v.pending??0},bounds:{x,y,w:a.width*l.f,h:a.height*l.f},center:{x:l.cx,y:l.cy},radius:94*l.f,hoop:{x:l.x,y:l.y,w:l.size,h:l.size},hintY:l.y+l.size+14,palette:l.palette,numericMarkers:0,visibleOrders:r.active?1:r.orders.length};
    }
    function drawNeedleWork(now){
      const n=state.needlework,r=n.run;if(!r){needleHome();return;}needleBackdrop();const l=needleCraftLayout();
      text(Needle.NAME+' · '+(r.tutorial?'阿绫的绣作初课':r.practice?'免费练手':Needle.mode(r.mode).name),19,safe+28,19,'#fff1ce','left',true);
      text(r.tutorial?'手艺初课 · 不计时，也不扣体力':Math.ceil(Math.max(0,r.duration-r.elapsed))+'秒 · 已交付 '+r.served+' / '+r.total+' 单',20,safe+54,11,'#eadcbf');
      button('needle-pause',env.demo?'暂歇针线':'暂歇并保存',338,safe+12,40,44,()=>open('needle-pause'),{paint:false});icon('pause',344,safe+20,24);
      artPlate('ribbon',16,safe+68,358,36);art('needleBasket',31,safe+73,30,29);text('绢布 '+r.cloth+'  ·  丝线 '+r.thread,72,safe+87,12,'#fff0d2');icon('coin',252,safe+77,18);text(r.revenue+'两',337,safe+87,13,'#fff0d2','right',true);
      if(!r.active){
        ctx.fillStyle=gradient(safe+101,151,'#92596622','#92596600');ctx.fillRect(0,safe+101,W,151);
        r.orders.forEach((o,i)=>{
          const g=Needle.GOODS[o.good],x=(r.orders.length===1?[195]:r.orders.length===2?[130,260]:[65,195,325])[i],y=safe+114;
          art('needleOrderTag',x-52,y-11,104,120);art(g.frame,x-34,y+4,68,58);
          text(g.name,x,y+70,11,INK,'center',true);text(g.cloth+'绢 '+g.thread+'线 · '+g.price+'两起',x,y+88,9,'#8a6b61','center');
          button('needle-order-'+i,'承接'+g.name,x-54,y-6,108,122,()=>needleAction(()=>Needle.accept(r,i)),{paint:false,disabled:r.phase!=='orders',guidePoint:{x,y:y+33}});
          if(!r.tutorial)button('needle-decline-'+i,'换单',x-30,y+126,60,28,()=>needleAction(()=>Needle.decline(r,i)),{type:'outline',size:9,disabled:r.declines<=0});
        });
      }else{
        const g=Needle.GOODS[r.active.good],by=safe+117;artPlate('scroll',27,by,336,68,true);art(g.frame,40,by+5,64,58);fitText((r.phase==='ready'?'已成件 · ':r.phase==='finish'?'花样已成 · ':'正在绣 · ')+g.name,117,by+22,16,g.garment?220:166,INK,'left',true);const guest=Needle.orderBrief(r,r.active);fitText(g.garment?Needle.FABRICS[g.fabric].name+' · '+Needle.placementNames(g.id)[g.placement]+' · '+Needle.THREADS[g.color].name+'线':guest.name+' · '+guest.occasion+' · '+Needle.THREADS[g.color].name+'线',117,by+47,g.garment?11:10,222,'#8a6b61');if(!g.garment)text(g.price+'两起',334,by+22,10,'#8a6b61','right');
      }
      const choosing=r.active&&['fabric','placement'].includes(r.phase);
      if(choosing){artPlate('scroll',l.x+15,l.y,l.size-30,l.size,true);art(Needle.GOODS[r.active.good].frame,l.x+38,l.y+18,l.size-76,l.size-45);}else art('needleHoop',l.x,l.y,l.size,l.size);
      if(r.active&&!choosing){
        const g=Needle.GOODS[r.active.good],nodes=Needle.nodes(g.id);
        const motion=needleMotionFrame(r,now);needlePattern(g,r,l,motion);
        if(r.phase==='stitch')nodes.forEach((p,i)=>{if(i<r.stitched)return;const x=l.cx+p.x*l.f,y=l.cy+p.y*l.f,active=i===r.stitched;
          if(!active){ctx.beginPath();ctx.arc(x,y,1.25,0,Math.PI*2);ctx.fillStyle='#88795738';ctx.fill();}if(active&&motion.active===null)needleCursor(x,y,Needle.THREADS[r.selectedColor??g.color].color);
          button('needle-stitch-'+i,'第'+(i+1)+'处绣样',x-22,y-22,44,44,()=>needleAction(()=>Needle.stitch(r,i)),{paint:false,disabled:!active});
        });
      }else if(!r.active&&!r.tutorial){text('选一张绣单',195,l.cy-8,17,INK,'center',true);text('绢布和丝线有限，先想好做哪几件',195,l.cy+19,10,FADE,'center');}
      const hints={fabric:'依客意选绢布，绣出衣裳的底色',placement:'将绣纹落在客人指定的部位',orders:r.tutorial?'第一位客人要梅花素帕，点绣单开工':'比较用料与售价，再决定先接哪一单',color:'照客意配线，点对应颜色的线轴',stitch:'循着针尖绣纹样 · 可点按，也可连线',finish:'最后收好线脚，成色才完整',ready:'绣件做好了，亲手交给客人'};
      const hint=toast&&toast.until>now?toast.message:hints[r.phase];ctx.save();ctx.shadowColor='#4e2935';ctx.shadowBlur=4;ctx.shadowOffsetY=1;fitText(hint,195,l.y+l.size+14,11,350,'#fff7e8','center',true);ctx.restore();
      if(r.phase==='fabric'){
        Needle.FABRICS.forEach((c,i)=>{const x=42+i*108;artPlate('scroll',x,l.palette-3,90,83,true);const a=artSource('needleClothSupply'),crop=[[.60,.14,.36,.25],[.61,.43,.36,.22],[.60,.68,.36,.22]][i];if(a){ctx.save();ctx.shadowColor='#795a453d';ctx.shadowBlur=3;ctx.drawImage(a.img,a.sx+a.sw*crop[0],a.sy+a.sh*crop[1],a.sw*crop[2],a.sh*crop[3],x+13,l.palette+6,64,39);ctx.restore();}text(c.name,x+45,l.palette+63,12,INK,'center',true);button('needle-fabric-'+i,c.name,x,l.palette-3,90,83,()=>needleAction(()=>Needle.fabric(r,i)),{paint:false});});
      }else if(r.phase==='placement'){
        Needle.placementNames(r.active.good).forEach((name,i)=>button('needle-place-'+i,'绣在'+name,34+i*112,l.palette+18,98,40,()=>needleAction(()=>Needle.place(r,i)),{type:'outline',size:14}));
      }else if(r.phase==='color'){
        art('needleThreads',51,l.palette-4,288,95);
        Needle.THREADS.forEach((c,i)=>{const x=156+i*41;button('needle-thread-'+i,'选'+c.name+'线',x-22,l.palette-3,44,88,()=>needleAction(()=>Needle.thread(r,i)),{paint:false,guidePoint:{x,y:l.palette+40}});text(c.name,x,l.palette+96,11,'#fff1d4','center',true);});
      }else if(r.phase==='finish')button('needle-finish','收针成件',66,l.palette+15,258,43,()=>needleAction(()=>Needle.finish(r)),{type:'gold',size:17});
      else if(r.phase==='ready')button('needle-deliver','交付绣件 · 收取工钱',48,l.palette+15,294,43,()=>needleAction(()=>Needle.deliver(r)),{type:'gold',size:17});
      else if(!(r.tutorial&&r.phase==='stitch')){art('needleBasket',139,l.palette-8,112,84,.85);text(r.phase==='stitch'?'绣样进度 '+r.stitched+' / '+Needle.GOODS[r.active.good].stitches:'本轮可换单 '+r.declines+' 次',195,l.palette+88,11,'#fff1d4','center');}
      const garment=r.active&&Needle.GOODS[r.active.good].garment,steps=garment?['选布','定纹','配线','绣作','收针','交付']:['配线','绣作','收针','交付'],at=garment?{orders:-1,fabric:0,placement:1,color:2,stitch:3,finish:4,ready:5}[r.phase]:{orders:-1,color:0,stitch:1,finish:2,ready:3}[r.phase];steps.forEach((s,i)=>text((i<=at?'● ':'○ ')+s,27+(i+.5)*336/steps.length,H-bottom-23,10,i===at?'#ffe4a0':'#ead9b8','center',i===at));
    }
    function needleGuideOverlay(now){
      const r=state.needlework.run;if(!r?.tutorial||modal)return;const l=needleCraftLayout(),phase=r.phase,all=hits.slice(),id=phase==='orders'?'needle-order-0':phase==='color'?'needle-thread-0':phase==='stitch'?'needle-stitch-'+r.stitched:phase==='finish'?'needle-finish':'needle-deliver',target=all.find(b=>b.id===id),welcome=!r.guideStarted;
      ctx.save();if(welcome){ctx.fillStyle='#633c465e';ctx.fillRect(0,0,W,H);}ctx.restore();if(!welcome&&target)circleGuide(target,now,true);hits=all.filter(b=>b.id==='needle-pause'||!welcome&&b.id===id);
      const lower=!welcome&&phase==='stitch',centered=!welcome&&phase==='orders',x=welcome?44:39,y=welcome?l.cy-94:lower?l.palette-1:centered?l.cy-33:safe+188,w=welcome?302:312,h=welcome?192:lower?86:centered?74:57;artPlate('scroll',x,y,w,h,true);
      const titles={orders:'先认绣单，再接客',color:'照客意，配藕粉丝线',stitch:'跟着针尖，把花样绣出来',finish:'花样已成，最后收好线脚',ready:'交给客人，收下第一笔工钱'};
      text(welcome?'阿绫带你做第一笔生意':titles[phase],x+38,y+(welcome?42:lower?31:centered?27:20),welcome?15:12,INK,'left',true);
      if(welcome){lines('认绣样 → 配丝线 → 落针 → 收针 → 交付。\n第一单不计时，也不扣体力。\n跟着圈圈，亲手做一方梅花帕。',x+38,y+70,w-76,11,INK,21,3);button('needle-guide-begin','跟阿绫动手绣',x+28,y+132,w-56,33,()=>{r.guideStarted=true;persist();},{type:'gold',size:13});circleGuide(hits.find(b=>b.id==='needle-guide-begin'),now);}
      else{const copy={orders:'点圈内的梅花素帕，开始你的第一单。',color:'点圈内的粉色线轴，配好这方帕的丝线。',stitch:'点圈内针尖，也可按住依次划过。',finish:'点圈内“收针成件”，让针脚完整。',ready:'点圈内“交付绣件”，收下工钱与绣料。'};fitText(copy[phase],x+38,y+(lower?59:centered?50:40),10,w-76,FADE);if(target&&phase!=='stitch'){guideHand(target,now);}}
    }
    function needleBusinessGuide(){const m=Needle.mode(needleMode),b=sheet('从手艺初课，到自己的生意','阿绫 · 正式开张前，先把本钱算明白。',550);const parts=[['needleClothSupply','先备绢线','本场备'+m.cloth+'绢、'+m.thread+'线。\n余料留在库房，下次接着用。'],['energySnack','再花体力','本场耗'+m.energy+'体力。\n每分钟恢复1点，上限200点。'],['needleGood18','交付才入账','首轮交付5方绣帕，可开茶铺。\n绣坊仍可继续升级。']];parts.forEach(([frame,title,line],i)=>{const y=b.y+8+i*111;art(frame,b.x,y,76,82);text(title,b.x+94,y+15,17,INK,'left',true);lines(line,b.x+94,y+43,b.w-94,11,FADE,20,2);});button('needle-business-start','明白了 · 正式营业'+m.energy+'体力',b.x,b.bottom-41,b.w,39,()=>{state.needlework.businessGuideDone=true;persist();startNeedle(m.id);},{type:'gold',size:14});circleGuide(hits.find(b=>b.id==='needle-business-start'),Date.now(),false,'business');}
    function needleBrief(){
      const n=state.needlework,b=sheet('楚绣坊 · 接单册','正式营业耗体力与绣料，练手请到设置中的初课。',570);
      Needle.MODES.forEach((m,i)=>{const y=b.y+5+i*103,locked=n.level<m.level;art('needleOrderTag',b.x-4,y-10,80,96,locked?.4:1);art(Needle.GOODS[i===0?0:i===1?3:13].frame,b.x+7,y+3,57,60,locked?.4:1);text(m.name,b.x+84,y+16,17,INK,'left',true);text(locked?'绣坊'+m.level+'级解锁':m.energy+'体力 · 备'+m.cloth+'绢 / '+m.thread+'线',b.x+84,y+45,11,FADE);button('needle-mode-'+m.id,locked?'待解锁':'接单',b.x+b.w-69,y+13,69,39,()=>startNeedle(m.id),{type:i===0?'gold':'outline',size:13,disabled:locked});});
      text('现有绣料 '+n.stock.cloth+'绢 / '+n.stock.thread+'线',195,b.y+324,12,TEAL,'center');
      if(Needle.grandReady(state))button('needle-mode-grand','花朝成衣大单 · 28体力',b.x,b.bottom-98,b.w,36,()=>startNeedle('grand'),{type:'gold',size:14});
      else fitText('成衣做满3件、升至五级后，承接花朝大单',195,b.bottom-80,11,b.w,FADE,'center');
      button('needle-brief-back','回绣坊',b.x,b.bottom-33,b.w,31,needleHome,{type:'outline',size:13});
    }
    function needleBook(){
      const b=sheet('楚儿的绣样册','30款绣作 · 花鸟果实、月兔山水各有绣意',610),n=state.needlework,families=['绣帕','荷包','衣裳','团扇','绣屏'],list=Needle.GOODS.slice().sort((a,b)=>families.indexOf(a.family)-families.indexOf(b.family)||a.level-b.level||a.id-b.id),pages=Math.ceil(list.length/6);
      list.slice(needlePage*6,needlePage*6+6).forEach((g,i)=>{const x=b.x+(i%2)*151,y=b.y+18+Math.floor(i/2)*143,owned=g.level<=n.level&&(!g.signature||Needle.grandReady(state)||n.grandDone);art(g.frame,x+18,y,108,91,owned?1:.35);text(g.name,x+71,y+110,13,INK,'center',true);text(g.signature?'花朝成衣大单':owned?g.price+'两起 · '+g.stitches+'段绣作':'绣坊'+g.level+'级解锁',x+71,y+132,10,FADE,'center');if(!owned)icon('lock',x+108,y+66,19);});
      button('needle-book-prev','上一页',b.x,b.bottom-37,94,33,()=>needlePage=Math.max(0,needlePage-1),{type:'outline',size:12,disabled:needlePage===0});text((needlePage+1)+' / '+pages,195,b.bottom-21,11,FADE,'center');button('needle-book-next','下一页',b.x+b.w-94,b.bottom-37,94,33,()=>needlePage=Math.min(pages-1,needlePage+1),{type:'outline',size:12,disabled:needlePage===pages-1});
    }
    function needleWelcome(){const b=sheet('先靠一针一线，养活自己','阿绫 · 从绣帕，到荷包，再学做一身衣裳。',470);art('needleBasket',120,b.y+4,150,123);lines('先看客人要的绣样，再选线、落针、收针。\n第一方帕不花体力，也没有催促。\n往后进绣料、接绣单、扩绣坊，\n做完一轮绣帕小单，就能筹开茶铺。',b.x+8,b.y+154,b.w-16,14,INK,26,4);button('needle-guide-start','绣好第一方帕',b.x,b.bottom-50,b.w,42,()=>startNeedle('simple',false,true),{type:'gold',size:17});}
    function needleSupply(){
      const n=state.needlework,m=Needle.mode(needleSupplyMode),q=Needle.shortage(state,m.id),b=sheet('绢线铺 · 采买绣料','绢布3两一匹 · 丝线2两一束 · 用不完的留到下场',610);
      text('手头 '+currency(state.silver)+'两 · 库房 '+n.stock.cloth+'绢 / '+n.stock.thread+'线',195,b.y+10,13,TEAL,'center',true);
      [['cloth','绢布','needleClothSupply',3,18],['thread','丝线','needleThreadSupply',2,24]].forEach(([id,name,frame,small,pack],i)=>{const y=b.y+39+i*132;art(frame,b.x-4,y,112,104);text(name,b.x+125,y+15,17,INK,'left',true);button('needle-buy-'+id+'-one','1份'+small+'两',b.x+121,y+49,80,35,()=>needleAction(()=>Needle.restock(state,id,true)),{type:'outline',size:12});button('needle-buy-'+id+'-pack',(id==='cloth'?6:12)+'份'+pack+'两',b.x+214,y+49,82,35,()=>needleAction(()=>Needle.restock(state,id)),{type:'outline',size:12});});
      text(m.name+' · 需备 '+m.cloth+'绢 / '+m.thread+'线',195,b.y+315,13,INK,'center',true);text(q.price?'还缺 '+q.cloth+'绢 / '+q.thread+'线 · 合计 '+q.price+'两':'本场绣料已经备齐',195,b.y+343,12,FADE,'center');
      button('needle-prepare-start',(q.price?'补齐并营业 · '+q.price+'两 + ':'开始营业 · ')+m.energy+'体力',b.x,b.bottom-139,b.w,41,()=>{Energy.sync(state);if(state.energy<m.energy){openEnergy();return;}const r=Needle.prepare(state,m.id);if(!r.ok){say(r.message);return;}persist();startNeedle(m.id);},{type:'gold',size:14});
      if(Needle.repairAvailable(state))button('needle-repair','接街坊来料零活 · 2体力挣8两',b.x,b.bottom-83,b.w,34,()=>startNeedle('repair'),{type:'outline',size:12});
      else button('needle-supply-small','先接绣帕小单 · 8体力',b.x,b.bottom-83,b.w,34,()=>{needleSupplyMode='simple';if(!Needle.shortage(state,'simple').price)startNeedle('simple');},{type:'outline',size:12});
      button('needle-supply-back','回绣坊',b.x,b.bottom-35,b.w,31,needleHome,{type:'outline',size:12});
    }
    function needleWardrobe(){
      const n=state.needlework,b=sheet('一针一线，绣成我的衣裳','亲手交付成衣，解锁同款掌柜头像。',630);
      Needle.WARDROBE.forEach((id,i)=>{const g=Needle.GOODS[id],owned=n.wardrobe.includes(id),y=b.y+6+i*143;art(g.frame,b.x-4,y,90,119,owned?1:.38);outfitCircle(i,b.x+97,y+3,63,owned?1:.4);text(g.name,b.x+173,y+16,15,INK,'left',true);text(owned?'绣成了，便也是你的':id===17?'完成合格花朝大单':'正式交付同款衣裳',b.x+173,y+41,10,FADE);button('needle-wear-'+id,n.wearing===id?'正在使用':owned?'换作掌柜头像':'待解锁',b.x+98,y+86,b.w-98,34,()=>needleAction(()=>Needle.wear(state,id)),{type:n.wearing===id?'gold':'outline',size:12,disabled:!owned});});
      button('needle-wear-original','换回成长头像',b.x,b.bottom-38,b.w,34,()=>needleAction(()=>Needle.wear(state,null)),{type:'outline',size:13});
    }
    function needleGrandStory(){const b=sheet('一袭凤羽，绣来新的门路','柳娘子 · 花朝大单已交付',570);art('needleGood17',b.x,b.y,137,226);lines(state.shops[0].level?'“这针法倒像魏宫旧样……你那间茶铺来往客商不少，不妨向他们打听。绣坊这边，我也会替你留心。”':'“这针法倒像魏宫旧样……你若想打听旧人，不妨在河畔开间茶铺。来往的客商，总有些消息。”',b.x+152,b.y+32,b.w-152,14,INK,25,7);text('大单酬谢 +300两，已随工钱入账',195,b.y+263,13,TEAL,'center',true);text('凤羽礼衣同款头像，已收入衣橱',195,b.y+292,11,FADE,'center');text(state.shops[0].level?'茶铺照常营业 · 绣坊继续接成衣大单':'筹开茶铺需 '+Needle.TEA_PRICE+'两 · 现有 '+currency(state.silver)+'两',195,b.y+328,12,INK,'center');button('needle-grand-tea',state.shops[0].level?'去茶铺，问问旧纹样':'筹开自己的茶铺',b.x,b.bottom-93,b.w,40,openTea,{type:'gold',size:16});button('needle-grand-home','先收好账，继续绣坊',b.x,b.bottom-38,b.w,34,needleHome,{type:'outline',size:12});}
    function needleResult(){const n=state.needlework,r=n.last||{},b=sheet(r.practice?'针线记在手里':r.tutorial&&r.served?'第一方帕，换来自己的工钱':'今日绣作，件件有回响',r.practice?'练手不扣体力，也不增加银两或进度':'楚绣坊 · 今日收好账',550);art((r.served?Needle.GOODS[r.good??0].frame:'needleBasket'),134,b.y,122,108);text('交付 '+r.served+' 件 · 精巧 '+r.perfect+' 件',195,b.y+134,16,INK,'center',true);text('入账 +'+(r.silver||0)+'两 · 声望 +'+(r.fame||0),195,b.y+168,18,TEAL,'center',true);text(r.gift?'初课谢礼40两，另赠8绢12线作为本钱':'用料成本 '+(r.cost||0)+'两 · 本场净赚 '+(r.profit||0)+'两',195,b.y+204,12,FADE,'center');text(r.gift?'正式营业每场消耗体力，并使用库房绣料':'未用绣料已退回库房，下回接着用',195,b.y+231,11,FADE,'center');fitText(Needle.goal(state),195,b.y+264,11,b.w,TEAL,'center');
      button('needle-result-home',r.tutorial&&r.served?'正式营业 · 8体力':r.teaOpened&&!state.shops[0].level?'开茶铺 · '+Needle.TEA_PRICE+'两':'回绣坊 · 进货与扩建',b.x,b.bottom-98,b.w,42,r.tutorial&&r.served?()=>startNeedle('simple'):r.teaOpened&&!state.shops[0].level?openTea:needleHome,{type:'gold',size:16});button('needle-again',r.tutorial?'先看看绣坊':r.teaOpened?'先回绣坊，继续经营':'再接一轮绣单',b.x,b.bottom-43,b.w,36,r.tutorial||r.teaOpened?needleHome:()=>startNeedle(Needle.recommend(state)),{type:'outline',size:14});}

    function needleTrace(x,y,previous){const r=state.needlework.run;if(screen!=='needlework'||modal||r?.phase!=='stitch')return;const l=needleCraftLayout(),before=r.stitched;let changed=false;for(let k=0;k<(previous?12:1)&&r.phase==='stitch';k++){const p=Needle.nodes(r.active.good)[r.stitched],tx=l.cx+p.x*l.f,ty=l.cy+p.y*l.f,a=previous||{x,y},dx=x-a.x,dy=y-a.y,t=dx*dx+dy*dy?Math.max(0,Math.min(1,((tx-a.x)*dx+(ty-a.y)*dy)/(dx*dx+dy*dy))):0,d=Math.hypot(a.x+t*dx-tx,a.y+t*dy-ty);if(d>Needle.radius(r.active.good,l.f))break;Needle.stitch(r,r.stitched);changed=true;}if(changed){queueNeedleMotion(r,before);chime('tap');persist();draw(Date.now());}else if(!previous&&!r.tutorial){const wrong=Needle.nodes(r.active.good).findIndex((p,i)=>i>r.stitched&&Math.hypot(l.cx+p.x*l.f-x,l.cy+p.y*l.f-y)<=18);if(wrong>=0)needleAction(()=>Needle.stitch(r,wrong));}}

    function serviceLayout(){
      const tableY=Math.max(282,H*.414),counterY=H*.70;
      return{tableY,counterY,stationY:Math.min(counterY+8,H-bottom-228),recipeY:H-bottom-(service?.tutorial?148:124),trayY:Math.max(tableY+68,Math.min(counterY-85,H-bottom-322)),xs:[58,195,332]};
    }
    function drawService(now){
      const l=serviceLayout(),s=service;roomBackdrop(s.shop);drawFurnishing(s.shop);if(s.rain){ctx.fillStyle="#18374f33";ctx.fillRect(0,0,W,H);rainWeather(now);}
      ctx.fillStyle=gradient(0,130+safe,'#77515bd9','#77515b00');ctx.fillRect(0,0,W,130+safe);
      text(S.MODES[s.shop].name,21,safe+28,21,'#fff0cc','left',true);
      text(`第${s.day}日 · ${s.tutorial?'阿绫的手艺初课':s.rain?'雨夜神秘客':s.festivalRun?'百盏宴 · '+Events.CHAPTERS[state.festival.active?.chapter||0].name:s.practice?'免费练手':Growth.activity(s.activity,s.level).name}`+(s.activity==='artisan'?` · 上佳${s.perfectDelivered}/8`:s.activity==='rush'?` · 离客${s.lost}/1`:''),21,safe+55,10,'#e1d5b7');
      const remaining=Math.max(0,Math.ceil(s.duration-s.elapsed));
      icon('timer',239,safe+15,24);
      text(s.tutorial?'初课':`${remaining}`,286,safe+31,28,remaining<=10?'#f8b18b':'#fff0cd','center',true);text(s.tutorial?'':'秒',308,safe+37,10,'#e6d5ad');
      button('service-pause','暂停营业',333,safe+11,43,45,()=>open('service-pause'),{paint:false});icon('pause',341,safe+18,29);
      artPlate('ribbon',20,safe+73,350,43);
      icon('coin',45,safe+83,22);text(s.revenue,76,safe+95,14,'#fff0cc','left',true);
      icon('partners',158,safe+82,24);text(`${s.served}/${s.goals.served}`,187,safe+95,12,'#fff0cc');
      icon(s.combo>1?'star':'fame',268,safe+83,21);text(s.combo>1?`${s.combo}连单`:`${s.goals.revenue}两`,341,safe+95,12,'#fff0cc','right',s.combo>1);
      s.guests.forEach((g,i)=>{
        const x=l.xs[i];
        if(!g){drawTable(s.shop,i);return;}
        if(s.rain)art(Events.PEOPLE[s.rain.npc].frame,x-48,l.tableY-113,96,160);else guestSprite(g.kind,x,l.tableY+22,H<740?91:103);
        drawTable(s.shop,i);
        const yy=Math.max(safe+116,l.tableY-185),urgent=g.patience<8;
        artPlate('orderFan',x-53,yy-3,106,70);
        if(s.rain)text('听客意',x,yy+24,15,TEAL,'center',true);else g.need.forEach((id,j)=>foodSprite(id,x+(j-(g.need.length-1)/2)*32,yy+24,37));
        if(urgent){text('催',x+36,yy+45,10,'#a3563b','center',true);}
        const py=Math.min(yy+72,l.tableY-(H<740?104:118));
        rect(x-41,py,82,4,2,'#fff8e9aa');rect(x-41,py,82*Math.max(0,g.patience/g.maxPatience),4,2,urgent?'#c46c52':'#74957c');
        button('guest-'+i,'给'+g.name+'送餐',x-54,yy-4,108,l.tableY-yy+50,()=>{
          const r=S.serve(s,i);if(r.ok){serviceFX=[{message:r.qualityBonus?`好手艺！+${r.earned}两`:r.complete?`好评 +${r.earned}两`:`上货 +${r.earned}两`,x,y:l.tableY-150,start:now}];chime(r.complete?'coin':'tap');}else say(r.message);
        },{paint:false,guideFocus:{x:x-36,y:l.tableY-84,w:72,h:90},guidePoint:{x,y:l.tableY-40}});
      });
      // The tray sits between the tables and the worktop, so it never covers customers.
      const trayY=l.trayY;
      art('tray',76,trayY-31,238,93);
      if(!s.tray.length){ctx.strokeStyle='#c0a57355';ctx.lineWidth=1;for(const tx of [165,225]){ctx.beginPath();ctx.ellipse(tx,trayY+17,17,10,0,0,Math.PI*2);ctx.stroke();}}
      s.tray.forEach((id,i)=>{const x=165+i*60;if(s.selected===i){ctx.beginPath();ctx.arc(x,trayY+14,25,0,Math.PI*2);ctx.strokeStyle='#f5d797';ctx.lineWidth=1.6;ctx.stroke();}foodSprite(id,x,trayY+12,49);if(s.trayQuality[i]==='perfect')art('star',x+13,trayY-11,15,15);button('tray-'+i,'选择'+S.RECIPES[id].name,x-26,trayY-12,52,52,()=>S.select(s,i),{paint:false});});
      s.stations.forEach((st,i)=>{
        const x=[70,195,320][i],y=l.stationY;
        const ready=st.phase==='ready',steeping=st.phase==='steeping',finishing=st.phase==='finishing';
        const hot=st.food!==null,prop=st.type==='tea'?(hot?'kettleHot':'kettleIdle'):st.type==='mix'?(hot?'mortarReady':'mortarIdle'):st.type==='press'?'incensePress':st.type==='oven'?(ready?'ovenReady':'ovenIdle'):(ready?'steamerOpen':'steamerIdle');
        if(st.locked){art(prop,x-45,y-39,90,100,.28);icon('lock',x-15,y+1,30);text(C.SHOPS[s.shop].short+'3级',x,y+63,9,'#f6e4bd','center');}
        else if(st.food!==null){
          const perfect=ready&&st.quality==='perfect',age=s.elapsed-(st.finishedAt||0);
          if(perfect&&age<.8&&!reduced()){ctx.beginPath();ctx.arc(x,y+11,26+age*15,0,Math.PI*2);ctx.strokeStyle=`rgba(255,226,143,${1-age/.8})`;ctx.lineWidth=2;ctx.stroke();}
          art(prop,x-53,y-45,106,107);
          if(hot&&!reduced()){ctx.save();ctx.strokeStyle='#fff8df80';ctx.lineWidth=1.2;for(let j=0;j<2;j++){const drift=Math.sin(s.elapsed*2+j)*4;ctx.beginPath();ctx.moveTo(x-5+j*12,y-34);ctx.bezierCurveTo(x+drift-12+j*12,y-43,x+drift+12+j*12,y-51,x+j*12,y-62);ctx.stroke();}ctx.restore();}
          if(ready){foodSprite(st.food,x+27,y+27,38);art('arrow',x-43,y-15,18,18);}
          if(st.phase==='cooking'){rect(x-35,y+43,70,4,2,'#34251c77');rect(x-35,y+43,70*(1-st.left/st.total),4,2,'#e7cb8e');text(`${st.type==='tea'?'沏茶':'制作'}中 ${st.left.toFixed(1)}秒`,x,y+59,10,'#fff2d6','center');}
          else if(finishing){art('arrow',x-35,y-17,20,20);text('需'+(S.RECIPES[st.food].choices||S.MODES[s.shop].choices)[S.RECIPES[st.food].finish],x,y+58,10,'#ffe2a6','center',true);text(S.RECIPES[st.food].finishAction|| (s.shop===1?'点击选香调和':'点击选模压花'),x,y+73,9,'#fff0cc','center');}
          else if(steeping){
            const p=S.heat(st),h=S.HEAT,bx=x-43,by=y+38,bw=86;
            artPlate('secondary',bx-5,by-7,bw+10,25);rect(bx,by,bw,10,3,'#a97150');
            rect(bx+bw*h.goodStart,by,bw*(h.goodEnd-h.goodStart),10,0,'#74aa86');rect(bx+bw*h.perfectStart,by,bw*(h.perfectEnd-h.perfectStart),10,0,'#f3d375');
            ctx.beginPath();ctx.moveTo(bx+bw*p,by-4);ctx.lineTo(bx+bw*p-4,by-10);ctx.lineTo(bx+bw*p+4,by-10);ctx.closePath();ctx.fillStyle='#fff9e7';ctx.fill();
            ctx.strokeStyle='#fff9e7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(bx+bw*p,by-2);ctx.lineTo(bx+bw*p,by+12);ctx.stroke();
            text('看准火候 · 点此起壶',x,y+66,10,'#fff1bb','center',true);
          }else{text(st.quality?`${S.qualityInfo(s,st.quality,st.food).label} · 取餐`:'点击取餐',x,y+67,9.5,perfect?'#ffdc81':'#fff1bb','center',true);if(st.hold>8)text('快放凉了',x,y-49,10,'#fbd4a5','center');}
        }else{art(prop,x-53,y-45,106,107);text(st.type==='mix'?'调香钵':st.type==='press'?'香印台':st.type==='oven'?'烘炉':st.type==='steam'?'蒸笼':i===0?'茶炉壹':'茶炉贰',x,y+67,10,'#f0ddba','center');}
        button((steeping?'brew-':finishing?'craft-':'pickup-')+i,st.locked?'第二茶炉未解锁':steeping?'看火候起壶':finishing?(S.RECIPES[st.food].finishAction||S.MODES[s.shop].action):ready?'取出'+S.RECIPES[st.food].name:'制作位'+(i+1),x-45,y-18,90,96,()=>{
          if(finishing){s.focusStation=i;chime('tap');}
          else if(steeping){const r=S.brew(s,i);if(r.ok){serviceFX.push({message:r.label+(r.bonus?` +${r.bonus}两`:''),x,y:y-28,start:Date.now()});chime(r.quality==='perfect'?'brew-perfect':r.quality==='good'?'brew-good':'tap');}else say(r.message);}
          else{const food=st.food,r=S.pickup(s,i);if(!r.ok)say(r.message);else{serviceFX.push({food,x,y:y+16,endX:165+(s.tray.length-1)*60,endY:trayY+12,start:Date.now(),flight:true});chime('tap');}}
        },{paint:false,disabled:st.locked,guideFocus:{x:x-46,y:y-40,w:92,h:108},guidePoint:{x,y:y+9}});
      });
      const ry=l.recipeY;
      ctx.fillStyle=gradient(ry-8,H-ry,'#36231800','#281c19de');ctx.fillRect(0,ry-8,W,H-ry+bottom);
      s.menu.map(id=>S.RECIPES[id]).forEach((r,i)=>{const x=[68,195,322][i];
        art('recipeMat',x-50,ry+7,100,57);foodSprite(r.id,x,ry+29,65);if(s.recipeMastery[r.id].level)art('star',x+22,ry+2,17,17);text(r.name,x,ry+79,13,'#fff0cd','center',true);if(!s.tutorial)text(`${s.recipeMastery[r.id].title} · ${(r.seconds*s.recipeMastery[r.id].speed).toFixed(1)}秒 · ${r.price+s.recipeMastery[r.id].priceAdd}两`,x,ry+98,9,'#e6c99d','center');
        button('cook-'+r.id,'制作'+r.name,x-54,ry-8,108,s.tutorial?100:115,()=>{const result=S.cook(s,r.id);if(!result.ok)say(result.message);else chime('tap');},{paint:false,guideFocus:{x:x-45,y:ry+2,w:90,h:65},guidePoint:{x,y:ry+29}});
      });
      drawCraftChoices(s,l,now);if(s.rain)paperNotice(Events.PEOPLE[s.rain.npc].name,s.rain.hint,125,safe+124);
      let hint=s.shop===0?'先点茶点制作，做好后取餐，再点客人送上':'制作后点击工作台，完成配香或压花再取货';
      if(s.stations.some(x=>x.phase==='steeping'))hint='指针进绿色时点茶炉起壶，金色区茶香最佳';
      else if(s.stations.some(x=>x.phase==='finishing'))hint='点击待完成的工作台，照配方选香材、点缀或纹模';
      else if(s.tray.length)hint='托盘已备好，点击想要这份茶点的客人';
      else if(s.stations.some(x=>x.phase==='ready'))hint='出餐位亮了，点一下取到托盘，趁热送上';
      else if(s.stations.some(x=>x.food!==null))hint='茶点制作中，可以同时照看别的炉子';
      if(!s.tutorial)text(s.practice?'免费练手 · 本场不计收益、手艺与通商进度':hint,195,H-bottom-8,9,'#f7e5be','center');
      serviceFX=serviceFX.filter(e=>now-e.start<(e.flight?360:1500));if(!modal)serviceFX.forEach(e=>{
        if(e.flight){if(reduced())return;const t=Math.min(1,(now-e.start)/360),p=1-(1-t)**3;foodSprite(e.food,e.x+(e.endX-e.x)*p,e.y+(e.endY-e.y)*p-Math.sin(t*Math.PI)*35,43);return;}
        const t=(now-e.start)/1500;ctx.globalAlpha=1-t;fitText(e.message,Math.max(76,Math.min(W-76,e.x)),e.y-t*35,15,146,'#fff4c1','center',true);ctx.globalAlpha=1;
      });
    }
    function serviceResultModal(){
      const r=serviceResult,a=Growth.activity(r.activity,service.level),special=a.id!=='daily'&&!r.practice,b=sheet(r.practice?'练手收招，记住手感':'今日生意，收摊记账',r.practice?'免费练手不计收益、成长与商路进度。':special?a.name+' · '+(r.eventWon?'委托达成':'下次再试，经营所得照常入账'):r.stars===3?'满堂喝彩，掌柜好手艺。':'一局一进步，下一场会更从容。',580);
      for(let i=0;i<3;i++)art('star',126+i*57,b.y-3,31,31,i<r.stars?1:.22);
      text(`${r.practice?'试算进账':'营业进账'} ${r.revenue} 两`,195,b.y+52,23,INK,'center',true);
      text(`接待 ${r.served}位 · 最高 ${r.bestCombo}连单 · 离客 ${r.lost}位`,195,b.y+84,12,'#81745e','center');
      text(`实际入账 +${r.silver}银两 · +${r.fame}声望`,195,b.y+117,14,TEAL,'center',true);
      text(`上佳送出 ${r.perfectDelivered}份 · 手艺赏钱 +${r.qualityBonus}两`,195,b.y+146,11,'#9a703b','center');
      text(`招牌货 +${r[C.SHOPS[service.shop].id]} · 街区加成 +${r.districtExtra||0}两`,195,b.y+172,11,'#8c7c60','center');
      divider(b.x,b.y+193,b.w);
      if(special){art(r.eventWon?'seal':'orders',b.x,b.y+207,37,37);text(r.eventWon?(r.firstWin?'首回委托达成':'再次达成委托'):'委托尚未达成',b.x+45,b.y+218,13,INK,'left',true);text(r.eventWon?`委托另奖 ${r.eventSilver}两 · ${r.eventFame}声望（已计入）`:a.rule,b.x+45,b.y+242,10,'#9a805b');}
      else{art('orders',b.x,b.y+207,37,37);text(r.practice?'手感记住了，再去正式开门':'今日的手艺，也记进账册',b.x+45,b.y+219,13,INK,'left',true);text(`本场积累 ${r.recipeXP.reduce((n,x)=>n+x,0)}点熟练 · 熟练加价 ${r.masteryBonus}两`,b.x+45,b.y+243,10,'#9a805b');}
      const up=r.levelUps[0],friend=r.newFriends[0];
      text(up?`${S.RECIPES[up.id].name}练成「${up.title}」 · 每份多${up.priceAdd}两`:friend?`${S.GUESTS[friend.id].name}成了「${friend.title}」`:special?`手艺熟练 +${r.recipeXP.reduce((n,x)=>n+x,0)} · ${r.guestVisits.reduce((n,x)=>n+x,0)}位客人记住了你`:r.practice?'练手不消耗体力，也不增加熟练或交情':'卖出一份积1点熟练，上佳成品积2点',195,b.y+278,11,TEAL,'center');
      button('result-book','翻看经营手册',b.x+65,b.y+293,b.w-130,32,()=>openBook(service.shop),{type:'outline',size:11});
      button('service-again','再营业一场 · 选择委托',b.x,b.bottom-101,b.w,44,()=>open('service-brief'),{type:'gold',size:16});
      button('service-home',state.guide.upgradePending?'把第一笔钱用在店里':C.questReady(state)?'回商街 · 领取目标奖励':'回商街 · 扩店查案',b.x,b.bottom-45,b.w,42,goServiceHome,{type:'outline'});
    }
    function sessionValid(s,kind){return kind==='guide'?s.tutorial:kind==='festival'?s.festivalRun===state.festival.active?.id:kind==='rain'?s.rainRun===state.rain.active?.id:false;}
    function enterOpening(returnTo={screen:'game',modal:null,shop:selectedShop}){if(!Story.start(state,returnTo))return false;screen='opening-story';toast=null;effects=[];close();tick=Date.now();persist();return true;}
    function leaveOpening(back){if(state.shopStories.pending.length&&enterOpening(back))return;selectedShop=back?.shop??selectedShop;if(back?.screen==='needle-lesson'){startNeedle('simple',false,true);return;}if(back?.screen==='opening-journal'){screen=state.activeTrade==='needlework'?'needle-lobby':'game';open('opening-journal');persist();return;}screen=back?.screen==='needle-lobby'?'needle-lobby':'game';if(back?.modal)open(back.modal);else close();persist();}
    function nextOpening(){const r=Story.next(state);if(r?.done)leaveOpening(r.returnTo);else persist();}
    function skipOpening(){const back=Story.finish(state);leaveOpening(back);}
    function drawOpeningStory(now){const e=Story.current(state);if(!e){leaveOpening({screen:'game'});return;}if(e.scene)cover(images[e.scene],0,0,W,H);else{const ww=570,hh=H*ww/W,p=Street.center(e.region),center={x:Math.max(ww/2,Math.min(Street.WIDTH-ww/2,p.x)),y:Math.max(hh/2,Math.min(Street.HEIGHT-hh/2,p.y))};paintStreetWindow(center,0,0,W,H,ww);}ctx.fillStyle=gradient(0,145+safe,'#69404ad1','#69404a00');ctx.fillRect(0,0,W,145+safe);ctx.fillStyle=gradient(H-320,320,'#4d2d3900','#50303ba6');ctx.fillRect(0,H-320,W,320);
      ctx.save();ctx.shadowColor='#4d2939';ctx.shadowBlur=5;ctx.shadowOffsetY=1;text(e.chapter,23,safe+31,11,'#fff2df');fitText(e.title,23,safe+79,26,342,'#fff0d0','left',true);ctx.restore();button('opening-skip','略过本段',307,safe+13,65,36,skipOpening,{paint:false});text('略过',339,safe+31,11,'#fff0db','center');
      const y=H-bottom-246;artPlate('scroll',16,y,358,226,true);text(e.beat[0],60,y+43,17,TEAL,'left',true);lines(e.beat[1],60,y+77,270,15,INK,25,3);fitText('下一步 · '+e.goal,60,y+155,10,270,FADE);text((e.index+1)+' / '+e.beats.length,60,y+196,11,FADE);button('opening-next',e.last?(e.id==='needle'?'接下第一张绣单':e.replay?'收好这页':'开门做生意'):'听下去',191,y+180,153,37,nextOpening,{type:'gold',size:13});
    }
    function openingJournal(){const b=sheet('开铺纪事','每开一扇门，让故事向前一步。',610),list=Story.ENTRIES,pages=Math.ceil(list.length/4);list.slice(journalPage*4,journalPage*4+4).forEach((e,i)=>{const y=b.y+9+i*111,seen=state.shopStories.seen.includes(e.id);if(e.scene&&images[e.scene])cover(images[e.scene],b.x,y,69,88,1);else paintStreetWindow(Street.center(e.region),b.x,y,69,88);text(e.title,b.x+82,y+17,14,INK,'left',true);fitText(seen?e.chapter:e.id.startsWith('region-')?'通商此地后展开':'这间新店开张后展开',b.x+82,y+43,10,b.w-82,FADE);button('opening-read-'+e.id,seen?'重读这一页':'待展开',b.x+82,y+64,b.w-82,31,()=>{if(Story.replay(state,e.id,{screen:'opening-journal'})){screen='opening-story';close();persist();}},{type:'outline',size:11,disabled:!seen});});button('opening-journal-prev','上一页',b.x,b.bottom-35,90,32,()=>journalPage=Math.max(0,journalPage-1),{type:'outline',size:12,disabled:!journalPage});text((journalPage+1)+' / '+pages,195,b.bottom-19,11,FADE,'center');button('opening-journal-next','下一页',b.x+b.w-90,b.bottom-35,90,32,()=>journalPage=Math.min(pages-1,journalPage+1),{type:'outline',size:12,disabled:journalPage>=pages-1});}
    function enterGame(){
      if(state.shopStories.active||!state.activeSession&&state.shopStories.pending.length){if(enterOpening())return;}
      if(state.activeTrade==='needlework'&&!state.needlework.tutorialDone&&!state.needlework.run&&!state.shopStories.seen.includes('needle')){Story.enqueue(state,'needle');enterOpening({screen:'needle-lesson'});return;}
      if(state.activeTrade==='needlework'){screen='needle-lobby';if(state.needlework.run?.finished&&!state.needlework.run.settled)settleNeedle();else if(!state.needlework.tutorialDone&&!state.needlework.run)startNeedle('simple',false,true);else if(state.needlework.run&&!state.needlework.run.finished)startNeedle();else close();return;}
      const a=state.activeSession,resumed=a&&S.restore(a.service);if(resumed&&sessionValid(resumed,a.kind)){service=resumed;serviceResult=null;selectedShop=service.shop;guideFlow=service.tutorial?(service.guideFirst?state.guide:{step:service.guideStep||0}):null;if(guideFlow)guideFlow.step=service.guideStep||0;screen='service';modal=null;tick=Date.now();open('session-resume');return;}
      if(a){state.activeSession=null;state.festival.active=null;state.rain.active=null;persist();}screen='game';if(!state.guide.done&&state.serviceRounds===0)open('welcome');else if(state.guide.upgradePending)open('guide-upgrade');else if(pendingOffline.seconds>=60&&pendingOffline.silver>=1)open('offline');
    }
    function beginGuide(shop=0,replay=false){
      if(shop===0&&!replay&&!state.shops[0].level){const r=C.upgrade(state,0);if(!r.ok){say(r.message);return;}}
      const first=shop===0&&!replay;guideFlow=first?state.guide:{step:0};guideFlow.step=0;selectedShop=shop;selectedActivity='daily';service=S.start({shop,menu:Catalog.DEFAULTS[shop],level:1,tutorial:true,practice:!first,round:0});service.guideFirst=first;service.guideReplay=replay;service.guideStep=0;service.day=state.serviceByShop[shop]+1;service.energyCost=0;serviceResult=null;serviceFX=[];toast=null;screen='service';modal=null;S.step(service,.1);tick=Date.now();persist();
    }
    function skipGuide(){if(!service?.tutorial){state.guide.done=true;close();persist();return;}if(!service.guideReplay){state.guide.lessons[service.shop]=true;if(service.guideFirst)state.guide.done=true;}state.activeSession=null;service=null;guideFlow=null;screen='game';modal=null;persist();say('已收起指引，手册中可随时免费重练');}
    function guideAfter(id){if(!service?.tutorial||!guideFlow)return;Guide.action(guideFlow,service,id,true);service.guideStep=guideFlow.step;persist();}
    function guideOverlay(now){
      if(!service?.tutorial||!guideFlow||modal)return;const s=service,t=Guide.target(guideFlow,s);hits=hits.filter(h=>Guide.allowed(guideFlow,s,h.id));
      const focused=s.focusStation===null?null:s.stations[s.focusStation],preferred=focused?.food!==undefined&&focused?.food!==null?'finish-choice-'+S.RECIPES[focused.food].finish:null;
      const actionable=h=>{const m=/^pickup-(\d+)$/.exec(h.id);return !h.disabled&&(!m||s.stations[+m[1]].phase==='ready');};
      const target=hits.find(h=>h.id===preferred&&actionable(h))||hits.find(h=>t.ids?.includes(h.id)&&h.id!=='guide-next'&&actionable(h));
      if(t.ids&&target)circleGuide(target,now,true,'shop-lesson');
      const x=125,y=safe+132,w=251;artPlate('scroll',x-5,y-7,w+8,128,true);staffPortrait(C.PARTNERS[0],x+8,y+9,31);text(t.title,x+47,y+24,10,TEAL,'left',true);lines(t.line,x+36,y+58,w-72,12,INK,20,2);
      if(guideFlow.step===0)button('guide-next','看懂了，动手试试',x+31,y+94,w-62,28,()=>{Guide.action(guideFlow,s,'guide-next');s.guideStep=guideFlow.step;persist();},{type:'gold',size:11});
      if(guideFlow.step===0)circleGuide(hits.find(b=>b.id==='guide-next'),now,false,'shop-lesson');
      if(target)guideHand(target,now);
      button('guide-skip','跳过本次教学',246,H-bottom-39,129,30,skipGuide,{type:'outline',size:10});text(s.practice?'免费重练 · 不计收益':'免费初课 · 不耗体力',24,H-bottom-23,10,'#fff0ce');
    }
    function goServiceHome(){screen='game';close();guideFlow=null;if(state.guide.upgradePending)open('guide-upgrade');else if(state.rain.pending)say('檐下有位避雨的客人，点青伞可招待');}
    function rainWeather(now){if(reduced())return;ctx.save();ctx.strokeStyle='#d5eafa66';ctx.lineWidth=.65;for(let i=0;i<35;i++){const y=(i*61+now/8)%H,x=i*47%W;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-4,y+19);ctx.stroke();}ctx.restore();}
    function streetActivities(now){
      const y=safe+118;
      if(!Needle.storesAvailable(state)){
        [['needleClothSupply','绢线铺','street-supply',openNeedleSupply],['needleGood13','绣样册','street-needle-book',()=>{needlePage=0;open('needle-book');}],['needleGood17','我的绣衣','street-wardrobe',()=>open('needle-wardrobe')]].forEach(([frame,label,id,fn],i)=>{const x=25+i*80;art(frame,x,y,38,39);text(label,x+19,y+47,9,'#ffe3b1','center');button(id,label,x-11,y-2,66,56,fn,{paint:false});});
      }else{
      const a=Events.status(state);art('festivalEntry',25,y,38,37);text('百盏宴',45,y+47,9,'#ffe3a2','center');button('festival-entry','灯市百盏宴',14,y-2,66,56,()=>{screen='festival';modal=null;},{paint:false});
      art('rainEntry',103,y+1,40,37,state.rain.pending?1:.45);text(state.rain.pending?'有人避雨':'雨夜旧物',122,y+47,9,'#dbece4','center');button('rain-entry','雨夜来客与旧物',88,y-2,69,56,()=>open('rain'),{paint:false});
      const local=World.REGIONAL.PLACES[Street.nearest(streetCamera,streetViewport())];art(local.decor,188,y+1,36,37);text('本地名物',206,y+47,9,'#ffe3b1','center');button('local-goods','本地货品与陈设',170,y-2,74,56,()=>openRegional(local.region),{paint:false});
      }
      for(const[n,id,label,mark,delta]of [[0,'street-zoom-out','看远','−',-.1],[1,'street-zoom-in','拉近','+',.1]]){const x=266+n*43;ctx.beginPath();ctx.arc(x,y+17,16,0,Math.PI*2);ctx.fillStyle='#f5ead5e8';ctx.fill();ctx.strokeStyle='#c3a368';ctx.lineWidth=1.2;ctx.stroke();text(mark,x,y+16,23,TEAL,'center');text(label,x,y+47,9,'#f7e5bd','center');button(id,label,x-20,y-2,40,56,()=>Street.zoom(streetCamera,streetViewport(),streetCamera.zoom+delta),{paint:false});}const mx=342,my=y-2,mw=34,mh=51;ctx.drawImage(images.streetPreview,mx,my,mw,mh);ctx.strokeStyle='#c8ae72';ctx.lineWidth=1;ctx.strokeRect(mx,my,mw,mh);const v=streetViewport();ctx.strokeStyle='#fff5c8';ctx.strokeRect(mx+streetCamera.x/Street.WIDTH*mw,my+streetCamera.y/Street.HEIGHT*mh,v.w/(streetCamera.zoom*Street.WIDTH)*mw,v.h/(streetCamera.zoom*Street.HEIGHT)*mh);button('street-overview','查看全街与开拓条件',mx-4,my-4,mw+8,mh+8,()=>open('map'),{paint:false});
      if(Needle.storesAvailable(state)&&state.rain.pending&&!reduced()){ctx.beginPath();ctx.fillStyle='#f3ce86';ctx.arc(143,y+5,3+Math.sin(now/400),0,Math.PI*2);ctx.fill();}
    }
    function lanternProgress(y,small=false){const n=state.festival.wins;for(let i=0;i<12;i++){const col=i%6,row=Math.floor(i/6),x=small?65+col*51:54+col*56,yy=y+row*(small?48:57),lit=i<n,tier=Math.floor(i/3);if(lit&&!reduced()){const g=ctx.createRadialGradient(x,yy+16,1,x,yy+16,24);g.addColorStop(0,'#ffd47b66');g.addColorStop(1,'#ffd47b00');ctx.fillStyle=g;ctx.fillRect(x-24,yy-8,48,48);}art('festivalTier'+tier,x-20,yy-2,40,small?46:43,lit?1:.36);if(!small){ctx.beginPath();ctx.arc(x,yy+49,8,0,Math.PI*2);ctx.fillStyle=lit?'#c29555':'#704c47ee';ctx.fill();ctx.strokeStyle='#dbb77b';ctx.lineWidth=.7;ctx.stroke();text(i+1,x,yy+49,9,'#fff0d0','center',true);}}}
    function festivalScreen(now){
      const a=Events.status(state),f=state.festival,p=Events.CHAPTERS[a.chapter];cover(images.festivalScene,0,0,W,H);ctx.fillStyle=gradient(0,190,'#674552d9','#67455200');ctx.fillRect(0,0,W,190);ctx.fillStyle=gradient(H-350,350,'#6b435100','#6b4351df');ctx.fillRect(0,H-350,W,350);
      text('灯市百盏宴',22,safe+34,31,'#ffe8ba','left',true);text(!a.joined?'接下宴帖后，开启属于你的七日灯市':a.complete?'十二盏灯已亮，长街记得你的手艺':a.ended?'本轮宴席已散 · 兑奖仍保留':`余 ${Math.floor(Math.ceil(a.remaining/3600000)/24)}天 ${Math.ceil(a.remaining/3600000)%24}时 · 已点亮 ${f.wins}/12盏`,24,safe+65,11,'#e9d5b1');button('festival-home','回商街',309,safe+16,65,38,()=>{screen='game';close();},{type:'outline',size:11});
      lanternProgress(safe+87);
      const by=H-bottom-338;artPlate('ribbon',46,by-21,298,41);quietLabel(p.name,46,by-21,17,298,41,'#fff0ce');artPlate('scroll',42,by+25,306,42,true);fitText(p.line,195,by+46,12,248,INK,'center',true);
      if(!a.unlocked){art('festivalLamp',153,by+76,80,108);text(`完成3场营业后递来宴帖 · ${state.serviceRounds}/3`,195,by+201,12,'#fff0cc','center');button('festival-return','先去练好手艺',56,by+240,278,43,()=>{screen='game';open('service-brief');},{type:'gold',size:16});return;}
      if(!a.joined){art('festivalToken',83,by+80,65,73);art('festivalLamp',213,by+73,73,88);lines('临水会首递来宴帖：\n“掌柜，愿与街坊共点这一街灯火么？”',65,by+160,266,13,'#fff0d0',23,2);button('festival-join','接下宴帖 · 开启七日灯市',42,by+233,306,45,()=>{const r=Events.join(state);say(r.message);if(r.ok){persist();open('festival-how');}},{type:'gold',size:16});return;}
      if(a.ended||a.complete){art('festivalLamp',144,by+49,102,139);text(a.complete?'永久金桂灯，等你带回店里。':'已得的灯花签与谢礼都在这里。',195,by+209,12,'#ffe6b5','center');button('festival-rewards','打开灯市谢礼',57,by+242,276,43,()=>open('festival-rewards'),{type:'gold',size:17});return;}
      C.SHOPS.forEach((d,i)=>button('festival-shop-'+i,d.short,38+i*108,by+55,98,29,()=>{selectedShop=i;},{type:selectedShop===i?'gold':'outline',disabled:!state.shops[i].level,size:11}));if(!state.shops[selectedShop].level)selectedShop=0;
      for(let i=0;i<2;i++){const x=29+i*176,bold=i===1;artPlate('scroll',x,by+103,158,115,true);text(bold?'接一席讲究的':'稳稳招待',x+79,by+123,15,INK,'center',true);const pl=Events.plan(state,bold,selectedShop);text(`接待${pl.profile?.goal||p.goal}位`+(pl.profile?.perfect?` · 上佳${pl.profile.perfect}份`:bold?' · 离客≤1':''),x+79,by+150,10,TEAL,'center');text(pl.tutorial?'初次赴宴免费':`${bold?30:20}体力 · 灯花签${bold?12:8}起`,x+79,by+176,10,'#8d774f','center');button('festival-'+(bold?'bold':'steady'),bold?'挑战这一席':'接下这一席',x+9,by+216,140,37,()=>startFestival(bold),{type:bold?'gold':'outline',size:13});}
      button('festival-rewards','谢礼 · 灯花签 '+f.tokens,75,H-bottom-40,240,29,()=>open('festival-rewards'),{type:'outline',size:11});
    }
    function startFestival(bold){const r=Events.begin(state,bold,selectedShop);if(!r.ok){if(state.energy<(bold?30:20))openEnergy();say(r.message);return;}service=S.start({shop:selectedShop,level:Math.max(3,state.shops[selectedShop].level),round:2,menu:r.menu,districts:state.districts,contract:r.profile,recipeXP:state.recipeXP,guestVisits:state.guestVisits,...World.buffs(state,selectedShop)});service.festivalRun=r.id;service.energyCost=r.cost;service.day=state.serviceByShop[selectedShop]+1;serviceResult=null;guideFlow=null;screen='service';modal=null;S.step(service,.1);tick=Date.now();persist();}
    function festivalRewards(){const f=state.festival,b=sheet('灯市谢礼','已点亮 '+f.wins+'/12盏 · 灯花签 '+f.tokens+'枚 · 获得后永久保留',570);Events.REWARDS.forEach((r,i)=>{const y=b.y+i*118,got=f.claimed.includes(r.id),can=f.wins>=r.wins&&f.tokens>=r.tokens&&!got;art(r.frame,b.x-4,y,79,91);text(r.name,b.x+86,y+16,17,INK,'left',true);text(r.desc,b.x+86,y+42,11,TEAL);text(`${r.wins}席`+(r.tokens?` · ${r.tokens}灯花签`:' · 免费领取'),b.x+86,y+65,10,FADE);button('festival-claim-'+r.id,got?'已收入行囊':'领取',b.x+b.w-87,y+82,85,29,()=>{const a=Events.claim(state,r.id);say(a.message);if(a.ok){persist();chime('upgrade');}},{type:can?'gold':'outline',disabled:!can,size:11});if(i<2)divider(b.x,y+113,b.w);});button('festival-reward-back','回到灯市',b.x,b.bottom-36,b.w,33,()=>{close();screen='festival';},{type:'outline',size:13});}
    function festivalResult(){const r=serviceResult,a=r.festival,tier=Events.lanternTier(a.wins),b=sheet(a.won?'又点亮一盏人间灯':'这一席，留下手艺与心意',a.line,570);art('festivalTier'+tier,145,b.y-1,100,102);text(Events.LANTERNS[tier],195,b.y+113,12,INK,'center',true);text(`灯花签 +${a.tokens}`,195,b.y+149,25,TEAL,'center',true);fitText(`实际入账 ${r.silver}两 · 招待${r.served}位 · 上佳${r.perfectDelivered}份`,195,b.y+180,11,b.w,FADE,'center');lanternProgress(b.y+204,true);text(`已点亮 ${a.wins}/12盏 · ${env.demo?'本页内可继续点灯':'每席进度已保存'}`,195,b.y+315,12,INK,'center');fitText(a.wins>=12?'四阶华灯已收齐 · 可领取永久金桂灯':tier<3?'再点亮'+(3-a.wins%3)+'盏，解锁'+Events.LANTERNS[tier+1]:'凤纹华灯已解锁 · 继续点亮长街',195,b.y+339,11,b.w,TEAL,'center');button('festival-result-next','再挑一席 · 回灯市',b.x,b.bottom-89,b.w,37,()=>{screen='festival';close();},{type:'gold',size:15});button('festival-result-home','带着灯火回商街',b.x,b.bottom-38,b.w,33,goServiceHome,{type:'outline',size:13});}
    function rainModal(){
      const b=sheet(state.rain.pending?'檐下，有人避雨':'雨夜旧物','三位来客，九次相逢 · 不影响主线证据',620),p=Events.rainPlan(state);
      if(!p.ok){Events.PEOPLE.forEach((r,i)=>{const x=b.x+16+i*100;art(r.frame,x-9,b.y-6,82,147);text(r.name,x+31,b.y+157,13,INK,'center',true);text(`${state.rain.visits[i]}/3次相逢`,x+31,b.y+182,10,FADE,'center');art(r.item,x+4,b.y+209,57,68,state.rain.collection.includes(r.item)?1:.22);});text('日常经营几场，有缘人便会带雨而来。',195,b.y+307,12,TEAL,'center');text(state.rain.vase?'旧物已集齐，天青瓶已可用于三铺布置。':'集齐三件旧物，获得永久陈设「雨过天青瓶」。',195,b.y+337,10,FADE,'center');art('rainVase',154,b.y+363,81,89);return;}
      const person=Events.PEOPLE[p.npc];art(person.frame,b.x-8,b.y-3,137,224);text(person.name,b.x+143,b.y+22,23,INK,'left',true);text(person.job,b.x+143,b.y+54,11,TEAL);lines(p.hint,b.x+143,b.y+91,b.w-143,13,INK,23,5);text(`第${p.visit+1}次相逢 · `+(p.cost?'10体力':'首次招待免费'),195,b.y+248,12,TEAL,'center');
      p.menu.forEach((id,i)=>{const x=b.x+45+i*102;foodSprite(id,x,b.y+294,63);text(S.RECIPES[id].name,x,b.y+342,10,INK,'center');});text('听客意，选一款亲手做给他。',195,b.y+375,11,FADE,'center');
      const bw=(b.w-12)/2;button('rain-save','留信 · 稍后招待',b.x,b.bottom-90,bw,34,()=>{Events.defer(state);persist();close();say('口信已留好，点青伞可随时回来');},{type:'outline',size:11});button('rain-collection','翻看旧物',b.x+bw+12,b.bottom-90,bw,34,()=>open('rain-archive'),{type:'outline',size:11});button('rain-start','请进来，避一避雨',b.x,b.bottom-37,b.w,36,startRain,{type:'gold',size:16});
    }
    function rainArchive(){const b=sheet('雨夜旧物笺',env.demo?'本次试玩所得旧物 · 番外补充线索':'已得旧物永久保存 · 番外补充线索，不替代主线',590);Events.PEOPLE.forEach((p,i)=>{const y=b.y+i*118,owned=state.rain.collection.includes(p.item);art(p.item,b.x-4,y-4,79,86,owned?1:.22);text(p.name+' · '+state.rain.visits[i]+'/3次相逢',b.x+90,y+17,14,INK,'left',true);text(owned?p.itemName:'旧物尚未托付',b.x+90,y+45,12,TEAL);lines(state.rain.visits[i]?p.stories[Math.min(2,state.rain.visits[i]-1)]:'先替来客做好眼前这一份心意。',b.x+90,y+72,b.w-94,10,FADE,16,2);if(i<2)divider(b.x,y+111,b.w);});button('rain-archive-back','回到檐下',b.x,b.bottom-38,b.w,35,()=>open(screen==='service'&&service?.rainRun&&service.finished?'rain-result':'rain'),{type:'outline',size:13});}
    function startRain(){const p=Events.beginRain(state);if(!p.ok){if(state.energy<10)openEnergy();say(p.message);return;}selectedShop=p.shop;service=S.start({shop:p.shop,level:state.shops[p.shop].level,menu:p.menu,districts:state.districts,round:0,rain:p,recipeXP:state.recipeXP,guestVisits:state.guestVisits,...World.buffs(state,p.shop)});service.rainRun=p.id;service.energyCost=p.cost;service.day=state.serviceByShop[p.shop]+1;serviceResult=null;guideFlow=null;screen='service';modal=null;S.step(service,.1);tick=Date.now();persist();}
    function rainResult(){const r=serviceResult,a=r.rain,p=Events.PEOPLE[a.npc],b=sheet(a.correct?'一盏心意，换一段旧事':'檐下的心意，下回再续',p.name+' · 雨夜来客',580);art(p.frame,b.x-6,b.y-4,128,222);lines(a.text,b.x+137,b.y+28,b.w-137,14,INK,25,7);if(a.item){art(a.item,b.x+6,b.y+241,73,75);text('托付旧物 · '+p.itemName,b.x+94,b.y+262,15,TEAL,'left',true);}else text(a.correct?'交情更深一分，下次相逢再听。':'客意未合，下回仍可重试。',195,b.y+275,12,TEAL,'center');text(`实际入账 +${r.silver}两 · ${state.rain.visits[a.npc]}/3次相逢`,195,b.y+330,12,FADE,'center');if(a.complete)text('三件旧物集齐 · 雨过天青瓶已入行囊',195,b.y+357,11,TEAL,'center');button('rain-result-archive','收好这页旧物笺',b.x,b.bottom-88,b.w,35,()=>open('rain-archive'),{type:'outline',size:13});button('rain-result-home','雨声里，继续过日子',b.x,b.bottom-37,b.w,36,goServiceHome,{type:'gold',size:15});}
    function lessonMenu(){const b=sheet('阿绫的手艺初课','免费重练 · 不计收益、成长与商路进度',560),unfinished=state.needlework.run&&!state.needlework.run.finished;const lessons=[{id:'guide-replay-needle',name:'绣作初课',frame:'needleBasket',action:()=>startNeedle('simple',true,true)},...(Needle.storesAvailable(state)?C.SHOPS:[]).map((p,i)=>({id:'guide-replay-'+i,name:p.short+'初课',frame:i===0?'kettleHot':i===1?'mortarReady':'ovenReady',action:()=>beginGuide(i,true)}))];lessons.forEach((p,i)=>{const y=b.y+i*98;art(p.frame,b.x,y-4,68,75);text(p.name,b.x+83,y+18,17,INK,'left',true);button(p.id,i===0&&unfinished?'接着未完的绣单':'跟着做一遍',b.x+83,y+45,b.w-83,32,p.action,{type:'outline',size:12});});}
    function guideUpgrade(){const b=sheet('把新工钱，添进店里','阿绫 · 让赚来的银两改变眼前的店',480);art('kettleIdle',73,b.y+7,95,129);art('kettleHot',222,b.y+7,95,129);icon('arrow',184,b.y+59,25);text('茶肆升到二级，制作会更快。',195,b.y+178,16,TEAL,'center',true);text('初课谢礼90两已到账 · 当前'+currency(state.silver)+'两',195,b.y+214,11,FADE,'center');button('guide-upgrade','花'+C.cost(state,0)+'两 · 扩建茶肆',b.x,b.bottom-93,b.w,40,()=>{const r=C.upgrade(state,0);say(r.message);if(r.ok){state.guide.upgradePending=false;persist();screen='game';close();chime('upgrade');}},{type:'gold',size:16});button('guide-upgrade-later','先收好银两，稍后再扩',b.x,b.bottom-37,b.w,34,()=>{state.guide.upgradePending=false;persist();close();},{type:'outline',size:12});}

    function playerText(value){return String(value).replaceAll('江楚儿',Profile.name(state));}
    function outfitCircle(i,x,y,size,alpha=1){avatarCircle(i,x,y,size,alpha,'outfitPortrait');}
    function avatarCircle(id,x,y,size,alpha=1,prefix='avatar'){const a=artSource(prefix+id);if(!a)return;ctx.save();ctx.globalAlpha*=alpha;ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.clip();ctx.fillStyle='#f2e4cb';ctx.fill();cover(a.img,x,y,size,size,1,[a.sx,a.sy,a.sw,a.sh]);ctx.restore();ctx.save();ctx.globalAlpha*=alpha;ctx.beginPath();ctx.arc(x+size/2,y+size/2,size/2,0,Math.PI*2);ctx.strokeStyle='#d5b778';ctx.lineWidth=1.2;ctx.stroke();ctx.restore();}
    async function renamePlayer(){if(!env.editName){say('此处暂不能输入，可在浏览器中更改掌柜名');return;}const value=await env.editName({value:Profile.name(state),maxChars:8});if(value===null)return;const r=Profile.rename(state,value);say(r.message);if(r.ok){persist();chime('tap');}draw(Date.now());}
    function profileModal(){
      const r=Profile.rank(state),b=sheet('掌柜小传','同一位楚儿，亲手挣出的不同风华。',640);if(state.needlework.wearing!==null)outfitCircle(Needle.WARDROBE.indexOf(state.needlework.wearing),b.x-1,b.y-3,88);else avatarCircle(state.avatar,b.x-1,b.y-3,88);text(Profile.name(state),b.x+105,b.y+18,22,INK,'left',true);text(`Lv.${r.level} · ${r.title}`,b.x+105,b.y+50,13,TEAL);
      const fraction=r.next?Math.min(1,(r.score-r.start)/(r.next-r.start)):1;rect(b.x+105,b.y+73,b.w-110,5,2,'#c7b89366');rect(b.x+105,b.y+73,(b.w-110)*fraction,5,2,'#76977e');text(r.next?`成长 ${r.score}/${r.next}`:'长街灯火，皆是你的回答',b.x+105,b.y+93,10,FADE);text('好评营业、交付商单、扩店通商都能成长',195,b.y+123,10,FADE,'center');
      Profile.AVATARS.forEach((a,i)=>{const x=b.x+(i%3)*101+47,y=b.y+150+Math.floor(i/3)*133,owned=r.level>=a.level,active=state.needlework.wearing===null&&state.avatar===a.id;avatarCircle(a.id,x-35,y,70,owned?1:.35);if(active)art('star',x+23,y-3,17,17);if(!owned)icon('lock',x+22,y+51,17,FADE);text(a.name,x,y+88,12,INK,'center',true);text(active?'正在使用':owned?'已解锁 · 换上':`Lv.${a.level} 解锁`,x,y+109,10,owned?TEAL:FADE,'center');button('avatar-'+a.id,a.name,x-45,y-5,90,121,()=>{const q=Profile.choose(state,a.id);say(q.message);if(q.ok){state.needlework.wearing=null;persist();chime('tap');}},{paint:false});});
      button('profile-rename','更改掌柜名',b.x,b.bottom-37,142,35,renamePlayer,{type:'gold',size:14});button('profile-wardrobe','我的绣衣',b.x+156,b.bottom-37,b.w-156,35,()=>open('needle-wardrobe'),{type:'outline',size:14});
    }
    function mapGrowth(mx,my,mw,mh){
      for(let i=1;i<World.DISTRICTS.length;i++){const p=World.DISTRICTS[i-1].node,q=World.DISTRICTS[i].node,owned=state.districts[i];ctx.save();ctx.strokeStyle=owned?'#d6a849df':'#eee5cb80';ctx.lineWidth=owned?2.2:1;ctx.setLineDash(owned?[]:[3,5]);ctx.beginPath();ctx.moveTo(mx+p[0]*mw,my+p[1]*mh);ctx.lineTo(mx+q[0]*mw,my+q[1]*mh);ctx.stroke();ctx.restore();}
      World.DISTRICTS.forEach((d,i)=>{if(state.districts[i])return;const x=mx+d.node[0]*mw,y=my+d.node[1]*mh;ctx.save();const g=ctx.createRadialGradient(x,y,2,x,y,66);g.addColorStop(0,'#f1ecd9cc');g.addColorStop(1,'#e6e3d000');ctx.fillStyle=g;ctx.fillRect(x-66,y-66,132,132);ctx.restore();});
    }
    function leaveRegional(){const back=regionalReturn;regionalReturn=null;if(back){modal=back;if(back==='map')mapSelected=tradeRegion;focus=-1;}else close();}
    function openRegional(region=state.district){regionalReturn=modal;tradeRegion=region;tradeShop=state.shops[selectedShop].level?selectedShop:0;tradeSlot='left';open('regional');}
    function regionalModal(){
      const place=World.REGIONAL.PLACES[tradeRegion],d=World.DISTRICTS[tradeRegion],r=Catalog.ITEMS[place.good],opened=state.districts[tradeRegion],b=sheet(d.name+' · 名物',opened?'此地已通商 · 地方货品与陈设各有来处':'先开拓这段商路，再把地方风物带回店里',640),owned=state.decorOwned[tradeShop].includes(place.decor);
      C.SHOPS.forEach((shop,i)=>button('regional-shop-'+i,shop.short,b.x+i*101,b.y-3,94,29,()=>{tradeShop=i;},{type:tradeShop===i?'gold':'outline',disabled:!state.shops[i].level,size:12}));text('陈设准备摆在哪家店',195,b.y+41,10,FADE,'center');
      foodSprite(r.id,b.x+52,b.y+107,101,opened?1:.42);text(r.name,b.x+121,b.y+79,17,INK,'left',true);text(C.SHOPS[r.shop].short+' · '+r.kind+' · '+r.price+'两',b.x+121,b.y+108,11,TEAL);text(Catalog.unlocked(state,r.id)?'已解锁，可免费换入货单':`通商且${C.SHOPS[r.shop].short}${r.level}级后解锁`,b.x+121,b.y+132,10,FADE);button('regional-menu','换入'+C.SHOPS[r.shop].short+'货单',b.x+121,b.y+155,b.w-121,30,()=>{const q=Catalog.choose(state,r.shop,r.slot,r.id);say(q.message);if(q.ok){selectedShop=r.shop;persist();chime('tap');}},{type:'outline',disabled:!Catalog.unlocked(state,r.id),size:11});
      divider(b.x,b.y+204,b.w);art(place.decor,b.x-1,b.y+221,108,116,opened?1:.42);text(place.name,b.x+121,b.y+228,17,INK,'left',true);lines(place.desc,b.x+121,b.y+261,b.w-121,11,FADE,19,3);text((owned?'本店已购入':place.price+'两')+' · 雅致+'+place.beauty,b.x+121,b.y+326,11,TEAL);
      button('regional-left','摆在左侧',b.x,b.y+370,(b.w-12)/2,29,()=>{tradeSlot='left';},{type:tradeSlot==='left'?'gold':'outline',size:12});button('regional-right','摆在右侧',b.x+(b.w+12)/2,b.y+370,(b.w-12)/2,29,()=>{tradeSlot='right';},{type:tradeSlot==='right'?'gold':'outline',size:12});
      button('regional-buy',owned?'免费换上 · '+World.SLOTS.find(x=>x.id===tradeSlot).name:place.price+'两 · 购入并摆放',b.x,b.bottom-37,b.w,35,()=>{const q=World.chooseDecor(state,tradeShop,tradeSlot,place.decor);say(q.message);if(q.ok){persist();chime('upgrade');}},{type:'gold',disabled:!opened||!state.shops[tradeShop].level,size:14});
    }
    function regionArrival(){const region=state.district,place=World.REGIONAL.PLACES[region],r=Catalog.ITEMS[place.good],d=World.DISTRICTS[region],b=sheet('新街，已经为你开门',d.name+' · 商路又向前走了一段',560);paintStreetWindow(Street.center(region),b.x,b.y,b.w,135);text('这条街，有自己的好东西。',195,b.y+161,13,TEAL,'center');foodSprite(r.id,b.x+63,b.y+224,91);art(place.decor,b.x+181,b.y+178,99,108);text(r.name,b.x+63,b.y+294,12,INK,'center',true);text(place.name,b.x+230,b.y+294,12,INK,'center',true);text('地方货品',b.x+63,b.y+321,10,FADE,'center');text('永久陈设',b.x+230,b.y+321,10,FADE,'center');button('region-see-goods','看看地方名物',b.x,b.bottom-88,b.w,35,()=>openRegional(region),{type:'gold',size:15});button('region-explore','先逛逛这条街',b.x,b.bottom-37,b.w,34,close,{type:'outline',size:13});}

    function serviceBriefModal(){
      selectedActivity=Growth.activity(selectedActivity,state.shops[selectedShop].level||1).id;
      const mode=S.MODES[selectedShop],menu=Catalog.menu(state,selectedShop),level=state.shops[selectedShop].level||1,a=Growth.activity(selectedActivity,level),b=sheet(mode.name+' · 准备开门',state.district>=3?World.DISTRICTS[state.district].name+' · 本店营业结算加成 '+Math.round(World.districtBonus(state,selectedShop)*100)+'%':'选一场生意，把手艺与家业一同做起来。',575);
      C.SHOPS.forEach((d,i)=>button('brief-shop-'+i,d.short,b.x+i*101,b.y-4,94,32,()=>{if(state.shops[i].level){selectedShop=i;selectedActivity=Growth.activity(selectedActivity,state.shops[i].level).id;}else{selectedShop=i;open('shop');}},{type:i===selectedShop?'gold':'outline',size:12}));
      Growth.ACTIVITIES.forEach((v,i)=>{
        const x=b.x+i*101,active=a.id===v.id,locked=level<v.level;
        if(active){ctx.beginPath();ctx.ellipse(x+47,b.y+73,31,24,0,0,Math.PI*2);ctx.fillStyle='#d8bd772b';ctx.fill();}
        if(locked)icon('lock',x+29,b.y+52,36,FADE);else if(v.id==='daily')foodSprite(menu[0],x+47,b.y+72,48);else art(v.id==='rush'?'timer':'star',x+25,b.y+50,44,44);
        artPlate(active?'primary':'secondary',x-4,b.y+95,100,30);
        text(v.name,x+47,b.y+110,11,active?'#744c24':INK,'center',true);
        text(locked?`店铺${v.level}级开启`:`${Energy.cost(state,v.id)}体力 · ${['轻松','繁忙','匠心'][i]}`,x+47,b.y+139,9,FADE,'center');
        button('activity-'+v.id,v.name,x,b.y+45,94,88,()=>{if(locked){say(`本店升至${v.level}级即可接下这份委托`);return;}selectedActivity=v.id;chime('tap');},{paint:false});
      });
      art('tray',85,b.y+176,220,70);foodSprite(menu[0],157,b.y+202,62);foodSprite(menu[1],227,b.y+202,62);
      if(a.id!=='daily')art('seal',273,b.y+173,43,43);
      text(a.desc,195,b.y+259,12,INK,'center',true);
      text(a.rule,195,b.y+288,12,TEAL,'center');
      const wins=a.id==='daily'?0:state.eventWins[selectedShop][a.id==='rush'?0:1];
      text(a.id==='daily'?'卖出成品练熟手艺，招待客人积累交情':wins?`已达成${wins}回 · 再完成奖励 ${a.repeat}两 / 4声望`:`首回完成另奖 ${a.silver}两 / ${a.fame}声望`,195,b.y+317,11,'#99703b','center');
      const bw=(b.w-16)/3;
      button('brief-help','看制作要诀',b.x,b.y+342,bw,32,()=>open('service-help'),{type:'outline',size:11});
      button('brief-stock','今日货单',b.x+bw+8,b.y+342,bw,32,openStock,{type:'outline',size:11});
      button('brief-book','经营手册',b.x+2*(bw+8),b.y+342,bw,32,()=>openBook(),{type:'outline',size:11});
      text(`体力 ${state.energy}/${Energy.CAP} · `+(Energy.cost(state,a.id)?`本场消耗 ${Energy.cost(state,a.id)}点`:'首场教学免费'),195,b.y+386,11,TEAL,'center');
      button('simple-action',Energy.cost(state,a.id)?'开门迎客 · '+Energy.cost(state,a.id)+'体力':'首场教学 · 免费开门',b.x+10,b.bottom-49,b.w-20,45,startService,{type:'gold',size:17});
    }
    function serviceHelpModal(){
      const mode=S.MODES[selectedShop],menu=Catalog.menu(state,selectedShop),b=sheet(mode.name+' · 准备开门',`本场${state.bestByShop[selectedShop]>=2?80:65}秒 · ${mode.action}，靠手艺赚赏钱`,480),xs=[b.x+42,195,b.x+b.w-42];
      C.SHOPS.forEach((d,i)=>button('brief-shop-'+i,d.short,b.x+i*101,b.y-4,94,32,()=>{if(state.shops[i].level){selectedShop=i;}else{selectedShop=i;open('shop');}},{type:i===selectedShop?'gold':'outline',size:12}));
      art('recipeMat',xs[0]-40,b.y+69,80,44);foodSprite(menu[0],xs[0],b.y+84,55);
      art(selectedShop===0?'kettleHot':selectedShop===1?'mortarReady':'ovenReady',xs[1]-38,b.y+42,76,88);
      art('tray',xs[2]-42,b.y+69,84,50);foodSprite(menu[1],xs[2],b.y+84,35);
      icon('arrow',xs[0]+42,b.y+78,22);icon('arrow',xs[1]+42,b.y+78,22);
      ['选品制作',mode.action,'取货，送客'].forEach((v,i)=>text(v,xs[i],b.y+143,12,INK,'center',true));
      if(selectedShop===0){const hx=106,hy=b.y+188,hw=178;rect(hx,hy,hw,12,6,'#bd8d62');rect(hx+hw*S.HEAT.goodStart,hy,hw*(S.HEAT.goodEnd-S.HEAT.goodStart),12,0,'#7da88a');rect(hx+hw*S.HEAT.perfectStart,hy,hw*(S.HEAT.perfectEnd-S.HEAT.perfectStart),12,0,'#e6be65');text('▼',hx+hw*.56,hy-9,12,'#805b36','center');text('绿色合宜 · 金色最佳，送出多10两',195,hy+33,12,'#8b6336','center');}
      else{const r=Catalog.ITEMS[menu[0]],choices=r.choices||mode.choices;for(let i=0;i<3;i++){art(r.choiceFrames?r.choiceFrames[i]:selectedShop===1?'ingredient'+i:'stamp'+i,98+i*97,b.y+177,40,42);text(choices[i],118+i*97,b.y+234,10,INK,'center');}text(selectedShop===1?'按配方提示选香调和，做好再取货':'按配方提示选纹模或点缀，做好再取货',195,b.y+263,10,'#8b6336','center');}
      button('simple-action','记住了，去选营业',b.x+10,b.bottom-49,b.w-20,45,()=>open('service-brief'),{type:'gold',size:18});
    }
    function drawCraftChoices(s,l,now){
      const i=s.focusStation,st=i===null?null:s.stations[i];if(!st||st.phase!=='finishing'){s.focusStation=null;return;}
      const y=l.trayY,mode=S.MODES[s.shop],recipe=S.RECIPES[st.food],choices=recipe.choices||mode.choices;
      art('ingredientMat',48,y-54,294,123);artPlate('ribbon',88,y-66,214,31);quietLabel('配方需：'+choices[recipe.finish],88,y-66,11,214,31,'#fff0cc');
      choices.forEach((label,n)=>{const x=112+n*83;art(recipe.choiceFrames?recipe.choiceFrames[n]:s.shop===1?'ingredient'+n:'stamp'+n,x-24,y-26,48,49);text(label,x,y+39,11,'#fff1cc','center',true);button('finish-choice-'+n,label,x-35,y-32,70,83,()=>{const r=S.finishCraft(s,i,n);if(r.ok){serviceFX.push({message:r.label,x:195,y:y-75,start:Date.now()});chime(r.quality==='perfect'?'brew-perfect':'tap');}else say(r.message);},{paint:false,guideFocus:{x:x-29,y:y-30,w:58,h:75},guidePoint:{x,y:y-2}});});
      closeControl('finish-cancel','稍后再做',351,y-29,()=>{s.focusStation=null;});
    }
    function brandTitle(time){
      streetBackdrop(time);ctx.fillStyle=gradient(0,H,'#69435130','#51313fba');ctx.fillRect(0,0,W,H);
      const y=H-bottom-(state.needlework.legacyTea&&!env.preview?214:164),logoY=safe+90,logoH=Math.max(130,Math.min(246,y-logoY-90));
      art('seriesWordmark',113,safe+34,164,46);
      art('titleWordmark',45,logoY,300,logoH);
      text('从一针一线，绣出满街繁华',W/2,logoY+logoH+31,13,'#eadbb8','center');
      button('start',state.started?'继续经营':'入长街 · 开新局',66,y,258,52,()=>{
        chime('start');if(state.started){enterGame();}
        else beginIntro(null);
      },{type:'gold',size:18});
      button('title-story','重看身世',142,y+66,106,38,()=>beginIntro('title'),{paint:false});
      text('重看身世',W/2,y+85,12,'#e0cfab','center');
      if(env.newCampaign&&state.needlework.legacyTea&&!env.preview){button('title-new-campaign','从刺绣开篇 · 独立体验',78,y+104,234,35,env.newCampaign,{type:'outline',size:12});}
      text(env.demo?'展示试玩 · 每次打开或刷新从头开始':env.preview?'独立体验档 · 正式进度保留':'古风经营体验版 · 本地自动存档',W/2,H-bottom-34,10,'#d1c6a6','center');
    }
    function beginIntro(back){musicRevision++;returnTo=back;screen='intro';modal=null;introAt=Date.now();introPausedAt=null;introPauseTotal=0;introAutoPause=false;lastIntro=-1;}
    function introElapsed(now){return Math.max(0,((introPausedAt===null?now:introPausedAt)-introAt-introPauseTotal)/1000);}
    function jumpIntro(index){if(index>=INTRO.length){finishIntro();return;}introAt=Date.now()-Opening.startAt(Math.max(0,index))*1000;introPausedAt=null;introPauseTotal=0;lastIntro=-1;}
    function toggleIntro(){if(introPausedAt===null)introPausedAt=Date.now();else{introPauseTotal+=Date.now()-introPausedAt;introPausedAt=null;}}
    function finishIntro(){
      introPausedAt=null;introAutoPause=false;
      if(returnTo){screen=returnTo;returnTo=null;return;}
      state.started=true;enterGame();persist();
    }
    function openingFrame(shot,progress,alpha=1){
      const a=artSource(shot.frame);if(!a)return;ctx.save();ctx.globalAlpha=alpha;
      const z=reduced()?1:1.015+progress*.045;cover(a.img,0,0,W,H,z,[a.sx,a.sy,a.sw,a.sh]);ctx.restore();
    }
    function drawIntro(now){
      const current=Opening.at(introElapsed(now));if(!current){finishIntro();return;}
      const {index,t,progress,shot,elapsed}=current;
      if(index!==lastIntro)lastIntro=index;
      ctx.fillStyle='#0b1c21';ctx.fillRect(0,0,W,H);
      const blend=reduced()?1:Math.min(1,t/.7);if(index>0&&blend<1)openingFrame(INTRO[index-1],1);openingFrame(shot,progress,index===0?1:blend);
      ctx.fillStyle=gradient(0,H,'#07171b0a','#4b2e3be3');ctx.fillRect(0,0,W,H);ctx.fillStyle=gradient(0,95+safe,'#67445180','#67445100');ctx.fillRect(0,0,W,95+safe);
      if(!reduced()){
        const time=elapsed*1000;
        if(shot.effect==='rain'){
          ctx.strokeStyle='#dcebf36b';ctx.lineWidth=.8;
          for(let i=0;i<55;i++){const y=(i*59+time/4)%H,x=(i*43)%W;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-6,y+28);ctx.stroke();}
        }else if(shot.effect==='dawn'){
          ctx.fillStyle='#ffe4b211';ctx.fillRect(0,0,W,H*.66);ctx.fillStyle='#e3ece514';for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(130+Math.sin(elapsed/3+i)*95,H*(.39+i*.08),200,12+i*4,0,0,Math.PI*2);ctx.fill();}
        }else if(shot.effect==='lanterns'){
          for(let i=0;i<7;i++){const x=32+i*53+Math.sin(elapsed+i)*4,y=H*.7-(time/32+i*73)%(H*.65);ctx.save();ctx.globalAlpha=.58;ctx.drawImage(images.lantern,x-6,y,13,26);ctx.restore();}
        }else{
          ctx.fillStyle=shot.effect==='accusation'?'#ad2f1813':'#ffd78c44';
          for(let i=0;i<16;i++){const x=(i*91+elapsed*4)%W,y=(i*79-time/80)%(H*.70);ctx.beginPath();ctx.arc(x,y<0?y+H*.7:y,i%3===0?1.6:.8,0,Math.PI*2);ctx.fill();}
          if(shot.effect==='accusation'){ctx.fillStyle='#5a100d22';ctx.fillRect(0,0,W,H);}
        }
      }
      text(shot.place,24,safe+34,12,'#f0dbb2');
      ctx.globalAlpha=reduced()?1:Math.min(1,Math.max(0,t-.2)*2);if(index===INTRO.length-1){art('seriesWordmark',56,H-bottom-456,126,33);art('titleWordmark',23,H-bottom-417,192,161);}else text(shot.title,26,H-bottom-294,30,'#f7e2b4');ctx.globalAlpha=1;
      const caption=reduced()?shot.line:shot.line.slice(0,Math.floor(Math.max(0,t-.6)*17));lines(caption,27,H-bottom-238,336,16,'#f5ecdb',28,4);
      if(elapsed>=3){button('skip','跳过',306,safe+16,62,38,finishIntro,{paint:false});text('跳过',337,safe+35,13,'#fff2d7','center');}
      button('intro-pause',introPausedAt===null?'暂停剧情':'继续剧情',250,safe+13,44,44,toggleIntro,{paint:false});icon(introPausedAt===null?'pause':'arrow',262,safe+23,21);
      button('intro-prev','上一幕',25,H-bottom-117,76,36,()=>jumpIntro(index-1),{paint:false,disabled:index===0});text('上一幕',63,H-bottom-99,12,index===0?'#a99d8955':'#e8d5ad','center');
      button('intro-next',index===INTRO.length-1?'入长街':'下一幕',289,H-bottom-117,76,36,()=>jumpIntro(index+1),{paint:false});text(index===INTRO.length-1?'入长街':'下一幕',327,H-bottom-99,12,'#f4dba9','center');
      text(`${index+1} / ${INTRO.length}`,195,H-bottom-99,11,'#cfb98d','center');
      rect(26,H-bottom-55,338,2,0,'#eee2c52a');rect(26,H-bottom-55,338*Math.min(1,elapsed/Opening.DURATION),2,0,GOLD);text('江楚儿 · 前尘',26,H-bottom-32,10,'#cfb98d');text(introPausedAt===null?'七幕前尘':'剧情已暂停',364,H-bottom-32,10,'#cfb98d','right');
    }
    function districtView(i,prosperous=true){
      if(i>=6){const img=images.endgame;return{img,crop:img?[(i-6)*img.width/3,0,img.width/3,img.height]:null};}
      if(i>=3){const img=images.frontier;return{img,crop:img?[(i-3)*img.width/3,0,img.width/3,img.height]:null};}
      if(i>0){const img=images.mapWorld;return{img,crop:img?[(i-1)*img.width/2,0,img.width/2,img.height]:null};}
      return{img:prosperous?images.street:images.early,crop:null};
    }
    function streetViewport(){return Street.viewport(W,H,safe,bottom);}
    function ensureStreet(){const v=streetViewport();if(streetCamera.region!==state.district)focusStreetHome();else Street.constrain(streetCamera,v);return v;}
    function locateShop(shop=selectedShop){if(screen!=='game'||modal)return false;selectedShop=shop;Street.focus(streetCamera,streetViewport(),state.district,shop);draw(Date.now());return true;}
    function streetShop(region,i){if(!state.districts[region])return;state.activeTrade='shops';state.district=region;streetCamera.region=region;selectedShop=i;persist();open('shop');}
    function streetTiles(v,pad=0){return Street.tiles().filter(t=>t.x+t.w>=streetCamera.x-pad&&t.x<=streetCamera.x+v.w/streetCamera.zoom+pad&&t.y+t.h>=streetCamera.y-pad&&t.y<=streetCamera.y+v.h/streetCamera.zoom+pad);}
    function paintStreetTile(t,x,y,w,h){
      const image=streetArt.get(t.id);
      if(image){const f=ART.frames['cityPart'+t.id],sw=image.width*f.w,sh=image.height*f.h;ctx.drawImage(image,f.u*image.width,f.v*image.height,sw,sh,x,y,w,h);}
      else{const image=images.streetPreview;if(image)ctx.drawImage(image,t.x/Street.WIDTH*image.width,t.y/Street.HEIGHT*image.height,t.w/Street.WIDTH*image.width,t.h/Street.HEIGHT*image.height,x,y,w,h);}
    }
    function paintStreetWindow(center,x,y,w,h,worldWidth=430){
      const f=w/worldWidth,pieces=Street.tiles().filter(t=>Math.abs(t.x+t.w/2-center.x)<t.w/2+worldWidth/2&&Math.abs(t.y+t.h/2-center.y)<t.h/2+h/(2*f));
      streetArt.update(pieces.map(t=>t.id));ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
      for(const t of pieces)paintStreetTile(t,x+w/2+(t.x-center.x)*f,y+h/2+(t.y-center.y)*f,t.w*f,t.h*f);ctx.restore();
    }
    function drawStreetWorld(){
      const v=ensureStreet(),origin={x:-streetCamera.x*streetCamera.zoom,y:v.y-streetCamera.y*streetCamera.zoom};
      const visible=streetTiles(v),near=streetTiles(v,160);streetArt.update(visible.map(t=>t.id),near.map(t=>t.id));ctx.fillStyle='#d8b8bc';ctx.fillRect(0,0,W,H);for(const t of streetTiles({...v,y:0,h:H})){const x=origin.x+t.x*streetCamera.zoom,y=origin.y+t.y*streetCamera.zoom,tw=t.w*streetCamera.zoom,th=t.h*streetCamera.zoom;paintStreetTile(t,x,y,tw,th);}
      ctx.save();ctx.beginPath();ctx.rect(v.x,v.y,v.w,v.h);ctx.clip();
      World.DISTRICTS.forEach((d,region)=>{
        const p=Street.project(streetCamera,v,Street.center(region)),cell=Street.cell(region);
        if(!state.districts[region]){
          if(p.x<-cell.w||p.x>W+cell.w||p.y<v.y-cell.h||p.y>v.y+v.h+cell.h)return;
          ctx.save();ctx.translate(p.x,p.y);ctx.scale(cell.w*.5*streetCamera.zoom,cell.h*.5*streetCamera.zoom);const mist=ctx.createRadialGradient(0,0,.03,0,0,1.08);mist.addColorStop(0,'#e9eddfed');mist.addColorStop(.62,'#eceddddb');mist.addColorStop(1,'#e6eadb00');ctx.fillStyle=mist;ctx.fillRect(-1.08,-1.08,2.16,2.16);ctx.restore();
          if(p.x<45||p.x>W-45||p.y<v.y+48||p.y>v.y+v.h-50)return;
          artPlate('secondary',p.x-71,p.y-19,142,39);icon('lock',p.x-9,p.y-42,18,TEAL);text(d.name,p.x,p.y,15,INK,'center',true);text('点击查看开拓条件',p.x,p.y+36,10,TEAL,'center');button('street-gate-'+region,'开拓'+d.name,p.x-73,p.y-44,146,91,()=>{open('map');mapSelected=region;},{paint:false});return;
        }
        const title=Street.project(streetCamera,v,{x:cell.x+cell.w*.5,y:cell.y+cell.h*.09});
        if(title.x>75&&title.x<W-75&&title.y>v.y+10&&title.y<v.y+v.h-18){ctx.save();ctx.shadowColor='#f7edc7';ctx.shadowBlur=5;text(d.name,title.x,title.y,18,'#365849','center',true);ctx.restore();}
        C.SHOPS.forEach((def,i)=>{
          if(!Needle.storesAvailable(state)&&!(i===0&&state.needlework.teaUnlocked))return;
          const anchor=Street.project(streetCamera,v,Street.shop(region,i));
          if(anchor.x<15||anchor.x>W-15||anchor.y<v.y+50||anchor.y>v.y+v.h-64)return;
          const x=Math.max(56,Math.min(W-56,anchor.x)),y=anchor.y,owned=state.shops[i].level>0;
          ctx.strokeStyle='#916e46';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,y+48);ctx.lineTo(anchor.x,anchor.y+59);ctx.stroke();ctx.beginPath();ctx.arc(anchor.x,anchor.y+60,3,0,Math.PI*2);ctx.fillStyle=GOLD;ctx.fill();
          artPlate(owned?'secondary':'ribbon',x-53,y-19,106,37);text(Street.name(region,i),x,y-1,13,owned?INK:'#f8e7c0','center',true);rect(x-50,y+22,100,23,9,'#fff4e8f5','#c8a98e');fitText(owned?'营业中 · '+state.shops[i].level+'级':'尚未开张',x,y+34,10,82,INK,'center',true);
          const id=region===state.district?'shop-'+i:'street-shop-'+region+'-'+i;button(id,d.name+' · '+Street.name(region,i),x-55,y-23,110,74,()=>streetShop(region,i),{paint:false});
        });
      });
      const np=Street.project(streetCamera,v,Needle.POSITION);
      if(np.x>27&&np.x<W-27&&np.y>v.y+42&&np.y<v.y+v.h-64){
        const nx=Math.max(61,Math.min(W-61,np.x)),ny=np.y;artPlate('secondary',nx-57,ny-23,114,42);art('needleHoop',nx-48,ny-18,25,28);text(Needle.NAME,nx+12,ny-2,12,INK,'center',true);rect(nx-57,ny+25,114,23,9,'#fff4e8f5','#c8a98e');fitText('绣坊 '+state.needlework.level+'级 · 接单绣作',nx,ny+37,10,100,INK,'center',true);button('needle-shop','楚绣坊 · 接单绣作',nx-59,ny-27,118,79,needleHome,{paint:false});
      }
      ctx.restore();
      ctx.fillStyle=gradient(v.y-12,34,'#8a596280','#8a596200');ctx.fillRect(0,v.y-12,W,34);
      text('拖动画卷 · 点店开门',W-17,v.y+14,10,'#f5efd9','right');
      ctx.fillStyle=gradient(0,v.y,'#77505be3','#a9788266');ctx.fillRect(0,0,W,v.y);ctx.fillStyle=gradient(v.y+v.h-14,H-v.y-v.h+14,'#8a596200','#6b4652e8');ctx.fillRect(0,v.y+v.h-14,W,H-v.y-v.h+14);
    }
    function needleEmblem(){
      art('needleHoop',15,safe+66,42,46);
      const a=Needle.artwork(0);ctx.save();ctx.beginPath();ctx.arc(36,safe+85,10,0,Math.PI*2);ctx.clip();art(a.frame,26,safe+75,20,20);ctx.restore();
    }
    function drawHUD(){
      ctx.fillStyle=gradient(0,132+safe,'#69434dd9','#69434d00');ctx.fillRect(0,0,W,132+safe);
      if(state.needlework.wearing!==null)outfitCircle(Needle.WARDROBE.indexOf(state.needlework.wearing),15,safe+12,42);else avatarCircle(state.avatar,15,safe+12,42);button('profile','掌柜小传 · 改名与头像',10,safe+6,185,52,()=>open('profile'),{paint:false});
      fitText(Profile.name(state),67,safe+27,16,132,'#fff1d0');
      fitText('Lv.'+Profile.rank(state).level+' · '+World.DISTRICTS[state.district].name+' · '+Profile.rank(state).title,67,safe+51,10,298,'#e0d2ad');
      icon('coin',213,safe+19,17,'#e5c77e');text(hudCurrency(state.silver),282,safe+28,15,'#fff0bd','right',true);
      icon('fame',295,safe+20,15,'#dac387');text(hudCurrency(state.fame),341,safe+28,12,'#f4e5c5','right');
      button('settings','设置',345,safe+8,37,44,()=>open('settings'),{paint:false});
      icon('settings',350,safe+17,27);
      button('energy','体力与补给',193,safe+65,64,49,openEnergy,{paint:false});
      rect(194,safe+74,63,24,12,'#fff0e6','#d0a273');rect(197,safe+77,57,18,9,null,'#e3c69b');
      fitText(state.energy+'/'+Energy.CAP,225.5,safe+86,11,51,INK,'center',true);if(env.review)quietReview.push({text:state.energy+'/'+Energy.CAP,x:200,y:safe+79,w:51,h:14,font:11});text('体力',225,safe+105,9,'#fff1dc','center');
      button('growth','经营手册',265,safe+65,49,49,()=>Needle.storesAvailable(state)?openBook():open('needle-book'),{paint:false});icon('orders',272,safe+62,35);text(Needle.storesAvailable(state)?'手册':'绣样',289,safe+103,10,'#f7e5bd','center');
      button('store','华裳阁',326,safe+65,49,49,()=>Needle.storesAvailable(state)?open('store'):open('needle-wardrobe'),{paint:false});icon('clothes',333,safe+62,35);text(Needle.storesAvailable(state)?'华裳':'衣橱',350,safe+103,10,'#f7e5bd','center');
      if(state.bank>=1){button('needle-entry','回楚绣坊',15,safe+68,49,43,needleHome,{paint:false});needleEmblem();button('collect','收取伙计代营盈余',69,safe+70,115,38,()=>{const n=C.collect(state);if(n){say(`伙计代营，收取${n}银两`);persist();}},{paint:false});text(`代营 ${hudCurrency(state.bank)}两`,72,safe+82,10,'#ebdbb5');text('点击收取',72,safe+101,9,'#ebdbb5');}
      else{button('needle-entry','回楚绣坊',17,safe+68,166,43,needleHome,{paint:false});needleEmblem();text('楚绣坊 · '+state.needlework.level+'级',59,safe+88,11,'#eddfbe');}
    }
    function drawGame(now){
      drawStreetWorld();drawHUD();streetActivities(now);
      const sewing=state.activeTrade==='needlework',questY=H-bottom-138,q=sewing?{title:Needle.goal(state)}:C.QUESTS[state.quest],done=!sewing&&C.questReady(state);
      artPlate('scroll',15,questY-4,360,34,true);
      icon('seal',27,questY+1,22);
      fitText(q?q.title:'长街初成，灯火不息',59,questY+12,11,264,INK,'left',true);
      if(done)text('领奖',350,questY+12,10,RED,'right',true);else icon('arrow',340,questY+2,19);
      button('quest',done?'领取主线奖励':'前往主线目标',19,questY-3,352,28,sewing?needleHome:questAction,{paint:false});
      const playY=H-bottom-98;
      button('play-service',sewing?'开张接绣单 · 楚绣坊':'开门迎客 · '+Street.name(state.district,state.shops[selectedShop].level?selectedShop:0),24,playY,215,35,()=>{if(sewing){needleHome();return;}if(!state.shops[selectedShop].level)selectedShop=0;open('service-brief');},{type:'gold',size:16});
      const next=!sewing&&C.nextShop(state);button('street-home',next?'筹开'+next.short:'回我的店',257,playY,111,35,()=>{if(next){selectedShop=next.index;open('shop');}else focusStreetHome();},{type:'outline',size:13});
      const navY=H-bottom-60;
      ctx.fillStyle=gradient(navY-8,68+bottom,'#1e241800','#63444dea');ctx.fillRect(0,navY-8,W,68+bottom);artPlate('navShelf',-7,navY+14,W+14,52+bottom);
      (Needle.storesAvailable(state)?[['street','商街',null],['orders','商单','orders'],['partners','伙伴','partners'],['case','旧案','case'],['map','舆图','map']]:[['street','绣坊','needle-lobby'],['orders','进货','needle-supply'],['case','绣样','needle-book'],['clothes','衣橱','needle-wardrobe'],['map','舆图','map']]).forEach(([id,label,target],i)=>{
        const x=i*78;icon(id==='map'?'street':id,x+22,navY-2,35);text(label,x+39,navY+45,10,INK,'center',!target);
        button('nav-'+id,label,x,navY+2,78,56,()=>{if(target==='needle-lobby')needleHome();else if(target==='needle-supply')openNeedleSupply();else if(target)open(target);else close();},{paint:false});
        if(id==='orders'&&canAnyOrder()){ctx.beginPath();ctx.fillStyle=RED;ctx.arc(x+66,navY+12,2.5,0,Math.PI*2);ctx.fill();}
      });
    }
    function canAnyOrder(){return state.shops[0].level&&(C.canDeliver(state,C.availableOrder(state,0))||C.canDeliver(state,C.availableOrder(state,1))||(C.clueAvailable(state)&&C.canDeliver(state,C.CLUE_ORDERS[state.clues])));}
    function questAction(){
      if(C.questReady(state)){
        const q=C.claimQuest(state);pop(`银两 +${q.reward} · 声望 +${q.fame}`,195,H*.6);persist();
        if(q.story!==undefined){storyIndex=q.story;storyStep=0;open('story');}
        else if(state.quest>=C.QUESTS.length)open('finish');
        return;
      }
      const q=C.QUESTS[state.quest];if(!q){open('finish');return;}
      if(q.kind==='shop'){selectedShop=q.shop;open('shop');}
      else if(q.kind==='staff')open('partners');
      else if(q.kind==='orders'||q.kind==='clue')open('orders');
      else if(q.kind==='levels'){selectedShop=state.shops[0].level<3?0:1;open('shop');}
      else{selectedShop=state.shops.findIndex(x=>x.level<q.value);if(selectedShop<0)selectedShop=0;open('shop');}
    }
    function sheet(title,sub,height=580){
      ctx.fillStyle='#70465378';ctx.fillRect(0,0,W,H);hits=[];
      const x=12,w=366,subWidth=w-70;ctx.font=`10px ${FONT}`;const extra=ctx.measureText(playerText(sub)).width>subWidth?14:0;
      const wanted=height+extra+18,h=Math.min(wanted,H-safe-bottom-42),y=Math.max(safe+20,H-bottom-h-17),cx=x+w-49,cy=y+45;
      ctx.save();ctx.shadowColor='#201a1455';ctx.shadowBlur=24;artPlate('ledger',x-3,y-7,w+6,h+14,true);ctx.restore();
      const titleSize=fitText(title,x+31,y+44,22,cx-30-(x+31),'#68464e','left',true);lines(sub,x+35,y+73,subWidth,10,'#877454',14,2);divider(x+35,y+94+extra,w-70);
      closeControl('close','关闭',cx,cy,()=>{if(modal==='regional'){leaveRegional();}else if(modal==='festival-result'){screen='festival';close();}else if(modal==='rain-result'){screen='game';close();}else if(modal==='rain-archive'&&screen==='service'&&service?.rainRun&&service.finished)open('rain-result');else if(modal==='stock')leaveStock();else if(modal==='energy')leaveEnergy();else if(modal==='growth')leaveBook();else if(screen==='needlework'&&state.needlework.run?.finished)needleHome();else if(screen==='service'&&modal==='service-result'){screen='game';close();}else if(screen==='service'&&service?.finished)open('service-result');else if(screen==='service')modal=null;else close();});
      const bodyY=y+112+extra,q=Math.min(1,(h-132-extra)/(height-114));panelReview={title:playerText(title),x,y,w,h,titleSize,header:{x:x+31,y:y+31,w:cx-30-(x+31),h:27},close:{x:cx-22,y:cy-22,w:44,h:44},bodyY,scale:q};paintReview=[];
      paragraphReview=[];panelTransform={q,y:bodyY};ctx.translate(195*(1-q),bodyY*(1-q));ctx.scale(q,q);
      return{x:x+35,y:bodyY,w:w-70,h:height-114,bottom:bodyY+height-114,top:y};
    }
    function divider(x,y,w){ctx.fillStyle='#c6b68b66';ctx.fillRect(x,y,w,.7);}
    function shopModal(){
      const i=selectedShop,shop=state.shops[i],def=C.SHOPS[i],b=sheet(Street.name(state.district,i),World.DISTRICTS[state.district].name+' · '+def.verb,520),y=b.y;
      paintStreetWindow(Street.shop(state.district,i),b.x,y,b.w,90);
      ctx.fillStyle=gradient(y,90,'#68424e00','#704652ad');ctx.fillRect(b.x,y,b.w,90);
      text(shop.level?`${C.STAGES[C.tier(shop.level)]} · ${shop.level}级`:'尚未开张',b.x+12,y+70,15,'#fff1d1','left',true);
      if(i===0&&!shop.level&&!state.needlework.teaUnlocked){
        art('needleBasket',139,y+107,112,103);text('先靠绣作攒本钱，再开茶肆',195,y+245,16,TEAL,'center',true);text('完成一轮绣帕小单 · 交付5方即可开茶铺',195,y+278,10,FADE,'center');fitText(Needle.goal(state),195,y+306,12,b.w,INK,'center');button('tea-needle-first','回楚绣坊 · 接单挣钱',b.x,b.bottom-45,b.w,42,needleHome,{type:'gold',size:16});return;
      }
      text(!shop.level&&i>0?'下一间铺子的手艺':'营业制作位',b.x,y+117,11,FADE);
      fitText(!shop.level&&i===1?'调香 · 装囊 · 压香印':!shop.level&&i===2?'蒸糕 · 压花 · 烘焙':shop.level>=3?'双工作台 + 辅台':'工作台 + 辅台',b.x,y+142,17,178,TEAL,'left',true);
      text('扩建收益',b.x+184,y+117,11,FADE);
      text(shop.level===2?'解锁第二工作台':'缩短制作时间',b.x+184,y+141,13,INK);
      const staff=C.PARTNERS.find(p=>p.id===shop.staff);
      divider(b.x,y+165,b.w);
      text(staff?`掌事：${staff.name}`:'掌事：还没有伙伴帮忙',b.x,y+187,12,INK);
      text(i===0?'阿绫入驻：沏茶快22%':i===1?'沈知微入驻：客人耐心多6秒':'周小满入驻：点心快28%',b.x,y+211,11,'#9a805b');
      if(!shop.level&&i>0)text(`开张所需声望 ${def.fame} · 已有 ${state.fame}`,b.x,y+236,11,state.fame>=def.fame?TEAL:RED);
      if(shop.level)button('decorate','布置我的店 · 雅致'+World.beauty(state,i),b.x,y+248,b.w,35,()=>{screen='decorate';modal=null;selectedSlot='table1';decorPage=0;},{type:'outline',size:12});
      const next=shop.level>=9?'本版已满级':`${shop.level?'扩建店铺':'开门迎客'} · ${currency(C.cost(state,i))}两`;
      button('upgrade',next,b.x,b.bottom-96,b.w,43,()=>{const r=C.upgrade(state,i);say(r.message,!r.ok);if(r.ok){chime('upgrade');persist();if(state.shopStories.pending.length)enterOpening({screen:'game',modal:'shop',shop:i});}},{type:'gold',disabled:shop.level>=9,size:15});
      const bw=(b.w-14)/2;
      button('assign','安排伙伴',b.x,b.bottom-41,bw,39,()=>open('partners'),{type:'outline',disabled:!shop.level});
      button('go-service','亲自营业',b.x+bw+14,b.bottom-41,bw,39,()=>i===0&&!state.guide.done?open('welcome'):open('service-brief'),{type:'outline',disabled:!shop.level});
    }
    function inventory(x,y){C.SHOPS.forEach((d,i)=>{icon(d.id,x+i*99,y-10,18,TEAL);text(`${d.good} ${state.shops[i].stock}`,x+24+i*99,y,11,INK);});}
    function orderCard(o,x,y,w,slot,isClue,compact){
      const h=compact?112:121;
      if(isClue){art('seal',x+1,y+4,27,27);}else art('orders',x+1,y+5,27,27);
      text(o.name,x+35,y+18,15,INK,'left',true);
      text(o.tag,x+w-12,y+19,10,isClue?'#a26448':'#7c744d','right');
      text(o.who,x+12,y+39,10,'#8c8b76');if(o.note)text(o.note,x+12,y+56,9,'#8b7e67');
      const need=Object.entries(o.need).map(([id,n])=>{const ix=C.SHOPS.findIndex(x=>x.id===id);return `${C.SHOPS[ix].good} ${state.shops[ix].stock}/${n}`;}).join('  ·  ');
      text(need,x+12,y+76,11,C.canDeliver(state,o)?TEAL:RED);
      text(`银两 +${o.silver}  声望 +${o.fame}`,x+12,y+h-22,11,'#8d7040');
      button(isClue?'deliver-clue':'deliver-'+slot,C.canDeliver(state,o)?'交付':'备货中',x+w-88,y+h-39,76,33,()=>{
        const r=C.deliver(state,slot,isClue);if(r.ok){pop(r.message,195,y);persist();if(isClue)say('证据已入账，回商街领取主线奖励');}else say(r.message);
      },{disabled:!C.canDeliver(state,o),size:12});
      divider(x+8,y+h-1,w-16);
    }
    function ordersModal(){
      const b=sheet('长街商单',`本地可接${C.unlockedOrders(state).length}类 · 全图共${C.ORDER_TEMPLATES.length}类商单`,604);
      inventory(b.x,b.y+6);divider(b.x,b.y+29,b.w);
      if(!state.shops[0].level){lines('先开张凤来茶肆，\n第一位客人已经在街口等你。',b.x+15,b.y+88,b.w-30,17,INK,30);button('go-tea','去开张',b.x,b.bottom-49,b.w,45,()=>{selectedShop=0;open('shop');},{type:'gold'});return;}
      const compact=b.h<470,h=compact?112:121,gap=10;
      orderCard(C.availableOrder(state,0),b.x,b.y+44,b.w,0,false,compact);
      orderCard(C.availableOrder(state,1),b.x,b.y+44+h+gap,b.w,1,false,compact);
      const yy=b.y+44+(h+gap)*2;
      if(C.clueAvailable(state))orderCard(C.CLUE_ORDERS[state.clues],b.x,yy,b.w,0,true,compact);
      else{
        icon('case',b.x+16,yy+22,34);
        text(state.clues===3?'旧案证据已收齐':'有缘人，藏在下一段生意里',b.x+60,yy+28,13,INK);
        lines(state.clues===3?'回商街完成主线，点亮整条长街。':'推进眼前主线后，线索订单将常驻出现。',b.x+60,yy+53,b.w-72,11,'#878974',18,2);
      }
    }
    function partnersModal(){
      const b=sheet('伙伴相助','手艺不同，和你同撑长街。',609),row=Math.min(136,(b.h-57)/3);
      C.PARTNERS.slice(crewPage*3,crewPage*3+3).forEach((p,i)=>{
        const y=b.y+i*row,hired=state.crew.includes(p.id);if(i)divider(b.x,y-5,b.w);
        staffPortrait(p,b.x,y+2,49);text(`${p.name} · ${p.job}`,b.x+61,y+15,16,INK,'left',true);
        const assigned=state.shops.findIndex(x=>x.staff===p.id);text(hired?(assigned>=0?`现掌${C.SHOPS[assigned].short}`:'待安排'):`声望${p.fame} · 招募${p.cost}两`,b.x+61,y+40,11,'#8c7c60');
        text(C.SHOPS.find(d=>d.id===p.specialty).short+'专长：'+p.skill,b.x,y+72,11,'#8b7959');
        if(!hired){button('recruit-'+p.id,'请'+p.name+'来相助',b.x+27,y+91,b.w-54,33,()=>{const r=World.recruit(state,p.id);say(r.message);if(r.ok){persist();chime('upgrade');}},{type:'gold',size:12});}
        else C.SHOPS.forEach((d,j)=>{const active=state.shops[j].staff===p.id,bw=(b.w-12)/3;button(`assign-${p.id}-${j}`,active?`已掌${d.short}`:d.short,b.x+j*(bw+6),y+92,bw,33,()=>{if(C.assign(state,p.id,j)){say(p.name+'已到'+d.name+'帮忙');persist();}},{type:active?'gold':'outline',disabled:!state.shops[j].level,size:11});});
      });
      button('crew-prev','上一页',b.x,b.bottom-37,98,33,()=>{crewPage=0;},{type:'outline',disabled:crewPage===0,size:12});text((crewPage+1)+' / 2',195,b.bottom-21,12,INK,'center');button('crew-next','下一页',b.x+b.w-98,b.bottom-37,98,33,()=>{crewPage=1;},{type:'outline',disabled:crewPage===1,size:12});
    }
    function mapModal(){
      const b=sheet('九州商路','九处渐开 · 已开拓 '+state.districts.filter(Boolean).length+' / '+World.DISTRICTS.length+' · 按经营历程逐处开放',640),mx=b.x,my=b.y+2,mw=b.w,mh=mw*2/3;
      cover(images.atlas,mx,my,mw,mh);mapGrowth(mx,my,mw,mh);
      World.DISTRICTS.forEach((d,i)=>{
        const x=mx+d.node[0]*mw,y=my+d.node[1]*mh,owned=state.districts[i],active=mapSelected===i;
        if(active){ctx.beginPath();ctx.arc(x,y-14,18,0,Math.PI*2);ctx.fillStyle='#ffe8aa99';ctx.fill();}
        icon(owned?'seal':'lock',x-9,y-27,18,owned?GOLD:'#5a6255');
        artPlate(active?'primary':'secondary',x-44,y-3,88,29);quietLabel(d.name,x-44,y-3,11,88,29);
        if(state.district===i){text('此地',x,y+34,9,'#355d47','center',true);}
        button('district-'+i,d.name,x-51,y-26,102,56,()=>{mapSelected=i;chime('tap');},{paint:false});
      });
      const d=World.DISTRICTS[mapSelected],py=b.y+239,status=World.districtStatus(state,mapSelected),owned=state.districts[mapSelected];
      paintStreetWindow(Street.center(mapSelected),b.x,py,b.w,77);ctx.fillStyle=gradient(py,77,'#19372b00','#6f4652cf');ctx.fillRect(b.x,py,b.w,77);text(d.name,b.x+12,py+53,19,'#fff0cc','left',true);
      if(Needle.storesAvailable(state))button('map-specialty','地方名物',b.x+b.w-102,py+39,100,30,()=>openRegional(mapSelected),{type:'outline',size:11});
      text(!Needle.storesAvailable(state)&&mapSelected===0?'一针一线，先在溪桥立足':d.sub,195,b.y+337,11,INK,'center');
      const extra=d.specialty==null?'':` · ${C.SHOPS[d.specialty].short}再加${Math.round(d.specialBonus*100)}%`;
      text(`营业加成 ${Math.round(d.bonus*100)}%`+extra+(mapSelected>=3?' · 地方专单':''),195,b.y+359,10,TEAL,'center');
      if(!Needle.storesAvailable(state)){fitText(Needle.goal(state),195,b.y+389,12,b.w,TEAL,'center');text('先将楚绣坊经营起来，再一步步开拓九处商街',195,b.y+418,10,FADE,'center');button('map-travel','回楚绣坊 · 先靠手艺立足',b.x,b.bottom-39,b.w,36,needleHome,{type:'gold',size:14});return;}
      if(owned){text('已经通商，自由往返不再花银两',b.x+4,b.y+389,12,TEAL);text(mapSelected>=3?'地方客人进店 · 三铺共用等级与布置':'经营、伙伴与家具沿用三家总铺进度',b.x+4,b.y+414,10,FADE);}
      else status.checks.forEach((c,i)=>text((c.met?'✓ ':'○ ')+c.label,b.x+4,b.y+383+i*16,10,c.met?TEAL:RED));
      button('map-travel',owned?(state.district===mapSelected?'返回此地经营':'前往'+d.name):'开拓商路 · '+d.cost+'两',b.x,b.bottom-39,b.w,36,()=>{const was=state.districts[mapSelected],r=World.unlockDistrict(state,mapSelected);say(r.message,!r.ok);if(r.ok){selectedShop=Street.featured(mapSelected);persist();if(!was){open('region-arrival');if(state.shopStories.pending.length)enterOpening({screen:'game',modal:'region-arrival',shop:selectedShop});}else close();chime('upgrade');}},{type:'gold',size:14});
    }
    function drawDecorate(now){
      if(!World.SLOTS.some(s=>s.id===selectedSlot))selectedSlot='table1';
      roomBackdrop(selectedShop,decorOffset());drawFurnishing(selectedShop,true);for(let i=0;i<3;i++)drawTable(selectedShop,i,true);
      ctx.fillStyle=gradient(0,188+safe,'#7c515ccf','#7c515c00');ctx.fillRect(0,0,W,188+safe);
      text(C.SHOPS[selectedShop].name+' · 换装',22,safe+26,21,'#fff0cc','left',true);
      text(`${currency(state.silver)}两 · 雅致${World.beauty(state,selectedShop)} · 点家具选款式`,22,safe+53,11,'#efdab3');
      closeControl('decor-home','换装完成',348,safe+31,()=>{screen='game';persist();});
      C.SHOPS.forEach((d,i)=>button('decor-shop-'+i,d.short,31+i*112,safe+78,104,34,()=>{selectedShop=i;decorPage=0;},{type:i===selectedShop?'gold':'outline',disabled:!state.shops[i].level,size:12}));
      const type=World.SLOTS.find(s=>s.id===selectedSlot).type;
      [['table','桌椅','table1'],['counter','柜面','counter'],['ornament','陈设','left'],['rug','地毯','rug']].forEach(([kind,label,slot],i)=>button('decor-type-'+kind,label,31+i*85,safe+126,77,28,()=>{selectedSlot=slot;decorPage=0;},{type:kind===type?'gold':'outline',size:11}));
      const y=H-bottom-176,catalog=World.catalog(selectedSlot),pages=Math.ceil(catalog.length/3),active=state.decorEquipped[selectedShop][selectedSlot];decorPage=Math.min(decorPage,pages-1);
      ctx.fillStyle=gradient(y-36,212,'#1c302500','#192d27ed');ctx.fillRect(0,y-36,W,H-y+36);
      artPlate('ribbon',67,y-83,256,36);quietLabel(World.SLOTS.find(s=>s.id===selectedSlot).name+' · 换款式',67,y-83,13,256,36,'#fff0cc');
      rect(15,y-28,242,27,13,'#69434ded');text('已购款式免费换 · '+(decorPage+1)+'/'+pages,27,y-14,11,'#fff4df');
      button('decor-prev','上一页',270,y-35,44,44,()=>{decorPage=Math.max(0,decorPage-1);},{paint:false,disabled:decorPage===0});leftArrow(281,y-22,21,decorPage===0?.3:1);
      button('decor-next','下一页',331,y-35,44,44,()=>{decorPage=Math.min(pages-1,decorPage+1);},{paint:false,disabled:decorPage===pages-1});art('arrow',342,y-22,21,21,decorPage===pages-1?.3:1);
      catalog.slice(decorPage*3,decorPage*3+3).forEach((d,i)=>{
        const x=70+i*125,owned=!d.event&&d.price===0||state.decorOwned[selectedShop].includes(d.id),inUse=active===d.id,frame=d.type==='table'?d.frame+Number(selectedSlot.slice(-1)):d.frame;
        if(frame)art(frame,x-46,y+5,92,82);else{artPlate('secondary',x-32,y+30,64,32);text('留空',x,y+47,12,INK,'center');}
        if(inUse){art('star',x+28,y+6,18,18);}
        text(d.name,x,y+99,12,'#fff0cc','center',true);text((owned?'已解锁':d.event?'活动获得':d.price+'两')+(d.beauty?' · 雅致+'+d.beauty:''),x,y+118,10,'#e7ce9c','center');
        button('decor-style-'+d.id,inUse?'使用中':owned?'换上':'解锁并换上',x-48,y+134,96,30,()=>{const r=World.chooseDecor(state,selectedShop,selectedSlot,d.id);say(r.message);if(r.ok){persist();chime('tap');}},{type:inUse?'outline':owned?'outline':'gold',disabled:inUse||!!d.event&&!owned,size:11});
      });
    }
    function caseModal(){
      const b=sheet('旧案手札','每一笔生意，都离真相更近一点。',600);
      C.STORIES.forEach((st,i)=>{
        const y=b.y+i*139,unlocked=state.clues>i;
        icon(unlocked?'seal':'lock',b.x+8,y+2,25);
        text(`线索 ${['壹','贰','叁'][i]}`,b.x+42,y+18,10,'#9e8150');
        text(unlocked?st.clue:'墨迹未显',b.x+12,y+44,17,unlocked?TEAL:'#999a83','left',true);
        lines(unlocked?st.note:'继续经营商街，完成线索订单后，此页自会展开。',b.x+12,y+72,b.w-24,12,'#777e69',21,2);
        if(unlocked)button('replay-story-'+i,'重读'+st.clue,b.x,y,b.w,124,()=>{storyIndex=i;storyStep=0;open('story');},{paint:false});
        divider(b.x+8,y+126,b.w-16);
      });
      text(`已得证据 ${state.clues} / 3 · ${state.clues===3?'商路将通往王都':'主线线索均可免费获得'}`,195,b.bottom-4,11,'#8f7c55','center');
    }
    function storyModal(){
      hits=[];const st=C.STORIES[storyIndex];
      cover(images.prologue,0,0,W,H,1,[images.prologue.width/3*2,0,images.prologue.width/3,images.prologue.height]);
      ctx.fillStyle=gradient(0,H,'#a5747b4f','#5f3b49db');ctx.fillRect(0,0,W,H);
      text(st.chapter,24,safe+35,12,'#e7d6b0');text(st.title,24,safe+77,28,'#f5e4bc');
      const y=H-bottom-274;
      artPlate('scroll',14,y-5,362,235,true);
      text(storyStep? '江楚儿':st.speaker,50,y+27,16,TEAL,'left',true);
      lines(storyStep?st.reply:st.lines.join('\n'),50,y+59,290,16,INK,27,4);
      button('story-next',storyStep?'收起手札，继续经营':'听她说',196,y+169,157,39,()=>{if(!storyStep)storyStep=1;else{close();chime('story');}},{type:'gold'});
    }
    function storeModal(){
      const b=sheet('华裳阁','把挣来的日子，过成喜欢的模样。',595);
      artPlate('ribbon',b.x,b.y-2,b.w,42);quietLabel('体验版 · 以下购买均为模拟，不会扣款',b.x,b.y-2,10,b.w,42,'#fff0ce');
      C.SKUS.forEach((sku,i)=>{
        const y=b.y+53+i*111,bought=state.purchases.includes(sku.id);
        icon(i===2?'clothes':i===1?'gem':'coin',b.x+7,y+11,35,'#a68a53');
        text(sku.name,b.x+57,y+13,17,INK,'left',true);lines(sku.desc,b.x+57,y+39,b.w-64,11,'#83836d',19,2);
        const canEquip=bought&&!!sku.skin;
        button('buy-'+sku.id,canEquip?(state.skin?'收起花灯':'点亮花灯'):bought?'已拥有':`¥ ${sku.price} · 模拟购买`,b.x+96,y+67,b.w-96,33,()=>{if(canEquip){state.skin=!state.skin;persist();say(state.skin?'满庭灯火，已为你点亮':'已收起商街花灯');return;}confirmSku=sku;open('purchase');},{type:bought?'outline':'gold',disabled:bought&&!canEquip,size:12});
        divider(b.x,y+107,b.w);
      });
      text('所有旧案章节，均可免费推进。',195,b.bottom-11,11,'#8e8164','center');
    }
    function purchaseModal(){
      const sku=confirmSku;if(!sku){open('store');return;}
      const b=sheet('模拟购买确认','体验版商城，不接入真实支付。',365);
      text(sku.name,195,b.y+15,24,TEAL,'center',true);
      lines(sku.desc,b.x+13,b.y+57,b.w-26,14,INK,25,3);
      text('确认后发放体验道具，不会产生费用。',195,b.bottom-88,12,FADE,'center');
      button('confirm-purchase','确认模拟领取',b.x,b.bottom-49,b.w,45,()=>{
        const ok=C.buy(state,sku.id);if(ok){persist();say('体验权益已到账 · 未发生真实扣款');chime('upgrade');}else say('该商品已领取');open('store');
      },{type:'gold'});
    }
    function growthModal(){
      const isRecipes=bookTab==='recipes',items=Catalog.ITEMS.filter(r=>r.shop===bookShop),pages=isRecipes?Math.ceil(items.length/3):Math.ceil(S.GUESTS.length/3),b=sheet('楚儿的经营手册','售出的每一份，都在这里留下积累。',610);bookPage=Math.min(bookPage,pages-1);
      button('book-recipes','百味手艺',b.x,b.y-4,142,33,()=>{bookTab='recipes';bookPage=0;},{type:isRecipes?'gold':'outline',size:12});
      button('book-guests','长街故人',b.x+154,b.y-4,142,33,()=>{bookTab='guests';bookPage=0;},{type:!isRecipes?'gold':'outline',size:12});
      if(isRecipes){C.SHOPS.forEach((d,i)=>button('book-shop-'+i,d.short,b.x+i*101,b.y+39,94,28,()=>{bookShop=i;bookPage=0;},{type:bookShop===i?'gold':'outline',size:11}));text('本店'+items.length+'款 · 每阶加价2两，制作快4%',195,b.y+83,10,FADE,'center');}
      else text('招待满3 / 8 / 18回，熟客小费逐阶增加',195,b.y+52,10,FADE,'center');
      for(let row=0;row<3;row++){
        const y=b.y+(isRecipes?103:79)+row*(isRecipes?98:112);
        if(isRecipes){
          const r=items[bookPage*3+row];if(!r)continue;const xp=state.recipeXP[r.id],m=Growth.mastery(xp),locked=!Catalog.unlocked(state,r.id);
          art('recipeMat',b.x-1,y+14,80,57);foodSprite(r.id,b.x+39,y+35,72);text(r.name,b.x+90,y+12,15,INK,'left',true);text(locked?`本店${r.level}级`+(r.region?' · '+World.DISTRICTS[r.region].name:''):m.title+' · 每份'+(r.price+m.priceAdd)+'两',b.x+90,y+36,11,locked?FADE:TEAL);
          const frac=m.next?Math.min(1,(xp-Growth.LEVELS[m.level])/(m.next-Growth.LEVELS[m.level])):1;rect(b.x+90,y+56,b.w-96,5,2,'#c9bc9e66');rect(b.x+90,y+56,(b.w-96)*frac,5,2,'#729178');text(m.next?`熟练 ${xp}/${m.next} · 售出积1，上佳积2`:'招牌已成 · 每份加6两、制作快12%',b.x+90,y+77,9.5,FADE);
        }else{
          const id=bookPage*3+row,g=S.GUESTS[id],n=state.guestVisits[id],a=Growth.affinity(n);guestSprite(id,b.x+40,y+92,90);text(g.name,b.x+94,y+15,15,INK,'left',true);text(`${a.title} · 已招待${n}回`,b.x+94,y+42,12,TEAL);text(a.next?`再招待${Math.max(0,a.next-n)}回，交情更深`:'知音相伴 · 每次额外小费3两',b.x+94,y+66,11,FADE);lines(g.note,b.x+94,y+88,b.w-96,10,FADE,14,1);
        }
        if(row<2)divider(b.x,y+(isRecipes?92:106),b.w);
      }
      text(`${bookPage+1} / ${pages}`,195,b.bottom-64,11,FADE,'center');button('book-prev','上一页',b.x,b.bottom-83,85,33,()=>{bookPage=(bookPage+pages-1)%pages;},{type:'outline',size:11});button('book-next','下一页',b.x+b.w-85,b.bottom-83,85,33,()=>{bookPage=(bookPage+1)%pages;},{type:'outline',size:11});button('book-back',bookReturn==='service-result'?'返回营业账目':'回去经营',b.x,b.bottom-35,(b.w-12)/2,34,leaveBook,{type:'gold',size:12});button('book-lessons','跟阿绫练一遍',b.x+(b.w+12)/2,b.bottom-35,(b.w-12)/2,34,()=>open('lessons'),{type:'outline',size:11});
    }
    function stockModal(){
      const b=sheet('掌柜的货品陈列册','按店铺定位挑选，三款货单带进本场营业。',640),list=Catalog.family(selectedShop,stockSlot),pages=Math.ceil(list.length/4),menu=Catalog.menu(state,selectedShop);stockPage=Math.min(stockPage,pages-1);
      C.SHOPS.forEach((d,i)=>button('stock-shop-'+i,d.short,b.x+i*101,b.y-4,94,32,()=>{selectedShop=i;stockSlot=0;stockPage=0;},{type:selectedShop===i?'gold':'outline',size:12}));
      Catalog.FAMILIES[selectedShop].forEach((kind,i)=>button('stock-slot-'+i,kind,b.x+i*101,b.y+40,94,28,()=>{stockSlot=i;stockPage=0;},{type:stockSlot===i?'gold':'outline',size:11}));
      list.slice(stockPage*4,stockPage*4+4).forEach((r,i)=>{
        const x=b.x+(i%2)*154,y=b.y+94+Math.floor(i/2)*165,owned=Catalog.unlocked(state,r.id),active=menu[stockSlot]===r.id;
        art('recipeMat',x+15,y+12,112,59);foodSprite(r.id,x+70,y+43,88,owned?1:.40);if(active)art('star',x+112,y+3,17,17);else if(!owned)icon('lock',x+115,y+4,16,FADE);
        text(r.name,x+70,y+103,12,INK,'center',true);text(owned?(active?'本场已上架':`${r.price}两 · ${r.seconds}秒 · 换上`):`${r.level}级`+(r.region?' · '+World.DISTRICTS[r.region].name:'后解锁'),x+70,y+126,9.5,active?TEAL:FADE,'center');
        button('stock-item-'+r.id,r.name+' · '+(active?'已上架':owned?'上架':'查看解锁条件'),x+4,y,136,142,()=>{const result=Catalog.choose(state,selectedShop,stockSlot,r.id);say(result.ok?result.message:result.message+' · '+r.description,!result.ok);if(result.ok){persist();chime('tap');}},{paint:false});
      });
      text(`${stockPage+1} / ${pages} · ${list.length}款${Catalog.FAMILIES[selectedShop][stockSlot]}`,195,b.bottom-64,10,FADE,'center');button('stock-prev','上一页',b.x,b.bottom-83,82,30,()=>{stockPage=Math.max(0,stockPage-1);},{type:'outline',size:11,disabled:stockPage===0});button('stock-next','下一页',b.x+b.w-82,b.bottom-83,82,30,()=>{stockPage=Math.min(pages-1,stockPage+1);},{type:'outline',size:11,disabled:stockPage===pages-1});button('stock-back','货单选好了 · 回去准备',b.x,b.bottom-35,b.w,34,leaveStock,{type:'gold',size:13});
    }
    function energyModal(){
      Energy.sync(state);const b=sheet('掌柜小憩','歇一会，回来手艺仍在。',585),seconds=Energy.remaining(state),time=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
      art('energyRest',b.x,b.y-8,91,99);text(state.energy+' / '+Energy.CAP,b.x+116,b.y+30,31,TEAL,'left',true);text(seconds?time+' 后恢复1点':'体力充足，随时可以开门',b.x+112,b.y+67,11,FADE);
      text('每1分钟恢复1点 · 首场教学免费',195,b.y+105,11,INK,'center');
      const items=[['rest','energyRest','每日小憩',state.restClaimed?'今日已领':'免费 +30体力','免费领取'],['snack','energySnack','随身点心','剩余'+state.snacks+'份 · +20体力','用一份'],['soup','energySoup','参枣元气汤','今日'+state.energyRefills+'/3 · +40体力','20元宝']];
      items.forEach(([kind,frame,name,sub,label],i)=>{const y=b.y+126+i*87;art(frame,b.x-2,y-3,76,76);text(name,b.x+84,y+18,14,INK,'left',true);text(sub,b.x+84,y+44,10,FADE);button('energy-'+kind,label,b.x+b.w-76,y+21,76,33,()=>{const r=Energy.refill(state,kind);say(r.message);persist();if(r.ok)chime('coin');},{type:kind==='soup'?'gold':'outline',size:11,disabled:state.energy===Energy.CAP||kind==='rest'&&state.restClaimed||kind==='snack'&&!state.snacks||kind==='soup'&&state.energyRefills>=3});if(i<2)divider(b.x,y+76,b.w);});
      text('免费练手不计收益、熟练与通商进度',195,b.y+405,10,TEAL,'center');const bw=(b.w-12)/2;
      button('energy-back','回去经营',b.x,b.bottom-35,bw,34,leaveEnergy,{type:'outline',size:12});button('energy-practice','手艺初课',b.x+bw+12,b.bottom-35,bw,34,()=>state.activeTrade==='needlework'?open('lessons'):startService(true),{type:'gold',size:12});
    }
    function settingsModal(){
      const b=sheet('长街小憩','锦绣长街 · 经营的步调，由你自己决定。',550);
      button('toggle-sound',`音乐与音效：${state.sound?'开启':'关闭'}`,b.x,b.y,b.w,42,()=>{state.sound=!state.sound;if(env.music)env.music(state.sound);persist();},{type:'outline'});
      button('toggle-motion',`轻柔画面：${state.reducedMotion?'开启':'关闭'}`,b.x,b.y+55,b.w,42,()=>{state.reducedMotion=!state.reducedMotion;persist();},{type:'outline'});
      button('replay-intro','重看江楚儿开场',b.x,b.y+110,b.w,42,()=>beginIntro('game'),{type:'outline'});
      button('help','玩法指引 · 手艺初课',b.x,b.y+165,b.w,42,()=>open('lessons'),{type:'outline'});
      button('opening-journal','开铺纪事 · 重读故事',b.x,b.y+220,b.w,42,()=>{journalPage=0;open('opening-journal');},{type:'outline'});
      button('reset','重新开一局',b.x,b.y+275,b.w,42,()=>open('reset'),{type:'outline'});
      text(env.demo?'展示试玩 · 关闭或刷新后从头开始':'本地自动存档 · 当前版本 0.23.1',195,b.bottom-6,10,FADE,'center');
    }
    function simpleModal(title,sub,body,action,label,height=400){
      const b=sheet(title,sub,height);lines(body,b.x+8,b.y+15,b.w-16,16,INK,29,7);
      button('simple-action',label||'知道了',b.x,b.bottom-49,b.w,45,action||close,{type:'gold'});return b;
    }
    function drawModal(){
      ctx.save();panelTransform=null;
      if(modal==='opening-journal')openingJournal();else if(modal==='needle-business-guide')needleBusinessGuide();else if(modal==='needle-supply')needleSupply();else if(modal==='needle-wardrobe')needleWardrobe();else if(modal==='needle-grand-story')needleGrandStory();else if(modal==='needle-welcome')needleWelcome();else if(modal==='needle-brief')needleBrief();else if(modal==='needle-book')needleBook();else if(modal==='needle-result')needleResult();else if(modal==='needle-pause'){const b=sheet(env.demo?'暂歇片刻，针线先收好':'针线先收好，等你回来',env.demo?'本页内可接着绣，关闭或刷新后从头开始。':'暂歇会保留针脚和材料，继续不再扣体力。',340);button('needle-resume','接着绣',b.x,b.y+30,b.w,40,close,{type:'gold'});button('needle-save-home','暂歇 · 回绣坊',b.x,b.y+89,b.w,36,needleHome,{type:'outline'});button('needle-end','收摊结算当前绣单',b.x,b.bottom-43,b.w,35,()=>{Needle.end(state.needlework.run);settleNeedle();},{type:'outline',size:13});}else if(modal==='profile')profileModal();
      else if(modal==='regional')regionalModal();
      else if(modal==='region-arrival')regionArrival();
      else if(modal==='festival-rewards')festivalRewards();
      else if(modal==='festival-result')festivalResult();
      else if(modal==='rain')rainModal();
      else if(modal==='rain-archive')rainArchive();
      else if(modal==='rain-result')rainResult();
      else if(modal==='lessons')lessonMenu();
      else if(modal==='guide-upgrade')guideUpgrade();
      else if(modal==='session-resume')simpleModal('掌柜，手艺还在这儿','上次的客人与炉子，都已替你留好。','这是上次尚未完成的初课或活动营业。\n继续时不再扣体力，离开期间客人与火候均暂停。',()=>{modal=null;tick=Date.now();},'接着上次继续',390);
      else if(modal==='festival-how')simpleModal('先赴一席，再点一盏灯','初次赴宴免费 · 店内临借第二工作台','每席开门前可选稳妥或讲究的委托。\n完成要求，灯市就亮起一盏灯。\n十二席可领永久金桂灯。\n每席分别记账，进度不会因下一席失败而清空。',()=>{close();},'看懂了，挑第一席',450);
      else if(modal==='service-brief')serviceBriefModal();
      else if(modal==='energy')energyModal();
      else if(modal==='growth')growthModal();
      else if(modal==='stock')stockModal();
      else if(modal==='service-help')serviceHelpModal();
      else if(modal==='service-result')serviceResultModal();
      else if(modal==='service-pause'){
        const b=sheet('歇口气，先喝盏茶','暂停时，客人与炉子都会等你。',370);
        lines('可以继续接待，也可以提前收摊。\n提前结束会按当前进账与表现结算。',b.x+5,b.y+20,b.w-10,15,INK,27,3);
        button('service-resume','继续营业',b.x,b.bottom-102,b.w,43,()=>{modal=null;},{type:'gold'});
        button('service-end','提前收摊',b.x,b.bottom-46,b.w,41,()=>{service.finished=true;finishService();},{type:'outline'});
      }
      else if(modal==='map')mapModal();else if(modal==='shop')shopModal();else if(modal==='orders')ordersModal();else if(modal==='partners')partnersModal();else if(modal==='case')caseModal();
      else if(modal==='story')storyModal();else if(modal==='store')storeModal();else if(modal==='purchase')purchaseModal();else if(modal==='settings')settingsModal();
      else if(modal==='welcome'){const b=sheet('阿绫陪你，再开一扇门','茶肆新开，学会一门新手艺。',490);staffPortrait(C.PARTNERS[0],144,b.y-1,100);lines('掌柜，第一位客人来了。\n我们先看订单，再亲手沏茶、送到桌前。\n第一场不花体力，客人也愿意等你。',b.x+8,b.y+135,b.w-16,15,INK,28,4);button('simple-action','学会沏茶，招待客人',b.x,b.bottom-89,b.w,40,()=>beginGuide(0,false),{type:'gold',size:16});button('guide-welcome-skip','我会经营，直接开门',b.x,b.bottom-36,b.w,31,()=>{state.guide.done=true;persist();open('service-brief');},{type:'outline',size:11});}
      else if(modal==='offline')simpleModal('掌柜，您回来了','人间烟火，已经替您攒了好一阵。',`离开时，店铺仍在营业。\n\n本次积累 ${currency(pendingOffline.silver)} 银两\n离线银两最多累计${state.moonUntil>Date.now()?12:8}小时，招牌货满仓即停。`,()=>{close();pendingOffline={seconds:0,silver:0};},'去收取营业盈余',410);
      else if(modal==='help')simpleModal('三铺经营小笺','手艺、伙伴与布置，一起把长街经营好。','茶肆看火候，香坊选香料。\n点心铺压花，取好成品再送客。\n三铺三级解锁第二制作位。\n点店内家具，买款式直接替换。\n升级店铺，接急单与匠心雅集。\n手册可查看手艺与常客交情。\n舆图中九处商路逐步开放。',close,'回去开门迎客',480);
      else if(modal==='reset')simpleModal('从头再来？',env.demo?'重新开始本次展示试玩。':'只会清除本设备上的当前体验存档。',env.demo?'本页内的试玩进度会重新开始。\n\n展示版不读取、不保存进度，每次打开或刷新都从开篇开始。':'店铺、伙伴安排、线索和模拟商品都会重置。\n\n若只是想重看开场，可关闭此页，在设置中选择“重看江楚儿开场”。',()=>{state=C.fresh();modal=null;screen='title';pendingOffline={seconds:0,silver:0};persist();},env.demo?'从开篇重新体验':'确认清除并重开',445);
      else if(modal==='boost-buy')simpleModal('备一份从容','加速券 · 10元宝 / 张','每张券让已开张店铺各获得4份招牌货。\n\n也可以稍候片刻，招牌货会自动制作。\n购买只消耗游戏内元宝。',()=>{if(state.gems<10){say('元宝不足，也可以等待店铺自然备货');return;}state.gems-=10;state.boost++;persist();open('shop');say('获得加速券×1');},'10元宝 · 换一张加速券',425);
      else if(modal==='finish')simpleModal('这一街灯火，是我的回答','前三章体验完成 · '+(state.districts.every(Boolean)?'九州商路已通':'九处商路，逐步点亮'),'从一针一线，到一街繁华。\n江楚儿已找到了宫宴旧案的第一条证据链。\n\n你仍可继续升级店铺、搭配伙伴、接取商单，装点属于自己的长街。',close,'长街有你，继续经营',440);
      ctx.restore();panelTransform=null;
    }
    function drawFeedback(now){
      effects=effects.filter(e=>now-e.start<1500);
      if(!modal)effects.forEach(e=>{const t=(now-e.start)/1500;ctx.globalAlpha=1-t;text(e.label,e.x,e.y-48*t,17,e.color,'center',true);ctx.globalAlpha=1;});
      if(toast&&toast.until>now&&!(screen==='needlework'&&!modal)){
        const y=modal?Math.max(safe+8,(panelReview?.y??safe+56)-35):screen==='needle-lobby'?H-bottom-294:screen==='game'?H-bottom-176:screen==='decorate'?H-bottom-298:safe+116;
        let message=toast.message;ctx.font=`11px ${FONT}`;while(ctx.measureText(message).width>318&&message.length>2)message=message.slice(0,-2)+'…';
        const w=Math.min(352,Math.max(168,ctx.measureText(message).width+64)),x=(W-w)/2;artPlate('ribbon',x-5,y-3,w+10,31);quietLabel(message,x-5,y-3,11,w+10,31,'#fff0cb',false);
      }
    }
    function resize(width,height,dpr=1,safeTop=0,safeBottom=0){
      scale=width/390;W=390;H=height/scale;safe=safeTop/scale;bottom=safeBottom/scale;
      const ratio=Math.min(Math.max(1,dpr||1),3,Math.sqrt(4500000/(width*height)));
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      ctx.setTransform(scale*ratio,0,0,scale*ratio,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';focus=-1;
    }
    function syncMusic(){const cue=['title','intro','opening-story'].includes(screen)?'prologue':'business',paused=screen==='intro'&&introPausedAt!==null,key=[cue,state.sound,paused,musicRevision].join(':');if(key!==lastMusicKey){lastMusicKey=key;if(env.music)env.music(state.sound,{cue,paused,revision:musicRevision});}}
    function draw(now){
      if(hidden)return;
      hits=[];panelReview=null;paintReview=[];needleReview=null;guideReview=null;paragraphReview=[];quietReview=[];panelTransform=null;ctx.globalAlpha=1;ctx.clearRect(0,0,W,H);
      if(!ready){ctx.fillStyle=TEAL;ctx.fillRect(0,0,W,H);text(loadFailed?'画面未能展开，请重新进入':'正在点亮长街',195,H/2,20,'#e7d6ae','center');if(!loadFailed)text(Math.round(loadProgress*100)+'%',195,H/2+36,13,'#d8c18c','center');return;}
      if(screen==='opening-story'){drawOpeningStory(now);if(modal)drawModal();}else if(screen==='needle-lobby'){drawNeedleLobby(now);if(modal)drawModal();}else if(screen==='needlework'){drawNeedleWork(now);if(modal)drawModal();else needleGuideOverlay(now);}else if(screen==='title')brandTitle(now);else if(screen==='intro')drawIntro(now);else if(screen==='decorate'){drawDecorate(now);if(modal)drawModal();}else if(screen==='festival'){festivalScreen(now);if(modal)drawModal();}else if(screen==='service'){drawService(now);guideOverlay(now);if(modal)drawModal();}else{drawGame(now);if(modal)drawModal();}
      syncMusic();drawFeedback(now);
      if(env.controls)env.controls(hits.map(({id,label,disabled})=>({id,label,disabled})));
    }
    function loop(){
      const now=Date.now();
      if(!hidden){if(screen==='game'&&!modal&&!streetGesture)Street.step(streetCamera,streetViewport(),(now-tick)/1000,reduced());let serviceChanged=false;Energy.sync(state,now);Events.sync(state,now);const delta=Math.max(0,(now-tick)/1000);
        if(screen==='needlework'&&state.needlework.run&&!modal){Needle.step(state.needlework.run,delta);if(state.needlework.run.finished&&!state.needlework.run.settled)settleNeedle();}
        else if(screen==='service'&&service&&!modal){S.step(service,delta);serviceChanged=S.drain(service).length>0;if(service.finished)finishService();}
        else if(screen!=='service')C.advance(state,Math.min(delta,28800)*.08);
        tick=now;if(now-saved>5000)persist();
        if(serviceChanged||now-frame>=32){draw(now);frame=now;}}
      raf=env.requestFrame(loop);
    }
    function click(id){const hit=hits.find(x=>x.id===id);if(hit&&!hit.disabled){pressedId=hit.id;pressedUntil=Date.now()+160;hit.fn();guideAfter(id);draw(Date.now());return true;}return false;}
    function pointer(x,y){
      if(!ready)return;const lx=x/scale,ly=y/scale;const hit=[...hits].reverse().find(h=>lx>=h.x&&lx<=h.x+h.w&&ly>=h.y&&ly<=h.y+h.h);
      if(hit&&!hit.disabled){focus=-1;pressedId=hit.id;pressedUntil=Date.now()+160;hit.fn();guideAfter(hit.id);draw(Date.now());}
    }
    function pointerDown(x,y){
      if(screen==='needlework'&&!modal&&state.needlework.run?.phase==='stitch'){const l=needleCraftLayout(),lx=x/scale,ly=y/scale;if(Math.hypot(lx-l.cx,ly-l.cy)<l.size*.4){needleStroke={x:lx,y:ly};pointerSuppressed=true;needleTrace(lx,ly);return;}}
      if(!ready||streetGesture)return;pointerSuppressed=false;const lx=x/scale,ly=y/scale,hit=[...hits].reverse().find(h=>lx>=h.x&&lx<=h.x+h.w&&ly>=h.y&&ly<=h.y+h.h);
      const canPan=screen==='game'&&!modal&&Street.contains(streetViewport(),lx,ly)&&(!hit||/^(shop-|street-shop-|street-gate-|needle-shop)/.test(hit.id));
      Street.stop(streetCamera);streetGesture={x:lx,y:ly,lastX:lx,lastY:ly,time:Date.now(),moved:false,canPan,id:hit?.id||null,vx:0,vy:0};
    }
    function pointerMove(x,y){
      if(needleStroke){const lx=x/scale,ly=y/scale;needleTrace(lx,ly,needleStroke);needleStroke={x:lx,y:ly};return;}
      const g=streetGesture;if(!g)return;const lx=x/scale,ly=y/scale,now=Date.now();if(!g.moved&&Math.hypot(lx-g.x,ly-g.y)>7){g.moved=true;g.lastX=g.x;g.lastY=g.y;}
      if(g.moved&&g.canPan){const dt=Math.max(16,now-g.time)/1000,oldX=streetCamera.x,oldY=streetCamera.y;Street.drag(streetCamera,streetViewport(),lx-g.lastX,ly-g.lastY);g.vx=Math.max(-1400,Math.min(1400,(streetCamera.x-oldX)/dt));g.vy=Math.max(-1400,Math.min(1400,(streetCamera.y-oldY)/dt));pressedId=null;focus=-1;draw(now);}
      g.lastX=lx;g.lastY=ly;g.time=now;
    }
    function pointerUp(x,y){
      if(needleStroke){needleTrace(x/scale,y/scale,needleStroke);needleStroke=null;pointerSuppressed=false;return;}
      const g=streetGesture;if(!g){if(!pointerSuppressed)pointer(x,y);pointerSuppressed=false;return;}if(x/scale!==g.lastX||y/scale!==g.lastY)pointerMove(x,y);streetGesture=null;
      if(g.moved){if(g.canPan&&!reduced()&&Date.now()-g.time<120){streetCamera.vx=g.vx;streetCamera.vy=g.vy;}return;}
      const lx=x/scale,ly=y/scale,hit=[...hits].reverse().find(h=>lx>=h.x&&lx<=h.x+h.w&&ly>=h.y&&ly<=h.y+h.h);if(hit?.id===g.id&&g.id)click(g.id);
    }
    function pointerCancel(){needleStroke=null;streetGesture=null;pointerSuppressed=true;Street.stop(streetCamera);}
    function key(code){
      if(screen==='game'&&!modal&&['w','a','s','d','Home'].includes(code)){Street.stop(streetCamera);if(code==='Home')focusStreetHome();else Street.drag(streetCamera,streetViewport(),code==='a'?90:code==='d'?-90:0,code==='w'?90:code==='s'?-90:0);focus=-1;draw(Date.now());return;}
      if(code==='Escape'){if(screen==='opening-story'){skipOpening();draw(Date.now());return;}if(screen==='needlework'&&state.needlework.run?.finished&&modal!=='energy'){needleHome();draw(Date.now());return;}if(screen==='needlework'&&!modal){open('needle-pause');draw(Date.now());return;}if(screen==='needle-lobby'&&!modal){needleMap();draw(Date.now());return;}if(modal==='regional'){leaveRegional();}else if(modal==='festival-result'){screen='festival';close();}else if(modal==='rain-result'){screen='game';close();}else if(modal==='rain-archive'&&screen==='service'&&service?.rainRun&&service.finished)open('rain-result');else if(modal==='stock')leaveStock();else if(modal==='energy')leaveEnergy();else if(modal==='growth')leaveBook();else if(screen==='festival'&&!modal){screen='game';close();}else if(screen==='decorate'){screen='game';modal=null;persist();}else if(screen==='intro')finishIntro();else if(screen==='service'){if(modal==='service-result'){screen='game';close();}else if(service?.finished)open('service-result');else if(modal==='service-pause')modal=null;else if(!modal)open('service-pause');}else if(modal)close();else open('settings');draw(Date.now());return;}
      if(code==='Tab'||code==='ArrowRight'||code==='ArrowDown')focus=(focus+1)%Math.max(1,hits.length);
      else if(code==='ArrowLeft'||code==='ArrowUp')focus=(focus-1+hits.length)%Math.max(1,hits.length);
      else if((code==='Enter'||code===' ')&&hits[focus]&&!hits[focus].disabled){pressedId=hits[focus].id;pressedUntil=Date.now()+160;const id=hits[focus].id;hits[focus].fn();guideAfter(id);}
      draw(Date.now());
    }
    function hide(){pointerCancel();if(needleMotion&&needleMotion.pausedAt===null)needleMotion.pausedAt=Date.now();if(screen==='intro'&&introPausedAt===null){introPausedAt=Date.now();introAutoPause=true;}Energy.sync(state);persist();hidden=true;}
    function show(){if(hidden){if(introAutoPause){introPauseTotal+=Date.now()-introPausedAt;introPausedAt=null;introAutoPause=false;}Energy.sync(state);pendingOffline=C.offline(state);hidden=false;tick=Date.now();persist();if(pendingOffline.seconds>60&&pendingOffline.silver>1&&screen==='game'&&state.guide.done)open('offline');}}
    async function init(){
      resize(env.width,env.height,env.dpr,env.safeTop||0,env.safeBottom||0);
      draw(Date.now());
      const sources={...Object.fromEntries(['street','prologue','early','lantern','guests','foods'].map(name=>[name,`assets/${name}.${['lantern','guests','foods'].includes(name)?'png':'jpg'}`])),...ART.sources};
      let count=0;const entries=Object.entries(sources).filter(([name])=>!/^streetTile[0-9]+$/.test(name));
      const loaded=await Promise.all(entries.map(async([name,src])=>{try{images[name]=await env.loadImage(src);return true;}catch(e){loadFailed=true;if(env.onError)env.onError(e);return false;}finally{loadProgress=++count/entries.length;draw(Date.now());if(env.progress)env.progress(loadProgress);}}));
      const baseReady=loaded.every(Boolean);if(!baseReady){if(env.onError)env.onError(new Error('美术资源未能载入，请刷新重试'));return;}
      Street.focus(streetCamera,streetViewport(),state.district);await streetArt.preload(streetTiles(streetViewport()).map(t=>t.id));ready=true;persist();draw(Date.now());if(env.onReady)env.onReady();raf=env.requestFrame(loop);
    }
    init();
    return{locateShop,pointer,pointerDown,pointerMove,pointerUp,pointerCancel,key,resize,hide,show,click,save:persist,inspect:()=>({screen,modal,ready,width:W,height:H,scale,selectedShop,selectedSlot,selectedActivity,bookTab,bookPage,bookShop,stockSlot,stockPage,mapSelected,intro:screen==='intro'?Opening.at(introElapsed(Date.now())):null,introPaused:introPausedAt!==null,crewPage,decorPage,serviceResult,street:{...streetCamera,art:streetArt.inspect(),viewport:streetViewport(),width:Street.WIDTH,height:Street.HEIGHT,browsing:Street.nearest(streetCamera,streetViewport()),dragging:!!streetGesture?.moved},walkers:[],rank:Profile.rank(state),needlework:JSON.parse(JSON.stringify(state.needlework)),layout:env.review?{panel:panelReview,texts:paintReview,paragraphs:paragraphReview,needle:needleReview,guide:guideReview,quiet:quietReview}:null,guideFlow:guideFlow?{step:guideFlow.step}:null,state:JSON.parse(JSON.stringify(state)),service:service?JSON.parse(JSON.stringify(service)):null,buttons:hits.map(({id,label,x,y,w,h,disabled,visual,guidePoint,painted})=>({id,label,x,y,w,h,disabled,visual,guidePoint,painted}))}),destroy:()=>{persist();streetArt.destroy();if(env.cancelFrame)env.cancelFrame(raf);}};
  }
  return{create};
});
