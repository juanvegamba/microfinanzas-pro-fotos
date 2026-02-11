
import React, { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase'; // Import auth to get the correct app instance
import { FileCheck2, Camera, Trash2, ShieldCheck, Image as LucideImage } from 'lucide-react';
import { ClientData, ClientPhoto, PhotoCategory, DocumentChecklist } from '../types';

interface SectionSevenProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
  setTabLocked: (locked: boolean) => void;
  activeDocId: string | null;
}

const photoCategories: PhotoCategory[] = [
  'Negocio/Inventario/Activos', 
  'Vivienda', 
  'Garantías', 
  'Vías de Acceso', 
  'Otros'
];

const documentCheckboxFields: (keyof Omit<DocumentChecklist, 'otherDocumentsDesc'>)[] = [
    'identityCard',
    'spouseIdentityCard',
    'utilityBill',
    'recentInvoices',
    'salesNotebook',
    'propertyTitle',
    'taxId',
];

const documentLabels: Record<keyof Omit<DocumentChecklist, 'otherDocumentsDesc'>, string> = {
  identityCard: "Documento de identidad",
  spouseIdentityCard: "Documento de identidad del cónyuge",
  utilityBill: "Facturas de servicios",
  recentInvoices: "Otras facturas",
  salesNotebook: "Cuaderno de ventas",
  propertyTitle: "Documentos de propiedad",
  taxId: "Identificación tributaria",
};

const SectionSeven: React.FC<SectionSevenProps> = ({ data, updateData, setTabLocked, activeDocId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageWorker, setImageWorker] = useState<Worker | null>(null);
  
  // CRITICAL FIX: Explicitly pass the initialized app to getStorage
  // This ensures it uses the correct firebaseConfig from firebase.ts
  const storage = getStorage(auth.app);

  useEffect(() => {
    const worker = new Worker(new URL('../image-resizer.worker.ts', import.meta.url), { type: 'module' });
    setImageWorker(worker);

    return () => {
      worker.terminate();
    };
  }, []);

  const resizeWithWorker = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      if (!imageWorker) {
        return reject(new Error("Image processing worker not available."));
      }

      imageWorker.onmessage = (e: MessageEvent) => {
        if (e.data.success) {
          resolve(e.data.blob);
        } else {
          reject(new Error(e.data.error));
        }
      };

      imageWorker.onerror = (e) => {
        reject(new Error(`Worker error: ${e.message}`));
      };
      
      imageWorker.postMessage(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    const file = e.target.files[0];
    
    setTabLocked(true);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const resizedImage = await resizeWithWorker(file);
      const docId = activeDocId || data.operationNumber || `cliente_${data.identityDocument}` || Date.now();
      const fileName = `${docId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `fotos_clientes/${fileName}`);
      const uploadTask = uploadBytesResumable(storageRef, resizedImage);

      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error("Upload failed:", error);
            alert(`Error al subir la fotografía: ${error.message}`);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              addPhotoToState(downloadURL);
              resolve();
            } catch (error) {
               console.error("Getting download URL failed:", error);
               alert(`Error obteniendo URL de descarga: ${error}`);
               reject(error);
            }
          }
        );
      });

    } catch (error) {
      console.error("Error processing or uploading image:", error);
      alert(`Ocurrió un error al procesar la imagen: ${error}`);
    } finally {
      setIsUploading(false);
      setTabLocked(false);
      setUploadProgress(0);
      // Reset file input to allow re-uploading the same file
      e.target.value = '';
    }
  };

  const addPhotoToState = (url: string) => {
    const newPhoto: ClientPhoto = {
      id: Date.now().toString(),
      url,
      category: 'Otros',
      comment: '',
      timestamp: new Date().toLocaleString(),
      gps: null
    };
    updateData('photos', [...data.photos, newPhoto]);
  };

  const removePhoto = (id: string) => {
    updateData('photos', data.photos.filter(p => p.id !== id));
  };

  const updatePhotoDetail = (id: string, field: keyof ClientPhoto, value: any) => {
    updateData('photos', data.photos.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const updateDocumentCheck = (field: keyof DocumentChecklist, value: string | boolean) => {
    updateData('documents', { ...data.documents, [field]: value });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Sección 7. Documentos y Fotos del Cliente
        </h2>
        <p className="text-gray-500 mt-1">Verificación de documentos y evidencia fotográfica.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <FileCheck2 className="w-5 h-5 mr-2" />
            Checklist de Documentos
          </h3>
          <div className="space-y-3">
            {documentCheckboxFields.map((key) => (
              <label key={key} className="flex items-center space-x-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="h-5 w-5 rounded border-gray-300 text-brand-primary focus:ring-brand-primary transition-colors"
                  checked={data.documents[key]}
                  onChange={(e) => updateDocumentCheck(key, e.target.checked)}
                />
                <span className="text-gray-700">
                  {documentLabels[key]}
                </span>
              </label>
            ))}
             <div className="pt-2">
               <label className="block text-sm font-medium text-gray-700 mb-1">Otros Documentos</label>
               <input 
                  type="text"
                  placeholder="Ej: Patente de comercio, RTU actualizado..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                  value={data.documents.otherDocumentsDesc}
                  onChange={(e) => updateDocumentCheck('otherDocumentsDesc', e.target.value)}
                />
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2" />
            Autorización Buró de Crédito
          </h3>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
            <p className="text-sm text-gray-600">¿El cliente autoriza la consulta en centrales de riesgo (buró de crédito)?</p>
            <div className="flex space-x-4">
              <button className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-green-100 text-green-800 border border-green-200 hover:bg-green-200">
                Sí, autoriza
              </button>
              <button className="flex-1 py-2 px-4 rounded-md text-sm font-medium bg-red-100 text-red-800 border border-red-200 hover:bg-red-200">
                No, no autoriza
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 pt-2">Acción futura: registrar firma o consentimiento digital.</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
         <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Fotografías del Cliente
         </h3>
         
         <div className="mb-6">
             <label className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white cursor-pointer transition-colors ${isUploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-brand-secondary hover:bg-blue-700'}`}>
                {isUploading ? `Procesando... ${uploadProgress > 0 ? uploadProgress.toFixed(0) + '%' : ''}` : '+ Agregar Foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
             </label>
             {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
             )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.photos.map((photo) => (
               <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex flex-col">
                  <div className="h-40 bg-gray-200 relative">
                     <img src={photo.url} alt="Evidencia" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-3 flex-grow flex flex-col">
                     <select 
                        value={photo.category} 
                        onChange={(e) => updatePhotoDetail(photo.id, 'category', e.target.value as PhotoCategory)}
                        className="w-full p-1.5 text-xs border border-gray-300 rounded-md mb-2 focus:ring-1 focus:ring-brand-primary"
                      >
                        {photoCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                     <textarea 
                        className="w-full text-xs border border-gray-300 rounded p-1 mb-2 resize-none focus:ring-1 focus:ring-brand-primary flex-grow"
                        placeholder="Comentario de la foto..."
                        rows={2}
                        value={photo.comment} 
                        onChange={(e) => updatePhotoDetail(photo.id, 'comment', e.target.value)} 
                      />
                     <div className="flex justify-between items-center mt-auto">
                        <span className="text-[9px] text-gray-400">{photo.timestamp}</span>
                        <button onClick={() => removePhoto(photo.id)} className="text-red-500 hover:text-red-700 p-1">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
            ))}
            {data.photos.length === 0 && (
               <div className="col-span-full text-center py-10 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center">
                  <LucideImage className="w-12 h-12 text-gray-300 mb-2" />
                  Aún no se han agregado fotografías.
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default SectionSeven;
