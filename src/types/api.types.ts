// ── SECTION: API types (match transvigo-be Prisma schema, camelCase) ──

// ── Auth ──
export interface LoginRequest { email: string; password: string; orgSlug?: string }
export interface AuthUser {
  id: string; email: string; username: string;
  roleId: string; roleName: 'Admin' | 'Staff' | 'Operations' | 'Driver';
  orgId: string; orgName?: string; mustChangePwd: boolean;
}
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  // Org resolved automatically from the email at login.
  orgSlug: string;
  orgName: string;
  // Backend returns { id, email, username, role } — role is the role NAME.
  user: { id: string; email: string; username: string; role: AuthUser['roleName'] };
}
/** 409 body when one email+password matches more than one organisation. */
export interface SelectOrgError {
  error: string;
  code: 'SELECT_ORG';
  organisations: { slug: string; name: string }[];
}
export interface TokenPair { accessToken: string; refreshToken: string }

/** Decoded access-token payload (HS256, signed by transvigo-be). */
export interface AccessTokenPayload {
  sub: string; orgId: string; roleId: string;
  roleName: AuthUser['roleName']; type: 'access'; exp: number; iat: number;
}

// ── Pagination ──
// NOTE: the backend returns `{ data, pagination: { page, pageSize, total, pageCount } }`.
// The API client normalises that into this `meta` shape (totalPages = pageCount).
export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; pageSize: number; totalPages: number };
}

// ── Organisation ──
export interface Organisation {
  id: string; name: string; slug: string;
  plan: string; isActive: boolean; settings: Record<string, unknown>;
  createdAt: string; updatedAt: string;
}

// ── Role & Permissions ──
export interface Role {
  id: string; orgId: string; name: string;
  isSystem: boolean; createdAt: string;
  _count?: { users: number };
}
export interface RolePermission {
  id: string; orgId: string; roleId: string; module: string;
  canCreate: boolean; canRead: boolean; canUpdate: boolean; canDelete: boolean;
}
export type ModuleSlug =
  | 'trips' | 'vehicles' | 'drivers' | 'staff' | 'load-providers'
  | 'transactions' | 'fuel-stations' | 'fuel-logs' | 'garages'
  | 'garage-logs' | 'tyre-logs' | 'toll-logs' | 'activity-logs'
  | 'cities' | 'users'
  // Operations & Maintenance System
  | 'tickets' | 'job-cards' | 'spare-parts' | 'spare-vendors'
  | 'spare-inventory' | 'service-schedules' | 'tyre-management' | 'invoices'
  | 'trip-bills';
export type PermissionAction = 'canCreate' | 'canRead' | 'canUpdate' | 'canDelete';

export interface OrgUser {
  id: string; email: string; username: string; roleId: string;
  isActive: boolean; mustChangePwd?: boolean; lastLoginAt?: string | null;
  createdAt: string; role?: { name: string };
}

// ── City ──
export interface City {
  id: string; orgId: string; name: string; cityCode: string;
  state: string; stateCode: string; country: string; countryISOCode: string;
  createdAt: string; updatedAt: string;
}
export interface CreateCityBody {
  name: string; cityCode: string; state: string; stateCode: string;
  country?: string; countryISOCode?: string;
}

// ── Vehicle ──
export type VehicleStatus = 'idle' | 'assigned' | 'in_transit';
export type VehicleAxleType = 'single' | 'multi';
export interface Vehicle {
  id: string; orgId: string;
  vehicleNumber: string; model?: string; type: string;
  currentStatus: VehicleStatus; isActive?: boolean;
  engineNumber: string; chassisNumber: string;
  axleType: VehicleAxleType; odometerReading: number;
  registrationDate: string; fitnessDate: string; insuranceDate: string;
  taxDueDate: string; permitDate: string; puccDate: string; npValidUpto: string;
  currentDriverId?: string | null;
  currentDriver?: { id: string; fullName: string } | null;
  createdAt: string; updatedAt: string; createdBy?: string; updatedBy?: string;
}
export interface CreateVehicleBody {
  vehicleNumber: string; model?: string; type?: string;
  axleType: VehicleAxleType; engineNumber: string; chassisNumber: string;
  odometerReading?: number; isActive?: boolean;
  registrationDate: string; fitnessDate: string; insuranceDate: string;
  taxDueDate: string; permitDate: string; puccDate: string; npValidUpto: string;
  currentDriverId?: string | null;
}

