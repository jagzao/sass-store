import type { WAInboundMessage } from "../../src/types";

export const fixtures = {
  textBooking: (): WAInboundMessage => ({
    messageId: "wamid.test001",
    phone: "5215512345678",
    type: "text",
    content: "haz cita de manicure mañana a las 3pm",
    timestamp: new Date().toISOString(),
    phoneNumberId: "214863935038316",
  }),

  buttonConfirm: (): WAInboundMessage => ({
    messageId: "wamid.test002",
    phone: "5215512345678",
    type: "button",
    content: "✅ Confirmar",
    buttonPayload: "confirmar",
    timestamp: new Date().toISOString(),
    phoneNumberId: "214863935038316",
  }),

  availabilityQuery: (): WAInboundMessage => ({
    messageId: "wamid.test003",
    phone: "5215512345678",
    type: "text",
    content: "¿tienen disponibilidad el jueves?",
    timestamp: new Date().toISOString(),
    phoneNumberId: "214863935038316",
  }),

  unknownMessage: (): WAInboundMessage => ({
    messageId: "wamid.test004",
    phone: "5215512345678",
    type: "text",
    content: "buenas tardes",
    timestamp: new Date().toISOString(),
    phoneNumberId: "214863935038316",
  }),
};
