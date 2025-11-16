import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import prisma from "../prismaClient.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, address, phone, email, password, gender, dob } = req.body;

  try {
    if (!name || !email || !password || !address || !gender) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const validGender = ["MALE", "FEMALE", "OTHER"];
    if (!validGender.includes(gender)) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    let parsedDob = null;
    if (dob) {
      const d = new Date(dob);
      if (isNaN(d.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      parsedDob = d;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashed,
        role: Role.READER,
        phone: phone ?? null,
        readerProfile: {
          create: {
            address,
            gender,
            dob: parsedDob
          },
        },
      },
      include: { readerProfile: true },
    });

    if (!process.env.JWT_SECRET) {
      return res.status(201).json({
        message: "Register success",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      });
    }

    const token = jwt.sign(
      { id: newUser.id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(201).json({
      message: "Register success",
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(503).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
   console.log("🔥 HIT POST /api/auth/login", req.body);
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ok = bcrypt.compareSync(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Wrong password" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET missing" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    return res.status(200).json({
      token,
      role: user.role,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(503).json({ message: "Server error" });
  }
});

export default router;
