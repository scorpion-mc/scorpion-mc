(function(){
  'use strict';
  const intro=document.querySelector('.mc-intro');
  if(!intro)return;
  const video=intro.querySelector('.intro-video');
  const flagAudio=intro.querySelector('.flag-wave-audio');
  const introDuration=3800;
  let finished=false;
  let finishTimer=0;
  intro.style.setProperty('--intro-duration',`${introDuration}ms`);
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
  const startIntro=()=>{
    if(finishTimer)return;
    intro.classList.add('is-playing');
    finishTimer=setTimeout(finish,introDuration);
  };
  video.addEventListener('ended',finish,{once:true});
  video.addEventListener('error',finish,{once:true});
  video.addEventListener('playing',startIntro,{once:true});
  video.play().then(startIntro).catch(finish);
  ['pointerdown','keydown','touchstart'].forEach(eventName=>document.addEventListener(eventName,startSound,{once:true,passive:true}));
  startSound();
  setTimeout(finish,8000);
})();
