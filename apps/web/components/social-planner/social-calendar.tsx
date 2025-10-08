'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  postCount: number;
  statuses: string[];
  platforms: string[];
}

interface SocialCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onCreatePost: (date?: Date) => void;
}

interface CalendarData {
  [dateKey: string]: {
    post_count: number;
    statuses: string[];
    platforms: string[];
    draft_count: number;
    scheduled_count: number;
    published_count: number;
    failed_count: number;
  };
}

export function SocialCalendar({ selectedDate, onDateSelect, onCreatePost }: SocialCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [isLoading, setIsLoading] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Generate calendar grid (6 weeks)
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());

  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = format(monthStart, 'yyyy-MM-dd');
      const endDate = format(monthEnd, 'yyyy-MM-dd');

      const response = await fetch(`/api/v1/social/calendar?view=month&date=${startDate}&start_date=${startDate}&end_date=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch calendar data');
      }

      const result = await response.json();

      // Transform data into a lookup object
      const dataLookup: CalendarData = {};
      if (result.data && result.data.summary) {
        result.data.summary.forEach((day: any) => {
          dataLookup[day.date] = day;
        });
      }

      setCalendarData(dataLookup);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [monthStart, monthEnd]);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth, fetchCalendarData]);

  const getDayData = (date: Date): CalendarDay => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const data = calendarData[dateKey];

    return {
      date,
      isCurrentMonth: isSameMonth(date, currentMonth),
      postCount: data?.post_count || 0,
      statuses: data?.statuses || [],
      platforms: data?.platforms || []
    };
  };

  const getStatusColor = (dayData: CalendarDay) => {
    if (dayData.postCount === 0) return 'bg-gray-100';

    const data = calendarData[format(dayData.date, 'yyyy-MM-dd')];
    if (!data) return 'bg-gray-100';

    if (data.failed_count > 0) return 'bg-red-100';
    if (data.scheduled_count > 0) return 'bg-blue-100';
    if (data.published_count > 0) return 'bg-green-100';
    if (data.draft_count > 0) return 'bg-yellow-100';

    return 'bg-gray-100';
  };

  const getPlatformEmojis = (platforms: string[]) => {
    const emojiMap: Record<string, string> = {
      facebook: '📘',
      instagram: '📷',
      linkedin: '💼',
      x: '🐦',
      tiktok: '🎵',
      gbp: '🏢',
      threads: '🧵'
    };

    return platforms.slice(0, 3).map(platform => emojiMap[platform] || '📱').join('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Haz clic en un día para ver los posts programados
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => setCurrentMonth(new Date())}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            Hoy
          </button>

          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map(date => {
            const dayData = getDayData(date);
            const isSelected = isSameDay(date, selectedDate);
            const isToday = isSameDay(date, new Date());

            return (
              <button
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                onDoubleClick={() => onCreatePost(date)}
                className={`
                  relative p-2 min-h-[80px] text-left rounded-lg border transition-all hover:shadow-sm
                  ${dayData.isCurrentMonth ? 'text-gray-900' : 'text-gray-600'}
                  ${isSelected ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200 hover:border-gray-300'}
                  ${isToday ? 'bg-blue-50' : getStatusColor(dayData)}
                `}
              >
                {/* Date number */}
                <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                  {format(date, 'd')}
                </div>

                {/* Post indicators */}
                {dayData.postCount > 0 && (
                  <div className="mt-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-600">
                        {dayData.postCount} post{dayData.postCount !== 1 ? 's' : ''}
                      </span>
                      <div className="text-xs">
                        {getPlatformEmojis(dayData.platforms)}
                      </div>
                    </div>

                    {/* Status indicators */}
                    <div className="flex space-x-1">
                      {calendarData[format(date, 'yyyy-MM-dd')]?.draft_count > 0 && (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Borradores" />
                      )}
                      {calendarData[format(date, 'yyyy-MM-dd')]?.scheduled_count > 0 && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full" title="Programados" />
                      )}
                      {calendarData[format(date, 'yyyy-MM-dd')]?.published_count > 0 && (
                        <div className="w-2 h-2 bg-green-400 rounded-full" title="Publicados" />
                      )}
                      {calendarData[format(date, 'yyyy-MM-dd')]?.failed_count > 0 && (
                        <div className="w-2 h-2 bg-red-400 rounded-full" title="Fallidos" />
                      )}
                    </div>
                  </div>
                )}

                {/* Today indicator */}
                {isToday && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-yellow-400 rounded-full" />
              <span className="text-gray-600">Borrador</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-400 rounded-full" />
              <span className="text-gray-600">Programado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-400 rounded-full" />
              <span className="text-gray-600">Publicado</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-400 rounded-full" />
              <span className="text-gray-600">Fallido</span>
            </div>
          </div>

          <div className="text-gray-500">
            Doble clic en un día para crear un post
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}