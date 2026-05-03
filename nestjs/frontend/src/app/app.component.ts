import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../environments/environment';
import { ApiService, AuthResponse, BlogPost, PostInput, User } from './api.service';

type AuthState = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

const emptyAuthForm = {
  name: '',
  email: '',
  password: '',
};

const emptyPostForm: PostInput = {
  title: '',
  content: '',
  tag: 'Ideas',
  color: '#fff8c5',
  isPinned: false,
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize(options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, string | number | boolean>): void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit {
  readonly colors = ['#fff8c5', '#d7f7c2', '#d7efff', '#ffe0e6', '#eadcff', '#f1f3f4'];
  readonly tags = ['Ideas', 'Draft', 'Story', 'Work', 'Learning'];
  readonly googleEnabled = Boolean(environment.googleClientId);

  auth = signal<AuthState | null>(this.readStoredAuth());
  posts = signal<BlogPost[]>([]);
  users = signal<User[]>([]);
  message = signal('');
  loading = signal(false);
  search = signal('');
  activeTag = signal('All');
  authMode = signal<'login' | 'register'>('login');
  authForm = { ...emptyAuthForm };
  forgotEmail = '';
  resetToken = this.readInitialResetToken();
  showForgotPassword = signal(false);
  showResetPassword = signal(Boolean(this.resetToken));
  newPassword = '';
  confirmPassword = '';
  changePasswordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };
  postForm: PostInput = { ...emptyPostForm };

  readonly filteredPosts = computed(() => {
    const text = this.search().trim().toLowerCase();
    const tag = this.activeTag();

    return this.posts().filter((post) => {
      const matchesTag = tag === 'All' || post.tag === tag;
      const matchesSearch =
        !text ||
        post.title.toLowerCase().includes(text) ||
        post.content.toLowerCase().includes(text) ||
        post.tag.toLowerCase().includes(text);

      return matchesTag && matchesSearch;
    });
  });

  readonly availableTags = computed(() => {
    const values = new Set(this.posts().map((post) => post.tag));
    return ['All', ...Array.from(values)];
  });

  constructor(private readonly api: ApiService) {
    void this.loadUsers().catch((error) => {
      this.message.set(this.getErrorMessage(error));
    });

    if (this.auth()) {
      void this.loadPosts().catch((error) => {
        this.message.set(this.getErrorMessage(error));
      });
    }
  }

  ngAfterViewInit() {
    this.renderGoogleButton();
  }

  async submitAuth() {
    await this.run(async () => {
      const response =
        this.authMode() === 'register'
          ? await firstValueFrom(this.api.register(this.authForm))
          : await firstValueFrom(
              this.api.login({
                email: this.authForm.email,
                password: this.authForm.password,
              }),
            );

      this.saveAuth(response);
      this.authForm = { ...emptyAuthForm };
      await this.loadPosts();
      await this.loadUsers();
      this.message.set(this.authMode() === 'register' ? 'Account created.' : 'Welcome back.');
    });
  }

  async logout() {
    await this.run(async () => {
      const current = this.auth();
      if (current) {
        await firstValueFrom(this.api.logout(current.refreshToken));
      }

      this.auth.set(null);
      this.posts.set([]);
      this.clearStoredAuth();
      this.message.set('Logged out.');
    });
  }

  async refreshSession() {
    await this.run(async () => {
      const current = this.requireAuth();
      const response = await firstValueFrom(this.api.refresh(current.refreshToken));
      this.saveAuth(response);
      await this.loadPosts();
      this.message.set('Session refreshed.');
    });
  }

  async sendResetToken() {
    await this.run(async () => {
      const email = this.forgotEmail || this.authForm.email;
      const response = await firstValueFrom(this.api.forgotPassword(email));
      this.forgotEmail = '';
      this.showForgotPassword.set(false);
      this.message.set(response.message);
    });
  }

  async resetPassword() {
    await this.run(async () => {
      const response = await firstValueFrom(
        this.api.resetPassword({
          token: this.resetToken,
          password: this.newPassword,
          confirmPassword: this.confirmPassword,
        }),
      );
      this.resetToken = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.showResetPassword.set(false);
      window.history.replaceState({}, document.title, window.location.pathname);
      this.message.set(response.message);
    });
  }

  async changePassword() {
    await this.run(async () => {
      const response = await this.withFreshAuth((accessToken) =>
        firstValueFrom(this.api.changePassword(accessToken, this.changePasswordForm)),
      );
      this.changePasswordForm = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      };
      this.message.set(response.message);
    });
  }

  async savePost() {
    await this.run(async () => {
      const post = await this.withFreshAuth((accessToken) =>
        firstValueFrom(this.api.createPost(accessToken, this.postForm)),
      );
      this.posts.set([post, ...this.posts()]);
      this.postForm = { ...emptyPostForm };
      this.message.set('Post saved.');
    });
  }

  async togglePinned(post: BlogPost) {
    await this.updatePost(post, { isPinned: !post.isPinned });
  }

  async changeColor(post: BlogPost, color: string) {
    await this.updatePost(post, { color });
  }

  async deletePost(post: BlogPost) {
    await this.run(async () => {
      await this.withFreshAuth((accessToken) =>
        firstValueFrom(this.api.deletePost(accessToken, post.id)),
      );
      this.posts.set(this.posts().filter((item) => item.id !== post.id));
      this.message.set('Post deleted.');
    });
  }

  updateSearch(value: string) {
    this.search.set(value);
  }

  setTag(tag: string) {
    this.activeTag.set(tag);
  }

  openForgotPassword() {
    this.forgotEmail = this.authForm.email;
    this.showForgotPassword.set(true);
    this.showResetPassword.set(false);
  }

  private async updatePost(post: BlogPost, input: Partial<PostInput>) {
    await this.run(async () => {
      const updated = await this.withFreshAuth((accessToken) =>
        firstValueFrom(this.api.updatePost(accessToken, post.id, input)),
      );
      this.posts.set(
        this.posts().map((item) => (item.id === updated.id ? updated : item)),
      );
    });
  }

  private async loadPosts() {
    const posts = await this.withFreshAuth((accessToken) =>
      firstValueFrom(this.api.getPosts(accessToken)),
    );
    this.posts.set(posts);
  }

  private async loadUsers() {
    const users = await firstValueFrom(this.api.getUsers());
    this.users.set(users);
  }

  private saveAuth(response: AuthResponse) {
    const state = {
      user: response.user,
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    };

    this.auth.set(state);
    localStorage.setItem('keepblog-auth', JSON.stringify(state));
  }

  private clearStoredAuth() {
    localStorage.removeItem('keepblog-auth');
  }

  private readInitialResetToken() {
    return new URLSearchParams(window.location.search).get('resetToken') ?? '';
  }

  private renderGoogleButton() {
    if (!environment.googleClientId) {
      return;
    }

    const render = () => {
      const googleId = window.google?.accounts?.id;
      const container = document.getElementById('googleSignInButton');
      if (!googleId || !container) {
        return;
      }

      container.innerHTML = '';
      googleId.initialize({
        client_id: environment.googleClientId,
        callback: (response) => void this.submitGoogleCredential(response.credential),
      });
      googleId.renderButton(container, {
        size: 'large',
        text: 'continue_with',
        theme: 'outline',
        width: 278,
      });
    };

    if (window.google?.accounts?.id) {
      render();
      return;
    }

    const existingScript = document.getElementById('google-identity-services');
    if (existingScript) {
      existingScript.addEventListener('load', render, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.addEventListener('load', render, { once: true });
    document.head.appendChild(script);
  }

  private async submitGoogleCredential(idToken?: string) {
    await this.run(async () => {
      if (!idToken) {
        throw new Error('Google did not return an ID token.');
      }

      const response = await firstValueFrom(this.api.google(idToken));
      this.saveAuth(response);
      this.authForm = { ...emptyAuthForm };
      await this.loadPosts();
      await this.loadUsers();
      this.message.set('Signed in with Google.');
    });
  }

  private readStoredAuth(): AuthState | null {
    const stored = localStorage.getItem('keepblog-auth');
    return stored ? (JSON.parse(stored) as AuthState) : null;
  }

  private requireAuth(): AuthState {
    const current = this.auth();
    if (!current) {
      throw new Error('Please login first.');
    }

    return current;
  }

  private async withFreshAuth<T>(action: (accessToken: string) => Promise<T>): Promise<T> {
    const current = this.requireAuth();

    try {
      return await action(current.accessToken);
    } catch (error) {
      if (!this.isTokenUnauthorized(error)) {
        throw error;
      }
    }

    let response: AuthResponse;
    try {
      response = await firstValueFrom(this.api.refresh(current.refreshToken));
    } catch {
      this.auth.set(null);
      this.posts.set([]);
      this.clearStoredAuth();
      throw new Error('Session expired. Please login again.');
    }

    this.saveAuth(response);
    return action(response.accessToken);
  }

  private isTokenUnauthorized(error: unknown) {
    if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
      return false;
    }

    const message = this.getErrorMessage(error).toLowerCase();
    return message.includes('access token') || message.includes('invalid access token');
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof HttpErrorResponse) {
      const message = error.error?.message;
      if (Array.isArray(message)) {
        return message.join(' ');
      }

      if (typeof message === 'string') {
        return message;
      }
    }

    return error instanceof Error ? error.message : 'Something went wrong.';
  }

  private async run(action: () => Promise<void>) {
    this.loading.set(true);
    this.message.set('');

    try {
      await action();
    } catch (error) {
      this.message.set(this.getErrorMessage(error));
    } finally {
      this.loading.set(false);
    }
  }
}
