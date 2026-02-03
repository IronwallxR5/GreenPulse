import UserRepository from '../repositories/user.repository';
import { RegisterDTO, LoginDTO, AuthResponse } from '../utils/interfaces';

// Auth Service: Authentication business logic
class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  // TODO: Implement auth methods
  // - register(data)
  // - login(data)
  // - hashPassword(password)
  // - comparePassword(plain, hashed)
  // - generateToken(userId)
}

export default AuthService;
