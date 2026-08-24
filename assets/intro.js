(function(){
  'use strict';
  const intro=document.querySelector('.mc-intro');
  if(!intro)return;
  const video=intro.querySelector('.intro-video');
  const flagAudio=intro.querySelector('.flag-wave-audio');
  const soundButton=intro.querySelector('.intro-sound');
  let finished=false;
  const startSound=()=>{
    if(!flagAudio)return;
    flagAudio.volume=.48;
    flagAudio.play().then(()=>soundButton?.classList.add('is-on')).catch(()=>{});
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
  soundButton?.addEventListener('click',()=>{
    video.currentTime=0;
    video.play().catch(()=>{});
    startSound();
  });
  ['pointerdown','keydown','touchstart'].forEach(eventName=>document.addEventListener(eventName,startSound,{once:true,passive:true}));
  startSound();
  setTimeout(finish,7000);
})();
