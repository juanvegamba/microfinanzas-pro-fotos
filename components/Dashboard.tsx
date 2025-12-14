import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, ApplicationSummary } from '../types';
import { Search, PlusCircle, FileText, Calendar, User } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onCreateNew: () => void;
  onSelectApplication: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onCreateNew, onSelectApplication }) => {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [filteredApps, setFilteredApps] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        let q;
        const appsRef = collection(db, "applications");

        // Hierarchy Logic
        if (user.rol === 'admin') {
          q = query(appsRef, orderBy("lastModified", "desc"), limit(100));
        } else if (user.rol === 'regional') {
          q = query(appsRef, where("userRegion", "==", user.region));
        } else if (user.rol === 'jefe_agencia') {
          q = query(appsRef, where("userAgency", "==", user.agencia));
        } else {
          // Usuario normal
          // Assuming we store userId in the application document as 'userId'
          // If creating new app, we must ensure this field is saved (See App.tsx changes)
          // For demo purposes, using a broad query might be safer if userId isn't populated yet on old records, 
          // but per prompt instructions we use the logic.
          // Note: Compound queries might need index in Firestore console.
          q = query(appsRef, where("userId", "==", user.uid));
        }

        const querySnapshot = await getDocs(q);
        const apps: ApplicationSummary[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          apps.push({
            id: doc.id,
            fullName: data.fullName || 'Sin Nombre',
            identityDocument: data.identityDocument || '---',
            loanAmount: data.loanAmount || 0,
            date: data.lastModified ? new Date(data.lastModified).toLocaleDateString() : '---',
            status: data.review?.committeeDecision || 'En Proceso',
            userId: data.userId,
            userRegion: data.userRegion,
            userAgency: data.userAgency
          });
        });

        // Client side sort for non-admin queries to avoid index issues initially
        if (user.rol !== 'admin') {
           apps.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        setApplications(apps);
        setFilteredApps(apps);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [user]);

  // Search Logic
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredApps(applications);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = applications.filter(app => 
        app.fullName.toLowerCase().includes(lowerTerm) || 
        app.identityDocument.includes(lowerTerm)
      );
      setFilteredApps(filtered);
    }
  }, [searchTerm, applications]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel Principal</h1>
          <p className="text-gray-500">Bienvenido, {user.displayName}</p>
        </div>
        <button 
          onClick={onCreateNew}
          className="bg-brand-primary hover:bg-blue-800 text-white px-4 py-2 rounded-md flex items-center font-medium transition-colors shadow-sm"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Nueva Solicitud
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar por Nombre del Cliente o DPI/ID..." 
            className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="font-semibold text-gray-700">Solicitudes de Crédito Recientes</h2>
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {filteredApps.length} Resultados
          </span>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando solicitudes...</div>
        ) : filteredApps.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No se encontraron solicitudes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Cliente</th>
                  <th className="px-6 py-3">DPI / ID</th>
                  <th className="px-6 py-3">Monto</th>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Estado</th>
                  <th className="px-6 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                       <User className="w-4 h-4 mr-2 text-gray-400"/>
                       {app.fullName}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{app.identityDocument}</td>
                    <td className="px-6 py-4 font-medium text-green-700">Q {app.loanAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-500 flex items-center">
                      <Calendar className="w-3 h-3 mr-1"/>
                      {app.date}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        app.status === 'Aprobado' ? 'bg-green-100 text-green-800' :
                        app.status === 'Rechazado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {/* For this demo, selecting implies editing/viewing. Usually split by permission */}
                       <button 
                         onClick={() => onSelectApplication(app.id)} // In a real app, verify edit permissions
                         className="text-blue-600 hover:text-blue-800 font-medium text-xs flex items-center justify-end ml-auto"
                       >
                         <FileText className="w-4 h-4 mr-1"/>
                         Ver / Editar
                       </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;