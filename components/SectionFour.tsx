
import React, { useMemo, useState } from 'react';
import { ShoppingBag, Truck, Home, Car, Package, Plus, Trash2, AlertOctagon, Calculator, Printer, FileDown, FileUp, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { ClientData, InventoryItem, Supplier, RealEstateAsset, VehicleAsset, OtherAsset } from '../types';

interface SectionFourProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
}

const SectionFour: React.FC<SectionFourProps> = ({ data, updateData }) => {
  const [aiLoading, setAiLoading] = useState(false);

  // --- INVENTORY HELPERS ---
  const addInventoryItem = () => {
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: '',
      unit: '',
      stockQty: '',
      purchasePrice: '',
      salePrice: '',
      purchaseQty: '',
      purchaseFrequency: ''
    };
    updateData('inventory', [...data.inventory, newItem]);
  };

  const updateInventoryItem = (id: string, field: keyof InventoryItem, value: any) => {
    updateData('inventory', data.inventory.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeInventoryItem = (id: string) => {
    updateData('inventory', data.inventory.filter(i => i.id !== id));
  };

  // --- AI INVENTORY IMPORT ---
  const handleInventoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate type: image or pdf
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
          alert("Solo se permiten imágenes o PDF.");
          return;
      }

      setAiLoading(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Helper to convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
                const base64 = result.split(',')[1]; 
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const prompt = `Analiza este documento (PDF o Imagen) que contiene una lista de inventario. Extrae los items en una lista JSON. 
        Campos requeridos por item: 
        - name (nombre del producto)
        - unit (unidad de medida ej: lb, unidad, par)
        - stockQty (cantidad existente, número)
        - purchasePrice (precio de costo unitario, número)
        - salePrice (precio de venta unitario, número)
        
        Si algún dato numérico no es claro, usa 0. Trata de inferir la unidad.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType: file.type, data: base64Data } }
                    ]
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            unit: { type: Type.STRING },
                            stockQty: { type: Type.NUMBER },
                            purchasePrice: { type: Type.NUMBER },
                            salePrice: { type: Type.NUMBER },
                        }
                    }
                }
            }
        });

        // CRITICAL FIX: Sanitize Markdown blocks from AI response
        let jsonString = response.text || "[]";
        jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();

        const items = JSON.parse(jsonString);
        
        const newInventoryItems: InventoryItem[] = items.map((i: any) => ({
            id: Date.now().toString() + Math.random().toString().slice(2),
            name: i.name || 'Item importado',
            unit: i.unit || 'Unidad',
            stockQty: i.stockQty || '',
            purchasePrice: i.purchasePrice || '',
            salePrice: i.salePrice || '',
            purchaseQty: '',
            purchaseFrequency: ''
        }));

        updateData('inventory', [...data.inventory, ...newInventoryItems]);
        alert(`Se importaron ${newInventoryItems.length} productos exitosamente.`);

      } catch (error) {
          console.error("Error parsing inventory:", error);
          alert("No se pudo procesar el inventario. Intente con una imagen más clara o un formato diferente.");
      } finally {
          setAiLoading(false);
          // Reset input
          e.target.value = '';
      }
    }
  };

  // --- SUPPLIER HELPERS ---
  const addSupplier = () => {
    updateData('suppliers', [...data.suppliers, { id: Date.now().toString(), name: '', contact: '', phone: '' }]);
  };

  const updateSupplier = (id: string, field: keyof Supplier, value: any) => {
    updateData('suppliers', data.suppliers.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeSupplier = (id: string) => {
    updateData('suppliers', data.suppliers.filter(i => i.id !== id));
  };

  // --- ASSET HELPERS ---
  const addRealEstate = () => {
    updateData('realEstateAssets', [...data.realEstateAssets, { 
      id: Date.now().toString(), description: '', location: '', estimatedValue: '', landArea: '', builtArea: '', registryNumber: '' 
    }]);
  };

  const updateRealEstate = (id: string, field: keyof RealEstateAsset, value: any) => {
    updateData('realEstateAssets', data.realEstateAssets.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeRealEstate = (id: string) => {
    updateData('realEstateAssets', data.realEstateAssets.filter(i => i.id !== id));
  };

  const addVehicle = () => {
    updateData('vehicleAssets', [...data.vehicleAssets, { 
      id: Date.now().toString(), description: '', year: '', estimatedValue: '', plateNumber: '' 
    }]);
  };

  const updateVehicle = (id: string, field: keyof VehicleAsset, value: any) => {
    updateData('vehicleAssets', data.vehicleAssets.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeVehicle = (id: string) => {
    updateData('vehicleAssets', data.vehicleAssets.filter(i => i.id !== id));
  };

  const addOtherAsset = () => {
    updateData('otherAssets', [...data.otherAssets, { 
      id: Date.now().toString(), description: '', estimatedValue: '', registryNumber: '' 
    }]);
  };

  const updateOtherAsset = (id: string, field: keyof OtherAsset, value: any) => {
    updateData('otherAssets', data.otherAssets.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeOtherAsset = (id: string) => {
    updateData('otherAssets', data.otherAssets.filter(i => i.id !== id));
  };

  // --- CALCULATIONS ---
  
  // 1. Inventory Totals
  const totalInventoryValue = data.inventory.reduce((sum, item) => {
    return sum + ((typeof item.stockQty === 'number' && typeof item.purchasePrice === 'number') ? item.stockQty * item.purchasePrice : 0);
  }, 0);

  const totalEstimatedMonthlyPurchases = data.inventory.reduce((sum, item) => {
    const val = (typeof item.purchaseQty === 'number' && typeof item.purchasePrice === 'number' && typeof item.purchaseFrequency === 'number')
      ? item.purchaseQty * item.purchasePrice * item.purchaseFrequency
      : 0;
    return sum + val;
  }, 0);

  const totalEstimatedMonthlySales = data.inventory.reduce((sum, item) => {
    const val = (typeof item.purchaseQty === 'number' && typeof item.salePrice === 'number' && typeof item.purchaseFrequency === 'number')
      ? item.purchaseQty * item.salePrice * item.purchaseFrequency
      : 0;
    return sum + val;
  }, 0);

  // 2. Section 3 Average Sales (Re-calculated here as it's not stored computed)
  const calculateSection3Sales = () => {
    const calcType = (amount: number | '', freq: number | '') => {
      return (typeof amount === 'number' ? amount : 0) * (typeof freq === 'number' ? freq : 0);
    };
    const good = calcType(data.salesGood.amount, data.salesGood.frequency);
    const regular = calcType(data.salesRegular.amount, data.salesRegular.frequency);
    const bad = calcType(data.salesBad.amount, data.salesBad.frequency);
    return good + regular + bad;
  };
  const section3AvgSales = calculateSection3Sales();

  // 3. Difference Analysis
  const salesDifference = totalEstimatedMonthlySales - section3AvgSales;
  const salesDifferencePercent = section3AvgSales > 0 ? (salesDifference / section3AvgSales) * 100 : 0;
  const isAlert = Math.abs(salesDifferencePercent) > 35;

  // 4. Asset Totals
  const totalRealEstate = data.realEstateAssets.reduce((sum, item) => sum + (typeof item.estimatedValue === 'number' ? item.estimatedValue : 0), 0);
  const totalVehicles = data.vehicleAssets.reduce((sum, item) => sum + (typeof item.estimatedValue === 'number' ? item.estimatedValue : 0), 0);
  const totalOtherAssets = data.otherAssets.reduce((sum, item) => sum + (typeof item.estimatedValue === 'number' ? item.estimatedValue : 0), 0);
  
  const grandTotalAssets = totalRealEstate + totalVehicles + totalOtherAssets;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      
      {/* Header */}
      <div className="pb-4 border-b border-gray-200 flex justify-between items-end print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            Análisis de Crédito: {data.fullName || 'Cliente'}
          </h2>
          <p className="text-gray-500 text-sm">Op:{data.operationNumber || '---'}</p>
        </div>
      </div>

      {/* 1. Inventario Detallado */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-lg font-semibold text-brand-primary mb-2 flex items-center">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Inventario Detallado del Negocio y Análisis de Compras
                </h3>
                <p className="text-xs text-gray-500">
                Liste los productos más importantes o cargue una lista desde PDF/Imagen.
                </p>
            </div>
            {/* AI Import Button */}
            <div className="print:hidden">
                <label className={`flex items-center px-4 py-2 rounded-md text-sm font-medium text-white cursor-pointer transition-colors ${aiLoading ? 'bg-gray-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700'}`}>
                    {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                    {aiLoading ? 'Procesando...' : 'Cargar Lista desde PDF / Foto con IA'}
                    <input 
                        type="file" 
                        accept="image/*,application/pdf" 
                        className="hidden" 
                        onChange={handleInventoryFileUpload} 
                        disabled={aiLoading}
                    />
                </label>
            </div>
        </div>

        <div className="space-y-6">
          {data.inventory.map((item) => {
             // Item Calculations
             const costPercent = (typeof item.purchasePrice === 'number' && typeof item.salePrice === 'number' && item.salePrice > 0)
               ? (item.purchasePrice / item.salePrice) * 100
               : 0;

             const itemStockValue = (typeof item.stockQty === 'number' && typeof item.purchasePrice === 'number')
               ? item.stockQty * item.purchasePrice 
               : 0;
             
             const itemEstPurchases = (typeof item.purchaseQty === 'number' && typeof item.purchasePrice === 'number' && typeof item.purchaseFrequency === 'number')
               ? item.purchaseQty * item.purchasePrice * item.purchaseFrequency
               : 0;

             const itemEstSales = (typeof item.purchaseQty === 'number' && typeof item.salePrice === 'number' && typeof item.purchaseFrequency === 'number')
               ? item.purchaseQty * item.salePrice * item.purchaseFrequency
               : 0;

             return (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">Descripción del Producto</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.name} onChange={(e) => updateInventoryItem(item.id, 'name', e.target.value)} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">Unidad de Medida</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.unit} onChange={(e) => updateInventoryItem(item.id, 'unit', e.target.value)} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">Cantidad en Stock</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.stockQty} onChange={(e) => updateInventoryItem(item.id, 'stockQty', parseFloat(e.target.value) || '')} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">Valor Compra Unit. (Q)</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.purchasePrice} onChange={(e) => updateInventoryItem(item.id, 'purchasePrice', parseFloat(e.target.value) || '')} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">Valor Venta Unit. (Q)</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.salePrice} onChange={(e) => updateInventoryItem(item.id, 'salePrice', parseFloat(e.target.value) || '')} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">Cantidad por Compra</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.purchaseQty} onChange={(e) => updateInventoryItem(item.id, 'purchaseQty', parseFloat(e.target.value) || '')} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-700">Frecuencia de Compra (veces/mes)</label>
                     <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.purchaseFrequency} onChange={(e) => updateInventoryItem(item.id, 'purchaseFrequency', parseFloat(e.target.value) || '')} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-xs font-medium text-gray-500">Porcentaje de Costo (Calculado)</label>
                    <div className="w-full p-2 bg-gray-200 rounded-md text-gray-700 font-medium">
                      {costPercent.toFixed(2)}%
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between items-center text-xs text-gray-600 border-t border-gray-200 pt-2">
                   <div className="flex gap-4">
                      <span className="font-semibold text-gray-800">Subtotal Stock: Q {itemStockValue.toFixed(2)}</span>
                      <span className="text-blue-600">Compras Est./Mes: Q {itemEstPurchases.toFixed(2)}</span>
                      <span className="text-green-600">Ventas Est./Mes: Q {itemEstSales.toFixed(2)}</span>
                   </div>
                   <button onClick={() => removeInventoryItem(item.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200">
                      Eliminar
                   </button>
                </div>
              </div>
             );
          })}
          <button onClick={addInventoryItem} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Agregar Artículo
          </button>
        </div>

        {/* Inventory Totals & Analysis */}
        <div className="mt-8 bg-blue-50 p-6 rounded-lg border border-blue-100">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex justify-between text-sm py-1">
                   <span className="text-gray-600">Cálculo de Valor Inventario:</span>
                   <span className="font-bold text-gray-800">Q {totalInventoryValue.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                   <span className="text-blue-700">Cálculo de Compras Estimadas por Mes:</span>
                   <span className="font-bold text-blue-800">Q {totalEstimatedMonthlyPurchases.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between text-sm py-1">
                   <span className="text-green-700">Cálculo de Ventas Estimadas por Mes (por Lado de las Compras):</span>
                   <span className="font-bold text-green-800">Q {totalEstimatedMonthlySales.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
              <div className="border-l border-blue-200 pl-6">
                <div className="flex justify-between text-sm py-1 bg-white/50 px-2 rounded">
                   <span className="text-gray-600">Ingreso por Ventas Promedio Mensual (Sección 3):</span>
                   <span className="font-bold text-gray-800">Q {section3AvgSales.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                </div>
                
                <div className={`mt-4 p-3 rounded-md flex items-start space-x-3 ${isAlert ? 'bg-red-100 border border-red-200' : 'bg-green-100 border border-green-200'}`}>
                    {isAlert ? <AlertOctagon className="w-6 h-6 text-red-600" /> : <div className="w-6 h-6 text-green-600 text-xl">✓</div>}
                    <div>
                       <div className="text-xs text-gray-500 uppercase font-bold mb-1">Diferencia (Ventas Est. Inventario - Ventas Sec. 3)</div>
                       <div className={`text-lg font-bold ${isAlert ? 'text-red-700' : 'text-green-700'}`}>
                          Q {salesDifference.toLocaleString('es-GT', {minimumFractionDigits: 2})} ({salesDifferencePercent.toFixed(2)}%)
                       </div>
                       {isAlert && <div className="text-xs text-red-600 mt-1">¡Alerta! La diferencia es mayor al 35%. Verifique la consistencia de los datos.</div>}
                    </div>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* 2. Proveedores */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Truck className="w-5 h-5 mr-2" />
          Proveedores
        </h3>
        <div className="space-y-4">
           {data.suppliers.map((supplier) => (
              <div key={supplier.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end border-b border-gray-100 pb-4">
                 <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-700">Nombre del proveedor</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                       value={supplier.name} onChange={(e) => updateSupplier(supplier.id, 'name', e.target.value)} />
                 </div>
                 <div className="md:col-span-4">
                    <label className="block text-xs font-medium text-gray-700">Nombre del contacto</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                       value={supplier.contact} onChange={(e) => updateSupplier(supplier.id, 'contact', e.target.value)} />
                 </div>
                 <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-gray-700">Número de teléfono</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                       value={supplier.phone} onChange={(e) => updateSupplier(supplier.id, 'phone', e.target.value)} />
                 </div>
                 <div className="md:col-span-1">
                    <button onClick={() => removeSupplier(supplier.id)} className="p-2 w-full bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs">
                       Eliminar
                    </button>
                 </div>
              </div>
           ))}
           <button onClick={addSupplier} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
             <Plus className="w-4 h-4 mr-1" /> Agregar Proveedor
           </button>
        </div>
      </div>

      {/* 3. Activos: Bienes Inmuebles */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Home className="w-5 h-5 mr-2" />
          Activos: Bienes Inmuebles
        </h3>
        <div className="space-y-4">
           {data.realEstateAssets.map((asset) => (
              <div key={asset.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 relative">
                 <div className="grid grid-cols-1 gap-4 mb-3">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-medium text-gray-700">Descripción</label>
                           <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                              value={asset.description} onChange={(e) => updateRealEstate(asset.id, 'description', e.target.value)} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-700">Ubicación</label>
                           <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                              value={asset.location} onChange={(e) => updateRealEstate(asset.id, 'location', e.target.value)} />
                        </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                           <label className="block text-xs font-medium text-gray-700">Valor Estimado (Q)</label>
                           <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                              value={asset.estimatedValue} onChange={(e) => updateRealEstate(asset.id, 'estimatedValue', parseFloat(e.target.value) || '')} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-700">Metros de terreno</label>
                           <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                              value={asset.landArea} onChange={(e) => updateRealEstate(asset.id, 'landArea', parseFloat(e.target.value) || '')} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-700">Metros construidos</label>
                           <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                              value={asset.builtArea} onChange={(e) => updateRealEstate(asset.id, 'builtArea', parseFloat(e.target.value) || '')} />
                        </div>
                        <div>
                           <label className="block text-xs font-medium text-gray-700">Registro #</label>
                           <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                              value={asset.registryNumber} onChange={(e) => updateRealEstate(asset.id, 'registryNumber', e.target.value)} />
                        </div>
                     </div>
                 </div>
                 <div className="flex justify-end">
                     <button onClick={() => removeRealEstate(asset.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs">
                        Eliminar
                     </button>
                 </div>
              </div>
           ))}
           <button onClick={addRealEstate} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
             <Plus className="w-4 h-4 mr-1" /> Agregar Activos: Bienes Inmuebles
           </button>
           <div className="mt-2 bg-gray-100 p-2 rounded flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Subtotal Activos: Bienes Inmuebles:</span>
              <span className="font-bold text-gray-900">Q {totalRealEstate.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
           </div>
        </div>
      </div>

      {/* 4. Activos: Vehículos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <Car className="w-5 h-5 mr-2" />
          Activos: Vehículos
        </h3>
        <div className="space-y-4">
           {data.vehicleAssets.map((asset) => (
              <div key={asset.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 relative">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                       <label className="block text-xs font-medium text-gray-700">Descripción (Tipo, modelo, Marca)</label>
                       <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                          value={asset.description} onChange={(e) => updateVehicle(asset.id, 'description', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                       <div>
                          <label className="block text-xs font-medium text-gray-700">Año</label>
                          <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                             value={asset.year} onChange={(e) => updateVehicle(asset.id, 'year', parseInt(e.target.value) || '')} />
                       </div>
                       <div>
                          <label className="block text-xs font-medium text-gray-700">Valor Estimado (Q)</label>
                          <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                             value={asset.estimatedValue} onChange={(e) => updateVehicle(asset.id, 'estimatedValue', parseFloat(e.target.value) || '')} />
                       </div>
                       <div>
                          <label className="block text-xs font-medium text-gray-700">Placa #</label>
                          <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                             value={asset.plateNumber} onChange={(e) => updateVehicle(asset.id, 'plateNumber', e.target.value)} />
                       </div>
                    </div>
                 </div>
                 <div className="flex justify-end">
                     <button onClick={() => removeVehicle(asset.id)} className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs">
                        Eliminar
                     </button>
                 </div>
              </div>
           ))}
           <button onClick={addVehicle} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
             <Plus className="w-4 h-4 mr-1" /> Agregar Activos: Vehículo
           </button>
           <div className="mt-2 bg-gray-100 p-2 rounded flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Subtotal Activos: Vehículos:</span>
              <span className="font-bold text-gray-900">Q {totalVehicles.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
           </div>
        </div>
      </div>

      {/* 5. Activos: Otros */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <div className="flex items-center mb-4">
          <Package className="w-5 h-5 mr-2 text-brand-primary" />
          <h3 className="text-lg font-semibold text-brand-primary mr-2">
            Activos: Otros Activos de Valor
          </h3>
          <span className="text-xs text-gray-500 italic font-normal">(dinero, bienes muebles, maquinaria, ganado, inversiones, etc.)</span>
        </div>

        <div className="space-y-4">
           {data.otherAssets.map((asset) => (
              <div key={asset.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 relative flex items-end gap-4">
                 <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-700">Descripción</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                       value={asset.description} onChange={(e) => updateOtherAsset(asset.id, 'description', e.target.value)} />
                 </div>
                 <div className="w-40">
                    <label className="block text-xs font-medium text-gray-700">Valor Estimado (Q)</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                       value={asset.estimatedValue} onChange={(e) => updateOtherAsset(asset.id, 'estimatedValue', parseFloat(e.target.value) || '')} />
                 </div>
                 <div className="w-40">
                    <label className="block text-xs font-medium text-gray-700">Registro #</label>
                    <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                       value={asset.registryNumber} onChange={(e) => updateOtherAsset(asset.id, 'registryNumber', e.target.value)} />
                 </div>
                 <div>
                     <button onClick={() => removeOtherAsset(asset.id)} className="px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs">
                        Eliminar
                     </button>
                 </div>
              </div>
           ))}
           <button onClick={addOtherAsset} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
             <Plus className="w-4 h-4 mr-1" /> Agregar Activos: Otros Activos de Valor
           </button>
           <div className="mt-2 bg-gray-100 p-2 rounded flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Subtotal Activos: Otros Activos de Valor:</span>
              <span className="font-bold text-gray-900">Q {totalOtherAssets.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
           </div>
        </div>
      </div>

      {/* 6. Resumen Total de Activos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Resumen Total de Activos
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-3">
                 <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-600">a) Inmuebles</span>
                    <span className="font-bold text-gray-800">Q {totalRealEstate.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-600">b) Vehículos</span>
                    <span className="font-bold text-gray-800">Q {totalVehicles.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                 </div>
                 <div className="flex justify-between text-sm border-b border-gray-100 pb-2">
                    <span className="text-gray-600">c) Otros Activos</span>
                    <span className="font-bold text-gray-800">Q {totalOtherAssets.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span>
                 </div>
             </div>
             <div className="flex flex-col justify-center">
                 <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-center">
                     <div className="text-xs text-blue-600 uppercase font-bold mb-1">Total Valor de Activos</div>
                     <div className="text-2xl font-bold text-blue-900">Q {grandTotalAssets.toLocaleString('es-GT', {minimumFractionDigits: 2})}</div>
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

export default SectionFour;
