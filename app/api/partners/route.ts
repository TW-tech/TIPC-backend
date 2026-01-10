import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/partners
 * 建立新夥伴
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, logo, webUrl } = body

    // 驗證必填欄位
    if (!name || !logo || !webUrl) {
      return NextResponse.json(
        { success: false, error: '所有欄位皆為必填' },
        { status: 400 }
      )
    }

    // 建立夥伴
    const partner = await prisma.partner.create({
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
    console.error('Partner creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '夥伴建立失敗',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/partners
 * 獲取所有夥伴
 */
export async function GET(request: Request) {
  try {
    const partners = await prisma.partner.findMany({
      orderBy: {
        id: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: partners,
    })
  } catch (error) {
    console.error('Partners fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '夥伴獲取失敗',
      },
      { status: 500 }
    )
  }
}
