'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function PartnerUploadPage() {
  const router = useRouter()
  
  // 夥伴資訊
  const [name, setName] = useState('')
  const [logo, setLogo] = useState('')
  const [webUrl, setWebUrl] = useState('')
  
  // Logo 上傳
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // 處理 Logo 文件選擇
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        alert('請選擇圖片文件')
        return
      }

      // 檢查文件大小（限制 5MB）
      const maxSize = 5 * 1024 * 1024
      if (file.size > maxSize) {
        alert('圖片大小不能超過 5MB')
        return
      }

      setLogoFile(file)
      
      // 創建預覽
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 上傳 Logo 到 Cloudinary
  const uploadLogo = async (): Promise<string> => {
    if (!logoFile) {
      throw new Error('未選擇 Logo')
    }

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', logoFile)

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        return result.url
      } else {
        throw new Error(result.error || 'Logo 上傳失敗')
      }
    } finally {
      setIsUploadingLogo(false)
    }
  }

  // 表單驗證
  const validateForm = () => {
    const newErrors: string[] = []

    if (!name.trim()) newErrors.push('夥伴名稱為必填')
    if (!logoFile && !logo) newErrors.push('Logo 為必填')
    if (!webUrl.trim()) newErrors.push('網站連結為必填')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // 先上傳 Logo
      let logoUrl = logo
      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      const partnerData = {
        name,
        logo: logoUrl,
        webUrl,
      }

      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partnerData),
      })

      const result = await response.json()

      if (result.success) {
        alert('夥伴上傳成功！')
        router.push('/dashboard')
      } else {
        alert('夥伴上傳失敗：' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('夥伴上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">上傳友善夥伴</h1>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 夥伴名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              夥伴名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入夥伴名稱"
            />
          </div>

          {/* Logo 上傳 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo <span className="text-red-500">*</span>
            </label>
            
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              id="logo-upload"
              onChange={handleLogoFileChange}
              className="hidden"
              disabled={isUploadingLogo}
            />
            
            {/* Three-state UI */}
            {!logoPreview ? (
              <label
                htmlFor="logo-upload"
                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  isUploadingLogo
                    ? 'bg-blue-50 border-blue-400'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100 hover:border-gray-400'
                }`}
              >
                {isUploadingLogo ? (
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
                      <span className="text-blue-600">點擊上傳 Logo</span> 或拖曳檔案至此
                    </p>
                    <p className="text-xs text-gray-500">支援 JPG（最大 5MB）</p>
                  </>
                )}
              </label>
            ) : (
              <div className="relative group">
                <img
                  src={logoPreview}
                  alt="Logo 預覽"
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-300"
                />
                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center rounded-lg">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                    <label
                      htmlFor="logo-upload"
                      className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-100 cursor-pointer font-medium text-sm"
                    >
                      更換 Logo
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview('')
                        setLogoFile(null)
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 font-medium text-sm"
                    >
                      刪除 Logo
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 網站連結 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              網站連結 <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={webUrl}
              onChange={(e) => setWebUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="https://"
            />
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting || isUploadingLogo}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingLogo}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? '上傳中...' : isUploadingLogo ? 'Logo 上傳中...' : '上傳夥伴'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
