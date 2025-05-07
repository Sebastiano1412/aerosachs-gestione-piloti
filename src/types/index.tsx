
export interface Pilot {
  id?: string;
  callsign: string;
  name: string;
  surname: string;
  discord: string;
  old_flights: number;
  suspended?: boolean;
  suspension_reason?: string;
  suspension_date?: string;
}

export type SearchFilters = {
  query: string;
  searchBy: 'callsign' | 'fullname';
};
