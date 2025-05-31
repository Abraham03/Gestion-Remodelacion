// src/app/shared/components/header/header.component.ts
import { Component, inject, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { SidebarService } from '../sidebar/sidebar.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private sidebarService = inject(SidebarService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  @Output() toggleSidebarEvent = new EventEmitter<void>();

  isAuthenticated: boolean = false;
  userName: string | null = null;
  // userRole: string | null = null; // Removed, as you only want name/roles in sidebar or less prominent

  private subscriptions = new Subscription();

  constructor() {
    this.subscriptions.add(
      toObservable(this.authService.isAuthenticated).subscribe(status => {
        this.isAuthenticated = status;
      })
    );

    this.subscriptions.add(
      toObservable(this.authService.currentUser).subscribe(user => {
        this.userName = user ? user.username : null;
        // If you still want to display role in header, uncomment and format it here
        // this.userRole = user && user.authorities && user.authorities.length > 0 ? String(user.authorities[0]).replace('ROLE_', '') : null;
      })
    );
  }

  ngOnInit() {
    // No additional ngOnInit specific logic needed
  }

  onToggleSidebar() {
    this.toggleSidebarEvent.emit();
  }

  // Removed onProfile() method as it's no longer needed
  // onProfile() {
  //   this.router.navigate(['/profile']);
  // }

  onLogout() {
    this.authService.logout();
    this.snackBar.open('Sesión cerrada correctamente', 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
    this.router.navigate(['/login']);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}