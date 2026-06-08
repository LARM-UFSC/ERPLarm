import { User } from '../services/api';

export type UserRole = 'aluno' | 'professor' | 'colaborador';

export function getRole(user: User | null | undefined): UserRole | null {
  if (!user?.tipo_usuario) return null;
  return user.tipo_usuario as UserRole;
}

export function usePermissions(user: User | null | undefined) {
  const role = getRole(user);

  return {
    role,
    isAluno: role === 'aluno',
    isProfessor: role === 'professor',
    isColaborador: role === 'colaborador',
    userNome: user?.nome || '',

    canAccessPeople: role === 'professor',
    canManagePeople: role === 'professor',
    canViewMaterials: !!role,
    canManageMaterials: role === 'professor' || role === 'colaborador',
    canViewStock: !!role,
    canManageProjects: role === 'professor',
    canViewAllProjects: role === 'professor' || role === 'colaborador',
    canCreateActivity: role === 'professor' || role === 'aluno' || role === 'colaborador',
    canAssignActivityToOthers: role === 'professor' || role === 'colaborador',
  };
}

export function canEditActivity(
  user: User | null | undefined,
  responsavel?: string
): boolean {
  const role = getRole(user);
  if (!role) return false;
  if (role === 'professor' || role === 'colaborador') return true;
  if (role === 'aluno') {
    const nome = user?.nome || '';
    return !responsavel || responsavel.trim() === nome;
  }
  return false;
}

export function canDeleteActivity(
  user: User | null | undefined,
  responsavel?: string
): boolean {
  const role = getRole(user);
  if (!role) return false;
  if (role === 'professor') return true;
  if (role === 'aluno') {
    const nome = user?.nome || '';
    return !!responsavel && responsavel.trim() === nome;
  }
  return false;
}
