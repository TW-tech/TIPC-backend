'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Block {
    id: string
    type: 'text' | 'image' | 'quote'
    data: any
    position: number
}

interface Annotation {
    id: number
    content: string
    url?: string
}

interface Video {
    url: string
}

interface Podcast {
    url: string
}


interface Keyword {
    id: string
    name: string
}

export default function SelectionEditorPage() {
    const router = useRouter()

    // 影響力精選基本資訊
    const [title, setTitle] = useState('')
    const [englishTitle, setEnglishTitle] = useState('')
    const [author, setAuthor] = useState('')
    const [slug, setSlug] = useState('')
    const [url,setUrl] = useState('')
    const [date, setSelectionDate] = useState('')
    const [nation, setNation] = useState('')
    const [coverImage, setCoverImage] = useState('') // 封面照片
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([])
    const [allKeywords, setAllKeywords] = useState<Keyword[]>([]) // 所有可用的關鍵字
    const [newKeywords, setNewKeywords] = useState<string[]>([]) // 新增的關鍵字
    const [newKeywordInput, setNewKeywordInput] = useState('') // 輸入框
    const [keywordSuggestions, setKeywordSuggestions] = useState<Keyword[]>([]) // 自動完成建議
    const [showSuggestions, setShowSuggestions] = useState(false) // 顯示建議框
    const [isSearchingKeywords, setIsSearchingKeywords] = useState(false) // 搜索中

    // 元數據選項
    const [isLoadingMetadata, setIsLoadingMetadata] = useState(true)

    // Blocks
    const [blocks, setBlocks] = useState<Block[]>([])
    const [draggedBlockIndex, setDraggedBlockIndex] = useState<number | null>(null)

    // Annotations
    const [annotations, setAnnotations] = useState<Annotation[]>([])
    const [nextAnnotationId, setNextAnnotationId] = useState(1)

    // Videos & Podcasts
    const [videos, setVideos] = useState<Video[]>([])
    const [podcasts, setPodcasts] = useState<Podcast[]>([])

    // UI State
    const [isSaving, setIsSaving] = useState(false)
    const [errors, setErrors] = useState<string[]>([])
    const [uploadingImages, setUploadingImages] = useState<Set<string>>(new Set())
    const [uploadingCoverImage, setUploadingCoverImage] = useState(false)
    const [cursorPositions, setCursorPositions] = useState<Record<string, number>>({})

    // 載入元數據
    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const response = await fetch('/api/metadata')
                const result = await response.json()
                if (result.success) {
                    setAllKeywords(result.data.keywords || [])
                }
            } catch (error) {
                console.error('Failed to fetch metadata:', error)
            } finally {
                setIsLoadingMetadata(false)
            }
        }
        fetchMetadata()
    }, [])

    // 新增 Block
    const addBlock = (type: 'text' | 'image' | 'quote') => {
        const newBlock: Block = {
            id: `block-${Date.now()}`,
            type,
            data: type === 'text'
                ? { content: '' }
                : type === 'image'
                    ? { url: '', alt: '', caption: '' }
                    : { content: '', author: '', source: '' },
            position: blocks.length,
        }
        setBlocks([...blocks, newBlock])
    }

    // 搜索關鍵字（自動完成）
    const searchKeywords = async (query: string) => {
        if (!query || query.trim().length < 1) {
            setKeywordSuggestions([])
            setShowSuggestions(false)
            return
        }

        setIsSearchingKeywords(true)
        try {
            const response = await fetch(`/api/keywords/search?q=${encodeURIComponent(query)}`)
            const result = await response.json()

            if (result.success) {
                // 過濾掉已選擇的關鍵字
                const filteredSuggestions = result.data.filter(
                    (kw: Keyword) => !selectedKeywords.includes(kw.id)
                )
                setKeywordSuggestions(filteredSuggestions)
                setShowSuggestions(filteredSuggestions.length > 0)
            }
        } catch (error) {
            console.error('搜索關鍵字失敗:', error)
        } finally {
            setIsSearchingKeywords(false)
        }
    }

    // 新增關鍵字
    const addNewKeyword = () => {
        const totalKeywords = selectedKeywords.length + newKeywords.length
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
    const selectKeywordFromSuggestion = (keyword: Keyword) => {
        const totalKeywords = selectedKeywords.length + newKeywords.length
        if (totalKeywords >= 6) {
            alert('關鍵字最多只能選擇 6 項')
            return
        }
        if (!selectedKeywords.includes(keyword.id)) {
            setSelectedKeywords([...selectedKeywords, keyword.id])
            setNewKeywordInput('')
            setShowSuggestions(false)
        }
    }

    // 刪除已選擇的現有關鍵字
    const removeSelectedKeyword = (keywordId: string) => {
        setSelectedKeywords(selectedKeywords.filter(id => id !== keywordId))
    }

    // 刪除新增的關鍵字
    const removeNewKeyword = (keyword: string) => {
        setNewKeywords(newKeywords.filter(k => k !== keyword))
    }

    // 處理圖片上傳
    const handleImageUpload = async (index: number, file: File) => {
        const blockId = blocks[index].id
        setUploadingImages(prev => new Set(prev).add(blockId))

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'selection')

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success && result.url) {
                updateBlock(index, {
                    ...blocks[index].data,
                    url: result.url,
                    publicId: result.publicId,
                    width: result.width,
                    height: result.height
                })
            } else {
                alert('圖片上傳失敗：' + (result.error || '未知錯誤'))
            }
        } catch (error) {
            alert('圖片上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
        } finally {
            setUploadingImages(prev => {
                const newSet = new Set(prev)
                newSet.delete(blockId)
                return newSet
            })
        }
    }

    // 處理封面圖片上傳
    const handleCoverImageUpload = async (file: File) => {
        setUploadingCoverImage(true)

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('folder', 'selection')

            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
            })

            const result = await response.json()

            if (result.success && result.url) {
                setCoverImage(result.url)
                // Note: Cover image metadata (publicId, width, height) available in result if needed
            } else {
                alert('封面圖片上傳失敗：' + (result.error || '未知錯誤'))
            }
        } catch (error) {
            alert('封面圖片上傳失敗：' + (error instanceof Error ? error.message : '未知錯誤'))
        } finally {
            setUploadingCoverImage(false)
        }
    }

    // 更新 Block
    const updateBlock = (index: number, data: any) => {
        const newBlocks = [...blocks]
        newBlocks[index].data = data
        setBlocks(newBlocks)
    }

    // 刪除 Block
    const deleteBlock = (index: number) => {
        const newBlocks = blocks.filter((_, i) => i !== index)
        // 重新排序 position
        newBlocks.forEach((block, i) => {
            block.position = i
        })
        setBlocks(newBlocks)
    }

    // 拖放排序
    const handleDragStart = (index: number) => {
        setDraggedBlockIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedBlockIndex === null || draggedBlockIndex === index) return

        const newBlocks = [...blocks]
        const draggedBlock = newBlocks[draggedBlockIndex]
        newBlocks.splice(draggedBlockIndex, 1)
        newBlocks.splice(index, 0, draggedBlock)

        // 重新排序 position
        newBlocks.forEach((block, i) => {
            block.position = i
        })

        setBlocks(newBlocks)
        setDraggedBlockIndex(index)
    }

    const handleDragEnd = () => {
        setDraggedBlockIndex(null)
    }

    // 新增 Annotation
    const addAnnotation = () => {
        const newAnnotation: Annotation = {
            id: nextAnnotationId,
            content: '',
            url: '',
        }
        setAnnotations([...annotations, newAnnotation])
        setNextAnnotationId(nextAnnotationId + 1)
    }

    // 更新 Annotation
    const updateAnnotation = (index: number, field: 'content' | 'url', value: string) => {
        const newAnnotations = [...annotations]
        newAnnotations[index][field] = value
        setAnnotations(newAnnotations)
    }

    // 刪除 Annotation（檢查是否被引用）
    const deleteAnnotation = (index: number) => {
        const annotation = annotations[index]
        const isReferenced = blocks.some(block => {
            const text = JSON.stringify(block.data)
            return text.includes(`[${annotation.id}]`)
        })

        if (isReferenced) {
            if (!confirm(`註解 [${annotation.id}] 仍被影響力精選引用，確定要刪除嗎？刪除後引用將失效。`)) {
                return
            }
        }

        setAnnotations(annotations.filter((_, i) => i !== index))
    }

    // 插入引用到文字中（在鼠標位置）
    const insertReference = (blockIndex: number, annotationId: number, field?: 'caption') => {
        const block = blocks[blockIndex]
        const reference = `[${annotationId}]`

        if (block.type === 'text') {
            const content = block.data.content || ''
            const cursorPos = cursorPositions[block.id] ?? content.length
            const newContent = content.slice(0, cursorPos) + reference + content.slice(cursorPos)
            block.data.content = newContent
            setBlocks([...blocks])

            // 更新鼠標位置到引用後面
            setCursorPositions({
                ...cursorPositions,
                [block.id]: cursorPos + reference.length
            })
        } else if (block.type === 'image' && field === 'caption') {
            const caption = block.data.caption || ''
            const cursorKey = `${block.id}-caption`
            const cursorPos = cursorPositions[cursorKey] ?? caption.length
            const newCaption = caption.slice(0, cursorPos) + reference + caption.slice(cursorPos)
            block.data.caption = newCaption
            setBlocks([...blocks])

            setCursorPositions({
                ...cursorPositions,
                [cursorKey]: cursorPos + reference.length
            })
        } else if (block.type === 'quote') {
            const content = block.data.content || ''
            const cursorPos = cursorPositions[block.id] ?? content.length
            const newContent = content.slice(0, cursorPos) + reference + content.slice(cursorPos)
            block.data.content = newContent
            setBlocks([...blocks])

            setCursorPositions({
                ...cursorPositions,
                [block.id]: cursorPos + reference.length
            })
        }
    }

    // 新增 Video
    const addVideo = () => {
        setVideos([...videos, { url: '' }])
    }

    // 新增 Podcast
    const addPodcast = () => {
        setPodcasts([...podcasts, { url: '' }])
    }


    const handleSave = async () => {
        setIsSaving(true)
        setErrors([])

        // 驗證
        const validationErrors: string[] = []
        if (!title.trim()) validationErrors.push('標題為必填')
        if (!author.trim()) validationErrors.push('作者為必填')
        if (!date.trim()) validationErrors.push('選擇日期為必填')
        if (!url.trim()) validationErrors.push('網址為必填')
        if (!nation.trim()) validationErrors.push('國家為必填')
        if (!slug.trim()) validationErrors.push('Slug 為必填')
        if (!coverImage.trim()) validationErrors.push('封面照片為必填')
        if (selectedKeywords.length === 0 && newKeywords.length === 0) {
            validationErrors.push('請至少選擇或新增一個關鍵字')
        }

        if (validationErrors.length > 0) {
            setErrors(validationErrors)
            setIsSaving(false)
            return
        }

        try {
            const selectionData = {
                author,
                title,
                englishTitle: englishTitle.trim() || null,
                coverImage,
                slug,
                date,
                url,
                nation,
                blocks: blocks.map(block => ({
                    type: block.type,
                    data: block.data,
                    position: block.position,
                })),
                annotations: annotations?.filter(a => a.content.trim()) || [],
                videos: videos?.filter(v => v.url.trim()) || [],
                podcasts: podcasts?.filter(p => p.url.trim()) || [],
                keywordIds: selectedKeywords,
                newKeywords,
            }

            const response = await fetch('/api/selections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(selectionData),
            })

            // 只讀一次
            const result = await response.json()

            if (!response.ok) {
                const errorMessage =
                    result?.error ||
                    result?.details ||
                    '上傳失敗，請稍後再試'
                throw new Error(
                    typeof errorMessage === 'string'
                        ? errorMessage
                        : JSON.stringify(errorMessage)
                )
            }

            alert('影響力精選上傳成功！')
            router.push('/dashboard')

        } catch (error) {
            console.error('Upload error:', error)
            setErrors([
                '上傳失敗：' +
                (error instanceof Error ? error.message : '未知錯誤'),
            ])
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">編輯器</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.back()}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {isSaving ? '上傳中...' : '上傳影響力精選'}
                        </button>
                    </div>
                </div>

                {/* 錯誤訊息 */}
                {errors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h3 className="text-red-800 font-semibold mb-2">錯誤：</h3>
                        {errors.map((error, i) => (
                            <p key={i} className="text-red-700 text-sm">{error}</p>
                        ))}
                    </div>
                )}

                {/* 影響力精選基本資訊 */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900">影響力精選資訊</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">標題 *</label>
                            <textarea
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 min-h-[120px]"
                                placeholder="輸入影響力精選標題"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">英文標題 (選填)</label>
                            <textarea
                                value={englishTitle}
                                onChange={(e) => setEnglishTitle(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 min-h-[120px]"
                                placeholder="Enter selection title in English"
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">作者 *</label>
                                <input
                                    type="text"
                                    value={author}
                                    onChange={(e) => setAuthor(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="作者名稱"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    URL Slug * <span className="text-xs text-gray-500 font-normal">（例如：my-selection-title）</span>
                                </label>
                                <input
                                    type="text"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="例如：my-selection-title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    網址 *
                                </label>
                                <input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="輸入影響力精選網址"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    國家 *
                                </label>
                                <input
                                    value={nation}
                                    onChange={(e) => setNation(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="輸入國家"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    日期 *
                                </label>
                                <input
                                    value={date}
                                    type='date'
                                    onChange={(e) => setSelectionDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    placeholder="輸入日期"
                                />
                            </div>


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
                                        className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${uploadingCoverImage
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

                            {/* 關鍵字（多選） */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    關鍵字 * <span className="text-xs text-gray-500 font-normal">（最多 6 項）</span>
                                    {(selectedKeywords.length + newKeywords.length) > 0 && (
                                        <span className={`ml-2 ${selectedKeywords.length + newKeywords.length >= 6 ? 'text-red-600' : 'text-gray-600'}`}>
                                            已選 {selectedKeywords.length + newKeywords.length}/6 項
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
                                                // 搜索關鍵字
                                                searchKeywords(value)
                                            }}
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    addNewKeyword()
                                                }
                                            }}
                                            onBlur={() => {
                                                // 延遲隱藏建議框，讓點擊事件可以觸發
                                                setTimeout(() => setShowSuggestions(false), 200)
                                            }}
                                            onFocus={() => {
                                                if (newKeywordInput.trim() && keywordSuggestions.length > 0) {
                                                    setShowSuggestions(true)
                                                }
                                            }}
                                            disabled={selectedKeywords.length + newKeywords.length >= 6}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            placeholder={selectedKeywords.length + newKeywords.length >= 6 ? '已達上限 6 項' : '輸入關鍵字（可搜索現有）...'}
                                        />
                                        <button
                                            type="button"
                                            onClick={addNewKeyword}
                                            disabled={selectedKeywords.length + newKeywords.length >= 6}
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
                                {selectedKeywords.length > 0 && (
                                    <div className="mb-3">
                                        <div className="text-xs text-gray-600 mb-2">已選擇的關鍵字：</div>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedKeywords.map((keywordId) => {
                                                const keyword = allKeywords.find(k => k.id === keywordId)
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
                        </div>
                    </div>

                    {/* Blocks 主區域 */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">影響力精選內容 (Blocks)</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => addBlock('text')}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                >
                                    + 文字
                                </button>
                                <button
                                    onClick={() => addBlock('image')}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                >
                                    + 圖片
                                </button>
                                <button
                                    onClick={() => addBlock('quote')}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                                >
                                    + 引言
                                </button>
                            </div>
                        </div>

                        {blocks.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <p>尚無內容區塊，點擊上方按鈕新增</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {blocks.map((block, index) => (
                                    <div
                                        key={block.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`border border-gray-300 rounded-lg p-4 bg-gray-50 cursor-move hover:border-blue-400 ${draggedBlockIndex === index ? 'opacity-50' : ''
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                                    {block.type === 'text' ? '文字' : block.type === 'image' ? '圖片' : '引言'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => deleteBlock(index)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                刪除
                                            </button>
                                        </div>

                                        {/* Text Block */}
                                        {block.type === 'text' && (
                                            <div>
                                                <textarea
                                                    value={block.data.content || ''}
                                                    onChange={(e) => updateBlock(index, { content: e.target.value })}
                                                    onSelect={(e) => {
                                                        const target = e.target as HTMLTextAreaElement
                                                        setCursorPositions({
                                                            ...cursorPositions,
                                                            [block.id]: target.selectionStart
                                                        })
                                                    }}
                                                    onClick={(e) => {
                                                        const target = e.target as HTMLTextAreaElement
                                                        setCursorPositions({
                                                            ...cursorPositions,
                                                            [block.id]: target.selectionStart
                                                        })
                                                    }}
                                                    onKeyUp={(e) => {
                                                        const target = e.target as HTMLTextAreaElement
                                                        setCursorPositions({
                                                            ...cursorPositions,
                                                            [block.id]: target.selectionStart
                                                        })
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 min-h-[220px]"
                                                    placeholder="輸入文字內容，使用 [1], [2] 等格式插入引用..."
                                                />
                                                <div className="mt-2 flex gap-2">
                                                    <button
                                                        onClick={() => {
                                                            const id = prompt('輸入要插入的註解編號（例如：1, 2, 3）')
                                                            if (id) insertReference(index, parseInt(id))
                                                        }}
                                                        className="text-sm text-blue-600 hover:text-blue-800"
                                                    >
                                                        + 新增引用
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Image Block */}
                                        {block.type === 'image' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">圖片</label>

                                                    {/* 上傳按鈕區域 */}
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            id={`image-upload-${block.id}`}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0]
                                                                if (file) {
                                                                    handleImageUpload(index, file)
                                                                }
                                                            }}
                                                            className="hidden"
                                                            disabled={uploadingImages.has(block.id)}
                                                        />

                                                        {!block.data.url ? (
                                                            <label
                                                                htmlFor={`image-upload-${block.id}`}
                                                                className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-all ${uploadingImages.has(block.id)
                                                                        ? 'border-blue-400 bg-blue-50'
                                                                        : 'border-gray-300 bg-gray-50 hover:bg-gray-100 hover:border-blue-400'
                                                                    }`}
                                                            >
                                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                                    {uploadingImages.has(block.id) ? (
                                                                        <>
                                                                            <svg className="w-10 h-10 mb-3 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                            <p className="text-sm text-blue-600 font-medium">上傳中...</p>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                                            </svg>
                                                                            <p className="mb-2 text-sm text-gray-700 font-medium">
                                                                                <span className="text-blue-600 hover:text-blue-700">點擊上傳圖片</span> 或拖曳檔案至此
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">支援 JPG, WebP（（最大 ５MB）</p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </label>
                                                        ) : (
                                                            <div className="relative group">
                                                                <img
                                                                    src={block.data.url}
                                                                    alt="預覽"
                                                                    className="w-full max-h-64 object-contain rounded-lg border border-gray-300"
                                                                />
                                                                <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center">
                                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                                        <label
                                                                            htmlFor={`image-upload-${block.id}`}
                                                                            className="px-4 py-2 bg-white text-gray-700 rounded-lg shadow-lg hover:bg-gray-100 cursor-pointer font-medium text-sm"
                                                                        >
                                                                            更換圖片
                                                                        </label>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => updateBlock(index, { ...block.data, url: '' })}
                                                                            className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 font-medium text-sm"
                                                                        >
                                                                            刪除圖片
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                                                    <input
                                                        type="text"
                                                        value={block.data.alt || ''}
                                                        onChange={(e) => updateBlock(index, { ...block.data, alt: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                                        placeholder="圖片替代文字"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Caption（可包含引用）</label>
                                                    <textarea
                                                        value={block.data.caption || ''}
                                                        onChange={(e) => updateBlock(index, { ...block.data, caption: e.target.value })}
                                                        onSelect={(e) => {
                                                            const target = e.target as HTMLInputElement
                                                            setCursorPositions({
                                                                ...cursorPositions,
                                                                [`${block.id}-caption`]: target.selectionStart || 0
                                                            })
                                                        }}
                                                        onClick={(e) => {
                                                            const target = e.target as HTMLInputElement
                                                            setCursorPositions({
                                                                ...cursorPositions,
                                                                [`${block.id}-caption`]: target.selectionStart || 0
                                                            })
                                                        }}
                                                        onKeyUp={(e) => {
                                                            const target = e.target as HTMLInputElement
                                                            setCursorPositions({
                                                                ...cursorPositions,
                                                                [`${block.id}-caption`]: target.selectionStart || 0
                                                            })
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 min-h-[120px]"
                                                        placeholder="圖片說明，可使用 [1] 格式插入引用"
                                                    />
                                                    <div className="mt-2">
                                                        <button
                                                            onClick={() => {
                                                                const id = prompt('輸入要插入的註解編號（例如：1, 2, 3）')
                                                                if (id) insertReference(index, parseInt(id), 'caption')
                                                            }}
                                                            className="text-sm text-blue-600 hover:text-blue-800"
                                                        >
                                                            + 新增引用
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Quote Block */}
                                        {block.type === 'quote' && (
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">引言內容</label>
                                                    <textarea
                                                        value={block.data.content || ''}
                                                        onChange={(e) => updateBlock(index, { ...block.data, content: e.target.value })}
                                                        onSelect={(e) => {
                                                            const target = e.target as HTMLTextAreaElement
                                                            setCursorPositions({
                                                                ...cursorPositions,
                                                                [block.id]: target.selectionStart
                                                            })
                                                        }}
                                                        onClick={(e) => {
                                                            const target = e.target as HTMLTextAreaElement
                                                            setCursorPositions({
                                                                ...cursorPositions,
                                                                [block.id]: target.selectionStart
                                                            })
                                                        }}
                                                        onKeyUp={(e) => {
                                                            const target = e.target as HTMLTextAreaElement
                                                            setCursorPositions({
                                                                ...cursorPositions,
                                                                [block.id]: target.selectionStart
                                                            })
                                                        }}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 min-h-[180px]"
                                                        rows={3}
                                                        placeholder="輸入引言內容，可使用 [1], [2] 等格式插入引用"
                                                    />
                                                    <div className="mt-2">
                                                        <button
                                                            onClick={() => {
                                                                const id = prompt('輸入要插入的註解編號（例如：1, 2, 3）')
                                                                if (id) insertReference(index, parseInt(id))
                                                            }}
                                                            className="text-sm text-blue-600 hover:text-blue-800"
                                                        >
                                                            + 新增引用
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">

                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* 底部新增按鈕 - 在區塊列表下方也顯示 */}
                        {blocks.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center gap-2">
                                <button
                                    onClick={() => addBlock('text')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    + 新增文字
                                </button>
                                <button
                                    onClick={() => addBlock('image')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    + 新增圖片
                                </button>
                                <button
                                    onClick={() => addBlock('quote')}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    + 新增引言
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Annotations 區域 */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">註解 (Annotations)</h2>
                            <button
                                onClick={addAnnotation}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                                + 新增註解
                            </button>
                        </div>

                        {annotations.length === 0 ? (
                            <p className="text-gray-500 text-center py-6">尚無註解</p>
                        ) : (
                            <div className="space-y-3">
                                {annotations.map((annotation, index) => {
                                    // 檢查哪些 blocks 使用了這個 annotation
                                    const usedInBlocks = blocks
                                        .map((block, i) => ({ block, index: i }))
                                        .filter(({ block }) => JSON.stringify(block.data).includes(`[${annotation.id}]`))

                                    return (
                                        <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm font-bold">
                                                        [{annotation.id}]
                                                    </span>
                                                    {usedInBlocks.length > 0 && (
                                                        <span className="text-xs text-gray-600">
                                                            使用於: Block {usedInBlocks.map(b => `#${b.index + 1}`).join(', ')}
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => deleteAnnotation(index)}
                                                    className="text-red-600 hover:text-red-800 text-sm"
                                                >
                                                    刪除
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                <textarea
                                                    value={annotation.content}
                                                    onChange={(e) => updateAnnotation(index, 'content', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 min-h-[120px]"
                                                    rows={2}
                                                    placeholder="註解內容"
                                                />
                                                <input
                                                    type="url"
                                                    value={annotation.url || ''}
                                                    onChange={(e) => updateAnnotation(index, 'url', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                                                    placeholder="參考連結 URL（可選）"
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* 底部新增註解按鈕 */}
                        {annotations.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-center">
                                <button
                                    onClick={addAnnotation}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                                >
                                    + 新增註解
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Videos & Podcasts */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                        {/* Videos */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">影片</h2>
                                <button
                                    onClick={addVideo}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                >
                                    + 新增
                                </button>
                            </div>
                            <div className="mb-3 text-sm text-gray-500">
                                請使用 YouTube 影片的嵌入連結格式，例如：https://www.youtube.com/embed/影片ID
                            </div>
                            <div className="space-y-3">
                                {videos.map((video, index) => (
                                    <div key={index} className="border border-gray-300 rounded p-3 space-y-2">
                                        <input
                                            type="url"
                                            value={video.url}
                                            onChange={(e) => {
                                                const newVideos = [...videos]
                                                newVideos[index].url = e.target.value
                                                setVideos(newVideos)
                                            }}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            placeholder="影片 URL"
                                        />

                                        <button
                                            onClick={() => setVideos(videos.filter((_, i) => i !== index))}
                                            className="text-red-600 text-xs hover:text-red-800"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Podcasts */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-gray-900">Podcast</h2>
                                <button
                                    onClick={addPodcast}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                                >
                                    + 新增
                                </button>
                            </div>
                            <div className="mb-3 text-sm text-gray-500">
                                請使用 YouTube 影片的嵌入連結格式，例如：https://www.youtube.com/embed/影片ID
                            </div>
                            <div className="space-y-3">
                                {podcasts.map((podcast, index) => (
                                    <div key={index} className="border border-gray-300 rounded p-3 space-y-2">
                                        <input
                                            type="url"
                                            value={podcast.url}
                                            onChange={(e) => {
                                                const newPodcasts = [...podcasts]
                                                newPodcasts[index].url = e.target.value
                                                setPodcasts(newPodcasts)
                                            }}
                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                            placeholder="Podcast URL"
                                        />

                                        <button
                                            onClick={() => setPodcasts(podcasts.filter((_, i) => i !== index))}
                                            className="text-red-600 text-xs hover:text-red-800"
                                        >
                                            刪除
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )    
}
