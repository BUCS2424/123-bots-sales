export const DEFAULT_SITE_NAME = '123Bots';
// No bundled default image - an unconfigured logo renders via SiteLogo's
// generic placeholder instead of falling back to any specific artwork.
export const DEFAULT_LOGO_URL = '';
export const DEFAULT_SUPPORT_EMAIL = 'support@123bots.com';

export const buildSiteSettingsState = (payload = {}, loading = false) => ({
  siteName: payload.site_name || DEFAULT_SITE_NAME,
  siteUrl: payload.site_url || '',
  logoUrl: payload.logo_url || DEFAULT_LOGO_URL,
  faviconUrl: payload.favicon_url || '',
  adminEmail: payload.admin_email || '',
  supportEmail: payload.support_email || DEFAULT_SUPPORT_EMAIL,
  maintenanceMode: Boolean(payload.maintenance_mode),
  debugMode: Boolean(payload.debug_mode),
  requireAccountForCheckout: Boolean(payload.require_account_for_checkout),
  requireEmailVerificationForRegistration: payload.require_email_verification_for_registration !== false,
  loading,
});
