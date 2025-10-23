import React, { createContext, useState, useEffect, } from 'react';
import axios from 'axios';

interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  currentOrderId: number | null;
  createNewOrder: (sessionId: string) => Promise<number>;
  clearCurrentOrder: () => void;
  activeOrders: number[];
  addToCart: (menuItemId: number, memberId: number, quantity?: number, note?: string) => Promise<void>;
  checkoutOrder: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
  sessionId?: string; // รับ sessionId ผ่าน props แทน
}

export const CartProvider: React.FC<CartProviderProps> = ({ children, sessionId }) => {
  // const { sessionId } = useParams<{ sessionId: string }>();
  const [cartCount, setCartCount] = useState(0);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [activeOrders, setActiveOrders] = useState<number[]>([]);

  // localStorage แบบแยกตาม session
  const getSessionKey = (key: string) => {
    return sessionId ? `${key}_${sessionId}` : key;
  };

  const addToCart = async (
    menuItemId: number,
    memberId?: number,
    quantity: number = 1,
    note?: string,
  ) => {
    if (!sessionId) {
      throw new Error('No session ID');
    }
    try {
      console.log('[CART] addToCart called with:', {
        menuItemId,
        quantity,
        note,
        memberId,
        sessionId
      });

      // 1. โหลดหรือสร้าง order (ถ้ายังไม่มี order ปัจจุบัน)
      let orderId = currentOrderId;
      if (!orderId) {
        console.log('[CART] No current order, creating new one...');
        orderId = await loadOrCreateOrder(sessionId);
        setCurrentOrderId(orderId);
      }

      console.log('[CART] Using orderId:', orderId);

      // 2. เพิ่มสินค้าลง order_items
      const requestData = {
        orderId,
        menuItemId,
        quantity,
        note: note || null,
        memberId: memberId || null,
      };

      console.log('[CART] Sending request to /api/order-items:', requestData);

      const response = await axios.post('/api/order-items', requestData);

      console.log('✅ [CART] Item added to cart:', response.data);

      // 3. อัพเดท cart count
      await fetchCartCount(orderId);

    } catch (error) {
      console.error('❌ [CART] Error adding to cart:', error);

      if (axios.isAxiosError(error)) {
        console.error('❌ [CART] Axios error details:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }

      throw error;
    }
  };

  const checkoutOrder = async () => {
    if (!currentOrderId || !sessionId) {
      console.log('No current order to checkout');
      return;
    }

    try {
      console.log('Checking out order:', currentOrderId);

      await axios.patch(`/api/orders/${currentOrderId}/checkout`);
      // ไม่ต้องส่ง body เพราะ backend จัดการสถานะให้แล้ว

      console.log('✅ Order checked out successfully:', currentOrderId);

      // ล้าง order ปัจจุบัน
      clearCurrentOrder();

    } catch (error: any) {
      console.error('❌ Error checking out order:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  };
  // รีเซ็ต state เมื่อ sessionId เปลี่ยน
  useEffect(() => {
    console.log('Session changed, resetting cart state:', sessionId);
    setCartCount(0);
    setCurrentOrderId(null);
    setActiveOrders([]);
  }, [sessionId]);

  // ดึง cart count สำหรับ order ปัจจุบัน
  const fetchCartCount = async (orderId: number, retries = 3) => {
    if (!orderId) return;

    try {
      console.log('Fetching cart count for order:', orderId);
      const response = await axios.get(`/api/order-items/count?orderId=${orderId}`);
      console.log('Cart count response:', response.data);

      if (response.data.success) {
        const count = Number(response.data.count);
        // console.log('✅ Setting cart count to:', count);
        setCartCount(count);
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error(`❌ Error fetching cart count (${retries} retries left):`, error);

      if (retries > 0) {
        setTimeout(() => fetchCartCount(orderId, retries - 1), 1000);
      } else {
        setCartCount(0);
      }
    }
  };

  // โหลดหรือสร้าง order
  const loadOrCreateOrder = async (sessionId: string): Promise<number> => {
    try {
      // console.log('Loading or creating order for session:', sessionId);
      // 1. ตรวจสอบว่ามี order ที่ active อยู่แล้วไหม
      const savedOrderId = localStorage.getItem(getSessionKey('currentOrderId'));

      if (savedOrderId) {
        const orderId = Number(savedOrderId);
        console.log('Found existing order in localStorage:', orderId);

        try {
          // ตรวจสอบว่า order นี้ยังมีอยู่ใน database และเป็นของ session นี้
          const orderResponse = await axios.get(`/api/orders/${orderId}`);
          const order = orderResponse.data;

          if (order && order.status === 'PENDING' && order.diningSessionId === parseInt(sessionId)) {
            // console.log('✅ Using existing order:', orderId);
            setCurrentOrderId(orderId);
            await fetchCartCount(orderId);
            return orderId;
          } else {
            console.log('❌ Order is invalid or does not belong to this session');
          }
        } catch (error: any) {
          // ถ้า order ไม่พบใน database (404) หรือ error อื่น
          if (error.response?.status === 404) {
            console.log('❌ Order not found in database, it may have been deleted');
          } else {
            console.log('Error validating order:', error.message);
          }
        }

        // ล้าง order เก่าที่ invalid
        console.log('Removing invalid order from localStorage:', orderId);
        localStorage.removeItem(getSessionKey('currentOrderId'));
      }

      // 2. ถ้าไม่มี order ที่ valid อยู่ ให้สร้างใหม่
      console.log('Creating new order for session:', sessionId);
      return await createNewOrder(sessionId);

    } catch (error) {
      console.error('❌ Error in loadOrCreateOrder:', error);
      // ถ้า error ให้สร้าง order ใหม่
      return await createNewOrder(sessionId);
    }
  };

  // สร้าง order ใหม่
  const createNewOrder = async (sessionId: string): Promise<number> => {
    try {
      console.log('Creating new order for session:', sessionId);

      const response = await axios.post('/api/orders', {
        diningSessionId: parseInt(sessionId),
        tableId: parseInt(sessionId),
        // status: 'PENDING'
      });

      const newOrderId = response.data.id;
      console.log('✅ Created new order:', newOrderId);

      setCurrentOrderId(newOrderId);
      localStorage.setItem(getSessionKey('currentOrderId'), newOrderId.toString());
      setCartCount(0);

      return newOrderId;
    } catch (error: any) {
      console.error('❌ Error creating new order:', error);

      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      throw error;
    }
  };

  // Initialize cart เมื่อ sessionId เปลี่ยน
  useEffect(() => {
    const initializeCart = async () => {
      if (!sessionId) {
        console.log('No sessionId provided');
        return;
      }

      // console.log('Initializing cart for session:', sessionId);

      // ใช้ session-based keys
      const sessionKey = getSessionKey('currentOrderId');
      const savedOrderId = localStorage.getItem(sessionKey);

      // console.log('Looking for key:', sessionKey);
      // console.log('Found savedOrderId:', savedOrderId);

      if (savedOrderId) {
        const orderId = Number(savedOrderId);
        console.log('Using saved order from localStorage:', orderId);
        setCurrentOrderId(orderId);
        await fetchCartCount(orderId);
      } else {
        console.log('No saved order found');
        // ไม่สร้าง order ทันที รอให้มีการ addToCart ก่อน
      }

      const savedActiveOrders = localStorage.getItem(getSessionKey('activeOrders'));
      if (savedActiveOrders) {
        setActiveOrders(JSON.parse(savedActiveOrders));
      }
    };

    initializeCart();
  }, [sessionId]);

  // ล้าง order ปัจจุบัน
  const clearCurrentOrder = () => {
    console.log('Clearing current order for session:', sessionId);
    setCurrentOrderId(null);
    setCartCount(0);

    // ลบเฉพาะของ session นี้
    if (sessionId) {
      localStorage.removeItem(getSessionKey('currentOrderId'));
      localStorage.removeItem(getSessionKey('activeOrders'));
    }
  };

  // อัพเดท cart count เมื่อ currentOrderId เปลี่ยน
  useEffect(() => {
    if (currentOrderId) {
      console.log('Current order changed, starting polling:', currentOrderId);
      fetchCartCount(currentOrderId);

      // Polling ทุก 3 วินาที
      const interval = setInterval(() => {
        console.log('Polling cart count for order:', currentOrderId);
        fetchCartCount(currentOrderId);
      }, 3000);

      return () => {
        console.log('Clearing polling interval for order:', currentOrderId);
        clearInterval(interval);
      };
    }
  }, [currentOrderId]);

  return (
    <CartContext.Provider value={{
      cartCount,
      setCartCount,
      currentOrderId,
      createNewOrder,
      clearCurrentOrder,
      activeOrders,
      addToCart,
      checkoutOrder
    }}>
      {children}
    </CartContext.Provider>
  );
};

export { CartContext };

// ฟังก์ชันเพิ่มสินค้าลงตะกร้า
// const addToCart = async (
//   menuItemId: number,
//   quantity: number = 1,
//   note?: string,
//   memberId?: number,
//   // note: string = ''
// ) => {
//   if (!sessionId) {
//     throw new Error('No session ID');
//   }
//   try {
//     // 1. โหลดหรือสร้าง order (ถ้ายังไม่มี order ปัจจุบัน)
//     let orderId = currentOrderId;
//     if (!orderId) {
//       orderId = await loadOrCreateOrder(sessionId);
//     }
//     // 2. เพิ่มสินค้าลง order_items
//     // console.log('Adding item to order:', { orderId, menuItemId, memberId, quantity });
//     const response = await axios.post('/api/order-items', {
//       orderId,
//       menuItemId,
//       quantity,
//       note,
//       memberId, // มาคนเดียวก้ส่ง null ไป
//     });
//     console.log('✅ Item added to cart:', response.data);
//     // 3. อัพเดท cart count
//     await fetchCartCount(orderId);

//   } catch (error) {
//     console.error('❌ Error adding to cart:', error);
//     throw error;
//   }
// };