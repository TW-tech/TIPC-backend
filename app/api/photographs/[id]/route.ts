import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/photographs/[id]
 * 獲取單一照片詳情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const photograph = await prisma.photograph.findUnique({
      where: { id },
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

    if (!photograph) {
      return NextResponse.json(
        { success: false, error: '照片不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: photograph,
    })
  } catch (error) {
    console.error('Photograph fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '照片獲取失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/photographs/[id]
 * 刪除照片
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 檢查照片是否存在
    const photograph = await prisma.photograph.findUnique({
      where: { id },
    })

    if (!photograph) {
      return NextResponse.json(
        { success: false, error: '照片不存在' },
        { status: 404 }
      )
    }

    // 刪除照片（關聯的 junction table 會自動刪除因為有 onDelete: Cascade）
    await prisma.photograph.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: '照片已成功刪除',
    })
  } catch (error) {
    console.error('Photograph deletion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '照片刪除失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/photographs/[id]
 * 更新照片
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

    // 檢查照片是否存在
    const existingPhotograph = await prisma.photograph.findUnique({
      where: { id },
    })

    if (!existingPhotograph) {
      return NextResponse.json(
        { success: false, error: '照片不存在' },
        { status: 404 }
      )
    }

    // 更新照片
    const photograph = await prisma.photograph.update({
      where: { id },
      data: {
        url,
        title,
        description,
        author,
        photoDate: new Date(photoDate),
        // 刪除舊的關聯並建立新的
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
    console.error('Photograph update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '照片更新失敗',
      },
      { status: 500 }
    )
  }
}
