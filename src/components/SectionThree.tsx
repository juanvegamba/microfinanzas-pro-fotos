
import React, { useMemo, useState } from 'react';
import { DollarSign, TrendingUp, Calendar, ShoppingCart, Home, CreditCard, Plus, Trash2, Activity, ArrowRight, FileText, BarChart3, ShoppingBag, Wallet, MessageSquare, Calculator, List, Table, Printer, FileDown } from 'lucide-react';
import { ClientData, MONTHS, DisbursementDetail, OtherExpense, VariableItem, ExistingDebt, PaymentMethod } from '../types';

interface SectionThreeProps {
  data: ClientData;
  updateData: (field: keyof ClientData, value: any) => void;
}

// ARCHITECTURAL CHANGE: Standardize safe number handling
// PRESERVATION CHECK: Ensures logic (0 fallback) behaves exactly as legacy typeof checks
const safeNum = (val: any): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const SectionThree: React.FC<SectionThreeProps> = ({ data, updateData }) => {
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  // --- HELPER FUNCTIONS FOR DYNAMIC LISTS ---

  const addDisbursementDetail = () => {
    const newItem: DisbursementDetail = {
      id: Date.now().toString(),
      purpose: '',
      type: '',
      amount: '',
      month: 1
    };
    updateData('disbursementPlan', [...data.disbursementPlan, newItem]);
  };

  const removeDisbursementDetail = (id: string) => {
    updateData('disbursementPlan', data.disbursementPlan.filter(i => i.id !== id));
  };

  const updateDisbursementDetail = (id: string, field: keyof DisbursementDetail, value: any) => {
    updateData('disbursementPlan', data.disbursementPlan.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const toggleMonth = (month: string, type: 'low' | 'high') => {
    const field = type === 'low' ? 'lowSalesMonths' : 'highSalesMonths';
    const current = data[field] as string[];
    if (current.includes(month)) {
      updateData(field, current.filter(m => m !== month));
    } else {
      updateData(field, [...current, month]);
    }
  };

  const addOtherExpense = () => {
    updateData('otherBusinessExpenses', [...data.otherBusinessExpenses, { id: Date.now().toString(), description: '', amount: '' }]);
  };

  const updateOtherExpense = (id: string, field: keyof OtherExpense, value: any) => {
    updateData('otherBusinessExpenses', data.otherBusinessExpenses.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeOtherExpense = (id: string) => {
    updateData('otherBusinessExpenses', data.otherBusinessExpenses.filter(i => i.id !== id));
  };

  const addVariableItem = () => {
    updateData('variableItems', [...data.variableItems, { id: Date.now().toString(), concept: '', type: 'Ingreso', month: 'Enero', amount: '' }]);
  };

  const updateVariableItem = (id: string, field: keyof VariableItem, value: any) => {
    updateData('variableItems', data.variableItems.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeVariableItem = (id: string) => {
    updateData('variableItems', data.variableItems.filter(i => i.id !== id));
  };

  const addDebt = () => {
    updateData('existingDebts', [...data.existingDebts, { 
        id: Date.now().toString(), 
        creditor: '', 
        originalAmount: '', 
        currentBalance: '', 
        monthlyQuota: '', 
        type: 'Del Negocio',
        consolidate: false 
    }]);
  };

  const updateDebt = (id: string, field: keyof ExistingDebt, value: any) => {
    updateData('existingDebts', data.existingDebts.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeDebt = (id: string) => {
    updateData('existingDebts', data.existingDebts.filter(i => i.id !== id));
  };

  // --- CALCULATIONS (REFACTORED WITH SAFE NUMBERS) ---

  // 1. Calculate Weighted Average Monthly Sales
  const calculateMonthlySales = () => {
    const calcType = (amount: number | '', freq: number | '') => {
      return safeNum(amount) * safeNum(freq);
    };
    
    const good = calcType(data.salesGood.amount, data.salesGood.frequency);
    const regular = calcType(data.salesRegular.amount, data.salesRegular.frequency);
    const bad = calcType(data.salesBad.amount, data.salesBad.frequency);
    
    return good + regular + bad;
  };
  
  const baseMonthlySales = calculateMonthlySales();

  // 2. Totals
  const totalOtherBusinessExpenses = data.otherBusinessExpenses.reduce((sum, item) => sum + safeNum(item.amount), 0);
  const totalBusinessFixedExpenses = 
    safeNum(data.expensesEmployees) +
    safeNum(data.expensesRent) +
    safeNum(data.expensesUtilities) +
    safeNum(data.expensesTransport) +
    safeNum(data.expensesMaintenance) +
    totalOtherBusinessExpenses;

  const totalFamilyExpenses = 
    safeNum(data.familyFood) +
    safeNum(data.familyTransport) +
    safeNum(data.familyEducation) +
    safeNum(data.familyUtilities) +
    safeNum(data.familyComms) +
    safeNum(data.familyHealth) +
    safeNum(data.familyOther);

  // Only sum debts that are NOT consolidated
  const totalExistingDebtPayment = data.existingDebts
    .filter(d => !d.consolidate)
    .reduce((sum, item) => sum + safeNum(item.monthlyQuota), 0);

  // 3. Variable Income/Expense Net
  const netVariableAnnual = data.variableItems.reduce((acc, item) => {
    const val = safeNum(item.amount);
    return item.type === 'Ingreso' ? acc + val : acc - val;
  }, 0);
  const avgNetVariableMonthly = netVariableAnnual / 12;

  // 4. Loan Amortization (Simplified for Projection)
  const loanAmt = safeNum(data.loanAmount);
  const annualRate = safeNum(data.loanInterestRate);
  const termMonths = safeNum(data.loanTerm) || 24; // Default to 24 to avoid div by zero
  const monthlyRate = annualRate / 100 / 12;

  const calculatePmt = () => {
    if (loanAmt === 0 || termMonths === 0) return 0;
    if (data.loanPaymentMethod === 'Cuota Fija (Nivelada)') {
      if (monthlyRate === 0) return loanAmt / termMonths;
      return (loanAmt * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    } else if (data.loanPaymentMethod === 'Sobre Saldos Decrecientes') {
      // Average quota for quick analysis
      const principal = loanAmt / termMonths;
      // Ideally, for declining, first payment is highest: (Principal/Term) + (Total * Rate)
      return principal + (loanAmt * monthlyRate); // Return FIRST payment for conservative capacity analysis
    }
    return 0;
  };

  const estimatedNewQuota = calculatePmt();

  // 5. Margins based on experience
  const getSafetyMarginPercent = () => {
    if (data.creditExperience === 'Recurrente') return 0.25;
    if (data.creditExperience === 'Externo') return 0.30;
    return 0.35; // Nuevo or default
  };
  const marginPercent = getSafetyMarginPercent();

  // 6. Cash Flow Projection (24 Months)
  const cashFlowProjection = useMemo(() => {
    const projection = [];
    let cumulativeFlow = 0;

    const startMonthIndex = new Date().getMonth(); // 0 = Jan

    for (let i = 1; i <= 24; i++) {
      const monthIndex = (startMonthIndex + i - 1) % 12;
      const monthName = MONTHS[monthIndex];

      // Seasonality
      let sales = baseMonthlySales;
      if (data.lowSalesMonths.includes(monthName)) {
        sales *= (1 - safeNum(data.lowSalesReduction) / 100);
      } else if (data.highSalesMonths.includes(monthName)) {
        sales *= (1 + safeNum(data.highSalesIncrease) / 100);
      }

      // Variable Items for this month
      const monthVariableItems = data.variableItems.filter(v => v.month === monthName);
      const variableIncome = monthVariableItems.filter(v => v.type === 'Ingreso').reduce((s, v) => s + safeNum(v.amount), 0);
      const variableExpense = monthVariableItems.filter(v => v.type === 'Gasto').reduce((s, v) => s + safeNum(v.amount), 0);

      // Costs
      const cmv = sales * (safeNum(data.costOfGoodsSold) / 100);
      
      // Disbursement Logic (mapped by month number relative to start)
      const disbursementEntry = data.disbursementPlan
        .filter(d => d.month === i && d.type === 'Entrada de dinero')
        .reduce((s, d) => s + safeNum(d.amount), 0);
      
      const disbursementExit = data.disbursementPlan
        .filter(d => d.month === i && d.type === 'Salida de Dinero')
        .reduce((s, d) => s + safeNum(d.amount), 0);

      // Loan Payment (Only if i <= term)
      let newLoanPayment = 0;
      if (i <= termMonths) {
         if (data.loanPaymentMethod === 'Sobre Saldos Decrecientes') {
             // Calculate specific declining balance interest
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
        totalExistingDebtPayment + // Only non-consolidated debts
        disbursementExit +
        safeNum(data.plannedInvestment) +
        newLoanPayment;

      const sdn = (sales + variableIncome + safeNum(data.familyIncome)) - 
                  (cmv + totalBusinessFixedExpenses + variableExpense + totalFamilyExpenses + totalExistingDebtPayment + safeNum(data.plannedInvestment));

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
        sdn,
        pagoNuevaDeuda: newLoanPayment,
        flujoMes: monthlyFlow,
        flujoAcumulado: cumulativeFlow,
        ingresosTotales: totalIncome,
        gastosTotales: totalOutflow
      });
    }
    return projection;
  }, [baseMonthlySales, data, estimatedNewQuota, loanAmt, monthlyRate, termMonths, totalBusinessFixedExpenses, totalExistingDebtPayment, totalFamilyExpenses]);


  // 7. Summary Indicators
  const summarySales = baseMonthlySales;
  const summaryCMV = summarySales * (safeNum(data.costOfGoodsSold) / 100);
  const summaryGrossProfit = summarySales - summaryCMV;
  const summaryOperatingProfit = summaryGrossProfit - totalBusinessFixedExpenses;
  const summarySDN = summaryOperatingProfit + avgNetVariableMonthly + safeNum(data.familyIncome) - totalFamilyExpenses - safeNum(data.plannedInvestment) - totalExistingDebtPayment;
  
  const sdnWithMargin = summarySDN * (1 - marginPercent);
  
  const capacityRatio = safeNum(data.monthlyPaymentCapacity) > 0 && sdnWithMargin > 0 
      ? safeNum(data.monthlyPaymentCapacity) / sdnWithMargin 
      : 0;

  const rcd = estimatedNewQuota > 0 ? summarySDN / estimatedNewQuota : 0;
  const rcdWithMargin = estimatedNewQuota > 0 ? sdnWithMargin / estimatedNewQuota : 0;

  // Max Capacity: PV(rate, term, payment=sdnWithMargin)
  const calculatePV = (rate: number, nper: number, pmt: number) => {
    if (rate === 0) return pmt * nper;
    return pmt * (1 - Math.pow(1 + rate, -nper)) / rate;
  };
  const maxLoanCapacity = calculatePV(monthlyRate, termMonths, sdnWithMargin);


  // --- CHART DATA GENERATION ---
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

  // Determine scales for SVG Chart
  const allValues = chartPoints.flatMap(p => [p.income, p.expenses, p.sdn, p.debt, p.flow]);
  const maxVal = Math.max(...allValues, 1000) * 1.1; // Add 10% padding
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

      {/* 1. Detalles del Préstamo */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          Detalles del Préstamo Solicitado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Monto Solicitado (Q) *</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                value={data.loanAmount} onChange={(e) => updateData('loanAmount', parseFloat(e.target.value) || '')} />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Destino Principal del Crédito *</label>
             <select className="w-full p-2 border border-gray-300 rounded-md"
                value={data.loanDestination} onChange={(e) => updateData('loanDestination', e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="Capital de Trabajo">Capital de Trabajo</option>
                <option value="Activo Fijo">Activo Fijo</option>
                <option value="Consolidación de Deudas">Consolidación de Deudas</option>
                <option value="Mejora de Vivienda/Negocio">Mejora de Vivienda/Negocio</option>
                <option value="Otro">Otro</option>
             </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Detalle Específico del Destino</label>
             <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.loanDestinationDetail} onChange={(e) => updateData('loanDestinationDetail', e.target.value)} />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Plazo (en meses) *</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.loanTerm} onChange={(e) => updateData('loanTerm', parseInt(e.target.value) || '')} />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Tasa de Interés Anual (%)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.loanInterestRate} onChange={(e) => updateData('loanInterestRate', parseFloat(e.target.value) || '')} />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Forma de Pago</label>
             <select className="w-full p-2 border border-gray-300 rounded-md"
                value={data.loanPaymentMethod} onChange={(e) => updateData('loanPaymentMethod', e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="Cuota Fija (Nivelada)">Cuota Fija (Nivelada)</option>
                <option value="Sobre Saldos Decrecientes">Sobre Saldos Decrecientes</option>
                <option value="Al Vencimiento">Al Vencimiento</option>
             </select>
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Comisión por Desembolso (%)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.loanCommission} onChange={(e) => updateData('loanCommission', parseFloat(e.target.value) || '')} />
          </div>
          <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Financiamiento de Comisión</label>
             <select className="w-full p-2 border border-gray-300 rounded-md"
                value={data.loanCommissionFinancing} onChange={(e) => updateData('loanCommissionFinancing', e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="Cobrada al Desembolso">Cobrada al Desembolso</option>
                <option value="Financiada">Financiada</option>
             </select>
          </div>
        </div>
      </div>

      {/* 2. Plan de Desembolsos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-2 flex items-center">
           <TrendingUp className="w-5 h-5 mr-2" />
           Plan de Desembolsos y Uso de Deuda Detallado
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Detalle cómo y cuándo se utilizará el dinero del préstamo. La suma de los montos debe ser igual al monto solicitado.
        </p>
        <div className="bg-blue-50 p-3 rounded-md mb-4 text-xs text-blue-800">
           Seleccione si cada ítem es una "Entrada" (ej. desembolso del préstamo) o una "Salida" (ej. compra de activo fijo, pago de deuda). El monto debe ser siempre positivo.
        </div>

        <div className="space-y-4">
          {data.disbursementPlan.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border-b pb-4">
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-700">Propósito</label>
                <select className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                   value={item.purpose} onChange={(e) => updateDisbursementDetail(item.id, 'purpose', e.target.value)}>
                   <option value="">Seleccione...</option>
                   <option value="Capital de Trabajo">Capital de Trabajo</option>
                   <option value="Activo Fijo">Activo Fijo</option>
                   <option value="Pago de Deuda">Pago de Deuda</option>
                   <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-700">Tipo</label>
                <select className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                   value={item.type} onChange={(e) => updateDisbursementDetail(item.id, 'type', e.target.value)}>
                   <option value="">Seleccione...</option>
                   <option value="Entrada de dinero">Entrada de dinero</option>
                   <option value="Salida de Dinero">Salida de Dinero</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-700">Monto (Q)</label>
                <input type="number" className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                   value={item.amount} onChange={(e) => updateDisbursementDetail(item.id, 'amount', parseFloat(e.target.value) || '')} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Mes (1-24)</label>
                <input type="number" min="1" max="24" className="w-full p-1.5 text-sm border border-gray-300 rounded-md"
                   value={item.month} onChange={(e) => updateDisbursementDetail(item.id, 'month', parseInt(e.target.value) || 1)} />
              </div>
              <div className="md:col-span-1">
                <button onClick={() => removeDisbursementDetail(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-md">
                   <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <button onClick={addDisbursementDetail} className="text-sm text-blue-600 font-medium hover:underline flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Agregar Detalle
          </button>
        </div>
      </div>

      {/* 3. Perfil de Ventas */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Perfil de Ventas del Negocio
        </h3>
        <p className="text-xs text-gray-500 mb-4">Ingrese las ventas y la frecuencia para un día o semana buena, regular y mala.</p>
        
        {['Good', 'Regular', 'Bad'].map((type) => {
           const key = `sales${type}` as 'salesGood' | 'salesRegular' | 'salesBad';
           const labels = { Good: 'Ventas Buenas', Regular: 'Ventas Regulares', Bad: 'Ventas Malas' };
           
           return (
             <div key={type} className="p-4 bg-gray-50 rounded-md border border-gray-200 mb-4">
                <h4 className="font-semibold text-sm text-gray-700 mb-3">{labels[type as keyof typeof labels]}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                      <label className="block text-xs text-gray-600">Monto de Venta (Q)</label>
                      <input type="number" className="w-full p-2 border border-gray-300 rounded-md bg-white"
                         value={data[key].amount} 
                         onChange={(e) => updateData(key, { ...data[key], amount: parseFloat(e.target.value) || '' })} />
                   </div>
                   <div>
                      <label className="block text-xs text-gray-600">Período</label>
                      <select className="w-full p-2 border border-gray-300 rounded-md bg-white"
                         value={data[key].period}
                         onChange={(e) => updateData(key, { ...data[key], period: e.target.value })}>
                         <option value="">Seleccione..</option>
                         <option value="Diaria">Diaria</option>
                         <option value="Semanal">Semanal</option>
                         <option value="Mensual">Mensual</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs text-gray-600">Veces al Mes</label>
                      <input type="number" className="w-full p-2 border border-gray-300 rounded-md bg-white"
                         value={data[key].frequency} 
                         onChange={(e) => updateData(key, { ...data[key], frequency: parseFloat(e.target.value) || '' })} />
                   </div>
                </div>
             </div>
           )
        })}
      </div>

      {/* 4. Estacionalidad */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Ajustes por Estacionalidad y Crédito
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div>
             <h4 className="font-medium text-sm mb-2">Meses de Venta Baja</h4>
             <div className="grid grid-cols-3 gap-2 mb-2">
                {MONTHS.map(m => (
                  <label key={`low-${m}`} className="flex items-center space-x-2 text-xs">
                     <input type="checkbox" checked={data.lowSalesMonths.includes(m)} onChange={() => toggleMonth(m, 'low')} />
                     <span>{m.substring(0,3)}</span>
                  </label>
                ))}
             </div>
             <label className="block text-xs font-medium text-gray-700 mt-3">Reducción %</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                value={data.lowSalesReduction} onChange={(e) => updateData('lowSalesReduction', parseFloat(e.target.value) || '')}/>
           </div>

           <div>
             <h4 className="font-medium text-sm mb-2">Meses de Venta Alta</h4>
             <div className="grid grid-cols-3 gap-2 mb-2">
                {MONTHS.map(m => (
                  <label key={`high-${m}`} className="flex items-center space-x-2 text-xs">
                     <input type="checkbox" checked={data.highSalesMonths.includes(m)} onChange={() => toggleMonth(m, 'high')} />
                     <span>{m.substring(0,3)}</span>
                  </label>
                ))}
             </div>
             <label className="block text-xs font-medium text-gray-700 mt-3">Aumento %</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                value={data.highSalesIncrease} onChange={(e) => updateData('highSalesIncrease', parseFloat(e.target.value) || '')}/>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t pt-4">
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">% de Ventas al Crédito</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.salesCreditPercentage} onChange={(e) => updateData('salesCreditPercentage', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Plazo Promedio de Crédito (días)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.salesCreditTerm} onChange={(e) => updateData('salesCreditTerm', parseFloat(e.target.value) || '')} />
           </div>
        </div>
      </div>

      {/* 5. Costos y Gastos */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Costos y Gastos Operativos del Negocio
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Costo de Mercadería Vendida (CMV) %</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.costOfGoodsSold} onChange={(e) => updateData('costOfGoodsSold', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Costos de Empleados (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.expensesEmployees} onChange={(e) => updateData('expensesEmployees', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Alquiler del Local/Negocio (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.expensesRent} onChange={(e) => updateData('expensesRent', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Servicios de luz, agua, teléfono, etc. (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.expensesUtilities} onChange={(e) => updateData('expensesUtilities', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Transporte y Combustible (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.expensesTransport} onChange={(e) => updateData('expensesTransport', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Mantenimiento y Reparaciones (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.expensesMaintenance} onChange={(e) => updateData('expensesMaintenance', parseFloat(e.target.value) || '')} />
           </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm text-gray-700 mb-2">Otros Gastos del Negocio</h4>
          {data.otherBusinessExpenses.map((item) => (
             <div key={item.id} className="flex gap-4 mb-2 items-end">
                <div className="flex-1">
                   <label className="block text-xs text-gray-500">Descripción del Gasto</label>
                   <input type="text" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.description} onChange={(e) => updateOtherExpense(item.id, 'description', e.target.value)}/>
                </div>
                <div className="flex-1">
                   <label className="block text-xs text-gray-500">Monto Mensual (Q)</label>
                   <input type="number" className="w-full p-2 border border-gray-300 rounded-md" 
                      value={item.amount} onChange={(e) => updateOtherExpense(item.id, 'amount', parseFloat(e.target.value) || '')}/>
                </div>
                <button onClick={() => removeOtherExpense(item.id)} className="p-2 bg-red-100 text-red-700 rounded-md text-xs px-3 hover:bg-red-200">Eliminar</button>
             </div>
          ))}
          <button onClick={addOtherExpense} className="text-sm text-blue-600 font-medium hover:underline mt-2">+ Agregar Otro Gasto</button>
        </div>

        <div className="mt-4 bg-gray-50 p-3 rounded font-bold text-sm text-gray-800">
           Total Gastos Operativos Mensuales (Calculado): Q {totalBusinessFixedExpenses.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* 6. Ingreso Neto Variable */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
           <Activity className="w-5 h-5 mr-2" />
           Ingreso Neto Variable (Anual)
        </h3>
        <p className="text-xs text-gray-500 mb-4">Añada ingresos o gastos puntuales o estacionales que no sean recurrentes mensualmente.</p>
        
        {data.variableItems.map((item) => (
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3 items-end border-b pb-2">
             <div className="md:col-span-3">
                <label className="block text-xs text-gray-500">Concepto</label>
                <input type="text" className="w-full p-2 border border-gray-300 rounded-md"
                   value={item.concept} onChange={(e) => updateVariableItem(item.id, 'concept', e.target.value)} />
             </div>
             <div className="md:col-span-3">
                <label className="block text-xs text-gray-500">Tipo</label>
                <select className="w-full p-2 border border-gray-300 rounded-md"
                   value={item.type} onChange={(e) => updateVariableItem(item.id, 'type', e.target.value)}>
                   <option value="Ingreso">Ingreso</option>
                   <option value="Gasto">Gasto</option>
                </select>
             </div>
             <div className="md:col-span-3">
                <label className="block text-xs text-gray-500">Mes</label>
                <select className="w-full p-2 border border-gray-300 rounded-md"
                   value={item.month} onChange={(e) => updateVariableItem(item.id, 'month', e.target.value)}>
                   {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
             </div>
             <div className="md:col-span-2">
                <label className="block text-xs text-gray-500">Monto (Q)</label>
                <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                   value={item.amount} onChange={(e) => updateVariableItem(item.id, 'amount', parseFloat(e.target.value) || '')} />
             </div>
             <div className="md:col-span-1">
               <button onClick={() => removeVariableItem(item.id)} className="p-2 bg-red-100 text-red-700 rounded-md text-xs hover:bg-red-200 w-full">Eliminar</button>
             </div>
          </div>
        ))}
        <button onClick={addVariableItem} className="text-sm text-blue-600 font-medium hover:underline">+ Agregar Ingreso/Gasto Variable</button>
        
        <div className="mt-4 bg-gray-50 p-3 rounded font-bold text-sm text-gray-800">
           Promedio Mensual de Ingreso Neto Variable (Calculado): Q {avgNetVariableMonthly.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* 7. Ingresos y Gastos Familiares */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <Home className="w-5 h-5 mr-2" />
            Ingresos y Gastos Familiares
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Otros Ingresos Familiares Mensuales (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.familyIncome} onChange={(e) => updateData('familyIncome', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Alimentación (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.familyFood} onChange={(e) => updateData('familyFood', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Transporte (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.familyTransport} onChange={(e) => updateData('familyTransport', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Educación (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.familyEducation} onChange={(e) => updateData('familyEducation', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Servicios (luz, agua, gas) (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.familyUtilities} onChange={(e) => updateData('familyUtilities', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Servicios (internet, telefonía) (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.familyComms} onChange={(e) => updateData('familyComms', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Salud (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.familyHealth} onChange={(e) => updateData('familyHealth', parseFloat(e.target.value) || '')} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Otros Gastos Familiares, salidas, etc. (Q)</label>
             <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
                value={data.familyOther} onChange={(e) => updateData('familyOther', parseFloat(e.target.value) || '')} />
           </div>
        </div>
        <div className="mt-4 bg-gray-50 p-3 rounded font-bold text-sm text-gray-800">
           Total Gastos Familiares Mensuales (Calculado): Q {totalFamilyExpenses.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* 8. Inversiones y Deudas */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <Wallet className="w-5 h-5 mr-2" />
            Inversiones y Deudas Existentes
        </h3>
        
        <div className="mb-6">
           <label className="block text-xs font-medium text-gray-700 mb-1">Inversiones Mensuales Planificadas (Q)</label>
           <input type="number" className="w-full p-2 border border-gray-300 rounded-md"
             value={data.plannedInvestment} onChange={(e) => updateData('plannedInvestment', parseFloat(e.target.value) || '')} />
        </div>

        <h4 className="font-medium text-sm text-gray-700 mb-2">Deudas Existentes</h4>
        {data.existingDebts.map((item) => (
          <div key={item.id} className="p-4 border border-gray-200 rounded-md mb-3 relative bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
               <div>
                  <label className="block text-xs text-gray-500">Acreedor</label>
                  <input type="text" className="w-full p-2 border border-gray-300 rounded-md bg-white"
                     value={item.creditor} onChange={(e) => updateDebt(item.id, 'creditor', e.target.value)} />
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="block text-xs text-gray-500">Monto Original (Q)</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-md bg-white"
                       value={item.originalAmount} onChange={(e) => updateDebt(item.id, 'originalAmount', parseFloat(e.target.value) || '')} />
                 </div>
                 <div>
                    <label className="block text-xs text-gray-500">Saldo Actual (Q)</label>
                    <input type="number" className="w-full p-2 border border-gray-300 rounded-md bg-white"
                       value={item.currentBalance} onChange={(e) => updateDebt(item.id, 'currentBalance', parseFloat(e.target.value) || '')} />
                 </div>
               </div>
               <div className="flex flex-col">
                  <label className="block text-xs text-gray-500">Cuota Mensual (Q)</label>
                  <input type="number" className="w-full p-2 border border-gray-300 rounded-md bg-white"
                     value={item.monthlyQuota} onChange={(e) => updateDebt(item.id, 'monthlyQuota', parseFloat(e.target.value) || '')} />
                  <div className="mt-2 flex items-center">
                     <input 
                       type="checkbox" 
                       id={`consolidate-${item.id}`}
                       className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                       checked={item.consolidate || false} 
                       onChange={(e) => updateDebt(item.id, 'consolidate', e.target.checked)}
                     />
                     <label htmlFor={`consolidate-${item.id}`} className="text-xs font-bold text-blue-700 cursor-pointer">
                       Consolidar (Pagar con nuevo crédito)
                     </label>
                  </div>
               </div>
               <div>
                  <label className="block text-xs text-gray-500">Tipo de Deuda</label>
                  <select className="w-full p-2 border border-gray-300 rounded-md bg-white"
                     value={item.type} onChange={(e) => updateDebt(item.id, 'type', e.target.value)}>
                     <option value="Del Negocio">Del Negocio</option>
                     <option value="De la Casa/Familia">De la Casa/Familia</option>
                  </select>
               </div>
            </div>
            <div className="flex justify-end">
               <button onClick={() => removeDebt(item.id)} className="p-1.5 bg-red-100 text-red-700 rounded text-xs px-3 hover:bg-red-200">Eliminar</button>
            </div>
          </div>
        ))}
        <button onClick={addDebt} className="text-sm text-blue-600 font-medium hover:underline">+ Agregar Deuda</button>
        
        <div className="mt-4 bg-gray-50 p-3 rounded font-bold text-sm text-gray-800">
           Total Cuotas Mensuales de Deudas Existentes (No consolidadas): Q {totalExistingDebtPayment.toLocaleString('es-GT', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* 9. Contexto y Experiencia */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contexto y Experiencia del Cliente para Cálculo de Margen
        </h3>
        <div className="grid grid-cols-1 gap-4">
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Observaciones sobre la Capacidad de Pago</label>
             <textarea className="w-full p-2 border border-gray-300 rounded-md" rows={2}
                value={data.capacityObservations} onChange={(e) => updateData('capacityObservations', e.target.value)} />
           </div>
           <div>
             <label className="block text-xs font-medium text-gray-700 mb-1">Experiencia de Créditos del Cliente</label>
             <select className="w-full p-2 border border-brand-primary/30 ring-1 ring-brand-primary/20 rounded-md bg-blue-50/30 font-medium"
                value={data.creditExperience} onChange={(e) => updateData('creditExperience', e.target.value)}>
                <option value="">Seleccione...</option>
                <option value="Nuevo">Nuevo (Sin experiencia crediticia previa) [Margen 35%]</option>
                <option value="Externo">Externo (Con experiencia aceptable otras inst.) [Margen 30%]</option>
                <option value="Recurrente">Recurrente (Historial excelente nuestra inst.) [Margen 25%]</option>
             </select>
           </div>
        </div>
      </div>

      {/* 10. Resultados del Análisis */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-6 flex items-center">
            <Calculator className="w-5 h-5 mr-2" />
            Resultados del Análisis de Capacidad de Pago
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
              <div className="text-xs text-gray-500">(Saludable: &lt;1.0)</div>
           </div>

           <div className="bg-pink-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Cuota Nueva Deuda (1er Pago)</div>
              <div className="text-xl font-bold text-gray-900">Q {estimatedNewQuota.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
           </div>
           <div className="bg-yellow-50 p-4 rounded-md text-center">
              <div className="text-xs text-gray-600 uppercase font-semibold">Razón de Cobertura de Deuda (RCD)</div>
              <div className="text-xl font-bold text-gray-900">{rcd.toFixed(2)}</div>
              <div className="text-xs text-gray-500">(Saludable: &gt;1.5, Aceptable: &gt;1.2)</div>
           </div>
           <div className="bg-orange-100 p-4 rounded-md text-center">
              <div className="text-xs text-gray-700 uppercase font-semibold">RCD con Margen de Seguridad</div>
              <div className="text-xl font-bold text-gray-900">{rcdWithMargin.toFixed(2)}</div>
              <div className="text-xs text-gray-500">(SDN con margen / Cuota)</div>
           </div>
        </div>

        <div className="bg-blue-100 p-6 rounded-lg text-center border border-blue-200">
             <div className="text-sm text-blue-800 font-semibold uppercase">Capacidad Máxima de Préstamo Estimada</div>
             <div className="text-3xl font-bold text-blue-900 my-2">Q {maxLoanCapacity.toLocaleString('es-GT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
             <div className="text-xs text-blue-700">Basado en el margen de seguridad del SDN, plazo y tasa del crédito actual.</div>
        </div>
      </div>

      {/* 11. Resumen Financiero Vertical */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <List className="w-5 h-5 mr-2" />
            Resumen Financiero (Calculado)
        </h3>
        <div className="space-y-2 text-sm font-mono">
            <div className="flex justify-between"><span>Ingreso por Ventas</span> <span>Q {summarySales.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between text-red-600"><span>(-) Costo de Mercadería (CMV)</span> <span>({summaryCMV.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
            <div className="flex justify-between font-bold border-t border-gray-300 pt-1"><span>(=) Utilidad Bruta</span> <span>Q {summaryGrossProfit.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
            
            <div className="flex justify-between text-red-600 pt-2"><span>(-) Gastos Operativos</span> <span>({totalBusinessFixedExpenses.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
            <div className="flex justify-between font-bold border-t border-gray-300 pt-1"><span>(=) Utilidad Operativa</span> <span>Q {summaryOperatingProfit.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>

            <div className="flex justify-between pt-2"><span>(+/-) Ing/Gasto Neto Variable</span> <span>Q {avgNetVariableMonthly.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between"><span>(+) Otros Ingresos Familiares</span> <span>Q {safeNum(data.familyIncome).toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between text-red-600"><span>(-) Gastos Familiares</span> <span>({totalFamilyExpenses.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
            <div className="flex justify-between text-red-600"><span>(-) Inversiones</span> <span>({safeNum(data.plannedInvestment).toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
            <div className="flex justify-between text-red-600"><span>(-) Deudas Existentes</span> <span>({totalExistingDebtPayment.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
            
            <div className="flex justify-between font-bold border-t border-gray-300 pt-1 bg-green-50 p-1"><span>(=) Saldo Disponible Neto (SDN)</span> <span>Q {summarySDN.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
            <div className="flex justify-between pt-1 text-gray-600"><span>SDN con Margen ({(100 - marginPercent*100).toFixed(0)}%)</span> <span>Q {sdnWithMargin.toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
            
            <div className="flex justify-between text-red-600 pt-2"><span>(-) Cuota Nuevo Préstamo (Promedio)</span> <span>({estimatedNewQuota.toLocaleString('es-GT', {minimumFractionDigits: 2})})</span></div>
            <div className="flex justify-between font-bold border-t border-brand-primary pt-2 bg-blue-50 p-2 text-brand-primary"><span>(=) Flujo de Caja Libre Final (con margen)</span> <span>Q {(sdnWithMargin - estimatedNewQuota).toLocaleString('es-GT', {minimumFractionDigits: 2})}</span></div>
        </div>
      </div>

      {/* 12. Flujo de Caja Proyectado */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 overflow-hidden break-inside-avoid">
        <h3 className="text-lg font-semibold text-brand-primary mb-4 flex items-center">
            <Table className="w-5 h-5 mr-2" />
            Flujo de Caja Proyectado (Detallado Mensual)
        </h3>
        
        <div className="overflow-x-auto">
           <table className="min-w-full text-xs border-collapse text-right">
              <thead>
                 <tr className="bg-gray-100">
                    <th className="p-2 border text-center text-gray-600" colSpan={1}></th>
                    <th className="p-2 border text-center text-green-700 font-bold" colSpan={3}>Entradas de Dinero</th>
                    <th className="p-2 border text-center text-red-700 font-bold" colSpan={5}>Salidas y Capacidad</th>
                    <th className="p-2 border text-center text-blue-700 font-bold" colSpan={2}>Flujo de Caja</th>
                 </tr>
                 <tr className="bg-gray-50 font-semibold text-gray-700">
                    <th className="p-2 border text-left">Mes</th>
                    <th className="p-2 border">Ventas</th>
                    <th className="p-2 border">Desembolso Neto</th>
                    <th className="p-2 border">Otros Ingresos</th>
                    <th className="p-2 border">Costo Ventas</th>
                    <th className="p-2 border">Gastos Negocio</th>
                    <th className="p-2 border">Gastos Familia</th>
                    <th className="p-2 border">Pgto. Deuda Exist</th>
                    <th className="p-2 border bg-gray-100">SDN</th>
                    <th className="p-2 border">Pgto. Nueva Deuda</th>
                    <th className="p-2 border bg-green-50">Flujo Caja Mes</th>
                    <th className="p-2 border">Flujo Acumulado</th>
                 </tr>
              </thead>
              <tbody>
                 {cashFlowProjection.map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50">
                       <td className="p-2 border text-center font-medium text-gray-800">
                         {row.month} - {row.monthName.substring(0, 3)}
                       </td>
                       <td className="p-2 border">{row.sales.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                       <td className="p-2 border">{row.disbursementEntry.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                       <td className="p-2 border">{row.otherIncome.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                       <td className="p-2 border text-gray-600">{row.costVentas.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                       <td className="p-2 border text-gray-600">{row.gastosNegocio.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                       <td className="p-2 border text-gray-600">{row.gastosFamilia.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                       <td className="p-2 border text-gray-600">{row.pagoDeudaExist.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                       <td className={`p-2 border font-semibold ${row.sdn < 0 ? 'text-red-600' : 'text-green-600'} bg-gray-50`}>
                          {row.sdn.toLocaleString('en-US', {maximumFractionDigits: 0})}
                       </td>
                       <td className="p-2 border text-gray-800">{row.pagoNuevaDeuda.toLocaleString('en-US', {maximumFractionDigits: 0})}</td>
                       <td className={`p-2 border font-bold ${row.flujoMes < 0 ? 'text-red-600' : 'text-green-700'} bg-green-50`}>
                          {row.flujoMes.toLocaleString('en-US', {maximumFractionDigits: 0})}
                       </td>
                       <td className={`p-2 border ${row.flujoAcumulado < 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {row.flujoAcumulado.toLocaleString('en-US', {maximumFractionDigits: 0})}
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* Chart Interactivo */}
        <div className="mt-8 p-4 border border-gray-200 rounded-lg">
             <h4 className="text-sm font-semibold text-center mb-4">Evolución del Flujo de Caja Mensual</h4>
             <div className="flex justify-center space-x-4 text-xs mb-4">
                <div className="flex items-center"><div className="w-3 h-3 bg-green-400 mr-1"></div> Ingresos Totales</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-orange-400 mr-1"></div> Gastos Totales</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-purple-500 mr-1"></div> Saldo Pre-Deuda (SDN)</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-red-500 mr-1"></div> Pago Nueva Deuda</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-blue-500 mr-1"></div> Flujo de Caja</div>
             </div>
             <div className="relative h-[350px] w-full group">
                 <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                     {/* Grid Lines - Horizontal */}
                     {[0, 0.25, 0.5, 0.75, 1].map(pct => (
                       <line 
                         key={pct}
                         x1="0" y1={chartHeight * pct} 
                         x2={chartWidth} y2={chartHeight * pct} 
                         stroke="#e5e7eb" strokeWidth="1" 
                       />
                     ))}
                     
                     {/* Charts */}
                     <polyline points={getPoints('income')} fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
                     <polyline points={getPoints('expenses')} fill="none" stroke="#fb923c" strokeWidth="2" strokeLinecap="round" />
                     <polyline points={getPoints('sdn')} fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                     <polyline points={getPoints('debt')} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                     <polyline points={getPoints('flow')} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />

                     {/* Hover Line and Active Points */}
                     {hoveredMonthIndex !== null && (
                       <line 
                         x1={(hoveredMonthIndex / (chartPoints.length - 1)) * chartWidth}
                         x2={(hoveredMonthIndex / (chartPoints.length - 1)) * chartWidth}
                         y1={0} y2={chartHeight}
                         stroke="#94a3b8" strokeWidth="1" strokeDasharray="4"
                       />
                     )}

                     {/* Interaction Layer (Invisible Rects) */}
                     {chartPoints.map((p, i) => {
                        const x = (i / (chartPoints.length - 1)) * chartWidth;
                        const colWidth = chartWidth / (chartPoints.length - 1);
                        return (
                          <rect 
                            key={i}
                            x={x - colWidth / 2}
                            y={0}
                            width={colWidth}
                            height={chartHeight}
                            fill="transparent"
                            onMouseEnter={() => setHoveredMonthIndex(i)}
                            onMouseLeave={() => setHoveredMonthIndex(null)}
                            className="cursor-crosshair"
                          />
                        )
                     })}
                 </svg>

                 {/* Tooltip */}
                 {hoveredMonthIndex !== null && (
                   <div 
                      className="absolute bg-white/95 border border-gray-200 shadow-lg rounded p-3 text-xs z-10 pointer-events-none"
                      style={{ 
                        left: `${(hoveredMonthIndex / (chartPoints.length - 1)) * 100}%`, 
                        top: '10%',
                        transform: 'translateX(-50%)',
                        minWidth: '180px'
                      }}
                   >
                      <div className="font-bold text-gray-800 border-b pb-1 mb-1 text-center">
                         Mes {chartPoints[hoveredMonthIndex].month} - {chartPoints[hoveredMonthIndex].monthName}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                         <div className="text-green-600">Ingresos:</div>
                         <div className="text-right font-medium">Q {chartPoints[hoveredMonthIndex].income.toLocaleString()}</div>
                         
                         <div className="text-orange-500">Gastos:</div>
                         <div className="text-right font-medium">Q {chartPoints[hoveredMonthIndex].expenses.toLocaleString()}</div>
                         
                         <div className="text-purple-600">SDN:</div>
                         <div className="text-right font-medium">Q {chartPoints[hoveredMonthIndex].sdn.toLocaleString()}</div>
                         
                         <div className="text-blue-600 font-bold border-t mt-1 pt-1">Flujo:</div>
                         <div className="text-right font-bold border-t mt-1 pt-1 text-blue-600">Q {chartPoints[hoveredMonthIndex].flow.toLocaleString()}</div>
                      </div>
                   </div>
                 )}

                 {/* Y Axis Labels */}
                 <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-[10px] text-gray-400 pointer-events-none text-right pr-1">
                     <span>{maxVal.toLocaleString()}</span>
                     <span>{(maxVal*0.5).toLocaleString()}</span>
                     <span>{minVal.toLocaleString()}</span>
                 </div>
             </div>
             
             {/* X Axis Labels */}
             <div className="flex justify-between text-[10px] text-gray-500 mt-2 px-1">
                {chartPoints.map((p, i) => (
                  /* Show label every 2 months to avoid crowding */
                  (i % 2 === 0 || i === chartPoints.length - 1) ? (
                    <div key={p.month} className="text-center w-8 -ml-4" style={{position: 'relative', left: `${(i / (chartPoints.length - 1)) * 100}%`}}>
                      {p.monthName.substring(0,3)}
                    </div>
                  ) : null
                ))}
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

export default SectionThree;
