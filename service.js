(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./growth.js'));else root.ChuerService=factory(root.ChuerGrowth);})(typeof globalThis!=='undefined'?globalThis:this,function(G){
  'use strict';
  const Catalog=G.CATALOG,RECIPES=Catalog.ITEMS;
  const MODES=[
    {name:'凤来茶肆',menu:[0,1,2],types:['tea','tea','steam'],action:'看火候起壶',quality:['茶香正好','火候合宜','茶味稍淡','火候偏老']},
    {name:'闻溪香坊',menu:[3,4,5],types:['mix','mix','press'],action:'选香调和',choices:['兰草','桂花','梅花'],quality:['香韵上佳','香气合宜','香韵稍散','香韵稍散']},
    {name:'云酥点心铺',menu:[6,7,8],types:['oven','oven','steam'],action:'选模压花',choices:['梅花纹','莲花纹','团圆纹'],quality:['印纹完整','成色合宜','印纹稍浅','印纹稍浅']}
  ];
  const GUESTS=[
    {name:'行脚商人',patience:0,tip:1,note:'赶着渡河，茶要趁热。'},
    {name:'赶集娘子',patience:2,tip:0,note:'逛完市集，歇脚尝个鲜。'},
    {name:'渡口老匠',patience:4,tip:0,note:'慢工细活，也爱一口好手艺。'},
    {name:'书坊林若蘅',patience:3,tip:2,note:'新书印好了，给书坊备些茶点。'},
    {name:'书生陈子玉',patience:-2,tip:1,note:'温书误了饭点，劳烦快些。'},
    {name:'镖师燕归',patience:-3,tip:4,note:'半刻后出发，好手艺有赏。'},
    {name:'街坊果娘子',patience:6,tip:0,note:'掌柜别急，我愿意等等。'},
    {name:'乐师顾行舟',patience:2,tip:2,note:'一份好味道，配一曲新笙歌。'},
    {name:'河商赵远山',patience:0,tip:4,note:'想把长街的香与甜带回家。'},
    {name:'茶农沈青箬',patience:5,tip:3,note:'新采的茶青到了，先尝掌柜的手艺。'},
    {name:'药师许怀清',patience:7,tip:3,note:'寻了一日花草，带一份清香回去。'},
    {name:'乐师洛明珠',patience:1,tip:6,note:'南市晚宴将开，这份茶点可得讲究。'}
  ];
  const HEAT={seconds:2.4,goodStart:.32,goodEnd:.78,perfectStart:.48,perfectEnd:.64};
  const QUALITY={perfect:{label:'茶香正好',bonus:10},good:{label:'火候合宜',bonus:5},light:{label:'茶味稍淡',bonus:0},over:{label:'火候偏老',bonus:0}};
  function start(options={}){
    const level=Math.max(1,options.level||1),round=Math.max(0,options.round||0),shop=[0,1,2].includes(options.shop)?options.shop:0,district=Number.isInteger(options.district)?Math.max(0,Math.min(8,options.district)):0,mode=MODES[shop];
    const menu=Catalog.resolve(options.menu,shop,level,options.districts||Array(9).fill(false));
    const activity=G.activity(options.activity,level),first=round===0,total=activity.id==='rush'?10:activity.id==='artisan'?8:first?8:11,duration=activity.id==='rush'?70:activity.id==='artisan'?80:first?65:80;
    const tutorial=[[0],[1],[2],[0],[1,2],[0],[2],[0,1]];
    let orders=first?tutorial.map(a=>a.map(i=>menu[i])):Array.from({length:total},(_,i)=>{const a=[menu[(i+round+district)%3]];if((i+round+district)%3===0)a.push(menu[(i+round+district+1)%3]);if(level>=5&&i%5===0)a.push(menu[(i+round+district+2)%3]);return a;});
    if(activity.id!=='daily')orders=Array.from({length:total},(_,i)=>{const n=(i+round+district)%3;return activity.id==='artisan'?[menu[n],menu[(n+1)%3]]:i%4===3?[menu[n],menu[(n+1)%3]]:[menu[n]];});
    const s={menu,practice:!!options.practice,activity:activity.id,recipeMastery:Array.from({length:Catalog.COUNT},(_,i)=>G.mastery(options.recipeXP?.[i]||0)),guestAffinity:Array.from({length:12},(_,i)=>G.affinity(options.guestVisits?.[i]||0).tip),recipeXP:Array(Catalog.COUNT).fill(0),guestVisits:Array(12).fill(0),perfectDelivered:0,masteryBonus:0,shop,district,focusStation:null,extraTips:options.extraTips||0,qualityAdd:options.qualityAdd||0,fastAll:!!options.fastAll,elapsed:0,duration,total,spawned:0,nextSpawn:0,guests:[null,null,null],stations:mode.types.map((type,i)=>({type,food:null,left:0,hold:0,locked:i===1&&level<3})),tray:[],trayQuality:[],selected:0,revenue:0,served:0,lost:0,burned:0,perfectBrews:0,goodBrews:0,qualityBonus:0,combo:0,bestCombo:0,lastServe:-99,finished:false,settled:false,goals:{served:first?6:8,revenue:first?150:230,combo:3},orders,round,level,fastTea:options.fastTea||false,fastSteam:options.fastSteam||false,calm:options.calm||false,events:[]};
    if(options.tutorial){s.tutorial=true;s.total=shop===0?3:1;s.duration=600;s.orders=shop===0?[[menu[0]],[menu[1],menu[2]],[menu[0],menu[2]]]:[[menu[0]]];s.goals={served:s.total,revenue:40,combo:2};}
    if(options.contract){const p=options.contract;s.contract={...p};s.total=p.total;s.duration=p.duration;s.orders=Array.from({length:p.total},(_,i)=>{const a=[menu[i%3]];if(p.mode==='artisan'||p.mode==='pair'||p.mode==='rush'&&i%4===3)a.push(menu[(i+1)%3]);return a;});s.activity='daily';s.goals={served:p.goal,revenue:150,combo:3};}
    if(options.rain){s.rain={...options.rain};s.total=1;s.duration=90;s.orders=[[options.rain.expected]];s.goals={served:1,revenue:20,combo:1};s.rainCorrect=false;}
    return s;
  }
  function event(s,type,message,extra={}){s.events.push({type,message,...extra});if(s.events.length>12)s.events.shift();}
  function finishBrew(s,st,quality){
    st.phase='ready';st.quality=quality;st.hold=0;st.finishedAt=s.elapsed;
    if(quality==='perfect')s.perfectBrews++;
    if(quality==='good')s.goodBrews++;
    const result=qualityInfo(s,quality,st.food);event(s,'brew',result.label,{quality,bonus:result.bonus});return {ok:true,quality,...result};
  }
  function qualityInfo(s,q,food){const ix=['perfect','good','light','over'].indexOf(q),labels=s.shop===2&&RECIPES[food]?.finishAction==='点缀出炉'?['点缀精巧','成色合宜','点缀稍差','成色稍差']:MODES[s.shop].quality;return{label:labels[ix],bonus:QUALITY[q].bonus+(q==='perfect'?s.qualityAdd:0)};}
  function finishCraft(s,i,choice){
    const st=s.stations[i];if(s.finished||!st||st.phase!=='finishing'||!Number.isInteger(choice)||choice<0||choice>2)return{ok:false,message:'先选一份待完成的成品'};
    const q=RECIPES[st.food].finish===choice?'perfect':'light';s.focusStation=null;return finishBrew(s,st,q);
  }
  function heat(st){return Math.min(1,(st.steep||0)/HEAT.seconds);}
  function brew(s,i){
    if(s.finished)return {ok:false,message:'本场已打烊'};
    const st=s.stations[i];if(!st||st.phase!=='steeping')return {ok:false,message:'等茶汤沏开，再看火候起壶'};
    const p=heat(st),quality=p>=HEAT.perfectStart&&p<=HEAT.perfectEnd?'perfect':p>=HEAT.goodStart&&p<=HEAT.goodEnd?'good':p<HEAT.goodStart?'light':'over';
    return finishBrew(s,st,quality);
  }
  function guestKind(s,n){
    if(s.district<3)return (n+s.round+s.shop*2+s.district*3)%9;
    const local=[9,10,11,4,8,11][s.district-3];return [local,(n+s.shop+s.round)%9,local,(n+s.round+4)%9][n%4];
  }
  function spawn(s){
    const table=s.guests.indexOf(null);if(table<0||s.spawned>=s.total)return false;
    const n=s.spawned,kind=guestKind(s,n),profile=GUESTS[kind],patience=(s.round===0?29:27)+(s.calm?6:0)+profile.patience+(s.activity==='artisan'?7:s.activity==='rush'?-1:0);
    s.guests[table]={id:n,kind,name:s.rain?.name||profile.name,note:profile.note,tip:profile.tip,need:s.orders[n%s.orders.length].slice(),patience,maxPatience:patience,arrived:s.elapsed};s.spawned++;s.nextSpawn=s.elapsed+(s.activity==='rush'?4.8:s.contract?.mode==='rush'?4.8:s.activity==='artisan'?7:s.round===0?6.8:5.8);event(s,'arrive','客人进店了',{table});return true;
  }
  function step(s,seconds){
    if(s.finished||!Number.isFinite(seconds)||seconds<=0)return;
    // Small simulation steps preserve guest arrivals and patience across slow frames.
    let remain=Math.min(seconds,120);
    while(remain>0&&!s.finished){const dt=Math.min(.1,remain);remain-=dt;s.elapsed+=dt;
      s.stations.forEach(st=>{
        if(st.food===null)return;
        if(st.phase==='cooking'){
          st.left=Math.max(0,st.left-dt);
          if(st.left<1e-8){st.left=0;st.hold=0;st.phase=s.shop>0?'finishing':st.type==='tea'?'steeping':'ready';st.steep=0;event(s,st.phase==='steeping'?'heat':'ready',st.phase==='steeping'?'茶汤沏开了，看准火候起壶':st.phase==='finishing'?(RECIPES[st.food].finishAction||MODES[s.shop].action):RECIPES[st.food].name+'好了，点击取餐');}
        }else if(st.phase==='steeping'){
          st.steep=Math.min(s.tutorial&&(s.guideStep<7||s.served<2)?HEAT.seconds*.56:HEAT.seconds,st.steep+dt);
          if(st.steep>=HEAT.seconds-1e-8)finishBrew(s,st,'over');
        }else if(st.phase==='ready'){
          st.hold+=s.tutorial?0:dt;if(st.hold>13){event(s,'burn',RECIPES[st.food].name+'放凉了，已撤下');st.food=null;st.phase='idle';st.left=0;st.hold=0;s.burned++;s.combo=0;}
        }
      });
      s.guests.forEach((g,i)=>{if(!g)return;g.patience-=s.tutorial?0:dt;if(g.patience<=0){event(s,'leave','客人等得太久，离开了',{table:i});s.guests[i]=null;s.lost++;s.combo=0;}});
      if(s.elapsed>=s.nextSpawn&&(!s.tutorial||s.guests.every(x=>!x)))spawn(s);
      if(s.elapsed-s.lastServe>10)s.combo=0;
      if(!s.tutorial&&s.elapsed>=s.duration||(s.spawned>=s.total&&s.guests.every(x=>!x)))s.finished=true;
    }
  }
  function cook(s,id){
    if(s.finished)return {ok:false,message:'本场已打烊'};
    const recipe=RECIPES[id];if(!recipe||!s.menu.includes(id))return {ok:false,message:'本店没有这道配方'};
    const i=s.stations.findIndex(st=>!st.locked&&st.type===recipe.station&&st.food===null);
    if(i<0)return {ok:false,message:'这个制作位正忙，先完成并取走成品'};
    const st=s.stations[i];st.food=id;st.phase='cooking';st.quality=null;st.steep=0;st.left=recipe.seconds*s.recipeMastery[id].speed*(recipe.station==='tea'?(s.fastTea?.78:1):(s.fastSteam?.72:1))*(s.fastAll?.82:1)*(1-Math.min(.25,(s.level-1)*.04));st.total=st.left;st.hold=0;event(s,'cook',recipe.name+'制作中',{station:i});return {ok:true,station:i};
  }
  function pickup(s,i){
    if(s.finished)return {ok:false,message:'本场已打烊'};
    const st=s.stations[i];if(!st||st.food===null||st.phase!=='ready')return {ok:false,message:st&&st.phase==='steeping'?'先看准火候，点击茶炉起壶':'还没做好，先看看其他客人'};
    if(s.tray.length>=2)return {ok:false,message:'托盘满了，先给客人送餐'};
    s.tray.push(st.food);s.trayQuality.push(st.quality);s.selected=s.tray.length-1;st.food=null;st.phase='idle';st.left=0;st.hold=0;return {ok:true,message:'已取餐，点击想要它的客人'};
  }
  function select(s,index){if(index<0||index>=s.tray.length)return false;s.selected=index;return true;}
  function serve(s,i){
    if(s.finished)return {ok:false,message:'本场已打烊'};
    const g=s.guests[i];if(!g)return {ok:false,message:'这桌还没有客人'};
    if(!s.tray.length)return {ok:false,message:g.name+'：'+g.note+'  想要'+g.need.map(id=>RECIPES[id].short).join('、')};
    const food=s.tray[s.selected];let need=g.need.indexOf(food);if(s.rain){s.rainCorrect=food===s.rain.expected;need=0;}if(need<0)return {ok:false,message:'这位客人要的是 '+g.need.map(x=>RECIPES[x].short).join('、')};
    const quality=s.trayQuality[s.selected],qualityBonus=quality?qualityInfo(s,quality,food).bonus:0;
    g.need.splice(need,1);s.tray.splice(s.selected,1);s.trayQuality.splice(s.selected,1);s.selected=Math.max(0,s.tray.length-1);
    const masteryAdd=s.recipeMastery[food].priceAdd; s.recipeXP[food]+=quality==='perfect'?2:1;if(quality==='perfect')s.perfectDelivered++;s.masteryBonus+=masteryAdd;
    const base=RECIPES[food].price+qualityBonus+masteryAdd;s.revenue+=base;s.qualityBonus+=qualityBonus;
    let tip=0,complete=false;
    if(!g.need.length){complete=true;s.served++;s.guestVisits[g.kind]++;s.combo=s.elapsed-s.lastServe<=10?s.combo+1:1;s.lastServe=s.elapsed;s.bestCombo=Math.max(s.bestCombo,s.combo);tip=Math.min(15,s.combo*2)+(g.patience>g.maxPatience*.55?4:0)+(g.tip||0)+s.extraTips+s.guestAffinity[g.kind];s.revenue+=tip;s.guests[i]=null;if(s.tutorial)s.nextSpawn=s.elapsed;event(s,'served',`好评！银两 +${base+tip}`,{table:i,combo:s.combo});}
    else{g.patience=Math.min(g.maxPatience,g.patience+6);event(s,'partial',`先上这一份 · 银两 +${base}`,{table:i});}
    if(s.spawned>=s.total&&s.guests.every(x=>!x))s.finished=true;
    return {ok:true,complete,tip,quality,qualityBonus,earned:base+tip,combo:s.combo,guest:g.kind};
  }
  function stars(s){return [s.served>=s.goals.served,s.revenue>=s.goals.revenue,s.bestCombo>=s.goals.combo].filter(Boolean).length;}
  function settle(s){if(s.settled)return null;s.settled=true;return{rainCorrect:s.rainCorrect===true,practice:s.practice,activity:s.activity,recipeXP:s.recipeXP.slice(),guestVisits:s.guestVisits.slice(),perfectDelivered:s.perfectDelivered,masteryBonus:s.masteryBonus,silver:s.revenue+stars(s)*30,fame:s.served*2+stars(s)*3,tea:s.shop===0?Math.max(2,s.served*2):Math.floor(s.served/3),incense:s.shop===1?s.served*3:Math.floor(s.served/3),pastry:s.shop===2?s.served*3:Math.floor(s.served/3),stars:stars(s),served:s.served,lost:s.lost,burned:s.burned,revenue:s.revenue,bestCombo:s.bestCombo,perfectBrews:s.perfectBrews,goodBrews:s.goodBrews,qualityBonus:s.qualityBonus};}
  function drain(s){const events=s.events.slice();s.events.length=0;return events;}

  function restore(raw){
    if(!raw||raw.finished||raw.settled||![0,1,2].includes(raw.shop)||!Array.isArray(raw.menu)||raw.menu.length!==3||!Array.isArray(raw.guests)||raw.guests.length!==3||!Array.isArray(raw.stations)||raw.stations.length!==3)return null;
    if(!raw.menu.every((id,slot)=>Number.isInteger(id)&&RECIPES[id]?.shop===raw.shop&&RECIPES[id].slot===slot))return null;
    const finite=(n,lo=0,hi=1e6)=>typeof n==='number'&&Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):lo;
    const contract=raw.contract&&['daily','rush','artisan','pair'].includes(raw.contract.mode)&&Number.isInteger(raw.contract.total)&&raw.contract.total>=1&&raw.contract.total<=12?{...raw.contract,total:raw.contract.total,duration:finite(raw.contract.duration,30,120),goal:finite(raw.contract.goal,1,12),perfect:finite(raw.contract.perfect,0,24)}:undefined;
    const rain=raw.rain&&[0,1,2].includes(raw.rain.npc)&&raw.menu.includes(raw.rain.expected)?{...raw.rain}:undefined;
    const s=start({shop:raw.shop,menu:raw.menu,level:finite(raw.level,1,9),district:finite(raw.district,0,8),districts:Array(9).fill(true),practice:raw.practice===true,tutorial:raw.tutorial===true,contract,rain,round:finite(raw.round),activity:raw.activity,recipeXP:raw.recipeXPBase||[],guestVisits:[]});
    for(const k of ['elapsed','spawned','nextSpawn','revenue','served','lost','burned','perfectBrews','goodBrews','qualityBonus','combo','bestCombo','perfectDelivered','masteryBonus','day','energyCost','guideStep'])s[k]=finite(raw[k],0,k==='nextSpawn'?1e8:1e6);
    s.elapsed=Math.min(s.tutorial?1e6:s.duration,s.elapsed);s.spawned=Math.min(s.total,Math.floor(s.spawned));s.served=Math.min(s.total,Math.floor(s.served));
    s.guests=raw.guests.map(g=>g&&Number.isInteger(g.kind)&&GUESTS[g.kind]&&Array.isArray(g.need)&&g.need.length>0&&g.need.length<=3&&g.need.every(id=>s.menu.includes(id))?{...GUESTS[g.kind],id:finite(g.id),kind:g.kind,name:s.rain?.name||GUESTS[g.kind].name,need:g.need.slice(),patience:finite(g.patience,.01,60),maxPatience:finite(g.maxPatience,1,60),arrived:finite(g.arrived)}:null);
    const phases=['idle','cooking','steeping','finishing','ready'];s.stations=s.stations.map((st,i)=>{const a=raw.stations[i];if(!a||a.food===null)return st;if(!s.menu.includes(a.food)||RECIPES[a.food].station!==st.type||!phases.includes(a.phase)||a.phase==='idle'||st.locked)return st;return{...st,food:a.food,phase:a.phase,left:finite(a.left,0,10),total:finite(a.total,.1,10),hold:finite(a.hold,0,13),steep:finite(a.steep,0,HEAT.seconds),finishedAt:finite(a.finishedAt),quality:QUALITY[a.quality]?a.quality:null};});
    s.tray=Array.isArray(raw.tray)?raw.tray.filter(id=>s.menu.includes(id)).slice(0,2):[];s.trayQuality=s.tray.map((_,i)=>QUALITY[raw.trayQuality?.[i]]?raw.trayQuality[i]:null);s.selected=Math.min(s.tray.length-1,Math.floor(finite(raw.selected)));s.selected=Math.max(0,s.selected);
    s.recipeXP=Array.from({length:Catalog.COUNT},(_,i)=>Math.floor(finite(raw.recipeXP?.[i],0,100)));s.guestVisits=Array.from({length:12},(_,i)=>Math.floor(finite(raw.guestVisits?.[i],0,12)));s.recipeMastery=Array.from({length:Catalog.COUNT},(_,i)=>G.mastery(finite(raw.recipeXPBase?.[i])));s.guestAffinity=Array.from({length:12},(_,i)=>Math.floor(finite(raw.guestAffinity?.[i],0,3)));
    s.lastServe=typeof raw.lastServe==='number'&&Number.isFinite(raw.lastServe)?raw.lastServe:-99;s.guideReplay=raw.guideReplay===true;s.festivalRun=Number.isInteger(raw.festivalRun)?raw.festivalRun:null;s.rainRun=Number.isInteger(raw.rainRun)?raw.rainRun:null;s.rainCorrect=raw.rainCorrect===true;s.guideFirst=raw.guideFirst===true;
    for(const k of ['fastTea','fastSteam','calm','fastAll'])s[k]=raw[k]===true;for(const k of ['extraTips','qualityAdd'])s[k]=finite(raw[k],0,10);return s;
  }
  return {restore,RECIPES,MODES,GUESTS,HEAT,QUALITY,qualityInfo,finishCraft,start,step,cook,heat,brew,pickup,select,serve,stars,settle,drain};
});
