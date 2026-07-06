export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserResponse {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string | null;
  skills_required: string[] | null;
  experience_level: string | null;
  salary_range: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobCreate {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements?: string;
  skills_required?: string[];
  experience_level?: string;
  salary_range?: string;
  is_active?: boolean;
}

export interface JobUpdate {
  title?: string;
  company?: string;
  location?: string;
  description?: string;
  requirements?: string;
  skills_required?: string[];
  experience_level?: string;
  salary_range?: string;
  is_active?: boolean;
}

export interface Resume {
  id: number;
  user_id: number;
  file_name: string;
  file_path: string;
  content_text: string | null;
  parsed_skills: string[] | null;
  parsed_experience: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface Recommendation {
  id: number;
  user_id: number;
  resume_id: number;
  job_id: number;
  match_score: number;
  explanation: string | null;
  skills_gap: string[] | null;
  created_at: string;
  job?: Job;
}

export interface SkillGapItem {
  skill: string;
  missing_in_jobs_count: number;
  percentage_of_jobs: number;
}

export interface SkillsGapAnalysis {
  resume_skills: string[];
  total_jobs_evaluated: number;
  skill_gaps: SkillGapItem[];
  advice: string;
}
