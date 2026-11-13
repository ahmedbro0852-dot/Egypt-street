const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const finite=v=>Number.isFinite(v)?v:0;
// Small model-space offsets preserve the authored skeletal gait and foot height.
export function stepBodyDynamics(state,{speed=0,yaw=0,grounded=true,dt=0}={}){
 const step=clamp(finite(dt),0,.05);if(!step)return state;
 speed=Math.abs(finite(speed));yaw=finite(yaw);
 const acceleration=clamp((speed-state.speed)/step,-6,6);
 const turn=clamp(Math.atan2(Math.sin(yaw-state.yaw),Math.cos(yaw-state.yaw))/step,-3,3);
 const pitch=grounded?clamp(-speed*.012-acceleration*.006,-.085,.035):.08;
 const roll=grounded?clamp(turn*speed*.009,-.065,.065):0;
 const gain=1-Math.exp(-8*step);
 state.pitch+=(pitch-state.pitch)*gain;state.roll+=(roll-state.roll)*gain;
 state.speed=speed;state.yaw=yaw;return state;
}
