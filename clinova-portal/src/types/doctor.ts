export interface DoctorProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  profilePicture: string | null
  dateOfBirth: string | null
  gender: number | null
  title: string | null
  experienceYears: number | null
  bio: string | null
  medicalSpecialtyId: number
  medicalSpecialtyName: string
  approvalStatusName: string
  syndicateNumber: string
  syndicateCardImageUrl: string
  nationalIdImageUrl: string
}

export interface UpdateDoctorProfileRequest {
  title: string
  experienceYears: number | null
  bio: string
  dateOfBirth: string | null
  gender: number | null
}

export interface PatientDoctorResponse {
  doctorId: string
  doctorName: string
  medicalSpecialtyName: string
  experienceYears: number | null
  profilePictureUrl: string | null
  averageRating: number | null
}

export interface PaginatedResult<T> {
  pageIndex: number
  pageSize: number
  totalCount: number
  totalPages: number
  items: T[]
}

export interface DoctorHeader {
  doctorId: string
  doctorName: string
  profilePictureUrl: string | null
  title: string | null
  medicalSpecialtyName: string
  experienceYears: number | null
  bio: string | null
}

export interface RatingSummary {
  doctorId: string
  totalReviews: number
  averageRating: number
  ratingBreakdown: { fiveStars: number; fourStars: number; threeStars: number; twoStars: number; oneStar: number }
}

export interface DoctorReview {
  reviewId: number
  rating: number
  comment: string | null
  isAnonymous: boolean
  patientName: string
  createdAt: string
}

export interface PaginatedReviews {
  pageIndex: number
  pageSize: number
  totalCount: number
  totalPages: number
  averageRating: number
  items: DoctorReview[]
}

export interface PatientDoctorClinic {
  clinicId: number
  clinicName: string
  streetName: string
  regionName: string
  governorateName: string
  consultationFee: number
  depositPercentage: number
  depositAmount: number
  remainingAmount: number
}

export interface PatientClinicDetails {
  id: number
  name: string
  streetName: string
  buildingNumber: string
  landmark: string | null
  googleMapsUrl: string | null
  consultationFee: number
  depositPercentage: number
  regionId: number
  regionName: string
  phoneNumbers: unknown[]
  images: unknown[]
}

export interface AvailableDay {
  dayName: string
  date: string
}

export interface AvailableSlot {
  id: number
  startTime: string
  endTime: string
}