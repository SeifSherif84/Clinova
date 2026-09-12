export interface ApiProblem {
  statusCode?: number
  title?: string
  message?: string
  errors?: string[] | Record<string, string[]>
}

export interface SessionTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse extends SessionTokens {
  message: string
}

export interface RegistrationResponse {
  message: string
  email: string
  doctorApprovalStatusName?: string
}

export interface PatientRegistrationRequest {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  password: string
  confirmPassword: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  roles: string[]
}

export interface LookupOption {
  id: number
  name: string
}

