'use server';

import * as z from 'zod';
import { getAdminByEmail } from '@/lib/data';
import { createSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function login(values: z.infer<typeof loginSchema>) {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const { email, password } = validatedFields.data;

  const existingUser = await getAdminByEmail(email);

  if (!existingUser || !existingUser.password || existingUser.email !== email) {
    return { error: 'Invalid credentials!' };
  }
  
  if (existingUser.password !== password) {
      return { error: 'Invalid credentials!'};
  }

  if (existingUser.role !== 'Admin') {
      return { error: 'Your account has not been approved by an administrator yet.' };
  }

  await createSession(existingUser.id);

  // Redirect after session is created
  redirect('/admin');
}
