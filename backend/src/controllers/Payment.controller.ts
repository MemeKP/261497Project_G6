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

// Mock callback
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

// export async function getPaymentStatus(req: Request, res: Response, next: NextFunction) {
//   try {
//     const { billId } = req.params;
//     const { memberId } = req.query;

//     if (!billId) {
//       return res.status(400).json({
//         error: "Bill ID is required"
//       });
//     }

//     // แปลง billId เป็น number
//     const billIdNum = parseInt(billId as string);
//     const memberIdNum = memberId ? parseInt(memberId as string) : null;

//     let payment;

//     if (memberIdNum) {
//       // กรณีจ่ายแบบ split - ใช้ Drizzle query
//       const result = await dbClient
//         .select()
//         .from(payments)
//         .where(
//           and(
//             eq(payments.billId, billIdNum),
//             eq(payments.memberId, memberIdNum)
//           )
//         )
//         .orderBy(desc(payments.paidAt))
//         .limit(1);

//       payment = result[0];
//     } else {
//       // กรณีจ่ายทั้งบิล
//       const result = await dbClient
//         .select()
//         .from(payments)
//         .where(eq(payments.billId, billIdNum))
//         .orderBy(desc(payments.paidAt))
//         .limit(1);

//       payment = result[0];
//     }

//     if (!payment) {
//       return res.status(404).json({
//         error: "Payment not found"
//       });
//     }

//     res.json({
//       status: payment.status,
//       paymentId: payment.id,
//       amount: payment.amount,
//       billId: payment.billId,
//       memberId: payment.memberId,
//       billSplitId: payment.billSplitId,
//     });

//   } catch (error) {
//     console.error("Error fetching payment status:", error);
//     next(error);
//   }
// }

