/** Mensaje entrante de WhatsApp (payload del webhook de Meta) */
export interface WAInboundMessage {
  messageId: string;
  phone: string;
  type: "text" | "button" | "interactive" | "image" | "audio" | "document";
  content: string;
  buttonPayload?: string;
  interactionId?: string;
  timestamp: string;
  phoneNumberId: string; // identifica al tenant
}

/** Mensaje saliente hacia WhatsApp */
export interface WAOutboundMessage {
  to: string;
  type: "text" | "template" | "interactive";
  text?: string;
  template?: WATemplate;
  interactive?: WAInteractive;
}

export interface WATemplate {
  name: string;
  language: string;
  components?: WATemplateComponent[];
}

export interface WATemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{ type: "text"; text: string }>;
}

export interface WAInteractive {
  type: "button" | "list";
  body: { text: string };
  action: WAInteractiveAction;
}

export interface WAInteractiveAction {
  buttons?: Array<{ type: "reply"; reply: { id: string; title: string } }>;
  button?: string;
  sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

/** Resultado del envío a la WA API */
export interface WASendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}
