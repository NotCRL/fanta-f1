import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';


@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    // Importa i componenti standalone qui
  ],
  exports: [
    CommonModule,
    RouterModule
    // I componenti standalone non vanno esportati qui
  ]
})
export class SharedModule { }
