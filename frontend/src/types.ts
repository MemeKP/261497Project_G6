export interface Member {
  id: string;
  name: string;
  groupId?: string;         
  diningSessionId?: string; //session?
}

export interface Group {
  id: number;
  tableId: number;
  members: Member[];
}

export interface SessionResponse {
  session: Session;
  tableId: number;
  group: Group | null;
}

export interface Session {
  id: number;
  tableId: number;
  startedAt: string;     
  endedAt: string | null;
  qrCode: string;         
  status: string;
  totalCustomers: number;
  createdAt: string;
  durationMinutes: number | null;
}

export interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  category: string;
  isSignature: boolean | null;
  isAvailable: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface MenuResponse {
  success: boolean;
  data: MenuItem[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MenuItemsProps {
  menu: MenuItem;
}

export interface MenuFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem?: MenuItem | null;
  mode: 'create' | 'edit';
}

export interface IKImageWrapperProps {
  src: string | null | undefined;
  className?: string;
  width?: number | string;
  height?: number | string;
  alt: string;
  transformation?: Array<{
    width?: number | string;
    height?: number | string;
    quality?: number;
    format?: string;
    crop?: string;
    focus?: string;
  }>;
  lqipQuality?: number;
  showPlaceholder?: boolean;
  placeholderClassName?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export interface Table {
  id: number;
  number: number;
  status: string;
}

export interface PaymentData {
  date: string;
  thisMonth: number;
  lastMonth: number;
}

export interface PaymentGraphProps {
  data?: PaymentData[];
  period?: 'week' | 'month' | 'year';
  onPeriodChange?: (period: 'week' | 'month' | 'year') => void;
}

export interface ActiveSession {
  id: number;
  tableId: number;
  startedAt: string;
  status: string;
  totalCustomers: number;
  createdAt: string;
  group: {
    id: number;
    members: { id: number; name: string; note: string | null }[];
  } | null;
}

export interface ActiveSessionGroup {
  activeSessions: ActiveSession[];
  totalActiveTables: number;
}

export interface Order {
  id: number;
  table_id: number;
  group_id: number | null;
  user_id: number | null;
  dining_session_id: number;
  status: "PENDING" | "PREPARING" | "COMPLETED" | "SERVED" | string;
  created_at: string;
  totalPrice?: number;
  key: string;
}

export interface CartItem {
  id: number;
  menuId: number;
  name: string;
  price: number;
  qty: number;
  note?: string;
  imageUrl?: string;
  memberName?: string;
}

