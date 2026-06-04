// Mock data — DEV/STORYBOOK/TESTS ONLY. Not imported by production code.
// ── SECTION: Mock Data (Acme Roadways Pvt. Ltd — Indian logistics) ──

export const org = {
  name: 'Acme Roadways Pvt. Ltd',
  slug: 'acme',
  plan: 'pro',
};

export const users = [
  { id: 'u1', name: 'Rajesh Kumar', role: 'Admin', email: 'rajesh@acmeroadways.in' },
  { id: 'u2', name: 'Priya Sharma', role: 'Operations', email: 'priya@acmeroadways.in' },
  { id: 'u3', name: 'Mohan Das', role: 'Staff', email: 'mohan@acmeroadways.in' },
  { id: 'u4', name: 'Arjun Singh', role: 'Driver', email: 'arjun@acmeroadways.in' },
];

export const cities = ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Aurangabad', 'Solapur'];

export const loadProviders = [
  { id: 'lp1', name: 'Mahindra Logistics', short: 'MLL', city: 'Mumbai', contact: '+91 98200 11111' },
  { id: 'lp2', name: 'Delhivery Freight', short: 'DLV', city: 'Pune', contact: '+91 98200 22222' },
  { id: 'lp3', name: 'VRL Logistics', short: 'VRL', city: 'Nagpur', contact: '+91 98200 33333' },
  { id: 'lp4', name: 'BlueDart Express', short: 'BDE', city: 'Nashik', contact: '+91 98200 44444' },
];

// Dates anchored around 2026-06-01.
export const vehicles = [
  {
    id: 'v1', number: 'MH14-AB-1234', model: 'Tata Prima 4928S', axle: 'single',
    status: 'in_transit', odometer: 142850, compliance: 62, currentTrip: 'TRV-20260530-0001',
    docs: { registration: '2022-03-15', fitness: '2026-06-09', insurance: '2026-11-20', tax: '2026-09-30', permit: '2027-01-15', pucc: '2026-08-10', np: '2027-03-01' },
  },
  {
    id: 'v2', number: 'MH14-CD-5678', model: 'Ashok Leyland 3518', axle: 'multi',
    status: 'assigned', odometer: 89230, compliance: 88, currentTrip: null,
    docs: { registration: '2023-01-10', fitness: '2026-12-01', insurance: '2027-01-05', tax: '2026-10-15', permit: '2027-02-20', pucc: '2026-10-01', np: '2027-04-10' },
  },
  {
    id: 'v3', number: 'MH14-EF-9012', model: 'Tata LPT 3118', axle: 'single',
    status: 'idle', odometer: 218400, compliance: 91, currentTrip: null,
    docs: { registration: '2021-07-22', fitness: '2026-11-11', insurance: '2027-03-18', tax: '2026-12-20', permit: '2027-05-01', pucc: '2026-09-15', np: '2027-06-12' },
  },
  {
    id: 'v4', number: 'MH14-GH-3456', model: 'Mahindra Blazo', axle: 'multi',
    status: 'in_transit', odometer: 67100, compliance: 71, currentTrip: 'TRV-20260530-0006',
    docs: { registration: '2023-05-30', fitness: '2026-10-05', insurance: '2026-06-19', tax: '2026-11-01', permit: '2027-03-10', pucc: '2026-09-25', np: '2027-05-15' },
  },
  {
    id: 'v5', number: 'MH14-IJ-7890', model: 'Eicher Pro 6025', axle: 'single',
    status: 'idle', odometer: 105760, compliance: 48, currentTrip: null,
    docs: { registration: '2022-09-12', fitness: '2026-08-20', insurance: '2026-09-09', tax: '2026-07-30', permit: '2026-12-05', pucc: '2026-06-06', np: '2027-01-25' },
  },
  {
    id: 'v6', number: 'MH14-KL-2345', model: 'BharatBenz 3523R', axle: 'multi',
    status: 'assigned', odometer: 44900, compliance: 94, currentTrip: null,
    docs: { registration: '2024-02-18', fitness: '2027-01-20', insurance: '2027-02-28', tax: '2027-01-10', permit: '2027-06-15', pucc: '2026-11-30', np: '2027-08-01' },
  },
  {
    id: 'v7', number: 'MH14-MN-6789', model: 'Tata Signa 4825', axle: 'single',
    status: 'in_transit', odometer: 301200, compliance: 67, currentTrip: 'TRV-20260530-0003',
    docs: { registration: '2020-11-05', fitness: '2026-10-30', insurance: '2026-12-12', tax: '2026-10-25', permit: '2027-02-08', pucc: '2026-07-18', np: '2027-03-22' },
  },
  {
    id: 'v8', number: 'MH14-OP-0123', model: 'Ashok Leyland 5530', axle: 'multi',
    status: 'idle', odometer: 78500, compliance: 85, currentTrip: null,
    docs: { registration: '2023-08-14', fitness: '2026-12-18', insurance: '2027-01-22', tax: '2026-11-28', permit: '2027-04-05', pucc: '2026-10-20', np: '2027-05-30' },
  },
];

