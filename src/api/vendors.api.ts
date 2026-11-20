import { get, post, put, del } from './client';

/** The vendor types the Vendors page manages. (Load provider vendors have their own page, with GST/TDS settings.) */
export type ManagedVendorType = 'garage' | 'spare_parts' | 'fuel_station' | 'tyre_hub';
export type VendorType = ManagedVendorType | 'load_provider';

export interface Vendor {
  id: string;
  type: VendorType;
  typeLabel: string;
  vendorCode: string;
  name: string;
  contactPerson: string | null;
  contactNumber: string | null;
  notes: string | null;
  isActive: boolean;
  outstandingCredit: number | null;
}
export interface VendorsResponse {
  data: Vendor[];
  counts: Record<VendorType, number>;
}
export interface VendorBody {
  type?: ManagedVendorType;
  name?: string;
  vendorCode?: string;
  contactPerson?: string | null;
  contactNumber?: string | null;
  notes?: string | null;
  isActive?: boolean;
}

const MANAGED: ManagedVendorType[] = ['garage', 'spare_parts', 'fuel_station', 'tyre_hub'];

export const getVendors = async (): Promise<VendorsResponse> => {
  // one list over every managed type
  const pages = await Promise.all(MANAGED.map((type) => get<VendorsResponse>('/api/vendors', { type, page: 1, pageSize: 200 })));
  const data = pages.flatMap((p) => p.data).sort((a, b) => a.name.localeCompare(b.name));
  return { data, counts: Object.assign({}, ...pages.map((p) => p.counts)) as VendorsResponse['counts'] };
};

export const createVendor = (body: VendorBody & { type: ManagedVendorType; name: string }) => post<Vendor>('/api/vendors', body);
export const updateVendor = (id: string, body: VendorBody) => put<Vendor>(`/api/vendors/${id}`, body);
/** Garages and fuel station vendors can be deleted; any other vendor is made inactive instead. */
export const canDelete = (type: VendorType): boolean => type === 'garage' || type === 'fuel_station';
export const deleteVendor = (v: Pick<Vendor, 'id' | 'type'>) => del<void>(v.type === 'fuel_station' ? `/api/fuel-stations/${v.id}` : `/api/garages/${v.id}`);
