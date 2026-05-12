import Phaser from 'phaser';

export class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Titre
    this.add.text(width / 2, height / 2 - 150, '🏴‍☠️ ONE PIECE RPG', {
      fontSize: '48px',
      color: '#e8a000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 80, 'Multijoueur', {
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Champ nom
    this.add.text(width / 2 - 120, height / 2 - 20, 'Ton nom de pirate :', {
      fontSize: '18px',
      color: '#cccccc',
    });

    // Input HTML superposé
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Ex: Monkey D. Luffy';
    input.maxLength = 20;
    input.style.cssText = `
      position: absolute;
      left: 50%;
      top: 57%;
      transform: translateX(-50%);
      width: 280px;
      padding: 10px;
      font-size: 16px;
      border: 2px solid #e8a000;
      border-radius: 4px;
      background: #0a1628;
      color: #ffffff;
      outline: none;
    `;
    document.body.appendChild(input);
    input.focus();

    // Bouton Jouer
    const playBtn = this.add.text(width / 2, height / 2 + 100, '[ NAVIGUER ! ]', {
      fontSize: '28px',
      color: '#e8a000',
      fontStyle: 'bold',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'));
    playBtn.on('pointerout', () => playBtn.setColor('#e8a000'));

    const startGame = () => {
      const name = input.value.trim() || 'Pirate Anonyme';
      document.body.removeChild(input);
      this.scene.start('WorldScene', { playerName: name });
    };

    playBtn.on('pointerdown', startGame);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startGame();
    });
  }
}
