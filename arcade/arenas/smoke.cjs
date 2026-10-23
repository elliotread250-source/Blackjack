// NODE_PATH=/path/to/node_modules node arcade/arenas/smoke.cjs
const { chromium } = require('playwright');
const base = process.env.ARCADE_URL || 'http://127.0.0.1:8084/arenas/';
(async () => {
 const browser = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  for(let i=0;i<5;i++){
   await page.locator('.card').nth(i).click();await page.locator('#arena').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelectorAll('.score-row').length===8);
   const friend=await browser.newPage();await friend.goto(page.url());await friend.locator('#arena').waitFor({state:'visible'});await page.waitForFunction(()=>document.querySelectorAll('.score-row').length===9);
   const before=await page.evaluate(()=>document.querySelector('#canvas').toDataURL());await page.mouse.move(800,400);await page.keyboard.press('Space');await page.waitForTimeout(400);
   const after=await page.evaluate(()=>document.querySelector('#canvas').toDataURL());if(before===after)throw Error('Canvas did not update');
   await friend.close();await page.locator('#leave').click();await page.locator('#room').fill('');console.log('PASS arena',i,'two clients, changing canvas, action');
  }
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));await phone.goto(base);
  if(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth))throw Error('Mobile overflow');await phone.locator('.card').nth(4).tap();await phone.locator('#arena').waitFor({state:'visible'});await phone.locator('#action').tap();await phone.waitForTimeout(200);
  if(errors.length)throw Error(errors.join('\n'));console.log('PASS touch controls, mobile layout, no browser errors');await mobile.close();
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
