// src/app/modules/proyectos/components/proyectos-form/proyectos-form.component.ts

import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog'; // <-- Import MatDialogModule here
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProyectosService } from '../../services/proyecto.service';
import { ClienteService } from '../../../cliente/services/cliente.service';
import { EmpleadoService } from '../../../empleados/services/empleado.service';
import { Proyecto } from '../../models/proyecto.model';
import { Observable } from 'rxjs';
// import { Cliente } from '../../../cliente/models/cliente.model'; // No longer directly used for client type
// import { Empleado } from '../../../empleados/models/empleado.model'; // No longer directly used for employee type


// Define the DropdownItem interface here or in a common types file
interface DropdownItem {
  id: number;
  nombre: string;
}


@Component({
  selector: 'app-proyectos-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule // <-- Add MatDialogModule here!
  ],
  templateUrl: './proyectos-form.component.html',
  styleUrls: ['./proyectos-form.component.scss'],
})
export class ProyectosFormComponent implements OnInit {
  form!: FormGroup;
  estadosProyecto: string[] = ['Planificado', 'En Progreso', 'En Pausa', 'Completado', 'Cancelado'];
  // Correctly type observables to DropdownItem[]
  clientes$!: Observable<DropdownItem[]>;
  empleados$!: Observable<DropdownItem[]>;

  constructor(
    private fb: FormBuilder,
    private proyectosService: ProyectosService,
    private clientesService: ClienteService,
    private empleadoService: EmpleadoService,
    public dialogRef: MatDialogRef<ProyectosFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Proyecto | null
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadDropdownData();
    if (this.data) {
      this.form.patchValue(this.data);
    }
  }

    private formatEstadoForFrontend(backendEstado: string): string {
    switch (backendEstado) {
      case 'PLANIFICADO': return 'Planificado';
      case 'EN_PROGRESO': return 'En Progreso';
      case 'EN_PAUSA': return 'En Pausa';
      case 'COMPLETADO': return 'Completado';
      case 'CANCELADO': return 'Cancelado';
      default: return backendEstado; // Fallback if no match
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      id: [this.data?.id || null],
      nombreProyecto: [this.data?.nombreProyecto || '', Validators.required],
      descripcion: [this.data?.descripcion || ''],
      direccionPropiedad: [this.data?.direccionPropiedad || '', Validators.required],
      estado: [this.data?.estado || 'Planificado', Validators.required],
      fechaInicio: [this.data?.fechaInicio ? new Date(this.data.fechaInicio) : null, Validators.required],
      fechaFinEstimada: [this.data?.fechaFinEstimada ? new Date(this.data.fechaFinEstimada) : null, Validators.required],
      fechaFinalizacionReal: [this.data?.fechaFinalizacionReal ? new Date(this.data.fechaFinalizacionReal) : null],
      fechaUltimoPagoRecibido: [this.data?.fechaUltimoPagoRecibido ? new Date(this.data.fechaUltimoPagoRecibido) : null],
      montoContrato: [this.data?.montoContrato || 0, [Validators.required, Validators.min(0)]],
      montoRecibido: [this.data?.montoRecibido || 0, Validators.min(0)],
      costoMaterialesConsolidado: [this.data?.costoMaterialesConsolidado || 0, Validators.min(0)],
      otrosGastosDirectosConsolidado: [this.data?.otrosGastosDirectosConsolidado || 0, Validators.min(0)],
      progresoPorcentaje: [this.data?.progresoPorcentaje || 0, [Validators.min(0), Validators.max(100)]],
      notasProyecto: [this.data?.notasProyecto || ''],
      idCliente: [this.data?.idCliente || null, Validators.required],
      idEmpleadoResponsable: [this.data?.idEmpleadoResponsable || null]
    });
  }

  loadDropdownData(): void {
    // Ensure these service methods return Observable<DropdownItem[]> (i.e., mapping the full model to { id, nombre })
    this.clientes$ = this.clientesService.getClientesForDropdown();
    this.empleados$ = this.empleadoService.getEmpleadosForDropdown();
  }

  onSubmit(): void {
    if (this.form.valid) {
      const projectData: Proyecto = {
        ...this.form.value,
        fechaInicio: this.form.value.fechaInicio?.toISOString().split('T')[0],
        fechaFinEstimada: this.form.value.fechaFinEstimada?.toISOString().split('T')[0],
        fechaFinalizacionReal: this.form.value.fechaFinalizacionReal?.toISOString().split('T')[0],
        fechaUltimoPagoRecibido: this.form.value.fechaUltimoPagoRecibido?.toISOString().split('T')[0]
      };

      if (this.data) {
        this.proyectosService.updateProyecto(projectData).subscribe({
          next: (response) => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error al actualizar el proyecto:', error);
          }
        });
      } else {
        this.proyectosService.addProyecto(projectData).subscribe({
          next: (response) => {
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error al crear el proyecto:', error);
          }
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}