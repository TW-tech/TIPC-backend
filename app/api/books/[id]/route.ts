import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET - Fetch single book
export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const bookId = parseInt(id)

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: '無效的書籍 ID' },
        { status: 400 }
      )
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    })

    if (!book) {
      return NextResponse.json(
        { error: '找不到該書籍' },
        { status: 404 }
      )
    }

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error fetching book:', error)
    return NextResponse.json(
      { error: '獲取書籍失敗' },
      { status: 500 }
    )
  }
}

// PUT - Update book
export async function PUT(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const bookId = parseInt(id)

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: '無效的書籍 ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { bookname, authors, publisher, isbn, image } = body

    // Validation
    if (!bookname || !authors || !Array.isArray(authors) || authors.length === 0) {
      return NextResponse.json(
        { error: '書名和作者為必填項' },
        { status: 400 }
      )
    }

    if (!publisher || !isbn || !image) {
      return NextResponse.json(
        { error: '出版社、ISBN 和封面圖片為必填項' },
        { status: 400 }
      )
    }

    // Update book
    const book = await prisma.book.update({
      where: { id: bookId },
      data: {
        bookname,
        authors,
        publisher,
        isbn,
        image,
      },
    })

    return NextResponse.json(book)
  } catch (error) {
    console.error('Error updating book:', error)
    return NextResponse.json(
      { error: '更新書籍失敗' },
      { status: 500 }
    )
  }
}

// DELETE - Delete book
export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const bookId = parseInt(id)

    if (isNaN(bookId)) {
      return NextResponse.json(
        { error: '無效的書籍 ID' },
        { status: 400 }
      )
    }

    await prisma.book.delete({
      where: { id: bookId },
    })

    return NextResponse.json({ message: '書籍已刪除' })
  } catch (error) {
    console.error('Error deleting book:', error)
    return NextResponse.json(
      { error: '刪除書籍失敗' },
      { status: 500 }
    )
  }
}
