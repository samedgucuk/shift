import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'dist/index.html').read_text().replace("new URLSearchParams(location.search).get('debug')==='1'",'true').replace('requestAnimationFrame(frame);','if(!window.__QA_FREEZE__)requestAnimationFrame(frame);')
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/lib/chromium/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
 page=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
 page.evaluate('window.__QA_FREEZE__=true')
 requests=[];page.on('request',lambda r:requests.append(r.url))
 page.set_content(html);page.evaluate("document.getElementById('loading').hidden=true")
 results=[]
 def check(label,expression):results.append({'name':label,'ok':bool(page.evaluate(expression))})
 page.click('#start');check('Start button',"window.__LASTSHIFT_TEST__.snapshot().state==='running'")
 page.locator('[data-action="left"]').dispatch_event('pointerdown',{'pointerId':1,'pointerType':'touch'})
 page.evaluate('window.__LASTSHIFT_TEST__.step(.3,false)');check('Touch left control',"window.__LASTSHIFT_TEST__.snapshot().player.lane===0")
 page.keyboard.press('ArrowRight');check('Keyboard lane control',"window.__LASTSHIFT_TEST__.snapshot().player.lane===1")
 page.keyboard.press('Space');page.evaluate('window.__LASTSHIFT_TEST__.step(.2,false)');check('Keyboard jump',"window.__LASTSHIFT_TEST__.snapshot().player.y>1")
 page.click('#pause-button');check('Pause button',"window.__LASTSHIFT_TEST__.snapshot().state==='paused'")
 page.click('#resume');check('Resume button',"window.__LASTSHIFT_TEST__.snapshot().state==='running'")
 page.evaluate('window.__LASTSHIFT_TEST__.step(1,false)')
 page.locator('#world').dispatch_event('pointerdown',{'pointerId':5,'clientX':200,'clientY':400,'pointerType':'touch'})
 page.locator('#world').dispatch_event('pointerup',{'pointerId':5,'clientX':310,'clientY':405,'pointerType':'touch'})
 check('Swipe right',"window.__LASTSHIFT_TEST__.snapshot().player.lane===2")
 page.keyboard.press('m');check('Sound button state',"document.querySelector('.sound-toggle').classList.contains('sound-off')")
 page.evaluate('window.__LASTSHIFT_TEST__.goHome()');page.click('#how');check('Instructions open',"!document.getElementById('how-overlay').hidden")
 page.click('#got-it');check('Instructions close',"document.getElementById('how-overlay').hidden")
 results.append({'name':'No external asset requests','ok':len(requests)==0})
 brand=(ROOT/'brand-guide.html').read_text();page.set_content(brand)
 page.screenshot(path=str(ROOT/'tests/brand-preview.png'))
 check('Brand text has no unresolved tokens',"!document.body.innerText.includes('~')")
 print(json.dumps({'results':results,'requests':requests},indent=2),flush=True)
 (ROOT/'tests/interaction-results.json').write_text(json.dumps({'results':results,'requests':requests},indent=2))
 b.close()
