
import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Landmark, AlertCircle, Loader2 } from 'lucide-react';

const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [jefemail, setJefemail] = useState('');
  const [region, setRegion] = useState('1');
  const [agencia, setAgencia] = useState('1');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;
      
      // Check Status in Firestore
      const userDoc = await getDoc(doc(db, "usuarios", uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status !== 'activo') {
          // If status is not active, force sign out
          await signOut(auth);
          setError('Tu cuenta está pendiente de aprobación por un administrador o ha sido bloqueada.');
        }
      } else {
          // Edge case: Auth exists but Firestore doc missing
          await signOut(auth);
          setError('No se encontró el perfil de usuario. Contacte soporte.');
      }

    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión. Verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Create Firestore Document with Default Roles
      await setDoc(doc(db, "usuarios", uid), {
        uid,
        displayName,
        email,
        rol: 'usuario', // Default
        region: parseInt(region),
        agencia: parseInt(agencia),
        jefemail,
        status: 'pendiente' // Default
      });

      // IMPORTANT: Sign out immediately because status is pending.
      // We do this BEFORE alerting/resetting UI to ensure clean state.
      await signOut(auth);
      
      setLoading(false);
      alert("Registro exitoso. Su cuenta está pendiente de aprobación por un administrador.");
      setIsRegistering(false); // Switch back to login view

    } catch (err: any) {
      console.error(err);
      setLoading(false);
      setError(err.message || 'Error al registrarse.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-brand-primary p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">MicroFinanzas Pro</h1>
          <p className="text-blue-200 mt-2">Sistema de Evaluación Crediticia</p>
        </div>

        <div className="p-8">
          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              className={`flex-1 pb-2 text-sm font-medium ${!isRegistering ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500'}`}
              onClick={() => setIsRegistering(false)}
            >
              Iniciar Sesión
            </button>
            <button
              className={`flex-1 pb-2 text-sm font-medium ${isRegistering ? 'border-b-2 border-brand-primary text-brand-primary' : 'text-gray-500'}`}
              onClick={() => setIsRegistering(true)}
            >
              Registrarse
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            
            {isRegistering && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                required
                className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email del Jefe Inmediato</label>
                  <input
                    type="email"
                    required
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary"
                    value={jefemail}
                    onChange={e => setJefemail(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Región</label>
                    <select 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary"
                      value={region}
                      onChange={e => setRegion(e.target.value)}
                    >
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Agencia</label>
                    <select 
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-brand-primary"
                      value={agencia}
                      onChange={e => setAgencia(e.target.value)}
                    >
                      {Array.from({length: 20}, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-brand-primary hover:bg-blue-800 text-white font-bold rounded transition-colors flex justify-center items-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegistering ? 'Crear Cuenta' : 'Ingresar')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
