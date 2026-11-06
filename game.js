/**
 * Wheelchair Tag (輪椅少女：極速鬼抓人)
 * 
 * Featuring:
 * - Protagonist: Cool wheelchair girl with neat straight bangs (齊瀏海) and long flowing hair (長髮), smoking a cigarette with dynamic smoke particles.
 * - Target NPCs:
 *    - Kids: 1 pt (fast, agile)
 *    - Adults: 2 pts (standard)
 *    - Elders: 20 pts (slower, but counter-attacks with walking cane!)
 *    - Xiao Hei (小黑): 26yo dark-skinned male with black hair & bangs, nameplate over head.
 *      Expresses romantic confessions when fleeing; triggers an interactive choice modal when caught:
 *      [💖 心軟放走他 (+50分 + 8秒愛之加速Buff)] vs [⚡ 無情逮捕 (+30分)]!
 * - 2-minute countdown timer & combo scoring system
 * - Web Audio API procedural sound effects & chiptune synthesizer
 */

// =========================================================
// Audio Synthesizer (Zero External Dependencies)
// =========================================================
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.initAudioContext();
  }

  initAudioContext() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  ensureContext() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15, pitchDecay = true) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (pitchDecay) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * 0.4), now + duration);
    }

    gain.gain.setValueAtTime(gainVal, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  playTag(combo = 1) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const baseFreq = 520 + Math.min(combo * 90, 800);
    this.playTone(baseFreq, 'triangle', 0.12, 0.2, false);
    setTimeout(() => {
      this.playTone(baseFreq * 1.5, 'sine', 0.18, 0.15, false);
    }, 45);
  }

  playElderTag() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    [440, 554, 659, 880].forEach((freq, i) => {
      setTimeout(() => {
        this.playTone(freq, 'sawtooth', 0.35, 0.15, false);
      }, i * 60);
    });
  }

  playXiaoHeiEncounter() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.3, 0.2, false);
      }, idx * 75);
    });
  }

  playLoveBlessing() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    const notes = [659, 830, 987, 1318];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playTone(freq, 'triangle', 0.35, 0.22, false);
      }, idx * 70);
    });
  }

  playCaneSwing() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    this.playTone(280, 'sawtooth', 0.25, 0.2, true);
  }

  playStun() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    this.playTone(180, 'square', 0.4, 0.25, true);
  }

  playDash() {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    this.playTone(320, 'triangle', 0.25, 0.25, true);
  }

  playBeep(high = false) {
    if (this.isMuted || !this.ctx) return;
    this.ensureContext();
    this.playTone(high ? 880 : 440, 'sine', 0.15, 0.2, false);
  }

  startBGM() {
    if (this.isMuted || !this.ctx || this.bgmPlaying) return;
    this.ensureContext();
    this.bgmPlaying = true;
    
    const bassline = [110, 110, 130, 146, 110, 164, 146, 130];
    let step = 0;
    
    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || this.isMuted) return;
      const freq = bassline[step % bassline.length];
      this.playTone(freq, 'sawtooth', 0.18, 0.05, true);
      step++;
    }, 280);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

// =========================================================
// Particle System & Effects
// =========================================================
class ParticleSystem {
  constructor() {
    this.particles = [];
    this.skidMarks = [];
    this.floatingTexts = [];
  }

  addSmoke(x, y, vx = 0, vy = 0) {
    this.particles.push({
      type: 'smoke',
      x,
      y,
      vx: (Math.random() - 0.5) * 0.4 + vx * 0.1,
      vy: -0.6 - Math.random() * 0.6 + vy * 0.1,
      radius: 3 + Math.random() * 3,
      maxRadius: 18 + Math.random() * 10,
      alpha: 0.65,
      life: 1.0,
      decay: 0.015 + Math.random() * 0.01
    });
  }

  addHeart(x, y) {
    this.particles.push({
      type: 'heart',
      x,
      y,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -1.2 - Math.random() * 1.0,
      scale: 0.8 + Math.random() * 0.6,
      alpha: 1.0,
      life: 1.0,
      decay: 0.02
    });
  }

  addSkidMark(x1, y1, x2, y2, width = 4) {
    this.skidMarks.push({
      x1, y1, x2, y2,
      width,
      alpha: 0.35,
      decay: 0.002
    });
    if (this.skidMarks.length > 300) {
      this.skidMarks.shift();
    }
  }

