import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Servicio } from '../models/servicio.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class ServicioService {
  private apiUrl = `${environment.apiUrl}/servicios.php`;

  constructor(private http: HttpClient) {
    console.log('🔧 ServicioService creado');
    console.log('🌐 API URL:', this.apiUrl);
  }

  getAll(): Observable<Servicio[]> {
    console.log('📡 GET:', this.apiUrl);
    return this.http.get<Servicio[]>(this.apiUrl).pipe(
      tap(data => console.log('✅ Respuesta servicios:', data))
    );
  }

  getById(id: number): Observable<Servicio> {
    return this.http.get<Servicio>(`${this.apiUrl}?id=${id}`);
  }

  create(servicio: Servicio): Observable<any> {
    return this.http.post(this.apiUrl, servicio);
  }

  update(id: number, servicio: Servicio): Observable<any> {
    return this.http.put(`${this.apiUrl}?id=${id}`, servicio);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}
