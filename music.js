(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerMusic=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const TRACKS={prologue:{src:'assets/prologue.mp3',volume:.26},business:{src:'assets/theme.mp3',volume:.30}};
  function create(env){
    let player=null,cue='prologue',enabled=true,paused=false,hidden=false,unlocked=false,playing=false,revision=0,timer=null,disposed=false;
    const schedule=env.schedule||((fn,ms)=>setTimeout(fn,ms)),cancel=env.cancel||clearTimeout,now=env.now||Date.now;
    function clearFade(){if(timer!==null){cancel(timer);timer=null;}}
    function stop(){clearFade();if(player)player.pause();playing=false;}
    function seekStart(){if(!player)return;try{if(typeof player.seek==='function')player.seek(0);else player.currentTime=0;}catch(e){}}
    function reconcile(){
      if(disposed||!player||!unlocked)return;
      if(!enabled||paused||hidden){stop();return;}
      if(playing)return;
      clearFade();playing=true;player.volume=0;
      const result=player.play();if(result&&typeof result.catch==='function')result.catch(()=>{if(result===lastPlay){playing=false;clearFade();}});lastPlay=result;
      const start=now(),target=TRACKS[cue].volume;
      function fade(){timer=null;if(!playing||disposed)return;const t=Math.max(0,Math.min(1,(now()-start)/700));player.volume=target*t;if(t<1)timer=schedule(fade,35);}
      fade();
    }
    let lastPlay=null;
    function update(next={}){
      if(disposed)return;
      const changed=next.cue&&TRACKS[next.cue]&&next.cue!==cue;
      const restart=next.revision!==undefined&&next.revision!==revision;
      if(changed){stop();cue=next.cue;if(player){player.src=TRACKS[cue].src;seekStart();}}
      if(next.revision!==undefined)revision=next.revision;
      if(restart&&cue==='prologue'){stop();seekStart();}
      if(next.enabled!==undefined)enabled=!!next.enabled;
      if(next.paused!==undefined)paused=!!next.paused;
      reconcile();
    }
    function unlock(){if(disposed)return;if(!player){player=env.createAudio();player.src=TRACKS[cue].src;player.loop=true;}unlocked=true;reconcile();}
    return{update,unlock,suspend(){hidden=true;stop();},resume(){hidden=false;reconcile();},destroy(){disposed=true;stop();if(player?.destroy)player.destroy();},inspect:()=>({cue,enabled,paused,hidden,unlocked,playing,revision})};
  }
  return{TRACKS,create};
});
