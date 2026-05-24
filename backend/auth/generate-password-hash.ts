import { createScryptPasswordHash } from './index';

const password = process.argv[2];

if (!password) {
    console.error('Usage: npx ts-node auth/generate-password-hash.ts <admin-password>');
    process.exit(1);
}

console.log(createScryptPasswordHash(password));
