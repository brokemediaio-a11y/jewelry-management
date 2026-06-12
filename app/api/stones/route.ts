import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const options = await prisma.stoneOption.findMany({
      orderBy: [{ kind: 'asc' }, { name: 'asc' }],
      select: { id: true, kind: true, name: true },
    });

    const grouped = {
      types: options.filter((o) => o.kind === 'TYPE'),
      colors: options.filter((o) => o.kind === 'COLOR'),
      cuts: options.filter((o) => o.kind === 'CUT'),
      clarities: options.filter((o) => o.kind === 'CLARITY'),
    };

    return successResponse(grouped);
  } catch (error) {
    console.error('Failed to fetch stone options:', error);
    return errorResponse('Failed to fetch stone options', 500);
  }
}
