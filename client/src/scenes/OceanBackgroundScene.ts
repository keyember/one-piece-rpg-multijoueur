import Phaser from 'phaser';

export class OceanBackgroundScene extends Phaser.Scene {
  private W = 0;
  private H = 0;
  private HORIZON = 0;

  private starGraphics!: Phaser.GameObjects.Graphics;
  private seaGraphics!: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private shipGraphics!: Phaser.GameObjects.Graphics;
  private skyGraphics!: Phaser.GameObjects.Graphics;
  private starMask!: Phaser.Display.Masks.GeometryMask;

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

    this.skyGraphics = this.add.graphics();
    this.drawSky();

    // Îles dessinées AVANT le mask des étoiles
    this.drawIslands();

    this.glowGraphics = this.add.graphics();
    this.seaGraphics  = this.add.graphics();
    this.shipGraphics = this.add.graphics();

    // Étoiles : graphics créé EN DERNIER pour être au-dessus des îles visuellement
    // mais le mask les clip strictement au-dessus de l'horizon - 30px de marge
    this.starGraphics = this.add.graphics();
    this.rebuildStarMask();
    this.initStars();
  }

  private rebuildStarMask(): void {
    // Détruire l'ancien mask si existant
    if (this.starMask) {
      this.starMask.destroy();
    }
    const maskShape = this.make.graphics({ x: 0, y: 0, add: false });
    maskShape.fillStyle(0xffffff);
    // On monte le clip de 30px sous l'horizon pour couvrir les crêtes des îles
    maskShape.fillRect(0, 0, this.W, this.HORIZON - 30);
    this.starMask = maskShape.createGeometryMask();
    this.starGraphics.setMask(this.starMask);
  }

  private drawSky(): void {
    const { W, H, HORIZON } = this;
    const g = this.skyGraphics;
    g.clear();

    const top = { r: 0x01, g: 0x02, b: 0x08 };
    const bot = { r: 0x03, g: 0x09, b: 0x1A };
    const steps = 80;
    for (let i = 0; i < steps; i++) {
      const ratio = i / (steps - 1);
      const r  = Math.round(top.r + (bot.r - top.r) * ratio);
      const gr = Math.round(top.g + (bot.g - top.g) * ratio);
      const b  = Math.round(top.b + (bot.b - top.b) * ratio);
      g.fillStyle((r << 16) | (gr << 8) | b, 1);
      const y0 = Math.floor(i * HORIZON / steps);
      const y1 = Math.floor((i + 1) * HORIZON / steps) + 1;
      g.fillRect(0, y0, W, y1 - y0);
    }

    // Lune croissant
    g.fillStyle(0xEDE3BB, 0.92);
    g.fillCircle(W * 0.76, H * 0.13, 28);
    const moonBgRatio = (H * 0.13) / HORIZON;
    const moonBgR = Math.round(top.r + (bot.r - top.r) * moonBgRatio);
    const moonBgG = Math.round(top.g + (bot.g - top.g) * moonBgRatio);
    const moonBgB = Math.round(top.b + (bot.b - top.b) * moonBgRatio);
    g.fillStyle((moonBgR << 16) | (moonBgG << 8) | moonBgB, 1);
    g.fillCircle(W * 0.76 + 11, H * 0.13 - 9, 23);
    for (let r = 70; r > 28; r -= 3) {
      g.fillStyle(0xD8CC98, 0.004);
      g.fillCircle(W * 0.76, H * 0.13, r);
    }

    // Reflet lune
    for (let i = 0; i < 32; i++) {
      const a = (0.022 - i * 0.0006) * Math.max(0, 1 - i / 32);
      g.fillStyle(0xC8B870, a);
      g.fillEllipse(W * 0.76, HORIZON + 6 + i * 8, 22 - i * 0.4, 4);
    }
  }

  private initStars(): void {
    const { W, HORIZON } = this;
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x:         Math.floor(Math.random() * W),
        y:         Math.floor(Math.random() * (HORIZON - 50)),
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

    g.fillStyle(0x010406, 1);
    g.fillTriangle(W * 0.04, BASE, W * 0.16, BASE - 52, W * 0.28, BASE);
    g.fillRect(W * 0.04, BASE, W * 0.24, H - BASE);

    g.fillStyle(0x010305, 1);
    const trees: [number, number][] = [
      [W * 0.09, 28], [W * 0.13, 44], [W * 0.17, 36], [W * 0.21, 26],
    ];
    for (const [tx, th] of trees) {
      g.fillRect(tx - 1, BASE - th, 3, th);
      g.fillTriangle(tx, BASE - th - 14, tx - 6, BASE - th + 2, tx + 6, BASE - th + 2);
    }

    g.fillStyle(0x010406, 1);
    g.fillTriangle(W * 0.80, BASE, W * 0.87, BASE - 36, W * 0.96, BASE);
    g.fillRect(W * 0.80, BASE, W * 0.16, H - BASE);
  }

  private drawShip(bobY: number): void {
    const { W, HORIZON } = this;
    const g = this.shipGraphics;
    g.clear();

    const sx = W * 0.73;
    const sy = HORIZON - 2 + bobY;

    g.fillStyle(0x1A0A02, 1);
    g.fillPoints([
      new Phaser.Math.Vector2(sx - 32, sy),
      new Phaser.Math.Vector2(sx + 32, sy),
      new Phaser.Math.Vector2(sx + 26, sy + 16),
      new Phaser.Math.Vector2(sx - 26, sy + 16),
    ], true);
    g.fillStyle(0x2A1004, 1);
    g.fillRect(sx - 30, sy - 4, 60, 6);
    g.lineStyle(1, 0x7A5810, 0.7);
    g.lineBetween(sx - 26, sy + 16, sx + 26, sy + 16);

    g.fillStyle(0x2A1004, 1);
    g.fillRect(sx - 1, sy - 60, 3, 60);
    g.fillRect(sx - 22, sy - 54, 44, 2);
    g.fillRect(sx - 18, sy - 34, 36, 2);
    g.fillRect(sx - 22, sy - 30, 3, 28);
    g.fillRect(sx - 30, sy - 26, 20, 2);

    g.fillStyle(0x0A0A0A, 0.92);
    g.fillRect(sx - 21, sy - 54, 42, 22);
    g.fillRect(sx - 17, sy - 34, 34, 22);

    const jx = sx;
    const jy = sy - 43;
    g.fillStyle(0xEEEEEE, 0.85);
    g.fillCircle(jx, jy, 5);
    g.fillRect(jx - 4, jy + 3, 8, 4);
    g.fillStyle(0x0A0A0A, 1);
    g.fillCircle(jx - 2, jy - 1, 1.5);
    g.fillCircle(jx + 2, jy - 1, 1.5);
    g.lineStyle(2, 0xDDDDDD, 0.8);
    g.lineBetween(jx - 8, jy + 8, jx + 8, jy + 16);
    g.lineBetween(jx + 8, jy + 8, jx - 8, jy + 16);
    g.fillStyle(0xDDDDDD, 0.8);
    g.fillCircle(jx - 8, jy + 8,  2); g.fillCircle(jx + 8, jy + 8,  2);
    g.fillCircle(jx - 8, jy + 16, 2); g.fillCircle(jx + 8, jy + 16, 2);

    g.fillStyle(0x0A0A0A, 0.85);
    g.fillRect(sx - 29, sy - 26, 18, 18);

    g.lineStyle(2, 0x2A1004, 1);
    g.lineBetween(sx - 30, sy - 2, sx - 48, sy - 18);

    g.fillStyle(0x111111, 0.95);
    g.fillTriangle(sx + 2, sy - 60, sx + 16, sy - 55, sx + 2, sy - 50);

    g.lineStyle(1, 0x3A1A06, 0.5);
    g.lineBetween(sx - 21, sy - 54, sx - 1, sy - 60);
    g.lineBetween(sx + 21, sy - 54, sx + 2, sy - 60);

    for (let i = 1; i <= 5; i++) {
      g.fillStyle(0x1A0A02, 0.05 - i * 0.008);
      g.fillRect(sx - 26 + i, sy + 16 + i * 2, 52 - i * 2, 3);
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

    const pts1: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, H)];
    for (let x = 0; x <= W; x += step)
      pts1.push(new Phaser.Math.Vector2(x, HORIZON + this.waveY(x, t)));
    pts1.push(new Phaser.Math.Vector2(W, H));
    g.fillStyle(0x06111E, 1);
    g.fillPoints(pts1, true);

    const pts2: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, H)];
    for (let x = 0; x <= W; x += step)
      pts2.push(new Phaser.Math.Vector2(x, HORIZON + this.waveY(x, t) + 28));
    pts2.push(new Phaser.Math.Vector2(W, H));
    g.fillStyle(0x040C18, 0.6);
    g.fillPoints(pts2, true);

    const pts3: Phaser.Math.Vector2[] = [new Phaser.Math.Vector2(0, H)];
    for (let x = 0; x <= W; x += step)
      pts3.push(new Phaser.Math.Vector2(x, HORIZON + this.waveY(x, t) + 65));
    pts3.push(new Phaser.Math.Vector2(W, H));
    g.fillStyle(0x020608, 0.75);
    g.fillPoints(pts3, true);

    g.lineStyle(1, 0x2A4A5E, 0.4);
    g.beginPath();
    for (let x = 0; x <= W; x += step) {
      const y = HORIZON + this.waveY(x, t);
      x === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.strokePath();

    for (let x = 0; x < W; x += step) {
      const w = this.waveY(x, t);
      if (w < -3.8) {
        g.fillStyle(0xB8D8E8, 0.04 + ((-w - 3.8) / 1.2) * 0.05);
        g.fillRect(x, HORIZON + w, step, 1);
      }
    }

    for (let i = 0; i < 20; i++) {
      const baseX = W * 0.6 + Math.sin(t * 0.5 + i * 1.1) * W * 0.22;
      const rx    = (baseX + Math.sin(t * 1.2 + i * 0.7) * 18) % W;
      const ry    = HORIZON + 10 + i * 10 + Math.sin(t * 0.9 + i * 0.6) * 6;
      const len   = 6 + i * 1.2 + Math.sin(t * 1.6 + i) * 3;
      const a     = (0.04 + Math.abs(Math.sin(t * 1.8 + i * 0.8)) * 0.05) * (1 - i / 22);
      if (ry < H - 10 && a > 0.005) {
        g.fillStyle(0xC8B870, a);
        g.fillRect(rx, ry, len, 1);
        g.fillStyle(0xC8B870, a * 0.35);
        g.fillRect(rx + 2, ry + 2, len * 0.5, 1);
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
      this.glowGraphics.fillStyle(0xFFD700, 0.005 * pulse * (r / ambW));
      this.glowGraphics.fillEllipse(cx, cy, r * 2.5, r * 0.4);
    }
    const haloR = 20 + pulse * 10;
    for (let r = haloR; r > 0; r -= 2) {
      this.glowGraphics.fillStyle(0xFFD700, 0.022 * (r / haloR) * pulse);
      this.glowGraphics.fillCircle(cx, cy, r);
    }
    const innerR = 4 + pulse * 3;
    for (let r = innerR; r > 0; r--) {
      this.glowGraphics.fillStyle(0xFFFFFF, 0.18 * (r / innerR) * (0.5 + pulse * 0.5));
      this.glowGraphics.fillCircle(cx, cy, r);
    }
    this.glowGraphics.fillStyle(0xFFFDE8, 0.8 + pulse * 0.2);
    this.glowGraphics.fillCircle(cx, cy, 2 + pulse * 1.2);
    if (pulse2 > 0.65) {
      const len = (pulse2 - 0.65) / 0.35 * 16;
      const a   = (pulse2 - 0.65) / 0.35 * 0.45;
      this.glowGraphics.lineStyle(1, 0xFFFFCC, a);
      this.glowGraphics.lineBetween(cx - len, cy, cx + len, cy);
      this.glowGraphics.lineBetween(cx, cy - len, cx, cy + len);
    }
    const refH = 30 + pulse * 16;
    for (let i = 0; i < refH; i++) {
      this.glowGraphics.fillStyle(0xFFD700, (1 - i / refH) * 0.04 * pulse);
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
        y: Math.random() * (this.HORIZON - 60) * 0.45,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1,
      });
    }
    this.shootingStars = this.shootingStars.filter(ss => {
      ss.x    += ss.vx * delta * 0.055;
      ss.y    += ss.vy * delta * 0.055;
      ss.life -= delta * 0.0018;
      return ss.life > 0 && ss.x < this.W && ss.y < this.HORIZON - 30;
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
