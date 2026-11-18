import type { Gender } from '@/types/secretary'

export type BloodType = number

export interface PatientProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  profilePicture: string | null
  dateOfBirth: string | null
  gender: Gender | null
  bloodType: BloodType | null
}

// Every field is optional: the backend only changes what is sent.
export interface UpdatePatientProfileRequest {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  gender?: Gender
  bloodType?: BloodType
}

