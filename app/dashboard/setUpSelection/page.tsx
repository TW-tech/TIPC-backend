'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Selection {
  id:string;
  englishTitle?:string;
  title: string;
  author:string;
  createdAt: string;
  setUpSelection: boolean;
}

export default function SetUpSelectionPage() {
  const router = useRouter()
  const [selections, setSelections] = useState<Selection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSelections()
  }, [])

  const fetchSelections = async () => {
    try {
      const response = await fetch('/api/selections')
      
      if (!response.ok) {
        const error = await response.json()
        alert('載入影響力精選失敗：' + (error.error || '未知錯誤'))
        return
      }
      
      const data = await response.json()
      setSelections(data.data)
    } catch (error) {
      console.error('Failed to fetch selections:', error)
      alert('載入影響力精選失敗')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMainPageToggle = async (selectionId: string, currentValue: boolean) => {
    setUpdatingId(selectionId)
    try {
      const response = await fetch(`/api/selections/${selectionId}/mainPage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          setUpSelection: !currentValue
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setSelections(selections.map(selection => 
          selection.id === selectionId 
            ? { ...selection, setUpSelection: !currentValue }
            : selection
        ))
      } else {
        alert('更新失敗：' + result.error)
      }
    } catch (error) {
      console.error('Failed to update selection status:', error)
      alert('更新失敗')
    } finally {
      setUpdatingId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">載入中...</div>
      </div>
    )
  }

  const selectionCount = selections.filter(e => e.setUpSelection).length
  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">設定首頁影響力精選</h1>
          <p className="mt-2 text-gray-600">
            勾選活動以顯示在前台網站首頁的影響力精選區塊（最多 3 個）
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            已選擇：{selectionCount} / 3
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顯示於首頁
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    標題
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作者
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    建立時間
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {selections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      目前沒有影響力精選內容
                    </td>
                  </tr>
                ) : (
                  selections.map((selection) => (
                    <tr key={selection.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selection.setUpSelection}
                          onChange={() => handleMainPageToggle(selection.id, selection.setUpSelection)}
                          disabled={updatingId === selection.id}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {selection.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {selection.author}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(selection.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {selections.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            總共 {selections.length} 個活動，
            {selections.filter(e => e.setUpSelection).length} 個顯示於首頁
          </div>
        )}
      </div>
    </div>
  )
}
