import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Horario } from '../models/horario.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class HorarioService {
  private apiUrl = `${environment.apiUrl}/horarios.php`;

  constructor(private http: HttpClient) {}

  getByRadar(idRadar: number): Observable<Horario[]> {
    return this.http.get<Horario[]>(`${this.apiUrl}?id_radar=${idRadar}`);
  }

  create(horario: Horario): Observable<any> {
    return this.http.post(this.apiUrl, horario);
  }

  deleteByRadar(idRadar: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id_radar=${idRadar}`);
  }
}
