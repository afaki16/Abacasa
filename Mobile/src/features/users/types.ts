// Backend: Abacasa.Application/Features/Users/Dtos (UserListDto, CreateUserDto, UpdateUserDto).

import type { UserStatus } from '@/features/auth/types';

export interface UserRole {
  id: number;
  name: string;
}

/** GET /api/Users (liste öğesi) ve GET /api/Users/{id} aynı alanları döner. */
export interface UserListItem {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneNumber: string | null;
  status: UserStatus;
  emailConfirmed: boolean;
  lastLoginDate: string | null;
  createdDate: string;
  tenantId: number | null;
  tenantName: string | null;
  mustChangePassword: boolean;
  roles: UserRole[];
}

export type UserDetail = UserListItem;

export interface UserListParams {
  searchTerm?: string;
  status?: UserStatus;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  /** sendInvitation true ise boş bırakılır; şifreyi kullanıcı davet e-postasından belirler. */
  password: string | null;
  sendInvitation: boolean;
  status: UserStatus;
  mustChangePassword: boolean;
  roleIds: number[];
}

export interface UpdateUserRequest {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  status: UserStatus;
  /** Gönderilmezse değişmez. Kullanıcı kendi hesabı için gönderemez (backend 403). */
  mustChangePassword?: boolean;
  roleIds: number[];
}

export interface RoleOption {
  id: number;
  name: string;
  description: string | null;
}
