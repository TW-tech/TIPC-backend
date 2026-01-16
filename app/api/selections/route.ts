import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/selections
 * 創建新的影響力精選
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.log('Received selection body:', JSON.stringify(body, null, 2))

        // 基本驗證
        const validationErrors: string[] = []
        if (!body.title?.trim()) validationErrors.push('標題為必填')
        if (!body.author?.trim()) validationErrors.push('作者為必填')
        if (!body.slug?.trim()) validationErrors.push('Slug 為必填')
        if (!body.url?.trim()) validationErrors.push('網址為必填')
        if (!body.nation?.trim()) validationErrors.push('國家為必填')
        if (!body.date?.trim()) validationErrors.push('選擇日期為必填')
        if (!body.coverImage?.trim()) validationErrors.push('封面照片為必填')
        if (!body.keywordIds?.length && !body.newKeywords?.length) {
            validationErrors.push('請至少選擇或新增一個關鍵字')
        }

        if (validationErrors.length > 0) {
            return NextResponse.json({
                success: false,
                error: 'Validation failed',
                details: validationErrors.join(', '),
            }, { status: 400 })
        }

        // 使用 transaction 創建精選（確保原子性操作）
        const selection = await prisma.$transaction(async (tx) => {
            // 處理新關鍵字：檢查是否存在，避免重複創建
            const allKeywordIds: string[] = [...(body.keywordIds || [])]

            if (body.newKeywords && body.newKeywords.length > 0) {
                for (const keywordName of body.newKeywords) {
                    // 檢查關鍵字是否已存在（不區分大小寫）
                    let keyword = await tx.keyWords.findFirst({
                        where: {
                            name: {
                                equals: keywordName,
                                mode: 'insensitive'
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

            return await tx.selection.create({
                data: {
                    author: body.author,
                    title: body.title,
                    englishTitle: body.englishTitle || null,
                    coverImage: body.coverImage,
                    slug: body.slug,
                    date: new Date(body.date),
                    url: body.url,
                    nation: body.nation,
                    publishedAt: new Date(),

                    // 創建 blocks
                    blocks: {
                        create: body.blocks?.map((block: any) => ({
                            type: block.type,
                            data: block.data as any,
                            position: block.position,
                        })) || [],
                    },

                    // 創建 annotations（如果有）
                    ...(body.annotations && body.annotations.length > 0 && {
                        annotations: {
                            create: body.annotations.map((annotation: any, index: number) => ({
                                marker: annotation.id.toString(),
                                text: annotation.content,
                                url: annotation.url,
                                position: index,
                            })),
                        },
                    }),

                    // 創建 videos（如果有）
                    ...(body.videos && body.videos.length > 0 && {
                        videos: {
                            create: body.videos.map((video: any) => ({
                                url: video.url,
                            })),
                        },
                    }),

                    // 創建 podcasts（如果有）
                    ...(body.podcasts && body.podcasts.length > 0 && {
                        podcasts: {
                            create: body.podcasts.map((podcast: any) => ({
                                url: podcast.url,
                            })),
                        },
                    }),

                    // 連接所有 keywords（現有的 + 新創建的）
                    ...(allKeywordIds.length > 0 && {
                        keyWords: {
                            create: allKeywordIds.map(keywordId => ({
                                keyWord: {
                                    connect: { id: keywordId },
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
                },
            })
        })

        return NextResponse.json({
            success: true,
            data: selection,
        }, { status: 201 })

    } catch (error) {
        console.error('Selection creation error:', error)

        // Prisma 錯誤處理
        if (error && typeof error === 'object' && 'code' in error) {
            // P2002: Unique constraint violation (例如：slug 重複)
            if (error.code === 'P2002') {
                return NextResponse.json({
                    success: false,
                    error: 'Selection with this slug already exists',
                    details: 'Please use a different URL slug',
                }, { status: 409 })
            }

            // P2003: Foreign key constraint
            if (error.code === 'P2003') {
                return NextResponse.json({
                    success: false,
                    error: 'Invalid reference',
                    details: 'One or more referenced keywords do not exist',
                }, { status: 400 })
            }

            // P2025: Record not found
            if (error.code === 'P2025') {
                return NextResponse.json({
                    success: false,
                    error: 'Referenced record not found',
                    details: 'Please check that all selected keywords exist',
                }, { status: 404 })
            }
        }

        // 其他錯誤
        return NextResponse.json({
            success: false,
            error: 'Failed to create selection',
            details: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 })
    }
}


//TODO: DO I really need this API????
/**
 * GET /api/selections
 * 獲取精選列表
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '10', 10)
        const skip = (page - 1) * limit

        const [selections, total] = await Promise.all([
            prisma.selection.findMany({
                skip,
                take: limit,
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
                        include: {
                            keyWord: true,
                        },
                    },
                },
            }),
            prisma.selection.count(),
        ])

        return NextResponse.json({
            success: true,
            data: selections,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })

    } catch (error) {
        console.error('Selection fetch error:', error)

        return NextResponse.json({
            success: false,
            error: 'Failed to fetch selections',
        }, { status: 500 })
    }
}