export const drivers = [
  {
    id: 'd1', name: 'Ramesh Yadav', status: 'in_transit', contact: '+91 98765 10001',
    emergency: '+91 98765 20001', currentTrip: 'TRV-20260530-0001', licence: 'MH1420220001234',
    aadhaar: '1234', pan: 'ABCPY1234K', address: 'Andheri East, Mumbai, MH 400069',
    bank: { holder: 'Ramesh Yadav', account: '4521', branch: 'SBI Andheri', ifsc: 'SBIN0001234', type: 'savings', verified: true }, tripsMonth: 14,
  },
  {
    id: 'd2', name: 'Suresh Patel', status: 'available', contact: '+91 98765 10002',
    emergency: '+91 98765 20002', currentTrip: null, licence: 'MH1420210005678',
    aadhaar: '5678', pan: 'BCXPS5678L', address: 'Kothrud, Pune, MH 411038',
    bank: { holder: 'Suresh Patel', account: '7832', branch: 'HDFC Kothrud', ifsc: 'HDFC0000789', type: 'current', verified: true }, tripsMonth: 11,
  },
  {
    id: 'd3', name: 'Dinesh Verma', status: 'in_transit', contact: '+91 98765 10003',
    emergency: '+91 98765 20003', currentTrip: 'TRV-20260530-0003', licence: 'MH1420190009012',
    aadhaar: '9012', pan: 'CDXPV9012M', address: 'Nashik Road, Nashik, MH 422101',
    bank: { holder: 'Dinesh Verma', account: '1198', branch: 'ICICI Nashik', ifsc: 'ICIC0001198', type: 'savings', verified: false }, tripsMonth: 13,
  },
  {
    id: 'd4', name: 'Ganesh Jadhav', status: 'assigned', contact: '+91 98765 10004',
    emergency: '+91 98765 20004', currentTrip: null, licence: 'MH1420220003456',
    aadhaar: '3456', pan: 'DEXPJ3456N', address: 'Sitabuldi, Nagpur, MH 440012',
    bank: { holder: 'Ganesh Jadhav', account: '6654', branch: 'BoB Nagpur', ifsc: 'BARB0NAGPUR', type: 'salary', verified: true }, tripsMonth: 9,
  },
  {
    id: 'd5', name: 'Kamlesh Thakur', status: 'available', contact: '+91 98765 10005',
    emergency: '+91 98765 20005', currentTrip: null, licence: 'MH1420200007890',
    aadhaar: '7890', pan: 'EFXPT7890P', address: 'CIDCO, Aurangabad, MH 431003',
    bank: { holder: 'Kamlesh Thakur', account: '3321', branch: 'Axis Aurangabad', ifsc: 'UTIB0003321', type: 'savings', verified: true }, tripsMonth: 10,
  },
  {
    id: 'd6', name: 'Rakesh Gupta', status: 'in_transit', contact: '+91 98765 10006',
    emergency: '+91 98765 20006', currentTrip: 'TRV-20260530-0006', licence: 'MH1420230002345',
    aadhaar: '2345', pan: 'FGXPG2345Q', address: 'Solapur City, Solapur, MH 413001',
    bank: { holder: 'Rakesh Gupta', account: '9087', branch: 'SBI Solapur', ifsc: 'SBIN0009087', type: 'savings', verified: false }, tripsMonth: 12,
  },
];

