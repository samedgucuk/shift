import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'dist/index.html').read_text().replace("new URLSearchParams(location.search).get('debug')==='1'",'true').replace('requestAnimationFrame(frame);','if(!window.__QA_FREEZE__)requestAnimationFrame(frame);')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/lib/chromium/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
 page=b.new_page(viewport={'width':960,'height':600},device_scale_factor=1)
 page.evaluate('window.__QA_FREEZE__=true')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(html,wait_until='load')
 page.evaluate("document.getElementById('loading').hidden=true")
 results=page.evaluate('''()=>{
  const t=window.__LASTSHIFT_TEST__,res=[];const assert=(name,ok,data='')=>res.push({name,ok:!!ok,data});
  function reset(){t.start();t.clear();t.invincible(false);}
  function step(s){t.step(s,false);}
  reset();step(.5);assert('Running advances distance',t.snapshot().distance>7);
  const d=t.snapshot().distance;t.pause();step(1);assert('Pause freezes simulation',t.snapshot().distance===d);t.resume();step(.1);assert('Resume runs',t.snapshot().state==='running');
  reset();t.action('left');step(.3);assert('Left lane responds',t.snapshot().player.x< -2.95,t.snapshot().player.x);t.action('right');t.action('right');step(.3);assert('Right lane responds',t.snapshot().player.x>2.93,t.snapshot().player.x);
  reset();t.action('jump');step(.3);assert('Jump clears a low barrier height',t.snapshot().player.y>1.5,t.snapshot().player.y);step(.8);assert('Jump lands back on road',t.snapshot().player.y===0);
  reset();t.spawn('barrier',1,1);step(.06);assert('Barrier collision ends run',t.snapshot().state==='over');
  reset();t.player({y:1.65,vy:0});t.spawn('barrier',1,1);step(.10);assert('Jump avoids barrier',t.snapshot().state==='running');
  reset();t.spawn('arch',1,1);step(.05);assert('Standing hits overhead gate',t.snapshot().state==='over');
  reset();t.action('slide');t.spawn('arch',1,1);step(.08);assert('Slide passes under gate',t.snapshot().state==='running');
  reset();t.action('slide');t.spawn('barrier',1,1);step(.05);assert('Slide does not bypass low barrier',t.snapshot().state==='over');
  reset();t.player({lane:0});t.spawn('van',1,1);step(.2);assert('Lane change avoids van',t.snapshot().state==='running');
  reset();t.coin(1,1.9);step(.02);assert('Coin collection updates score',t.snapshot().coins===1&&t.snapshot().score>=10,t.snapshot().coins);
  reset();t.activateBonus('shield');step(1.9);t.clear();t.spawn('barrier',1,1);step(.05);assert('Shield absorbs one collision',t.snapshot().state==='running'&&t.snapshot().bonuses.shield===0);
  t.clear();step(1.5);t.spawn('crate',1,1);step(.05);assert('Consumed shield no longer protects',t.snapshot().state==='over');
  reset();t.activateBonus('boost');t.spawn('van',1,1);step(.05);assert('Boost breaks vehicles',t.snapshot().state==='running'&&!t.snapshot().entities.some(e=>e.type==='van'));step(1);assert('Boost increases speed',t.snapshot().speed>20,t.snapshot().speed);
  reset();t.activateBonus('magnet');t.coin(0,-5);step(.65);assert('Magnet attracts adjacent lane coins',t.snapshot().coins>0,t.snapshot().coins);
  reset();t.activateBonus('flight');step(1);assert('Flight lifts player',t.snapshot().player.y>3.4,t.snapshot().player.y);t.spawn('van',1,1);step(.1);assert('Flight clears tall vehicles',t.snapshot().state==='running');t.clear();step(8.5);assert('Flight expires and lands safely',t.snapshot().state==='running'&&t.snapshot().bonuses.flight===0&&t.snapshot().player.y<.15,t.snapshot().player.y);
  reset();t.bonus('magnet',1,1.9);step(.03);assert('World bonus activates on touch',t.snapshot().bonuses.magnet>8);
  reset();let fair=true;for(let i=0;i<1000;i++){t.clear();t.distance(i*8);const w=t.wave(-80);if(w.occupied.includes(w.safe)||w.occupied.length>2)fair=false;}assert('1000 generated patterns retain an open lane',fair);
  reset();t.invincible(true);step(150);const snap=t.snapshot();assert('Long run stays stable',snap.state==='running',snap.state);assert('Difficulty and speed increase',snap.difficulty>4&&snap.speed>25,{difficulty:snap.difficulty,speed:snap.speed});assert('Entity count bounded',snap.entities.length<180,snap.entities.length);assert('Particle count bounded',snap.particles<=111,snap.particles);t.render();assert('WebGL has no errors',t.error()===0);assert('Renderer uses instanced draw calls',t.snapshot().drawCalls<=15,t.snapshot().drawCalls);
  return res;
 }''')
 print(json.dumps({'results':results,'pageErrors':errors},indent=2),flush=True)
 (ROOT/'tests/test-results.json').write_text(json.dumps({'results':results,'pageErrors':errors},indent=2))
 b.close()
