import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Radar } from '../models/radar.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class RadarService {
  private apiUrl = `${environment.apiUrl}/radar.php`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Radar[]> {
    return this.http.get<Radar[]>(this.apiUrl);
  }

  getByUsuario(id_usuario: number): Observable<Radar[]> {
    return this.http.get<Radar[]>(`${this.apiUrl}?id_usuario=${id_usuario}`);
  }

  getById(id: number): Observable<Radar> {
    return this.http.get<Radar>(`${this.apiUrl}?id=${id}`);
  }

  create(lugar: Radar): Observable<any> {
    return this.http.post(this.apiUrl, lugar);
  }

  update(id: number, lugar: Radar): Observable<any> {
    return this.http.put(`${this.apiUrl}?id=${id}`, lugar);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}
