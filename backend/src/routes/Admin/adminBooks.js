import express from "express";
import prisma from "../../prismaClient.js";

const router = express.Router();

router.get("/books", async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      include: {
        copies: true,
      },
      orderBy: { id: "desc" },
    });

    const mapped = books.map((b) => {
      const totalCopies = b.copies.length;
      const availableCopies = b.copies.filter((c) => c.status === 0).length; 

      return {
        id: b.id,
        title: b.title,
        author: b.author,
        genre: b.genre,
        totalCopies,
        availableCopies,
      };
    });

    return res.json(mapped);
  } catch (error) {
    console.error("Error in GET /api/admin/books:", error);
    return res.status(500).json({ message: "Failed to load books" });
  }
});


router.post("/books", async (req, res) => {
  const { title, author, category, totalCopies } = req.body;

  try {
    if (!title || !author || !category || !totalCopies) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const total = Number(totalCopies);
    if (Number.isNaN(total) || total <= 0) {
      return res.status(400).json({ message: "Invalid totalCopies" });
    }

    const newBook = await prisma.book.create({
      data: {
        title,
        author,
        genre: category,      
        language: "English",
        publishedYear: 2020,
        description: "",
        location: "Shelf-A",
      },
    });
    const copiesData = Array.from({ length: total }).map(() => ({
      bookId: newBook.id,
      status: 0,
    }));

    await prisma.bookCopy.createMany({
      data: copiesData,
    });

    const createdCopies = await prisma.bookCopy.findMany({
      where: { bookId: newBook.id },
    });

    const mapped = {
      id: newBook.id,
      title: newBook.title,
      author: newBook.author,
      genre: newBook.genre,
      totalCopies: createdCopies.length,
      availableCopies: createdCopies.filter((c) => c.status === 0).length,
    };

    return res.status(201).json(mapped);
  } catch (error) {
    console.error("Error in POST /api/admin/books:", error);

    if (error.code === "P2002") {
      return res.status(400).json({ message: "Book already exists" });
    }

    return res.status(500).json({ message: "Failed to add book" });
  }
});

router.delete("/books/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    if (Number.isNaN(id)) {
      return res.status(400).json({ message: "Invalid id" });
    }

    const copies = await prisma.bookCopy.findMany({
      where: { bookId: id },
      select: { id: true },
    });
    const copyIds = copies.map((c) => c.id);
    const borrowings = await prisma.borrowing.findMany({
      where: {
        OR: [
          { bookId: id },
          { copyId: { in: copyIds } },
        ],
      },
      select: { id: true },
    });
    const borrowingIds = borrowings.map((b) => b.id);

    if (borrowingIds.length > 0) {
      await prisma.fine.deleteMany({
        where: {
          borrowingId: { in: borrowingIds },
        },
      });
    }

    await prisma.reservation.deleteMany({
      where: {
        OR: [
          { bookId: id },
          { bookCopyId: { in: copyIds } },
        ],
      },
    });
    await prisma.borrowing.deleteMany({
      where: {
        OR: [
          { bookId: id },
          { copyId: { in: copyIds } },
        ],
      },
    });

    await prisma.bookCopy.deleteMany({
      where: { bookId: id },
    });

    await prisma.book.delete({
      where: { id },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error in DELETE /api/admin/books/:id:", error);
    return res.status(500).json({ message: "Failed to delete book" });
  }
});

export default router;
