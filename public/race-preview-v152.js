// Egypt Streets V152 — tiny, dependency-free race route previews.
// All coordinates and colors are normalized before generating local SVG markup.
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function raceRouteLengthV152(input=[]){
 if(!Array.isArray(input)||input.length<2)return 0;
 const pts=input.map(item=>Array.isArray(item)?item:[item?.x,item?.z]);
 if(pts.some(([x,z])=>!Number.isFinite(x)||!Number.isFinite(z)))return 0;
 let total=0;
 for(let i=0;i<pts.length;i++){
  const [x,z]=pts[i],[xx,zz]=pts[(i+1)%pts.length];
  total+=Math.hypot(xx-x,zz-z);
 }
 return Math.round(total);
}
export function raceRouteStatsV152(course={}){
 const lap=raceRouteLengthV152(course.points);
 const laps=clamp(Math.trunc(Number(course.laps)||1),1,50);
 return {lap, laps, total:lap*laps,checkpointCount:Array.isArray(course.points)?course.points.length:0};
}
export function raceRouteSvgV152(points=[],color=0x68f0c6){
 if(!Array.isArray(points)||points.length<3||points.length>128)return '';
 const src=points.map(item=>Array.isArray(item)?item:[item?.x,item?.z]);
 if(src.some(([x,z])=>!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>10000||Math.abs(z)>10000))return '';
 const minX=Math.min(...src.map(p=>p[0])),maxX=Math.max(...src.map(p=>p[0]));
 const minZ=Math.min(...src.map(p=>p[1])),maxZ=Math.max(...src.map(p=>p[1]));
 const spanX=Math.max(1,maxX-minX),spanZ=Math.max(1,maxZ-minZ);
 const scale=Math.min(152/spanX,58/spanZ);
 const padX=(180-spanX*scale)/2,padZ=(88-spanZ*scale)/2;
 const projected=src.map(([x,z])=>[
  Math.round((padX+(x-minX)*scale)*10)/10,
  Math.round((padZ+(z-minZ)*scale)*10)/10
 ]);
 const trace=projected.map(([x,y])=>x+','+y).join(' ');
 const first=projected[0],last=projected[projected.length-1];
 const tint='#'+(Number.isInteger(color)?(color&0xffffff):0x68f0c6).toString(16).padStart(6,'0');
 const circle=(pt,r,fill)=>'<circle cx="'+pt[0]+'" cy="'+pt[1]+'" r="'+r+'" fill="'+fill+'" stroke="#082934" stroke-width="1.2"/>';
 return '<svg class="v152CourseMap" xmlns="http://www.w3.org/2000/svg" width="180" height="88" viewBox="0 0 180 88" aria-hidden="true" focusable="false">'+
  '<defs><pattern id="race-grid-v152" width="18" height="18" patternUnits="userSpaceOnUse">'+
  '<path d="M 18 0 L 0 0 0 18" fill="none" stroke="#35525d" stroke-width=".55"/></pattern></defs>'+
  '<rect width="180" height="88" rx="8" fill="#102a34"/><rect width="180" height="88" fill="url(#race-grid-v152)"/>'+
  '<polyline points="'+trace+'" fill="none" stroke="#053040" stroke-width="8" stroke-linejoin="round" stroke-linecap="round"/>'+
  '<polyline points="'+trace+'" fill="none" stroke="'+tint+'" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/>'+
  '<line x1="'+last[0]+'" y1="'+last[1]+'" x2="'+first[0]+'" y2="'+first[1]+'" stroke="'+tint+'" stroke-width="3.2"/>'+
  circle(first,5.3,'#ffe4a6')+circle(last,3.2,'#f9fbfa')+
  '<text x="7" y="80" fill="#bdeddb" font-size="8" font-family="Tahoma,Arial">START ●</text></svg>';
}
