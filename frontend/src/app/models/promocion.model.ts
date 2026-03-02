export interface Promocion {
  id_promocion?: number;
  id_usuario?: number;
  id_tarjeta: number;
  id_radar: number;
  nombre_radar?: string;
  fecha_inicio: string;
  fecha_fin: string;
  precio: number;
  estado?: string;
}
