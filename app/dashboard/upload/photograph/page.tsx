'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface NineBlock {
  id: string
  name: string
}

interface CakeCategory {
  id: string
  name: string
}

export default function PhotographUploadPage() {
  const router = useRouter()
  
  // 照片基本資訊
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')
  const [photoDate, setPhotoDate] = useState('')
  const [selectedNineBlocks, setSelectedNineBlocks] = useState<string[]>([])
  const [selectedCakeCategory, setSelectedCakeCategory] = useState<string[]>([])

  
  // 元數據選項
  const [nineBlockOptions, setNineBlockOptions] = useState<NineBlock[]>([])
  const [cakeCategoryOptions, setCakeCategoryOptions] = useState<CakeCategory[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  
  // UI State
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  // 載入元數據
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('/api/metadata')
        const result = await response.json()
        if (result.success) {
          setNineBlockOptions(result.data.nineBlocks)
          setCakeCategoryOptions(result.data.cakeCategories)
          
        }
      } catch (error) {
        console.error('Failed to fetch metadata:', error)
      } finally {
        setIsLoadingMetadata(false)
      }
    }
    fetchMetadata()
  }, [])

  // 處理照片上傳
  const handleImageUpload = async (file: File) => {
    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'photographs')

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.url) {
        setUrl(result.url)
      } else {
        alert('照片上傳失敗：' + (result.error || '未知錯誤'))
      }
    } catch (error) {
      alert('照片上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setUploadingImage(false)
    }
  }

  // 提交照片
  const handleSave = async () => {
    setIsSaving(true)
    setErrors([])

    // 驗證必填欄位
    const validationErrors: string[] = []
    if (!url.trim()) validationErrors.push('照片為必填')
    if (!title.trim()) validationErrors.push('標題為必填')
    if (!description.trim()) validationErrors.push('說明為必填')
    if (!author.trim()) validationErrors.push('作者為必填')
    if (!photoDate.trim()) validationErrors.push('拍攝日期為必填')

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setIsSaving(false)
      return
    }

    try {
      const photographData = {
        url,
        title,
        description,
        author,
        photoDate: new Date(photoDate).toISOString(),
        cakeCategoryIds: selectedCakeCategory,
        nineBlockIds: selectedNineBlocks,
      }

      const response = await fetch('/api/photographs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photographData),
      })

      const result = await response.json()

      if (result.success) {
        alert('照片上傳成功！')
        router.push('/dashboard')
      } else {
        setErrors([result.error || '上傳失敗'])
      }
    } catch (error) {
      console.error('Save error:', error)
      setErrors(['儲存失敗：' + (error instanceof Error ? error.message : '未知錯誤')])
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">上傳照片</h1>
        </div>

        {/* 錯誤提示 */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">請修正以下問題：</h3>
            {errors.map((error, i) => (
              <p key={i} className="text-red-700 text-sm">{error}</p>
            ))}
          </div>
        )}

        {/* 照片資訊 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">照片資訊</h2>
          <div className="space-y-4">
            {/* 照片上傳 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">照片 *</label>
              
              <input
                type="file"
                accept="image/*"
                id="photograph-upload"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    handleImageUpload(file)
                  }
                }}
                className="hidden"
                disabled={uploadingImage}
              />
              
              {!url ? (
                <label
                  htmlFor="photograph-upload"
                  className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    uploadingImage
                      ? 'bg-blue-50 border-blue-400'
                      : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                  }`}
                >
                  {uploadingImage ? (
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
                        <span className="text-blue-600">點擊上傳照片</span> 或拖曳檔案至此
                      </p>
                      <p className="text-xs text-gray-500">支援 JPG, WebP（最大 5MB）</p>
                    </>
                  )}
                </label>
              ) : (
                <div className="relative group">
                  <img
                    src={url}
                    alt="照片預覽"
                    className="w-full max-h-96 object-contain rounded-lg border border-gray-300"
                  />
                  <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center rounded-lg">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <label
                        htmlFor="photograph-upload"
                        className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-100 cursor-pointer font-medium text-sm"
                      >
                        更換照片
                      </label>
                      <button
                        type="button"
                        onClick={() => setUrl('')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 font-medium text-sm"
                      >
                        刪除照片
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">標題 *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                placeholder="輸入照片標題"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                說明 * 
                <span className={`ml-2 text-xs ${description.length > 40 ? 'text-red-600' : 'text-gray-500'}`}>
                  ({description.length}/40 字)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 40) {
                    setDescription(e.target.value)
                  }
                }}
                maxLength={40}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 min-h-[120px]"
                placeholder="輸入照片說明（最多40字）"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">作者 *</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="攝影師名稱"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">拍攝日期 *</label>
                <input
                  type="date"
                  value={photoDate}
                  onChange={(e) => setPhotoDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
            </div>

            {/* 九宮格分類（多選） */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                九宮格分類 * {selectedNineBlocks.length > 0 && `(已選 ${selectedNineBlocks.length} 項)`}
              </label>
              {isLoadingMetadata ? (
                <div className="text-gray-500 text-sm">載入中...</div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  {!nineBlockOptions || nineBlockOptions.length === 0 ? (
                    <p className="text-gray-500 text-sm">無可用選項</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {nineBlockOptions.map((option) => {
                        const isChecked = selectedNineBlocks.includes(option.id)
                        return (
                          <label key={option.id} className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedNineBlocks([...selectedNineBlocks, option.id])
                                } else {
                                  setSelectedNineBlocks(selectedNineBlocks.filter(id => id !== option.id))
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-gray-700">{option.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 蛋糕圖分類 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                蛋糕圖分類 * {selectedCakeCategory.length > 0 && `(已選 ${selectedCakeCategory.length} 項)`}
              </label>
              {isLoadingMetadata ? (
                <div className="text-gray-500 text-sm">載入中...</div>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4">
                  {!cakeCategoryOptions || cakeCategoryOptions.length === 0 ? (
                    <p className="text-gray-500 text-sm">無可用選項</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {cakeCategoryOptions.map((option) => (
                        <label key={option.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={selectedCakeCategory.includes(option.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedCakeCategory([...selectedCakeCategory, option.id])
                              } else {
                                setSelectedCakeCategory(selectedCakeCategory.filter(id => id !== option.id))
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-gray-700">{option.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 提交按鈕 */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSaving ? '上傳中...' : '上傳照片'}
          </button>
        </div>
      </div>
    </div>
  )
}
