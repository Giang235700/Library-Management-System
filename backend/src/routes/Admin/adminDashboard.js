import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/dashboard", async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);

    // 1. Tổng số đầu sách
    const totalBookTitlesRows =
      (await prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "Book"
      `) || [];
    const totalBookTitles = Number(totalBookTitlesRows[0]?.count ?? 0);

    // 2. Tổng số reader đã đăng ký
    const totalRegisteredReadersRows =
      (await prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "ReaderProfile"
      `) || [];
    const totalRegisteredReaders = Number(
      totalRegisteredReadersRows[0]?.count ?? 0
    );

    // 3. Số bản copy đang được mượn (status = 2)
    const borrowedCopiesCountRows =
      (await prisma.$queryRaw`
        SELECT COUNT(*)::int AS count
        FROM "BookCopy"
        WHERE status = 2
      `) || [];
    const booksCurrentlyBorrowed = Number(
      borrowedCopiesCountRows[0]?.count ?? 0
    );

    // 4. Thống kê trạng thái kho sách
    const copyStatusGroupRows =
      (await prisma.$queryRaw`
        SELECT status, COUNT(*)::int AS count
        FROM "BookCopy"
        GROUP BY status
      `) || [];

    let available = 0;
    let borrowed = 0;
    let lost = 0;
    let damaged = 0;

    copyStatusGroupRows.forEach((row) => {
      const status = row.status;
      const count = Number(row.count);
      if (status === 0) available = count;
      else if (status === 2) borrowed = count;
      else if (status === 3) lost = count;
      else if (status === 4) damaged = count;
    });

    const inventoryStatus = {
      available,
      borrowed,
      lostDamaged: lost + damaged,
    };

    // 5. Borrowings trong năm hiện tại
    const borrowingsThisYearRows =
      (await prisma.$queryRaw`
        SELECT 
          EXTRACT(MONTH FROM "borrowDate")::int AS month,
          COUNT(*)::int AS count
        FROM "Borrowing"
        WHERE "borrowDate" >= ${startOfYear}
          AND "borrowDate" <= ${now}
        GROUP BY month
        ORDER BY month
      `) || [];

    const monthlyBorrowCount = Array(12).fill(0);
    borrowingsThisYearRows.forEach((row) => {
      const idx = row.month - 1; // 1–12 -> 0–11
      if (idx >= 0 && idx < 12) {
        monthlyBorrowCount[idx] = Number(row.count);
      }
    });

    // 6. Tổng tiền phạt trong tháng hiện tại
    const fineAggRows =
      (await prisma.$queryRaw`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM "Fine"
        WHERE "fineDate" >= ${startOfYear}
          AND "fineDate" <= ${now}
      `) || [];
    const monthlyBorrowFeeRevenue = Number(fineAggRows[0]?.total ?? 0);

    return res.json({
      totalBookTitles,
      totalRegisteredReaders,
      booksCurrentlyBorrowed,
      monthlyBorrowFeeRevenue,
      monthlyBorrowCount,
      inventoryStatus,
    });
  } catch (err) {
    console.error("Error in /api/admin/dashboard", err);
    return res.status(500).json({
      message: "Failed to load admin dashboard data",
    });
  }
});

export default router;
