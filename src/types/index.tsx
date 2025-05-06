
export interface Pilot {
  id?: string;
  callsign: string;
  name: string;
  surname: string;
  discord: string;
  old_flights: number;
}

export type SearchFilters = {
  query: string;
  searchBy: 'callsign' | 'fullname';
};
