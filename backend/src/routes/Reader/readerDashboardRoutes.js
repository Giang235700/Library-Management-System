// backend/src/routes/readerDashboardRoutes.js
import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = express.Router();

router.get("/reader-overview", async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);

    // 🔥 LAY TU TOKEN (verifyToken dat req.user = { id, role })
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Chua dang nhap" });
    }

    // TIM ReaderProfile theo userId
    const readerProfile = await prisma.readerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!readerProfile) {
      return res.status(404).json({ message: "Reader not found" });
    }

    const readerId = readerProfile.id;

    // --- THONG KE CO BAN ---
    const totalBorrowings = await prisma.borrowing.count({
      where: { readerId },
    });

    const activeBorrowings = await prisma.borrowing.count({
      where: {
        readerId,
        returnDate: null,
      },
    });

    const overdueBorrowings = await prisma.borrowing.count({
      where: {
        readerId,
        returnDate: null,
        dueDate: { lt: now },
      },
    });

    const reservationsCount = await prisma.reservation.count({
      where: { readerId },
    });

    // Tong tien phat cua reader nay (qua quan he borrowing)
    const fineAgg = await prisma.fine.aggregate({
      _sum: { amount: true },
      where: {
        borrowing: {
          readerId,
        },
      },
    });

    // --- MANG 12 THANG ---
    const borrowingsThisYear = await prisma.borrowing.findMany({
      where: {
        readerId,
        borrowDate: {
          gte: startOfYear,
          lte: now,
        },
      },
      select: { borrowDate: true },
    });

    const monthlyBorrowCount = Array(12).fill(0);
    borrowingsThisYear.forEach((b) => {
      const monthIndex = b.borrowDate.getMonth(); // 0..11
      monthlyBorrowCount[monthIndex] += 1;
    });

    // --- 5 LUOT MUON GAN NHAT ---
    const recentBorrowings = await prisma.borrowing.findMany({
      where: { readerId },
      orderBy: { borrowDate: "desc" },
      take: 5,
      include: {
        copy: {
          include: {
            book: true,
          },
        },
      },
    });

    const recentBorrowingsFormatted = recentBorrowings.map((b) => ({
      id: b.id,
      bookTitle: b.copy?.book?.title || null,
      borrowDate: b.borrowDate,
      dueDate: b.dueDate,
      returnDate: b.returnDate,
    }));

    const totalFineAmount = Number(fineAgg._sum.amount || 0);

    return res.json({
      reader: {
        id: readerProfile.user.id,
        name: readerProfile.user.name,
        email: readerProfile.user.email,
        role: readerProfile.user.role,
        phone: readerProfile.user.phone,
        address: readerProfile.address,
        gender: readerProfile.gender,
        dob: readerProfile.dob,
        registrationDate: readerProfile.registrationDate,
      },
      stats: {
        totalBorrowings,
        activeBorrowings,
        overdueBorrowings,
        reservationsCount,
        totalFineAmount,
        monthlyBorrowCount,
      },
      recentBorrowings: recentBorrowingsFormatted,
    });
  } catch (err) {
    console.error("Error in /api/dashboard/reader-overview:", err);
    return res.status(500).json({
      message: "Failed to load reader dashboard data",
    });
  }
});

export default router;
