import { inject, Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpHandlerFn,
  HttpEvent
} from '@angular/common/http';
import { EMPTY, Observable, catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Excluir endpoints de autenticación
  if (shouldSkipInterceptor(req)) {
    return next(req);
  }

  const token = auth.getToken();
  
  // Si no hay token o es inválido, redirigir a login
  if (!token || !auth.isTokenValid(token)) {
    auth.logout();
    router.navigate(['login'], { 
      queryParams: { expired: 'true' } 
    });
    return EMPTY;
  }

  // Clonar la petición con el token
  const authReq = addTokenToRequest(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejar error 401 (No autorizado)
      if (error.status === 401 && !req.url.includes('auth/refresh')) {
        return handleUnauthorizedError(req, next, auth, router);
      }
      return throwError(() => error);
    })
  );
};

// --- Funciones auxiliares ---

function shouldSkipInterceptor(req: HttpRequest<unknown>): boolean {
  const skipUrls = ['/auth/login', '/auth/refresh', '/auth/revoke'];
  return skipUrls.some(url => req.url.includes(url)) || 
         req.headers.has('Skip-Interceptor');
}

function addTokenToRequest(
  req: HttpRequest<unknown>, 
  token: string
): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}


function handleUnauthorizedError(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  auth: AuthService,
  router: Router
): 


Observable<HttpEvent<unknown>> {
  // Intento de renovación silenciosa
  return auth.refreshToken().pipe(
    switchMap(() => {
      const newToken = auth.getToken();
      if (!newToken) throw new Error('Token renewal failed');
      return next(addTokenToRequest(req, newToken));
    }),
    catchError(() => {
      // Redirigir solo si falla la renovación
      auth.logout();
      router.navigate(['/login'], { 
        state: { sessionExpired: true } 
      });
      return EMPTY;
    })
  );
}