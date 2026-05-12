import Phaser from 'phaser';
import { logout, getAccessToken, refreshAccessToken } from '../api/auth';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  async create(): Promise<void> {
    // Vérifier qu'on est bien authentifié
    let token = getAccessToken();
    if (!token) token = await refreshAccessToken();
    if (!token) {
      this.scene.start('LoginScene');
      return;
    }

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Fond dégradé sombre
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a1628, 0x0a1628, 0x0d2a4a, 0x0d2a4a, 1);
    bg.fillRect(0, 0, width, height);

    // Décorations : vagues
    const waves = this.add.graphics();
    waves.lineStyle(1, 0x1e4a7a, 0.4);
    for (let i = 0; i < 6; i++) {
      waves.strokeEllipse(width / 2, height + 100 + i * 80, width * 1.5 + i * 100, 200 + i * 60);
    }

    // Titre
    this.add.text(width / 2, 110, '🏴‍☠️ ONE PIECE RPG', {
      fontSize: '52px',
      color: '#e8a000',
      fontStyle: 'bold',
      stroke: '#7a4400',
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, 170, 'Multijoueur', {
      fontSize: '20px',
      color: '#aaaaaa',
      letterSpacing: 6,
    }).setOrigin(0.5);

    // Ligne décorative
    const line = this.add.graphics();
    line.lineStyle(2, 0xe8a000, 0.6);
    line.lineBetween(width / 2 - 180, 200, width / 2 + 180, 200);

    // Boutons du menu
    const menuItems = [
      { label: '▶  Jouer',         action: () => this.scene.start('WorldScene') },
      { label: '⚔️  Personnage',    action: () => this.showComingSoon('Personnage') },
      { label: '⚙️  Paramètres',    action: () => this.showComingSoon('Paramètres') },
      { label: '🔒  Déconnexion',   action: () => this.handleLogout() },
    ];

    menuItems.forEach((item, i) => {
      const y = 310 + i * 80;
      const btn = this.add.text(width / 2, y, item.label, {
        fontSize: '28px',
        color: '#e0e0e0',
        fontStyle: 'bold',
        padding: { x: 30, y: 12 },
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      // Fond du bouton
      const btnBg = this.add.graphics();
      const drawBtnBg = (hover: boolean) => {
        btnBg.clear();
        btnBg.fillStyle(hover ? 0x1e4a7a : 0x0d2a4a, hover ? 0.9 : 0.6);
        btnBg.fillRoundedRect(width / 2 - 200, y - 28, 400, 56, 8);
        if (hover) {
          btnBg.lineStyle(2, 0xe8a000, 0.8);
          btnBg.strokeRoundedRect(width / 2 - 200, y - 28, 400, 56, 8);
        }
      };
      drawBtnBg(false);
      btnBg.setDepth(0);
      btn.setDepth(1);

      btn.on('pointerover', () => { drawBtnBg(true); btn.setColor('#e8a000'); });
      btn.on('pointerout', () => { drawBtnBg(false); btn.setColor('#e0e0e0'); });
      btn.on('pointerdown', () => item.action());
    });

    // Version
    this.add.text(width - 12, height - 12, 'v0.1.0-dev', {
      fontSize: '11px',
      color: '#445566',
    }).setOrigin(1, 1);
  }

  private showComingSoon(section: string): void {
    // Placeholder - sera remplacé par les vraies scènes
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const overlay = this.add.rectangle(width / 2, height / 2, 400, 160, 0x0a1628, 0.95)
      .setStrokeStyle(2, 0xe8a000);
    const text = this.add.text(width / 2, height / 2 - 20, `${section}\n(bientôt disponible)`, {
      fontSize: '22px', color: '#e8a000', align: 'center',
    }).setOrigin(0.5);
    const closeBtn = this.add.text(width / 2, height / 2 + 45, '[ Fermer ]', {
      fontSize: '16px', color: '#aaaaaa',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => { overlay.destroy(); text.destroy(); closeBtn.destroy(); });
  }

  private async handleLogout(): Promise<void> {
    await logout();
    this.scene.start('LoginScene');
  }
}
