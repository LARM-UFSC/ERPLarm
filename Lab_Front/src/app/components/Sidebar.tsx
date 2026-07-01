import { LayoutDashboard, Package, Warehouse, Menu, X, UserCircle, FolderKanban, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { useState, useMemo } from 'react';
import { User } from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onLogout?: () => void;
  currentUser?: User | null;
  isAuthenticated?: boolean;
}

export function Sidebar({ activeTab, setActiveTab, isDark, toggleTheme, onLogout, currentUser, isAuthenticated = true }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const permissions = usePermissions(currentUser);

  const menuItems = useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      // Apenas administrador pode ver Pessoas, Materiais e Estoque
      ...(permissions.isAdministrador
        ? [
            { id: 'people', label: 'Pessoas', icon: UserCircle },
            { id: 'materials', label: 'Materiais', icon: Package },
            { id: 'stock', label: 'Estoque', icon: Warehouse },
          ]
        : []),
      // Todos podem ver Projetos
      { id: 'projetos', label: 'Projetos', icon: FolderKanban },
      // Todos podem ver Perfil - usar foto de perfil se disponível
      { id: 'profile', label: 'Perfil', icon: UserIcon, isProfile: true },
    ];
    return items;
  }, [permissions.isAdministrador]);

  return (
    <>
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-primary text-primary-foreground rounded-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="flex items-center gap-2 text-sidebar-foreground">
            <Package className="text-sidebar-primary" size={28} />
            LARM Materiais
          </h1>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileOpen(false);
                    }}
                    disabled={!isAuthenticated}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent'
                    } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {item.isProfile && currentUser?.foto_perfil ? (
                      <img
                        src={`http://localhost:8000${currentUser.foto_perfil}`}
                        alt="Foto de perfil"
                        className="w-5 h-5 rounded-full object-cover border-2 border-green-500"
                      />
                    ) : (
                      <Icon size={20} />
                    )}
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Theme Toggle */}
        <div className="p-4 mt-auto border-t border-sidebar-border">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
            <span>{isDark ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>
        </div>

        {/* User Info & Logout */}
        {isAuthenticated && currentUser && (
          <div className="p-4 border-t border-sidebar-border">
            <div className="mb-3 px-4 flex items-center gap-3">
              <div className="relative">
                {currentUser.foto_perfil ? (
                  <img
                    src={`http://localhost:8000${currentUser.foto_perfil}`}
                    alt="Foto de perfil"
                    className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                  />
                ) : (
                  <UserCircle size={40} className="text-green-500" strokeWidth={2} />
                )}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-sidebar"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {currentUser.email}
                </p>
                <p className="text-xs text-sidebar-foreground/80">
                  {currentUser.nome ? currentUser.nome.split(' ')[0] : ''}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 capitalize font-medium">
                  {currentUser.tipo_usuario}
                </p>
              </div>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut size={20} />
                <span>Sair</span>
              </button>
            )}
          </div>
        )}
      </aside>

      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
