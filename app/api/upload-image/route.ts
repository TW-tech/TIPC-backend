import { NextRequest, NextResponse } from 'next/server'
import cloudinary from '@/lib/cloudinary'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: '未提供圖片' },
        { status: 400 }
      )
    }

    // 檢查文件類型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '只能上傳圖片' },
        { status: 400 }
      )
    }

    // 檢查文件大小（限制 5MB）
    const maxSize = 5 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: '圖片大小不能超過 5MB' },
        { status: 400 }
      )
    }

    // 轉換文件為 buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // 上傳到 Cloudinary
    const result = await new Promise<{
      secure_url: string
      public_id: string
      width: number
      height: number
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `TIPC/${folder}`, // Dynamic folder based on upload source
          resource_type: 'image',
          transformation: [
            { quality: 'auto', fetch_format: 'auto' } // 自動優化
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else if (result) resolve(result)
          else reject(new Error('Upload failed'))
        }
      )
      
      uploadStream.end(buffer)
    })
    
    // 返回 Cloudinary URL
    return NextResponse.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: '上傳失敗' },
      { status: 500 }
    )
  }
}
