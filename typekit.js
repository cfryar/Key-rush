// Shared kit for the word-shooting games: words, sound, mobile-friendly input, lock-on targeting.
(function(){
const store=(k,v)=>{try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}};

const RAW=`
ace arc ash axe bat bay bee bog bow box bud bug cab cap cob cog cub cup cut dew dig dot dug ear eel elm fan fig fin fix fog fox fur gap gem gum gut hat hex hip hog hub hut ice ink ivy jab jam jar jet jog jug keg key kit lab lap log mad map mix mob mop mud nap net nod nut oak oar odd ore owl pad pan paw pet pie pit pod pot pup ram rat ray rib rim rod rot rub rug sap saw sly sod spy sun tab tag tan tar tin tip toe top tub tug urn van vat vet wax web wig yak yam zap zip
able acid aged also atom aunt avid away bake bald band bark barn bead beam bean bell belt bend bird bite blob blow blue boat bold bolt bomb bone book boom boot boss bowl buzz cake calm camp card cart cave chip city clam claw clay clip club coal coat code coin cold comb cone cool cord core corn crab crew crow cube cure dart dash dawn deck deer desk dial dice dish dive dock dome door dove drum duck dune dust echo edge envy epic exit face fang farm fast fear fern fire fish flag flap flat fled flip foam fold fork fort frog fuel fuse gale game gate gear gift glow glue goal gold golf gown grab grim grip gulp hail half halo hand harp hawk haze heat helm herb hero hide hill hint hive hook hoop horn howl huge hunt iron isle jade jail jazz jolt jump jury keen kelp kick king kite knot lace lake lamp lane lava leaf leap lens lime line link lion loaf lock loom loop lord luck lure mace mask maze meal mild milk mint mist moat mole moon moss moth mule myth nail neon nest news node nova oath omen orbit oven pace pact palm park path peak pear pest pine pipe plan plow plum poem pole pond pony pool port puck pulp pump quiz raft rage rail rain ramp rank reef rice ride ring riot road roar robe rock roof room root rope rose ruby rune rush rust sage sail salt sand scar seal seed ship shoe silk sink siren skip slab sled slot smog snap snow soap sock soil song soul soup spin spur star stem stew surf swan tank tape task team tent tide tile tomb tool tower town trap tree trim tube tuna tusk vase vest vine void volt wade wake wand wasp wave weld wing wire wolf wood worm wren yard yarn yell yoke zone zoom
acorn agent alarm alien amber angel ankle apple arena armor arrow asset atlas badge baker beach beast berry blade blast blaze blend blimp block bloom board bonus boost brain brave bread brick bride brook broom brush cabin camel candy canoe cargo cheer chess chief chill choir cider cliff climb clock cloud clown coach cobra comet coral couch crane crash crate crown crumb crush curve daisy dance delta demon depth diary disco dodge donut draft drain dream drift drill drone eagle earth elbow ember enemy entry equal error event fable fairy feast fence fever field flame flash fleet float flock flood floor flute focus forge frost fruit ghost giant glare glass globe glove grain grape graph grass gravy guard guess guide habit happy haunt heart heavy honey horse hotel house human hyena igloo image index ivory jelly jewel joker juice kayak knife koala label laser latch lemon level light lilac limbo llama lodge lunar lunch magic mango maple march medal melon metal meter mines minor model money motor mount mouse mango music night ninja noble north novel ocean olive opera orbit otter owner paint panda panel paper party pasta peace pearl pedal penny piano pilot pinch pixel pizza plane plant plaza point polar power prism prize proof pulse punch queen quest quick quiet radar radio raven razor relay rider rifle river robot rocket rodeo royal rumor saint salad scale scarf scene scout shade shark sheep shelf shell shock shore siren skate skull slate sleep slide slime smile smoke snack snake solar sound space spark spear spice spike spine spoon squad stack stage stamp steam steel stick stone storm stove sugar sushi swamp sweet sword table tango tiger toast token torch tower track trail train tribe trick troll truck tulip twist ultra uncle union upper urban valve vapor vault venom video vigil viper visit vivid vocal wagon waltz watch water whale wheat wheel witch world wrath yacht yeast young zebra
anchor animal arcade arctic autumn bakery banana bandit barrel basket beacon beetle bishop blanket bottle bounce branch breeze bridge bright bubble bucket budget bullet bumper butter button cactus camera candle cannon canyon carpet carrot castle cattle cement center cereal cherry chorus cinema circus clever cobalt coffee collar comedy copper corner cotton cougar coyote crayon cricket cruise crystal custom dagger danger desert detail dinner dragon drawer effort engine escape falcon famous fender fiddle finger flavor flight flower forest fossil frozen galaxy garage garden garlic gentle ginger glider goblin gopher gravel guitar hammer harbor helmet hermit hiking hockey hollow honest hunter island jacket jaguar jersey jigsaw jungle kernel kettle kitten ladder lagoon launch legend lizard locket magnet mammal marble meadow meteor mirror mitten monkey motion muffin museum napkin nectar needle nickel noodle number nutmeg office orange oyster paddle palace parade parrot pebble pencil pepper pickle pigeon pillow pirate planet pocket potato puzzle rabbit racket radish raisin random rattle reward ribbon riddle rocket saddle safari salmon sandal scroll shadow shovel signal silver singer sketch sleeve slogan socket spider spiral sponge spring sprint square squash stable statue strike studio summer sunset switch symbol tablet teapot temple tennis ticket timber toggle tomato tongue travel tunnel turkey turtle unicorn velvet violin voyage walnut walrus wander winter wizard wombat zipper
acrobat airship balloon bandage blanket blossom cabbage cartoon caravan cascade chimney citizen compass concert costume cracker crystal cupcake cyclone diamond dolphin eclipse elegant emerald fantasy feather fiction firefly fortune freedom gallery garbage giraffe glacier gorilla granite gravity harmony harvest hamster helpful horizon hurdles iceberg journey justice kingdom ladybug lantern leopard library lobster machine mammoth mansion meadows monster morning mustard mystery network octopus orchard outpost panther passage peacock pelican penguin phantom pilgrim pioneer planter plastic popcorn pottery predict pumpkin pyramid quarter rainbow raccoon rescuer rooster sapphire scarlet scholar seaweed serpent shelter sheriff skeleton snowman soldier spatula sparrow stadium station stomach student sunrise tadpole thunder tornado tractor traffic trumpet tsunami twister uniform unicorn vampire venture village volcano warrior weather whisper whistle wildcat windmill
absolute adventure aircraft alligator ambulance apartment astronaut avalanche backpack baseball blueberry boomerang butterfly calendar campfire carnival champion chocolate cinnamon clockwork commander computer corridor crocodile dinosaur discovery dragonfly elephant emergency engineer fireworks flamingo football gargoyle generator grapefruit hailstorm hedgehog helicopter hurricane invisible jellyfish kangaroo labyrinth landslide lightning mechanic midnight molecule mosquito mountain nightmare notebook obstacle paradise parachute partner peppermint platypus porcupine president quicksand raspberry reindeer sandstorm satellite scorpion skeleton snowflake spaceship squirrel starlight strawberry submarine sunflower telescope terminator thunderbolt tightrope treasure triangle umbrella universe vacation waterfall werewolf wildfire wolverine`;
const ALL=[...new Set(RAW.split(/\s+/).filter(w=>/^[a-z]{3,10}$/.test(w)))];
const BY_LEN={};ALL.forEach(w=>(BY_LEN[w.length]=BY_LEN[w.length]||[]).push(w));
// Harder waves = longer words. Avoid first letters already on screen so lock-on is never ambiguous.
function pickWord(level,taken,opts){
  opts=opts||{};
  const min=opts.min||Math.min(7,3+Math.floor(level/3)),max=opts.max||Math.min(10,4+Math.floor(level/1.5));
  let pool=[];for(let l=min;l<=max;l++)if(BY_LEN[l])pool=pool.concat(BY_LEN[l]);
  if(!pool.length)pool=ALL;
  let w=pool[0];
  for(let i=0;i<80;i++){w=pool[Math.floor(Math.random()*pool.length)];if(!taken.has(w[0]))return w}
  return w;
}

// ---------- sound (Web Audio, made on the fly) ----------
let AC=null,nb=null,muted=store("tk_mute")==="1";
function init(){
  if(AC){if(AC.state==="suspended")AC.resume().catch(()=>{});return}
  try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){AC=null;return}
  nb=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
}
document.addEventListener("pointerdown",init,{passive:true});document.addEventListener("keydown",init);
function tone(f0,dur,type,vol,f1,when){if(!AC||muted)return;const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+(when||0);
  o.type=type||"sine";o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(vol||0.12,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+dur+0.05)}
