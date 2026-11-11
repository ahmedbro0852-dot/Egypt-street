// Mobile and keyboard input helpers for the Egypt Street third-person camera.
// Inputs are normalised to [-1,1]; 0 yaw means camera sits behind the -Z side.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function stickFromPointer(x,y,radius,deadzone=.11){
 const d=Math.hypot(x,y)/Math.max(1,radius);
 if(d<deadzone)return {x:0,y:0};
 const k=Math.min(1,d),angle=Math.atan2(y,x);
 const scaled=(k-deadzone)/(1-deadzone);
 return {x:Math.cos(angle)*scaled,y:Math.sin(angle)*scaled};
}
export function footDirection(forward,right,cameraYaw,pace=1){
 const mag=Math.min(1,Math.hypot(forward,right));
 if(mag<.02)return {vx:0,vz:0,magnitude:0};
 const f=forward/Math.hypot(forward,right),r=right/Math.hypot(forward,right);
 return {vx:(Math.sin(cameraYaw)*f-Math.cos(cameraYaw)*r)*pace*mag,
         vz:(Math.cos(cameraYaw)*f+Math.sin(cameraYaw)*r)*pace*mag,
         magnitude:mag};
}
export function steeringFromStick(joystickX,keyboardX){
 // V33: a wider, quicker steering curve on mobile. A half-travel joystick
 // already commands ~58% steering instead of 50%; full lock is unchanged.
 // Keyboard steering remains immediate and reverses cleanly.
 const raw=clamp((Number(joystickX)||0)+(Number(keyboardX)||0),-1,1);
 return -Math.sign(raw)*Math.pow(Math.abs(raw),.78);
}
export function blendHeading(from,to,rate,dt){
 return from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*(1-Math.exp(-rate*Math.max(0,dt)));
}
