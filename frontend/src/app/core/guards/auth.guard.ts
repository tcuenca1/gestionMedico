import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

const HOME_BY_ROLE: Record<string, string> = {
  administrador: '/admin/dashboard',
  recepcionista: '/recepcion',
  medico: '/medico',
  paciente: '/',
};

const PREFIX_BY_ROLE: Record<string, string[]> = {
  administrador: ['/admin', '/recepcion', '/medico'],
  recepcionista: ['/recepcion'],
  medico: ['/medico'],
};

function normalizeRole(rol: string): string {
  return rol
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function decodeToken(token: string): any | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getRoleFromToken(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const decoded = decodeToken(token);
  if (!decoded) return null;
  const rol = decoded.rol ?? decoded.Rol ?? null;
  return rol ? normalizeRole(rol) : null;
}

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const roleGuard = (roles: string[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = getRoleFromToken();

    if (!auth.isAuthenticated()) {
      router.navigate(['/login']);
      return false;
    }

    if (role && !roles.map(normalizeRole).includes(role)) {
      router.navigate([HOME_BY_ROLE[role] || '/']);
      return false;
    }

    const requestedUrl = state.url;
    if (role) {
      const allowedPrefixes = PREFIX_BY_ROLE[role] || [];
      const matches = allowedPrefixes.some((prefix) => requestedUrl.startsWith(prefix));
      if (!matches) {
        router.navigate([HOME_BY_ROLE[role] || '/']);
        return false;
      }
    }

    return true;
  };
};