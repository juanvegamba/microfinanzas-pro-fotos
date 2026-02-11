
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, ClientData, ReviewData } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Header from './components/Header';
import Stepper from './components/Stepper';
import { ArrowRight, ArrowLeft, Save } from 'lucide-react';

// Import Sections
import SectionOne from './components/SectionOne';
import SectionTwo from './components/SectionTwo';
import SectionThree from './components/SectionThree';
import SectionFour from './components/SectionFour';
import SectionFive from './components/SectionFive';
import SectionSix from './components/SectionSix';
import SectionSeven from './components/SectionSeven';
import SectionEight from './components/SectionEight';
import SectionNine from './components/SectionNine';

// Initial Data Structure
const initialClientData: ClientData = {
  // Section 1
  officialName: '',
  branch: '',
  operationNumber: '',
  fullName: '',
  identityDocument: '',
  dateOfBirth: '',
  age: '',
  maritalStatus: '',
  dependents: '',
  spouseName: '',
  spouseOccupation: '',
  housingType: '',
  yearsInHousing: '',
  businessPremiseType: '',
  businessName: '',
  businessType: '',
  businessSectors: [],
  monthlyPaymentCapacity: '',
  homeAddress: '',
  businessAddress: '',
  locationType: '',
  gpsCoordinates: null,
  homeGps: null,
  businessGps: null,
  contactName: '',
  contactPhone: '',
  
  // Section 2
  businessOrigin: '',
  recentProfitsUse: '',
  reinvestedAmount: '',
  clientRisks: '',
  mitigationMeasures: '',
  businessOpportunities: '',
  diversificationScore: 0,
  profitabilityKnowledgeScore: 0,
  operationsManagementScore: 0,
  investmentPlanQualityScore: 1, // Min value is 1
  successionPlanningScore: 0,
  fixedAssetsValue: '',
  inventoryValue: '',
  yearCreated: '',
  yearFormalized: '',
  employeesFullTime: '',
  employeesPartTime: '',
  employeesFullTimeLastYear: '',
  employeesPartTimeLastYear: '',
  familyEmployees: '',
  salesGrowth: '',
  socialEnvGoals: '',
  businessObservations: '',
  yearsInBusiness: '',

  // Section 3
  loanAmount: '',
  loanDestination: '',
  loanDestinationDetail: '',
  loanTerm: '',
  loanInterestRate: '',
  loanPaymentMethod: '',
  loanCommission: '',
  loanCommissionFinancing: '',
  disbursementPlan: [],
  salesGood: { amount: '', period: '', frequency: '' },
  salesRegular: { amount: '', period: '', frequency: '' },
  salesBad: { amount: '', period: '', frequency: '' },
  lowSalesMonths: [],
  lowSalesReduction: '',
  highSalesMonths: [],
  highSalesIncrease: '',
  salesCreditPercentage: '',
  salesCreditTerm: '',
  costOfGoodsSold: '',
  expensesEmployees: '',
  expensesRent: '',
  expensesUtilities: '',
  expensesTransport: '',
  expensesMaintenance: '',
  otherBusinessExpenses: [],
  variableItems: [],
  familyIncome: '',
  familyFood: '',
  familyTransport: '',
  familyEducation: '',
  familyUtilities: '',
  familyComms: '',
  familyHealth: '',
  familyOther: '',
  plannedInvestment: '',
  existingDebts: [],
  capacityObservations: '',
  creditExperience: '',

  // Section 4
  inventory: [],
  suppliers: [],
  realEstateAssets: [],
  vehicleAssets: [],
  otherAssets: [],

  // Section 5
  realGuarantees: [],
  fiduciaryGuarantees: [],
  guaranteeType: '',
  guaranteeCoverage: '',

  // Section 6
  characterRefScore: 0, 
  characterPayHistoryScore: 0,
  characterInformalDebtsScore: 0,
  characterTransparencyScore: 0,  
  personalReferences: [],
  characterObservations: '',

  // Section 7
  documents: {
    identityCard: false,
    spouseIdentityCard: false,
    utilityBill: false,
    recentInvoices: false,
    salesNotebook: false,
    propertyTitle: false,
    taxId: false,
    otherDocumentsDesc: ''
  },
  photos: [],

  // Section 8
  supervision: {
    supervisorName: '',
    visitDate: '',
    visitTime: '',
    visitPlace: '',
    visitGps: null,
    salesEvolution: '',
    inventoryLevel: '',
    businessOwnership: '',
    willingnessToPay: '',
    guaranteeStatus: '',
    guaranteeComment: '',
    riskLevel: '',
    weeklySales: '',
    weeklyCosts: '',
    weeklyFamilyExpenses: '',
    loanUseCheck: '',
    investmentStatus: '',
    evidenceDescription: '',
    photos: [],
    conclusion: ''
  },

  // Section 9
  review: {
    debtReasonabilityAnalysis: '',
    sixCsAnalysis: '',
    officerRisks: '',
    officerOpportunities: '',
    officerMitigation: '',
    officerRecommendations: '',
    commentsOfficial: '',
    commentsAgencyManager: '',
    commentsSupervisor: '',
    committeeDecision: '',
    committeeComments: '',
    approvedAmount: '',
    approvedDestination: '',
    approvedPaymentMethod: '',
    approvedInterestRate: '',
    approvedTerm: '',
    approvedCommission: '',
    approvedGuaranteeDescription: '',
    approvedSpecialConditions: '',
    approverNames: '',
    approvalDate: '',
    reviewGps: null
  }
};

