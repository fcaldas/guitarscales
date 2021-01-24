import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChordsInScaleComponent } from './chords-in-scale.component';

describe('ChordsInScaleComponent', () => {
  let component: ChordsInScaleComponent;
  let fixture: ComponentFixture<ChordsInScaleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChordsInScaleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChordsInScaleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
