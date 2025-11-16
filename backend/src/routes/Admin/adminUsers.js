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
    const users = await prisma.user.findMany({
      where: {
        NOT: { role: "ADMIN" },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (err) {
    console.error("Error get users:", err);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});


router.get("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id },
    });

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

    const existing = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (existing) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
        phone,
      },
    });

    res.status(201).json(sanitizeUser(user));
  } catch (err) {
    console.error("Error create user:", err);
    res.status(500).json({ message: "Failed to create user" });
  }
});


router.put("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, email, phone, role } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    const updateData = {};

    if (typeof name === "string") updateData.name = name;
    if (typeof phone === "string") updateData.phone = phone;
    if (typeof email === "string") {
      updateData.email = email.trim().toLowerCase();
    }

    if (role) {
      const allowedRoles = ["LIBRARIAN", "ACCOUNTANT", "READER"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Invalid role. Allowed: LIBRARIAN, ACCOUNTANT, READER",
        });
      }
      updateData.role = role;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    res.json(sanitizeUser(updated));
  } catch (err) {
    console.error("Error update user:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Email already in use" });
    }
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

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        email: newEmail.trim().toLowerCase(),
      },
    });

    res.json(sanitizeUser(updated));
  } catch (err) {
    console.error("Error change email:", err);
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Email already in use" });
    }
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

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.json({ message: "Password updated" });
  } catch (err) {
    console.error("Error change password:", err);
    res.status(500).json({ message: "Failed to change password" });
  }
});


router.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user || user.role === "ADMIN") {
      return res.status(404).json({ message: "User not found" });
    }

    await prisma.user.delete({ where: { id } });

    res.json({ message: "User deleted" });
  } catch (err) {
    console.error("Error delete user:", err);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

export default router;
