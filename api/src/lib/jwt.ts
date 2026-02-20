import { SignJWT, jwtVerify } from 'jose';

const JWT_ACCESS_EXPIRATION = '15m';
const JWT_REFRESH_EXPIRATION = '7d';

export async function signAccessToken(payload: any, secret: string) {
    const secretKey = new TextEncoder().encode(secret);
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_ACCESS_EXPIRATION)
        .sign(secretKey);
}

export async function signRefreshToken(payload: any, secret: string) {
    const secretKey = new TextEncoder().encode(secret);
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(JWT_REFRESH_EXPIRATION)
        .sign(secretKey);
}

export async function verifyToken(token: string, secret: string) {
    const secretKey = new TextEncoder().encode(secret);
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch (error: any) {
        console.error('JWT Verify Error:', error.message);
        return null;
    }
}


