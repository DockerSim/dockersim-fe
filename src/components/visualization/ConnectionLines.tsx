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
    // 컨테이너가 1개일 때만 시각화 (여러 개면 첫 번째만)
    if (containers.length === 0) return;
    const container = containers[0];
    const containerX = ctx.canvas.width / 2;
    const containerY = 100;

    // 볼륨 배치
    const connectedVolumes = volumes.filter(v => v.connectedContainers.includes(container.id));
    const n = connectedVolumes.length;
    const baseY = 350;
    const spread = Math.min(ctx.canvas.width * 0.7, 120 * n); // 볼륨이 많아도 너무 벌어지지 않게
    const startX = containerX - spread / 2;

    // 중심선 (컨테이너에서 아래로)
    if (n > 0) {
      ctx.beginPath();
      ctx.moveTo(containerX, containerY + 20);
      ctx.lineTo(containerX, baseY - 60);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.stroke();
    }

    connectedVolumes.forEach((volume, i) => {
      const volumeX = startX + (i + 0.5) * (spread / n);
      const volumeY = baseY;

      // 곡선 연결 (중심선 하단에서 볼륨으로)
      ctx.beginPath();
      ctx.moveTo(containerX, baseY - 60);
      // cubic bezier: (cp1, cp2, end)
      ctx.bezierCurveTo(
        containerX, baseY - 20,
        volumeX, baseY - 40,
        volumeX, volumeY
      );
      ctx.strokeStyle = '#1c7ed6';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.stroke();

      // 연결점 (볼륨)
      ctx.beginPath();
      ctx.arc(volumeX, volumeY, 18, 0, 2 * Math.PI);
      ctx.fillStyle = '#38bdf8';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(volumeX, volumeY, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.fill();

      // 볼륨 이름
      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(volume.name, volumeX, volumeY + 5);
    });

    // 컨테이너 박스 (상단)
    ctx.beginPath();
    ctx.roundRect(containerX - 80, containerY - 40, 160, 60, 12);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.fillText(container.name, containerX, containerY - 10);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#888';
    ctx.fillText(container.image, containerX, containerY + 12);
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