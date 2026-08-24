(function(){
  'use strict';
  const intro=document.querySelector('.mc-intro');
  if(!intro)return;
  const video=intro.querySelector('.intro-video');
  let finished=false;
  const finish=()=>{
    if(finished)return;
    finished=true;
    intro.classList.add('is-leaving');
    document.body.classList.remove('intro-locked');
    setTimeout(()=>intro.remove(),1100);
  };
  if(!video){finish();return}
  video.addEventListener('ended',finish,{once:true});
  video.addEventListener('error',finish,{once:true});
  video.play().catch(finish);
  setTimeout(finish,7000);
})();
