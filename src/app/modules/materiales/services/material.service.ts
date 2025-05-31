import { Injectable } from '@angular/core';
import { Material } from '../models/material.model';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MaterialesService {
  private materiales: Material[] = [
    {
      id: 1,
      nombre: 'Cemento',
      descripcion: 'Cemento gris para construcción',
      cantidad: 100,
      unidadMedida: 'kg',
      fechaAdquisicion: new Date('2023-01-01'),
    },
    {
      id: 2,
      nombre: 'Pintura',
      descripcion: 'Pintura blanca para interiores',
      cantidad: 50,
      unidadMedida: 'litros',
      fechaAdquisicion: new Date('2023-02-01'),
    },
  ];

  getMateriales() {
    return of(this.materiales); // Simula una llamada HTTP
  }

  addMaterial(material: Material) {
    this.materiales.push(material);
    return of(material);
  }

  updateMaterial(material: Material) {
    const index = this.materiales.findIndex((m) => m.id === material.id);
    if (index !== -1) {
      this.materiales[index] = material;
    }
    return of(material);
  }

  deleteMaterial(id: number) {
    this.materiales = this.materiales.filter((m) => m.id !== id);
    return of(null);
  }
}