// ── Driver ──
export type DriverStatus = 'available' | 'assigned' | 'in_transit';
export type AccountType = 'savings' | 'current' | 'salary' | 'fixed_deposit' | 'recurring_deposit';
export interface Driver {
  id: string; orgId: string; userId?: string;
  fullName: string; countryDialCode: string; contactNumber: string;
  emgCountryDialCode: string; emgContactNumber?: string | null;
  aadhaarNumber?: string | null; panNumber?: string | null;
  address?: string | null; reference?: string | null;
  currentStatus: DriverStatus; drivingLicenceNumber?: string | null;
  accountHolderName?: string | null; accountNumber?: string | null;
  branchName?: string | null; ifscCode?: string | null; accountType?: AccountType | null;
  /** The vehicle(s) that belong to this driver. */
  assignedVehicles?: Array<{ id: string; vehicleNumber: string; currentStatus?: string }>;
  createdAt: string; updatedAt: string;
}
/** Only the name and the phone number are required; everything else can be added later. */
export interface CreateDriverBody {
  fullName: string; countryDialCode?: string; contactNumber: string;
  emgCountryDialCode?: string; emgContactNumber?: string;
  aadhaarNumber?: string; panNumber?: string; address?: string; reference?: string;
  drivingLicenceNumber?: string; accountHolderName?: string; accountNumber?: string;
  branchName?: string; ifscCode?: string; accountType?: AccountType; userId?: string;
  /** Assign this vehicle to the new driver. */
  vehicleId?: string;
}

// ── Staff ──
export interface Staff {
  id: string; orgId: string; userId?: string;
  fullName: string; countryDialCode: string; contactNumber: string;
  createdAt: string; updatedAt: string;
}
export interface CreateStaffBody {
  fullName: string; countryDialCode?: string; contactNumber: string; userId?: string;
}

// ── Load Provider ──
export interface LoadProvider {
  id: string; orgId: string; cityId?: string;
  name: string; shortName?: string; vendorCode: string;
  countryDialCode: string; contactNumber: string; isActive: boolean;
  /** Whether GST / TDS apply to this company's bills. */
  gstApplicable?: boolean; tdsApplicable?: boolean; gstRate?: number | string;
  /** Late-delivery penalty in rupees per hour beyond the TAT. */
  penaltyPerHour?: number | string;
  city?: City; createdAt: string; updatedAt: string;
}
export interface CreateLoadProviderBody {
  gstApplicable?: boolean; tdsApplicable?: boolean; gstRate?: number; penaltyPerHour?: number;
  name: string; shortName?: string; countryDialCode?: string;
  contactNumber: string; isActive?: boolean; cityId?: string;
  /** Optional: your own vendor code. Left out, one is generated (LP-0001). */
  vendorCode?: string;
}

