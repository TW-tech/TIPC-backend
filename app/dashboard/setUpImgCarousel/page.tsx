'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Event {
  id: string
  title: string
  eventDate: string
  mainImage: string
  alt: string
  showInImgCarousel: boolean
  createdAt: string
  updatedAt: string
}

export default function SetUpImgCarouselPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      
      if (!response.ok) {
        const error = await response.json()
        alert('載入活動失敗：' + (error.error || '未知錯誤'))
        return
      }
      
      const events = await response.json()
      setEvents(events)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      alert('載入活動失敗')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCarouselToggle = async (eventId: string, currentValue: boolean) => {
    setUpdatingId(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}/carousel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showInImgCarousel: !currentValue
        })
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setEvents(events.map(event => 
          event.id === eventId 
            ? { ...event, showInImgCarousel: !currentValue }
            : event
        ))
      } else {
        alert('更新失敗：' + result.error)
      }
    } catch (error) {
      console.error('Failed to update carousel status:', error)
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

  const carouselCount = events.filter(e => e.showInImgCarousel).length

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">設定首頁圖片跑馬燈</h1>
          <p className="mt-2 text-gray-600">
            勾選活動以顯示在前台網站首頁的圖片跑馬燈區塊（最多 4 個）
          </p>
          <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            已選擇：{carouselCount} / 4
          </div>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    顯示於跑馬燈
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    活動標題
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    活動日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    封面圖片
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    建立時間
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      目前沒有活動
                    </td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={event.showInImgCarousel}
                          onChange={() => handleCarouselToggle(event.id, event.showInImgCarousel)}
                          disabled={updatingId === event.id}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer disabled:opacity-50"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {event.title}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(event.eventDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <img
                          src={event.mainImage}
                          alt={event.alt}
                          className="h-16 w-24 object-cover rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(event.createdAt)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {events.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            總共 {events.length} 個活動，
            {events.filter(e => e.showInImgCarousel).length} 個顯示於跑馬燈
          </div>
        )}
      </div>
    </div>
  )
}
