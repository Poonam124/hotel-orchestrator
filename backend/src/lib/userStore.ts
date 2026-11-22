import type { createRedis } from "./redis";
import type { User, UserRepo } from "../services/authService";

// Users live in Redis as  users:<email>  ->  JSON
export class UserStore implements UserRepo {
  constructor(private redis: ReturnType<typeof createRedis>) {}

  private key = (email: string) => `users:${email}`;

  // NX = only set if the key does not exist, so two parallel sign-ups cannot both win
  async create(user: User): Promise<boolean> {
    return (await this.redis.set(this.key(user.email), JSON.stringify(user), "NX")) === "OK";
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.redis.get(this.key(email));
    return raw ? (JSON.parse(raw) as User) : null;
  }
}
