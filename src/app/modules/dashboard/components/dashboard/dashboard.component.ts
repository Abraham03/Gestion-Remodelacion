import { Component, OnInit, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardSummary } from '../../../../core/models/dashboard-summary.model';
import { Proyecto } from '../../../proyectos/models/proyecto.model'; // Importa la interfaz original de Proyecto
import { DashboardProyecto } from '../../models/dashboard-proyecto.model'; // ¡Importa la nueva interfaz!
import { Subject, takeUntil } from 'rxjs';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatProgressBarModule,
    RouterModule,
    CurrencyPipe,
    DatePipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  totalProyectos: number = 0;
  empleadosActivos: number = 0;
  materialesDisponibles: number = 0; // Este dato no viene del backend actual
  balanceFinanciero: number = 0;

  // Usa la nueva interfaz para el array de proyectos que se mostrarán en el dashboard
  proyectosEnCurso: DashboardProyecto[] = [];
  materialesMasUtilizados: { nombre: string; cantidadUsada: number }[] = [];

  private progresoChart: Chart | undefined;
  private estadoChart: Chart | undefined;
  private destroy$: Subject<void> = new Subject<void>();

  constructor(private dashboardService: DashboardService) { }

  ngOnInit(): void {
    this.loadDashboardSummary();
    this.loadProyectosEnCurso();
  }

  ngAfterViewInit() {
    // Los gráficos se crearán después de que los datos de proyectos en curso se carguen
    // Se llama a createCharts() dentro de loadProyectosEnCurso
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.progresoChart) {
      this.progresoChart.destroy();
    }
    if (this.estadoChart) {
      this.estadoChart.destroy();
    }
  }

  loadDashboardSummary(): void {
    this.dashboardService.getDashboardSummary()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (summary: DashboardSummary) => {
          this.totalProyectos = summary.totalProyectos;
          this.empleadosActivos = summary.empleadosActivos;
          this.balanceFinanciero = summary.balanceFinanciero;
        },
        error: (err) => {
          console.error('Error al cargar el resumen del dashboard:', err);
          // TODO: Implementar manejo de errores, por ejemplo, un MatSnackBar
        }
      });
  }

  loadProyectosEnCurso(): void {
    this.dashboardService.getProyectosEnCurso()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (proyectos: Proyecto[]) => {
          // Mapea las propiedades del backend (Proyecto) a las esperadas por tu HTML (DashboardProyecto)
          this.proyectosEnCurso = proyectos.map(p => ({
            id: p.id!, // Asegúrate de que id exista, si no, puedes usar un valor por defecto o manejar null
            nombre: p.nombreProyecto,
            descripcion: p.descripcion, // Asegúrate de que Proyecto tiene una propiedad 'descripcion'
            fechaInicio: p.fechaInicio?.toString() || '', // Convertir a string, manejar posible null
            fechaFin: p.fechaFinEstimada?.toString() || '', // Convertir a string, manejar posible null
            progreso: p.progresoPorcentaje ?? 0, // <--- MODIFICADO: Usa el operador nullish coalescing (??) para asegurar un número
            estado: this.mapEstadoToDisplay(p.estado) as any, // Mapea el estado del enum a un string legible
            estadoDisplay: this.mapEstadoToDisplay(p.estado), // Para mostrar el estado legible
          }));
          this.createCharts(); // Crea o actualiza los gráficos con los nuevos datos
        },
        error: (err) => {
          console.error('Error al cargar proyectos en curso:', err);
          // TODO: Implementar manejo de errores
        }
      });
  }

  // Helper para mapear el estado del enum a un string legible para mostrar en el HTML
  mapEstadoToDisplay(estadoBackend: string): string {
    switch (estadoBackend) {
      case 'EN_PROGRESO': return 'En Progreso';
      case 'PENDIENTE': return 'Pendiente';
      case 'FINALIZADO': return 'Finalizado';
      case 'CANCELADO': return 'Cancelado';
      case 'EN_PAUSA': return 'En Pausa';
      default: return estadoBackend; // En caso de un estado no mapeado
    }
  }

  // MODIFICADO: Ahora acepta 'number | null' para progreso
  getProgressBarColor(progreso: number | null): string {
    if (progreso === null) {
      return 'basic'; // O el color que desees para progreso nulo
    }
    if (progreso === 100) {
      return 'accent';
    } else if (progreso >= 75) {
      return 'primary';
    } else if (progreso >= 40) {
      return 'warn';
    }
    return 'basic';
  }

  createCharts() {
    if (this.progresoChart) {
      this.progresoChart.destroy();
    }
    if (this.estadoChart) {
      this.estadoChart.destroy();
    }

    // Datos para el gráfico de estado de proyectos
    const estadosCount = this.proyectosEnCurso.reduce((acc, proyecto) => {
      // Usamos 'proyecto.estadoDisplay' que ya está mapeado a un string legible
      acc[proyecto.estadoDisplay] = (acc[proyecto.estadoDisplay] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });

    const labelsEstados = Object.keys(estadosCount);
    const dataEstados = Object.values(estadosCount);
    const backgroundColorsEstados = labelsEstados.map(estado => this.getColorForEstado(estado));

    const ctxEstado = document.getElementById('estadoProyectosChart') as HTMLCanvasElement;
    if (ctxEstado) {
      this.estadoChart = new Chart(ctxEstado, {
        type: 'pie',
        data: {
          labels: labelsEstados,
          datasets: [{
            label: 'Proyectos',
            data: dataEstados,
            backgroundColor: backgroundColorsEstados,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: { color: '#333', font: { size: 14 } }
            },
            tooltip: {
              callbacks: {
                label: function(tooltipItem: any) {
                  return tooltipItem.label + ': ' + tooltipItem.raw + ' proyectos';
                }
              },
              backgroundColor: 'rgba(0,0,0,0.7)', titleColor: '#fff', bodyColor: '#fff',
              borderColor: '#fff', borderWidth: 1
            }
          }
        },
      });
    }

    // Datos para el gráfico de progreso de proyectos
    // Accedemos a las propiedades 'nombre' y 'progreso' que hemos añadido al mapear
    const labelsProgreso = this.proyectosEnCurso.map(p => p.nombre);
    // MODIFICADO: Asegurarse de que `p.progreso` es un número para el gráfico
    const dataProgreso = this.proyectosEnCurso.map(p => p.progreso !== null ? p.progreso : 0); // <--- MODIFICADO

    const ctxProgreso = document.getElementById('progresoProyectosChart') as HTMLCanvasElement;
    if (ctxProgreso) {
      this.progresoChart = new Chart(ctxProgreso, {
        type: 'bar',
        data: {
          labels: labelsProgreso,
          datasets: [{
            label: 'Progreso (%)',
            data: dataProgreso,
            // MODIFICADO: Pasar un número al helper
            backgroundColor: this.proyectosEnCurso.map(p => this.getProgressBarColorForChart(p.progreso !== null ? p.progreso : 0)), // <--- MODIFICADO
            borderColor: this.proyectosEnCurso.map(p => this.getProgressBarColorForChart(p.progreso !== null ? p.progreso : 0)), // <--- MODIFICADO
            borderWidth: 1,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              title: { display: true, text: 'Porcentaje de Progreso (%)', color: '#555', font: { size: 14, weight: 'bold' } },
              ticks: { color: '#666' },
              grid: { color: '#e8e8e8' }
            },
            x: {
              title: { display: true, text: 'Proyectos', color: '#555', font: { size: 14, weight: 'bold' } },
              ticks: { color: '#666' },
              grid: { display: false }
            }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(tooltipItem: any) {
                  return tooltipItem.dataset.label + ': ' + tooltipItem.raw + '%';
                }
              },
              backgroundColor: 'rgba(0,0,0,0.7)', titleColor: '#fff', bodyColor: '#fff',
              borderColor: '#fff', borderWidth: 1
            }
          }
        },
      });
    }
  }

  // MODIFICADO: Ahora acepta 'number | null' para progreso
  getProgressBarColorForChart(progreso: number | null): string {
    if (progreso === null) {
      return '#BDBDBD'; // Color gris para progreso nulo en el gráfico
    }
    if (progreso < 30) {
      return '#EF5350';
    } else if (progreso < 70) {
      return '#FFCA28';
    } else {
      return '#42A5F5';
    }
  }

  getColorForEstado(estado: string): string {
    switch (estado) {
      case 'En Progreso': return '#42A5F5';
      case 'Pendiente': return '#FFCA28';
      case 'Finalizado': return '#66BB6A';
      case 'Cancelado': return '#EF5350';
      case 'En Pausa': return '#9E9E9E';
      default: return '#BDBDBD';
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    if (this.progresoChart) {
      this.progresoChart.resize();
    }
    if (this.estadoChart) {
      this.estadoChart.resize();
    }
  }
}