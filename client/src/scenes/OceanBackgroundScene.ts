import Phaser from 'phaser';

export class OceanBackgroundScene extends Phaser.Scene {
  private W = 0;
  private H = 0;
  private HORIZON = 0;

  private starGraphics!: Phaser.GameObjects.Graphics;
  private seaGraphics!: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private shipGraphics!: Phaser.GameObjects.Graphics;

  private stars: { x: number; y: number; size: number; baseAlpha: number; phase: number; speed: number }[] = [];
  private glowTime = 0;
  private shootingStars: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  private shootingTimer = 0;
  private shipBob = 0;

  constructor() { super({ key: 'OceanBackgroundScene' }); }

  create(): void {
    this.W = this.cameras.main.width;
    this.H = this.cameras.main.height;
    this.HORIZON = Math.floor(this.H * 0.62);

    this.drawStaticBg();
    this.initStars();
    this.drawIslands();

    this.glowGraphics = this.add.graphics();
    this.seaGraphics  = this.add.graphics();
    this.shipGraphics = this.add.graphics();
    this.starGraphics = this.add.graphics();
  }

  private drawStaticBg(): void {
    const { W, H, HORIZON } = this;

    // Ciel
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x01030A, 0x01030A, 0x05101E, 0x05101E, 1);
    sky.fillRect(0, 0, W, HORIZON + 2);

    // PAS de rectangle de mer statique — la mer est entièrement gérée par drawSea()

