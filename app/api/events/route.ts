import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Create new event
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, eventDate, mainImage, alt, blocks, images } = body

    // Validation
    if (!title || !eventDate || !mainImage || !alt) {
      return NextResponse.json(
        { error: '標題、日期、封面圖片和替代文字為必填項' },
        { status: 400 }
      )
    }

    if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
      return NextResponse.json(
        { error: '至少需要一個描述段落' },
        { status: 400 }
      )
    }

    // Create event with blocks and images
    const event = await prisma.event.create({
      data: {
        title,
        eventDate: new Date(eventDate),
        mainImage,
        alt,
        blocks: {
          create: blocks.map((block: any) => ({
            position: block.position,
            type: block.type,
            data: block.data,
          })),
        },
        images: images && images.length > 0 ? {
          create: images.map((img: any) => ({
            src: img.src,
            position: img.position,
          })),
        } : undefined,
      },
      include: {
        blocks: true,
        images: true,
      },
    })

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: '創建活動失敗' },
      { status: 500 }
    )
  }
}

// GET - Fetch all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      include: {
        blocks: {
          orderBy: { position: 'asc' },
        },
        images: {
          orderBy: { position: 'asc' },
        },
      },
      orderBy: {
        eventDate: 'desc',
      },
    })

    return NextResponse.json(events)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: '獲取活動列表失敗' },
      { status: 500 }
    )
  }
}