// ── Trip ──
export type TripStatus = 'created' | 'in_transit' | 'completed';
export interface TouchingLocation {
  id: string; tripId: string; name?: string; sequence: number; inTime?: string | null; outTime?: string | null;
  /** What the driver captured when reaching ('in') and leaving ('out'): GPS and the stamped trip sheet photo. */
  inLatitude?: number | null; inLongitude?: number | null; outLatitude?: number | null; outLongitude?: number | null;
  inSheetPhotoUrl?: string | null; outSheetPhotoUrl?: string | null;
}
export type ApprovalState = 'approved' | 'pending' | 'needs_changes';
export interface Trip {
  id: string; orgId: string; tripNumber: string;
  startPoint: string; endPoint: string;
  startPointCoords?: Record<string, unknown>; endPointCoords?: Record<string, unknown>;
  estimatedStartTime: string; estimatedEndTime: string; actualEndTime?: string; actualStartTime?: string | null;
  totalTripTimeMinutes: number; totalTripDistanceKm: number;
  currentStatus: TripStatus;
  /** Driver-created / driver-closed trips wait for operations (see approval states). */
  createdByDriver?: boolean; startApproval?: ApprovalState; closeApproval?: ApprovalState; approvalNote?: string | null;
  startOdometer?: number | null; endOdometer?: number | null;
  startOdometerPhotoUrl?: string | null; endOdometerPhotoUrl?: string | null; tripSheetPhotoUrl?: string | null; arrivalReportUrl?: string | null;
  /** Minutes at touching points, minutes over the TAT after halts, and the resulting penalty (rupees). */
  haltMinutes?: number; delayMinutes?: number; penaltyPerHour?: number | string | null; penaltyAmount?: number;
  freightTotalAmount: number; advanceAmount: number;
  vendorCode?: string; vendorName?: string;
  isTouchingLocationAvailable: boolean; touchingLocations?: TouchingLocation[];
  driverId?: string; vehicleId?: string; loadProviderId?: string;
  driver?: Driver; vehicle?: Vehicle; loadProvider?: LoadProvider;
  transactions?: Transaction[]; fuelLogs?: FuelLog[];
  createdAt: string; updatedAt: string;
  createdBy?: string; updatedBy?: string;
  createdByUser?: { id: string; username: string } | null;
  updatedByUser?: { id: string; username: string } | null;
}
export interface CreateTripBody {
  startPoint: string; endPoint: string;
  startPointCoords?: object; endPointCoords?: object;
  estimatedStartTime: string; estimatedEndTime: string;
  totalTripTimeMinutes: number; totalTripDistanceKm: number;
  freightTotalAmount: number; advanceAmount?: number;
  vendorCode?: string; vendorName?: string;
  driverId?: string; vehicleId?: string; loadProviderId?: string;
  isTouchingLocationAvailable?: boolean;
  touchingLocations?: Array<{ name?: string; sequence: number; inTime?: string | null; outTime?: string | null }>;
  /** Editable by operations on a running / closed trip. */
  actualStartTime?: string | null; actualEndTime?: string | null;
}

// ── Transaction ──
export type TransactionType = 'debit' | 'credit';
export type TxnTowards = 'fuel' | 'driver_advance' | 'extra_advance' | 'incentives' | 'food' | 'challan' | 'maintenance';
export type TransactionStatus = 'pending' | 'success' | 'failed';
export type PaymentMethod = 'wallet' | 'upi' | 'cash' | 'card' | 'netbanking' | 'bank_transfer';
export interface Transaction {
  id: string; orgId: string; tripId?: string; transactionRef: string;
  type: TransactionType; txnTowards: TxnTowards;
  amount: number; description: string;
  transactionStatus: TransactionStatus; currency: string;
  method?: PaymentMethod;
  transactionFrom: Record<string, unknown>; transactionTo: Record<string, unknown>;
  isTxnAddedManually: boolean; trip?: Trip;
  createdAt: string; updatedAt: string;
}
export interface CreateTransactionBody {
  type: TransactionType; txnTowards: TxnTowards;
  amount: number; description: string;
  transactionStatus?: TransactionStatus; method?: PaymentMethod;
  transactionFrom: object; transactionTo: object;
  isTxnAddedManually: boolean; tripId?: string; currency?: string;
}

// ── Fuel Station ──
export interface FuelStation {
  id: string; orgId: string; cityId?: string;
  name: string; vendorCode?: string; isActive: boolean; city?: City;
  createdAt: string; updatedAt: string;
}
export interface CreateFuelStationBody { name: string; isActive?: boolean; cityId?: string }

