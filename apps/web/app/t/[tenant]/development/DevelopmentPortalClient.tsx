"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import type {
  DevProjectWithSprints,
  DevDailyReportDto,
} from "@/lib/services/development-service";
import type { CustomerBookingHistoryItem } from "@/lib/services/customer-booking-history-service";

interface DevelopmentPortalClientProps {
  tenantName: string;
  tenantSlug: string;
  businessType: string | null;
  projects: DevProjectWithSprints[];
  dailyReports: DevDailyReportDto[];
  bookingHistory: CustomerBookingHistoryItem[];
}

const statusLabels: Record<string, string> = {
  active: "Activo",
  completed: "Completado",
  paused: "Pausado",
  cancelled: "Cancelado",
  planned: "Planificado",
  backlog: "Backlog",
  todo: "Por hacer",
  in_progress: "En progreso",
  in_review: "En revisión",
  done: "Hecho",
  blocked: "Bloqueado",
  pending: "Pendiente",
  confirmed: "Confirmada",
};

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  cancelled: "bg-red-100 text-red-800",
  planned: "bg-gray-100 text-gray-800",
  backlog: "bg-gray-100 text-gray-800",
  todo: "bg-purple-100 text-purple-800",
  in_progress: "bg-blue-100 text-blue-800",
  in_review: "bg-orange-100 text-orange-800",
  done: "bg-green-100 text-green-800",
  blocked: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
};

function BookingHistoryView({
  tenantName,
  bookingHistory,
}: {
  tenantName: string;
  bookingHistory: CustomerBookingHistoryItem[];
}) {
  return (
    <div
      data-testid="development-portal-client"
      className="container mx-auto px-4 py-8 space-y-8"
    >
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Historial de citas
        </h1>
        <p className="text-muted-foreground">
          {tenantName} - tus citas pasadas y próximas
        </p>
      </header>

      {bookingHistory.length === 0 ? (
        <Card data-testid="empty-bookings-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            Aún no tienes citas registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {bookingHistory.map((booking) => (
            <Card key={booking.id} data-testid={`booking-card-${booking.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {booking.serviceName}
                  </CardTitle>
                  <Badge
                    className={
                      statusColors[booking.status] ||
                      "bg-gray-100 text-gray-800"
                    }
                  >
                    {statusLabels[booking.status] || booking.status}
                  </Badge>
                </div>
                <CardDescription>
                  {new Date(booking.startTime).toLocaleDateString("es-MX", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  ·{" "}
                  {new Date(booking.startTime).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {" - "}
                  {new Date(booking.endTime).toLocaleTimeString("es-MX", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Total: ${booking.totalPrice.toFixed(2)}
                </p>
                {booking.notes && (
                  <p className="text-sm text-muted-foreground">
                    Notas: {booking.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DevelopmentPortalView({
  tenantName,
  projects,
  dailyReports,
}: {
  tenantName: string;
  projects: DevProjectWithSprints[];
  dailyReports: DevDailyReportDto[];
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null,
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) ?? projects[0],
    [projects, selectedProjectId],
  );

  const projectReports = useMemo(
    () =>
      dailyReports.filter(
        (r) => !selectedProject || r.projectId === selectedProject.id,
      ),
    [dailyReports, selectedProject],
  );

  return (
    <div
      data-testid="development-portal-client"
      className="container mx-auto px-4 py-8 space-y-8"
    >
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Progreso de desarrollo
        </h1>
        <p className="text-muted-foreground">
          {tenantName} - roadmap, sprints y reportes diarios
        </p>
      </header>

      {projects.length === 0 ? (
        <Card data-testid="empty-projects-card">
          <CardContent className="py-12 text-center text-muted-foreground">
            Aún no hay proyectos configurados.
          </CardContent>
        </Card>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                data-testid={`project-card-${project.id}`}
                className={`cursor-pointer transition-shadow hover:shadow-md ${
                  selectedProjectId === project.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedProjectId(project.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <Badge
                      className={
                        statusColors[project.status] ||
                        "bg-gray-100 text-gray-800"
                      }
                    >
                      {statusLabels[project.status] || project.status}
                    </Badge>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProgressBar value={project.progress} size="sm" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{project.sprints.length} sprint(s)</span>
                    <span>
                      {project.sprints.reduce(
                        (acc, s) => acc + s.tasks.length,
                        0,
                      )}{" "}
                      tarea(s)
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {selectedProject && (
            <section className="space-y-4" data-testid="roadmap-section">
              <h2 className="text-2xl font-semibold">
                Roadmap: {selectedProject.name}
              </h2>
              <div className="space-y-4">
                {selectedProject.sprints.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Este proyecto aún no tiene sprints.
                    </CardContent>
                  </Card>
                ) : (
                  selectedProject.sprints.map((sprint) => (
                    <Card
                      key={sprint.id}
                      data-testid={`sprint-card-${sprint.id}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {sprint.name}
                          </CardTitle>
                          <Badge
                            className={
                              statusColors[sprint.status] ||
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {statusLabels[sprint.status] || sprint.status}
                          </Badge>
                        </div>
                        {sprint.goal && (
                          <CardDescription>{sprint.goal}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        {sprint.tasks.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Sin tareas en este sprint.
                          </p>
                        ) : (
                          <ul className="divide-y">
                            {sprint.tasks.map((task) => (
                              <li
                                key={task.id}
                                data-testid={`task-row-${task.id}`}
                                className="py-3 flex items-start justify-between gap-4"
                              >
                                <div className="space-y-1">
                                  <p className="font-medium">{task.title}</p>
                                  {task.assigneeName && (
                                    <p className="text-xs text-muted-foreground">
                                      Responsable: {task.assigneeName}
                                    </p>
                                  )}
                                </div>
                                <Badge
                                  className={
                                    statusColors[task.status] ||
                                    "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {statusLabels[task.status] || task.status}
                                </Badge>
                              </li>
                            ))}
                          </ul>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </section>
          )}

          <section className="space-y-4" data-testid="daily-section">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Sprint Daily</h2>
              <a
                href="/t/zo-system/services"
                className="text-sm text-primary hover:underline"
              >
                Agendar consulta
              </a>
            </div>
            {projectReports.length === 0 ? (
              <Card data-testid="empty-daily-card">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Aún no hay reportes diarios para este proyecto.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {projectReports.map((report) => (
                  <Card key={report.id} data-testid={`daily-card-${report.id}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">
                        {new Date(report.reportDate).toLocaleDateString(
                          "es-MX",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </CardTitle>
                      <CardDescription>{report.summary}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {report.completedItems.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">
                            Completado hoy
                          </h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {report.completedItems.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {report.nextSteps.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold mb-1">
                            Próximos pasos
                          </h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {report.nextSteps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {report.blockers.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-destructive mb-1">
                            Bloqueos
                          </h4>
                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                            {report.blockers.map((blocker, i) => (
                              <li key={i}>{blocker}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function DevelopmentPortalClient({
  tenantName,
  businessType,
  projects,
  dailyReports,
  bookingHistory,
}: DevelopmentPortalClientProps) {
  if (businessType === "salud y belleza") {
    return (
      <BookingHistoryView
        tenantName={tenantName}
        bookingHistory={bookingHistory}
      />
    );
  }

  return (
    <DevelopmentPortalView
      tenantName={tenantName}
      projects={projects}
      dailyReports={dailyReports}
    />
  );
}
