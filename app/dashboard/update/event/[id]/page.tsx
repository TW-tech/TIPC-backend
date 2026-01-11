'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface TextBlock {
  id: string
  content: string
  position: number
}

interface RelatedImage {
  id: string
  src: string
  position: number
}

interface EventData {
  id: string
  title: string
  eventDate: string
  mainImage: string
  alt: string
  blocks: Array<{
    id: string
    position: number
    type: string
    data: { content: string }
  }>
  images: Array<{
    id: string
    src: string
    position: number
  }>
}

export default function EventUpdatePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [eventId, setEventId] = useState<string>('')

  // Form state
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [mainImage, setMainImage] = useState('')
  const [alt, setAlt] = useState('')
  const [textBlocks, setTextBlocks] = useState<TextBlock[]>([])
  const [relatedImages, setRelatedImages] = useState<RelatedImage[]>([])

  // UI state
  const [uploadingMainImage, setUploadingMainImage] = useState(false)
  const [uploadingRelatedImage, setUploadingRelatedImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const resolvedParams = await params
        setEventId(resolvedParams.id)
        
        const response = await fetch(`/api/events/${resolvedParams.id}`)
        if (!response.ok) throw new Error('Failed to fetch event')
        
        const event: EventData = await response.json()
        
        // Set form data
        setTitle(event.title)
        setEventDate(event.eventDate.split('T')[0]) // Convert to YYYY-MM-DD format
        setMainImage(event.mainImage)
        setAlt(event.alt)
        
        // Convert blocks to TextBlock format
        setTextBlocks(
          event.blocks.map((block) => ({
            id: block.id,
            content: block.data.content,
            position: block.position
          }))
        )
        
        // Convert images to RelatedImage format
        setRelatedImages(
          event.images.map((img) => ({
            id: img.id,
            src: img.src,
            position: img.position
          }))
        )
      } catch (error) {
        console.error('Error fetching event:', error)
        alert('載入活動資料失敗')
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEventData()
  }, [params, router])

  // Handle main image upload
  const handleMainImageUpload = async (file: File) => {
    setUploadingMainImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'events')

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('上傳失敗')

      const data = await response.json()
      setMainImage(data.url)
    } catch (error) {
      console.error('Image upload error:', error)
      alert('圖片上傳失敗，請重試')
    } finally {
      setUploadingMainImage(false)
    }
  }

  // Handle related image upload
  const handleRelatedImageUpload = async (file: File) => {
    setUploadingRelatedImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'events')

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('上傳失敗')

      const data = await response.json()
      const newImage: RelatedImage = {
        id: crypto.randomUUID(),
        src: data.url,
        position: relatedImages.length
      }
      setRelatedImages([...relatedImages, newImage])
    } catch (error) {
      console.error('Image upload error:', error)
      alert('圖片上傳失敗，請重試')
    } finally {
      setUploadingRelatedImage(false)
    }
  }

  // Text block management
  const addTextBlock = () => {
    const newBlock: TextBlock = {
      id: crypto.randomUUID(),
      content: '',
      position: textBlocks.length
    }
    setTextBlocks([...textBlocks, newBlock])
  }

  const updateTextBlock = (id: string, content: string) => {
    setTextBlocks(textBlocks.map(block => 
      block.id === id ? { ...block, content } : block
    ))
  }

  const removeTextBlock = (id: string) => {
    if (textBlocks.length === 1) {
      alert('至少需要保留一個段落')
      return
    }
    const filtered = textBlocks.filter(block => block.id !== id)
    // Reorder positions
    setTextBlocks(filtered.map((block, index) => ({ ...block, position: index })))
  }


  // Related image management
  const removeRelatedImage = (id: string) => {
    const filtered = relatedImages.filter(img => img.id !== id)
    setRelatedImages(filtered.map((img, index) => ({ ...img, position: index })))
  }

  // Validation
  const validateForm = () => {
    if (!title.trim()) {
      alert('請輸入活動標題')
      return false
    }
    if (!eventDate) {
      alert('請選擇活動日期')
      return false
    }
    if (!mainImage) {
      alert('請上傳封面圖片')
      return false
    }
    if (!alt.trim()) {
      alert('請輸入圖片替代文字')
      return false
    }
    if (textBlocks.some(block => !block.content.trim())) {
      alert('請填寫所有段落內容')
      return false
    }
    return true
  }

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const eventData = {
        title,
        eventDate: new Date(eventDate).toISOString(),
        mainImage,
        alt,
        blocks: textBlocks.map(block => ({
          position: block.position,
          type: 'text',
          data: { content: block.content }
        })),
        images: relatedImages.map(img => ({
          src: img.src,
          position: img.position
        }))
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      })

      if (!response.ok) throw new Error('更新失敗')

      alert('活動更新成功！')
      router.push('/dashboard')
    } catch (error) {
      console.error('Update error:', error)
      alert('更新失敗，請重試')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">載入中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">更新活動</h1>
          <p className="mt-2 text-gray-600">修改活動資訊</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* 活動標題 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活動標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入活動標題"
            />
          </div>

          {/* 活動日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              活動日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* 封面圖片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面圖片 <span className="text-red-500">*</span>
            </label>
            
            <input
              type="file"
              accept="image/*"
              id="main-image-upload"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleMainImageUpload(file)
              }}
              className="hidden"
              disabled={uploadingMainImage}
            />
            
            {!mainImage ? (
              <label
                htmlFor="main-image-upload"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  uploadingMainImage
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                }`}
              >
                {uploadingMainImage ? (
                  <>
                    <svg className="w-10 h-10 mb-3 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-blue-600 font-medium">上傳中...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-700 font-medium">
                      <span className="text-blue-600">點擊上傳封面圖片</span>
                    </p>
                  </>
                )}
              </label>
            ) : (
              <div className="relative group">
                <img src={mainImage} alt="封面預覽" className="w-full max-h-64 object-contain rounded-lg border border-gray-300" />
                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center rounded-lg">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <label htmlFor="main-image-upload" className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-100 cursor-pointer font-medium text-sm">
                      更換圖片
                    </label>
                    <button type="button" onClick={() => setMainImage('')} className="px-5 py-2.5 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 font-medium text-base">
                      刪除圖片
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 圖片替代文字 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              圖片替代文字 (Alt) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入圖片描述"
            />
          </div>

          {/* 活動描述段落 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                活動描述 <span className="text-red-500">*</span>
              </label>
              <button type="button" onClick={addTextBlock} className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                + 新增段落
              </button>
            </div>
            
            <div className="space-y-4">
              {textBlocks.map((block, index) => (
                <div key={block.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">段落 {index + 1}</span>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => removeTextBlock(block.id)} className="px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700">
                        刪除
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={block.content}
                    onChange={(e) => updateTextBlock(block.id, e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="請輸入段落內容..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 相關圖片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              相關圖片（選填）
            </label>
            
            <input
              type="file"
              accept="image/*"
              id="related-image-upload"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleRelatedImageUpload(file)
                  e.target.value = ''
                }
              }}
              className="hidden"
              disabled={uploadingRelatedImage}
            />
            
            <label
              htmlFor="related-image-upload"
              className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors mb-4 ${
                uploadingRelatedImage
                  ? 'bg-blue-50 border-blue-400'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
              }`}
            >
              {uploadingRelatedImage ? (
                <p className="text-sm text-blue-600 font-medium">上傳中...</p>
              ) : (
                <p className="text-sm text-gray-600">+ 點擊新增相關圖片</p>
              )}
            </label>

            {relatedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-4">
                {relatedImages.map((img, index) => (
                  <div key={img.id} className="relative group">
                    <img src={img.src} alt={`相關圖片 ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeRelatedImage(img.id)}
                      className="absolute top-2 right-2 px-3 py-1.5 bg-red-600 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      刪除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit buttons */}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={() => router.push('/dashboard')} className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              取消
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
              {isSubmitting ? '更新中...' : '更新活動'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
