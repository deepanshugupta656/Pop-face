// Pop Your Face – Zen + Music + Full Build

const gameArea   = document.getElementById("gameArea");
const scoreEl    = document.getElementById("score");
const bestEl     = document.getElementById("bestScore");
const aliveEl    = document.getElementById("aliveCount");

const startBtn   = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn   = document.getElementById("pauseBtn");
const resumeBtn  = document.getElementById("resumeBtn");
const stopBtn    = document.getElementById("stopBtn");

const imgUpload  = document.getElementById("imgUpload");
const imgUrl     = document.getElementById("imgUrl");
const soundToggle= document.getElementById("soundToggle");
const zenToggle  = document.getElementById("zenToggle");
const musicSelect= document.getElementById("musicSelect");   // ✅ NEW

let faceSrc = "";
let running = false;
let paused  = false;
let zen     = false;

let score = 0;
let best  = Number(localStorage.getItem("pyf_best") || "0");

let spawnTimer = 0;
let faces = new Set();
bestEl.textContent = best;

// ✅ Funny words
const funnyWords = [
  "kutti","ullu","pagal","bewakoof","bhakk",
  "nalle","jhalla","gadha","faltu","bewaqoof"
];

// ✅ POP sound (SFX)
let audioCtx;
function playPop(){
  if(!soundToggle.checked) return;
  if(!audioCtx) audioCtx = new (window.AudioContext||window.webkitAudioContext)();
  const ctx = audioCtx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type="triangle";
  o.frequency.setValueAtTime(420,ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(90,ctx.currentTime+0.1);
  g.gain.setValueAtTime(0.001,ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.32,ctx.currentTime+0.01);
  g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.12);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime+0.14);
}

// ✅ NEW — Music
let music = null;

function playMusic(){
  stopMusic();
  const choice = musicSelect.value;

  if(choice === "none") return;

  let file = "";
  if(choice === "calm") file = "calm.mp3";
  if(choice === "fun")  file = "fun.mp3";

  music = new Audio(file);
  music.loop = true;
  music.volume = 0.6;      // Adjust volume here
  music.play();
}

function stopMusic(){
  if(music){
    music.pause();
    music = null;
  }
}

// ✅ Auto change music when selection changes
musicSelect.addEventListener("change", ()=>{
  if(running) playMusic();
});

// image selection
function setFaceFromFile(file){
  const reader=new FileReader();
  reader.onload=e=> faceSrc=e.target.result;
  reader.readAsDataURL(file);
}
imgUpload.addEventListener("change",e=>{
  const f=e.target.files[0];
  if(f) setFaceFromFile(f);
});
imgUrl.addEventListener("change",e=>{
  if(e.target.value) faceSrc=e.target.value.trim();
});

// Controls
startBtn.addEventListener("click",()=>{
  if(!faceSrc){ alert("Upload/paste image first."); return;}
  startGame();
});
restartBtn.addEventListener("click",()=>{ stopGame(); startGame(); });
pauseBtn.addEventListener("click",()=>{ if(running&&!paused){paused=true; pauseBtn.disabled=true; resumeBtn.disabled=false;}});
resumeBtn.addEventListener("click",()=>{ if(running&&paused){paused=false; resumeBtn.disabled=true; pauseBtn.disabled=false;}});
stopBtn.addEventListener("click",()=> stopGame());

function startGame(){
  running=true; paused=false;
  zen = !!zenToggle.checked;
  document.body.classList.toggle("zen", zen);

  score=0;
  scoreEl.textContent="0";
  faces.forEach(f=>f.el.remove());
  faces.clear();
  aliveEl.textContent="0";

  spawnTimer=0;

  startBtn.disabled=true;
  restartBtn.disabled=false;
  stopBtn.disabled=false;
  pauseBtn.disabled=false;
  resumeBtn.disabled=true;

  // ✅ start music
  playMusic();

  lastTime=performance.now();
  loop(performance.now());
}

function stopGame(){
  running=false; paused=false;
  document.body.classList.toggle("zen", false);

  startBtn.disabled=false;
  restartBtn.disabled=false;
  stopBtn.disabled=true;
  pauseBtn.disabled=true;
  resumeBtn.disabled=true;
  faces.forEach(f=>f.el.remove());
  faces.clear();
  aliveEl.textContent="0";

  // ✅ stop music
  stopMusic();
}

// --- Utility: exact center of an element inside gameArea
function getCenterInGame(el){
  const ar = gameArea.getBoundingClientRect();
  const er = el.getBoundingClientRect();
  const cx = (er.left - ar.left) + er.width / 2;
  const cy = (er.top  - ar.top)  + er.height / 2;
  return { cx, cy };
}

