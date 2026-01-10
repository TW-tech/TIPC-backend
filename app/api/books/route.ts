import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Create new book
export async function POST(request: Request) {
  try {
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

    // Create book
    const book = await prisma.book.create({
      data: {
        bookname,
        authors,
        publisher,
        isbn,
        image,
      },
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('Error creating book:', error)
    return NextResponse.json(
      { error: '創建書籍失敗' },
      { status: 500 }
    )
  }
}

// GET - Fetch all books
export async function GET() {
  try {
    const books = await prisma.book.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(books)
  } catch (error) {
    console.error('Error fetching books:', error)
    return NextResponse.json(
      { error: '獲取書籍列表失敗' },
      { status: 500 }
    )
  }
}
