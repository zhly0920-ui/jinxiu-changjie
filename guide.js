(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerGuide=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function fresh(){return{guide:{done:false,step:0,rewarded:false,upgradePending:false,lessons:[false,false,false]}};}
function restore(s,raw){const old=raw.guide;if(!old){s.guide={done:s.serviceRounds>0,step:0,rewarded:s.serviceRounds>0,upgradePending:false,lessons:s.serviceByShop.map(n=>n>0)};return;}s.guide={done:old.done===true,step:Number.isInteger(old.step)?Math.max(0,Math.min(7,old.step)):0,rewarded:old.rewarded===true,upgradePending:old.upgradePending===true,lessons:[0,1,2].map(i=>old.lessons?.[i]===true)};}
function target(g,s){
 const shop=s.shop,id=s.menu[0];if(shop>0){if(g.step===0)return{ids:['guide-next'],line:shop===1?'先看客人的香品，再亲手调和。':'先做一份糕点，再按配方收尾。',title:shop===1?'阿绫 · 香坊初课':'阿绫 · 点心初课'};if(g.step===1)return{ids:['cook-'+id],line:'点这款货品，先让工作台动起来。',title:'第一步 · 选品'};
  const st=s.stations.findIndex(x=>x.food!==null);if(st>=0){const a=s.stations[st];return{ids:[(a.phase==='finishing'?'craft-':a.phase==='ready'?'pickup-':'pickup-')+st,...[0,1,2].map(i=>'finish-choice-'+i)],line:a.phase==='finishing'?'照配方挑材料，选对才有上佳赏钱。':a.phase==='ready'?'成品做好了，点一下取到托盘。':'制作中，稍等便能亲手完成下一步。',title:'第二步 · 亲手完成'};}return{ids:['tray-0','guest-0'],line:'把托盘里的成品，送给想要它的客人。',title:'第三步 · 送客'};
 }
 const steps=[{ids:['guide-next'],title:'阿绫 · 陪你学会待客',line:'先看订单扇，客人想喝一盏清芽茶。'},
 {ids:['cook-0'],title:'第一步 · 选茶',line:'点清芽茶，先沏好这一盏。'},
 {ids:['brew-0'],title:'第二步 · 看火候',line:s.stations[0].phase==='steeping'?'指针到金色了，点茶炉起壶。':'茶汤正在沏开，等金色区亮起来。'},
 {ids:['pickup-0'],title:'第三步 · 取茶',line:'再点茶炉，把成品取到托盘。'},
 {ids:['tray-0','guest-0'],title:'第四步 · 送到客人手里',line:'点这位客人，把清茶送上。'},
 {ids:['cook-1'],title:'第五步 · 同时安排两道货',line:'下一位要花饮和点心，先沏桂花饮。'},
 {ids:['cook-2'],title:'茶炉与蒸笼可以一起忙',line:'茶炉忙着，点牡丹酥让蒸笼开工。'},
 {ids:null,title:'最后一步 · 自己照看两笔生意',line:'看火候、取餐、送客。阿绫陪着你。'}];
 return steps[g.step]||steps[7];
}
function action(g,s,id,ok){if(ok===false)return;const seq=['guide-next','cook-'+s.menu[0],s.shop===0?'brew-0':null,'pickup-0','guest-0','cook-1','cook-2'];if(s.shop>0){if(g.step===0&&id==='guide-next')g.step=1;else if(g.step===1&&id==='cook-'+s.menu[0])g.step=2;return;}if(g.step<7&&id===seq[g.step])g.step++;}
function allowed(g,s,id){if(id==='service-pause'||id==='guide-skip')return true;const t=target(g,s);if(s.shop>0&&s.focusStation!==null)return /^finish-choice-|^finish-cancel$/.test(id);return !t.ids||t.ids.includes(id);}
function complete(s,shop,replay=false){if(replay)return 0;s.guide.lessons[shop]=true;if(shop!==0)return 0;s.guide.done=true;s.guide.step=7;if(s.guide.rewarded)return 0;s.guide.rewarded=true;s.guide.upgradePending=s.shops[0].level===1;s.silver+=90;return 90;}
return{fresh,restore,target,action,allowed,complete};
});
