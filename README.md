# 🏴‍☠️ One Piece RPG Multijoueur

RPG multijoueur en temps réel inspiré de l'univers One Piece.

## Stack
- **Client** : Phaser 3 + Vite + TypeScript
- **Serveur** : Node.js + Express + Socket.io + TypeScript
- **Shared** : Types TypeScript communs
- **Infra** : Docker Compose

## Lancer le projet

```bash
docker compose up --build
```

Ou en mode dev :

```bash
# Serveur
cd server && npm install && npm run dev

# Client (autre terminal)
cd client && npm install && npm run dev
```

## Structure

```
one-piece-rpg-multijoueur/
├── client/       # Phaser 3 + Vite
├── server/       # Node.js + Socket.io
├── shared/       # Types communs
└── docker-compose.yml
```
