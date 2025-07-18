'use client'

import React, { useEffect, useRef } from 'react'
import { Container, Volume } from '@/store/dockerStore'

interface ConnectionLinesProps {
  containers: Container[]
  volumes: Volume[]
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ containers, volumes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기 설정
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 연결선 그리기
    drawConnections(ctx, containers, volumes)
  }, [containers, volumes])

  const drawConnections = (ctx: CanvasRenderingContext2D, containers: Container[], volumes: Volume[]) => {
    // 볼륨-컨테이너 연결선 그리기
    volumes.forEach((volume, volumeIndex) => {
      volume.connectedContainers.forEach((containerId) => {
        const container = containers.find(c => c.id === containerId)
        if (!container) return

        // 볼륨 위치 계산 (우측 열에 위치)
        const volumeX = ctx.canvas.width * 0.75
        const volumeY = 100 + volumeIndex * 80

        // 컨테이너 위치 계산 (좌측 열에 위치)
        const containerIndex = containers.findIndex(c => c.id === containerId)
        const containerX = ctx.canvas.width * 0.25
        const containerY = 100 + containerIndex * 80

        // 연결선 그리기
        ctx.beginPath()
        ctx.moveTo(containerX, containerY)
        ctx.lineTo(volumeX, volumeY)
        ctx.strokeStyle = '#10b981' // green-500
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.stroke()
        ctx.setLineDash([])

        // 연결점 그리기
        ctx.beginPath()
        ctx.arc(containerX, containerY, 4, 0, 2 * Math.PI)
        ctx.fillStyle = '#3b82f6' // blue-500
        ctx.fill()

        ctx.beginPath()
        ctx.arc(volumeX, volumeY, 4, 0, 2 * Math.PI)
        ctx.fillStyle = '#10b981' // green-500
        ctx.fill()
      })
    })
  }

  return (
    <div className="connection-lines-container absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}
      />
      
      {/* 연결 상태 표시 */}
      {volumes.some(v => v.connectedContainers.length > 0) && (
        <div className="absolute bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-10">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">연결 상태</h4>
          <div className="space-y-1">
            {volumes.map((volume) => (
              <div key={volume.id} className="text-xs">
                {volume.connectedContainers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">
                      {volume.name} ↔ {volume.connectedContainers.length}개 컨테이너
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectionLines 