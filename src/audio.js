/* All audio is synthesized in the browser. No samples, network calls or third-party music. */
'use strict';
class ShiftAudio{
  constructor(){this.ctx=null;this.master=null;this.enabled=true;this.active=false;this.nextBeat=0;this.beat=0;this.noise=null;this.volume=.34;}
  unlock(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;this.ctx=new AC();this.master=this.ctx.createGain();this.master.gain.value=this.enabled?this.volume:0;this.master.connect(this.ctx.destination);const n=this.ctx.sampleRate*.12;this.noise=this.ctx.createBuffer(1,n,this.ctx.sampleRate);const d=this.noise.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);}if(this.ctx.state==='suspended')this.ctx.resume().catch(()=>{});}catch(e){console.warn('Audio unavailable:',e.message);}}
  setEnabled(value){this.enabled=value;if(this.master)this.master.gain.setTargetAtTime(value?this.volume:0,this.ctx.currentTime,.05);if(value)this.unlock();}
  tone(freq,duration=.12,type='sine',gain=.16,delay=0,slide=null){if(!this.ctx||!this.enabled)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);if(slide)o.frequency.exponentialRampToValueAtTime(slide,t+duration);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};}
  coin(streak=0){this.tone([880,1046.5,1174.7,1318.5][streak%4],.13,'sine',.10);this.tone(1760,.07,'sine',.025,.03);}
  jump(){this.tone(220,.12,'sine',.075,0,440);}
  slide(){this.tone(180,.14,'triangle',.045,0,80);}
  bonus(){[523.25,659.25,783.99,1046.5].forEach((n,i)=>this.tone(n,.22,'sine',.11,i*.065));}
  hit(){this.tone(120,.28,'triangle',.22,0,35);this.tone(80,.13,'sawtooth',.06,.04,40);}
  shield(){this.tone(880,.25,'triangle',.1,0,260);}
  start(){[392,523.25,659.25].forEach((f,i)=>this.tone(f,.18,'sine',.09,i*.075));this.nextBeat=this.ctx?this.ctx.currentTime+.3:0;this.beat=0;}
  mission(){[659,784,1047,1319].forEach((f,i)=>this.tone(f,.19,'sine',.1,i*.09));}
  update(running){if(!this.ctx||!this.enabled||!running)return;const now=this.ctx.currentTime;if(this.nextBeat<now-.3)this.nextBeat=now+.03;if(this.nextBeat>now+.10)return;const t=this.nextBeat,delay=Math.max(0,t-now),beat=this.beat++;
    // A restrained 108 BPM pulse: warm bass, soft hi-hat, occasional electric keys.
    if(beat%2===0){this.tone(100,.14,'sine',.14,delay,42);}
    if(beat%4===2){this.tone(185,.075,'triangle',.04,delay,90);}
    if(this.noise){const s=this.ctx.createBufferSource(),f=this.ctx.createBiquadFilter(),g=this.ctx.createGain();s.buffer=this.noise;f.type='highpass';f.frequency.value=6200;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(beat%2?.022:.013,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+.04);s.connect(f);f.connect(g);g.connect(this.master);s.start(t);s.stop(t+.05);s.onended=()=>{s.disconnect();f.disconnect();g.disconnect();};}
    if(beat%4===0){const bass=[65.406,55,73.416,49][Math.floor(beat/16)%4];this.tone(bass,.32,'triangle',.055,delay);}
    if(beat%8===6){const notes=[261.63,329.63,392,293.66,349.23,440];const n=notes[Math.floor(beat/8)%notes.length];this.tone(n,.3,'sine',.025,delay);this.tone(n*1.5,.35,'sine',.015,delay+.035);}
    this.nextBeat+=60/108/2;
  }
}
