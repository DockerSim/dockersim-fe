'use client';

import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import { useDockerStore } from '@/store/dockerStore';
import { getNetworkColor } from '@/utils/colorUtils'; // 공통 유틸리티 임포트
import './GraphLegend.css';

const GraphLegend: React.FC = () => {
    const { networks } = useDockerStore();
    const legendRef = useRef<HTMLDivElement>(null);

    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [rel, setRel] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const parent = legendRef.current?.parentElement;
        if (legendRef.current && parent) {
            setPosition({
                x: parent.offsetWidth - legendRef.current.offsetWidth - 20,
                y: 20
            });
        }
    }, []);

    const onMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        if (e.button !== 0) return;
        const legend = legendRef.current;
        if (!legend) return;

        setIsDragging(true);
        setRel({ x: e.pageX - legend.offsetLeft, y: e.pageY - legend.offsetTop });
        e.stopPropagation();
        e.preventDefault();
    };

    const onMouseUp = () => {
        setIsDragging(false);
    };

    const onMouseMove = (e: globalThis.MouseEvent) => {
        if (!isDragging || !legendRef.current) return;

        const newPos = { x: e.pageX - rel.x, y: e.pageY - rel.y };

        const parent = legendRef.current.parentElement;
        if (parent) {
            const legendWidth = legendRef.current.offsetWidth;
            const legendHeight = legendRef.current.offsetHeight;
            newPos.x = Math.max(0, Math.min(newPos.x, parent.clientWidth - legendWidth));
            newPos.y = Math.max(0, Math.min(newPos.y, parent.clientHeight - legendHeight));
        }

        setPosition(newPos);
        e.stopPropagation();
        e.preventDefault();
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging]);

    // bridge 네트워크를 제외한 네트워크 목록을 필터링하여 인덱스를 다시 계산
    const otherNetworks = networks.filter(n => n.name !== 'bridge');

    return (
        <div 
            ref={legendRef}
            className="legend-container"
            style={{ left: position.x, top: position.y }}
            onMouseDown={onMouseDown}
        >
            <div className="legend-title">범례 (드래그 가능)</div>
            <div className="legend-grid">
                {/* 컨테이너 상태 범례 */}
                <div className="legend-item">
                    <div className="legend-symbol-container"><div className="legend-symbol shape-container"><div className="shape-circle status-running"></div></div></div>
                    <div className="legend-label">Container (Running)</div>
                </div>
                <div className="legend-item">
                    <div className="legend-symbol-container"><div className="legend-symbol shape-container"><div className="shape-circle status-stopped"></div></div></div>
                    <div className="legend-label">Container (Stopped)</div>
                </div>

                {/* 볼륨 범례 */}
                <div className="legend-item">
                    <div className="legend-symbol-container"><div className="legend-symbol shape-container"><div className="shape-hexagon"></div></div></div>
                    <div className="legend-label">볼륨</div>
                </div>

                {/* 네트워크 범례 */}
                {networks.map(network => {
                    const networkIndex = otherNetworks.findIndex(n => n.id === network.id);
                    const colors = getNetworkColor(network.id, networkIndex);
                    return (
                        <div className="legend-item" key={network.id}>
                            <div className="legend-symbol-container">
                                <div className="legend-symbol network-area" style={{ backgroundColor: colors.fill, borderColor: colors.border }}></div>
                            </div>
                            <div className="legend-label">{network.name} (네트워크)</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default GraphLegend;