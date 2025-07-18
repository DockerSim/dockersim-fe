'use client'

import React, { useState } from 'react'
import { Network } from '@/store/dockerStore'

interface NetworkTabsProps {
  networks: Network[]
}

const NetworkTabs: React.FC<NetworkTabsProps> = ({ networks }) => {
  const [activeNetworkId, setActiveNetworkId] = useState<string>(networks[0]?.id || '')

  const activeNetwork = networks.find(n => n.id === activeNetworkId)

  return (
    <div className="network-tabs">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <div className="w-4 h-4 bg-purple-500 rounded"></div>
        네트워크
      </h3>
      
      {/* 네트워크 탭 헤더 */}
      <div className="flex bg-gray-100 rounded-t-lg overflow-hidden">
        {networks.map((network) => (
          <button
            key={network.id}
            onClick={() => setActiveNetworkId(network.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors flex-1 ${
              activeNetworkId === network.id
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-current rounded-full"></div>
              {network.name}
              {network.connectedContainers.length > 0 && (
                <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {network.connectedContainers.length}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* 네트워크 탭 내용 */}
      {activeNetwork && (
        <div className="bg-white border-2 border-gray-200 border-t-0 rounded-b-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* 네트워크 정보 */}
            <div className="space-y-3">
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">드라이버</h5>
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs">
                  {activeNetwork.driver}
                </span>
              </div>
              
              {activeNetwork.subnet && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">서브넷</h5>
                  <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">
                    {activeNetwork.subnet}
                  </code>
                </div>
              )}
              
              {activeNetwork.gateway && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-1">게이트웨이</h5>
                  <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-mono">
                    {activeNetwork.gateway}
                  </code>
                </div>
              )}
              
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-1">생성 시간</h5>
                <span className="text-xs text-gray-500">
                  {new Date(activeNetwork.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* 연결된 컨테이너 */}
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">연결된 컨테이너</h5>
              {activeNetwork.connectedContainers.length > 0 ? (
                <div className="space-y-1">
                  {activeNetwork.connectedContainers.map((containerId, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded p-2">
                      <span className="text-sm text-blue-800">{containerId}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm text-center py-4 border-2 border-dashed border-gray-300 rounded">
                  연결된 컨테이너가 없습니다
                </div>
              )}
            </div>
          </div>

          {/* 네트워크 제어 버튼 */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
            <button className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors">
              컨테이너 연결
            </button>
            <button className="px-3 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600 transition-colors">
              컨테이너 연결 해제
            </button>
            {activeNetwork.id !== 'bridge' && (
              <button className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors">
                네트워크 삭제
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NetworkTabs 