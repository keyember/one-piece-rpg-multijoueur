import Phaser from 'phaser';

export class OceanBackgroundScene extends Phaser.Scene {
  private W = 0;
  private H = 0;
  private HORIZON = 0;

  private starGraphics!: Phaser.GameObjects.Graphics;
  private waveGraphics!: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;

  private stars: { x: number; y: number; size: number; baseAlpha: number; phase: number; speed: number }[] = [];
  private waveTime = 0;
  private glowTime = 0;
  private shootingStars: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
  private shootingTimer = 0;
  private waves: { x: number; y: number; width: number; speed: number; layer: number }[] = [];

  constructor() { super({ key: 'OceanBackgroundScene' }); }

  create(): void {
    this.W = this.cameras.main.width;
    this.H = this.cameras.main.height;
    this.HORIZON = Math.floor(this.H * 0.62);

    this.drawStaticBg();
    this.initStars();
    this.initWaves();
    this.drawIslands();

    this.glowGraphics = this.add.graphics();
    this.waveGraphics = this.add.graphics();
    this.starGraphics = this.add.graphics();
  }

  private drawStaticBg(): void {
    const { W, H, HORIZON } = this;

    const sky = this.add.graphics();
    sky.fillGradientStyle(0x01030A, 0x01030A, 0x05101E, 0x05101E, 1);
    sky.fillRect(0, 0, W, HORIZON + 2);

    const sea = this.add.graphics();
    sea.fillGradientStyle(0x051422, 0x051422, 0x010608, 0x010608, 1);
    sea.fillRect(0, HORIZON, W, H - HORIZON);

    // Lune croissant
    const moon = this.add.graphics();
    moon.fillStyle(0xEDE3BB, 0.95);
    moon.fillCircle(W * 0.76, H * 0.13, 28);
    moon.fillStyle(0x01030A, 1);
    moon.fillCircle(W * 0.76 + 11, H * 0.13 - 9, 23);
    for (let r = 65; r > 28; r -= 3) {
      moon.fillStyle(0xDDD0A0, 0.005);
      moon.fillCircle(W * 0.76, H * 0.13, r);
    }

    // Reflet lune sur mer
    const ref = this.add.graphics();
    for (let i = 0; i < 28; i++) {
      ref.fillStyle(0xDDD0A0, 0.012 - i * 0.0004);
      ref.fillEllipse(W * 0.76, HORIZON + 8 + i * 7, 36 - i, 6);
    }
  }

  private initStars(): void {
    const { W, HORIZON } = this;
    for (let i = 0; i < 200; i++) {
      this.stars.push({
        x:         Math.floor(Math.random() * W),
        y:         Math.floor(Math.random() * (HORIZON - 10)),
        size:      Math.random() < 0.1 ? 2 : 1,
        baseAlpha: 0.4 + Math.random() * 0.6,  // jamais en dessous de 0.4
        phase:     Math.random() * Math.PI * 2,
        speed:     0.4 + Math.random() * 0.8,
      });
    }
  }

