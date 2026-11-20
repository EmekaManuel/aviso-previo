import { kvs } from '@forge/kvs';
import type { DpaRecord } from '../types';
import type { ApprovedVendor } from '../classification/ticketClassifier';

export interface VendorRecord extends ApprovedVendor {
  key: string;
  publishedDate?: string;
}

/** All customer DPAs in the register (Forge KVS). */
export async function loadRegister(): Promise<DpaRecord[]> {
  const ids = ((await kvs.get('dpas:list')) as string[] | undefined) ?? [];
  const records = await Promise.all(ids.map((id) => kvs.get(`dpa:${id}`) as Promise<DpaRecord | undefined>));
  return records.filter((r): r is DpaRecord => Boolean(r));
}

export async function loadVendors(): Promise<VendorRecord[]> {
  const keys = ((await kvs.get('vendors:list')) as string[] | undefined) ?? [];
  const records = await Promise.all(keys.map((k) => kvs.get(`vendor:${k}`) as Promise<VendorRecord | undefined>));
  return records.filter((r): r is VendorRecord => Boolean(r));
}

export async function saveDpa(record: DpaRecord): Promise<void> {
  await kvs.set(`dpa:${record.id}`, record);
}
