import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/partners/[id]
 * 獲取單一夥伴詳情
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    })

    if (!partner) {
      return NextResponse.json(
        { success: false, error: '夥伴不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: partner,
    })
  } catch (error) {
    console.error('Partner fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '夥伴獲取失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/partners/[id]
 * 刪除夥伴
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // 檢查夥伴是否存在
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    })

    if (!partner) {
      return NextResponse.json(
        { success: false, error: '夥伴不存在' },
        { status: 404 }
      )
    }

    // 刪除夥伴
    await prisma.partner.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({
      success: true,
      message: '夥伴已成功刪除',
    })
  } catch (error) {
    console.error('Partner deletion error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '夥伴刪除失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/partners/[id]
 * 更新夥伴
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { name, logo, webUrl } = body

    // 驗證必填欄位
    if (!name || !logo || !webUrl) {
      return NextResponse.json(
        { success: false, error: '所有欄位皆為必填' },
        { status: 400 }
      )
    }

    // 檢查夥伴是否存在
    const existingPartner = await prisma.partner.findUnique({
      where: { id: parseInt(id) },
    })

    if (!existingPartner) {
      return NextResponse.json(
        { success: false, error: '夥伴不存在' },
        { status: 404 }
      )
    }

    // 更新夥伴
    const partner = await prisma.partner.update({
      where: { id: parseInt(id) },
      data: {
        name,
        logo,
        webUrl,
      },
    })

    return NextResponse.json({
      success: true,
      data: partner,
    })
  } catch (error) {
    console.error('Partner update error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '夥伴更新失敗',
      },
      { status: 500 }
    )
  }
}
