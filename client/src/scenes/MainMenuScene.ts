import Phaser from 'phaser';
import { logout, getAccessToken, refreshAccessToken } from '../api/auth';

export class MainMenuScene extends Phaser.Scene {
  private elements: HTMLElement[] = [];

  constructor() { super({ key: 'MainMenuScene' }); }

  async create(): Promise<void> {
    let token = getAccessToken();
    if (!token) token = await refreshAccessToken();
    if (!token) { this.scene.start('LoginScene'); return; }

    this.drawBackground();
    this.renderHTML();
  }

  private drawBackground(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const g = this.add.graphics();

    // Fond nuit en mer
    g.fillGradientStyle(0x050810, 0x050810, 0x0B1A2A, 0x0B1A2A, 1);
    g.fillRect(0, 0, w, h);

    // Étoiles pixel
    const stars = this.add.graphics();
    for (let i = 0; i < 80; i++) {
      const bright = Math.random();
      stars.fillStyle(0xF0EAD6, bright > 0.85 ? 1 : 0.3 + bright * 0.5);
      const s = bright > 0.9 ? 2 : 1;
      stars.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h * 0.7), s, s);
    }

    // Lune
    const moon = this.add.graphics();
    moon.fillStyle(0xF0EAD6, 0.9);
    moon.fillCircle(w - 120, 80, 28);
    moon.fillStyle(0x0B1A2A, 1);
    moon.fillCircle(w - 110, 72, 22); // créant un croissant

    // Mer en bas
    const sea = this.add.graphics();
    sea.fillGradientStyle(0x0D1B2A, 0x0D1B2A, 0x06101A, 0x06101A, 1);
    sea.fillRect(0, h * 0.72, w, h * 0.28);

    // Vagues pixel art
    const waves = this.add.graphics();
    waves.lineStyle(2, 0x1A3A5C, 0.8);
    for (let i = 0; i < 5; i++) {
      waves.strokeEllipse(w / 2, h * 0.72 + i * 60, w * 1.6 + i * 80, 60 + i * 30);
    }

    // Reflet lune sur mer
    const reflect = this.add.graphics();
    reflect.fillStyle(0xF0EAD6, 0.04);
    reflect.fillRect(w - 140, h * 0.72, 40, h * 0.28);

    // Silhouette bateau pixel art
    this.drawPixelShip(w / 2 - 60, h * 0.68);

    // Vignette
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0);
    // bords sombres
    for (let i = 0; i < 40; i++) {
      vignette.fillStyle(0x000000, 0.025);
      vignette.fillRect(0, 0, i * 3, h);
      vignette.fillRect(w - i * 3, 0, i * 3, h);
    }
  }

  private drawPixelShip(x: number, y: number): void {
    const g = this.add.graphics();
    const P = 4; // taille pixel

    // Coque
    g.fillStyle(0x3D1A08, 1);
    const hull = [
      [0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4],
      [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],
      [2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[9,6],[10,6],
      [3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],
    ];
    hull.forEach(([px, py]) => g.fillRect(x + px * P, y + py * P, P, P));

    // Détail coque
    g.fillStyle(0x5C2A10, 1);
    [[1,4],[2,4],[3,4]].forEach(([px, py]) => g.fillRect(x + px * P, y + py * P, P, P));

    // Voile principale
    g.fillStyle(0xF0EAD6, 0.9);
    const sail = [
      [5,0],[6,0],
      [4,1],[5,1],[6,1],[7,1],
      [4,2],[5,2],[6,2],[7,2],
      [5,3],[6,3],
    ];
    sail.forEach(([px, py]) => g.fillRect(x + px * P, y + py * P, P, P));

    // Croix rouge sur voile (One Piece style)
    g.fillStyle(0xD62828, 1);
    [[5,1],[6,1],[5,2],[6,2]].forEach(([px, py]) => g.fillRect(x + px * P, y + py * P, P, P));

    // Mât
    g.fillStyle(0x5C2A10, 1);
    [[6,0],[6,1],[6,2],[6,3],[6,4]].forEach(([px, py]) => g.fillRect(x + px * P, y + py * P, P / 2, P));

    // Drapeau skull
    g.fillStyle(0x0B0F1A, 1);
    g.fillRect(x + 6 * P, y - P, P * 2, P);
    g.fillStyle(0xF0EAD6, 1);
    g.fillRect(x + 6 * P + 2, y - P + 2, 4, 4);
  }

  private cleanup(): void {
    this.elements.forEach(el => el.remove());
    this.elements = [];
  }

  private renderHTML(): void {
    this.cleanup();

    const scanlines = document.createElement('div');
    scanlines.className = 'op-scanlines';
    document.body.appendChild(scanlines);
    this.elements.push(scanlines);

    const overlay = document.createElement('div');
    overlay.className = 'op-menu-overlay';

    // Titre
    const titleWrap = document.createElement('div');
    titleWrap.className = 'op-menu-title-wrap';
    titleWrap.innerHTML = `
      <span class="op-menu-title">🏴‍☠️ ONE PIECE RPG</span>
      <span class="op-menu-title-sub">GRAND LINE ONLINE</span>
    `;
    overlay.appendChild(titleWrap);

    // Navigation
    const nav = document.createElement('nav');
    nav.className = 'op-menu-nav';

    const items = [
      { icon: '▶', label: 'JOUER',        cls: '',       action: () => { this.cleanup(); this.scene.start('WorldScene'); } },
      { icon: '⚔',  label: 'PERSONNAGE',  cls: '',       action: () => this.showModal('PERSONNAGE', 'Créez et gérez votre pirate. Bientôt disponible !') },
      { icon: '⚙',  label: 'PARAMÈTRES',  cls: '',       action: () => this.showModal('PARAMÈTRES', 'Options audio, vidéo et contrôles. Bientôt disponible !') },
      { icon: '🔒', label: 'DÉCONNEXION', cls: 'danger', action: () => this.handleLogout() },
    ];

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = `op-menu-btn ${item.cls}`;
      btn.innerHTML = `<span class="op-menu-btn-icon">${item.icon}</span>${item.label}`;
      btn.addEventListener('click', item.action);
      nav.appendChild(btn);
    });

    overlay.appendChild(nav);

    // Version + bounty
    const version = document.createElement('div');
    version.className = 'op-menu-version';
    version.textContent = 'V 0.1.0 — DEV BUILD';
    overlay.appendChild(version);

    const bounty = document.createElement('div');
    bounty.className = 'op-menu-bounty';
    bounty.textContent = '» WANTED «  DEAD OR ALIVE';
    overlay.appendChild(bounty);

    document.body.appendChild(overlay);
    this.elements.push(overlay);
  }

  private showModal(title: string, text: string): void {
    const overlayEl = document.createElement('div');
    overlayEl.className = 'op-modal-overlay';
    overlayEl.innerHTML = `
      <div class="op-modal">
        <div class="op-modal-title">${title}</div>
        <div class="op-modal-text">${text}</div>
        <button class="op-modal-close">FERMER</button>
      </div>
    `;
    overlayEl.querySelector('.op-modal-close')!.addEventListener('click', () => overlayEl.remove());
    overlayEl.addEventListener('click', e => { if (e.target === overlayEl) overlayEl.remove(); });
    document.body.appendChild(overlayEl);
    this.elements.push(overlayEl);
  }

  private async handleLogout(): Promise<void> {
    await logout();
    this.cleanup();
    this.scene.start('LoginScene');
  }

  shutdown(): void { this.cleanup(); }
}
