import Phaser from 'phaser';
import { register, login, setAccessToken } from '../api/auth';

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? '';

export class LoginScene extends Phaser.Scene {
  private mode: 'login' | 'register' = 'login';
  private elements: HTMLElement[] = [];

  constructor() {
    super({ key: 'LoginScene' });
  }

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
    this.renderUI();
  }

  private cleanup(): void {
    this.elements.forEach((el) => el.remove());
    this.elements = [];
  }

  private renderUI(): void {
    this.cleanup();
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.add.rectangle(width / 2, height / 2, width, height, 0x0a1628);
    this.add.text(width / 2, 80, '🏴‍☠️ ONE PIECE RPG', {
      fontSize: '42px', color: '#e8a000', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(width / 2, 135, 'Multijoueur', {
      fontSize: '18px', color: '#aaaaaa',
    }).setOrigin(0.5);

    const isRegister = this.mode === 'register';

    const container = document.createElement('div');
    container.style.cssText = `
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      display: flex; flex-direction: column; gap: 12px;
      width: 320px;
    `;

    const makeInput = (type: string, placeholder: string): HTMLInputElement => {
      const el = document.createElement('input');
      el.type = type;
      el.placeholder = placeholder;
      el.style.cssText = `
        padding: 10px 14px; font-size: 15px;
        border: 2px solid #334; border-radius: 6px;
        background: #0d1f35; color: #fff; outline: none;
        transition: border-color .2s;
      `;
      el.addEventListener('focus', () => (el.style.borderColor = '#e8a000'));
      el.addEventListener('blur', () => (el.style.borderColor = '#334'));
      return el;
    };

    const emailInput = makeInput('email', 'Email');
    const usernameInput = makeInput('text', 'Pseudo (3-20 caractères)');
    const passwordInput = makeInput('password', 'Mot de passe');
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'color: #ff6b6b; font-size: 13px; min-height: 18px; text-align: center;';

    container.appendChild(emailInput);
    if (isRegister) container.appendChild(usernameInput);
    container.appendChild(passwordInput);
    container.appendChild(errorDiv);

    const submitBtn = document.createElement('button');
    submitBtn.textContent = isRegister ? 'Créer mon compte' : 'Se connecter';
    submitBtn.style.cssText = `
      padding: 12px; font-size: 16px; font-weight: bold;
      background: #e8a000; color: #0a1628; border: none;
      border-radius: 6px; cursor: pointer; transition: background .2s;
    `;
    submitBtn.addEventListener('mouseenter', () => (submitBtn.style.background = '#ffb800'));
    submitBtn.addEventListener('mouseleave', () => (submitBtn.style.background = '#e8a000'));
    container.appendChild(submitBtn);

    const sep = document.createElement('div');
    sep.innerHTML = '<hr style="border-color:#334;margin:4px 0"><span style="color:#888;font-size:13px">ou continuer avec</span><hr style="border-color:#334;margin:4px 0">';
    sep.style.cssText = 'display:flex;align-items:center;gap:8px;';
    container.appendChild(sep);

    const oauthRow = document.createElement('div');
    oauthRow.style.cssText = 'display:flex;gap:10px;';
    const makeOAuthBtn = (label: string, color: string, href: string): HTMLAnchorElement => {
      const btn = document.createElement('a');
      btn.href = href;
      btn.textContent = label;
      btn.style.cssText = `
        flex: 1; padding: 10px; text-align: center; font-size: 14px; font-weight: bold;
        background: ${color}; color: #fff; border-radius: 6px;
        text-decoration: none; transition: opacity .2s;
      `;
      btn.addEventListener('mouseenter', () => (btn.style.opacity = '0.85'));
      btn.addEventListener('mouseleave', () => (btn.style.opacity = '1'));
      return btn;
    };
    oauthRow.appendChild(makeOAuthBtn('🎮 Discord', '#5865F2', `${SERVER_URL}/auth/discord`));
    oauthRow.appendChild(makeOAuthBtn('🔍 Google', '#4285F4', `${SERVER_URL}/auth/google`));
    container.appendChild(oauthRow);

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire";
    toggleBtn.style.cssText = `background: none; border: none; color: #e8a000; cursor: pointer; font-size: 13px; padding: 4px;`;
    toggleBtn.addEventListener('click', () => {
      this.mode = isRegister ? 'login' : 'register';
      this.renderUI();
    });
    container.appendChild(toggleBtn);

    document.body.appendChild(container);
    this.elements.push(container);

    const handleSubmit = async () => {
      errorDiv.textContent = '';
      submitBtn.disabled = true;
      submitBtn.textContent = 'Chargement...';
      try {
        let result;
        if (isRegister) {
          result = await register(emailInput.value.trim(), usernameInput.value.trim(), passwordInput.value);
        } else {
          result = await login(emailInput.value.trim(), passwordInput.value);
        }
        setAccessToken(result.accessToken);
        this.cleanup();
        this.scene.start('MainMenuScene');
      } catch (err: any) {
        errorDiv.textContent = err.message ?? 'Erreur inconnue';
        submitBtn.disabled = false;
        submitBtn.textContent = isRegister ? 'Créer mon compte' : 'Se connecter';
      }
    };

    submitBtn.addEventListener('click', handleSubmit);
    passwordInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleSubmit(); });
    emailInput.focus();
  }

  shutdown(): void { this.cleanup(); }
}
