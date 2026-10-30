(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerStoryline=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const SHOPS=[
 {id:'needle',title:'半间绣坊，一条活路',chapter:'序章 · 楚绣坊开张',scene:'needleScene',region:0,goal:'绣好第一方帕，挣自己的第一笔工钱',beats:[['阿绫','这半间绣坊先借你。渡口柳婶正等一方梅花帕，她只认手艺，不问来处。'],['江楚儿','好。从前衣来伸手，今日便自己落针。我会把这间小铺，一点点经营起来。']]},
 {id:'tea',title:'一盏茶，问一段旧事',chapter:'第一章 · 凤来茶肆开张',scene:'storyTea',region:0,goal:'经营茶肆，再向渡口老匠追问凤扣的来历',beats:[['阿绫','绣坊攒下的本钱，终于换来这扇临河的门。我来照看茶炉，你安心待客。'],['渡口老匠','你这凤扣的勾羽手路，我在王都内造见过。旧账还锁在渡口，容我替你翻一翻。'],['江楚儿','那就把茶煮好，把客人记住。来往商船带来的，不会只有生意。']]},
 {id:'incense',title:'香有来处，旧账有痕',chapter:'第二章 · 闻溪香坊开张',scene:'storyIncense',region:1,goal:'调好第一炉香，继续追查承露殿的香料底单',beats:[['沈知微','你寻来的货签我看过。送往承露殿的那批香，出库底账被人换了。'],['江楚儿','有人费心抹去的来处，总会在别处留下痕迹。你手上的半页旧账，先收好。'],['沈知微','香坊开起来，旧供货的人自然会再登门。这回，账由我们自己记。']]},
 {id:'pastry',title:'一方糕印，串起商路',chapter:'第三章 · 云酥点心铺开张',scene:'storyPastry',region:2,goal:'把茶、香与点心送进商会，核对旧货签上的商印',beats:[['周小满','新蒸笼到了，街坊也等着开张。只是这包货上的商印，我瞧着很眼熟。'],['江楚儿','茶商的包裹、香料的封签，都出现过近似的缺口。先逐份留样，不能只凭猜测。'],['周小满','那就把点心做好，送进商会。让他们自己来尝，也让那枚旧印有个对照。']]}
 ];
 const REGIONS=[
 {region:1,title:'花信里的人情',who:'苏晚棠',goal:'经营听雨花街，留意花宴的旧客',lines:['花街掌柜们还记得那年的宫宴采买。你若把生意做稳，旧客自然愿意多说几句。','我靠手艺站稳，也会让信任我的人得到回报。先从这条花街开始。']},
 {region:2,title:'灯下的船单',who:'赵远山',goal:'招待灯市商客，对照水路货签',lines:['灯市的茶、香和糕点都走水路。我留着几张旧船单，上面的收货商号，你或许认得。','请先替我收好。等货签、船单能彼此印证，再去问那位收货人。']},
 {region:3,title:'山中一枚旧封泥',who:'沈青箬',goal:'从茶山新货中追问供货人的去向',lines:['这批山茶的旧封泥还在。三年前有人特意来换包装，叮嘱只能送到王都的指定商号。','货能换包装，来路却换不掉。新茶照收，旧封泥也请替我留下。']},
 {region:4,title:'花香之外的底方',who:'许怀清',goal:'经营溪谷，核对香料与药材的批次',lines:['单闻成香难辨来路，底方和批次却会说话。你带来的香样，我愿替你逐味核对。','多谢。我查的不是谁说得像，而是哪一味、哪一批能与旧账对上。']},
 {region:5,title:'王都南市的故曲',who:'洛明珠',goal:'在南市立铺，寻找当年宫宴的见证人',lines:['宫宴那支曲子，我至今记得。散席后曾有人急着离开，落脚的驿馆就在南市。','如今我以掌柜的身份回来。先把铺子开稳，再请愿意作证的人到灯下说话。']},
 {region:6,title:'旧契藏在书页间',who:'林若蘅',goal:'结识书院商客，查阅旧契与采买簿',lines:['书院收过一批商家的旧契副本。有人想抹掉货单，却忘了账房会留另一份。','那便逐页对照。生意要经得起算，证据也要经得起问。']},
 {region:7,title:'水埠夜渡的记载',who:'赵远山',goal:'经营锦川水埠，串联旧契与水路记录',lines:['夜渡的装货时辰和提货人的名册找到了。把它们与书院旧契放在一起，缺口便少了一处。','这些年他们把事情拆散藏起，如今我们就沿着商路，一件件找回来。']},
 {region:8,title:'此街灯火，由我守住',who:'江楚儿',goal:'守住九处商街，把账、香与商印逐一印证',lines:['从半间绣坊到九处长街，这里的每一盏灯，都是我和街坊亲手挣来的。','接下来，该把旧账、香样和商印摆在同一盏灯下。该问的人，我会亲自去问。']}
 ].map(r=>({id:'region-'+r.region,title:r.title,chapter:'商路新卷 · '+['','听雨花街','临水灯市','云岫茶山','百花溪谷','王都南市','北麓书院','锦川水埠','凤仪长街'][r.region],region:r.region,scene:null,goal:r.goal,beats:[[r.who,r.lines[0]],['江楚儿',r.lines[1]]]}));
 const ENTRIES=SHOPS.concat(REGIONS),get=id=>ENTRIES.find(e=>e.id===id);
 function fresh(){return{shopStories:{version:1,seen:[],pending:[],active:null}};}
 function unlocked(s,id){if(id==='needle')return true;const i=['tea','incense','pastry'].indexOf(id);if(i>=0)return !!s.shops?.[i]?.level;const e=get(id);return !!e&&!!s.districts?.[e.region];}
 function back(raw={}){return{screen:['game','needle-lobby','needle-lesson','opening-journal'].includes(raw.screen)?raw.screen:'game',modal:['shop','region-arrival'].includes(raw.modal)?raw.modal:null,shop:Number.isInteger(raw.shop)&&raw.shop>=0&&raw.shop<3?raw.shop:0};}
 function restore(s,raw){const old=raw.shopStories,n=fresh().shopStories;s.shopStories=n;if(!old||old.version!==1){if(s.needlework?.tutorialDone||s.needlework?.run||s.shops?.some(x=>x.level))n.seen.push('needle');['tea','incense','pastry'].forEach((id,i)=>{if(s.shops?.[i]?.level)n.seen.push(id);});REGIONS.forEach(e=>{if(s.districts?.[e.region])n.seen.push(e.id);});return;}
 n.seen=[...new Set((Array.isArray(old.seen)?old.seen:[]).filter(id=>get(id)&&unlocked(s,id)))];n.pending=[...new Set((Array.isArray(old.pending)?old.pending:[]).filter(id=>get(id)&&unlocked(s,id)&&!n.seen.includes(id)))];const a=old.active,e=a&&get(a.id);if(e&&unlocked(s,e.id)&&Number.isInteger(a.index)&&a.index>=0&&a.index<e.beats.length){n.active={id:e.id,index:a.index,replay:a.replay===true,returnTo:back(a.returnTo)};if(!n.active.replay&&!n.pending.includes(e.id))n.pending.unshift(e.id);}}
 function enqueue(s,id){const n=s.shopStories||(s.shopStories=fresh().shopStories);if(!get(id)||!unlocked(s,id)||n.seen.includes(id)||n.pending.includes(id)||n.active?.id===id)return false;n.pending.push(id);return true;}
 function start(s,returnTo){const n=s.shopStories;if(n.active)return n.active;const id=n.pending.find(id=>unlocked(s,id));if(!id)return null;n.active={id,index:0,replay:false,returnTo:back(returnTo)};return n.active;}
 function current(s){const a=s.shopStories.active,e=a&&get(a.id);return e?{...e,index:a.index,beat:e.beats[a.index],replay:a.replay,last:a.index===e.beats.length-1}:null;}
 function finish(s){const n=s.shopStories,a=n.active;if(!a)return null;if(!a.replay){if(!n.seen.includes(a.id))n.seen.push(a.id);n.pending=n.pending.filter(id=>id!==a.id);}n.active=null;return a.returnTo;}
 function next(s){const a=s.shopStories.active,e=a&&get(a.id);if(!e)return null;if(a.index<e.beats.length-1){a.index++;return{done:false};}return{done:true,returnTo:finish(s)};}
 function replay(s,id,returnTo){const n=s.shopStories;if(n.active||!n.seen.includes(id)||!get(id))return false;n.active={id,index:0,replay:true,returnTo:back(returnTo)};return true;}
 return{SHOPS,REGIONS,ENTRIES,get,fresh,restore,enqueue,start,current,finish,next,replay,unlocked};
});
