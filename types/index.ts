export type UserType = 'creator' | 'business';

export interface RegistrationFormData {
  // Common fields
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  profilePhoto: File | null;
  city: string;
  country: string;
  userType: UserType;

  // Creator-specific fields
  instagramUrl?: string;
  tiktokUrl?: string;
  youtubeUrl?: string;
  isPublic?: boolean;
  isCollaborated?: boolean;
}
