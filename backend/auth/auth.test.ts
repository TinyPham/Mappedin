import assert from 'node:assert/strict';
import {
    buildAdminCookieOptions,
    createAdminJwt,
    createScryptPasswordHash,
    verifyAdminJwt,
    verifyPassword
} from './index';

async function run() {
    const passwordHash = createScryptPasswordHash('correct-password', 'fixed-test-salt');
    assert.equal(await verifyPassword('correct-password', passwordHash), true);
    assert.equal(await verifyPassword('wrong-password', passwordHash), false);

    const token = createAdminJwt({
        username: 'admin',
        secret: 'test-secret-with-enough-length',
        expiresInSeconds: 60,
        nowSeconds: 1_700_000_000
    });

    const payload = verifyAdminJwt(token, 'test-secret-with-enough-length', 1_700_000_010);
    assert.deepEqual(payload, {
        sub: 'admin',
        role: 'admin',
        iat: 1_700_000_000,
        exp: 1_700_000_060
    });

    assert.equal(verifyAdminJwt(`${token.slice(0, -1)}x`, 'test-secret-with-enough-length', 1_700_000_010), null);
    assert.equal(verifyAdminJwt(token, 'test-secret-with-enough-length', 1_700_000_061), null);

    assert.deepEqual(buildAdminCookieOptions('production'), {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/',
        maxAge: 3600000
    });

    assert.deepEqual(buildAdminCookieOptions('development'), {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
        maxAge: 3600000
    });
}

run()
    .then(() => console.log('auth tests passed'))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
