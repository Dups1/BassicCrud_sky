import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.component.html'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  modo = signal<'login' | 'register'>('login');
  cargando = signal(false);
  error = signal<string | null>(null);
  exito = signal<string | null>(null);

  loginForm = { identificador: '', password: '' };
  registerForm = { nombre: '', correo: '', nc: '', password: '', confirmar: '' };

  cambiarModo(m: 'login' | 'register') {
    this.modo.set(m);
    this.error.set(null);
    this.exito.set(null);
  }

  login() {
    this.error.set(null);
    if (!this.loginForm.identificador || !this.loginForm.password) {
      this.error.set('Completa todos los campos');
      return;
    }

    this.cargando.set(true);
    this.authService.login(this.loginForm).subscribe({
      next: (res) => {
        if (res.error) {
          this.error.set(res.error);
        } else {
          this.authService.guardarSesion(res);
          this.router.navigate(['/']);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error de conexión');
        this.cargando.set(false);
      }
    });
  }

  register() {
    this.error.set(null);
    if (!this.registerForm.nombre || !this.registerForm.correo || !this.registerForm.password) {
      this.error.set('Nombre, correo y contraseña son obligatorios');
      return;
    }
    if (this.registerForm.password.length < 8) {
      this.error.set('La contraseña debe tener mínimo 8 caracteres');
      return;
    }
    if (this.registerForm.password !== this.registerForm.confirmar) {
      this.error.set('Las contraseñas no coinciden');
      return;
    }

    this.cargando.set(true);
    const payload: any = {
      nombre: this.registerForm.nombre,
      correo: this.registerForm.correo,
      password: this.registerForm.password
    };
    if (this.registerForm.nc) payload.nc = this.registerForm.nc;

    this.authService.register(payload).subscribe({
      next: (res) => {
        if (res.error) {
          this.error.set(res.error);
        } else {
          this.exito.set('Registro exitoso. Ahora inicia sesión.');
          this.registerForm = { nombre: '', correo: '', nc: '', password: '', confirmar: '' };
          setTimeout(() => this.cambiarModo('login'), 1500);
        }
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('Error de conexión');
        this.cargando.set(false);
      }
    });
  }
}
