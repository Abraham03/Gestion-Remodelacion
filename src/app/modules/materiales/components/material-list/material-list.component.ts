import { Component, OnInit, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MaterialesService } from '../../services/material.service';
import { Material } from '../../models/material.model';
import { MaterialesFormComponent } from '../material-form/material-form.component';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-materiales-list',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatPaginatorModule,
  ],
  templateUrl: './material-list.component.html',
  styleUrls: ['./material-list.component.scss'],
})
export class MaterialesListComponent implements OnInit {
  materiales: Material[] = [];
  dataSource = new MatTableDataSource<Material>([]);
  displayedColumns: string[] = ['nombre', 'descripcion', 'cantidad', 'unidadMedida', 'fechaAdquisicion', 'acciones'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private materialesService: MaterialesService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadMateriales();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  loadMateriales(): void {
    this.materialesService.getMateriales().subscribe((data) => {
      this.materiales = data;
      this.dataSource.data = this.materiales;
    });
  }

  openForm(material?: Material): void {
    const dialogRef = this.dialog.open(MaterialesFormComponent, {
      width: '500px',
      data: material || null,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadMateriales();
      }
    });
  }

  deleteMaterial(id: number): void {
    if (confirm('¿Estás seguro de eliminar este material?')) {
      this.materialesService.deleteMaterial(id).subscribe(() => {
        this.loadMateriales();
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