type ViewState = 'login' | 'dashboard' | 'form' | 'admin';

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const [currentView, setCurrentView] = useState<ViewState>('login');
  
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState<ClientData>(initialClientData);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isTabLocked, setTabLocked] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const docRef = doc(db, "usuarios", firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            if (profile.status === 'activo') {
              setUser(profile);
              setCurrentView('dashboard');
            } else {
              console.warn(`Access Denied: User ${firebaseUser.uid} is ${profile.status}`);
              setUser(null);
            }
          } else {
            console.log("Usuario autenticado pero sin perfil (posible registro en curso).");
            setUser(null);
          }
        } catch (error) {
          console.error("Error verificando perfil:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        setCurrentView('login');
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateClientData = <K extends keyof ClientData>(field: K, value: ClientData[K]) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateReviewData = (field: keyof ReviewData, value: any) => {
    setClientData(prev => ({
      ...prev,
      review: {
        ...prev.review,
        [field]: value
      }
    }));
  };

  const handleSave = async (silent = false) => {
    if (!user) {
        console.error("Save attempted without authenticated user");
        return;
    }

    try {
      let docId = activeDocId;

      if (!docId) {
        if (clientData.operationNumber && String(clientData.operationNumber).trim() !== '') {
           docId = String(clientData.operationNumber).trim();
        } else if (clientData.identityDocument && String(clientData.identityDocument).trim() !== '') {
           docId = String(clientData.identityDocument).trim();
        } else {
           docId = "borrador_" + Date.now();
        }
        docId = docId.replace(/\//g, '_');
      }

      const docRef = doc(db, "applications", docId!);
      
      const fullPayload = {
        ...clientData,
        userId: user.uid || auth.currentUser?.uid || "unknown_user",
        userRegion: user.region ?? 0, 
        userAgency: user.agencia ?? 0,
        lastModified: new Date().toISOString(),
        updatedBy: user.email,
        appVersion: "1.0.2-stable" 
      };

      const cleanPayload = JSON.parse(JSON.stringify(fullPayload));

      await setDoc(docRef, cleanPayload, { merge: true });
      
      setActiveDocId(docId);

      if (!silent) {
        if (isOnline) {
          alert(`Datos guardados correctamente en la nube.\nID: ${docId}`);
        } else {
          alert(`Datos guardados LOCALMENTE (Sin conexión).\nSe sincronizarán automáticamente al recuperar internet.\nID: ${docId}`);
        }
      }
    } catch (error: any) {
      console.error("Error saving document: ", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido de red o permisos";
      if (!silent) {
        alert(`Error al guardar: ${errorMessage}`);
      }
    }
  };

  const changeStep = async (newStep: number) => {
    if (isTabLocked) return;
    if (newStep === currentStep) return;
    
    await handleSave(true); 
    
    setCurrentStep(newStep);
    window.scrollTo(0, 0);
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  const handleCreateNew = () => {
    const officialName = user?.displayName || '';
    const agencyValue = user?.agencia != null ? String(user.agencia) : '';

    setClientData({
      ...initialClientData,
      officialName: officialName,
      branch: agencyValue
    });
    setActiveDocId(null);
    setCurrentStep(1);
    setCurrentView('form');
  };
  
  const handleLoadApplication = async (id: string) => {
      try {
        const docRef = doc(db, "applications", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const loadedData = docSnap.data();
            setClientData({ ...initialClientData, ...loadedData } as ClientData);
            setActiveDocId(id);
            setCurrentStep(1);
            setCurrentView('form');
        } else {
            alert("El documento solicitado no existe.");
        }
      } catch (e) {
          console.error("Error loading", e);
          if (!isOnline) {
            alert("No se pudo cargar la solicitud. Al estar sin conexión, solo puedes abrir solicitudes que hayas abierto recientemente.");
          }
      }
  };

  const renderFormSection = () => {
    switch (currentStep) {
      case 1: return <SectionOne data={clientData} updateData={updateClientData} />;
      case 2: return <SectionTwo data={clientData} updateData={updateClientData} />;
      case 3: return <SectionThree data={clientData} updateData={updateClientData} />;
      case 4: return <SectionFour data={clientData} updateData={updateClientData} />;
      case 5: return <SectionFive data={clientData} updateData={updateClientData} />;
      case 6: return <SectionSix data={clientData} updateData={updateClientData} />;
      case 7: return <SectionSeven data={clientData} updateData={updateClientData} setTabLocked={setTabLocked} activeDocId={activeDocId} />;
      case 8: return <SectionEight data={clientData} updateData={updateClientData} setTabLocked={setTabLocked} activeDocId={activeDocId} />;
      case 9: return <SectionNine data={clientData} updateData={updateClientData} />;
      default: return <div>Sección no encontrada</div>;
    }
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando sistema...</div>;
  }

  if (!user || currentView === 'login') {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">
      <Header 
        user={user}
        onLogout={handleLogout}
        onSave={currentView === 'form' ? () => handleSave(false) : undefined}
        onBack={currentView === 'form' || currentView === 'admin' ? () => setCurrentView('dashboard') : undefined}
        title={currentView === 'admin' ? 'Admin Panel' : 'MicroFinanzas Pro'}
        isOnline={isOnline}
      />
      
      <main className="flex-grow">
        {currentView === 'dashboard' && (
          <>
            <Dashboard 
               user={user} 
               onCreateNew={handleCreateNew} 
               onSelectApplication={handleLoadApplication}
            />
            {user.rol === 'admin' && (
                <div className="max-w-6xl mx-auto px-6 pb-10">
                    <button 
                      onClick={() => setCurrentView('admin')}
                      className="text-blue-600 underline text-sm"
                    >
                        Ir a Administración de Usuarios
                    </button>
                </div>
            )}
          </>
        )}

        {currentView === 'admin' && user.rol === 'admin' && (
           <AdminPanel />
        )}

        {currentView === 'form' && (
          <>
            <Stepper currentStep={currentStep} onStepClick={changeStep} isTabLocked={isTabLocked} />
            <div className="pb-24">
              {renderFormSection()}
              
              {currentStep < 9 && (
                <div className="max-w-5xl mx-auto px-6 mt-8">
                  <div className="flex justify-between gap-4 pt-6 border-t border-gray-300">
                    <button 
                      onClick={() => changeStep(currentStep - 1)}
                      disabled={currentStep === 1 || isTabLocked}
                      className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors shadow-sm ${currentStep === 1 || isTabLocked
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Anterior
                    </button>
                    
                    <button 
                        onClick={() => changeStep(currentStep + 1)}
                        disabled={isTabLocked}
                        className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors shadow-sm ${isTabLocked ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-brand-primary hover:bg-blue-800 text-white'
                        }`}
                      >
                        Siguiente
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