// ── Fuel Log ──
export type FuelType = 'diesel' | 'petrol' | 'gas';
export interface FuelLog {
  id: string; orgId: string;
  vehicleId?: string; tripId?: string; fuelStationId?: string;
  date: string; fuelQuantityLtr: number; fuelType: FuelType; rate: number; amount: number;
  vehicle?: Vehicle; trip?: Trip; fuelStation?: FuelStation;
  createdAt: string; updatedAt: string;
}
export interface CreateFuelLogBody {
  date: string; fuelQuantityLtr: number; fuelType: FuelType; rate: number; amount: number;
  vehicleId?: string; tripId?: string; fuelStationId?: string;
}

// ── Garage ──
export interface Garage {
  id: string; orgId: string; cityId?: string;
  name: string; vendorCode: string; contactPerson?: string; contactNumber?: string; notes?: string;
  isActive: boolean; city?: City;
  createdAt: string; updatedAt: string;
}
export interface CreateGarageBody {
  name: string; isActive?: boolean; cityId?: string;
  /** Optional: your own vendor code. Left out, one is generated (WS-0001). */
  vendorCode?: string; contactPerson?: string; contactNumber?: string; notes?: string;
}

// ── Garage Log ──
export interface GarageLog {
  id: string; orgId: string; vehicleId?: string; garageId?: string;
  invoiceDate: string; particular: string;
  invoiceRaisedAmount: number; invoicePassedAmount: number; invoiceUrl?: string;
  vehicle?: Vehicle; garage?: Garage; createdAt: string; updatedAt: string;
}
export interface CreateGarageLogBody {
  invoiceDate: string; particular: string;
  invoiceRaisedAmount?: number; invoicePassedAmount?: number;
  vehicleId?: string; garageId?: string;
}

// ── Tyre Log ──
export type TyrePosition = 'front' | 'drive' | 'trailer';
export interface TyreLog {
  id: string; orgId: string; vehicleId?: string;
  tyreNumber: string; fitmentDate: string; fitmentKm: number;
  brand: string; tyrePosition: TyrePosition;
  removalTyreNumber?: string; removalKm?: number; removalReason?: string;
  vehicle?: Vehicle; createdAt: string; updatedAt: string;
}
export interface CreateTyreLogBody {
  tyreNumber: string; fitmentDate: string; fitmentKm?: number;
  brand: string; tyrePosition: TyrePosition;
  removalTyreNumber?: string; removalKm?: number; removalReason?: string;
  vehicleId?: string;
}

// ── Toll Log ──
export interface TollLog {
  id: string; orgId: string; tripId?: string; vehicleId?: string;
  totalTollAmount: number; numberOfTollCrosses: number;
  trip?: Trip; vehicle?: Vehicle; createdAt: string; updatedAt: string;
}
export interface CreateTollLogBody {
  totalTollAmount?: number; numberOfTollCrosses?: number;
  tripId?: string; vehicleId?: string;
}

// ── Tickets (Operations Hub) ──
export type TicketStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'closed';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type TicketIssueType =
  | 'breakdown' | 'accident' | 'tyre_puncture' | 'engine_issue' | 'electrical_issue'
  | 'brake_issue' | 'service_due' | 'driver_complaint' | 'other';

export interface TicketHistoryEntry {
  id: string;
  action: string;
  fromStatus: TicketStatus | null;
  toStatus: TicketStatus | null;
  note: string | null;
  createdAt: string;
  performedByUser?: { id: string; username: string } | null;
}
/** One message in the conversation between the driver and the office on a ticket. */
export interface TicketMessage { id: string; body: string; createdAt: string; fromDriver: boolean; senderName: string }

