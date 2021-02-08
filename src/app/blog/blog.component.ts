import { Component, OnInit } from '@angular/core';
import { Blogpost } from '../blogpost';
import { PostComponent } from './post/post.component';

@Component({
  selector: 'app-blog',
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.css']
})

export class BlogComponent implements OnInit {


  constructor() {
  }

  postlist: Blogpost[] = [];

  ngOnInit() {
  }

}
