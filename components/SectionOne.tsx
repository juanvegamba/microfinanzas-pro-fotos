
import React, { useEffect, useState } from 'react';
import { MapPin, Calendar, User, Building2, Briefcase, DollarSign, Phone, CreditCard, Printer, FileDown } from 'lucide-react';
import { ClientData, SECTORS, BusinessSector } from '../types';

interface SectionOneProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
}

const SectionOne: React.FC<SectionOneProps> = ({ data, updateData }) => {
  const [gpsLoading, setGpsLoading] = useState(false);

  // Auto-calculate age when DOB changes
  useEffect(() => {
    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age !== data.age) {
        updateData('age', age);
      }
    }
  }, [data.dateOfBirth, data.age, updateData]);

  const handleSectorToggle = (sector: BusinessSector) => {
    const currentSectors = data.businessSectors || [];
    if (currentSectors.includes(sector)) {
      updateData('businessSectors', currentSectors.filter(s => s !== sector));
    } else {
      updateData('businessSectors', [...currentSectors, sector]);
    }
  };

  const captureGPS = () => {
    setGpsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateData('gpsCoordinates', {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGpsLoading(false);
        },
        (error) => {
          console.error("Error Capturing GPS", error);
          alert("No se pudo obtener la ubicación. Asegúrese de dar permisos.");
          setGpsLoading(false);
        }
      );
    } else {
      alert("Geolocalización no soportada en este navegador.");
      setGpsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* Header of Section */}
      <div className="pb-4 border-b border-gray-200 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800">Sección 1. Datos</h2>
        <p className="text-gray-500 mt-1">Información general del cliente, negocio y ubicación.</p>
      </div>

      {/* 1. Oficial de Credito */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Briefcase className="w-5 h-5 mr-2" />
          Detalles del Oficial de Crédito
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Oficial</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.officialName}
              onChange={(e) => updateData('officialName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal / Agencia</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.branch}
              onChange={(e) => updateData('branch', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Operación</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.operationNumber}
              onChange={(e) => updateData('operationNumber', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 2. Información Personal */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Información Personal del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.fullName}
              onChange={(e) => updateData('fullName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Documento de Identidad</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.identityDocument}
              onChange={(e) => updateData('identityDocument', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
            <input 
              type="date" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.dateOfBirth}
              onChange={(e) => updateData('dateOfBirth', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
            <input 
              type="number" 
              readOnly
              className="w-full p-2 bg-gray-50 border border-gray-300 rounded-md text-gray-500"
              value={data.age}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.maritalStatus}
              onChange={(e) => updateData('maritalStatus', e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="Soltero(a)">Soltero(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Unido(a)">Unido(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="Viudo(a)">Viudo(a)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de Dependientes</label>
            <input 
              type="number" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.dependents}
              onChange={(e) => updateData('dependents', parseInt(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cónyuge</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.spouseName}
              onChange={(e) => updateData('spouseName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ocupación del Cónyuge</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.spouseOccupation}
              onChange={(e) => updateData('spouseOccupation', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad de la Vivienda</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.housingType}
              onChange={(e) => updateData('housingType', e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="Propio">Propio</option>
              <option value="Alquilado">Alquilado</option>
              <option value="De Familiares">De Familiares</option>
              <option value="De Terceros">De Terceros</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Años de vivir en la vivienda</label>
            <input 
              type="number" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.yearsInHousing}
              onChange={(e) => updateData('yearsInHousing', parseInt(e.target.value) || '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Propiedad del Local del Negocio</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.businessPremiseType}
              onChange={(e) => updateData('businessPremiseType', e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="Propio">Propio</option>
              <option value="Alquilado">Alquilado</option>
              <option value="De Familiares">De Familiares</option>
              <option value="De Terceros">De Terceros</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Información del Negocio */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2" />
          Información del Negocio y Análisis Inicial
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.businessName}
              onChange={(e) => updateData('businessName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Negocio (Descripción)</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.businessType}
              onChange={(e) => updateData('businessType', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sector del Negocio (Selección Múltiple)</label>
            <div className="flex flex-wrap gap-2">
              {SECTORS.map(sector => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => handleSectorToggle(sector)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    data.businessSectors.includes(sector)
                      ? 'bg-blue-100 border-brand-primary text-brand-primary font-semibold'
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-100">
             <div className="flex items-start">
                <CreditCard className="w-5 h-5 text-brand-secondary mt-1 mr-3" />
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-800 mb-1">
                    Capacidad de Pago Mensual Autodeclarada (Q)
                  </label>
                  <p className="text-xs text-gray-600 mb-2">
                    Preguntar al cliente cuánto podría pagar por un nuevo crédito sin tener preocupación financiera.
                  </p>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 font-bold">Q</span>
                    <input 
                      type="number" 
                      className="w-full pl-8 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                      value={data.monthlyPaymentCapacity}
                      onChange={(e) => updateData('monthlyPaymentCapacity', parseFloat(e.target.value) || '')}
                      placeholder="0.00"
                    />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* 4. Ubicación y Contacto */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <MapPin className="w-5 h-5 mr-2" />
          Ubicación y Contacto
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de Vivienda</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.homeAddress}
              onChange={(e) => updateData('homeAddress', e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Específica del Negocio (si es diferente)</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.businessAddress}
              onChange={(e) => updateData('businessAddress', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Ubicación del Negocio</label>
            <select 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.locationType}
              onChange={(e) => updateData('locationType', e.target.value)}
            >
              <option value="">Seleccione...</option>
              <option value="Fija">Fija</option>
              <option value="Ambulante">Ambulante</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Coordenadas GPS</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly
                className="flex-1 p-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono"
                value={data.gpsCoordinates ? `${data.gpsCoordinates.lat.toFixed(6)}, ${data.gpsCoordinates.lng.toFixed(6)}` : 'No capturado'}
              />
              <button 
                type="button"
                onClick={captureGPS}
                disabled={gpsLoading}
                className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-800 transition-colors flex items-center text-sm disabled:opacity-50"
              >
                {gpsLoading ? 'Capturando...' : 'Capturar'}
                <MapPin className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Contacto (no familiar)</label>
            <input 
              type="text" 
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              value={data.contactName}
              onChange={(e) => updateData('contactName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
            <div className="relative">
               <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
               <input 
                type="tel" 
                className="w-full pl-9 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                value={data.contactPhone}
                onChange={(e) => updateData('contactPhone', e.target.value)}
              />
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

export default SectionOne;
