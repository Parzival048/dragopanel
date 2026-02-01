'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Folder,
    File,
    FileText,
    FileCode,
    FileImage,
    FileArchive,
    ChevronRight,
    ChevronDown,
    Upload,
    Download,
    Trash2,
    Edit3,
    Plus,
    FolderPlus,
    Copy,
    Scissors,
    Clipboard,
    RefreshCw,
    MoreVertical,
    X,
    Save,
    ArrowLeft,
    Home,
    Search,
    Loader2
} from 'lucide-react'

interface FileItem {
    name: string
    mode: string
    mode_bits: string
    size: number
    is_file: boolean
    is_symlink: boolean
    mimetype: string
    created_at: string
    modified_at: string
}

interface FileManagerProps {
    serverId: string
}

export default function FileManager({ serverId }: FileManagerProps) {
    const [currentPath, setCurrentPath] = useState('/')
    const [files, setFiles] = useState<FileItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedFiles, setSelectedFiles] = useState<string[]>([])
    const [editingFile, setEditingFile] = useState<string | null>(null)
    const [fileContent, setFileContent] = useState<string>('')
    const [isEditorOpen, setIsEditorOpen] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [showNewFolderModal, setShowNewFolderModal] = useState(false)
    const [showNewFileModal, setShowNewFileModal] = useState(false)
    const [newItemName, setNewItemName] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [clipboard, setClipboard] = useState<{ files: string[]; action: 'copy' | 'cut' } | null>(null)

    // Fetch files
    const fetchFiles = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`/api/servers/${serverId}/files?path=${encodeURIComponent(currentPath)}`)
            if (response.ok) {
                const data = await response.json()
                setFiles(data.files || [])
            }
        } catch (error) {
            console.error('Failed to fetch files:', error)
        } finally {
            setIsLoading(false)
        }
    }, [serverId, currentPath])

    useEffect(() => {
        fetchFiles()
    }, [fetchFiles])

    // Get file icon
    const getFileIcon = (file: FileItem) => {
        if (!file.is_file) return <Folder className="w-5 h-5 text-cyan-400" />

        const ext = file.name.split('.').pop()?.toLowerCase()

        switch (ext) {
            case 'yml':
            case 'yaml':
            case 'json':
            case 'properties':
            case 'toml':
                return <FileCode className="w-5 h-5 text-yellow-400" />
            case 'jar':
            case 'zip':
            case 'tar':
            case 'gz':
                return <FileArchive className="w-5 h-5 text-purple-400" />
            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'webp':
                return <FileImage className="w-5 h-5 text-green-400" />
            case 'log':
            case 'txt':
                return <FileText className="w-5 h-5 text-gray-400" />
            default:
                return <File className="w-5 h-5 text-gray-400" />
        }
    }

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes === 0) return '-'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    // Navigate to folder
    const navigateToFolder = (folderName: string) => {
        const newPath = currentPath === '/'
            ? `/${folderName}`
            : `${currentPath}/${folderName}`
        setCurrentPath(newPath)
        setSelectedFiles([])
    }

    // Navigate up
    const navigateUp = () => {
        if (currentPath === '/') return
        const parts = currentPath.split('/').filter(Boolean)
        parts.pop()
        setCurrentPath('/' + parts.join('/'))
        setSelectedFiles([])
    }

    // Open file editor
    const openFile = async (fileName: string) => {
        try {
            const filePath = currentPath === '/' ? `/${fileName}` : `${currentPath}/${fileName}`
            const response = await fetch(`/api/servers/${serverId}/files/content?path=${encodeURIComponent(filePath)}`)
            if (response.ok) {
                const data = await response.json()
                setFileContent(data.content)
                setEditingFile(filePath)
                setIsEditorOpen(true)
            }
        } catch (error) {
            console.error('Failed to open file:', error)
        }
    }

    // Save file
    const saveFile = async () => {
        if (!editingFile) return
        setIsSaving(true)
        try {
            await fetch(`/api/servers/${serverId}/files/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: editingFile, content: fileContent })
            })
            setIsEditorOpen(false)
            setEditingFile(null)
        } catch (error) {
            console.error('Failed to save file:', error)
        } finally {
            setIsSaving(false)
        }
    }

    // Create folder
    const createFolder = async () => {
        if (!newItemName.trim()) return
        setIsCreating(true)
        try {
            const path = currentPath === '/' ? `/${newItemName}` : `${currentPath}/${newItemName}`
            await fetch(`/api/servers/${serverId}/files/folder`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path })
            })
            setShowNewFolderModal(false)
            setNewItemName('')
            fetchFiles()
        } catch (error) {
            console.error('Failed to create folder:', error)
        } finally {
            setIsCreating(false)
        }
    }

    // Create file
    const createFile = async () => {
        if (!newItemName.trim()) return
        setIsCreating(true)
        try {
            const path = currentPath === '/' ? `/${newItemName}` : `${currentPath}/${newItemName}`
            await fetch(`/api/servers/${serverId}/files/content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path, content: '' })
            })
            setShowNewFileModal(false)
            setNewItemName('')
            fetchFiles()
        } catch (error) {
            console.error('Failed to create file:', error)
        } finally {
            setIsCreating(false)
        }
    }

    // Delete files
    const deleteFiles = async () => {
        if (selectedFiles.length === 0) return
        if (!confirm(`Delete ${selectedFiles.length} item(s)?`)) return

        try {
            const paths = selectedFiles.map(f =>
                currentPath === '/' ? `/${f}` : `${currentPath}/${f}`
            )
            await fetch(`/api/servers/${serverId}/files`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paths })
            })
            setSelectedFiles([])
            fetchFiles()
        } catch (error) {
            console.error('Failed to delete files:', error)
        }
    }

    // Toggle file selection
    const toggleSelection = (fileName: string, event: React.MouseEvent) => {
        event.stopPropagation()
        if (event.ctrlKey || event.metaKey) {
            setSelectedFiles(prev =>
                prev.includes(fileName)
                    ? prev.filter(f => f !== fileName)
                    : [...prev, fileName]
            )
        } else {
            setSelectedFiles(prev =>
                prev.includes(fileName) && prev.length === 1 ? [] : [fileName]
            )
        }
    }

    // Breadcrumb
    const breadcrumbs = [{ name: 'Home', path: '/' }]
    if (currentPath !== '/') {
        const parts = currentPath.split('/').filter(Boolean)
        let path = ''
        parts.forEach(part => {
            path += '/' + part
            breadcrumbs.push({ name: part, path })
        })
    }

    // Filter files
    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Sort files (folders first)
    const sortedFiles = [...filteredFiles].sort((a, b) => {
        if (!a.is_file && b.is_file) return -1
        if (a.is_file && !b.is_file) return 1
        return a.name.localeCompare(b.name)
    })

    return (
        <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-white/5">
                <button
                    onClick={navigateUp}
                    disabled={currentPath === '/'}
                    className="btn btn-secondary btn-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => setCurrentPath('/')}
                    className="btn btn-secondary btn-sm"
                >
                    <Home className="w-4 h-4" />
                </button>
                <button
                    onClick={fetchFiles}
                    className="btn btn-secondary btn-sm"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-white/10 mx-1" />

                <button
                    onClick={() => setShowNewFolderModal(true)}
                    className="btn btn-secondary btn-sm"
                >
                    <FolderPlus className="w-4 h-4" />
                    New Folder
                </button>
                <button
                    onClick={() => setShowNewFileModal(true)}
                    className="btn btn-secondary btn-sm"
                >
                    <Plus className="w-4 h-4" />
                    New File
                </button>
                <label className="btn btn-secondary btn-sm cursor-pointer">
                    <Upload className="w-4 h-4" />
                    Upload
                    <input type="file" className="hidden" multiple />
                </label>

                {selectedFiles.length > 0 && (
                    <>
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <button
                            onClick={() => setClipboard({ files: selectedFiles, action: 'copy' })}
                            className="btn btn-secondary btn-sm"
                        >
                            <Copy className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setClipboard({ files: selectedFiles, action: 'cut' })}
                            className="btn btn-secondary btn-sm"
                        >
                            <Scissors className="w-4 h-4" />
                        </button>
                        <button
                            onClick={deleteFiles}
                            className="btn btn-danger btn-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Delete ({selectedFiles.length})
                        </button>
                    </>
                )}

                {clipboard && (
                    <button
                        onClick={() => {/* paste logic */ }}
                        className="btn btn-secondary btn-sm"
                    >
                        <Clipboard className="w-4 h-4" />
                        Paste
                    </button>
                )}

                <div className="flex-1" />

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search files..."
                        className="input input-sm pl-9 w-48"
                    />
                </div>
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 p-3 text-sm overflow-x-auto">
                {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.path} className="flex items-center">
                        {index > 0 && <ChevronRight className="w-4 h-4 text-gray-600 mx-1" />}
                        <button
                            onClick={() => setCurrentPath(crumb.path)}
                            className={`hover:text-cyan-400 transition-colors ${index === breadcrumbs.length - 1 ? 'text-white' : 'text-gray-400'
                                }`}
                        >
                            {crumb.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* File List */}
            <div className="flex-1 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    </div>
                ) : sortedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                        <Folder className="w-16 h-16 mb-4 opacity-50" />
                        <p>This folder is empty</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="sticky top-0 bg-[#0a0a0a]">
                            <tr className="text-left text-sm text-gray-500">
                                <th className="p-3 w-8"></th>
                                <th className="p-3">Name</th>
                                <th className="p-3 w-24">Size</th>
                                <th className="p-3 w-40">Modified</th>
                                <th className="p-3 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {sortedFiles.map((file) => (
                                <tr
                                    key={file.name}
                                    onClick={(e) => toggleSelection(file.name, e)}
                                    onDoubleClick={() => file.is_file ? openFile(file.name) : navigateToFolder(file.name)}
                                    className={`cursor-pointer transition-colors ${selectedFiles.includes(file.name)
                                            ? 'bg-cyan-500/10'
                                            : 'hover:bg-white/[0.02]'
                                        }`}
                                >
                                    <td className="p-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedFiles.includes(file.name)}
                                            onChange={(e) => {
                                                e.stopPropagation()
                                                toggleSelection(file.name, e as unknown as React.MouseEvent)
                                            }}
                                            className="rounded border-gray-600"
                                        />
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-3">
                                            {getFileIcon(file)}
                                            <span className={file.is_file ? 'text-gray-300' : 'text-white font-medium'}>
                                                {file.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-gray-500">
                                        {file.is_file ? formatSize(file.size) : '-'}
                                    </td>
                                    <td className="p-3 text-sm text-gray-500">
                                        {new Date(file.modified_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-3">
                                        <button className="p-1 text-gray-500 hover:text-white rounded-lg hover:bg-white/5">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* File Editor Modal */}
            <AnimatePresence>
                {isEditorOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-4xl h-[80vh] bg-[#0a0a0a] rounded-xl border border-white/10 flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <FileCode className="w-5 h-5 text-cyan-400" />
                                    <span className="font-medium">{editingFile}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={saveFile}
                                        disabled={isSaving}
                                        className="btn btn-primary btn-sm"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setIsEditorOpen(false)}
                                        className="btn btn-secondary btn-sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 p-4">
                                <textarea
                                    value={fileContent}
                                    onChange={(e) => setFileContent(e.target.value)}
                                    className="w-full h-full bg-[#050505] rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500 border border-white/10"
                                    spellCheck={false}
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New Folder Modal */}
            <AnimatePresence>
                {showNewFolderModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setShowNewFolderModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#0a0a0a] rounded-xl border border-white/10 p-6"
                        >
                            <h3 className="text-lg font-semibold mb-4">Create New Folder</h3>
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="Folder name"
                                className="input mb-4"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowNewFolderModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createFolder}
                                    disabled={isCreating || !newItemName.trim()}
                                    className="btn btn-primary"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* New File Modal */}
            <AnimatePresence>
                {showNewFileModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setShowNewFileModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#0a0a0a] rounded-xl border border-white/10 p-6"
                        >
                            <h3 className="text-lg font-semibold mb-4">Create New File</h3>
                            <input
                                type="text"
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                placeholder="filename.txt"
                                className="input mb-4"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowNewFileModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={createFile}
                                    disabled={isCreating || !newItemName.trim()}
                                    className="btn btn-primary"
                                >
                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
