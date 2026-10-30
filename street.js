(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ChuerStreet=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
// The illustrated world is continuous. All interaction uses the same camera transform.
const WIDTH=2048,HEIGHT=3072,CELL_W=WIDTH/3,CELL_H=HEIGHT/3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function viewport(width,height,safe=0,bottom=0){return{x:0,y:safe+174,w:width,h:Math.max(120,height-safe-bottom-313)};}
function cell(region){return{x:region%3*CELL_W,y:(2-Math.floor(region/3))*CELL_H,w:CELL_W,h:CELL_H};}
function center(region){return shop(region,featured(region));}
const SHOP_POINTS=[[[250,1070],[104,1260],[410,1435]],[[472,1040],[550,1155],[530,1450]],[[870,1070],[970,1430],[840,1160]],[[92,665],[240,835],[230,525]],[[622,797],[470,645],[520,517]],[[790,558],[970,805],[885,650]],[[135,122],[95,270],[285,210]],[[423,180],[520,95],[650,140]],[[905,160],[805,340],[982,260]]];
const NAMES=[['凤来茶肆','闻溪香坊','溪桥糕铺'],['花雨茶庵','桃枝香馆','花会酥坊'],['临水夜茶','灯影囊铺','团圆饼坊'],['云岫茶坊','山草香舍','山泉糕铺'],['紫藤茶亭','百花香院','花露点心'],['南市茶楼','金玉香阁','金玉饼楼'],['松风茶寮','书院香室','文会糕亭'],['水埠茶棚','远行囊栈','锦川礼饼'],['凤仪茶阁','金翎香楼','百福饼阁']];
function featured(region){return region%3;}
function name(region,index){return NAMES[region][index];}
function shop(region,index){const p=SHOP_POINTS[region][index];return{x:p[0]*2,y:p[1]*2};}
function tiles(){return Array.from({length:24},(_,id)=>({id,x:id%4*512,y:Math.floor(id/4)*512,w:512,h:512}));}
function create(){return{x:0,y:0,vx:0,vy:0,region:null,zoom:.8};}
function constrain(c,v){c.x=clamp(c.x,0,Math.max(0,WIDTH-v.w/c.zoom));c.y=clamp(c.y,0,Math.max(0,HEIGHT-v.h/c.zoom));return c;}
function focus(c,v,region,index=null){const p=index===null?center(region):shop(region,index);c.x=p.x-v.w/(2*c.zoom);c.y=p.y-v.h/(2*c.zoom);c.vx=c.vy=0;c.region=region;return constrain(c,v);}
function zoom(c,v,value){const x=c.x+v.w/(2*c.zoom),y=c.y+v.h/(2*c.zoom);c.zoom=clamp(value,.65,1);c.x=x-v.w/(2*c.zoom);c.y=y-v.h/(2*c.zoom);stop(c);return constrain(c,v);}
function stop(c){c.vx=c.vy=0;}
function drag(c,v,dx,dy){c.x-=dx/c.zoom;c.y-=dy/c.zoom;return constrain(c,v);}
function step(c,v,seconds,reduced=false){if(reduced){stop(c);return;}const dt=clamp(seconds,0,.05),decay=Math.exp(-7*dt);const oldX=c.x,oldY=c.y;c.x+=c.vx*(1-decay)/7;c.y+=c.vy*(1-decay)/7;constrain(c,v);c.vx=(c.x===0||c.x===WIDTH-v.w/c.zoom)?0:c.vx*decay;c.vy=(c.y===0||c.y===HEIGHT-v.h/c.zoom)?0:c.vy*decay;if(Math.abs(c.vx)<3)c.vx=0;if(Math.abs(c.vy)<3)c.vy=0;}
function project(c,v,p){return{x:v.x+(p.x-c.x)*c.zoom,y:v.y+(p.y-c.y)*c.zoom};}
function unproject(c,v,p){return{x:(p.x-v.x)/c.zoom+c.x,y:(p.y-v.y)/c.zoom+c.y};}
function contains(v,x,y){return x>=v.x&&x<=v.x+v.w&&y>=v.y&&y<=v.y+v.h;}
function nearest(c,v){const x=c.x+v.w/(2*c.zoom),y=c.y+v.h/(2*c.zoom);return(2-clamp(Math.floor(y/CELL_H),0,2))*3+clamp(Math.floor(x/CELL_W),0,2);}
return{WIDTH,HEIGHT,cell,center,shop,tiles,featured,name,create,viewport,constrain,focus,stop,drag,step,project,unproject,contains,nearest,zoom};
});
