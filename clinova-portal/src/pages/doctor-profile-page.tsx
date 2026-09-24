import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BadgeCheck,
  BriefcaseMedical,
  Building2,
  ChevronRight,
  Camera,
  ExternalLink,
  FileBadge,
  FileText,
  KeyRound,
  LoaderCircle,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  RefreshCw,
  Save,
  ShieldCheck,
  Stethoscope,
  Trash2,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import ConfirmationDialog from "@/components/confirmation-dialog";
import DoctorWorkspaceShell from "@/components/doctor-workspace-shell";
import FormField from "@/components/form-field";
import Notice from "@/components/notice";
import PasswordField from "@/components/password-field";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApi } from "@/hooks/use-api";
import { useAuth } from "@/hooks/use-auth";
import { getErrorMessage } from "@/lib/api";
import type { LookupOption } from "@/types/auth";
import type { ClinicSummary } from "@/types/clinic";
import type { DoctorProfile, UpdateDoctorProfileRequest } from "@/types/doctor";

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

interface ProfileFormState {
  title: string;
  experienceYears: string;
  bio: string;
  dateOfBirth: string;
  gender: string | null;
}

const emptyForm: ProfileFormState = {
  title: "",
  experienceYears: "",
  bio: "",
  dateOfBirth: "",
  gender: null,
};

function profileToForm(profile: DoctorProfile): ProfileFormState {
  return {
    title: profile.title ?? "",
    experienceYears:
      profile.experienceYears == null ? "" : String(profile.experienceYears),
    bio: profile.bio ?? "",
    dateOfBirth: profile.dateOfBirth ?? "",
    gender: profile.gender == null ? null : String(profile.gender),
  };
}

function ReadOnlyField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="group flex min-w-0 items-center gap-3.5 rounded-2xl border border-border/60 bg-background/45 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
        {icon}
      </span>
      <span className="grid min-w-0 gap-1">
        <small className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {label}
        </small>
        <strong className="truncate text-sm font-bold">{value || "—"}</strong>
      </span>
    </div>
  );
}

