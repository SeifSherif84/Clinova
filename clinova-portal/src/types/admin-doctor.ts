export type DoctorStatusFilter = 'all' | 'pending' | 'approved' | 'rejected'
export type DoctorApprovalStatus = 'Pending' | 'Rejected' | 'Approved'

export interface AdminDoctor {
  doctorId: string
  doctorName: string
  email: string
  phoneNumber: string
  profilePictureImageUrl: string | null
  syndicateNumber: string
  syndicateCardImageUrl: string | null
  nationalIdImageUrl: string | null
  medicalSpecialty: string
  title: string | null
  experienceYears: number | null
  bio: string | null
  approvalStatus: DoctorApprovalStatus | string
  createdAt: string
}

export interface AdminDoctorsResult {
  pageIndex: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: AdminDoctor[]
}

// Mirrors the page's URL search params. A missing status means the default view: Pending.
export interface AdminDoctorFilters {
  status?: DoctorStatusFilter
  q?: string
  pageIndex?: number
}