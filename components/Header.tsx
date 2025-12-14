
import React from 'react';
import { ChevronLeft, Landmark, User, LogOut, Save, Wifi, WifiOff } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  onSave?: () => void;
  onBack?: () => void;
  onLogout?: () => void;
  user?: UserProfile | null;
  title?: string;
  isOnline?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSave, onBack, onLogout, user, title = "MicroFinanzas Pro", isOnline = true }) => {
  return (
    <header className="bg-brand-primary text-white shadow-md sticky top-0 z-50 print:hidden w-full">
      <div className="max-w-full mx-auto px-4 h-16 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-2 md:space-x-6">
          {onBack ? (
            <button 
              onClick={onBack}
              className="flex items-center text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden md:inline">Volver</span>
            </button>
          ) : (
            <div className="w-4 h-4"></div> // Spacer
          )}
          
          <div className="h-6 w-px bg-gray-600 mx-2 hidden md:block"></div>
          
          <div className="flex items-center font-bold text-lg tracking-wide truncate">
            <Landmark className="w-6 h-6 mr-2 shrink-0" />
            <span className="truncate">{title}</span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Connection Status */}
          <div className="flex items-center" title={isOnline ? "En línea" : "Sin conexión"}>
             {isOnline ? (
               <Wifi className="w-4 h-4 text-green-400 opacity-80" />
             ) : (
               <div className="flex items-center bg-red-600 px-2 py-1 rounded-full animate-pulse">
                 <WifiOff className="w-3 h-3 mr-1 text-white" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
               </div>
             )}
          </div>

          {onSave && (
            <button 
              onClick={onSave}
              className="flex items-center px-3 py-2 rounded-md border border-blue-400 bg-blue-800/50 hover:bg-blue-700 text-sm font-medium transition-colors"
              title="Guardar Borrador"
            >
              <Save className="w-5 h-5 md:w-4 md:h-4 md:mr-2" />
              <span className="hidden md:inline">Guardar Borrador</span>
            </button>
          )}

          {onLogout && (
            <button 
              onClick={onLogout}
              className="flex items-center px-3 py-2 rounded-md bg-brand-accent hover:bg-red-700 text-sm font-medium transition-colors shadow-sm"
              title="Salir"
            >
              <LogOut className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Salir</span>
            </button>
          )}

          <div className="h-8 w-px bg-gray-600 mx-1 md:mx-2"></div>

          <div className="flex items-center space-x-2 bg-blue-800 py-1.5 px-3 rounded-full">
            <User className="w-4 h-4 text-gray-300" />
            <span className="text-sm font-medium hidden md:inline">
              {user ? user.displayName : 'Usuario'}
            </span>
             {user && (
              <span className="text-[10px] bg-blue-900 px-1.5 py-0.5 rounded uppercase text-gray-300 border border-blue-700">
                {user.rol === 'jefe_agencia' ? 'Jefe' : user.rol === 'usuario' ? 'Oficial' : user.rol}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
