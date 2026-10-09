/** Tipos de las respuestas de la API (ver los serializers.py de cada app del backend). */

export type Role = "ESTUDIANTE" | "EMPRESA" | "ADMIN";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: Role;
}

export type Modality = "PRESENCIAL" | "HIBRIDA" | "REMOTA";
export type Stage = "LECTIVA" | "PRODUCTIVA";
export type ReviewStatus = "PENDIENTE" | "APROBADA" | "RECHAZADA";
export type VacancyStatus = "BORRADOR" | ReviewStatus | "PAUSADA";
export type ApplicationStatus = "APLICADO" | "EN_REVISION" | "ENTREVISTA" | "ACEPTADO" | "RECHAZADO";

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface StudentProfile {
  id: number;
  full_name: string;
  email: string;
  institution: string;
  program: string;
  semester: number | null;
  city: string;
  about: string;
  skills: string[];
  cv_url: string | null;
  cv_filename: string;
  cv_size: number | null;
  cv_uploaded_at: string | null;
  completion: number;
  missing_fields: string[];
}

export interface CompanyPublic {
  id: number;
  name: string;
  initials: string;
  logo_url: string | null;
  city: string;
  website: string;
  about: string;
  sectors: string[];
}

export interface CompanyProfile {
  id: number;
  email: string;
  legal_name: string;
  nit: string;
  city: string;
  website: string;
  about: string;
  sectors: string[];
  logo_url: string | null;
  initials: string;
  status: ReviewStatus;
  status_display: string;
  rejection_reason: string;
  completion: number;
  missing_fields: string[];
}

export interface VacancyCard {
  id: number;
  title: string;
  company: CompanyPublic;
  city: string;
  modality: Modality;
  modality_display: string;
  stage: Stage;
  stage_display: string;
  duration_months: number;
  stipend: string;
  summary: string;
  skills: string[];
  created_at: string;
}

export interface VacancyDetail extends VacancyCard {
  description: string;
  requirements: string[];
  openings: number;
  applicants_count: number;
  my_application: { id: number; status: ApplicationStatus; status_display: string } | null;
}

export interface CompanyVacancy {
  id: number;
  title: string;
  city: string;
  openings: number;
  modality: Modality;
  modality_display: string;
  stage: Stage;
  stage_display: string;
  duration_months: number;
  stipend: string;
  description: string;
  requirements: string[];
  skills: string[];
  status: VacancyStatus;
  status_display: string;
  rejection_reason: string;
  applicants_count: number;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
}

export interface StudentApplication {
  id: number;
  status: ApplicationStatus;
  status_display: string;
  created_at: string;
  status_changed_at: string;
  vacancy: {
    id: number;
    title: string;
    city: string;
    modality_display: string;
    company: CompanyPublic;
  };
}

export interface StudentSummary {
  id: number;
  full_name: string;
  email: string;
  institution: string;
  program: string;
  semester: number | null;
  city: string;
  about: string;
  skills: string[];
  cv_url: string | null;
}

export interface CompanyApplication {
  id: number;
  student: StudentSummary;
  vacancy: number;
  vacancy_title: string;
  status: ApplicationStatus;
  status_display: string;
  created_at: string;
  status_changed_at: string;
}

export interface CompanyDashboard {
  active_vacancies: number;
  new_applicants: number;
  interviews: number;
  accepted: number;
  total_applicants: number;
}

export interface CompanyReview {
  id: number;
  name: string;
  email: string;
  contact_name: string;
  initials: string;
  logo_url: string | null;
  nit: string;
  city: string;
  website: string;
  about: string;
  sectors: string[];
  status: ReviewStatus;
  status_display: string;
  rejection_reason: string;
  created_at: string;
  reviewed_at: string | null;
  vacancies_count: number;
}

export interface VacancyReview {
  id: number;
  title: string;
  company: number;
  company_name: string;
  company_status: ReviewStatus;
  company_status_display: string;
  city: string;
  openings: number;
  modality_display: string;
  stage_display: string;
  duration_months: number;
  stipend: string;
  description: string;
  requirements: string[];
  skills: string[];
  status: VacancyStatus;
  status_display: string;
  rejection_reason: string;
  submitted_at: string | null;
  reviewed_at: string | null;
}
