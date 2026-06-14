import { Component, HostListener, ElementRef, ViewChild, AfterViewInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { isPlatformBrowser, NgClass, NgIf } from '@angular/common';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [RouterLink, NgClass, NgIf],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio {
  isMenuOpen = false;
  isLoginModalOpen = false;
  isScrolled = false;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 50;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  openLoginModal() {
    this.isLoginModalOpen = true;
    this.isMenuOpen = false;
  }

  closeLoginModal() {
    this.isLoginModalOpen = false;
  }

  navigateTo(path: string) {
    this.closeLoginModal();
    this.router.navigate([path]);
  }

  scrollTo(elementId: string) {
    this.isMenuOpen = false;
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
