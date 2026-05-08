import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RegionsService } from './regions.service';
import { Region } from '../models/region';

describe('RegionsService', () => {
  let service: RegionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RegionsService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RegionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('GETs /api/regions and returns the list', (done) => {
    const fixture: Region[] = [
      {
        id: 'kirov',
        iso2: 'KIR',
        name: 'Кировская область',
        latitude: 58.6,
        longitude: 49.7,
        timeZone: 'Europe/Kirov',
      },
    ];

    service.getAll().subscribe((regions) => {
      expect(regions).toEqual(fixture);
      done();
    });

    const req = httpMock.expectOne('/api/regions');
    expect(req.request.method).toBe('GET');
    req.flush(fixture);
  });
});
