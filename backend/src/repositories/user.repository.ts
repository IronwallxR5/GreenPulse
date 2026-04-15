import prisma from '../config/prisma';
import { RegisterDTO } from '../utils/interfaces';

class UserRepository {
  async create(data: RegisterDTO) {
    return await prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  async findById(id: number) {
    return await prisma.user.findUnique({ where: { id } });
  }

  async findByGoogleId(googleId: string) {
    return await prisma.user.findUnique({ where: { googleId } });
  }

  async upsertGoogleUser(data: { googleId: string; email: string; name: string }) {
    return await prisma.user.upsert({
      where: { googleId: data.googleId },
      update: { name: data.name },
      create: {
        googleId: data.googleId,
        email: data.email,
        name: data.name,
        password: null,
      },
    });
  }

  async linkGoogleId(userId: number, googleId: string) {
    return await prisma.user.update({
      where: { id: userId },
      data: { googleId },
    });
  }
}

export default UserRepository;
