import { db } from "@sass-store/database";
import {
  devProjects,
  devSprints,
  devTasks,
  devDailyReports,
  tenantConfigs,
} from "@sass-store/database";
import {
  eq,
  and,
  desc,
  asc,
  sql,
  gte,
  lte,
  isNull,
  or,
  inArray,
} from "drizzle-orm";
import {
  Result,
  Ok,
  Err,
  fromPromise,
  asyncFlatMap,
  map,
} from "@sass-store/core/src/result";
import { DomainError, ErrorFactories } from "@sass-store/core/src/errors/types";

export type DevProjectWithSprints = {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  status: "active" | "completed" | "paused" | "cancelled";
  startDate: string | null;
  targetDate: string | null;
  progress: number;
  sprints: DevSprintSummary[];
};

export type DevSprintSummary = {
  id: string;
  name: string;
  goal: string | null;
  status: "planned" | "active" | "completed" | "cancelled";
  startDate: string | null;
  endDate: string | null;
  tasks: DevTaskSummary[];
};

export type DevTaskSummary = {
  id: string;
  title: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "blocked";
  priority: string;
  assigneeName: string | null;
  completedAt: string | null;
  dueDate: string | null;
};

export type DevDailyReportDto = {
  id: string;
  projectId: string;
  sprintId: string | null;
  reportDate: string;
  summary: string;
  completedItems: string[];
  nextSteps: string[];
  blockers: string[];
  generatedBy: "system" | "manual";
};

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function endOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

