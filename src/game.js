/* LAST SHIFT gameplay. Fixed-step simulation, fair lane patterns, safe flight landings. */
'use strict';
(()=>{
const $=id=>document.getElementById(id),clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*clamp(t,0,1),LANES=[-3,0,3],PLAYER_Z=2;
const format=n=>Math.floor(n).toLocaleString('tr-TR'),pad=n=>String(Math.floor(n)).padStart(6,'0');
const BONUS={magnet:{name:'MIKNATIS',description:'Coin\u2019ler art\u0131k seni takip ediyor.',duration:9,color:'#b59bee'},shield:{name:'KORUMA KALKANI',description:'Bir \u00e7arp\u0131\u015fma i\u00e7in g\u00fcvendesin.',duration:14,color:'#74d6dc'},boost:{name:'HIZ PATLAMASI',description:'6 saniye dokunulmazs\u0131n. Tam gaz!',duration:6,color:'#eb844a'},flight:{name:'U\u00c7U\u015e MODU',description:'\u015eehrin \u00fczerine \u00e7\u0131k. Coin\u2019leri yakala.',duration:9,color:'#b5d879'}};
const DISTRICTS=['L\u0130MAN B\u00d6LGES\u0130','F\u0130NANS CADDES\u0130','ALTIN SAAT','GECE HATTI','UYUMAYAN \u015eEH\u0130R'];
let saved={best:0,bank:0,muted:false};try{const s=JSON.parse(localStorage.getItem('lastshift-v1')||'{}');saved.best=Math.max(0,Number(s.best)||0);saved.bank=Math.max(0,Number(s.bank)||0);saved.muted=!!s.muted;}catch(e){}
function persist(){try{localStorage.setItem('lastshift-v1',JSON.stringify(saved));}catch(e){}}
const audio=new ShiftAudio();audio.enabled=!saved.muted;
let renderer;try{renderer=new ShiftGL.Renderer($('world'));}catch(error){$('loading').hidden=true;$('fatal').hidden=false;$('fatal-message').textContent=error.message;console.error(error);return;}
const scene=ShiftGL.group(),city=ShiftWorld.createCity(scene);let selected='samko',character=ShiftWorld.character(selected);scene.add(character.root);const HEROES={samko:{name:'SAMKO',item:'AI',power:'AI İŞARETİ',message:'Yapay zekâ gücü: süper hız + mıknatıs'},muris:{name:'MURİŞ',item:'BAL',power:'BAL KAVANOZU',message:'Bal enerjisi: süper hız + mıknatıs'},fati:{name:'FATİ',item:'BAL',power:'BAL KAVANOZU',message:'Bal enerjisi: süper hız + mıknatıs'}};let nextSpecialAt=65,specialCount=0,atmosphereStage=-1;
const entities=[],particles=[];let state='menu',time=0,runTime=0,distance=0,speed=16,coinCount=0,coinScore=0,extraScore=0,score=0,difficulty=1,streak=0,streakTimer=0,multiplier=1,waveTimer=1.5,lastSafe=1,nextBonusAt=95,bonusIndex=0,dodges=0,bonusCount=0,flights=0,missionIndex=0,missionCooldown=0,overDelay=0,banked=false;
const bonuses={magnet:0,shield:0,boost:0,flight:0};
const player={lane:1,x:0,y:0,vy:0,slide:0,jumpBuffer:0,pendingSlide:false,invulnerable:0};
let stridePhase=0;const touchDevice=matchMedia('(pointer:coarse)').matches;
let rngSeed=Date.now()>>>0;function random(){rngSeed=(Math.imul(rngSeed,1664525)+1013904223)>>>0;return rngSeed/4294967296;}
let toastTime=0,uiClock=0,worldSpeed=6,cameraBlend=0,flashTimer=0,lastNear=-10,debugInvincible=false,howReturn='menu',slowFrames=0;
const hints={jump:false,slide:false,lanes:false,enemy:false},bonusElements={};
const missions=[{label:'25 coin topla',target:25,value:()=>coinCount},{label:'600 metre ko\u015f',target:600,value:()=>distance},{label:'1 kez u\u00e7',target:1,value:()=>flights},{label:'80 coin topla',target:80,value:()=>coinCount},{label:'1.500 metre ko\u015f',target:1500,value:()=>distance},{label:'40 engeli a\u015f',target:40,value:()=>dodges}];
function mission(){if(missionIndex<missions.length)return missions[missionIndex];const target=2000+(missionIndex-missions.length)*1000;return{label:format(target)+' metre ko\u015f',target,value:()=>distance};}
function toast(title,subtitle='',duration=2.5){$('toast-title').textContent=title;$('toast-sub').textContent=subtitle;$('toast-sub').hidden=!subtitle;$('toast').classList.add('show');toastTime=duration;}
function hideToast(){$('toast').classList.remove('show');toastTime=0;}
function refreshSound(){document.querySelectorAll('.sound-toggle').forEach(b=>{b.classList.toggle('sound-off',!audio.enabled);b.setAttribute('aria-label',audio.enabled?'Sesi kapat':'Sesi a\u00e7');b.title=audio.enabled?'Ses a\u00e7\u0131k (M)':'Ses kapal\u0131 (M)';});}
function toggleSound(){audio.setEnabled(!audio.enabled);saved.muted=!audio.enabled;persist();refreshSound();}
function homeStats(){$('home-best').textContent=pad(saved.best);$('home-bank').textContent=format(saved.bank);$('hud-best').textContent=pad(saved.best);}
function burst(x,y,z,color,count=10,power=1){for(let i=0;i<count;i++){if(particles.length>110)removeParticle(0);const node=ShiftWorld.particle(color);node.p=[x,y,z];scene.add(node);particles.push({node,x,y,z,vx:(random()-.5)*power*5,vy:(2+random()*4)*power,vz:(random()-.3)*power*4,life:.45+random()*.30,max:.8});}}
function removeParticle(i){scene.remove(particles[i].node);particles.splice(i,1);}
function floating(text,x,y,z){if(document.querySelectorAll('.float-points').length>5)return;const p=renderer.project([x,y,z]);if(!p.visible)return;const el=document.createElement('div');el.className='float-points';el.textContent=text;el.style.left=p.x+'px';el.style.top=p.y+'px';document.body.appendChild(el);setTimeout(()=>el.remove(),750);}
function addEntity(kind,type,lane,z,y=0){let node;if(kind==='coin')node=ShiftWorld.coin();else if(kind==='special')node=ShiftWorld.specialPickup(type);else if(kind==='bonus')node=ShiftWorld.bonus(type);else node=ShiftWorld[type]();const e={kind,type,lane,x:LANES[lane],y,z,node,baseY:y,phase:random()*6.28,passed:false,hinted:false,prevZ:z};
  if(kind==='hazard'){const b={barrier:[1.02,.25,0,1.16],crate:[.84,.66,0,1.18],arch:[1.08,.28,1.55,2.50],van:[1.01,2.38,0,2.27],drone:[1.10,.60,1.30,2.13],robot:[.64,.38,0,2.10]}[type];[e.hx,e.hz,e.minY,e.maxY]=b;e.extraSpeed=type==='robot'?3.8:type==='drone'?2.5:0;
    if(type==='drone'){e.y=e.baseY=1.65;}if(type==='drone'||type==='robot'){const warning=ShiftGL.mesh('box','#cf664e',[2.05,.017,9],[0,.025-e.y,5]);warning.emission=.15;warning.visible=false;node.add(warning);e.warning=warning;}
  }
  node.p=[e.x,e.y,e.z];scene.add(node);entities.push(e);return e;
}
function removeEntity(i){scene.remove(entities[i].node);entities.splice(i,1);}
function clearEntities(){while(entities.length)removeEntity(entities.length-1);while(particles.length)removeParticle(particles.length-1);}
function coinsLine(lane,z,count=6,spacing=3.0,y=1.18){for(let i=0;i<count;i++)addEntity('coin','coin',lane,z+i*spacing,y);}
function clearLanding(){for(let i=entities.length-1;i>=0;i--)if(entities[i].kind==='hazard'&&entities[i].z>-44&&entities[i].z<9)removeEntity(i);player.invulnerable=Math.max(player.invulnerable,1.8);}
function addWave(z=-126){
  let safe;const options=[0,1,2].filter(l=>difficulty>=5||Math.abs(l-lastSafe)<=1);safe=options[Math.floor(random()*options.length)];lastSafe=safe;
  const occupied=[0,1,2].filter(l=>l!==safe);if(random()<.5)occupied.reverse();const count=difficulty===1?(distance>170&&random()>.65?2:1):(random()<.77?2:1);
  const types=difficulty===1?['barrier','crate','arch']:difficulty===2?['barrier','crate','arch','van','robot']:['barrier','arch','van','robot','drone'];
  for(let i=0;i<count;i++){const type=types[Math.floor(random()*types.length)];addEntity('hazard',type,occupied[i],z-(type==='van'?1:0));}
  const y=bonuses.flight>1.7?4.8:1.18;coinsLine(safe,z-1,6,3.0,y);
  if(difficulty>=3&&random()>.72){const jumpLane=occupied[0];const e=entities.find(e=>e.kind==='hazard'&&e.lane===jumpLane&&Math.abs(e.z-z)<2);if(e&&['barrier','crate'].includes(e.type)){for(let j=0;j<5;j++)addEntity('coin','coin',jumpLane,z+(j-2)*2.4,1.45+Math.sin(j/4*Math.PI)*1.6);}}
  return{safe,occupied:occupied.slice(0,count)};
}
function activateBonus(type){if(!BONUS[type])return;bonuses[type]=BONUS[type].duration;bonusCount++;if(type==='flight'){flights++;player.slide=0;player.vy=0;clearLanding();for(let i=0;i<3;i++)coinsLine(i,-72,15,4,4.8);}if(type==='boost'){player.invulnerable=Math.max(player.invulnerable,.7);}audio.bonus();toast(BONUS[type].name,BONUS[type].description,2.4);burst(player.x,1.4+player.y,PLAYER_Z,BONUS[type].color,16);refreshBonuses();}
function spawnBonus(){const sequence=['magnet','shield','boost','flight'];const type=sequence[bonusIndex%4];bonusIndex++;const lane=lastSafe,z=-65;for(let i=entities.length-1;i>=0;i--){const e=entities[i];if(e.kind==='hazard'&&e.lane===lane&&Math.abs(e.z-z)<16)removeEntity(i);}addEntity('bonus',type,lane,z,1.65);coinsLine(lane,z+4,5,3.0);nextBonusAt=distance+145+random()*80;}
function selectHero(id){if(!HEROES[id])return;selected=id;scene.remove(character.root);character=ShiftWorld.character(id);scene.add(character.root);document.querySelectorAll('[data-hero]').forEach(b=>{b.classList.toggle('selected',b.dataset.hero===id);b.setAttribute('aria-pressed',String(b.dataset.hero===id));});$('hero-hud').textContent=HEROES[id].name;try{localStorage.setItem('lastshift-hero',id);}catch(e){}}
function spawnSpecial(){const lane=lastSafe,z=-73;for(let i=entities.length-1;i>=0;i--)if(entities[i].kind==='hazard'&&entities[i].lane===lane&&Math.abs(entities[i].z-z)<13)removeEntity(i);addEntity('special',HEROES[selected].item.toLowerCase(),lane,z,1.55);nextSpecialAt=distance+125+random()*80;}
function activateSpecial(){specialCount++;bonuses.boost=Math.max(bonuses.boost,7.5);bonuses.magnet=Math.max(bonuses.magnet,10);player.invulnerable=Math.max(player.invulnerable,.7);audio.bonus();burst(player.x,player.y+1.4,PLAYER_Z,selected==='samko'?'#80e9f0':'#ffb947',24,1.3);toast(HEROES[selected].name+' / '+HEROES[selected].power,HEROES[selected].message,3);refreshBonuses();}
function updateAtmosphere(){const stages=[{min:0,name:'GÜN BATIMI',night:0,accent:'#ffcb70',filter:'none'},{min:10000,name:'ALTIN SAAT',night:.12,accent:'#ffb86d',filter:'sepia(.10)'},{min:20000,name:'ALACAKARANLIK',night:.37,accent:'#df9bc9',filter:'hue-rotate(15deg)'},{min:30000,name:'MAVİ SAAT',night:.65,accent:'#8dbcf3',filter:'hue-rotate(45deg)'},{min:40000,name:'NEON ŞEHİR',night:.88,accent:'#7de6e1',filter:'hue-rotate(90deg)'},{min:50000,name:'MOR GECE',night:.96,accent:'#d9a4ff',filter:'hue-rotate(135deg)'},{min:75000,name:'ŞAFAK',night:.22,accent:'#ffce93',filter:'hue-rotate(-20deg)'},{min:100000,name:'YENİ DÜNYA',night:.52,accent:'#b7ffce',filter:'hue-rotate(175deg)'}];let index=0;for(let i=0;i<stages.length;i++)if(score>=stages[i].min)index=i;const a=stages[index];if(index!==atmosphereStage){atmosphereStage=index;document.documentElement.style.setProperty('--stage-accent',a.accent);$('atmosphere-name').textContent=a.name;$('world').style.filter=a.filter;if(state==='running'&&index>0)toast('YENİ ATMOSFER / '+a.name,format(a.min)+' PUAN EŞİĞİ AŞILDI',3);}return a.night;}
function bankRun(){if(banked)return;banked=true;saved.bank+=coinCount;if(score>saved.best)saved.best=score;persist();homeStats();}
function start(){
  audio.unlock();audio.start();clearEntities();state='running';runTime=0;distance=0;speed=16;coinCount=coinScore=extraScore=score=0;difficulty=1;streak=0;streakTimer=0;multiplier=1;waveTimer=1.7;lastSafe=1;nextBonusAt=95;nextSpecialAt=65;specialCount=0;atmosphereStage=-1;bonusIndex=0;dodges=bonusCount=flights=0;missionIndex=0;missionCooldown=0;banked=false;overDelay=0;lastNear=-10;
  Object.assign(player,{lane:1,x:0,y:0,vy:0,slide:0,jumpBuffer:0,pendingSlide:false,invulnerable:0});for(const k in bonuses)bonuses[k]=0;for(const k in hints)hints[k]=false;
  character.root.visible=true;character.root.r=[0,0,0];character.shield.visible=false;
  $('home').hidden=true;$('site-head').hidden=true;$('hud').hidden=false;$('pause-overlay').hidden=true;$('over-overlay').hidden=true;$('how-overlay').hidden=true;$('controls-hint').classList.remove('fade');hideToast();
  coinsLine(1,-20,6,3.2);addEntity('hazard','barrier',1,-49);for(let i=0;i<5;i++)addEntity('coin','coin',1,-49+(i-2)*2.4,1.45+Math.sin(i/4*Math.PI)*1.5);
  addEntity('hazard','arch',1,-88);coinsLine(1,-86,6,3,1.05);addEntity('hazard','van',0,-126);coinsLine(1,-128,6,3.0);
  refreshBonuses();updateHUD();$('world').focus({preventScroll:true});
}
function goHome(){if(state==='running'||state==='paused'||state==='over')bankRun();state='menu';clearEntities();Object.keys(bonuses).forEach(k=>bonuses[k]=0);player.y=0;player.vy=0;player.slide=0;character.root.r=[0,0,0];character.root.visible=true;character.shield.visible=false;$('home').hidden=false;$('site-head').hidden=false;$('hud').hidden=true;$('over-overlay').hidden=true;$('pause-overlay').hidden=true;$('how-overlay').hidden=true;$('speed-lines').classList.remove('on');hideToast();homeStats();}
function pause(){if(state!=='running')return;state='paused';$('pause-overlay').hidden=false;hideToast();$('resume').focus({preventScroll:true});}
function resume(){if(state!=='paused')return;state='running';$('pause-overlay').hidden=true;audio.unlock();audio.nextBeat=audio.ctx?audio.ctx.currentTime+.1:0;$('world').focus({preventScroll:true});}
function gameOver(type){if(state!=='running')return;state='over';overDelay=.55;audio.hit();burst(player.x,1.1+player.y,PLAYER_Z,'#e9a36c',24,1.2);$('impact').classList.remove('flash');void $('impact').offsetWidth;$('impact').classList.add('flash');$('speed-lines').classList.remove('on');hideToast();
  const isRecord=score>saved.best;bankRun();$('new-record').hidden=!isRecord;$('final-score').textContent=pad(score);$('final-distance').textContent=format(distance)+' m';$('final-coins').textContent=format(coinCount);$('final-best').textContent=format(saved.best);
  const tips={barrier:'Al\u00e7ak bariyerleri z\u0131playarak a\u015f. Space veya \u2191.',crate:'Kasalar\u0131 z\u0131playarak a\u015fabilir ya da \u015ferit de\u011fi\u015ftirebilirsin.',arch:'Y\u00fcksek ge\u00e7itlerin alt\u0131ndan kay. \u2193 veya S.',van:'Ara\u00e7lar\u0131n \u00fczerinden atlanmaz. Bo\u015f \u015feride ge\u00e7.',robot:'Devriyeler sana do\u011fru gelir. Rotan\u0131 erken de\u011fi\u015ftir.',drone:'Dronelar\u0131n k\u0131rm\u0131z\u0131 uyar\u0131s\u0131n\u0131 izle. Kay ya da \u015ferit de\u011fi\u015ftir.'};$('end-tip').textContent=tips[type]||'Her ko\u015fu yeni bir rota. Bir sonraki senin.';
}
function jump(){if(state!=='running')return;if(bonuses.flight>0)return;if(player.y<.06){player.vy=10.9;player.y=.025;player.slide=0;player.pendingSlide=false;audio.jump();}else player.jumpBuffer=.13;}
function slide(){if(state!=='running'||bonuses.flight>0)return;if(player.y>.2){player.vy=-17;player.pendingSlide=true;}else{player.slide=.82;audio.slide();}}
function action(which){if(state!=='running')return;if(which==='left')player.lane=clamp(player.lane-1,0,2);else if(which==='right')player.lane=clamp(player.lane+1,0,2);else if(which==='jump')jump();else if(which==='slide')slide();}
function collectCoin(e){coinCount++;streak=streakTimer>0?streak+1:1;streakTimer=1.5;multiplier=Math.min(5,1+Math.floor(streak/10));const points=10*multiplier;coinScore+=points;audio.coin(streak);burst(e.x,e.y,e.z,'#ffcb70',4,.48);if(streak%10===0)floating('+'+points,e.x,e.y+1,e.z);}
function refreshBonuses(){for(const k of Object.keys(BONUS)){if(bonuses[k]>0&&!bonusElements[k]){const d=document.createElement('div');d.className='bonus-chip';d.dataset.kind=k;d.innerHTML='<svg class="icon"><use href="#i-'+k+'"/></svg><div class="bonus-name"><span>'+BONUS[k].name+'</span><span class="bonus-time"></span></div><div class="bonus-bar"><div class="bonus-fill"></div></div>';$('bonus-stack').appendChild(d);bonusElements[k]=d;}else if(bonuses[k]<=0&&bonusElements[k]){bonusElements[k].remove();delete bonusElements[k];}if(bonusElements[k]){bonusElements[k].querySelector('.bonus-time').textContent=Math.ceil(bonuses[k])+'s';bonusElements[k].querySelector('.bonus-fill').style.width=100*bonuses[k]/BONUS[k].duration+'%';}}
}
function updateHUD(){score=Math.floor(distance*1.5+coinScore+extraScore);$('score').textContent=pad(score);updateAtmosphere();$('coins').textContent=format(coinCount);$('distance').textContent=format(distance)+' M / SONSUZA';$('pace-value').textContent=(speed/16).toFixed(1)+'\u00d7';$('pace-fill').style.width=clamp(12+(speed-16)*3.3,12,100)+'%';$('district-no').textContent=String(Math.floor(distance/450)+1).padStart(2,'0');$('district-name').textContent=DISTRICTS[Math.min(DISTRICTS.length-1,Math.floor(distance/450))];$('combo').classList.toggle('active',multiplier>1&&streakTimer>0);$('combo-value').textContent='\u00d7'+multiplier;
  const m=mission(),value=Math.min(m.target,Math.floor(m.value()));$('mission-label').textContent=missionCooldown>0?'G\u00d6REV TAMAM / +250':'M\u0130N\u0130 G\u00d6REV / '+String(missionIndex+1).padStart(2,'0');$('mission-name').textContent=m.label;$('mission-value').textContent=format(value)+'/'+format(m.target);$('mission-fill').style.width=100*value/m.target+'%';refreshBonuses();
}
function updateEntities(dt,move){
  for(let i=entities.length-1;i>=0;i--){const e=entities[i];e.prevZ=e.z;e.z+=move+(e.extraSpeed||0)*dt;
    if(e.kind==='coin'){
      e.node.r[1]=time*2.1+e.phase;e.y=e.baseY+Math.sin(time*3+e.phase)*.075;
      const attracted=(bonuses.magnet>0||bonuses.boost>0||bonuses.flight>0)&&Math.abs(e.z-PLAYER_Z)<16&&Math.abs(e.x-player.x)<7;
      if(attracted){e.x=lerp(e.x,player.x,dt*8);e.baseY=lerp(e.baseY,player.y+1.2,dt*8);if(e.z<PLAYER_Z)e.z+=(PLAYER_Z-e.z)*dt*3;}
      if(Math.abs(e.z-PLAYER_Z)<1.10&&Math.abs(e.x-player.x)<.85&&Math.abs(e.y-(player.y+1.15))<1.20){collectCoin(e);removeEntity(i);continue;}
    }else if(e.kind==='special'){e.node.r[1]=time*1.8+e.phase;e.y=e.baseY+Math.sin(time*3+e.phase)*.15;if(Math.abs(e.z-PLAYER_Z)<1.5&&Math.abs(e.x-player.x)<1.12&&Math.abs(e.y-(player.y+1.2))<1.8){removeEntity(i);activateSpecial();continue;}
    }else if(e.kind==='bonus'){
      e.node.r[1]=Math.sin(time*1.7+e.phase)*.36;e.node.r[2]=Math.sin(time*1.9+e.phase)*.08;e.y=e.baseY+Math.sin(time*2.4+e.phase)*.17;
      if(Math.abs(e.z-PLAYER_Z)<1.3&&Math.abs(e.x-player.x)<1.02&&Math.abs(e.y-(player.y+1.25))<1.7){const type=e.type;removeEntity(i);activateBonus(type);continue;}
    }else{
      if(e.type==='drone'){e.y=e.baseY+Math.sin(time*5+e.phase)*.12;e.x=LANES[e.lane]+Math.sin(time*2.2+e.phase)*.14;e.node.r[2]=Math.sin(time*3+e.phase)*.08;e.node.user.rotors.forEach((r,k)=>r.r[1]=time*45*(k%2?1:-1));}
      if(e.type==='robot'){e.node.user.legs.forEach((l,k)=>l.r[0]=Math.sin(time*9+k*Math.PI)*.48);e.y=Math.abs(Math.cos(time*9))*.045;}
      if(e.warning)e.warning.visible=e.z>-30&&e.z<0;
      if(e.z>-24&&!e.hinted&&distance<460){e.hinted=true;if(e.type==='barrier'&&!hints.jump&&Math.abs(e.x-player.x)<1.8){hints.jump=true;toast('\u2191  ZIPLA',touchDevice?'Yukar\u0131 kayd\u0131r veya dokun':'SPACE veya yukar\u0131 ok',1.1);}else if(e.type==='arch'&&!hints.slide&&Math.abs(e.x-player.x)<1.8){hints.slide=true;toast('\u2193  ALTINDAN KAY',touchDevice?'A\u015fa\u011f\u0131 kayd\u0131r':'A\u015fa\u011f\u0131 ok veya S',1.1);}else if(e.type==='van'&&!hints.lanes){hints.lanes=true;toast('\u2190  \u015eER\u0130T DE\u011e\u0130\u015eT\u0130R  \u2192','Ara\u00e7lar\u0131n yan\u0131ndan ge\u00e7.',1.2);}else if(['drone','robot'].includes(e.type)&&!hints.enemy){hints.enemy=true;toast('G\u00d6ZC\u00dc YAKLA\u015eIYOR','K\u0131rm\u0131z\u0131 hatt\u0131 bo\u015f b\u0131rak.',1.6);}}
      const crossed=e.z+e.hz>=PLAYER_Z-.2&&e.prevZ-e.hz<=PLAYER_Z+.2;
      if(crossed&&Math.abs(e.x-player.x)<e.hx+.28){const bottom=player.y+.12,top=player.y+(player.slide>0?1.02:2.19);if(top>e.minY+.07&&bottom<e.maxY-.08){
        if(bonuses.boost>0){burst(e.x,e.y+.7,e.z,ShiftWorld.C.orange,16,1.2);extraScore+=25;removeEntity(i);continue;}
        if(bonuses.shield>0&&player.invulnerable<=0){bonuses.shield=0;player.invulnerable=1.3;audio.shield();burst(player.x,player.y+1.2,PLAYER_Z,ShiftWorld.C.cyan,18);toast('KALKAN KIRILDI','Ko\u015fmaya devam!',1.5);removeEntity(i);continue;}
        if(player.invulnerable<=0&&!debugInvincible&&bonuses.flight<=0){score=Math.floor(distance*1.5+coinScore+extraScore);gameOver(e.type);return;}
      }}
      if(!e.passed&&e.z-e.hz>PLAYER_Z){e.passed=true;dodges++;const d=Math.abs(e.x-player.x);if(d>e.hx+.28&&d<e.hx+1.1&&runTime-lastNear>1.8){extraScore+=35;lastNear=runTime;floating('+35',player.x,player.y+2.5,PLAYER_Z);}}
    }
    e.node.p=[e.x,e.y,e.z];if(e.z>13)removeEntity(i);
  }
}
function updateParticles(dt,move){for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){removeParticle(i);continue;}p.vy-=12*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt+move*.25;p.node.p=[p.x,p.y,p.z];p.node.r[0]+=dt*5;p.node.r[2]+=dt*4;const s=.07*clamp(p.life/.3,0,1);p.node.s=[s,s,s];}}
function update(dt){
  if(state==='paused'||state==='how')return;time+=dt;if(toastTime>0){toastTime-=dt;if(toastTime<=0)hideToast();}
  let move=0;
  if(state==='running'){
    runTime+=dt;difficulty=1+Math.min(7,Math.floor(distance/350));const targetSpeed=(16+Math.min(14,distance/105))*(bonuses.boost>0?1.42:1);speed=lerp(speed,targetSpeed,dt*2.5);worldSpeed=speed;move=speed*dt;distance+=move;
    const oldFlight=bonuses.flight;for(const k in bonuses)bonuses[k]=Math.max(0,bonuses[k]-dt);if(oldFlight>0&&bonuses.flight<=0)clearLanding();if(oldFlight>1.6&&bonuses.flight<=1.6){toast('\u0130N\u0130\u015eE HAZIRLAN','G\u00fcvenli koridor a\u00e7\u0131l\u0131yor.',1.5);clearLanding();}
    player.invulnerable=Math.max(0,player.invulnerable-dt);player.slide=Math.max(0,player.slide-dt);player.jumpBuffer=Math.max(0,player.jumpBuffer-dt);
    player.x=lerp(player.x,LANES[player.lane],dt*14);
    if(bonuses.flight>0){const height=bonuses.flight<1.5?3.6*(bonuses.flight/1.5):3.6;player.y=lerp(player.y,height,dt*4);player.vy=0;}
    else{player.vy-=27*dt;player.y+=player.vy*dt;if(player.y<=0){player.y=0;player.vy=0;if(player.pendingSlide){player.slide=.65;player.pendingSlide=false;audio.slide();}if(player.jumpBuffer>0){player.jumpBuffer=0;jump();}}}
    streakTimer=Math.max(0,streakTimer-dt);if(streakTimer<=0){streak=0;multiplier=1;}
    waveTimer-=dt;if(waveTimer<=0){let z=-128;const hazards=entities.filter(e=>e.kind==='hazard');if(hazards.length){const farthest=Math.min(...hazards.map(e=>e.z));z=Math.min(z,farthest-speed*(1.70-Math.min(.45,difficulty*.055)));}addWave(z);waveTimer=1.70-Math.min(.45,difficulty*.055);}
    if(distance>=nextBonusAt)spawnBonus();if(distance>=nextSpecialAt)spawnSpecial();updateEntities(dt,move);
    if(state==='running'){if(missionCooldown>0){missionCooldown-=dt;if(missionCooldown<=0)missionIndex++;}else if(mission().value()>=mission().target){missionCooldown=2;extraScore+=250;audio.mission();toast('M\u0130N\u0130 G\u00d6REV TAMAM','+250 puan. Ritmi bozma.',2);}}
    $('controls-hint').classList.toggle('fade',runTime>13);$('speed-lines').classList.toggle('on',bonuses.boost>0);
  }else if(state==='menu'){
    worldSpeed=lerp(worldSpeed,6,dt*2);move=worldSpeed*dt;player.x=lerp(player.x,innerWidth<641?0:2.5,dt*3);player.y=0;
  }else if(state==='over'){
    worldSpeed=lerp(worldSpeed,.8,dt*3);move=worldSpeed*dt;if(overDelay>0){overDelay-=dt;if(overDelay<=0){$('over-overlay').hidden=false;$('restart').focus({preventScroll:true});}}
    for(const e of entities){e.z+=move;e.node.p[2]=e.z;}
  }
  city.update(move,time);updateParticles(dt,move);
  stridePhase+=worldSpeed*dt*.72;character.root.p=[player.x,player.y,PLAYER_Z];character.animate(time,state==='over'?0:worldSpeed,player.slide>0,player.y>.12,bonuses.flight>0,(LANES[player.lane]-player.x)*-.065,stridePhase);
  if(state==='over'){character.body.r[0]=lerp(character.body.r[0],-.45,.2);character.body.p[1]=-.08;}
  character.root.visible=player.invulnerable<=0||Math.floor(time*12)%2===0||bonuses.flight>0;character.shield.visible=bonuses.shield>0;character.shield.r[1]=time*.6;character.shield.r[2]=Math.sin(time)*.03;
  uiClock+=dt;if(uiClock>.07&&state==='running'){uiClock=0;updateHUD();}
}
function updateCamera(dt){
  const portrait=renderer.aspect<.86,menu=state==='menu'||state==='how';cameraBlend=lerp(cameraBlend,menu?0:1,dt*3);
  const mx=portrait?0:1.2,my=portrait?5.8:4.3,mz=portrait?11.5:8.8;
  const gx=player.x*(portrait?.42:.18),gy=(portrait?5.7:5.7)+player.y*.23,gz=portrait?10.2:10.3;
  const desired=[lerp(mx,gx,cameraBlend),lerp(my,gy,cameraBlend),lerp(mz,gz,cameraBlend)];for(let i=0;i<3;i++)renderer.eye[i]=lerp(renderer.eye[i],desired[i],dt*5);
  const target=[lerp(0,player.x*.20,cameraBlend),lerp(portrait?.6:1.25,portrait?1.1:1.6,cameraBlend)+player.y*.17,portrait?-15:-13];for(let i=0;i<3;i++)renderer.target[i]=lerp(renderer.target[i],target[i],dt*5);
  renderer.fov=lerp(renderer.fov,(portrait?68:53)+(bonuses.boost>0?5:0)+(bonuses.flight>0?3:0),dt*2);
  const targetNight=menu?0:updateAtmosphere();renderer.night=lerp(renderer.night,targetNight,dt*.3);
}
function openHow(){if(state==='running'){pause();howReturn='paused';}else howReturn=state;if(state==='menu')state='how';$('how-overlay').hidden=false;$('close-how').focus({preventScroll:true});}
function closeHow(){if(state==='how')state='menu';$('how-overlay').hidden=true;if(howReturn==='paused')$('resume').focus({preventScroll:true});else $('start').focus({preventScroll:true});}
async function fullscreen(){try{if(document.fullscreenElement){await document.exitFullscreen();}else if(document.documentElement.requestFullscreen){await document.documentElement.requestFullscreen();}else toast('TAM EKRAN','Bu taray\u0131c\u0131 tam ekran\u0131 desteklemiyor.',2);}catch(e){toast('TAM EKRAN','Taray\u0131c\u0131 bu g\u00f6r\u00fcn\u00fcme izin vermedi.',2);}}
document.querySelectorAll('[data-hero]').forEach(b=>b.addEventListener('click',()=>selectHero(b.dataset.hero)));try{selectHero(localStorage.getItem('lastshift-hero')||'samko');}catch(e){selectHero('samko');}
$('start').addEventListener('click',start);$('restart').addEventListener('click',start);$('restart-pause').addEventListener('click',start);$('pause-button').addEventListener('click',pause);$('resume').addEventListener('click',resume);$('home-pause').addEventListener('click',goHome);$('home-over').addEventListener('click',goHome);$('how').addEventListener('click',openHow);$('info').addEventListener('click',openHow);$('close-how').addEventListener('click',closeHow);$('got-it').addEventListener('click',closeHow);$('fullscreen').addEventListener('click',fullscreen);document.querySelectorAll('.sound-toggle').forEach(b=>b.addEventListener('click',toggleSound));
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();action(b.dataset.action);}));
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();if(e.target.closest?.('button')&&[' ','enter'].includes(key))return;const gameKeys=[' ','arrowup','arrowdown','arrowleft','arrowright','w','a','s','d','p','escape','enter','m','f'];if(gameKeys.includes(key))e.preventDefault();if(e.repeat)return;
  if(key==='m'){toggleSound();return;}if(key==='f'){fullscreen();return;}if(!$('how-overlay').hidden){if(key==='escape'||key==='enter'||key===' ')closeHow();return;}
  if(key==='p'||key==='escape'){if(state==='running')pause();else if(state==='paused')resume();return;}
  if(state==='menu'&&[' ','enter'].includes(key)){start();return;}if(state==='over'&&[' ','enter'].includes(key)&&overDelay<=0){start();return;}if(state==='paused'&&[' ','enter'].includes(key)){resume();return;}
  if(['arrowleft','a'].includes(key))action('left');if(['arrowright','d'].includes(key))action('right');if(['arrowup','w',' '].includes(key))action('jump');if(['arrowdown','s'].includes(key))action('slide');
});
let touchStart=null;$('world').addEventListener('pointerdown',e=>{if(state!=='running')return;touchStart={x:e.clientX,y:e.clientY,id:e.pointerId};try{$('world').setPointerCapture(e.pointerId);}catch(err){}});$('world').addEventListener('pointerup',e=>{if(!touchStart||touchStart.id!==e.pointerId)return;const dx=e.clientX-touchStart.x,dy=e.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<20)action('jump');else if(Math.abs(dx)>Math.abs(dy))action(dx>0?'right':'left');else action(dy>0?'slide':'jump');});$('world').addEventListener('pointercancel',()=>touchStart=null);
window.addEventListener('resize',()=>renderer.resize());document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',()=>{if(state==='running')pause();});$('world').addEventListener('webglcontextlost',e=>{e.preventDefault();pause();$('fatal').hidden=false;$('fatal-message').textContent='Grafik ba\u011flant\u0131s\u0131 kesildi. Sayfay\u0131 yenileyerek devam edebilirsin.';});
homeStats();refreshSound();
// Quality adaptation reduces resolution, not simulation accuracy or game speed.
let last=performance.now(),accumulator=0;const STEP=1/90;let rendered=0;
function frame(now){const raw=(now-last)/1000;last=now;const dt=clamp(raw,0,.07);accumulator+=dt;let iterations=0;while(accumulator>=STEP&&iterations<7){update(STEP);accumulator-=STEP;iterations++;}if(iterations>=7)accumulator=0;if(state!=='paused')updateCamera(dt);renderer.render(scene,dt);audio.update(state==='running');
  if(raw>.037&&raw<.12)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>160&&renderer.dpr>1){renderer.dpr=1;renderer.resize();slowFrames=0;}
  if(++rendered===3)$('loading').hidden=true;requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// The debug interface exists ONLY for explicit ?debug=1 test builds / URLs.
