import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { map, tap } from 'rxjs';

import {
  Pollution,
  PollutionFilters,
  PollutionPayload,
  PollutionStatus,
  PollutionType
} from './models/pollution.model';
import { environment } from '../../environments/environment';

interface ApiPollution {
  id: string | number;
  nom?: string;
  name?: string;
  lieu?: string;
  city?: string;
  dateObservation?: string;
  recordedAt?: string;
  typePollution?: PollutionType;
  type?: PollutionType;
  description?: string;
  status?: PollutionStatus;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PollutionService {
  private readonly apiUrl = `${environment.apiBaseUrl}/pollutions`;
  private readonly store = signal<Pollution[]>([]);
  private readonly pollutionsSignal = signal<Pollution[]>([]);
  private lastFilters: PollutionFilters = {};

  readonly pollutions = computed(() => this.pollutionsSignal());

  constructor(private readonly http: HttpClient) {}

  load(filters: PollutionFilters = {}) {
    this.lastFilters = { ...filters };
    return this.http.get<ApiPollution[]>(this.apiUrl).pipe(
      map((items) => items.map((item) => this.fromApi(item))),
      tap((list) => this.store.set(list)),
      map((list) => this.applyFilters(list, filters)),
      tap((filtered) => this.pollutionsSignal.set(filtered))
    );
  }

  getById(id: string) {
    return this.http
      .get<ApiPollution>(`${this.apiUrl}/${id}`)
      .pipe(map((item) => this.fromApi(item)));
  }

  create(payload: PollutionPayload) {
    const body = this.toApiPayload(payload);
    return this.http.post<ApiPollution>(this.apiUrl, body).pipe(
      map((item) => this.fromApi(item)),
      tap((pollution) => {
        this.store.update((items) => [pollution, ...items]);
        this.refreshFiltered();
      })
    );
  }

  update(id: string, payload: PollutionPayload) {
    const body = this.toApiPayload(payload);
    return this.http.put<ApiPollution>(`${this.apiUrl}/${id}`, body).pipe(
      map((item) => this.fromApi(item)),
      tap((pollution) => {
        let updated = false;
        this.store.update((items) =>
          items.map((current) => {
            if (current.id !== pollution.id) {
              return current;
            }
            updated = true;
            return pollution;
          })
        );
        if (!updated) {
          this.store.update((items) => [pollution, ...items]);
        }
        this.refreshFiltered();
      })
    );
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const exists = this.store().some((item) => item.id === id);
        if (!exists) {
          return;
        }
        this.store.update((items) => items.filter((item) => item.id !== id));
        this.refreshFiltered();
      })
    );
  }

  private applyFilters(list: Pollution[], filters: PollutionFilters) {
    let result = [...list];
    if (filters.search) {
      const term = filters.search.toLowerCase();
      result = result.filter((pollution) =>
        [
          pollution.name,
          pollution.description,
          pollution.city,
          pollution.type,
          pollution.status
        ]
          .join(' ')
          .toLowerCase()
          .includes(term)
      );
    }
    if (filters.type) {
      result = result.filter((pollution) => pollution.type === filters.type);
    }
    if (filters.city) {
      const cityTerm = filters.city.toLowerCase();
      result = result.filter((pollution) =>
        pollution.city.toLowerCase().includes(cityTerm)
      );
    }
    if (filters.status) {
      result = result.filter((pollution) => pollution.status === filters.status);
    }
    return result;
  }

  private refreshFiltered() {
    if (Object.keys(this.lastFilters).length === 0) {
      this.pollutionsSignal.set([...this.store()]);
      return;
    }
    const filtered = this.applyFilters(this.store(), this.lastFilters);
    this.pollutionsSignal.set([...filtered]);
  }

  private fromApi(pollution: ApiPollution): Pollution {
    return {
      id: String(pollution.id),
      name: pollution.name ?? pollution.nom ?? 'Anomalie sans titre',
      type:
        (pollution.type ??
          pollution.typePollution ??
          'other') as PollutionType,
      city: pollution.city ?? pollution.lieu ?? 'Non renseigné',
      recordedAt:
        pollution.recordedAt ??
        pollution.dateObservation ??
        new Date().toISOString(),
      status: (pollution.status ?? 'open') as PollutionStatus,
      description: pollution.description ?? '',
      latitude:
        pollution.latitude !== undefined
          ? Number(pollution.latitude)
          : undefined,
      longitude:
        pollution.longitude !== undefined
          ? Number(pollution.longitude)
          : undefined
    };
  }

  private toApiPayload(payload: PollutionPayload) {
    const recordedAt =
      payload.recordedAt ?? new Date().toISOString();
    const latitude =
      payload.latitude === null || payload.latitude === undefined
        ? undefined
        : Number(payload.latitude);
    const longitude =
      payload.longitude === null || payload.longitude === undefined
        ? undefined
        : Number(payload.longitude);

    return {
      nom: payload.name,
      name: payload.name,
      typePollution: payload.type,
      type: payload.type,
      lieu: payload.city,
      city: payload.city,
      dateObservation: recordedAt,
      recordedAt,
      status: payload.status,
      description: payload.description,
      latitude,
      longitude
    };
  }
}
