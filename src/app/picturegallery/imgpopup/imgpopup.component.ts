import { Component, Inject} from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

export interface DialogData {
  animal: string;
  name: string;
}


@Component({
  selector: 'app-imgpopup',
  templateUrl: './imgpopup.component.html',
  styleUrls: ['./imgpopup.component.css']
})
export class ImgpopupComponent{

  constructor(
    public dialogRef: MatDialogRef<ImgpopupComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}


  ngOnInit() {
  }


  onNoClick(): void {
    this.dialogRef.close();
  }

}