export class DevelopmentService {
  static async isDevelopmentTenant(
    tenantId: string,
  ): Promise<Result<boolean, DomainError>> {
    return fromPromise(
      db
        .select({ value: tenantConfigs.value })
        .from(tenantConfigs)
        .where(
          and(
            eq(tenantConfigs.tenantId, tenantId),
            eq(tenantConfigs.category, "business"),
            eq(tenantConfigs.key, "type"),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "is_development_tenant",
          "Error al verificar tipo de negocio del tenant",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    ).then((result) =>
      map(result, (rows) => {
        const value = rows[0]?.value;
        return (
          value === "development" ||
          (typeof value === "object" &&
            value !== null &&
            (value as { value?: unknown }).value === "development")
        );
      }),
    );
  }

  static async listProjects(
    tenantId: string,
  ): Promise<Result<DevProjectWithSprints[], DomainError>> {
    const projectsResult = await fromPromise(
      db
        .select()
        .from(devProjects)
        .where(
          and(
            eq(devProjects.tenantId, tenantId),
            or(
              eq(devProjects.status, "active"),
              eq(devProjects.status, "paused"),
              eq(devProjects.status, "completed"),
            ),
          ),
        )
        .orderBy(asc(devProjects.displayOrder), desc(devProjects.createdAt)),
      (error) =>
        ErrorFactories.database(
          "list_dev_projects",
          "Error al listar proyectos",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );
    if (projectsResult.success === false) return projectsResult;

    const projectIds = projectsResult.data.map((p) => p.id);
    if (projectIds.length === 0) return Ok([]);

    const [sprintsResult, tasksResult] = await Promise.all([
      fromPromise(
        db
          .select()
          .from(devSprints)
          .where(inArray(devSprints.projectId, projectIds))
          .orderBy(asc(devSprints.displayOrder), asc(devSprints.startDate)),
        (error) =>
          ErrorFactories.database(
            "list_dev_sprints",
            "Error al listar sprints",
            undefined,
            error instanceof Error ? error : new Error(String(error)),
          ),
      ),
      fromPromise(
        db
          .select()
          .from(devTasks)
          .where(inArray(devTasks.projectId, projectIds))
          .orderBy(asc(devTasks.displayOrder), desc(devTasks.createdAt)),
        (error) =>
          ErrorFactories.database(
            "list_dev_tasks",
            "Error al listar tareas",
            undefined,
            error instanceof Error ? error : new Error(String(error)),
          ),
      ),
    ]);

    if (sprintsResult.success === false) return sprintsResult;
    if (tasksResult.success === false) return tasksResult;

    const tasksByProject = groupBy(tasksResult.data, (t) => t.projectId);
    const sprintsByProject = groupBy(sprintsResult.data, (s) => s.projectId);
    const tasksBySprint = groupBy(tasksResult.data, (t) => t.sprintId);

    const mapped = projectsResult.data.map((project) => {
      const projectTasks = tasksByProject.get(project.id) ?? [];
      const doneCount = projectTasks.filter((t) => t.status === "done").length;
      const totalCount = projectTasks.length;
      const progress =
        totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

      const sprints = (sprintsByProject.get(project.id) ?? []).map(
        (sprint): DevSprintSummary => ({
          id: sprint.id,
          name: sprint.name,
          goal: sprint.goal,
          status: sprint.status as DevSprintSummary["status"],
          startDate: sprint.startDate ?? null,
          endDate: sprint.endDate ?? null,
          tasks: (tasksBySprint.get(sprint.id) ?? []).map(
            (task): DevTaskSummary => ({
              id: task.id,
              title: task.title,
              status: task.status as DevTaskSummary["status"],
              priority: task.priority,
              assigneeName: task.assigneeName,
              completedAt: task.completedAt?.toISOString() ?? null,
              dueDate: task.dueDate ?? null,
            }),
          ),
        }),
      );

      return {
        id: project.id,
        tenantId: project.tenantId,
        name: project.name,
        description: project.description,
        status: project.status as DevProjectWithSprints["status"],
        startDate: project.startDate ?? null,
        targetDate: project.targetDate ?? null,
        progress,
        sprints,
      };
    });

    return Ok(mapped);
  }

  static async listDailyReports(
    tenantId: string,
    projectId?: string,
    limit = 30,
  ): Promise<Result<DevDailyReportDto[], DomainError>> {
    const conditions = [eq(devDailyReports.tenantId, tenantId)];
    if (projectId) {
      conditions.push(eq(devDailyReports.projectId, projectId));
    }

    return fromPromise(
      db
        .select()
        .from(devDailyReports)
        .where(and(...conditions))
        .orderBy(desc(devDailyReports.reportDate))
        .limit(limit),
      (error) =>
        ErrorFactories.database(
          "list_dev_daily_reports",
          "Error al listar reportes diarios",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    ).then((result) =>
      map(result, (rows) =>
        rows.map(
          (r): DevDailyReportDto => ({
            id: r.id,
            projectId: r.projectId,
            sprintId: r.sprintId,
            reportDate: r.reportDate,
            summary: r.summary,
            completedItems: r.completedItems,
            nextSteps: r.nextSteps,
            blockers: r.blockers,
            generatedBy: r.generatedBy as DevDailyReportDto["generatedBy"],
          }),
        ),
      ),
    );
  }

  static async generateDailyReport(
    tenantId: string,
    projectId: string,
    reportDate: Date,
  ): Promise<Result<DevDailyReportDto, DomainError>> {
    const projectResult = await fromPromise(
      db
        .select({ id: devProjects.id, name: devProjects.name })
        .from(devProjects)
        .where(
          and(
            eq(devProjects.tenantId, tenantId),
            eq(devProjects.id, projectId),
          ),
        )
        .limit(1),
      (error) =>
        ErrorFactories.database(
          "find_dev_project",
          "Error al buscar proyecto",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );
    if (projectResult.success === false) return projectResult;
    if (!projectResult.data[0]) {
      return Err(ErrorFactories.notFound("Proyecto", projectId));
    }

    const projectName = projectResult.data[0].name;
    const dayStart = startOfDay(reportDate);
    const dayEnd = endOfDay(reportDate);

    const tasksResult = await fromPromise(
      db
        .select({
          id: devTasks.id,
          title: devTasks.title,
          status: devTasks.status,
          completedAt: devTasks.completedAt,
          sprintId: devTasks.sprintId,
        })
        .from(devTasks)
        .where(
          and(
            eq(devTasks.tenantId, tenantId),
            eq(devTasks.projectId, projectId),
            or(
              and(
                gte(devTasks.completedAt, dayStart),
                lte(devTasks.completedAt, dayEnd),
              ),
              and(
                gte(devTasks.updatedAt, dayStart),
                lte(devTasks.updatedAt, dayEnd),
                eq(devTasks.status, "done"),
                isNull(devTasks.completedAt),
              ),
            ),
          ),
        ),
      (error) =>
        ErrorFactories.database(
          "find_daily_tasks",
          "Error al buscar tareas del día",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );
    if (tasksResult.success === false) return tasksResult;

    const completedTasks = tasksResult.data.filter((t) => t.status === "done");
    const completedItems = completedTasks.map((t) => t.title);

    const activeSprintId =
      completedTasks.find((t) => t.sprintId)?.sprintId ?? null;

    const pendingResult = await fromPromise(
      db
        .select({ title: devTasks.title, status: devTasks.status })
        .from(devTasks)
        .where(
          and(
            eq(devTasks.tenantId, tenantId),
            eq(devTasks.projectId, projectId),
            or(eq(devTasks.status, "todo"), eq(devTasks.status, "in_progress")),
          ),
        )
        .orderBy(asc(devTasks.displayOrder))
        .limit(5),
      (error) =>
        ErrorFactories.database(
          "find_next_steps",
          "Error al buscar siguientes pasos",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );
    if (pendingResult.success === false) return pendingResult;

    const nextSteps = pendingResult.data.map(
      (t) =>
        `${t.title} (${t.status === "in_progress" ? "en progreso" : "pendiente"})`,
    );

    const summary = `Reporte diario para ${projectName}: ${completedItems.length} tarea(s) completada(s).`;

    const upsertResult = await fromPromise(
      db
        .insert(devDailyReports)
        .values({
          tenantId,
          projectId,
          sprintId: activeSprintId,
          reportDate: reportDate.toISOString().split("T")[0],
          summary,
          completedItems,
          nextSteps,
          blockers: [],
          generatedBy: "system",
        })
        .onConflictDoUpdate({
          target: [
            devDailyReports.tenantId,
            devDailyReports.projectId,
            devDailyReports.reportDate,
          ],
          set: {
            sprintId: activeSprintId,
            summary,
            completedItems,
            nextSteps,
            blockers: [],
            generatedBy: "system",
            updatedAt: new Date(),
          },
        })
        .returning(),
      (error) =>
        ErrorFactories.database(
          "upsert_daily_report",
          "Error al guardar reporte diario",
          undefined,
          error instanceof Error ? error : new Error(String(error)),
        ),
    );
    if (upsertResult.success === false) return upsertResult;
    const row = upsertResult.data[0];
    if (!row) {
      return Err(
        ErrorFactories.database("upsert_daily_report", "Sin respuesta"),
      );
    }

    return Ok({
      id: row.id,
      projectId: row.projectId,
      sprintId: row.sprintId,
      reportDate: row.reportDate,
      summary: row.summary,
      completedItems: row.completedItems,
      nextSteps: row.nextSteps,
      blockers: row.blockers,
      generatedBy: row.generatedBy as DevDailyReportDto["generatedBy"],
    });
  }
}

function groupBy<T, K>(items: T[], keyFn: (item: T) => K | null): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    if (key === null) continue;
    const list = map.get(key);
    if (list) {
      list.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}
