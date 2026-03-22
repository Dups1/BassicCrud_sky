export interface Transferencia {
  id_transferencia?: number;
  id_usuario: number;
  nombre_usuario: string;
  id_promocion: number;
  nombre_lugar: string;
  monto: number;
  dias: number;
  fecha_transaccion?: string;
}
