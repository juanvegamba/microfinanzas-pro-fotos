
export interface GpsPoint {
  lat: number;
  lng: number;
}

export type MaritalStatus = 'Soltero(a)' | 'Casado(a)' | 'Unido(a)' | 'Divorciado(a)' | 'Viudo(a)' | '';
export type HousingType = 'Propio' | 'Alquilado' | 'De Familiares' | 'De Terceros' | '';
export type BusinessLocationType = 'Fija' | 'Ambulante' | '';
export type BusinessSector = 'Comercio' | 'Servicios' | 'Producción' | 'Agricultura' | 'Ganadería';

// AUTH & USER TYPES
export type UserRole = 'admin' | 'regional' | 'jefe_agencia' | 'usuario';
export type UserStatus = 'activo' | 'pendiente' | 'bloqueado';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  rol: UserRole;
  region: number; // 1-5
  agencia: number; // 1-20
  jefemail: string;
  status: UserStatus;
}

export interface ApplicationSummary {
  id: string;
  fullName: string;
  identityDocument: string;
  loanAmount: number;
  date: string;
  status: string;
  userId: string;
  userRegion: number;
  userAgency: number;
}

// Section 3 Enums
export type LoanDestination = 'Capital de Trabajo' | 'Activo Fijo' | 'Consolidación de Deudas' | 'Mejora de Vivienda/Negocio' | 'Otro' | '';
export type PaymentMethod = 'Cuota Fija (Nivelada)' | 'Sobre Saldos Decrecientes' | 'Al Vencimiento' | '';
export type CommissionType = 'Cobrada al Desembolso' | 'Financiada' | '';
export type SalesPeriod = 'Diaria' | 'Semanal' | 'Mensual' | '';
export type CreditExperience = 'Nuevo' | 'Externo' | 'Recurrente' | '';
export type MonthOption = 'Enero' | 'Febrero' | 'Marzo' | 'Abril' | 'Mayo' | 'Junio' | 'Julio' | 'Agosto' | 'Septiembre' | 'Octubre' | 'Noviembre' | 'Diciembre';

export interface DisbursementDetail {
  id: string;
  purpose: 'Capital de Trabajo' | 'Activo Fijo' | 'Pago de Deuda' | 'Otro' | '';
  type: 'Entrada de dinero' | 'Salida de Dinero' | '';
  amount: number | '';
  month: number; // 1-12 (relative to start)
}

export interface SalesProfile {
  amount: number | '';
  period: SalesPeriod;
  frequency: number | ''; // Veces al mes
}

export interface OtherExpense {
  id: string;
  description: string;
  amount: number | '';
}

export interface VariableItem {
  id: string;
  concept: string;
  type: 'Ingreso' | 'Gasto' | '';
  month: MonthOption;
  amount: number | '';
}

export interface ExistingDebt {
  id: string;
  creditor: string;
  originalAmount: number | '';
  currentBalance: number | '';
  monthlyQuota: number | '';
  type: 'Del Negocio' | 'De la Casa/Familia' | '';
  consolidate?: boolean;
}

// --- SECTION 4 TYPES ---
export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stockQty: number | '';
  purchasePrice: number | '';
  salePrice: number | '';
  purchaseQty: number | '';
  purchaseFrequency: number | '';
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
}

export interface RealEstateAsset {
  id: string;
  description: string;
  location: string;
  estimatedValue: number | '';
  landArea: number | '';
  builtArea: number | '';
  registryNumber: string;
}

export interface VehicleAsset {
  id: string;
  description: string;
  year: number | '';
  estimatedValue: number | '';
  plateNumber: string;
}

export interface OtherAsset {
  id: string;
  description: string;
  estimatedValue: number | '';
  registryNumber: string;
}

// --- SECTION 5 TYPES ---
export type RealGuaranteeType = 'Hipotecaria' | 'Prendaria (Vehículo)' | 'Prendaria (Maquinaria)' | 'Otros' | '';
export type PaymentBehavior = 'Bueno' | 'Regular' | 'Malo' | '';

