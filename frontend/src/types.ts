export interface Member {
  id: string;
  name: string;
  groupId?: string;          
  diningSessionId?: string;  // หรือผูกกับ session   
}

export interface Group {
  id: number;
  tableId: number;
  members: Member[];
}

export interface SessionResponse {
  session: any; 
  group: Group | null;
}