export interface Ticket {
  id: string;
  ticketNumber: string;
  vehicleId?: string | null;
  driverId?: string | null;
  tripId?: string | null;
  issueType: TicketIssueType;
  priority: TicketPriority;
  status: TicketStatus;
  title: string;
  description: string;
  location?: string | null;
  allottedTimeHours: number;
  ticketDate?: string | null;
  openedAt: string;
  /** A driver's report must be acknowledged by this time (30 / 60 / 120 / 180 minutes by priority). Not set for tickets the office raised. */
  ackSlaDueAt?: string | null;
  ackOnTime?: boolean | null;
  acknowledgedAt?: string | null;
  inProgressAt?: string | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  isResolvedOnTime?: boolean | null;
  assignedTo?: string | null;
  resolution?: string | null;
  photoUrl?: string | null;
  linkedJobCardId?: string | null;
  createdAt: string;
  vehicle?: { id: string; vehicleNumber: string } | null;
  driver?: { id: string; fullName: string } | null;
  assignedToUser?: { id: string; username: string } | null;
  acknowledgedByUser?: { id: string; username: string } | null;
  resolvedByUser?: { id: string; username: string } | null;
  history?: TicketHistoryEntry[];
  _count?: { history: number };
}
export interface CreateTicketBody {
  vehicleId?: string;
  driverId?: string;
  tripId?: string;
  issueType: TicketIssueType;
  priority: TicketPriority;
  title: string;
  description: string;
  location?: string;
  ticketDate?: string | null;
  assignedTo?: string | null;
}

// ── Activity Log ──
export type ActionType = 'CREATE' | 'UPDATE' | 'DELETE';
export interface ActivityLog {
  id: string; orgId: string; action: ActionType; collection: string;
  recordId: string; entityDocumentId?: string;
  changes: Record<string, { before: unknown; after: unknown }>;
  note: string; performedBy?: string;
  performedByUser?: { id: string; username: string; email: string };
  createdAt: string;
}

// ── Dashboard (aggregated client-side) ──
export interface DashboardStats {
  activeTrips: number; tripsCompletingToday: number;
  vehiclesOnRoad: number; totalVehicles: number;
  revenueMtd: number; revenueLastMonth: number;
  pendingAdvances: number; pendingTripsCount: number;
}
export interface TripActivityPoint { date: string; tripsStarted: number; tripsCompleted: number }
export interface ExpenseBreakdown { txnTowards: TxnTowards; total: number; count: number }
export interface ComplianceAlert {
  vehicleId: string; vehicleNumber: string;
  documentType: string; expiryDate: string; daysLeft: number;
}

// ── Query params ──
export interface PaginationParams { page?: number; pageSize?: number }
export interface TripFilters extends PaginationParams {
  status?: TripStatus; driverId?: string; vehicleId?: string;
  loadProviderId?: string; dateFrom?: string; dateTo?: string; search?: string;
}
export interface TransactionFilters extends PaginationParams {
  type?: TransactionType; txnTowards?: TxnTowards;
  transactionStatus?: TransactionStatus; tripId?: string;
  dateFrom?: string; dateTo?: string;
}
export interface ActivityLogFilters extends PaginationParams {
  action?: ActionType; collection?: string; performedBy?: string;
  dateFrom?: string; dateTo?: string;
}
export interface VehicleFilters extends PaginationParams {
  currentStatus?: VehicleStatus; isActive?: boolean; search?: string;
}
export interface DriverFilters extends PaginationParams { currentStatus?: DriverStatus; search?: string }

// ── Job Cards (Workshop) ──────────────────────────────────────────────
export type JobCardStatus = 'open' | 'in_progress' | 'quality_check' | 'closed' | 'cancelled';

