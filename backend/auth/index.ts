import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export type AdminJwtPayload = {
    sub: string;
    role: 'admin';
    iat: number;
    exp: number;
};

export type AdminCookieOptions = {
    httpOnly: true;
    secure: boolean;
    sameSite: 'strict' | 'lax';
    path: '/';
    maxAge: number;
};

const AUTH_COOKIE_NAME = 'admin_access_token';
const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;
const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;

function base64UrlEncode(value: Buffer | string): string {
    return Buffer.from(value)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function base64UrlDecode(value: string): Buffer {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    return Buffer.from(padded, 'base64');
}

function safeEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);
    if (leftBuffer.length !== rightBuffer.length) return false;
    return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createScryptPasswordHash(password: string, salt = crypto.randomBytes(16).toString('base64url')): string {
    const hash = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: 32 * 1024 * 1024
    });

    return [
        'scrypt',
        String(SCRYPT_N),
        String(SCRYPT_R),
        String(SCRYPT_P),
        base64UrlEncode(salt),
        base64UrlEncode(hash)
    ].join('$');
}

export async function verifyPassword(password: string, storedHash: string | undefined | null): Promise<boolean> {
    if (!password || !storedHash) return false;

    const [algorithm, nRaw, rRaw, pRaw, saltRaw, expectedRaw] = storedHash.split('$');
    if (algorithm !== 'scrypt' || !nRaw || !rRaw || !pRaw || !saltRaw || !expectedRaw) return false;

    const n = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);
    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

    const salt = base64UrlDecode(saltRaw).toString();
    const actual = crypto.scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
        N: n,
        r,
        p,
        maxmem: 32 * 1024 * 1024
    });

    return safeEqual(base64UrlEncode(actual), expectedRaw);
}

function signJwtPart(unsignedToken: string, secret: string): string {
    return base64UrlEncode(crypto.createHmac('sha256', secret).update(unsignedToken).digest());
}

export function createAdminJwt(options: {
    username: string;
    secret: string;
    expiresInSeconds?: number;
    nowSeconds?: number;
}): string {
    const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
    const expiresInSeconds = options.expiresInSeconds ?? ACCESS_TOKEN_TTL_SECONDS;
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: AdminJwtPayload = {
        sub: options.username,
        role: 'admin',
        iat: nowSeconds,
        exp: nowSeconds + expiresInSeconds
    };

    const unsignedToken = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(payload))}`;
    return `${unsignedToken}.${signJwtPart(unsignedToken, options.secret)}`;
}

export function verifyAdminJwt(token: string | undefined | null, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): AdminJwtPayload | null {
    if (!token || !secret) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerRaw, payloadRaw, signature] = parts;
    const unsignedToken = `${headerRaw}.${payloadRaw}`;
    const expectedSignature = signJwtPart(unsignedToken, secret);
    if (!safeEqual(signature, expectedSignature)) return null;

    try {
        const header = JSON.parse(base64UrlDecode(headerRaw).toString('utf8'));
        if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;

        const payload = JSON.parse(base64UrlDecode(payloadRaw).toString('utf8')) as AdminJwtPayload;
        if (payload.role !== 'admin' || !payload.sub || !payload.exp || nowSeconds >= payload.exp) return null;
        return payload;
    } catch {
        return null;
    }
}

export function buildAdminCookieOptions(nodeEnv = process.env.NODE_ENV || 'development'): AdminCookieOptions {
    const isProduction = nodeEnv === 'production';
    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'strict' : 'lax',
        path: '/',
        maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000
    };
}

function getCookieValue(req: Request, name: string): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    for (const part of cookieHeader.split(';')) {
        const [rawName, ...rawValue] = part.trim().split('=');
        if (rawName === name) {
            return decodeURIComponent(rawValue.join('='));
        }
    }

    return null;
}

export function getAdminAuthConfig() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const username = process.env.ADMIN_USERNAME || (nodeEnv === 'production' ? '' : 'admin');
    const passwordHash = process.env.ADMIN_PASSWORD_HASH || '';
    const jwtSecret = process.env.JWT_ACCESS_SECRET || (nodeEnv === 'production' ? '' : 'local-development-jwt-secret-change-me');

    if (nodeEnv === 'production') {
        const missing = [
            ['ADMIN_USERNAME', username],
            ['ADMIN_PASSWORD_HASH', passwordHash],
            ['JWT_ACCESS_SECRET', jwtSecret]
        ].filter(([, value]) => !value).map(([key]) => key);

        if (missing.length > 0) {
            throw new Error(`Missing required admin auth environment variables: ${missing.join(', ')}`);
        }
    }

    return {
        nodeEnv,
        username,
        passwordHash,
        jwtSecret,
        cookieName: AUTH_COOKIE_NAME
    };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    const config = getAdminAuthConfig();
    const token = getCookieValue(req, config.cookieName);
    const payload = verifyAdminJwt(token, config.jwtSecret);

    if (!payload) {
        return res.status(401).json({ error: 'Admin authentication required' });
    }

    (req as any).admin = payload;
    return next();
}

export function registerAuthRoutes(app: { post: Function; get: Function }) {
    app.post('/api/auth/login', async (req: Request, res: Response) => {
        try {
            const config = getAdminAuthConfig();
            if (!config.passwordHash) {
                return res.status(503).json({ error: 'Admin login is not configured' });
            }

            const { username, password } = req.body || {};
            const validUsername = typeof username === 'string' && username === config.username;
            const validPassword = typeof password === 'string' && await verifyPassword(password, config.passwordHash);

            if (!validUsername || !validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = createAdminJwt({
                username: config.username,
                secret: config.jwtSecret
            });

            res.cookie(config.cookieName, token, buildAdminCookieOptions(config.nodeEnv));
            return res.json({ authenticated: true, role: 'admin' });
        } catch (err: any) {
            console.error('Admin login error:', err.message || err);
            return res.status(500).json({ error: 'Login failed' });
        }
    });

    app.post('/api/auth/logout', (_req: Request, res: Response) => {
        const config = getAdminAuthConfig();
        res.clearCookie(config.cookieName, {
            path: '/',
            sameSite: buildAdminCookieOptions(config.nodeEnv).sameSite,
            secure: buildAdminCookieOptions(config.nodeEnv).secure
        });
        return res.json({ authenticated: false });
    });

    app.get('/api/auth/me', (req: Request, res: Response) => {
        const config = getAdminAuthConfig();
        const token = getCookieValue(req, config.cookieName);
        const payload = verifyAdminJwt(token, config.jwtSecret);
        if (!payload) return res.status(401).json({ authenticated: false });
        return res.json({ authenticated: true, role: 'admin' });
    });
}
