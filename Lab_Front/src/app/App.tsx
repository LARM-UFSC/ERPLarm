import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { People } from './components/People';
import { Materials } from './components/Materials';
import { Stock } from './components/Stock';
import { Projetos } from './components/Projetos';
import { ProjectDetails } from './components/ProjectDetails';
import { PersonDetails } from './components/PersonDetails';
import { ProjectBoard } from './components/ProjectBoard';
import { useTheme } from '../hooks/useTheme';
import { Projeto, Aluno, Professor, Colaborador } from '../services/api';

type ViewType = 
  | { type: 'dashboard' }
  | { type: 'people' }
  | { type: 'materials' }
  | { type: 'stock' }
  | { type: 'projetos' }
  | { type: 'project-details'; projeto: Projeto }
  | { type: 'person-details'; pessoa: (Aluno & { tipo: 'aluno' }) | (Professor & { tipo: 'professor' }) | (Colaborador & { tipo: 'colaborador' }) }
  | { type: 'project-board'; projeto: Projeto };

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentView, setCurrentView] = useState<ViewType>({ type: 'dashboard' });
  const { isDark, toggleTheme } = useTheme();

  // Sincroniza activeTab com currentView
  const handleTabChange = (tab: string) => {
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

  const handleOpenProjectBoard = (projeto: Projeto) => {
    setCurrentView({ type: 'project-board', projeto });
  };

  const handleBackToList = () => {
    switch (currentView.type) {
      case 'project-details':
      case 'project-board':
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
        return <People onViewPerson={handleViewPerson} />;
      case 'materials':
        return <Materials />;
      case 'stock':
        return <Stock />;
      case 'projetos':
        return <Projetos onViewProject={handleViewProject} onOpenProjectBoard={handleOpenProjectBoard} />;
      case 'project-details':
        return (
          <ProjectDetails
            projeto={currentView.projeto}
            onBack={handleBackToList}
            onOpenProjectBoard={() => handleOpenProjectBoard(currentView.projeto)}
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
            onClose={handleBackToList}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} isDark={isDark} toggleTheme={toggleTheme} />

      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}