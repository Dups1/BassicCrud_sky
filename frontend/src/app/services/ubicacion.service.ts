import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, switchMap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UbicacionService {
  constructor(private http: HttpClient) {}

  getDireccionActual(): Observable<string> {
    const posicion$ = new Observable<GeolocationPosition>(observer => {
      if (!navigator.geolocation) {
        observer.error('Geolocalización no disponible');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => { observer.next(pos); observer.complete(); },
        err => observer.error(err)
      );
    });

    return posicion$.pipe(
      switchMap(pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        return this.http.get<any>(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`
        );
      }),
      map(res => res.display_name ?? '')
    );
  }
}
