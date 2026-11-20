import { syncContractsToGraph } from '../graph/contractGraph';
import { publishRegisterMirror } from './mirror';

/** Everything that must follow a change to the register: refresh the shared copy and the Teamwork Graph. */
export async function afterRegisterChange(): Promise<void> {
  await Promise.all([
    syncContractsToGraph().catch((e) => console.warn('Teamwork Graph sync:', e?.message)),
    publishRegisterMirror().catch((e) => console.warn('Register mirror:', e?.message)),
  ]);
}
