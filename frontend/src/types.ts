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

export interface MenuItemsProps {
  menu: MenuItem;
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

