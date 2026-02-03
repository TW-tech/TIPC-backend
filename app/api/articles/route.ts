import { NextRequest, NextResponse } from 'next/server'
import { assertValidCreateArticle } from '@/lib/validation'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/articles
 * 創建新文章
 * 
 * 包含完整的資料驗證：
 * 1. Zod Schema 驗證（block type, data structure, annotations）
 * 2. Reference 完整性檢查（確保所有 [1], [2] 等標記都有對應的註解）
 */
export async function POST(request: NextRequest) {
  try {
    // 解析請求 body
    const body = await request.json()
    
    console.log('Received body:', JSON.stringify(body, null, 2))
    
    // 完整驗證（包含 Zod + Reference 完整性檢查）
    // 如果驗證失敗，會直接拋出錯誤
    const validatedData = assertValidCreateArticle(body)
    
    console.log('Validated data:', JSON.stringify(validatedData, null, 2))
    
    // 驗證通過，使用 transaction 創建文章（確保原子性操作）
    const article = await prisma.$transaction(async (tx) => {
      // 處理新關鍵字：檢查是否存在，避免重複創建
      const allKeywordIds: string[] = [...(validatedData.keywordIds || [])]
      
      if (validatedData.newKeywords && validatedData.newKeywords.length > 0) {
        for (const keywordName of validatedData.newKeywords) {
          // 檢查關鍵字是否已存在（不區分大小寫）
          let keyword = await tx.keyWords.findFirst({
            where: { 
              name: {
                equals: keywordName,
                mode: 'insensitive' // 不區分大小寫
              }
            }
          })
          
          // 如果不存在，創建新的
          if (!keyword) {
            keyword = await tx.keyWords.create({
              data: { name: keywordName }
            })
          }
          
          // 添加到關鍵字 ID 列表
          allKeywordIds.push(keyword.id)
        }
      }
      
      return await tx.article.create({
      data: {
        author: validatedData.author,
        title: validatedData.title,
        coverImage: validatedData.coverImage,
        slug: validatedData.slug,
        publishedAt: new Date(),
        
        // 創建 blocks
        blocks: {
          create: validatedData.blocks.map(block => ({
            type: block.type,
            data: block.data as any, // Cast to Prisma JsonValue
            position: block.position,
          })),
        },
        
        // 創建 annotations（如果有）
        ...(validatedData.annotations && validatedData.annotations.length > 0 && {
          annotations: {
            create: validatedData.annotations.map((annotation, index) => ({
              marker: annotation.id.toString(),
              text: annotation.content,
              url: annotation.url,
              position: index,
            })),
          },
        }),
        
        // 創建 videos（如果有）
        ...(validatedData.videos && validatedData.videos.length > 0 && {
          videos: {
            create: validatedData.videos.map(video => ({
              url: video.url,
            })),
          },
        }),
        
        // 創建 podcasts（如果有）
        ...(validatedData.podcasts && validatedData.podcasts.length > 0 && {
          podcasts: {
            create: validatedData.podcasts.map(podcast => ({
              url: podcast.url,
            })),
          },
        }),
        
        // 連接所有 keywords（現有的 + 新創建的）
        // 反向順序：第一個加入的關鍵字有最高的 position，會顯示在最前面
        ...(allKeywordIds.length > 0 && {
          keyWords: {
            create: allKeywordIds.map((keywordId, index) => ({
              keyWord: {
                connect: { id: keywordId },
              },
              position: allKeywordIds.length - 1 - index, // 反向順序
            })),
          },
        }),
        
        // 連接 nineBlocks（如果有）
        ...(validatedData.nineBlockIds && validatedData.nineBlockIds.length > 0 && {
          nineBlocks: {
            create: validatedData.nineBlockIds.map(blockId => ({
              nineBlock: {
                connect: { id: blockId },
              },
            })),
          },
        }),
        
        // 連接 cakeCategory（如果有）
        ...(validatedData.cakeCategoryId && validatedData.cakeCategoryId.length > 0 && {
          cakeCategory: {
            create: validatedData.cakeCategoryId.map(categoryId => ({
              cakeCategory: {
                connect: { id: categoryId },
              },
            })),
          },
        }),
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
    })
    
    return NextResponse.json({
      success: true,
      data: article,
    }, { status: 201 })
    
  } catch (error) {
    console.error('Article creation error:', error)
    
    // Prisma 錯誤處理
    if (error && typeof error === 'object' && 'code' in error) {
      // P2002: Unique constraint violation (例如：slug 重複)
      if (error.code === 'P2002') {
        return NextResponse.json({
          success: false,
          error: 'Article with this slug already exists',
          details: 'Please use a different URL slug',
        }, { status: 409 })
      }
      
      // P2003: Foreign key constraint (例如：關聯的 ID 不存在)
      if (error.code === 'P2003') {
        return NextResponse.json({
          success: false,
          error: 'Invalid reference',
          details: 'One or more referenced categories or keywords do not exist',
        }, { status: 400 })
      }
      
      // P2025: Record not found
      if (error.code === 'P2025') {
        return NextResponse.json({
          success: false,
          error: 'Referenced record not found',
          details: 'Please check that all selected categories and keywords exist',
        }, { status: 404 })
      }
    }
    
    // 如果是驗證錯誤（來自 assertValidCreateArticle）
    if (error instanceof Error && error.message.includes('validation failed')) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.message,
      }, { status: 400 })
    }
    
    // 其他錯誤
    return NextResponse.json({
      success: false,
      error: 'Failed to create article',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

/**
 * GET /api/articles
 * 獲取文章列表
 */
export async function GET(request: NextRequest) {
  try {
    //const { searchParams } = new URL(request.url)
    //const page = parseInt(searchParams.get('page') || '1', 10)
    //const limit = parseInt(searchParams.get('limit') || '10', 10)
    //const skip = (page - 1) * limit
    
    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        //skip,
        //take: limit,
        orderBy: { createdAt: 'desc' },
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
        },
      }),
      prisma.article.count(),
    ])
    
    return NextResponse.json({
      success: true,
      data: articles,
      //pagination: {
      //  page,
        //limit,
      //  total,
        //totalPages: Math.ceil(total / limit),
      //},
    })
    
  } catch (error) {
    console.error('Article fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch articles',
    }, { status: 500 })
  }
}
