import Phaser from 'phaser';
import { refreshAccessToken } from '../api/auth';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'BootScene' }); }

  preload(): void {
    const { width, height } = this.cameras.main;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x010208, 1);
    progressBox.fillRect(0, 0, width, height);

    const bar = this.add.graphics();
    const barW = 260;
    const barX = width / 2 - barW / 2;
    const barY = height / 2 - 3;

    // Fond barre
    bar.fillStyle(0x1A0D04, 1);
    bar.fillRect(barX, barY, barW, 6);

    const label = this.add.text(width / 2, height / 2 - 24, 'APPAREILLAGE...', {
      fontFamily: "'Cinzel', serif",
      fontSize: '13px',
      color: '#8A6E28',
      letterSpacing: 6,
    }).setOrigin(0.5);

    this.load.on('progress', (v: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xD4B45A, 1);
      progressBar.fillRect(barX, barY, barW * v, 6);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      bar.destroy();
      label.destroy();
      progressBox.destroy();
    });
  }

  async create(): Promise<void> {
    // Tenter de restaurer la session via le refresh token cookie
    const token = await refreshAccessToken();
    this.scene.start(token ? 'MainMenuScene' : 'LoginScene');
  }
}
