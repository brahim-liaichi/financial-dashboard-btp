export const safeString = (value: unknown, defaultValue = ''): string => {
  return typeof value === 'string' ? value : defaultValue;
};

export interface CommandeFilterValues {
  documentNumber?: string;
  articleNumber?: string;
  selectedProject?: string;
  status?: string;
}

export interface TopArticleData {
  numero_article: string;
  prix_vente: number;
  depenses_engagees: number;
}

// In types/index.ts , thi part unknown>; os uncertain, it could be any>;
export interface DashboardPreference {
  id?: number;
  user: number;
  layout: Record<string, unknown>;
  widgets: Record<string, unknown>;
}

export interface ProjectSummary extends SummaryMetrics {
  code_projet: string;
  start_date?: string;
  end_date?: string;
}

export const isValidArray = <T>(arr: unknown): arr is T[] =>
  Array.isArray(arr) && arr.length > 0;

// Dashboard-related types with enhanced type safety
export interface KPISummary {
  total_commandes: number;
  total_amount: number;
  avg_rentabilite: number;
}

export interface ExpenseDistributionItem {
  numero_article: string;
  total_expense: number;
  order_count: number;
  code_projet?: string;
}

export interface ProfitabilityAnalysisItem {
  numero_article: string;
  prix_vente_total: number;
  depenses_total: number;
  code_projet?: string;
}
//project types
export type ProjectType = 'FORFAIT' | 'METRE';

export interface Project {
  code: string;
  name: string;
  type?: ProjectType;
  description?: string;
}
// Delete Project
export interface DeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (projectCode: string) => void;
  projects: Project[];  // Change this from string[] to Project[]
}

export interface ProjectArticleMetrics {
  numero_article: string;
  code_projet: string;
  type_projet: ProjectType;   // Added type_projet
  depenses_engagees: number;
  depenses_facturees: number;
  reste_a_depenser: number;
  prix_vente: number;
  prix_vente_base?: number;  // Optional base price
  budget_chef_projet?: number;  // Optional budget
  budget_chef_projet_base?: number;  // Optional base budget
  fin_chantier: number;
  budget_percentage: number;
  depenses_engagees_reel: number;
  depenses_facturees_reel: number;
  fin_chantier_reel: number;
  rentabilite_reel: number;
  rentabilite: number;
}

export interface DashboardMetrics extends KPISummary {
  expense_distribution: ExpenseDistributionItem[];
  profitability_analysis: ProfitabilityAnalysisItem[];
  project_articles: ProjectArticleMetrics[];
}

// State management types
export interface PageState {
  loading: boolean;
  error: string | null;
}

// Type guards with enhanced validation
export const isDashboardMetrics = (metrics: unknown): metrics is DashboardMetrics => {
  return (
    typeof metrics === 'object' &&
    metrics !== null &&
    'total_commandes' in metrics &&
    'total_amount' in metrics &&
    'avg_rentabilite' in metrics &&
    Array.isArray((metrics as DashboardMetrics).expense_distribution) &&
    Array.isArray((metrics as DashboardMetrics).profitability_analysis) &&
    Array.isArray((metrics as DashboardMetrics).project_articles)
  );
};

export const isProjectArticleMetrics = (item: unknown): item is ProjectArticleMetrics => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'numero_article' in item &&
    'code_projet' in item &&
    'type_projet' in item &&  // Added type_projet check
    typeof (item as ProjectArticleMetrics).numero_article === 'string' &&
    typeof (item as ProjectArticleMetrics).code_projet === 'string' &&
    typeof (item as ProjectArticleMetrics).type_projet === 'string' &&  // Added type_projet validation
    typeof (item as ProjectArticleMetrics).depenses_engagees === 'number' &&
    typeof (item as ProjectArticleMetrics).depenses_facturees === 'number'
  );
};

export const isExpenseDistributionItem = (item: unknown): item is ExpenseDistributionItem => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'numero_article' in item &&
    'total_expense' in item &&
    'order_count' in item &&
    typeof (item as ExpenseDistributionItem).numero_article === 'string' &&
    typeof (item as ExpenseDistributionItem).total_expense === 'number' &&
    typeof (item as ExpenseDistributionItem).order_count === 'number'
  );
};

