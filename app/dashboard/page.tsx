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
  createdAt?: string
  updatedAt?: string
}

interface Partner {
  id: number
  name: string
  logo: string
  webUrl: string
  createdAt?: string
  updatedAt?: string
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

interface Event {
  id: string
  title: string
  eventDate: string
  mainImage: string
  alt: string
  createdAt: string
  updatedAt: string
}

interface Selection {
  id: string
  title: string
  author: string
  slug: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

type ContentItem = (Article | Photograph | Video | Archive | Partner | Book | Event | Selection) & { type: 'article' | 'photograph' | 'video' | 'archive' | 'partner' | 'book' | 'event' | 'selection' }

export default function DashboardPage() {
  const router = useRouter()
  const [contents, setContents] = useState<ContentItem[]>([])
  const [filteredContents, setFilteredContents] = useState<ContentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  
  // Filter states
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTitle, setSearchTitle] = useState<string>('')
  const [searchAuthor, setSearchAuthor] = useState<string>('')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

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
      
      // 並行獲取文章、照片、影片、典藏索引、夥伴、書籍、影響力精選和活動
      const [articlesResponse, photographsResponse, videosResponse, archivesResponse, partnersResponse, booksResponse, eventsResponse, selectionsResponse] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/photographs'),
        fetch('/api/videos'),
        fetch('/api/archives'),
        fetch('/api/partners'),
        fetch('/api/books'),
        fetch('/api/events'),
        fetch('/api/selections')
      ])

      const articlesResult = await articlesResponse.json()
      const photographsResult = await photographsResponse.json()
      const videosResult = await videosResponse.json()
      const archivesResult = await archivesResponse.json()
      const partnersResult = await partnersResponse.json()
      const booksResult = await booksResponse.json()
      const eventsResult = await eventsResponse.json()
      const selectionsResult = await selectionsResponse.json()
      
      const allContents: ContentItem[] = []
      
      if (articlesResult.success) {
        allContents.push(...articlesResult.data.map((article: Article) => ({
          ...article,
          type: 'article' as const
        })))
      }

      if ( selectionsResult.success) {
        allContents.push(...selectionsResult.data.map((selection: Selection) => ({
          ...selection,
          type: 'selection' as const
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
      
      if (Array.isArray(eventsResult)) {
        allContents.push(...eventsResult.map((event: Event) => ({
          ...event,
          type: 'event' as const
        })))
      }
      
      }
      
      // 按更新時間排序（最新的在前）
      allContents.sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
        return bTime - aTime
      })
      
      setContents(allContents)
      setFilteredContents(allContents)
    } catch (err) {
      setError('載入內容時發生錯誤')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  // Apply filters whenever contents or filter values change
  useEffect(() => {
    let filtered = [...contents]

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType)
    }

    // Filter by title
    if (searchTitle.trim()) {
      filtered = filtered.filter(item => {
        const title = item.type === 'archive' 
          ? (item as Archive).WebName.toLowerCase()
          : item.type === 'partner'
          ? (item as Partner).name.toLowerCase()
          : item.type === 'book'
          ? (item as Book).bookname.toLowerCase()
          : (item as Article | Photograph | Video | Event | Selection).title.toLowerCase()
        
        return title.includes(searchTitle.toLowerCase())
      })
    }

    // Filter by author
    if (searchAuthor.trim()) {
      filtered = filtered.filter(item => {
        if (item.type === 'archive' || item.type === 'partner' || item.type === 'event') {
          return false
        }
        if (item.type === 'book') {
          return (item as Book).authors.some(author => 
            author.toLowerCase().includes(searchAuthor.toLowerCase())
          )
        }
        return (item as Article | Photograph | Video | Selection).author.toLowerCase().includes(searchAuthor.toLowerCase())
      })
    }

    // Sort by date
    filtered.sort((a, b) => {
      let dateA: Date, dateB: Date

      if (a.type === 'article') {
        dateA = new Date((a as Article).publishedAt || (a as Article).updatedAt || 0)
      } else if (a.type === 'photograph') {
        dateA = new Date((a as Photograph).photoDate)
      } else if (a.type === 'video') {
        dateA = new Date((a as Video).videoDate)
      } else if (a.type === 'event') {
        dateA = new Date((a as Event).eventDate)
      } else if (a.type === 'selection') {
        dateA = new Date((a as Selection).publishedAt || (a as Selection).updatedAt || 0)
      } else {
        dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(0)
      }

      if (b.type === 'article') {
        dateB = new Date((b as Article).publishedAt || (b as Article).updatedAt || 0)
      } else if (b.type === 'photograph') {
        dateB = new Date((b as Photograph).photoDate)
      } else if (b.type === 'video') {
        dateB = new Date((b as Video).videoDate)
      } else if (b.type === 'event') {
        dateB = new Date((b as Event).eventDate)
      } else if (b.type === 'selection') {
        dateB = new Date((b as Selection).publishedAt || (b as Selection).updatedAt || 0)
      } else {
        dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(0)
      }

      return sortOrder === 'desc' 
        ? dateB.getTime() - dateA.getTime()
        : dateA.getTime() - dateB.getTime()
    })

    setFilteredContents(filtered)
  }, [contents, filterType, searchTitle, searchAuthor, sortOrder])

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

  const deleteSelection = async (selectionId: string, selectionTitle: string) => {
    if (!confirm(`確定要刪除「${selectionTitle}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/selections/${selectionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        alert('已成功刪除')
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
    if (!confirm(`確定要刪除典藏索引「${archiveName}」嗎？此操作無法復原。`)) {
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
        alert('典藏索引已成功刪除')
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

  const deleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`確定要刪除活動「${eventTitle}」嗎？此操作無法復原。`)) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      alert('活動已成功刪除')
      fetchContents()
    } catch (err) {
      console.error('Delete error:', err)
      alert('刪除失敗：' + (err instanceof Error ? err.message : '未知錯誤'))
    }
  }

  return (
    <div className="p-8">
      <div className="max-w-8xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">內容管理</h1>
        </div>

        {/* Filter section */}
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                類型篩選
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="all">全部</option>
                <option value="article">觀點文章</option>
                <option value="photograph">光影故事</option>
                <option value="video">TIPC影音</option>
                <option value="archive">典藏索引</option>
                <option value="partner">友善夥伴</option>
                <option value="book">TIPC選書</option>
                <option value="event">活動資訊</option>
              </select>
            </div>

            {/* Title search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                標題搜尋
              </label>
              <input
                type="text"
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                placeholder="輸入標題關鍵字..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {/* Author search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                作者搜尋
              </label>
              <input
                type="text"
                value={searchAuthor}
                onChange={(e) => setSearchAuthor(e.target.value)}
                placeholder="輸入作者名稱..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>

            {/* Date sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                日期排序
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              >
                <option value="desc">最新優先</option>
                <option value="asc">最舊優先</option>
              </select>
            </div>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            顯示 {filteredContents.length} 筆結果 (共 {contents.length} 筆)
          </div>
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
        ) : filteredContents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">
              {contents.length === 0 ? '尚無內容' : '沒有符合條件的內容'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 table-fixed">
              <colgroup>
                <col style={{ width: '120px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '130px' }} />
                <col style={{ width: '180px' }} />
              </colgroup>
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
                {filteredContents.map((item) => (
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
                      ) : item.type === 'book' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          TIPC選書
                        </span>
                      ) : item.type === 'selection' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          影響力精選
                        </span>
                      ) : item.type === 'event' ?(
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          活動探索
                        </span>
                      ) : null}
                    </td>
                    <td className="px-6 py-4 max-w-[350px]">
                      {item.type === 'archive' ? (
                        <div className="text-sm font-medium text-gray-900 truncate">{(item as Archive).WebName}</div>
                      ) : item.type === 'partner' ? (
                        <div className="text-sm font-medium text-gray-900 truncate">{(item as Partner).name}</div>
                      ) : item.type === 'book' ? (
                        <div className="text-sm font-medium text-gray-900 truncate">{(item as Book).bookname}</div>
                      ) : item.type === 'event' ? (
                        <div className="text-sm font-medium text-gray-900 truncate">{(item as Event).title}</div>
                      ) : (
                        <div className="text-sm font-medium text-gray-900 truncate">{(item as Article | Photograph | Video).title}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 truncate">
                        {item.type === 'archive' || item.type === 'partner' || item.type === 'event'
                          ? '-' 
                          : item.type === 'book'
                          ? (item as Book).authors.join(', ')
                          : (item as Article | Photograph | Video).author}
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
                          : item.type === 'event'
                          ? formatDate((item as Event).eventDate)
                          : '-'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.updatedAt ? formatDate(item.updatedAt) : '-'}</div>
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
                                onClick={() => deleteArticle(String(item.id), (item as Article).title)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                刪除
                              </button>
                            )}
                          </>
                        )  : item.type === 'selection' ? (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/selection/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deleteSelection(String(item.id), (item as Selection).title)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                刪除
                              </button>
                            )}
                          </>
                        ) 
                        : item.type === 'photograph' ? (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/photograph/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deletePhotograph(String(item.id), (item as Photograph).title)}
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
                                onClick={() => deleteVideo(String(item.id), (item as Video).title)}
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
                        ) : item.type === 'book' ? (
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
                        ) : (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/update/event/${item.id}`)}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              更新
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => deleteEvent((item as Event).id, (item as Event).title)}
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
