import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
): Promise<Response> {
  try {
    const { code } = params;

    const shortenedUrl = await prisma.shortenedUrl.findUnique({
      where: { code },
    });

    if (!shortenedUrl) {
      return Response.json(
        { success: false, error: 'Link gen broke' },
        { status: 404 }
      );
    }

    return Response.redirect(shortenedUrl.originalUrl, 301);
  } catch (error) {
    console.error('error in the redirect', error);
    return Response.json(
      { success: false, error: 'vercel side i think' },
      { status: 500 }
    );
  }
}