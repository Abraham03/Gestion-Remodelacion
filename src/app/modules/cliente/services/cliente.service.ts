// src/app/modules/cliente/services/cliente.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { Page } from '../../../core/models/page.model';
import { Cliente } from '../models/cliente.model'; // Assuming Cliente model exists

@Injectable({
  providedIn: 'root',
})
export class ClienteService {
  private apiUrl = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  // Method to get all clients for a dropdown (only ID and name)
  getClientesForDropdown(): Observable<{ id: number; nombre: string }[]> {
    // IMPORTANT: If your default /clientes endpoint is paginated, you need to
    // either request all items or target a specific "all" endpoint.
    // For now, let's assume it returns a Page object and extract 'content'.
    // Adding a large 'size' parameter is a common workaround if no specific '/all' endpoint exists.
    const params = new HttpParams().set('size', '1000'); // Request a large number of items

    return this.http.get<Page<Cliente>>(`${this.apiUrl}`, { params }).pipe( // <-- Type as Page<Cliente> here
      map(page => page.content.map(cliente => ({ id: cliente.id!, nombre: cliente.nombreCliente }))) // <-- Access page.content
    );
  }


  // If you need pagination and search for a full client list
  getClientes(page: number = 0, size: number = 10, sort: string = 'nombreCliente', filter: string = ''): Observable<Page<Cliente>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (filter) {
      params = params.set('filter', filter);
    }
    return this.http.get<Page<Cliente>>(this.apiUrl, { params });
  }

  getCliente(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.apiUrl}/${id}`);
  }

  createCliente(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.apiUrl, cliente);
  }

  updateCliente(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.apiUrl}/${id}`, cliente);
  }

  deleteCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}