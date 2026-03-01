import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/usuarios.php`;

  constructor(private http: HttpClient) {}

  register(data: { nombre: string; correo: string; nc?: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}?action=register`, data);
  }

  login(data: { identificador: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}?action=login`, data);
  }

  guardarUbicacion(id_usuario: number, latitud: number, longitud: number): Observable<any> {
    return this.http.put(`${this.apiUrl}?action=ubicacion`, { id_usuario, latitud, longitud });
  }

  guardarSesion(usuario: any) {
    localStorage.setItem('usuario', JSON.stringify(usuario));
  }

  getSesion(): any {
    const data = localStorage.getItem('usuario');
    return data ? JSON.parse(data) : null;
  }

  cerrarSesion() {
    localStorage.removeItem('usuario');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('usuario');
  }
}
