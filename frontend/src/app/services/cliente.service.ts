import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Cliente } from '../models/cliente.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = `${environment.apiUrl}/clientes.php`;

  constructor(private http: HttpClient) {
    console.log('🔧 ClienteService creado');
    console.log('🌐 API URL:', this.apiUrl);
  }

  getAll(): Observable<Cliente[]> {
    console.log('📡 GET:', this.apiUrl);
    return this.http.get<Cliente[]>(this.apiUrl).pipe(
      tap(data => console.log('✅ Respuesta clientes:', data))
    );
  }

  getById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}?id=${id}`);
  }

  create(cliente: Cliente): Observable<any> {
    return this.http.post(this.apiUrl, cliente);
  }

  update(id: number, cliente: Cliente): Observable<any> {
    return this.http.put(`${this.apiUrl}?id=${id}`, cliente);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}
