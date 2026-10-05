/* Escape-room interactions. No external interaction libraries required. */
const THREE = AFRAME.THREE;
AFRAME.registerComponent('escape-game', {
  init() {
    if (this.el.hasLoaded) this.setup();
    else this.el.addEventListener('loaded', () => this.setup(), {once: true});
  },
  setup() {
    this.state = 'loading';
    this.rig = document.querySelector('#rig');
    this.head = document.querySelector('#head');
    this.key = document.querySelector('#key');
    this.lock = document.querySelector('#lock');
    this.figure = document.querySelector('#figure');
    this.desktopHand = document.querySelector('#desktop-hand');
    this.right = document.querySelector('#right-hand');
    this.left = document.querySelector('#left-hand');
    this.message = document.querySelector('#message');
    this.hud = document.querySelector('#hud');
    this.axes = [0, 0];
    const candles=document.querySelector('#candles');
    [[0.72,0.22,-3.72],[0.78,0.34,-4.05],[0.98,0.24,-3.88],[1.12,0.31,-4.12],[1.14,0.19,-3.62]].forEach(([x,h,z],i)=>{
      const candle=document.createElement('a-entity');
      candle.setAttribute('position',`${x} 0 ${z}`);
      candle.innerHTML=`<a-cylinder position="0 ${h/2} 0" radius="0.035" height="${h}" color="#b7a27b"></a-cylinder><a-cylinder position="0 ${h+0.008} 0" radius="0.003" height="0.018" color="#302014"></a-cylinder><a-sphere candle-flame position="0 ${h+0.037} 0" radius="0.023" scale="1 2 1" material="shader: flat; color: #ffd27d; fog: false"></a-sphere><a-entity candle-light="${i}" position="0 ${h+0.06} 0" light="type: point; color: #ffad56; intensity: 0.28; distance: 1.8; decay: 2"></a-entity>`;
      candles.appendChild(candle);
    });
    const tableCandle=document.createElement('a-entity');
    tableCandle.setAttribute('position','-0.72 0 -0.43');
    tableCandle.innerHTML='<a-cylinder position="0 0.09 0" radius="0.035" height="0.18" color="#b7a27b"></a-cylinder><a-sphere candle-flame position="0 0.217 0" radius="0.023" scale="1 2 1" material="shader: flat; color: #ffd27d; fog: false"></a-sphere><a-entity candle-light="5" position="0 0.24 0" light="type: point; color: #ffad56; intensity: 0.7; distance: 4; decay: 2"></a-entity>';
    candles.appendChild(tableCandle);
    [2.3,4.6,6.9,9.1].forEach((x,i)=>{
      const candle=document.createElement('a-entity');
      candle.setAttribute('position',`${x} 0 ${i%2 ? -0.91 : 0.1}`);
      candle.innerHTML='<a-cylinder position="0 0.2 0" radius="0.04" height="0.4" color="#ac9270"></a-cylinder><a-sphere candle-flame position="0 0.44 0" radius="0.025" scale="1 2 1" material="shader: flat; color: #ffd27d; fog: false"></a-sphere><a-entity candle-light="hall" position="0 0.48 0" light="type: point; color: #ffad56; intensity: 0.55; distance: 3.4; decay: 2"></a-entity>';
      document.querySelector('#second-hallway').appendChild(candle);
    });
    this.ready = new Set();
    this.v = new THREE.Vector3(); this.w = new THREE.Vector3();
    const status = text => {
      this.message.textContent = text;
      this.hud.setAttribute('text', 'value', text);
    };
    this.status = status;
    for (const id of ['room', 'figure-model']) {
      const el = document.getElementById(id);
      const done = () => {
        this.ready.add(id);
        if (this.ready.has('room') && this.state === 'loading') {
          this.state = 'search';
          status('The hallway has no way back. Find the skull key, then unlock the marked door.');
        }
      };
      if (el.getObject3D('mesh')) done(); else el.addEventListener('model-loaded', done, {once:true});
      el.addEventListener('model-error', () => status('A room asset could not load. Open this page through a web server and reload.'));
    }
    // Raycasters target the hitbox itself: A-Frame click events on child
    // meshes do not reliably bubble to their parent entity.
    document.querySelector('#key-hitbox').addEventListener('click', e => this.pickup(e.detail?.cursorEl, true));
    this.key.addEventListener('click', e => this.pickup(e.detail?.cursorEl, true));
    document.querySelector('#lock-hitbox').addEventListener('click', () => this.unlock(false));
    this.lock.addEventListener('click', () => this.unlock(false));
    for (const hand of [this.left, this.right]) {
      hand.addEventListener('gripdown', () => this.pickup(hand));
      hand.addEventListener('triggerdown', () => {
        this.soundReady();
        if (this.state === 'won') location.reload();
      });
    }
    this.left.addEventListener('axismove', e => {
      const a = e.detail.axis;
      if (a && a.length >= 2) this.axes = a.slice(-2);
    });
    this.left.addEventListener('controllerdisconnected', () => this.axes = [0,0]);
    this.el.addEventListener('enter-vr', () => {
      this.desktopHand.setAttribute('visible', false);
      if (this.state === 'holding') this.carry(this.right);
    });
    this.el.addEventListener('exit-vr', () => {
      this.axes = [0,0];
      this.desktopHand.setAttribute('visible', true);
      if (this.state === 'holding') this.carry(this.desktopHand);
    });
    // Native canvas picking also handles mouse/touch without relying on
    // cursor event forwarding between A-Frame entities.
    const bindPointer = () => {
      const canvas = this.el.canvas;
      if (!canvas || this.pointerBound) return;
      this.pointerBound = true;
      let down;
      canvas.addEventListener('pointerdown', e => { down = {x:e.clientX,y:e.clientY}; this.soundReady(); });
      canvas.addEventListener('pointerup', e => {
        if (this.el.is('vr-mode') || !down) return;
        const moved = Math.hypot(e.clientX-down.x,e.clientY-down.y); down = null;
        if(moved > 8) return;
        const rect = canvas.getBoundingClientRect();
        const pointer = new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1, -(e.clientY-rect.top)/rect.height*2+1);
        const ray = new THREE.Raycaster();
        this.el.object3D.updateMatrixWorld(true);
        ray.setFromCamera(pointer,this.el.camera);
        const keyHit = document.querySelector('#key-hitbox').getObject3D('mesh');
        const lockHit = document.querySelector('#lock-hitbox').getObject3D('mesh');
        if(this.state==='search' && keyHit && ray.intersectObject(keyHit,true).length) this.pickup(undefined,true);
        else if(this.state==='holding' && lockHit && ray.intersectObject(lockHit,true).length) this.unlock(false);
      });
    };
    bindPointer();
    this.el.addEventListener('renderstart',bindPointer,{once:true});
    document.addEventListener('pointerdown', () => this.soundReady());
    document.addEventListener('keydown', e => {
      this.soundReady();
      if (e.code === 'KeyE') {
        if(this.state === 'search') this.pickup();
        else if(this.state === 'holding') this.unlock(false);
      }
    });
    document.querySelector('#restart').addEventListener('click', () => location.reload());
    this.el.addEventListener('renderstart', () => this.soundReady(), {once:true});
  },
  soundReady() {
    if (!this.audio) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (Audio) this.audio = new Audio();
    }
    if (this.audio && this.audio.state === 'suspended') this.audio.resume().catch(() => {});
  },
  distance(a, b) {
    a.object3D.getWorldPosition(this.v); b.object3D.getWorldPosition(this.w);
    return this.v.distanceTo(this.w);
  },
  carry(hand) {
    hand.appendChild(this.key);
    this.key.setAttribute('position', hand === this.desktopHand ? '0 0 -0.12' : '0 -0.025 -0.16');
    this.key.setAttribute('rotation', '0 0 0');
    this.key.removeAttribute('animation');
    this.key.classList.remove('interactable');
    document.querySelector('#key-hitbox').classList.remove('interactable');
    document.querySelector('#key-label').setAttribute('visible',false);
  },
  pickup(hand, clicked = false) {
    if (this.state !== 'search') return;
    const vr = this.el.is('vr-mode');
    const holder = vr ? ([this.left,this.right].includes(hand) ? hand : this.right) : this.desktopHand;

    this.state = 'holding';
    this.carry(holder);
    this.status(vr ? 'Key acquired. Bring it to the brass lock on the marked door.' : 'Key in your right hand. Approach the marked door and click its lock, or press E.');
  },
  unlock(touch) {
    if (this.state === 'search') { this.status('Locked. Find the skull key first.'); return; }
    if (this.state !== 'holding') return;
    if (!touch && this.distance(this.head, this.lock) > 1.8) {
      this.status('Bring the key closer to the marked door.'); return;
    }
    this.state = 'inserting';
    this.lock.appendChild(this.key);
    this.key.setAttribute('position','-0.12 0 0');
    this.key.setAttribute('rotation','0 -90 0');
    this.key.setAttribute('animation','property: rotation; to: 90 -90 0; dur: 450; easing: easeInOutQuad');
    this.status('The lock turns. Something heard you.');
    this.head.setAttribute('wasd-controls','enabled',false);
    setTimeout(() => this.scare(), 700);
  },
  scare() {
    this.state = 'opening';
    const room=document.querySelector('#room').getObject3D('mesh');
    const door=room.getObjectByName('door1_InteriorDoor.004');
    if (door) {
      const hinge=new THREE.Group();
      hinge.position.set(1.58,0,0.23); room.add(hinge);
      room.updateMatrixWorld(true); hinge.attach(door);
      this.doorHinge=hinge;
    }
    this.lock.setAttribute('visible',false);
    document.querySelector('#lock-hitbox').classList.remove('interactable');
    this.openElapsed=0;
    this.figure.object3D.position.set(9,0,-0.4);
    this.figure.object3D.rotation.set(0,-Math.PI/2,0);
    this.figure.setAttribute('visible',true);
    this.status('Another hallway. Candlelight... and something at the far end.');
  },
  impact() {
    this.state='scare';
    this.status('IT FOUND YOU');
    if(this.audio && this.audio.state==='running') {
      const osc=this.audio.createOscillator(), gain=this.audio.createGain(), now=this.audio.currentTime;
      osc.type='sawtooth'; osc.frequency.setValueAtTime(170,now); osc.frequency.exponentialRampToValueAtTime(38,now+0.8);
      gain.gain.setValueAtTime(0,now); gain.gain.linearRampToValueAtTime(0.16,now+0.025); gain.gain.exponentialRampToValueAtTime(0.001,now+0.9);
      osc.connect(gain);gain.connect(this.audio.destination);osc.start(now);osc.stop(now+1);
    }
    setTimeout(()=>{
      this.figure.setAttribute('visible',false);
      this.state='escaping';
      this.head.setAttribute('wasd-controls','enabled',true);
      this.status('It vanished. Run through the doorway to escape!');
    },650);
  },  tick(time, dt) {
    if (!this.state) return;
    if(this.state==='opening') {
      this.openElapsed+=Math.min(dt,50);
      if(this.doorHinge) this.doorHinge.rotation.y=-Math.PI/2*Math.min(1,this.openElapsed/900);
      if(this.openElapsed>=1600) {
        this.state='charging'; this.runPhase=0; this.runElapsed=0;
        this.status('It is running toward you!');
      }
    }
    if(this.state==='charging') {
      const delta=Math.min(dt,50)/1000;
      this.runElapsed+=delta;
      const p=this.figure.object3D.position;
      const target=new THREE.Vector3(1.25,0,-0.4);
      // Travel along the new hallway and through the opening before tracking
      // the player, so the figure does not cut through the existing wall.
      if(this.runPhase===1) {
        this.head.object3D.getWorldPosition(target); target.y=0;
      }
      const dx=target.x-p.x,dz=target.z-p.z, distance=Math.hypot(dx,dz);
      if(this.runPhase===0 && distance<0.15) this.runPhase=1;
      else if(this.runPhase===1 && distance<0.65) this.impact();
      else {
        const step=Math.min(distance,delta*(3.1+Math.min(this.runElapsed,3)*0.5));
        p.x+=dx/distance*step;p.z+=dz/distance*step;
        p.y=0.045*Math.abs(Math.sin(this.runElapsed*18));
        this.figure.object3D.rotation.set(-0.1,Math.atan2(dx,dz),0.035*Math.sin(this.runElapsed*18));
      }
    }
    if (this.state === 'holding' && this.el.is('vr-mode') && this.distance(this.key,this.lock)<0.28) this.unlock(true);
    if (['search','holding','escaping'].includes(this.state) && this.el.is('vr-mode')) {
      const x=Math.abs(this.axes[0])>0.18?this.axes[0]:0, z=Math.abs(this.axes[1])>0.18?this.axes[1]:0;
      const forward=new THREE.Vector3(); this.head.object3D.getWorldDirection(forward); forward.negate(); forward.y=0; forward.normalize();
      const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));
      this.rig.object3D.position.addScaledVector(forward,-z*Math.min(dt,40)*0.001).addScaledVector(right,x*Math.min(dt,40)*0.001);
    }
    // Basic corridor bounds keep keyboard and controller movement indoors.
    if (['search','holding','escaping'].includes(this.state)) {
      const p=this.head.object3D.position, r=this.rig.object3D.position;
      const wx=r.x+p.x, wz=r.z+p.z;
      const exitOpen=this.state==='escaping' && wz > -0.88 && wz < 0.05;
      r.x+=THREE.MathUtils.clamp(wx,-0.48,exitOpen?2.3:1.2)-wx;
      r.z+=THREE.MathUtils.clamp(wz,-4.05,1.85)-wz;
      if(exitOpen && wx>1.85) {
        this.state='won';
        if(this.doorHinge) this.doorHinge.rotation.y=0;
        this.head.setAttribute('wasd-controls','enabled',false);
        this.status('You escaped. The door slammed behind you. But the footsteps followed.');
        document.querySelector('#restart').hidden=false;
        this.hud.setAttribute('text','value','YOU ESCAPED\nThe footsteps followed.\nPress a controller trigger to replay.');
      }
    }
    document.querySelectorAll('[candle-flame]').forEach((el,i) => {
      const size=1+0.1*Math.sin(time*0.011+i*2)+0.04*Math.sin(time*0.027+i);
      el.object3D.scale.set(1,2*size,1);
    });
    document.querySelectorAll('[candle-light]').forEach((el,i) => {
      el.setAttribute('light','intensity',(i===5 ? 0.7 : i>=6 ? 0.55 : 0.28)+0.035*Math.sin(time*0.009+i*2));
    });
    const glow=document.querySelector('#candle-glow');
    if(glow) glow.setAttribute('light','intensity',0.9+0.12*Math.sin(time*0.005)+0.05*Math.sin(time*0.017));
  }
});
