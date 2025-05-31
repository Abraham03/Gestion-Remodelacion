import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';

import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente.service';
import { ClienteFormComponent } from '../cliente-form/cliente-form.component';
import { Page } from '../../../../core/models/page.model'; // Asegúrate de que la ruta sea correcta

@Component({
  selector: 'app-cliente-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    MatDialogModule,
  ],
  templateUrl: './cliente-list.component.html',
  styleUrls: ['./cliente-list.component.scss'],
})
export class ClienteListComponent implements OnInit, AfterViewInit {
  dataSource = new MatTableDataSource<Cliente>([]);
  displayedColumns: string[] = ['nombre', 'telefono', 'direccion', 'notas' , 'acciones']; // Ajusta según tu modelo Cliente

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Propiedades para la paginación y filtro del backend
  totalElements: number = 0;
  pageSize: number = 10;
  pageNumber: number = 0;
  filterValue: string = '';

  constructor(
    private clienteService: ClienteService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadClientes();
  }

  ngAfterViewInit(): void {
    // La paginación del lado del servidor se maneja con loadClientes
    // this.dataSource.paginator = this.paginator; // No es necesario si la paginación es del lado del servidor
  }

  loadClientes(): void {
    this.clienteService.getClientes(this.pageNumber, this.pageSize, 'nombre', this.filterValue)
      .subscribe({
        next: (page: Page<Cliente>) => {
          this.dataSource.data = page.content;
          this.totalElements = page.totalElements;
          this.pageSize = page.size;
          this.pageNumber = page.number;
        },
        error: (err) => {
          console.error('Error al cargar clientes:', err);
          // TODO: Mostrar un mensaje de error al usuario
        }
      });
  }

  openForm(cliente?: Cliente): void {
    const dialogRef = this.dialog.open(ClienteFormComponent, {
      width: '500px',
      data: cliente || null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadClientes(); // Recargar la lista después de crear/editar
      }
    });
  }

  deleteCliente(id: number): void {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      this.clienteService.deleteCliente(id).subscribe({
        next: () => {
          this.loadClientes(); // Recargar la lista
          // TODO: Mostrar mensaje de éxito
        },
        error: (err) => {
          console.error('Error al eliminar cliente:', err);
          // TODO: Mostrar mensaje de error
        }
      });
    }
  }

  applyFilter(event: Event): void {
    this.filterValue = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.pageNumber = 0; // Resetear a la primera página al aplicar un nuevo filtro
    this.loadClientes();
  }

  onPageChange(event: PageEvent): void {
    this.pageNumber = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadClientes();
  }
}