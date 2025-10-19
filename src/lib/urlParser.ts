import * as cheerio from 'cheerio';

export function extractUrlsFromHtml(htmlContent: string): string[] {
  const $ = cheerio.load(htmlContent);
  const urls = new Set<string>();

  const urlSources = [
    { selector: 'a', attr: 'href' },
    { selector: 'img', attr: 'src' },
    { selector: 'script', attr: 'src' },
    { selector: 'link', attr: 'href' },
    { selector: 'form', attr: 'action' },
    { selector: '[data-url]', attr: 'data-url' },
  ];

  urlSources.forEach(({ selector, attr }) => {
    $(selector).each((_, element) => {
      const url = $(element).attr(attr);
      if (url && !shouldSkipUrl(url)) {
        urls.add(url);
      }
    });
  });

  return Array.from(urls);
}

function shouldSkipUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return true;
  if (url.startsWith('data:')) return true;
  if (url.startsWith('mailto:')) return true;
  if (url.startsWith('tel:')) return true;
  if (url.startsWith('#')) return true;
  if (url.trim() === '') return true;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return true;
  return false;
}