export const isProfitabilityAnalysisItem = (item: unknown): item is ProfitabilityAnalysisItem => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'numero_article' in item &&
    'prix_vente_total' in item &&
    'depenses_total' in item &&
    typeof (item as ProfitabilityAnalysisItem).numero_article === 'string' &&
    typeof (item as ProfitabilityAnalysisItem).prix_vente_total === 'number' &&
    typeof (item as ProfitabilityAnalysisItem).depenses_total === 'number'
  );
};

// Command (Order) related types
export interface Commande {
  id?: number;
  numero_document: string;
  annule: string;
  statut_document: string;
  date_enregistrement: string;
  date_echeance: string;
  code_fournisseur: string;
  nom_fournisseur: string;
  numero_article: string;
  description_article: string;
  quantite: number;
  quantite_livree: number;
  quantite_en_cours: number;
  prix: number;
  devise_prix: string;
  cours_change: number;
  total_lignes: number;
  code_projet: string;  // We'll keep this as the main project identifier
  // Optional fields from backend
  created_at?: string;
  updated_at?: string;
  total_lignes_formatted?: string;
  status_display?: string;
}

// Expense Control related types
export interface ControleDepense {
  numero_article: string;
  code_projet: string;
  type_projet: ProjectType;
  prix_vente: number | null;
  prix_vente_base: number | null;  // New field
  budget_chef_projet: number | null;
  budget_chef_projet_base: number | null;  // New field
  fiabilite: 'E' | 'C' | 'M' | null;
  date_enregistrement?: string;

}

// Enhanced metrics interface with required fields for calculations
export interface ControleMetrics {
  date?: string;
  numero_article: string;
  code_projet: string;
  type_projet: ProjectType;   // Added type_projet
  prix_vente: number | null;
  prix_vente_base: number | null;  // New field
  budget_chef_projet: number | null;
  budget_chef_projet_base: number | null;  // New field
  depenses_engagees: number;
  depenses_facturees: number;
  reste_a_depenser: number | null;
  depenses_engagees_reel: number;
  depenses_facturees_reel: number;
  fiabilite: string | null;
  fin_chantier: number | null;
  rentabilite: number;
  rapport: number;
  rapport_aterrissage: number;
  status: 'Profitable' | 'Break-even' | 'Loss' | 'Undefined';
  total_commandes?: number;
  total_depenses_engagees?: number;
  total_depenses_facturees?: number;
  [key: string]: unknown;
}



// Input type for updates
export interface ControleUpdateInput {
  numero_article: string;
  code_projet?: string;
  type_projet?: ProjectType;   // Added type_projet
  prix_vente?: number | null;
  prix_vente_base?: number | null;  // New fieldFact
  budget_chef_projet?: number | null;
  budget_chef_projet_base?: number | null;  // New field
  reste_a_depenser?: number | null;
  fiabilite?: 'E' | 'C' | 'M' | null;
}

// Group key type for aggregation
export type ControleGroupKey = `${string}-${string}`;

// Summary metrics type
// Summary metrics type - Updated to match useControle.ts usage
interface SummaryMetrics {
  totalDepensesEngagees: number;
  totalDepensesEngagees_reel: number;
  totalDepensesFacturees: number;
  totalDepensesFacturees_reel: number;
  averageRentabilite: number;
  averageRentabilite_reel: number;
  totalCommandes: number;
}

