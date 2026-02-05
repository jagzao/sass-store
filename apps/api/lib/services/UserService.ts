import { Result, Ok, Err, isFailure } from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";
import {
  validateWithZod,
  CommonSchemas,
} from "@sass-store/validation/src/zod-result";
import { z } from "zod";

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "customer" | "admin" | "staff";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  role?: "customer" | "admin" | "staff";
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "customer" | "admin" | "staff";
  isActive?: boolean;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  user: User;
  token: string;
}

// Mock Database for Users
class UserDatabase {
  private users: Map<string, User> = new Map();

  async create(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updatedUser = { ...existingUser, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Clear all data (for testing)
  clear(): void {
    this.users.clear();
  }

  // Get current count
  count(): number {
    return this.users.size;
  }
}

// Zod Schemas
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["customer", "admin", "staff"]),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const CreateUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["customer", "admin", "staff"]).optional(),
});

const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(["customer", "admin", "staff"]).optional(),
  isActive: z.boolean().optional(),
});

const AuthCredentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export class UserService {
  private db: UserDatabase;

  constructor(database?: UserDatabase) {
    this.db = database || new UserDatabase();
  }

  // Create a new user
  async createUser(data: CreateUserData): Promise<Result<User, DomainError>> {
    // Validate input data
    const validationResult = validateWithZod(CreateUserSchema, data);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Check if user already exists
    const existingUser = await this.db.findByEmail(data.email);
    if (existingUser) {
      return Err(
        ErrorFactories.businessRule(
          "user_email_exists",
          `User with email ${data.email} already exists`,
          "EMAIL_EXISTS",
        ),
      );
    }

    // Create new user
    const now = new Date();
    const newUser: User = {
      id: crypto.randomUUID(),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role || "customer",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const createdUser = await this.db.create(newUser);
      return Ok(createdUser);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "create_user",
          `Failed to create user with email ${data.email}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Get user by ID
  async getUserById(id: string): Promise<Result<User, DomainError>> {
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_user_id",
          "Invalid user ID format",
          "id",
          id,
        ),
      );
    }

    try {
      const user = await this.db.findById(id);
      if (!user) {
        return Err(
          ErrorFactories.notFound("User", id, `User with ID ${id} not found`),
        );
      }
      return Ok(user);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_user_by_id",
          `Failed to get user with ID ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Find user by email (returns Ok(null) if not found)
  async findUserByEmail(
    email: string,
  ): Promise<Result<User | null, DomainError>> {
    const emailValidation = CommonSchemas.email.parse(email);
    if (isFailure(emailValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_email",
          "Invalid email format",
          "email",
          email,
        ),
      );
    }

    try {
      const user = await this.db.findByEmail(email);
      return Ok(user);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "find_user_by_email",
          `Failed to find user with email ${email}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Update user
  async updateUser(
    id: string,
    data: UpdateUserData,
  ): Promise<Result<User, DomainError>> {
    // Validate ID
    const uuidValidation = CommonSchemas.uuid.parse(id);
    if (isFailure(uuidValidation)) {
      return Err(
        ErrorFactories.validation(
          "invalid_user_id",
          "Invalid user ID format",
          "id",
          id,
        ),
      );
    }

    // Validate update data
    const validationResult = validateWithZod(UpdateUserSchema, data);
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Check if user exists
    const existingUser = await this.db.findById(id);
    if (!existingUser) {
      return Err(
        ErrorFactories.notFound("User", id, `User with ID ${id} not found`),
      );
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailCheck = await this.db.findByEmail(data.email);
      if (emailCheck) {
        return Err(
          ErrorFactories.businessRule(
            "user_email_exists",
            `User with email ${data.email} already exists`,
            "EMAIL_EXISTS",
          ),
        );
      }
    }

    // Update user
    const updatedUser: User = {
      ...existingUser,
      ...data,
      updatedAt: new Date(),
    };

    try {
      const user = await this.db.update(id, updatedUser);
      return Ok(user);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "update_user",
          `Failed to update user with ID ${id}`,
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Deactivate user (soft delete)
  async deactivateUser(id: string): Promise<Result<User, DomainError>> {
    return this.updateUser(id, { isActive: false });
  }

  // Authenticate user
  async authenticateUser(
    credentials: AuthCredentials,
  ): Promise<Result<AuthResult, DomainError>> {
    // Validate credentials
    const validationResult = validateWithZod(
      AuthCredentialsSchema,
      credentials,
    );
    if (isFailure(validationResult)) {
      return validationResult;
    }

    // Find user by email
    const userResult = await this.findUserByEmail(credentials.email);
    if (isFailure(userResult)) {
      return userResult;
    }

    const user = userResult.data;
    if (!user) {
      return Err(
        ErrorFactories.authentication(
          "invalid_credentials",
          "Invalid email or password",
        ),
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return Err(
        ErrorFactories.businessRule(
          "user_inactive",
          "User account is inactive",
          "USER_INACTIVE",
        ),
      );
    }

    // In a real implementation, you would hash and verify the password
    // For this mock implementation, we'll simulate password verification
    const isPasswordValid = await this.verifyPassword(
      credentials.password,
      user.email,
    );

    if (!isPasswordValid) {
      return Err(
        ErrorFactories.authentication(
          "invalid_credentials",
          "Invalid email or password",
        ),
      );
    }

    // Generate auth token (in real implementation, use JWT)
    const token = this.generateAuthToken(user);

    const authResult: AuthResult = {
      user,
      token,
    };

    return Ok(authResult);
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<Result<User[], DomainError>> {
    try {
      const users = await this.db.findAll();
      return Ok(users);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_all_users",
          "Failed to retrieve all users",
          undefined,
          error as Error,
        ),
      );
    }
  }

  // Helper methods (in real implementation, these would be more sophisticated)
  private async verifyPassword(
    password: string,
    email: string,
  ): Promise<boolean> {
    // Mock password verification - in real implementation, use bcrypt
    // For demo purposes, we'll accept any password that's at least 6 characters
    return password.length >= 6;
  }

  private generateAuthToken(user: User): string {
    // Mock token generation - in real implementation, use JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return Buffer.from(JSON.stringify(payload)).toString("base64");
  }

  // Get database instance (for testing)
  getDatabase(): UserDatabase {
    return this.db;
  }
}
