import type { DPATermSeed } from './data/seedData';

export type DpaStatus = 'confirmed' | 'draft' | 'unclear';

/** A customer DPA as held in the register (Forge KVS key `dpa:{id}`). */
export interface DpaRecord
  extends Omit<DPATermSeed, 'expectedStatus' | 'isBuriedInDataTransfer'> {
  status: DpaStatus;
  confirmedAt?: string | null;
  confirmedBy?: string | null;
  /** Confluence page the terms were read from. */
  confluencePageId?: string | null;
  resolvedByCounsel?: boolean;
}

export type HostingRegion = 'EU_UK' | 'OUTSIDE_EU_UK' | 'UNKNOWN';
