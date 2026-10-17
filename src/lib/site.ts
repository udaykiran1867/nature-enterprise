export const SITE = {
  name: "Nature Enterprises",
  tagline: "Made in Tulunad, Inspired by Tradition",
  description: "Homemade masalas and spice powders from Tulunad that bring authentic taste to your everyday cooking. Order easily on WhatsApp.",
  // Placeholders until the owner provides verified details.
  phone: "[Business phone to be added]",
  email: "[Contact email to be added]",
  address: "[Business address to be added]",
  heroImage: null as string | null, // e.g. "/hero.jpg" once real photography is available
};

export const NAV = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

/** Returns digits-only WhatsApp number, or null if not configured. Never invents a number. */
export function getWhatsAppNumber(): string | null {
  const n = process.env.WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, "") ?? "";
  return /^\d{10,15}$/.test(n) && !/^91X+$/i.test(process.env.WHATSAPP_BUSINESS_NUMBER ?? "") ? n : null;
}
