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
    this.renderHTML();
  }

  private drawBackground(): void {
    const w = this.cameras.main.width;
    const h = this.cameras.main.height;
    const g = this.add.graphics();

    // Fond mer profonde
    g.fillGradientStyle(0x0B0F1A, 0x0B0F1A, 0x0D1B2A, 0x0D1B2A, 1);
    g.fillRect(0, 0, w, h);

    // Vagues pixel art
    const wave = this.add.graphics();
    wave.lineStyle(1, 0x1A3A5C, 0.5);
    for (let i = 0; i < 8; i++) {
      wave.strokeEllipse(w / 2, h + 80 + i * 90, w * 1.8 + i * 120, 180 + i * 50);
    }

    // Particules décoratives (étoiles)
    const stars = this.add.graphics();
    stars.fillStyle(0xF0EAD6, 1);
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h * 0.6;
      const s = Math.random() < 0.3 ? 2 : 1;
      stars.fillRect(Math.floor(x), Math.floor(y), s, s);
    }

    // Ligne rouge horizontale décorative
    const deco = this.add.graphics();
    deco.lineStyle(2, 0xD62828, 0.6);
    deco.lineBetween(0, h * 0.62, w, h * 0.62);
    deco.lineStyle(1, 0x8B6914, 0.4);
    deco.lineBetween(0, h * 0.62 + 4, w, h * 0.62 + 4);
  }

  private cleanup(): void {
    this.elements.forEach(el => el.remove());
    this.elements = [];
  }

  private renderHTML(): void {
    this.cleanup();
    const isReg = this.mode === 'register';

    // Scanlines
    const scanlines = document.createElement('div');
    scanlines.className = 'op-scanlines';
    document.body.appendChild(scanlines);
    this.elements.push(scanlines);

    const wrapper = document.createElement('div');
    wrapper.className = 'op-auth-wrapper';

    // Logo
    const logo = document.createElement('div');
    logo.innerHTML = `
      <div class="op-auth-logo">🏴‍☠️ ONE PIECE RPG</div>
      <div class="op-auth-subtitle">MULTIJOUEUR</div>
    `;
    wrapper.appendChild(logo);

    // Card
    const card = document.createElement('div');
    card.className = 'op-auth-card';

    // Tabs
    const tabs = document.createElement('div');
    tabs.className = 'op-tabs';
    const tabLogin = document.createElement('button');
    tabLogin.className = `op-tab ${!isReg ? 'active' : ''}`;
    tabLogin.textContent = 'CONNEXION';
    const tabReg = document.createElement('button');
    tabReg.className = `op-tab ${isReg ? 'active' : ''}`;
    tabReg.textContent = 'INSCRIPTION';
    tabLogin.onclick = () => { this.mode = 'login'; this.renderHTML(); };
    tabReg.onclick = () => { this.mode = 'register'; this.renderHTML(); };
    tabs.appendChild(tabLogin);
    tabs.appendChild(tabReg);
    card.appendChild(tabs);

    const mk = (type: string, ph: string) => {
      const i = document.createElement('input');
      i.type = type; i.placeholder = ph; i.className = 'op-input';
      return i;
    };

    const email = mk('email', 'Email');
    const username = mk('text', 'Pseudo — ton nom de pirate');
    const password = mk('password', 'Mot de passe');
    const error = document.createElement('div');
    error.className = 'op-error';

    card.appendChild(email);
    if (isReg) card.appendChild(username);
    card.appendChild(password);
    card.appendChild(error);

    const submitBtn = document.createElement('button');
    submitBtn.className = 'op-btn-primary';
    submitBtn.textContent = isReg ? 'PARTIR EN MER !' : 'HISSER LES VOILES !';
    card.appendChild(submitBtn);

    // OAuth
    const divider = document.createElement('div');
    divider.className = 'op-divider';
    divider.textContent = 'ou';
    card.appendChild(divider);

    const oauthRow = document.createElement('div');
    oauthRow.className = 'op-oauth-row';
    const disc = document.createElement('a');
    disc.href = `${SERVER_URL}/auth/discord`;
    disc.className = 'op-oauth-btn op-oauth-discord';
    disc.textContent = '🎮 DISCORD';
    const goog = document.createElement('a');
    goog.href = `${SERVER_URL}/auth/google`;
    goog.className = 'op-oauth-btn op-oauth-google';
    goog.textContent = '🔍 GOOGLE';
    oauthRow.appendChild(disc);
    oauthRow.appendChild(goog);
    card.appendChild(oauthRow);

    wrapper.appendChild(card);
    document.body.appendChild(wrapper);
    this.elements.push(wrapper);

    const submit = async () => {
      error.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'CHARGEMENT...';
      try {
        const res = isReg
          ? await register(email.value.trim(), username.value.trim(), password.value)
          : await login(email.value.trim(), password.value);
        setAccessToken(res.accessToken);
        this.cleanup();
        this.scene.start('MainMenuScene');
      } catch (e: any) {
        error.textContent = e.message ?? 'Erreur inconnue';
        submitBtn.disabled = false;
        submitBtn.textContent = isReg ? 'PARTIR EN MER !' : 'HISSER LES VOILES !';
      }
    };

    submitBtn.addEventListener('click', submit);
    password.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    email.focus();
  }

  shutdown(): void { this.cleanup(); }
}
