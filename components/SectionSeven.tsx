
import React, { useState } from 'react';
import { FileText, Camera, MapPin, Printer, FileDown, Trash2, Plus, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { ClientData, DocumentChecklist, ClientPhoto, PhotoCategory } from '../types';

interface SectionSevenProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
}

const SectionSeven: React.FC<SectionSevenProps> = ({ data, updateData }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('Negocio/Inventario/Activos');

  // --- DOCUMENT HANDLERS ---
  const toggleDocument = (key: keyof DocumentChecklist) => {
    updateData('documents', {
      ...data.documents,
      [key]: !data.documents[key]
    });
  };

  const updateOtherDocDesc = (val: string) => {
    updateData('documents', {
      ...data.documents,
      otherDocumentsDesc: val
    });
  };

  // --- PHOTO HANDLERS ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      
      // 1. Convert to Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        
        // 2. Capture GPS (Mock or Real)
        // In a real browser environment, this requires HTTPS.
        // We will try to get it, if fail, set to null.
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              addPhotoToState(base64String, {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              });
              setIsUploading(false);
            },
            (error) => {
              console.warn("GPS not captured", error);
              // Fallback: add photo without GPS
              addPhotoToState(base64String, null);
              setIsUploading(false);
            },
            { timeout: 5000 }
          );
        } else {
           addPhotoToState(base64String, null);
           setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addPhotoToState = (url: string, gps: { lat: number; lng: number } | null) => {
    const newPhoto: ClientPhoto = {
      id: Date.now().toString(),
      url,
      category: selectedCategory,
      comment: '',
      timestamp: new Date().toLocaleString(),
      gps: gps
    };
    updateData('photos', [...data.photos, newPhoto]);
  };

  const removePhoto = (id: string) => {
    updateData('photos', data.photos.filter(p => p.id !== id));
  };

  const updatePhotoComment = (id: string, comment: string) => {
    updateData('photos', data.photos.map(p => p.id === id ? { ...p, comment } : p));
  };

  const updatePhotoCategory = (id: string, category: PhotoCategory) => {
    updateData('photos', data.photos.map(p => p.id === id ? { ...p, category } : p));
  };

  // --- EXPORT ---
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 print:p-0 print:max-w-none">
      
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 print:hidden">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Sección 7. Documentación y Fotos
        </h2>
        <p className="text-gray-500 mt-1">Evidencia documental y fotográfica de la visita.</p>
      </div>

      <div className="hidden print:block mb-6">
         <h1 className="text-2xl font-bold">Anexo Fotográfico y Documental</h1>
         <p>Cliente: {data.fullName}</p>
      </div>

      {/* 1. Checklist de Documentación */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Checklist de Documentación Requerida
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'identityCard', label: 'Documento de identidad del Cliente' },
            { key: 'spouseIdentityCard', label: 'Documento de identidad del Cónyuge' },
            { key: 'utilityBill', label: 'Recibos de Servicios (luz, agua)' },
            { key: 'recentInvoices', label: 'Facturas de Compra Recientes' },
            { key: 'salesNotebook', label: 'Cuaderno de Apuntes de Ventas' },
            { key: 'propertyTitle', label: 'Títulos de Propiedad (si aplica)' },
            { key: 'taxId', label: 'NIT del Negocio (si aplica)' },
          ].map((item) => (
            <label key={item.key} className="flex items-center space-x-3 p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-colors">
              <input 
                type="checkbox" 
                className="h-5 w-5 text-brand-primary focus:ring-brand-primary border-gray-300 rounded"
                checked={data.documents[item.key as keyof DocumentChecklist] as boolean}
                onChange={() => toggleDocument(item.key as keyof DocumentChecklist)}
              />
              <span className="text-sm text-gray-700 font-medium">{item.label}</span>
            </label>
          ))}
        </div>
        <div className="mt-4">
           <label className="block text-sm font-medium text-gray-700 mb-1">Otros documentos (Detallar):</label>
           <input 
             type="text" 
             className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
             value={data.documents.otherDocumentsDesc}
             onChange={(e) => updateOtherDocDesc(e.target.value)}
             placeholder="Especifique otros documentos recolectados..."
           />
        </div>
      </div>

      {/* 2. Fotos del Cliente */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4 print:hidden">
          <h3 className="text-lg font-semibold text-brand-primary flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Registro Fotográfico
          </h3>
        </div>
        
        {/* Upload Area (Hidden in Print) */}
        <div className="mb-8 p-6 bg-blue-50 rounded-lg border-2 border-dashed border-blue-200 text-center print:hidden">
           <div className="max-w-md mx-auto">
             <ImageIcon className="w-12 h-12 text-blue-300 mx-auto mb-3" />
             <h4 className="font-medium text-blue-900 mb-2">Agregar Nueva Foto</h4>
             
             {/* Category Selector before Upload */}
             <div className="mb-4">
                <label className="block text-xs font-semibold text-blue-800 mb-1 text-left">1. Seleccione Categoría:</label>
                <select 
                  className="w-full p-2 border border-blue-300 rounded-md bg-white text-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as PhotoCategory)}
                >
                  <option value="Negocio/Inventario/Activos">1. Fotos del Cliente, Negocio, Inventario y Activos</option>
                  <option value="Vivienda">2. Fotos de la Vivienda</option>
                  <option value="Garantías">3. Fotos de Garantías</option>
                  <option value="Vías de Acceso">4. Fotos de Vías de Acceso</option>
                  <option value="Otros">Otros</option>
                </select>
             </div>

             <label className={`block w-full py-3 px-4 rounded-md shadow-sm text-sm font-medium text-white cursor-pointer transition-colors ${isUploading ? 'bg-gray-400 cursor-wait' : 'bg-brand-primary hover:bg-blue-700'}`}>
                {isUploading ? 'Procesando y Capturando GPS...' : '2. Clic para Seleccionar Foto o Tomar Foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
             </label>
             <p className="text-xs text-blue-600 mt-2">
               * Al subir la foto, el sistema intentará capturar su ubicación GPS actual automáticamente.
             </p>
           </div>
        </div>

        {/* Photos Grid */}
        <div className="space-y-8">
           {['Negocio/Inventario/Activos', 'Vivienda', 'Garantías', 'Vías de Acceso', 'Otros'].map((cat) => {
              const categoryPhotos = data.photos.filter(p => p.category === cat);
              if (categoryPhotos.length === 0) return null;

              return (
                <div key={cat} className="break-inside-avoid">
                   <h4 className="font-bold text-gray-800 border-b-2 border-gray-100 pb-2 mb-4 text-lg">{cat}</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {categoryPhotos.map(photo => (
                        <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-gray-50 flex flex-col break-inside-avoid">
                           <div className="h-56 w-full bg-gray-200 relative">
                              <img src={photo.url} alt={cat} className="w-full h-full object-cover" />
                              {photo.gps ? (
                                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded flex items-center">
                                   <MapPin className="w-3 h-3 mr-1" />
                                   {photo.gps.lat.toFixed(6)}, {photo.gps.lng.toFixed(6)}
                                </div>
                              ) : (
                                <div className="absolute bottom-2 right-2 bg-red-500/80 text-white text-[10px] px-2 py-1 rounded flex items-center">
                                   <AlertCircle className="w-3 h-3 mr-1" />
                                   Sin GPS
                                </div>
                              )}
                           </div>
                           <div className="p-3 flex-grow flex flex-col">
                              <div className="text-[10px] text-gray-400 mb-2 flex justify-between">
                                 <span>{photo.timestamp}</span>
                                 {/* Edit Category in UI if needed, heavily condensed for print */}
                                 <select 
                                   className="bg-transparent border-none text-gray-500 p-0 h-auto text-[10px] focus:ring-0 print:hidden"
                                   value={photo.category}
                                   onChange={(e) => updatePhotoCategory(photo.id, e.target.value as PhotoCategory)}
                                 >
                                    <option value="Negocio/Inventario/Activos">Negocio/Inv</option>
                                    <option value="Vivienda">Vivienda</option>
                                    <option value="Garantías">Garantías</option>
                                    <option value="Vías de Acceso">Accesos</option>
                                    <option value="Otros">Otros</option>
                                 </select>
                              </div>
                              <textarea 
                                className="w-full text-sm border border-gray-300 rounded p-2 flex-grow resize-none focus:ring-1 focus:ring-brand-primary focus:border-transparent"
                                placeholder="Añadir comentario a esta foto..."
                                value={photo.comment}
                                onChange={(e) => updatePhotoComment(photo.id, e.target.value)}
                              />
                              <button 
                                onClick={() => removePhoto(photo.id)}
                                className="mt-2 text-red-500 text-xs flex items-center justify-end hover:underline print:hidden"
                              >
                                <Trash2 className="w-3 h-3 mr-1" /> Eliminar Foto
                              </button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              )
           })}
           {data.photos.length === 0 && (
              <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                 No hay fotos agregadas aún.
              </div>
           )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 print:hidden">
         <button 
           onClick={handlePrint}
           className="flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-md shadow-sm hover:bg-gray-50 transition-colors"
         >
            <Printer className="w-5 h-5 mr-2" />
            Imprimir Sección
         </button>
         <button 
           onClick={handlePrint}
           className="flex items-center px-6 py-3 bg-brand-primary text-white font-medium rounded-md shadow-sm hover:bg-blue-800 transition-colors"
         >
            <FileDown className="w-5 h-5 mr-2" />
            Exportar a PDF
         </button>
      </div>
      
      <style>{`
        @media print {
           body * {
             visibility: hidden;
           }
           #root, #root * {
             visibility: visible;
           }
           /* Hide Header, Stepper, Buttons */
           header, nav, button, .print\\:hidden {
             display: none !important;
           }
           /* Ensure layout is good for print */
           .break-inside-avoid {
             page-break-inside: avoid;
           }
           input, textarea, select {
             border: none !important;
             background: transparent !important;
             resize: none;
           }
        }
      `}</style>

    </div>
  );
};

export default SectionSeven;
