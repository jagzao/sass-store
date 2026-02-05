import {
  User,
  CreateUserData,
  UpdateUserData,
  AuthCredentials,
} from "../../../apps/api/lib/services/UserService";
// Simple UUID generator for testing
const generateUUID = () => crypto.randomUUID();

export class UserBuilder {
  private user: Partial<User> = {};

  constructor() {
    this.withDefaults();
  }

  private withDefaults(): this {
    const now = new Date();
    this.user = {
      id: generateUUID(),
      email: "john.doe@example.com",
      firstName: "John",
      lastName: "Doe",
      role: "customer",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    return this;
  }

  withId(id: string): this {
    this.user.id = id;
    return this;
  }

  withEmail(email: string): this {
    this.user.email = email;
    return this;
  }

  withFirstName(firstName: string): this {
    this.user.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.user.lastName = lastName;
    return this;
  }

  withRole(role: "customer" | "admin" | "staff"): this {
    this.user.role = role;
    return this;
  }

  withActive(isActive: boolean): this {
    this.user.isActive = isActive;
    return this;
  }

  withCreatedAt(createdAt: Date): this {
    this.user.createdAt = createdAt;
    return this;
  }

  withUpdatedAt(updatedAt: Date): this {
    this.user.updatedAt = updatedAt;
    return this;
  }

  // Preset configurations
  asAdmin(): this {
    return this.withRole("admin").withEmail("admin@example.com");
  }

  asStaff(): this {
    return this.withRole("staff").withEmail("staff@example.com");
  }

  asInactive(): this {
    return this.withActive(false).withEmail("inactive@example.com");
  }

  build(): User {
    if (!this.user.id) throw new Error("User ID is required");
    if (!this.user.email) throw new Error("User email is required");
    if (!this.user.firstName) throw new Error("User first name is required");
    if (!this.user.lastName) throw new Error("User last name is required");
    if (!this.user.role) throw new Error("User role is required");
    if (this.user.isActive === undefined)
      throw new Error("User active status is required");
    if (!this.user.createdAt) throw new Error("User created date is required");
    if (!this.user.updatedAt) throw new Error("User updated date is required");

    return this.user as User;
  }

  // Static factory methods for common scenarios
  static admin(): User {
    return new UserBuilder().asAdmin().build();
  }

  static staff(): User {
    return new UserBuilder().asStaff().build();
  }

  static customer(): User {
    return new UserBuilder().build();
  }

  static inactive(): User {
    return new UserBuilder().asInactive().build();
  }

  static withEmail(email: string): User {
    return new UserBuilder().withEmail(email).build();
  }
}

export class CreateUserDataBuilder {
  private data: Partial<CreateUserData> = {};

  constructor() {
    this.withDefaults();
  }

  private withDefaults(): this {
    this.data = {
      email: "new.user@example.com",
      firstName: "New",
      lastName: "User",
      role: "customer",
    };
    return this;
  }

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withFirstName(firstName: string): this {
    this.data.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.data.lastName = lastName;
    return this;
  }

  withRole(role: "customer" | "admin" | "staff"): this {
    this.data.role = role;
    return this;
  }

  // Preset configurations
  asAdmin(): this {
    return this.withRole("admin").withEmail("admin.new@example.com");
  }

  asStaff(): this {
    return this.withRole("staff").withEmail("staff.new@example.com");
  }

  build(): CreateUserData {
    if (!this.data.email) throw new Error("Email is required");
    if (!this.data.firstName) throw new Error("First name is required");
    if (!this.data.lastName) throw new Error("Last name is required");

    return {
      email: this.data.email,
      firstName: this.data.firstName,
      lastName: this.data.lastName,
      role: this.data.role || "customer",
    };
  }

  // Static factory methods
  static admin(): CreateUserData {
    return new CreateUserDataBuilder().asAdmin().build();
  }

  static staff(): CreateUserData {
    return new CreateUserDataBuilder().asStaff().build();
  }

  static customer(): CreateUserData {
    return new CreateUserDataBuilder().build();
  }
}

export class UpdateUserDataBuilder {
  private data: UpdateUserData = {};

  constructor() {}

  withEmail(email: string): this {
    this.data.email = email;
    return this;
  }

  withFirstName(firstName: string): this {
    this.data.firstName = firstName;
    return this;
  }

  withLastName(lastName: string): this {
    this.data.lastName = lastName;
    return this;
  }

  withRole(role: "customer" | "admin" | "staff"): this {
    this.data.role = role;
    return this;
  }

  withActive(isActive: boolean): this {
    this.data.isActive = isActive;
    return this;
  }

  // Preset configurations
  toAdmin(): this {
    return this.withRole("admin");
  }

  toStaff(): this {
    return this.withRole("staff");
  }

  toCustomer(): this {
    return this.withRole("customer");
  }

