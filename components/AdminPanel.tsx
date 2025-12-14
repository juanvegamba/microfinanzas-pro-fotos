
import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from '../firebase';
import { UserProfile, UserRole, UserStatus } from '../types';
import { ShieldCheck, Edit2, XCircle, CheckCircle, UserPlus, Save, X } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<UserProfile> & { password?: string }>({
    displayName: '',
    email: '',
    password: '',
    rol: 'usuario',
    region: 1,
    agencia: 1,
    status: 'activo'
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "usuarios"));
      const usersData: UserProfile[] = [];
      snapshot.forEach(doc => usersData.push(doc.data() as UserProfile));
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleStatusChange = async (uid: string, currentStatus: UserStatus) => {
    const newStatus = currentStatus === 'activo' ? 'bloqueado' : 'activo';
    try {
      await updateDoc(doc(db, "usuarios", uid), { status: newStatus });
      // Optimistic update
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
    } catch (error) {
      alert("Error al cambiar estado");
    }
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({
      displayName: '',
      email: '',
      password: '',
      rol: 'usuario',
      region: 1,
      agencia: 1,
      status: 'activo',
      jefemail: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      displayName: user.displayName,
      email: user.email,
      rol: user.rol,
      region: user.region,
      agencia: user.agencia,
      status: user.status,
      jefemail: user.jefemail
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user (Firestore only, auth email change is complex and usually separate)
        await updateDoc(doc(db, "usuarios", editingUser.uid), {
          displayName: formData.displayName,
          rol: formData.rol,
          region: formData.region,
          agencia: formData.agencia,
          jefemail: formData.jefemail,
          status: formData.status
        });
        alert("Usuario actualizado");
      } else {
        // Create New User using Secondary App (to avoid logging out admin)
        if (!formData.email || !formData.password) return alert("Email y contraseña requeridos");
        
        const secondaryApp = initializeApp(firebaseConfig, "Secondary");
        const secondaryAuth = getAuth(secondaryApp);
        
        try {
          const cred = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
          await setDoc(doc(db, "usuarios", cred.user.uid), {
             uid: cred.user.uid,
             displayName: formData.displayName,
             email: formData.email,
             rol: formData.rol,
             region: Number(formData.region),
             agencia: Number(formData.agencia),
             jefemail: formData.jefemail || '',
             status: formData.status
          });
          await signOut(secondaryAuth);
          alert("Usuario creado exitosamente");
        } catch (authError: any) {
           alert("Error creando usuario: " + authError.message);
           return; // Stop flow
        } finally {
           await deleteApp(secondaryApp);
        }
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error(error);
      alert("Error guardando datos");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
           <ShieldCheck className="w-6 h-6 mr-2 text-brand-primary" />
           Administración de Usuarios
        </h1>
        <button 
          onClick={openCreateModal}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center"
        >
           <UserPlus className="w-4 h-4 mr-2" />
           Crear Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full text-sm">
           <thead className="bg-gray-50 border-b">
             <tr>
               <th className="px-4 py-3 text-left">Nombre</th>
               <th className="px-4 py-3 text-left">Email</th>
               <th className="px-4 py-3 text-left">Rol</th>
               <th className="px-4 py-3 text-center">Región</th>
               <th className="px-4 py-3 text-center">Agencia</th>
               <th className="px-4 py-3 text-center">Estado</th>
               <th className="px-4 py-3 text-right">Acciones</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-200">
             {users.map(user => (
               <tr key={user.uid} className="hover:bg-gray-50">
                 <td className="px-4 py-3 font-medium">{user.displayName}</td>
                 <td className="px-4 py-3 text-gray-600">{user.email}</td>
                 <td className="px-4 py-3">
                   <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs uppercase font-bold">{user.rol}</span>
                 </td>
                 <td className="px-4 py-3 text-center">{user.region}</td>
                 <td className="px-4 py-3 text-center">{user.agencia}</td>
                 <td className="px-4 py-3 text-center">
                    {user.status === 'activo' ? 
                      <span className="text-green-600 flex justify-center"><CheckCircle className="w-4 h-4"/></span> :
                      user.status === 'pendiente' ? 
                      <span className="text-yellow-600 text-xs font-bold">PENDIENTE</span> :
                      <span className="text-red-600 flex justify-center"><XCircle className="w-4 h-4"/></span>
                    }
                 </td>
                 <td className="px-4 py-3 flex justify-end gap-2">
                    <button onClick={() => openEditModal(user)} className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="Editar">
                       <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleStatusChange(user.uid, user.status)} 
                      className={`${user.status === 'activo' ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'} p-1 rounded`}
                      title={user.status === 'activo' ? 'Bloquear' : 'Activar'}
                    >
                       {user.status === 'activo' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </button>
                 </td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
           <div className="bg-white p-6 rounded-lg w-full max-w-lg shadow-xl">
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                 <h3 className="text-lg font-bold">{editingUser ? 'Editar Usuario' : 'Crear Usuario'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold mb-1">Nombre</label>
                    <input type="text" required className="w-full p-2 border rounded" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold mb-1">Email</label>
                    <input type="email" required disabled={!!editingUser} className="w-full p-2 border rounded disabled:bg-gray-100" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                 </div>
                 {!editingUser && (
                    <div>
                        <label className="block text-xs font-bold mb-1">Contraseña</label>
                        <input type="password" required className="w-full p-2 border rounded" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>
                 )}
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold mb-1">Rol</label>
                        <select className="w-full p-2 border rounded" value={formData.rol} onChange={e => setFormData({...formData, rol: e.target.value as UserRole})}>
                           <option value="usuario">Usuario</option>
                           <option value="jefe_agencia">Jefe Agencia</option>
                           <option value="regional">Regional</option>
                           <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">Estado</label>
                        <select className="w-full p-2 border rounded" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as UserStatus})}>
                           <option value="activo">Activo</option>
                           <option value="pendiente">Pendiente</option>
                           <option value="bloqueado">Bloqueado</option>
                        </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold mb-1">Región (1-5)</label>
                        <select className="w-full p-2 border rounded" value={formData.region} onChange={e => setFormData({...formData, region: Number(e.target.value)})}>
                           {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold mb-1">Agencia (1-20)</label>
                        <select className="w-full p-2 border rounded" value={formData.agencia} onChange={e => setFormData({...formData, agencia: Number(e.target.value)})}>
                           {Array.from({length: 20}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold mb-1">Email Jefe Inmediato</label>
                    <input type="email" className="w-full p-2 border rounded" value={formData.jefemail} onChange={e => setFormData({...formData, jefemail: e.target.value})} />
                 </div>
                 <button type="submit" className="w-full bg-brand-primary text-white py-2 rounded font-bold flex justify-center items-center hover:bg-blue-800">
                    <Save className="w-4 h-4 mr-2" /> Guardar
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
