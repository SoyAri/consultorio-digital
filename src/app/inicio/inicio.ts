import { Component, HostListener, Inject, PLATFORM_ID, signal, OnDestroy } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnDestroy {
  isMenuOpen = false;
  isScrolled = false;
  activeServiceIndex = signal(-1);
  centeredServiceIndex = signal(-1);
  private animationInterval: any;

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.startServiceAnimation();
      this.setupIntersectionObserver();
    }
  }

  ngOnDestroy() {
    if (this.animationInterval) {
      clearInterval(this.animationInterval);
    }
  }

  startServiceAnimation() {
    let index = 0;
    this.animationInterval = setInterval(() => {
      // Solo activamos la animación automática si no estamos en móvil (podemos detectar por ancho de ventana si es necesario, 
      // pero aquí simplemente priorizamos el centrado si existe)
      this.activeServiceIndex.set(index);
      index = (index + 1) % 4;
    }, 1500);
  }

  setupIntersectionObserver() {
    const options = {
      root: null,
      threshold: 0.7 // Aumentamos el umbral para asegurar que solo una esté realmente "centrada"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = entry.target.getAttribute('data-index');
          if (index !== null) {
            // Cuando una entra en el centro, desactivamos temporalmente la automática o simplemente sobreescribimos
            this.centeredServiceIndex.set(parseInt(index));
          }
        }
      });
    }, options);

    setTimeout(() => {
      const cards = document.querySelectorAll('.service-card');
      cards.forEach(card => observer.observe(card));
    }, 500);
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    if (isPlatformBrowser(this.platformId)) {
      this.isScrolled = window.scrollY > 20;
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  navigateTo(path: string) {
    this.isMenuOpen = false;
    this.router.navigate([path]);
  }

  scrollTo(sectionId: string) {
    this.isMenuOpen = false;
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
