'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PLATFORMS = [
  { id: 'facebook', name: 'Facebook', emoji: '📘', color: 'bg-blue-600', maxLength: 63206 },
  { id: 'instagram', name: 'Instagram', emoji: '📷', color: 'bg-gradient-to-r from-purple-500 to-pink-500', maxLength: 2200 },
  { id: 'linkedin', name: 'LinkedIn', emoji: '💼', color: 'bg-blue-700', maxLength: 3000 },
  { id: 'x', name: 'X (Twitter)', emoji: '🐦', color: 'bg-black', maxLength: 280 },
  { id: 'tiktok', name: 'TikTok', emoji: '🎵', color: 'bg-black', maxLength: 2200 },
  { id: 'gbp', name: 'Google Business', emoji: '🏢', color: 'bg-green-600', maxLength: 1500 },
  { id: 'threads', name: 'Threads', emoji: '🧵', color: 'bg-gray-900', maxLength: 500 }
];

interface PostComposerProps {
  onCancel: () => void;
  onSuccess: () => void;
  initialDate?: Date;
  postIdToEdit?: string | null;
}

export function PostComposer({ onCancel, onSuccess, initialDate, postIdToEdit }: PostComposerProps) {
  const [title, setTitle] = useState('');
  const [baseText, setBaseText] = useState('');
  const [scheduledDate, setScheduledDate] = useState(
    initialDate ? format(initialDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );
  const [scheduledTime, setScheduledTime] = useState('12:00');
  const [timezone] = useState('America/Mexico_City');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [platformVariants, setPlatformVariants] = useState<Record<string, string>>({});
  const [isScheduled, setIsScheduled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // If editing an existing post, load its data
  useEffect(() => {
    if (!postIdToEdit) return;

    const fetchPostData = async () => {
      try {
        const response = await fetch(`/api/v1/social/posts/${postIdToEdit}`);
        if (!response.ok) {
          throw new Error('Failed to fetch post data');
        }
        
        const postData = await response.json();
        
        setTitle(postData.data.title || '');
        setBaseText(postData.data.baseText);
        
        // Set scheduling information if scheduled
        if (postData.data.scheduledAtUtc) {
          const scheduledDate = new Date(postData.data.scheduledAtUtc);
          setScheduledDate(format(scheduledDate, 'yyyy-MM-dd'));
          setScheduledTime(format(scheduledDate, 'HH:mm'));
          setIsScheduled(true);
        } else {
          setIsScheduled(false);
        }
        
        // Get the targets for the post
        const targetsResponse = await fetch(`/api/v1/social/posts/${postIdToEdit}/targets`);
        if (targetsResponse.ok) {
          const targetsData = await targetsResponse.json();
          
          // Set selected platforms
          const platforms = targetsData.data.map((target: any) => target.platform);
          setSelectedPlatforms(platforms);
          
          // Set platform variants
          const variants: Record<string, string> = {};
          targetsData.data.forEach((target: any) => {
            if (target.variantText) {
              variants[target.platform] = target.variantText;
            }
          });
          setPlatformVariants(variants);
        }
      } catch (error) {
        console.error('Error fetching post data:', error);
        alert('Error al cargar los datos del post');
      }
    };

    fetchPostData();
  }, [postIdToEdit]);

  const handlePlatformToggle = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(id => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleVariantChange = (platformId: string, text: string) => {
    setPlatformVariants(prev => ({
      ...prev,
      [platformId]: text
    }));
  };

  const getCharacterCount = (platformId: string) => {
    const text = platformVariants[platformId] || baseText;
    const platform = PLATFORMS.find(p => p.id === platformId);
    return {
      current: text.length,
      max: platform?.maxLength || 0
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const scheduledAtUtc = isScheduled
        ? new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString()
        : null;

      const targets = selectedPlatforms.map(platform => ({
        platform,
        publishAtUtc: scheduledAtUtc,
        variantText: platformVariants[platform] || null,
        assetIds: [] // TODO: Implement media selection
      }));

      let response;
      if (postIdToEdit) {
        // If editing an existing post, use PUT method
        response = await fetch(`/api/v1/social/posts/${postIdToEdit}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title || null,
            baseText,
            scheduledAtUtc,
            timezone,
            targets,
            updatedBy: 'admin' // TODO: Get from auth context
          }),
        });
      } else {
        // If creating a new post, use POST method
        response = await fetch('/api/v1/social/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: title || null,
            baseText,
            scheduledAtUtc,
            timezone,
            targets,
            createdBy: 'admin' // TODO: Get from auth context
          }),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || (postIdToEdit ? 'Error actualizando post' : 'Error creando post'));
      }

      onSuccess();
    } catch (error) {
      console.error(postIdToEdit ? 'Error actualizando post:' : 'Error creando post:', error);
      alert(postIdToEdit ? 'Error al actualizar el post. Intenta de nuevo.' : 'Error al crear el post. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-900">{postIdToEdit ? 'Editar Post' : 'Crear Nuevo Post'}</h2>
        <p className="text-gray-600 mt-1">{postIdToEdit ? 'Actualiza el contenido de tu post' : 'Crea contenido para tus redes sociales'}</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Título (Opcional)
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Título descriptivo para organización interna..."
            maxLength={200}
          />
          <p className="text-xs text-gray-500 mt-1">{title.length}/200 caracteres</p>
        </div>

        {/* Base Text */}
        <div>
          <label htmlFor="baseText" className="block text-sm font-medium text-gray-700 mb-2">
            Contenido Base <span className="text-red-500">*</span>
          </label>
          <textarea
            id="baseText"
            value={baseText}
            onChange={(e) => setBaseText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Escribe el contenido base que se adaptará a cada plataforma..."
            required
            maxLength={2000}
          />
          <p className="text-xs text-gray-500 mt-1">{baseText.length}/2000 caracteres</p>
        </div>

        {/* Scheduling */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="schedule-type"
                checked={!isScheduled}
                onChange={() => setIsScheduled(false)}
                className="mr-2"
              />
              Borrador
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="schedule-type"
                checked={isScheduled}
                onChange={() => setIsScheduled(true)}
                className="mr-2"
              />
              Programar
            </label>
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  id="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={isScheduled}
                />
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                  Hora (MX)
                </label>
                <input
                  type="time"
                  id="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required={isScheduled}
                />
              </div>
            </div>
          )}
        </div>

        {/* Platform Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Plataformas <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {PLATFORMS.map(platform => (
              <button
                key={platform.id}
                type="button"
                onClick={() => handlePlatformToggle(platform.id)}
                className={`relative p-3 rounded-lg border-2 transition-all ${
                  selectedPlatforms.includes(platform.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-1">{platform.emoji}</div>
                  <div className="text-sm font-medium">{platform.name}</div>
                </div>
                {selectedPlatforms.includes(platform.id) && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Platform-specific variants */}
        {selectedPlatforms.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Personalización por Plataforma</h3>
            {selectedPlatforms.map(platformId => {
              const platform = PLATFORMS.find(p => p.id === platformId)!;
              const charCount = getCharacterCount(platformId);
              const isOverLimit = charCount.current > charCount.max;

              return (
                <div key={platformId} className="border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <span className="text-lg mr-2">{platform.emoji}</span>
                    <span className="font-medium">{platform.name}</span>
                    <span className={`ml-auto text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
                      {charCount.current}/{charCount.max}
                    </span>
                  </div>
                  <textarea
                    value={platformVariants[platformId] || baseText}
                    onChange={(e) => handleVariantChange(platformId, e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isOverLimit ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder={`Personaliza el contenido para ${platform.name}...`}
                  />
                  {isOverLimit && (
                    <p className="text-red-500 text-sm mt-1">
                      Excede el límite de caracteres para {platform.name}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || selectedPlatforms.length === 0 || !baseText.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creando...' : isScheduled ? 'Programar Post' : 'Guardar Borrador'}
          </button>
        </div>
      </form>
    </div>
  );
}