    // Lune
    const moon = this.add.graphics();
    moon.fillStyle(0xEDE3BB, 0.95);
    moon.fillCircle(W * 0.76, H * 0.13, 28);
    moon.fillStyle(0x01030A, 1);
    moon.fillCircle(W * 0.76 + 11, H * 0.13 - 9, 23);
    for (let r = 65; r > 28; r -= 3) {
      moon.fillStyle(0xDDD0A0, 0.005);
      moon.fillCircle(W * 0.76, H * 0.13, r);
    }
    // Reflet lune
    const ref = this.add.graphics();
    for (let i = 0; i < 30; i++) {
      ref.fillStyle(0xDDD0A0, 0.013 - i * 0.0004);
      ref.fillEllipse(W * 0.76, HORIZON + 8 + i * 7, 38 - i * 0.5, 5);
    }
  }

  private initStars(): void {
    const { W, HORIZON } = this;
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x:         Math.floor(Math.random() * W),
        y:         Math.floor(Math.random() * (HORIZON - 10)),
        size:      Math.random() < 0.1 ? 2 : 1,
        baseAlpha: 0.4 + Math.random() * 0.6,
        phase:     Math.random() * Math.PI * 2,
        speed:     0.4 + Math.random() * 0.8,
      });
    }
  }

  private drawStars(time: number): void {
    this.starGraphics.clear();
    for (const s of this.stars) {
      const alpha = s.baseAlpha + Math.sin(time * 0.001 * s.speed + s.phase) * 0.2;
      this.starGraphics.fillStyle(0xF0EAD6, alpha);
      this.starGraphics.fillRect(s.x, s.y, s.size, s.size);
    }
    for (const ss of this.shootingStars) {
      this.starGraphics.lineStyle(1, 0xFFFFEE, ss.life * 0.7);
      this.starGraphics.lineBetween(ss.x, ss.y, ss.x - ss.vx * 14, ss.y - ss.vy * 14);
    }
  }

  private drawIslands(): void {
    const { W, H, HORIZON } = this;
    const g = this.add.graphics();
    const BASE = HORIZON - 18;

    g.fillStyle(0x020609, 1);
    g.fillTriangle(W * 0.04, BASE, W * 0.16, BASE - 52, W * 0.28, BASE);
    g.fillRect(W * 0.04, BASE, W * 0.24, H - BASE);

    g.fillStyle(0x010407, 1);
    const trees: [number, number][] = [
      [W * 0.09, 28], [W * 0.13, 44], [W * 0.17, 36], [W * 0.21, 26],
    ];
    for (const [tx, th] of trees) {
      g.fillRect(tx - 1, BASE - th, 3, th);
      g.fillTriangle(tx, BASE - th - 14, tx - 6, BASE - th + 2, tx + 6, BASE - th + 2);
    }

    g.fillStyle(0x020609, 1);
    g.fillTriangle(W * 0.80, BASE, W * 0.87, BASE - 36, W * 0.96, BASE);
    g.fillRect(W * 0.80, BASE, W * 0.16, H - BASE);
  }

  private drawShip(bobY: number): void {
    const { W, HORIZON } = this;
    const g = this.shipGraphics;
    g.clear();

    const sx = W * 0.97 + 42;
    const sy = HORIZON - 2 + bobY;

    g.fillStyle(0x1A0A03, 1);
    g.fillTriangle(sx - 28, sy, sx + 28, sy, sx + 22, sy + 14);
    g.fillTriangle(sx - 28, sy, sx - 22, sy + 14, sx + 22, sy + 14);
    g.fillRect(sx - 22, sy + 14, 44, 5);
    g.lineStyle(1, 0x8B6914, 0.7);
    g.lineBetween(sx - 22, sy + 14, sx + 22, sy + 14);
    g.fillStyle(0x2E1507, 1);
    g.fillRect(sx - 1, sy - 48, 3, 48);
    g.fillRect(sx - 20, sy - 42, 40, 2);
    g.fillStyle(0xD4B483, 0.85);
    g.fillRect(sx - 18, sy - 42, 36, 28);
    g.fillStyle(0xC0141A, 1);
    g.fillRect(sx - 18, sy - 30, 36, 5);
    g.fillRect(sx - 4,  sy - 42, 5, 28);
    g.fillStyle(0xD4B483, 0.7);
    g.fillRect(sx - 18, sy - 48, 12, 10);
    g.lineStyle(2, 0x2E1507, 1);
    g.lineBetween(sx - 28, sy, sx - 42, sy - 16);
    g.fillStyle(0xC0141A, 0.9);
    g.fillTriangle(sx + 2, sy - 48, sx + 14, sy - 44, sx + 2, sy - 40);
    for (let i = 1; i <= 6; i++) {
      g.fillStyle(0x1A0A03, 0.07 - i * 0.01);
      g.fillRect(sx - 22 + i, sy + 18 + i * 2, 44 - i * 2, 3);
    }
  }

  private waveY(x: number, t: number): number {
    return Math.sin(x * 0.018 + t * 1.4)        * 5
         + Math.sin(x * 0.045 + t * 2.1 + 1.2)  * 2.5
         + Math.sin(x * 0.09  + t * 3.0 + 2.4)  * 1.2;
  }

  private drawSea(time: number): void {
    const { W, H, HORIZON } = this;
    const g = this.seaGraphics;
    g.clear();
    const t = time * 0.001;
    const step = 6;

    // ── 1. Mer : UN SEUL polygon du bord à bord, sans aucun rectangle statique dessous ──
    // On utilise fillGradientStyle pour avoir le dégradé surface→profondeur.
    // Mais fillGradientStyle + fillPoints ne fonctionnent pas ensemble dans Phaser.
    // Solution : 3 bandes horizontales chevauchées, chacune avec son polygon,
    //            en utilisant le MEME contour de vague — donc aucune ligne visible.

    // Bande surface (bleu moyen)
    const surface: Phaser.Math.Vector2[] = [];
    surface.push(new Phaser.Math.Vector2(0, H));
    for (let x = 0; x <= W; x += step) {
      surface.push(new Phaser.Math.Vector2(x, HORIZON + this.waveY(x, t)));
    }
    surface.push(new Phaser.Math.Vector2(W, H));
    g.fillStyle(0x0D3352, 1);
    g.fillPoints(surface, true);

    // Bande mi-profondeur (bleu plus froid)
    const mid: Phaser.Math.Vector2[] = [];
    mid.push(new Phaser.Math.Vector2(0, H));
    for (let x = 0; x <= W; x += step) {
      mid.push(new Phaser.Math.Vector2(x, HORIZON + this.waveY(x, t) + 30));
    }
    mid.push(new Phaser.Math.Vector2(W, H));
    g.fillStyle(0x081E30, 0.75);
    g.fillPoints(mid, true);

    // Bande profondeur (quasi noir)
    const deep: Phaser.Math.Vector2[] = [];
    deep.push(new Phaser.Math.Vector2(0, H));
    for (let x = 0; x <= W; x += step) {
      deep.push(new Phaser.Math.Vector2(x, HORIZON + this.waveY(x, t) + 70));
    }
    deep.push(new Phaser.Math.Vector2(W, H));
    g.fillStyle(0x030C14, 0.85);
    g.fillPoints(deep, true);

    // ── 2. Ligne de surface lumineuse ────────────────────────────────────────
    g.lineStyle(1.5, 0x68C8E8, 0.35);
    g.beginPath();
    for (let x = 0; x <= W; x += step) {
      const y = HORIZON + this.waveY(x, t);
      x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.strokePath();

    // ── 3. Écume sur crêtes ────────────────────────────────────────────────
    for (let x = 0; x < W; x += step) {
      const w = this.waveY(x, t);
      if (w < -3.5) {
        g.fillStyle(0xCCEEFF, 0.07 + ((-w - 3.5) / 1.5) * 0.1);
        g.fillRect(x, HORIZON + w, step, 1);
      }
    }

    // ── 4. Shimmer : reflets brillants animés ─────────────────────────────────
    for (let i = 0; i < 22; i++) {
      const rx  = (W * 0.15 + i * 46 + Math.sin(t * 0.8 + i * 0.9) * 28) % W;
      const ry  = HORIZON + 12 + i * 9 + Math.sin(t * 1.3 + i * 0.5) * 5;
      const len = 8 + i * 1.5 + Math.sin(t * 1.5 + i) * 4;
      const a   = 0.06 + Math.abs(Math.sin(t * 2.0 + i * 0.7)) * 0.08;
      if (ry < H - 8) {
        g.fillStyle(0xAADDFF, a);
        g.fillRect(rx, ry, len, 1);
        // Reflet double (plus court au-dessous) pour effet brillant
        g.fillStyle(0xAADDFF, a * 0.4);
        g.fillRect(rx + 2, ry + 2, len * 0.6, 1);
      }
    }
  }

  private drawOnePieceGlow(): void {
    const { W, HORIZON } = this;
    this.glowGraphics.clear();
    const cx = W * 0.52;
    const cy = HORIZON;
    const pulse  = Math.sin(this.glowTime * 1.6) * 0.5 + 0.5;
    const pulse2 = Math.sin(this.glowTime * 0.8 + 1.5) * 0.5 + 0.5;

    const ambW = 100 + pulse * 40;
    for (let r = ambW; r > 0; r -= 5) {
      this.glowGraphics.fillStyle(0xFFD700, 0.006 * pulse * (r / ambW));
      this.glowGraphics.fillEllipse(cx, cy, r * 2.5, r * 0.45);
    }
    const haloR = 22 + pulse * 12;
    for (let r = haloR; r > 0; r -= 2) {
      this.glowGraphics.fillStyle(0xFFD700, 0.025 * (r / haloR) * pulse);
      this.glowGraphics.fillCircle(cx, cy, r);
    }
    const innerR = 5 + pulse * 4;
    for (let r = innerR; r > 0; r--) {
      this.glowGraphics.fillStyle(0xFFFFFF, 0.2 * (r / innerR) * (0.5 + pulse * 0.5));
      this.glowGraphics.fillCircle(cx, cy, r);
    }
    this.glowGraphics.fillStyle(0xFFFDE8, 0.75 + pulse * 0.25);
    this.glowGraphics.fillCircle(cx, cy, 2 + pulse * 1.5);
    if (pulse2 > 0.65) {
      const len = (pulse2 - 0.65) / 0.35 * 18;
      const a   = (pulse2 - 0.65) / 0.35 * 0.5;
      this.glowGraphics.lineStyle(1, 0xFFFFCC, a);
      this.glowGraphics.lineBetween(cx - len, cy, cx + len, cy);
      this.glowGraphics.lineBetween(cx, cy - len, cx, cy + len);
    }
    const refH = 35 + pulse * 18;
    for (let i = 0; i < refH; i++) {
      this.glowGraphics.fillStyle(0xFFD700, (1 - i / refH) * 0.05 * pulse);
      this.glowGraphics.fillRect(cx - 1, cy + i, 2, 2);
    }
  }

  private updateShootingStars(delta: number): void {
    this.shootingTimer += delta;
    if (this.shootingTimer > 9000 + Math.random() * 7000) {
      this.shootingTimer = 0;
      const angle = -(0.25 + Math.random() * 0.35);
      const spd = 5 + Math.random() * 3;
      this.shootingStars.push({
        x: Math.random() * this.W * 0.65,
        y: Math.random() * this.HORIZON * 0.45,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1,
      });
    }
    this.shootingStars = this.shootingStars.filter(ss => {
      ss.x    += ss.vx * delta * 0.055;
      ss.y    += ss.vy * delta * 0.055;
      ss.life -= delta * 0.0018;
      return ss.life > 0 && ss.x < this.W && ss.y < this.HORIZON;
    });
  }

  update(time: number, delta: number): void {
    this.glowTime += delta * 0.001;
    this.shipBob   = Math.sin(time * 0.0012) * 2.5;
    this.drawSea(time);
    this.drawOnePieceGlow();
    this.drawShip(this.shipBob);
    this.drawStars(time);
    this.updateShootingStars(delta);
  }
}
