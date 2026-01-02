
import { LucideIcon } from "lucide-react";

export type ViewState = 'dashboard' | 'crm' | 'tasks' | 'goals' | 'reports' | 'settings';

export interface NavItem {
  id: ViewState;
  label: string;
  icon: LucideIcon;
}

export interface User {
  name: string;
  email: string;
}

export interface Financials {
  salary: number;
  expenses: number;
}

export interface DatabaseSchema {
  users: {
    [email: string]: {
      password: string; // In a real app, never store plain text passwords!
      user: User;
      data: AppData;
    }
  };
  lastUserEmail?: string; // For session persistence
}

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  category: 'Trabalho' | 'Academia' | 'Lembrete';
}

export interface Lead {
  id: string;
  name: string;
  company: string; // Pode ser usado como "Serviço Contratado"
  status: 'Potencial' | 'Negociacao' | 'Ativo' | 'Arquivado';
  value: number; // Valor da Mensalidade
  lastContact: string;
  phone?: string;
  notes?: string;
  payments?: { [yearMonth: string]: 'Paid' | 'Pending' }; // Ex: "2023-12": "Paid"
}

export interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  deadline: string;
  unit: string; // e.g., 'livros', 'km', 'sessões'
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

export interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  isPositive?: boolean;
  icon: LucideIcon;
}

export interface FeatureCardProps {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  ctaText: string;
  gradient: string;
}

export interface AppData {
  tasks: Task[];
  leads: Lead[];
  goals: Goal[];
  financials: Financials;
}