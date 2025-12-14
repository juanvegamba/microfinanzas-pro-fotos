
import React, { useEffect, useState, useMemo } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Scale, AlertTriangle, UserCheck, BrainCircuit, PenTool, Users, 
  CheckCircle2, XCircle, FileText, Briefcase, History, TrendingUp,
  DollarSign, ShoppingBag, Shield, ClipboardCheck, Camera, Store,
  Wallet, BarChart3, User, MapPin, Building2, Phone, List, Calculator, Table,
  FileDown, Printer, AlertOctagon
} from 'lucide-react';
import { ClientData, ReviewData, MONTHS } from '../types';

interface SectionNineProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
}

const safeNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const SectionNine: React.FC<SectionNineProps> = ({ data, updateData }) => {
  const [aiLoading, setAiLoading] = useState({ debt: false, full: false });
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  const updateReview = (field: keyof ReviewData, value: any) => {
    if (!data.review) return;
    updateData('review', {
      ...data.review,
      [field]: value
    });
  };

  useEffect(() => {
    if (data.review && !data.review.approvedAmount && data.loanAmount) {
      const realGuaranteesText = (data.realGuarantees || []).map(g => 
        `${g.type}: ${g.description} (Valor Est: Q${safeNum(g.estimatedValue).toLocaleString()})`
      ).join('; ');
      
      const fiduciaryGuaranteesText = (data.fiduciaryGuarantees || []).map(f => 
        `Fiador: ${f.name}`
      ).join('; ');

      const fullGuaranteeDesc = [realGuaranteesText, fiduciaryGuaranteesText].filter(Boolean).join('\n');

      updateData('review', {
        ...data.review,
        approvedAmount: data.loanAmount,
        approvedDestination: (data.loanDestination || '') + (data.loanDestinationDetail ? ` - ${data.loanDestinationDetail}` : ''),
        approvedPaymentMethod: data.loanPaymentMethod || '',
        approvedInterestRate: data.loanInterestRate || '',
        approvedTerm: data.loanTerm || '',
        approvedCommission: data.loanCommission || '',
        approvedGuaranteeDescription: fullGuaranteeDesc,
        approvalDate: new Date().toISOString().split('T')[0] 
      });
    }
  }, []);

  const calcType = (amount: number | '', freq: number | '') => safeNum(amount) * safeNum(freq);
  const baseMonthlySales = calcType(data.salesGood.amount, data.salesGood.frequency) + calcType(data.salesRegular.amount, data.salesRegular.frequency) + calcType(data.salesBad.amount, data.salesBad.frequency);
  const annualSales = baseMonthlySales * 12;

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
  
  const totalExistingDebtPayment = (data.existingDebts || [])
    .filter(d => !d.consolidate)
    .reduce((sum, item) => sum + safeNum(item.monthlyQuota), 0);
  
  const netVariableAnnual = (data.variableItems || []).reduce((acc, item) => { 
    const val = safeNum(item.amount); 
    return item.type === 'Ingreso' ? acc + val : acc - val; 
  }, 0);
  const avgNetVariableMonthly = netVariableAnnual / 12;

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

  const summarySales = baseMonthlySales;
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

  const cashFlowProjection = useMemo(() => {
    const projection = [];
    let cumulativeFlow = 0;
    const startMonthIndex = new Date().getMonth(); 

    for (let i = 1; i <= 24; i++) {
      const monthIndex = (startMonthIndex + i - 1) % 12;
      const monthName = MONTHS[monthIndex];

      let sales = baseMonthlySales;
      if ((data.lowSalesMonths || []).includes(monthName)) {
        sales *= (1 - safeNum(data.lowSalesReduction) / 100);
      } else if ((data.highSalesMonths || []).includes(monthName)) {
        sales *= (1 + safeNum(data.highSalesIncrease) / 100);
      }

      const monthVariableItems = (data.variableItems || []).filter(v => v.month === monthName);
      const variableIncome = monthVariableItems.filter(v => v.type === 'Ingreso').reduce((s, v) => s + safeNum(v.amount), 0);
      const variableExpense = monthVariableItems.filter(v => v.type === 'Gasto').reduce((s, v) => s + safeNum(v.amount), 0);

      const cmv = sales * (safeNum(data.costOfGoodsSold) / 100);
      
      const disbursementEntry = (data.disbursementPlan || [])
        .filter(d => d.month === i && d.type === 'Entrada de dinero')
        .reduce((s, d) => s + safeNum(d.amount), 0);
      
      const disbursementExit = (data.disbursementPlan || [])
        .filter(d => d.month === i && d.type === 'Salida de Dinero')
        .reduce((s, d) => s + safeNum(d.amount), 0);

      let newLoanPayment = 0;
      if (i <= termMonths) {
         if (data.loanPaymentMethod === 'Sobre Saldos Decrecientes') {
             const principalPaid = (loanAmt / termMonths) * (i - 1);
             const balance = Math.max(0, loanAmt - principalPaid);
             newLoanPayment = (loanAmt / termMonths) + (balance * monthlyRate);
         } else {
             newLoanPayment = estimatedNewQuota;
         }
      }

      const totalIncome = sales + variableIncome + disbursementEntry + safeNum(data.familyIncome);
      const totalOutflow = 
        cmv + 
        totalBusinessFixedExpenses + 
        variableExpense + 
        totalFamilyExpenses + 
        totalExistingDebtPayment + 
        disbursementExit + 
        safeNum(data.plannedInvestment) + 
        newLoanPayment;

      const sdnMonthly = (sales + variableIncome + safeNum(data.familyIncome)) - (cmv + totalBusinessFixedExpenses + variableExpense + totalFamilyExpenses + totalExistingDebtPayment + safeNum(data.plannedInvestment));

      const monthlyFlow = totalIncome - totalOutflow;
      cumulativeFlow += monthlyFlow;

      projection.push({
        month: i,
        monthName: monthName,
        sales,
        disbursementEntry,
        otherIncome: variableIncome + safeNum(data.familyIncome),
        costVentas: cmv,
        gastosNegocio: totalBusinessFixedExpenses + variableExpense,
        gastosFamilia: totalFamilyExpenses,
        pagoDeudaExist: totalExistingDebtPayment,
        sdn: sdnMonthly,
        pagoNuevaDeuda: newLoanPayment,
        flujoMes: monthlyFlow,
        flujoAcumulado: cumulativeFlow,
        ingresosTotales: totalIncome,
        gastosTotales: totalOutflow
      });
    }
    return projection;
  }, [baseMonthlySales, data, estimatedNewQuota, loanAmt, monthlyRate, termMonths, totalBusinessFixedExpenses, totalExistingDebtPayment, totalFamilyExpenses]);

  const chartPoints = cashFlowProjection.map((p, i) => {
     return {
         month: p.month,
         monthName: p.monthName,
         income: p.ingresosTotales,
         expenses: p.gastosTotales,
         sdn: p.sdn,
         debt: p.pagoNuevaDeuda,
         flow: p.flujoMes
     }
  });

  const allValues = chartPoints.flatMap(p => [p.income, p.expenses, p.sdn, p.debt, p.flow]);
  const maxVal = Math.max(...allValues, 1000) * 1.1; 
  const minVal = Math.min(...allValues, 0);
  const chartHeight = 300;
  const chartWidth = 800;
  
  const getY = (val: number) => {
      const range = maxVal - minVal;
      if (range === 0) return chartHeight / 2;
      return chartHeight - ((val - minVal) / range) * chartHeight;
  };
  
  const getPoints = (key: keyof typeof chartPoints[0]) => {
      return chartPoints.map((p, i) => {
          const x = (i / (chartPoints.length - 1)) * chartWidth;
          const y = getY(p[key] as number);
          return `${x},${y}`;
      }).join(' ');
  };

  const totalInventoryValue = (data.inventory || []).reduce((sum, item) => sum + (safeNum(item.stockQty) * safeNum(item.purchasePrice)), 0);
  const totalRealEstate = (data.realEstateAssets || []).reduce((sum, item) => sum + safeNum(item.estimatedValue), 0);
  const totalVehicles = (data.vehicleAssets || []).reduce((sum, item) => sum + safeNum(item.estimatedValue), 0);
  const totalOtherAssets = (data.otherAssets || []).reduce((sum, item) => sum + safeNum(item.estimatedValue), 0);
  const grandTotalAssets = totalInventoryValue + totalRealEstate + totalVehicles + totalOtherAssets;

  const totalAssetsFixed = totalRealEstate + totalVehicles; 
  const totalAssetsOther = totalOtherAssets; 

  const totalLiabilities = (data.existingDebts || []).reduce((sum, item) => sum + safeNum(item.currentBalance), 0);
  const netWorth = grandTotalAssets - totalLiabilities;

  const totalEstimatedGuarantee = (data.realGuarantees || []).reduce((sum, item) => sum + safeNum(item.estimatedValue), 0);
  const totalQuickSaleGuarantee = (data.realGuarantees || []).reduce((sum, item) => sum + safeNum(item.quickSaleValue), 0);
  const commercialCoverage = loanAmt > 0 ? totalEstimatedGuarantee / loanAmt : 0;
  const quickSaleCoverage = loanAmt > 0 ? totalQuickSaleGuarantee / loanAmt : 0;

  const totalBusinessScore = data.diversificationScore + data.profitabilityKnowledgeScore + data.operationsManagementScore + data.investmentPlanQualityScore + data.successionPlanningScore;
  const businessScorePercent = (totalBusinessScore / 13) * 100;
  let businessGaugeColor = 'text-red-500';
  let businessGaugeLabel = 'Bajo';
  if (businessScorePercent >= 66) { businessGaugeColor = 'text-green-500'; businessGaugeLabel = 'Alto'; } 
  else if (businessScorePercent >= 33) { businessGaugeColor = 'text-yellow-500'; businessGaugeLabel = 'Medio'; }

  const totalCharacterScore = data.characterRefScore + data.characterPayHistoryScore + data.characterInformalDebtsScore + data.characterTransparencyScore;
  const characterScorePercent = Math.max(0, (totalCharacterScore / 11) * 100);
  const charStrokeDashArray = `${(characterScorePercent / 100) * 126} 126`;

  const totalDebtPostLoan = totalLiabilities + loanAmt;
  const totalAssetsPostLoan = grandTotalAssets + loanAmt; 
  
  const ratioInvReq = totalInventoryValue > 0 ? (loanAmt / totalInventoryValue) * 100 : 0;
  const ratioInvTotal = totalInventoryValue > 0 ? (totalDebtPostLoan / totalInventoryValue) * 100 : 0;
  const ratioSalesReq = annualSales > 0 ? loanAmt / annualSales : 99; 
  const ratioSalesTotal = annualSales > 0 ? totalDebtPostLoan / annualSales : 99; 
  const leverageEquity = netWorth > 0 ? (totalDebtPostLoan / netWorth) * 100 : 999; 
  const leverageAssets = totalAssetsPostLoan > 0 ? (totalDebtPostLoan / totalAssetsPostLoan) * 100 : 999; 

  const alerts: {type: string, msg: string}[] = [];
  if (ratioInvTotal > 100) alerts.push({ type: 'Riesgo', msg: 'Deuda Total supera Valor Inventario' });
  if (ratioSalesTotal > 0.5) alerts.push({ type: 'Riesgo', msg: 'Deuda Total > 6 meses de venta' });
  if (commercialCoverage < 1) alerts.push({ type: 'Garantía', msg: 'Cobertura Garantía < 100%' });
  if ((data.housingType === 'Alquilado' || data.businessPremiseType === 'Alquilado') && (!data.expensesRent || data.expensesRent === 0)) alerts.push({ type: 'Gastos', msg: 'Alquiler sin gasto registrado.' });

  const generateDebtAnalysis = async () => {
    setAiLoading(prev => ({ ...prev, debt: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Actúa como un Analista Senior de Riesgos. Realiza un análisis técnico de endeudamiento para una solicitud de microcrédito.
      
      Datos Financieros (Post-Desembolso):
      - Activos Totales: Q ${grandTotalAssets.toLocaleString()} (Inventario: Q${totalInventoryValue.toLocaleString()})
      - Pasivos Totales: Q ${totalDebtPostLoan.toLocaleString()} (Nueva: Q${loanAmt.toLocaleString()})
      - Patrimonio Neto: Q ${netWorth.toLocaleString()}
      - Ventas Anuales: Q ${annualSales.toLocaleString()}
      
      Indicadores Críticos Calculados:
      1. COBERTURA INVENTARIO (Deuda/Inventario):
         - Solicitud sobre Inventario: ${ratioInvReq.toFixed(1)}%
         - Deuda Total sobre Inventario: ${ratioInvTotal.toFixed(1)}%
         
      2. COBERTURA VENTAS (Deuda/Ventas Anuales):
         - ${ratioSalesTotal.toFixed(2)} años de ventas para pagar la deuda total.
         
      3. APALANCAMIENTO:
         - Deuda/Patrimonio: ${leverageEquity.toFixed(1)}%.
         - Deuda/Activos: ${leverageAssets.toFixed(1)}%.
         
      4. RCD (Capacidad Pago): ${rcd.toFixed(2)}x.
      
      Instrucciones:
      - Evalúa la calidad de la estructura de capital.
      - ¿El inventario rota lo suficiente para pagar esta deuda?
      - Dictamen FINAL de Endeudamiento: "SALUDABLE", "AL LIMITE" o "SOBRE-ENDEUDADO".
      
      Formato: Párrafos cortos y técnicos.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      updateReview('debtReasonabilityAnalysis', response.text);

    } catch (e: any) { 
      console.error("AI Error:", e); 
      alert(`Error al generar análisis: ${e.message || 'Error desconocido'}`); 
    } finally { 
      setAiLoading(prev => ({ ...prev, debt: false })); 
    }
  };

  const generateSixCsAnalysis = async () => {
    setAiLoading(prev => ({ ...prev, full: true }));
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const prompt = `Actúa como un Gerente de Créditos. Genera el Dictamen Final de las 6 C's.
      
      Cliente: ${data.fullName}. Negocio: ${data.businessName}.
      Solicitud: Q ${loanAmt.toLocaleString()}.
      
      Datos Clave:
      1. CARÁCTER: ${totalCharacterScore}/11 pts.
      2. CAPACIDAD: SDN Q ${summarySDN.toLocaleString()}. RCD ${rcd.toFixed(2)}x.
      3. CAPITAL: Patrimonio Q ${netWorth.toLocaleString()}. Apalancamiento ${leverageEquity.toFixed(0)}%.
      4. COLATERAL: Cobertura Garantía ${commercialCoverage.toFixed(2)}x.
      5. CONDICIONES: Riesgo Entorno ${data.supervision.riskLevel}.
      6. CAPACIDAD EMPRESARIAL: ${businessScorePercent.toFixed(0)}%.
      
      Instrucciones:
      - Analiza brevemente cada punto.
      - Sé crítico con la coherencia entre Capital (Patrimonio) y la Solicitud.
      
      OBLIGATORIO AL FINAL:
      Debes sugerir un rango de crédito basado en una política conservadora donde la cuota no supere el 70% del SDN y la garantía cubra al menos 1.25x.
      
      Formato de salida al final del texto (en negrita):
      **Rango de Crédito Sugerido: Q [Mín] - Q [Máx]**`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      updateReview('sixCsAnalysis', response.text);

    } catch (e: any) { 
      console.error("AI Error:", e); 
      alert(`Error al generar análisis: ${e.message || 'Error desconocido'}`); 
    } finally { 
      setAiLoading(prev => ({ ...prev, full: false })); 
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8 font-sans text-gray-800">
       <div className="pb-4 border-b border-gray-200 flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold text-brand-primary">Sección 9. Revisión Integral</h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">Expediente Completo</span>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <FileText className="w-5 h-5 mr-2"/> 1. Resumen de Datos Generales
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
                <span className="text-gray-500 block text-xs">Oficial:</span> 
                <b className="block">{data.officialName}</b>
                <span className="text-gray-500 block text-xs mt-2">Cliente:</span> 
                <b className="block">{data.fullName}</b>
                <span className="text-gray-500 block text-xs mt-2">Estado Civil:</span> 
                <b className="block">{data.maritalStatus}</b>
                <span className="text-gray-500 block text-xs mt-2">Vivienda:</span> 
                <b className="block">{data.housingType} ({safeNum(data.yearsInHousing)} años)</b>
                <span className="text-gray-500 block text-xs mt-2">Capacidad Autodeclarada:</span> 
                <b className="block">Q {safeNum(data.monthlyPaymentCapacity).toLocaleString()}</b>
            </div>
            <div>
                <span className="text-gray-500 block text-xs">Agencia:</span> 
                <b className="block">{data.branch}</b>
                <span className="text-gray-500 block text-xs mt-2">DPI:</span> 
                <b className="block">{data.identityDocument}</b>
                <span className="text-gray-500 block text-xs mt-2">Dependientes:</span> 
                <b className="block">{data.dependents}</b>
                <span className="text-gray-500 block text-xs mt-2">Negocio:</span> 
                <b className="block">{data.businessName} ({data.businessType})</b>
                <span className="text-gray-500 block text-xs mt-2">Direcciones:</span> 
                <div className="text-xs">Casa: {data.homeAddress}</div>
                <div className="text-xs">Negocio: {data.businessAddress || 'Misma'}</div>
            </div>
            <div>
                <span className="text-gray-500 block text-xs">Operación:</span> 
                <b className="block">{data.operationNumber}</b>
                <span className="text-gray-500 block text-xs mt-2">Edad:</span> 
                <b className="block">{data.age} años</b>
                <span className="text-gray-500 block text-xs mt-2">Cónyuge (Ocupación):</span> 
                <b className="block">{data.spouseName} ({data.spouseOccupation})</b>
                <span className="text-gray-500 block text-xs mt-2">Sector:</span> 
                <b className="block">{(data.businessSectors || []).join(', ')}</b>
            </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <Briefcase className="w-5 h-5 mr-2"/> 2. Resumen de Empresa
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mb-4">
             <div>
                 <p><b>Origen:</b> {data.businessOrigin}</p>
                 <p className="mt-1"><b>Uso Ganancias:</b> {data.recentProfitsUse}</p>
                 <p className="mt-1"><b>Reinvertido:</b> Q {data.reinvestedAmount}</p>
                 <p className="mt-1"><b>Riesgos Cliente:</b> {data.clientRisks} (Mitigación: {data.mitigationMeasures})</p>
                 <p className="mt-1"><b>Oportunidades:</b> {data.businessOpportunities}</p>
             </div>
             <div>
                 <p><b>Activos Fijos (Decl.):</b> Q {data.fixedAssetsValue}</p>
                 <p className="mt-1"><b>Inventario (Decl.):</b> Q {data.inventoryValue}</p>
                 <p className="mt-1"><b>Antigüedad:</b> {data.yearCreated ? new Date().getFullYear() - safeNum(data.yearCreated) : 0} años</p>
                 <p className="mt-1"><b>Empleados Total:</b> {
                    safeNum(data.employeesFullTime) + 
                    safeNum(data.employeesPartTime) + 
                    safeNum(data.familyEmployees)
                 }</p>
             </div>
         </div>
         <div className="flex items-center gap-4 border-t pt-4">
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <DollarSign className="w-5 h-5 mr-2"/> 3. Análisis de Capacidad de Pago
         </h3>
         
         <div className="bg-gray-50 p-4 rounded mb-4 text-xs grid grid-cols-4 gap-4">
             <div>
                 <span className="block text-gray-500">Solicitado:</span>
                 <span className="font-bold text-sm">Q {loanAmt.toLocaleString()}</span>
             </div>
             <div>
                 <span className="block text-gray-500">Plazo:</span>
                 <span className="font-bold text-sm">{termMonths} meses</span>
             </div>
             <div>
                 <span className="block text-gray-500">Tasa:</span>
                 <span className="font-bold text-sm">{annualRate}%</span>
             </div>
             <div>
                 <span className="block text-gray-500">Cuota Est.:</span>
                 <span className="font-bold text-sm">Q {estimatedNewQuota.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
             </div>
             <div className="col-span-4 pt-2 border-t border-gray-200">
                 <span className="text-gray-500">Deudas Existentes:</span>
                 {data.existingDebts.length === 0 ? <span className="ml-2 italic">Ninguna</span> : (
                     <ul className="list-disc list-inside mt-1">
                         {data.existingDebts.map(d => (
                             <li key={d.id} className={d.consolidate ? 'line-through text-gray-400' : ''}>
                                 {d.creditor} - Cuota: Q {d.monthlyQuota} (Saldo: Q {d.currentBalance}) {d.consolidate ? '(Consolidada)' : ''}
                             </li>
                         ))}
                         <li className="font-bold list-none mt-1">Total Cuotas Existentes (No consolidadas): Q {totalExistingDebtPayment}</li>
                     </ul>
                 )}
             </div>
         </div>

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
              <div className="text-[10px] text-gray-500">(Saludable: &lt;1.0)</div>
           </div>

           <div className="bg-pink-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Cuota Nueva Deuda (1er Pago)</div>
              <div className="text-xl font-bold text-gray-900">Q {estimatedNewQuota.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </div>
           <div className="bg-yellow-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Razón de Cobertura de Deuda (RCD)</div>
              <div className="text-xl font-bold text-gray-900">{rcd.toFixed(2)}</div>
              <div className="text-[10px] text-gray-500">(Saludable: &gt;1.5, Aceptable: &gt;1.2)</div>
           </div>
           <div className="bg-orange-100 p-4 rounded-md text-center">
              <div className="text-xs text-gray-700 uppercase font-semibold">RCD con Margen de Seguridad</div>
              <div className="text-xl font-bold text-gray-900">{rcdWithMargin.toFixed(2)}</div>
              <div className="text-[10px] text-gray-500">(SDN con margen / Cuota)</div>
           </div>
        </div>

        <div className="bg-blue-100 p-4 rounded-lg text-center border border-blue-200">
             <div className="text-sm text-blue-800 font-semibold uppercase">Capacidad Máxima de Préstamo Estimada</div>
             <div className="text-3xl font-bold text-blue-900 my-1">Q {maxLoanCapacity.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
             <div className="text-xs text-blue-700">Basado en el margen de seguridad del SDN, plazo y tasa del crédito actual.</div>
        </div>

        <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
            <h3 className="text-sm font-bold text-brand-primary mb-4 flex items-center uppercase border-b pb-2">
                <List className="w-4 h-4 mr-2" /> Resumen Financiero (Calculado)
            </h3>
            <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between"><span>Ingreso por Ventas</span> <span>Q {summarySales.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
                <div className="flex justify-between text-red-600"><span>(-) Costo de Mercadería (CMV)</span> <span>({summaryCMV.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1"><span>(=) Utilidad Bruta</span> <span>Q {summaryGrossProfit.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
                
                <div className="flex justify-between text-red-600 pt-2"><span>(-) Gastos Operativos</span> <span>({totalBusinessFixedExpenses.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1"><span>(=) Utilidad Operativa</span> <span>Q {summaryOperatingProfit.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>

                <div className="flex justify-between pt-2"><span>(+/-) Ing/Gasto Neto Variable</span> <span>Q {avgNetVariableMonthly.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
                <div className="flex justify-between"><span>(+) Otros Ingresos Familiares</span> <span>Q {safeNum(data.familyIncome).toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
                <div className="flex justify-between text-red-600"><span>(-) Gastos Familiares</span> <span>({totalFamilyExpenses.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
                <div className="flex justify-between text-red-600"><span>(-) Inversiones</span> <span>({safeNum(data.plannedInvestment).toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
                <div className="flex justify-between text-red-600"><span>(-) Deudas Existentes (No consolidadas)</span> <span>({totalExistingDebtPayment.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
                
                <div className="flex justify-between font-bold border-t border-gray-300 pt-1 bg-green-50 p-1"><span>(=) Saldo Disponible Neto (SDN)</span> <span>Q {summarySDN.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
                <div className="flex justify-between pt-1 text-gray-600"><span>SDN con Margen ({(100 - marginPercent*100).toFixed(0)}%)</span> <span>Q {sdnWithMargin.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
                
                <div className="flex justify-between text-red-600 pt-2"><span>(-) Cuota Nuevo Préstamo (Promedio)</span> <span>({estimatedNewQuota.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
                <div className="flex justify-between font-bold border-t border-brand-primary pt-2 bg-blue-50 p-2 text-brand-primary"><span>(=) Flujo de Caja Libre Final (con margen)</span> <span>Q {(sdnWithMargin - estimatedNewQuota).toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
            </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
            <h3 className="text-sm font-bold text-brand-primary p-4 flex items-center uppercase border-b bg-gray-50">
                <Table className="w-4 h-4 mr-2" /> Flujo de Caja Proyectado (Detallado Mensual)
            </h3>
            <div className="overflow-x-auto">
            <table className="min-w-full text-[10px] border-collapse text-right">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-1 border text-center text-gray-600" colSpan={1}></th>
                        <th className="p-1 border text-center text-green-700 font-bold" colSpan={3}>Entradas de Dinero</th>
                        <th className="p-1 border text-center text-red-700 font-bold" colSpan={5}>Salidas y Capacidad</th>
                        <th className="p-1 border text-center text-blue-700 font-bold" colSpan={2}>Flujo de Caja</th>
                    </tr>
                    <tr className="bg-gray-50 font-semibold text-gray-700">
                        <th className="p-1 border text-left">Mes</th>
                        <th className="p-1 border">Ventas</th>
                        <th className="p-1 border">Desemb.</th>
                        <th className="p-1 border">Otros Ing.</th>
                        <th className="p-1 border">Costo Ventas</th>
                        <th className="p-1 border">Gastos Negocio</th>
                        <th className="p-1 border">Gastos Familia</th>
                        <th className="p-1 border">Pgto. Deuda</th>
                        <th className="p-1 border bg-gray-100">SDN</th>
                        <th className="p-1 border">Nueva Deuda</th>
                        <th className="p-1 border bg-green-50">Flujo Mes</th>
                        <th className="p-1 border">Acum.</th>
                    </tr>
                </thead>
                <tbody>
                    {cashFlowProjection.map((row) => (
                        <tr key={row.month} className="hover:bg-gray-50">
                        <td className="p-1 border text-center font-medium text-gray-800">
                            <div className="flex flex-col justify-center items-center leading-none py-1">
                                <span className="text-[10px] text-gray-500 mb-0.5">{row.month} -</span>
                                <span>{row.monthName.substring(0, 3)}</span>
                            </div>
                        </td>
                        <td className="p-1 border">{row.sales.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                        <td className="p-1 border">{row.disbursementEntry.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                        <td className="p-1 border">{row.otherIncome.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                        <td className="p-1 border text-gray-600">{row.costVentas.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                        <td className="p-1 border text-gray-600">{row.gastosNegocio.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                        <td className="p-1 border text-gray-600">{row.gastosFamilia.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                        <td className="p-1 border text-gray-600">{row.pagoDeudaExist.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                        <td className={`p-1 border font-semibold ${row.sdn < 0 ? 'text-red-600' : 'text-green-600'} bg-gray-50`}>
                            {row.sdn.toLocaleString('en-US', {maximumFractionDigits: 0})}
                        </td>
                        <td className="p-1 border text-gray-800">{row.pagoNuevaDeuda.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                        <td className={`p-1 border font-bold ${row.flujoMes < 0 ? 'text-red-600' : 'text-green-700'} bg-green-50`}>
                            {row.flujoMes.toLocaleString('en-US', {maximumFractionDigits: 0})}
                        </td>
                        <td className={`p-1 border ${row.flujoAcumulado < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                            {row.flujoAcumulado.toLocaleString('en-US', {maximumFractionDigits: 0})}
                        </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            </div>
        </div>

        <div className="mt-8 p-4 border border-gray-200 rounded-lg bg-white">
             <h4 className="text-sm font-bold text-gray-800 text-left mb-4">Evolución del Flujo de Caja Mensual</h4>
             <div className="flex justify-center space-x-4 text-[10px] mb-4">
                <div className="flex items-center"><div className="w-2 h-2 bg-green-400 mr-1"></div> Ingresos</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-orange-400 mr-1"></div> Gastos</div>
                <div className="flex items-center"><div className="w-2 h-2 bg-blue-500 mr-1"></div> Flujo</div>
             </div>
             <div className="relative h-[200px] w-full group">
                 <svg className="w-full h-full overflow-visible" viewBox={`0 0 800 300`} preserveAspectRatio="none">
                     {[0, 0.5, 1].map(pct => (
                       <line key={pct} x1="0" y1={300 * pct} x2={800} y2={300 * pct} stroke="#e5e7eb" strokeWidth="1" />
                     ))}
                     
                     {(() => {
                        const maxVal = Math.max(...chartPoints.flatMap(p => [p.income, p.expenses, p.flow]), 1000) * 1.1;
                        const minVal = Math.min(...chartPoints.flatMap(p => [p.income, p.expenses, p.flow]), 0);
                        const range = maxVal - minVal || 1;
                        const getY = (v: number) => 300 - ((v - minVal) / range) * 300;
                        
                        const incomePoints = chartPoints.map((p, i) => `${(i/23)*800},${getY(p.income)}`).join(' ');
                        const expensePoints = chartPoints.map((p, i) => `${(i/23)*800},${getY(p.expenses)}`).join(' ');
                        const flowPoints = chartPoints.map((p, i) => `${(i/23)*800},${getY(p.flow)}`).join(' ');

                        return (
                            <>
                                <polyline points={incomePoints} fill="none" stroke="#4ade80" strokeWidth="2" />
                                <polyline points={expensePoints} fill="none" stroke="#fb923c" strokeWidth="2" />
                                <polyline points={flowPoints} fill="none" stroke="#3b82f6" strokeWidth="3" />
                                <text x="-35" y="10" fontSize="10" fill="#9ca3af">{maxVal.toLocaleString()}</text>
                                <text x="-35" y="290" fontSize="10" fill="#9ca3af">{minVal.toLocaleString()}</text>
                            </>
                        );
                     })()}
                 </svg>
             </div>
             <div className="flex justify-between text-[9px] text-gray-400 mt-2">
                {chartPoints.map((p, i) => (
                    (i % 4 === 0 || i === 23) ? <span key={i}>{p.monthName.substring(0,3)}</span> : null
                ))}
             </div>
        </div>

      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <ShoppingBag className="w-5 h-5 mr-2"/> Inventario y Activos
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-gray-50 p-4 rounded">
                 <div className="flex justify-between text-sm mb-1"><span>Valor Inventario:</span> <b>Q {totalInventoryValue.toLocaleString()}</b></div>
                 <div className="flex justify-between text-sm mb-1"><span>Compras Est./Mes:</span> <b>Q {(data.inventory || []).reduce((s, i) => s + (safeNum(i.purchaseQty) * safeNum(i.purchasePrice) * safeNum(i.purchaseFrequency)), 0).toLocaleString()}</b></div>
                 <div className="flex justify-between text-sm mb-1"><span>Ventas Est./Mes:</span> <b>Q {(data.inventory || []).reduce((s, i) => s + (safeNum(i.purchaseQty) * safeNum(i.salePrice) * safeNum(i.purchaseFrequency)), 0).toLocaleString()}</b></div>
                 
                 <div className="text-xs text-green-600 mt-2">
                    Diferencia Ventas (Inv vs Decl): {
                        baseMonthlySales > 0 
                        ? (((data.inventory || []).reduce((s, i) => s + (safeNum(i.purchaseQty) * safeNum(i.salePrice) * safeNum(i.purchaseFrequency)), 0) - baseMonthlySales) / baseMonthlySales * 100).toFixed(1) 
                        : 0
                    }%
                 </div>
             </div>
             <div className="bg-gray-50 p-4 rounded">
                 <div className="flex justify-between text-sm mb-1"><span>Inmuebles:</span> <b>Q {totalRealEstate.toLocaleString()}</b></div>
                 <div className="flex justify-between text-sm mb-1"><span>Vehículos:</span> <b>Q {totalVehicles.toLocaleString()}</b></div>
                 <div className="flex justify-between text-sm mb-1"><span>Otros:</span> <b>Q {totalOtherAssets.toLocaleString()}</b></div>
                 <div className="flex justify-between text-sm mt-2 border-t pt-2 text-blue-900 font-bold"><span>TOTAL ACTIVOS:</span> <b>Q {grandTotalAssets.toLocaleString()}</b></div>
             </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <Shield className="w-5 h-5 mr-2"/> Garantías
         </h3>
         
         <div className="mb-4 text-sm">
             <p className="font-bold text-xs text-gray-500 uppercase mb-1">REALES</p>
             {data.realGuarantees.length > 0 ? data.realGuarantees.map((g, i) => (
                 <div key={i} className="flex justify-between border-b border-gray-100 pb-1 mb-1">
                     <span>{g.type} - {g.description}</span>
                     <b>Q {safeNum(g.estimatedValue).toLocaleString()}</b>
                 </div>
             )) : <p className="italic text-gray-400">Sin garantías reales</p>}
         </div>

         <div className="mb-4 text-sm">
             <p className="font-bold text-xs text-gray-500 uppercase mb-1">FIDUCIARIAS</p>
             {data.fiduciaryGuarantees.length > 0 ? data.fiduciaryGuarantees.map((f, i) => (
                 <div key={i} className="flex justify-between border-b border-gray-100 pb-1 mb-1">
                     <span>{f.name} (DPI: {f.dpi})</span>
                     <span className="text-xs text-gray-500">Capacidad Est: Q {safeNum(f.income) - safeNum(f.debts)}</span>
                 </div>
             )) : <p className="italic text-gray-400">Sin garantías fiduciarias</p>}
         </div>

         <div className="bg-gray-100 p-3 rounded flex justify-between text-sm font-bold">
             <span>Cobertura Comercial: {commercialCoverage.toFixed(2)}x</span>
             <span>Cobertura Venta Rápida: {quickSaleCoverage.toFixed(2)}x</span>
         </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <ClipboardCheck className="w-5 h-5 mr-2"/> Carácter
         </h3>
         <div className="flex items-center gap-4">
             <div className="relative w-24 h-16 flex justify-center overflow-hidden shrink-0">
                <div className="absolute w-20 h-20 bg-gray-200 rounded-full top-0"></div>
                <div className="absolute w-16 h-16 bg-white rounded-full top-2 z-10 flex items-end justify-center pb-2">
                    <span className="text-sm font-bold text-brand-primary">{characterScorePercent.toFixed(0)}%</span>
                </div>
                <svg viewBox="0 0 100 50" className="absolute top-0 left-0 w-full h-full z-0 transform scale-[0.85] origin-bottom">
                   <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                   <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="currentColor" className="text-brand-primary" strokeWidth="10" strokeDasharray={charStrokeDashArray} />
                </svg>
             </div>
             <div>
                 <div className="font-bold text-sm">{characterScorePercent}% del Total Posible</div>
                 <div className="text-xs text-gray-500 mt-1">{data.characterRefScore} pts refs, {data.characterPayHistoryScore} pts historial</div>
                 <div className="text-xs italic text-gray-600 mt-1">"{data.characterObservations}"</div>
             </div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <Camera className="w-5 h-5 mr-2"/> Fotos
         </h3>
         <div className="grid grid-cols-4 gap-2">
             {data.photos.slice(0, 4).map((p, i) => (
                 <div key={i} className="relative h-24 bg-gray-100 rounded overflow-hidden">
                     <img src={p.url} className="w-full h-full object-cover" alt="mini" />
                     <span className="absolute bottom-0 left-0 bg-black/50 text-white text-[8px] w-full px-1 truncate">{p.category}</span>
                 </div>
             ))}
         </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-4 border-b pb-2 flex items-center">
           <Store className="w-5 h-5 mr-2"/> 8. Supervisión
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
             <div>
                <p><b>Supervisor:</b> {data.supervision.supervisorName}</p>
                <p><b>Fecha:</b> {data.supervision.visitDate}</p>
                <p><b>Riesgo:</b> {data.supervision.riskLevel}</p>
                <p><b>Evolución Ventas:</b> {data.supervision.salesEvolution}</p>
             </div>
             <div className="bg-gray-50 p-2 rounded">
                <p className="font-bold text-xs text-gray-500 uppercase">VALIDACIÓN CRUCE INFO</p>
                <p>Ingresos Est: Q {(safeNum(data.supervision.weeklySales)*4.3).toLocaleString()}</p>
                <p>Coherente: <b>{Math.abs(((safeNum(data.supervision.weeklySales)*4.3) - baseMonthlySales)/baseMonthlySales) < 0.25 ? 'SI' : 'NO'}</b></p>
             </div>
         </div>
         <p className="text-xs text-gray-600 mt-2 italic">Conclusión: {data.supervision.conclusion}</p>
      </div>

      {alerts.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
             <h3 className="text-lg font-bold text-orange-600 mb-2 flex items-center">
               <AlertTriangle className="w-5 h-5 mr-2"/> Alertas de Consistencia
             </h3>
             <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                 {alerts.map((a, i) => (
                     <li key={i}><span className="font-bold text-gray-700">{a.type}:</span> {a.msg}</li>
                 ))}
             </ul>
          </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-brand-primary mb-6 border-b pb-2 flex items-center">
           <Scale className="w-5 h-5 mr-2"/> 9. Balance Financiero
         </h3>
         
         <div className="flex flex-col lg:flex-row gap-8 mb-8">
            <div className="w-full lg:w-2/5 border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="font-bold text-sm text-gray-700 mb-3 border-b border-gray-300 pb-2">Datos del Balance General Estimado</h4>
                
                <div className="space-y-1 text-xs mb-4">
                    <div className="font-bold text-blue-800 uppercase mb-1">Activos</div>
                    <div className="flex justify-between px-2"><span>Caja y Bancos:</span> <span>Q 0</span></div>
                    <div className="flex justify-between px-2"><span>Inventario:</span> <span>Q {totalInventoryValue.toLocaleString()}</span></div>
                    <div className="flex justify-between px-2"><span>Activos Fijos:</span> <span>Q {totalAssetsFixed.toLocaleString()}</span></div>
                    <div className="flex justify-between px-2"><span>Otros Activos:</span> <span>Q {totalAssetsOther.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold border-t border-gray-300 mt-1 pt-1 text-sm"><span>TOTAL ACTIVOS:</span> <span>Q {grandTotalAssets.toLocaleString()}</span></div>
                </div>

                <div className="space-y-1 text-xs mb-4">
                    <div className="font-bold text-red-800 uppercase mb-1">Pasivos y Patrimonio</div>
                    <div className="flex justify-between px-2"><span>Deudas Existentes:</span> <span>Q {totalLiabilities.toLocaleString()}</span></div>
                    <div className="flex justify-between px-2"><span>Patrimonio Neto:</span> <span>Q {netWorth.toLocaleString()}</span></div>
                    <div className="flex justify-between font-bold border-t border-gray-300 mt-1 pt-1 text-sm"><span>TOTAL PASIVO + PATRIMONIO:</span> <span>Q {(totalLiabilities + netWorth).toLocaleString()}</span></div>
                </div>

                <div className="bg-white p-2 rounded border border-blue-200 mt-4">
                    <div className="flex justify-between font-bold text-blue-600 text-xs"><span>Nueva Deuda Solicitada:</span> <span>Q {loanAmt.toLocaleString()}</span></div>
                    <div className="flex justify-between text-[10px] text-gray-500 italic mt-1"><span>Ref. Activos Fijos Declarados:</span> <span>Q {safeNum(data.fixedAssetsValue).toLocaleString()}</span></div>
                </div>
            </div>

            <div className="w-full lg:w-3/5 border border-gray-200 rounded-lg p-6 flex flex-col justify-center items-center">
                <h4 className="font-bold text-sm text-gray-700 mb-6">Gráfico de Estructura Financiera</h4>
                <div className="flex items-end justify-center gap-8 h-[200px] w-full px-8">
                    <div className="flex flex-col items-center group w-16">
                       <span className="text-xs font-bold mb-1 text-gray-700">Q{(grandTotalAssets/1000).toFixed(1)}k</span>
                       <div 
                         style={{height: `${Math.max((Number(grandTotalAssets) / (Math.max(Number(grandTotalAssets), Number(loanAmt)) || 1)) * 150, 5)}px`}} 
                         className="w-full bg-blue-500 rounded-t shadow-sm min-h-[4px] max-h-[200px]"
                       ></div>
                       <span className="text-xs text-gray-600 mt-2">Activos</span>
                    </div>

                    <div className="flex flex-col items-center group w-16">
                       <span className="text-xs font-bold mb-1 text-gray-700">Q{(totalLiabilities/1000).toFixed(1)}k</span>
                       <div 
                         style={{height: `${Math.max((Number(totalLiabilities) / (Math.max(Number(grandTotalAssets), Number(loanAmt)) || 1)) * 150, 5)}px`}} 
                         className="w-full bg-green-500 rounded-t shadow-sm min-h-[4px] max-h-[200px]"
                       ></div>
                       <span className="text-xs text-gray-600 mt-2">Pasivos</span>
                    </div>

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

         <h4 className="font-bold text-sm text-gray-800 mb-3">Análisis de Endeudamiento y Apalancamiento</h4>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             
             <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                 <div className="text-center font-bold text-xs text-blue-900 uppercase mb-2 border-b border-blue-200 pb-1">Cobertura sobre Inventario</div>
                 <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">3.1 Solicitada / Inventario:</span>
                    <span className={`font-bold ${ratioInvReq > 100 ? 'text-red-600' : 'text-red-800'}`}>{ratioInvReq.toFixed(2)}%</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-600">3.2 Total / Inventario:</span>
                    <span className={`font-bold ${ratioInvTotal > 100 ? 'text-red-600' : 'text-red-800'}`}>{ratioInvTotal.toFixed(2)}%</span>
                 </div>
             </div>

             <div className="bg-green-50 border border-green-100 rounded-md p-3">
                 <div className="text-center font-bold text-xs text-green-900 uppercase mb-2 border-b border-green-200 pb-1">Cobertura sobre Ventas (Años)</div>
                 <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">4.1 Solicitada / Ventas:</span>
                    <span className="font-bold text-gray-800">{ratioSalesReq.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-600">4.2 Total / Ventas:</span>
                    <span className="font-bold text-gray-800">{ratioSalesTotal.toFixed(2)}</span>
                 </div>
             </div>

             <div className="bg-yellow-50 border border-yellow-100 rounded-md p-3">
                 <div className="text-center font-bold text-xs text-yellow-900 uppercase mb-2 border-b border-yellow-200 pb-1">Apalancamiento</div>
                 <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">4.4 Deuda / Patrimonio:</span>
                    <span className={`font-bold ${leverageEquity > 150 ? 'text-red-600' : 'text-red-800'}`}>{leverageEquity.toFixed(2)}%</span>
                 </div>
                 <div className="flex justify-between text-xs">
                    <span className="text-gray-600">4.5 Deuda / Activos:</span>
                    <span className={`font-bold ${leverageAssets > 70 ? 'text-red-600' : 'text-red-800'}`}>{leverageAssets.toFixed(2)}%</span>
                 </div>
             </div>
         </div>

         <div className="bg-purple-50 p-4 rounded border border-purple-100 mt-8">
             <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-purple-800 flex items-center"><BrainCircuit className="w-4 h-4 mr-2"/> Análisis IA (Endeudamiento & 6 C's)</h4>
                <div className="space-x-2">
                   <button onClick={generateDebtAnalysis} disabled={aiLoading.debt} className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:bg-gray-400">Analizar Deuda</button>
                   <button onClick={generateSixCsAnalysis} disabled={aiLoading.full} className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:bg-gray-400">Analizar 6 C's</button>
                </div>
             </div>
             
             <div className="space-y-6">
                <div>
                   <div className="text-xs font-bold text-purple-700 mb-2">Análisis de Endeudamiento Post-Crédito</div>
                   <div className="w-full text-xs p-4 bg-white border rounded whitespace-pre-wrap leading-relaxed shadow-sm min-h-[80px]">
                      {data.review?.debtReasonabilityAnalysis || 'Pendiente de análisis...'}
                   </div>
                </div>

                <div>
                   <div className="text-xs font-bold text-purple-700 mb-2">Análisis Detallado de las 6 C's del Crédito</div>
                   <div className="w-full text-xs p-4 bg-white border rounded whitespace-pre-wrap leading-relaxed shadow-sm min-h-[150px]">
                      {data.review?.sixCsAnalysis || 'Pendiente de análisis...'}
                   </div>
                </div>
             </div>
         </div>

      </div>

      <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 break-inside-avoid">
         <h3 className="text-lg font-bold text-blue-900 mb-4 border-b border-blue-200 pb-2 flex items-center">
           <Users className="w-5 h-5 mr-2"/> 10. Opinión y Comité
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
               <label className="block text-xs font-bold mb-1">Riesgos (Oficial)</label>
               <textarea className="w-full p-2 border border-gray-300 rounded text-xs" rows={2} value={data.review?.officerRisks||''} onChange={(e)=>updateReview('officerRisks',e.target.value)} />
            </div>
            <div>
               <label className="block text-xs font-bold mb-1">Recomendación (Oficial)</label>
               <textarea className="w-full p-2 border border-gray-300 rounded text-xs" rows={2} value={data.review?.officerRecommendations||''} onChange={(e)=>updateReview('officerRecommendations',e.target.value)} />
            </div>
         </div>

         <div className="flex justify-between items-center mb-4">
            <div>
                <span className="text-xs font-bold text-blue-800 uppercase">Decisión del Comité</span>
                <select 
                   className="block w-48 p-2 border border-blue-300 rounded text-blue-900 font-bold mt-1"
                   value={data.review?.committeeDecision} 
                   onChange={(e) => updateReview('committeeDecision', e.target.value)}
                >
                   <option value="">Seleccione...</option>
                   <option value="Aprobado">Aprobado</option>
                   <option value="Aprobado con modificaciones">Aprobado con Modificaciones</option>
                   <option value="Postergado">Postergado</option>
                   <option value="Rechazado">Rechazado</option>
                </select>
            </div>
            <div>
                <span className="text-xs font-bold text-blue-800 uppercase">Fecha de Aprobación</span>
                <input type="date" className="block w-full p-2 border border-blue-300 rounded mt-1" value={data.review?.approvalDate || ''} onChange={(e) => updateReview('approvalDate', e.target.value)} />
            </div>
         </div>

         <div className="bg-white p-4 rounded border border-blue-100 text-xs space-y-3">
             <h4 className="font-bold text-blue-800 uppercase border-b pb-1 mb-2">Condiciones del Crédito Aprobado</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-gray-50 p-2 rounded border">
                     <span className="text-gray-500 block mb-1">Monto Solicitado</span>
                     <b className="text-lg">Q {safeNum(data.loanAmount).toLocaleString()}</b>
                 </div>
                 <div>
                     <label className="text-blue-700 font-bold block mb-1">Monto Aprobado (Q)</label>
                     <input type="number" className="w-full p-1 border rounded" value={data.review?.approvedAmount} onChange={(e) => updateReview('approvedAmount', parseFloat(e.target.value))} />
                 </div>
                 <div>
                     <label className="text-blue-700 font-bold block mb-1">Plazo (meses)</label>
                     <input type="number" className="w-full p-1 border rounded" value={data.review?.approvedTerm} onChange={(e) => updateReview('approvedTerm', parseFloat(e.target.value))} />
                 </div>
                 <div>
                     <label className="text-blue-700 font-bold block mb-1">Tasa (%)</label>
                     <input type="number" className="w-full p-1 border rounded" value={data.review?.approvedInterestRate} onChange={(e) => updateReview('approvedInterestRate', parseFloat(e.target.value))} />
                 </div>
                 <div>
                     <label className="text-blue-700 font-bold block mb-1">Forma de Pago</label>
                     <select className="w-full p-1 border rounded" value={data.review?.approvedPaymentMethod} onChange={(e) => updateReview('approvedPaymentMethod', e.target.value)}>
                        <option value="Cuota Fija (Nivelada)">Cuota Fija</option>
                        <option value="Sobre Saldos Decrecientes">S. Saldos</option>
                        <option value="Al Vencimiento">Vencimiento</option>
                     </select>
                 </div>
                 <div>
                     <label className="text-blue-700 font-bold block mb-1">Comisión (%)</label>
                     <input type="number" className="w-full p-1 border rounded" value={data.review?.approvedCommission} onChange={(e) => updateReview('approvedCommission', parseFloat(e.target.value))} />
                 </div>
                 <div className="md:col-span-2">
                     <label className="text-blue-700 font-bold block mb-1">Destino</label>
                     <input type="text" className="w-full p-1 border rounded" value={data.review?.approvedDestination} onChange={(e) => updateReview('approvedDestination', e.target.value)} />
                 </div>
             </div>
             <div className="pt-2">
                 <span className="text-blue-700 font-bold block mb-1">Garantía y Cobertura</span>
                 <textarea className="w-full p-2 border rounded" rows={2} value={data.review?.approvedGuaranteeDescription} onChange={(e) => updateReview('approvedGuaranteeDescription', e.target.value)} />
                 <div className="mt-1 text-[10px] text-gray-500 flex gap-4">
                    <span>Cobertura Comercial Actual: <b>{commercialCoverage.toFixed(2)}x</b></span>
                    <span>Cobertura Venta Rápida Actual: <b>{quickSaleCoverage.toFixed(2)}x</b></span>
                 </div>
             </div>
             <div className="pt-2">
                 <span className="text-blue-700 font-bold block mb-1">Condiciones Especiales / Comentarios</span>
                 <textarea className="w-full p-2 border rounded" rows={2} placeholder="Ingrese condiciones especiales..." value={data.review?.approvedSpecialConditions} onChange={(e) => updateReview('approvedSpecialConditions', e.target.value)} />
             </div>
             <div className="pt-4">
                 <span className="text-blue-700 font-bold block mb-1">Nombres y Cargos de Aprobadores</span>
                 <textarea className="w-full p-2 border rounded" rows={2} placeholder="Ej: Juan Perez (Gerente), Maria Lopez (Jefe Riesgos)..." value={data.review?.approverNames} onChange={(e) => updateReview('approverNames', e.target.value)} />
             </div>
         </div>
         
         <div className="grid grid-cols-3 gap-8 mt-8 pt-8 border-t border-gray-300 text-center text-xs text-gray-500">
             <div className="border-t border-gray-400 pt-2">FIRMA OFICIAL</div>
             <div className="border-t border-gray-400 pt-2">FIRMA GERENCIA</div>
             <div className="border-t border-gray-400 pt-2">FIRMA COMITÉ</div>
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

export default SectionNine;