if(new URLSearchParams(location.search).get('debug')==='1'){
  window.__LASTSHIFT_TEST__={start,pause,resume,goHome,activateBonus,action,clear:clearEntities,
    snapshot:()=>({state,distance,score,coins:coinCount,speed,difficulty,streak,bank:saved.bank,best:saved.best,player:{...player},bonuses:{...bonuses},entities:entities.map(e=>({kind:e.kind,type:e.type,x:e.x,y:e.y,z:e.z,lane:e.lane})),particles:particles.length,selected,specialCount,atmosphereStage,drawCalls:renderer.drawCalls,instances:renderer.instances}),
    step:(seconds,render=true)=>{for(let t=0;t<seconds;t+=STEP)update(STEP);updateCamera(.2);if(render)renderer.render(scene,0);updateHUD();},
    player:data=>{Object.assign(player,data);if('lane'in data)player.x=LANES[player.lane];},spawn:(type,lane,z)=>addEntity('hazard',type,lane,z),coin:(lane,z,y=1.2)=>addEntity('coin','coin',lane,z,y),bonus:(type,lane,z)=>addEntity('bonus',type,lane,z,1.65),special:(lane,z)=>addEntity('special',HEROES[selected].item.toLowerCase(),lane,z,1.55),selectHero,invincible:v=>{debugInvincible=v;},distance:v=>{distance=v;},wave:z=>addWave(z),error:()=>renderer.gl.getError(),render:()=>renderer.render(scene,0),setDPR:v=>{renderer.dpr=v;renderer.resize();}
  };
}
})();
