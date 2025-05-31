// src/app/modules/empleados/services/empleado.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Empleado } from '../models/empleado.model'; // Assuming Empleado model exists
import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/models/page.model'; // Assuming Page model exists

@Injectable({
  providedIn: 'root',
})
export class EmpleadoService {
  private apiUrl = `${environment.apiUrl}/empleados`;

  constructor(private http: HttpClient) {}

  getEmpleados(page: number = 0, size: number = 10, sort: string = 'nombreCompleto', filter: string = ''): Observable<Page<Empleado>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filter) {
      params = params.set('filter', filter);
    }
    return this.http.get<Page<Empleado>>(this.apiUrl, { params });
  }

  getEmpleadosForDropdown(): Observable<{ id: number; nombre: string }[]> {
    // IMPORTANT: Same logic as ClienteService. If your default /empleados endpoint is paginated.
    const params = new HttpParams().set('size', '1000'); // Request a large number of items

    return this.http.get<Page<Empleado>>(`${this.apiUrl}`, { params }).pipe( // <-- Type as Page<Empleado> here
      map((page: Page<Empleado>) => page.content.map((emp: Empleado) => ({ id: emp.id!, nombre: emp.nombreCompleto }))) // <-- Access page.content
    );
  }

  getEmpleado(id: number): Observable<Empleado> {
    return this.http.get<Empleado>(`${this.apiUrl}/${id}`);
  }

  createEmpleado(empleado: Empleado): Observable<Empleado> {
    return this.http.post<Empleado>(this.apiUrl, empleado);
  }

  updateEmpleado(id: number, empleado: Empleado): Observable<Empleado> {
    return this.http.put<Empleado>(`${this.apiUrl}/${id}`, empleado);
  }

  deactivateEmpleado(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, null, {
      params: new HttpParams().set('activo', 'false')
    });
  }
}