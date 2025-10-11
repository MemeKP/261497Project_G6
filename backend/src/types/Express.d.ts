// types/express.d.ts
import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: number; // หรือ string ขึ้นกับว่า userId เป็น type อะไร
    }
  }
}