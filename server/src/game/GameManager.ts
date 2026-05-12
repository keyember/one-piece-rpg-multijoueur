import { PlayerData, MoveInput } from '../../../shared/types';

export class GameManager {
  private players: Map<string, PlayerData> = new Map();

  addPlayer(id: string, name: string): PlayerData {
    const player: PlayerData = {
      id,
      name,
      x: Math.floor(Math.random() * 800) + 100,
      y: Math.floor(Math.random() * 600) + 100,
      direction: 'down',
      stats: {
        hp: 100,
        maxHp: 100,
        level: 1,
        xp: 0,
        strength: 10,
        defense: 5,
        speed: 8,
      },
    };
    this.players.set(id, player);
    console.log(`[Game] Joueur ajouté : ${name} (${id})`);
    return player;
  }

  removePlayer(id: string): void {
    const player = this.players.get(id);
    if (player) {
      console.log(`[Game] Joueur retiré : ${player.name} (${id})`);
      this.players.delete(id);
    }
  }

  movePlayer(id: string, input: MoveInput): PlayerData | null {
    const player = this.players.get(id);
    if (!player) return null;

    player.x = input.x;
    player.y = input.y;
    player.direction = input.direction;
    return player;
  }

  getPlayer(id: string): PlayerData | undefined {
    return this.players.get(id);
  }

  getAllPlayers(): Record<string, PlayerData> {
    return Object.fromEntries(this.players);
  }

  getPlayerCount(): number {
    return this.players.size;
  }
}
