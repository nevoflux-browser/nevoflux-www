import { getRelativeLocaleUrl } from 'astro:i18n';
import enTranslation from '~/i18n/en/translation.json';
import zhTranslation from '~/i18n/zh/translation.json';

export type Locale = 'en' | 'zh';

const translations: Record<Locale, typeof enTranslation> = {
  en: enTranslation,
  zh: { ...enTranslation, ...zhTranslation },
};

export function getLocale(url: URL): Locale {
  const [, locale] = url.pathname.split('/');
  if (locale === 'zh') return 'zh';
  return 'en';
}

export function getUI(locale: Locale) {
  return translations[locale];
}

export function getPath(locale: Locale, path: string) {
  return getRelativeLocaleUrl(locale, path);
}

export function getStaticPaths() {
  return [{ params: { locale: undefined } }, { params: { locale: 'zh' } }];
}

export function getAlternateLocale(locale: Locale): Locale {
  return locale === 'en' ? 'zh' : 'en';
}

export function getAlternateUrl(url: URL): string {
  const locale = getLocale(url);
  if (locale === 'en') {
    // Currently on default (no prefix) → switch to /zh
    return '/zh' + url.pathname;
  }
  // Currently on /zh → strip prefix
  return url.pathname.replace(/^\/zh/, '') || '/';
}

/** BCP-47 language tag for the `<html lang>` attribute and hreflang annotations. */
export const localeLang: Record<Locale, string> = {
  en: 'en',
  zh: 'zh-CN',
};

/**
 * The equivalent pathname of the current page in every locale, used to emit
 * `<link rel="alternate" hreflang>` and the canonical URL. The `/zh` prefix is
 * stripped to recover the locale-agnostic base path, then re-applied for zh.
 */
export function getLocalizedPathnames(url: URL): Record<Locale, string> {
  const base = url.pathname.replace(/^\/zh(?=\/|$)/, '') || '/';
  return {
    en: base,
    zh: base === '/' ? '/zh/' : `/zh${base}`,
  };
}
