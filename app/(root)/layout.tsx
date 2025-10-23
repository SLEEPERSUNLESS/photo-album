import { AuthProvider } from '../lib/AuthProvider';
import { CartProvider } from '../lib/CartProvider';

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <CartProvider>
        <div>
          <div>{children}</div>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}