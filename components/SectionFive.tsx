import React, { useMemo } from 'react';
import { Shield, UserCheck, Plus, Trash2, Calculator, Scale, Printer, FileDown } from 'lucide-react';
import { ClientData, RealGuarantee, FiduciaryGuarantee } from '../types';

interface SectionFiveProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
}

const SectionFive: React.FC<SectionFiveProps> = ({ data, updateData }) => {

  // --- REAL GUARANTEE HELPERS ---
  const addRealGuarantee = () => {
    const newItem: RealGuarantee = {
      id: Date.now().toString(),
      type: '',
      estimatedValue: '',
      quickSaleValue: '',
      description: '',
      status: '',
      registryNumber: '',
      vehicleYear: '',
      constructionArea: '',
      landArea: '',
      comments: ''
    };
    updateData('realGuarantees', [...data.realGuarantees, newItem]);
  };

  const updateRealGuarantee = (id: string, field: keyof RealGuarantee, value: any) => {
    updateData('realGuarantees', data.realGuarantees.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeRealGuarantee = (id: string) => {
    updateData('realGuarantees', data.realGuarantees.filter(i => i.id !== id));
  };

  // --- FIDUCIARY GUARANTEE HELPERS ---
  const addFiduciaryGuarantee = () => {
    const newItem: FiduciaryGuarantee = {
      id: Date.now().toString(),
      name: '',
      dpi: '',
      phone: '',
      occupation: '',
      income: '',
      assets: '',
      debts: '',
      paymentBehavior: '',
      estimatedNetWorth: '',
      address: '',
      comments: ''
    };
    updateData('fiduciaryGuarantees', [...data.fiduciaryGuarantees, newItem]);
  };

  const updateFiduciaryGuarantee = (id: string, field: keyof FiduciaryGuarantee, value: any) => {
    updateData('fiduciaryGuarantees', data.fiduciaryGuarantees.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeFiduciaryGuarantee = (id: string) => {
    updateData('fiduciaryGuarantees', data.fiduciaryGuarantees.filter(i => i.id !== id));
  };


  // --- CALCULATIONS ---

  // 1. Guarantee Totals
  const totalEstimatedGuarantee = data.realGuarantees.reduce((sum, item) => sum + (typeof item.estimatedValue === 'number' ? item.estimatedValue : 0), 0);
  const totalQuickSaleGuarantee = data.realGuarantees.reduce((sum, item) => sum + (typeof item.quickSaleValue === 'number' ? item.quickSaleValue : 0), 0);

  // 2. Capital Summary (Pulling from previous sections)
  const totalRealEstate = data.realEstateAssets.reduce((sum, item) => sum + (typeof item.estimatedValue === 'number' ? item.estimatedValue : 0), 0);
  const totalVehicles = data.vehicleAssets.reduce((sum, item) => sum + (typeof item.estimatedValue === 'number' ? item.estimatedValue : 0), 0);
  const totalOtherAssets = data.otherAssets.reduce((sum, item) => sum + (typeof item.estimatedValue === 'number' ? item.estimatedValue : 0), 0);
  const totalAssets = totalRealEstate + totalVehicles + totalOtherAssets;

  const totalLiabilities = data.existingDebts.reduce((sum, item) => sum + (typeof item.currentBalance === 'number' ? item.currentBalance : 0), 0);
  
  const netWorth = totalAssets - totalLiabilities;
  
  const loanAmount = typeof data.loanAmount === 'number' ? data.loanAmount : 0;

  // 3. Ratios
  const commercialCoverage = loanAmount > 0 ? totalEstimatedGuarantee / loanAmount : 0;
  const quickSaleCoverage = loanAmount > 0 ? totalQuickSaleGuarantee / loanAmount : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Sección 5. Garantías (Colateral)
        </h2>
        <p className="text-gray-500 mt-1">Respaldo del crédito</p>
      </div>

      {/* 1. Garantías Reales */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Garantías Reales (Hipotecaria / Prendaria)
        </h3>

        <div className="space-y-6">
          {data.realGuarantees.map((item) => (
             <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de Garantía</label>
                      <select className="w-full p-2 border border-gray-300 rounded-md"
                         value={item.type} onChange={(e) => updateRealGuarantee(item.id, 'type', e.target.value)}>
                         <option value="">Seleccione...</option>
                         <option value="Hipotecaria">Hipotecaria</option>
                         <option value="Prendaria (Vehículo)">Prendaria (Vehículo)</option>
                         <option value="Prendaria (Maquinaria)">Prendaria (Maquinaria)</option>
                         <option value="Otros">Otros</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Descripción Detallada</label>
                      <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                         value={item.description} onChange={(e) => updateRealGuarantee(item.id, 'description', e.target.value)} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Valor Estimado (Q)</label>
                      <input type="number" className="w-full p-2 border border-gray-300 rounded-md bg-white"
                         value={item.estimatedValue} onChange={(e) => updateRealGuarantee(item.id, 'estimatedValue', parseFloat(e.target.value) || '')} />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1 bg-yellow-50">Valor de Venta Rápida (Q)</label>
                      <input type="number" className="w-full p-2 border border-yellow-200 bg-yellow-50 rounded-md"
                         value={item.quickSaleValue} onChange={(e) => updateRealGuarantee(item.id, 'quickSaleValue', parseFloat(e.target.value) || '')} />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                   <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Estado de la Garantía</label>
                      <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                         placeholder="Ej. Bueno, Regular, Malo"
                         value={item.status} onChange={(e) => updateRealGuarantee(item.id, 'status', e.target.value)} />
                   </div>
                   <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Número de Registro (si aplica)</label>
                      <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                         value={item.registryNumber} onChange={(e) => updateRealGuarantee(item.id, 'registryNumber', e.target.value)} />
                   </div>
                </div>

                {/* Conditional Fields */}
                {item.type === 'Prendaria (Vehículo)' && (
                  <div className="mb-4">
                     <label className="block text-xs font-medium text-gray-700 mb-1">Año del Vehículo</label>
                     <input type="number" className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md"
                        value={item.vehicleYear} onChange={(e) => updateRealGuarantee(item.id, 'vehicleYear', parseInt(e.target.value) || '')} />
                  </div>
                )}

                {item.type === 'Hipotecaria' && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">Metros de Terreno (m²)</label>
                         <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                            value={item.landArea} onChange={(e) => updateRealGuarantee(item.id, 'landArea', parseFloat(e.target.value) || '')} />
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-gray-700 mb-1">Metros Construidos (m²)</label>
                         <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                            value={item.constructionArea} onChange={(e) => updateRealGuarantee(item.id, 'constructionArea', parseFloat(e.target.value) || '')} />
                      </div>
                   </div>
                )}

                <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">Comentarios</label>
                    <textarea className="w-full p-2 border border-gray-300 rounded-md" rows={2}
                       value={item.comments} onChange={(e) => updateRealGuarantee(item.id, 'comments', e.target.value)} />
                </div>
                
                <button onClick={() => removeRealGuarantee(item.id)} className="text-red-500 text-xs flex items-center hover:underline">
                   <Trash2 className="w-3 h-3 mr-1" /> Eliminar Garantía
                </button>
             </div>
          ))}
          <button onClick={addRealGuarantee} className="text-sm text-brand-secondary font-medium hover:underline flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Agregar Garantía Real
          </button>
          
          {/* Totals */}
          <div className="bg-gray-100 p-4 rounded-lg mt-4 flex flex-col md:flex-row justify-between items-center text-sm">
             <div className="font-semibold text-gray-700">Total Garantías Reales:</div>
             <div className="flex gap-6">
                <div>
                   <span className="text-gray-500 mr-2">Valor Estimado:</span>
                   <span className="font-bold text-gray-900">Q {totalEstimatedGuarantee.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                </div>
                <div>
                   <span className="text-gray-500 mr-2">Venta Rápida:</span>
                   <span className="font-bold text-gray-900">Q {totalQuickSaleGuarantee.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 2. Garantías Fiduciarias */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <UserCheck className="w-5 h-5 mr-2" />
          Garantías Fiduciarias (Fiadores)
        </h3>
        <div className="space-y-6">
           {data.fiduciaryGuarantees.map((item) => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.name} onChange={(e) => updateFiduciaryGuarantee(item.id, 'name', e.target.value)} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">DPI / Identificación</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.dpi} onChange={(e) => updateFiduciaryGuarantee(item.id, 'dpi', e.target.value)} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.phone} onChange={(e) => updateFiduciaryGuarantee(item.id, 'phone', e.target.value)} />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Ocupación</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.occupation} onChange={(e) => updateFiduciaryGuarantee(item.id, 'occupation', e.target.value)} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.address} onChange={(e) => updateFiduciaryGuarantee(item.id, 'address', e.target.value)} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Comportamiento Pago (Buró)</label>
                       <select className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.paymentBehavior} onChange={(e) => updateFiduciaryGuarantee(item.id, 'paymentBehavior', e.target.value)}>
                          <option value="">Seleccione...</option>
                          <option value="Bueno">Bueno (Sin mora)</option>
                          <option value="Regular">Regular (Atrasos &lt; 30)</option>
                          <option value="Malo">Malo (Atrasos &gt; 30)</option>
                       </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Ingresos Mes (Q)</label>
                       <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.income} onChange={(e) => updateFiduciaryGuarantee(item.id, 'income', parseFloat(e.target.value) || '')} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Total Activos (Q)</label>
                       <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.assets} onChange={(e) => updateFiduciaryGuarantee(item.id, 'assets', parseFloat(e.target.value) || '')} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Total Deudas (Q)</label>
                       <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                          value={item.debts} onChange={(e) => updateFiduciaryGuarantee(item.id, 'debts', parseFloat(e.target.value) || '')} />
                    </div>
                    <div>
                       <label className="block text-xs font-medium text-gray-700 mb-1">Patrimonio Est. (Q)</label>
                       <input type="number" className="w-full p-2 border border-gray-300 rounded-md bg-gray-100" readOnly
                          value={(typeof item.assets === 'number' && typeof item.debts === 'number') ? item.assets - item.debts : ''} />
                    </div>
                 </div>
                 <button onClick={() => removeFiduciaryGuarantee(item.id)} className="text-red-500 text-xs flex items-center hover:underline">
                    <Trash2 className="w-3 h-3 mr-1" /> Eliminar Fiador
                 </button>
              </div>
           ))}
           <button onClick={addFiduciaryGuarantee} className="text-sm text-brand-secondary font-medium hover:underline flex items-center">
             <Plus className="w-4 h-4 mr-1" /> Agregar Fiador
           </button>
        </div>
      </div>

      {/* 3. Análisis de Cobertura */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <Scale className="w-5 h-5 mr-2" />
            Análisis de Cobertura de Garantía
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                <h4 className="text-sm font-bold text-blue-800 mb-2 uppercase">Monto del Crédito Solicitado</h4>
                <div className="text-2xl font-bold text-blue-900">Q {loanAmount.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
             </div>
             <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase">Patrimonio Neto del Solicitante</h4>
                <div className="text-2xl font-bold text-gray-800">Q {netWorth.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
                <div className="text-xs text-gray-500">(Total Activos - Total Pasivos reportados)</div>
             </div>
         </div>

         <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-4 rounded-md border ${commercialCoverage >= 1 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-xs text-gray-500 font-bold uppercase mb-1">Cobertura con Valor Comercial</div>
                <div className={`text-xl font-bold ${commercialCoverage >= 1 ? 'text-green-700' : 'text-red-700'}`}>
                   {commercialCoverage.toFixed(2)}x
                </div>
                <div className="text-xs text-gray-500 mt-1">
                   (Garantías Reales / Monto Crédito). Ideal {'>'} 1.2x
                </div>
            </div>
            <div className={`p-4 rounded-md border ${quickSaleCoverage >= 1 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="text-xs text-gray-500 font-bold uppercase mb-1">Cobertura con Valor Venta Rápida</div>
                <div className={`text-xl font-bold ${quickSaleCoverage >= 1 ? 'text-green-700' : 'text-yellow-700'}`}>
                   {quickSaleCoverage.toFixed(2)}x
                </div>
                <div className="text-xs text-gray-500 mt-1">
                   (Valor Venta Rápida / Monto Crédito). Ideal {'>'} 1.0x
                </div>
            </div>
         </div>
      </div>

      {/* Footer Actions */}
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

export default SectionFive;