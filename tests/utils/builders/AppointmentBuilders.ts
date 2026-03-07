/**
 * Appointment Data Builders
 *
 * Test builders for creating appointment test data following Test Builder pattern.
 * Provides fluent interface for building realistic appointment test objects.
 */

// Helper to generate proper UUID format
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Simple faker-compatible implementation for testing
const testFaker = {
  datatype: {
    uuid: () => generateUUID(),
    number: (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min,
  },
  name: {
    firstName: () =>
      [
        "María",
        "Juan",
        "José",
        "Ana",
        "Carlos",
        "Laura",
        "Pedro",
        "Sofía",
        "Miguel",
        "Carmen",
      ][Math.floor(Math.random() * 10)],
    lastName: () =>
      [
        "García",
        "Rodríguez",
        "Martínez",
        "López",
        "González",
        "Hernández",
        "Pérez",
        "Sánchez",
        "Ramírez",
        "Torres",
      ][Math.floor(Math.random() * 10)],
  },
  phone: {
    number: () =>
      `52${testFaker.datatype.number(100, 999)}${testFaker.datatype.number(1000000, 9999999)}`,
  },
  internet: {
    email: (name: string) =>
      `${name.toLowerCase().replace(/\s/g, ".")}@example.com`,
  },
  date: {
    future: () => new Date(Date.now() + 24 * 60 * 60 * 1000 * 7),
    soon: () => new Date(Date.now() + 2 * 60 * 60 * 1000),
  },
  helpers: {
    arrayElement: <T>(array: T[]): T =>
      array[Math.floor(Math.random() * array.length)],
  },
  lorem: {
    sentence: () =>
      `Notes ${Math.random().toString(36).substring(7)}`,
  },
};

export interface AppointmentData {
  id: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  serviceName: string;
  startTime: Date;
  endTime: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  totalPrice: number;
  notes?: string;
}

const SERVICES = [
  "Manicure Premium",
  "Pedicure Spa",
  "Corte de Cabello",
  "Coloración",
  "Tratamiento Facial",
  "Masaje Relajante",
  "Uñas Acrílicas",
  "Diseño de Cejas",
];

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

export class AppointmentBuilder {
  private appointment: Partial<AppointmentData> = {};

  constructor() {
    this.appointment = {
      id: generateUUID(),
      status: "pending",
    };
  }

  static anAppointment(): AppointmentBuilder {
    return new AppointmentBuilder();
  }

  withId(id: string): AppointmentBuilder {
    this.appointment.id = id;
    return this;
  }

  withCustomerName(name: string): AppointmentBuilder {
    this.appointment.customerName = name;
    return this;
  }

  withCustomerPhone(phone: string): AppointmentBuilder {
    this.appointment.customerPhone = phone;
    return this;
  }

  withCustomerEmail(email: string): AppointmentBuilder {
    this.appointment.customerEmail = email;
    return this;
  }

  withServiceName(service: string): AppointmentBuilder {
    this.appointment.serviceName = service;
    return this;
  }

  withStartTime(date: Date): AppointmentBuilder {
    this.appointment.startTime = date;
    return this;
  }

  withEndTime(date: Date): AppointmentBuilder {
    this.appointment.endTime = date;
    return this;
  }

  withStatus(status: AppointmentData["status"]): AppointmentBuilder {
    this.appointment.status = status;
    return this;
  }

  withTotalPrice(price: number): AppointmentBuilder {
    this.appointment.totalPrice = price;
    return this;
  }

  withNotes(notes: string): AppointmentBuilder {
    this.appointment.notes = notes;
    return this;
  }

  // Presets for common test scenarios
  static pendingAppointment(): AppointmentBuilder {
    return AppointmentBuilder.anAppointment()
      .withStatus("pending")
      .withStartTime(testFaker.date.soon());
  }

  static confirmedAppointment(): AppointmentBuilder {
    return AppointmentBuilder.anAppointment()
      .withStatus("confirmed")
      .withStartTime(testFaker.date.future());
  }

  static completedAppointment(): AppointmentBuilder {
    return AppointmentBuilder.anAppointment()
      .withStatus("completed")
      .withStartTime(new Date(Date.now() - 24 * 60 * 60 * 1000));
  }

  static cancelledAppointment(): AppointmentBuilder {
    return AppointmentBuilder.anAppointment()
      .withStatus("cancelled")
      .withStartTime(testFaker.date.future());
  }

  // Realistic random appointment
  static random(): AppointmentBuilder {
    const firstName = testFaker.name.firstName();
    const lastName = testFaker.name.lastName();
    const startTime = testFaker.date.soon();
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later

    return AppointmentBuilder.anAppointment()
      .withCustomerName(`${firstName} ${lastName}`)
      .withCustomerPhone(testFaker.phone.number())
      .withCustomerEmail(testFaker.internet.email(`${firstName} ${lastName}`))
      .withServiceName(testFaker.helpers.arrayElement(SERVICES))
      .withStartTime(startTime)
      .withEndTime(endTime)
      .withStatus(testFaker.helpers.arrayElement([...STATUSES]))
      .withTotalPrice(testFaker.datatype.number(100, 1000))
      .withNotes(testFaker.lorem.sentence());
  }

  build(): AppointmentData {
    const now = new Date();
    const startTime = this.appointment.startTime || testFaker.date.soon();
    const customerName =
      this.appointment.customerName ||
      `${testFaker.name.firstName()} ${testFaker.name.lastName()}`;

    return {
      id: this.appointment.id || generateUUID(),
      customerName,
      customerPhone: this.appointment.customerPhone || testFaker.phone.number(),
      customerEmail:
        this.appointment.customerEmail ||
        testFaker.internet.email(customerName),
      serviceName:
        this.appointment.serviceName ||
        testFaker.helpers.arrayElement(SERVICES),
      startTime,
      endTime:
        this.appointment.endTime ||
        new Date(startTime.getTime() + 60 * 60 * 1000),
      status: this.appointment.status || "pending",
      totalPrice: this.appointment.totalPrice || testFaker.datatype.number(100, 500),
      notes: this.appointment.notes,
    };
  }

  /**
   * Build as API response format (with string dates)
   */
  buildAsApiResponse(): Record<string, unknown> {
    const data = this.build();
    return {
      ...data,
      startTime: data.startTime.toISOString(),
      endTime: data.endTime.toISOString(),
    };
  }
}

/**
 * Create multiple appointments at once
 */
export function createAppointments(
  count: number,
  options?: { status?: AppointmentData["status"] }
): AppointmentData[] {
  return Array.from({ length: count }, () => {
    const builder = AppointmentBuilder.random();
    if (options?.status) {
      builder.withStatus(options.status);
    }
    return builder.build();
  });
}

/**
 * Create pending appointments for testing
 */
export function createPendingAppointments(count: number): AppointmentData[] {
  return createAppointments(count, { status: "pending" });
}
