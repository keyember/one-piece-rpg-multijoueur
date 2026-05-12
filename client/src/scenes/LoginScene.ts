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
    // Lancer la scène de fond en parallèle
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
    const isReg = this.mode === 'register';

    const scene = document.createElement('div');
    scene.className = 'op-login-scene';
    // Fond transparent pour laisser le canvas visible
    scene.style.background = 'transparent';

    const poster = document.createElement('div');
    poster.className = 'op-wanted-poster';

    const wm = document.createElement('div');
    wm.className = 'op-poster-watermark';
    wm.textContent = 'MARINE';
    poster.appendChild(wm);

    const header = document.createElement('div');
    header.className = 'op-poster-header';
    header.innerHTML = `
      <span class="op-poster-authority">⚓ GOUVERNEMENT MONDIAL • MARINE HQ • GRAND LINE ⚓</span>
      <span class="op-poster-wanted">RECHERCHÉ</span>
      <span class="op-poster-dead-alive">— MORT OU VIF —</span>
    `;
    poster.appendChild(header);

    const tabs = document.createElement('div');
    tabs.className = 'op-poster-tabs';
    const tabLogin = document.createElement('button');
    tabLogin.className = `op-poster-tab ${!isReg ? 'active' : ''}`;
    tabLogin.textContent = 'S\'IDENTIFIER';
    const tabReg = document.createElement('button');
    tabReg.className = `op-poster-tab ${isReg ? 'active' : ''}`;
    tabReg.textContent = 'S\'INSCRIRE';
    tabLogin.onclick = () => { this.mode = 'login'; this.renderUI(); };
    tabReg.onclick   = () => { this.mode = 'register'; this.renderUI(); };
    tabs.appendChild(tabLogin);
    tabs.appendChild(tabReg);
    poster.appendChild(tabs);

    const mkField = (lbl: string, type: string, ph: string): [HTMLDivElement, HTMLInputElement] => {
      const wrap = document.createElement('div');
      wrap.className = 'op-poster-field';
      const label = document.createElement('label');
      label.className = 'op-poster-label';
      label.textContent = lbl;
      const input = document.createElement('input');
      input.type = type; input.placeholder = ph; input.className = 'op-poster-input';
      wrap.appendChild(label); wrap.appendChild(input);
      return [wrap, input];
    };

    const [emailWrap, emailInput] = mkField('ADRESSE DE CONTACT', 'email', 'votre email...');
    const [userWrap,  userInput]  = mkField('NOM DE PIRATE', 'text', 'ex : chapeau_de_paille');
    const [passWrap,  passInput]  = mkField('MOT DE PASSE SECRET', 'password', '••••••••');

    poster.appendChild(emailWrap);
    if (isReg) poster.appendChild(userWrap);
    poster.appendChild(passWrap);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'op-poster-error';
    poster.appendChild(errorDiv);

    const btn = document.createElement('button');
    btn.className = 'op-poster-btn';
    btn.textContent = isReg ? 'S\'ENRÔLER !' : 'CONFIRMER';
    poster.appendChild(btn);

    const sep = document.createElement('div');
    sep.className = 'op-poster-divider';
    sep.textContent = 'ou via Den Den Mushi';
    poster.appendChild(sep);

    const oauthRow = document.createElement('div');
    oauthRow.className = 'op-poster-oauth';
    const disc = document.createElement('a');
    disc.href = `${SERVER_URL}/auth/discord`;
    disc.className = 'op-poster-oauth-btn op-oauth-discord';
    disc.textContent = '🎮 Discord';
    const goog = document.createElement('a');
    goog.href = `${SERVER_URL}/auth/google`;
    goog.className = 'op-poster-oauth-btn op-oauth-google';
    goog.textContent = '🔍 Google';
    oauthRow.appendChild(disc); oauthRow.appendChild(goog);
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
        btn.textContent = isReg ? 'S\'ENRÔLER !' : 'CONFIRMER';
      }
    };

    btn.addEventListener('click', submit);
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    emailInput.focus();
  }

  shutdown(): void { this.cleanup(); }
}
