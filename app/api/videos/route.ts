import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/videos
 * 建立新影片
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      url,
      title,
      mainImg,
      description,
      author,
      videoDate,
      keyWordIds = [],
      newKeywords = [],
      nineBlockIds,
      cakeCategoryIds,
    } = body

    // 驗證必填欄位
    if (!url || !title || !mainImg || !description || !author || !videoDate) {
      return NextResponse.json(
        { success: false, error: '缺少必填欄位' },
        { status: 400 }
      )
    }

    if (keyWordIds.length === 0 && newKeywords.length === 0) {
      return NextResponse.json(
        { success: false, error: '請至少選擇一個關鍵字' },
        { status: 400 }
      )
    }

    if (!nineBlockIds || nineBlockIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '請至少選擇一個九宮格分類' },
        { status: 400 }
      )
    }

    if (!cakeCategoryIds || cakeCategoryIds.length === 0) {
      return NextResponse.json(
        { success: false, error: '請至少選擇一個蛋糕圖分類' },
        { status: 400 }
      )
    }
    
    // 先創建新的關鍵字（如果有的話）
    const createdKeywords = await Promise.all(
      newKeywords.map(async (name: string) => {
        // 檢查關鍵字是否已存在
        const existing = await prisma.keyWords.findFirst({
          where: { name },
        })
        if (existing) {
          return existing
        }
        // 創建新關鍵字
        return await prisma.keyWords.create({
          data: { name },
        })
      })
    )

    // 合併現有關鍵字 ID 和新創建的關鍵字 ID
    const allKeyWordIds = [...keyWordIds, ...createdKeywords.map(kw => kw.id)]
    
    // 建立影片
    const video = await prisma.video.create({
      data: {
        url,
        title,
        mainImg,
        description,
        author,
        videoDate: new Date(videoDate),
        keyWords: {
          create: allKeyWordIds.map((keyWordId: string) => ({
            keyWord: { connect: { id: keyWordId } },
          })),
        },
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
        keyWords: {
          include: {
            keyWord: true,
          },
        },
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
      data: video,
    })
  } catch (error) {
    console.error('Video creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '影片建立失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/videos
 * 獲取所有影片列表
 */
export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      include: {
        keyWords: {
          include: {
            keyWord: true,
          },
        },
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
      data: videos,
    })
  } catch (error) {
    console.error('Videos fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '影片列表獲取失敗',
      },
      { status: 500 }
    )
  }
}
