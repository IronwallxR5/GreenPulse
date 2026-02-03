import { PrismaClient } from '@prisma/client';

// Singleton pattern for Prisma Client
const prisma = new PrismaClient();

export default prisma;
