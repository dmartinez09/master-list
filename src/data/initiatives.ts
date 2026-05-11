import type { Iniciativa } from '../types';
import rawData from './initiatives_raw.json';
import { mapToFramework } from '../utils/framework';

export const initiatives: Iniciativa[] = (rawData as Iniciativa[])
  .filter((r) => r.id && r.id.startsWith('ID-'))
  .map((r) => ({ ...r, frameworkDimension: mapToFramework(r) }));

export default initiatives;