function noise(dur,f0,f1,vol,type){if(!AC||muted||!nb)return;const s=AC.createBufferSource(),bp=AC.createBiquadFilter(),g=AC.createGain(),t=AC.currentTime;
  s.buffer=nb;bp.type=type||"bandpass";bp.Q.value=1;bp.frequency.setValueAtTime(f0,t);bp.frequency.exponentialRampToValueAtTime(f1,t+dur);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.001,t+dur);s.connect(bp);bp.connect(g);g.connect(AC.destination);s.start(t);s.stop(t+dur)}
function buzz(ms){try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}}

// ---------- layout: keep the game above the phone keyboard ----------
function fitViewport(onResize){
  const vv=window.visualViewport;
  const apply=()=>{const h=vv?vv.height:window.innerHeight;document.documentElement.style.setProperty("--vh",h+"px");
    const w=document.getElementById("wrap");if(w&&vv)w.style.top=vv.offsetTop+"px";onResize&&onResize()};
  if(vv){vv.addEventListener("resize",apply);vv.addEventListener("scroll",apply)}
  window.addEventListener("resize",apply);apply();
}

// ---------- input: a hidden text box so phone keyboards work ----------
function setupInput(o){
  const el=document.getElementById("tkIn"),tap=document.getElementById("tkTap");
  const focus=()=>el.focus({preventScroll:true});
  el.addEventListener("input",()=>{const v=el.value.toLowerCase();el.value="";for(const ch of v){if(ch>="a"&&ch<="z")o.onChar(ch);else if(ch===" "){if(o.acceptSpace&&o.acceptSpace())o.onChar(" ");else if(o.onRelease)o.onRelease()}}});
  el.addEventListener("keydown",e=>{if(e.key==="Backspace"||e.key==="Escape"){if(o.onRelease)o.onRelease()}});
  document.addEventListener("keydown",e=>{if(document.activeElement!==el&&o.active()&&e.key.length===1&&!(e.target&&e.target.tagName==="INPUT"))focus()});
  if(tap){tap.addEventListener("click",e=>{e.stopPropagation();focus()});tap.addEventListener("touchend",e=>{e.preventDefault();focus()})}
  ["stage","typedbar"].forEach(id=>{const n=document.getElementById(id);if(n)n.addEventListener("click",focus)});
  return{focus,blur:()=>el.blur(),tick(){if(tap)tap.classList.toggle("hide",!(o.active()&&document.activeElement!==el))}};
}

