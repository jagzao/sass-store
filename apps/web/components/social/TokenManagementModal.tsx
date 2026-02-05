"use client";

import { useState, useEffect } from "react";

interface TokenManagementModalProps {
  tenant: string;
  isOpen: boolean;
  onClose: () => void;
  variant?: "default" | "tech";
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", emoji: "📘" },
  { id: "instagram", name: "Instagram", emoji: "📷" },
  { id: "linkedin", name: "LinkedIn", emoji: "💼" },
  { id: "x", name: "X (Twitter)", emoji: "🐦" },
  { id: "tiktok", name: "TikTok", emoji: "🎵" },
];

export default function TokenManagementModal({
  tenant,
  isOpen,
  onClose,
  variant = "default",
}: TokenManagementModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [accountLabel, setAccountLabel] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connections, setConnections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    try {
      const response = await fetch(`/api/v1/social/tokens?tenant=${tenant}`);
      if (response.ok) {
        const data = await response.json();
        const connMap: Record<string, boolean> = {};
        if (data.data) {
          data.data.forEach((item: any) => {
            if (item.credentialStatus === "ok") {
              connMap[item.channel] = true;
            }
          });
        }
        setConnections(connMap);
      }
    } catch (error) {
      console.error("Error fetching connections:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/social/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant,
          platform: selectedPlatform,
          accessToken,
          accountLabel,
        }),
      });

      if (!response.ok) throw new Error("Failed to save token");

      alert("Token guardado correctamente");
      setAccessToken("");
      setAccountLabel("");
      setSelectedPlatform(null);
      fetchConnections();
    } catch (error) {
      console.error("Error saving token:", error);
      alert("Error al guardar el token");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const isTech = variant === "tech";
  const styles = {
    modal: isTech ? "bg-[#111111] border border-gray-800" : "bg-white",
    text: isTech ? "text-gray-200" : "text-gray-900",
    textSecondary: isTech ? "text-gray-400" : "text-gray-500",
    inputBg: isTech ? "bg-[#1a1a1a]" : "bg-white",
    inputBorder: isTech ? "border-gray-700" : "border-gray-300",
    buttonPrimary: isTech
      ? "bg-[#FF8000] text-black hover:bg-[#FF8000]/90"
      : "bg-blue-600 text-white hover:bg-blue-700",
    buttonSecondary: isTech
      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200",
    itemActive: isTech
      ? "bg-[#FF8000]/10 border-[#FF8000]"
      : "bg-blue-50 border-blue-500",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div
        className={`w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${styles.modal}`}
      >
        <div className="p-6 border-b border-gray-700/10 flex justify-between items-center">
          <h2 className={`text-xl font-bold ${styles.text}`}>
            Cuentas Conectadas
          </h2>
          <button onClick={onClose} className={styles.textSecondary}>
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex gap-6">
          {/* Platform List */}
          <div className="w-1/3 space-y-2">
            {PLATFORMS.map((p) => {
              const isConnected = connections[p.id];
              const isSelected = selectedPlatform === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all flex items-center justify-between ${
                    isSelected
                      ? styles.itemActive
                      : `${isTech ? "border-gray-800 hover:bg-gray-800" : "border-gray-200 hover:bg-gray-50"}`
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{p.emoji}</span>
                    <span className={styles.text}>{p.name}</span>
                  </span>
                  {isConnected && (
                    <span
                      className="w-2 h-2 rounded-full bg-green-500"
                      title="Conectado"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Area */}
          <div className="w-2/3">
            {selectedPlatform ? (
              <form onSubmit={handleSave} className="space-y-4">
                <h3 className={`text-lg font-medium ${styles.text} mb-4`}>
                  Configurar{" "}
                  {PLATFORMS.find((p) => p.id === selectedPlatform)?.name}
                </h3>

                <div>
                  <label
                    className={`block text-sm font-medium ${styles.textSecondary} mb-1`}
                  >
                    Etiqueta de la cuenta (Opcional)
                  </label>
                  <input
                    type="text"
                    value={accountLabel}
                    onChange={(e) => setAccountLabel(e.target.value)}
                    placeholder="Ej. Página Principal"
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.inputBg} ${styles.inputBorder} ${styles.text}`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium ${styles.textSecondary} mb-1`}
                  >
                    Access Token
                  </label>
                  <textarea
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Pegar token de acceso aquí..."
                    rows={4}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${styles.inputBg} ${styles.inputBorder} ${styles.text}`}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este token se guardará de forma segura y se usará para
                    publicar contenido.
                  </p>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${styles.buttonPrimary} disabled:opacity-50`}
                  >
                    {isLoading ? "Guardando..." : "Guardar Conexión"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="h-full flex items-center justify-center text-center opacity-50">
                <div>
                  <div className="text-4xl mb-4">🔗</div>
                  <p className={styles.textSecondary}>
                    Selecciona una plataforma para configurar
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