export interface JobCard {
  id: string;
  jobCardNumber: string;
  status: JobCardStatus;
  vehicleId: string;
  vehicle?: { id: string; vehicleNumber: string } | null;
  driver?: { id: string; fullName: string } | null;
  supervisor?: { id: string; username: string } | null;
  garage?: { id: string; name: string } | null;
  entryOdometer: number;
  entryOdometerPhotoUrl?: string | null;
  exitOdometer?: number | null;
  driverComplaint: string;
  diagnosis?: string | null;
  workDone?: string | null;
  jobCardDate?: string | null;
  entryTime: string;
  closedTime?: string | null;
  isLoadReady: boolean;
  /** Driver maintenance reports: the priority the driver picked, and the reply lifecycle (the SLA is measured to acknowledgement). */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  source?: 'ops' | 'driver_report';
  responseStatus?: 'pending' | 'acknowledged' | 'resolved';
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  sla?: { dueAt: string; status: 'on_track' | 'at_risk' | 'breached' | 'met' | 'missed'; minutesLeft: number | null } | null;
  linkedTicketId?: string | null;
  totalPartsCost: string | number;
  totalLabourCost: string | number;
  totalJobCost: string | number;
  _count?: { spareIssueSlips: number; messages?: number };
  createdAt: string;
}

export interface CreateJobCardBody {
  jobCardNumber: string;
  jobCardDate?: string | null;
  vehicleId: string;
  driverId?: string | null;
  entryOdometer?: number;
  driverComplaint: string;
  linkedTicketId?: string | null;
  garageId?: string | null;
  supervisorId?: string | null;
}

export interface JobCardFilters extends PaginationParams {
  status?: JobCardStatus; vehicleId?: string; garageId?: string; search?: string;
}

// ── Spare Parts (Inventory) ───────────────────────────────────────────
export interface SparePartUsage {
  id: string;
  partName: string;
  qtyIssued: string | number;
  unitCost: string | number;
  totalCost: string | number;
  slip?: {
    id: string;
    slipNumber: string;
    issuedAt: string;
    vehicle?: { id: string; vehicleNumber: string } | null;
    jobCard?: { id: string; jobCardNumber: string } | null;
  } | null;
}
export interface SparePart {
  id: string;
  partNumber: string;
  partName: string;
  category: string;
  unitOfMeasure: string;
  currentStockQty: string | number;
  reorderLevel: string | number;
  unitCost: string | number;
  totalStockValue: string | number;
  isActive: boolean;
  createdAt: string;
  /** The spare parts vendor this part is bought from. */
  vendor?: { id: string; vendorName: string; vendorCode: string } | null;
  vendorId?: string | null;
  /** Populated only by the get-by-id (detail) endpoint. */
  usages?: SparePartUsage[];
}
export interface CreateSparePartBody {
  vendorId?: string | null;
  partNumber: string;
  partName: string;
  category: string;
  unitOfMeasure?: string;
  currentStockQty?: number;
  reorderLevel?: number;
  unitCost?: number;
}
export interface StockAdjustmentBody {
  adjustmentType: 'add' | 'remove';
  qty: number;
  reason: string;
}

// ── Tyre Hub (Lifecycle) ──────────────────────────────────────────────
export type TyreStatus = 'in_stock' | 'in_use' | 'scrapped' | 'retreading';
export type TyreType = 'new_tyre' | 'retread';
export type TyreMovementType =
  | 'fitted' | 'removed' | 'scrapped' | 'sent_for_retread'
  | 'returned_from_retread' | 'returned_to_stock';

export interface Tyre {
  id: string;
  serialNumber: string;
  brand: string;
  size: string;
  tyreType: TyreType;
  currentStatus: TyreStatus;
  currentVehicleId?: string | null;
  currentVehicle?: { id: string; vehicleNumber: string } | null;
  currentPosition?: string | null;
  totalKmRun: number;
  expectedLifeKm: number;
  healthPct: number;
  fittedInOdometer?: number | null;
  removedAtOdometer?: number | null;
  purchaseCost?: string | number | null;
  notes?: string | null;
  /** The tyre hub vendor it was bought from. */
  vendor?: { id: string; name: string; vendorCode: string } | null;
  vendorId?: string | null;
  createdAt: string;
}
export interface CreateTyreBody {
  vendorId?: string | null;
  serialNumber: string;
  brand: string;
  size: string;
  tyreType?: TyreType;
  purchaseCost?: number | null;
  expectedLifeKm?: number;
}
export interface CreateTyreMovementBody {
  movementType: TyreMovementType;
  vehicleId?: string | null;
  position?: string | null;
  odometerAtEvent?: number;
  notes?: string | null;
}

