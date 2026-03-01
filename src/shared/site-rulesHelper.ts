import { UserSettings, SiteRule } from '@/types/settings';

export function getActiveSiteRule(settings: UserSettings): SiteRule | undefined {
  if (!settings.siteRules || settings.siteRules.length === 0) return undefined;
  
  const currentHostname = window.location.hostname;
  
  return settings.siteRules.find(rule => {
    // E.g., rule.domain is "wikipedia.org", current is "en.wikipedia.org" -> match
    return currentHostname === rule.domain || currentHostname.endsWith('.' + rule.domain);
  });
}
