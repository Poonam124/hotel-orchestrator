import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { signToken } from "../lib/jwt";
import { AppError } from "../middleware/error";

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
}
export interface PublicUser {
  id: string;
  email: string;
  name: string;
}
export interface AuthResult {
  token: string;
  user: PublicUser;
}

// Anything that can store users (Redis in the app, a Map in tests)
export interface UserRepo {
  create(user: User): Promise<boolean>;
  findByEmail(email: string): Promise<User | null>;
}

export interface AuthServicePort {
  register(input: { name: string; email: string; password: string }): Promise<AuthResult>;
  login(input: { email: string; password: string }): Promise<AuthResult>;
  me(email: string): Promise<PublicUser>;
}

const COST = 10;
// Compared against when the email is unknown, so response time does not reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", COST);

const toPublic = (u: User): PublicUser => ({ id: u.id, email: u.email, name: u.name });

export class AuthService implements AuthServicePort {
  constructor(private users: UserRepo) {}

  async register({ name, email, password }: { name: string; email: string; password: string }) {
    const user: User = {
      id: randomUUID(),
      email,
      name,
      passwordHash: await bcrypt.hash(password, COST),
      createdAt: new Date().toISOString(),
    };
    if (!(await this.users.create(user))) throw new AppError(409, "Email already registered");
    return { token: signToken(user), user: toPublic(user) };
  }

  async login({ email, password }: { email: string; password: string }) {
    const user = await this.users.findByEmail(email);
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
    // Same message for "no such email" and "wrong password"
    if (!user || !ok) throw new AppError(401, "Invalid email or password");
    return { token: signToken(user), user: toPublic(user) };
  }

  async me(email: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new AppError(401, "Account no longer exists");
    return toPublic(user);
  }
}
