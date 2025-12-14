
import React from 'react';
import { History, TrendingUp, AlertTriangle, CheckCircle, Users, BarChart3, Calculator, Leaf, Printer, FileDown } from 'lucide-react';
import { ClientData } from '../types';

interface SectionTwoProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
}

const SectionTwo: React.FC<SectionTwoProps> = ({ data, updateData }) => {
  
  const currentYear = new Date().getFullYear();
  const businessAge = data.yearCreated ? currentYear - data.yearCreated : 0;
  
  const totalEmployees = (
    (typeof data.employeesFullTime === 'number' ? data.employeesFullTime : 0) +
    (typeof data.employeesPartTime === 'number' ? data.employeesPartTime : 0) +
    (typeof data.familyEmployees === 'number' ? data.familyEmployees : 0)
  );

  const totalScore = 
    data.diversificationScore + 
    data.profitabilityKnowledgeScore + 
    data.operationsManagementScore + 
    data.investmentPlanQualityScore + 
    data.successionPlanningScore;
  
  const maxScore = 13;
  const scorePercentage = (totalScore / maxScore) * 100;

  let gaugeColor = 'text-red-500';
  let gaugeLabel = 'Bajo';
  if (scorePercentage >= 66) {
    gaugeColor = 'text-green-500';
    gaugeLabel = 'Alto';
  } else if (scorePercentage >= 33) {
    gaugeColor = 'text-yellow-500';
    gaugeLabel = 'Medio';
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      <div className="pb-4 border-b border-gray-200 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Sección 2. Empresa</h2>
        <p className="text-gray-500 mt-1">Análisis de recursos, riesgos, capacidad empresarial y empleo.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <History className="w-5 h-5 mr-2" />
          Origen y Uso de Recursos del Negocio
        </h3>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Cómo inició el negocio? (Origen)</label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              rows={2}
              value={data.businessOrigin}
              onChange={(e) => updateData('businessOrigin', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿Qué uso dio a las ganancias de los últimos meses?</label>
              <input 
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                value={data.recentProfitsUse}
                onChange={(e) => updateData('recentProfitsUse', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto reinvertido en el negocio (Q)</label>
              <input 
                type="number"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                placeholder="0.00"
                value={data.reinvestedAmount}
                onChange={(e) => updateData('reinvestedAmount', parseFloat(e.target.value) || '')}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Análisis de Riesgos y Oportunidades por el Cliente
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Riesgos Identificados por el Cliente</label>
            <input 
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Ej. Competencia, subida de precios, clima..."
              value={data.clientRisks}
              onChange={(e) => updateData('clientRisks', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medidas de Mitigación Identificadas por el Cliente</label>
            <input 
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="¿Qué hará si el riesgo ocurre?"
              value={data.mitigationMeasures}
              onChange={(e) => updateData('mitigationMeasures', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Oportunidades de Negocio Identificadas por el Cliente</label>
            <input 
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Ej. Nuevo producto, ampliar local..."
              value={data.businessOpportunities}
              onChange={(e) => updateData('businessOpportunities', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Evaluación Cualitativa
        </h3>
        <div className="grid grid-cols-1 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diversificación de Ingresos</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.diversificationScore}
              onChange={(e) => updateData('diversificationScore', parseInt(e.target.value))}
            >
              <option value={0}>0 Puntos: Única fuente de ingresos</option>
              <option value={1}>1 Punto: Pocos productos/servicios relacionados</option>
              <option value={2}>2 Puntos: Múltiples fuentes de ingreso (2-3)</option>
              <option value={3}>3 Puntos: Fuentes altamente diversificadas ({'>'}3)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conocimiento de la Rentabilidad</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.profitabilityKnowledgeScore}
              onChange={(e) => updateData('profitabilityKnowledgeScore', parseInt(e.target.value))}
            >
              <option value={0}>0 Puntos: No conoce rentabilidad</option>
              <option value={1}>1 Punto: Idea general de rentabilidad</option>
              <option value={2}>2 Puntos: Conoce bien su rentabilidad</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gestión de Operaciones e Inventario</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.operationsManagementScore}
              onChange={(e) => updateData('operationsManagementScore', parseInt(e.target.value))}
            >
              <option value={0}>0 Puntos: Gestión deficiente/desorganizada</option>
              <option value={1}>1 Punto: Gestión informal pero funcional</option>
              <option value={2}>2 Puntos: Buen control de inventario y operaciones</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Calidad del Plan de Inversión</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.investmentPlanQualityScore}
              onChange={(e) => updateData('investmentPlanQualityScore', parseInt(e.target.value))}
            >
              <option value={1}>1 Puntos: Poco clara</option>
              <option value={2}>2 Puntos: Regular</option>
              <option value={3}>3 Puntos: Buena</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Planificación de Sucesión</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.successionPlanningScore}
              onChange={(e) => updateData('successionPlanningScore', parseInt(e.target.value))}
            >
              <option value={0}>0 Puntos: Sin sucesión</option>
              <option value={1}>1 Puntos: Sin sucesión, pero es menor de 55 años</option>
              <option value={2}>2 Puntos: En formación de sucesor</option>
              <option value={3}>3 Puntos: Familiar o sucesión identificada</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Calculator className="w-5 h-5 mr-2" />
          Activos Estimados y Antigüedad
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Activos Fijos (Q)</label>
            <input 
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.fixedAssetsValue}
              onChange={(e) => updateData('fixedAssetsValue', parseFloat(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor Inventario Actual (Q)</label>
            <input 
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.inventoryValue}
              onChange={(e) => updateData('inventoryValue', parseFloat(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año Creación Negocio</label>
            <input 
              type="number"
              placeholder="Ej. 2015"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.yearCreated}
              onChange={(e) => updateData('yearCreated', parseInt(e.target.value) || '')}
            />
          </div>
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 flex flex-col justify-center">
            <span className="text-xs text-gray-500 font-semibold uppercase">Antigüedad del Negocio</span>
            <span className="text-lg font-bold text-gray-800">{businessAge} años</span>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Año de formalización (si aplica)</label>
            <input 
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.yearFormalized}
              onChange={(e) => updateData('yearFormalized', parseInt(e.target.value) || '')}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Empleo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No Familiares (Tiempo Completo)</label>
            <input 
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.employeesFullTime}
              onChange={(e) => updateData('employeesFullTime', parseInt(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No Familiares (Tiempo Parcial)</label>
            <input 
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.employeesPartTime}
              onChange={(e) => updateData('employeesPartTime', parseInt(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No Familiares (TC - Año Pasado)</label>
            <input 
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.employeesFullTimeLastYear}
              onChange={(e) => updateData('employeesFullTimeLastYear', parseInt(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No Familiares (TP - Año Pasado)</label>
            <input 
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.employeesPartTimeLastYear}
              onChange={(e) => updateData('employeesPartTimeLastYear', parseInt(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Miembros Familiares Trabajando</label>
            <input 
              type="number"
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.familyEmployees}
              onChange={(e) => updateData('familyEmployees', parseInt(e.target.value) || '')}
            />
          </div>
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex items-center justify-between">
            <span className="text-sm font-bold text-blue-800">Total Empleados Actuales:</span>
            <span className="text-xl font-bold text-blue-800">{totalEmployees}</span>
          </div>
        </div>
      </div>

       <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Leaf className="w-5 h-5 mr-2" />
          Otros Detalles del Negocio
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ventas del año pasado vs. este año (%)</label>
            <div className="flex items-center">
               <input 
                type="number"
                className="w-32 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent mr-2"
                placeholder="0"
                value={data.salesGrowth}
                onChange={(e) => updateData('salesGrowth', parseFloat(e.target.value) || '')}
              />
              <span className="text-gray-500">%</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Metas sociales o ambientales?</label>
            <p className="text-xs text-gray-500 mb-2">Describa si el cliente cuida a empleados o medio ambiente.</p>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              rows={2}
              value={data.socialEnvGoals}
              onChange={(e) => updateData('socialEnvGoals', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2" />
          Resumen de Capacidad Empresarial
        </h3>
        
        <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
          <div className="relative w-48 h-32 flex justify-center overflow-hidden">
            <div className="absolute w-40 h-40 bg-gray-200 rounded-full top-0"></div>
            <div className="absolute w-32 h-32 bg-white rounded-full top-4 z-10 flex items-end justify-center pb-4">
                <div className="text-center">
                    <span className={`text-3xl font-bold ${gaugeColor}`}>{scorePercentage.toFixed(0)}%</span>
                    <p className="text-xs text-gray-500">{gaugeLabel}</p>
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
                  strokeDasharray={`${scorePercentage * 1.26} 126`} 
                />
             </svg>
          </div>

          <div className="flex-1 space-y-2">
             <div className="flex justify-between border-b border-gray-100 pb-2">
               <span className="text-gray-600">Puntaje Total:</span>
               <span className="font-bold text-gray-900">{totalScore} / {maxScore}</span>
             </div>
             <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="text-gray-600">Nivel:</span>
                <span className={`font-bold ${gaugeColor}`}>{gaugeLabel}</span>
             </div>
             <p className="text-xs text-gray-400 italic mt-2">
                Rojo: &lt;33% | Amarillo: 33-66% | Verde: &gt;66%
             </p>
          </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Cualitativas</label>
            <textarea 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              rows={3}
              value={data.businessObservations}
              onChange={(e) => updateData('businessObservations', e.target.value)}
            />
          </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 print:hidden">
         <button 
           onClick={handlePrint}
           className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 transition-colors"
         >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Sección
         </button>
         <button 
           onClick={handlePrint}
           className="flex items-center px-4 py-2 bg-brand-primary text-white font-medium rounded-md shadow-sm hover:bg-blue-800 transition-colors"
         >
            <FileDown className="w-4 h-4 mr-2" />
            Exportar PDF
         </button>
      </div>

    </div>
  );
};

export default SectionTwo;