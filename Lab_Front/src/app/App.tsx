import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { People } from './components/People';
import { Materials } from './components/Materials';
import { Stock } from './components/Stock';
import { Projetos } from './components/Projetos';
import { ProjectDetails } from './components/ProjectDetails';
import { PersonDetails } from './components/PersonDetails';
import { ProjectBoard } from './components/ProjectBoard';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { useTheme } from '../hooks/useTheme';
import { Projeto, Aluno, Professor, Colaborador, User, authService, getStoredToken, getStoredUser, storeUser, removeToken, removeUser } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';

type ViewType = 
  | { type: 'dashboard' }
  | { type: 'people' }
  | { type: 'materials' }
  | { type: 'stock' }
  | { type: 'projetos' }
  | { type: 'project-details'; projeto: Projeto }
  | { type: 'person-details'; pessoa: (Aluno & { tipo: 'aluno' }) | (Professor & { tipo: 'professor' }) | (Colaborador & { tipo: 'colaborador' }) }
  | { type: 'project-board'; projeto: Projeto; returnTo: 'project-details' | 'projetos' };

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState<ViewType>({ type: 'dashboard' });
  const { isDark, toggleTheme } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const permissions = usePermissions(currentUser);

  const handleLogout = () => {
    removeToken();
    removeUser();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView({ type: 'dashboard' });
    setActiveTab('dashboard');
  };

  const refreshCurrentUser = async () => {
    const token = getStoredToken();
    if (!token) return;
    try {
      const me = await authService.getMe(token);
      storeUser(me);
      setCurrentUser(me);
    } catch (error: any) {
      // Se o erro for 401 (Unauthorized), fazer logout automático
      if (error?.message?.includes('Token inválido') || error?.message?.includes('401')) {
        handleLogout();
        return;
      }
      const user = getStoredUser();
      if (user) setCurrentUser(user);
    }
  };

  // Verificar autenticação ao montar o componente
  useEffect(() => {
    const token = getStoredToken();
    const user = getStoredUser();
    if (token && user) {
      setIsAuthenticated(true);
      setCurrentUser(user);
      refreshCurrentUser();
    }

    // Listener para logout automático quando token expira
    const handleAuthLogout = () => {
      handleLogout();
    };

    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, []);

  const handleLoginSuccess = async () => {
    await refreshCurrentUser();
    setIsAuthenticated(true);
  };

  // Sincroniza activeTab com currentView
  const handleTabChange = (tab: string) => {
    if (tab === 'people' && !permissions.canAccessPeople) return;
    setActiveTab(tab);
    switch (tab) {
      case 'dashboard':
        setCurrentView({ type: 'dashboard' });
        break;
      case 'people':
        setCurrentView({ type: 'people' });
        break;
      case 'materials':
        setCurrentView({ type: 'materials' });
        break;
      case 'stock':
        setCurrentView({ type: 'stock' });
        break;
      case 'projetos':
        setCurrentView({ type: 'projetos' });
        break;
    }
  };

  const handleViewProject = (projeto: Projeto) => {
    setCurrentView({ type: 'project-details', projeto });
  };

  const handleViewPerson = (pessoa: (Aluno & { tipo: 'aluno' }) | (Professor & { tipo: 'professor' }) | (Colaborador & { tipo: 'colaborador' })) => {
    setCurrentView({ type: 'person-details', pessoa });
  };

  const handleOpenProjectBoard = (projeto: Projeto, returnTo: 'project-details' | 'projetos' = 'projetos') => {
    setCurrentView({ type: 'project-board', projeto, returnTo });
  };

  const handleCloseProjectBoard = () => {
    if (currentView.type !== 'project-board') return;
    if (currentView.returnTo === 'project-details') {
      setCurrentView({ type: 'project-details', projeto: currentView.projeto });
    } else {
      setCurrentView({ type: 'projetos' });
      setActiveTab('projetos');
    }
  };

  const handleBackToList = () => {
    switch (currentView.type) {
      case 'project-details':
        setCurrentView({ type: 'projetos' });
        setActiveTab('projetos');
        break;
      case 'person-details':
        setCurrentView({ type: 'people' });
        setActiveTab('people');
        break;
      default:
        break;
    }
  };

  const renderContent = () => {
    switch (currentView.type) {
      case 'dashboard':
        return <Dashboard />;
      case 'people':
        return permissions.canAccessPeople ? (
          <People onViewPerson={handleViewPerson} currentUser={currentUser} />
        ) : (
          <Dashboard />
        );
      case 'materials':
        return <Materials currentUser={currentUser} />;
      case 'stock':
        return <Stock />;
      case 'projetos':
        return (
          <Projetos
            onViewProject={handleViewProject}
            onOpenProjectBoard={handleOpenProjectBoard}
            currentUser={currentUser}
          />
        );
      case 'project-details':
        return (
          <ProjectDetails
            projeto={currentView.projeto}
            onBack={handleBackToList}
            onOpenProjectBoard={() => handleOpenProjectBoard(currentView.projeto, 'project-details')}
            currentUser={currentUser}
          />
        );
      case 'person-details':
        return (
          <PersonDetails
            pessoa={currentView.pessoa}
            onBack={handleBackToList}
            onOpenProjects={() => {
              setCurrentView({ type: 'projetos' });
              setActiveTab('projetos');
            }}
          />
        );
      case 'project-board':
        return (
          <ProjectBoard
            projeto={currentView.projeto}
            membros={[currentView.projeto.coordenador, ...(currentView.projeto.membros?.split(',').map(m => m.trim()).filter(Boolean) || [])]}
            onClose={handleCloseProjectBoard}
            currentUser={currentUser}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={handleTabChange} 
        isDark={isDark} 
        toggleTheme={toggleTheme}
        onLogout={isAuthenticated ? handleLogout : undefined}
        currentUser={currentUser}
        isAuthenticated={isAuthenticated}
      />

      <main className="flex-1 overflow-auto">
        {!isAuthenticated ? (
          authView === 'login' ? (
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
              <Login 
                onLoginSuccess={handleLoginSuccess} 
                onSwitchToRegister={() => setAuthView('register')} 
              />
            </div>
          ) : (
            <div className="p-6 lg:p-8 max-w-7xl mx-auto">
              <Register 
                onRegisterSuccess={handleLoginSuccess} 
                onSwitchToLogin={() => setAuthView('login')} 
              />
            </div>
          )
        ) : (
          <div className="p-6 lg:p-8 max-w-7xl mx-auto">
            {renderContent()}
          </div>
        )}
      </main>
    </div>
  );
}