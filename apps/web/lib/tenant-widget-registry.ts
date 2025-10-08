import { ComponentType, lazy } from "react";

// Tipos para los widgets por tenant
export interface TenantWidget<P = any> {
  component: ComponentType<P>;
  name: string;
  description?: string;
  requiredProps?: string[];
}

export interface TenantWidgetConfig {
  heroCarousel?: TenantWidget;
  // Futuros widgets se pueden añadir aquí
  // footer?: TenantWidget;
  // navbar?: TenantWidget;
  // productGrid?: TenantWidget;
}

// Registry de widgets por tenant
class TenantWidgetRegistry {
  private static instance: TenantWidgetRegistry;
  private widgets: Map<string, TenantWidgetConfig> = new Map();

  private constructor() {
    this.initializeRegistry();
  }

  public static getInstance(): TenantWidgetRegistry {
    if (!TenantWidgetRegistry.instance) {
      TenantWidgetRegistry.instance = new TenantWidgetRegistry();
    }
    return TenantWidgetRegistry.instance;
  }

  private initializeRegistry() {
    // Wondernails widgets con import dinámico
    this.widgets.set("wondernails", {
      heroCarousel: {
        component: lazy(
          () =>
            import(
              "../components/tenant/wondernails/hero/HeroWondernailsFinal"
            ),
        ),
        name: "HeroWondernailsFinal",
        description:
          "Hero carousel exclusivo para Wondernails con GSAP + Flip (sin drift, VER MÁS funcional, autoplay 5s)",
        requiredProps: [],
      },
    });

    // NomNom widgets con import dinámico
    this.widgets.set("nom-nom", {
      heroCarousel: {
        component: lazy(
          () => import("../components/tenant/nomnom/hero/HeroNomNom"),
        ),
        name: "HeroNomNom",
        description:
          "Hero carousel estilo Starbucks para NomNom Tacos con animaciones suaves",
        requiredProps: [],
      },
    });

    // Delirios widgets con import dinámico
    this.widgets.set("delirios", {
      heroCarousel: {
        component: lazy(() => import("../components/hero/HeroDeliriosWrapper")),
        name: "HeroDelirios",
        description:
          "Hero slider fullscreen con círculos concéntricos, texto circular animado, blur de fondo, GSAP avanzado",
        requiredProps: [],
      },
    });

    // Default/fallback widgets
    this.widgets.set("default", {
      heroCarousel: {
        component: lazy(() =>
          import("../components/ui/carousel-hero").then((module) => ({
            default: module.CarouselHero,
          })),
        ),
        name: "CarouselHero",
        description: "Hero carousel genérico para todos los tenants",
        requiredProps: ["tenantData"],
      },
    });

    // Otros tenants pueden añadirse aquí
    // this.widgets.set('nom-nom', { ... });
    // this.widgets.set('centro-tenistico', { ... });
  }

  public getWidget(
    tenantSlug: string,
    widgetType: keyof TenantWidgetConfig,
  ): TenantWidget | null {
    // Buscar widget específico del tenant
    const tenantWidgets = this.widgets.get(tenantSlug);
    if (tenantWidgets?.[widgetType]) {
      return tenantWidgets[widgetType]!;
    }

    // Fallback al widget default
    const defaultWidgets = this.widgets.get("default");
    return defaultWidgets?.[widgetType] || null;
  }

  public hasCustomWidget(
    tenantSlug: string,
    widgetType: keyof TenantWidgetConfig,
  ): boolean {
    const tenantWidgets = this.widgets.get(tenantSlug);
    return tenantWidgets?.[widgetType] !== undefined;
  }

  public getTenantWidgets(tenantSlug: string): TenantWidgetConfig | null {
    return this.widgets.get(tenantSlug) || null;
  }

  public getAllSupportedTenants(): string[] {
    return Array.from(this.widgets.keys()).filter((key) => key !== "default");
  }

  public registerWidget(
    tenantSlug: string,
    widgetType: keyof TenantWidgetConfig,
    widget: TenantWidget,
  ): void {
    const existingWidgets = this.widgets.get(tenantSlug) || {};
    this.widgets.set(tenantSlug, {
      ...existingWidgets,
      [widgetType]: widget,
    });
  }
}

// Helper hooks para usar el registry
export function useTenantWidget(
  tenantSlug: string,
  widgetType: keyof TenantWidgetConfig,
) {
  const registry = TenantWidgetRegistry.getInstance();
  return registry.getWidget(tenantSlug, widgetType);
}

export function useHasCustomWidget(
  tenantSlug: string,
  widgetType: keyof TenantWidgetConfig,
): boolean {
  const registry = TenantWidgetRegistry.getInstance();
  return registry.hasCustomWidget(tenantSlug, widgetType);
}

// Exportar instancia singleton
export const tenantWidgetRegistry = TenantWidgetRegistry.getInstance();

// Helper para desarrollo/debugging
export function logTenantWidgetInfo(tenantSlug: string) {
  const registry = TenantWidgetRegistry.getInstance();
  const widgets = registry.getTenantWidgets(tenantSlug);

  console.group(`🎨 Tenant Widgets: ${tenantSlug}`);
  if (widgets) {
    Object.entries(widgets).forEach(([type, widget]) => {
      console.log(`${type}: ${widget.name}`, widget.description || "");
    });
  } else {
    console.log("Using default widgets");
  }
  console.groupEnd();
}
