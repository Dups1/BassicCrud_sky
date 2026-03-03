import { Horario } from './horario.model';

export interface Radar {
  id_radar?: number;
  id_usuario?: number;
  id_categoria: number;
  categoria?: string;
  nombre: string;
  direccion: string;
  walkMin?: number | null;
  driveMin?: number | null;
  calificacion?: number | null;
  precio: number;
  nota?: string | null;
  favorito?: boolean;
  patrocinado?: boolean;
  foto?: string | null;
  horarios?: Horario[];
}
