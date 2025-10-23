// components/SessionLayout.tsx
import { useParams } from 'react-router-dom';
import { CartProvider } from '../context/CartContext';

export const SessionLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { sessionId } = useParams<{ sessionId: string }>();
    console.log('🔍 SessionLayout - sessionId:', sessionId); 
  return (
    <CartProvider sessionId={sessionId}>
      {children}
    </CartProvider>
  );
};