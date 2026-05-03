import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type BlogPost = {
  id: string;
  userId: string;
  title: string;
  content: string;
  tag: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PostInput = {
  title: string;
  content: string;
  tag: string;
  color: string;
  isPinned: boolean;
};

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/users`);
  }

  register(input: { name: string; email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, input);
  }

  login(input: { email: string; password: string }) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, input);
  }

  google(idToken: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/google`, {
      idToken,
    });
  }

  logout(refreshToken: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/logout`, {
      refreshToken,
    });
  }

  refresh(refreshToken: string) {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, {
      refreshToken,
    });
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/forgot-password`,
      { email },
    );
  }

  resetPassword(input: { token: string; password: string; confirmPassword: string }) {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/reset-password`,
      input,
    );
  }

  changePassword(
    accessToken: string,
    input: {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    },
  ) {
    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/auth/change-password`,
      input,
      {
        headers: this.authHeaders(accessToken),
      },
    );
  }

  getPosts(accessToken: string) {
    return this.http.get<BlogPost[]>(`${environment.apiUrl}/posts`, {
      headers: this.authHeaders(accessToken),
    });
  }

  createPost(accessToken: string, input: PostInput) {
    return this.http.post<BlogPost>(`${environment.apiUrl}/posts`, input, {
      headers: this.authHeaders(accessToken),
    });
  }

  updatePost(accessToken: string, postId: string, input: Partial<PostInput>) {
    return this.http.patch<BlogPost>(`${environment.apiUrl}/posts/${postId}`, input, {
      headers: this.authHeaders(accessToken),
    });
  }

  deletePost(accessToken: string, postId: string) {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/posts/${postId}`, {
      headers: this.authHeaders(accessToken),
    });
  }

  private authHeaders(accessToken: string) {
    return new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });
  }
}
