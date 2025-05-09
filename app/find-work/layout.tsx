import AuthGuard from '@/components/AuthGuard';

export default function FindWorkLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
