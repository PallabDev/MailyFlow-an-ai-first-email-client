import { toNextJsHandler } from 'corsair';
import { corsair } from '@/utils/corsair';

export const { GET, POST } = toNextJsHandler(corsair, {
  basePath: '/api/corsair',
});
