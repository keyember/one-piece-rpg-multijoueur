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
      return;
    }
    // Redirigé après vérification email réussie
    if (params.get('verified') === '1') {
      window.history.replaceState({}, '', '/');
    }
  }

  create(): void {
    if (!this.scene.isActive('OceanBackgroundScene')) {
      this.scene.launch('OceanBackgroundScene');
    }
    this.scene.sendToBack('OceanBackgroundScene');

    const params = new URLSearchParams(window.location.search);
    const verified = params.get('verified') === '1';
    this.renderUI(verified ? 'Email vérifié ! Tu peux maintenant te connecter.' : undefined);
  }

  private cleanup(): void {
    this.elements.forEach(el => el.remove());
    this.elements = [];
  }

  private renderUI(successMessage?: string): void {
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

    const rule = document.createElement('div');
    rule.className = 'op-nav-rule';
    rule.innerHTML = '<div class="op-nav-rule-diamond"></div>';
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

    // Message de succès (vérification email ou inscription)
    if (successMessage) {
      const successDiv = document.createElement('div');
      successDiv.className = 'op-nav-success';
      successDiv.textContent = successMessage;
      card.appendChild(successDiv);
    }

    const tabs = document.createElement('div');
    tabs.className = 'op-nav-tabs';
    const tabLogin = document.createElement('button');
    tabLogin.className = `op-nav-tab ${!isReg ? 'active' : ''}`;
    tabLogin.textContent = "S'IDENTIFIER";
    const tabReg = document.createElement('button');
    tabReg.className = `op-nav-tab ${isReg ? 'active' : ''}`;
    tabReg.textContent = "S'INSCRIRE";
    tabLogin.onclick = () => { this.mode = 'login'; this.renderUI(); };
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
    const [userWrap,  userInput]  = mkField('NOM DE PIRATE', 'text', 'ex : chapeau_de_paille');
    const [passWrap,  passInput]  = mkField('MOT DE PASSE SECRET', 'password', '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022');

    card.appendChild(emailWrap);
    if (isReg) card.appendChild(userWrap);
    card.appendChild(passWrap);

    const errorDiv = document.createElement('div');
    errorDiv.className = 'op-nav-error';
    card.appendChild(errorDiv);

    const btn = document.createElement('button');
    btn.className = 'op-nav-btn';
    btn.textContent = isReg ? "S'ENR\u00d4LER" : 'PRENDRE LA MER';
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
    disc.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg> Discord`;

    const goog = document.createElement('a');
    goog.href = `${SERVER_URL}/auth/google`;
    goog.className = 'op-nav-oauth-btn op-oauth-google';
    goog.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google`;

    oauthRow.appendChild(disc);
    oauthRow.appendChild(goog);
    card.appendChild(oauthRow);

    scene.appendChild(card);
    document.body.appendChild(scene);
    this.elements.push(scene);

    const submit = async () => {
      errorDiv.textContent = '';
      btn.disabled = true;
      btn.textContent = 'EN COURS...';
      try {
        if (isReg) {
          const res = await register(emailInput.value.trim(), userInput.value.trim(), passInput.value);
          // Afficher le message de confirmation sans rediriger
          this.renderUI(res.message);
        } else {
          const res = await login(emailInput.value.trim(), passInput.value);
          setAccessToken(res.accessToken);
          this.cleanup();
          this.scene.start('MainMenuScene');
        }
      } catch (e: any) {
        errorDiv.textContent = e.message ?? 'Erreur inconnue';
        btn.disabled = false;
        btn.textContent = isReg ? "S'ENR\u00d4LER" : 'PRENDRE LA MER';
      }
    };

    btn.addEventListener('click', submit);
    passInput.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    emailInput.focus();
  }

  shutdown(): void { this.cleanup(); }
}
