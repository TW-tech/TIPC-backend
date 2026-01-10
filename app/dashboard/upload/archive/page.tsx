'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ArchiveUploadPage() {
  const router = useRouter()
  
  // 檔案索引資訊
  const [classValue, setClassValue] = useState('')
  const [webName, setWebName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [orgWebLink, setOrgWebLink] = useState('')
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  // 表單驗證
  const validateForm = () => {
    const newErrors: string[] = []

    if (!classValue.trim()) newErrors.push('分類為必填')
    if (!webName.trim()) newErrors.push('網站名稱為必填')
    if (!orgName.trim()) newErrors.push('組織名稱為必填')
    if (!orgWebLink.trim()) newErrors.push('組織網站連結為必填')

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
      const archiveData = {
        Class: classValue,
        WebName: webName,
        OrgName: orgName,
        OrgWebLink: orgWebLink,
      }

      const response = await fetch('/api/archives', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(archiveData),
      })

      const result = await response.json()

      if (result.success) {
        alert('檔案索引上傳成功！')
        router.push('/dashboard')
      } else {
        alert('典藏索引上傳失敗：' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('典藏索引上傳失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">上傳典藏索引</h1>

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
          {/* 分類 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              分類 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="照片"
                  checked={classValue === '照片'}
                  onChange={(e) => setClassValue(e.target.value)}
                  className="rounded-full border-gray-300"
                />
                <span className="text-sm text-gray-900">照片</span>
              </label>
              <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="影音"
                  checked={classValue === '影音'}
                  onChange={(e) => setClassValue(e.target.value)}
                  className="rounded-full border-gray-300"
                />
                <span className="text-sm text-gray-900">影音</span>
              </label>
              <label className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  value="地圖"
                  checked={classValue === '地圖'}
                  onChange={(e) => setClassValue(e.target.value)}
                  className="rounded-full border-gray-300"
                />
                <span className="text-sm text-gray-900">地圖</span>
              </label>
            </div>
          </div>

          {/* 網站名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              網站名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={webName}
              onChange={(e) => setWebName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入網站名稱"
            />
          </div>

          {/* 組織名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              組織名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入組織名稱"
            />
          </div>

          {/* 組織網站連結 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              組織網站連結 <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={orgWebLink}
              onChange={(e) => setOrgWebLink(e.target.value)}
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
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isSubmitting ? '上傳中...' : '上傳檔案索引'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
