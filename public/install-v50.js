// V50 install experience. Browser can still be used without installation.
let deferredInstall=null;
const installed=window.matchMedia?.('(display-mode: standalone)')?.matches||navigator.standalone;
if(!installed){
 const actions=document.querySelector('.v55-actions');
 if(actions){
  const button=document.createElement('button');
  button.type='button';button.id='installGameV50';
  button.textContent='📱 ثبّت اللعبة على الموبايل';
  button.title='تثبيت شوارع مصر على الشاشة الرئيسية';
  button.style.cssText='width:auto;height:auto;padding:12px 15px;border-radius:12px;background:#24475a;border:1px solid #d6b377aa;color:#ffe0a0;font:bold 13px Tahoma,Arial';
  actions.append(button);
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event});
  window.addEventListener('appinstalled',()=>{deferredInstall=null;button.remove()});
  button.onclick=async()=>{
   if(deferredInstall){
    const prompt=deferredInstall;deferredInstall=null;
    try{await prompt.prompt();await prompt.userChoice}catch(err){console.info('Install prompt not available',err)}
   }else{
    const message=document.getElementById('savePreview');
    if(message)message.textContent='لتثبيت اللعبة: افتح قائمة المتصفح ⋮ واختر «إضافة للشاشة الرئيسية» أو «تثبيت التطبيق».';
   }
  };
 }
}
if('serviceWorker' in navigator){
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw-v50.js',{scope:'./'}).catch(err=>console.info('Offline cache unavailable',err)),{once:true});
}
