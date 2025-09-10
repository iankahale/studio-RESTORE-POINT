
'use server';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getAdminById } from './data';
import type { AdminUser } from './types';

const secretKey = process.env.SESSION_SECRET || 'fallback-secret-for-development';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Session expires in 1 day
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    // This can happen if the token is invalid or expired
    console.error("JWT Decryption Error:", error);
    return null;
  }
}

export async function createSession(userId: string) {
  // Create the session
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const session = await encrypt({ userId, expires });

  // Save the session in a secure, http-only cookie
  cookies().set('session', session, { expires, httpOnly: true });
}

export async function deleteSession() {
  // Delete the session cookie
  cookies().set('session', '', { expires: new Date(0) });
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const sessionCookie = cookies().get('session')?.value;
  if (!sessionCookie) {
    console.log("No session cookie found.");
    return null;
  }

  const session = await decrypt(sessionCookie);
  if (!session?.userId) {
    console.log("Session cookie is invalid or does not contain a userId.");
    return null;
  }

  try {
    const user = await getAdminById(session.userId);
    if (!user) {
        console.log(`No user found with ID: ${session.userId}. Invalidating session.`);
        // If user is not in DB, invalidate the session
        await deleteSession();
        return null;
    }
    return user;
  } catch (error) {
    console.error("Failed to fetch current user from database:", error);
    return null;
  }
}
