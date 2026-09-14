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
