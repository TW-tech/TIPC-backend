import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/photographs
 * 建立新照片
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      url,
      title,
      description,
      author,
      photoDate,
      cakeCategoryIds,
      nineBlockIds,
    } = body

    // 驗證必填欄位
    if (!url || !title || !description || !author || !photoDate) {
      return NextResponse.json(
        { success: false, error: '缺少必填欄位' },
        { status: 400 }
      )
    }

    if (!cakeCategoryIds || cakeCategoryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '蛋糕圖分類為必填' },
        { status: 400 }
      )
    }
    
    // 建立照片
    const photograph = await prisma.photograph.create({
      data: {
        url,
        title,
        description,
        author,
        photoDate: new Date(photoDate),
        nineBlocks: {
          create: nineBlockIds.map((nineBlockId: string) => ({
            nineBlock: { connect: { id: nineBlockId } },
          })),
        },
        cakeCategory: {
          create: cakeCategoryIds.map((categoryId: string) => ({
            cakeCategory: { connect: { id: categoryId } },
          })),
        },
      },
      include: {
        nineBlocks: {
          include: {
            nineBlock: true,
          },
        },
        cakeCategory: {
          include: {
            cakeCategory: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: photograph,
    })
  } catch (error) {
    console.error('Photograph creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '照片建立失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/photographs
 * 獲取所有照片列表
 */
export async function GET() {
  try {
    const photographs = await prisma.photograph.findMany({
      include: {
        nineBlocks: {
          include: {
            nineBlock: true,
          },
        },
        cakeCategory: {
          include: {
            cakeCategory: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: photographs,
    })
  } catch (error) {
    console.error('Photographs fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '照片列表獲取失敗',
      },
      { status: 500 }
    )
  }
}
