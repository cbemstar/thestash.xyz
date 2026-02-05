import type { ReactNode } from "react";

export interface StepperProps {
  children?: ReactNode;
  initialStep?: number;
  onStepChange?: (newStep: number) => void;
  onFinalStepCompleted?: () => void;
  stepCircleContainerClassName?: string;
  stepContainerClassName?: string;
  contentClassName?: string;
  footerClassName?: string;
  backButtonProps?: object;
  nextButtonProps?: object;
  backButtonText?: string;
  nextButtonText?: string;
  lastStepButtonText?: string;
  disableStepIndicators?: boolean;
  renderStepIndicator?: (args: {
    step: number;
    currentStep: number;
    onStepClick: (clicked: number) => void;
  }) => ReactNode;
  fullHeight?: boolean;
}

declare const Stepper: React.FC<StepperProps>;
export default Stepper;

export function Step(props: { children?: ReactNode }): JSX.Element;
