import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { delay, Observable } from 'rxjs';
import { DriverService } from '../../services/driver.service';

@Component({
  selector: 'app-standings-driver',
  standalone: true,
  imports: [],
  templateUrl: './standings-driver.component.html',
  styleUrl: './standings-driver.component.scss'
})
export class StandingsDriverComponent {

  /*   constructor(private driver: DriverService) { } */


  ngOnInit(): void {

  }


  /*   classifica() {
      this.driver.getDriverStandings(2022).subscribe((res) => {
        console.log(res);
      });
    } */
}
