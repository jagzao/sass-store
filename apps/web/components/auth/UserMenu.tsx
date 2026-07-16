"use client";

import { useSession, signOut } from "next-auth/react";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
  type KeyboardEvent,
} from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { InstallAppMenuItem } from "@/components/pwa/InstallAppButton";
import {
  User,
  ShoppingBag,
  Share2,
  Megaphone,
  Users,
  Package,
  Boxes,
  Wrench,
  Building2,
  Wallet,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface TenantPalette {
  mode: "light" | "dark";
  bg: string;
  fg: string;
  mutedFg: string;
  border: string;
  primary: string;
  error: string;
}

const tenantPalettes: Record<string, TenantPalette> = {
  wondernails: {
    mode: "light",
    bg: "#FAF8F5",
    fg: "#1F1F1F",
    mutedFg: "#6B5C47",
    border: "#E8E0D5",
    primary: "#C5A059",
    error: "#DC2626",
  },
  "centro-tenistico": {
    mode: "dark",
    bg: "#1A1208",
    fg: "#F5F0E8",
    mutedFg: "#A89B8C",
    border: "#3D3228",
    primary: "#D47535",
    error: "#EF4444",
  },
  "zo-system": {
    mode: "light",
    bg: "#FFFFFF",
    fg: "#111827",
    mutedFg: "#6B7280",
    border: "#E5E7EB",
    primary: "#DC2626",
    error: "#DC2626",
  },
};

function resolveTenantPalette(tenantSlug: string | null): TenantPalette {
  return (
    tenantPalettes[tenantSlug ?? ""] || {
      mode: "light",
      bg: "#FFFFFF",
      fg: "#111827",
      mutedFg: "#6B7280",
      border: "#E5E7EB",
      primary: "#2563EB",
      error: "#EF4444",
    }
  );
}

export default function UserMenu({
  tenantSlug,
  variant = "default",
}: {
  tenantSlug?: string;
  variant?: "default" | "transparent" | "dark";
}) {
  const { data: session, status } = useSession();
  const loading = status === "loading";
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const pathname = usePathname();

  const currentTenantSlug =
    tenantSlug ||
    (pathname?.startsWith("/t/") ? pathname.split("/")[2] : null) ||
    (typeof window !== "undefined"
      ? localStorage.getItem("currentTenant")
      : null);

  const palette = resolveTenantPalette(currentTenantSlug);

  const openMenu = useCallback(() => setIsOpen(true), []);
  const closeMenu = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);
  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Close on click outside and return focus to trigger.
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  // Prevent body scroll when the mobile menu is open.
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    closeMenu();
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentTenant");
    }
    const redirectUrl = currentTenantSlug ? `/t/${currentTenantSlug}` : "/";
    await signOut({ callbackUrl: redirectUrl });
  };

  if (loading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />;
  }

  if (!session?.user) {
    const isTransparent = variant === "transparent";
    const isDark = variant === "dark";
    return (
      <a
        href={
          currentTenantSlug
            ? `/t/${currentTenantSlug}/login`
            : "/t/zo-system/login"
        }
        className={
          isTransparent
            ? currentTenantSlug === "wondernails"
              ? "px-4 py-2 rounded border border-[#C5A059] text-[#C5A059] bg-transparent hover:bg-[#C5A059] hover:text-white transition-colors font-medium"
              : "px-4 py-2 rounded border border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-black transition-colors font-medium"
            : isDark
              ? "bg-[#FF8000] text-black hover:bg-[#FF5500] hover:shadow-[0_0_15px_rgba(255,128,0,0.4)] px-4 py-2 rounded transition-all font-bold"
              : "bg-[var(--color-primary)] text-white px-4 py-2 rounded hover:opacity-90 transition-all"
        }
      >
        Iniciar Sesión
      </a>
    );
  }

  const user = session.user;
  const userRole = (user as { role?: string }).role;
  const isAdminOrManager = userRole === "Admin" || userRole === "Gerente";
  const isZoSystem = currentTenantSlug === "zo-system";

  const initials =
    user.name?.charAt(0)?.toUpperCase() ||
    user.email?.charAt(0).toUpperCase() ||
    "?";

  const accentColor = variant === "dark" ? "#FF8000" : palette.primary;

  const emailColor = palette.mutedFg;

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        id="user-menu-button"
        onClick={toggleMenu}
        onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
          if (e.key === "ArrowDown" && !isOpen) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          "flex items-center gap-3 transition-colors rounded-full p-1 pr-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          variant === "dark" || variant === "transparent"
            ? "text-white hover:bg-white/10 focus-visible:ring-white/50 focus-visible:ring-offset-black"
            : "text-gray-700 hover:bg-black/5 focus-visible:ring-blue-500 focus-visible:ring-offset-white",
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: accentColor }}
        >
          {initials}
        </div>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="font-semibold text-sm max-w-[12rem] truncate">
            {user.name || user.email?.split("@")[0] || "Usuario"}
          </span>
          <span
            className="text-xs max-w-[12rem] truncate"
            style={{ color: emailColor }}
          >
            {user.email}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen && (
        <DropdownPanel
          menuId={menuId}
          palette={palette}
          currentTenantSlug={currentTenantSlug}
          isAdminOrManager={isAdminOrManager}
          isZoSystem={isZoSystem}
          pathname={pathname}
          onClose={closeMenu}
          onSignOut={handleSignOut}
        />
      )}
    </div>
  );
}