export default function DoctorProfilePage() {
  const { t } = useTranslation();
  const api = useApi();
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProfileFormState>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [formError, setFormError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [pictureModalOpen, setPictureModalOpen] = useState(false);
  const [pictureError, setPictureError] = useState("");
  const [pictureSuccess, setPictureSuccess] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  const profile = useQuery({
    queryKey: ["doctor", "profile"],
    queryFn: () =>
      api.request<DoctorProfile>(
        "/api/doctors/me",
        {},
        { notifyOnError: false },
      ),
  });
  const clinics = useQuery({
    queryKey: ["doctor", "clinics"],
    queryFn: () => api.request<ClinicSummary[]>("/api/clinics"),
  });
  const genders = useQuery({
    queryKey: ["lookups", "genders"],
    queryFn: () =>
      api.request<LookupOption[]>(
        "/api/lookups/genders",
        {},
        { notifyOnError: false },
      ),
  });
  const updateProfile = useMutation({
    mutationFn: (body: UpdateDoctorProfileRequest) =>
      api.request<string>(
        "/api/doctors/me",
        { method: "PATCH", body: JSON.stringify(body) },
        { notifyOnError: false },
      ),
    onSuccess: async (message) => {
      setProfileSuccess(message || t("doctorProfile.saved"));
      setIsEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["doctor", "profile"] });
    },
  });
  const updatePicture = useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.set("ProfilePicture", file);
      return api.request<string>(
        "/api/doctors/me/profile-picture",
        { method: "PATCH", body },
        { notifyOnError: false },
      );
    },
    onSuccess: async (message) => {
      setPictureSuccess(message || t("doctorProfile.pictureSaved"));
      setPictureFile(null);
      await queryClient.invalidateQueries({ queryKey: ["doctor", "profile"] });
    },
  });
  const changePassword = useMutation({
    mutationFn: () =>
      api.request<string>(
        "/api/auth/change-password",
        { method: "POST", body: JSON.stringify(passwordForm) },
        { notifyOnError: false },
      ),
    onSuccess: (message) => {
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess(message || t("doctorProfile.passwordChanged"));
    },
  });
  const deleteAccount = useMutation({
    mutationFn: () =>
      api.request<string>(
        "/api/auth/account",
        { method: "DELETE" },
        { notifyOnError: false },
      ),
    onSuccess: () => {
      api.clearSession();
      void navigate({ to: "/login", search: { redirect: undefined } });
    },
  });

  const picturePreview = useMemo(
    () => (pictureFile ? URL.createObjectURL(pictureFile) : null),
    [pictureFile],
  );
  useEffect(
    () => () => {
      if (picturePreview) URL.revokeObjectURL(picturePreview);
    },
    [picturePreview],
  );

  const fullName = profile.data
    ? `${profile.data.firstName} ${profile.data.lastName}`
    : (auth.user?.name ?? "");
  const initials = profile.data
    ? `${profile.data.firstName[0]}${profile.data.lastName[0]}`.toUpperCase()
    : fullName[0]?.toUpperCase();
  const activePicture = picturePreview ?? profile.data?.profilePicture;
  const approvalStatus = profile.data?.approvalStatusName ?? "";
  const isApproved = approvalStatus.toLowerCase() === "approved";
  const displayedForm =
    profile.data && !isEditing ? profileToForm(profile.data) : form;
  const today = new Date().toISOString().slice(0, 10);

  function updateField<Key extends keyof ProfileFormState>(
    key: Key,
    value: ProfileFormState[Key],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEditing() {
    if (profile.data) setForm(profileToForm(profile.data));
    setFormError("");
    setProfileSuccess("");
    setIsEditing(true);
  }

  function cancelEditing() {
    if (profile.data) setForm(profileToForm(profile.data));
    setFormError("");
    updateProfile.reset();
    setIsEditing(false);
  }

  function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setProfileSuccess("");
    const experienceYears =
      form.experienceYears === "" ? null : Number(form.experienceYears);
    if (
      experienceYears != null &&
      (!Number.isInteger(experienceYears) ||
        experienceYears < 0 ||
        experienceYears > 100)
    ) {
      setFormError(t("doctorProfile.experienceError"));
      return;
    }
    updateProfile.mutate({
      title: form.title.trim(),
      experienceYears,
      bio: form.bio.trim(),
      dateOfBirth: form.dateOfBirth || null,
      gender: form.gender == null ? null : Number(form.gender),
    });
  }

