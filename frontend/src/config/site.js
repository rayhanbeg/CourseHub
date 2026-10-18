const env = import.meta.env;

export const siteConfig = {
  name: env.VITE_SITE_NAME || 'CourseHub',
  contactEmail: env.VITE_CONTACT_EMAIL || '',
  contactPhone: env.VITE_CONTACT_PHONE || '',
  contactAddress: env.VITE_CONTACT_ADDRESS || '',
};
