import { Component, OnInit, Input } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ImgpopupComponent} from '../imgpopup/imgpopup.component';


@Component({
  selector: 'app-picture',
  templateUrl: './picture.component.html',
  styleUrls: ['./picture.component.css']
})
export class PictureComponent implements OnInit {

  showImage = true;
  @Input() tile;
  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  // showPopup() {
  //     const dialogRef = this.dialog.open(ImgpopupComponent, {
  //       width: '250px',
  //       data: {name: "gamma", animal: "ray"}
  //     });
  
  //     dialogRef.afterClosed().subscribe(result => {
  //       console.log('The dialog was closed');
  //     });
  //   }
  
}