export const trips = [
  { id: 't1', number: 'TRV-20260530-0001', start: 'Mumbai', end: 'Pune', status: 'in_transit', freight: 185000, advance: 45000, driverId: 'd1', vehicleId: 'v1', providerId: 'lp1', distance: 148, duration: 210, createdAt: '2026-05-30T06:30:00', startedAt: '2026-05-30T07:15:00', endedAt: null, createdBy: 'Priya Sharma' },
  { id: 't2', number: 'TRV-20260530-0002', start: 'Pune', end: 'Nagpur', status: 'created', freight: 245000, advance: 60000, driverId: 'd4', vehicleId: 'v6', providerId: 'lp2', distance: 710, duration: 840, createdAt: '2026-05-30T08:00:00', startedAt: null, endedAt: null, createdBy: 'Priya Sharma' },
  { id: 't3', number: 'TRV-20260530-0003', start: 'Nashik', end: 'Aurangabad', status: 'in_transit', freight: 98000, advance: 25000, driverId: 'd3', vehicleId: 'v7', providerId: 'lp4', distance: 192, duration: 240, createdAt: '2026-05-30T05:45:00', startedAt: '2026-05-30T06:20:00', endedAt: null, createdBy: 'Rajesh Kumar' },
  { id: 't4', number: 'TRV-20260529-0001', start: 'Mumbai', end: 'Solapur', status: 'completed', freight: 165000, advance: 40000, driverId: 'd2', vehicleId: 'v3', providerId: 'lp1', distance: 395, duration: 480, createdAt: '2026-05-29T05:00:00', startedAt: '2026-05-29T05:40:00', endedAt: '2026-05-29T13:30:00', createdBy: 'Priya Sharma' },
  { id: 't5', number: 'TRV-20260529-0002', start: 'Nagpur', end: 'Pune', status: 'completed', freight: 210000, advance: 55000, driverId: 'd5', vehicleId: 'v8', providerId: 'lp3', distance: 705, duration: 820, createdAt: '2026-05-29T04:30:00', startedAt: '2026-05-29T05:10:00', endedAt: '2026-05-29T18:50:00', createdBy: 'Rajesh Kumar' },
  { id: 't6', number: 'TRV-20260529-0003', start: 'Aurangabad', end: 'Mumbai', status: 'completed', freight: 140000, advance: 35000, driverId: 'd2', vehicleId: 'v5', providerId: 'lp2', distance: 335, duration: 410, createdAt: '2026-05-29T07:00:00', startedAt: '2026-05-29T07:35:00', endedAt: '2026-05-29T14:25:00', createdBy: 'Priya Sharma' },
  { id: 't7', number: 'TRV-20260530-0004', start: 'Pune', end: 'Nashik', status: 'created', freight: 75000, advance: 18000, driverId: 'd5', vehicleId: 'v2', providerId: 'lp2', distance: 210, duration: 270, createdAt: '2026-05-30T09:10:00', startedAt: null, endedAt: null, createdBy: 'Priya Sharma' },
  { id: 't8', number: 'TRV-20260530-0005', start: 'Solapur', end: 'Nagpur', status: 'created', freight: 195000, advance: 50000, driverId: 'd4', vehicleId: 'v6', providerId: 'lp3', distance: 525, duration: 630, createdAt: '2026-05-30T09:40:00', startedAt: null, endedAt: null, createdBy: 'Rajesh Kumar' },
  { id: 't9', number: 'TRV-20260530-0006', start: 'Mumbai', end: 'Nagpur', status: 'in_transit', freight: 280000, advance: 70000, driverId: 'd6', vehicleId: 'v4', providerId: 'lp3', distance: 825, duration: 960, createdAt: '2026-05-30T04:00:00', startedAt: '2026-05-30T04:45:00', endedAt: null, createdBy: 'Priya Sharma' },
  { id: 't10', number: 'TRV-20260528-0001', start: 'Pune', end: 'Mumbai', status: 'completed', freight: 120000, advance: 30000, driverId: 'd1', vehicleId: 'v1', providerId: 'lp1', distance: 148, duration: 200, createdAt: '2026-05-28T06:00:00', startedAt: '2026-05-28T06:30:00', endedAt: '2026-05-28T10:10:00', createdBy: 'Priya Sharma' },
  { id: 't11', number: 'TRV-20260528-0002', start: 'Nashik', end: 'Pune', status: 'completed', freight: 158000, advance: 40000, driverId: 'd3', vehicleId: 'v7', providerId: 'lp4', distance: 210, duration: 280, createdAt: '2026-05-28T05:30:00', startedAt: '2026-05-28T06:05:00', endedAt: '2026-05-28T11:00:00', createdBy: 'Rajesh Kumar' },
  { id: 't12', number: 'TRV-20260527-0001', start: 'Nagpur', end: 'Aurangabad', status: 'completed', freight: 132000, advance: 32000, driverId: 'd6', vehicleId: 'v4', providerId: 'lp3', distance: 445, duration: 540, createdAt: '2026-05-27T05:00:00', startedAt: '2026-05-27T05:30:00', endedAt: '2026-05-27T14:20:00', createdBy: 'Priya Sharma' },
];

