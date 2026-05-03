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
        return Err(ErrorFactories.notFound("Customer", customerId));
      }

      // Determine which service to use for retouch calculation
      const targetServiceId = serviceId || customer[0].retouchServiceId;
      if (!targetServiceId) {
        return Err(
          ErrorFactories.validation(
            "No service specified for retouch calculation",
            "serviceId",
          ),
        );
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
        return Err(
          ErrorFactories.notFound(
            "Retouch configuration",
            `service ${targetServiceId}`,
          ),
        );
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
        return Err(
          ErrorFactories.validation(
            "Customer has no completed visits to calculate retouch date from",
            "visits",
          ),
        );
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
      return Err(
        ErrorFactories.database(
          "calculate_retouch_date",
          `Failed to calculate retouch date for customer ${customerId}`,
          undefined,
          error as Error,
        ),
      );
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

      if (!calculationResult.success) {
        return calculationResult;
      }

      const nextRetouchDate = calculationResult.data;

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
      return Err(
        ErrorFactories.database(
          "update_retouch_date",
          `Failed to update retouch date for customer ${customerId}`,
          undefined,
          error as Error,
        ),
      );
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
        phone: customer.phone ?? "",
        daysUntilRetouch: customer.nextRetouchDate
          ? Math.ceil(
              (customer.nextRetouchDate.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            )
          : null,
      }));

      return Ok(customersWithDays);
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_customers_by_retouch",
          `Failed to get customers by retouch date for tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
      );
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

      return Ok(
        configs.map((c) => ({
          ...c,
          serviceName: c.serviceName ?? "",
        })),
      );
    } catch (error) {
      return Err(
        ErrorFactories.database(
          "get_retouch_configs",
          `Failed to get retouch configurations for tenant ${tenantId}`,
          undefined,
          error as Error,
        ),
      );
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
        return Err(ErrorFactories.notFound("Service", serviceId));
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
      return Err(
        ErrorFactories.database(
          "upsert_retouch_config",
          `Failed to upsert retouch configuration for service ${serviceId}`,
          undefined,
          error as Error,
        ),
      );
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
