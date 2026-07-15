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
import { CTV_CLAY_ORANGE } from "@/lib/design/centro-tenistico-brand";
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
  Download,
  LogOut,
  ChevronDown,
} from "lucide-react";

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
              : currentTenantSlug === "centro-tenistico"
                ? "px-5 py-2 rounded-lg text-white text-sm font-medium tracking-wide border border-white/15 shadow-none transition-all duration-300 hover:brightness-110 hover:shadow-md"
                : "bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        }
        style={
          !isTransparent && !isDark && currentTenantSlug === "centro-tenistico"
            ? { backgroundColor: CTV_CLAY_ORANGE }
            : undefined
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

  const accentColor = variant === "dark" ? "#FF8000" : "#2563EB";

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
          "flex items-center gap-2 transition-colors rounded-full p-1 pr-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          variant === "dark" || variant === "transparent"
            ? "text-white hover:text-gray-200 focus-visible:ring-white/50 focus-visible:ring-offset-black"
            : "text-gray-700 hover:text-gray-900 focus-visible:ring-blue-500 focus-visible:ring-offset-white",
        )}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm"
          style={{ backgroundColor: accentColor }}
        >
          {initials}
        </div>
        <span className="hidden sm:inline font-medium max-w-[10rem] truncate">
          {user.name?.split(" ")[0] || user.email?.split("@")[0]}
        </span>
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
          user={user}
          initials={initials}
          accentColor={accentColor}
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
  user,
  initials,
  accentColor,
  currentTenantSlug,
  isAdminOrManager,
  isZoSystem,
  pathname,
  onClose,
  onSignOut,
}: {
  menuId: string;
  user: { name?: string | null; email?: string | null };
  initials: string;
  accentColor: string;
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

  return (
    <div
      id={menuId}
      role="menu"
      aria-labelledby="user-menu-button"
      className={cn(
        "absolute right-0 top-full mt-2 z-50",
        "w-[min(320px,calc(100vw-1rem))] max-h-[70vh] overflow-y-auto",
        "rounded-[14px] border border-[#2A2A2A] bg-[#121212]",
        "shadow-[0_16px_40px_rgba(0,0,0,0.45)]",
        "py-3 px-2",
        "origin-top-right transition-all duration-150 ease-out",
        "scrollbar-thin scrollbar-thumb-[#2A2A2A] scrollbar-track-transparent",
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-3 pb-3 border-b border-[#2A2A2A]">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {user.name || user.email?.split("@")[0] || "Usuario"}
          </p>
          <p
            className="text-xs text-gray-400 truncate"
            title={user.email ?? undefined}
          >
            {user.email}
          </p>
        </div>
      </div>

      {/* CUENTA */}
      <MenuSection title="Cuenta">
        <MenuItem
          ref={firstItemRef}
          href={`/t/${tenant}/profile`}
          icon={User}
          label="Mi perfil"
          active={isActive(`/t/${tenant}/profile`)}
          onClick={onClose}
        />
        <MenuItem
          href={`/t/${tenant}/orders`}
          icon={ShoppingBag}
          label="Mis pedidos"
          active={isActive(`/t/${tenant}/orders`)}
          onClick={onClose}
        />
      </MenuSection>

      {/* MARKETING */}
      {isAdminOrManager && (
        <MenuSection title="Marketing">
          <MenuItem
            href={`/t/${tenant}/social`}
            icon={Share2}
            label="Redes sociales"
            active={isActive(`/t/${tenant}/social`)}
            onClick={onClose}
          />
          {isZoSystem && (
            <MenuItem
              href={`/t/${tenant}/social`}
              icon={Megaphone}
              label="Social Post"
              active={isActive(`/t/${tenant}/social`)}
              onClick={onClose}
            />
          )}
        </MenuSection>
      )}

      {/* GESTIÓN */}
      <MenuSection title="Gestión">
        <MenuItem
          href={`/t/${tenant}/clientes`}
          icon={Users}
          label="Clientes"
          active={isActive(`/t/${tenant}/clientes`)}
          onClick={onClose}
        />
        {isAdminOrManager && (
          <MenuItem
            href={`/t/${tenant}/inventory`}
            icon={Package}
            label="Inventario"
            active={isActive(`/t/${tenant}/inventory`)}
            onClick={onClose}
          />
        )}
        <MenuItem
          href={`/t/${tenant}/admin_products`}
          icon={Boxes}
          label="Admin Productos"
          active={isActive(`/t/${tenant}/admin_products`)}
          onClick={onClose}
        />
        <MenuItem
          href={`/t/${tenant}/admin_services`}
          icon={Wrench}
          label="Admin Servicios"
          active={isActive(`/t/${tenant}/admin_services`)}
          onClick={onClose}
        />
        {isZoSystem && (
          <MenuItem
            href="/t/zo-system/admin_tenants"
            icon={Building2}
            label="Admin Tenants"
            active={isActive("/t/zo-system/admin_tenants")}
            onClick={onClose}
          />
        )}
      </MenuSection>

      {/* SISTEMA */}
      {isAdminOrManager && (
        <MenuSection title="Sistema">
          <MenuItem
            href={`/t/${tenant}/finance`}
            icon={Wallet}
            label="Finanzas"
            active={isActive(`/t/${tenant}/finance`)}
            onClick={onClose}
          />
          <MenuItem
            href={`/t/${tenant}/admin/notifications`}
            icon={Bell}
            label="Notificaciones"
            active={isActive(`/t/${tenant}/admin/notifications`)}
            onClick={onClose}
          />
          <MenuItem
            href={`/t/${tenant}/admin/content`}
            icon={Settings}
            label="Configuración"
            active={isActive(`/t/${tenant}/admin/content`)}
            onClick={onClose}
          />
        </MenuSection>
      )}

      {/* PWA install */}
      <div className="px-1">
        <InstallAppMenuItem
          onClick={onClose}
          iconClassName="w-[18px] h-[18px] text-gray-400 group-hover:text-white transition-colors"
          className="group flex items-center gap-3 w-full h-10 px-3 rounded-lg text-sm text-gray-200 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
        />
      </div>

      {/* Divider + logout */}
      <div className="my-2 border-t border-[#2A2A2A]" />
      <div className="px-1">
        <SignOutItem onSignOut={onSignOut} />
      </div>
    </div>
  );
}

function MenuSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2" role="group" aria-label={title}>
      <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
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
  onClick,
}: {
  ref?: React.Ref<HTMLAnchorElement>;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) => {
  return (
    <Link
      ref={ref}
      href={href}
      role="menuitem"
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 w-full h-10 px-3 rounded-lg text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        active
          ? "bg-white/10 text-white"
          : "text-gray-200 hover:bg-white/10 hover:text-white",
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="w-[18px] h-[18px] text-gray-400 group-hover:text-white transition-colors" />
      <span className="font-medium">{label}</span>
      {active && (
        <span
          className="ml-auto w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#FF8000" }}
          aria-hidden="true"
        />
      )}
    </Link>
  );
};

function SignOutItem({ onSignOut }: { onSignOut: () => void }) {
  return (
    <button
      onClick={onSignOut}
      role="menuitem"
      className="group flex items-center gap-3 w-full h-10 px-3 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
    >
      <LogOut className="w-[18px] h-[18px]" />
      <span className="font-medium">Cerrar sesión</span>
    </button>
  );
}