export interface RealGuarantee {
  id: string;
  type: RealGuaranteeType;
  estimatedValue: number | '';
  quickSaleValue: number | '';
  description: string;
  status: string;
  registryNumber: string;
  vehicleYear: number | '';
  constructionArea: number | '';
  landArea: number | '';
  comments: string;
}

export interface FiduciaryGuarantee {
  id: string;
  name: string;
  dpi: string;
  phone: string;
  occupation: string;
  income: number | '';
  assets: number | '';
  debts: number | '';
  paymentBehavior: PaymentBehavior;
  estimatedNetWorth: number | '';
  address: string;
  comments: string;
}

// --- SECTION 6 TYPES ---
export type ReferenceStatus = 'Buena' | 'Regular' | 'Mala' | '';

export interface PersonalReference {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  status: ReferenceStatus;
  comments: string;
}

// --- SECTION 7 TYPES ---
export type PhotoCategory = 
  | 'Negocio/Inventario/Activos' 
  | 'Vivienda' 
  | 'Garantías' 
  | 'Vías de Acceso' 
  | 'Otros';

export interface ClientPhoto {
  id: string;
  url: string; // Firebase Storage URL
  category: PhotoCategory;
  comment: string;
  timestamp: string;
  gps: GpsPoint | null;
}

export interface DocumentChecklist {
  identityCard: boolean;
  spouseIdentityCard: boolean;
  utilityBill: boolean;
  recentInvoices: boolean;
  salesNotebook: boolean;
  propertyTitle: boolean;
  taxId: boolean;
  otherDocumentsDesc: string;
}

// --- SECTION 8 TYPES ---
export interface SupervisionData {
  supervisorName: string;
  visitDate: string;
  visitTime: string;
  visitPlace: string;
  visitGps: GpsPoint | null;

  salesEvolution: 'Aumentaron' | 'Estables' | 'Disminuyeron' | '';
  inventoryLevel: 'Alto/Lleno' | 'Medio' | 'Bajo/Escaso' | 'Obsoleto' | '';
  businessOwnership: 'Del solicitante' | 'De otra persona' | 'No se pudo identificar' | '';

  willingnessToPay: 'Buena' | 'Regular' | 'Mala' | '';
  guaranteeStatus: 'Bueno' | 'Regular' | 'Malo' | '';
  guaranteeComment: string;
  riskLevel: 'Bajo' | 'Medio' | 'Alto' | '';

  weeklySales: number | '';
  weeklyCosts: number | '';
  weeklyFamilyExpenses: number | '';

  loanUseCheck: 'SI' | 'NO' | 'No Aplicable' | '';
  investmentStatus: 'Bueno' | 'Regular' | 'Malo' | '';
  evidenceDescription: string;

  photos: ClientPhoto[];

  conclusion: string;
  visitVerification?: string;
  crossInfoValidation?: string;
  capacityValidation?: string;
}

// --- SECTION 9 TYPES ---
export interface ReviewData {
  debtReasonabilityAnalysis: string;
  sixCsAnalysis: string;

  officerRisks: string;
  officerOpportunities: string;
  officerMitigation: string;
  officerRecommendations: string;

  commentsOfficial: string;
  commentsAgencyManager: string;
  commentsSupervisor: string;

  committeeDecision: 'Aprobado' | 'Aprobado con modificaciones' | 'Postergado' | 'Rechazado' | '';
  committeeComments: string;
  
  approvedAmount: number | '';
  approvedDestination: string;
  approvedPaymentMethod: string;
  approvedInterestRate: number | '';
  approvedTerm: number | '';
  approvedCommission: number | '';
  approvedGuaranteeDescription: string;
  approvedSpecialConditions: string;
  
  approverNames: string;
  approvalDate: string;
  reviewGps: GpsPoint | null;
}

export interface ClientData {
  // --- SECTION 1: DATOS ---
  officialName: string;
  branch: string;
  operationNumber: string;

  fullName: string;
  identityDocument: string;
  dateOfBirth: string;
  age: number | '';
  maritalStatus: MaritalStatus;
  dependents: number | '';
  spouseName: string;
  spouseOccupation: string;
  housingType: HousingType;
  yearsInHousing: number | '';
  businessPremiseType: HousingType;

