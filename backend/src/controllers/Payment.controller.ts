import { dbClient } from "@db/client.js";
import { bills, billSplits, diningSessions, group_members, payments } from "@db/schema.js";
import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import type { Request, Response, NextFunction } from "express";
import * as paymentService from "src/services/Payment-services.js";

// Create payment (PromptPay)
export async function createPayment(req: Request, res: Response) {
  try {
    const { billId, memberId } = req.body;

    if (!billId) {
      return res.status(400).json({ error: "billId is required" });
    }

    const result = await paymentService.createQrPayment({
      billId: Number(billId),
      memberId: memberId ? Number(memberId) : undefined,
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

// Manual confirm
export async function confirmPayment(req: Request, res: Response) {
  try {
    const { paymentId } = req.params;
    if (isNaN(Number(paymentId))) {
      return res.status(400).json({ error: "Invalid paymentId" });
    }

    const updated = await paymentService.confirmPayment(Number(paymentId));
    if (!updated) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json(updated);
  } catch (err: any) {
    console.error("confirmPayment error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

export async function mockCallback(req: Request, res: Response) {
  try {
    const { paymentId } = req.body;
    if (!paymentId) {
      return res.status(400).json({ error: "paymentId is required" });
    }

    await paymentService.mockCallback(Number(paymentId));

    res.status(200).json({ message: "ACK (mock callback executed)" });
  } catch (err: any) {
    console.error("mockCallback error:", err.message);
    res.status(500).json({ error: "Callback handling failed" });
  }
}

export async function getPaymentStatus(req: Request, res: Response) {
  try {
    const { billId } = req.params;
    const { memberId } = req.query;

    if (!billId || isNaN(Number(billId))) {
      return res.status(400).json({ error: "Invalid billId" });
    }

    const status = await paymentService.getPaymentStatus(
      Number(billId),
      memberId ? Number(memberId) : undefined
    );

    res.json(status);
  } catch (err: any) {
    console.error("getPaymentStatus error:", err.message);
    res.status(500).json({ error: err.message });
  }
}


// export const getPaymentsByTable = async (req: Request, res: Response, next: NextFunction) => {
//   const { tableId } = req.query;

//   if (!tableId) {
//     return res.status(400).json({ 
//       success: false,
//       error: 'tableId is required' 
//     });
//   }

//   try {
//     const tableIdNum = parseInt(tableId as string);

//     // 1. ดึง dining session ที่ active ของโต๊ะนี้
//     const diningSessionResult = await dbClient
//       .select()
//       .from(diningSessions)
//       .where(
//         and(
//           eq(diningSessions.tableId, tableIdNum),
//           eq(diningSessions.status, 'ACTIVE')
//         )
//       )
//       .limit(1);

//     if (diningSessionResult.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'No active dining session found for this table' 
//       });
//     }

//     const diningSession = diningSessionResult[0];
//     const diningSessionId = diningSession.id;

//     // 2. ดึง bills ของ session นี้
//     const billsResult = await dbClient
//       .select()
//       .from(bills)
//       .where(eq(bills.diningSessionId, diningSessionId));

//     if (billsResult.length === 0) {
//       return res.status(404).json({ 
//         success: false,
//         message: 'No bills found for this dining session' 
//       });
//     }

//     const billIds = billsResult.map(bill => bill.id);

//     // 3. ดึง bill splits และ member information
//     const splitsResult = await dbClient
//       .select({
//         splitId: billSplits.id,
//         billId: billSplits.billId,
//         memberId: billSplits.memberId,
//         amount: billSplits.amount,
//         paid: billSplits.paid,
//         memberName: group_members.name,
//         // memberRole: group_members.role,
//         billCreatedAt: bills.createdAt,
//       })
//       .from(billSplits)
//       .innerJoin(bills, eq(billSplits.billId, bills.id))
//       .innerJoin(group_members, eq(billSplits.memberId, group_members.id))
//       .where(inArray(billSplits.billId, billIds));

//     // 4. ดึง payment information
//     const paymentsResult = await dbClient
//       .select()
//       .from(payments)
//       .where(inArray(payments.billId, billIds));

//     // 5. รวมข้อมูลและจัดรูปแบบ
//     const formattedPayments = splitsResult.map(split => {
//       // หา payment ที่เกี่ยวข้องกับ split นี้
//       const relatedPayment = paymentsResult.find(p => 
//         p.billSplitId === split.splitId || 
//         (p.billId === split.billId && p.memberId === split.memberId)
//       );

//       // กำหนดสถานะ: ถ้ามี payment และ status เป็น PAID หรือ billSplit paid เป็น true = Paid
//       const isPaid = split.paid || relatedPayment?.status === 'PAID';

//       return {
//         billId: split.billId,
//         splitId: split.splitId,
//         memberId: split.memberId,
//         name: split.memberName,
//         // role: split.memberRole,
//         amount: Number(split.amount),
//         status: isPaid ? 'PAID' : 'PENDING',
//         date: relatedPayment?.paidAt || split.billCreatedAt.toISOString(),
//         method: relatedPayment?.method || 'QR',
//         paymentId: relatedPayment?.id,
//       };
//     });

//     res.json(formattedPayments);

//   } catch (err) {
//     console.error('Error fetching payments by table:', err);
//     res.status(500).json({ 
//       success: false,
//       error: 'Internal server error' 
//     });
//   }
// };

export const togglePaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billId, splitId } = req.params;
    const { status } = req.body;

    const billIdNum = parseInt(billId);
    const splitIdNum = parseInt(splitId);

    // 1. อัพเดต bill_splits.paid
    const [updatedSplit] = await dbClient
      .update(billSplits)
      .set({
        paid: status === 'PAID' ? true : false
      })
      .where(
        and(
          eq(billSplits.id, splitIdNum),
          eq(billSplits.billId, billIdNum)
        )
      )
      .returning();

    if (!updatedSplit) {
      return res.status(404).json({
        success: false,
        error: "Bill split not found"
      });
    }

    // 2. อัพเดต payments.status (ถ้ามี payment record)
    let updatedPayment = null;
    const existingPayment = await dbClient
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.billSplitId, splitIdNum),
          eq(payments.billId, billIdNum)
        )
      )
      .limit(1);

    if (existingPayment.length > 0) {
      [updatedPayment] = await dbClient
        .update(payments)
        .set({
          status: status,
          paidAt: status === 'PAID' ? new Date() : null
        })
        .where(eq(payments.id, existingPayment[0].id))
        .returning();
    } else {
      // สร้าง payment record ใหม่ถ้ายังไม่มี
      [updatedPayment] = await dbClient
        .insert(payments)
        .values({
          billId: billIdNum,
          billSplitId: splitIdNum,
          memberId: updatedSplit.memberId,
          method: 'MANUAL', // Admin manually confirmed
          amount: updatedSplit.amount,
          status: status,
          paidAt: status === 'PAID' ? new Date() : null
        })
        .returning();
    }

    // 3. เช็คว่าทั้ง bill จ่ายครบแล้วหรือยัง
    const remainingSplits = await dbClient
      .select()
      .from(billSplits)
      .where(
        and(
          eq(billSplits.billId, billIdNum),
          eq(billSplits.paid, false)
        )
      );

    // 4. ถ้าจ่ายครบแล้ว อัพเดต bill status
    if (remainingSplits.length === 0) {
      await dbClient
        .update(bills)
        .set({
          status: 'PAID'
        })
        .where(eq(bills.id, billIdNum));
    }

    res.json({
      success: true,
      data: {
        isPaid: updatedSplit.paid,
        paymentStatus: status,
        paidAt: updatedPayment?.paidAt
      }
    });

  } catch (error) {
    console.error("Error toggling payment status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

export const getRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'month' } = req.query; // week, month, year

    let dateRange: { start: Date; end: Date };
    const now = new Date();

    // กำหนดช่วงเวลาตาม period
    switch (period) {
      case 'week':
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7),
          end: now
        };
        break;
      case 'year':
        dateRange = {
          start: new Date(now.getFullYear(), 0, 1),
          end: now
        };
        break;
      case 'month':
      default:
        dateRange = {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now
        };
    }

    // 1. ดึงข้อมูล revenue ปัจจุบัน (paid payments)
    const currentRevenue = await dbClient
      .select({
        date: payments.paidAt,
        amount: payments.amount
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'PAID'),
          gte(payments.paidAt, dateRange.start),
          lte(payments.paidAt, dateRange.end)
        )
      );

    // 2. ดึงข้อมูล revenue เดือนก่อน (สำหรับ comparison)
    const previousDateRange = {
      start: new Date(dateRange.start.getTime() - (dateRange.end.getTime() - dateRange.start.getTime())),
      end: dateRange.start
    };

    const previousRevenue = await dbClient
      .select({
        amount: payments.amount
      })
      .from(payments)
      .where(
        and(
          eq(payments.status, 'PAID'),
          gte(payments.paidAt, previousDateRange.start),
          lte(payments.paidAt, previousDateRange.end)
        )
      );

    // 3. รวมข้อมูลตามวัน
    const dailyData = groupByDay(currentRevenue, period as string);

    // 4. คำนวณสถิติ
    const currentTotal = currentRevenue.reduce((sum, item) => sum + Number(item.amount), 0);
    const previousTotal = previousRevenue.reduce((sum, item) => sum + Number(item.amount), 0);

    const growthRate = previousTotal > 0
      ? ((currentTotal - previousTotal) / previousTotal * 100)
      : currentTotal > 0 ? 100 : 0;

    const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : 365;
    const avgPerDay = Math.round(currentTotal / daysInPeriod);

    res.json({
      success: true,
      data: {
        chartData: dailyData,
        statistics: {
          currentTotal,
          previousTotal,
          growthRate: Number(growthRate.toFixed(1)),
          avgPerDay,
          period
        }
      }
    });

  } catch (error) {
    console.error("Error fetching revenue overview:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};

// Helper function สำหรับจัดกลุ่มข้อมูลตามวัน
function groupByDay(payments: any[], period: string) {
  const grouped: { [key: string]: number } = {};

  payments.forEach(payment => {
    const date = new Date(payment.date);
    let key: string;

    if (period === 'week' || period === 'month') {
      key = date.toISOString().split('T')[0]; // YYYY-MM-DD
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
    }

    if (!grouped[key]) {
      grouped[key] = 0;
    }
    grouped[key] += Number(payment.amount);
  });

  // เติมข้อมูลวันที่ที่ขาดหายไป
  return fillMissingDates(grouped, period);
}

function fillMissingDates(data: { [key: string]: number }, period: string) {
  const result = [];
  const now = new Date();
  let currentDate: Date;
  let endDate: Date;
  let step: number;

  if (period === 'week') {
    currentDate = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    endDate = now;
    step = 24 * 60 * 60 * 1000; // 1 day
  } else if (period === 'month') {
    currentDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = now;
    step = 24 * 60 * 60 * 1000; // 1 day
  } else {
    currentDate = new Date(now.getFullYear(), 0, 1);
    endDate = now;
    step = 30 * 24 * 60 * 60 * 1000; // 1 month (approx)
  }

  while (currentDate <= endDate) {
    const key = period === 'year'
      ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      : currentDate.toISOString().split('T')[0];

    result.push({
      date: key,
      amount: data[key] || 0
    });

    if (period === 'year') {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return result;
}