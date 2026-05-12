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
    this.renderUI();
  }

  private drawBackground(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;

    // Fond taverne sombre
    const g = this.add.graphics();
    g.fillGradientStyle(0x0E0804, 0x100905, 0x1A0D04, 0x180B03, 1);
    g.fillRect(0, 0, w, h);

    // Planches de bois
    const wood = this.add.graphics();
    for (let i = 0; i < 20; i++) {
      wood.fillStyle(i % 2 === 0 ? 0x1A0A03 : 0x150802, 1);
      wood.fillRect(i * 52, 0, 52, h);
      wood.lineStyle(1, 0x0A0401, 0.8);
      wood.lineBetween(i * 52, 0, i * 52, h);
    }

    // Lumière ambiante chaude (plusieurs bougies)
    const lights = [[100, h*0.3], [w-100, h*0.4], [w*0.5, h*0.1]];
    const gl = this.add.graphics();
    lights.forEach(([lx, ly]) => {
      for (let r = 200; r > 0; r -= 10) {
        gl.fillStyle(0xC47008, 0.004);
        gl.fillCircle(lx, ly, r);
      }
    });

    // Sol
    const floor = this.add.graphics();
    floor.fillGradientStyle(0x0A0502, 0x0A0502, 0x180B03, 0x180B03, 1);
    floor.fillRect(0, h * 0.75, w, h * 0.25);
    for (let i = 0; i < 12; i++) {
      floor.lineStyle(1, 0x200E05, 0.6);
      floor.lineBetween(i * 90, h * 0.75, i * 90, h);
    }

    // Ligne de séparation sol/mur
    const border = this.add.graphics();
    border.lineStyle(3, 0x5C2A10, 0.8);
    border.lineBetween(0, h * 0.75, w, h * 0.75);
    border.lineStyle(1, 0xC4891A, 0.3);
    border.lineBetween(0, h * 0.75 + 4, w, h * 0.75 + 4);

    // Silhouettes meubles à gauche et droite
    this.drawFurniture(w, h);
  }

  private drawFurniture(w: number, h: number): void {
    const g = this.add.graphics();
    const floor = h * 0.75;

    // Baril gauche
    g.fillStyle(0x3D1F08, 1);
    g.fillRect(40, floor - 60, 50, 60);
    g.fillStyle(0x5C2A10, 1);
    g.fillRect(40, floor - 60, 50, 6);
    g.fillRect(40, floor - 32, 50, 6);
    g.fillRect(40, floor - 6, 50, 6);
    g.fillStyle(0x8B6914, 0.6);
    g.lineStyle(2, 0x8B6914, 0.6);
    g.strokeRect(40, floor - 60, 50, 60);

    // Baril droit
    g.fillStyle(0x3D1F08, 1);
    g.fillRect(w - 80, floor - 80, 55, 80);
    g.fillStyle(0x5C2A10, 1);
    g.fillRect(w - 80, floor - 80, 55, 7);
    g.fillRect(w - 80, floor - 42, 55, 7);
    g.fillRect(w - 80, floor - 8, 55, 8);

    // Table à droite
    g.fillStyle(0x2E1507, 1);
    g.fillRect(w - 200, floor - 40, 120, 8);
    g.fillRect(w - 185, floor - 32, 10, 32);
    g.fillRect(w - 100, floor - 32, 10, 32);

    // Chaise
    g.fillRect(w - 210, floor - 55, 8, 55);
    g.fillRect(w - 210, floor - 55, 40, 6);
    g.fillRect(w - 210, floor - 30, 40, 6);
    g.fillRect(w - 175, floor - 24, 8, 24);
  }

  private cleanup(): void {
    this.elements.forEach(el => el.remove());
    this.elements = [];
  }

  private renderUI(): void {
    this.cleanup();

    const scene = document.createElement('div');
    scene.className = 'op-menu-scene';

    const board = document.createElement('div');
    board.className = 'op-tavern-board';

    // Clous supplémentaires
    const nailTR = document.createElement('span');
    nailTR.className = 'op-nail op-nail-tr';
    const nailBL = document.createElement('span');
    nailBL.className = 'op-nail op-nail-bl';
    board.appendChild(nailTR);
    board.appendChild(nailBL);

    // Parchemin épinglé
    const note = document.createElement('div');
    note.className = 'op-pinned-note';
    note.innerHTML = '<div class="op-pin"></div>Aujourd\'hui : Soupe de mer + Rhum du pays';
    board.appendChild(note);

    // Titre
    board.innerHTML += `
      <div class="op-board-title">
        <span class="op-board-title-main">🏴‍☠️ ONE PIECE</span>
        <span class="op-board-ornament">⚓ • ⚔ • ⚓</span>
        <span class="op-board-title-sub">GRAND LINE ONLINE — RPG MULTIJOUEUR</span>
      </div>
    `;

    // Boutons
    const nav = document.createElement('div');
    nav.className = 'op-menu-items';

    const items = [
      { icon: '▶', label: 'PRENDRE LA MER',  cls: '',       fn: () => { this.cleanup(); this.scene.start('WorldScene'); } },
      { icon: '⚔',  label: 'MON PIRATE',      cls: '',       fn: () => this.showModal('MON PIRATE', 'Créez et gérez votre personnage, choisissez votre fruit du démon et votre équipage. Bientôt disponible !') },
      { icon: '🗺', label: 'LA CARTE',        cls: '',       fn: () => this.showModal('LA CARTE', 'Explorez le monde de One Piece : East Blue, Grand Line, Nouveau Monde... Bientôt disponible !') },
      { icon: '⚙',  label: 'OPTIONS',         cls: '',       fn: () => this.showModal('OPTIONS', 'Paramètres audio, vidéo et contrôles du jeu. Bientôt disponible !') },
      { icon: '🚪', label: 'QUITTER LE PORT', cls: 'danger', fn: () => this.handleLogout() },
    ];

    items.forEach(item => {
      const btn = document.createElement('button');
      btn.className = `op-menu-item ${item.cls}`;
      btn.innerHTML = `<span class="op-menu-item-icon">${item.icon}</span><span>${item.label}</span>`;
      btn.addEventListener('click', item.fn);
      nav.appendChild(btn);
    });

    board.appendChild(nav);

    // Footer
    board.innerHTML += `
      <div class="op-board-footer">
        <span class="op-board-footer-left">"Je serai le Roi des Pirates !"</span>
        <span class="op-board-footer-right">v0.1.0 — DEV BUILD<br>GRAND LINE ONLINE</span>
      </div>
    `;

    scene.appendChild(board);
    document.body.appendChild(scene);
    this.elements.push(scene);
  }

  private showModal(title: string, text: string): void {
    const bg = document.createElement('div');
    bg.className = 'op-modal-bg';
    bg.innerHTML = `
      <div class="op-modal-parchment">
        <div class="op-modal-parchment-title">${title}</div>
        <div class="op-modal-parchment-text">${text}</div>
        <button class="op-modal-parchment-btn">FERMER</button>
      </div>
    `;
    bg.querySelector('button')!.addEventListener('click', () => bg.remove());
    bg.addEventListener('click', e => { if (e.target === bg) bg.remove(); });
    document.body.appendChild(bg);
    this.elements.push(bg);
  }

  private async handleLogout(): Promise<void> {
    await logout();
    this.cleanup();
    this.scene.start('LoginScene');
  }

  shutdown(): void { this.cleanup(); }
}
