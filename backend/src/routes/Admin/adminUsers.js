import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const router = express.Router();

function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  return safe;
}

router.get("/users", async (req, res) => {
  try {
    const rows = await prisma.$queryRaw`
      SELECT
        id,
        email,
        name,
        role,
        phone,
        "createdAt",
        "updatedAt"
      FROM "User"
      WHERE role <> 'ADMIN'::"Role"
      ORDER BY "createdAt" DESC
    `;

    res.json(rows);
  } catch (err) {
    console.error("Error get users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const rows = await prisma.$queryRaw`
      SELECT *
      FROM "User"
      WHERE id = ${id}
      LIMIT 1
    `;
    const user = rows[0];

    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(sanitizeUser(user));
  } catch (err) {
    console.error("Error get user:", err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    const allowedRoles = ["LIBRARIAN", "ACCOUNTANT", "READER"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Allowed: LIBRARIAN, ACCOUNTANT, READER",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingRows = await prisma.$queryRaw`
      SELECT id
      FROM "User"
      WHERE email = ${normalizedEmail}
      LIMIT 1
    `;
    if (existingRows.length > 0) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const insertedRows = await prisma.$queryRaw`
        INSERT INTO "User"
          (name, email, "passwordHash", role, phone, "createdAt", "updatedAt")
        VALUES
          (
            ${name},
            ${normalizedEmail},
            ${passwordHash},
            ${role}::"Role",
            ${phone},
            NOW(),          -- createdAt
            NOW()           -- updatedAt
          )
        RETURNING id, email, name, role, phone, "createdAt", "updatedAt"
      `;

      const user = insertedRows[0];

      res.status(201).json(user);
    } catch (err) {
      console.error("Error create user:", err);
      if (err.code === "23505") {
        return res.status(409).json({ message: "Email already in use" });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  } catch (err) {
    console.error("Error create user:", err);
    res.status(500).json({ message: "Failed to create user" });
  }
});

router.put("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone, role } = req.body;

    const userRows = await prisma.$queryRaw`
      SELECT *
      FROM "User"
      WHERE id = ${id}
      LIMIT 1
    `;
    const user = userRows[0];

    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    const updates = [];
    const params = [];
    if (typeof name === "string") {
      updates.push(`name = $${updates.length + 1}`);
      params.push(name);
    }
    if (typeof phone === "string") {
      updates.push(`phone = $${updates.length + 1}`);
      params.push(phone);
    }
    if (typeof email === "string") {
      updates.push(`email = $${updates.length + 1}`);
      params.push(email.trim().toLowerCase());
    }
    if (role) {
      const allowedRoles = ["LIBRARIAN", "ACCOUNTANT", "READER"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role. Allowed: LIBRARIAN, ACCOUNTANT, READER",
        });
      }
      updates.push(`role = $${updates.length + 1}::"Role"`);
      params.push(role);
    }

    if (updates.length === 0) {
      return res.json(sanitizeUser(user));
    }

    params.push(id);
    const sql = `
      UPDATE "User"
      SET ${updates.join(", ")}
      WHERE id = $${params.length}
      RETURNING *
    `;

    try {
      const updatedRows = await prisma.$queryRawUnsafe(sql, ...params);
      const updated = updatedRows[0];
      res.json(sanitizeUser(updated));
    } catch (err) {
      console.error("Error update user:", err);
      if (err.code === "23505") {
        return res.status(409).json({ message: "Email already in use" });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  } catch (err) {
    console.error("Error update user:", err);
    res.status(500).json({ message: "Failed to update user" });
  }
});

router.patch("/users/:id/email", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ message: "newEmail is required" });
    }

    const userRows = await prisma.$queryRaw`
      SELECT *
      FROM "User"
      WHERE id = ${id}
      LIMIT 1
    `;
    const user = userRows[0];

    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    const normalizedEmail = newEmail.trim().toLowerCase();

    try {
      const updatedRows = await prisma.$queryRaw`
        UPDATE "User"
        SET email = ${normalizedEmail}
        WHERE id = ${id}
        RETURNING *
      `;
      const updated = updatedRows[0];
      res.json(sanitizeUser(updated));
    } catch (err) {
      console.error("Error change email:", err);
      if (err.code === "23505") {
        return res.status(409).json({ message: "Email already in use" });
      }
      res.status(500).json({ message: "Failed to change email" });
    }
  } catch (err) {
    console.error("Error change email:", err);
    res.status(500).json({ message: "Failed to change email" });
  }
});

router.patch("/users/:id/password", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "newPassword is required" });
    }

    const userRows = await prisma.$queryRaw`
      SELECT *
      FROM "User"
      WHERE id = ${id}
      LIMIT 1
    `;
    const user = userRows[0];

    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.$executeRaw`
      UPDATE "User"
      SET "passwordHash" = ${passwordHash}
      WHERE id = ${id}
    `;

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Error change password:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const userRows = await prisma.$queryRaw`
      SELECT *
      FROM "User"
      WHERE id = ${id}
      LIMIT 1
    `;
    const user = userRows[0];

    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.$executeRaw`
      DELETE FROM "User"
      WHERE id = ${id}
    `;

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error delete user:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router;