// ---------- lock-on typing: first letter picks a target, then finish its word ----------
function makeTyper(){
  return{target:null,
    key(ch,list,danger){
      let t=this.target;if(t&&!t.alive)t=this.target=null;
      if(!t){
        const c=list.filter(e=>e.alive&&((!e.typed&&e.word[0]===ch)||(e.keep&&e.typed&&e.word[e.typed]===ch))).sort((a,b)=>danger(b)-danger(a));
        if(!c.length)return{miss:true};
        t=c[0];t.typed=(t.typed||0)+1;const done=t.typed>=t.word.length;this.target=done?null:t;return{hit:true,t,done};
      }
      if(t.word[t.typed]===ch){t.typed++;const done=t.typed>=t.word.length;if(done)this.target=null;return{hit:true,t,done}}
      return{miss:true,t};
    },
    release(){if(this.target){if(!this.target.keep)this.target.typed=0;this.target=null}}};
}

function renderTyped(el,typer,ph){
  const t=typer.target;
  const a=t?Math.max(0,t.typed-10):0,b=t?Math.min(t.word.length,a+22):0;
  el.innerHTML=t&&t.alive?`<span class="ok">${(a?"…":"")+t.word.slice(a,t.typed)}</span><span class="rest">${t.word.slice(t.typed,b)+(b<t.word.length?"…":"")}</span>`:`<span class="ph">${ph||"Type a word you see"}</span>`;
}

// Typing stats. WPM counts only time you're actually typing (gaps over 1.5s, like waiting
// for the next target, aren't counted, nor is time with nothing on screen), so it reflects your real speed, not the game's pace.
function makeStats(){
  return{hits:0,misses:0,active:0,last:0,gaps:0,
    tick(){const n=performance.now();if(this.last&&n-this.last<1500){this.active+=(n-this.last)/1000;this.gaps++}this.last=n},
    hit(){this.tick();this.hits++},miss(){this.tick();this.misses++},
    pause(){this.last=0}, // call while there's nothing on screen to type
    wpm(){return this.active>=3?Math.round(this.gaps*(this.hits/(this.hits+this.misses))/5/(this.active/60)):0}, // keys per timed gap, counting only correct keys
    acc(){const t=this.hits+this.misses;return t?Math.round(this.hits/t*100):100}};
}

function setupMute(btn){
  const r=()=>{btn.textContent=muted?"🔇":"🔊"};r();
  btn.addEventListener("click",e=>{e.stopPropagation();init();muted=!muted;store("tk_mute",muted?"1":"0");r()});
}

window.TK={store,pickWord,ALL,init,tone,noise,buzz,fitViewport,setupInput,makeTyper,renderTyped,setupMute,makeStats};
})();
