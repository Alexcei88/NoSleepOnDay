import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DaylightService } from './daylight.service';

describe('DaylightService', () => {
  let service: DaylightService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DaylightService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DaylightService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('builds query string from request and GETs /api/daylight/analysis', (done) => {
    service
      .analyze({
        regionId: 'kirov',
        periodType: 'year',
        year: 2026,
        wakeTime: '06:30',
        sleepHours: 8.5,
        shiftHours: 1,
      })
      .subscribe(() => done());

    const req = httpMock.expectOne((r) => r.url === '/api/daylight/analysis');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('regionId')).toBe('kirov');
    expect(req.request.params.get('periodType')).toBe('year');
    expect(req.request.params.get('year')).toBe('2026');
    expect(req.request.params.get('wakeTime')).toBe('06:30');
    expect(req.request.params.get('sleepHours')).toBe('8.5');
    expect(req.request.params.get('shiftHours')).toBe('1');
    expect(req.request.params.has('quarter')).toBe(false);
    req.flush(null);
  });

  it('includes quarter when provided', (done) => {
    service
      .analyze({
        regionId: 'kirov',
        periodType: 'quarter',
        year: 2026,
        quarter: 1,
      })
      .subscribe(() => done());

    const req = httpMock.expectOne((r) => r.url === '/api/daylight/analysis');
    expect(req.request.params.get('quarter')).toBe('1');
    req.flush(null);
  });
});
