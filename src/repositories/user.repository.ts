import prisma from '../config/prisma';
import { RegisterDTO } from '../utils/interfaces';

class UserRepository {
    async create(data : RegisterDTO) {
        return await prisma.user.create({data : data})
    }

    async findByEmail(email : string) {
        return await prisma.user.findUnique({where : {email}})
    }

    async findById(id : number) {
        return await prisma.user.findUnique({where : {id}})
    }
}

export default UserRepository;
