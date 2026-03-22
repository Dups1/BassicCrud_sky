import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transferencia } from '../models/transferencia.model';
import { environment } from '../config/environment';

@Injectable({ providedIn: 'root' })
export class TransferenciaService {
  private apiUrl = `${environment.apiUrl}/transferencias.php`;

  constructor(private http: HttpClient) {}

  getAllAdmin(): Observable<Transferencia[]> {
    return this.http.get<Transferencia[]>(`${this.apiUrl}?admin=1`);
  }

  getByUsuario(idUsuario: number): Observable<Transferencia[]> {
    return this.http.get<Transferencia[]>(`${this.apiUrl}?id_usuario=${idUsuario}`);
  }

  create(item: Transferencia): Observable<any> {
    return this.http.post(this.apiUrl, item);
  }
}
