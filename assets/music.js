(function(){
  'use strict';

  const SOURCE='assets/risingsun.mp3';
  const TIME_KEY='scorpionMusicTime';
  const PLAY_KEY='scorpionMusicPlaying';
  const VOLUME=.12;

  const audio=document.createElement('audio');
  audio.className='site-music-audio';
  audio.src=SOURCE;
  audio.loop=true;
  audio.preload='auto';
  audio.volume=VOLUME;

  const button=document.createElement('button');
  button.type='button';
  button.className='music-toggle';
  button.innerHTML='<span class="music-play-icon" aria-hidden="true"></span><span class="music-pause-icon" aria-hidden="true"><i></i><i></i></span>';
  document.body.append(audio,button);

  let wantsPlayback=sessionStorage.getItem(PLAY_KEY)!=='false';
  let restored=false;

  const saveTime=()=>{
    if(Number.isFinite(audio.currentTime))sessionStorage.setItem(TIME_KEY,String(audio.currentTime));
  };

  const updateButton=()=>{
    const playing=!audio.paused;
    button.classList.toggle('is-playing',playing);
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',playing?'Müziği durdur':'Müziği başlat');
    button.title=playing?'Müziği durdur':'Müziği başlat';
  };

  const introActive=()=>Boolean(document.querySelector('.mc-intro'));

  const tryPlay=()=>{
    if(!wantsPlayback||introActive())return;
    audio.play().then(updateButton).catch(updateButton);
  };

  audio.addEventListener('loadedmetadata',()=>{
    if(restored)return;
    restored=true;
    const stored=Number(sessionStorage.getItem(TIME_KEY));
    if(Number.isFinite(stored)&&stored>=0&&audio.duration){audio.currentTime=stored%audio.duration}
    tryPlay();
  });
  audio.addEventListener('play',updateButton);
  audio.addEventListener('pause',updateButton);
  audio.addEventListener('timeupdate',saveTime);

  button.addEventListener('click',()=>{
    if(audio.paused){
      wantsPlayback=true;
      sessionStorage.setItem(PLAY_KEY,'true');
      tryPlay();
    }else{
      wantsPlayback=false;
      sessionStorage.setItem(PLAY_KEY,'false');
      audio.pause();
      saveTime();
    }
  });

  const unlock=event=>{
    if(event.target instanceof Element&&event.target.closest('.music-toggle'))return;
    if(wantsPlayback)tryPlay();
  };
  ['pointerdown','keydown','touchstart'].forEach(name=>document.addEventListener(name,unlock,{passive:true}));

  if(introActive()){
    const observer=new MutationObserver(()=>{
      if(!introActive()){
        observer.disconnect();
        tryPlay();
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }else{
    tryPlay();
  }

  window.addEventListener('pagehide',saveTime);
  updateButton();
})();
