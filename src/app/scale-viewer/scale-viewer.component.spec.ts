import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {Scale, ScaleTypes} from '../classes/music/scale';
import {Note, NoteName} from '../classes/music/note';
import { ScaleViewerComponent } from './scale-viewer.component';

describe('ScaleViewerComponent', () => {
  let component: ScaleViewerComponent;
  let fixture: ComponentFixture<ScaleViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ScaleViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScaleViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Test if C major is correctly generated
it('should correctly generate scales C major', async(() => {
  let c4 = new Note(NoteName.C, 4);
  let scale = new Scale(c4, ScaleTypes['Major (Ionian)']);
  expect(scale.getNotesInScale()[0]).toEqual(new Note(NoteName.C, 4));
}));
