import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TopbarComponent } from './topbar/topbar.component';
import { MatButtonModule, MatSidenavModule, MatCardModule, MatIconModule, MatNativeDateModule, MatDatepickerModule, MatFormFieldModule, MatInputModule} from '@angular/material';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {DemoMaterialModule} from './material-module';
import { BlogComponent } from './blog/blog.component';
import { PostComponent } from './blog/post/post.component';
import { MarkdownModule } from 'ngx-markdown';
import { ScaleViewerComponent } from './scale-viewer/scale-viewer.component';
import { GuitarScaleComponent } from './scale-viewer/guitar-scale/guitar-scale.component';
import { ChordsInScaleComponent } from './scale-viewer/chords-in-scale/chords-in-scale.component';

@NgModule({
  declarations: [
    AppComponent,
    TopbarComponent,
    BlogComponent,
    PostComponent,
    ScaleViewerComponent,
    GuitarScaleComponent,
    ChordsInScaleComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSidenavModule,
    MatCardModule,
    MatIconModule,
    MatNativeDateModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule ,
    MatButtonModule,
    ReactiveFormsModule,
    DemoMaterialModule,
    MarkdownModule.forRoot(),
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: []
})
export class AppModule { }
