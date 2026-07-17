import next from '@repo/eslint-config/next';

export default [...next, { ignores: ['.next/**', 'node_modules/**'] }];
