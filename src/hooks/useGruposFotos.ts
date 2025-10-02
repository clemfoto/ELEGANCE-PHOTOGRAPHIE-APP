
import { useState, useEffect } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'

interface Foto {
  url: string
  nombre: string
  fechaSubida: string
}

interface GrupoFotos {
  _id: string
  nombre: string
  descripcion: string
  fotos: Foto[]
  color: string
  categoria: 'boda' | 'eventos' | 'retratos' | 'decoracion' | 'otros'
  creator: string
  createdAt: string
  updatedAt: string
}

export const useGruposFotos = () => {
  const [grupos, setGrupos] = useState<GrupoFotos[]>([])
  const [loading, setLoading] = useState(false)

  const fetchGrupos = async () => {
    setLoading(true)
    try {
      const { list } = await lumi.entities.grupos_fotos.list({
        sort: { createdAt: -1 }
      })
      setGrupos(list || [])
    } catch (error: any) {
      console.error('Error al cargar grupos:', error)
      toast.error('Error al cargar los grupos de fotos')
    } finally {
      setLoading(false)
    }
  }

  const createGrupo = async (grupoData: Omit<GrupoFotos, '_id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = new Date().toISOString()
      const newGrupo = await lumi.entities.grupos_fotos.create({
        ...grupoData,
        createdAt: now,
        updatedAt: now
      })
      setGrupos(prev => [newGrupo, ...prev])
      toast.success('Grupo creado exitosamente')
      return newGrupo
    } catch (error: any) {
      console.error('Error al crear grupo:', error)
      toast.error('Error al crear el grupo')
      throw error
    }
  }

  const updateGrupo = async (grupoId: string, updates: Partial<GrupoFotos>) => {
    try {
      const updatedGrupo = await lumi.entities.grupos_fotos.update(grupoId, {
        ...updates,
        updatedAt: new Date().toISOString()
      })
      setGrupos(prev => prev.map(g => g._id === grupoId ? updatedGrupo : g))
      toast.success('Grupo actualizado exitosamente')
      return updatedGrupo
    } catch (error: any) {
      console.error('Error al actualizar grupo:', error)
      toast.error('Error al actualizar el grupo')
      throw error
    }
  }

  const deleteGrupo = async (grupoId: string) => {
    try {
      await lumi.entities.grupos_fotos.delete(grupoId)
      setGrupos(prev => prev.filter(g => g._id !== grupoId))
      toast.success('Grupo eliminado exitosamente')
    } catch (error: any) {
      console.error('Error al eliminar grupo:', error)
      toast.error('Error al eliminar el grupo')
      throw error
    }
  }

  const subirFotos = async (grupoId: string, files: File[]) => {
    try {
      // Subir archivos usando Lumi SDK
      const uploadResults = await lumi.tools.file.upload(files)
      
      const nuevasFotos: Foto[] = []
      const now = new Date().toISOString()

      uploadResults.forEach((result, index) => {
        if (result.fileUrl && !result.uploadError) {
          nuevasFotos.push({
            url: result.fileUrl,
            nombre: result.fileName,
            fechaSubida: now
          })
        } else {
          toast.error(`Error al subir ${result.fileName}: ${result.uploadError}`)
        }
      })

      if (nuevasFotos.length > 0) {
        const grupo = grupos.find(g => g._id === grupoId)
        if (grupo) {
          const fotosActualizadas = [...grupo.fotos, ...nuevasFotos]
          await updateGrupo(grupoId, { fotos: fotosActualizadas })
          toast.success(`${nuevasFotos.length} fotos subidas exitosamente`)
        }
      }

      return nuevasFotos
    } catch (error: any) {
      console.error('Error al subir fotos:', error)
      toast.error('Error al subir las fotos')
      throw error
    }
  }

  const eliminarFoto = async (grupoId: string, fotoUrl: string) => {
    try {
      // Eliminar archivo del servidor
      await lumi.tools.file.delete([fotoUrl])
      
      // Actualizar grupo removiendo la foto
      const grupo = grupos.find(g => g._id === grupoId)
      if (grupo) {
        const fotosActualizadas = grupo.fotos.filter(f => f.url !== fotoUrl)
        await updateGrupo(grupoId, { fotos: fotosActualizadas })
        toast.success('Foto eliminada exitosamente')
      }
    } catch (error: any) {
      console.error('Error al eliminar foto:', error)
      toast.error('Error al eliminar la foto')
      throw error
    }
  }

  const getGruposByCategoria = (categoria: string) => {
    return grupos.filter(grupo => grupo.categoria === categoria)
  }

  useEffect(() => {
    fetchGrupos()
  }, [])

  return {
    grupos,
    loading,
    fetchGrupos,
    createGrupo,
    updateGrupo,
    deleteGrupo,
    subirFotos,
    eliminarFoto,
    getGruposByCategoria
  }
}
