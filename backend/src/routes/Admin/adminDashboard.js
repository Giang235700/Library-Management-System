import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

// map status code -> label
const STATUS_LABELS = {
  0: "AVAILABLE",
  1: "RESERVED",
  2: "BORROWED",
  3: "LOST",
  4: "DAMAGED",
};

router.get("/admin-overview", async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const startOfMonth = new Date(year, now.getMonth(), 1);

    const totalBookTitles = await prisma.book.count();
    const totalRegisteredReaders = await prisma.readerProfile.count();

    // So ban copy dang duoc muon (status = 2)
    const borrowedCopiesCount = await prisma.bookCopy.count({
      where: { status: 2 },
    });

    // Group theo status (int)
    const copyStatusGroup = await prisma.bookCopy.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    });

    let available = 0;
    let borrowed = 0;
    let lost = 0;
    let damaged = 0;

    copyStatusGroup.forEach((item) => {
      switch (item.status) {
        case 0:
          available = item._count._all;
          break;
        case 2:
          borrowed = item._count._all;
          break;
        case 3:
          lost = item._count._all;
          break;
        case 4:
          damaged = item._count._all;
          break;
        default:
          break;
      }
    });

    const inventoryStatus = {
      available,
      borrowed,
      lostDamaged: lost + damaged,
    };

    // Borrowings trong nam
    const borrowingsThisYear = await prisma.borrowing.findMany({
      where: {
        borrowDate: {
          gte: startOfYear,
          lte: now,
        },
      },
      select: { borrowDate: true },
    });

    const monthlyBorrowCount = Array(12).fill(0);
    borrowingsThisYear.forEach((b) => {
      const monthIndex = b.borrowDate.getMonth();
      monthlyBorrowCount[monthIndex] += 1;
    });

    // Tong tien phat thang nay
    const fineAgg = await prisma.fine.aggregate({
      _sum: { amount: true },
      where: {
        fineDate: {
          gte: startOfMonth,
          lte: now,
        },
      },
    });

    const monthlyBorrowFeeRevenue = Number(fineAgg._sum.amount || 0);

    return res.json({
      totalBookTitles,
      totalRegisteredReaders,
      booksCurrentlyBorrowed: borrowedCopiesCount,
      monthlyBorrowFeeRevenue,
      monthlyBorrowCount,
      inventoryStatus,
    });
  } catch (err) {
    console.error("Error in /api/dashboard/admin-overview:", err);
    return res.status(500).json({
      message: "Failed to load admin dashboard data",
    });
  }
});

export default router;
