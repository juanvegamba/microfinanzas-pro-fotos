
import React from 'react';
import { UserCheck, Users, ClipboardCheck, MessageSquare, ThumbsUp, ThumbsDown, Plus, Trash2, BarChart3 } from 'lucide-react';
import { ClientData, PersonalReference } from '../types';

interface SectionSixProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
}

const SectionSix: React.FC<SectionSixProps> = ({ data, updateData }) => {

  // --- REFERENCE HELPERS ---
  const addReference = () => {
    const newItem: PersonalReference = {
      id: Date.now().toString(),
      fullName: '',
      relationship: '',
      phone: '',
      status: '',
      comments: ''
    };
    updateData('personalReferences', [...data.personalReferences, newItem]);
  };

  const updateReference = (id: string, field: keyof PersonalReference, value: any) => {
    updateData('personalReferences', data.personalReferences.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeReference = (id: string) => {
    updateData('personalReferences', data.personalReferences.filter(i => i.id !== id));
  };

  // --- CALCULATIONS ---
  const totalCharacterScore = 
    data.characterRefScore + 
    data.characterPayHistoryScore + 
    data.characterInformalDebtsScore + 
    data.characterTransparencyScore;
  
  const maxPossibleScore = 3 + 3 + 2 + 3; // 11
  const scorePercentage = Math.max(0, (totalCharacterScore / maxPossibleScore) * 100);

  // Gauge Color Logic
  let gaugeColor = 'text-red-500';
  let gaugeLabel = 'Bajo';
  if (scorePercentage >= 80) {
    gaugeColor = 'text-green-500';
    gaugeLabel = 'Excelente';
  } else if (scorePercentage >= 60) {
    gaugeColor = 'text-blue-500';
    gaugeLabel = 'Bueno';
  } else if (scorePercentage >= 40) {
    gaugeColor = 'text-yellow-500';
    gaugeLabel = 'Regular';
  }

  const strokeDashArray = `${(scorePercentage / 100) * 126} 126`;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Sección 6. Carácter y Reputación
        </h2>
        <p className="text-gray-500 mt-1">Voluntad de pago y referencias</p>
      </div>

      {/* 1. Evaluación Cuantitativa del Carácter */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-brand-primary mb-6 flex items-center">
          <ClipboardCheck className="w-5 h-5 mr-2" />
          Evaluación Cuantitativa del Carácter
        </h3>

        <div className="space-y-6">
          
          <div className="border-b border-gray-100 pb-4">
             <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-bold text-gray-800">a) Calidad de Referencias Personales y Comerciales</label>
               <span className={`font-bold text-sm ${data.characterRefScore < 0 ? 'text-red-600' : 'text-blue-600'}`}>{data.characterRefScore} pts</span>
             </div>
             <select 
               className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
               value={data.characterRefScore}
               onChange={(e) => updateData('characterRefScore', parseInt(e.target.value))}
             >
               <option value={0}>Seleccione una opción...</option>
               <option value={3}>3 Puntos: Buenas referencias</option>
               <option value={1}>1 Punto: Referencias regulares</option>
               <option value={0}>0 Puntos: Sin referencias / No cooperan</option>
               <option value={-10}>-10 Puntos: Malas referencias</option>
             </select>
          </div>

          <div className="border-b border-gray-100 pb-4">
             <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-bold text-gray-800">b) Historial de Pagos</label>
               <span className={`font-bold text-sm ${data.characterPayHistoryScore < 0 ? 'text-red-600' : 'text-blue-600'}`}>{data.characterPayHistoryScore} pts</span>
             </div>
             <select 
               className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
               value={data.characterPayHistoryScore}
               onChange={(e) => updateData('characterPayHistoryScore', parseInt(e.target.value))}
             >
               <option value={0}>Seleccione una opción...</option>
               <option value={3}>3 Puntos: Sin Atrasos</option>
               <option value={2}>2 Puntos: Atrasos &lt; 5 días</option>
               <option value={1}>1 Punto: Atrasos &lt; 15 días</option>
               <option value={-5}>-5 Puntos: Atrasos hasta 30 días</option>
               <option value={-10}>-10 Puntos: Atrasos &gt; 30 días</option>
             </select>
          </div>

          <div className="border-b border-gray-100 pb-4">
             <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-bold text-gray-800">c) Manejo de Deudas Informales</label>
               <span className={`font-bold text-sm ${data.characterInformalDebtsScore < 0 ? 'text-red-600' : 'text-blue-600'}`}>{data.characterInformalDebtsScore} pts</span>
             </div>
             <select 
               className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
               value={data.characterInformalDebtsScore}
               onChange={(e) => updateData('characterInformalDebtsScore', parseInt(e.target.value))}
             >
               <option value={0}>Seleccione una opción...</option>
               <option value={2}>2 Puntos: No maneja deudas informales</option>
               <option value={-3}>-3 Puntos: Sí maneja deudas informales</option>
             </select>
          </div>

          <div>
             <div className="flex justify-between items-center mb-2">
               <label className="block text-sm font-bold text-gray-800">d) Transparencia y Colaboración en Entrevista</label>
               <span className={`font-bold text-sm ${data.characterTransparencyScore < 0 ? 'text-red-600' : 'text-blue-600'}`}>{data.characterTransparencyScore} pts</span>
             </div>
             <select 
               className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
               value={data.characterTransparencyScore}
               onChange={(e) => updateData('characterTransparencyScore', parseInt(e.target.value))}
             >
               <option value={0}>Seleccione una opción...</option>
               <option value={3}>3 Puntos: Brinda toda la información</option>
               <option value={1}>1 Punto: Brinda parte de la información</option>
               <option value={-3}>-3 Puntos: No quiere dar información</option>
               <option value={-5}>-5 Puntos: No es transparente</option>
             </select>
          </div>

          <div className="bg-gray-50 p-3 rounded-md flex justify-between items-center border-t-2 border-gray-200 mt-4">
             <span className="font-bold text-gray-700">Total Puntos Evaluación Cuantitativa:</span>
             <span className={`text-xl font-bold ${totalCharacterScore < 0 ? 'text-red-600' : 'text-brand-primary'}`}>
                {totalCharacterScore} / {maxPossibleScore}
             </span>
          </div>
        </div>
      </div>

      {/* 2. Referencias Personales */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Referencias Personales
        </h3>
        <div className="space-y-6">
           {data.personalReferences.map((ref) => (
              <div key={ref.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={ref.fullName} onChange={(e) => updateReference(ref.id, 'fullName', e.target.value)} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Parentesco / Relación</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={ref.relationship} onChange={(e) => updateReference(ref.id, 'relationship', e.target.value)} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={ref.phone} onChange={(e) => updateReference(ref.id, 'phone', e.target.value)} />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3 items-start">
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Resultado Referencia</label>
                       <div className="flex space-x-2">
                          {(['Buena', 'Regular', 'Mala'] as const).map((status) => (
                             <button
                                key={status}
                                type="button"
                                onClick={() => updateReference(ref.id, 'status', status)}
                                className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
                                   ref.status === status
                                   ? status === 'Buena' ? 'bg-green-100 border-green-500 text-green-700 font-bold'
                                   : status === 'Regular' ? 'bg-yellow-100 border-yellow-500 text-yellow-700 font-bold'
                                   : 'bg-red-100 border-red-500 text-red-700 font-bold'
                                   : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                                }`}
                             >
                                {status}
                             </button>
                          ))}
                       </div>
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-xs font-medium text-gray-700 mb-1">Comentarios</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          placeholder="Comentarios de la llamada..."
                          value={ref.comments} onChange={(e) => updateReference(ref.id, 'comments', e.target.value)} />
                    </div>
                 </div>
                 
                 <div className="flex justify-end">
                    <button onClick={() => removeReference(ref.id)} className="text-red-500 text-xs flex items-center hover:underline">
                       <Trash2 className="w-3 h-3 mr-1" /> Eliminar Referencia
                    </button>
                 </div>
              </div>
           ))}
           <button onClick={addReference} className="text-sm text-brand-secondary font-medium hover:underline flex items-center">
             <Plus className="w-4 h-4 mr-1" /> Agregar Referencia
           </button>
        </div>
      </div>

      {/* 3. Resumen y Observaciones */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Resumen y Observaciones de 'Carácter'
        </h3>

        <div className="flex flex-col md:flex-row gap-8 items-center mb-8 border-b border-gray-100 pb-6">
          <div className="relative w-48 h-32 flex justify-center overflow-hidden shrink-0">
            <div className="absolute w-40 h-40 bg-gray-200 rounded-full top-0"></div>
            <div className="absolute w-32 h-32 bg-white rounded-full top-4 z-10 flex items-end justify-center pb-4">
                <div className="text-center">
                    <span className={`text-3xl font-bold ${gaugeColor}`}>{totalCharacterScore}</span>
                    <span className="text-sm text-gray-400 font-medium"> / {maxPossibleScore}</span>
                    <p className="text-xs text-gray-500 mt-1">Carácter</p>
                </div>
            </div>
             <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full z-0 transform scale-[0.85] origin-bottom">
               <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
               <path 
                  d="M 10 50 A 40 40 0 0 1 90 50" 
                  fill="none" 
                  className={gaugeColor}
                  stroke="currentColor" 
                  strokeWidth="10" 
                  strokeDasharray={strokeDashArray} 
                />
             </svg>
          </div>

          <div className="flex-1 space-y-3 w-full">
             <div className="flex justify-between border-b border-gray-100 pb-2">
               <span className="text-gray-600">Puntaje Total de Carácter:</span>
               <span className={`font-bold text-lg ${totalCharacterScore < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                 {totalCharacterScore} / {maxPossibleScore}
               </span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Porcentaje del Total Posible:</span>
                <span className={`font-bold ${gaugeColor}`}>
                  {scorePercentage.toFixed(0)}%
                </span>
             </div>
             <div className="bg-gray-50 p-3 rounded text-xs text-gray-500 italic">
                Nota: El puntaje puede ser negativo si existen antecedentes graves (atrasos &gt; 30 días, malas referencias, falta de transparencia).
             </div>
          </div>
        </div>

        <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center">
               <MessageSquare className="w-4 h-4 mr-2" />
               Observaciones Cualitativas sobre la Voluntad de Pago
            </label>
            <textarea 
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              rows={4}
              placeholder="Ingrese comentarios sobre la impresión del carácter del cliente, disposición a pagar y consistencia de la información..."
              value={data.characterObservations}
              onChange={(e) => updateData('characterObservations', e.target.value)}
            />
        </div>

      </div>

    </div>
  );
};

export default SectionSix;