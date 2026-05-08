import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HeatmapRequest, HeatmapResponse } from '../models/heatmap';

@Injectable({ providedIn: 'root' })
export class HeatmapService {
  private readonly http = inject(HttpClient);

  load(request: HeatmapRequest): Observable<HeatmapResponse> {
    let params = new HttpParams()
      .set('year', String(request.year))
      .set('shiftHours', String(request.shiftHours));

    if (request.wakeTime) {
      params = params.set('wakeTime', request.wakeTime);
    }
    if (request.sleepHours !== undefined) {
      params = params.set('sleepHours', String(request.sleepHours));
    }

    return this.http.get<HeatmapResponse>('/api/daylight/heatmap', { params });
  }
}
