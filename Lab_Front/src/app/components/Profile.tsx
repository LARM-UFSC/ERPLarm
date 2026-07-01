import { useState, useEffect } from 'react';
import { User } from '../../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { UserCircle, Mail, Phone, GraduationCap, IdCard, Edit2, Check, X, Camera, Upload } from 'lucide-react';

interface ProfileProps {
  currentUser: User | null;
  onUpdateUser: (user: User) => void;
}

interface ProfileData {
  nome: string;
  email: string;
  telefone?: string;
  matricula?: string;
  curso?: string;
  cpf?: string;
  foto_perfil?: string;
}

export function Profile({ currentUser, onUpdateUser }: ProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData>({
    nome: '',
    email: '',
    telefone: '',
    matricula: '',
    curso: '',
    cpf: '',
    foto_perfil: '',
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (currentUser) {
      // Buscar dados completos do perfil
      fetchProfileData();
    }
  }, [currentUser]);

  const fetchProfileData = async () => {
    if (!currentUser) return;

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';

      if (currentUser.tipo_usuario === 'aluno') {
        endpoint = `/alunos/${currentUser.perfil_id}`;
      } else if (currentUser.tipo_usuario === 'professor') {
        endpoint = `/professores/${currentUser.perfil_id}`;
      } else if (currentUser.tipo_usuario === 'colaborador') {
        endpoint = `/colaboradores/${currentUser.perfil_id}`;
      } else if (currentUser.tipo_usuario === 'administrador') {
        endpoint = `/administradores/${currentUser.perfil_id}`;
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do perfil');
      }

      const data = await response.json();
      setProfileData({
        nome: data.nome || '',
        email: currentUser.email,
        telefone: data.telefone || '',
        matricula: data.matricula || '',
        curso: data.curso || '',
        cpf: data.cpf || '',
        foto_perfil: data.foto_perfil || '',
      });
    } catch (err) {
      console.error('Erro ao buscar perfil:', err);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('http://localhost:8000/upload-foto-perfil', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro ao fazer upload da foto (Status: ${response.status})`);
      }

      const data = await response.json();
      setProfileData({ ...profileData, foto_perfil: data.foto_url });
      setSuccess('Foto enviada com sucesso! Salve as alterações para aplicar.');
    } catch (err) {
      console.error('Erro ao fazer upload:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload da foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let updateData: any = {};

      // Campos editáveis por todos
      updateData.nome = profileData.nome;
      updateData.telefone = profileData.telefone;
      updateData.foto_perfil = profileData.foto_perfil;

      // Campos específicos por tipo
      if (currentUser.tipo_usuario === 'aluno') {
        endpoint = `/alunos/${currentUser.perfil_id}`;
        updateData.matricula = profileData.matricula;
        updateData.curso = profileData.curso;
      } else if (currentUser.tipo_usuario === 'professor') {
        endpoint = `/professores/${currentUser.perfil_id}`;
        updateData.matricula = profileData.matricula;
      } else if (currentUser.tipo_usuario === 'colaborador') {
        endpoint = `/colaboradores/${currentUser.perfil_id}`;
        updateData.cpf = profileData.cpf;
      } else if (currentUser.tipo_usuario === 'administrador') {
        endpoint = `/administradores/${currentUser.perfil_id}`;
        updateData.cpf = profileData.cpf;
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Erro ao atualizar perfil (Status: ${response.status})`);
      }

      setSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);

      // Atualizar usuário local
      onUpdateUser({
        ...currentUser,
        nome: profileData.nome,
        foto_perfil: profileData.foto_perfil,
      });

      // Atualizar localStorage
      localStorage.setItem('user', JSON.stringify({
        ...currentUser,
        nome: profileData.nome,
        foto_perfil: profileData.foto_perfil,
      }));
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError(err instanceof Error ? err.message : 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    fetchProfileData();
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2>Perfil</h2>
        <p className="text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        {/* Profile Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              {profileData.foto_perfil ? (
                <img
                  src={`http://localhost:8000${profileData.foto_perfil}`}
                  alt="Foto de perfil"
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-500"
                />
              ) : (
                <UserCircle size={64} className="text-green-500" strokeWidth={1.5} />
              )}
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
            </div>
            <div>
              <h3 className="text-xl font-semibold">{profileData.nome}</h3>
              <p className="text-sm text-muted-foreground capitalize">{currentUser.tipo_usuario}</p>
              <p className="text-sm text-muted-foreground">{profileData.email}</p>
            </div>
          </div>
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Edit2 size={16} className="mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={loading}
              >
                <X size={16} className="mr-2" />
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? 'Salvando...' : (
                  <>
                    <Check size={16} className="mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="nome" className="flex items-center gap-2">
              <UserCircle size={16} />
              Nome Completo
            </Label>
            <Input
              id="nome"
              value={profileData.nome}
              onChange={(e) => setProfileData({ ...profileData, nome: e.target.value })}
              disabled={!isEditing}
              className={isEditing ? '' : 'bg-gray-50 dark:bg-gray-700'}
            />
          </div>

          {/* Email - não editável */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail size={16} />
              Email
            </Label>
            <Input
              id="email"
              value={profileData.email}
              disabled
              className="bg-gray-50 dark:bg-gray-700"
            />
            <p className="text-xs text-gray-500">Email não pode ser alterado</p>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="flex items-center gap-2">
              <Phone size={16} />
              Telefone
            </Label>
            <Input
              id="telefone"
              value={profileData.telefone}
              onChange={(e) => setProfileData({ ...profileData, telefone: e.target.value })}
              disabled={!isEditing}
              placeholder="(00) 00000-0000"
              className={isEditing ? '' : 'bg-gray-50 dark:bg-gray-700'}
            />
          </div>

          {/* Campos específicos por tipo */}
          {(currentUser.tipo_usuario === 'aluno' || currentUser.tipo_usuario === 'professor') && (
            <div className="space-y-2">
              <Label htmlFor="matricula" className="flex items-center gap-2">
                <IdCard size={16} />
                Matrícula
              </Label>
              <Input
                id="matricula"
                value={profileData.matricula}
                onChange={(e) => setProfileData({ ...profileData, matricula: e.target.value })}
                disabled={!isEditing}
                className={isEditing ? '' : 'bg-gray-50 dark:bg-gray-700'}
              />
            </div>
          )}

          {currentUser.tipo_usuario === 'aluno' && (
            <div className="space-y-2">
              <Label htmlFor="curso" className="flex items-center gap-2">
                <GraduationCap size={16} />
                Curso
              </Label>
              <Input
                id="curso"
                value={profileData.curso}
                onChange={(e) => setProfileData({ ...profileData, curso: e.target.value })}
                disabled={!isEditing}
                className={isEditing ? '' : 'bg-gray-50 dark:bg-gray-700'}
              />
            </div>
          )}

          {(currentUser.tipo_usuario === 'colaborador' || currentUser.tipo_usuario === 'administrador') && (
            <div className="space-y-2">
              <Label htmlFor="cpf" className="flex items-center gap-2">
                <IdCard size={16} />
                CPF
              </Label>
              <Input
                id="cpf"
                value={profileData.cpf}
                onChange={(e) => setProfileData({ ...profileData, cpf: e.target.value })}
                disabled={!isEditing}
                placeholder="000.000.000-00"
                className={isEditing ? '' : 'bg-gray-50 dark:bg-gray-700'}
              />
            </div>
          )}
        </div>

        {/* Upload de Foto */}
        {isEditing && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <Label htmlFor="foto-upload" className="flex items-center gap-2 cursor-pointer">
              <Camera size={16} />
              Foto de Perfil
            </Label>
            <Input
              id="foto-upload"
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              disabled={uploadingPhoto}
              className="mt-2"
            />
            {uploadingPhoto && (
              <p className="text-sm text-muted-foreground mt-2">Enviando foto...</p>
            )}
          </div>
        )}

        {/* Informações de conta */}
        <div className="mt-8 pt-6 border-t border-border">
          <h3 className="text-lg font-semibold mb-4">Informações da Conta</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground">Tipo de Usuário</p>
              <p className="font-medium capitalize">{currentUser.tipo_usuario}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground">ID do Perfil</p>
              <p className="font-medium">{currentUser.perfil_id || 'N/A'}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground">ID do Usuário</p>
              <p className="font-medium">{currentUser.id}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
