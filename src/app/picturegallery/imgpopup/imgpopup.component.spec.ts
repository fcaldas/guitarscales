import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ImgpopupComponent } from './imgpopup.component';

describe('ImgpopupComponent', () => {
  let component: ImgpopupComponent;
  let fixture: ComponentFixture<ImgpopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImgpopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImgpopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