function DropdownPanel({
  menuId,
  palette,
  currentTenantSlug,
  isAdminOrManager,
  isZoSystem,
  pathname,
  onClose,
  onSignOut,
}: {
  menuId: string;
  palette: TenantPalette;
  currentTenantSlug: string | null;
  isAdminOrManager: boolean;
  isZoSystem: boolean;
  pathname: string | null;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const firstItemRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    firstItemRef.current?.focus();
  }, []);

  const tenant = currentTenantSlug ?? "zo-system";
  const isActive = (href: string) => pathname === href;
  const { bg, fg, mutedFg, border, primary, error } = palette;
  const hoverBg = `${primary}2E`;
  const activeBg = `${primary}3D`;
  const focusRing = `0 0 0 2px ${primary}66`;

  return (
    <div
      id={menuId}
      role="menu"
      aria-labelledby="user-menu-button"
      style={{ backgroundColor: bg, borderColor: border, color: fg }}
      className={cn(
        "absolute right-0 top-full mt-2 z-50",
        "w-[min(320px,calc(100vw-1rem))] max-h-[70vh]",
        "rounded-[14px] border",
        "shadow-[0_16px_40px_rgba(0,0,0,0.45)]",
        "py-3 px-2",
        "origin-top-right transition-all duration-150 ease-out",
        "custom-scrollbar-dark",
      )}
    >
      {/* CUENTA */}
      <MenuSection title="Cuenta" mutedFg={mutedFg}>
        <MenuItem
          ref={firstItemRef}
          href={`/t/${tenant}/profile`}
          icon={User}
          label="Mi perfil"
          active={isActive(`/t/${tenant}/profile`)}
          palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
          onClick={onClose}
        />
        <MenuItem
          href={`/t/${tenant}/orders`}
          icon={ShoppingBag}
          label="Mis pedidos"
          active={isActive(`/t/${tenant}/orders`)}
          palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
          onClick={onClose}
        />
      </MenuSection>

      {/* MARKETING */}
      {isAdminOrManager && (
        <MenuSection title="Marketing" mutedFg={mutedFg}>
          <MenuItem
            href={`/t/${tenant}/social`}
            icon={Share2}
            label="Redes sociales"
            active={isActive(`/t/${tenant}/social`)}
            palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
            onClick={onClose}
          />
          {isZoSystem && (
            <MenuItem
              href={`/t/${tenant}/social`}
              icon={Megaphone}
              label="Social Post"
              active={isActive(`/t/${tenant}/social`)}
              palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
              onClick={onClose}
            />
          )}
        </MenuSection>
      )}

      {/* GESTIÓN */}
      <MenuSection title="Gestión" mutedFg={mutedFg}>
        <MenuItem
          href={`/t/${tenant}/clientes`}
          icon={Users}
          label="Clientes"
          active={isActive(`/t/${tenant}/clientes`)}
          palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
          onClick={onClose}
        />
        {isAdminOrManager && (
          <MenuItem
            href={`/t/${tenant}/inventory`}
            icon={Package}
            label="Inventario"
            active={isActive(`/t/${tenant}/inventory`)}
            palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
            onClick={onClose}
          />
        )}
        <MenuItem
          href={`/t/${tenant}/admin_products`}
          icon={Boxes}
          label="Admin Productos"
          active={isActive(`/t/${tenant}/admin_products`)}
          palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
          onClick={onClose}
        />
        <MenuItem
          href={`/t/${tenant}/admin_services`}
          icon={Wrench}
          label="Admin Servicios"
          active={isActive(`/t/${tenant}/admin_services`)}
          palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
          onClick={onClose}
        />
        {isZoSystem && (
          <MenuItem
            href="/t/zo-system/admin_tenants"
            icon={Building2}
            label="Admin Tenants"
            active={isActive("/t/zo-system/admin_tenants")}
            palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
            onClick={onClose}
          />
        )}
      </MenuSection>

      {/* SISTEMA */}
      {isAdminOrManager && (
        <MenuSection title="Sistema" mutedFg={mutedFg}>
          <MenuItem
            href={`/t/${tenant}/finance`}
            icon={Wallet}
            label="Finanzas"
            active={isActive(`/t/${tenant}/finance`)}
            palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
            onClick={onClose}
          />
          <MenuItem
            href={`/t/${tenant}/admin/notifications`}
            icon={Bell}
            label="Notificaciones"
            active={isActive(`/t/${tenant}/admin/notifications`)}
            palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
            onClick={onClose}
          />
          <MenuItem
            href={`/t/${tenant}/admin/content`}
            icon={Settings}
            label="Configuración"
            active={isActive(`/t/${tenant}/admin/content`)}
            palette={{ fg, mutedFg, primary, activeBg, hoverBg, focusRing }}
            onClick={onClose}
          />
        </MenuSection>
      )}

      {/* PWA install */}
      <div className="px-1">
        <InstallAppMenuItem
          onClick={onClose}
          iconClassName="w-[18px] h-[18px] text-[var(--color-muted-foreground,#9CA3AF)] group-hover:text-[var(--color-foreground,#FFFFFF)] transition-colors"
          className="group flex items-center gap-3 w-full h-10 px-3 rounded-lg text-sm text-[var(--color-foreground,#E5E7EB)] hover:bg-[var(--color-muted,#374151)]/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring,#3B82F6)]/30"
        />
      </div>

      {/* Divider + logout */}
      <div className="my-2 border-t" style={{ borderColor: border }} />
      <div className="px-1">
        <SignOutItem
          onSignOut={onSignOut}
          error={error}
          hoverBg={`${error}1A`}
          focusRing={`0 0 0 2px ${error}4D`}
        />
      </div>
    </div>
  );
}