export const TXN_CATEGORIES = [
  'fuel', 'driver-advance', 'maintenance', 'food', 'challan', 'extra-advance', 'incentives',
];

export const transactions = [
  { id: 'TXN-9f3a21', tripId: 't1', tripNo: 'TRV-20260530-0001', type: 'debit', category: 'fuel', amount: 9500, method: 'upi', status: 'success', manual: false, date: '2026-05-30T07:40:00', desc: 'Diesel fill — HP Andheri', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'HP Petrol Pump', type: 'vendor' } },
  { id: 'TXN-9f3a22', tripId: 't1', tripNo: 'TRV-20260530-0001', type: 'debit', category: 'driver-advance', amount: 20000, method: 'bank_transfer', status: 'success', manual: false, date: '2026-05-30T06:50:00', desc: 'Trip advance to Ramesh Yadav', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Ramesh Yadav', type: 'driver' } },
  { id: 'TXN-9f3a23', tripId: 't4', tripNo: 'TRV-20260529-0001', type: 'credit', category: 'incentives', amount: 165000, method: 'bank_transfer', status: 'success', manual: false, date: '2026-05-29T14:00:00', desc: 'Freight settlement received', from: { name: 'Mahindra Logistics', type: 'provider' }, to: { name: 'Acme Wallet', type: 'org' } },
  { id: 'TXN-9f3a24', tripId: 't3', tripNo: 'TRV-20260530-0003', type: 'debit', category: 'fuel', amount: 8800, method: 'cash', status: 'success', manual: true, date: '2026-05-30T06:30:00', desc: 'Diesel — Nashik bypass', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'IOC Pump', type: 'vendor' } },
  { id: 'TXN-9f3a25', tripId: 't9', tripNo: 'TRV-20260530-0006', type: 'debit', category: 'driver-advance', amount: 25000, method: 'upi', status: 'success', manual: false, date: '2026-05-30T04:30:00', desc: 'Long-haul advance to Rakesh', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Rakesh Gupta', type: 'driver' } },
  { id: 'TXN-9f3a26', tripId: 't9', tripNo: 'TRV-20260530-0006', type: 'debit', category: 'food', amount: 1500, method: 'cash', status: 'success', manual: true, date: '2026-05-30T11:00:00', desc: 'Driver food allowance', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Rakesh Gupta', type: 'driver' } },
  { id: 'TXN-9f3a27', tripId: 't2', tripNo: 'TRV-20260530-0002', type: 'debit', category: 'extra-advance', amount: 15000, method: 'upi', status: 'pending', manual: false, date: '2026-05-30T08:20:00', desc: 'Extra advance — toll heavy route', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Ganesh Jadhav', type: 'driver' } },
  { id: 'TXN-9f3a28', tripId: 't3', tripNo: 'TRV-20260530-0003', type: 'debit', category: 'challan', amount: 2000, method: 'card', status: 'success', manual: true, date: '2026-05-30T09:15:00', desc: 'Overspeed challan', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'RTO Maharashtra', type: 'govt' } },
  { id: 'TXN-9f3a29', tripId: 't5', tripNo: 'TRV-20260529-0002', type: 'credit', category: 'incentives', amount: 210000, method: 'bank_transfer', status: 'success', manual: false, date: '2026-05-29T19:30:00', desc: 'Freight settlement received', from: { name: 'VRL Logistics', type: 'provider' }, to: { name: 'Acme Wallet', type: 'org' } },
  { id: 'TXN-9f3a30', tripId: 't9', tripNo: 'TRV-20260530-0006', type: 'debit', category: 'maintenance', amount: 12500, method: 'cash', status: 'success', manual: true, date: '2026-05-30T12:30:00', desc: 'Tyre puncture + minor repair', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Highway Garage', type: 'vendor' } },
  { id: 'TXN-9f3a31', tripId: 't6', tripNo: 'TRV-20260529-0003', type: 'credit', category: 'incentives', amount: 140000, method: 'upi', status: 'success', manual: false, date: '2026-05-29T15:00:00', desc: 'Freight settlement received', from: { name: 'Delhivery Freight', type: 'provider' }, to: { name: 'Acme Wallet', type: 'org' } },
  { id: 'TXN-9f3a32', tripId: 't1', tripNo: 'TRV-20260530-0001', type: 'debit', category: 'fuel', amount: 9800, method: 'upi', status: 'success', manual: false, date: '2026-05-30T10:10:00', desc: 'Diesel top-up — Lonavala', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'BPCL Pump', type: 'vendor' } },
  { id: 'TXN-9f3a33', tripId: 't5', tripNo: 'TRV-20260529-0002', type: 'debit', category: 'maintenance', amount: 8200, method: 'cash', status: 'success', manual: true, date: '2026-05-29T10:00:00', desc: 'Brake adjustment', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Nagpur Auto Works', type: 'vendor' } },
  { id: 'TXN-9f3a34', tripId: 't2', tripNo: 'TRV-20260530-0002', type: 'debit', category: 'driver-advance', amount: 22000, method: 'bank_transfer', status: 'pending', manual: false, date: '2026-05-30T08:05:00', desc: 'Advance to Ganesh Jadhav', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Ganesh Jadhav', type: 'driver' } },
  { id: 'TXN-9f3a35', tripId: 't10', tripNo: 'TRV-20260528-0001', type: 'credit', category: 'incentives', amount: 120000, method: 'bank_transfer', status: 'success', manual: false, date: '2026-05-28T11:00:00', desc: 'Freight settlement received', from: { name: 'Mahindra Logistics', type: 'provider' }, to: { name: 'Acme Wallet', type: 'org' } },
  { id: 'TXN-9f3a36', tripId: 't3', tripNo: 'TRV-20260530-0003', type: 'debit', category: 'incentives', amount: 3000, method: 'upi', status: 'success', manual: false, date: '2026-05-30T13:00:00', desc: 'On-time delivery incentive', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Dinesh Verma', type: 'driver' } },
  { id: 'TXN-9f3a37', tripId: 't11', tripNo: 'TRV-20260528-0002', type: 'credit', category: 'incentives', amount: 158000, method: 'upi', status: 'success', manual: false, date: '2026-05-28T12:00:00', desc: 'Freight settlement received', from: { name: 'BlueDart Express', type: 'provider' }, to: { name: 'Acme Wallet', type: 'org' } },
  { id: 'TXN-9f3a38', tripId: 't9', tripNo: 'TRV-20260530-0006', type: 'debit', category: 'fuel', amount: 11200, method: 'card', status: 'success', manual: false, date: '2026-05-30T05:10:00', desc: 'Diesel full tank — Mumbai depot', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Shell Pump', type: 'vendor' } },
  { id: 'TXN-9f3a39', tripId: 't12', tripNo: 'TRV-20260527-0001', type: 'debit', category: 'food', amount: 1200, method: 'cash', status: 'success', manual: true, date: '2026-05-27T10:30:00', desc: 'Driver meals', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Rakesh Gupta', type: 'driver' } },
  { id: 'TXN-9f3a40', tripId: 't8', tripNo: 'TRV-20260530-0005', type: 'debit', category: 'extra-advance', amount: 12000, method: 'upi', status: 'failed', manual: false, date: '2026-05-30T09:50:00', desc: 'Extra advance — UPI declined', from: { name: 'Acme Wallet', type: 'org' }, to: { name: 'Ganesh Jadhav', type: 'driver' } },
];

export const fuelLogs = [
  { id: 'f1', tripId: 't1', tripNo: 'TRV-20260530-0001', vehicle: 'MH14-AB-1234', station: 'HP Andheri', date: '2026-05-30T07:40:00', litres: 120, rate: 92.4, amount: 11088, type: 'diesel' },
  { id: 'f2', tripId: 't1', tripNo: 'TRV-20260530-0001', vehicle: 'MH14-AB-1234', station: 'BPCL Lonavala', date: '2026-05-30T10:10:00', litres: 60, rate: 93.1, amount: 5586, type: 'diesel' },
  { id: 'f3', tripId: 't3', tripNo: 'TRV-20260530-0003', vehicle: 'MH14-MN-6789', station: 'IOC Nashik', date: '2026-05-30T06:30:00', litres: 95, rate: 92.0, amount: 8740, type: 'diesel' },
  { id: 'f4', tripId: 't9', tripNo: 'TRV-20260530-0006', vehicle: 'MH14-GH-3456', station: 'Shell Mumbai', date: '2026-05-30T05:10:00', litres: 140, rate: 93.5, amount: 13090, type: 'diesel' },
];

// ── Audit log with before/after diffs ──
export const activityLogs = [
  { id: 'a1', ts: '2026-05-30T07:15:00', user: 'Priya Sharma', action: 'UPDATE', collection: 'trips', recordId: 't1', note: 'Marked trip TRV-20260530-0001 In Transit', changes: { currentStatus: { before: 'created', after: 'in_transit' }, startedAt: { before: null, after: '2026-05-30T07:15:00' } } },
  { id: 'a2', ts: '2026-05-30T06:50:00', user: 'Priya Sharma', action: 'CREATE', collection: 'transactions', recordId: 'TXN-9f3a22', note: 'Added driver advance ₹20,000', changes: { amount: { before: null, after: 20000 }, category: { before: null, after: 'driver-advance' }, type: { before: null, after: 'debit' } } },
  { id: 'a3', ts: '2026-05-30T06:30:00', user: 'Rajesh Kumar', action: 'CREATE', collection: 'trips', recordId: 't3', note: 'Created trip Nashik → Aurangabad', changes: { number: { before: null, after: 'TRV-20260530-0003' }, freight: { before: null, after: 98000 } } },
  { id: 'a4', ts: '2026-05-30T05:00:00', user: 'Rajesh Kumar', action: 'UPDATE', collection: 'vehicles', recordId: 'v4', note: 'Updated odometer reading', changes: { odometer: { before: 66890, after: 67100 } } },
  { id: 'a5', ts: '2026-05-29T18:55:00', user: 'Priya Sharma', action: 'UPDATE', collection: 'trips', recordId: 't5', note: 'Marked trip TRV-20260529-0002 Completed', changes: { currentStatus: { before: 'in_transit', after: 'completed' }, endedAt: { before: null, after: '2026-05-29T18:50:00' } } },
  { id: 'a6', ts: '2026-05-29T14:05:00', user: 'Rajesh Kumar', action: 'CREATE', collection: 'transactions', recordId: 'TXN-9f3a23', note: 'Recorded freight settlement ₹1,65,000', changes: { amount: { before: null, after: 165000 }, type: { before: null, after: 'credit' } } },
  { id: 'a7', ts: '2026-05-29T11:20:00', user: 'Mohan Das', action: 'UPDATE', collection: 'drivers', recordId: 'd3', note: 'Updated bank verification status', changes: { bankVerified: { before: true, after: false } } },
  { id: 'a8', ts: '2026-05-29T09:00:00', user: 'Rajesh Kumar', action: 'DELETE', collection: 'fuel-logs', recordId: 'f9', note: 'Removed duplicate fuel log', changes: { amount: { before: 5400, after: null }, litres: { before: 58, after: null } } },
  { id: 'a9', ts: '2026-05-28T16:30:00', user: 'Priya Sharma', action: 'UPDATE', collection: 'vehicles', recordId: 'v1', note: 'Flagged fitness certificate expiring', changes: { fitness: { before: '2026-09-09', after: '2026-06-09' } } },
  { id: 'a10', ts: '2026-05-28T11:05:00', user: 'Priya Sharma', action: 'UPDATE', collection: 'trips', recordId: 't10', note: 'Marked trip TRV-20260528-0001 Completed', changes: { currentStatus: { before: 'in_transit', after: 'completed' } } },
  { id: 'a11', ts: '2026-05-28T08:15:00', user: 'Mohan Das', action: 'CREATE', collection: 'load-providers', recordId: 'lp4', note: 'Added load provider BlueDart Express', changes: { name: { before: null, after: 'BlueDart Express' }, city: { before: null, after: 'Nashik' } } },
  { id: 'a12', ts: '2026-05-27T14:25:00', user: 'Rajesh Kumar', action: 'UPDATE', collection: 'transactions', recordId: 'TXN-9f3a40', note: 'Transaction failed — UPI declined', changes: { status: { before: 'pending', after: 'failed' } } },
];

export const notifications = {
  'Compliance Alerts': [
    { id: 'n1', icon: 'danger', msg: 'MH14-AB-1234 fitness expires in 8 days', time: '2h ago' },
    { id: 'n2', icon: 'danger', msg: 'MH14-IJ-7890 PUCC expires in 5 days', time: '4h ago' },
    { id: 'n3', icon: 'warning', msg: 'MH14-GH-3456 insurance expires in 18 days', time: '1d ago' },
  ],
  'Trip Updates': [
    { id: 'n4', icon: 'info', msg: 'TRV-20260530-0006 departed Mumbai', time: '3h ago' },
    { id: 'n5', icon: 'success', msg: 'TRV-20260529-0002 completed', time: '12h ago' },
  ],
  System: [
    { id: 'n6', icon: 'info', msg: 'Monthly compliance report ready', time: '1d ago' },
  ],
};

// ── Trip activity chart (last 7 days) ──
export const tripActivity = [
  { day: 'Mon', completed: 5, inTransit: 3 },
  { day: 'Tue', completed: 6, inTransit: 4 },
  { day: 'Wed', completed: 4, inTransit: 5 },
  { day: 'Thu', completed: 7, inTransit: 3 },
  { day: 'Fri', completed: 5, inTransit: 6 },
  { day: 'Sat', completed: 8, inTransit: 4 },
  { day: 'Sun', completed: 3, inTransit: 8 },
];

// ── Expense breakdown (donut) ──
export const expenseBreakdown = [
  { name: 'fuel', value: 38200, color: '#0EA5C5' },
  { name: 'driver-advance', value: 67000, color: '#4A9B3C' },
  { name: 'maintenance', value: 20700, color: '#8B5CF6' },
  { name: 'food', value: 3900, color: '#F59E0B' },
  { name: 'challan', value: 2000, color: '#E8394D' },
  { name: 'extra-advance', value: 27000, color: '#2D7A5E' },
  { name: 'incentives', value: 3000, color: '#5CB85C' },
];

// ── RBAC ──
export const roles = [
  { id: 'Admin', name: 'Admin', users: 1, accent: 'var(--gradient-brand)', system: true },
  { id: 'Staff', name: 'Staff', users: 1, accent: 'var(--green)', system: true },
  { id: 'Operations', name: 'Operations', users: 1, accent: 'var(--teal)', system: true },
  { id: 'Driver', name: 'Driver', users: 1, accent: 'var(--warning)', system: true },
];

export const moduleGroups = [
  { group: 'OPERATIONS', modules: ['trips', 'vehicles', 'drivers', 'staff'] },
  { group: 'FINANCE', modules: ['transactions', 'toll-logs'] },
  { group: 'FLEET OPS', modules: ['fuel-stations', 'fuel-logs', 'garages', 'garage-logs', 'tyre-logs'] },
  { group: 'MASTER DATA', modules: ['cities', 'load-providers', 'users'] },
  { group: 'AUDIT', modules: ['activity-logs'] },
];

const ALL_MODULES = moduleGroups.flatMap((g) => g.modules);
const crud = (c, r, u, d) => ({ canCreate: c, canRead: r, canUpdate: u, canDelete: d });
const none = crud(false, false, false, false);
const full = crud(true, true, true, true);

function buildMatrix(partial) {
  const m = {};
  for (const mod of ALL_MODULES) m[mod] = partial[mod] ?? none;
  return m;
}

export const defaultPermissions = {
  Admin: buildMatrix(Object.fromEntries(ALL_MODULES.map((m) => [m, full]))),
  Staff: buildMatrix({
    cities: crud(false, true, false, false),
    'fuel-stations': full, garages: full, 'fuel-logs': full, 'garage-logs': full,
    'tyre-logs': full, transactions: full, 'activity-logs': crud(false, true, false, false),
    drivers: crud(false, true, false, false), vehicles: crud(false, true, false, false),
    staff: full, 'load-providers': crud(false, true, false, false), users: crud(false, true, false, false),
  }),
  Operations: buildMatrix({
    trips: full, vehicles: crud(false, true, true, false), drivers: crud(false, true, false, false),
    'load-providers': crud(false, true, false, false), 'fuel-logs': crud(true, true, false, false),
    'toll-logs': full, cities: crud(false, true, false, false),
  }),
  Driver: buildMatrix({ trips: crud(false, true, false, false), drivers: crud(false, true, false, false) }),
};

// ── Derived helpers ──
export const driverById = (id) => drivers.find((d) => d.id === id);
export const vehicleById = (id) => vehicles.find((v) => v.id === id);
export const providerById = (id) => loadProviders.find((p) => p.id === id);
export const tripById = (id) => trips.find((t) => t.id === id);