  private drawStars(time: number): void {
    this.starGraphics.clear();
    for (const s of this.stars) {
      // scintillement ±0.2 autour de baseAlpha — toujours visible
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
    const { W, HORIZON } = this;
    const g = this.add.graphics();
    g.fillStyle(0x020609, 1);

    // Île gauche
    g.fillTriangle(W * 0.04, HORIZON, W * 0.16, HORIZON - 52, W * 0.28, HORIZON);
    g.fillRect(W * 0.04, HORIZON, W * 0.24, 6);

    // Arbres sur l'île gauche — base des troncs sur HORIZON
    g.fillStyle(0x010407, 1);
    const trees: [number, number][] = [
      [W * 0.09, 28], [W * 0.13, 44], [W * 0.17, 36], [W * 0.21, 26],
    ];
    for (const [tx, th] of trees) {
      // ty = point où le tronc touche le sol = HORIZON
      const ty = HORIZON;
      g.fillRect(tx - 1, ty - th, 3, th);          // tronc
      g.fillTriangle(tx, ty - th - 14, tx - 6, ty - th + 2, tx + 6, ty - th + 2); // feuilles
    }

    // Île droite
    g.fillStyle(0x020609, 1);
    g.fillTriangle(W * 0.80, HORIZON, W * 0.87, HORIZON - 36, W * 0.96, HORIZON);
    g.fillRect(W * 0.80, HORIZON, W * 0.16, 6);
  }

  private initWaves(): void {
    const { W, H, HORIZON } = this;
    const seaH = H - HORIZON;
    for (let layer = 0; layer < 3; layer++) {
      const count = 5 + layer * 2;
      for (let i = 0; i < count; i++) {
        this.waves.push({
          x:     Math.random() * W * 1.4,
          y:     HORIZON + 20 + layer * (seaH * 0.28) + Math.random() * 14,
          width: 50 + Math.random() * 55 - layer * 12,
          speed: (1.5 - layer * 0.35) * (0.8 + Math.random() * 0.5),
          layer,
        });
      }
    }
  }

  private drawWaves(delta: number): void {
    const { W, H, HORIZON } = this;
    this.waveGraphics.clear();
    const styles = [
      { color: 0x3A7FA8, alpha: 0.55, thickness: 2 },
      { color: 0x246080, alpha: 0.35, thickness: 1.5 },
      { color: 0x1A4A60, alpha: 0.22, thickness: 1 },
    ];

    for (const w of this.waves) {
      const st = styles[w.layer];
      w.x -= w.speed * delta * 0.06;
      if (w.x + w.width < 0) {
        w.x = W + Math.random() * 80;
        w.y = HORIZON + 20 + w.layer * ((H - HORIZON) * 0.28) + Math.random() * 14;
      }

      // Crête de vague : demi-ellipse aplatie
      this.waveGraphics.lineStyle(st.thickness, st.color, st.alpha);
      this.waveGraphics.beginPath();
      const steps = 14;
      for (let s = 0; s <= steps; s++) {
        const t  = (s / steps) * Math.PI;
        const px = w.x + (w.width / steps) * s;
        const py = w.y - Math.sin(t) * 5;
        s === 0 ? this.waveGraphics.moveTo(px, py) : this.waveGraphics.lineTo(px, py);
      }
      this.waveGraphics.strokePath();

      // Écume sur la crête avant (layer 0 seulement)
      if (w.layer === 0) {
        this.waveGraphics.fillStyle(0xFFFFFF, 0.13);
        this.waveGraphics.fillRect(w.x + w.width * 0.25, w.y - 5, 4, 1);
        this.waveGraphics.fillRect(w.x + w.width * 0.55, w.y - 5, 3, 1);
        this.waveGraphics.fillRect(w.x + w.width * 0.08, w.y - 4, 3, 1);
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

    // Glow horizon
    const ambW = 100 + pulse * 40;
    for (let r = ambW; r > 0; r -= 5) {
      this.glowGraphics.fillStyle(0xFFD700, 0.006 * pulse * (r / ambW));
      this.glowGraphics.fillEllipse(cx, cy, r * 2.5, r * 0.45);
    }
    // Halo
    const haloR = 22 + pulse * 12;
    for (let r = haloR; r > 0; r -= 2) {
      this.glowGraphics.fillStyle(0xFFD700, 0.025 * (r / haloR) * pulse);
      this.glowGraphics.fillCircle(cx, cy, r);
    }
    // Coeur
    const innerR = 5 + pulse * 4;
    for (let r = innerR; r > 0; r--) {
      this.glowGraphics.fillStyle(0xFFFFFF, 0.2 * (r / innerR) * (0.5 + pulse * 0.5));
      this.glowGraphics.fillCircle(cx, cy, r);
    }
    // Point
    this.glowGraphics.fillStyle(0xFFFDE8, 0.75 + pulse * 0.25);
    this.glowGraphics.fillCircle(cx, cy, 2 + pulse * 1.5);
    // Croix
    if (pulse2 > 0.65) {
      const len = (pulse2 - 0.65) / 0.35 * 18;
      const a   = (pulse2 - 0.65) / 0.35 * 0.5;
      this.glowGraphics.lineStyle(1, 0xFFFFCC, a);
      this.glowGraphics.lineBetween(cx - len, cy, cx + len, cy);
      this.glowGraphics.lineBetween(cx, cy - len, cx, cy + len);
    }
    // Reflet mer
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
    this.waveTime += delta;
    this.glowTime += delta * 0.001;
    this.drawStars(time);
    this.drawWaves(delta);
    this.drawOnePieceGlow();
    this.updateShootingStars(delta);
  }
}
