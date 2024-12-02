import { Component } from '@angular/core';
import { DriverService } from '../../modules/services/driver.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {

  /*   constructor(private driver: DriverService) { }
    classifica() {
      this.driver.getDriverStandings(2022).subscribe((res) => {
        console.log(res);
      });
    } */
}
