/* Art direction, procedural city, rigged character and tangible gameplay objects. */
'use strict';
const ShiftWorld=(()=>{
  const {group,mesh}=ShiftGL;
  const C={ink:'#203843',suit:'#243f51',suitLight:'#35576b',seam:'#526e7a',skin:'#dcae85',hair:'#382d29',shoe:'#342d2b',paper:'#f4eddf',gold:'#ffca59',goldEdge:'#e89c31',street:'#50646a',concrete:'#d2cbb7',sage:'#96aa8b',tree:'#5c816c',treeLight:'#82a078',orange:'#eb844a',red:'#e45d49',glass:'#50737a',dark:'#24383c',cyan:'#74d6dc',violet:'#b59bee'};
  let seed=73129;
  function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
  const pick=a=>a[Math.floor(random()*a.length)];
  function box(g,c,s,p,r){const n=mesh('box',c,s,p,r);g.add(n);return n;}
  function ball(g,c,s,p){const n=mesh('sphere',c,s,p);g.add(n);return n;}
  function cyl(g,c,s,p,r){const n=mesh('cylinder',c,s,p,r);g.add(n);return n;}
  function ring(g,c,s,p,r){const n=mesh('torus',c,s,p,r);g.add(n);return n;}
  function limb(parent,p,color,len,width=.14){const joint=group();joint.p=p;parent.add(joint);cyl(joint,color,[width,len,width],[0,-len/2,0]);ball(joint,color,[width,width,width],[0,0,0]);return joint;}
  function character(identity="samko"){
    const look={samko:{suit:"#243f51",hair:"#382d29",skin:"#dcae85",accent:"#b85d46"},muris:{suit:"#86516e",hair:"#583328",skin:"#e3b994",accent:"#ffca59"},fati:{suit:"#37796c",hair:"#302825",skin:"#d5a47e",accent:"#e2a15c"}}[identity]||{suit:C.suit,hair:C.hair,skin:C.skin,accent:"#b85d46"};
    const old={suit:C.suit,hair:C.hair,skin:C.skin};C.suit=look.suit;C.hair=look.hair;C.skin=look.skin;
    const root=group(),body=group();root.add(body);
    const pelvis=ball(body,C.suit,[.32,.24,.21],[0,1.0,0]);
    const torso=cyl(body,C.suit,[.39,.70,.24],[0,1.43,0]);
    torso.s=[.37,.72,.235];
    ball(body,C.suit,[.38,.24,.24],[0,1.68,0]);
    // Tailored jacket seams, shoulder structure and the back vent.
    box(body,C.suitLight,[.013,.58,.013],[0,1.42,.238]);
    box(body,C.suitLight,[.016,.23,.015],[-.18,1.13,.23],[0,0,-.07]);
    box(body,C.suitLight,[.016,.23,.015],[.18,1.13,.23],[0,0,.07]);
    box(body,'#1a303d',[.02,.18,.022],[0,1.06,.239]);
    cyl(body,C.skin,[.12,.17,.12],[0,1.92,0]);
    cyl(body,C.paper,[.17,.085,.15],[0,1.85,0]);
    const head=group();head.p=[0,2.09,-.035];body.add(head);
    ball(head,C.skin,[.245,.295,.225],[0,.035,0]);
    ball(head,C.hair,[.25,.18,.23],[0,.205,.01]);
    ball(head,C.hair,[.236,.21,.12],[0,.10,.15]);
    ball(head,'#47342b',[.19,.11,.2],[-.065,.28,-.025]);
    ball(head,C.skin,[.053,.085,.055],[-.24,.04,.005]);ball(head,C.skin,[.053,.085,.055],[.24,.04,.005]);
    ball(head,C.skin,[.055,.065,.07],[0,.035,-.231]);
    box(head,'#302d2b',[.23,.035,.028],[0,.10,-.221]);
    // White shirt / narrow tie / folded lapels on the front of the suit.
    box(body,C.paper,[.16,.48,.018],[0,1.54,-.23]);
    box(body,look.accent,[.055,.33,.025],[0,1.50,-.246],[0,0,.03]);
    box(body,C.suitLight,[.15,.37,.024],[-.145,1.60,-.23],[0,0,-.31]);
    box(body,C.suitLight,[.15,.37,.024],[.145,1.60,-.23],[0,0,.31]);
    const leftLeg=limb(body,[-.19,1.05,0],C.suit,.48,.142),rightLeg=limb(body,[.19,1.05,0],C.suit,.48,.142);
    const leftKnee=limb(leftLeg,[0,-.48,0],C.suit,.44,.12),rightKnee=limb(rightLeg,[0,-.48,0],C.suit,.44,.12);
    for(const k of [leftKnee,rightKnee]){ball(k,C.shoe,[.145,.105,.26],[0,-.44,-.105]);box(k,'#191f23',[.26,.055,.44],[0,-.50,-.07]);}
    const leftArm=limb(body,[-.40,1.73,0],C.suit,.36,.115),rightArm=limb(body,[.40,1.73,0],C.suit,.36,.115);
    const leftElbow=limb(leftArm,[0,-.36,0],C.suit,.30,.10),rightElbow=limb(rightArm,[0,-.36,0],C.suit,.30,.10);
    for(const e of [leftElbow,rightElbow]){cyl(e,C.paper,[.102,.06,.102],[0,-.29,0]);ball(e,C.skin,[.094,.115,.09],[0,-.37,0]);}
    const bag=group();bag.p=[.03,-.55,.005];rightElbow.add(bag);
    box(bag,'#895c3a',[.16,.45,.57],[0,-.15,0]);
    box(bag,'#a3784a',[.018,.39,.50],[.09,-.15,0]);
    box(bag,'#493b2c',[.17,.035,.58],[0,.065,0]);
    const handle=ring(bag,'#573e2a',[.11,.095,.10],[0,.13,0],[0,Math.PI/2,0]);
    box(bag,C.goldEdge,[.025,.05,.055],[.103,-.015,-.17]);box(bag,C.goldEdge,[.025,.05,.055],[.103,-.015,.17]);
    const jet=group();jet.p=[0,1.5,.32];jet.visible=false;body.add(jet);
    box(jet,C.paper,[.52,.55,.25],[0,0,0]);box(jet,C.dark,[.31,.27,.035],[0,.02,.14]);
    const wings=[];for(const sign of[-1,1]){cyl(jet,C.ink,[.12,.65,.12],[sign*.29,-.05,.0]);const flame=mesh('cone',C.cyan,[.09,.42,.09],[sign*.29,-.52,0],[0,0,Math.PI]);flame.emission=1.2;jet.add(flame);wings.push(flame);box(jet,C.paper,[.67,.065,.32],[sign*.56,.09,0],[0,sign*.16,sign*.09]);box(jet,C.orange,[.12,.07,.33],[sign*.82,.09,0]);}
    const shield=group();shield.visible=false;root.add(shield);for(let i=0;i<3;i++){const s=ring(shield,C.cyan,[.70,1.25,.70],[0,1.2,0],[0,i*Math.PI/3,0]);s.emission=.45;}
    function animate(t,speed,slide,air,flight,lean=0,phase=null){
      const a=phase===null?t*(speed>0?10.8:3):phase,run=Math.min(1,speed/12),swing=Math.sin(a)*.64*run;
      const smooth=(v,target,rate)=>v+(target-v)*Math.min(1,rate);body.p[1]=smooth(body.p[1],slide?-.57:Math.abs(Math.cos(a))*0.042*run,.23);body.r=[smooth(body.r[0],slide?-1.05:flight?-.30:-.10,.20),0,smooth(body.r[2],lean,.18)];
      if(slide){leftLeg.r[0]=-.95;rightLeg.r[0]=.2;leftKnee.r[0]=1.7;rightKnee.r[0]=1.8;leftArm.r[0]=.65;rightArm.r[0]=.3;leftElbow.r[0]=-.7;rightElbow.r[0]=-.5;}
      else if(flight){leftLeg.r[0]=.35+Math.sin(t*4)*.08;rightLeg.r[0]=.15+Math.cos(t*4)*.08;leftKnee.r[0]=.25;rightKnee.r[0]=.45;leftArm.r[0]=-.7;rightArm.r[0]=-.4;leftElbow.r[0]=-.5;rightElbow.r[0]=-.35;}
      else if(air){leftLeg.r[0]=-.45;rightLeg.r[0]=.5;leftKnee.r[0]=.85;rightKnee.r[0]=.70;leftArm.r[0]=-.8;rightArm.r[0]=.0;leftElbow.r[0]=-.85;rightElbow.r[0]=-.7;}
      else{leftLeg.r[0]=swing;rightLeg.r[0]=-swing;leftKnee.r[0]=Math.max(0,-swing)*1.6+.1;rightKnee.r[0]=Math.max(0,swing)*1.6+.1;leftArm.r[0]=-swing*.8;rightArm.r[0]=swing*.6;leftElbow.r[0]=-.85;rightElbow.r[0]=-.6;}
      leftArm.r[2]=-.10;rightArm.r[2]=.13;head.r[0]=slide?.55:.06;head.r[1]=lean*-.7;bag.r[0]=Math.sin(a+.6)*.16;jet.visible=flight;wings.forEach((f,i)=>{f.s[1]=.35+Math.sin(t*38+i)*.10;});
    }
    Object.assign(C,old);return{root,body,shield,animate};
  }
  function tree(g,x,z,scale=1){const t=group();t.p=[x,0,z];t.s=[scale,scale,scale];g.add(t);cyl(t,'#b4aa8d',[.6,.32,.6],[0,.16,0]);cyl(t,'#786756',[.12,1.8,.12],[0,1.05,0]);ball(t,C.tree,[.83,1.05,.75],[0,2.3,0]);ball(t,C.treeLight,[.60,.70,.60],[-.33,2.77,-.10]);ball(t,'#739273',[.63,.65,.67],[.40,2.32,.15]);}
  function lamp(g,x,z){const l=group();l.p=[x,0,z];g.add(l);cyl(l,C.ink,[.085,4.7,.085],[0,2.35,0]);box(l,C.ink,[1.15,.12,.28],[x>0?-.45:.45,4.64,0]);const light=box(l,'#ffe6ad',[.8,.045,.22],[x>0?-.45:.45,4.55,0]);light.emission=.85;cyl(l,C.dark,[.18,.18,.18],[0,.1,0]);}
  function building(parent,x,z,w,d,h,color,style){const g=group();g.p=[x,0,z];parent.add(g);box(g,color,[w,h,d],[0,h/2,0]);
    box(g,C.paper,[w+.2,.24,d+.2],[0,h-.15,0]);box(g,'#b7b6a6',[w+.25,.30,d+.25],[0,.2,0]);
    const rows=Math.min(7,Math.floor((h-2)/2.0)),cols=Math.max(2,Math.floor(d/2));const roadSign=x>0?-1:1;
    // Windows are recessed dark panels, surrounded with slender stone mullions.
    for(let j=0;j<rows;j++)for(let k=0;k<cols;k++){
      const yy=3.05+j*1.95,zz=(k-(cols-1)/2)*(d/cols),lit=random()>.66;
      const win=box(g,lit?'#d9bb7c':pick(['#628185','#77918f','#49666e']),[.035,1.22,d/cols*.67],[roadSign*(w/2+.02),yy,zz]);win.emission=lit?.10:0;
      box(g,'#bcb7a5',[.09,.075,d/cols*.76],[roadSign*(w/2+.055),yy-.64,zz]);
      if(style===1)box(g,color,[.20,1.45,.09],[roadSign*(w/2+.11),yy,zz]);
    }
    for(let j=0;j<Math.min(5,rows);j++)for(let k=0;k<Math.max(1,Math.floor(w/1.8));k++){const xx=(k-(Math.floor(w/1.8)-1)/2)*1.6;box(g,'#6a8486',[1.0,1.2,.035],[xx,3.05+j*1.95,d/2+.02]);}
    const storefront=box(g,C.glass,[.04,1.65,d*.70],[roadSign*(w/2+.025),1.15,0]);
    box(g,C.ink,[.065,.12,d*.76],[roadSign*(w/2+.07),2.10,0]);
    box(g,C.paper,[.07,1.8,.075],[roadSign*(w/2+.08),1.15,0]);
    if(style!==2){const awning=pick(['#aa6751','#809684','#e5c18a','#456b73']);box(g,awning,[1.0,.12,d*.77],[roadSign*(w/2+.42),2.38,0],[0,0,roadSign*.13]);box(g,awning,[.08,.25,d*.77],[roadSign*(w/2+.9),2.22,0]);for(let k=0;k<4;k++)box(g,C.paper,[1.02,.015,.14],[roadSign*(w/2+.42),2.46,(k-1.5)*(d*.77/4)],[0,0,roadSign*.13]);}
    if(h>12){box(g,'#8f9c97',[w*.55,.85,d*.40],[0,h+.35,0]);cyl(g,C.ink,[.045,1.6,.045],[w*.18,h+1.2,0]);}
    if(style===2){box(g,'#a7b8b1',[.12,h-2,.22],[roadSign*(w/2+.08),h/2+1,-d*.37]);box(g,'#a7b8b1',[.12,h-2,.22],[roadSign*(w/2+.08),h/2+1,d*.37]);}
    return g;
  }
  function createCity(scene){
    const root=group();scene.add(root);const tiles=[],length=24,count=12;
    for(let i=0;i<count;i++){
      const tile=group();tile.p[2]=-i*length;root.add(tile);tiles.push(tile);
      box(tile,C.street,[9.1,.24,length],[0,-.15,0]);
      for(const s of[-1,1]){
        box(tile,'#e4d5b6',[2.25,.28,length],[s*5.65,-.005,0]);
        box(tile,C.paper,[.20,.32,length],[s*4.62,.015,0]);
        box(tile,'#30434a',[.12,.04,length],[s*4.46,.005,0]);
        for(let k=0;k<8;k++)box(tile,'#bbc0ae',[2.15,.012,.04],[s*5.65,.144,k*3-10.5]);
        for(let k=0;k<4;k++)box(tile,'#d8c8a3',[.13,.017,2.8],[s*4.22,.002,k*6-9]);
        if(i%2===0){tree(tile,s*5.8,-3,1+random()*.15);lamp(tile,s*5.1,8);}else{tree(tile,s*6.0,6,.92);}
        const c=pick(['#d7c4a4','#bd9c84','#a3b3ac','#ded6c1','#9eafa7','#cfb99d']);
        const d=10+random()*7,w=5+random()*3,h=8+random()*16;
        building(tile,s*(7.0+w/2),-3,w,d,h,c,i%3);
        if(i%3===0){building(tile,s*(12+w),5,5,9,19+random()*8,pick(['#8faaa6','#b6b5a5','#c1b49e']),2);}
        if(i%3===1){const bench=group();bench.p=[s*5.9,0,-8];tile.add(bench);box(bench,'#927859',[.6,.12,1.6],[0,.55,0]);box(bench,'#927859',[.13,.55,1.6],[s*.30,.75,0]);for(const z of[-.55,.55])box(bench,C.dark,[.45,.5,.08],[0,.25,z]);}
        if(i%2===0)for(const z of[-10,0,10]){cyl(tile,C.ink,[.10,.65,.10],[s*4.95,.47,z]);const stripe=cyl(tile,'#e3bd66',[.102,.12,.102],[s*4.95,.66,z]);}
      }
      for(const x of[-1.5,1.5])for(let k=0;k<4;k++)box(tile,'#a8b3a8',[.055,.012,2.5],[x,.002,k*6-9]);
      if(i===4||i===10){const bridge=group();bridge.p=[0,0,-8];tile.add(bridge);box(bridge,'#b3b7a7',[16,.55,2.7],[0,6.85,0]);box(bridge,'#557478',[16,1.9,.16],[0,7.8,.9]);box(bridge,'#ccd0b9',[16,.16,2.8],[0,8.8,0]);for(let x=-7;x<8;x+=2)box(bridge,C.paper,[.10,1.8,.2],[x,7.8,1.02]);box(bridge,'#3f555d',[16,.15,2.8],[0,6.48,0]);}
      if(i%3===2){for(let k=0;k<3;k++)box(tile,'#c7c8b1',[8.3,.013,.40],[0,.007,k*.8-8]);}
    }
    // Set back towers remain in the atmospheric distance; the foreground is fully recycled.
    const skyline=group();root.add(skyline);for(let i=0;i<22;i++){const x=(i<11?-1:1)*(16+random()*45),z=-110-random()*70,h=12+random()*30;box(skyline,pick(['#9dada5','#aab4a8','#bac0ac','#819da0']),[5+random()*7,h,6+random()*8],[x,h/2,z]);}
    function update(move,t){for(const tile of tiles){tile.p[2]+=move;while(tile.p[2]>30)tile.p[2]-=length*count;tile.visible=tile.p[2]>-180;}skyline.p[0]=Math.sin(t*.016)*.25;}
    return{root,update,tiles};
  }
  function coin(){const g=group();const center=cyl(g,C.gold,[.285,.085,.285],[0,0,0],[Math.PI/2,0,0]);center.metal=.82;const outer=ring(g,C.goldEdge,[.283,.283,.283],[0,0,.052]);outer.metal=.65;const inner=ring(g,'#ffe49a',[.21,.21,.21],[0,0,.058]);inner.metal=.7;box(g,'#c0882f',[.045,.27,.018],[-.055,0,.069]);box(g,'#c0882f',[.045,.27,.018],[.055,0,.069]);return g;}
  function barrier(){const g=group();for(const x of[-.85,.85]){box(g,C.ink,[.12,1.10,.16],[x,.55,0]);box(g,C.ink,[.48,.07,.55],[x,.06,0]);}box(g,C.orange,[2.0,.45,.22],[0,.85,0]);for(let x=-.8;x<.9;x+=.5)box(g,C.paper,[.20,.43,.025],[x,.85,.126],[0,0,-.32]);box(g,C.dark,[1.65,.13,.10],[0,.36,0]);return g;}
  function crate(){const g=group();box(g,'#a87b52',[1.65,1.15,1.25],[0,.575,0]);box(g,'#c69c67',[1.5,1.01,.03],[0,.58,.64]);for(const x of[-.68,.68])box(g,'#815b3e',[.12,1.18,1.29],[x,.59,0]);for(const y of[.1,1.05])box(g,'#815b3e',[1.7,.10,1.29],[0,y,0]);box(g,'#dfbd83',[.14,1.45,.04],[0,.59,.68],[0,0,.80]);box(g,C.paper,[.39,.27,.02],[.35,.69,.668]);box(g,C.dark,[.22,.035,.025],[.35,.69,.681]);return g;}
  function arch(){const g=group();for(const x of[-.95,.95]){box(g,C.ink,[.13,2.5,.18],[x,1.25,0]);box(g,C.orange,[.16,.6,.22],[x,.3,0]);box(g,C.dark,[.44,.12,.8],[x,.06,0]);}box(g,C.orange,[2.1,.85,.4],[0,2.0,0]);for(let x=-.8;x<=.81;x+=.4)box(g,C.paper,[.15,.83,.025],[x,2,.215],[0,0,-.22]);box(g,C.dark,[.49,.23,.035],[0,1.99,.245]);const arrow=mesh('wedge',C.paper,[.10,.18,.07],[0,2,.28],[Math.PI/2,0,Math.PI]);g.add(arrow);return g;}
  function van(){const g=group();box(g,'#d9c8a9',[1.95,1.80,3.25],[0,1.27,-.4]);box(g,C.paper,[1.91,.10,3.22],[0,2.22,-.4]);box(g,'#b6b7a7',[1.90,1.08,1.25],[0,.93,1.70]);box(g,C.glass,[1.65,.67,.12],[0,1.69,1.25],[-.18,0,0]);box(g,C.ink,[2,.12,.14],[0,.58,2.35]);for(const x of[-.68,.68]){box(g,'#fff0c0',[.35,.21,.04],[x,.97,2.34]).emission=.30;box(g,C.red,[.18,.3,.04],[x,1.0,-2.04]).emission=.1;for(const z of[-1.45,1.5]){cyl(g,'#28363b',[.38,.15,.38],[x/Math.abs(x)*1.0,.43,z],[0,0,Math.PI/2]);cyl(g,'#8a9693',[.19,.17,.19],[x/Math.abs(x)*1.01,.43,z],[0,0,Math.PI/2]);}}box(g,C.orange,[1.2,.32,.03],[0,1.54,-2.04]);box(g,C.dark,[.60,.15,.03],[0,.67,-2.05]);box(g,C.dark,[.018,1.48,.03],[0,1.40,-2.045]);return g;}
  function drone(){const g=group();ball(g,C.ink,[.58,.24,.36],[0,0,0]);box(g,'#e8dcca',[.65,.18,.45],[0,.15,0]);box(g,C.red,[.43,.085,.06],[0,-.025,.35]).emission=1.2;const rotors=[];for(const x of[-.65,.65])for(const z of[-.38,.38]){box(g,C.ink,[.25,.06,.42],[x*.65,.06,z*.65],[0,x*z,0]);cyl(g,C.dark,[.14,.15,.14],[x,.10,z]);const rotor=group();rotor.p=[x,.20,z];g.add(rotor);box(rotor,'#3d5356',[.72,.024,.08],[0,0,0]);box(rotor,'#3d5356',[.08,.024,.72],[0,0,0]);ring(g,C.ink,[.40,.40,.40],[x,.18,z],[Math.PI/2,0,0]);rotors.push(rotor);}g.user={rotors};return g;}
  function robot(){const g=group();cyl(g,C.dark,[.4,.65,.28],[0,1.1,0]);box(g,'#b4bcae',[.67,.50,.4],[0,1.31,0]);box(g,C.orange,[.30,.09,.03],[0,1.38,.22]);ball(g,C.ink,[.28,.25,.26],[0,1.84,0]);box(g,C.red,[.37,.08,.05],[0,1.85,.24]).emission=.9;const legs=[];for(const sign of[-1,1]){const l=group();l.p=[sign*.20,.85,0];g.add(l);cyl(l,C.dark,[.12,.65,.12],[0,-.32,0]);ball(l,C.ink,[.18,.13,.25],[0,-.68,.1]);legs.push(l);cyl(g,'#9caea6',[.105,.68,.105],[sign*.48,1.05,0],[0,0,sign*.16]);ball(g,C.dark,[.14,.17,.15],[sign*.55,.70,0]);}g.user={legs};return g;}
  function specialPickup(type){const g=group();const color=type==='ai'?'#80e9f0':'#ffb947';const halo=ring(g,color,[.60,.60,.60],[0,0,0]);halo.emission=.6;ring(g,C.paper,[.69,.69,.69],[0,0,-.04]);if(type==='ai'){box(g,'#102d39',[.66,.52,.13],[0,0,0]);for(const x of [-.19,.19])for(const y of [-.14,.14])ball(g,color,[.075,.075,.07],[x,y,.10]);box(g,color,[.29,.06,.07],[0,0,.12]);}else{const pot=cyl(g,'#f1ab36',[.36,.39,.36],[0,-.04,0]);box(g,'#fff1ca',[.76,.12,.65],[0,.20,0]);box(g,'#9c6538',[.24,.14,.20],[0,.30,0]);}return g;}
  function bonus(type){const colors={magnet:C.violet,shield:C.cyan,boost:C.orange,flight:'#b5d879'},color=colors[type];const g=group();const halo=ring(g,color,[.66,.66,.66],[0,0,0]);halo.emission=.3;const halo2=ring(g,C.paper,[.73,.73,.73],[0,0,-.04]);halo2.emission=.1;const symbol=group();g.add(symbol);
    if(type==='magnet'){for(const s of[-1,1]){box(symbol,color,[.16,.47,.16],[s*.23,.04,0]);box(symbol,C.paper,[.16,.15,.17],[s*.23,.25,0]);}box(symbol,color,[.46,.16,.16],[0,-.24,0]);}
    if(type==='shield'){const diamond=box(symbol,color,[.43,.43,.18],[0,0,0],[0,0,Math.PI/4]);box(symbol,C.paper,[.085,.38,.22],[0,.04,0]);box(symbol,C.paper,[.28,.085,.22],[0,.09,0]);}
    if(type==='boost'){box(symbol,color,[.16,.48,.16],[-.08,.16,0],[0,0,-.5]);box(symbol,color,[.16,.48,.16],[.08,-.16,0],[0,0,-.5]);box(symbol,C.paper,[.30,.11,.18],[0,0,0]);}
    if(type==='flight'){cyl(symbol,C.paper,[.11,.64,.11],[0,0,0]);const tip=mesh('cone',color,[.12,.21,.12],[0,.37,0]);symbol.add(tip);for(const s of[-1,1])box(symbol,color,[.28,.15,.12],[s*.20,-.12,0],[0,0,-s*.4]);const f=mesh('cone',C.orange,[.08,.25,.08],[0,-.43,0],[0,0,Math.PI]);f.emission=.5;symbol.add(f);}
    return g;
  }
  function particle(color){const p=mesh('box',color,[.07,.07,.07]);p.emission=.30;return p;}
  return{C,character,createCity,specialPickup,coin,barrier,crate,arch,van,drone,robot,bonus,particle,random};
})();
