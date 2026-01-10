'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Article {
  id: string
  title: string
  author: string
  slug: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

interface Photograph {
  id: string
  title: string
  author: string
  description: string
  photoDate: string
  createdAt: string
  updatedAt: string
}

interface Video {
  id: string
  title: string
  author: string
  description: string
  videoDate: string
  createdAt: string
  updatedAt: string
}

interface Archive {
  id: number
  Class: string
  WebName: string
  OrgName: string
  OrgWebLink: string
}

interface Partner {
  id: number
  name: string
  logo: string
  webUrl: string
}

interface Book {
  id: number
  bookname: string
  authors: string[]
  publisher: string
  isbn: string
  image: string
  createdAt: string
  updatedAt: string
}

type ContentItem = (Article | Photograph | Video | Archive | Partner | Book) & { type: 'article' | 'photograph' | 'video' | 'archive' | 'partner' | 'book' }

export default function DashboardPage() {
  const router = useRouter()
  const [contents, setContents] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // 獲取使用者角色
    const userData = localStorage.getItem('user')
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setUserRole(user.title)
      } catch (err) {
        console.error('Failed to parse user data:', err)
      }
    }
    fetchContents()
  }, [])

  const fetchContents = async () => {
    try {
      setIsLoading(true)
      
      // 並行獲取文章、照片、影片、檔案索引、夥伴和書籍
      const [articlesResponse, photographsResponse, videosResponse, archivesResponse, partnersResponse, booksResponse] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/photographs'),
        fetch('/api/videos'),
        fetch('/api/archives'),
        fetch('/api/partners'),
        fetch('/api/books')
      ])

      const articlesResult = await articlesResponse.json()
      const photographsResult = await photographsResponse.json()
      const videosResult = await videosResponse.json()
      const archivesResult = await archivesResponse.json()
      const partnersResult = await partnersResponse.json()
      const booksResult = await booksResponse.json()
      
      const allContents: ContentItem[] = []
      
      if (articlesResult.success) {
        allContents.push(...articlesResult.data.map((article: Article) => ({
          ...article,
          type: 'article' as const
        })))
      }
      
      if (photographsResult.success) {
        allContents.push(...photographsResult.data.map((photo: Photograph) => ({
          ...photo,
          type: 'photograph' as const
        })))
      }
      
      if (videosResult.success) {
        allContents.push(...videosResult.data.map((video: Video) => ({
          ...video,
          type: 'video' as const
        })))
      }
      
      if (archivesResult.success) {
        allContents.push(...archivesResult.data.map((archive: Archive) => ({
          ...archive,
          type: 'archive' as const,
          // 為了統一排序，添加 updatedAt 欄位
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        })))
      if (partnersResult.success) {
        allContents.push(...partnersResult.data.map((partner: Partner) => ({
          ...partner,
          type: 'partner' as const,
          // 為了統一排序，添加 updatedAt 欄位
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        })))
      }
      
      if (Array.isArray(booksResult)) {
        allContents.push(...booksResult.map((book: Book) => ({
          ...book,
          type: 'book' as const
        })))
      }
      
      }
      
      // 按更新時間排序（最新的在前）
      allContents.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      
      setContents(allContents)
    } catch (err) {
      setError('載入內容時發生錯誤')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未發布'
    return new Date(dateString).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const deleteArticle = async (articleId: string, articleTitle: string) => {
    if (!confirm(`確定要刪除文章「${articleTitle}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        alert('文章已成功刪除')
        fetchContents()
      } else {
        alert('刪除失敗：' + (result.error || '未知錯誤'))
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('刪除失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    }
  }

  const deletePhotograph = async (photographId: string, photographTitle: string) => {
    if (!confirm(`確定要刪除照片「${photographTitle}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/photographs/${photographId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        alert('照片已成功刪除')
        fetchContents()
      } else {
        alert('刪除失敗：' + (result.error || '未知錯誤'))
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('刪除失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    }
  }

  const deleteVideo = async (videoId: string, videoTitle: string) => {
    if (!confirm(`確定要刪除影片「${videoTitle}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        alert('影片已成功刪除')
        fetchContents()
      } else {
        alert('刪除失敗：' + (result.error || '未知錯誤'))
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('刪除失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    }
  }

  const deleteArchive = async (archiveId: number, archiveName: string) => {
    if (!confirm(`確定要刪除檔案索引「${archiveName}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/archives/${archiveId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        alert('檔案索引已成功刪除')
        fetchContents()
      } else {
        alert('刪除失敗：' + (result.error || '未知錯誤'))
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('刪除失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    }
  }

  const deletePartner = async (partnerId: number, partnerName: string) => {
    if (!confirm(`確定要刪除夥伴「${partnerName}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/partners/${partnerId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        alert('夥伴已成功刪除')
        fetchContents()
      } else {
        alert('刪除失敗：' + (result.error || '未知錯誤'))
      }
    } catch (err) {
      console.error('Delete error:', err)
      alert('刪除失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    }
  }

  const deleteBook = async (bookId: number, bookname: string) => {
    if (!confirm(`確定要刪除書籍「${bookname}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      alert('書籍已成功刪除')
      fetchContents()
    } catch (err) {
      console.error('Delete error:', err)
      alert('刪除失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">內容管理</h1>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">載入中...</div>
          </div>
        ) : contents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">尚無內容</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    類型
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    標題
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作者
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    發布日期
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    更新時間
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contents.map((item) => (
                  <tr key={`${item.type}-${item.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type === 'article' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          觀點文章
                        </span>
                      ) : item.type === 'photograph' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          光影故事
                        </span>
                      ) : item.type === 'video' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          TIPC影音
                        </span>
                      ) : item.type === 'archive' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          典藏索引
                        </span>
                      ) : item.type === 'partner' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                          友善夥伴
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          TIPC選書
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.type === 'archive' ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{(item as Archive).WebName}</div>
                          <div className="text-sm text-gray-500">{(item as Archive).OrgName}</div>
                        </>
                      ) : item.type === 'partner' ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{(item as Partner).name}</div>
                          <div className="text-sm text-gray-500">{(item as Partner).webUrl}</div>
                        </>
                      ) : item.type === 'book' ? (
                        <>
                          <div className="text-sm font-medium text-gray-900">{(item as Book).bookname}</div>
                          <div className="text-sm text-gray-500">{(item as Book).publisher} - {(item as Book).isbn}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-gray-900">{item.title}</div>
                          {item.type === 'article' && (
                            <div className="text-sm text-gray-500">{(item as Article).slug}</div>
                          )}
                          {item.type === 'photograph' && (
                            <div className="text-sm text-gray-500">{(item as Photograph).description}</div>
                          )}
                          {item.type === 'video' && (
                            <div className="text-sm text-gray-500">{(item as Video).description}</div>
                          )}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.type === 'archive' || item.type === 'partner' 
                          ? '-' 
                          : item.type === 'book'
                          ? (item as Book).authors.join(', ')
                          : item.author}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {item.type === 'article' 
                          ? formatDate((item as Article).publishedAt)
                          : item.type === 'photograph'
                          ? formatDate((item as Photograph).photoDate)
                          : item.type === 'video'
                          ? formatDate((item as Video).videoDate)
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(item.updatedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {item.type === 'article' ? (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/article/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deleteArticle(item.id, item.title)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                刪除
                              </button>
                            )}
                          </>
                        ) : item.type === 'photograph' ? (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/photograph/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deletePhotograph(item.id, item.title)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                刪除
                              </button>
                            )}
                          </>
                        ) : item.type === 'video' ? (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/video/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deleteVideo(item.id, item.title)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                刪除
                              </button>
                            )}
                          </>
                        ) : item.type === 'archive' ? (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/archive/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deleteArchive((item as Archive).id, (item as Archive).WebName)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                刪除
                              </button>
                            )}
                          </>
                        ) : item.type === 'partner' ? (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/partner/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deletePartner((item as Partner).id, (item as Partner).name)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                刪除
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/book/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deleteBook((item as Book).id, (item as Book).bookname)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                刪除
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
