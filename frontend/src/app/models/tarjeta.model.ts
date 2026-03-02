export interface Tarjeta {
  id_tarjeta?: number;
  id_usuario?: number;
  numero_tarjeta: string;
  fecha_vencimiento: string;
  cvv?: string;
  nombre_titular: string;
}
