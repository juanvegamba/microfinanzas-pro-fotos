
import React, { useMemo } from 'react';
import { FileText, Building2, DollarSign, Store, Scale, BrainCircuit, Users, Printer, FileDown } from 'lucide-react';
import { ClientData, MONTHS } from '../types';

interface SectionTenProps {
  data: ClientData;
}

// QA HELPER: Safe Number conversion (Standardized from Section 9)
const safeNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const SectionTen: React.FC<SectionTenProps> = ({ data }) => {

  // ==========================================
  // RE-USE CALCULATION ENGINE FROM SECTION 9
  // ==========================================

  // 1. Financial Basics
  const calcType = (amount: number | '', freq: number | '') => safeNum(amount) * safeNum(freq);
  const baseMonthlySales = calcType(data.salesGood.amount, data.salesGood.frequency) + calcType(data.salesRegular.amount, data.salesRegular.frequency) + calcType(data.salesBad.amount, data.salesBad.frequency);
  const sec3Sales = baseMonthlySales;

  const totalBusinessFixedExpenses = 
    safeNum(data.expensesEmployees) + 
    safeNum(data.expensesRent) + 
    safeNum(data.expensesUtilities) + 
    safeNum(data.expensesTransport) + 
    safeNum(data.expensesMaintenance) + 
    (data.otherBusinessExpenses || []).reduce((sum, item) => sum + safeNum(item.amount), 0);
  
  const totalFamilyExpenses = 
    safeNum(data.familyFood) + 
    safeNum(data.familyTransport) + 
    safeNum(data.familyEducation) + 
    safeNum(data.familyUtilities) + 
    safeNum(data.familyComms) + 
    safeNum(data.familyHealth) + 
    safeNum(data.familyOther);
  
  const totalExistingDebtPayment = (data.existingDebts || []).reduce((sum, item) => sum + safeNum(item.monthlyQuota), 0);
  
  const netVariableAnnual = (data.variableItems || []).reduce((acc, item) => { 
    const val = safeNum(item.amount); 
    return item.type === 'Ingreso' ? acc + val : acc - val; 
  }, 0);
  const avgNetVariableMonthly = netVariableAnnual / 12;

  // 2. Loan & Capacity
  const loanAmt = safeNum(data.loanAmount);
  const annualRate = safeNum(data.loanInterestRate);
  const termMonths = safeNum(data.loanTerm) || 24;
  const monthlyRate = annualRate / 100 / 12;
  
  const calculatePmt = () => { 
    if (loanAmt === 0 || termMonths === 0) return 0; 
    if (data.loanPaymentMethod === 'Sobre Saldos Decrecientes') { 
        const principal = loanAmt / termMonths; 
        return principal + (loanAmt * monthlyRate); 
    } 
    if (monthlyRate === 0) return loanAmt / termMonths; 
    return (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1); 
  };
  const estimatedNewQuota = calculatePmt();

  const summaryCMV = baseMonthlySales * (safeNum(data.costOfGoodsSold) / 100);
  const summaryGrossProfit = baseMonthlySales - summaryCMV;
  const summaryOperatingProfit = summaryGrossProfit - totalBusinessFixedExpenses;
  const summarySDN = summaryOperatingProfit + avgNetVariableMonthly + safeNum(data.familyIncome) - totalFamilyExpenses - safeNum(data.plannedInvestment) - totalExistingDebtPayment;
  
  const getMargin = () => {
    if (data.creditExperience === 'Recurrente') return 0.25;
    if (data.creditExperience === 'Externo') return 0.30;
    return 0.35; 
  };
  const marginPercent = getMargin();
  const sdnWithMargin = summarySDN * (1 - marginPercent);
  
  const capacityRatio = (safeNum(data.monthlyPaymentCapacity) > 0 && sdnWithMargin > 0) ? safeNum(data.monthlyPaymentCapacity) / sdnWithMargin : 0;
  const rcd = estimatedNewQuota > 0 ? summarySDN / estimatedNewQuota : 0;
  const rcdWithMargin = estimatedNewQuota > 0 ? sdnWithMargin / estimatedNewQuota : 0;

  const calculatePV = (rate: number, nper: number, pmt: number) => {
    if (rate === 0) return pmt * nper;
    return pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
  };
  const maxLoanCapacity = calculatePV(monthlyRate, termMonths, sdnWithMargin);

  // 3. Assets & Liabilities
  const totalInventoryValue = (data.inventory || []).reduce((sum, item) => sum + (safeNum(item.stockQty) * safeNum(item.purchasePrice)), 0);
  const totalRealEstate = (data.realEstateAssets || []).reduce((sum, item) => sum + safeNum(item.estimatedValue), 0);
  const totalVehicles = (data.vehicleAssets || []).reduce((sum, item) => sum + safeNum(item.estimatedValue), 0);
  const totalOtherAssets = (data.otherAssets || []).reduce((sum, item) => sum + safeNum(item.estimatedValue), 0);
  const grandTotalAssets = totalInventoryValue + totalRealEstate + totalVehicles + totalOtherAssets;

  const totalLiabilities = (data.existingDebts || []).reduce((sum, item) => sum + safeNum(item.currentBalance), 0);
  const netWorth = grandTotalAssets - totalLiabilities;

  const totalDebtPostLoan = totalLiabilities + loanAmt;
  const leverageEquity = netWorth > 0 ? totalDebtPostLoan / netWorth : 999;
  const leverageAssets = grandTotalAssets > 0 ? totalDebtPostLoan / grandTotalAssets : 999;

  // 4. Scores
  const totalBusinessScore = data.diversificationScore + data.profitabilityKnowledgeScore + data.operationsManagementScore + data.investmentPlanQualityScore + data.successionPlanningScore;
  const businessScorePercent = (totalBusinessScore / 13) * 100;
  let businessGaugeColor = 'text-red-500';
  let businessGaugeLabel = 'Bajo';
  if (businessScorePercent >= 66) { businessGaugeColor = 'text-green-500'; businessGaugeLabel = 'Alto'; } 
  else if (businessScorePercent >= 33) { businessGaugeColor = 'text-yellow-500'; businessGaugeLabel = 'Medio'; }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans text-gray-800">
      
      <div className="pb-4 border-b border-gray-200 flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-brand-primary">Sección 10. Resumen Ejecutivo</h2>
      </div>

      <div className="hidden print:block mb-4">
        <h1 className="text-2xl font-bold">Resumen de Crédito: {data.fullName}</h1>
      </div>

      {/* 1. Resumen Datos Generales */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <FileText className="w-5 h-5 mr-2"/> 1. Resumen de Datos Generales
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500 block">Cliente:</span> <b>{data.fullName}</b></div>
            <div><span className="text-gray-500 block">DPI:</span> <b>{data.identityDocument}</b></div>
            <div><span className="text-gray-500 block">Edad:</span> <b>{data.age} años</b></div>
            <div><span className="text-gray-500 block">Negocio:</span> <b>{data.businessName}</b></div>
            <div><span className="text-gray-500 block">Sector:</span> <b>{(data.businessSectors || []).join(', ')}</b></div>
            <div><span className="text-gray-500 block">Monto Solicitado:</span> <b>Q {safeNum(data.loanAmount).toLocaleString()}</b></div>
         </div>
      </div>

      {/* 2. Resumen Empresa (Gauge) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <Building2 className="w-5 h-5 mr-2"/> 2. Evaluación Empresarial
         </h3>
         <div className="flex items-center gap-4">
             <div className="relative w-24 h-16 flex justify-center overflow-hidden shrink-0">
                <div className="absolute w-20 h-20 bg-gray-200 rounded-full top-0"></div>
                <div className="absolute w-16 h-16 bg-white rounded-full top-2 z-10 flex items-end justify-center pb-2">
                    <span className={`text-sm font-bold ${businessGaugeColor}`}>{businessScorePercent.toFixed(0)}%</span>
                </div>
             </div>
             <div>
                 <div className="font-bold text-sm">Puntaje Total: {totalBusinessScore}/13</div>
                 <div className={`font-bold ${businessGaugeColor}`}>Nivel: {businessGaugeLabel}</div>
             </div>
             <div className="flex-1 ml-4 text-sm italic text-gray-600 border-l pl-4">
                 "{data.businessObservations}"
             </div>
         </div>
      </div>

      {/* 3. Capacidad de Pago (Grid) */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <DollarSign className="w-5 h-5 mr-2"/> 3. Análisis de Capacidad de Pago
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
           <div className="bg-blue-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Utilidad Bruta</div>
              <div className="text-xl font-bold text-gray-900">Q {summaryGrossProfit.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </div>
           <div className="bg-red-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Total Gastos (Negocio + Familia)</div>
              <div className="text-xl font-bold text-gray-900">Q {(totalBusinessFixedExpenses + totalFamilyExpenses + totalExistingDebtPayment).toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </div>
           <div className="bg-green-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Excedente Antes de Deudas (SDN)</div>
              <div className="text-xl font-bold text-gray-900">Q {summarySDN.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </div>

           <div className="bg-green-100 p-4 rounded-md text-center">
              <div className="text-xs text-gray-700 uppercase font-semibold">Excedente con Margen ({(100 - marginPercent*100).toFixed(0)}% SDN)</div>
              <div className="text-xl font-bold text-gray-900">Q {sdnWithMargin.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </div>
           <div className="bg-gray-100 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Capacidad de Pago Autodeclarada</div>
              <div className="text-xl font-bold text-gray-900">Q {safeNum(data.monthlyPaymentCapacity).toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </div>
           <div className="bg-gray-100 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Declarada / Excedente c/ Margen</div>
              <div className={`text-xl font-bold ${capacityRatio > 1 ? 'text-red-600' : 'text-green-600'}`}>
                 {capacityRatio.toFixed(2)}
              </div>
           </div>

           <div className="bg-pink-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Cuota Nueva Deuda (1er Pago)</div>
              <div className="text-xl font-bold text-gray-900">Q {estimatedNewQuota.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </div>
           <div className="bg-yellow-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Razón de Cobertura de Deuda (RCD)</div>
              <div className="text-xl font-bold text-gray-900">{rcd.toFixed(2)}</div>
           </div>
           <div className="bg-orange-100 p-4 rounded-md text-center">
              <div className="text-xs text-gray-700 uppercase font-semibold">RCD con Margen de Seguridad</div>
              <div className="text-xl font-bold text-gray-900">{rcdWithMargin.toFixed(2)}</div>
           </div>
        </div>

        <div className="bg-blue-100 p-4 rounded-lg text-center border border-blue-200">
             <div className="text-sm text-blue-800 font-semibold uppercase">Capacidad Máxima de Préstamo Estimada</div>
             <div className="text-2xl font-bold text-blue-900 my-1">Q {maxLoanCapacity.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
        </div>
      </div>

      {/* 4. Supervision */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <Store className="w-5 h-5 mr-2"/> 8. Supervisión
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
             <div>
                <p><b>Supervisor:</b> {data.supervision.supervisorName}</p>
                <p><b>Fecha:</b> {data.supervision.visitDate}</p>
                <p><b>Riesgo:</b> {data.supervision.riskLevel}</p>
             </div>
             <div className="bg-gray-50 p-2 rounded">
                <p className="font-bold text-xs text-gray-500 uppercase">Validación Cruce Info</p>
                <p>Ingresos Est: Q {(safeNum(data.supervision.weeklySales)*4.3).toLocaleString('es-GT', {minimumFractionDigits: 2})}</p>
                <p>Coherente: <b>{Math.abs(((safeNum(data.supervision.weeklySales)*4.3) - sec3Sales)/sec3Sales) < 0.25 ? 'SI' : 'NO'}</b></p>
             </div>
         </div>
         <p className="text-xs text-gray-600 mt-2 italic">Conclusión: {data.supervision.conclusion}</p>
      </div>

      {/* 5. Balance */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-6 border-b pb-2 flex items-center">
           <Scale className="w-5 h-5 mr-2"/> 9. Balance Financiero
         </h3>
         <div className="flex flex-col md:flex-row gap-8 mb-4">
            <div className="flex-1 space-y-2 text-sm">
                <div className="flex justify-between font-bold"><span>ACTIVOS:</span><span>Q {grandTotalAssets.toLocaleString()}</span></div>
                <div className="flex justify-between text-red-600"><span>PASIVOS:</span><span>Q {totalLiabilities.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-green-700"><span>PATRIMONIO:</span><span>Q {netWorth.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-blue-600 mt-2 pt-2 border-t"><span>NUEVA DEUDA:</span><span>Q {loanAmt.toLocaleString()}</span></div>
            </div>
            
            {/* Replicated Chart from Section 9 */}
            <div className="flex-1 border border-gray-200 rounded-lg p-6 flex flex-col justify-center items-center">
                <h4 className="font-bold text-sm text-gray-700 mb-6">Gráfico de Estructura Financiera</h4>
                <div className="flex items-end justify-center gap-8 h-[200px] w-full px-8">
                    {/* 1. Activos Bar */}
                    <div className="flex flex-col items-center group w-16">
                       <span className="text-xs font-bold mb-1 text-gray-700">Q{(grandTotalAssets/1000).toFixed(1)}k</span>
                       <div 
                         style={{height: `${Math.max((Number(grandTotalAssets) / (Math.max(Number(grandTotalAssets), Number(loanAmt)) || 1)) * 150, 5)}px`}} 
                         className="w-full bg-blue-500 rounded-t shadow-sm min-h-[4px] max-h-[200px]"
                       ></div>
                       <span className="text-xs text-gray-600 mt-2">Activos</span>
                    </div>

                    {/* 2. Pasivos Bar */}
                    <div className="flex flex-col items-center group w-16">
                       <span className="text-xs font-bold mb-1 text-gray-700">Q{(totalLiabilities/1000).toFixed(1)}k</span>
                       <div 
                         style={{height: `${Math.max((Number(totalLiabilities) / (Math.max(Number(grandTotalAssets), Number(loanAmt)) || 1)) * 150, 5)}px`}} 
                         className="w-full bg-green-500 rounded-t shadow-sm min-h-[4px] max-h-[200px]"
                       ></div>
                       <span className="text-xs text-gray-600 mt-2">Pasivos</span>
                    </div>

                    {/* 3. Nueva Deuda Bar (Prominent) */}
                    <div className="flex flex-col items-center group w-20">
                       <span className="text-xs font-bold mb-1 text-black">Q{(loanAmt/1000).toFixed(1)}k</span>
                       <div 
                         style={{height: `${Math.max((Number(loanAmt) / (Math.max(Number(grandTotalAssets), Number(loanAmt)) || 1)) * 150, 5)}px`}}
                         className="w-full bg-red-500 rounded-t shadow-md"
                       ></div>
                       <span className="text-xs text-gray-800 font-bold mt-2">Nueva Deuda</span>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* 6. IA */}
      <div className="bg-purple-50 p-6 rounded-lg shadow-sm border border-purple-100 break-inside-avoid">
         <h3 className="text-lg font-bold text-purple-800 mb-4 border-b border-purple-200 pb-2 flex items-center">
           <BrainCircuit className="w-5 h-5 mr-2"/> Análisis IA
         </h3>
         <div className="space-y-2">
             <div className="text-xs font-bold text-purple-700">Razonabilidad Deuda</div>
             <div className="text-xs p-2 bg-white border rounded mb-2 min-h-[60px] whitespace-pre-wrap">{data.review?.debtReasonabilityAnalysis||'Sin análisis'}</div>
             <div className="text-xs font-bold text-purple-700">Análisis 6 C's</div>
             <div className="text-xs p-2 bg-white border rounded min-h-[100px] whitespace-pre-wrap">{data.review?.sixCsAnalysis||'Sin análisis'}</div>
         </div>
      </div>

      {/* 7. Comité */}
      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-blue-900 mb-4 border-b border-blue-200 pb-2 flex items-center">
           <Users className="w-5 h-5 mr-2"/> 10. Opinión y Comité
         </h3>
         
         <div className="flex justify-between items-center mb-4">
            <div>
                <span className="text-xs font-bold text-blue-800 uppercase">Decisión</span>
                <div className="text-lg font-bold text-blue-900">{data.review?.committeeDecision || 'PENDIENTE'}</div>
            </div>
            <div>
                <span className="text-xs font-bold text-blue-800 uppercase">Fecha</span>
                <div className="text-sm font-bold text-blue-900">{data.review?.approvalDate || '---'}</div>
            </div>
         </div>

         <div className="bg-white p-4 rounded border border-blue-100 text-xs space-y-2">
             <div className="grid grid-cols-2 gap-4">
                 <div><span className="text-gray-500">Monto Aprobado:</span> <b>Q {(data.review?.approvedAmount || 0).toLocaleString()}</b></div>
                 <div><span className="text-gray-500">Plazo:</span> <b>{data.review?.approvedTerm} meses</b></div>
                 <div><span className="text-gray-500">Tasa:</span> <b>{data.review?.approvedInterestRate}%</b></div>
                 <div><span className="text-gray-500">Forma Pago:</span> <b>{data.review?.approvedPaymentMethod}</b></div>
             </div>
             <div className="border-t pt-2">
                 <span className="text-gray-500 block">Garantías:</span>
                 <p>{data.review?.approvedGuaranteeDescription}</p>
             </div>
             <div className="border-t pt-2">
                 <span className="text-gray-500 block">Condiciones Especiales:</span>
                 <p>{data.review?.approvedSpecialConditions}</p>
             </div>
             <div className="border-t pt-2">
                 <span className="text-gray-500 block">Firmas Aprobadores:</span>
                 <p>{data.review?.approverNames}</p>
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
            Imprimir Resumen
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

export default SectionTen;
