import { Component } from '@angular/core';
import { StandingsDriverComponent } from "../../modules/components/standings-driver/standings-driver.component";

@Component({
  selector: 'app-classifica',
  standalone: true,
  imports: [StandingsDriverComponent],
  templateUrl: './classifica.component.html',
  styleUrl: './classifica.component.scss'
})
export class ClassificaComponent {

}