// Filter parameters
export interface FilterParams {
  code_projet?: string;
  numero_article?: string;
  type_projet?: ProjectType | '';
  min_rentabilite?: number;
  max_rentabilite?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

// API response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// In types/index.ts
export interface AggregatedControleMetrics extends ControleMetrics {
  total_commandes: number;
  total_depenses_engagees: number;
  total_depenses_engagees_reel: number;
  total_depenses_facturees: number;
  total_depenses_facturees_reel: number;
}


// Type guards for runtime checks
export const isControleMetrics = (item: unknown): item is ControleMetrics => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'numero_article' in item &&
    'code_projet' in item &&
    'type_projet' in item &&  // Added type_projet check
    'depenses_engagees' in item &&
    'depenses_facturees' in item &&
    'reste_a_depenser' in item &&
    typeof (item as ControleMetrics).numero_article === 'string' &&
    typeof (item as ControleMetrics).code_projet === 'string' &&
    typeof (item as ControleMetrics).type_projet === 'string' &&  // Added type_projet validation
    typeof (item as ControleMetrics).depenses_engagees === 'number' &&
    typeof (item as ControleMetrics).depenses_facturees === 'number' &&
    typeof (item as ControleMetrics).reste_a_depenser === 'number'
  );
};


// Helper type for safe number conversion
export const safeNumber = (value: unknown): number => {
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};
// Utility function for safe type conversion
export function assertDashboardMetrics(metrics: unknown): DashboardMetrics {
  if (!isDashboardMetrics(metrics)) {
    throw new Error('Invalid dashboard metrics structure');
  }
  return metrics;
}

// Extend existing types with safe parsing methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const parseProjectArticle = (data: any): ProjectArticleMetrics => {
  const parseProjectType = (value: unknown): ProjectType => {
    const type = safeString(value, 'FORFAIT');
    return type === 'METRE' ? 'METRE' : 'FORFAIT';
  };

  return {
    numero_article: safeString(data.numero_article),
    code_projet: safeString(data.code_projet),
    type_projet: parseProjectType(data.type_projet),
    // Standard metrics
    depenses_engagees: safeNumber(data.depenses_engagees),
    depenses_facturees: safeNumber(data.depenses_facturees),
    fin_chantier: safeNumber(data.fin_chantier),
    rentabilite: safeNumber(data.rentabilite),
    // Real metrics
    depenses_engagees_reel: safeNumber(data.depenses_engagees_reel),
    depenses_facturees_reel: safeNumber(data.depenses_facturees_reel),
    fin_chantier_reel: safeNumber(data.fin_chantier_reel),
    rentabilite_reel: safeNumber(data.rentabilite_reel),
    // Project values
    reste_a_depenser: safeNumber(data.reste_a_depenser),
    prix_vente: safeNumber(data.prix_vente),
    prix_vente_base: safeNumber(data.prix_vente_base),
    budget_chef_projet: safeNumber(data.budget_chef_projet),
    budget_chef_projet_base: safeNumber(data.budget_chef_projet_base),
    budget_percentage: safeNumber(data.budget_percentage)
  };
};

