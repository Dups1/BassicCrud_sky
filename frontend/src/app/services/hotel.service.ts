import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Hotel } from '../models/hotel.model';
import { environment } from '../config/environment';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private apiUrl = `${environment.apiUrl}/hoteles.php`;

  constructor(private http: HttpClient) {
    console.log('🔧 HotelService creado');
    console.log('🌐 API URL:', this.apiUrl);
  }

  getAll(): Observable<Hotel[]> {
    console.log('📡 GET:', this.apiUrl);
    return this.http.get<Hotel[]>(this.apiUrl).pipe(
      tap(data => console.log('✅ Respuesta:', data))
    );
  }

  getById(id: number): Observable<Hotel> {
    return this.http.get<Hotel>(`${this.apiUrl}?id=${id}`);
  }

  create(hotel: Hotel): Observable<any> {
    return this.http.post(this.apiUrl, hotel);
  }

  update(id: number, hotel: Hotel): Observable<any> {
    return this.http.put(`${this.apiUrl}?id=${id}`, hotel);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}?id=${id}`);
  }
}
