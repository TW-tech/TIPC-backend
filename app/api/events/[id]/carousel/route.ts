import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH - Toggle showInImgCarousel status
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { showInImgCarousel } = body

    // If setting to true, check if we already have 4 events in carousel
    if (showInImgCarousel === true) {
      const currentCarouselCount = await prisma.event.count({
        where: { showInImgCarousel: true }
      })

      if (currentCarouselCount >= 4) {
        return NextResponse.json(
          { 
            success: false,
            error: '最多只能選擇4個活動顯示於跑馬燈' 
          },
          { status: 400 }
        )
      }
    }

    // Update the event
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: { showInImgCarousel }
    })

    return NextResponse.json({
      success: true,
      data: updatedEvent
    })
  } catch (error) {
    console.error('Error updating carousel status:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '更新失敗' 
      },
      { status: 500 }
    )
  }
}