  addTagSparks(x, y, color = '#00f0ff', count = 16) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 2 + Math.random() * 2,
        color,
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.02
      });
    }
  }

  addFloatingText(x, y, text, color = '#00f0ff', size = 20, vy = -1.2, decay = 0.018, isBubble = false) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      size,
      alpha: 1.0,
      vy,
      decay,
      isBubble
    });
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.type === 'smoke') {
        p.radius += 0.25;
        p.alpha = Math.max(0, p.life * 0.6);
      } else if (p.type === 'heart') {
        p.alpha = Math.max(0, p.life);
      } else {
        p.alpha = Math.max(0, p.life);
      }
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
      const s = this.skidMarks[i];
      s.alpha -= s.decay;
      if (s.alpha <= 0) {
        this.skidMarks.splice(i, 1);
      }
    }

    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const t = this.floatingTexts[i];
      t.y += t.vy;
      t.alpha -= t.decay;
      if (t.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }
  }

  render(ctx, camera) {
    ctx.lineCap = 'round';
    for (const s of this.skidMarks) {
      ctx.beginPath();
      ctx.moveTo(s.x1 - camera.x, s.y1 - camera.y);
      ctx.lineTo(s.x2 - camera.x, s.y2 - camera.y);
      ctx.strokeStyle = `rgba(20, 24, 38, ${s.alpha})`;
      ctx.lineWidth = s.width;
      ctx.stroke();
    }

    for (const p of this.particles) {
      const px = p.x - camera.x;
      const py = p.y - camera.y;
      if (p.type === 'smoke') {
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(px, py, 1, px, py, p.radius);
        grad.addColorStop(0, `rgba(225, 235, 255, ${p.alpha * 0.9})`);
        grad.addColorStop(0.6, `rgba(160, 185, 220, ${p.alpha * 0.5})`);
        grad.addColorStop(1, `rgba(100, 130, 180, 0)`);
        ctx.fillStyle = grad;
        ctx.fill();
      } else if (p.type === 'heart') {
        ctx.save();
        ctx.translate(px, py);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = '#ff3366';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💖', 0, 0);
        ctx.restore();
      } else if (p.type === 'spark') {
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
    }

    for (const t of this.floatingTexts) {
      const tx = t.x - camera.x;
      const ty = t.y - camera.y;
      ctx.save();
      ctx.globalAlpha = Math.min(1.0, Math.max(0, t.alpha));

      if (t.isBubble) {
        // Speech Bubble rendering for Xiao Hei's slow-reading dialogue
        ctx.font = `bold ${t.size}px "Outfit", "Noto Sans TC", sans-serif`;
        const textMetrics = ctx.measureText(t.text);
        const padX = 14;
        const padY = 7;
        const bw = textMetrics.width + padX * 2;
        const bh = t.size + padY * 2;
        const bx = tx - bw / 2;
        const by = ty - bh / 2;

        // Frosted dark background
        ctx.fillStyle = 'rgba(12, 16, 30, 0.94)';
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 8);
        ctx.fill();

        // Neon border with subtle glow
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 8;
        ctx.stroke();

        // High contrast readable text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.fillText(t.text, tx, ty);
      } else {
        ctx.font = `900 ${t.size}px 'Outfit', sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = t.color;
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 10;
        ctx.fillText(t.text, tx, ty);
      }
      ctx.restore();
    }
  }
}

// =========================================================
// Wheelchair Girl Player Entity (齊瀏海長髮 + 叼菸)
// =========================================================
class WheelchairPlayer {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 24;
    this.angle = 0;
    this.speed = 0;
    this.maxSpeed = 6.2;
    this.accel = 0.35;
    this.friction = 0.94;
    this.turnSpeed = 0.085;
    
    // Dash ability
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashDuration = 0.45;
    this.dashCooldown = 0;
    this.dashCooldownMax = 3.0;
    this.dashSpeedMultiplier = 2.4;

    // Love Speed Blessing Buff (from sparing Xiao Hei)
    this.loveSpeedBuffTimer = 0;

    // Stun state
    this.stunTimer = 0;
    this.knockbackVx = 0;
    this.knockbackVy = 0;

    // Hair wave animation & smoke
    this.hairWaveTimer = 0;
    this.wheelRotation = 0;
    this.smokeTimer = 0;
    this.lastX = x;
    this.lastY = y;
  }

  update(dt, input, particles, sound) {
    if (this.dashCooldown > 0) {
      this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    }

    if (this.loveSpeedBuffTimer > 0) {
      this.loveSpeedBuffTimer -= dt;
      if (Math.random() < 0.25) {
        particles.addHeart(this.x - Math.cos(this.angle) * 20, this.y - Math.sin(this.angle) * 20);
      }
    }

    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.x += this.knockbackVx;
      this.y += this.knockbackVy;
      this.knockbackVx *= 0.88;
      this.knockbackVy *= 0.88;
      this.speed = 0;
      return;
    }

    if (this.isDashing) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
      }
    } else if (input.dash && this.dashCooldown <= 0) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldown = this.dashCooldownMax;
      sound.playDash();
      
      const backX = this.x - Math.cos(this.angle) * 28;
      const backY = this.y - Math.sin(this.angle) * 28;
      for (let i = 0; i < 8; i++) {
        particles.addSmoke(backX, backY, -Math.cos(this.angle) * 3, -Math.sin(this.angle) * 3);
      }
    }

    let targetAngle = this.angle;
    let moving = false;

    if (input.pointerActive) {
      const dx = input.targetX - this.x;
      const dy = input.targetY - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 25) {
        targetAngle = Math.atan2(dy, dx);
        moving = true;
        this.speed += this.accel;
      }
    } else if (input.moveX !== 0 || input.moveY !== 0) {
      targetAngle = Math.atan2(input.moveY, input.moveX);
      moving = true;
      this.speed += this.accel;
    }

    if (moving) {
      let angleDiff = targetAngle - this.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.angle += angleDiff * this.turnSpeed;

      if (Math.abs(angleDiff) > 0.4 && this.speed > 3.5) {
        const leftWheelX = this.x + Math.cos(this.angle - Math.PI / 2) * 16;
        const leftWheelY = this.y + Math.sin(this.angle - Math.PI / 2) * 16;
        particles.addSkidMark(this.lastX, this.lastY, leftWheelX, leftWheelY, 3);
      }
    }

    let currentMax = this.maxSpeed;
    if (this.isDashing) currentMax *= this.dashSpeedMultiplier;
    if (this.loveSpeedBuffTimer > 0) currentMax *= 1.35; // Love speed buff

    if (this.speed > currentMax) this.speed = currentMax;
    this.speed *= this.friction;

    this.lastX = this.x;
    this.lastY = this.y;
    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    this.wheelRotation += this.speed * 0.15;
    this.hairWaveTimer += dt * (5 + this.speed * 2);

    // Continuous cigarette smoke particles emitted from cigarette tip
    this.smokeTimer += dt;
    if (this.smokeTimer >= 0.05) {
      this.smokeTimer = 0;
      const cigDist = 20;
      const cigAngle = this.angle + 0.35;
      const cigX = this.x + Math.cos(cigAngle) * cigDist;
      const cigY = this.y + Math.sin(cigAngle) * cigDist;
      particles.addSmoke(cigX, cigY);
    }
  }

  applyKnockback(vx, vy, stunSeconds = 1.0) {
    this.knockbackVx = vx;
    this.knockbackVy = vy;
    this.stunTimer = stunSeconds;
    this.isDashing = false;
  }

  resetDash() {
    this.dashCooldown = 0;
  }

  applyLoveBlessing() {
    this.loveSpeedBuffTimer = 8.0; // 8 seconds love speed buff
    this.resetDash();
  }

  render(ctx, camera) {
    const px = this.x - camera.x;
    const py = this.y - camera.y;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.angle);

    // Love blessing aura trail
    if (this.loveSpeedBuffTimer > 0) {
      ctx.shadowColor = '#ff4d8d';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = 'rgba(255, 77, 141, 0.5)';
      ctx.lineWidth = 3;
      ctx.strokeRect(-26, -20, 52, 40);
    } else if (this.isDashing) {
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 18;
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
      ctx.lineWidth = 4;
      ctx.strokeRect(-26, -20, 52, 40);
    }

    // 1. Wheelchair Frame & Footrests
    ctx.fillStyle = '#1e2433';
    ctx.fillRect(-18, -14, 32, 28);
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 3;
    ctx.strokeRect(-18, -14, 32, 28);

    // Footrest (front)
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(14, -8, 8, 16);

    // Backrest & handles
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-22, -12, 5, 24);
    ctx.fillStyle = '#718096';
    ctx.fillRect(-26, -11, 5, 4);
    ctx.fillRect(-26, 7, 5, 4);

    // 2. Dual Big Wheelchair Wheels with neon rims
    const wheelWidth = 5;
    const wheelLength = 26;
    [-17, 17].forEach(offsetY => {
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(-10, offsetY - 2.5, wheelLength, wheelWidth);
      ctx.strokeStyle = this.loveSpeedBuffTimer > 0 ? '#ff4d8d' : (this.isDashing ? '#00f0ff' : '#00b4d8');
      ctx.lineWidth = 2;
      ctx.strokeRect(-10, offsetY - 2.5, wheelLength, wheelWidth);
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      const spokeOff = Math.sin(this.wheelRotation) * 4;
      ctx.beginPath();
      ctx.moveTo(-6 + spokeOff, offsetY);
      ctx.lineTo(10 + spokeOff, offsetY);
      ctx.stroke();
    });

    // 3. Wheelchair Girl
    // Torso / Stylish Jacket
    ctx.fillStyle = '#1a202c';
    ctx.beginPath();
    ctx.ellipse(-2, 0, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.loveSpeedBuffTimer > 0 ? '#ff4d8d' : '#ff7b00';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(2, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // 4. 齊瀏海 + 長髮 (Neat Straight Bangs + Long Flowing Hair)
    // Long hair streaming backward behind the girl in the wind
    ctx.fillStyle = '#090a0f'; // Jet black hair
    const wave = Math.sin(this.hairWaveTimer) * 3;
    const wave2 = Math.cos(this.hairWaveTimer * 1.2) * 4;

    // Left flowing long hair strand
    ctx.beginPath();
    ctx.moveTo(-3, -7);
    ctx.bezierCurveTo(-14, -12 + wave, -26, -10 + wave2, -34, -4 + wave);
    ctx.bezierCurveTo(-24, -3 + wave, -12, -4, -3, -4);
    ctx.fill();

    // Right flowing long hair strand
    ctx.beginPath();
    ctx.moveTo(-3, 7);
    ctx.bezierCurveTo(-14, 12 - wave, -26, 10 - wave2, -34, 4 - wave);
    ctx.bezierCurveTo(-24, 3 - wave, -12, 4, -3, 4);
    ctx.fill();

    // Main long hair body flowing back
    ctx.beginPath();
    ctx.moveTo(-2, -6);
    ctx.lineTo(-28, -2 + wave);
    ctx.lineTo(-2, 6);
    ctx.closePath();
    ctx.fill();

    // Head top hair
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, Math.PI * 0.45, Math.PI * 1.55);
    ctx.fill();

    // 齊瀏海 (Neat Straight Bangs cut squarely across forehead)
    ctx.fillStyle = '#050608';
    ctx.fillRect(4, -6.5, 3.5, 13);
    // Subtle straight bangs fringe trim
    ctx.strokeStyle = '#1e2433';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(7.5, -6.5);
    ctx.lineTo(7.5, 6.5);
    ctx.stroke();

    // 5. Lit Cigarette in Hand / Mouth with Glowing Ember
    const cigAngle = 0.35;
    const cigDist = 18;
    const cx = Math.cos(cigAngle) * cigDist;
    const cy = Math.sin(cigAngle) * cigDist;

    ctx.strokeStyle = '#fed7aa';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(3, 4);
    ctx.lineTo(cx - 3, cy - 1);
    ctx.stroke();

    // Cigarette Stick (white)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 1);
    ctx.lineTo(cx + 3, cy + 1);
    ctx.stroke();

    // Cigarette Ember (Glowing Orange / Red pulsating tip)
    const emberPulse = 2.5 + Math.sin(Date.now() * 0.015) * 1.2;
    ctx.fillStyle = '#ff3300';
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 1.2, emberPulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(cx + 4, cy + 1.2, emberPulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 6. Stun Effect Indicator
    if (this.stunTimer > 0) {
      ctx.save();
      ctx.translate(px, py - 30);
      const starTime = Date.now() * 0.008;
      ctx.fillStyle = '#ffdd00';
      ctx.font = '16px sans-serif';
      for (let i = 0; i < 3; i++) {
        const sa = starTime + (i * Math.PI * 2) / 3;
        const sx = Math.cos(sa) * 16;
        const sy = Math.sin(sa) * 6;
        ctx.fillText('💫', sx, sy);
      }
      ctx.restore();
    }
  }
}

// =========================================================
// Base NPC & Specialized NPC Classes
// =========================================================
class NPC {
  constructor(x, y, type = 'adult') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 18;
    this.angle = Math.random() * Math.PI * 2;
    this.speed = 1.6;
    this.fleeSpeed = 3.6;
    this.isFleeing = false;
    this.fleeDetectRange = 175;
    this.walkCycle = Math.random() * 10;
    this.color = '#38bdf8';
    this.hairColor = '#1f2937';
    this.skinColor = '#fcd34d';
    this.points = 2;
  }

  update(dt, player, arenaWidth, arenaHeight) {
    this.walkCycle += dt * 6;

    const dx = this.x - player.x;
    const dy = this.y - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist < this.fleeDetectRange) {
      this.isFleeing = true;
      const fleeAngle = Math.atan2(dy, dx) + Math.sin(this.walkCycle * 0.8) * 0.35;
      this.angle = fleeAngle;
      this.speed = this.fleeSpeed;
    } else {
      this.isFleeing = false;
      if (Math.random() < 0.02) {
        this.angle += (Math.random() - 0.5) * 1.5;
      }
      this.speed = 1.5;
    }

    this.x += Math.cos(this.angle) * this.speed;
    this.y += Math.sin(this.angle) * this.speed;

    const margin = 40;
    if (this.x < margin) { this.x = margin; this.angle = 0; }
    if (this.x > arenaWidth - margin) { this.x = arenaWidth - margin; this.angle = Math.PI; }
    if (this.y < margin) { this.y = margin; this.angle = Math.PI / 2; }
    if (this.y > arenaHeight - margin) { this.y = arenaHeight - margin; this.angle = -Math.PI / 2; }
  }

  render(ctx, camera) {
    const px = this.x - camera.x;
    const py = this.y - camera.y;

    ctx.save();
    ctx.translate(px, py);

    if (this.isFleeing) {
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ff0055';
      ctx.fillText('！', 0, -this.radius - 10);
    }

    ctx.rotate(this.angle);
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.skinColor;
    ctx.beginPath();
    ctx.arc(4, 0, this.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.hairColor;
    ctx.beginPath();
    ctx.arc(2, 0, this.radius * 0.68, Math.PI * 0.5, Math.PI * 1.5);
    ctx.fill();

    ctx.restore();
  }
}

// 1. 小孩 (Child): 1 pt
class ChildNPC extends NPC {
  constructor(x, y) {
    super(x, y, 'child');
    this.radius = 13;
    this.points = 1;
    this.fleeSpeed = 4.2;
    this.color = '#10b981';
    this.skinColor = '#fed7aa';
    this.hairColor = '#fbbf24';
    this.fleeDetectRange = 160;
  }
}

// 2. 普通成年人 (Adult): 2 pts
class AdultNPC extends NPC {
  constructor(x, y) {
    super(x, y, 'adult');
    this.radius = 18;
    this.points = 2;
    this.fleeSpeed = 3.5;
    const colors = ['#0ea5e9', '#6366f1', '#ec4899', '#f97316', '#14b8a6'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    const skins = ['#fde68a', '#fed7aa', '#d4a373', '#e0a96d'];
    this.skinColor = skins[Math.floor(Math.random() * skins.length)];
    this.hairColor = Math.random() > 0.5 ? '#111827' : '#78350f';
  }
}

// 3. 老人 (Elder): 20 pts, walks slower, but counter-attacks with walking cane!
class ElderNPC extends NPC {
  constructor(x, y) {
    super(x, y, 'elder');
    this.radius = 19;
    this.points = 20;
    this.speed = 0.9;
    this.fleeSpeed = 1.8;
    this.color = '#78716c';
    this.hairColor = '#f1f5f9';
    this.skinColor = '#fed7aa';
    
    this.attackRange = 110; // Slightly larger warning & attack detection
    this.isChargingAttack = false;
    this.chargeTimer = 0;
    this.chargeDuration = 0.18; // Much faster wind-up (down from 0.45s) for lightning-fast counter-attack!
    this.attackCooldown = 0;
    this.attackCooldownMax = 1.2; // Halved attack cooldown for rapid re-strikes
  }

  update(dt, player, arenaWidth, arenaHeight, sound, particles) {
    if (this.attackCooldown > 0) {
      this.attackCooldown -= dt;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);

    if (!this.isChargingAttack && this.attackCooldown <= 0 && dist < this.attackRange) {
      const toPlayerAngle = Math.atan2(dy, dx);
      this.angle = toPlayerAngle;
      this.isChargingAttack = true;
      this.chargeTimer = this.chargeDuration;
      particles.addFloatingText(this.x, this.y - 25, '⚡ 看招！', '#ff4444', 18);
    }

    if (this.isChargingAttack) {
      this.chargeTimer -= dt;
      if (this.chargeTimer <= 0) {
        this.isChargingAttack = false;
        this.attackCooldown = this.attackCooldownMax;
        sound.playCaneSwing();

        if (dist < this.attackRange + 15) {
          const knockAngle = Math.atan2(player.y - this.y, player.x - this.x);
          const knockForce = 13;
          player.applyKnockback(Math.cos(knockAngle) * knockForce, Math.sin(knockAngle) * knockForce, 1.0);
          sound.playStun();
          particles.addTagSparks(player.x, player.y, '#ff4444', 16);
          particles.addFloatingText(player.x, player.y - 30, '⚡ 遭迅雷拐杖擊退！', '#ff4444', 19);
          if (window.gameInstance) {
            window.gameInstance.stats.hitByCounter++;
          }
        }
      }
      return;
    }

    super.update(dt, player, arenaWidth, arenaHeight);
  }

  render(ctx, camera) {
    const px = this.x - camera.x;
    const py = this.y - camera.y;

    if (this.isChargingAttack) {
      ctx.save();
      ctx.translate(px, py);
      ctx.beginPath();
      ctx.arc(0, 0, this.attackRange, this.angle - 0.9, this.angle + 0.9);
      ctx.strokeStyle = 'rgba(255, 68, 68, 0.7)';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 6]);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 68, 68, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, this.attackRange, this.angle - 0.9, this.angle + 0.9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    super.render(ctx, camera);

    // Walking Cane
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(8, 12);
    ctx.lineTo(24, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(23, 11, 4, 0, Math.PI);
    ctx.stroke();
    ctx.restore();
  }
}

// 4. 特殊 NPC: 小黑 (Xiao Hei) - 26歲・黑頭髮・有瀏海・皮膚黝黑・逃跑時告白示愛
class XiaoHeiNPC extends NPC {
  constructor(x, y) {
    super(x, y, 'xiaohei');
    this.radius = 20;
    this.points = 30;
    this.fleeSpeed = 3.8;
    this.color = '#ea580c';
    this.skinColor = '#8d5524'; // 皮膚黝黑
    this.hairColor = '#09090b'; // 黑頭髮
    this.name = '小黑 (26歲)';
    this.quoteCooldown = 0;
    this.heartTimer = 0;
  }

  update(dt, player, arenaWidth, arenaHeight, sound, particles) {
    super.update(dt, player, arenaWidth, arenaHeight);

    // Love confession speech bubbles and heart particles while fleeing!
    if (this.isFleeing) {
      this.quoteCooldown -= dt;
      if (this.quoteCooldown <= 0) {
        this.quoteCooldown = 3.6; // Longer interval between lines for comfortable reading
        const loveQuotes = [
          '別追了！其實我的心跳速度早就超過妳的輪椅了！💓',
          '妳抽菸甩尾的那個弧度……直接飄移進我心裡！🔥',
          '就算全世界都在逃跑，我也只想繞著妳轉！✨',
          '妳嘴角叼著菸的冷酷眼神……我快要無法呼吸了！😍',
          '呼……呼……妳坐輪椅怎麼能飆得比超跑還帥啊？！💨',
          '如果被妳追上，妳答應聽我告白好不好？！🙏',
          '看著身後狂飆的妳……我竟然捨不得跑太快！💖',
          '這不是鬼抓人，這是邱比特開著輪椅在追我啊！💘',
          '慢點開！轉彎小心點，摔著了我會心疼死的！🥺',
          '菸少抽一點啦！雖然妳吐煙圈的側臉真的帥到犯規……🚬',
          '等等！妳輪椅避震好不好？別顛簸到了！💥',
          '地上有積水小心打滑！我跑慢一點等妳好了！💦',
          '我這黑髮齊瀏海可是為妳剪的！妳注意到了嗎？！💇‍♂️',
          '26歲的我本以為看破紅塵，直到遇見了輪椅上的妳！😎',
          '我的雙腿跑得過風，卻跑不出妳的引力圈！🌀',
          '妳以為妳在抓鬼？不，妳是在抓捕偷走妳心的嫌犯！🚔',
          '如果妳追到我……我連人帶心全部過戶給妳！📝',
          '這條街很長，但我希望這場追逐永遠沒有終點！🏁',
          '別人都怕妳撞人，我只想當妳輪椅的專屬導航！🧭',
          '可惡……我的心跳已經破兩百了，不是累的，是因為妳太近了！📈',
          '如果能被妳這樣追一輩子，我願意天天跑步！🏃‍♂️',
          '剛才那記甩尾太絕了！教我好不好？學費是我的一生！💍',
          '被妳盯上的感覺……竟然比中頭獎還令人上癮！🌟',
          '妳的齊瀏海在風中飄得好美！我都看呆了差點摔倒！😳',
          '哪怕是當妳輪椅的一顆螺絲釘，我都心甘情願！🔩',
          '別抓其他人了，這整條街上只有我能懂妳的浪漫！💌',
          '我的體力還很充沛，但對妳的防線早就全面崩塌了！🛡️',
          '這輩子只甘願被妳一個人追！其他人我都看不上！💕'
        ];
        // Avoid repeating the exact last quote
        let q;
        do {
          q = loveQuotes[Math.floor(Math.random() * loveQuotes.length)];
        } while (q === this.lastQuote && loveQuotes.length > 1);
        this.lastQuote = q;

        // Slow upward floating speed (-0.35) and extended duration (decay 0.006 ~ 3s display) with speech bubble
        particles.addFloatingText(this.x, this.y - 38, q, '#ff4d8d', 13, -0.35, 0.006, true);
      }

      // Trailing hearts
      this.heartTimer += dt;
      if (this.heartTimer >= 0.35) {
        this.heartTimer = 0;
        particles.addHeart(this.x, this.y);
      }
    }
  }

  render(ctx, camera) {
    const px = this.x - camera.x;
    const py = this.y - camera.y;

    // 1. Permanent Glowing Floating Nameplate Over Head
    ctx.save();
    ctx.translate(px, py - 32);
    
    ctx.fillStyle = 'rgba(121, 40, 202, 0.9)';
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 1.5;
    const tagText = '★ 小黑 (26歲)';
    ctx.font = 'bold 12px "Outfit", "Noto Sans TC", sans-serif';
    const textWidth = ctx.measureText(tagText).width;
    
    ctx.beginPath();
    ctx.roundRect(-textWidth / 2 - 8, -10, textWidth + 16, 20, 6);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 8;
    ctx.fillText(tagText, 0, 0);
    ctx.restore();

    // 2. Character Body & Tanned Skin & Stylish Bangs
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fdba74';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Head with dark tanned skin (皮膚黝黑)
    ctx.fillStyle = this.skinColor;
    ctx.beginPath();
    ctx.arc(4, 0, this.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Jet Black Hair with Bangs (黑頭髮，有瀏海)
    ctx.fillStyle = this.hairColor;
    ctx.beginPath();
    ctx.arc(2, 0, this.radius * 0.7, Math.PI * 0.4, Math.PI * 1.6);
    ctx.fill();
    // Distinct forward bangs extending over forehead
    ctx.beginPath();
    ctx.ellipse(6, -2, 4, 3, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, 2, 4, 3, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

// =========================================================
// Main Game Controller
// =========================================================
class WheelchairTagGame {
  constructor() {
    window.gameInstance = this;

    // DOM Elements
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.minimapCanvas = document.getElementById('minimap-canvas');
    this.minimapCtx = this.minimapCanvas.getContext('2d');

    this.hud = document.getElementById('hud');
    this.minimapContainer = document.getElementById('minimap-container');
    this.scoreDisplay = document.getElementById('score-display');
    this.timerDisplay = document.getElementById('timer-display');
    this.comboDisplay = document.getElementById('combo-display');
    this.comboBarFill = document.getElementById('combo-bar-fill');
    this.dashBarFill = document.getElementById('dash-bar-fill');
    this.dashStatus = document.getElementById('dash-status');
    this.floatingNotice = document.getElementById('floating-notice');

    // Modals
    this.modalStart = document.getElementById('modal-start');
    this.modalPause = document.getElementById('modal-pause');
    this.modalGameOver = document.getElementById('modal-gameover');
    this.modalConfession = document.getElementById('modal-confession');

    // Confession Dynamic Elements
    this.confessionTitleEl = document.getElementById('confession-title');
    this.speechQuoteEl = document.getElementById('speech-quote');
    this.confessionPromptEl = document.getElementById('confession-prompt-text');
    this.lastConfessionIndex = -1;
    this.currentConfession = null;

    this.confessionScenarios = [
      {
        title: '「被妳追上了……！但妳抓得住我的人，抓得住我的心嗎？」',
        speech: '「呼……還是輸給了妳神級的輪椅甩尾。但我剛才說的每句都是真的！從妳叼著菸在街頭狂飆的第一天起，我就無法把視線從妳身上移開。<br>如果妳願意放我走，我明天親手幫妳點菸！」',
        prompt: '輪椅少女輕吐一口薄煙，看著眼前氣喘吁吁卻滿臉真摯的小黑，妳的決定是……？',
        spareQuote: '💖 「太好了！我就知道妳外冷內熱！明天老地方等妳！」',
        spareNotice: '💖 妳放走了小黑！小黑興奮大喊：「明天親手幫妳點菸！」獲得愛之加速！',
        captureQuote: '⚡ 「被妳抓到也是一種幸福……但我絕不放棄！」',
        captureNotice: '⚡ 少女冷酷彈菸灰：「少套近乎！」無情逮捕小黑！'
      },
      {
        title: '「呼……心跳好快！被妳親手追到的感覺……竟然有點幸福！」',
        speech: '「妳的飄移速度真的太驚人了……但我跑得這麼用力，其實只是想多看妳認真的側臉幾眼！<br>如果妳放我一馬，我發誓這輩子只當妳一個人的頭號護花使者！」',
        prompt: '齊瀏海長髮少女眼神冷酷，嘴角微微上揚，妳要放走這個熱血青年嗎？',
        spareQuote: '💖 「遵命！這份加速祝福給妳，拿下全場最高分吧！」',
        spareNotice: '💖 妳放走了小黑！小黑臉紅誓言當妳專屬護花使者，贈予極速祝福！',
        captureQuote: '⚡ 「嗚……被妳的手銬銬住了！但這份冷酷也超迷人！」',
        captureNotice: '⚡ 少女俐落標記抓捕：「別油腔滑調，計分牌可不講人情！」'
      },
      {
        title: '「這不是終點，而是我們命運交會的十字路口！」',
        speech: '「在冷冽的霓虹燈下，妳宛如一道黑色的閃電。輪椅是妳的王座，長髮是妳的戰旗。<br>如果妳願意赦免我，我甘願化作妳身後的微風，護送妳狂飆到黎明！」',
        prompt: '面對小黑滿滿文藝范的深情告白，輪椅少女彈了彈手中的菸灰……',
        spareQuote: '💖 「感謝女王陛下的恩賜！微風常伴妳左右！」',
        spareNotice: '💖 少女揮手放行！小黑行紳士禮化作微風，賦予8秒極速祝福！',
        captureQuote: '⚡ 「落入女王陛下的掌心，此生無憾！」',
        captureNotice: '⚡ 少女冷哼一聲：「少背台詞，比賽場上只有贏家和被抓者！」'
      },
      {
        title: '「裁判！這裡有人用美貌和輪椅雙重犯規追殺我！」',
        speech: '「我小黑堂堂26歲街頭健將，今天居然拜倒在妳的輪胎下！我認輸了啦～<br>但如果妳今天心軟放我走，以後這座公園所有的減速坡我都替妳鋪平！」',
        prompt: '小黑雙手合十連忙作揖求饒，眼神中卻滿是掩蓋不住的寵溺，妳決定……？',
        spareQuote: '💖 「耶！說好了喔！下次我一定跑得更有難度給妳追！」',
        spareNotice: '💖 妳放走了小黑！小黑狂奔歡呼：「所有減速坡我都幫妳鏟平！」',
        captureQuote: '⚡ 「犯規啊……居然用這種迷人的眼神看著我逮捕我！」',
        captureNotice: '⚡ 少女轉動輪椅轉盤：「少貧嘴，老實進我的計分冊領2分吧！」'
      },
      {
        title: '「我的生物處理器已經被妳徹底過載了……！」',
        speech: '「街頭的霓虹再亮，也沒有妳菸頭上的那一簇火光耀眼。剛才被妳追逐的這幾十秒，是我這輩子心率最澎湃的時刻。<br>不管妳決定抓我還是放我，我的程序都已鎖定妳了！」',
        prompt: '賽博龐克風格的告白在夜空中迴盪，黑長髮少女靜靜注視著他……',
        spareQuote: '💖 「系統連線成功！愛之加速協議已注入！」',
        spareNotice: '💖 妳放走了小黑！小黑啟動愛之協議，輪椅動力輸出激增35%！',
        captureQuote: '⚡ 「過載關機……但我會帶著對妳的記憶重新開機的！」',
        captureNotice: '⚡ 少女按下輪椅電門：「過載就該被逮捕冷卻，乖乖拿分來！」'
      },
      {
        title: '「可惡！只差三公尺我就能繞過轉角了……！」',
        speech: '「但輸給妳我心甘情願！妳齊瀏海甩動的樣子到底要迷死誰？<br>少拿冷酷的眼神看我，妳心裡其實也有點動搖對吧？放我走的話，下次我會跑得更有挑戰性給妳追！」',
        prompt: '小黑擦了擦汗水，帶著自信又略顯頑皮的笑容直視著妳，妳的選擇是？',
        spareQuote: '💖 「謝啦！下次妳要是追不到我，我就反過來追妳喔！」',
        spareNotice: '💖 妳放走了小黑！小黑挑眉大笑：「下次換我追妳狂飆街頭！」',
        captureQuote: '⚡ 「可惡被逮了！但妳認真的眼神太帥，甘拜下風！」',
        captureNotice: '⚡ 少女面無表情：「動搖？你想多了，只是我的輪椅馬力夠大而已。」'
      },
      {
        title: '「追累了嗎？輪胎轉軸都發熱了吧？要不要休息一下？」',
        speech: '「我不是怕被抓，我是怕妳飆太急手腕會酸。妳總是那麼要強、那麼帥氣，但也偶爾讓我照顧妳一下嘛！<br>今天放過我，比賽結束後我請妳喝全城最香醇的熱可可！」',
        prompt: '小黑遞來關切的目光，完全忘了自己其實身處被追捕的處境中……',
        spareQuote: '💖 「熱可可我先去準備，妳先在街頭稱霸吧！」',
        spareNotice: '💖 妳放走了小黑！小黑溫暖揮手：「結束後熱可可管夠！」獲得極速祝福！',
        captureQuote: '⚡ 「被捕了我也要請妳喝！說話算話！」',
        captureNotice: '⚡ 少女神色自若：「先拿下這局優勝，飲料的事情打完再說！」'
      },
      {
        title: '「不用懷疑了，我喜歡妳！超喜歡的那種！」',
        speech: '「從頭到尾我都不是在逃跑，我只是在等妳追上來給我這記直球！<br>現在我人就在妳輪椅前，要抓要放全憑妳一句話，反正我的靈魂早就被妳扣押了！」',
        prompt: '小黑直球出擊毫無閃躲，四周空氣瞬間升溫，輪椅少女將如何回應？',
        spareQuote: '💖 「直球被接住了！今晚我的心只屬於妳一人！」',
        spareNotice: '💖 妳放走了小黑！小黑興奮大喊：「直球得分！」贈予愛之極速Buff！',
        captureQuote: '⚡ 「收到！靈魂扣押，人也是妳的了！」',
        captureNotice: '⚡ 少女乾淨俐落地蓋下逮捕戳記：「收到，靈魂扣押，分數歸我！」'
      }
    ];

    // Buttons
    this.btnChoiceSpare = document.getElementById('btn-choice-spare');
    this.btnChoiceCapture = document.getElementById('btn-choice-capture');

    // Stats Breakdown Elements
    this.finalScoreEl = document.getElementById('final-score');
    this.highScoreEl = document.getElementById('high-score-record');
    this.statKidsEl = document.getElementById('stat-kids');
    this.statKidsPtsEl = document.getElementById('stat-kids-pts');
    this.statAdultsEl = document.getElementById('stat-adults');
    this.statAdultsPtsEl = document.getElementById('stat-adults-pts');
    this.statEldersEl = document.getElementById('stat-elders');
    this.statEldersPtsEl = document.getElementById('stat-elders-pts');
    this.statXiaoHeiSparedEl = document.getElementById('stat-xiaohei-spared');
    this.statXiaoHeiSparedPtsEl = document.getElementById('stat-xiaohei-spared-pts');
    this.statXiaoHeiCapturedEl = document.getElementById('stat-xiaohei-captured');
    this.statXiaoHeiCapturedPtsEl = document.getElementById('stat-xiaohei-captured-pts');
    this.statMaxComboEl = document.getElementById('stat-max-combo');
    this.resultRankBadge = document.getElementById('result-rank-badge');
    this.resultSubtitle = document.getElementById('result-subtitle');

    // Player Nickname & Leaderboard DOM Elements
    this.playerName = localStorage.getItem('wheelchair_tag_player_name') || '輪椅少女玩家';
    this.playerNicknameInput = document.getElementById('player-nickname-input');
    this.pauseNicknameInput = document.getElementById('pause-nickname-input');
    this.quickNicknameInput = document.getElementById('quick-nickname-input');
    this.hudPlayerNameEl = document.getElementById('hud-player-name');
    this.resultPlayerNameEl = document.getElementById('result-player-name');
    this.leaderboardCurrentPlayerEl = document.getElementById('leaderboard-current-player');
    this.rankStatusTagEl = document.getElementById('rank-status-tag');
    this.modalLeaderboard = document.getElementById('modal-leaderboard');
    this.modalNicknamePrompt = document.getElementById('modal-nickname-prompt');
    this.leaderboardTbody = document.getElementById('leaderboard-tbody');

    this.defaultLeaderboard = []; // No AI bots; real players only!

    this.latestRecordId = null;

    // Systems
    this.sound = new SoundEngine();
    this.particles = new ParticleSystem();

    // Arena dimensions
    this.arenaWidth = 2600;
    this.arenaHeight = 2000;
    this.camera = { x: 0, y: 0 };

    // Game state: 'START', 'PLAYING', 'CONFESSION', 'PAUSED', 'GAMEOVER'
    this.state = 'START';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('wheelchair_tag_highscore') || '0', 10);
    this.gameDuration = 120; // 2 minutes
    this.timeRemaining = this.gameDuration;
    
    // Combo
    this.combo = 1.0;
    this.comboTimer = 0;
    this.comboDuration = 3.5;
    this.maxComboReached = 1.0;

    // Statistics record
    this.stats = {
      kidsTagged: 0,
      adultsTagged: 0,
      eldersTagged: 0,
      xiaoHeiSpared: 0,
      xiaoHeiCaptured: 0,
      hitByCounter: 0
    };

    // Pending target for confession modal
    this.pendingXiaoHei = null;
    this.pendingXiaoHeiIndex = -1;

    // Entities
    this.player = null;
    this.npcs = [];
    this.decorations = [];

    // Input state
    this.input = {
      moveX: 0,
      moveY: 0,
      dash: false,
      pointerActive: false,
      targetX: 0,
      targetY: 0
    };

    this.keys = {};
    this.lastTime = performance.now();

    this.syncPlayerNameUI();
    this.initWindow();
    this.generateDecorations();
    this.initEventListeners();
    this.setupTouchControls();

    requestAnimationFrame((t) => this.loop(t));
  }

  // --- Player Nickname Management ---
  syncPlayerNameUI() {
    if (this.playerNicknameInput) this.playerNicknameInput.value = this.playerName;
    if (this.pauseNicknameInput) this.pauseNicknameInput.value = this.playerName;
    if (this.quickNicknameInput) this.quickNicknameInput.value = this.playerName;
    if (this.hudPlayerNameEl) this.hudPlayerNameEl.textContent = this.playerName;
    if (this.resultPlayerNameEl) this.resultPlayerNameEl.textContent = this.playerName;
    if (this.leaderboardCurrentPlayerEl) this.leaderboardCurrentPlayerEl.textContent = this.playerName;
  }

  setPlayerName(newName, showPrompt = true) {
    if (!newName || !newName.trim()) {
      newName = '輪椅少女玩家';
    }
    this.playerName = newName.trim().slice(0, 12);
    localStorage.setItem('wheelchair_tag_player_name', this.playerName);
    this.syncPlayerNameUI();
    if (showPrompt) {
      this.showNotice(`👤 玩家代號已變更為「${this.playerName}」！`);
    }
  }

  openNicknamePrompt() {
    if (this.quickNicknameInput) {
      this.quickNicknameInput.value = this.playerName;
    }
    this.modalNicknamePrompt.classList.remove('hidden');
    setTimeout(() => {
      if (this.quickNicknameInput) {
        this.quickNicknameInput.focus();
        this.quickNicknameInput.select();
      }
    }, 80);
  }

  closeNicknamePrompt() {
    this.modalNicknamePrompt.classList.add('hidden');
  }

  // --- Leaderboard System ---
  getLeaderboard() {
    try {
      const saved = localStorage.getItem('wheelchair_tag_leaderboard');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Leaderboard parse error', e);
    }
    return [...this.defaultLeaderboard];
  }

  saveLeaderboard(list) {
    localStorage.setItem('wheelchair_tag_leaderboard', JSON.stringify(list));
  }

  resetLeaderboard() {
    this.saveLeaderboard(this.defaultLeaderboard);
    this.renderLeaderboard();
    this.showNotice('🏆 排行榜已重設為預設名單！');
  }

  recordGameScore(score, rank) {
    const list = this.getLeaderboard();
    const now = new Date();
    const dateStr = `${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')}`;
    const newRecordId = 'rec_' + Date.now();
    const newEntry = {
      id: newRecordId,
      name: this.playerName,
      score: score,
      rank: rank,
      date: dateStr,
      timestamp: Date.now()
    };

    list.push(newEntry);
    list.sort((a, b) => b.score - a.score);

    const rankPos = list.findIndex(item => item.id === newRecordId) + 1;
    const trimmed = list.slice(0, 10);
    this.saveLeaderboard(trimmed);

    return {
      recordId: newRecordId,
      rankPosition: rankPos,
      isTop10: rankPos <= 10
    };
  }

  renderLeaderboard(highlightId = null) {
    const list = this.getLeaderboard();
    if (!this.leaderboardTbody) return;
    this.leaderboardTbody.innerHTML = '';

    list.forEach((entry, idx) => {
      const tr = document.createElement('tr');
      const isCurrent = (highlightId && entry.id === highlightId) || (!highlightId && entry.name === this.playerName);
      if (isCurrent) {
        tr.classList.add('row-current-player');
      }

      let medal = '';
      if (idx === 0) medal = '<span class="rank-badge rank-gold">🥇 1</span>';
      else if (idx === 1) medal = '<span class="rank-badge rank-silver">🥈 2</span>';
      else if (idx === 2) medal = '<span class="rank-badge rank-bronze">🥉 3</span>';
      else medal = `<span class="rank-normal">#${idx + 1}</span>`;

      const gradeClass = 'grade-' + (entry.rank ? entry.rank.toLowerCase() : 'b');

      tr.innerHTML = `
        <td>${medal}</td>
        <td><strong>${this.escapeHTML(entry.name)}</strong> ${isCurrent ? '<small style="color:var(--color-cyan); font-weight:800;"> (妳)</small>' : ''}</td>
        <td class="glow-cyan" style="font-weight:800; font-family:'Outfit'">${entry.score} 分</td>
        <td><span class="grade-pill ${gradeClass}">${entry.rank}</span></td>
        <td style="color:var(--text-muted); font-size:11px">${entry.date || '--'}</td>
      `;
      this.leaderboardTbody.appendChild(tr);
    });
  }

  escapeHTML(str) {
    return String(str).replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  openLeaderboard(highlightId = null) {
    this.renderLeaderboard(highlightId);
    this.modalLeaderboard.classList.remove('hidden');
  }

  closeLeaderboard() {
    this.modalLeaderboard.classList.add('hidden');
  }

  initWindow() {
    const resize = () => {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();
  }

  generateDecorations() {
    this.decorations = [];
    for (let i = 0; i < 28; i++) {
      this.decorations.push({
        type: 'lamp',
        x: 100 + Math.random() * (this.arenaWidth - 200),
        y: 100 + Math.random() * (this.arenaHeight - 200),
        color: i % 2 === 0 ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 0, 119, 0.12)'
      });
    }
    for (let i = 0; i < 24; i++) {
      this.decorations.push({
        type: 'tree',
        x: 150 + Math.random() * (this.arenaWidth - 300),
        y: 150 + Math.random() * (this.arenaHeight - 300),
        radius: 28 + Math.random() * 16
      });
    }
    for (let i = 0; i < 16; i++) {
      this.decorations.push({
        type: 'bench',
        x: 120 + Math.random() * (this.arenaWidth - 240),
        y: 120 + Math.random() * (this.arenaHeight - 240),
        width: 48,
        height: 18,
        angle: Math.random() * Math.PI
      });
    }
  }

  startNewGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.timeRemaining = this.gameDuration;
    this.combo = 1.0;
    this.comboTimer = 0;
    this.maxComboReached = 1.0;

    this.stats = {
      kidsTagged: 0,
      adultsTagged: 0,
      eldersTagged: 0,
      xiaoHeiSpared: 0,
      xiaoHeiCaptured: 0,
      hitByCounter: 0
    };

    this.player = new WheelchairPlayer(this.arenaWidth / 2, this.arenaHeight / 2);
    this.npcs = [];
    this.spawnCrowd(28);

    this.modalStart.classList.add('hidden');
    this.modalPause.classList.add('hidden');
    this.modalGameOver.classList.add('hidden');
    this.modalConfession.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.minimapContainer.classList.remove('hidden');

    this.showNotice('🔥 齊瀏海長髮少女出擊！2分鐘極速抓人！');
    this.sound.startBGM();
  }

  spawnCrowd(count) {
    let hasXiaoHei = this.npcs.some(n => n.type === 'xiaohei');
    if (!hasXiaoHei) {
      const pos = this.getRandomSpawnPos();
      this.npcs.push(new XiaoHeiNPC(pos.x, pos.y));
    }

    while (this.npcs.length < count) {
      const pos = this.getRandomSpawnPos();
      const rand = Math.random();
      if (rand < 0.25) {
        this.npcs.push(new ChildNPC(pos.x, pos.y));
      } else if (rand < 0.82) {
        this.npcs.push(new AdultNPC(pos.x, pos.y));
      } else {
        this.npcs.push(new ElderNPC(pos.x, pos.y));
      }
    }
  }

  getRandomSpawnPos() {
    const margin = 100;
    let x, y, dist;
    do {
      x = margin + Math.random() * (this.arenaWidth - margin * 2);
      y = margin + Math.random() * (this.arenaHeight - margin * 2);
      dist = this.player ? Math.hypot(x - this.player.x, y - this.player.y) : 500;
    } while (dist < 260);
    return { x, y };
  }

  initEventListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Confession decision shortcuts: [1] = 放走, [2] = 逮捕
      if (this.state === 'CONFESSION') {
        if (e.key === '1') {
          this.handleSpareDecision();
        } else if (e.key === '2') {
          this.handleCaptureDecision();
        }
        return;
      }

      if (e.key === ' ' || e.key === 'Shift') {
        this.input.dash = true;
      }
      if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      if (e.key === ' ' || e.key === 'Shift') {
        this.input.dash = false;
      }
    });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (this.state !== 'PLAYING') return;
      this.input.pointerActive = true;
      this.updatePointerCoords(e);
    });

    window.addEventListener('pointermove', (e) => {
      if (this.input.pointerActive) {
        this.updatePointerCoords(e);
      }
    });

    window.addEventListener('pointerup', () => {
      this.input.pointerActive = false;
    });

    // Confession choices buttons
    this.btnChoiceSpare.addEventListener('click', () => {
      if (this.state === 'CONFESSION') {
        this.handleSpareDecision();
      }
    });

    this.btnChoiceCapture.addEventListener('click', () => {
      if (this.state === 'CONFESSION') {
        this.handleCaptureDecision();
      }
    });

    // Start / Restart / Pause Buttons
    document.getElementById('btn-start-game').addEventListener('click', () => {
      // Auto-save nickname from start input if changed
      if (this.playerNicknameInput && this.playerNicknameInput.value.trim()) {
        this.setPlayerName(this.playerNicknameInput.value, false);
      }
      this.sound.ensureContext();
      this.startNewGame();
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.startNewGame();
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('btn-resume').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('btn-restart-pause').addEventListener('click', () => {
      this.startNewGame();
    });

    const audioBtn = document.getElementById('btn-audio');
    audioBtn.addEventListener('click', () => {
      const muted = this.sound.toggleMute();
      document.getElementById('audio-icon').textContent = muted ? '🔇' : '🔊';
    });

    // --- Nickname Modification Listeners ---
    // 1. Start Screen
    const btnSaveStart = document.getElementById('btn-save-nickname-start');
    if (btnSaveStart && this.playerNicknameInput) {
      btnSaveStart.addEventListener('click', () => {
        this.setPlayerName(this.playerNicknameInput.value);
      });
      this.playerNicknameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.setPlayerName(this.playerNicknameInput.value);
        }
      });
    }

    // 2. Pause Screen
    const btnSavePause = document.getElementById('btn-save-nickname-pause');
    if (btnSavePause && this.pauseNicknameInput) {
      btnSavePause.addEventListener('click', () => {
        this.setPlayerName(this.pauseNicknameInput.value);
      });
      this.pauseNicknameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.setPlayerName(this.pauseNicknameInput.value);
        }
      });
    }

    // 3. HUD Player Badge (Quick Edit)
    const hudBadge = document.getElementById('hud-player-badge');
    if (hudBadge) {
      hudBadge.addEventListener('click', () => {
        this.openNicknamePrompt();
      });
    }

    // 4. Quick Nickname Prompt Dialog
    const btnConfirmQuick = document.getElementById('btn-confirm-quick-nickname');
    const btnCancelQuick = document.getElementById('btn-cancel-quick-nickname');
    if (btnConfirmQuick && this.quickNicknameInput) {
      btnConfirmQuick.addEventListener('click', () => {
        this.setPlayerName(this.quickNicknameInput.value);
        this.closeNicknamePrompt();
      });
      this.quickNicknameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          this.setPlayerName(this.quickNicknameInput.value);
          this.closeNicknamePrompt();
        }
      });
    }
    if (btnCancelQuick) {
      btnCancelQuick.addEventListener('click', () => {
        this.closeNicknamePrompt();
      });
    }

    // 5. Leaderboard Nickname Edit button
    const btnEditLeaderboard = document.getElementById('btn-edit-nickname-leaderboard');
    if (btnEditLeaderboard) {
      btnEditLeaderboard.addEventListener('click', () => {
        this.openNicknamePrompt();
      });
    }

    // --- Leaderboard Open / Close Listeners ---
    const btnOpenHud = document.getElementById('btn-open-leaderboard-hud');
    if (btnOpenHud) {
      btnOpenHud.addEventListener('click', () => {
        this.openLeaderboard();
      });
    }

    const btnOpenStart = document.getElementById('btn-show-leaderboard-start');
    if (btnOpenStart) {
      btnOpenStart.addEventListener('click', () => {
        this.openLeaderboard();
      });
    }

    const btnOpenPause = document.getElementById('btn-show-leaderboard-pause');
    if (btnOpenPause) {
      btnOpenPause.addEventListener('click', () => {
        this.openLeaderboard();
      });
    }

    const btnOpenGameOver = document.getElementById('btn-show-leaderboard-gameover');
    if (btnOpenGameOver) {
      btnOpenGameOver.addEventListener('click', () => {
        this.openLeaderboard(this.latestRecordId);
      });
    }

    const btnCloseLeaderboard = document.getElementById('btn-close-leaderboard');
    if (btnCloseLeaderboard) {
      btnCloseLeaderboard.addEventListener('click', () => {
        this.closeLeaderboard();
      });
    }

    const btnResetLeaderboard = document.getElementById('btn-reset-leaderboard');
    if (btnResetLeaderboard) {
      btnResetLeaderboard.addEventListener('click', () => {
        if (confirm('確定要將街頭排行榜重設為預設名單嗎？')) {
          this.resetLeaderboard();
        }
      });
    }
  }

  updatePointerCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    this.input.targetX = screenX + this.camera.x;
    this.input.targetY = screenY + this.camera.y;
  }

  setupTouchControls() {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const touchLayer = document.getElementById('touch-controls');
    if (isTouchDevice) {
      touchLayer.classList.remove('hidden');
    }

    const joystickZone = document.getElementById('virtual-joystick-zone');
    const joystickThumb = document.getElementById('joystick-thumb');
    let touchId = null;
    let baseCenter = { x: 0, y: 0 };

    joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      const rect = joystickZone.getBoundingClientRect();
      baseCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      handleJoystickMove(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          handleJoystickMove(touch.clientX, touch.clientY);
          break;
        }
      }
    }, { passive: false });

    const handleJoystickEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          joystickThumb.style.transform = `translate(-50%, -50%)`;
          this.input.moveX = 0;
          this.input.moveY = 0;
          break;
        }
      }
    };

    window.addEventListener('touchend', handleJoystickEnd);
    window.addEventListener('touchcancel', handleJoystickEnd);

    const handleJoystickMove = (clientX, clientY) => {
      const dx = clientX - baseCenter.x;
      const dy = clientY - baseCenter.y;
      const dist = Math.hypot(dx, dy);
      const maxRadius = 45;
      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(dy, dx);

      const thumbX = Math.cos(angle) * clampedDist;
      const thumbY = Math.sin(angle) * clampedDist;
      joystickThumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;

      this.input.moveX = (thumbX / maxRadius);
      this.input.moveY = (thumbY / maxRadius);
    };

    const dashBtn = document.getElementById('btn-touch-dash');
    dashBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.input.dash = true;
    }, { passive: false });
    dashBtn.addEventListener('touchend', () => {
      this.input.dash = false;
    });
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.modalPause.classList.remove('hidden');
      this.sound.stopBGM();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.modalPause.classList.add('hidden');
      this.sound.startBGM();
    }
  }

  showNotice(text) {
    this.floatingNotice.textContent = text;
    this.floatingNotice.classList.add('show');
    clearTimeout(this.noticeTimer);
    this.noticeTimer = setTimeout(() => {
      this.floatingNotice.classList.remove('show');
    }, 2400);
  }

  checkTagCollision(npc) {
    const dist = Math.hypot(this.player.x - npc.x, this.player.y - npc.y);
    return dist < (this.player.radius + npc.radius + 6);
  }

  // Handle Xiao Hei Catch -> Opens Interactive Decision Modal with Random Scenario
  openConfessionModal(npc, index) {
    this.state = 'CONFESSION';
    this.pendingXiaoHei = npc;
    this.pendingXiaoHeiIndex = index;
    this.sound.playXiaoHeiEncounter();

    // Pick a new scenario avoiding immediate repetition
    let scenarioIdx;
    do {
      scenarioIdx = Math.floor(Math.random() * this.confessionScenarios.length);
    } while (scenarioIdx === this.lastConfessionIndex && this.confessionScenarios.length > 1);
    this.lastConfessionIndex = scenarioIdx;
    this.currentConfession = this.confessionScenarios[scenarioIdx];

    // Update modal DOM text dynamically
    if (this.confessionTitleEl) this.confessionTitleEl.textContent = this.currentConfession.title;
    if (this.speechQuoteEl) this.speechQuoteEl.innerHTML = this.currentConfession.speech;
    if (this.confessionPromptEl) this.confessionPromptEl.textContent = this.currentConfession.prompt;

    this.modalConfession.classList.remove('hidden');
  }

  // Decision 1: 心軟放走他
  handleSpareDecision() {
    this.modalConfession.classList.add('hidden');
    this.state = 'PLAYING';

    const npc = this.pendingXiaoHei;
    const pts = Math.round(50 * this.combo);
    this.score += pts;
    this.stats.xiaoHeiSpared++;

    // Player gains Love Blessing Speed Buff & Dash reset!
    this.player.applyLoveBlessing();
    this.sound.playLoveBlessing();

    // Spurt hearts & floating text
    for (let i = 0; i < 15; i++) {
      this.particles.addHeart(npc.x + (Math.random() - 0.5) * 40, npc.y + (Math.random() - 0.5) * 40);
    }

    const spareQuote = this.currentConfession ? this.currentConfession.spareQuote : '💖 「太好了！我會變得更強再來追妳！」';
    const spareNotice = this.currentConfession ? this.currentConfession.spareNotice : '💖 妳放走了小黑！獲得愛之極速Buff！';

    this.particles.addFloatingText(npc.x, npc.y - 35, `+${pts} ${spareQuote}`, '#ff4d8d', 22);
    this.showNotice(spareNotice);

    // Remove Xiao Hei and respawn offscreen
    this.npcs.splice(this.pendingXiaoHeiIndex, 1);
    this.spawnCrowd(28);
    this.pendingXiaoHei = null;
    this.pendingXiaoHeiIndex = -1;
  }

  // Decision 2: 無情逮捕
  handleCaptureDecision() {
    this.modalConfession.classList.add('hidden');
    this.state = 'PLAYING';

    const npc = this.pendingXiaoHei;
    const pts = Math.round(30 * this.combo);
    this.score += pts;
    this.stats.xiaoHeiCaptured++;

    // Refresh combo & reset dash
    this.combo = Math.min(3.0, +(this.combo + 0.3).toFixed(1));
    this.comboTimer = this.comboDuration;
    if (this.combo > this.maxComboReached) {
      this.maxComboReached = this.combo;
    }
    this.player.resetDash();
    this.sound.playTag(4);

    const captureQuote = this.currentConfession ? this.currentConfession.captureQuote : '⚡ 「被逮捕也是一種幸福！」';
    const captureNotice = this.currentConfession ? this.currentConfession.captureNotice : '⚡ 輪椅少女冷酷逮捕小黑！';

    this.particles.addTagSparks(npc.x, npc.y, '#c084fc', 30);
    this.particles.addFloatingText(npc.x, npc.y - 35, `+${pts} ${captureQuote}`, '#00f0ff', 22);
    this.showNotice(captureNotice);

    this.npcs.splice(this.pendingXiaoHeiIndex, 1);
    this.spawnCrowd(28);
    this.pendingXiaoHei = null;
    this.pendingXiaoHeiIndex = -1;
  }

  handleTag(npc, index) {
    // If it's Xiao Hei, open the confession modal!
    if (npc.type === 'xiaohei') {
      this.openConfessionModal(npc, index);
      return;
    }

    const pts = Math.round(npc.points * this.combo);
    this.score += pts;

    this.combo = Math.min(3.0, +(this.combo + 0.2).toFixed(1));
    this.comboTimer = this.comboDuration;
    if (this.combo > this.maxComboReached) {
      this.maxComboReached = this.combo;
    }

    let label = `+${pts}`;
    if (npc.type === 'child') {
      this.stats.kidsTagged++;
      this.particles.addTagSparks(npc.x, npc.y, '#10b981', 14);
      this.particles.addFloatingText(npc.x, npc.y - 20, label, '#10b981', 20);
      this.sound.playTag(Math.floor(this.combo * 2));
    } else if (npc.type === 'adult') {
      this.stats.adultsTagged++;
      this.particles.addTagSparks(npc.x, npc.y, '#00f0ff', 16);
      this.particles.addFloatingText(npc.x, npc.y - 20, label, '#00f0ff', 22);
      this.sound.playTag(Math.floor(this.combo * 2));
    } else if (npc.type === 'elder') {
      this.stats.eldersTagged++;
      this.particles.addTagSparks(npc.x, npc.y, '#ffd000', 24);
      this.particles.addFloatingText(npc.x, npc.y - 28, `${label} 老人突破！`, '#ffd000', 26);
      this.sound.playElderTag();
    }

    this.npcs.splice(index, 1);
    this.spawnCrowd(28);
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.sound.stopBGM();

    let isNewHigh = false;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('wheelchair_tag_highscore', this.highScore.toString());
      isNewHigh = true;
    }

    let rank = 'D';
    let rankColor = '#94a3b8';
    let subtitle = '繼續加油！街頭需要更多練習！';
    if (this.score >= 260) {
      rank = 'SSS';
      rankColor = '#ff0077';
      subtitle = '神級傳奇！齊瀏海黑長髮少女橫掃全場！';
    } else if (this.score >= 190) {
      rank = 'S';
      rankColor = '#ffd000';
      subtitle = '街頭傳奇！俐落敏捷的頂尖抓人王者！';
    } else if (this.score >= 130) {
      rank = 'A';
      rankColor = '#00f0ff';
      subtitle = '表現極佳！老人都被妳甩在身後！';
    } else if (this.score >= 80) {
      rank = 'B';
      rankColor = '#10b981';
      subtitle = '不錯的成績！節奏感十足！';
    } else if (this.score >= 40) {
      rank = 'C';
      rankColor = '#fb923c';
      subtitle = '初試身手，逐漸掌握輪椅飄移手感！';
    }

    this.resultRankBadge.textContent = rank;
    this.resultRankBadge.style.color = rankColor;
    this.resultRankBadge.style.borderColor = rankColor;
    this.resultSubtitle.textContent = subtitle;

    this.finalScoreEl.textContent = this.score;
    this.highScoreEl.textContent = isNewHigh ? `🎉 刷新歷史最高紀錄：${this.highScore}` : `歷史最高紀錄：${this.highScore}`;

    // Record score into leaderboard with current player nickname
    const recordResult = this.recordGameScore(this.score, rank);
    this.latestRecordId = recordResult.recordId;

    if (this.resultPlayerNameEl) {
      this.resultPlayerNameEl.textContent = this.playerName;
    }

    if (this.rankStatusTagEl) {
      if (recordResult.isTop10) {
        this.rankStatusTagEl.textContent = `🎉 榮登街頭排行榜第 ${recordResult.rankPosition} 名！`;
        this.rankStatusTagEl.style.background = '#ffd000';
        this.rankStatusTagEl.style.color = '#000';
      } else {
        this.rankStatusTagEl.textContent = `第 ${recordResult.rankPosition} 名（未進前十）`;
        this.rankStatusTagEl.style.background = '#64748b';
        this.rankStatusTagEl.style.color = '#fff';
      }
    }

    this.statKidsEl.textContent = `${this.stats.kidsTagged} 人`;
    this.statKidsPtsEl.textContent = `+${this.stats.kidsTagged * 1} 分`;

    this.statAdultsEl.textContent = `${this.stats.adultsTagged} 人`;
    this.statAdultsPtsEl.textContent = `+${this.stats.adultsTagged * 2} 分`;

    this.statEldersEl.textContent = `${this.stats.eldersTagged} 人`;
    this.statEldersPtsEl.textContent = `+${this.stats.eldersTagged * 20} 分`;

    this.statXiaoHeiSparedEl.textContent = `${this.stats.xiaoHeiSpared} 次`;
    this.statXiaoHeiSparedPtsEl.textContent = `+${this.stats.xiaoHeiSpared * 50} 分`;

    this.statXiaoHeiCapturedEl.textContent = `${this.stats.xiaoHeiCaptured} 次`;
    this.statXiaoHeiCapturedPtsEl.textContent = `+${this.stats.xiaoHeiCaptured * 30} 分`;

    this.statMaxComboEl.textContent = `x${this.maxComboReached.toFixed(1)}`;

    this.modalGameOver.classList.remove('hidden');
  }

  update(dt) {
    if (this.state !== 'PLAYING') return;

    // 1. Countdown timer
    this.timeRemaining -= dt;
    if (this.timeRemaining <= 0) {
      this.timeRemaining = 0;
      this.gameOver();
      return;
    }

    if (this.timeRemaining <= 10 && Math.floor(this.timeRemaining + dt) !== Math.floor(this.timeRemaining)) {
      this.sound.playBeep(this.timeRemaining <= 3);
    }

    // 2. Combo timer
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.combo = 1.0;
      }
    }

    // 3. Process Keyboard movement input
    if (!this.input.pointerActive && this.input.moveX === 0 && this.input.moveY === 0) {
      let kx = 0;
      let ky = 0;
      if (this.keys['w'] || this.keys['arrowup']) ky -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) ky += 1;
      if (this.keys['a'] || this.keys['arrowleft']) kx -= 1;
      if (this.keys['d'] || this.keys['arrowright']) kx += 1;
      
      const len = Math.hypot(kx, ky);
      if (len > 0) {
        this.input.moveX = kx / len;
        this.input.moveY = ky / len;
      }
    }

    // 4. Update Player
    this.player.update(dt, this.input, this.particles, this.sound);

    const pMargin = 30;
    this.player.x = Math.max(pMargin, Math.min(this.arenaWidth - pMargin, this.player.x));
    this.player.y = Math.max(pMargin, Math.min(this.arenaHeight - pMargin, this.player.y));

    if (!this.input.pointerActive) {
      this.input.moveX = 0;
      this.input.moveY = 0;
    }

    // 5. Update NPCs & Collisions
    for (let i = this.npcs.length - 1; i >= 0; i--) {
      const npc = this.npcs[i];
      npc.update(dt, this.player, this.arenaWidth, this.arenaHeight, this.sound, this.particles);

      if (this.checkTagCollision(npc)) {
        this.handleTag(npc, i);
        if (this.state === 'CONFESSION') {
          break; // Stop loop if entering confession modal
        }
      }
    }

    // 6. Update Particles
    this.particles.update();

    // 7. Update Camera smoothly
    const targetCamX = this.player.x - this.canvas.width / 2;
    const targetCamY = this.player.y - this.canvas.height / 2;
    this.camera.x += (targetCamX - this.camera.x) * 0.1;
    this.camera.y += (targetCamY - this.camera.y) * 0.1;

    this.camera.x = Math.max(0, Math.min(this.arenaWidth - this.canvas.width, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.arenaHeight - this.canvas.height, this.camera.y));

    // 8. Update HUD DOM
    this.updateHUD();
  }

  updateHUD() {
    this.scoreDisplay.textContent = this.score;

    const mins = Math.floor(this.timeRemaining / 60);
    const secs = Math.floor(this.timeRemaining % 60);
    this.timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    if (this.timeRemaining <= 30) {
      this.timerDisplay.classList.add('timer-urgent');
    } else {
      this.timerDisplay.classList.remove('timer-urgent');
    }

    this.comboDisplay.textContent = `x${this.combo.toFixed(1)}`;
    const comboRatio = Math.max(0, this.comboTimer / this.comboDuration);
    this.comboBarFill.style.width = `${comboRatio * 100}%`;

    const dashRatio = 1 - (this.player.dashCooldown / this.player.dashCooldownMax);
    this.dashBarFill.style.width = `${dashRatio * 100}%`;
    if (this.player.dashCooldown <= 0) {
      this.dashStatus.textContent = this.player.loveSpeedBuffTimer > 0 ? 'LOVE BOOST!' : 'READY';
      this.dashStatus.style.color = this.player.loveSpeedBuffTimer > 0 ? '#ff4d8d' : 'var(--color-cyan)';
    } else {
      this.dashStatus.textContent = `${this.player.dashCooldown.toFixed(1)}s`;
      this.dashStatus.style.color = 'var(--text-muted)';
    }
  }

  renderMinimap() {
    const w = this.minimapCanvas.width;
    const h = this.minimapCanvas.height;
    const ctx = this.minimapCtx;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#080a14';
    ctx.fillRect(0, 0, w, h);

    const scaleX = w / this.arenaWidth;
    const scaleY = h / this.arenaHeight;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.camera.x * scaleX, this.camera.y * scaleY, this.canvas.width * scaleX, this.canvas.height * scaleY);

    for (const npc of this.npcs) {
      const nx = npc.x * scaleX;
      const ny = npc.y * scaleY;
      ctx.beginPath();
      if (npc.type === 'elder') {
        ctx.fillStyle = '#ffd000';
        ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (npc.type === 'xiaohei') {
        ctx.fillStyle = '#c084fc';
        ctx.arc(nx, ny, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.arc(nx, ny, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (this.player) {
      const px = this.player.x * scaleX;
      const py = this.player.y * scaleY;
      ctx.fillStyle = this.player.loveSpeedBuffTimer > 0 ? '#ff4d8d' : '#00f0ff';
      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderEnvironment();
    this.particles.render(this.ctx, this.camera);

    for (const npc of this.npcs) {
      npc.render(this.ctx, this.camera);
    }

    if (this.player) {
      this.player.render(this.ctx, this.camera);
    }

    if (this.state === 'PLAYING' || this.state === 'CONFESSION') {
      this.renderMinimap();
    }
  }

  renderEnvironment() {
    const ctx = this.ctx;
    const cam = this.camera;

    ctx.fillStyle = '#0c0f1d';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const gridSize = 100;
    const startX = -(cam.x % gridSize);
    const startY = -(cam.y % gridSize);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < this.canvas.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
    }
    for (let y = startY; y < this.canvas.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(this.canvas.width, y);
    }
    ctx.stroke();

    const bx = -cam.x;
    const by = -cam.y;
    const bw = this.arenaWidth;
    const bh = this.arenaHeight;

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
    ctx.lineWidth = 6;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = 'rgba(0, 240, 255, 0.03)';
    ctx.fillRect(bx, by, bw, bh);

    for (const dec of this.decorations) {
      const dx = dec.x - cam.x;
      const dy = dec.y - cam.y;

      if (dx < -100 || dx > this.canvas.width + 100 || dy < -100 || dy > this.canvas.height + 100) continue;

      if (dec.type === 'lamp') {
        ctx.fillStyle = dec.color;
        ctx.beginPath();
        ctx.arc(dx, dy, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(dx, dy, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (dec.type === 'tree') {
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.arc(dx, dy, dec.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (dec.type === 'bench') {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(dec.angle);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-dec.width / 2, -dec.height / 2, dec.width, dec.height);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(-dec.width / 2, -dec.height / 2, dec.width, dec.height);
        ctx.restore();
      }
    }
  }

  loop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new WheelchairTagGame();
});
