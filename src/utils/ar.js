import { SHELF_TYPES } from "../data/constants";

export function drawLevelBubble(ctx, x, y, gamma) {
  const isLevel = Math.abs(gamma) < 2.5;
  const col = isLevel ? "#52C37A" : "#C9A84C";
  const R = 18;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, R, 0, Math.PI * 2);
  ctx.strokeStyle = col + "88";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "rgba(6,8,13,0.7)";
  ctx.fill();
  const bx = x + Math.max(-R + 5, Math.min(R - 5, gamma * 1.8));
  ctx.beginPath();
  ctx.arc(bx, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.fillStyle = col;
  ctx.font = "bold 7px DM Sans,sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(isLevel ? "NIVEAU" : Math.abs(gamma).toFixed(1) + "°", x, y + R + 10);
  ctx.restore();
}

export function drawARScene(ctx, W, H, anchor, mode, tilt, frame, shelfType) {
  ctx.clearRect(0, 0, W, H);
  const pulse = 0.5 + 0.5 * Math.sin(frame * 0.08);
  const pulse2 = 0.5 + 0.5 * Math.sin(frame * 0.12 + 1.2);
  const G = "#52C37A", OR = "#C9A84C", BL = "#5290E0", RD = "#E05252";

  const roundRect = (x, y, w, h, r) => {
    ctx.beginPath(); ctx.moveTo(x+r,y);
    ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  };
  const badge = (txt, x, y, col) => {
    const tw = ctx.measureText(txt).width + 16;
    roundRect(x, y, tw, 22, 6);
    ctx.fillStyle = "rgba(6,8,13,0.82)"; ctx.fill();
    ctx.strokeStyle = col+"55"; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = col; ctx.font = "bold 9px DM Sans,sans-serif"; ctx.textAlign = "left";
    ctx.fillText(txt, x+8, y+15);
  };
  const dimLine = (x1,y1,x2,y2,label,col) => {
    ctx.strokeStyle = col+"99"; ctx.lineWidth = 1; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); ctx.setLineDash([]);
    const mx=(x1+x2)/2, my=(y1+y2)/2;
    const tw = ctx.measureText(label).width+10;
    roundRect(mx-tw/2,my-11,tw,18,4); ctx.fillStyle="rgba(6,8,13,0.78)"; ctx.fill();
    ctx.fillStyle=col; ctx.font="bold 9px DM Sans"; ctx.textAlign="center";
    ctx.fillText(label,mx,my+3);
  };
  const fixDrill = (bx, by, col, puls) => {
    ctx.beginPath(); ctx.arc(bx, by, 9+3*puls, 0, Math.PI*2);
    ctx.strokeStyle = "rgba(224,82,82,"+(0.35+0.45*puls)+")"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI*2);
    ctx.fillStyle = RD; ctx.fill();
    ctx.beginPath(); ctx.arc(bx, by, 1.5, 0, Math.PI*2);
    ctx.fillStyle = "#fff"; ctx.fill();
  };

  if (!anchor) {
    ctx.save();
    const scanW = W*0.68, scanH = H*0.42;
    const scanX = (W-scanW)/2, scanY = (H-scanH)/2;
    const cLen = 22;
    ctx.strokeStyle = OR; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.7+0.3*pulse;
    [[scanX,scanY],[scanX+scanW,scanY],[scanX,scanY+scanH],[scanX+scanW,scanY+scanH]].forEach(([cx,cy],i) => {
      ctx.beginPath();
      ctx.moveTo(cx+(i%2===0?cLen:-cLen),cy); ctx.lineTo(cx,cy); ctx.lineTo(cx,cy+(i<2?cLen:-cLen)); ctx.stroke();
    });
    ctx.strokeStyle = OR+"66"; ctx.lineWidth = 1; ctx.setLineDash([6,4]);
    ctx.beginPath(); ctx.moveTo(scanX,H/2); ctx.lineTo(scanX+scanW,H/2); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = OR; ctx.lineWidth = 1.5; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.moveTo(W/2-14,H/2); ctx.lineTo(W/2+14,H/2);
    ctx.moveTo(W/2,H/2-14); ctx.lineTo(W/2,H/2+14); ctx.stroke();
    ctx.beginPath(); ctx.arc(W/2,H/2,4,0,Math.PI*2); ctx.fillStyle=OR; ctx.fill();
    roundRect(W/2-72,H/2+28,144,26,8); ctx.fillStyle="rgba(6,8,13,0.82)"; ctx.fill();
    ctx.fillStyle=OR; ctx.font="bold 11px DM Sans,sans-serif"; ctx.textAlign="center";
    ctx.fillText("\uD83D\uDC46 Appuyez pour placer", W/2, H/2+46);
    ctx.restore();
    return;
  }

  const ax = anchor.x, ay = anchor.y;
  const gamma = tilt.gamma || 0;
  const perspX = gamma * 0.35;
  const perspY = Math.abs(tilt.beta || 0) * (-0.15) + 4;

  if (mode === "etagere") {
    const st = SHELF_TYPES[shelfType] || SHELF_TYPES.flottante;
    const sw = W * st.wRatio, sh_px = st.sh * 1.4, sd = st.sd * 1.2;
    const sx = ax - sw/2, ex = ax + sw/2;
    const dpx = sd + perspX, dpy = sd * 0.38 + perspY;
    ctx.save();
    const shadowGrad = ctx.createLinearGradient(sx,ay,sx,ay+30);
    shadowGrad.addColorStop(0,"rgba(0,0,0,0.35)"); shadowGrad.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=shadowGrad;
    ctx.beginPath(); ctx.ellipse(ax,ay+4,sw*0.45,14,0,0,Math.PI); ctx.fill();
    ctx.restore();
    const isLevel = Math.abs(gamma) < 2.5;
    ctx.strokeStyle = isLevel ? G+"cc" : OR+"88"; ctx.lineWidth = isLevel ? 1.5 : 1;
    ctx.setLineDash([8,5]);
    ctx.beginPath(); ctx.moveTo(Math.max(0,sx-30),ay); ctx.lineTo(Math.min(W,ex+30),ay); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(sx,ay); ctx.lineTo(ex,ay); ctx.lineTo(ex+dpx,ay-dpy); ctx.lineTo(sx+dpx,ay-dpy); ctx.closePath();
    const botGrad = ctx.createLinearGradient(sx,ay,sx+dpx,ay-dpy);
    botGrad.addColorStop(0,"rgba(100,70,20,0.2)"); botGrad.addColorStop(1,"rgba(60,40,10,0.1)");
    ctx.fillStyle=botGrad; ctx.fill(); ctx.strokeStyle=OR+"66"; ctx.lineWidth=0.8; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx,ay-sh_px); ctx.lineTo(ex,ay-sh_px); ctx.lineTo(ex,ay); ctx.lineTo(sx,ay); ctx.closePath();
    const frontGrad = ctx.createLinearGradient(sx,ay-sh_px,ex,ay);
    if (shelfType==="industrielle") {
      frontGrad.addColorStop(0,"rgba(140,145,155,0.75)"); frontGrad.addColorStop(1,"rgba(110,115,125,0.75)");
    } else if (shelfType==="cube") {
      frontGrad.addColorStop(0,"rgba(245,245,245,0.18)"); frontGrad.addColorStop(1,"rgba(200,200,200,0.12)");
    } else {
      frontGrad.addColorStop(0,"rgba(190,145,62,0.78)"); frontGrad.addColorStop(0.4,"rgba(210,168,80,0.72)"); frontGrad.addColorStop(1,"rgba(160,118,42,0.78)");
    }
    ctx.fillStyle=frontGrad; ctx.fill(); ctx.strokeStyle=OR; ctx.lineWidth=1.5; ctx.stroke();
    if (shelfType!=="industrielle" && shelfType!=="cube") {
      ctx.save(); ctx.beginPath(); ctx.moveTo(sx,ay-sh_px); ctx.lineTo(ex,ay-sh_px); ctx.lineTo(ex,ay); ctx.lineTo(sx,ay); ctx.closePath(); ctx.clip();
      ctx.strokeStyle="rgba(120,80,20,0.12)"; ctx.lineWidth=1;
      for (let i=1;i<6;i++) {
        const gy=ay-sh_px+(sh_px/6)*i+Math.sin(i*1.3)*1.5;
        ctx.beginPath(); ctx.moveTo(sx,gy); ctx.bezierCurveTo(sx+sw*0.3,gy+2,sx+sw*0.7,gy-2,ex,gy); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.beginPath(); ctx.moveTo(sx,ay-sh_px); ctx.lineTo(ex,ay-sh_px); ctx.lineTo(ex+dpx,ay-sh_px-dpy); ctx.lineTo(sx+dpx,ay-sh_px-dpy); ctx.closePath();
    const topGrad = ctx.createLinearGradient(sx,ay-sh_px,ex+dpx,ay-sh_px-dpy);
    if (shelfType==="industrielle") {
      topGrad.addColorStop(0,"rgba(170,175,185,0.88)"); topGrad.addColorStop(1,"rgba(130,135,145,0.7)");
    } else if (shelfType==="cube") {
      topGrad.addColorStop(0,"rgba(250,250,250,0.22)"); topGrad.addColorStop(1,"rgba(220,220,220,0.14)");
    } else {
      topGrad.addColorStop(0,"rgba(230,190,100,0.88)"); topGrad.addColorStop(0.5,"rgba(215,175,85,0.75)"); topGrad.addColorStop(1,"rgba(195,155,65,0.65)");
    }
    ctx.fillStyle=topGrad; ctx.fill(); ctx.strokeStyle=OR+"cc"; ctx.lineWidth=1.2; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.moveTo(sx,ay-sh_px); ctx.lineTo(ex,ay-sh_px); ctx.lineTo(ex+dpx,ay-sh_px-dpy); ctx.lineTo(sx+dpx,ay-sh_px-dpy); ctx.closePath(); ctx.clip();
    const refGrad=ctx.createLinearGradient(sx,ay-sh_px,sx,ay-sh_px+dpy*0.3);
    refGrad.addColorStop(0,"rgba(255,255,255,0.22)"); refGrad.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle=refGrad; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(ex,ay-sh_px); ctx.lineTo(ex+dpx,ay-sh_px-dpy); ctx.lineTo(ex+dpx,ay-dpy); ctx.lineTo(ex,ay); ctx.closePath();
    const sideGrad=ctx.createLinearGradient(ex,ay,ex+dpx,ay-dpy);
    if (shelfType==="industrielle") { sideGrad.addColorStop(0,"rgba(100,105,115,0.7)"); sideGrad.addColorStop(1,"rgba(80,85,95,0.55)"); }
    else { sideGrad.addColorStop(0,"rgba(150,110,38,0.7)"); sideGrad.addColorStop(1,"rgba(120,85,28,0.5)"); }
    ctx.fillStyle=sideGrad; ctx.fill(); ctx.strokeStyle=OR+"88"; ctx.lineWidth=1; ctx.stroke();
    if (st.brackets==="pins") {
      [sx+sw*0.18,ax,ex-sw*0.18].forEach(bx => {
        ctx.strokeStyle=BL+"cc"; ctx.lineWidth=3;
        ctx.beginPath(); ctx.moveTo(bx,ay); ctx.lineTo(bx,ay+16); ctx.stroke();
        fixDrill(bx,ay+22,BL,pulse);
      });
    } else if (st.brackets==="metal") {
      [sx+sw*0.15,ex-sw*0.15].forEach(bx => {
        ctx.strokeStyle="#8A9AB0"; ctx.lineWidth=5;
        ctx.beginPath(); ctx.moveTo(bx,ay); ctx.lineTo(bx,ay+48); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(bx,ay); ctx.lineTo(bx+22,ay); ctx.stroke();
        fixDrill(bx,ay+32,BL,pulse); fixDrill(bx+14,ay+6,BL,pulse2);
        badge("M8 \u2014 Cheville \u221210",bx+26,ay+24,BL);
      });
    } else if (st.brackets==="corner") {
      ctx.strokeStyle="#9AB0C0"; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(sx,ay); ctx.lineTo(sx,ay+52); ctx.moveTo(sx,ay); ctx.lineTo(sx+28,ay); ctx.stroke();
      fixDrill(sx+10,ay+34,BL,pulse); fixDrill(sx+20,ay+8,BL,pulse2);
    } else if (st.brackets==="hairpin") {
      [sx+sw*0.18,ex-sw*0.18].forEach(bx => {
        ctx.strokeStyle=OR+"dd"; ctx.lineWidth=2;
        ctx.beginPath(); ctx.moveTo(bx-7,ay); ctx.lineTo(bx-7,ay+58); ctx.moveTo(bx+7,ay); ctx.lineTo(bx+7,ay+58);
        ctx.moveTo(bx-7,ay+58); ctx.lineTo(bx+11,ay+58); ctx.moveTo(bx+7,ay+58); ctx.lineTo(bx-11,ay+58); ctx.stroke();
        fixDrill(bx-7,ay+8,OR,pulse); fixDrill(bx+7,ay+8,OR,pulse2);
      });
    } else {
      [sx+sw*0.22,ex-sw*0.22].forEach(bx => {
        ctx.strokeStyle=BL+"88"; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
        ctx.beginPath(); ctx.moveTo(bx,ay); ctx.lineTo(bx,ay+22); ctx.stroke(); ctx.setLineDash([]);
        fixDrill(bx,ay+28,BL,pulse);
      });
    }
    dimLine(sx,ay+55,ex,ay+55,(sw/W*2.5).toFixed(2)+"m",OR);
    badge("DTU 25.41 \u00B7 "+st.label+" \u00B7 "+st.prix,10,10,OR);
    drawLevelBubble(ctx,W-50,46,gamma);

  } else if (mode==="cloison") {
    const cw=W*0.76, ch=H*0.7;
    const cx=ax-cw/2, cy2=ay-ch*0.6;
    const nbMontants=5, entraxe=cw/nbMontants;
    const shadowL=ctx.createLinearGradient(cx-20,0,cx+10,0);
    shadowL.addColorStop(0,"rgba(0,0,0,0)"); shadowL.addColorStop(1,"rgba(0,0,0,0.18)");
    ctx.fillStyle=shadowL; ctx.fillRect(cx-20,cy2,30,ch);
    const shadowR=ctx.createLinearGradient(cx+cw-10,0,cx+cw+20,0);
    shadowR.addColorStop(0,"rgba(0,0,0,0.18)"); shadowR.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle=shadowR; ctx.fillRect(cx+cw-10,cy2,30,ch);
    const railGrad=ctx.createLinearGradient(0,cy2-8,0,cy2);
    railGrad.addColorStop(0,"rgba(82,144,224,0.55)"); railGrad.addColorStop(1,"rgba(82,144,224,0.25)");
    ctx.fillStyle=railGrad; ctx.fillRect(cx,cy2-8,cw,8); ctx.fillRect(cx,cy2+ch,cw,8);
    ctx.strokeStyle=BL+"88"; ctx.lineWidth=1.2; ctx.strokeRect(cx,cy2-8,cw,8); ctx.strokeRect(cx,cy2+ch,cw,8);
    ctx.strokeStyle=BL+"66"; ctx.lineWidth=2;
    for (let i=0;i<=nbMontants;i++) { const mx=cx+i*entraxe; ctx.beginPath(); ctx.moveTo(mx,cy2); ctx.lineTo(mx,cy2+ch); ctx.stroke(); }
    ctx.strokeStyle=BL+"44"; ctx.lineWidth=1.5; ctx.setLineDash([8,5]);
    ctx.beginPath(); ctx.moveTo(cx,cy2+ch/2); ctx.lineTo(cx+cw,cy2+ch/2); ctx.stroke(); ctx.setLineDash([]);
    const plaqGrad=ctx.createLinearGradient(cx,cy2,cx+cw,cy2+ch);
    plaqGrad.addColorStop(0,"rgba(240,238,232,0.09)"); plaqGrad.addColorStop(1,"rgba(220,215,205,0.06)");
    ctx.fillStyle=plaqGrad; ctx.fillRect(cx,cy2,cw,ch/2); ctx.fillRect(cx,cy2+ch/2,cw,ch/2);
    ctx.strokeStyle=OR+"cc"; ctx.lineWidth=1.8;
    ctx.strokeRect(cx,cy2,cw,ch/2); ctx.strokeRect(cx,cy2+ch/2,cw,ch/2);
    const visY=[cy2+ch*0.08,cy2+ch*0.22,cy2+ch*0.38,cy2+ch*0.62,cy2+ch*0.78,cy2+ch*0.92];
    for (let i=1;i<nbMontants;i++) { const mx=cx+i*entraxe; visY.forEach(vy => { ctx.beginPath(); ctx.arc(mx,vy,2.5,0,Math.PI*2); ctx.fillStyle=BL+"bb"; ctx.fill(); ctx.beginPath(); ctx.arc(mx,vy,1,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); }); }
    dimLine(cx,cy2-22,cx+cw,cy2-22,(cw/W*2.5).toFixed(1)+"m",BL);
    dimLine(cx-24,cy2,cx-24,cy2+ch,(ch/H*2.4).toFixed(1)+"m",BL);
    badge("DTU 25.41 \u00B7 Entraxe "+Math.round(entraxe/W*250)/100+"m \u00B7 Montant 48/36",10,10,OR);
    drawLevelBubble(ctx,W-50,46,gamma);

  } else if (mode==="carrelage") {
    const tileW=Math.round(W*0.12), tileH=tileW;
    const startX=ax%tileW-tileW, startY=ay%tileH-tileH;
    const cols2=Math.ceil(W/tileW)+2, rows2=Math.ceil(H/tileH)+2;
    ctx.fillStyle="rgba(201,168,76,0.04)"; ctx.fillRect(0,0,W,H);
    for (let r=0;r<rows2;r++) for (let c=0;c<cols2;c++) {
      const tx=startX+c*tileW, ty=startY+r*tileH;
      const lit=(r+c)%2===0;
      const tGrad=ctx.createLinearGradient(tx,ty,tx+tileW,ty+tileH);
      tGrad.addColorStop(0,lit?"rgba(210,175,88,0.13)":"rgba(190,155,68,0.09)");
      tGrad.addColorStop(1,lit?"rgba(185,148,58,0.09)":"rgba(175,138,50,0.07)");
      ctx.fillStyle=tGrad; ctx.fillRect(tx+1.5,ty+1.5,tileW-3,tileH-3);
      ctx.strokeStyle="rgba(201,168,76,0.25)"; ctx.lineWidth=1.5; ctx.strokeRect(tx+1.5,ty+1.5,tileW-3,tileH-3);
    }
    const dpulse=6+4*pulse;
    ctx.beginPath(); ctx.arc(ax,ay,dpulse+4,0,Math.PI*2); ctx.fillStyle="rgba(224,82,82,0.18)"; ctx.fill();
    ctx.beginPath(); ctx.arc(ax,ay,dpulse,0,Math.PI*2); ctx.fillStyle=RD; ctx.fill();
    ctx.beginPath(); ctx.arc(ax,ay,3,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
    badge("DTU 52.1 \u00B7 Joint 2-3mm \u00B7 D\u00E9part centre \u00B7 Colle C2TE",10,10,OR);

  } else if (mode==="prise") {
    const r=38;
    roundRect(ax-r,ay-r,r*2,r*2,5);
    const boxGrad=ctx.createLinearGradient(ax-r,ay-r,ax+r,ay+r);
    boxGrad.addColorStop(0,"rgba(82,144,224,0.22)"); boxGrad.addColorStop(1,"rgba(60,100,180,0.14)");
    ctx.fillStyle=boxGrad; ctx.fill(); ctx.strokeStyle=BL; ctx.lineWidth=2; ctx.stroke();
    roundRect(ax-r+8,ay-r+8,r*2-16,r*2-16,4);
    ctx.fillStyle="rgba(240,238,232,0.07)"; ctx.fill(); ctx.strokeStyle=BL+"88"; ctx.lineWidth=1; ctx.stroke();
    [[ax-10,ay-5],[ax+10,ay-5]].forEach(([px,py]) => { roundRect(px-3.5,py-6,7,12,2); ctx.fillStyle="#aaa"; ctx.fill(); });
    ctx.beginPath(); ctx.arc(ax,ay+10,4,0,Math.PI*2); ctx.fillStyle="#aaa"; ctx.fill();
    ctx.strokeStyle=RD+"44"; ctx.lineWidth=1; ctx.setLineDash([4,4]);
    ctx.strokeRect(ax-r-18,ay-r-18,(r+18)*2,(r+18)*2); ctx.setLineDash([]);
    ctx.strokeStyle=RD+"88"; ctx.lineWidth=2.5;
    ctx.beginPath(); ctx.moveTo(ax,ay+r); ctx.bezierCurveTo(ax,ay+r+20,ax-8,ay+r+50,ax,H); ctx.stroke();
    [ax-r+10,ax+r-10].forEach(bx => fixDrill(bx,ay,BL,pulse));
    badge("NFC 15-100 \u00B7 H\u22655cm sol \u00B7 Bo\u00EEte \u221267 \u00B7 Section 2.5mm\u00B2",10,10,BL);

  } else if (mode==="tableau") {
    const tW=W*0.58, tH=H*0.3;
    const tx=ax-tW/2, ty=ay-tH/2;
    ctx.save(); ctx.shadowColor="rgba(0,0,0,0.5)"; ctx.shadowBlur=18; ctx.shadowOffsetX=4; ctx.shadowOffsetY=6;
    roundRect(tx,ty,tW,tH,4); ctx.fillStyle="rgba(30,25,15,0.5)"; ctx.fill(); ctx.restore();
    roundRect(tx,ty,tW,tH,4);
    const fGrad=ctx.createLinearGradient(tx,ty,tx+tW,ty+tH);
    fGrad.addColorStop(0,"rgba(201,168,76,0.18)"); fGrad.addColorStop(1,"rgba(150,120,50,0.1)");
    ctx.fillStyle=fGrad; ctx.fill(); ctx.strokeStyle=G; ctx.lineWidth=2.2; ctx.stroke();
    roundRect(tx+8,ty+8,tW-16,tH-16,2); ctx.strokeStyle=G+"55"; ctx.lineWidth=1; ctx.stroke();
    roundRect(tx+14,ty+14,tW-28,tH-28,2); ctx.fillStyle="rgba(240,238,232,0.04)"; ctx.fill();
    ctx.strokeStyle=OR+"66"; ctx.lineWidth=1; ctx.setLineDash([5,5]);
    ctx.beginPath(); ctx.moveTo(tx-20,ay); ctx.lineTo(tx+tW+20,ay); ctx.stroke(); ctx.setLineDash([]);
    [[tx+18,ty+18],[tx+tW-18,ty+18],[tx+18,ty+tH-18],[tx+tW-18,ty+tH-18]].forEach(([px,py]) => fixDrill(px,py,G,pulse));
    dimLine(tx,ty-18,tx+tW,ty-18,(tW/W*2.5).toFixed(1)+"m",G);
    badge("4 fixations \u221266mm \u00B7 Niveau laser \u00B7 Accroches renforc\u00E9es",10,10,G);

  } else if (mode==="porte") {
    const pW=W*0.45, pH=Math.min(H*0.78,pW*2.46);
    const px=ax-pW/2, py=ay-pH;
    ctx.fillStyle="rgba(160,130,70,0.25)"; ctx.fillRect(px-8,py-6,pW+16,pH+6);
    ctx.strokeStyle=OR+"cc"; ctx.lineWidth=3; ctx.strokeRect(px-8,py-6,pW+16,pH+6);
    const dGrad=ctx.createLinearGradient(px,py,px+pW,py+pH);
    dGrad.addColorStop(0,"rgba(190,155,70,0.42)"); dGrad.addColorStop(0.5,"rgba(210,175,85,0.35)"); dGrad.addColorStop(1,"rgba(165,130,55,0.42)");
    ctx.fillStyle=dGrad; ctx.fillRect(px,py,pW,pH); ctx.strokeStyle=OR; ctx.lineWidth=1.5; ctx.strokeRect(px,py,pW,pH);
    const panH=pH*0.22;
    [[px+8,py+8],[px+8,py+pH*0.32],[px+8,py+pH*0.58],[px+8,py+pH*0.78]].forEach(([ppx,ppy],i) => {
      const panW2=pW-16, panH2=i<2?panH:panH*0.9;
      roundRect(ppx,ppy,panW2,panH2,2); ctx.strokeStyle=OR+"66"; ctx.lineWidth=1; ctx.stroke(); ctx.fillStyle="rgba(240,200,100,0.05)"; ctx.fill();
    });
    const hx=ax+pW*0.36, hy=ay-pH*0.44;
    ctx.fillStyle=OR+"cc"; roundRect(hx-4,hy-14,8,28,3); ctx.fill();
    ctx.beginPath(); ctx.arc(hx+14,hy,8,0,Math.PI*2); ctx.fillStyle="rgba(201,168,76,0.7)"; ctx.fill();
    ctx.strokeStyle=OR; ctx.lineWidth=1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(hx+14,hy,3,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill();
    [py+pH*0.15,py+pH*0.5,py+pH*0.82].forEach(gy => {
      ctx.fillStyle=BL+"cc"; roundRect(px-8,gy-5,12,10,2); ctx.fill();
      fixDrill(px-3,gy,BL,pulse);
    });
    dimLine(px-24,py,px-24,ay,(pH/H*2.4).toFixed(2)+"m",OR);
    dimLine(px,ay+18,px+pW,ay+18,(pW/W*2.5).toFixed(2)+"m",OR);
    badge("Porte 83\u00D7204cm \u00B7 DTU 36.2 \u00B7 Feuillure 15mm \u00B7 Tap\u00E9e \u03BC\u226538dB",10,10,OR);

  } else if (mode==="fenetre") {
    const fW=W*0.46, fH=fW*1.33;
    const fx=ax-fW/2, fy=ay-fH/2;
    ctx.fillStyle="rgba(240,238,232,0.12)"; roundRect(fx,fy,fW,fH,4); ctx.fill();
    ctx.strokeStyle=BL+"cc"; ctx.lineWidth=4; ctx.stroke();
    const glGrad=ctx.createLinearGradient(fx,fy,fx+fW,fy+fH);
    glGrad.addColorStop(0,"rgba(82,144,224,0.14)"); glGrad.addColorStop(0.4,"rgba(120,180,255,0.08)"); glGrad.addColorStop(1,"rgba(50,100,200,0.06)");
    ctx.fillStyle=glGrad; roundRect(fx+5,fy+5,fW-10,fH-10,2); ctx.fill();
    ctx.save(); roundRect(fx+5,fy+5,fW-10,fH-10,2); ctx.clip();
    ctx.fillStyle="rgba(255,255,255,0.08)";
    ctx.beginPath(); ctx.moveTo(fx+5,fy+5); ctx.lineTo(fx+fW*0.45,fy+5); ctx.lineTo(fx+fW*0.2,fy+fH*0.4); ctx.lineTo(fx+5,fy+fH*0.4); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.strokeStyle=BL+"aa"; ctx.lineWidth=3.5;
    ctx.beginPath(); ctx.moveTo(ax,fy+5); ctx.lineTo(ax,fy+fH-5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx+5,ay); ctx.lineTo(fx+fW-5,ay); ctx.stroke();
    ctx.fillStyle=BL+"dd"; ctx.beginPath(); ctx.ellipse(ax+2,ay,5,12,0,0,Math.PI*2); ctx.fill();
    [[fx+8,fy+8],[fx+fW-8,fy+8],[fx+8,fy+fH-8],[fx+fW-8,fy+fH-8]].forEach(([ppx,ppy]) => fixDrill(ppx,ppy,BL,pulse));
    dimLine(fx,fy-18,fx+fW,fy-18,(fW/W*2.5).toFixed(2)+"m",BL);
    dimLine(fx-22,fy,fx-22,fy+fH,(fH/H*2.4).toFixed(2)+"m",BL);
    badge("Fen\u00EAtre 90\u00D7120cm \u00B7 DTU 36.5 \u00B7 Uw\u22641.3 \u00B7 RE2020 \u00B7 Double vitrage",10,10,BL);

  } else if (mode==="radiateur") {
    const rW=W*0.52, rH=rW*0.6;
    const rx=ax-rW/2, ry=ay-rH/2;
    const bodyGrad=ctx.createLinearGradient(rx,ry,rx+rW,ry+rH);
    bodyGrad.addColorStop(0,"rgba(220,225,235,0.22)"); bodyGrad.addColorStop(0.5,"rgba(240,242,248,0.16)"); bodyGrad.addColorStop(1,"rgba(180,185,195,0.18)");
    roundRect(rx,ry,rW,rH,8); ctx.fillStyle=bodyGrad; ctx.fill();
    ctx.strokeStyle="rgba(200,205,215,0.7)"; ctx.lineWidth=2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(rx,ry); ctx.lineTo(rx+rW,ry); ctx.lineTo(rx+rW+perspX*0.5,ry-perspY*0.3); ctx.lineTo(rx+perspX*0.5,ry-perspY*0.3); ctx.closePath();
    ctx.fillStyle="rgba(240,242,248,0.3)"; ctx.fill(); ctx.strokeStyle="rgba(200,205,215,0.5)"; ctx.lineWidth=1; ctx.stroke();
    const nFins=Math.floor(rW/18);
    for (let i=0;i<nFins;i++) {
      const finX=rx+6+i*(rW-12)/nFins;
      ctx.strokeStyle=i%3===0?"rgba(200,205,215,0.6)":"rgba(200,205,215,0.3)"; ctx.lineWidth=i%3===0?2:1.2;
      ctx.beginPath(); ctx.moveTo(finX,ry+4); ctx.lineTo(finX,ry+rH-4); ctx.stroke();
    }
    [[rx+12,ry+rH],[rx+rW-12,ry+rH]].forEach(([vx,vy]) => {
      ctx.fillStyle="rgba(82,144,224,0.7)"; roundRect(vx-5,vy,10,12,3); ctx.fill();
      ctx.beginPath(); ctx.arc(vx,vy,5,0,Math.PI*2); ctx.fill();
    });
    for (let i=1;i<=3;i++) {
      ctx.strokeStyle="rgba(232,135,58,"+(0.15-i*0.04+0.06*pulse)+")"; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.ellipse(ax,ry-12*i,rW*0.3+i*8,8+i*4,0,Math.PI,Math.PI*2); ctx.stroke();
    }
    [rx+20,rx+rW-20].forEach(bx => fixDrill(bx,ry-10,OR,pulse));
    dimLine(rx,ay+rH/2+22,rx+rW,ay+rH/2+22,(rW/W*2.5).toFixed(2)+"m",OR);
    badge("Radiateur \u00B7 DTU 65.12 \u00B7 H\u226510cm sol \u00B7 Robinets thermostatiques",10,10,OR);

  } else if (mode==="luminaire") {
    const lR=W*0.18;
    ctx.strokeStyle="rgba(240,238,232,0.3)"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(ax,0); ctx.lineTo(ax,ay-lR); ctx.stroke();
    roundRect(ax-18,0,36,16,4); ctx.fillStyle="rgba(200,200,200,0.15)"; ctx.fill();
    ctx.strokeStyle="rgba(200,200,200,0.5)"; ctx.lineWidth=1; ctx.stroke();
    const lGrad=ctx.createRadialGradient(ax,ay,lR*0.2,ax,ay,lR*2.5);
    lGrad.addColorStop(0,"rgba(240,220,120,"+(0.15+0.05*pulse)+")"); lGrad.addColorStop(0.5,"rgba(240,220,120,0.04)"); lGrad.addColorStop(1,"rgba(0,0,0,0)");
    ctx.beginPath(); ctx.ellipse(ax,ay+20,lR*2.5,lR*1.2,0,0,Math.PI*2); ctx.fillStyle=lGrad; ctx.fill();
    ctx.beginPath(); ctx.ellipse(ax,ay,lR,lR*0.35,0,0,Math.PI*2);
    const lBodyGrad=ctx.createRadialGradient(ax,ay,0,ax,ay,lR);
    lBodyGrad.addColorStop(0,"rgba(255,240,160,"+(0.5+0.1*pulse)+")"); lBodyGrad.addColorStop(0.6,"rgba(240,220,120,0.4)"); lBodyGrad.addColorStop(1,"rgba(180,160,60,0.3)");
    ctx.fillStyle=lBodyGrad; ctx.fill(); ctx.strokeStyle="rgba(240,200,80,"+(0.6+0.4*pulse)+")"; ctx.lineWidth=1.5; ctx.stroke();
    [1.4,1.8,2.3].forEach((r,i) => {
      ctx.beginPath(); ctx.ellipse(ax,ay,lR*r,lR*r*0.35,0,0,Math.PI*2);
      ctx.strokeStyle="rgba(240,220,120,"+(0.12-i*0.04+0.04*pulse)+")"; ctx.lineWidth=1; ctx.stroke();
    });
    ctx.beginPath(); ctx.arc(ax,ay,8+2*pulse,0,Math.PI*2);
    ctx.fillStyle="rgba(255,248,200,"+(0.7+0.3*pulse)+")"; ctx.fill();
    for (let i=0;i<3;i++) {
      const ang=(i/3)*Math.PI*2;
      fixDrill(ax+Math.cos(ang)*lR*0.85, ay+Math.sin(ang)*lR*0.85*0.35, OR, pulse);
    }
    badge("Luminaire \u00B7 NFC 15-100 \u00B7 Bo\u00EEte DCL \u00B7 Section 1.5mm\u00B2 \u00B7 Circuit \u00E9clairage",10,10,OR);
  }
}
