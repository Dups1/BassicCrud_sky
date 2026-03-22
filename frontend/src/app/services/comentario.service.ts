import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Comentario } from '../models/comentario.model';
import { environment } from '../config/environment';

@Injectable({ providedIn: 'root' })
export class ComentarioService {
  private apiUrl = `${environment.apiUrl}/comentarios.php`;

  constructor(private http: HttpClient) {}

  getByRadar(idRadar: number): Observable<Comentario[]> {
    return this.http.get<Comentario[]>(`${this.apiUrl}?id_radar=${idRadar}`);
  }

  create(item: Comentario): Observable<any> {
    return this.http.post(this.apiUrl, item);
  }

  update(id: number, item: Comentario): Observable<any> {
    return this.http.put(`${this.apiUrl}?id=${id}`, item);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}
