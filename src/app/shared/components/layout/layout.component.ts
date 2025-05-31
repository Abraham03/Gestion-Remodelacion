// src/app/shared/components/layout/layout.component.ts
import { Component, inject, ViewChild, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
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
import { Observable, Subscription } from 'rxjs';
import { map, shareReplay, take } from 'rxjs/operators'; // Add take operator

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
  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  private subscriptions = new Subscription();

  constructor() {}

  ngOnInit() {
    // No specific logic needed here for the sidenav state as SidebarService handles it
  }

  ngAfterViewInit() {
    // Sync the MatSidenav with the SidebarService's state
    this.subscriptions.add(
      this.isHandset$.subscribe(isHandset => {
        // When handset status changes, decide initial sidebar state and mode
        if (isHandset) {
          this.sidenav.mode = 'over';
          // Ensure it's closed visually on handset, sidebarService will handle its open/close state
          this.sidenav.close();
        } else {
          this.sidenav.mode = 'side';
          // Set to open by default on desktop, sidebarService will handle its open/close state
          this.sidenav.open();
        }
      })
    );

    // This subscription keeps the sidenav open/closed state in sync
    // with the SidebarService's `isSidebarOpen$` BehaviorSubject.
    this.subscriptions.add(
      this.sidebarService.isSidebarOpen$.subscribe(isOpen => {
        if (this.sidenav) {
          if (isOpen) {
            this.sidenav.open();
          } else {
            this.sidenav.close();
          }
        }
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