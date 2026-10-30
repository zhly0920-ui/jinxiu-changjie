(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerStreetArt=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Keep only nearby decoded paintings; atlas geometry stays in street.js.
  function create(load,{limit=12,concurrency=2,now=Date.now}={}){
    const records=new Map();let queue=[],visible=new Set(),active=0,stamp=0,stopped=false;
    function prune(){
      const ready=[...records.values()].filter(r=>r.image);
      const candidates=ready.filter(r=>!visible.has(r.id)).sort((a,b)=>a.used-b.used);
      while(ready.length>limit&&candidates.length){const r=candidates.shift();records.delete(r.id);ready.splice(ready.indexOf(r),1);if(typeof r.image.close==='function')r.image.close();r.image=null;}
    }
    function pump(){
      while(!stopped&&active<concurrency&&queue.length){
        const r=queue.shift();if(r.state!=='queued')continue;r.state='loading';active++;
        Promise.resolve().then(()=>load(r.id)).then(image=>{
          if(stopped){if(typeof image?.close==='function')image.close();r.resolve(null);return;}
          r.image=image;r.state='ready';r.used=++stamp;r.resolve(image);
        },()=>{r.state='failed';r.failedAt=now();r.resolve(null);}).finally(()=>{active--;prune();pump();});
      }
    }
    function request(id){
      let r=records.get(id);if(r?.state==='failed'&&now()-r.failedAt>=2000){records.delete(id);r=null;}
      if(r){r.used=++stamp;return r.promise;}
      r={id,state:'queued',image:null,used:++stamp};r.promise=new Promise(resolve=>r.resolve=resolve);records.set(id,r);queue.push(r);return r.promise;
    }
    function update(ids,near=[]){
      if(stopped)return;visible=new Set(ids);const wanted=new Set(ids);for(const id of near)if(wanted.size<limit)wanted.add(id);
      for(const r of queue)if(!wanted.has(r.id)){r.state='cancelled';r.resolve(null);records.delete(r.id);}
      queue=queue.filter(r=>r.state==='queued');
      for(const id of wanted)request(id);
      queue.sort((a,b)=>Number(visible.has(b.id))-Number(visible.has(a.id))||a.used-b.used);
      prune();pump();
    }
    function get(id){const r=records.get(id);if(r?.image){r.used=++stamp;return r.image;}return null;}
    function inspect(){const rows=[...records.values()];return{visible:[...visible],loaded:rows.filter(r=>r.image).map(r=>r.id),pending:rows.filter(r=>r.state==='loading'||r.state==='queued').map(r=>r.id),failed:rows.filter(r=>r.state==='failed').map(r=>r.id),ready:[...visible].every(id=>records.get(id)?.image),limit};}
    async function preload(ids){update(ids);return Promise.all(ids.map(id=>request(id)));}
    function destroy(){stopped=true;for(const r of records.values()){r.resolve(null);if(typeof r.image?.close==='function')r.image.close();r.image=null;}records.clear();queue=[];visible.clear();}
    return{get,update,preload,inspect,destroy};
  }
  return{create};
});
