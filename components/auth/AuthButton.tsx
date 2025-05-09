import { getSession } from '@/utils/supabase/server';
import LoginButton from './LoginButton';
import LogoutButton from './LogoutButton';

export default async function AuthButton() {
  const session = await getSession();

  return session ? <LogoutButton /> : <LoginButton />;
}
