
import React from 'react';

interface StepperProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  isTabLocked?: boolean;
}

const steps = [
  "Datos",
  "Empresa",
  "Capacidad",
  "Inventario",
  "Garantías",
  "Carácter",
  "Fotos",
  "Supervisión",
  "Revisión",
  "Resumen"
];

const Stepper: React.FC<StepperProps> = ({ currentStep, onStepClick, isTabLocked }) => {
  return (
    <div className={`bg-white border-b border-gray-200 shadow-sm sticky top-16 z-40 overflow-x-auto hide-scrollbar ${isTabLocked ? 'cursor-not-allowed' : ''}`}>
      <div className="flex min-w-max px-4">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <button
              key={step}
              onClick={() => onStepClick(stepNumber)}
              disabled={isTabLocked}
              className={`flex items-center px-5 py-4 text-sm font-medium border-b-2 transition-all outline-none focus:outline-none ${
                isActive
                  ? 'border-brand-primary text-brand-primary bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${isTabLocked ? 'pointer-events-none opacity-50' : ''}`}
            >
              <span className={`flex items-center justify-center w-5 h-5 rounded-full text-xs mr-2 ${
                isActive ? 'bg-brand-primary text-white' : 
                isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
              }`}>
                {stepNumber}
              </span>
              {step}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