  businessName: string;
  businessType: string;
  businessSectors: BusinessSector[];
  yearsInBusiness: number | '';
  monthlyPaymentCapacity: number | '';

  homeAddress: string;
  businessAddress: string;
  locationType: BusinessLocationType;
  gpsCoordinates: { lat: number; lng: number } | null; // Legacy field
  homeGps: GpsPoint | null;
  businessGps: GpsPoint | null;
  contactName: string;
  contactPhone: string;

  // --- SECTION 2: EMPRESA ---
  businessOrigin: string;
  recentProfitsUse: string;
  reinvestedAmount: number | '';

  clientRisks: string;
  mitigationMeasures: string;
  businessOpportunities: string;

  diversificationScore: number;
  profitabilityKnowledgeScore: number;
  operationsManagementScore: number;
  investmentPlanQualityScore: number;
  successionPlanningScore: number;

  fixedAssetsValue: number | '';
  inventoryValue: number | '';
  yearCreated: number | '';
  yearFormalized: number | '';

  employeesFullTime: number | '';
  employeesPartTime: number | '';
  employeesFullTimeLastYear: number | '';
  employeesPartTimeLastYear: number | '';
  familyEmployees: number | '';
  
  salesGrowth: number | '';
  socialEnvGoals: string;

  businessObservations: string;

  // --- SECTION 3: CAPACIDAD ---
  loanAmount: number | '';
  loanDestination: LoanDestination;
  loanDestinationDetail: string;
  loanTerm: number | '';
  loanInterestRate: number | '';
  loanPaymentMethod: PaymentMethod;
  loanCommission: number | '';
  loanCommissionFinancing: CommissionType;

  disbursementPlan: DisbursementDetail[];

  salesGood: SalesProfile;
  salesRegular: SalesProfile;
  salesBad: SalesProfile;

  lowSalesMonths: string[];
  lowSalesReduction: number | '';
  highSalesMonths: string[];
  highSalesIncrease: number | '';
  salesCreditPercentage: number | '';
  salesCreditTerm: number | '';

  costOfGoodsSold: number | '';
  expensesEmployees: number | '';
  expensesRent: number | '';
  expensesUtilities: number | '';
  expensesTransport: number | '';
  expensesMaintenance: number | '';
  otherBusinessExpenses: OtherExpense[];

  variableItems: VariableItem[];

  familyIncome: number | '';
  familyFood: number | '';
  familyTransport: number | '';
  familyEducation: number | '';
  familyUtilities: number | '';
  familyComms: number | '';
  familyHealth: number | '';
  familyOther: number | '';

  plannedInvestment: number | '';
  existingDebts: ExistingDebt[];

  capacityObservations: string;
  creditExperience: CreditExperience;

  // --- SECTION 4: INVENTARIO ---
  inventory: InventoryItem[];
  suppliers: Supplier[];
  realEstateAssets: RealEstateAsset[];
  vehicleAssets: VehicleAsset[];
  otherAssets: OtherAsset[];

  // --- SECTION 5: GARANTIAS ---
  realGuarantees: RealGuarantee[];
  fiduciaryGuarantees: FiduciaryGuarantee[];
  guaranteeType?: string;
  guaranteeCoverage?: number | '';

  // --- SECTION 6: CARACTER ---
  characterRefScore: number;
  characterPayHistoryScore: number;
  characterInformalDebtsScore: number;
  characterTransparencyScore: number;
  personalReferences: PersonalReference[];
  characterObservations: string;

  // --- SECTION 7: FOTOS ---
  documents: DocumentChecklist;
  photos: ClientPhoto[];

  // --- SECTION 8: SUPERVISION ---
  supervision: SupervisionData;

  // --- SECTION 9: REVISION ---
  review: ReviewData;
}

export interface AppState {
  currentStep: number;
  clientData: ClientData;
}

export const SECTORS: BusinessSector[] = ['Comercio', 'Servicios', 'Producción', 'Agricultura', 'Ganadería'];

export const MONTHS: MonthOption[] = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];