// ── Supplier Invoice ──────────────────────────────────────────────────
export type InvoicePaymentStatus = 'on_credit' | 'fully_paid';
export interface SupplierInvoice {
  id: string;
  refNumber: string;
  invoiceNumber: string;
  vendorId?: string | null;
  vendor?: { id: string; vendorName: string } | null;
  /** The billing vendor (spare parts vendor or garage) with its code. */
  supplier?: { id: string; type: 'spare_parts' | 'garage'; name: string; vendorCode: string } | null;
  paymentMode?: 'cash' | 'credit';
  billRaisedAmount?: number;
  billPaidAmount?: number;
  settlement?: 'paid' | 'pending';
  vehicleId?: string | null;
  vehicle?: { id: string; vehicleNumber: string } | null;
  jobCardId?: string | null;
  jobCard?: { id: string; jobCardNumber: string } | null;
  totalAmount: string | number;
  paymentStatus: InvoicePaymentStatus;
  photoUrl?: string | null;
  invoiceDate?: string | null;
  notes?: string | null;
  createdAt: string;
}
export interface CreateInvoiceBody {
  invoiceNumber: string;
  vehicleId?: string | null;
  jobCardId?: string | null;
  vendorId?: string | null;
  totalAmount?: number;
  paymentStatus?: InvoicePaymentStatus;
  paymentMode?: 'cash' | 'credit';
  paidAmount?: number;
  invoiceDate?: string | null;
  notes?: string | null;
}

// ── Spare-part issue slip (free-text line items) ──────────────────────
export interface SpareIssueSlipItem {
  id: string;
  partName: string;
  partId?: string | null;
  qtyIssued: string | number;
  unitCost: string | number;
  totalCost: string | number;
}
export interface SpareIssueSlip {
  id: string;
  slipNumber: string;
  vehicleId: string;
  vehicle?: { id: string; vehicleNumber: string } | null;
  jobCardId?: string | null;
  jobCard?: { id: string; jobCardNumber: string } | null;
  vendorId?: string | null;
  vendor?: { id: string; vendorName: string } | null;
  garageId?: string | null;
  garage?: { id: string; name: string } | null;
  totalSlipValue: string | number;
  notes?: string | null;
  items: SpareIssueSlipItem[];
  issuedAt: string;
}
export interface CreateIssueSlipItemBody {
  partName: string;
  qtyIssued: number;
  unitCost?: number;
}
export interface CreateIssueSlipBody {
  vehicleId: string;
  jobCardId?: string | null;
  vendorId?: string | null;
  garageId?: string | null;
  notes?: string | null;
  items: CreateIssueSlipItemBody[];
}

// ── Payment tally (bills to companies) ──
export type TripBillStatus = 'pending' | 'partial' | 'paid';
export interface TripBill {
  id: string; tripId: string; invoiceNumber: string; billDate: string;
  tripStartDate: string | null; route: string; tripNumber: string; tripCloseDate: string | null;
  freight: number; advance: number; balance: number;
  tdsApplicable: boolean; tdsAmount: number;
  penaltyAmount: number; penaltyRemark: string | null;
  transferDate: string | null; rentPaidAmount: number; gstTransferDate: string | null;
  vehicleNumber: string | null; vendorId: string | null; vendorName: string | null; vendorCode: string | null;
  totalToPay: number; amountReceived: number; amountRemaining: number; status: TripBillStatus;
}
export interface TripBillSummary {
  bills: number; totalBilled: number; totalReceived: number; totalRemaining: number;
  pending: number; partial: number; paid: number;
}
export interface UpdateTripBillBody {
  invoiceNumber?: string; penaltyAmount?: number; penaltyRemark?: string | null;
  transferDate?: string | null; rentPaidAmount?: number; gstTransferDate?: string | null;
  tdsApplicable?: boolean;
}
