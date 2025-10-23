import { AuthProvider } from '../lib/AuthProvider';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div>
        <div>{children}</div>
      </div>
    </AuthProvider>
  );
}