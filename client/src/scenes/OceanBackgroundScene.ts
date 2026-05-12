import Phaser from 'phaser';

/**
 * Scène de fond partagée : mer de nuit animée
 * Lancée en parallèle de LoginScene et MainMenuScene via scene.launch()
 */
export class OceanBackgroundScene extends Phaser.Scene {
  private stars: { x: number; y: number; size: number; alpha: number; speed: number }[] = [];
  private starGraphics!: Phaser.GameObjects.Graphics;
  private waveGraphics!: Phaser.GameObjects.Graphics;
  private glowGraphics!: Phaser.GameObjects.Graphics;
  private onePieceGlow!: Phaser.GameObjects.Graphics;
  private waveOffset = 0;
  private glowTime = 0;
  private shootingStarTimer = 0;
  private shootingStars: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];

  constructor() { super({ key: 'OceanBackgroundScene' }); }

  create(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    this.drawStaticBg(w, h);
    this.initStars(w, h);

    this.starGraphics  = this.add.graphics();
    this.waveGraphics  = this.add.graphics();
    this.glowGraphics  = this.add.graphics();
    this.onePieceGlow  = this.add.graphics();

    // Silhouette horizon îles
    this.drawIslands(w, h);
  }

  private drawStaticBg(w: number, h: number): void {
    const sky = this.add.graphics();
    // Ciel nuit — dégradé bleu très profond vers noir
    sky.fillGradientStyle(0x02040C, 0x02040C, 0x060E1A, 0x060E1A, 1);
    sky.fillRect(0, 0, w, h * 0.68);

    // Mer — légèrement plus bleue
    const sea = this.add.graphics();
    sea.fillGradientStyle(0x04101E, 0x04101E, 0x010608, 0x010608, 1);
    sea.fillRect(0, h * 0.68, w, h * 0.32);

    // Reflet de lune sur la mer
    const moonReflect = this.add.graphics();
    for (let i = 0; i < 30; i++) {
      const alpha = 0.015 - i * 0.0004;
      moonReflect.fillStyle(0xD8CFAA, alpha > 0 ? alpha : 0);
      moonReflect.fillEllipse(w * 0.72, h * 0.68 + i * 6, 60 - i * 1.5, 8);
    }

    // Lune
    const moon = this.add.graphics();
    moon.fillStyle(0xEEE5C0, 0.95);
    moon.fillCircle(w * 0.72, h * 0.14, 26);
    // Masque créant le croissant
    moon.fillStyle(0x02040C, 1);
    moon.fillCircle(w * 0.72 + 10, h * 0.14 - 8, 22);

    // Halo lune
    const halo = this.add.graphics();
    for (let r = 60; r > 26; r -= 3) {
      halo.fillStyle(0xDDD0A0, 0.006);
      halo.fillCircle(w * 0.72, h * 0.14, r);
    }
  }

  private initStars(w: number, h: number): void {
    const horizon = h * 0.68;
    for (let i = 0; i < 180; i++) {
      this.stars.push({
        x:     Math.random() * w,
        y:     Math.random() * (horizon - 20),
        size:  Math.random() < 0.12 ? 2 : 1,
        alpha: 0.2 + Math.random() * 0.8,
        speed: 0.3 + Math.random() * 1.2,
      });
    }
  }

  private drawIslands(w: number, h: number): void {
    const horizon = h * 0.68;
    const g = this.add.graphics();

    // Île gauche — silhouette sombre
    g.fillStyle(0x030810, 1);
    g.fillTriangle(
      w * 0.05, horizon,
      w * 0.18, horizon - 55,
      w * 0.30, horizon
    );
    g.fillRect(w * 0.05, horizon, w * 0.25, 6);

    // Détail : arbres pixel sur île gauche
    g.fillStyle(0x020608, 1);
    [[0.10, 55], [0.14, 70], [0.18, 60], [0.22, 50]].forEach(([rx, rh]) => {
      g.fillTriangle(
        w * rx,      horizon - (rh as number) - 12,
        w * rx - 6,  horizon - (rh as number) + 6,
        w * rx + 6,  horizon - (rh as number) + 6
      );
      g.fillRect(w * rx - 2, horizon - (rh as number) + 6, 4, 10);
    });

    // Île droite
    g.fillStyle(0x030810, 1);
    g.fillTriangle(
      w * 0.78, horizon,
      w * 0.86, horizon - 40,
      w * 0.96, horizon
    );
    g.fillRect(w * 0.78, horizon, w * 0.18, 6);

    // Ligne d'horizon nette
    g.lineStyle(1, 0x0A1A28, 0.8);
    g.lineBetween(0, horizon, w, horizon);
  }

  update(time: number, delta: number): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const horizon = h * 0.68;

    this.waveOffset  += delta * 0.0006;
    this.glowTime    += delta * 0.001;
    this.shootingStarTimer += delta;

    this.drawStars(w, horizon, time);
    this.drawWaves(w, h, horizon);
    this.drawOnePieceGlow(w, h, horizon);
    this.updateShootingStars(w, horizon, delta);
  }

  private drawStars(w: number, horizon: number, time: number): void {
    this.starGraphics.clear();
    this.stars.forEach((star, i) => {
      // Scintillement individuel
      const flicker = Math.sin(time * 0.001 * star.speed + i * 0.7) * 0.35;
      const alpha = Math.max(0.05, star.alpha + flicker);
      this.starGraphics.fillStyle(0xF0EAD6, alpha);
      this.starGraphics.fillRect(star.x, star.y, star.size, star.size);
    });

    // Étoiles filantes
    this.shootingStars.forEach(ss => {
      const alpha = (ss.life / ss.maxLife) * 0.8;
      this.starGraphics.lineStyle(1, 0xF0EAD6, alpha);
      this.starGraphics.lineBetween(ss.x, ss.y, ss.x - ss.vx * 12, ss.y - ss.vy * 12);
    });
  }

  private drawWaves(w: number, h: number, horizon: number): void {
    this.waveGraphics.clear();

    // Reflets étoilés sur l'eau
    this.stars
      .filter(s => s.size === 2 && s.alpha > 0.7)
      .slice(0, 8)
      .forEach((star, i) => {
        const ry = horizon + 10 + (i % 3) * 18;
        this.waveGraphics.fillStyle(0xF0EAD6, 0.04);
        this.waveGraphics.fillRect(star.x - 1, ry, 2, 1);
      });

    // Vagues en sinéïdes
    for (let layer = 0; layer < 4; layer++) {
      const alpha = 0.06 + layer * 0.04;
      const yBase = horizon + 12 + layer * 20;
      const amp   = 3 + layer * 1.5;
      const freq  = 0.012 - layer * 0.002;
      const speed = this.waveOffset * (1 + layer * 0.3);

      this.waveGraphics.lineStyle(1, 0x1A4060, alpha);
      this.waveGraphics.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = yBase + Math.sin(x * freq + speed) * amp;
        if (x === 0) this.waveGraphics.moveTo(x, y);
        else this.waveGraphics.lineTo(x, y);
      }
      this.waveGraphics.strokePath();
    }
  }

  private drawOnePieceGlow(w: number, h: number, horizon: number): void {
    this.onePieceGlow.clear();

    // Position : légèrement à droite du centre, sur l'horizon
    const cx = w * 0.52;
    const cy = horizon;

    // Pulsation principale
    const pulse  = Math.sin(this.glowTime * 1.8) * 0.5 + 0.5;        // 0–1
    const pulse2 = Math.sin(this.glowTime * 0.9 + 1.2) * 0.5 + 0.5;  // déphasé

    // Halo doré diffus — rayon variable
    const haloR = 28 + pulse * 16;
    for (let r = haloR; r > 0; r -= 2) {
      const a = (r / haloR) * 0.022 * (0.5 + pulse * 0.5);
      this.onePieceGlow.fillStyle(0xFFD700, a);
      this.onePieceGlow.fillCircle(cx, cy, r);
    }

    // Halo blanc intérieur
    const innerR = 6 + pulse * 5;
    for (let r = innerR; r > 0; r -= 1) {
      const a = (r / innerR) * 0.18 * (0.4 + pulse * 0.6);
      this.onePieceGlow.fillStyle(0xFFFFFF, a);
      this.onePieceGlow.fillCircle(cx, cy, r);
    }

    // Point lumineux central
    const dotR = 2 + pulse * 1.5;
    this.onePieceGlow.fillStyle(0xFFFFEE, 0.7 + pulse * 0.3);
    this.onePieceGlow.fillCircle(cx, cy, dotR);

    // Rayon vertical — reflet sur mer
    const reflectH = 40 + pulse * 20;
    for (let i = 0; i < reflectH; i++) {
      const a = (1 - i / reflectH) * 0.06 * pulse;
      this.onePieceGlow.fillStyle(0xFFD700, a);
      this.onePieceGlow.fillRect(cx - 1, cy + i, 2, 2);
    }

    // Rayon cruciforme (scintillement)
    if (pulse2 > 0.6) {
      const rayLen = (pulse2 - 0.6) / 0.4 * 20;
      const rayAlpha = (pulse2 - 0.6) / 0.4 * 0.4;
      this.onePieceGlow.lineStyle(1, 0xFFFFCC, rayAlpha);
      this.onePieceGlow.lineBetween(cx - rayLen, cy, cx + rayLen, cy);
      this.onePieceGlow.lineBetween(cx, cy - rayLen, cx, cy + rayLen);
    }

    // Glow ambiant sur l'horizon autour du point
    this.glowGraphics.clear();
    const ambR = 80 + pulse * 30;
    for (let r = ambR; r > 0; r -= 4) {
      const a = (r / ambR) * 0.008 * pulse;
      this.glowGraphics.fillStyle(0xFFD700, a);
      this.glowGraphics.fillEllipse(cx, cy, r * 3, r * 0.6);
    }
  }

  private updateShootingStars(w: number, horizon: number, delta: number): void {
    // Nouvelle étoile filante toutes les ~8-14s
    if (this.shootingStarTimer > 8000 + Math.random() * 6000) {
      this.shootingStarTimer = 0;
      const angle = -0.3 - Math.random() * 0.4; // vers le bas-droite
      const speed = 4 + Math.random() * 3;
      this.shootingStars.push({
        x: Math.random() * w * 0.7,
        y: Math.random() * horizon * 0.5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
      });
    }

    this.shootingStars = this.shootingStars.filter(ss => {
      ss.x += ss.vx * delta * 0.06;
      ss.y += ss.vy * delta * 0.06;
      ss.life -= delta * 0.0015;
      return ss.life > 0 && ss.x < w && ss.y < horizon;
    });
  }
}
