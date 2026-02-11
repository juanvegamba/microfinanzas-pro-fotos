
import React, { useState, useEffect } from 'react';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { auth } from '../firebase';
import { ClipboardList, MapPin, AlertTriangle, Camera, Trash2, Scale, CheckCircle2, XCircle, BarChart3, PenTool, Store, ShieldAlert, Wallet } from 'lucide-react';
import { ClientData, SupervisionData, ClientPhoto } from '../types';

interface SectionEightProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
  setTabLocked: (locked: boolean) => void;
  activeDocId: string | null;
}

const SectionEight: React.FC<SectionEightProps> = ({ data, updateData, setTabLocked, activeDocId }) => {
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageWorker, setImageWorker] = useState<Worker | null>(null);

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

  const updateSupervision = (field: keyof SupervisionData, value: any) => {
    updateData('supervision', {
      ...data.supervision,
      [field]: value
    });
  };

  const captureVisitGPS = () => {
    setGpsLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateSupervision('visitGps', {
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
    updateSupervision('photos', [...data.supervision.photos, newPhoto]);
  };

  const removePhoto = (id: string) => {
    updateSupervision('photos', data.supervision.photos.filter(p => p.id !== id));
  };

  const updatePhotoComment = (id: string, comment: string) => {
    updateSupervision('photos', data.supervision.photos.map(p => p.id === id ? { ...p, comment } : p));
  };

  const weeklySales = typeof data.supervision.weeklySales === 'number' ? data.supervision.weeklySales : 0;
  const weeklyCosts = typeof data.supervision.weeklyCosts === 'number' ? data.supervision.weeklyCosts : 0;
  const weeklyFamilyExpenses = typeof data.supervision.weeklyFamilyExpenses === 'number' ? data.supervision.weeklyFamilyExpenses : 0;

  const weeklySurplus = weeklySales - weeklyCosts - weeklyFamilyExpenses;
  const monthlySurplus = weeklySurplus * 4.3;

  const calculateEstimatedQuota = () => {
    const loanAmt = typeof data.loanAmount === 'number' ? data.loanAmount : 0;
    const annualRate = typeof data.loanInterestRate === 'number' ? data.loanInterestRate : 0;
    const termMonths = typeof data.loanTerm === 'number' ? data.loanTerm : 0;
    const monthlyRate = annualRate / 100 / 12;

    if (loanAmt === 0 || termMonths === 0) return 0;
    if (monthlyRate === 0) return loanAmt / termMonths;
    
    return (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  };

  const loanQuota = calculateEstimatedQuota();
  const coverageRatio = loanQuota > 0 ? monthlySurplus / loanQuota : 0;

  const calculateSection3MonthlySales = () => {
    const calcType = (amount: number | '', freq: number | '') => {
      return (typeof amount === 'number' ? amount : 0) * (typeof freq === 'number' ? freq : 0);
    };
    const good = calcType(data.salesGood.amount, data.salesGood.frequency);
    const regular = calcType(data.salesRegular.amount, data.salesRegular.frequency);
    const bad = calcType(data.salesBad.amount, data.salesBad.frequency);
    return good + regular + bad;
  };
  
  const sec3Sales = calculateSection3MonthlySales();
  const estimatedMonthlyIncome = weeklySales * 4.3;
  const difference = estimatedMonthlyIncome - sec3Sales;
  const diffPercent = sec3Sales > 0 ? (difference / sec3Sales) * 100 : 0;
  const isConsistent = Math.abs(diffPercent) < 25;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      <div className="pb-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          Sección 8. Supervisión
        </h2>
        <p className="text-gray-500 mt-1">Informe de visita de campo, verificación de riesgos y uso de fondos.</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <ClipboardList className="w-5 h-5 mr-2" />
          Informe de Supervisión
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Supervisor</label>
             <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                value={data.supervision.supervisorName} onChange={(e) => updateSupervision('supervisorName', e.target.value)} />
           </div>
           <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Visita</label>
                <input type="date" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                   value={data.supervision.visitDate} onChange={(e) => updateSupervision('visitDate', e.target.value)} />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input type="time" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                   value={data.supervision.visitTime} onChange={(e) => updateSupervision('visitTime', e.target.value)} />
             </div>
           </div>
           <div className="md:col-span-2">
             <label className="block text-sm font-medium text-gray-700 mb-1">Lugar</label>
             <div className="flex gap-2">
                <input type="text" className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary" 
                   placeholder="Dirección o referencia del lugar visitado"
                   value={data.supervision.visitPlace} onChange={(e) => updateSupervision('visitPlace', e.target.value)} />
                <button 
                   type="button"
                   onClick={captureVisitGPS}
                   disabled={gpsLoading}
                   className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-blue-800 transition-colors flex items-center text-sm disabled:opacity-50"
                >
                   {gpsLoading ? '...' : 'GPS'}
                   <MapPin className="w-4 h-4 ml-1" />
                </button>
             </div>
             {data.supervision.visitGps && (
                <p className="text-xs text-green-600 mt-1 flex items-center">
                   <MapPin className="w-3 h-3 mr-1" />
                   Coordenadas Capturadas: {data.supervision.visitGps.lat.toFixed(6)}, {data.supervision.visitGps.lng.toFixed(6)}
                </p>
             )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
           <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center uppercase">
             <Store className="w-5 h-5 mr-2" />
             Negocio
           </h3>
           <div className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">a. Evolución de Ventas</label>
                 <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                    value={data.supervision.salesEvolution} onChange={(e) => updateSupervision('salesEvolution', e.target.value)}>
                    <option value="">Seleccione...</option>
                    <option value="Aumentaron">Aumentaron</option>
                    <option value="Estables">Estables</option>
                    <option value="Disminuyeron">Disminuyeron</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">b. Nivel de Inventario</label>
                 <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                    value={data.supervision.inventoryLevel} onChange={(e) => updateSupervision('inventoryLevel', e.target.value)}>
                    <option value="">Seleccione...</option>
                    <option value="Alto/Lleno">Alto/Lleno</option>
                    <option value="Medio">Medio</option>
                    <option value="Bajo/Escaso">Bajo/Escaso</option>
                    <option value="Obsoleto">Obsoleto</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">c. Propiedad del negocio</label>
                 <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                    value={data.supervision.businessOwnership} onChange={(e) => updateSupervision('businessOwnership', e.target.value)}>
                    <option value="">Seleccione...</option>
                    <option value="Del solicitante">Del solicitante</option>
                    <option value="De otra persona">De otra persona</option>
                    <option value="No se pudo identificar">No se pudo identificar</option>
                 </select>
              </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
           <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center uppercase">
             <ShieldAlert className="w-5 h-5 mr-2" />
             Riesgos
           </h3>
           <div className="space-y-4">
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">a. Voluntad de Pago / Transparencia</label>
                 <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                    value={data.supervision.willingnessToPay} onChange={(e) => updateSupervision('willingnessToPay', e.target.value)}>
                    <option value="">Seleccione...</option>
                    <option value="Buena">Buena</option>
                    <option value="Regular">Regular</option>
                    <option value="Mala">Mala</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">b. Estado de la garantía</label>
                 <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                    value={data.supervision.guaranteeStatus} onChange={(e) => updateSupervision('guaranteeStatus', e.target.value)}>
                    <option value="">Seleccione...</option>
                    <option value="Bueno">Bueno</option>
                    <option value="Regular">Regular</option>
                    <option value="Malo">Malo</option>
                 </select>
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">c. Comentario de la garantía</label>
                 <input type="text" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                    placeholder="Detalles observados..."
                    value={data.supervision.guaranteeComment} onChange={(e) => updateSupervision('guaranteeComment', e.target.value)} />
              </div>
              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">d. Nivel de Riesgo identificado</label>
                 <div className="flex space-x-2">
                    {['Bajo', 'Medio', 'Alto'].map(level => (
                       <label key={level} className={`flex-1 p-2 border rounded-md text-center cursor-pointer text-sm transition-colors ${
                          data.supervision.riskLevel === level 
                          ? level === 'Alto' ? 'bg-red-100 border-red-500 text-red-800 font-bold' 
                          : level === 'Medio' ? 'bg-yellow-100 border-yellow-500 text-yellow-800 font-bold' 
                          : 'bg-green-100 border-green-500 text-green-800 font-bold'
                          : 'hover:bg-gray-50'
                       }`}>
                          <input type="radio" name="riskLevel" value={level} className="hidden"
                             checked={data.supervision.riskLevel === level} 
                             onChange={(e) => updateSupervision('riskLevel', e.target.value)} />
                          {level}
                       </label>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center uppercase">
          <Scale className="w-5 h-5 mr-2" />
          Capacidad de Pago
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">a. Ventas Semanales (Q)</label>
              <input type="number" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                 value={data.supervision.weeklySales} onChange={(e) => updateSupervision('weeklySales', parseFloat(e.target.value) || '')} />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">b. Costos Negocio Semanal (Q)</label>
              <input type="number" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                 value={data.supervision.weeklyCosts} onChange={(e) => updateSupervision('weeklyCosts', parseFloat(e.target.value) || '')} />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">c. Gastos Familia Semanal (Q)</label>
              <input type="number" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                 value={data.supervision.weeklyFamilyExpenses} onChange={(e) => updateSupervision('weeklyFamilyExpenses', parseFloat(e.target.value) || '')} />
           </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-2">
              <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Excedente Semanal (Calculado):</span>
                 <span className="font-bold text-gray-800">Q {weeklySurplus.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Excedente Mensual (x 4.3):</span>
                 <span className="font-bold text-blue-800">Q {monthlySurplus.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
              </div>
           </div>
           <div className="space-y-2 border-l border-gray-200 pl-6">
              <div className="flex justify-between text-sm">
                 <span className="text-gray-600">Cuota Préstamo (Sección 3):</span>
                 <span className="font-bold text-red-800">Q {loanQuota.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                 <span className="text-gray-600">Ratio de Cobertura (Excedente/Cuota):</span>
                 <span className={`font-bold text-lg px-2 rounded ${coverageRatio >= 1.3 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {coverageRatio.toFixed(2)}
                 </span>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
         <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center uppercase">
           <BarChart3 className="w-5 h-5 mr-2" />
           Cruce de Información (Validación)
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
             <div className="p-4 bg-blue-50 rounded-md text-center border border-blue-100">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Ingresos Mensuales Estimados</div>
                <div className="text-xl font-bold text-blue-800">Q {estimatedMonthlyIncome.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
                <div className="text-[10px] text-gray-400">(Basado en Ventas Semanales x 4.3)</div>
             </div>
             <div className="p-4 bg-gray-50 rounded-md text-center border border-gray-200">
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Ventas Mensuales Declaradas</div>
                <div className="text-xl font-bold text-gray-800">Q {sec3Sales.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
                <div className="text-[10px] text-gray-400">(Dato de Sección 3)</div>
             </div>
             <div className={`p-4 rounded-md text-center border ${isConsistent ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="text-xs text-gray-500 uppercase font-bold mb-1">¿Es Coherente?</div>
                <div className={`text-lg font-bold flex justify-center items-center ${isConsistent ? 'text-green-700' : 'text-red-700'}`}>
                   {isConsistent ? <CheckCircle2 className="w-5 h-5 mr-2"/> : <XCircle className="w-5 h-5 mr-2"/>}
                   {isConsistent ? 'SI' : 'NO'}
                </div>
                <div className="text-[10px] text-gray-500 mt-1">Diferencia: {diffPercent.toFixed(1)}%</div>
             </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center uppercase">
           <Wallet className="w-5 h-5 mr-2" />
           Uso de Fondos (Si Aplica)
        </h3>
        <p className="text-xs text-gray-500 mb-4">Llenar si se está realizando supervisión de uso de fondos de crédito.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">¿El uso del préstamo coincide con lo aprobado?</label>
              <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                 value={data.supervision.loanUseCheck} onChange={(e) => updateSupervision('loanUseCheck', e.target.value)}>
                 <option value="">Seleccione...</option>
                 <option value="SI">SI</option>
                 <option value="NO">NO</option>
                 <option value="No Aplicable">No Aplicable</option>
              </select>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la Inversión</label>
              <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary"
                 value={data.supervision.investmentStatus} onChange={(e) => updateSupervision('investmentStatus', e.target.value)}>
                 <option value="">Seleccione...</option>
                 <option value="Bueno">Bueno</option>
                 <option value="Regular">Regular</option>
                 <option value="Malo">Malo</option>
              </select>
           </div>
           <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de la Evidencia</label>
              <textarea className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary" rows={2}
                 placeholder="Describa lo observado..."
                 value={data.supervision.evidenceDescription} onChange={(e) => updateSupervision('evidenceDescription', e.target.value)} />
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
         <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center uppercase">
            <Camera className="w-5 h-5 mr-2" />
            Fotos de la Supervisión
         </h3>
         
         <div className="mb-6">
             <label className={`inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white cursor-pointer transition-colors ${isUploading ? 'bg-gray-400' : 'bg-brand-secondary hover:bg-blue-700'}`}>
                {isUploading ? `Subiendo... ${uploadProgress.toFixed(0)}%` : '+ Agregar Foto'}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
             </label>
             {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
             )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.supervision.photos.map((photo) => (
               <div key={photo.id} className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex flex-col">
                  <div className="h-40 bg-gray-200 relative">
                     <img src={photo.url} alt="Evidencia" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2 flex-grow flex flex-col">
                     <textarea className="w-full text-xs border border-gray-300 rounded p-1 mb-2 resize-none focus:ring-1 focus:ring-brand-primary focus:border-transparent flex-grow"
                        placeholder="Comentario de la foto..."
                        rows={2}
                        value={photo.comment} onChange={(e) => updatePhotoComment(photo.id, e.target.value)} />
                     <div className="flex justify-between items-center mt-auto">
                        <span className="text-[9px] text-gray-400">{photo.timestamp}</span>
                        <button onClick={() => removePhoto(photo.id)} className="text-red-500 hover:text-red-700 p-1">
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               </div>
            ))}
            {data.supervision.photos.length === 0 && (
               <div className="col-span-full text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded">
                  No hay fotos en esta sección.
               </div>
            )}
         </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
         <h3 className="text-lg font-semibold text-brand-primary mb-2 flex items-center uppercase">
            <PenTool className="w-5 h-5 mr-2" />
            Conclusión de la Supervisión
         </h3>
         <textarea className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-brand-primary focus:border-transparent" rows={4}
             placeholder="Escriba aquí las conclusiones finales..."
             value={data.supervision.conclusion} onChange={(e) => updateSupervision('conclusion', e.target.value)} />
      </div>

    </div>
  );
};

export default SectionEight;
