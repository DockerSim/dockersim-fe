'use client'

import React, { useState } from 'react'
import { Container } from '@/store/dockerStore'

interface ContainerCardProps {
  container: Container
}

const ContainerCard: React.FC<ContainerCardProps> = ({ container }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-500'
      case 'stopped':
        return 'bg-red-500'
      case 'paused':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return '실행 중'
      case 'stopped':
        return '중지됨'
      case 'paused':
        return '일시정지'
      default:
        return '알 수 없음'
    }
  }

  return (
    <div className="container-card bg-blue-50 border-2 border-blue-200 rounded-lg p-4 transition-all duration-300 hover:shadow-md">
      {/* 컨테이너 헤더 */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="container-icon">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
              </svg>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800">{container.name}</h4>
            <p className="text-sm text-gray-600">{container.image}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(container.status)}`}></div>
          <span className="text-sm text-gray-600">{getStatusText(container.status)}</span>
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

      {/* 컨테이너 상세 정보 (드롭다운) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
          {/* 포트 정보 */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">포트</h5>
            <div className="flex flex-wrap gap-1">
              {container.ports.map((port, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {port}
                </span>
              ))}
            </div>
          </div>

          {/* 네트워크 정보 */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">네트워크</h5>
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
              {container.network}
            </span>
          </div>

          {/* 볼륨 정보 */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">볼륨</h5>
            {container.volumes.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {container.volumes.map((volume, index) => (
                  <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {volume}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500 text-xs">연결된 볼륨 없음</span>
            )}
          </div>

          {/* 생성 시간 */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-1">생성 시간</h5>
            <span className="text-xs text-gray-500">
              {new Date(container.createdAt).toLocaleString()}
            </span>
          </div>

          {/* 컨테이너 제어 버튼 */}
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors">
              시작
            </button>
            <button className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors">
              일시정지
            </button>
            <button className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors">
              중지
            </button>
            <button className="px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors">
              삭제
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContainerCard 