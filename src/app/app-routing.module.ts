import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {PicturegalleryComponent} from './picturegallery/picturegallery.component';
import {BlogComponent} from './blog/blog.component';
import {ScaleViewerComponent} from './scale-viewer/scale-viewer.component';

const routes: Routes = [
  // {path: '', component: PicturegalleryComponent},
  // {path: 'photography', component: PicturegalleryComponent},
  // {path: 'blog', component: BlogComponent},
  {path: '', component: ScaleViewerComponent},
  {path: 'scales', component: ScaleViewerComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
