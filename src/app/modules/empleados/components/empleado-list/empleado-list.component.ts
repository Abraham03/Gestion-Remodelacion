import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { EmpleadoService } from '../../services/empleado.service';
import { Empleado } from '../../models/empleado.model';
import { MatDialog } from '@angular/material/dialog';
import { EmpleadoFormComponent } from '../empleado-form/empleado-form.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Page } from '../../../../core/models/page.model';

@Component({
  selector: 'app-empleado-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './empleado-list.component.html',
  styleUrls: ['./empleado-list.component.scss'],
})
export class EmpleadoListComponent implements OnInit, AfterViewInit {
  empleados: Empleado[] = [];
  displayedColumns: string[] = ['nombreCompleto', 'rolCargo', 'telefonoContacto', 'activo', 'acciones'];
  dataSource = new MatTableDataSource<Empleado>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  totalElements: number = 0;
  pageSize: number = 10;
  currentPage: number = 0;
  sortColumn: string = 'nombreCompleto';
  filterValue: string = '';

  constructor(
    private empleadoService: EmpleadoService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadEmpleados();
  }

  ngAfterViewInit(): void {
    this.paginator.page.subscribe((event: PageEvent) => {
      this.currentPage = event.pageIndex;
      this.pageSize = event.pageSize;
      this.loadEmpleados();
    });
  }

  loadEmpleados(): void {
    // Pass filterValue to the service
    this.empleadoService.getEmpleados(this.currentPage, this.pageSize, this.sortColumn, this.filterValue).subscribe(
      (pageData: Page<Empleado>) => {
        this.empleados = pageData.content;
        this.dataSource.data = this.empleados;
        this.totalElements = pageData.totalElements;
        if (this.paginator) {
          this.paginator.length = pageData.totalElements;
          this.paginator.pageIndex = pageData.number;
          this.paginator.pageSize = pageData.size;
        }
      },
      (error) => {
        console.error('Error al cargar empleados:', error);
        this.snackBar.open('Error al cargar los empleados. Inténtalo de nuevo más tarde.', 'Cerrar', { duration: 5000 });
      }
    );
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    // Reset to the first page when applying a new filter
    this.currentPage = 0; 
    if (this.paginator) {
        this.paginator.firstPage();
    }
    this.loadEmpleados(); // Trigger backend filtering
  }

  openForm(empleado?: Empleado): void {
    const dialogRef = this.dialog.open(EmpleadoFormComponent, {
      width: '500px',
      data: empleado || null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadEmpleados();
      }
    });
  }

  deleteEmpleado(id: number | undefined): void {
    if (!id) {
      this.snackBar.open('ID de empleado no válido para eliminar.', 'Cerrar', { duration: 3000 });
      return;
    }

    if (confirm('¿Estás seguro de desactivar este empleado? (Esto cambiará su estado a inactivo)')) { // Clarify action
      this.empleadoService.deactivateEmpleado(id).subscribe( // Call deactivateEmpleado
        () => {
          this.snackBar.open('Empleado desactivado exitosamente', 'Cerrar', { duration: 3000 });
          this.loadEmpleados();
        },
        (error: any) => {
          console.error('Error al desactivar empleado:', error);
          this.snackBar.open('Error al desactivar empleado. Inténtalo de nuevo más tarde.', 'Cerrar', { duration: 5000 });
        }
      );
    }
  }
}