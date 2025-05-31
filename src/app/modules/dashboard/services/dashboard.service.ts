import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { DashboardSummary } from '../../../core/models/dashboard-summary.model';
import { Proyecto } from '../../proyectos/models/proyecto.model'; // Asegúrate que esta ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.apiUrl + '/dashboard'; // Asume que environment.apiUrl es algo como 'http://localhost:8080/api/v1'

  constructor(private http: HttpClient) { }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  getProyectosEnCurso(): Observable<Proyecto[]> {
    return this.http.get<Proyecto[]>(`${this.apiUrl}/proyectos-en-curso`);
  }
}