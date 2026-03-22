import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Catalogo } from '../models/catalogo.model';
import { environment } from '../config/environment';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private apiUrl = `${environment.apiUrl}/catalogo.php`;

  constructor(private http: HttpClient) {}

  getByRadar(idRadar: number): Observable<Catalogo[]> {
    return this.http.get<Catalogo[]>(`${this.apiUrl}?id_radar=${idRadar}`);
  }

  create(item: Catalogo): Observable<any> {
    return this.http.post(this.apiUrl, item);
  }

  update(id: number, item: Partial<Catalogo>): Observable<any> {
    return this.http.put(`${this.apiUrl}?id=${id}`, item);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}
