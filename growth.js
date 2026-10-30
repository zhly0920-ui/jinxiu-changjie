(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./products.js'));else root.ChuerGrowth=factory(root.ChuerCatalog);})(typeof globalThis!=='undefined'?globalThis:this,function(P){
  'use strict';
  const ACTIVITIES=[
    {id:'daily',name:'日常迎客',level:1,desc:'从容招待，练好每一道手艺',rule:'照常接客，赚银两与招牌货',silver:0,fame:0},
    {id:'rush',name:'街坊急单',level:2,desc:'客人来得更快，安排好出餐先后',rule:'接待8位，离客不超过1位',silver:160,fame:12,repeat:60},
    {id:'artisan',name:'匠心雅集',level:3,desc:'每桌两份，手艺与搭配都要顾',rule:'接待6位，送出8份上佳成品',silver:180,fame:15,repeat:70}
  ];
  const LEVELS=[0,6,18,40],TITLES=['初学','熟手','拿手','招牌'];
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const clean=v=>Math.max(0,Math.min(1000000,Math.floor(finite(v)?v:0)));
  function fresh(){return {menuLoadouts:P.defaults(),recipeXP:Array(P.COUNT).fill(0),guestVisits:Array(12).fill(0),eventWins:Array.from({length:3},()=>[0,0])};}
  function restore(s,raw){P.restore(s,raw);s.recipeXP=Array.from({length:P.COUNT},(_,i)=>clean(raw.recipeXP?.[i]));s.guestVisits=Array.from({length:12},(_,i)=>clean(raw.guestVisits?.[i]));s.eventWins=Array.from({length:3},(_,i)=>[clean(raw.eventWins?.[i]?.[0]),clean(raw.eventWins?.[i]?.[1])]);}
  function mastery(xp){const level=LEVELS.reduce((n,x,i)=>xp>=x?i:n,0);return {level,title:TITLES[level],priceAdd:level*2,speed:1-level*.04,next:LEVELS[level+1]||null};}
  function affinity(visits){const level=visits>=18?3:visits>=8?2:visits>=3?1:0;return {level,title:['初见','熟客','挚友','知音'][level],tip:level,next:[3,8,18,null][level]};}
  function activity(id,level){const a=ACTIVITIES.find(a=>a.id===id);return a&&level>=a.level?a:ACTIVITIES[0];}
  function record(s,r,shop){
    const levelUps=[],newFriends=[];
    for(let i=0;i<P.COUNT;i++){
      const before=mastery(s.recipeXP[i]).level;s.recipeXP[i]=clean(s.recipeXP[i]+clean(r.recipeXP?.[i]));const after=mastery(s.recipeXP[i]);if(after.level>before)levelUps.push({id:i,...after});
    }
    for(let i=0;i<12;i++){
      const old=affinity(s.guestVisits[i]).level;s.guestVisits[i]=clean(s.guestVisits[i]+clean(r.guestVisits?.[i]));const now=affinity(s.guestVisits[i]);if(now.level>old)newFriends.push({id:i,...now});
    }
    const a=ACTIVITIES.find(a=>a.id===r.activity)||ACTIVITIES[0],won=a.id==='rush'?r.served>=8&&r.lost<=1:a.id==='artisan'?r.served>=6&&r.perfectDelivered>=8:false;
    let eventSilver=0,eventFame=0,firstWin=false;
    if(won){const slot=a.id==='rush'?0:1;firstWin=s.eventWins[shop][slot]===0;eventSilver=firstWin?a.silver:a.repeat;eventFame=firstWin?a.fame:4;s.eventWins[shop][slot]=clean(s.eventWins[shop][slot]+1);}
    return {levelUps,newFriends,eventSilver,eventFame,eventWon:won,firstWin,activity:a.id};
  }
  return {CATALOG:P,ACTIVITIES,LEVELS,TITLES,fresh,restore,mastery,affinity,activity,record};
});
