export interface Catalogo {
  id_catalogo?: number;
  id_radar: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  foto?: string | null;
}
