import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <nav class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RadarTec
            </div>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center gap-1">
            @if (usuario?.rol === 'admin' || !usuario?.rol) {
              <a routerLink="/radar" class="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium rounded-lg hover:bg-gray-50 transition">
                <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                </svg>
                Admin
              </a>
            }
            @if (usuario?.rol === 'student' || !usuario?.rol) {
              <a routerLink="/radar-alumno" class="px-4 py-2 text-gray-700 hover:text-green-600 font-medium rounded-lg hover:bg-gray-50 transition">
                <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                </svg>
                Radar
              </a>
            }
            @if (usuario?.rol === 'business' || !usuario?.rol) {
              <a routerLink="/promocionarte" class="px-4 py-2 text-gray-700 hover:text-purple-600 font-medium rounded-lg hover:bg-gray-50 transition">
                <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
                Promocion
              </a>
            }
            <a routerLink="/admin-dashboard" class="px-4 py-2 text-gray-700 hover:text-orange-600 font-medium rounded-lg hover:bg-gray-50 transition">
              <svg class="w-5 h-5 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
              Ingresos
            </a>
          </div>

          <!-- User Menu -->
          <div class="flex items-center gap-4">
            <span class="text-sm text-gray-600">{{ usuario?.nombre }}</span>
            <button (click)="cerrarSesion()" class="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg font-medium transition">
              Salir
            </button>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  get usuario() {
    return this.authService.getSesion();
  }

  cerrarSesion() {
    if (confirm('¿Cerrar sesion?')) {
      this.authService.cerrarSesion();
      this.router.navigate(['/login']);
    }
  }
}