export interface CommandeFilters {
  code_projet?: string;
  numero_document?: string;
  page?: number;
  page_size?: number;
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export type PageSizeOption = typeof PAGE_SIZE_OPTIONS[number];
// Filter projects
export interface CommandeFiltersProps {
  filters: CommandeFilters;
  projects: Project[];
  onFilterChange: (filters: Partial<CommandeFilters>) => void;
  onReset: () => void;
}



export interface ApiResponse<T> {
  length: unknown;
  error: string;
  count?: number;
  next?: string | null;
  previous?: string | null;
  results?: T[];
  message?: string;
  data?: T[] | T;
}

export interface ClearAllResponse {
  message: string;
  count: number;
}

export interface ClearCommandesResponse {
  message: string;
  count: number;
}

//filter operations
export type ComparisonOperator = '<' | '<=' | '=' | '>=' | '>' | '!=';

export interface NumericFilter {
  type: 'numeric';
  operator: ComparisonOperator;
  value: number | null;
}

export interface StringFilter {
  type: 'string';
  value: string;
}

export interface SelectFilter {
  type: 'select';
  value: string | null;
  options: string[];
}

export type ColumnFilter = NumericFilter | StringFilter | SelectFilter;

export interface FilterConfig {
  [key: string]: ColumnFilter;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

//Table Columns Visibility
export interface ColumnVisibility {
  [key: string]: boolean;
}

export interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filter?: ColumnFilter;
  tooltip?: string;
  group?: 'base' | 'pricing' | 'budget' | 'expenses' | 'metrics'; 
}
// Add these new interfaces to your src/types/index.ts file

export interface FacturationMetrics {
  facturation_total: number;
  avancement_total: number;
}

export interface ControleEvolutionData {
  controle: EvolutionDataPoint[] | null;
  project_type?: string;
  project_name?: string;
}

export interface EvolutionDataPoint {
  date: string;
  depenses_facturees: number;
  depenses_facturees_reel: number;
  controle: number; // depenses_engagees
  controle_reel: number; // depenses_engagees_reel
}

export interface FacturationDataPoint {
  date: string;
  facturation: number;  // total_after_discount
  avancement: number;   // total_payments
}



export interface FacturationEvolutionData {
  facturation?: { date: string; total_after_discount: number; }[] | null;
  avancement?: { date: string; total_payment: number; }[] | null;
}

export interface ChartProps {
  controleEvolutionData?: {
    controle?: EvolutionDataPoint[] | null;
  } | null;
  facturationEvolutionData?: {
    facturation?: Array<{ date: string; total_after_discount: number; }> | null;
    avancement?: Array<{ date: string; total_payment: number; }> | null;
  } | null;
  isLoading?: boolean;
}

export interface AggregatedMetrics extends ControleMetrics {
  period: string; // ISO date string for the aggregation period
  count: number; // Number of records in the aggregation
}

export interface GroupedEvolutionData {
  byMonth: Record<string, EvolutionDataPoint>;
  byQuarter: Record<string, EvolutionDataPoint>;
  byYear: Record<string, EvolutionDataPoint>;
}

// Type guard for evolution data
export const isEvolutionDataPoint = (item: unknown): item is EvolutionDataPoint => {
  return (
    typeof item === 'object' &&
    item !== null &&
    'date' in item &&
    'depenses_facturees' in item &&
    'depenses_facturees_reel' in item &&
    'controle' in item &&
    'controle_reel' in item &&
    typeof (item as EvolutionDataPoint).date === 'string' &&
    typeof (item as EvolutionDataPoint).depenses_facturees === 'number' &&
    typeof (item as EvolutionDataPoint).depenses_facturees_reel === 'number' &&
    typeof (item as EvolutionDataPoint).controle === 'number' &&
    typeof (item as EvolutionDataPoint).controle_reel === 'number'
  );
};

export interface FacturationData {
  id: number;
  document_number: string;
  registration_date: string;
  document_status: string;
  client_code: string;
  client_name: string;
  item_code: string;
  description: string;
  quantity: number;
  price: number;
  line_total: number;
  total_after_discount: number;
  project_code: string;
}

export interface AvancementData {
  id: number;
  doc_type: string;
  doc_num: string;
  accounting_date: string;
  payment_ht: number;
  payment_ttc: number;
  payment_method: string;
  project_code: string;
  num_total: string;
  dat: string;
  canceled: string;
  accompte_flag: string;
}

//user_management interface 

export interface User {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  profile: {
      total_projects_created: number;
      total_project_value: number;
      last_login_at: string | null;
  };
}

// In types/index.ts
export interface ExtendedUser extends Record<string, unknown> {
  id: number;
  username: string;
  email: string;
  is_staff: boolean;
  profile: {
      total_projects_created: number;
      total_project_value: number;
      last_login_at: string | null;
  };
}

export interface UserProfile {
  total_projects_created: number;
  total_project_value: number;
  last_login_at: string | null;
}

export interface DebugEntry {
  timestamp: string;
  component: string;
  action: string;
  layer?: DebugLayer;
  inputData?: unknown;
  outputData?: unknown;
  transformations?: DebugTransformation[];
  metrics?: Record<string, number>;
  warnings?: string[];
  errors?: string[];
}

export type DebugLayer = 'API' | 'Hook' | 'Component' | 'Service';
export interface DebugTransformation {
  description: string;
  before: unknown;
  after: unknown;
}