function MenuSection({
  title,
  mutedFg,
  children,
}: {
  title: string;
  mutedFg: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2" role="group" aria-label={title}>
      <p
        className="px-3 text-[11px] font-semibold uppercase tracking-wider mb-1"
        style={{ color: mutedFg }}
      >
        {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

const MenuItem = ({
  ref,
  href,
  icon: Icon,
  label,
  active,
  palette,
  onClick,
}: {
  ref?: React.Ref<HTMLAnchorElement>;
  href: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  label: string;
  active: boolean;
  palette: {
    fg: string;
    mutedFg: string;
    primary: string;
    activeBg: string;
    hoverBg: string;
    focusRing: string;
  };
  onClick: () => void;
}) => {
  return (
    <Link
      ref={ref}
      href={href}
      role="menuitem"
      onClick={onClick}
      style={{
        color: active ? palette.primary : palette.fg,
        backgroundColor: active ? palette.activeBg : undefined,
      }}
      className="group flex items-center gap-3 w-full h-10 px-3 rounded-lg text-sm transition-colors focus-visible:outline-none"
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = palette.focusRing;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = palette.hoverBg;
        e.currentTarget.style.color = palette.fg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = active ? palette.activeBg : "";
        e.currentTarget.style.color = active ? palette.primary : palette.fg;
      }}
      aria-current={active ? "page" : undefined}
    >
      <Icon
        className="w-[18px] h-[18px] transition-colors"
        style={{ color: active ? palette.primary : palette.mutedFg }}
      />
      <span className="font-medium">{label}</span>
      {active && (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: palette.primary }}
          aria-hidden="true"
        />
      )}
    </Link>
  );
};

function SignOutItem({
  onSignOut,
  error,
  hoverBg,
  focusRing,
}: {
  onSignOut: () => void;
  error: string;
  hoverBg: string;
  focusRing: string;
}) {
  return (
    <button
      onClick={onSignOut}
      role="menuitem"
      style={{ color: error }}
      className="group flex items-center gap-3 w-full h-10 px-3 rounded-lg text-sm transition-colors focus-visible:outline-none"
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = focusRing;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = "";
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "";
      }}
    >
      <LogOut className="w-[18px] h-[18px]" style={{ color: error }} />
      <span className="font-medium">Cerrar sesión</span>
    </button>
  );
}
