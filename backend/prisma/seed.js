import { PrismaClient, Role, Gender } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "123456";
const HASH = bcrypt.hashSync(PASSWORD, 10);

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log("=== RESET DATABASE ===");

  await prisma.fine.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.borrowing.deleteMany();
  await prisma.bookCopy.deleteMany();
  await prisma.book.deleteMany();
  await prisma.readerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log("=== SEED USERS ===");

  // ---- ADMIN ----
  const admins = await Promise.all(
    Array.from({ length: 3 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `Admin ${i + 1}`,
          email: `admin_seed_${i + 1}@lib.com`,
          passwordHash: HASH,
          role: Role.ADMIN,
          phone: `09010000${i + 1}`,
        },
      })
    )
  );

  // ---- LIBRARIANS ----
  const librarians = await Promise.all(
    Array.from({ length: 3 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `Librarian ${i + 1}`,
          email: `librarian_seed_${i + 1}@lib.com`,
          passwordHash: HASH,
          role: Role.LIBRARIAN,
          phone: `09020000${i + 1}`,
        },
      })
    )
  );

  // ---- ACCOUNTANTS ----
  const accountants = await Promise.all(
    Array.from({ length: 2 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `Accountant ${i + 1}`,
          email: `accountant_seed_${i + 1}@lib.com`,
          passwordHash: HASH,
          role: Role.ACCOUNTANT,
          phone: `09030000${i + 1}`,
        },
      })
    )
  );

  // ---- READERS ----
  const readers = await Promise.all(
    Array.from({ length: 40 }).map((_, i) =>
      prisma.user.create({
        data: {
          name: `Reader ${i + 1}`,
          email: `reader_seed_${i + 1}@mail.com`,
          passwordHash: HASH,
          role: Role.READER,
          phone: `09040000${i + 1}`,
          readerProfile: {
            create: {
              address: `Street ${i + 1}`,
              gender: rand([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
              dob: randomDate(new Date(1995, 0, 1), new Date(2010, 0, 1)),
            },
          },
        },
        include: { readerProfile: true },
      })
    )
  );

  console.log("Users inserted:", {
    admins: admins.length,
    librarians: librarians.length,
    accountants: accountants.length,
    readers: readers.length,
  });

  // ---- BOOKS ----
  console.log("=== SEED BOOKS ===");
  const genres = ["Fantasy", "SciFi", "Romance", "Tech", "History", "Education"];

  const books = await Promise.all(
    Array.from({ length: 40 }).map((_, i) =>
      prisma.book.create({
        data: {
          title: `Book Seed ${i + 1}`,
          author: `Author ${i + 1}`,
          genre: rand(genres),
          language: "English",
          publishedYear: 1990 + (i % 25),
          description: `Seed description for book ${i + 1}`,
          location: `Shelf-${Math.ceil((i + 1) / 5)}`,
        },
      })
    )
  );

  console.log(`Books inserted: ${books.length}`);

  // ---- COPIES ----
  console.log("=== SEED BOOK COPIES ===");
  const copies = [];
  for (const book of books) {
    for (let i = 0; i < 5; i++) {
      const copy = await prisma.bookCopy.create({
        data: {
          bookId: book.id,
          status: rand([0, 0, 0, 2, 3]), // mostly available
        },
      });
      copies.push(copy);
    }
  }

  console.log(`Copies inserted: ${copies.length}`);

  // ---- BORROWINGS ----
  console.log("=== SEED BORROWINGS ===");
  const borrowings = [];
  for (let i = 0; i < 100; i++) {
    const user = rand(readers);
    const profile = user.readerProfile;
    const copy = rand(copies);
    const staff = rand(librarians);

    const borrowDate = randomDate(new Date(2024, 0, 1), new Date());
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + rand([7, 14, 21]));

    const returned = Math.random() < 0.6;

    const b = await prisma.borrowing.create({
      data: {
        readerId: profile.id,
        copyId: copy.id,
        staffId: staff.id,
        borrowDate,
        dueDate,
        returnDate: returned ? randomDate(borrowDate, new Date()) : null,
        status: returned ? 2 : 1,
        bookId: copy.bookId,
      },
    });

    borrowings.push(b);
  }

  console.log(`Borrowings inserted: ${borrowings.length}`);

  // ---- RESERVATIONS ----
  console.log("=== SEED RESERVATIONS ===");
  const reservations = [];
  for (let i = 0; i < 40; i++) {
    const user = rand(readers);
    const profile = user.readerProfile;
    const book = rand(books);

    const r = await prisma.reservation.create({
      data: {
        readerId: profile.id,
        bookId: book.id,
        status: rand([1, 1, 4, 5]),
        reservedAt: randomDate(new Date(2024, 0, 1), new Date()),
      },
    });

    reservations.push(r);
  }

  console.log(`Reservations inserted: ${reservations.length}`);

  // ---- FINES ----
  console.log("=== SEED FINES ===");
  const fineAmounts = [5000, 10000, 15000, 20000, 30000];

  let fineCount = 0;
  for (const b of borrowings) {
    if (Math.random() < 0.4) {
      await prisma.fine.create({
        data: {
          borrowingId: b.id,
          reason: rand(["Late return", "Lost book", "Damaged book"]),
          amount: rand(fineAmounts),
          fineDate: randomDate(b.borrowDate, new Date()),
        },
      });
      fineCount++;
    }
  }

  console.log(`Fines inserted: ${fineCount}`);

  console.log("=== SEED DONE ===");
  console.log("Example login accounts:");
  console.log("  admin_seed_1@lib.com / 123456");
  console.log("  reader_seed_1@mail.com / 123456");
}

main()
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
