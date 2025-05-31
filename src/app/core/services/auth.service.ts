import { computed, Injectable, OnDestroy, signal } from '@angular/core';
import { AuthApiService } from '../../modules/auth/services/auth-api.service';
import { Router } from '@angular/router';
import { catchError, filter, interval, map, Observable, Subject, takeUntil, tap, throwError } from 'rxjs';
import { User } from '../models/user.model'; // KEEP this import
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthResponse } from '../../modules/auth/models/auth-response.model';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  // Estado de autenticación usando Signals (Angular 16+)
  private _currentUser = signal<User | null>(null);

  // Expose currentUser as a public, readonly signal for direct access (e.g., in templates)
  currentUser = this._currentUser.asReadonly();

  // Expose isAuthenticated as a public, readonly computed signal
  isAuthenticated = computed(() => !!this._currentUser());
  userRoles = computed(() => this._currentUser()?.authorities || []);

  private destroy$ = new Subject<void>();

  private readonly SESSION_WARNING_TIME = 5 * 60 * 1000; // 5 minutos
  private readonly CHECK_INTERVAL = 60 * 1000; // 1 minuto
  private sessionWarningShown = false;

  // Verificación periódica del token (cada 5 minutos)
  private tokenCheckInterval = interval(300000); // This is not currently used, but keep it for future use if intended

  constructor(
    private authApi: AuthApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loadUserFromStorage();
    this.startTokenValidation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Inicia sesión y guarda los tokens
   * @param credentials Credenciales del usuario
   */
  login(credentials: {username: string, password: string}): Observable<User> {
    return this.authApi.login(credentials).pipe(
      tap(response => this.updateAuthState(response)),
      map(response => this.mapToUser(response)),
      catchError(error => {
        this.handleAuthError(error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Renueva los tokens de autenticación
   */
  refreshToken(): Observable<User> {
    const refreshToken = this._currentUser()?.refreshToken;
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('No hay token de refresco disponible'));
    }

    return this.authApi.refreshToken(refreshToken).pipe(
      tap(response => this.updateAuthState(response)),
      map(response => this.mapToUser(response)),
      catchError(error => {
        this.handleAuthError(error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Cierra la sesión y limpia los datos
   */
  logout(): void {
    const refreshToken = this._currentUser()?.refreshToken;
    if (refreshToken) {
      this.authApi.revokeToken(refreshToken).subscribe();
    }
    this.clearAuthState();
    this.router.navigate(['/login']);
  }

  /**
   * Obtiene el token JWT actual
   */
  getToken(): string | null {
    return this._currentUser()?.token || null;
  }

  /**
   * Verifica si un token JWT es válido
   */
  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp && payload.exp > Date.now() / 1000;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  hasRole(role: string): boolean {
    return this.userRoles().includes(role);
  }

  // --- Métodos privados ---

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        const parsedData = JSON.parse(userData);
        if (parsedData?.token) {
          this._currentUser.set(parsedData);
        }
      } catch (e) {
        console.error('Error al parsear datos de usuario', e);
        this.clearAuthState();
      }
    }
  }

  private updateAuthState(response: AuthResponse): void {
    const userData = this.mapToUser(response);
    localStorage.setItem('user_data', JSON.stringify(userData));
    this._currentUser.set(userData);
  }

  private mapToUser(response: AuthResponse): User {
    return {
      id: response.id,
      username: response.username,
      authorities: response.authorities,
      token: response.token,
      refreshToken: response.refreshToken,
      expirationDate: response.expirationDate,
      type: response.type
    };
  }

  private clearAuthState(): void {
    localStorage.removeItem('user_data');
    this._currentUser.set(null);
  }

  private startTokenValidation(): void {
    interval(this.CHECK_INTERVAL).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const userData = this._currentUser();
      if (!userData?.token) return;

      // Verificar expiración del token
      const isTokenExpiring = this.isTokenExpiringSoon(userData.token);
      const isRefreshExpired = this.isRefreshTokenExpired();

      if (isRefreshExpired) {
        this.handleSessionExpiration();
      } else if (isTokenExpiring && !this.sessionWarningShown) {
        this.showSessionWarning();
      }
    });
  }

  private isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresIn = payload.exp * 1000 - Date.now();
      return expiresIn < this.SESSION_WARNING_TIME;
    } catch {
      return false;
    }
  }

  private isRefreshTokenExpired(): boolean {
    const userData = this._currentUser();
    if (!userData?.expirationDate) return true;
    return new Date(userData.expirationDate).getTime() <= Date.now();
  }

  private showSessionWarning(): void {
    this.sessionWarningShown = true;
    this.snackBar.open(
      'Tu sesión está por expirar. ¿Deseas extenderla?',
      'Extender',
      { duration: 10000 }
    ).onAction().subscribe(() => {
      this.refreshToken().subscribe({
        complete: () => this.sessionWarningShown = false
      });
    });
  }

  private handleSessionExpiration(): void {
    this.snackBar.open(
      'Sesión expirada. Serás redirigido al login',
      'Entendido',
      { duration: 5000 }
    );
    this.logout();
  }

  private handleAuthError(error: any): void {
    const message = error.message || 'Error de autenticación';
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}