function handlePictureChange(event: ChangeEvent<HTMLInputElement>) {
  const file = event.target.files?.[0] ?? null;
  setPictureError("");
  setPictureSuccess("");
  updatePicture.reset();
  if (!file) return setPictureFile(null);
  if (!acceptedImageTypes.includes(file.type) || file.size > maxImageSize) {
    setPictureFile(null);
    setPictureError(
      t(
        file.size > maxImageSize
          ? "validation.imageSize"
          : "validation.imageType",
      ),
    );
    event.target.value = "";
    return;
  }
  setPictureFile(file);
  setPictureModalOpen(true);
}

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    changePassword.reset();
    if (!passwordPattern.test(passwordForm.newPassword)) {
      setPasswordError(t("validation.passwordRules"));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t("validation.passwordMismatch"));
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      setPasswordError(t("doctorProfile.passwordMustChange"));
      return;
    }
    changePassword.mutate();
  }

  function handleDeleteAccount() {
    deleteAccount.reset();
    setDeleteConfirmationOpen(true);
  }

  return (
    <DoctorWorkspaceShell active="profile">
      <div className="mx-auto min-w-0 w-full max-w-6xl p-4 sm:p-6 lg:p-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
              <UserRound className="size-3" />
              {t("doctorProfile.eyebrow")}
            </Badge>
            <h1 className="mt-2 font-sans text-3xl font-bold sm:text-4xl">
              {t("doctorProfile.title")}
            </h1>
            <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground sm:text-sm">
              {t("doctorProfile.description")}
            </p>
          </div>
        </div>

        {profile.isLoading && (
          <Card className="min-h-80 items-center justify-center rounded-3xl border border-border bg-card">
            <LoaderCircle className="size-7 animate-spin text-primary motion-reduce:animate-none" />
            <p className="text-xs text-muted-foreground">
              {t("doctorProfile.loading")}
            </p>
          </Card>
        )}
        {profile.isError && (
          <Card className="items-center rounded-3xl border border-destructive/20 bg-card p-8 text-center">
            <p className="text-sm font-bold text-destructive">
              {getErrorMessage(profile.error)}
            </p>
            <Button
              className="mt-3 h-11 rounded-xl text-sm font-bold normal-case cursor-pointer"
              variant="outline"
              onClick={() => profile.refetch()}
            >
              <RefreshCw />
              {t("doctorProfile.retry")}
            </Button>
          </Card>
        )}

        {profile.data && (
          <div className="min-w-0 grid gap-5">
            <Card className="relative min-w-0 overflow-hidden rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/12 via-card to-primary/5 p-5 sm:p-7">
              <div className="pointer-events-none absolute inset-0">
                <span className="absolute -top-16 -right-10 size-64 rounded-full bg-primary/10 blur-2xl" />
                <span className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-warm/8 blur-3xl" />
                <svg className="absolute inset-0 size-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="profileGrid" width="28" height="28" patternUnits="userSpaceOnUse">
                      <circle cx="2" cy="2" r="1.4" fill="currentColor" className="text-primary" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#profileGrid)" />
                </svg>
              </div>

              <div className="relative z-10 min-w-0 grid items-center gap-5 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-7">
                <Label
                  htmlFor="profilePicture"
                  className="group relative mx-auto grid cursor-pointer justify-items-center gap-2 sm:mx-0"
                  title={t("doctorProfile.pictureRules")}
                >
                  <Input
                    id="profilePicture"
                    className="sr-only"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handlePictureChange}
                  />
                  <span className="relative grid size-36 place-items-center overflow-hidden rounded-3xl border-4 border-card bg-gradient-to-br from-primary to-primary/65 text-3xl font-bold text-primary-foreground shadow-lg transition group-hover:-translate-y-0.5 group-hover:shadow-xl">
                    {activePicture ? (
                      <img
                        className="size-full object-cover"
                        src={activePicture}
                        alt={t("doctorProfile.pictureAlt", { name: fullName })}
                      />
                    ) : (
                      initials
                    )}
                    <span className="absolute inset-0 grid place-items-center bg-black/55 opacity-0 transition group-hover:opacity-100">
                      <span className="grid gap-1 justify-items-center text-white">
                        <Camera className="size-6" />
                        <small className="text-[10px] font-bold">{t("doctorProfile.choosePicture")}</small>
                      </span>
                    </span>
                  </span>
                  <span className="absolute -end-1 -bottom-1 grid size-9 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition group-hover:scale-110">
                    <Camera className="size-4" />
                  </span>
                </Label>

                <div className="min-w-0 text-center sm:text-start">
                  <h2 className="break-words font-sans text-3xl leading-tight font-bold sm:text-5xl">
                    {fullName}
                  </h2>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <Badge className="max-w-full rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-semibold tracking-wider text-primary uppercase">
                      <Stethoscope className="size-3.5 shrink-0" />
                      <span className="truncate">
                        {profile.data.medicalSpecialtyName}
                      </span>
                    </Badge>
                    <Badge
                      className={`rounded-full border px-3 py-1 text-[11px] font-semibold tracking-wider uppercase [&>svg]:size-3.5! ${isApproved ? "border-primary/20 bg-primary/10 text-primary" : "border-warm/20 bg-warm/10 text-warm"}`}
                    >
                      <BadgeCheck />
                      {approvalStatus}
                    </Badge>
                  </div>
                </div>

                {!isEditing && (
                  <Button
                    className="mx-auto h-11 rounded-xl text-sm font-bold normal-case sm:mx-0 cursor-pointer"
                    onClick={startEditing}
                  >
                    <PencilLine />
                    {t("doctorProfile.edit")}
                  </Button>
                )}
              </div>

              {(pictureError || updatePicture.error || pictureSuccess) && (
                <div className="relative z-10 mt-5 grid gap-3 border-t border-primary/10 pt-5">
                  {(pictureError || updatePicture.error) && (
                    <Notice
                      message={
                        pictureError || getErrorMessage(updatePicture.error)
                      }
                    />
                  )}
                  {pictureSuccess && (
                    <Notice tone="success" message={pictureSuccess} />
                  )}
                </div>
              )}
            </Card>

            <div className="min-w-0 grid items-start gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]">
              <div className="min-w-0 grid content-start gap-5">
                <Card className="min-w-0 gap-0 overflow-visible rounded-2xl border border-border bg-card p-0">
                  <div className="relative overflow-hidden rounded-t-2xl border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
                    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-center gap-3.5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                        <BriefcaseMedical className="size-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-sans text-xl font-bold">
                          {t("doctorProfile.professionalTitle")}
                        </h3>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                          {isEditing
                            ? t("doctorProfile.editingHint")
                            : t("doctorProfile.professionalDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    {(formError || updateProfile.error) && (
                      <Notice
                        message={
                          formError || getErrorMessage(updateProfile.error)
                        }
                      />
                    )}
                    {profileSuccess && (
                      <Notice tone="success" message={profileSuccess} />
                    )}
                    <form
                      className="mt-5 grid gap-5"
                      onSubmit={handleProfileSubmit}
                    >
                      <div className="grid min-w-0 gap-5 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:p-5">
                        <FormField
                          id="doctorTitle"
                          label={t("doctorProfile.clinicalTitle")}
                          value={displayedForm.title}
                          onChange={(event) =>
                            updateField("title", event.target.value)
                          }
                          maxLength={50}
                          disabled={!isEditing}
                          placeholder={t(
                            "doctorProfile.clinicalTitlePlaceholder",
                          )}
                        />
                        <FormField
                          id="experienceYears"
                          label={t("doctorProfile.experience")}
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={displayedForm.experienceYears}
                          onChange={(event) =>
                            updateField("experienceYears", event.target.value)
                          }
                          disabled={!isEditing}
                          placeholder="0"
                        />
                        <FormField
                          id="dateOfBirth"
                          label={t("doctorProfile.dateOfBirth")}
                          type="date"
                          max={today}
                          value={displayedForm.dateOfBirth}
                          onChange={(event) =>
                            updateField("dateOfBirth", event.target.value)
                          }
                          disabled={!isEditing}
                        />
                        <div className="grid gap-2">
                          <Label className="text-xs font-semibold text-foreground/80">
                            {t("doctorProfile.gender")}
                          </Label>
                          <Select
                            items={
                              genders.data?.map((gender) => ({
                                value: String(gender.id),
                                label: gender.name,
                              })) ?? []
                            }
                            value={displayedForm.gender}
                            onValueChange={(value) =>
                              updateField("gender", value)
                            }
                            disabled={
                              !isEditing || genders.isLoading || genders.isError
                            }
                          >
                            <SelectTrigger className="h-12 w-full rounded-xl border border-input bg-background/40 px-3 text-foreground">
                              <UserRound className="size-[18px] text-primary/70" />
                              <SelectValue
                                placeholder={
                                  genders.isLoading
                                    ? t("doctorProfile.loadingGenders")
                                    : t("doctorProfile.chooseGender")
                                }
                              />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border border-border bg-popover">
                              {genders.data?.map((gender) => (
                                <SelectItem
                                  className="rounded-lg"
                                  key={gender.id}
                                  value={String(gender.id)}
                                >
                                  {gender.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {genders.isError && (
                            <small className="text-[11px] text-destructive">
                              {t("doctorProfile.gendersError")}
                            </small>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:p-5">
                        <Label
                          htmlFor="doctorBio"
                          className="text-xs font-semibold text-foreground/80"
                        >
                          {t("doctorProfile.bio")}
                        </Label>
                        <textarea
                          id="doctorBio"
                          className="min-h-44 resize-y rounded-xl border border-input bg-background/40 p-3.5 text-sm leading-6 outline-none transition focus:border-primary/60 focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
                          value={displayedForm.bio}
                          onChange={(event) =>
                            updateField("bio", event.target.value)
                          }
                          maxLength={1000}
                          disabled={!isEditing}
                          placeholder={t("doctorProfile.bioPlaceholder")}
                        />
                        <small className="text-end text-[11px] font-semibold tabular-nums text-muted-foreground">
                          {displayedForm.bio.length}/1000
                        </small>
                      </div>
                      {isEditing && (
                        <div className="flex flex-wrap justify-end gap-2 border-t border-border/50 pt-5">
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 rounded-xl text-sm font-bold normal-case cursor-pointer"
                            onClick={cancelEditing}
                            disabled={updateProfile.isPending}
                          >
                            <X />
                            {t("doctorProfile.cancel")}
                          </Button>
                          <Button
                            type="submit"
                            className="h-11 rounded-xl text-sm font-bold normal-case cursor-pointer"
                            disabled={
                              updateProfile.isPending || genders.isError
                            }
                          >
                            {updateProfile.isPending ? (
                              <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                            ) : (
                              <Save />
                            )}
                            {t("doctorProfile.save")}
                          </Button>
                        </div>
                      )}
                    </form>
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
                  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
                    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-center gap-3.5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                        <UserRound className="size-6" />
                      </span>
                      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">
                        {t("doctorProfile.accountTitle")}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="grid min-w-0 gap-3 p-5 sm:grid-cols-2">
                    <ReadOnlyField
                      icon={<Mail className="size-4" />}
                      label={t("doctorProfile.email")}
                      value={profile.data.email}
                    />
                    <ReadOnlyField
                      icon={<Phone className="size-4" />}
                      label={t("doctorProfile.phone")}
                      value={profile.data.phoneNumber}
                    />
                    <ReadOnlyField
                      icon={<Stethoscope className="size-4" />}
                      label={t("doctorProfile.specialty")}
                      value={profile.data.medicalSpecialtyName}
                    />
                    <ReadOnlyField
                      icon={<FileBadge className="size-4" />}
                      label={t("doctorProfile.syndicateNumber")}
                      value={profile.data.syndicateNumber}
                    />
                    <p className="text-xs font-bold leading-4 text-muted-foreground sm:col-span-2">
                      {t("doctorProfile.readOnlyHint")}
                    </p>
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
                  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
                    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-center gap-3.5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                        <ShieldCheck className="size-6" />
                      </span>
                      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">
                        {t("doctorProfile.verificationTitle")}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
                    <a
                    
                      className="group flex min-h-20 items-center gap-3.5 rounded-2xl border border-border bg-background/35 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg"
                      href={profile.data.syndicateCardImageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                        <FileText className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">
                        {t("doctorProfile.syndicateCard")}
                      </span>
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
                    </a>
                    <a
                    
                      className="group flex min-h-20 items-center gap-3.5 rounded-2xl border border-border bg-background/35 p-4 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-lg"
                      href={profile.data.nationalIdImageUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                        <FileText className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold">
                        {t("doctorProfile.nationalId")}
                      </span>
                      <ExternalLink className="size-4 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
                    </a>
                    <p className="text-xs font-bold leading-4 text-muted-foreground sm:col-span-2">
                      {t("doctorProfile.documentsHint")}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="min-w-0 grid content-start gap-5">
                <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
                  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
                    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-center gap-3.5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                        <Building2 className="size-6" />
                      </span>
                      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">
                        {t("doctorProfile.clinicsTitle")}
                      </h3>
                      <Badge className="px-2.5 py-1 text-sm font-bold text-foreground">
                        {clinics.data?.length ?? 0}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="grid gap-3 p-4">
                    {clinics.isLoading && (
                      <LoaderCircle className="animate-spin text-primary motion-reduce:animate-none" />
                    )}
                    {clinics.data?.slice(0, 3).map((clinic) => (
                      <Link
                        className="group flex items-center gap-3 rounded-2xl border border-border bg-background/35 px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                        key={clinic.id}
                        to="/doctor/clinics/$clinicId"
                        params={{ clinicId: String(clinic.id) }}
                      >
                        <span className="grid min-w-0 flex-1 gap-1">
                          <span className="truncate text-base font-bold">
                            {clinic.name}
                          </span>
                          <small className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0 text-primary" />
                            <span className="truncate">{clinic.regionName}</span>
                          </small>
                        </span>
                        <ChevronRight className="size-5 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:text-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                      </Link>
                    ))}
                    {clinics.data?.length === 0 && (
                      <p className="text-xs leading-5 text-muted-foreground">
                        {t("doctorProfile.noClinics")}
                      </p>
                    )}
                    <Button
                      className="h-11 rounded-xl text-sm font-bold normal-case cursor-pointer"
                      render={<Link to="/doctor/clinics" />}
                    >
                      <Building2 />
                      {t("doctorProfile.manageClinics")}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0">
                  <div className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/15 via-primary/[0.05] to-transparent p-5">
                    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
                    <div className="relative flex items-center gap-3.5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 shadow-primary/30 ring-primary/10">
                        <KeyRound className="size-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-sans text-xl font-bold">
                          {t("doctorProfile.securityTitle")}
                        </h3>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground sm:text-sm">
                          {t("doctorProfile.securityDescription")}
                        </p>
                      </div>
                    </div>
                  </div>
<CardContent className="p-5">
  {(passwordError || changePassword.error) && (
    <Notice
      message={
        passwordError || getErrorMessage(changePassword.error)
      }
    />
  )}
  {passwordSuccess && (
    <Notice tone="success" message={passwordSuccess} />
  )}
  <form
    className="mt-3 grid gap-5"
    onSubmit={handlePasswordSubmit}
  >
                      <PasswordField
                        id="currentPassword"
                        label={t("doctorProfile.currentPassword")}
                        autoComplete="current-password"
                        required
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            currentPassword: event.target.value,
                          }))
                        }
                      />
                      <PasswordField
                        id="newPassword"
                        label={t("doctorProfile.newPassword")}
                        hint={t("validation.passwordRules")}
                        autoComplete="new-password"
                        required
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            newPassword: event.target.value,
                          }))
                        }
                      />
                      <PasswordField
                        id="confirmNewPassword"
                        label={t("doctorProfile.confirmNewPassword")}
                        autoComplete="new-password"
                        required
                        value={passwordForm.confirmPassword}
                        onChange={(event) =>
                          setPasswordForm((current) => ({
                            ...current,
                            confirmPassword: event.target.value,
                          }))
                        }
                      />
                      <Button
                        type="submit"
                        className="h-11 rounded-xl text-sm font-bold normal-case tracking-normal cursor-pointer"
                        disabled={changePassword.isPending}
                      >
                        {changePassword.isPending ? (
                          <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                        ) : (
                          <KeyRound />
                        )}
                        {t("doctorProfile.changePassword")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
                
                              <Card className="min-w-0 gap-0 overflow-hidden rounded-2xl border border-destructive/25 bg-card p-0">
                  <div className="relative overflow-hidden border-b border-destructive/15 bg-gradient-to-br from-destructive/15 via-destructive/[0.05] to-transparent p-5">
                    <span className="pointer-events-none absolute -end-8 -top-8 size-32 rounded-full bg-destructive/10 blur-2xl" />
                    <div className="relative flex items-center gap-3.5">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-destructive/10 text-destructive shadow-lg ring-4 shadow-destructive/30 ring-destructive/10">
                        <TriangleAlert className="size-6" />
                      </span>
                      <h3 className="min-w-0 flex-1 truncate font-sans text-xl font-bold">
                        {t("doctorProfile.dangerTitle")}
                      </h3>
                    </div>
                  </div>
                  <CardContent className="grid gap-4 p-5">
                    <p className="text-xs leading-6 font-medium text-muted-foreground sm:text-sm">
                      {t("doctorProfile.deleteAccountDescription")}
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      className="h-11 cursor-pointer rounded-xl border border-destructive/20 bg-destructive/10 text-sm font-bold normal-case text-destructive shadow-md shadow-destructive/25 transition-all hover:bg-destructive/15 hover:text-destructive hover:shadow-lg hover:shadow-destructive/30 disabled:cursor-not-allowed dark:shadow-none dark:hover:shadow-md dark:hover:shadow-destructive/25"
                      disabled={deleteAccount.isPending}
                      onClick={handleDeleteAccount}
                    >
                      {deleteAccount.isPending ? (
                        <LoaderCircle className="animate-spin motion-reduce:animate-none" />
                      ) : (
                        <Trash2 />
                      )}
                      {t("doctorProfile.deleteAccount")}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

          </div>
        )}
      </div>


{pictureModalOpen && pictureFile && (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-md">
    <div className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
      <div className="grid justify-items-center gap-3 bg-gradient-to-b from-primary/8 to-transparent px-6 pt-7 pb-2 text-center">
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Camera className="size-6" />
        </span>
        <div>
          <h3 className="font-sans text-lg font-bold">
            {t("doctorProfile.confirmPictureTitle")}
          </h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {t("doctorProfile.confirmPictureDescription")}
          </p>
        </div>
      </div>

      <div className="grid justify-items-center px-6 py-5">
        <div className="relative size-36 overflow-hidden rounded-3xl border-4 border-background shadow-lg ring-1 ring-border">
          <img
            className="size-full object-cover"
            src={picturePreview ?? ""}
            alt=""
          />
        </div>
<div className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-emerald-600/15 bg-emerald-50/70 px-4 py-3 dark:border-emerald-400/15 dark:bg-emerald-950/20">
  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
    <BadgeCheck className="size-5" />
  </span>
  <span className="min-w-0 text-start">
    <strong className="block truncate text-sm font-bold">{pictureFile.name}</strong>
    <small className="block text-xs font-medium text-muted-foreground">{t("doctorProfile.pictureRules")}</small>
  </span>
</div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-border/60 bg-background/40 p-4">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl text-sm font-bold normal-case cursor-pointer"
          disabled={updatePicture.isPending}
          onClick={() => {
            setPictureFile(null);
            setPictureModalOpen(false);
          }}
        >
          {t("doctorProfile.cancel")}
        </Button>
        <Button
          type="button"
          className="h-11 rounded-xl text-sm font-bold normal-case cursor-pointer"
          disabled={updatePicture.isPending}
          onClick={() => {
            updatePicture.mutate(pictureFile, {
              onSuccess: () => setPictureModalOpen(false),
            });
          }}
        >
          {updatePicture.isPending ? (
            <LoaderCircle className="animate-spin motion-reduce:animate-none" />
          ) : (
            <Camera />
          )}
          {t("doctorProfile.updatePicture")}
        </Button>
      </div>
    </div>
  </div>
)}


      <ConfirmationDialog
        open={deleteConfirmationOpen}
        title={t("doctorProfile.deleteAccountTitle")}
        description={t("doctorProfile.deleteAccountConfirm")}
        confirmLabel={t("doctorProfile.deleteAccount")}
        cancelLabel={t("doctorProfile.keepAccount")}
        destructive
        pending={deleteAccount.isPending}
        error={
          deleteAccount.error ? getErrorMessage(deleteAccount.error) : undefined
        }
        onConfirm={() => deleteAccount.mutate()}
        onOpenChange={(open) => {
          if (!open && !deleteAccount.isPending) {
            setDeleteConfirmationOpen(false);
            deleteAccount.reset();
          }
        }}
      />
    </DoctorWorkspaceShell>
  );
}
