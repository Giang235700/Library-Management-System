import express from "express";
import prisma from "../../prismaClient.js";

const router = express.Router();

router.get("/books", async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.title,
        b.author,
        b.genre,
        COUNT(c.id) AS "totalCopies",
        COUNT(CASE WHEN c.status = 0 THEN 1 END) AS "availableCopies"
      FROM "Book" b
      LEFT JOIN "BookCopy" c ON c."bookId" = b.id
      GROUP BY b.id, b.title, b.author, b.genre
      ORDER BY b.id DESC
    `;

    const mapped = rows.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      genre: r.genre,
      totalCopies: Number(r.totalCopies),
      availableCopies: Number(r.availableCopies),
    }));

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

    const result = await prisma.$transaction(async (tx) => {
      const insertedBooks = await tx.$queryRaw`
          INSERT INTO "Book"
            ("title", "author", "genre", "language", "publishedYear", "description", "location", "createdAt", "updatedAt")
          VALUES
            (
              ${title},
              ${author},
              ${category},
              ${"English"},
              ${2020},
              ${""},
              ${"Shelf-A"},
              NOW(),
              NOW()
            )
          RETURNING *
        `;

      const newBook = insertedBooks[0];


      await tx.$executeRaw`
        INSERT INTO "BookCopy" ("bookId", "status", "createdAt", "updatedAt")
        SELECT 
          ${newBook.id} AS "bookId",
          0             AS "status",
          NOW()         AS "createdAt",
          NOW()         AS "updatedAt"
        FROM generate_series(1, ${total})
      `;


      const copies = await tx.$queryRaw`
        SELECT id, status
        FROM "BookCopy"
        WHERE "bookId" = ${newBook.id}
      `;

      return {
        id: newBook.id,
        title: newBook.title,
        author: newBook.author,
        genre: newBook.genre,
        totalCopies: copies.length,
        availableCopies: copies.filter((c) => c.status === 0).length,
      };
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error in POST /api/admin/books:", error);

    if (error.code === "23505") {
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

    await prisma.$transaction(async (tx) => {
      const copies = await tx.$queryRaw`
        SELECT id
        FROM "BookCopy"
        WHERE "bookId" = ${id}
      `;
      const copyIds = copies.map((c) => c.id);

      const borrowings = await tx.$queryRaw`
        SELECT id
        FROM "Borrowing"
        WHERE "bookId" = ${id}
           OR "copyId" = ANY(${copyIds}::int[])
      `;
      const borrowingIds = borrowings.map((b) => b.id);

      if (borrowingIds.length > 0) {
        await tx.$executeRaw`
          DELETE FROM "Fine"
          WHERE "borrowingId" = ANY(${borrowingIds}::int[])
        `;
      }

      if (copyIds.length > 0) {
        await tx.$executeRaw`
          DELETE FROM "Reservation"
          WHERE "bookId" = ${id}
             OR "bookCopyId" = ANY(${copyIds}::int[])
        `;

        await tx.$executeRaw`
          DELETE FROM "Borrowing"
          WHERE "bookId" = ${id}
             OR "copyId" = ANY(${copyIds}::int[])
        `;

        await tx.$executeRaw`
          DELETE FROM "BookCopy"
          WHERE "bookId" = ${id}
        `;
      } else {
        await tx.$executeRaw`
          DELETE FROM "Reservation"
          WHERE "bookId" = ${id}
        `;

        await tx.$executeRaw`
          DELETE FROM "Borrowing"
          WHERE "bookId" = ${id}
        `;
      }

      await tx.$executeRaw`
        DELETE FROM "Book"
        WHERE id = ${id}
      `;
    });

    return res.status(204).send();
  } catch (error) {
    console.error("Error in DELETE /api/admin/books/:id:", error);
    return res.status(500).json({ message: "Failed to delete book" });
  }
});

export default router;
