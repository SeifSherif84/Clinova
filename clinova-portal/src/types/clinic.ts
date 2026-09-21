export interface ClinicSummary {
  id: number
  name: string
  streetName: string
  buildingNumber: string
  landmark: string | null
  googleMapsUrl: string | null
  consultationFee: number
  depositPercentage: number
  regionName: string
}

export interface ClinicDetails extends ClinicSummary {
  regionId: number
  phoneNumbers: ClinicPhoneNumber[]
  images: ClinicImage[]
}

export interface ClinicPhoneNumber {
  id: number
  phoneNumber: string
}

export interface ClinicImage {
  id: number
  url: string
}

export interface ClinicMember {
  id: string
  fullName: string
  profilePicture: string | null
  title: string | null
  experienceYears: number | null
  medicalSpecialty: string
  isOwner: boolean
  joinedAt: string
}

export interface UpdateClinicRequest {
  name: string
  streetName: string
  buildingNumber: string
  landmark: string
  googleMapsUrl: string
  consultationFee: number
  depositPercentage: number
}
