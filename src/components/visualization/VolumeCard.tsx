'use client'

import React, { useState } from 'react'
import { Volume } from '@/store/dockerStore'

interface VolumeCardProps {
  volume: Volume
}

const VolumeCard: React.FC<VolumeCardProps> = ({ volume }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="volume-card bg-green-50 border-2 border-green-200 rounded-lg p-4 transition-all duration-300 hover:shadow-md">
      {/* 볼륨 헤더 */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="volume-icon">
            <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{volume.name}</h4>
            <p className="text-sm text-gray-600">{volume.size}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-gray-600">
            {volume.connectedContainers.length}개 연결
          </span>
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 볼륨 상세 정보 (드롭다운) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-green-200 space-y-3">
          {/* 마운트 포인트 */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">마운트 포인트</h5>
            <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">
              {volume.mountPoint}
            </code>
          </div>

          {/* 연결된 컨테이너 */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">연결된 컨테이너</h5>
            {volume.connectedContainers.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {volume.connectedContainers.map((containerId, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {containerId}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-xs">연결된 컨테이너 없음</span>
            )}
          </div>

          {/* 생성 시간 */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">생성 시간</h5>
            <span className="text-xs text-gray-500">
              {new Date(volume.createdAt).toLocaleString()}
            </span>
          </div>

          {/* 볼륨 제어 버튼 */}
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors">
              마운트
            </button>
            <button className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors">
              언마운트
            </button>
            <button className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors">
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default VolumeCard 