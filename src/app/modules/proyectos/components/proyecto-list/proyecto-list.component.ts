import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ProyectosService } from '../../services/proyecto.service';
import { Proyecto } from '../../models/proyecto.model';
import { CommonModule, DatePipe } from '@angular/common'; // Import DatePipe
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ProyectosFormComponent } from '../proyecto-form/proyectos-form.component';

@Component({
  selector: 'app-proyectos-list',
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
  templateUrl: './proyecto-list.component.html',
  styleUrls: ['./proyecto-list.component.scss'],
  providers: [DatePipe] // Provee DatePipe si es necesario en este componente (e.g., para transformar fechas antes de mostrarlas si no usas pipe en HTML)
})
export class ProyectosListComponent implements OnInit {
  proyectos: Proyecto[] = [];
  dataSource = new MatTableDataSource<Proyecto>([]);
  // Actualiza las columnas a mostrar
  displayedColumns: string[] = [
    'nombreProyecto',
    'nombreCliente',
    'nombreEmpleadoResponsable',
    'estado',
    'progresoPorcentaje',
    'montoContrato',
    'fechaInicio',
    'fechaFinEstimada',
    'acciones'
  ];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private proyectosService: ProyectosService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadProyectos();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadProyectos(): void {
    this.proyectosService.getProyectos().subscribe((data) => {
      this.proyectos = data;
      this.dataSource.data = this.proyectos;
    });
  }

  openForm(proyecto?: Proyecto): void {
    const dialogRef = this.dialog.open(ProyectosFormComponent, {
      width: '800px', // Aumenta el ancho para acomodar más campos
      data: proyecto || null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadProyectos();
      }
    });
  }

  deleteProyecto(id: number): void {
    if (confirm('¿Estás seguro de eliminar este proyecto?')) {
      this.proyectosService.deleteProyecto(id).subscribe({
        next: () => {
          this.loadProyectos();
          // Opcional: Mostrar un mensaje de éxito (ej. con MatSnackBar)
        },
        error: (err) => {
          console.error('Error al eliminar proyecto:', err);
          // Opcional: Mostrar un mensaje de error
        }
      });
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}