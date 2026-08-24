(function(){
  'use strict';
  const intro=document.querySelector('.mc-intro');
  if(!intro)return;
  const video=intro.querySelector('.intro-video');
  const flagAudio=intro.querySelector('.flag-wave-audio');
  let finished=false;
  const startSound=()=>{
    if(!flagAudio)return;
    flagAudio.volume=.48;
    if(Number.isFinite(video.duration) && video.duration>0){
      flagAudio.currentTime=Math.min(video.currentTime,Math.max(0,flagAudio.duration-.05));
    }
    flagAudio.play().catch(()=>{});
  };
  const finish=()=>{
    if(finished)return;
    finished=true;
    if(flagAudio){flagAudio.pause();flagAudio.currentTime=0}
    intro.classList.add('is-leaving');
    document.body.classList.remove('intro-locked');
    const backgroundVideo=document.querySelector('.video-bg[data-src]');
    if(backgroundVideo){
      backgroundVideo.src=backgroundVideo.dataset.src;
      backgroundVideo.removeAttribute('data-src');
      backgroundVideo.load();
      backgroundVideo.play().catch(()=>{});
    }
    setTimeout(()=>intro.remove(),1100);
  };
  if(!video){finish();return}
  video.addEventListener('ended',finish,{once:true});
  video.addEventListener('error',finish,{once:true});
  video.play().catch(finish);
  ['pointerdown','keydown','touchstart'].forEach(eventName=>document.addEventListener(eventName,startSound,{once:true,passive:true}));
  startSound();
  setTimeout(finish,7000);
})();
