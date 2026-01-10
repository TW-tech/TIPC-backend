'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'

export default function UpdatePartnerPage() {
  const router = useRouter()
  const params = useParams()
  const partnerId = params.id as string
  
  // 夥伴資訊
  const [name, setName] = useState('')
  const [logo, setLogo] = useState('')
  const [webUrl, setWebUrl] = useState('')
  
  // Logo 上傳
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  
  // UI State
  const [isLoadingPartner, setIsLoadingPartner] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // 載入夥伴資料
  useEffect(() => {
    const fetchPartner = async () => {
      try {
        const response = await fetch(`/api/partners/${partnerId}`)
        const result = await response.json()
        
        if (result.success) {
          const partner = result.data
          setName(partner.name)
          setLogo(partner.logo)
          setWebUrl(partner.webUrl)
          setLogoPreview(partner.logo)
        } else {
          alert('載入夥伴失敗：' + result.error)
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('Failed to fetch partner:', error)
        alert('載入夥伴失敗')
        router.push('/dashboard')
      } finally {
        setIsLoadingPartner(false)
      }
    }
    
    if (partnerId) {
      fetchPartner()
    }
  }, [partnerId, router])

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
    if (!logo && !logoFile) newErrors.push('Logo 為必填')
    if (!webUrl.trim()) newErrors.push('網站連結為必填')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  // 更新夥伴
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSaving(true)

    try {
      // 如果有新上傳的 Logo，先上傳
      let logoUrl = logo
      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      const partnerData = {
        name,
        logo: logoUrl,
        webUrl,
      }

      const response = await fetch(`/api/partners/${partnerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partnerData),
      })

      const result = await response.json()

      if (result.success) {
        alert('夥伴更新成功！')
        router.push('/dashboard')
      } else {
        alert('夥伴更新失敗：' + result.error)
      }
    } catch (error) {
      console.error('Update error:', error)
      alert('夥伴更新失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoadingPartner) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">更新友善夥伴</h1>

        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
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
            
            {/* Logo 預覽 with hover overlay */}
            {logoPreview && (
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
                      更換照片
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview('')
                        setLogoFile(null)
                        setLogo('')
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 font-medium text-sm"
                    >
                      刪除照片
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
              disabled={isSaving || isUploadingLogo}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploadingLogo}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSaving ? '更新中...' : isUploadingLogo ? 'Logo 上傳中...' : '更新夥伴'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
