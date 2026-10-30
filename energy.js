(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerEnergy=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const CAP=200,STEP=60000,DAY=86400000;
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const day=t=>Math.floor((t+8*3600000)/DAY);
  function fresh(now=Date.now()){return {energyRule:7,energy:CAP,energyAt:now,energyClock:now,energyDay:day(now),restClaimed:false,energyRefills:0,snacks:2};}
  function sync(s,now=Date.now()){
    const t=Math.max(s.energyClock,finite(now)?now:s.energyClock);s.energyClock=t;
    if(day(t)>s.energyDay){s.energyDay=day(t);s.restClaimed=false;s.energyRefills=0;}
    if(s.energy>=CAP){s.energy=CAP;s.energyAt=t;return;}
    const ticks=Math.max(0,Math.floor((t-s.energyAt)/STEP));
    if(ticks){s.energy=Math.min(CAP,s.energy+ticks);s.energyAt+=ticks*STEP;if(s.energy===CAP)s.energyAt=t;}
  }
  function restore(s,raw,now=Date.now()){
    Object.assign(s,fresh(now));if(!finite(raw.energy))return;
    s.energy=Math.max(0,Math.min(CAP,Math.floor(raw.energy)));
    s.energyClock=Math.max(now,finite(raw.energyClock)?raw.energyClock:now);
    s.energyAt=Math.min(s.energyClock,Math.max(0,finite(raw.energyAt)?raw.energyAt:s.energyClock));
    s.energyDay=Number.isInteger(raw.energyDay)?Math.min(raw.energyDay,day(s.energyClock)):day(s.energyClock);
    s.restClaimed=raw.restClaimed===true;s.energyRefills=Math.max(0,Math.min(3,Math.floor(finite(raw.energyRefills)?raw.energyRefills:0)));
    s.snacks=Math.max(0,Math.min(99,Math.floor(finite(raw.snacks)?raw.snacks:0)));
    if(raw.energyRule!==7){const elapsed=Math.max(0,s.energyClock-s.energyAt),ticks=Math.floor(elapsed/300000);s.energy=Math.min(80,s.energy+ticks);s.energyAt=s.energyClock-(s.energy>=80?0:(elapsed%300000)/5);}
    sync(s,now);
  }
  function cost(s,activity,practice=false){return practice||s.serviceRounds===0?0:activity==='rush'?20:activity==='artisan'?30:10;}
  function spend(s,amount,now=Date.now()){
    sync(s,now);if(!Number.isInteger(amount)||amount<0||s.energy<amount)return{ok:false,message:'体力不足，先歇一歇或补给后再开门'};
    s.energy-=amount;return{ok:true,cost:amount};
  }
  function remaining(s,now=Date.now()){sync(s,now);return s.energy>=CAP?0:Math.max(0,Math.ceil((STEP-(s.energyClock-s.energyAt))/1000));}
  function refill(s,kind,now=Date.now()){
    sync(s,now);if(s.energy>=CAP)return{ok:false,message:'体力已满，留待需要时再用'};
    let amount=0;
    if(kind==='rest'){if(s.restClaimed)return{ok:false,message:'今日小憩已领，明日再来'};s.restClaimed=true;amount=30;}
    else if(kind==='snack'){if(s.snacks<1)return{ok:false,message:'点心已用完，可以领取每日小憩'};s.snacks--;amount=20;}
    else if(kind==='soup'){if(s.energyRefills>=3)return{ok:false,message:'今日元宝补给已用三回'};if(s.gems<20)return{ok:false,message:'还需20元宝，也可等候恢复或免费练手'};s.gems-=20;s.energyRefills++;amount=40;}
    else return{ok:false,message:'没有这份补给'};
    const gained=Math.min(amount,CAP-s.energy);s.energy+=gained;if(s.energy===CAP)s.energyAt=s.energyClock;return{ok:true,gained,message:'体力 +'+gained};
  }
  return{CAP,STEP,day,fresh,restore,sync,cost,spend,remaining,refill};
});
