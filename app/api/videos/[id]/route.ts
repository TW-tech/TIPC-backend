import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/videos/[id]
 * 獲取單一影片詳情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const video = await prisma.video.findUnique({
      where: { id },
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

    if (!video) {
      return NextResponse.json(
        { success: false, error: '影片不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: video,
    })
  } catch (error) {
    console.error('Video fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '影片獲取失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/videos/[id]
 * 刪除影片
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 檢查影片是否存在
    const video = await prisma.video.findUnique({
      where: { id },
    })

    if (!video) {
      return NextResponse.json(
        { success: false, error: '影片不存在' },
        { status: 404 }
      )
    }

    // 刪除影片（關聯的 junction table 會自動刪除因為有 onDelete: Cascade）
    await prisma.video.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: '影片已成功刪除',
    })
  } catch (error) {
    console.error('Video deletion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '影片刪除失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/videos/[id]
 * 更新影片
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // 檢查影片是否存在
    const existingVideo = await prisma.video.findUnique({
      where: { id },
    })

    if (!existingVideo) {
      return NextResponse.json(
        { success: false, error: '影片不存在' },
        { status: 404 }
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

    // 更新影片
    const video = await prisma.video.update({
      where: { id },
      data: {
        url,
        title,
        mainImg,
        description,
        author,
        videoDate: new Date(videoDate),
        // 刪除舊的關聯並建立新的
        keyWords: {
          deleteMany: {},
          create: allKeyWordIds.map((keyWordId: string) => ({
            keyWord: { connect: { id: keyWordId } },
          })),
        },
        nineBlocks: {
          deleteMany: {},
          create: nineBlockIds.map((nineBlockId: string) => ({
            nineBlock: { connect: { id: nineBlockId } },
          })),
        },
        cakeCategory: {
          deleteMany: {},
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
    console.error('Video update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '影片更新失敗',
      },
      { status: 500 }
    )
  }
}
