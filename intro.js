(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerOpening=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SHOTS=[
    {t:5,frame:'intro0',effect:'palace',place:'魏宫 · 往昔',title:'锦绣深宫',line:'我曾以为，宫墙之内，\n便是归处。'},
    {t:6.5,frame:'intro1',effect:'accusation',place:'承露殿 · 宫宴',title:'一纸罪书',line:'一场构陷，将所有荣光，\n都变成了指向我的利刃。'},
    {t:6,frame:'intro2',effect:'rain',place:'王都 · 雨夜',title:'一夜流离',line:'宫门在身后合拢。\n我带走的，只有这枚残缺的凤扣。'},
    {t:5.5,frame:'intro3',effect:'dawn',place:'渡口 · 黎明前',title:'绝处逢生',line:'若无人给我活路，\n我便自己挣。'},
    {t:7,frame:'intro4',effect:'pawn',place:'旧街 · 典当铺',title:'一针一线',line:'典出最后一只耳坠，\n换来针线与绢布，先靠手艺养活自己。'},
    {t:8,frame:'intro5',effect:'lanterns',place:'长街 · 心之所向',title:'万家灯火',line:'终有一日，这一街灯火，\n都会因我而亮。'},
    {t:8,frame:'intro6',effect:'opening',place:'楚绣坊 · 今日',title:'锦绣长街',line:'从第一方绣帕开始，\n亲手挣回人生，也查清当年的真相。'}
  ];
  const DURATION=SHOTS.reduce((n,s)=>n+s.t,0);
  function startAt(index){return SHOTS.slice(0,index).reduce((n,s)=>n+s.t,0);}
  function at(seconds){const elapsed=Math.max(0,Number.isFinite(seconds)?seconds:0);if(elapsed>=DURATION)return null;let t=elapsed,index=0;while(index<SHOTS.length-1&&t>=SHOTS[index].t){t-=SHOTS[index].t;index++;}return{index,t,progress:t/SHOTS[index].t,shot:SHOTS[index],elapsed};}
  return{SHOTS,DURATION,startAt,at};
});
