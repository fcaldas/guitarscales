import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GuitarScaleComponent } from './guitar-scale.component';

describe('GuitarScaleComponent', () => {
  let component: GuitarScaleComponent;
  let fixture: ComponentFixture<GuitarScaleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GuitarScaleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GuitarScaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
