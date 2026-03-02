import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Promocion } from '../models/promocion.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class PromocionService {
  private apiUrl = `${environment.apiUrl}/promocion.php`;

  constructor(private http: HttpClient) {}

  getByUsuario(id_usuario: number): Observable<Promocion[]> {
    return this.http.get<Promocion[]>(`${this.apiUrl}?id_usuario=${id_usuario}`);
  }

  create(promocion: Promocion): Observable<any> {
    return this.http.post(this.apiUrl, promocion);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}
