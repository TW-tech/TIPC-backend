import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET - Fetch single event
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        blocks: {
          orderBy: { position: 'asc' },
        },
        images: {
          orderBy: { position: 'asc' },
        },
      },
    })

    if (!event) {
      return NextResponse.json(
        { error: '找不到該活動' },
        { status: 404 }
      )
    }

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: '獲取活動失敗' },
      { status: 500 }
    )
  }
}

// PUT - Update event
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
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

    // Delete existing blocks and images, then recreate
    await prisma.eventBlock.deleteMany({
      where: { eventId: id },
    })

    await prisma.eventImage.deleteMany({
      where: { eventId: id },
    })

    // Update event with new blocks and images
    const event = await prisma.event.update({
      where: { id },
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

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: '更新活動失敗' },
      { status: 500 }
    )
  }
}

// DELETE - Delete event
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    await prisma.event.delete({
      where: { id },
    })

    return NextResponse.json({ message: '活動已刪除' })
  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: '刪除活動失敗' },
      { status: 500 }
    )
  }
}
