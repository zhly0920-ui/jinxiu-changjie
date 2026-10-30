(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerProfile=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const THRESHOLDS=[0,24,60,110,180,270,390,540,720,950,1250,1600],TITLES=['初入长街','手艺初成','街坊知己','花街掌柜','三铺当家','灯市名家','商路新秀','南市风华','九州行商','凤仪归来','满城灯火','九州大掌柜'];
const AVATARS=[{id:0,name:'初入长街',level:1,frame:'avatar0'},{id:1,name:'手艺初成',level:2,frame:'avatar1'},{id:2,name:'花街掌柜',level:4,frame:'avatar2'},{id:3,name:'灯市华裳',level:6,frame:'avatar3'},{id:4,name:'南市风华',level:8,frame:'avatar4'},{id:5,name:'凤仪归来',level:10,frame:'avatar5'}];
const count=n=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.floor(n)):0;
function rank(s){const score=count(s.qualifiedRounds)*12+count(s.orders)*10+(s.shops||[]).reduce((n,x)=>n+Math.max(0,count(x.level)-1)*8,0)+Math.max(0,(s.needlework?.level||1)-1)*8+Math.max(0,(s.districts||[]).filter(Boolean).length-1)*25;let ix=0;for(let i=1;i<THRESHOLDS.length;i++)if(score>=THRESHOLDS[i])ix=i;return{level:ix+1,title:TITLES[ix],score,start:THRESHOLDS[ix],next:THRESHOLDS[ix+1]||null};}
function validateName(raw){if(typeof raw!=='string')return{ok:false,message:'请输入掌柜名'};const name=raw.normalize('NFKC').trim().replace(/ +/g,' ');if(!name||[...name].length>8||!/^[-\p{L}\p{N}·・ ]+$/u.test(name)||!/[\p{L}\p{N}]/u.test(name))return{ok:false,message:'请用1—8个汉字、字母或数字取名'};return{ok:true,name};}
function fresh(){return{playerName:'江楚儿',avatar:0};}
function restore(s,raw){const n=validateName(raw.playerName);s.playerName=n.ok?n.name:'江楚儿';const a=AVATARS.find(a=>a.id===raw.avatar);s.avatar=a&&rank(s).level>=a.level?a.id:0;}
function name(s){return validateName(s.playerName).ok?s.playerName:'江楚儿';}
function rename(s,value){const r=validateName(value);if(!r.ok)return r;s.playerName=r.name;return{ok:true,message:'从今往后，就叫'+r.name+'。'};}
function choose(s,id){const a=AVATARS.find(a=>a.id===id);if(!a)return{ok:false,message:'尚未绘制这套装扮'};if(rank(s).level<a.level)return{ok:false,message:'掌柜达到'+a.level+'级后解锁'};s.avatar=id;return{ok:true,message:'已换上「'+a.name+'」'};}
return{THRESHOLDS,AVATARS,rank,validateName,fresh,restore,name,rename,choose};
});
