
import React from 'react';
import { ClientData } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface SectionTenProps {
  data: ClientData;
  onDecision: (decision: 'Aprobado' | 'Rechazado') => void;
}

const SectionTen: React.FC<SectionTenProps> = ({ data, onDecision }) => {
  const toNumber = (value: number | string | undefined | null) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value.trim() !== '') return parseFloat(value);
    return 0;
  };

  const calculateTotalByField = (items: any[] = [], field: string) =>
    items.reduce((acc, item) => acc + toNumber(item[field]), 0);

  // Financial Calculations
  const totalAssets = 
    toNumber(data.fixedAssetsValue) +
    toNumber(data.inventoryValue) +
    calculateTotalByField(data.realEstateAssets, 'estimatedValue') +
    calculateTotalByField(data.vehicleAssets, 'estimatedValue') +
    calculateTotalByField(data.otherAssets, 'estimatedValue');

  const totalLiabilities = calculateTotalByField(data.existingDebts, 'currentBalance');
  const netWorth = totalAssets - totalLiabilities;
  const newDebt = toNumber(data.loanAmount);

  const balanceData = [
    { name: 'Activos', value: totalAssets, fill: '#3b82f6' },
    { name: 'Pasivos', value: totalLiabilities, fill: '#f59e0b' },
    { name: 'Patrimonio', value: netWorth, fill: '#10b981' },
    { name: 'Nueva Deuda', value: newDebt, fill: '#ef4444' },
  ];
  
  const totalSales = toNumber(data.salesGood?.amount) + toNumber(data.salesRegular?.amount) + toNumber(data.salesBad?.amount);
  const costOfGoodsSold = toNumber(data.costOfGoodsSold);
  const grossProfit = totalSales - costOfGoodsSold;
  const totalOpEx =
    toNumber(data.expensesEmployees) +
    toNumber(data.expensesRent) +
    toNumber(data.expensesUtilities) +
    toNumber(data.expensesTransport) +
    toNumber(data.expensesMaintenance) +
    calculateTotalByField(data.otherBusinessExpenses, 'amount');
  const netProfit = grossProfit - totalOpEx;
  const totalFamilyIncome = toNumber(data.familyIncome);
  const totalFamilyExpenses =
    toNumber(data.familyFood) +
    toNumber(data.familyTransport) +
    toNumber(data.familyEducation) +
    toNumber(data.familyUtilities) +
    toNumber(data.familyComms) +
    toNumber(data.familyHealth) +
    toNumber(data.familyOther);

  const surplus = (netProfit + totalFamilyIncome) - totalFamilyExpenses;
  const existingDebtPayment = calculateTotalByField(data.existingDebts, 'monthlyQuota');
  const proposedQuota = toNumber(data.loanTerm) > 0 ? newDebt / toNumber(data.loanTerm) : 0;
  const paymentCapacity = surplus > 0 ? surplus - existingDebtPayment : 0;
  const coverageRatio = proposedQuota > 0 ? (paymentCapacity / proposedQuota).toFixed(2) + 'x' : 'N/A';

  const sixCsData = [
    { subject: 'Carácter', value: data.characterRefScore, fullMark: 5 },
    { subject: 'Capacidad', value: data.investmentPlanQualityScore, fullMark: 5 },
    { subject: 'Capital', value: data.operationsManagementScore, fullMark: 5 },
    { subject: 'Colateral', value: toNumber(data.guaranteeCoverage) > 0 ? Math.min(toNumber(data.guaranteeCoverage) / 100, 5) : 0, fullMark: 5 },
    { subject: 'Condiciones', value: data.profitabilityKnowledgeScore, fullMark: 5 },
    { subject: 'Confianza', value: data.characterTransparencyScore, fullMark: 5 },
  ];

  const renderInfoCard = (title: string, value: string | number, subtitle: string = '') => (
    <div className="bg-white p-3 rounded-lg shadow-sm text-center border border-gray-200">
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      <p className="text-xl font-bold text-gray-800">{typeof value === 'number' ? `Q ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );

  const formatCurrency = (value: any) => `Q ${toNumber(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Sección 10. Resumen Ejecutivo</h1>

      <div className="mb-8 p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">1. Resumen de Datos Generales</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><p className="font-medium text-gray-500">Nombre:</p><p>{data.fullName}</p></div>
          <div><p className="font-medium text-gray-500">Asesor:</p><p>{data.officialName}</p></div>
          <div><p className="font-medium text-gray-500">Sucursal:</p><p>{data.branch}</p></div>
          <div><p className="font-medium text-gray-500">No. Préstamo:</p><p>{data.operationNumber}</p></div>
          <div><p className="font-medium text-gray-500">Monto Solicitado:</p><p>Q {newDebt.toLocaleString()}</p></div>
          <div><p className="font-medium text-gray-500">Plazo:</p><p>{data.loanTerm} meses</p></div>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
         {/* Supervision Section */}
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">2. Supervisión</h2>
          <div className="text-sm space-y-2">
            <p><span className="font-medium text-gray-500">Supervisor:</span> {data.supervision?.supervisorName || 'N/A'}</p>
            <p><span className="font-medium text-gray-500">Fecha:</span> {data.supervision?.visitDate ? new Date(data.supervision.visitDate).toLocaleDateString() : 'N/A'}</p>
            <p><span className="font-medium text-gray-500">Riesgo:</span> {data.supervision?.riskLevel || 'N/A'}</p>
            <p><span className="font-medium text-gray-500">Conclusión:</span> {data.supervision?.conclusion || 'Sin conclusión.'}</p>
             <div className="mt-4 pt-4 border-t">
                <p className="font-medium text-gray-500">Validación Cruce Info:</p>
                <p>Ingresos Est: {formatCurrency(toNumber(data.supervision?.weeklySales) * 4)}</p>
                <p>Coherente: {data.supervision?.crossInfoValidation || 'N/A'}</p>
             </div>
          </div>
        </div>

        {/* Financial Balance Section */}
        <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">3. Balance Financiero</h2>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <div className="space-y-1">
                    <p className="font-medium">ACTIVOS:</p>
                    <p className="font-medium">PASIVOS:</p>
                    <p className="font-medium text-green-600">PATRIMONIO:</p>
                    <p className="font-medium text-red-600">NUEVA DEUDA:</p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="font-bold">{formatCurrency(totalAssets)}</p>
                    <p className="font-bold">{formatCurrency(totalLiabilities)}</p>
                    <p className="font-bold text-green-600">{formatCurrency(netWorth)}</p>
                    <p className="font-bold text-red-600">{formatCurrency(newDebt)}</p>
                </div>
            </div>
            <div className="mt-4" style={{ height: '150px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={balanceData.filter(item => ['Activos', 'Pasivos', 'Nueva Deuda'].includes(item.name))} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" hide />
                        <Tooltip formatter={(value:any) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="#8884d8" background={{ fill: '#eee' }} isAnimationActive={false} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>


      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">4. Las 6 C's del Crédito</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sixCsData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 5]} />
              <Radar name="Evaluación" dataKey="value" stroke="#3b82f6" fill="#60a5fa" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">5. Análisis de Capacidad de Pago</h2>
          <div className="grid grid-cols-2 gap-4 mt-4">
            {renderInfoCard("Ventas Totales", totalSales)}
            {renderInfoCard("Utilidad Bruta", grossProfit)}
            {renderInfoCard("Utilidad Neta", netProfit)}
            {renderInfoCard("Excedente Familiar", surplus)}
            {renderInfoCard("Cuota Propuesta", proposedQuota, "aprox.")}
            {renderInfoCard("Cobertura de Cuota", coverageRatio, "(Capacidad / Cuota)")}
            <div className="col-span-2 bg-blue-100 p-4 rounded-lg shadow-inner text-center">
              <p className="text-md font-medium text-blue-800">Capacidad de Pago Mensual</p>
              <p className="text-4xl font-bold text-blue-900 mt-2">{formatCurrency(paymentCapacity)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">6. Análisis con Inteligencia Artificial</h2>
        <div className="grid md:grid-cols-2 gap-8 text-sm text-gray-600 prose prose-sm max-w-none">
            <div>
                <strong className="font-medium text-gray-800 text-base">Análisis de Razonabilidad del Endeudamiento (IA):</strong>
                <p className="mt-2 whitespace-pre-wrap">{data.review?.debtReasonabilityAnalysis || "Análisis no generado."}</p>
            </div>
            <div>
                <strong className="font-medium text-gray-800 text-base">Dictamen Final de las 6 C's (IA):</strong>
                <p className="mt-2 whitespace-pre-wrap">{data.review?.sixCsAnalysis || "Análisis no generado."}</p>
            </div>
        </div>
         <div className="mt-4 pt-4 border-t">
              <strong className="font-medium text-gray-800 text-base">Recomendaciones del Asesor:</strong>
              <p>{data.review?.officerRecommendations}</p>
          </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 border-b pb-2">7. Resolución del Comité de Crédito</h2>
        {data.review?.committeeDecision ? (
          <div>
            <div className='flex justify-between items-start mb-4'>
                <div>
                    <p className="font-medium text-gray-500">Decisión del Comité</p>
                    <p className={`text-2xl font-bold ${data.review.committeeDecision === 'Aprobado' || data.review.committeeDecision === 'Aprobado con modificaciones' ? 'text-green-600' : 'text-red-600'}`}>
                        {data.review.committeeDecision.toUpperCase()}
                    </p>
                </div>
                <div>
                     <p className="font-medium text-gray-500">Fecha de Aprobación</p>
                     <p className='text-lg font-semibold'>{data.review.approvalDate ? new Date(data.review.approvalDate).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>

            {(data.review.committeeDecision === 'Aprobado' || data.review.committeeDecision === 'Aprobado con modificaciones') && (
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div>
                        <p className="font-medium text-gray-500">Monto Aprobado (Q)</p>
                        <p className="font-semibold">{formatCurrency(data.review.approvedAmount)}</p>
                    </div>
                     <div>
                        <p className="font-medium text-gray-500">Tasa (%)</p>
                        <p className="font-semibold">{toNumber(data.review.approvedInterestRate)}%</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-500">Plazo (meses)</p>
                        <p className="font-semibold">{data.review.approvedTerm} meses</p>
                    </div>
                     <div>
                        <p className="font-medium text-gray-500">Comisión (%)</p>
                        <p className="font-semibold">{toNumber(data.review.approvedCommission)}%</p>
                    </div>
                    <div>
                        <p className="font-medium text-gray-500">Forma de Pago</p>
                        <p className="font-semibold">{data.review.approvedPaymentMethod}</p>
                    </div>
                     <div>
                        <p className="font-medium text-gray-500">Destino</p>
                        <p className="font-semibold">{data.review.approvedDestination}</p>
                    </div>
                    <div className="col-span-full">
                        <p className="font-medium text-gray-500">Garantía y Cobertura</p>
                        <p className="font-semibold whitespace-pre-wrap">{data.review.approvedGuaranteeDescription}</p>
                    </div>
                    <div className="col-span-full">
                        <p className="font-medium text-gray-500">Condiciones Especiales / Comentarios</p>
                        <p className="font-semibold whitespace-pre-wrap">{data.review.approvedSpecialConditions || data.review.committeeComments}</p>
                    </div>
                     <div className="col-span-full">
                        <p className="font-medium text-gray-500">Nombres y Cargos de Aprobadores</p>
                        <p className="font-semibold whitespace-pre-wrap">{data.review.approverNames}</p>
                    </div>
                </div>
            )}
             {data.review.committeeDecision === 'Rechazado' && (
                  <div className="mt-4 pt-4 border-t">
                     <p className="font-medium text-gray-500">Comentarios del Comité</p>
                     <p className="font-semibold whitespace-pre-wrap">{data.review.committeeComments}</p>
                  </div>
             )}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p className="font-medium">Pendiente de Resolución</p>
            <p className="text-sm">Utilice los botones a continuación para registrar la decisión del comité.</p>
          </div>
        )}
      </div>

      <div className="mt-10 flex justify-center gap-6">
        <button onClick={() => onDecision('Rechazado')} className="px-8 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
          Rechazado
        </button>
        <button onClick={() => onDecision('Aprobado')} className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          Aprobado
        </button>
        <button className="px-8 py-3 bg-gray-700 text-white font-semibold rounded-lg shadow-md hover:bg-gray-800 transition-colors">
          Exportar a PDF
        </button>
      </div>

    </div>
  );
};

export default SectionTen;
