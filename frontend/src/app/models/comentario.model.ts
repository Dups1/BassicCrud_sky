export interface Comentario {
  id_comentario?: number;
  id_radar: number;
  id_usuario?: number | null;
  nombre_estudiante: string;
  calificacion: number;
  opinion: string;
  fecha_creacion?: string;
}
