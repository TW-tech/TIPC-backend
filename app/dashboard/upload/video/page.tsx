'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface KeyWord {
  id: string
  name: string
}

interface NineBlock {
  id: string
  name: string
}

interface CakeCategory {
  id: string
  name: string
}

export default function VideoUploadPage() {
  const router = useRouter()
  
  // 影片基本資訊
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('')
  const [videoDate, setVideoDate] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [selectedKeyWords, setSelectedKeyWords] = useState<string[]>([])
  const [newKeywords, setNewKeywords] = useState<string[]>([])
  const [selectedNineBlocks, setSelectedNineBlocks] = useState<string[]>([])
  const [selectedCakeCategories, setSelectedCakeCategories] = useState<string[]>([])
  
  // 關鍵字搜索
  const [newKeywordInput, setNewKeywordInput] = useState('')
  const [keywordSuggestions, setKeywordSuggestions] = useState<KeyWord[]>([])
  const [allKeywords, setAllKeywords] = useState<KeyWord[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearchingKeywords, setIsSearchingKeywords] = useState(false)
  
  // 元數據選項
  const [keyWordOptions, setKeyWordOptions] = useState<KeyWord[]>([])
  const [nineBlockOptions, setNineBlockOptions] = useState<NineBlock[]>([])
  const [cakeCategoryOptions, setCakeCategoryOptions] = useState<CakeCategory[]>([])
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)
  
  // UI State
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false)

  // 載入元數據
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch('/api/metadata')
        const result = await response.json()
        if (result.success) {
          setKeyWordOptions(result.data.keyWords)
          setAllKeywords(result.data.keyWords)
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

  // 搜索關鍵字（自動完成）
  const searchKeywords = async (query: string) => {
    if (!query.trim()) {
      setKeywordSuggestions([])
      setShowSuggestions(false)
      return
    }

    setIsSearchingKeywords(true)
    try {
      const response = await fetch(`/api/keywords/search?q=${encodeURIComponent(query)}`)
      const result = await response.json()
      if (result.success && result.data) {
        // 過濾掉已選擇的關鍵字
        const filtered = result.data.filter((kw: KeyWord) => !selectedKeyWords.includes(kw.id))
        setKeywordSuggestions(filtered)
        setShowSuggestions(filtered.length > 0)
      }
    } catch (error) {
      console.error('搜索關鍵字失敗:', error)
    } finally {
      setIsSearchingKeywords(false)
    }
  }

  // 新增關鍵字
  const addNewKeyword = () => {
    const totalKeywords = selectedKeyWords.length + newKeywords.length
    if (totalKeywords >= 6) {
      alert('關鍵字最多只能選擇 6 項')
      return
    }
    const trimmed = newKeywordInput.trim()
    if (trimmed && !newKeywords.includes(trimmed)) {
      setNewKeywords([...newKeywords, trimmed])
      setNewKeywordInput('')
      setShowSuggestions(false)
    }
  }

  // 從建議中選擇現有關鍵字
  const selectKeywordFromSuggestion = (keyword: KeyWord) => {
    const totalKeywords = selectedKeyWords.length + newKeywords.length
    if (totalKeywords >= 6) {
      alert('關鍵字最多只能選擇 6 項')
      return
    }
    if (!selectedKeyWords.includes(keyword.id)) {
      setSelectedKeyWords([...selectedKeyWords, keyword.id])
      // 將選中的關鍵字加入 allKeywords（如果不存在）
      setAllKeywords(prev => {
        const exists = prev?.find(k => k.id === keyword.id)
        if (!exists) {
          return [...(prev || []), keyword]
        }
        return prev
      })
      setNewKeywordInput('')
      setShowSuggestions(false)
    }
  }

  // 刪除已選擇的現有關鍵字
  const removeSelectedKeyword = (keywordId: string) => {
    setSelectedKeyWords(selectedKeyWords.filter(id => id !== keywordId))
  }

  // 刪除新增的關鍵字
  const removeNewKeyword = (keyword: string) => {
    setNewKeywords(newKeywords.filter(k => k !== keyword))
  }

  // 處理封面圖片上傳
  const handleCoverImageUpload = async (file: File) => {
    setUploadingCoverImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'videos')

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success && result.url) {
        setCoverImage(result.url)
      } else {
        alert('封面圖片上傳失敗：' + (result.error || '未知錯誤'))
      }
    } catch (error) {
      alert('封面圖片上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
    } finally {
      setUploadingCoverImage(false)
    }
  }

  // 計算不含標點符號的字數
  const countWithoutPunctuation = (text: string): number => {
    // 移除所有標點符號（中英文）
    return text.replace(/[\p{P}\p{S}\s]/gu, '').length
  }

  // 表單驗證
  const validateForm = () => {
    const newErrors: string[] = []

    if (!url.trim()) newErrors.push('影片連結為必填')
    if (!title.trim()) newErrors.push('標題為必填')
    if (!description.trim()) newErrors.push('說明為必填')
    if (countWithoutPunctuation(description) > 100) newErrors.push('說明不可超過100字（不含標點符號）')
    if (!author.trim()) newErrors.push('作者為必填')
    if (!videoDate) newErrors.push('影片日期為必填')
    if (!coverImage.trim()) newErrors.push('封面照片為必填')
    if (selectedKeyWords.length === 0 && newKeywords.length === 0) newErrors.push('請至少選擇一個關鍵字')
    if (selectedCakeCategories.length === 0) newErrors.push('請至少選擇一個蛋糕圖分類')

    setErrors(newErrors)
    return newErrors.length === 0
  }

  // 處理九宮格選擇
  const handleNineBlockToggle = (nineBlockId: string) => {
    setSelectedNineBlocks(prev =>
      prev.includes(nineBlockId)
        ? prev.filter(id => id !== nineBlockId)
        : [...prev, nineBlockId]
    )
  }

  // 處理蛋糕圖分類選擇
  const handleCakeCategoryToggle = (categoryId: string) => {
    setSelectedCakeCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // 提交表單
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const videoData = {
        url,
        title,
        mainImg: coverImage,
        description,
        author,
        videoDate,
        keyWordIds: selectedKeyWords,
        nineBlockIds: selectedNineBlocks,
        cakeCategoryIds: selectedCakeCategories,
      }

      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoData),
      })

      const result = await response.json()

      if (result.success) {
        alert('影片上傳成功！')
        router.push('/dashboard')
      } else {
        alert('影片上傳失敗：' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('影片上傳失敗')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingMetadata) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">載入中...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">上傳影片</h1>

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
            {/* 封面照片 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">封面照片 *</label>
              
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
                      <p className="text-xs text-gray-500">支援 JPG, WebP（最大 5MB）</p>
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
          {/* 影片連結 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              影片連結 <span className="text-red-500">*</span>
            </label>
            <div className="mb-2 text-sm text-gray-500">
                請使用 YouTube 影片的嵌入連結格式，例如：https://www.youtube.com/embed/影片ID
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="https://www.youtube.com/embed/..."
            />
          </div>

          {/* 標題 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              標題 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入影片標題"
            />
          </div>

          {/* 說明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              說明 <span className="text-red-500">*</span>
              <span className="text-sm text-gray-500 ml-2">
                ({countWithoutPunctuation(description)}/100 字，不含標點符號)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入影片說明（限100字以內，不含標點符號）"
            />
          </div>

          {/* 作者 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作者 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="請輸入作者姓名"
            />
          </div>

          {/* 影片日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              影片日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={videoDate}
              onChange={(e) => setVideoDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* 關鍵字選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              關鍵字 <span className="text-red-500">*</span> <span className="text-xs text-gray-500 font-normal">（最多 6 項）</span>
              {(selectedKeyWords.length + newKeywords.length) > 0 && (
                <span className={`ml-2 ${selectedKeyWords.length + newKeywords.length >= 6 ? 'text-red-600' : 'text-gray-600'}`}>
                  已選 {selectedKeyWords.length + newKeywords.length}/6 項
                </span>
              )}
            </label>
            
            {/* 新增關鍵字輸入框 */}
            <div className="relative mb-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => {
                    const value = e.target.value
                    setNewKeywordInput(value)
                    searchKeywords(value)
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addNewKeyword()
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSuggestions(false), 200)
                  }}
                  onFocus={() => {
                    if (newKeywordInput.trim() && keywordSuggestions.length > 0) {
                      setShowSuggestions(true)
                    }
                  }}
                  disabled={selectedKeyWords.length + newKeywords.length >= 6}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={selectedKeyWords.length + newKeywords.length >= 6 ? '已達上限 6 項' : '輸入關鍵字（可搜索現有）...'}
                />
                <button
                  type="button"
                  onClick={addNewKeyword}
                  disabled={selectedKeyWords.length + newKeywords.length >= 6}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  新增
                </button>
              </div>
              
              {/* 自動完成建議框 */}
              {showSuggestions && keywordSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {isSearchingKeywords && (
                    <div className="px-3 py-2 text-sm text-gray-500">搜索中...</div>
                  )}
                  {keywordSuggestions.map((keyword) => (
                    <button
                      key={keyword.id}
                      type="button"
                      onClick={() => selectKeywordFromSuggestion(keyword)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-900 flex items-center justify-between group"
                    >
                      <span>{keyword.name}</span>
                      <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100">點擊選擇</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 已選擇的現有關鍵字 */}
            {selectedKeyWords.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-2">已選擇的關鍵字：</div>
                <div className="flex flex-wrap gap-2">
                  {selectedKeyWords.map((keywordId) => {
                    const keyword = allKeywords?.find(k => k.id === keywordId)
                    return (
                      <span
                        key={keywordId}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {keyword?.name || keywordId}
                        <button
                          type="button"
                          onClick={() => removeSelectedKeyword(keywordId)}
                          className="hover:text-green-900"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 已新增的關鍵字 */}
            {newKeywords.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-gray-600 mb-2">新增的關鍵字：</div>
                <div className="flex flex-wrap gap-2">
                  {newKeywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => removeNewKeyword(keyword)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 九宮格分類選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              九宮格分類 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {nineBlockOptions?.map((nineBlock) => (
                <label
                  key={nineBlock.id}
                  className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedNineBlocks.includes(nineBlock.id)}
                    onChange={() => handleNineBlockToggle(nineBlock.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-900">{nineBlock.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 蛋糕圖分類選擇 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              蛋糕圖分類 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {cakeCategoryOptions?.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedCakeCategories.includes(category.id)}
                    onChange={() => handleCakeCategoryToggle(category.id)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-900">{category.name}</span>
                </label>
              ))}
            </div>
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
              {isSubmitting ? '上傳中...' : '上傳影片'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