function spawnFace(){
  const el=document.createElement("img");
  el.src=faceSrc;
  el.className="face";
  const size = rand(60,120);
  el.style.width=size+"px";
  el.style.height=size+"px";

  const areaRect=gameArea.getBoundingClientRect();
  const x=rand(0,areaRect.width-size);
  const y=areaRect.height+size;
  el.style.left=x+"px";
  el.style.top=y+"px";

  // Calmer in Zen
  const vyMin = zen ? 20 : 40;
  const vyMax = zen ? 55 : 90;
  const vxAbs = zen ? 15 : 25;

  const face={el,x,y,size,vy:rand(vyMin,vyMax),vx:rand(-vxAbs,vxAbs),alive:true};

  const pop=()=>{
    if(paused) return;
    if(!face.alive) return;
    face.alive=false;

    if(!zen){
      score++;
      scoreEl.textContent=score;
      if(score>best){
        best=score;
        localStorage.setItem("pyf_best",best);
        bestEl.textContent=best;
      }
    }

    const { cx, cy } = getCenterInGame(el);

    spawnParticles(cx,cy, zen ? 10 : 14);
    spawnRing(cx,cy);
    spawnKutti(cx,cy);
    playPop();

    el.classList.add("pop");
    setTimeout(()=>el.remove(),260);
    faces.delete(face);
    aliveEl.textContent=faces.size;
  };

  el.addEventListener("click",pop,{passive:true});
  el.addEventListener("touchstart",pop,{passive:true});
  gameArea.appendChild(el);
  faces.add(face);
  aliveEl.textContent=faces.size;
}

function spawnParticles(cx,cy,count=12){
  for(let i=0;i<count;i++){
    const p=document.createElement("div");
    p.className="particle";
    const ang=Math.random()*Math.PI*2;
    const dist=(zen?40:60)+Math.random()*(zen?60:80);
    const dx=Math.cos(ang)*dist, dy=Math.sin(ang)*dist*0.8;
    p.style.setProperty("--dx",dx.toFixed(1)+"px");
    p.style.setProperty("--dy",dy.toFixed(1)+"px");
    p.style.setProperty("--h",Math.floor(Math.random()*360));
    p.style.left=cx+"px";
    p.style.top=cy+"px";
    gameArea.appendChild(p);
    p.addEventListener("animationend",()=>p.remove(),{once:true});
  }
}

function spawnRing(cx,cy){
  const r=document.createElement("div");
  r.className="ring";
  r.style.left=cx+"px";
  r.style.top=cy+"px";
  gameArea.appendChild(r);
  r.addEventListener("animationend",()=>r.remove(),{once:true});
}

function spawnKutti(cx,cy){
  const word = funnyWords[Math.floor(Math.random()*funnyWords.length)];
  const t=document.createElement("div");
  t.textContent=word;
  t.className="kuttiText";

  // random color
  const hue = Math.floor(Math.random()*360);
  t.style.color = `hsl(${hue} 95% 55%)`;

  t.style.left=cx+"px";
  t.style.top=cy+"px";
  gameArea.appendChild(t);
  setTimeout(()=>t.remove(),900);
}

// Main loop
let lastTime=0;
function loop(t){
  if(!running) return;
  if(paused){ requestAnimationFrame(loop); return; }

  const dt=Math.min(0.034,(t-lastTime)/1000);
  lastTime=t;

  spawnTimer-=dt;
  if(spawnTimer<=0){
    spawnFace();
    spawnTimer = zen ? rand(0.8,1.4) : rand(0.45,0.95);
  }

  const areaRect=gameArea.getBoundingClientRect();
  for(const f of Array.from(faces)){
    f.y-=f.vy*dt;
    f.x+=f.vx*dt;
    if(f.x<0||f.x>areaRect.width-f.size) f.vx*=-1;

    f.el.style.top=f.y+"px";
    f.el.style.left=f.x+"px";

    if(f.y < -f.size-20){
      f.el.remove();
      faces.delete(f);
      aliveEl.textContent=faces.size;
    }
  }
  requestAnimationFrame(loop);
}

function rand(a,b){return Math.random()*(b-a)+a;}
window.addEventListener("resize",()=>{
  const areaRect=gameArea.getBoundingClientRect();
  for(const f of faces){
    if(f.x>areaRect.width-f.size) f.x=Math.max(0,areaRect.width-f.size);
  }
});
