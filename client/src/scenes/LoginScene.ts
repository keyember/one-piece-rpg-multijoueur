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

    const card = document.createElement('div');
    card.className = 'op-nav-card';

    const corners = document.createElement('div');
    corners.className = 'op-nav-card-corners';
    corners.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
    card.appendChild(corners);

    const wm = document.createElement('div');
    wm.className = 'op-nav-watermark';
    wm.textContent = 'MARINE';
    card.appendChild(wm);

    const header = document.createElement('div');
    header.className = 'op-nav-header';
    // Ligne décorative
    const rule = document.createElement('div');
    rule.className = 'op-nav-rule';
    rule.innerHTML = '<div class="op-nav-rule-diamond"></div>';
    header.innerHTML = `
      <span class="op-nav-authority">⚓ GOUVERNEMENT MONDIAL · MARINE HQ · GRAND LINE ⚓</span>
    `;
    header.appendChild(rule);
    const titleSpan = document.createElement('span');
    titleSpan.className = 'op-nav-title';
    titleSpan.textContent = 'RECHERCH\u00c9';
    header.appendChild(titleSpan);
    const subtitleSpan = document.createElement('span');
    subtitleSpan.className = 'op-nav-subtitle';
    subtitleSpan.textContent = '\u2014 mort ou vif \u2014';
    header.appendChild(subtitleSpan);
    card.appendChild(header);

    const tabs = document.createElement('div');
    tabs.className = 'op-nav-tabs';
    const tabLogin = document.createElement('button');
    tabLogin.className = `op-nav-tab ${!isReg ? 'active' : ''}`;
    tabLogin.textContent = "S'IDENTIFIER";
    const tabReg = document.createElement('button');
    tabReg.className = `op-nav-tab ${isReg ? 'active' : ''}`;
    tabReg.textContent = "S'INSCRIRE";
    tabLogin.onclick = () => { this.mode = 'login';    this.renderUI(); };
    tabReg.onclick   = () => { this.mode = 'register'; this.renderUI(); };
    tabs.appendChild(tabLogin);
    tabs.appendChild(tabReg);
    card.appendChild(tabs);

    const mkField = (lbl: string, type: string, ph: string): [HTMLDivElement, HTMLInputElement] => {
      const wrap  = document.createElement('div');
      wrap.className = 'op-nav-field';
      const label = document.createElement('label');
      label.className = 'op-nav-label';
      label.textContent = lbl;
      const input = document.createElement('input');
      input.type = type; input.placeholder = ph; input.className = 'op-nav-input';
      wrap.appendChild(label); wrap.appendChild(input);
      return [wrap, input];
    };

    const [emailWrap, emailInput] = mkField('ADRESSE DE CONTACT', 'email', 'votre email...');
    const [userWrap,  userInput]  = mkField('NOM DE PIRATE',      'text',  'ex : chapeau_de_paille');
    const [passWrap,  passInput]  = mkField('MOT DE PASSE SECRET', 'password', '••••••••');

    card.appendChild(emailWrap);
    if (isReg) card.appendChild(userWrap);
    card.appendChild(passWrap);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'op-nav-error';
    card.appendChild(errorDiv);

    const btn = document.createElement('button');
    btn.className = 'op-nav-btn';
    btn.textContent = isReg ? "S'ENRÔLER" : 'CONFIRMER';
    card.appendChild(btn);

    const sep = document.createElement('div');
    sep.className = 'op-nav-divider';
    sep.textContent = 'ou via Den Den Mushi';
    card.appendChild(sep);

    const oauthRow = document.createElement('div');
    oauthRow.className = 'op-nav-oauth';
    const disc = document.createElement('a');
    disc.href = `${SERVER_URL}/auth/discord`;
    disc.className = 'op-nav-oauth-btn op-oauth-discord';
    disc.textContent = '🎮 Discord';
    const goog = document.createElement('a');
    goog.href = `${SERVER_URL}/auth/google`;
    goog.className = 'op-nav-oauth-btn op-oauth-google';
    goog.textContent = '🔍 Google';
    oauthRow.appendChild(disc); oauthRow.appendChild(goog);
    card.appendChild(oauthRow);

    scene.appendChild(card);
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
        btn.textContent = isReg ? "S'ENRÔLER" : 'CONFIRMER';
      }
    };

    btn.addEventListener('click', submit);
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    emailInput.focus();
  }

  shutdown(): void { this.cleanup(); }
}
