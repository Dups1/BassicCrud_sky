import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tarjeta } from '../models/tarjeta.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class TarjetaService {
  private apiUrl = `${environment.apiUrl}/tarjeta.php`;

  constructor(private http: HttpClient) {}

  getByUsuario(id_usuario: number): Observable<Tarjeta[]> {
    return this.http.get<Tarjeta[]>(`${this.apiUrl}?id_usuario=${id_usuario}`);
  }

  create(tarjeta: Tarjeta): Observable<any> {
    return this.http.post(this.apiUrl, tarjeta);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}
