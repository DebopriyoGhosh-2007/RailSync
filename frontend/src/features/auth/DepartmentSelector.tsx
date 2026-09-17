import React from 'react';
import { Department } from '@/auth/types';
import { DEPARTMENT_MAPPINGS } from '@/domain/departments';
import { Briefcase, Radio, Zap } from 'lucide-react';

const DEPT_ICONS: Record<Department, React.ElementType> = {
  "ENGINEERING": Briefcase,
  "SIGNAL_TELECOM": Radio,
  "TRACTION": Zap
};

interface DeptSelectorProps {
  value?: Department;
  onChange: (dept: Department) => void;
  error?: string;
}

export function DepartmentSelector({ value, onChange, error }: DeptSelectorProps) {
  const depts: Department[] = ["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"];
  
  return (
    <div className="w-full mb-6">
      <label className="block text-sm font-medium mb-3 text-slate-700">Department <span className="text-destructive">*</span></label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {depts.map(dept => {
          const config = DEPARTMENT_MAPPINGS[dept];
          const Icon = DEPT_ICONS[dept];
          const isSelected = value === dept;
          
          return (
            <button
              key={dept}
              type="button"
              onClick={() => onChange(dept)}
              className={`flex flex-col text-left p-4 rounded-xl border-2 transition-all ${
                isSelected 
                  ? 'bg-slate-50 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
              style={isSelected ? { borderColor: config.colorClass.replace('text-[', '').replace(']', '') } : {}}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isSelected ? 'text-white' : 'bg-slate-100 text-slate-500'}`}
                style={isSelected ? { backgroundColor: config.bgClass.replace('bg-[', '').replace(']', '') } : {}}
              >
                <Icon size={20} />
              </div>
              <h3 className={`font-semibold mb-1 ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{config.name}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{config.description}</p>
            </button>
          );
        })}
      </div>
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
    </div>
  );
}
