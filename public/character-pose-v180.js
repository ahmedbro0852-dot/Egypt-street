const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
// Additive offsets run AFTER the mixer has restored this frame's authored pose.
export function updateCharacterPose(state,bones,{dt=0,speed=0,grounded=true,vertical=0,clock=0}={}){
 const step=clamp(Number.isFinite(dt)?dt:0,0,.05);if(!step)return;
 speed=Number.isFinite(speed)?speed:0;clock=Number.isFinite(clock)?clock:0;
 const gain=1-Math.exp(-12*step),moving=clamp(Math.abs(speed)/4.3,0,1);
 if(grounded&&!state.wasGrounded)state.landing=.12;
 state.air+=((grounded?0:1)-state.air)*gain;
 state.landing*=Math.exp(-14*step);state.wasGrounded=grounded;
 const tuck=state.air*(vertical>0?.20:.09),absorb=state.landing;
 const rx=(name,value)=>{if(bones[name])bones[name].rotateX(value)};
 rx('spine_02',Math.sin(clock*1.7)*.008*(1-moving)+absorb*.5);
 rx('thigh_l',-tuck-absorb);rx('thigh_r',-tuck*.75-absorb);
 rx('calf_l',tuck*1.8+absorb*1.6);rx('calf_r',tuck*1.5+absorb*1.6);
 rx('upperarm_l',-state.air*.22);rx('upperarm_r',-state.air*.22);
 return state;
}
