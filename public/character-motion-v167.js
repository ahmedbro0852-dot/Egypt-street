const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function stepCharacterMotion(state,{forward=0,strafe=0,yaw=0,running=false,dt=0}={}){
 const step=clamp(Number.isFinite(dt)?dt:0,0,.05),length=Math.max(1,Math.hypot(forward,strafe)),pace=running?4.3:2;
 const x=(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/length*pace;
 const z=(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/length*pace;
 const gain=1-Math.exp(-(forward||strafe?9:15)*step);
 state.vx+=(x-state.vx)*gain;state.vz+=(z-state.vz)*gain;
 const oldX=state.x,oldZ=state.z;
 state.x=clamp(state.x+state.vx*step,-4.05,4.05);state.z=clamp(state.z+state.vz*step,-24,23);
 if(state.x===-4.05||state.x===4.05)state.vx=0;if(state.z===-24||state.z===23)state.vz=0;
 return {speed:step>0?Math.hypot(state.x-oldX,state.z-oldZ)/step:0,direction:Math.atan2(state.x-oldX,state.z-oldZ)};
}
