import { Component, OnInit, Input } from '@angular/core';
import { Blogpost } from '../../blogpost';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {

  @Input() data:Blogpost;

  constructor() {
  }

  ngOnInit() {
  }

}
