import Phaser from 'phaser';
import { register, login, setAccessToken } from '../api/auth';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? '';

export class LoginScene extends Phaser.Scene {
  private mode: 'login' | 'register' = 'login';
  private elements: HTMLElement[] = [];

  constructor() { super({ key: 'LoginScene' }); }

  init(): void {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setAccessToken(token);
      window.history.replaceState({}, '', '/');
      this.scene.start('MainMenuScene');
    }
  }

  create(): void {
    this.drawBackground();
    this.renderUI();
  }

  private drawBackground(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const g = this.add.graphics();

    // Taverne sombre
    g.fillGradientStyle(0x0E0804, 0x0E0804, 0x1A0D04, 0x1A0D04, 1);
    g.fillRect(0, 0, w, h);

    // Planches de bois verticales en fond
    const wood = this.add.graphics();
    for (let i = 0; i < 20; i++) {
      wood.fillStyle(i % 2 === 0 ? 0x1A0A03 : 0x150802, 1);
      wood.fillRect(i * 52, 0, 52, h);
      wood.lineStyle(1, 0x0A0401, 0.8);
      wood.lineBetween(i * 52, 0, i * 52, h);
    }

    // Lumière bougie à gauche
    const light1 = this.add.graphics();
    light1.fillStyle(0xD4820A, 0);
    for (let r = 180; r > 0; r -= 8) {
      light1.fillStyle(0xD4820A, 0.006);
      light1.fillCircle(180, h * 0.4, r);
    }

    // Lumière bougie à droite
    const light2 = this.add.graphics();
    for (let r = 150; r > 0; r -= 8) {
      light2.fillStyle(0xD4820A, 0.005);
      light2.fillCircle(w - 160, h * 0.5, r);
    }
  }

  private cleanup(): void {
    this.elements.forEach(el => el.remove());
    this.elements = [];
  }

  private renderUI(): void {
    this.cleanup();
    const isReg = this.mode === 'register';

    const scene = document.createElement('div');
    scene.className = 'op-login-scene';

    const poster = document.createElement('div');
    poster.className = 'op-wanted-poster';

    // Tampon filigrane
    const stamp = document.createElement('div');
    stamp.className = 'op-stamp';
    stamp.textContent = 'MARINE';
    poster.appendChild(stamp);

    // En-tête
    poster.innerHTML += `
      <div class="op-poster-header">
        <span class="op-poster-authority">⚓ GOUVERNEMENT MONDIAL • MARINE HQ – G.L. • ⚓</span>
        <span class="op-poster-wanted">WANTED</span>
        <span class="op-poster-dead-alive">— DEAD OR ALIVE —</span>
      </div>
    `;
    poster.appendChild(stamp);

    // Zone photo silhouette
    const photo = document.createElement('div');
    photo.className = 'op-poster-photo';
    photo.innerHTML = `<div class="op-poster-photo-inner">${isReg ? 'IDENTITY\nUNKNOWN' : 'IDENTIFY\nYOURSELF'}</div>`;
    poster.appendChild(photo);

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'op-poster-tabs';
    const tabConn = document.createElement('button');
    tabConn.className = `op-poster-tab ${!isReg ? 'active' : ''}`;
    tabConn.textContent = 'IDENTIFY';
    const tabReg = document.createElement('button');
    tabReg.className = `op-poster-tab ${isReg ? 'active' : ''}`;
    tabReg.textContent = 'ENLIST';
    tabConn.onclick = () => { this.mode = 'login'; this.renderUI(); };
    tabReg.onclick = () => { this.mode = 'register'; this.renderUI(); };
    tabs.appendChild(tabConn);
    tabs.appendChild(tabReg);
    poster.appendChild(tabs);

    const mkField = (labelTxt: string, type: string, placeholder: string): [HTMLDivElement, HTMLInputElement] => {
      const field = document.createElement('div');
      field.className = 'op-poster-field';
      const label = document.createElement('label');
      label.className = 'op-poster-label';
      label.textContent = labelTxt;
      const input = document.createElement('input');
      input.type = type;
      input.placeholder = placeholder;
      input.className = 'op-poster-input';
      field.appendChild(label);
      field.appendChild(input);
      return [field, input];
    };

    const [emailField, emailInput] = mkField('IDENTIFIANT (EMAIL)', 'email', 'votre email...');
    const [userField, userInput] = mkField('NOM DE PIRATE', 'text', 'ex: chapeau_de_paille');
    const [passField, passInput] = mkField('MOT DE PASSE SECRET', 'password', '••••••••');

    poster.appendChild(emailField);
    if (isReg) poster.appendChild(userField);
    poster.appendChild(passField);

    // Bounty
    const bountyWrap = document.createElement('div');
    bountyWrap.innerHTML = `
      <div class="op-poster-bounty-label">PRIME</div>
      <div class="op-poster-bounty-amount">0 <span class="op-poster-bounty-unit">Berry</span></div>
    `;
    poster.appendChild(bountyWrap);

    // Erreur
    const errorDiv = document.createElement('div');
    errorDiv.className = 'op-poster-error';
    poster.appendChild(errorDiv);

    // Bouton
    const btn = document.createElement('button');
    btn.className = 'op-poster-btn';
    btn.textContent = isReg ? 'S\'ENRÔLER !' : 'CONFIRMER L\'IDENTITÉ';
    poster.appendChild(btn);

    // OAuth
    const div = document.createElement('div');
    div.className = 'op-poster-divider';
    div.textContent = 'ou via Den Den Mushi';
    poster.appendChild(div);

    const oauthRow = document.createElement('div');
    oauthRow.className = 'op-poster-oauth';
    const discord = document.createElement('a');
    discord.href = `${SERVER_URL}/auth/discord`;
    discord.className = 'op-poster-oauth-btn op-oauth-discord';
    discord.textContent = '🎮 DISCORD';
    const google = document.createElement('a');
    google.href = `${SERVER_URL}/auth/google`;
    google.className = 'op-poster-oauth-btn op-oauth-google';
    google.textContent = '🔍 GOOGLE';
    oauthRow.appendChild(discord);
    oauthRow.appendChild(google);
    poster.appendChild(oauthRow);

    scene.appendChild(poster);
    document.body.appendChild(scene);
    this.elements.push(scene);

    const submit = async () => {
      errorDiv.textContent = '';
      btn.disabled = true;
      btn.textContent = 'EN COURS...';
      try {
        const res = isReg
          ? await register(emailInput.value.trim(), userInput.value.trim(), passInput.value)
          : await login(emailInput.value.trim(), passInput.value);
        setAccessToken(res.accessToken);
        this.cleanup();
        this.scene.start('MainMenuScene');
      } catch (e: any) {
        errorDiv.textContent = e.message ?? 'Erreur inconnue';
        btn.disabled = false;
        btn.textContent = isReg ? 'S\'ENRÔLER !' : 'CONFIRMER L\'IDENTITÉ';
      }
    };

    btn.addEventListener('click', submit);
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    emailInput.focus();
  }

  shutdown(): void { this.cleanup(); }
}
