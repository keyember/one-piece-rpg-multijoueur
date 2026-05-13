import Phaser from 'phaser';
import { logout, getAccessToken, refreshAccessToken } from '../api/auth';

export class MainMenuScene extends Phaser.Scene {
  private elements: HTMLElement[] = [];

  constructor() { super({ key: 'MainMenuScene' }); }

  async create(): Promise<void> {
    let token = getAccessToken();
    if (!token) token = await refreshAccessToken();
    if (!token) { this.scene.start('LoginScene'); return; }

    if (!this.scene.isActive('OceanBackgroundScene')) {
      this.scene.launch('OceanBackgroundScene');
    }
    this.scene.sendToBack('OceanBackgroundScene');
    this.renderUI();
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

    ['op-nail op-nail-tl','op-nail op-nail-tr','op-nail op-nail-bl','op-nail op-nail-br'].forEach(cls => {
      const n = document.createElement('span');
      n.className = cls;
      board.appendChild(n);
    });

    const note = document.createElement('div');
    note.className = 'op-pinned-note';
    note.innerHTML = '<div class="op-pin"></div>Menu du jour :<br>Soupe de mer<br>+ Rhum du pays';
    scene.appendChild(note);

    const titleDiv = document.createElement('div');
    titleDiv.className = 'op-board-title';
    titleDiv.innerHTML = `<span class="op-board-title-main">GRAND LINE ONLINE</span>`;
    board.appendChild(titleDiv);

    const nav = document.createElement('div');
    nav.className = 'op-menu-items';

    const items = [
      { icon: '▶', label: 'PRENDRE LA MER',  cls: '',       fn: () => { this.cleanup(); this.scene.stop('OceanBackgroundScene'); this.scene.start('WorldScene'); } },
      { icon: '⚔',  label: 'MON PIRATE',      cls: '',       fn: () => this.showModal('MON PIRATE', 'Créez et gérez votre personnage, choisissez votre fruit du démon et votre équipage. Bientôt disponible !') },
      { icon: '🗺', label: 'LA CARTE',        cls: '',       fn: () => this.showModal('LA CARTE', 'Explorez le monde de One Piece : East Blue, Grand Line, Nouveau Monde... Bientôt disponible !') },
      { icon: '⚙',  label: 'OPTIONS',         cls: '',       fn: () => this.showModal('OPTIONS', 'Paramètres audio, vidéo et contrôles du jeu. Bientôt disponible !') },
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

    const footer = document.createElement('div');
    footer.className = 'op-board-footer';
    footer.innerHTML = `
      <span class="op-board-footer-left">&laquo;&nbsp;Je serai le Roi des Pirates&nbsp;!&nbsp;&raquo;</span>
      <span class="op-board-footer-right">v0.1.0 — DEV BUILD<br>GRAND LINE ONLINE</span>
    `;
    board.appendChild(footer);

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
