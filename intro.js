(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerOpening=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const SHOTS=[
  {
    "t": 12,
    "frame": "intro0",
    "effect": "palace",
    "place": "魏宫 · 往昔",
    "title": "锦绣深宫",
    "line": "从前，我是魏国的公主江楚儿。\n宫墙里的日子，有锦衣，也有温情。\n我跟着宫中绣娘学的那几针，\n原只想绣给自己在意的人。"
  },
  {
    "t": 16,
    "frame": "intro1",
    "effect": "accusation",
    "place": "承露殿 · 宫宴",
    "title": "一纸罪书",
    "line": "承露殿宫宴上，一张假供单落案。\n熟悉的笔迹，竟被仿成我的字。\n我还未来得及解释，满殿的目光，\n已将我定成了罪人。"
  },
  {
    "t": 16,
    "frame": "intro2",
    "effect": "rain",
    "place": "王都 · 雨夜",
    "title": "一夜流离",
    "line": "一夜之间，公主成了逃亡的人。\n雨水冲散了来路，也带走了体面。\n我掌心只剩一枚断裂的凤扣。\n这是我唯一不愿典当的东西。"
  },
  {
    "t": 13,
    "frame": "intro3",
    "effect": "dawn",
    "place": "渡口 · 黎明前",
    "title": "绝处逢生",
    "line": "渡口天将亮，我遇见了阿绫。\n她没有追问，只递来半块热饼。\n我第一次明白，离开宫墙之后，\n活下去，也可以靠自己的双手。"
  },
  {
    "t": 15,
    "frame": "intro4",
    "effect": "pawn",
    "place": "旧街 · 典当铺",
    "title": "一针一线",
    "line": "最后一只耳坠，换来绢布和针线。\n阿绫借我半间绣坊，让我先接小单。\n认花样、选丝线，一针一线绣下去，\n我的第一笔工钱，要挣得堂堂正正。"
  },
  {
    "t": 13,
    "frame": "intro5",
    "effect": "lanterns",
    "place": "长街 · 心之所向",
    "title": "万家灯火",
    "line": "客商说，宫宴前的那批香料，\n曾经过这条长街，却有人改了底单。\n我要把生意做大，找回那本旧账。\n总有一天，灯火会照见藏起来的人。"
  },
  {
    "t": 15,
    "frame": "intro6",
    "effect": "opening",
    "place": "楚绣坊 · 今日",
    "title": "锦绣长街",
    "line": "从今日起，我不再等谁还我清白。\n先绣好一方帕，再撑起一家铺子。\n一边挣自己的前程，一边追查真相。\n这一次，江楚儿的人生，由自己作主。"
  }
];
  const DURATION=SHOTS.reduce((n,s)=>n+s.t,0);
  function startAt(index){return SHOTS.slice(0,index).reduce((n,s)=>n+s.t,0);}
  function at(seconds){const elapsed=Math.max(0,Number.isFinite(seconds)?seconds:0);if(elapsed>=DURATION)return null;let t=elapsed,index=0;while(index<SHOTS.length-1&&t>=SHOTS[index].t){t-=SHOTS[index].t;index++;}return{index,t,progress:t/SHOTS[index].t,shot:SHOTS[index],elapsed};}
  return{SHOTS,DURATION,startAt,at};
});
