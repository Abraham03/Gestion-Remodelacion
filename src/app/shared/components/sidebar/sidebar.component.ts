// src/app/shared/components/sidebar/sidebar.component.ts
import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MenuItem } from '../../models/menu-item.model';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { SidebarService } from './sidebar.service';
import { Subscription, Observable, map, shareReplay } from 'rxjs'; // Import Observable
import { toObservable } from '@angular/core/rxjs-interop';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout'; // Import BreakpointObserver

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [MatListModule, MatIconModule, RouterModule, CommonModule, TitleCasePipe],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() isSidebarOpen = true; // Still useful for initial rendering

  private authService = inject(AuthService);
  private sidebarService = inject(SidebarService);
  private breakpointObserver = inject(BreakpointObserver); // Inject BreakpointObserver

  userName: string | null = null;
  userRole: string | null = null;
  isHandset$: Observable<boolean>; // Observe handset changes

  private subscriptions = new Subscription();

  menuItems: MenuItem[] = [
    { label: 'Inicio', icon: 'home', route: '/dashboard' },
    { label: 'Empleados', icon: 'people', route: '/empleados' },
    { label: 'Proyectos', icon: 'work', route: '/proyectos' },
    { label: 'Reportes', icon: 'assessment', route: '/reportes' },
  ];

  constructor() {
    this.isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset)
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.userName = user.username;
      // Ensure userRole is correctly extracted, handling cases where authorities might be empty or not strings
      this.userRole = user.authorities && user.authorities.length > 0 ? String(user.authorities[0]).replace('ROLE_', '') : null;
    } else {
      this.userName = null;
      this.userRole = null;
    }

    this.subscriptions.add(
      this.sidebarService.isSidebarOpen$.subscribe(isOpen => {
        this.isSidebarOpen = isOpen;
      })
    );
  }

  onMenuItemClick() {
    // Only close the sidebar if it's a handset device
    this.isHandset$.subscribe(isHandset => {
      if (isHandset) {
        this.sidebarService.closeSidebar(); // Explicitly close for handset
      }
    }).unsubscribe(); // Unsubscribe immediately after checking
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}