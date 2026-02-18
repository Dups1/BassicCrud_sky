export interface Servicio {
  id_servicio?: number;
  id_hotel: number;
  id_cliente: number;
  fecha_entrada: string;
  fecha_salida: string;
  precio: number;
  nombre_hotel?: string;
  nombre_cliente?: string;
}
