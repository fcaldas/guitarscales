import { Component, OnInit, HostListener} from '@angular/core';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
  image: string;
}

@Component({
  selector: 'app-picturegallery',
  templateUrl: './picturegallery.component.html',
  styleUrls: ['./picturegallery.component.css']
})
export class PicturegalleryComponent implements OnInit {

  bg_colors: string[] = [
    "#95b5cf", "#3c9be8", "#e6eaed", "#6b6e70", "#879ba8"
  ]

  tiles: Tile[] = [
    {text: 'One', cols: 3, rows: 1, color: 'lightblue', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Two', cols: 1, rows: 2, color: 'lightgreen', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Three', cols: 1, rows: 1, color: 'lightpink', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Four', cols: 2, rows: 1, color: '#DDBDF1', image:'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'One', cols: 3, rows: 1, color: 'lightblue', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Two', cols: 1, rows: 2, color: 'lightgreen', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Three', cols: 1, rows: 1, color: 'lightpink', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Four', cols: 2, rows: 1, color: '#DDBDF1', image:'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'One', cols: 3, rows: 1, color: 'lightblue', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Two', cols: 1, rows: 2, color: 'lightgreen', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Three', cols: 1, rows: 1, color: 'lightpink', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Four', cols: 2, rows: 1, color: '#DDBDF1', image:'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'One', cols: 3, rows: 1, color: 'lightblue', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Two', cols: 1, rows: 2, color: 'lightgreen', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Three', cols: 1, rows: 1, color: 'lightpink', image: 'https://material.angular.io/assets/img/examples/shiba2.jpg'},
    {text: 'Four', cols: 2, rows: 1, color: '#DDBDF1', image:'https://material.angular.io/assets/img/examples/shiba2.jpg'},
  ];

  max_display = 5;

  constructor() { }

  ngOnInit() {
  }

  @HostListener("window:scroll", ["$event"])
  onWindowScroll() {
  //In chrome and some browser scroll is given to body tag
  let pos = (document.documentElement.scrollTop || document.body.scrollTop) + document.documentElement.offsetHeight;
  let max = document.documentElement.scrollHeight;
  // pos/max will give you the distance between scroll bottom and and bottom of screen in percentage.
   if(pos == max )   {
    this.max_display = Math.min(this.max_display + 5, this.tiles.length);
   }
  }

}
