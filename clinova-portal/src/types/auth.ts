export interface ApiProblem {
  status?: number
  statusCode?: number
  title?: string
  message?: string
  // Model-validation responses use errorMessage and a list of per-field errors.
  errorMessage?: string
  errors?: string[] | Record<string, string[]> | ApiFieldErrors[]
  traceId?: string
}

export interface ApiFieldErrors {
  field: string
  errors: string[]
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

