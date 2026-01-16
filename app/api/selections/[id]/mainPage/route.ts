import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PATCH - Toggle setUpSelection status
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { setUpSelection } = body
    
    if (setUpSelection === true) {
      const currentSelectionCount = await prisma.selection.count({
        where: { setUpSelection: true }
      })

      if (currentSelectionCount >= 4) {
        return NextResponse.json(
          { 
            success: false,
            error: '最多只能選擇3個影響力精選顯示於首頁' 
          },
          { status: 400 }
        )
      }
    }

    // Update the event
    const updatedSelection = await prisma.selection.update({
      where: { id },
      data: { setUpSelection }
    })

    return NextResponse.json({
      success: true,
      data: updatedSelection
    })
  } catch (error) {
    console.error('Error updating setUpSelection status:', error)
    return NextResponse.json(
      { 
        success: false,
        error: '更新失敗' 
      },
      { status: 500 }
    )
  }
}
