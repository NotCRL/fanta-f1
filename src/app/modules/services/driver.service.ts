import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { delay, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  /*
  url: string = 'http://api.jolpi.ca/ergast/f1/';
 constructor(private http: HttpClient,) { }

  getDriverStandings(year: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${year}/driverstandings`).pipe(delay(1500));
  } */
}
