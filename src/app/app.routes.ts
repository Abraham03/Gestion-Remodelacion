import { Router, Routes } from '@angular/router';
import { LoginComponent } from './modules/auth/components/login/login.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { EmpleadoFormComponent } from './modules/empleados/components/empleado-form/empleado-form.component';
import { ProyectosFormComponent } from './modules/proyectos/components/proyecto-form/proyectos-form.component';
import { authGuard } from './core/guards/auth.guard';
import { AuthService } from './core/services/auth.service';
import { inject } from '@angular/core';

export const routes: Routes = [
  { 
    path: 'login', 
    component: LoginComponent,
    canActivate: [() => !inject(AuthService).isAuthenticated() ? true : inject(Router).parseUrl('/dashboard')]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: 'dashboard', loadComponent: () => import('./modules/dashboard/components/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'empleados', loadComponent: () => import('./modules/empleados/components/empleado-list/empleado-list.component').then(m => m.EmpleadoListComponent) },
      { path: 'proyectos', loadComponent: () => import('./modules/proyectos/components/proyecto-list/proyecto-list.component').then(m => m.ProyectosListComponent) },
      { path: 'reportes', loadComponent: () => import('./modules/reportes/components/reporte-list/reporte-list.component').then(m => m.ReportesListComponent) },
      
      // Rutas con roles específicos

      
      // Formularios
      { path: 'empleados/nuevo', component: EmpleadoFormComponent },
      { path: 'empleados/editar/:id', component: EmpleadoFormComponent },
      { path: 'proyectos/nuevo', component: ProyectosFormComponent },
      { path: 'proyectos/editar/:id', component: ProyectosFormComponent }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];