export async function getPaymentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { billId } = req.params;
    const { memberId } = req.query;

    if (!billId) {
      return res.status(400).json({
        error: "Bill ID is required",
      });
    }

    const billIdNum = parseInt(billId as string);
    const memberIdNum = memberId ? parseInt(memberId as string) : null;

    let payment;

    if (memberIdNum) {
      // CASE: Split Bill
      const result = await dbClient
        .select()
        .from(payments)
        .where(
          and(eq(payments.billId, billIdNum), eq(payments.memberId, memberIdNum))
        )
        .orderBy(desc(payments.paidAt))
        .limit(1);
      payment = result[0];
    } else {
      // CASE: Full Bill
      const result = await dbClient
        .select()
        .from(payments)
        .where(eq(payments.billId, billIdNum))
        .orderBy(desc(payments.paidAt))
        .limit(1);
      payment = result[0];
    }

    if (!payment) {
      return res.status(404).json({
        error: "Payment not found",
      });
    }

    // ✅ ดึงข้อมูล bill เพื่อหา sessionId
    const [bill] = await dbClient
      .select({
        sessionId: bills.diningSessionId,
        billStatus: bills.status,
      })
      .from(bills)
      .leftJoin(diningSessions, eq(bills.diningSessionId, diningSessions.id))
      .where(eq(bills.id, billIdNum))
      .limit(1);

    res.json({
      status: payment.status,
      paymentId: payment.id,
      amount: payment.amount,
      billId: payment.billId,
      memberId: payment.memberId,
      billSplitId: payment.billSplitId,
      sessionId: bill?.sessionId || null, // ส่ง sessionId กลับไป
      billStatus: bill?.billStatus || null, 
    });
  } catch (error) {
    console.error("Error fetching payment status:", error);
    next(error);
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
//         date: relatedPayment?.paidAt || split.billCreatedAt?.toISOString() || null,
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

export const getPaymentsByTable = async (req: Request, res: Response, next: NextFunction) => {
  const { tableId } = req.query;

  if (!tableId) {
    return res.status(400).json({
      success: false,
      error: "tableId is required",
    });
  }

  try {
    const tableIdNum = parseInt(tableId as string);

    // 1. ดึง dining session ที่ active ของโต๊ะนี้
    const diningSessionResult = await dbClient
      .select()
      .from(diningSessions)
      .where(
        and(
          eq(diningSessions.tableId, tableIdNum),
          eq(diningSessions.status, "ACTIVE")
        )
      )
      .limit(1);

    if (diningSessionResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No active dining session found for this table",
      });
    }

    const diningSession = diningSessionResult[0];
    const diningSessionId = diningSession.id;

    // 2. ดึง bills ของ session นี้
    const billsResult = await dbClient
      .select()
      .from(bills)
      .where(eq(bills.diningSessionId, diningSessionId));

    if (billsResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No bills found for this dining session",
      });
    }

    const billIds = billsResult.map((bill) => bill.id);

    // 3. ดึง bill splits และ member information
    const splitsResult = await dbClient
      .select({
        splitId: billSplits.id,
        billId: billSplits.billId,
        memberId: billSplits.memberId,
        amount: billSplits.amount,
        paid: billSplits.paid,
        memberName: group_members.name,
        billCreatedAt: bills.createdAt,
      })
      .from(billSplits)
      .innerJoin(bills, eq(billSplits.billId, bills.id))
      .innerJoin(group_members, eq(billSplits.memberId, group_members.id))
      .where(inArray(billSplits.billId, billIds));

    // 4. ดึง payment information
    const paymentsResult = await dbClient
      .select()
      .from(payments)
      .where(inArray(payments.billId, billIds));

    // 5. รวมข้อมูล SPLIT BILL
    const formattedPayments = splitsResult.map((split) => {
      const relatedPayment = paymentsResult.find(
        (p) =>
          p.billSplitId === split.splitId ||
          (p.billId === split.billId && p.memberId === split.memberId)
      );

      const isPaid = split.paid || relatedPayment?.status === "PAID";

      return {
        billId: split.billId,
        splitId: split.splitId,
        memberId: split.memberId,
        name: split.memberName,
        amount: Number(split.amount),
        status: isPaid ? "PAID" : "PENDING",
        date:
          relatedPayment?.paidAt ||
          split.billCreatedAt?.toISOString() ||
          null,
        method: relatedPayment?.method || "QR",
        paymentId: relatedPayment?.id,
        role: "Member",
      };
    });

    // ✅ 6. เพิ่มกรณีจ่ายทั้งโต๊ะ (ไม่มี splits)
    const splitBillIds = new Set(splitsResult.map((s) => s.billId));

    const entireTablePayments = billsResult
      // ✅ เงื่อนไขเพิ่ม: ต้องไม่ใช่บิล UNPAID
      .filter((bill) => !splitBillIds.has(bill.id) && bill.status !== "UNPAID")
      .map((bill) => ({
        billId: bill.id,
        splitId: 0,
        memberId: null,
        name: "Entire Table",
        amount: Number(bill.total),
        status: bill.status === "PAID" ? "PAID" : "PENDING",
        date: bill.createdAt?.toISOString() || new Date().toISOString(),
        method: "QR",
        paymentId: null,
        role: "Group",
      }));

    // ✅ 7. รวมทั้งหมด
    const allPayments = [...formattedPayments, ...entireTablePayments];

    return res.json(allPayments);
  } catch (err) {
    console.error("Error fetching payments by table:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// ใน backend controller
export const toggleEntireBillStatus = async (req: Request, res: Response, next: NextFunction) => {
  const { billId } = req.params;
  const { status } = req.body;

  try {
    const billIdNum = parseInt(billId);

    console.log(`💰 [TOGGLE] Toggling entire bill ${billIdNum} to ${status}`);

    // 1. อัพเดทสถานะ bill
    await dbClient
      .update(bills)
      .set({ 
        status: status === 'PAID' ? 'PAID' : 'PENDING',
        createdAt: new Date()
      })
      .where(eq(bills.id, billIdNum));

    // 2. จัดการ payment record
    if (status === 'PAID') {
      // ตรวจสอบว่ามี payment อยู่แล้วหรือไม่
      const existingPayment = await dbClient
        .select()
        .from(payments)
        .where(and(
          eq(payments.billId, billIdNum),
          eq(payments.billSplitId, 0) // 0 = entire bill
        ))
        .limit(1);

      if (existingPayment.length === 0) {
        // ดึง bill total
        const billData = await dbClient
          .select({ total: bills.total })
          .from(bills)
          .where(eq(bills.id, billIdNum))
          .limit(1);

        // สร้าง payment record ใหม่
        await dbClient
          .insert(payments)
          .values({
            billId: billIdNum,
            billSplitId: 0, // 0 = entire bill
            amount: billData[0]?.total || 0,
            method: 'QR',
            status: 'PAID',
            paidAt: new Date(),
          });
      } else {
        // อัพเดท payment ที่มีอยู่
        await dbClient
          .update(payments)
          .set({
            status: 'PAID',
            paidAt: new Date(),
          })
          .where(and(
            eq(payments.billId, billIdNum),
            eq(payments.billSplitId, 0)
          ));
      }
    } else {
      // ถ้าเปลี่ยนเป็น PENDING, อัพเดท payment (ถ้ามี)
      await dbClient
        .update(payments)
        .set({
          status: 'PENDING',
          paidAt: null,
        })
        .where(and(
          eq(payments.billId, billIdNum),
          eq(payments.billSplitId, 0)
        ));
    }

    console.log(`✅ [TOGGLE] Entire bill ${billIdNum} updated to ${status}`);

    res.json({
      success: true,
      message: `Entire bill status updated to ${status}`
    });

  } catch (err) {
    console.error("❌ [TOGGLE] Error toggling entire bill status:", err);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
};


// export const togglePaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const { billId, splitId } = req.params;
//     const { status } = req.body;

//     const billIdNum = parseInt(billId);
//     const splitIdNum = parseInt(splitId);

//     // 1. อัพเดต bill_splits.paid
//     const [updatedSplit] = await dbClient
//       .update(billSplits)
//       .set({ 
//         paid: status === 'PAID' ? true : false
//       })
//       .where(
//         and(
//           eq(billSplits.id, splitIdNum),
//           eq(billSplits.billId, billIdNum)
//         )
//       )
//       .returning();

//     if (!updatedSplit) {
//       return res.status(404).json({
//         success: false,
//         error: "Bill split not found"
//       });
//     }

//     // 2. อัพเดต payments.status (ถ้ามี payment record)
//     let updatedPayment = null;
//     const existingPayment = await dbClient
//       .select()
//       .from(payments)
//       .where(
//         and(
//           eq(payments.billSplitId, splitIdNum),
//           eq(payments.billId, billIdNum)
//         )
//       )
//       .limit(1);

//     if (existingPayment.length > 0) {
//       [updatedPayment] = await dbClient
//         .update(payments)
//         .set({
//           status: status,
//           paidAt: status === 'PAID' ? new Date() : null
//         })
//         .where(eq(payments.id, existingPayment[0].id))
//         .returning();
//     } else {
//       // สร้าง payment record ใหม่ถ้ายังไม่มี
//       [updatedPayment] = await dbClient
//         .insert(payments)
//         .values({
//           billId: billIdNum,
//           billSplitId: splitIdNum,
//           memberId: updatedSplit.memberId,
//           method: 'MANUAL', // Admin manually confirmed
//           amount: updatedSplit.amount,
//           status: status,
//           paidAt: status === 'PAID' ? new Date() : null
//         })
//         .returning();
//     }

//     // 3. เช็คว่าทั้ง bill จ่ายครบแล้วหรือยัง
//     const remainingSplits = await dbClient
//       .select()
//       .from(billSplits)
//       .where(
//         and(
//           eq(billSplits.billId, billIdNum),
//           eq(billSplits.paid, false)
//         )
//       );

//     // 4. ถ้าจ่ายครบแล้ว อัพเดต bill status
//     if (remainingSplits.length === 0) {
//       await dbClient
//         .update(bills)
//         .set({
//           status: 'PAID'
//         })
//         .where(eq(bills.id, billIdNum));
//     }

//     res.json({
//       success: true,
//       data: {
//         isPaid: updatedSplit.paid,
//         paymentStatus: status,
//         paidAt: updatedPayment?.paidAt
//       }
//     });

//   } catch (error) {
//     console.error("Error toggling payment status:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error"
//     });
//   }
// };

export const togglePaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { billId, splitId } = req.params;
    const { status } = req.body;

    const billIdNum = parseInt(billId);
    const splitIdNum = parseInt(splitId);

    let updatedPayment = null;

    // 🟢 ถ้ามี splitId => เป็น Split Bill
    if (!isNaN(splitIdNum) && splitIdNum > 0) {
      // 1️⃣ อัพเดต bill_splits
      const [updatedSplit] = await dbClient
        .update(billSplits)
        .set({
          paid: status === "PAID",
        })
        .where(and(eq(billSplits.id, splitIdNum), eq(billSplits.billId, billIdNum)))
        .returning();

      if (!updatedSplit) {
        return res.status(404).json({
          success: false,
          error: "Bill split not found",
        });
      }

      // 2️⃣ อัพเดตหรือสร้าง payment ของ split นี้
      const existingPayment = await dbClient
        .select()
        .from(payments)
        .where(and(eq(payments.billSplitId, splitIdNum), eq(payments.billId, billIdNum)))
        .limit(1);

      if (existingPayment.length > 0) {
        [updatedPayment] = await dbClient
          .update(payments)
          .set({
            status,
            paidAt: status === "PAID" ? new Date() : null,
          })
          .where(eq(payments.id, existingPayment[0].id))
          .returning();
      } else {
        [updatedPayment] = await dbClient
          .insert(payments)
          .values({
            billId: billIdNum,
            billSplitId: splitIdNum,
            memberId: updatedSplit.memberId,
            method: "MANUAL",
            amount: Number(updatedSplit.amount ?? 0),
            status,
            paidAt: status === "PAID" ? new Date() : null,
          })
          .returning();
      }

      // 3️⃣ ตรวจว่าจ่ายครบทุกคนหรือยัง
      const remainingSplits = await dbClient
        .select()
        .from(billSplits)
        .where(and(eq(billSplits.billId, billIdNum), eq(billSplits.paid, false)));

      if (remainingSplits.length === 0) {
        await dbClient
          .update(bills)
          .set({ status: "PAID" })
          .where(eq(bills.id, billIdNum));
      }

      // ✅ ส่งผลลัพธ์สำหรับ Split Bill
      return res.json({
        success: true,
        data: {
          type: "split",
          isPaid: updatedSplit.paid,
          paymentStatus: status,
          paidAt: updatedPayment?.paidAt,
        },
      });
    }

    // 🔵 ถ้าไม่มี splitId => เป็น Full Bill (Entire Table)
    else {
      const [bill] = await dbClient
        .select()
        .from(bills)
        .where(eq(bills.id, billIdNum));

      if (!bill) {
        return res.status(404).json({
          success: false,
          error: "Bill not found",
        });
      }

      // อัปเดตหรือสร้าง payment สำหรับทั้งโต๊ะ
      const existingPayment = await dbClient
        .select()
        .from(payments)
        .where(eq(payments.billId, billIdNum))
        .limit(1);

      if (existingPayment.length > 0) {
        [updatedPayment] = await dbClient
          .update(payments)
          .set({
            status,
            paidAt: status === "PAID" ? new Date() : null,
          })
          .where(eq(payments.id, existingPayment[0].id))
          .returning();
      } else {
        [updatedPayment] = await dbClient
          .insert(payments)
          .values({
            billId: billIdNum,
            amount: Number(bill.total ?? 0),
            method: "MANUAL",
            status,
            paidAt: status === "PAID" ? new Date() : null,
          })
          .returning();
      }

      // อัปเดตสถานะบิล
      await dbClient
        .update(bills)
        .set({ status })
        .where(eq(bills.id, billIdNum));

      // ✅ ส่งผลลัพธ์สำหรับ Entire Bill
      return res.json({
        success: true,
        data: {
          type: "entire",
          billId: billIdNum,
          paymentStatus: status,
          paidAt: updatedPayment?.paidAt,
        },
      });
    }
  } catch (error) {
    console.error("Error toggling payment status:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
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

  return fillMissingDates(grouped, period);
}

function fillMissingDates(data: { [key: string]: number }, period: string) {
  const result = [];
  const now = new Date();
  
  if (period === 'month') {
    // สำหรับเดือน: แสดง 30 วันที่ผ่านมาจนถึงวันนี้
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29); // 30 วัน (29 + วันนี้)
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const key = currentDate.toISOString().split('T')[0];
      
      result.push({
        date: key,
        amount: data[key] || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else if (period === 'week') {
    // สำหรับสัปดาห์: แสดง 7 วันที่ผ่านมา
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 6);
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      const key = currentDate.toISOString().split('T')[0];
      
      result.push({
        date: key,
        amount: data[key] || 0
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
  } else {
    // สำหรับปี: แสดง 12 เดือนที่ผ่านมา
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const key = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      
      result.push({
        date: key,
        amount: data[key] || 0
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return result;
}