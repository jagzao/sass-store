import { db } from "@/lib/db";
import {
  customers,
  services,
  serviceRetouchConfig,
  tenantHolidays,
  customerVisits,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { Result, Ok, Err, DomainError, ErrorFactories } from "@sass-store/core";

/**
 * Service for managing configurable retouch dates
 */
export class RetouchService {
  /**
   * Calculate the next retouch date for a customer based on their last visit
   * and service configuration
   */
  static async calculateNextRetouchDate(
    tenantId: string,
    customerId: string,
    serviceId?: string,
  ): Promise<Result<Date, DomainError>> {
    try {
      // Get customer information
      const customer = await db
        .select()
        .from(customers)
        .where(
          and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
        )
        .limit(1);

      if (!customer.length) {
        return Err({
          type: "NotFoundError",
          resource: "customer",
          message: `Customer with ID ${customerId} not found`,
        });
      }

      // Determine which service to use for retouch calculation
      const targetServiceId = serviceId || customer[0].retouchServiceId;
      if (!targetServiceId) {
        return Err({
          type: "ValidationError",
          field: "serviceId",
          message: "No service specified for retouch calculation",
        });
      }

      // Get service retouch configuration
      const retouchConfig = await db
        .select()
        .from(serviceRetouchConfig)
        .where(
          and(
            eq(serviceRetouchConfig.tenantId, tenantId),
            eq(serviceRetouchConfig.serviceId, targetServiceId),
            eq(serviceRetouchConfig.isActive, true),
          ),
        )
        .limit(1);

      if (!retouchConfig.length) {
        return Err({
          type: "NotFoundError",
          resource: "retouch_config",
          message: `No active retouch configuration found for service ${targetServiceId}`,
        });
      }

      // Get customer's last visit
      const lastVisit = await db
        .select({
          visitDate: customerVisits.visitDate,
        })
        .from(customerVisits)
        .where(
          and(
            eq(customerVisits.customerId, customerId),
            eq(customerVisits.tenantId, tenantId),
            eq(customerVisits.status, "completed"),
          ),
        )
        .orderBy(desc(customerVisits.visitDate))
        .limit(1);

      if (!lastVisit.length) {
        return Err({
          type: "ValidationError",
          field: "visits",
          message:
            "Customer has no completed visits to calculate retouch date from",
        });
      }

      const lastVisitDate = new Date(lastVisit[0].visitDate);
      const config = retouchConfig[0];

      // Get tenant holidays for the period
      const holidays = await db
        .select({
          date: tenantHolidays.date,
          affectsRetouch: tenantHolidays.affectsRetouch,
        })
        .from(tenantHolidays)
        .where(
          and(
            eq(tenantHolidays.tenantId, tenantId),
            eq(tenantHolidays.affectsRetouch, true),
          ),
        );

      // Calculate next retouch date
      const nextRetouchDate = this.calculateRetouchDate(
        lastVisitDate,
        config.frequencyType,
        config.frequencyValue,
        config.businessDaysOnly,
        holidays.map((h) => new Date(h.date)),
      );

      return Ok(nextRetouchDate);
    } catch (error) {
      return Err({
        type: "DatabaseError",
        operation: "calculate_retouch_date",
        message: `Failed to calculate retouch date for customer ${customerId}`,
      });
    }
  }

  /**
   * Update a customer's next retouch date
   */
  static async updateCustomerRetouchDate(
    tenantId: string,
    customerId: string,
    serviceId?: string,
  ): Promise<Result<Date, DomainError>> {
    try {
      const calculationResult = await this.calculateNextRetouchDate(
        tenantId,
        customerId,
        serviceId,
      );

      if (calculationResult.isErr) {
        return calculationResult;
      }

      const nextRetouchDate = calculationResult.value;

      // Update customer's next retouch date
      await db
        .update(customers)
        .set({
          nextRetouchDate,
          updatedAt: new Date(),
        })
        .where(
          and(eq(customers.id, customerId), eq(customers.tenantId, tenantId)),
        );

      return Ok(nextRetouchDate);
    } catch (error) {
      return Err({
        type: "DatabaseError",
        operation: "update_retouch_date",
        message: `Failed to update retouch date for customer ${customerId}`,
      });
    }
  }

  /**
   * Get customers ordered by next retouch date
   */
  static async getCustomersByRetouchDate(
    tenantId: string,
    limit: number = 50,
    offset: number = 0,
  ): Promise<
    Result<
      Array<{
        id: string;
        name: string;
        phone: string;
        nextRetouchDate: Date | null;
        daysUntilRetouch: number | null;
      }>,
      DomainError
    >
  > {
    try {
      const customerList = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          nextRetouchDate: customers.nextRetouchDate,
        })
        .from(customers)
        .where(
          and(eq(customers.tenantId, tenantId), eq(customers.status, "active")),
        )
        .orderBy(customers.nextRetouchDate)
        .limit(limit)
        .offset(offset);

      // Calculate days until retouch for each customer
      const customersWithDays = customerList.map((customer) => ({
        ...customer,
        daysUntilRetouch: customer.nextRetouchDate
          ? Math.ceil(
              (customer.nextRetouchDate.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null,
      }));

      return Ok(customersWithDays);
    } catch (error) {
      return Err({
        type: "DatabaseError",
        operation: "get_customers_by_retouch",
        message: `Failed to get customers by retouch date for tenant ${tenantId}`,
      });
    }
  }

  /**
   * Get service retouch configurations for a tenant
   */
  static async getServiceRetouchConfigs(tenantId: string): Promise<
    Result<
      Array<{
        id: string;
        serviceId: string;
        serviceName: string;
        frequencyType: string;
        frequencyValue: number;
        isActive: boolean;
        isDefault: boolean;
        businessDaysOnly: boolean;
      }>,
      DomainError
    >
  > {
    try {
      const configs = await db
        .select({
          id: serviceRetouchConfig.id,
          serviceId: serviceRetouchConfig.serviceId,
          serviceName: services.name,
          frequencyType: serviceRetouchConfig.frequencyType,
          frequencyValue: serviceRetouchConfig.frequencyValue,
          isActive: serviceRetouchConfig.isActive,
          isDefault: serviceRetouchConfig.isDefault,
          businessDaysOnly: serviceRetouchConfig.businessDaysOnly,
        })
        .from(serviceRetouchConfig)
        .leftJoin(services, eq(serviceRetouchConfig.serviceId, services.id))
        .where(eq(serviceRetouchConfig.tenantId, tenantId));

      return Ok(configs);
    } catch (error) {
      return Err({
        type: "DatabaseError",
        operation: "get_retouch_configs",
        message: `Failed to get retouch configurations for tenant ${tenantId}`,
      });
    }
  }

  /**
   * Create or update a service retouch configuration
   */
  static async upsertServiceRetouchConfig(
    tenantId: string,
    serviceId: string,
    frequencyType: string,
    frequencyValue: number,
    businessDaysOnly: boolean = false,
    isDefault: boolean = false,
  ): Promise<Result<void, DomainError>> {
    try {
      // Verify service belongs to tenant
      const service = await db
        .select()
        .from(services)
        .where(and(eq(services.id, serviceId), eq(services.tenantId, tenantId)))
        .limit(1);

      if (!service.length) {
        return Err({
          type: "NotFoundError",
          resource: "service",
          message: `Service with ID ${serviceId} not found for tenant ${tenantId}`,
        });
      }

      // If setting as default, remove default from other configs
      if (isDefault) {
        await db
          .update(serviceRetouchConfig)
          .set({ isDefault: false })
          .where(
            and(
              eq(serviceRetouchConfig.tenantId, tenantId),
              eq(serviceRetouchConfig.isDefault, true),
            ),
          );
      }

      // Upsert the configuration
      await db
        .insert(serviceRetouchConfig)
        .values({
          tenantId,
          serviceId,
          frequencyType,
          frequencyValue,
          isActive: true,
          isDefault,
          businessDaysOnly,
          metadata: {},
        })
        .onConflictDoUpdate({
          target: [
            serviceRetouchConfig.tenantId,
            serviceRetouchConfig.serviceId,
          ],
          set: {
            frequencyType,
            frequencyValue,
            isDefault,
            businessDaysOnly,
            updatedAt: new Date(),
          },
        });

      return Ok(undefined);
    } catch (error) {
      return Err({
        type: "DatabaseError",
        operation: "upsert_retouch_config",
        message: `Failed to upsert retouch configuration for service ${serviceId}`,
      });
    }
  }

  /**
   * Calculate retouch date based on configuration
   */
  private static calculateRetouchDate(
    startDate: Date,
    frequencyType: string,
    frequencyValue: number,
    businessDaysOnly: boolean,
    holidays: Date[] = [],
  ): Date {
    const result = new Date(startDate);

    switch (frequencyType) {
      case "days":
        result.setDate(result.getDate() + frequencyValue);
        break;
      case "weeks":
        result.setDate(result.getDate() + frequencyValue * 7);
        break;
      case "months":
        result.setMonth(result.getMonth() + frequencyValue);
        break;
      default:
        throw new Error(`Invalid frequency type: ${frequencyType}`);
    }

    // Adjust for business days if required
    if (businessDaysOnly) {
      this.adjustForBusinessDays(result, holidays);
    }

    // Adjust for holidays
    this.adjustForHolidays(result, holidays);

    return result;
  }

  /**
   * Adjust date to land on a business day (Monday-Friday)
   */
  private static adjustForBusinessDays(date: Date, holidays: Date[]): void {
    while (this.isWeekend(date) || this.isHoliday(date, holidays)) {
      date.setDate(date.getDate() + 1);
    }
  }

  /**
   * Adjust date to avoid holidays
   */
  private static adjustForHolidays(date: Date, holidays: Date[]): void {
    while (this.isHoliday(date, holidays)) {
      date.setDate(date.getDate() + 1);
    }
  }

  /**
   * Check if date is a weekend (Saturday or Sunday)
   */
  private static isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Check if date is a holiday
   */
  private static isHoliday(date: Date, holidays: Date[]): boolean {
    const dateStr = date.toISOString().split("T")[0];
    return holidays.some((holiday) => {
      const holidayStr = holiday.toISOString().split("T")[0];
      return dateStr === holidayStr;
    });
  }
}
