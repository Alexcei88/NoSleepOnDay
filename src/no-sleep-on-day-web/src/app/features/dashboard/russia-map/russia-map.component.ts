import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { feature, merge as topoMerge } from 'topojson-client';
import type {
  GeometryCollection,
  MultiPolygon as TopoMultiPolygon,
  Polygon as TopoPolygon,
  Topology,
} from 'topojson-specification';
import type {
  Feature,
  FeatureCollection,
  Geometry,
  MultiPolygon,
  Polygon,
  Position,
} from 'geojson';
import { HeatmapResponse } from '../../../core/models/heatmap';
import { Region } from '../../../core/models/region';

interface RegionFeatureProps {
  NAME_1: string;
  HASC_1: string;
  ISO_2: string;
}

type RegionFeature = Feature<Geometry, RegionFeatureProps>;

const MASK_FILL = '#f1f5f9';

@Component({
  selector: 'app-russia-map',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="map-card">
      <header class="map-card__header">
        <span class="map-card__title">Карта прироста света при сдвиге</span>
        <span class="map-card__hint">— клик по региону или по точке столицы строит статистику</span>
      </header>

      <div class="map-card__body">
        <div #host class="map-card__leaflet">
          @if (loading()) {
            <p class="map-card__loader">⏳ Загружаем карту…</p>
          }
        </div>

        <aside class="map-card__legend">
          <div class="legend-row">
            <span class="legend-swatch" style="background:#1a7f3c"></span>
            <span>оптимально (≤10 ч)</span>
          </div>
          <div class="legend-row">
            <span class="legend-swatch" style="background:#84cc16"></span>
            <span>~30 ч</span>
          </div>
          <div class="legend-row">
            <span class="legend-swatch" style="background:#fde68a"></span>
            <span>~60 ч</span>
          </div>
          <div class="legend-row">
            <span class="legend-swatch" style="background:#fb923c"></span>
            <span>~100 ч</span>
          </div>
          <div class="legend-row">
            <span class="legend-swatch" style="background:#dc2626"></span>
            <span>~200 ч</span>
          </div>
          <div class="legend-row">
            <span class="legend-swatch" style="background:#7f1d1d"></span>
            <span>≥300 ч</span>
          </div>
          <div class="legend-divider"></div>
          <div class="legend-row legend-row--marker">
            <span class="legend-chip">UTC+3</span>
            <span>часовой пояс региона</span>
          </div>
        </aside>
      </div>
    </div>
  `,
  styleUrl: './russia-map.component.scss',
})
export class RussiaMapComponent implements AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly host = viewChild.required<ElementRef<HTMLDivElement>>('host');

  readonly heatmap = input<HeatmapResponse | null>(null);
  readonly regions = input<Region[]>([]);
  readonly selectedRegionId = input<string | null>(null);

  readonly regionSelected = output<string>();

  protected readonly loading = signal(true);

  private map: L.Map | null = null;
  private regionLayer: L.GeoJSON<RegionFeatureProps> | null = null;
  private maskLayer: L.GeoJSON | null = null;
  private chips = new Map<string, L.Marker>();
  private currentSelectedMarkerId: string | null = null;

  private readonly iso2ToGain = computed<Map<string, number>>(() => {
    const m = new Map<string, number>();
    const h = this.heatmap();
    if (!h) return m;
    for (const r of h.regions) m.set(r.iso2, r.totalGainMinutes);
    return m;
  });

  private readonly iso2ToRegion = computed<Map<string, Region>>(() => {
    const m = new Map<string, Region>();
    for (const r of this.regions()) m.set(r.iso2, r);
    return m;
  });

  constructor() {
    effect(() => {
      this.iso2ToGain();
      this.selectedRegionId();
      this.iso2ToRegion();
      this.repaintRegions();
      this.repaintMarkers();
    });

    effect(() => {
      const list = this.regions();
      if (list.length && this.map) this.syncMarkers(list);
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.loadGeo();
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private initMap(): void {
    const hostEl = this.host().nativeElement;

    this.map = L.map(hostEl, {
      zoomControl: true,
      attributionControl: true,
      worldCopyJump: false,
      minZoom: 3,
      maxZoom: 7,
      zoomSnap: 0.25,
    }).setView([62, 95], 3);

    // По умолчанию Leaflet 1.9+ добавляет к атрибуции флаг Украины — убираем,
    // оставляем нейтральный «Leaflet».
    this.map.attributionControl.setPrefix(
      '<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>',
    );

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      noWrap: true,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(this.map);

    this.map.on('zoomend', () => this.applyZoomClass());
  }

  private applyZoomClass(): void {
    if (!this.map) return;
    const zoom = this.map.getZoom();
    const cls = this.host().nativeElement.classList;
    cls.toggle('map--zoom-low', zoom < 5);
  }

  private loadGeo(): void {
    this.http.get<Topology>('geo/russia.json').subscribe({
      next: (topo) => {
        const obj = topo.objects['name'] as GeometryCollection<RegionFeatureProps>;

        // Merge всех 85 субъектов в один контур страны для маски.
        const polygonGeoms = obj.geometries.filter(
          (g): g is TopoPolygon<RegionFeatureProps> | TopoMultiPolygon<RegionFeatureProps> =>
            g.type === 'Polygon' || g.type === 'MultiPolygon',
        );
        const russiaOutline = topoMerge(topo, polygonGeoms) as MultiPolygon;
        unwrapAntimeridianMultiPolygon(russiaOutline);

        const fc = feature(topo, obj) as FeatureCollection<Geometry, RegionFeatureProps>;
        unwrapAntimeridianFeatures(fc.features);

        this.attachMask(russiaOutline);
        this.attachRegions(fc);
        this.syncMarkers(this.regions());
        this.fitToRussia(russiaOutline);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  private attachMask(russia: MultiPolygon): void {
    if (!this.map) return;
    const worldRing: Position[] = [
      [-540, 85],
      [540, 85],
      [540, -85],
      [-540, -85],
      [-540, 85],
    ];
    const holes: Position[][] = russia.coordinates.map((poly) => poly[0]);

    const mask: Feature<Polygon> = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Polygon', coordinates: [worldRing, ...holes] },
    };

    this.maskLayer = L.geoJSON(mask, {
      style: { fillColor: MASK_FILL, fillOpacity: 0.96, color: 'transparent', weight: 0 },
      interactive: false,
    }).addTo(this.map);
  }

  private attachRegions(fc: FeatureCollection<Geometry, RegionFeatureProps>): void {
    if (!this.map) return;

    // Без preferCanvas регионы рендерятся в SVG: каждый регион как отдельный
    // <path>, клики по полигону ловятся нативно (Canvas hit-test иногда
    // промахивается на тонких частях геометрии).
    this.regionLayer = L.geoJSON(fc, {
      style: () => this.styleFor(undefined),
      onEachFeature: (geoFeature, layer) => {
        const props = (geoFeature as RegionFeature).properties;

        layer.on({
          click: (event: L.LeafletMouseEvent) => {
            L.DomEvent.stopPropagation(event);
            const region = this.iso2ToRegion().get(props.ISO_2);
            if (region) this.regionSelected.emit(region.id);
          },
          mouseover: (event: L.LeafletMouseEvent) => {
            (event.target as L.Path).setStyle({ weight: 2, color: '#1e2a6e' });
            (event.target as L.Path).bringToFront();
          },
          mouseout: () => this.repaintRegions(),
        });

        layer.bindTooltip(() => this.tooltipHtml(props.ISO_2, props.NAME_1), {
          sticky: true,
          direction: 'top',
          className: 'russia-map-tooltip',
        });
      },
    }).addTo(this.map);

    this.repaintRegions();
  }

  private syncMarkers(regions: Region[]): void {
    if (!this.map) return;

    for (const marker of this.chips.values()) marker.remove();
    this.chips.clear();
    this.currentSelectedMarkerId = null;

    const selectedId = this.selectedRegionId();
    for (const region of regions) {
      const isSelected = region.id === selectedId;
      const marker = L.marker([region.latitude, region.longitude], {
        icon: makeChipIcon(region, isSelected),
        interactive: true,
        riseOnHover: true,
      });
      marker.on('click', () => this.regionSelected.emit(region.id));
      marker.addTo(this.map);
      this.chips.set(region.id, marker);
      if (isSelected) this.currentSelectedMarkerId = region.id;
    }
    this.applyZoomClass();
  }

  private fitToRussia(russia: MultiPolygon): void {
    if (!this.map) return;
    let minLat = 90;
    let maxLat = -90;
    let minLon = 720;
    let maxLon = -720;
    for (const poly of russia.coordinates) {
      for (const ring of poly) {
        for (const [lon, lat] of ring) {
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
        }
      }
    }
    const padLat = (maxLat - minLat) * 0.04;
    const padLon = (maxLon - minLon) * 0.02;
    const bounds = L.latLngBounds(
      [minLat - padLat, minLon - padLon],
      [maxLat + padLat, maxLon + padLon],
    );
    this.map.fitBounds(bounds, { animate: false });
    this.map.setMaxBounds(bounds.pad(0.1));
  }

  private repaintRegions(): void {
    if (!this.regionLayer) return;
    this.regionLayer.eachLayer((leafletLayer) => {
      const layer = leafletLayer as L.Layer & {
        feature?: RegionFeature;
        setStyle?: (s: L.PathOptions) => void;
      };
      const f = layer.feature;
      if (!f || !layer.setStyle) return;
      layer.setStyle(this.styleFor(f.properties.ISO_2));
    });
  }

  private repaintMarkers(): void {
    const newSelected = this.selectedRegionId();
    if (newSelected === this.currentSelectedMarkerId) return;

    const regionMap = this.iso2ToRegion();
    const findById = (id: string): Region | null => {
      for (const r of regionMap.values()) if (r.id === id) return r;
      return null;
    };

    if (this.currentSelectedMarkerId) {
      const prev = this.chips.get(this.currentSelectedMarkerId);
      const region = findById(this.currentSelectedMarkerId);
      if (prev && region) prev.setIcon(makeChipIcon(region, false));
    }
    if (newSelected) {
      const next = this.chips.get(newSelected);
      const region = findById(newSelected);
      if (next && region) {
        next.setIcon(makeChipIcon(region, true));
        next.setZIndexOffset(1000);
      }
    }
    this.currentSelectedMarkerId = newSelected;
  }

  private styleFor(iso2: string | undefined): L.PathOptions {
    const gain = iso2 ? this.iso2ToGain().get(iso2) : undefined;
    const region = iso2 ? this.iso2ToRegion().get(iso2) : undefined;
    const isSelected = !!region && region.id === this.selectedRegionId();
    return {
      fillColor: colorFor(gain),
      fillOpacity: 0.85,
      color: isSelected ? '#1e2a6e' : '#ffffff',
      weight: isSelected ? 2.5 : 0.7,
      opacity: 1,
    };
  }

  private tooltipHtml(iso2: string, fallbackName: string): string {
    const region = this.iso2ToRegion().get(iso2);
    const name = region?.name ?? fallbackName;
    const gain = this.iso2ToGain().get(iso2);
    const gainLabel =
      gain === undefined
        ? '— нет данных'
        : Math.abs(gain) < 30
          ? `${gain >= 0 ? '+' : '−'}${Math.abs(Math.round(gain))} мин в год`
          : `${gain >= 0 ? '+' : '−'}${Math.abs(Math.round(gain / 60))} ч в год`;
    const tz = region ? formatTimeZone(region.timeZone) : null;
    const tzRow = tz ? `<div class="russia-map-tooltip__tz">${escapeHtml(tz)}</div>` : '';
    return `<strong>${escapeHtml(name)}</strong>${tzRow}<div>прирост света: ${gainLabel}</div>`;
  }
}

function makeChipIcon(region: Region, isSelected: boolean): L.DivIcon {
  const tz = formatTimeZone(region.timeZone);
  const html = isSelected
    ? `<span class="rmap-chip rmap-chip--selected"><span class="rmap-chip__name">${escapeHtml(region.name)}</span><span class="rmap-chip__tz">${escapeHtml(tz)}</span></span>`
    : `<span class="rmap-chip"><span class="rmap-chip__tz">${escapeHtml(tz)}</span></span>`;
  return L.divIcon({
    html,
    className: 'rmap-chip-wrapper',
    iconSize: undefined as unknown as L.PointExpression,
    iconAnchor: undefined,
  });
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function formatTimeZone(tz: string): string {
  const offset = utcOffsetHours(tz);
  if (offset === null) return tz;
  const sign = offset >= 0 ? '+' : '−';
  return `UTC${sign}${Math.abs(offset)}`;
}

function utcOffsetHours(timeZone: string): number | null {
  try {
    const now = new Date();
    const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
    const local = new Date(now.toLocaleString('en-US', { timeZone }));
    return Math.round((local.getTime() - utc.getTime()) / 3600000);
  } catch {
    return null;
  }
}

// Russia crosses the antimeridian. For a Web Mercator-based tile map we need
// every coordinate on the same side, so shift any longitude < -90 by +360.
function unwrapAntimeridianFeatures(features: RegionFeature[]): void {
  for (const f of features) walkCoords(f.geometry);
}

function unwrapAntimeridianMultiPolygon(geom: MultiPolygon): void {
  for (const poly of geom.coordinates) {
    for (const ring of poly) shiftRing(ring);
  }
}

function walkCoords(geom: Geometry): void {
  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) shiftRing(ring);
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) for (const ring of poly) shiftRing(ring);
  } else if (geom.type === 'GeometryCollection') {
    for (const g of geom.geometries) walkCoords(g);
  }
}

function shiftRing(ring: Position[]): void {
  for (const c of ring) {
    if (c[0] < -90) c[0] += 360;
  }
}

function colorFor(minutes: number | undefined): string {
  if (minutes === undefined) return '#cbd5e1';
  const hours = minutes / 60;
  if (hours < 10) return '#1a7f3c';
  if (hours < 30) return '#84cc16';
  if (hours < 60) return '#fde68a';
  if (hours < 100) return '#fb923c';
  if (hours < 150) return '#ef4444';
  if (hours < 250) return '#dc2626';
  return '#7f1d1d';
}
