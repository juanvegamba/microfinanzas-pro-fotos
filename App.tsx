
import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile, ClientData } from './types';
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
import SectionTen from './components/SectionTen';

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
    approvedAmount: '',
    approvedDestination: '',
    approvedPaymentMethod: '',
    approvedInterestRate: '',
    approvedTerm: '',
    approvedCommission: '',
    approvedGuaranteeDescription: '',
    approvedSpecialConditions: '',
    approverNames: '',
    approvalDate: ''
  }
};

type ViewState = 'login' | 'dashboard' | 'form' | 'admin';

function App() {
  // Auth State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>('login');
  
  // Form State
  const [currentStep, setCurrentStep] = useState(1);
  const [clientData, setClientData] = useState<ClientData>(initialClientData);
  // CRITICAL FIX: Anchor the ID so updates don't create duplicate documents if operationNumber changes
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Connectivity State
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
        // Fetch Extended User Profile
        const docRef = doc(db, "usuarios", firebaseUser.uid);
        try {
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            // Security check: Access Control Layer
            if (profile.status === 'activo') {
              setUser(profile);
              setCurrentView('dashboard');
            } else {
              // User exists but is not active. Deny access.
              console.warn(`Access Denied: User ${firebaseUser.uid} is ${profile.status}`);
              setUser(null);
            }
          } else {
            // Document missing. Potential race condition or registration incomplete.
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

  // QA IMPROVEMENT: Generic type safety ensures 'field' exists in ClientData and 'value' matches the type of that field.
  const updateClientData = <K extends keyof ClientData>(field: K, value: ClientData[K]) => {
    setClientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async (silent = false) => {
    if (!user) {
        console.error("Save attempted without authenticated user");
        return;
    }

    try {
      // 1. Generate Document ID Strategy (Stabilized)
      // If we already have an activeDocId (loaded or previously saved), use it.
      // Otherwise, generate one from operationNumber/identity/timestamp.
      let docId = activeDocId;

      if (!docId) {
        // First save logic
        if (clientData.operationNumber && String(clientData.operationNumber).trim() !== '') {
           docId = String(clientData.operationNumber).trim();
        } else if (clientData.identityDocument && String(clientData.identityDocument).trim() !== '') {
           docId = String(clientData.identityDocument).trim();
        } else {
           docId = "borrador_" + Date.now();
        }
        // Sanitization
        docId = docId.replace(/\//g, '_');
      }

      const docRef = doc(db, "applications", docId!);
      
      // 2. Construct the Full Payload (Data + Metadata)
      const fullPayload = {
        ...clientData,
        userId: user.uid || auth.currentUser?.uid || "unknown_user",
        userRegion: user.region ?? 0, 
        userAgency: user.agencia ?? 0,
        lastModified: new Date().toISOString(),
        // Audit Trail
        updatedBy: user.email,
        appVersion: "1.0.2-stable" 
      };

      // 3. Deep Sanitization
      const cleanPayload = JSON.parse(JSON.stringify(fullPayload));

      // 4. Save to Firestore
      await setDoc(docRef, cleanPayload, { merge: true });
      
      // 5. Update State anchor
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
    if (newStep === currentStep) return;
    
    // Auto-save before changing step (Cumulative Save)
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
    // Auto-fill Official Details from Logged User
    const officialName = user?.displayName || '';
    const agencyValue = user?.agencia != null ? String(user.agencia) : '';

    setClientData({
      ...initialClientData,
      officialName: officialName,
      branch: agencyValue
    });
    // Reset ID anchor for new document
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
            // ANCHOR THE ID: Critical to prevent duplication on edit
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
      case 7: return <SectionSeven data={clientData} updateData={updateClientData} />;
      case 8: return <SectionEight data={clientData} updateData={updateClientData} />;
      case 9: return <SectionNine data={clientData} updateData={updateClientData} />;
      case 10: return <SectionTen data={clientData} />;
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
      {/* Header is contextual based on view */}
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
            <Stepper currentStep={currentStep} onStepClick={changeStep} />
            <div className="pb-24">
              {renderFormSection()}
              
              {/* Navigation Buttons */}
              <div className="max-w-5xl mx-auto px-6 mt-8">
                <div className="flex justify-between gap-4 pt-6 border-t border-gray-300">
                  <button 
                    onClick={() => changeStep(currentStep - 1)}
                    disabled={currentStep === 1}
                    className={`flex items-center px-6 py-3 rounded-md font-medium transition-colors shadow-sm ${
                      currentStep === 1 
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                    }`}
                  >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Anterior
                  </button>
                  
                  {currentStep < 10 ? (
                    <button 
                      onClick={() => changeStep(currentStep + 1)}
                      className="flex items-center px-6 py-3 bg-brand-primary hover:bg-blue-800 text-white rounded-md font-medium transition-colors shadow-sm"
                    >
                      Siguiente
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSave(false)}
                      className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors shadow-sm"
                    >
                      <Save className="w-5 h-5 mr-2" />
                      Guardar Final
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
