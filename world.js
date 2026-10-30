(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./regional.js'),require('./storyline.js'));else root.ChuerWorld=factory(root.ChuerRegional,root.ChuerStoryline);})(typeof globalThis!=='undefined'?globalThis:this,function(Regional,Story){
  'use strict';
  const PARTNERS=[
    {id:'a',name:'阿绫',job:'茶艺师',specialty:'tea',bonus:.35,portrait:0,skill:'沏茶时间缩短22%',desc:'茶不必名贵，待客须得用心。'},
    {id:'b',name:'沈知微',job:'调香师',specialty:'incense',bonus:.35,portrait:1,skill:'客人耐心增加6秒',desc:'香有来处，旧事也一样。'},
    {id:'c',name:'周小满',job:'点心师',specialty:'pastry',bonus:.35,portrait:2,skill:'点心制作缩短28%',desc:'人间烟火，最抚人心。'},
    {id:'d',name:'陆青辞',job:'账房',specialty:'tea',bonus:.4,portrait:3,skill:'每位完成客单额外3两',desc:'把细账算清，也把人情记住。',fame:90,cost:200},
    {id:'e',name:'苏晚棠',job:'花香师',specialty:'incense',bonus:.4,portrait:4,skill:'上佳成品额外4两赏钱',desc:'四时花香，都能留下。',fame:160,cost:260},
    {id:'f',name:'石阿宁',job:'炉火师',specialty:'pastry',bonus:.4,portrait:5,skill:'本店制作时间缩短18%',desc:'火稳了，日子就稳了。',fame:240,cost:320}
  ];
  const DECOR=[
    {id:'table',name:'青玉嵌面桌',type:'table',price:140,beauty:2,frame:'tableJade'},
    {id:'tableRose',name:'凤纹紫檀桌',type:'table',price:260,beauty:3,frame:'tableRose'},
    {id:'counter',name:'玉雕牡丹柜面',type:'counter',price:220,beauty:3,frame:'counterJade'},
    {id:'counterRose',name:'紫檀凤纹柜面',type:'counter',price:320,beauty:4,frame:'counterRose'},
    {id:'peony',name:'满庭牡丹',type:'ornament',price:100,beauty:2,frame:'decoPeony',size:68},
    {id:'screen',name:'听竹屏风',type:'ornament',price:260,beauty:4,frame:'decoScreen',size:110},
    {id:'lamp',name:'长明宫灯',type:'ornament',price:120,beauty:2,frame:'decoLamp',size:70},
    {id:'shelf',name:'百宝陈架',type:'ornament',price:300,beauty:4,frame:'decoShelf',size:100},
    {id:'vase',name:'青花疏影',type:'ornament',price:80,beauty:1,frame:'decoVase',size:64},
    {id:'rug',name:'云纹软毯',type:'rug',price:180,beauty:2,frame:'decoRug',size:150},
    {id:'festivalLamp',name:'百盏金桂灯',type:'ornament',price:0,beauty:3,frame:'festivalLamp',event:'灯市十二席'},
    {id:'rainVase',name:'雨过天青瓶',type:'ornament',price:0,beauty:3,frame:'rainVase',event:'雨夜旧物集齐'},
    {id:'chest',name:'如意钱匣',type:'ornament',price:90,beauty:1,frame:'decoChest',size:62}
  ];
  DECOR.push(...Regional.PLACES.map(p=>({id:p.decor,name:p.name,type:'ornament',price:p.price,beauty:p.beauty,frame:p.decor,region:p.region})));
  const SLOTS=[
    {id:'table0',name:'左侧茶桌',type:'table',default:'default'},
    {id:'table1',name:'中间茶桌',type:'table',default:'default'},
    {id:'table2',name:'右侧茶桌',type:'table',default:'default'},
    {id:'counter',name:'柜台正面',type:'counter',default:'default'},
    {id:'left',name:'左侧装饰位',type:'ornament',default:'none'},
    {id:'right',name:'右侧装饰位',type:'ornament',default:'none'},
    {id:'rug',name:'厅中地毯位',type:'rug',default:'none'}
  ];
  function defaults(){return Object.fromEntries(SLOTS.map(slot=>[slot.id,slot.default]));}
  function validChoice(s,shop,slot,id){const d=DECOR.find(d=>d.id===id);return id===slot.default||(!!d&&d.type===slot.type&&s.decorOwned[shop].includes(id));}
  function catalog(slotId){const slot=SLOTS.find(x=>x.id===slotId);if(!slot)return[];return[{id:slot.default,name:slot.type==='table'?'原木茶桌':slot.type==='counter'?'原配柜面':'留空',type:slot.type,price:0,beauty:0,frame:slot.type==='table'?'tableBase':slot.type==='counter'?'counterWood':null},...DECOR.filter(d=>d.type===slot.type)];}
  const DISTRICTS=[
    {id:'bridge',name:'溪桥旧街',sub:'一盏茶，从这里起家',cost:0,fame:0,bonus:0,levels:[0,0,0],parents:[],rounds:0,orders:0,node:[.16,.82]},
    {id:'flowers',name:'听雨花街',sub:'花会雅集，香客渐多',cost:1200,fame:120,bonus:.1,levels:[3,2,0],parents:[0],rounds:3,orders:2,node:[.50,.82]},
    {id:'lanterns',name:'临水灯市',sub:'夜宴与商船，满街灯火',cost:2400,fame:240,bonus:.25,levels:[3,3,3],parents:[1],rounds:6,orders:5,node:[.84,.82]},
    {id:'teaHills',name:'云岫茶山',sub:'采青人下山，云栈茶客来',cost:3200,fame:320,bonus:.30,specialty:0,specialBonus:.15,levels:[4,3,3],parents:[2],rounds:10,orders:8,node:[.16,.49],guest:9},
    {id:'valley',name:'百花溪谷',sub:'循香入谷，四时花信成礼',cost:3600,fame:360,bonus:.30,specialty:1,specialBonus:.15,levels:[3,4,3],parents:[3],rounds:14,orders:12,node:[.50,.49],guest:10},
    {id:'capital',name:'王都南市',sub:'把长街的手艺，带到王都城门前',cost:6400,fame:560,bonus:.45,levels:[5,5,5],parents:[4],clues:3,rounds:18,orders:16,node:[.84,.49],guest:11},
    {id:'academy',name:'北麓书院',sub:'一盏清茶，赴一场山间文会',cost:8000,fame:780,bonus:.45,specialty:0,specialBonus:.10,levels:[6,5,5],parents:[5],rounds:24,orders:20,node:[.16,.17],guest:4},
    {id:'wharf',name:'锦川水埠',sub:'商船往来，把三铺好货送到远方',cost:10000,fame:1000,bonus:.50,specialty:2,specialBonus:.10,levels:[6,6,7],parents:[6],rounds:30,orders:26,node:[.50,.17],guest:8},
    {id:'fengyi',name:'凤仪长街',sub:'九处商路，汇成掌柜亲手点亮的灯火',cost:16000,fame:1400,bonus:.65,levels:[9,9,9],parents:[7],rounds:36,orders:32,node:[.84,.17],guest:11}
  ];
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function fresh(){return {crew:['a','b','c'],decorOwned:[[],[],[]],decorEquipped:[defaults(),defaults(),defaults()],districts:DISTRICTS.map((_,i)=>i===0),district:0,qualifiedRounds:0,serviceByShop:[0,0,0],bestByShop:[0,0,0]};}
  function restore(s,raw){
    s.crew=[...new Set(['a','b','c',...(Array.isArray(raw.crew)?raw.crew.filter(id=>PARTNERS.some(p=>p.id===id)):[])])];
    s.decorOwned=[0,1,2].map(i=>[...new Set((Array.isArray(raw.decorOwned?.[i])?raw.decorOwned[i]:[]).filter(id=>DECOR.some(d=>d.id===id)))]);
    s.decorEquipped=[0,1,2].map(i=>{
      const result=defaults(),saved=raw.decorEquipped?.[i];
      if(saved&&typeof saved==='object'&&!Array.isArray(saved)){for(const slot of SLOTS)if(validChoice(s,i,slot,saved[slot.id]))result[slot.id]=saved[slot.id];}
      else for(const old of Array.isArray(raw.decorPlaced?.[i])?raw.decorPlaced[i]:[]){
        if(!old||!finite(old.x)||!finite(old.y)||!s.decorOwned[i].includes(old.id))continue;
        const d=DECOR.find(d=>d.id===old.id),slotId=d.type==='table'?'table1':d.type==='counter'?'counter':d.type==='rug'?'rug':result.left==='none'?'left':result.right==='none'?'right':null;
        if(slotId)result[slotId]=d.id;
      }
      return result;
    });
    s.districts=DISTRICTS.map((_,i)=>i===0||raw.districts?.[i]===true);
    s.district=Number.isInteger(raw.district)&&s.districts[raw.district]?raw.district:0;
    s.qualifiedRounds=clamp(Math.floor(finite(raw.qualifiedRounds)?raw.qualifiedRounds:(finite(raw.serviceRounds)?raw.serviceRounds:0)),0,1000000);
    s.serviceByShop=[0,1,2].map(i=>clamp(Math.floor(finite(raw.serviceByShop?.[i])?raw.serviceByShop[i]:(i===0?s.serviceRounds:0)),0,1000000));
    s.bestByShop=[0,1,2].map(i=>clamp(Math.floor(finite(raw.bestByShop?.[i])?raw.bestByShop[i]:(i===0?s.serviceBest:0)),0,3));
  }
  function recruit(s,id){
    const p=PARTNERS.find(p=>p.id===id);if(!p)return{ok:false,message:'暂未遇见这位伙伴'};
    if(s.crew.includes(id))return{ok:false,message:'这位伙伴已经加入'};
    if(s.fame<p.fame)return{ok:false,message:`声望达到${p.fame}后，${p.name}愿来相助`};
    if(s.silver<p.cost)return{ok:false,message:`招募还需${Math.ceil(p.cost-s.silver)}银两`};
    s.silver-=p.cost;s.crew.push(id);return{ok:true,message:`${p.name}加入了长街`};
  }
  function buyDecor(s,shop,id){
    const d=DECOR.find(d=>d.id===id);if(!d||!Number.isInteger(shop)||!s.shops[shop]?.level)return{ok:false,message:'先开张这间店，再解锁款式'};
    if(s.decorOwned[shop].includes(id))return{ok:false,message:'已购入，可免费更换'};
    if(d.region!=null&&!s.districts[d.region])return{ok:false,message:'先打通这处商路，再购入地方陈设'};
    if(d.event)return{ok:false,message:d.event+'活动获得，不能直接购买'};
    if(s.silver<d.price)return{ok:false,message:`还差${Math.ceil(d.price-s.silver)}银两`};
    s.silver-=d.price;s.decorOwned[shop].push(id);return{ok:true,message:`已解锁${d.name}`};
  }
  function chooseDecor(s,shop,slotId,id){
    const slot=SLOTS.find(x=>x.id===slotId),d=DECOR.find(x=>x.id===id);
    if(!slot||!Number.isInteger(shop)||!s.shops[shop]?.level)return{ok:false,message:'先开张这间店，再换装'};
    if(id!==slot.default&&(!d||d.type!==slot.type))return{ok:false,message:'这款物件不适合这个位置'};
    if(s.decorEquipped[shop][slotId]===id)return{ok:true,message:'正在使用此款',changed:false};
    let cost=0;if(id!==slot.default&&!s.decorOwned[shop].includes(id)){const r=buyDecor(s,shop,id);if(!r.ok)return r;cost=d.price;}
    s.decorEquipped[shop][slotId]=id;return{ok:true,changed:true,cost,message:slot.name+'已换成'+(d?d.name:slot.type==='table'?'原木茶桌':slot.type==='counter'?'原配柜面':'留空')};
  }
  function beauty(s,shop){return[...new Set(Object.values(s.decorEquipped[shop]))].reduce((n,id)=>n+(DECOR.find(d=>d.id===id)?.beauty||0),0);}
  function districtStatus(s,i){
    const d=DISTRICTS[i];if(!d)return {checks:[],canOpen:false};
    const checks=[];
    if(d.parents.length)checks.push({label:'通商：'+d.parents.map(j=>DISTRICTS[j].name).join('、'),met:d.parents.every(j=>s.districts[j])});
    checks.push({label:'声望 '+Math.floor(s.fame)+' / '+d.fame,met:s.fame>=d.fame});
    checks.push({label:['茶肆','香坊','点心铺'].map((n,j)=>n+d.levels[j]+'级').join(' · '),met:d.levels.every((n,j)=>s.shops[j].level>=n)});
    if(d.rounds)checks.push({label:'好评营业 '+(s.qualifiedRounds||0)+'/'+d.rounds+'场 · 商单 '+s.orders+'/'+d.orders,met:(s.qualifiedRounds||0)>=d.rounds&&s.orders>=d.orders});
    if(d.clues)checks.push({label:'旧案线索 '+s.clues+' / '+d.clues,met:s.clues>=d.clues});
    checks.push({label:'开拓 '+d.cost+'两 · 已有 '+Math.floor(s.silver)+'两',met:s.silver>=d.cost});
    return {checks,canOpen:checks.every(c=>c.met),owned:!!s.districts[i]};
  }
  function districtBonus(s,shop){const d=DISTRICTS[s.district]||DISTRICTS[0];return d.bonus+(d.specialty===shop?d.specialBonus||0:0);}
  function unlockDistrict(s,i){
    const d=DISTRICTS[i];if(!d)return{ok:false,message:'这段商路尚未绘入舆图'};
    if(s.districts[i]){s.district=i;return{ok:true,message:`来到${d.name}`};}
    const status=districtStatus(s,i),missing=status.checks.find(c=>!c.met);
    if(missing)return{ok:false,message:'开拓尚需：'+missing.label};
    s.silver-=d.cost;s.districts[i]=true;s.district=i;Story.enqueue(s,'region-'+i);return{ok:true,message:`${d.name}通商，地方客人与专属商单到了`};
  }
  function buffs(s,shop){
    const id=s.shops[shop].staff,active=PARTNERS.find(p=>p.id===id),match=active&&active.specialty===['tea','incense','pastry'][shop],beautyTips=Math.min(4,Math.floor(beauty(s,shop)/4));
    return {fastTea:id==='a'&&match,calm:id==='b'&&match,fastSteam:id==='c'&&match,extraTips:beautyTips+(id==='d'&&match?3:0),qualityAdd:id==='e'&&match?4:0,fastAll:id==='f'&&match};
  }
  return{REGIONAL:Regional,PARTNERS,DECOR,SLOTS,DISTRICTS,defaults,catalog,fresh,restore,recruit,buyDecor,chooseDecor,beauty,districtStatus,districtBonus,unlockDistrict,buffs};
});