  deactivate(): this {
    return this.withActive(false);
  }

  activate(): this {
    return this.withActive(true);
  }

  withNewEmail(email: string): this {
    return this.withEmail(email);
  }

  build(): UpdateUserData {
    return { ...this.data };
  }

  // Static factory methods
  static toAdmin(): UpdateUserData {
    return new UpdateUserDataBuilder().toAdmin().build();
  }

  static toStaff(): UpdateUserData {
    return new UpdateUserDataBuilder().toStaff().build();
  }

  static deactivate(): UpdateUserData {
    return new UpdateUserDataBuilder().deactivate().build();
  }

  static withNewEmail(email: string): UpdateUserData {
    return new UpdateUserDataBuilder().withNewEmail(email).build();
  }
}

export class AuthCredentialsBuilder {
  private credentials: Partial<AuthCredentials> = {};

  constructor() {
    this.withDefaults();
  }

  private withDefaults(): this {
    this.credentials = {
      email: "john.doe@example.com",
      password: "password123",
    };
    return this;
  }

  withEmail(email: string): this {
    this.credentials.email = email;
    return this;
  }

  withPassword(password: string): this {
    this.credentials.password = password;
    return this;
  }

  // Preset configurations
  withValidCredentials(): this {
    return this.withEmail("john.doe@example.com").withPassword("password123");
  }

  withInvalidEmail(): this {
    return this.withEmail("invalid-email").withPassword("password123");
  }

  withShortPassword(): this {
    return this.withEmail("john.doe@example.com").withPassword("123");
  }

  withAdminCredentials(): this {
    return this.withEmail("admin@example.com").withPassword("admin123");
  }

  withStaffCredentials(): this {
    return this.withEmail("staff@example.com").withPassword("staff123");
  }

  build(): AuthCredentials {
    if (!this.credentials.email) throw new Error("Email is required");
    if (!this.credentials.password) throw new Error("Password is required");

    return this.credentials as AuthCredentials;
  }

  // Static factory methods
  static valid(): AuthCredentials {
    return new AuthCredentialsBuilder().withValidCredentials().build();
  }

  static withInvalidEmail(): AuthCredentials {
    return new AuthCredentialsBuilder().withInvalidEmail().build();
  }

  static withShortPassword(): AuthCredentials {
    return new AuthCredentialsBuilder().withShortPassword().build();
  }

  static admin(): AuthCredentials {
    return new AuthCredentialsBuilder().withAdminCredentials().build();
  }

  static staff(): AuthCredentials {
    return new AuthCredentialsBuilder().withStaffCredentials().build();
  }

  static withEmail(email: string): AuthCredentials {
    return new AuthCredentialsBuilder()
      .withEmail(email)
      .withPassword("password123")
      .build();
  }
}

// Utility functions for creating test data
export const createTestUser = (overrides?: Partial<User>): User => {
  const builder = new UserBuilder();

  if (overrides?.id) builder.withId(overrides.id);
  if (overrides?.email) builder.withEmail(overrides.email);
  if (overrides?.firstName) builder.withFirstName(overrides.firstName);
  if (overrides?.lastName) builder.withLastName(overrides.lastName);
  if (overrides?.role) builder.withRole(overrides.role);
  if (overrides?.isActive !== undefined) builder.withActive(overrides.isActive);
  if (overrides?.createdAt) builder.withCreatedAt(overrides.createdAt);
  if (overrides?.updatedAt) builder.withUpdatedAt(overrides.updatedAt);

  return builder.build();
};

export const createTestCreateUserData = (
  overrides?: Partial<CreateUserData>,
): CreateUserData => {
  const builder = new CreateUserDataBuilder();

  if (overrides?.email) builder.withEmail(overrides.email);
  if (overrides?.firstName) builder.withFirstName(overrides.firstName);
  if (overrides?.lastName) builder.withLastName(overrides.lastName);
  if (overrides?.role) builder.withRole(overrides.role);

  return builder.build();
};

export const createTestUpdateUserData = (
  overrides?: Partial<UpdateUserData>,
): UpdateUserData => {
  const builder = new UpdateUserDataBuilder();

  if (overrides?.email) builder.withEmail(overrides.email);
  if (overrides?.firstName) builder.withFirstName(overrides.firstName);
  if (overrides?.lastName) builder.withLastName(overrides.lastName);
  if (overrides?.role) builder.withRole(overrides.role);
  if (overrides?.isActive !== undefined) builder.withActive(overrides.isActive);

  return builder.build();
};

export const createTestAuthCredentials = (
  overrides?: Partial<AuthCredentials>,
): AuthCredentials => {
  const builder = new AuthCredentialsBuilder();

  if (overrides?.email) builder.withEmail(overrides.email);
  if (overrides?.password) builder.withPassword(overrides.password);

  return builder.build();
};
