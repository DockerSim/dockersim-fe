export interface Simulation {
  simulationPublicId: string;
  title: string;
  dockerState?: string; // JSON string
  shareStatus: 'READ' | 'WRITE' | 'PRIVATE';
  updatedAt: string; // ISO 8601 date string
  ownerNickname?: string;
  isOwner?: boolean;
}

export interface Collaborator {
  userPublicId: string;
  email: string;
  name: string;
  invitedAt: string; // ISO 8601 date string
  invitedPublicIdBy: string;
}
