import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/selections/[id] - 獲取單篇影響力精選
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const selection = await prisma.selection.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { position: 'asc' },
        },
        annotations: {
          orderBy: { id: 'asc' },
        },
        videos: true,
        podcasts: true,
        keyWords: {
          include: {
            keyWord: true,
          },
        },
      },
    })

    if (!selection) {
      return NextResponse.json(
        { success: false, error: '影響力精選不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: selection,
    })
  } catch (error) {
    console.error('Get selection error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '獲取影響力精選時發生錯誤',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/selections/[id] - 更新影響力精選
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // 檢查影響力精選是否存在
    const existingSelection = await prisma.selection.findUnique({
      where: { id },
    })

    if (!existingSelection) {
      return NextResponse.json(
        { success: false, error: '影響力精選不存在' },
        { status: 404 }
      )
    }

    // 使用 transaction 更新影響力精選
    const updatedSelection = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 刪除舊的關聯資料
      await tx.selectionBlock.deleteMany({ where: { selectionId: id } })
      await tx.selectionAnnotation.deleteMany({ where: { selectionId: id } })
      await tx.selectionVideo.deleteMany({ where: { selectionId: id } })
      await tx.selectionPodcast.deleteMany({ where: { selectionId: id } })
      await tx.selectionKeyWord.deleteMany({ where: { selectionId: id } })

      // 2. 處理新增的關鍵字
      let allKeywordIds = [...(body.keywordIds || [])]
      if (body.newKeywords && body.newKeywords.length > 0) {
        for (const keywordName of body.newKeywords) {
          const normalized = keywordName.trim().toLowerCase()
          let keyword = await tx.keyWords.findFirst({
            where: {
              name: {
                equals: keywordName.trim(),
                mode: 'insensitive',
              },
            },
          })

          if (!keyword) {
            keyword = await tx.keyWords.create({
              data: { name: keywordName.trim() },
            })
          }
          allKeywordIds.push(keyword.id)
        }
      }

      // 3. 更新影響力精選主體資料
      return await tx.selection.update({
        where: { id },
        data: {
          author: body.author,
          title: body.title,
          englishTitle: body.englishTitle,
          coverImage: body.coverImage,
          slug: body.slug,
          // publishedAt 不更新，保持原有值
          blocks: {
            create: body.blocks?.map((block: any, index: number) => ({
              type: block.type,
              data: block.data,
              position: index,
            })) || [],
          },
          annotations: body.annotations && body.annotations.length > 0 ? {
            create: body.annotations.map((annotation: any, index: number) => ({
              marker: annotation.id.toString(),
              text: annotation.content,
              url: annotation.url || '',
              position: index,
            })),
          } : undefined,
          videos: body.videos && body.videos.length > 0 ? {
            create: body.videos.map((video: any) => ({
              url: video.url,
            })),
          } : undefined,
          podcasts: body.podcasts && body.podcasts.length > 0 ? {
            create: body.podcasts.map((podcast: any) => ({
              url: podcast.url,
            })),
          } : undefined,
          keyWords: {
            create: allKeywordIds.map((keywordId: string) => ({
              keyWord: {
                connect: { id: keywordId },
              },
            })),
          },
        },
        include: {
          blocks: {
            orderBy: { position: 'asc' },
          },
          annotations: {
            orderBy: { id: 'asc' },
          },
          videos: true,
          podcasts: true,
          keyWords: {
            include: {
              keyWord: true,
            },
          },
        },
      })
    })

    return NextResponse.json({
      success: true,
      data: updatedSelection,
      message: '影響力精選更新成功',
    })
  } catch (error) {
    console.error('Update selection error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '更新影響力精選時發生錯誤',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // 檢查影響力精選是否存在
    const existingselection = await prisma.selection.findUnique({
      where: { id },
    })

    if (!existingselection) {
      return NextResponse.json(
        { success: false, error: '影響力精選不存在' },
        { status: 404 }
      )
    }

    // 刪除影響力精選（Prisma 會自動處理 cascade 刪除相關資料）
    await prisma.selection.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: '影響力精選已成功刪除',
    })
  } catch (error) {
    console.error('Delete selection error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '刪除影響力精選時發生錯誤',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
