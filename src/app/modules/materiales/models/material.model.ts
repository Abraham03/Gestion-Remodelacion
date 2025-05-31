export interface Material {
    id: number;
    nombre: string;
    descripcion: string;
    cantidad: number;
    unidadMedida: string; // Ej: "kg", "litros", "unidades"
    fechaAdquisicion: Date;
  }