import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/articles/[id] - 獲取單篇文章
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const article = await prisma.article.findUnique({
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
          orderBy: { position: 'desc' },
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

    if (!article) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: article,
    })
  } catch (error) {
    console.error('Get article error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '獲取文章時發生錯誤',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// PATCH /api/articles/[id] - 更新文章
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // 檢查文章是否存在
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    })

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      )
    }

    // 使用 transaction 更新文章（增加 timeout 到 15 秒）
    const updatedArticle = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. 刪除舊的關聯資料（並行執行以提升效率）
      await Promise.all([
        tx.articleBlock.deleteMany({ where: { articleId: id } }),
        tx.articleAnnotation.deleteMany({ where: { articleId: id } }),
        tx.articleVideo.deleteMany({ where: { articleId: id } }),
        tx.articlePodcast.deleteMany({ where: { articleId: id } }),
        tx.articleKeyWord.deleteMany({ where: { articleId: id } }),
        tx.articleNineBlock.deleteMany({ where: { articleId: id } }),
        tx.articleCakeCategory.deleteMany({ where: { articleId: id } }),
      ])

      // 2. 處理新增的關鍵字（批次查詢優化）
      let allKeywordIds = [...(body.keywordIds || [])]
      if (body.newKeywords && body.newKeywords.length > 0) {
        const trimmedKeywords = body.newKeywords.map((k: string) => k.trim())
        
        // 批次查找已存在的關鍵字
        const existingKeywords = await tx.keyWords.findMany({
          where: {
            name: {
              in: trimmedKeywords,
              mode: 'insensitive',
            },
          },
        })

        const existingKeywordMap = new Map(
          existingKeywords.map(k => [k.name.toLowerCase(), k.id])
        )

        // 找出需要創建的新關鍵字
        const keywordsToCreate = trimmedKeywords.filter(
          (name: string) => !existingKeywordMap.has(name.toLowerCase())
        )

        // 批次創建新關鍵字
        if (keywordsToCreate.length > 0) {
          const createdKeywords = await Promise.all(
            keywordsToCreate.map((name: string) =>
              tx.keyWords.create({ data: { name } })
            )
          )
          createdKeywords.forEach(k => existingKeywordMap.set(k.name.toLowerCase(), k.id))
        }

        // 收集所有關鍵字 ID
        trimmedKeywords.forEach((name: string) => {
          const keywordId = existingKeywordMap.get(name.toLowerCase())
          if (keywordId) {
            allKeywordIds.push(keywordId)
          }
        })
      }

      // 3. 更新文章主體資料
      return await tx.article.update({
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
            create: allKeywordIds.map((keywordId: string, index: number) => ({
              keyWord: {
                connect: { id: keywordId },
              },
              position: allKeywordIds.length - 1 - index, // 反向順序：第一個加入的關鍵字顯示在最前面
            })),
          },
          nineBlocks: body.nineBlockIds && body.nineBlockIds.length > 0 ? {
            create: body.nineBlockIds.map((nineBlockId: string) => ({
              nineBlock: {
                connect: { id: nineBlockId },
              },
            })),
          } : undefined,
          cakeCategory: body.cakeCategoryId && body.cakeCategoryId.length > 0 ? {
            create: body.cakeCategoryId.map((cakeCategoryId: string) => ({
              cakeCategory: {
                connect: { id: cakeCategoryId },
              },
            })),
          } : undefined,
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
            orderBy: { position: 'desc' },
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
    }, {
      maxWait: 10000, // 最長等待時間 10 秒
      timeout: 15000, // 事務超時時間 15 秒
    })

    return NextResponse.json({
      success: true,
      data: updatedArticle,
      message: '文章更新成功',
    })
  } catch (error) {
    console.error('Update article error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '更新文章時發生錯誤',
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

    // 檢查文章是否存在
    const existingArticle = await prisma.article.findUnique({
      where: { id },
    })

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: '文章不存在' },
        { status: 404 }
      )
    }

    // 刪除文章（Prisma 會自動處理 cascade 刪除相關資料）
    await prisma.article.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: '文章已成功刪除',
    })
  } catch (error) {
    console.error('Delete article error:', error)
    return NextResponse.json(
      {
        success: false,
        error: '刪除文章時發生錯誤',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
