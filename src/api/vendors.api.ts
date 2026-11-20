import { get, post, put, del } from './client';

/** The vendor types the Vendors page manages. (Load provider vendors have their own page, with GST/TDS settings.) */
export type ManagedVendorType = 'garage' | 'spare_parts';
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

export const getVendors = async (): Promise<VendorsResponse> => {
  // garages and spare parts vendors, one list
  const [g, s] = await Promise.all([
    get<VendorsResponse>('/api/vendors', { type: 'garage', page: 1, pageSize: 200 }),
    get<VendorsResponse>('/api/vendors', { type: 'spare_parts', page: 1, pageSize: 200 }),
  ]);
  const data = [...g.data, ...s.data].sort((a, b) => a.name.localeCompare(b.name));
  return { data, counts: { ...g.counts, ...s.counts } };
};

export const createVendor = (body: VendorBody & { type: ManagedVendorType; name: string }) => post<Vendor>('/api/vendors', body);
export const updateVendor = (id: string, body: VendorBody) => put<Vendor>(`/api/vendors/${id}`, body);
/** Only garages can be deleted; a spare parts vendor is deactivated instead. */
export const deleteGarage = (id: string) => del<void>(`/api/garages/${id}`);
