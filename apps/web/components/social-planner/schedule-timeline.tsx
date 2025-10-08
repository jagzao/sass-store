'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const PLATFORM_CONFIG = {
  facebook: { emoji: '📘', name: 'Facebook', color: 'bg-blue-100 text-blue-800' },
  instagram: { emoji: '📷', name: 'Instagram', color: 'bg-pink-100 text-pink-800' },
  linkedin: { emoji: '💼', name: 'LinkedIn', color: 'bg-blue-100 text-blue-700' },
  x: { emoji: '🐦', name: 'X', color: 'bg-gray-100 text-gray-800' },
  tiktok: { emoji: '🎵', name: 'TikTok', color: 'bg-gray-100 text-gray-900' },
  gbp: { emoji: '🏢', name: 'Google Business', color: 'bg-green-100 text-green-800' },
  threads: { emoji: '🧵', name: 'Threads', color: 'bg-gray-100 text-gray-900' }
};

const STATUS_CONFIG = {
  draft: { label: 'Borrador', color: 'bg-yellow-100 text-yellow-800', icon: '📝' },
  scheduled: { label: 'Programado', color: 'bg-blue-100 text-blue-800', icon: '⏰' },
  published: { label: 'Publicado', color: 'bg-green-100 text-green-800', icon: '✅' },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-800', icon: '❌' },
  canceled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: '🚫' }
};

interface SchedulePost {
  id: string;
  title?: string;
  baseText: string;
  status: keyof typeof STATUS_CONFIG;
  createdAt: string;
  updatedAt: string;
  targets: {
    id: string;
    platform: keyof typeof PLATFORM_CONFIG;
    publishAtUtc?: string;
    timezone: string;
    status: keyof typeof STATUS_CONFIG;
    variantText?: string;
    assetIds: string[];
  }[];
}

export function ScheduleTimeline() {
  const [posts, setPosts] = useState<SchedulePost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    platform: '',
    status: '',
    startDate: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(addDays(new Date(), 7)), 'yyyy-MM-dd'),
    sort: 'publish_time',
    order: 'asc'
  });

  const fetchSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        sort: filters.sort,
        order: filters.order
      });

      if (filters.platform) params.append('platform', filters.platform);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('start_date', filters.startDate);
      if (filters.endDate) params.append('end_date', filters.endDate);

      const response = await fetch(`/api/v1/social/schedule?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schedule');
      }

      const result = await response.json();
      setPosts(result.data || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSchedule();
  }, [filters, fetchSchedule]);

  const groupPostsByDay = (posts: SchedulePost[]) => {
    const grouped: Record<string, SchedulePost[]> = {};

    posts.forEach(post => {
      post.targets.forEach(target => {
        if (target.publishAtUtc) {
          const dateKey = format(new Date(target.publishAtUtc), 'yyyy-MM-dd');
          if (!grouped[dateKey]) {
            grouped[dateKey] = [];
          }

          // Add a modified post for this specific target
          grouped[dateKey].push({
            ...post,
            targets: [target] // Only include this specific target
          });
        }
      });
    });

    return grouped;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const groupedPosts = groupPostsByDay(posts);
  const sortedDates = Object.keys(groupedPosts).sort();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label htmlFor="platform-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Plataforma
            </label>
            <select
              id="platform-filter"
              value={filters.platform}
              onChange={(e) => setFilters(prev => ({ ...prev, platform: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las plataformas</option>
              {Object.entries(PLATFORM_CONFIG).map(([platform, config]) => (
                <option key={platform} value={platform}>
                  {config.emoji} {config.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              id="status-filter"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
              Desde
            </label>
            <input
              type="date"
              id="start-date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
              Hasta
            </label>
            <input
              type="date"
              id="end-date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 mb-2">
              Ordenar
            </label>
            <select
              id="sort-order"
              value={`${filters.sort}_${filters.order}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('_');
                setFilters(prev => ({ ...prev, sort, order }));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="publish_time_asc">Fecha ↑</option>
              <option value="publish_time_desc">Fecha ↓</option>
              <option value="created_at_desc">Más recientes</option>
              <option value="created_at_asc">Más antiguos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-8">
        {isLoading ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando cronograma...</p>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow-sm border text-center">
            <div className="text-gray-600 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay posts programados</h3>
            <p className="text-gray-600">No se encontraron posts programados con los filtros aplicados.</p>
          </div>
        ) : (
          sortedDates.map(dateKey => (
            <div key={dateKey} className="space-y-4">
              {/* Date Header */}
              <div className="sticky top-0 z-10 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {format(new Date(dateKey), 'EEEE, d MMMM yyyy', { locale: es })}
                </h3>
                <p className="text-gray-600 text-sm">
                  {groupedPosts[dateKey].length} publicacion{groupedPosts[dateKey].length !== 1 ? 'es' : ''} programada{groupedPosts[dateKey].length !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Posts for this date */}
              <div className="space-y-3 ml-6">
                {groupedPosts[dateKey]
                  .sort((a, b) => {
                    const timeA = a.targets[0].publishAtUtc ? new Date(a.targets[0].publishAtUtc).getTime() : 0;
                    const timeB = b.targets[0].publishAtUtc ? new Date(b.targets[0].publishAtUtc).getTime() : 0;
                    return timeA - timeB;
                  })
                  .map((post, index) => {
                    const target = post.targets[0];
                    const platformConfig = PLATFORM_CONFIG[target.platform];
                    const statusConfig = STATUS_CONFIG[target.status];

                    return (
                      <div key={`${post.id}-${target.id}-${index}`} className="bg-white rounded-lg shadow-sm border p-4">
                        <div className="flex items-start space-x-4">
                          {/* Time indicator */}
                          <div className="flex-shrink-0 text-center">
                            <div className="text-sm font-medium text-gray-900">
                              {target.publishAtUtc ? format(new Date(target.publishAtUtc), 'HH:mm') : '--:--'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {statusConfig.icon}
                            </div>
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${platformConfig.color}`}>
                                <span className="mr-1">{platformConfig.emoji}</span>
                                {platformConfig.name}
                              </span>

                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>

                              {post.title && (
                                <span className="text-sm font-medium text-gray-900">{post.title}</span>
                              )}
                            </div>

                            <p className="text-gray-700 text-sm mb-2">
                              {truncateText(target.variantText || post.baseText)}
                            </p>

                            {target.assetIds && target.assetIds.length > 0 && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span>{target.assetIds.length} imagen{target.assetIds.length !== 1 ? 'es' : ''}</span>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex-shrink-0">
                            <button
                              className="p-2 text-gray-600 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}