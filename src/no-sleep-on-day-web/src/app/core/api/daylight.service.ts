import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AnalysisRequest, AnalysisResult } from '../models/analysis';

@Injectable({ providedIn: 'root' })
export class DaylightService {
  private readonly http = inject(HttpClient);

  analyze(request: AnalysisRequest): Observable<AnalysisResult> {
    let params = new HttpParams()
      .set('regionId', request.regionId)
      .set('periodType', request.periodType)
      .set('year', String(request.year));

    if (request.quarter !== undefined && request.quarter !== null) {
      params = params.set('quarter', String(request.quarter));
    }
    if (request.wakeTime) {
      params = params.set('wakeTime', request.wakeTime);
    }
    if (request.sleepHours !== undefined) {
      params = params.set('sleepHours', String(request.sleepHours));
    }
    if (request.shiftHours !== undefined) {
      params = params.set('shiftHours', String(request.shiftHours));
    }

    return this.http.get<AnalysisResult>('/api/daylight/analysis', { params });
  }
}
