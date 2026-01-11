'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookUploadPage() {
  const router = useRouter()

  // Form state
  const [bookname, setBookname] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [authorInput, setAuthorInput] = useState('')
  const [publisher, setPublisher] = useState('')
  const [isbn, setIsbn] = useState('')
  const [coverImage, setCoverImage] = useState('')

  // UI state
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handle cover image upload to Cloudinary
  const handleCoverImageUpload = async (file: File) => {
    setUploadingCoverImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'books')

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('上傳失敗')
      }

      const data = await response.json()
      setCoverImage(data.url)
    } catch (error) {
      console.error('Image upload error:', error)
      alert('圖片上傳失敗，請重試')
    } finally {
      setUploadingCoverImage(false)
    }
  }

  // Add author to list
  const addAuthor = () => {
    const trimmedAuthor = authorInput.trim()
    if (trimmedAuthor && !authors.includes(trimmedAuthor)) {
      setAuthors([...authors, trimmedAuthor])
      setAuthorInput('')
    }
  }

  // Remove author from list
  const removeAuthor = (authorToRemove: string) => {
    setAuthors(authors.filter(a => a !== authorToRemove))
  }

  // Validate form
  const validateForm = () => {
    if (!bookname.trim()) {
      alert('請輸入書名')
      return false
    }
    if (authors.length === 0) {
      alert('請至少添加一位作者')
      return false
    }
    if (!publisher.trim()) {
      alert('請輸入出版社')
      return false
    }
    if (!isbn.trim()) {
      alert('請輸入 ISBN')
      return false
    }
    if (!coverImage) {
      alert('請上傳封面圖片')
      return false
    }
    return true
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const bookData = {
        bookname,
        authors,
        publisher,
        isbn,
        image: coverImage,
      }

      const response = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookData),
      })

      if (!response.ok) {
        throw new Error('上傳失敗')
      }

      alert('書籍上傳成功！')
      router.push('/dashboard')
    } catch (error) {
      console.error('Upload error:', error)
      alert('上傳失敗，請重試')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">上傳書籍</h1>
          <p className="mt-2 text-gray-600">填寫書籍資訊並上傳封面圖片</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          {/* 書名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              書名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bookname}
              onChange={(e) => setBookname(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入書名"
            />
          </div>

          {/* 作者 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作者 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={authorInput}
                onChange={(e) => setAuthorInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addAuthor()
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="輸入作者姓名"
              />
              <button
                type="button"
                onClick={addAuthor}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              >
                新增
              </button>
            </div>

            {/* 已添加的作者 */}
            {authors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {authors.map((author, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {author}
                    <button
                      type="button"
                      onClick={() => removeAuthor(author)}
                      className="hover:text-blue-900 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 出版社 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              出版社 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={publisher}
              onChange={(e) => setPublisher(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入出版社"
            />
          </div>

          {/* ISBN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ISBN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={isbn}
              onChange={(e) => setIsbn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入 ISBN ex:9786267603079"
            />
          </div>

          {/* 封面圖片 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              封面圖片 <span className="text-red-500">*</span>
            </label>
            
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              id="cover-image-upload"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleCoverImageUpload(file)
                }
              }}
              className="hidden"
              disabled={uploadingCoverImage}
            />
            
            {/* Three-state UI */}
            {!coverImage ? (
              <label
                htmlFor="cover-image-upload"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  uploadingCoverImage
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                }`}
              >
                {uploadingCoverImage ? (
                  <>
                    <svg className="w-10 h-10 mb-3 text-blue-500 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-sm text-blue-600 font-medium">上傳中...</p>
                  </>
                ) : (
                  <>
                    <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-gray-700 font-medium">
                      <span className="text-blue-600">點擊上傳封面圖片</span> 或拖曳檔案至此
                    </p>
                    <p className="text-xs text-gray-500">支援 JPG, PNG（最大 5MB）</p>
                  </>
                )}
              </label>
            ) : (
              <div className="relative group">
                <img
                  src={coverImage}
                  alt="封面預覽"
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-300"
                />
                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center rounded-lg">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <label
                      htmlFor="cover-image-upload"
                      className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-100 cursor-pointer font-medium text-sm"
                    >
                      更換圖片
                    </label>
                    <button
                      type="button"
                      onClick={() => setCoverImage('')}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 font-medium text-sm"
                    >
                      刪除圖片
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '上傳中...' : '上傳書籍'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
