(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./world.js'),require('./growth.js'),require('./energy.js'),require('./guide.js'),require('./events.js'),require('./profile.js'),require('./needlework.js'),require('./storyline.js'));
  else root.ChuerCore = factory(root.ChuerWorld,root.ChuerGrowth,root.ChuerEnergy,root.ChuerGuide,root.ChuerEvents,root.ChuerProfile,root.ChuerNeedlework,root.ChuerStoryline);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (W,G,E,Guide,Events,Profile,Needle,Story) {
  'use strict';
  const VERSION = 1;
  const SHOPS = [
    { id:'tea', name:'凤来茶肆', short:'茶肆', good:'茶货', verb:'沏一盏人间好茶', unlock:60, rate:2, period:8, cap:60, color:'#719d87', gift:6 },
    { id:'incense', name:'闻溪香坊', short:'香坊', good:'香货', verb:'一缕清香，藏着旧事', unlock:420, fame:30, rate:3, period:12, cap:40, color:'#b58a65', gift:3 },
    { id:'pastry', name:'云酥点心铺', short:'点心铺', good:'酥点', verb:'把日子过成甜的', unlock:1000, fame:90, rate:4, period:14, cap:40, color:'#bd8275', gift:3 }
  ];
  const PARTNERS = W.PARTNERS;
  const STAGES=['待开张','初成铺','满庭芳','华灯盛'];
  const QUESTS=[
    {title:'把绣坊的生意，接到茶肆',sub:'开张凤来茶肆',kind:'shop',shop:0,value:1,reward:80,fame:5},
    {title:'让这间小铺，有个样子',sub:'将茶肆升至二级',kind:'shop',shop:0,value:2,reward:100,fame:5},
    {title:'一个人走，一群人撑伞',sub:'为茶肆安排一位伙伴',kind:'staff',shop:0,reward:60,fame:5},
    {title:'有了生意，才有底气',sub:'完成任意一张商单',kind:'orders',value:1,reward:100,fame:15},
    {title:'这枚凤扣，终于有人认得',sub:'交付渡口老匠的线索订单',kind:'clue',value:1,reward:180,fame:10,story:0},
    {title:'循着香气，开第二扇门',sub:'开张闻溪香坊',kind:'shop',shop:1,value:1,reward:150,fame:10},
    {title:'生意要做，也要做得漂亮',sub:'茶肆升至三级，香坊升至二级',kind:'levels',reward:200,fame:10},
    {title:'一张香单，牵出旧事',sub:'交付香料商人的线索订单',kind:'clue',value:2,reward:260,fame:25,story:1},
    {title:'让街坊都过上好日子',sub:'开张云酥点心铺',kind:'shop',shop:2,value:1,reward:220,fame:10},
    {title:'灯火里，有我们的位置',sub:'累计完成六张普通商单',kind:'orders',value:6,reward:300,fame:15},
    {title:'今夜，我要亲手点亮这条街',sub:'交付灯市宴席的线索订单',kind:'clue',value:3,reward:500,fame:30,story:2},
    {title:'从一针一线，到万家灯火',sub:'三家店铺均达到三级',kind:'all',value:3,reward:800,fame:30}
  ];
  const STORIES=[
    {chapter:'第一章 · 凤纹旧事',title:'凤扣上的缺口',speaker:'渡口老匠',lines:['这凤纹的錾法……我只在王都内造见过。','三年前，有人拿着同样的扣子，定走了一箱闻溪香。'],reply:'江楚儿收起凤扣。\n“多谢。那一箱香，我会亲自查清。”',clue:'内造凤扣',note:'凤扣来自魏宫内造。旧日买主的货物，流向闻溪香坊。'},
    {chapter:'第二章 · 香里藏旧事',title:'香灰里的王都',speaker:'沈知微',lines:['这批香料的底单，被人换过。','原来的收货处不是城南，是魏宫的承露殿。'],reply:'“藏起来的账，总有重见天光的一日。”\n她把旧单收进账册，继续开门迎客。',clue:'承露殿货单',note:'宫宴前夕，一批特殊香料被送入承露殿。商人隐去了收货人的名字。'},
    {chapter:'第三章 · 此街我做主',title:'灯火照见的名字',speaker:'江楚儿',lines:['想用抬价逼我关门的人，落下了自己的印章。','是他，当年也在承露殿供货的账册上。'],reply:'“从前他们以为，我离了宫墙便活不下去。\n如今，这一街灯火，都是我的回答。”',clue:'被涂改的商印',note:'货单、凤扣与商印形成第一条证据链。下一段商路将通往王都。'}
  ];
  const ORDER_TEMPLATES=[
    {name:'渡口茶歇',note:'商船午后离岸，备一份清爽茶歇。',who:'舟客商队',need:{tea:6},silver:160,fame:2,tag:'赚银两'},
    {name:'街坊送暖',note:'给修桥的街坊送去热茶。',who:'巷口街坊',need:{tea:6},silver:60,fame:15,tag:'攒声望'},
    {name:'香客远行',who:'远行香客',need:{tea:4,incense:3},silver:250,fame:5,tag:'赚银两'},
    {name:'一缕闻溪',who:'邻里香会',need:{incense:4},silver:90,fame:20,tag:'攒声望'},
    {name:'满街甜香',who:'灯市来客',need:{tea:4,pastry:3},silver:320,fame:8,tag:'赚银两'},
    {name:'月下团圆',who:'桥头人家',need:{pastry:4},silver:100,fame:25,tag:'攒声望'}
  ];
  ORDER_TEMPLATES.push(
    {name:'书院春试',who:'赶考书生',note:'夜里温书，茶香陪一程。',need:{tea:7},silver:195,fame:8,tag:'书院委托',unlockOrders:2},
    {name:'桥头听曲',who:'乐师顾行舟',note:'一盏清茶，换一段新曲。',need:{tea:5},silver:110,fame:18,tag:'结识街坊',unlockOrders:3},
    {name:'兰香安夜',who:'药铺许娘子',note:'药铺备礼，愿客人一夜好眠。',need:{incense:6},silver:230,fame:12,tag:'安神香礼',unlockOrders:3},
    {name:'花信入囊',who:'绣坊女掌柜',note:'香囊配新衣，送给远行的人。',need:{tea:3,incense:5},silver:285,fame:15,tag:'联铺礼盒',unlockOrders:4},
    {name:'祖母的生辰',who:'果娘子的家人',note:'糕点要软，茶饮要温。',need:{tea:5,pastry:5},silver:345,fame:18,tag:'生辰宴席',unlockOrders:5},
    {name:'商会下午席',who:'临水商会',note:'茶、香、酥点一同备齐。',need:{tea:5,incense:4,pastry:4},silver:490,fame:22,tag:'三铺合单',unlockOrders:6},
    {name:'听雨花会',who:'花街雅集',note:'桂香入席，花糕配一盏新茶。',need:{tea:7,incense:5},silver:410,fame:25,tag:'花街专单',district:1},
    {name:'绣阁回礼',who:'花街绣娘',note:'花香礼盒，要赶上花会散席。',need:{incense:7,pastry:4},silver:450,fame:28,tag:'花街专单',district:1},
    {name:'诗笺与花茶',who:'书坊林若蘅',note:'新书开售，招待来读书的人。',need:{tea:9},silver:320,fame:26,tag:'花街书会',district:1},
    {name:'灯市百家宴',who:'灯市会首',note:'三铺齐备，让远客也有团圆味。',need:{tea:8,incense:6,pastry:7},silver:790,fame:38,tag:'灯市大单',district:2},
    {name:'商船归乡礼',who:'河商赵远山',note:'把长街的甜与香带回故乡。',need:{incense:8,pastry:8},silver:660,fame:32,tag:'灯市船单',district:2},
    {name:'月下笙歌',who:'灯市乐社',note:'晚场开演，备足茶与糕点。',need:{tea:10,pastry:7},silver:720,fame:35,tag:'灯市夜宴',district:2}
  );
  ORDER_TEMPLATES.push(
    {name:'茶山采青宴',who:'茶农沈青箬',note:'采青归来，热茶招待山间茶农。',need:{tea:12},silver:620,fame:30,tag:'茶山专单',region:3},
    {name:'云栈行囊',who:'云栈旅客',note:'山路长，带上茶与酥点。',need:{tea:8,pastry:6},silver:720,fame:32,tag:'茶山专单',region:3},
    {name:'山寺春供',who:'茶山知客僧',note:'茶香与兰香，一起送上山。',need:{tea:6,incense:7},silver:690,fame:34,tag:'茶山专单',region:3},
    {name:'花谷寻香',who:'药师许怀清',note:'兰香入囊，花草赠远客。',need:{incense:10},silver:660,fame:32,tag:'溪谷专单',region:4},
    {name:'百花回礼',who:'溪谷花农',note:'香礼配软糕，谢一季花事。',need:{incense:8,pastry:5},silver:740,fame:34,tag:'溪谷专单',region:4},
    {name:'溪谷采药人',who:'药庐学徒',note:'采药出门前，备齐热茶与香囊。',need:{tea:7,incense:7},silver:760,fame:35,tag:'溪谷专单',region:4},
    {name:'南市百味席',who:'王都行会',note:'三铺招牌，都送到南市宴席。',need:{tea:12,incense:8,pastry:10},silver:1280,fame:48,tag:'王都专单',region:5},
    {name:'琵琶夜宴',who:'乐师洛明珠',note:'晚场开演，茶与酥点要趁热。',need:{tea:10,pastry:10},silver:1040,fame:42,tag:'王都专单',region:5},
    {name:'王都匠会',who:'南市百工会',note:'以手艺会友，三铺同备一份礼。',need:{tea:8,incense:12,pastry:6},silver:1160,fame:45,tag:'王都专单',region:5}
  );
  ORDER_TEMPLATES.push(
    {name:'书院晨读席',who:'北麓书院',note:'晨读之前，一盏热茶配软糕。',need:{tea:14,pastry:8},silver:1380,fame:50,tag:'书院专单',region:6},
    {name:'文会清供',who:'山间文会',note:'以茶待友，以兰香伴诗。',need:{tea:12,incense:10},silver:1440,fame:52,tag:'书院专单',region:6},
    {name:'藏书楼夜读',who:'书生陈子玉',note:'灯下温书，茶点要备足。',need:{tea:16},silver:1100,fame:46,tag:'书院专单',region:6},
    {name:'锦川商船宴',who:'河商赵远山',note:'归船靠岸，三铺合备接风席。',need:{tea:14,incense:10,pastry:12},silver:1860,fame:60,tag:'水埠专单',region:7},
    {name:'远航伴手礼',who:'锦川船行',note:'把甜与香装入归乡的行囊。',need:{incense:14,pastry:14},silver:1680,fame:56,tag:'水埠专单',region:7},
    {name:'码头百工茶',who:'水埠工会',note:'忙碌的码头，也有热茶可歇。',need:{tea:18,pastry:10},silver:1580,fame:55,tag:'水埠专单',region:7},
    {name:'凤仪开街宴',who:'九州商会',note:'九处商路，齐贺满街灯火。',need:{tea:18,incense:16,pastry:18},silver:2680,fame:80,tag:'凤仪专单',region:8},
    {name:'百家团圆礼',who:'长街街坊',note:'这一份团圆，留给一起走来的人。',need:{incense:16,pastry:18},silver:2240,fame:72,tag:'凤仪专单',region:8},
    {name:'灯火照归人',who:'凤仪夜宴',note:'茶香、花香与甜香，都是你的回答。',need:{tea:20,incense:12,pastry:14},silver:2480,fame:76,tag:'凤仪专单',region:8}
  );
  const CLUE_ORDERS=[
    {name:'老匠的一盏茶',who:'渡口老匠 · 旧案线索',need:{tea:8},silver:160,fame:15,tag:'必得线索'},
    {name:'被换过的香单',who:'香料商人 · 旧案线索',need:{tea:5,incense:6},silver:240,fame:20,tag:'必得线索'},
    {name:'灯市最后一席',who:'夜市商会 · 旧案线索',need:{tea:8,incense:4,pastry:6},silver:420,fame:25,tag:'必得线索'}
  ];
  const SKUS=[
    {id:'opening',name:'开张有礼',price:6,desc:'150元宝 · 300银两 · 加速券×2',gem:150,silver:300,boost:2,once:true},
    {id:'moon',name:'掌柜月卡',price:30,desc:'300元宝 · 离线银两上限12小时',gem:300,moon:true,once:true},
    {id:'lantern',name:'满庭灯火',price:30,desc:'商街花灯 · 夜色金辉 · 永久外观',skin:'lantern',once:true}
  ];
  const num=(v,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
  function fresh(now=Date.now()) {
    return {version:VERSION,started:false,silver:80,gems:30,fame:0,bank:0,shops:SHOPS.map(()=>({level:0,stock:0,progress:0,staff:null})),quest:0,orders:0,clues:0,rotation:[0,1],purchases:[],skin:false,moonUntil:0,boost:1,visitedAt:now,sound:true,reducedMotion:false,totalEarned:0,serviceRounds:0,serviceBest:0,...W.fresh(),...G.fresh(),...E.fresh(now),...Guide.fresh(),...Events.fresh(now),...Profile.fresh(),...Needle.fresh(),...Story.fresh()};
  }
  function restore(raw, now=Date.now()) {
    const s=fresh(now);
    if(!raw||raw.version!==VERSION)return s;
    for(const k of ['silver','gems','fame','bank','orders','clues','quest','boost','totalEarned','moonUntil','serviceRounds','serviceBest'])s[k]=Math.max(0,num(raw[k],s[k]));
    s.quest=Math.min(QUESTS.length,Math.floor(s.quest));s.clues=Math.min(3,Math.floor(s.clues));
    s.started=raw.started===true;s.skin=raw.skin===true;s.sound=raw.sound!==false;s.reducedMotion=raw.reducedMotion===true;
    s.purchases=Array.isArray(raw.purchases)?raw.purchases.filter(x=>SKUS.some(sku=>sku.id===x)):[];
    s.rotation=Array.isArray(raw.rotation)&&raw.rotation.length===2?raw.rotation.map((x,i)=>Number.isInteger(x)&&x>=0&&x<1000000?x:i):[0,1];
    W.restore(s,raw);E.restore(s,raw,now);
    const assigned=new Set();
    s.shops=SHOPS.map((def,i)=>{const x=raw.shops&&raw.shops[i]||{};const staff=PARTNERS.some(p=>p.id===x.staff)&&s.crew.includes(x.staff)&&!assigned.has(x.staff)?x.staff:null;if(staff)assigned.add(staff);return{level:Math.max(0,Math.min(9,Math.floor(num(x.level)))),stock:Math.max(0,Math.min(def.cap,Math.floor(num(x.stock)))),progress:Math.max(0,num(x.progress))%def.period,staff};});
    G.restore(s,raw);Guide.restore(s,raw);Events.restore(s,raw,now);Needle.restore(s,raw);Profile.restore(s,raw);Story.restore(s,raw);
    s.visitedAt=Math.min(now,Math.max(0,num(raw.visitedAt,now)));
    return s;
  }
  function multiplier(s,i) {
    const staff=PARTNERS.find(p=>p.id===s.shops[i].staff);
    return 1+(staff?(staff.specialty===SHOPS[i].id?staff.bonus:.1):0);
  }
  function rate(s,i){return SHOPS[i].rate*s.shops[i].level*multiplier(s,i);}
  function totalRate(s){return s.shops.reduce((a,_,i)=>a+rate(s,i),0);}
  function cost(s,i){return s.shops[i].level===0?(i===0&&!s.needlework.legacyTea?Needle.TEA_PRICE:SHOPS[i].unlock):Math.round(90*Math.pow(1.75,s.shops[i].level-1)*(i+1));}
  function advance(s,seconds) {
    if(!s.started||!Number.isFinite(seconds)||seconds<=0)return;
    s.bank+=totalRate(s)*seconds;
    s.shops.forEach((shop,i)=>{
      if(!shop.level||shop.stock>=SHOPS[i].cap){shop.progress=0;return;}
      const period=SHOPS[i].period/(1+(shop.level-1)*.15)/multiplier(s,i);
      shop.progress+=seconds;
      const made=Math.floor(shop.progress/period);
      shop.stock=Math.min(SHOPS[i].cap,shop.stock+made);shop.progress%=period;
    });
  }
  function offline(s,now=Date.now()) {
    const gap=Math.max(0,(now-s.visitedAt)/1000);
    const capped=Math.min(gap,s.moonUntil>now?43200:28800);
    const before=s.bank;
    advance(s,capped);s.visitedAt=now;
    return {seconds:capped,silver:s.bank-before};
  }
  function collect(s){const n=Math.floor(s.bank);s.bank-=n;s.silver+=n;s.totalEarned+=n;return n;}
  function upgrade(s,i) {
    if(!Number.isInteger(i)||!s.shops[i])return{ok:false,message:'找不到这间铺子'};
    const shop=s.shops[i],def=SHOPS[i];
    if(i===0&&!shop.level&&!s.needlework.teaUnlocked)return{ok:false,message:'先完成一轮正式绣帕小单，交付5方绣帕后即可开茶铺'};
    if(i>0&&!shop.level&&!s.shops[0].level)return{ok:false,message:'先筹开茶铺，再逐步经营其他店铺'};
    if(i===2&&!shop.level&&!s.shops[1].level)return{ok:false,message:'先开张闻溪香坊，循着香单再筹开点心铺'};
    if(shop.level>=9)return{ok:false,message:'这间店已升至本版最高等级'};
    if(!shop.level&&(s.fame<(def.fame||0)))return{ok:false,message:`还需声望 ${def.fame-s.fame}，可先做街坊订单`};
    const c=cost(s,i);if(s.silver<c)return{ok:false,message:`还差 ${Math.ceil(c-s.silver)} 银两，收取营业收益或交付订单即可`};
    s.silver-=c;shop.level++;if(shop.level===1){shop.stock+=def.gift;Story.enqueue(s,['tea','incense','pastry'][i]);}
    return{ok:true,message:shop.level===1?`${def.name}，开门迎客`:`${def.name}升至${shop.level}级`};
  }
  function nextShop(s){const i=s.shops.findIndex(x=>!x.level);if(i<0||i===0&&!s.needlework.teaUnlocked)return null;const d=SHOPS[i],price=cost(s,i);return{index:i,name:d.name,short:d.short,price,fame:d.fame||0,needSilver:Math.max(0,price-s.silver),needFame:Math.max(0,(d.fame||0)-s.fame),ready:s.silver>=price&&s.fame>=(d.fame||0)};}
  function assign(s,person,shopIndex) {
    if(!s.crew.includes(person)||!PARTNERS.some(p=>p.id===person)||!s.shops[shopIndex]||!s.shops[shopIndex].level)return false;
    s.shops.forEach(x=>{if(x.staff===person)x.staff=null;});s.shops[shopIndex].staff=person;return true;
  }
  function questReady(s) {
    const q=QUESTS[s.quest];if(!q)return false;
    if(q.kind==='shop')return s.shops[q.shop].level>=q.value;
    if(q.kind==='staff')return !!s.shops[q.shop].staff;
    if(q.kind==='orders')return s.orders>=q.value;
    if(q.kind==='clue')return s.clues>=q.value;
    if(q.kind==='levels')return s.shops[0].level>=3&&s.shops[1].level>=2;
    if(q.kind==='all')return s.shops.every(x=>x.level>=q.value);
    return false;
  }
  function claimQuest(s) {
    if(!questReady(s))return null;
    const q=QUESTS[s.quest];s.silver+=q.reward;s.fame+=q.fame;s.quest++;return q;
  }
  function unlockedOrders(s){return ORDER_TEMPLATES.filter(o=>Object.keys(o.need).every(id=>s.shops[SHOPS.findIndex(d=>d.id===id)].level>0)&&(o.region==null||o.region===s.district)&&(o.district||0)<=s.district&&(o.unlockOrders||0)<=s.orders);}
  function availableOrder(s,slot) {
    const pool=unlockedOrders(s),local=pool.filter(o=>o.region===s.district);
    const options=slot===0&&local.length?local:pool.length?pool:ORDER_TEMPLATES.slice(0,2);
    let key=s.rotation[slot]%options.length;
    if(slot===1&&options.length>1){const used=availableOrder(s,0).name;if(options[key].name===used)key=(key+1)%options.length;}
    const source=options[key],tier=Math.min(3,Math.floor(s.orders/6)),factor=1+tier*.2;
    return{...source,need:Object.fromEntries(Object.entries(source.need).map(([id,n])=>[id,n+tier])),silver:Math.round(source.silver*factor),fame:source.fame+tier*2,tier};
  }
  function awardService(s,r,shop=0){
    if(r.practice)return {...r,silver:0,fame:0,tea:0,incense:0,pastry:0,recipeXP:Array(G.CATALOG.COUNT).fill(0),guestVisits:Array(12).fill(0),levelUps:[],newFriends:[],eventSilver:0,eventFame:0,eventWon:false,firstWin:false,districtExtra:0};
    if(r.sideStory){const growth=G.record(s,{...r,guestVisits:Array(12).fill(0),activity:'daily'},shop);s.silver+=r.silver;s.totalEarned+=r.silver;s.fame+=r.fame;return{...r,...growth,tea:0,incense:0,pastry:0,districtExtra:0};}
    const growth=G.record(s,r,shop),extra=Math.round(r.silver*W.districtBonus(s,shop)),silver=r.silver+extra+growth.eventSilver;
    s.silver+=silver;s.totalEarned+=silver;s.fame+=r.fame+growth.eventFame;s.serviceRounds++;if(r.stars>=1)s.qualifiedRounds++;s.serviceBest=Math.max(s.serviceBest,r.stars);s.serviceByShop[shop]++;s.bestByShop[shop]=Math.max(s.bestByShop[shop],r.stars);
    SHOPS.forEach((d,i)=>{if(s.shops[i].level)s.shops[i].stock=Math.min(d.cap,s.shops[i].stock+(r[d.id]||0));});return {...r,...growth,silver,fame:r.fame+growth.eventFame,districtExtra:extra};
  }
  function canDeliver(s,o){return Object.entries(o.need).every(([id,n])=>s.shops[SHOPS.findIndex(x=>x.id===id)].stock>=n);}
  function deliver(s,slot,clue=false) {
    const o=clue?CLUE_ORDERS[s.clues]:availableOrder(s,slot);
    if(!o||!canDeliver(s,o))return{ok:false,message:'招牌货还在制作，稍后便可交付'};
    if(clue&& !clueAvailable(s))return{ok:false,message:'先完成眼前的经营目标，再追查旧事'};
    for(const[id,n]of Object.entries(o.need))s.shops[SHOPS.findIndex(x=>x.id===id)].stock-=n;
    s.silver+=o.silver;s.fame+=o.fame;
    if(clue)s.clues++;else{s.orders++;s.rotation[slot]=(s.rotation[slot]+2)%1000000;}
    return{ok:true,order:o,story:clue?s.clues-1:null,message:`银两 +${o.silver} · 声望 +${o.fame}`};
  }
  function clueAvailable(s){return (s.clues===0&&s.quest>=4)||(s.clues===1&&s.quest>=7)||(s.clues===2&&s.quest>=10);}
  function buy(s,id,now=Date.now()){
    const sku=SKUS.find(x=>x.id===id);if(!sku||s.purchases.includes(id))return false;
    s.silver+=sku.silver||0;s.gems+=sku.gem||0;s.boost+=sku.boost||0;
    if(sku.skin)s.skin=true;if(sku.moon)s.moonUntil=now+30*86400000;
    s.purchases.push(id);return true;
  }
  function boost(s) {if(s.boost<1)return false;s.boost--;s.shops.forEach((x,i)=>{if(x.level)x.stock=Math.min(SHOPS[i].cap,x.stock+4);});return true;}
  function chapter(s){return s.clues>=2?3:s.clues>=1?2:1;}
  function tier(level){return level>=5?3:level>=3?2:level>=1?1:0;}
  return {STORYLINE:Story,NEEDLEWORK:Needle,PROFILE:Profile,GUIDE:Guide,EVENTS:Events,WORLD:W,GROWTH:G,CATALOG:G.CATALOG,ENERGY:E,unlockedOrders,ORDER_TEMPLATES,awardService,VERSION,SHOPS,PARTNERS,STAGES,QUESTS,STORIES,SKUS,CLUE_ORDERS,fresh,restore,advance,offline,collect,upgrade,assign,rate,totalRate,cost,multiplier,questReady,claimQuest,availableOrder,canDeliver,deliver,clueAvailable,buy,boost,chapter,tier,nextShop};
});
