import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginEquipo } from './login-equipo';

describe('LoginEquipo', () => {
  let component: LoginEquipo;
  let fixture: ComponentFixture<LoginEquipo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginEquipo],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginEquipo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
