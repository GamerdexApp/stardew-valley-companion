import type { ReactNode } from "react";
import { Playthrough } from "@/types/app";

export interface CreatePlaythroughModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface EditStepProgressProps {
  steps: string[];
  currentStep: number;
  onStepClick: (index: number) => void;
}

export interface EditStep {
  label: string;
  content: ReactNode;
}

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  steps: EditStep[];
  onSave: (stepIndex: number) => void | Promise<void>;
}
