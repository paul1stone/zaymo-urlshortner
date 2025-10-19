// app/api/shorten/route.ts
import { extractUrlsFromHtml } from '@/lib/urlParser';
import { prisma } from '@/lib/db';
import { nanoid } from 'nanoid';
import * as cheerio from 'cheerio';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const { htmlContent, baseUrl = 'https://zaymo-urlshortner.vercel.app' } = body;

    if (!htmlContent || typeof htmlContent !== 'string') {
      return Response.json(
        { success: false, error: 'Missing or invalid htmlContent' },
        { status: 400 }
      );
    }

    // 1. Extract all URLs from HTML
    const uniqueUrls = extractUrlsFromHtml(htmlContent);

    // 2. Batch database operations
    const existingUrls = await prisma.shortenedUrl.findMany({
      where: { originalUrl: { in: uniqueUrls } },
    });

    const existingMap = new Map(existingUrls.map(u => [u.originalUrl, u]));
    const urlsToCreate = uniqueUrls.filter(url => !existingMap.has(url));

    if (urlsToCreate.length > 0) {
      await prisma.shortenedUrl.createMany({
        data: urlsToCreate.map(url => ({
          code: nanoid(6),
          originalUrl: url,
        })),
      });
    }

    const allUrls = await prisma.shortenedUrl.findMany({
      where: { originalUrl: { in: uniqueUrls } },
    });

    const urlMapping = new Map(
      allUrls.map(url => [
        url.originalUrl,
        {
          originalUrl: url.originalUrl,
          shortUrl: `${baseUrl}/r/${url.code}`,
          code: url.code,
        },
      ])
    );

    // 3. Replace URLs in HTML
    let modifiedHtml = htmlContent;
    const $ = cheerio.load(modifiedHtml);

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
        const originalUrl = $(element).attr(attr);
        if (originalUrl && urlMapping.has(originalUrl)) {
          const mapping = urlMapping.get(originalUrl)!;
          $(element).attr(attr, mapping.shortUrl);
        }
      });
    });

    modifiedHtml = $.html();

    // 4. Response
    const replacements = Array.from(urlMapping.values());

    return Response.json({
      success: true,
      modifiedHtml,
      replacements,
      stats: {
        urlsShortened: replacements.length,
      },
    });
  } catch (error) {
    console.error('Error in /api/shorten:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}