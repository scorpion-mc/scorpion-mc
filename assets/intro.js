(function(){
  'use strict';
  const intro=document.querySelector('.mc-intro');
  if(!intro)return;
  const enter=intro.querySelector('.intro-enter');
  const skip=intro.querySelector('.intro-skip');
  const video=intro.querySelector('.intro-video');
  const finish=()=>{
    intro.classList.add('is-leaving');
    document.body.classList.remove('intro-locked');
    setTimeout(()=>intro.remove(),1100);
  };
  function flagSound(){
    const AudioCtx=window.AudioContext||window.webkitAudioContext;
    if(!AudioCtx)return;
    const ctx=new AudioCtx();
    const duration=5.2;
    const buffer=ctx.createBuffer(1,ctx.sampleRate*duration,ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++){
      const t=i/ctx.sampleRate;
      const gust=.32+.38*Math.pow(Math.max(0,Math.sin(t*2.65)),4)+.25*Math.pow(Math.max(0,Math.sin(t*5.1+.7)),8);
      data[i]=(Math.random()*2-1)*gust;
    }
    const source=ctx.createBufferSource();source.buffer=buffer;
    const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=900;
    const band=ctx.createBiquadFilter();band.type='bandpass';band.frequency.value=260;band.Q.value=.65;
    const gain=ctx.createGain();gain.gain.setValueAtTime(.0001,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.36,ctx.currentTime+.35);gain.gain.setValueAtTime(.30,ctx.currentTime+4.5);gain.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+duration);
    source.connect(low).connect(band).connect(gain).connect(ctx.destination);source.start();
  }
  enter.addEventListener('click',()=>{
    if(intro.classList.contains('is-playing'))return;
    intro.classList.add('is-playing');
    if(video){video.currentTime=0;video.play().catch(()=>{})}
    flagSound();
    if(video)video.addEventListener('ended',finish,{once:true});
    setTimeout(()=>{if(document.body.contains(intro))finish()},6500);
  });
  skip.addEventListener('click',finish);
})();
