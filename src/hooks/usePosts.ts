
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Post {
  _id: string
  titulo: string
  contenido: string
  fechaProgramada: string
  estado: 'borrador' | 'programado' | 'publicado' | 'error'
  imagenes: string[]
  grupoFotos?: string
  hashtags: string[]
  instagramConfig: {
    caption: string
    location: string
    tags: string[]
  }
  creator: string
  createdAt: string
  updatedAt: string
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const { list } = await lumi.entities.posts.list({
        sort: { fechaProgramada: -1 }
      })
      setPosts(list || [])
    } catch (error: any) {
      console.error('Error al cargar posts:', error)
      toast.error('Error al cargar los posts')
    } finally {
      setLoading(false)
    }
  }

  const createPost = async (postData: Omit<Post, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString()
      const newPost = await lumi.entities.posts.create({
        ...postData,
        createdAt: now,
        updatedAt: now
      })
      setPosts(prev => [newPost, ...prev])
      toast.success('Post creado exitosamente')
      return newPost
    } catch (error: any) {
      console.error('Error al crear post:', error)
      toast.error('Error al crear el post')
      throw error
    }
  }

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    try {
      const updatedPost = await lumi.entities.posts.update(postId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      setPosts(prev => prev.map(p => p._id === postId ? updatedPost : p))
      toast.success('Post actualizado exitosamente')
      return updatedPost
    } catch (error: any) {
      console.error('Error al actualizar post:', error)
      toast.error('Error al actualizar el post')
      throw error
    }
  }

  const deletePost = async (postId: string) => {
    try {
      await lumi.entities.posts.delete(postId)
      setPosts(prev => prev.filter(p => p._id !== postId))
      toast.success('Post eliminado exitosamente')
    } catch (error: any) {
      console.error('Error al eliminar post:', error)
      toast.error('Error al eliminar el post')
      throw error
    }
  }

  const programarInstagram = async (postId: string) => {
    try {
      // Simulación de programación en Instagram
      await updatePost(postId, { estado: 'programado' })
      toast.success('Post programado para Instagram')
      
      // Aquí se integraría con la API real de Instagram
      // await instagramAPI.schedulePost(post)
      
    } catch (error: any) {
      console.error('Error al programar en Instagram:', error)
      toast.error('Error al programar en Instagram')
    }
  }

  const getPostsByEstado = (estado: string) => {
    return posts.filter(post => post.estado === estado)
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  return {
    posts,
    loading,
    fetchPosts,
    createPost,
    updatePost,
    deletePost,
    programarInstagram,
    getPostsByEstado
  }
}
