// src/app/shared/components/layout/layout.component.ts
import { Component, inject, ViewChild, AfterViewInit, OnInit, OnDestroy /* ELIMINAR: HostBinding */ } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { FooterComponent } from '../footer/footer.component';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../sidebar/sidebar.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable, Subscription, combineLatest } from 'rxjs'; // Import combineLatest
import { map, shareReplay, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    HeaderComponent,
    SidebarComponent,
    FooterComponent,
    RouterOutlet,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent implements OnInit, AfterViewInit, OnDestroy {
  private sidebarService = inject(SidebarService);
  private breakpointObserver = inject(BreakpointObserver);

  @ViewChild('sidenav') sidenav!: MatSidenav;

  isSidebarOpen$: Observable<boolean> = this.sidebarService.isSidebarOpen$;
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(result => result.matches),
    shareReplay(1) // shareReplay(1) para asegurar que los suscriptores reciban el último valor
  );

  private subscriptions = new Subscription();

  // ELIMINAR: @HostBinding y el getter isSidebarClosedOnDesktop, ya no es necesario con el nuevo enfoque CSS
  // @HostBinding('class.sidebar-closed-desktop')
  // get isSidebarClosedOnDesktop(): boolean {
  //   let closed = false;
  //   let isHandset = false;
  //   let isOpen = true;
  //   this.isHandset$.subscribe(val => isHandset = val).unsubscribe();
  //   this.isSidebarOpen$.subscribe(val => isOpen = val).unsubscribe();
  //   closed = !isOpen && !isHandset;
  //   return closed;
  // }

  constructor() {}

  ngOnInit() {
    // No specific logic needed here for the sidenav state as SidebarService handles it
  }

  ngAfterViewInit() {
    // Sincronizar el MatSidenav con el SidebarService's state
    // Usamos combineLatest para reaccionar a cambios en `isHandset$` e `isSidebarOpen$`
    this.subscriptions.add(
      combineLatest([this.isHandset$, this.sidebarService.isSidebarOpen$]).pipe(
        distinctUntilChanged((prev, curr) => prev[0] === curr[0] && prev[1] === curr[1])
      ).subscribe(([isHandset, isSidebarOpen]) => {
        if (this.sidenav) {
          if (isHandset) {
            this.sidenav.mode = 'over';
            if (isSidebarOpen) {
              this.sidenav.open();
            } else {
              this.sidenav.close();
            }
          } else { // Desktop
            this.sidenav.mode = 'side';
            if (isSidebarOpen) {
              this.sidenav.open();
            } else {
              this.sidenav.close();
            }
          }
        }
      })
    );

    // Asegurarse de que el sidenav se cierre si se hace clic fuera en modo 'over'
    // Puedes añadir esto si aún no lo tienes gestionado
    this.subscriptions.add(
        this.sidenav.openedStart.subscribe(() => {
            // Lógica si necesitas hacer algo cuando se empieza a abrir
        })
    );
    this.subscriptions.add(
        this.sidenav.closedStart.subscribe(() => {
            // Lógica si necesitas hacer algo cuando se empieza a cerrar
            // Por ejemplo, para sincronizar con el SidebarService si se cierra manualmente
            // this.sidebarService.closeSidebar();
        })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onToggleSidebar() {
    this.sidebarService.toggleSidebar();
  }
}