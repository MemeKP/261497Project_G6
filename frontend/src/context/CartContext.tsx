import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  currentOrderId: number | null;
  createNewOrder: (sessionId: string) => Promise<number>;
  clearCurrentOrder: () => void;
  activeOrders: number[]; // เก็บ order ที่ยัง active อยู่
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [activeOrders, setActiveOrders] = useState<number[]>([]);

  // โหลด orders จาก localStorage เมื่อเริ่มต้น
  useEffect(() => {
    const savedOrderId = localStorage.getItem('currentOrderId');
    const savedActiveOrders = localStorage.getItem('activeOrders');
    
    if (savedOrderId) {
      setCurrentOrderId(Number(savedOrderId));
    }
    if (savedActiveOrders) {
      setActiveOrders(JSON.parse(savedActiveOrders));
    }
  }, []);

  // สร้าง order ใหม่
  const createNewOrder = async (sessionId: string): Promise<number> => {
    try {
      const response = await axios.post('/api/orders', {
        diningSessionId: sessionId,
        tableId: sessionId
      });
      
      const newOrderId = response.data.id;
      
      // อัพเดท state
      setCurrentOrderId(newOrderId);
      setActiveOrders(prev => [...prev, newOrderId]);
      
      // บันทึกลง localStorage
      localStorage.setItem('currentOrderId', newOrderId.toString());
      localStorage.setItem('activeOrders', JSON.stringify([...activeOrders, newOrderId]));
      
      // รีเซ็ต cart count
      setCartCount(0);
      
      return newOrderId;
    } catch (error) {
      console.error('Error creating new order:', error);
      throw error;
    }
  };

  // ล้าง order ปัจจุบัน (เมื่อจบ order)
  const clearCurrentOrder = () => {
    setCurrentOrderId(null);
    setCartCount(0);
    localStorage.removeItem('currentOrderId');
  };

  // ดึง cart count สำหรับ order ปัจจุบัน
  const fetchCartCount = async (orderId: number) => {
    if (!orderId) return;
    
    try {
      console.log('Fetching cart count for order:', orderId); 
      const response = await axios.get(`/api/order-items/count?orderId=${orderId}`);
       console.log('Cart count response:', response.data); 
       const count = Number(response.data.count);
    
      setCartCount(count);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  // อัพเดท cart count เมื่อ currentOrderId เปลี่ยน
  useEffect(() => {
    if (currentOrderId) {
      fetchCartCount(currentOrderId);
      
      // Polling ทุก 3 วินาที
      const interval = setInterval(() => fetchCartCount(currentOrderId), 3000);
      return () => clearInterval(interval);
    }
  }, [currentOrderId]);

  return (
    <CartContext.Provider value={{ 
      cartCount, 
      setCartCount, 
      currentOrderId, 
      createNewOrder,
      clearCurrentOrder,
      activeOrders
    }}>
      {children}
    </CartContext.Provider>
  );
};
 
export {CartContext}