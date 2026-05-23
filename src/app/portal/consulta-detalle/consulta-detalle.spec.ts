import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultaDetalle } from './consulta-detalle';

describe('ConsultaDetalle', () => {
  let component: ConsultaDetalle;
  let fixture: ComponentFixture<ConsultaDetalle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultaDetalle],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsultaDetalle);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
