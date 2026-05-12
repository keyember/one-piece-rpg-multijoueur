import Phaser from 'phaser';
import { io, Socket } from 'socket.io-client';
import { PlayerData, MoveInput, ChatMessage, SOCKET_EVENTS, GameState } from '../../../shared/types';

// L'URL vient de la variable d'env Vite, jamais en dur
const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? '/';

export class WorldScene extends Phaser.Scene {
  private socket!: Socket;
  private localPlayer!: Phaser.GameObjects.Rectangle;
  private localPlayerLabel!: Phaser.GameObjects.Text;
  private otherPlayers: Map<string, { rect: Phaser.GameObjects.Rectangle; label: Phaser.GameObjects.Text }> = new Map();
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { up: Phaser.Input.Keyboard.Key; down: Phaser.Input.Keyboard.Key; left: Phaser.Input.Keyboard.Key; right: Phaser.Input.Keyboard.Key };
  private playerName: string = 'Pirate';
  private speed = 200;
  private lastDirection: MoveInput['direction'] = 'down';

  constructor() {
    super({ key: 'WorldScene' });
  }

  init(data: { playerName: string }): void {
    this.playerName = data.playerName || 'Pirate';
  }

  create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x1a3a5c);

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x1e4a7a, 0.3);
    for (let x = 0; x < width; x += 64) grid.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 64) grid.lineBetween(0, y, width, y);

    this.localPlayer = this.add.rectangle(width / 2, height / 2, 32, 32, 0xe63232);
    this.physics.add.existing(this.localPlayer);

    this.localPlayerLabel = this.add.text(width / 2, height / 2 - 28, this.playerName, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = {
      up: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.socket = io(SERVER_URL, {
      withCredentials: true,
      // Reconnexion automatique limitée
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    this.setupSocketEvents();
    this.socket.emit(SOCKET_EVENTS.PLAYER_JOIN, this.playerName);

    this.add.text(10, 10, '🏴‍☠️ One Piece RPG', { fontSize: '14px', color: '#e8a000' });
  }

  private setupSocketEvents(): void {
    this.socket.on(SOCKET_EVENTS.GAME_STATE, (state: GameState) => {
      Object.values(state.players).forEach((player) => {
        if (player.id !== this.socket.id) {
          this.addOtherPlayer(player);
        }
      });
    });

    this.socket.on(SOCKET_EVENTS.PLAYER_JOINED, (player: PlayerData) => {
      this.addOtherPlayer(player);
    });

    this.socket.on(SOCKET_EVENTS.PLAYER_LEFT, (playerId: string) => {
      const other = this.otherPlayers.get(playerId);
      if (other) {
        other.rect.destroy();
        other.label.destroy();
        this.otherPlayers.delete(playerId);
      }
    });

    this.socket.on(SOCKET_EVENTS.PLAYER_MOVED, (player: PlayerData) => {
      const other = this.otherPlayers.get(player.id);
      if (other) {
        other.rect.setPosition(player.x, player.y);
        other.label.setPosition(player.x, player.y - 28);
      }
    });
  }

  private addOtherPlayer(player: PlayerData): void {
    const rect = this.add.rectangle(player.x, player.y, 32, 32, 0x32a8e6);
    const label = this.add.text(player.x, player.y - 28, player.name, {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5);
    this.otherPlayers.set(player.id, { rect, label });
  }

  update(): void {
    const body = this.localPlayer.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    let moved = false;
    let direction = this.lastDirection;

    if (this.cursors.left.isDown || this.wasd.left.isDown) {
      body.setVelocityX(-this.speed);
      direction = 'left';
      moved = true;
    } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
      body.setVelocityX(this.speed);
      direction = 'right';
      moved = true;
    }

    if (this.cursors.up.isDown || this.wasd.up.isDown) {
      body.setVelocityY(-this.speed);
      direction = 'up';
      moved = true;
    } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
      body.setVelocityY(this.speed);
      direction = 'down';
      moved = true;
    }

    this.lastDirection = direction;
    this.localPlayerLabel.setPosition(this.localPlayer.x, this.localPlayer.y - 28);

    if (moved) {
      const input: MoveInput = {
        x: this.localPlayer.x,
        y: this.localPlayer.y,
        direction,
      };
      this.socket.emit(SOCKET_EVENTS.PLAYER_MOVE, input);
    }
  }
}
