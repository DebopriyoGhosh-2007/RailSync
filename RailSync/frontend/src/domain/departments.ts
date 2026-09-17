import { Department } from '@/auth/types';

export const DEPARTMENT_MAPPINGS: Record<Department, {
  sourceSystem: string;
  name: string;
  description: string;
  colorClass: string;
  bgClass: string;
}> = {
  "ENGINEERING": {
    sourceSystem: "TMS",
    name: "Engineering",
    description: "Track management, civil works, and permanent way maintenance.",
    colorClass: "text-[#475569]",
    bgClass: "bg-[#475569]"
  },
  "SIGNAL_TELECOM": {
    sourceSystem: "SMMS",
    name: "Signal & Telecom",
    description: "Interlocking, signaling gear, and telecommunications infrastructure.",
    colorClass: "text-[#0d9488]",
    bgClass: "bg-[#0d9488]"
  },
  "TRACTION": {
    sourceSystem: "TDMS",
    name: "Traction",
    description: "Overhead equipment (OHE) and power distribution network.",
    colorClass: "text-[#8b5cf6]",
    bgClass: "bg-[#8b5cf6]"
  }
};

export const DESIGNATIONS = [
  "Section Engineer",
  "Junior Engineer",
  "Station Master",
  "Traffic Inspector",
  "Block Manager",
  "Divisional Engineer",
  "Other"
];
