
export interface Pilot {
  id?: string;
  callsign: string;
  name: string;
  surname: string;
  discord: string;
  old_flights: number;
  suspended?: boolean;
}

export type SearchFilters = {
  query: string;
  searchBy: 'callsign' | 'fullname';
};
