import { User } from '../services/api';

export type UserRole = 'aluno' | 'professor' | 'colaborador' | 'administrador';

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
    isAdministrador: role === 'administrador',
    userNome: user?.nome || '',

    // Acesso a pessoas: apenas administrador
    canAccessPeople: role === 'administrador',
    canManagePeople: role === 'administrador',

    // Materiais: apenas administrador pode gerenciar
    canViewMaterials: !!role,
    canManageMaterials: role === 'administrador',
    canViewStock: !!role,

    // Projetos: administrador pode tudo, professor/colaborador podem criar/editar mas não deletar
    canManageProjects: role === 'administrador' || role === 'professor' || role === 'colaborador',
    canDeleteProjects: role === 'administrador',
    canViewAllProjects: role === 'administrador',

    // Atividades: aluno pode criar/editar as suas, professor/colaborador podem gerenciar se forem coordenadores
    canCreateActivity: !!role,
    canAssignActivityToOthers: role === 'administrador',
  };
}

export function canEditActivity(
  user: User | null | undefined,
  responsavel?: string,
  isCoordenador?: boolean
): boolean {
  const role = getRole(user);
  if (!role) return false;

  // Administrador pode editar qualquer atividade
  if (role === 'administrador') return true;

  // Professor/colaborador só podem editar se forem coordenadores
  if (role === 'professor' || role === 'colaborador') {
    return isCoordenador === true;
  }

  // Aluno só pode editar se for o responsável
  if (role === 'aluno') {
    const nome = user?.nome || '';
    return !responsavel || responsavel.trim() === nome;
  }

  return false;
}

export function canDeleteActivity(
  user: User | null | undefined,
  responsavel?: string,
  isCoordenador?: boolean
): boolean {
  const role = getRole(user);
  if (!role) return false;

  // Administrador pode deletar qualquer atividade
  if (role === 'administrador') return true;

  // Professor/colaborador só podem deletar se forem coordenadores
  if (role === 'professor' || role === 'colaborador') {
    return isCoordenador === true;
  }

  // Aluno só pode deletar se for o responsável
  if (role === 'aluno') {
    const nome = user?.nome || '';
    return !!responsavel && responsavel.trim() === nome;
  }

  return false;
}
