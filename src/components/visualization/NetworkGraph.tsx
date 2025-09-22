'use client';

import React, { useEffect, useRef } from 'react';
import { Network, Node, Edge } from 'vis-network';
import 'vis-network/styles/vis-network.css';
import * as d3 from 'd3';
import { useDockerStore } from '@/store/dockerStore';

// Props 타입 정의
interface NetworkGraphProps {
  onNodeClick: (nodeId: string) => void;
}

// 네트워크 색상 정의
const groupFillColors: { [key: string]: string } = {
    'bridge': 'rgba(100, 100, 100, 0.1)',
    'custom-net-1': 'rgba(65, 105, 225, 0.2)',
};

const groupBorderColors: { [key: string]: string } = {
    'bridge': '#646464',
    'custom-net-1': '#4169E1',
};

const NetworkGraph: React.FC<NetworkGraphProps> = ({ onNodeClick }) => {
    const visJsRef = useRef<HTMLDivElement>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const networkInstanceRef = useRef<Network | null>(null);

    const { containers, volumes, networks } = useDockerStore();

    useEffect(() => {
        if (!visJsRef.current || !svgRef.current) return;

        const nodes: Node[] = [];
        const edges: Edge[] = [];

        containers.forEach(container => {
            let nodeColor = {};
            switch (container.status) {
                case 'running':
                    nodeColor = { border: '#2B7CE9', background: '#D2E5FF' };
                    break;
                case 'stopped':
                    nodeColor = { border: '#808080', background: '#E0E0E0' };
                    break;
                case 'paused':
                    nodeColor = { border: '#FFA500', background: '#FFDDAA' };
                    break;
            }

            nodes.push({
                id: container.id,
                label: container.name,
                shape: 'dot',
                size: 20,
                font: { size: 18 },
                color: nodeColor,
            });
        });

        volumes.forEach(volume => {
            nodes.push({
                id: volume.id,
                label: volume.name,
                shape: 'hexagon',
                size: 20,
                font: { size: 18 },
                color: { border: '#2ca02c', background: '#98df8a' },
            });

            volume.connectedContainers.forEach(containerId => {
                edges.push({ from: volume.id, to: containerId });
            });
        });

        if (!networkInstanceRef.current) {
            const data = { nodes, edges };
            const options = { /* vis.js 옵션 */ };
            const network = new Network(visJsRef.current, data, options);
            networkInstanceRef.current = network;

            // --- 클릭 이벤트 리스너 추가 ---
            network.on('click', (params) => {
                if (params.nodes.length > 0) {
                    const nodeId = params.nodes[0];
                    onNodeClick(nodeId);
                }
            });

            network.on('afterDrawing', () => drawGroupHulls(network));
        } else {
            networkInstanceRef.current.setData({ nodes, edges });
        }

        const drawGroupHulls = (network: Network) => {
            if (!svgRef.current) return;

            const svg = d3.select(svgRef.current);
            const hullGroup = svg.selectAll('.hull-group').data([1]).join('g').attr('class', 'hull-group');

            const nodePositions = network.getPositions();
            const groups: { [key: string]: [number, number][] } = {};

            networks.forEach(net => {
                if (!groups[net.id]) groups[net.id] = [];
                net.containers.forEach(container => {
                    const pos = nodePositions[container.id];
                    if (pos) {
                        const canvasPos = network.canvasToDOM(pos);
                        groups[net.id].push([canvasPos.x, canvasPos.y]);
                    }
                });
            });

            hullGroup.selectAll("path").remove();

            const line = d3.line<[number, number]>().x(d => d[0]).y(d => d[1]).curve(d3.curveCatmullRomClosed);

            for (const groupName in groups) {
                const groupNodes = groups[groupName];
                if (groupNodes.length === 0) continue;

                const padding = 40;
                const paddedNodes: [number, number][] = groupNodes.flatMap(n => [
                    [n[0] - padding, n[1] - padding],
                    [n[0] - padding, n[1] + padding],
                    [n[0] + padding, n[1] - padding],
                    [n[0] + padding, n[1] + padding],
                ]);

                const hull = d3.polygonHull(paddedNodes);
                if (hull) {
                    hullGroup.append("path")
                        .attr("d", line(hull) || "")
                        .style("fill", groupFillColors[groupName] || 'rgba(128,128,128,0.1)')
                        .style("stroke", groupBorderColors[groupName] || '#808080')
                        .style("stroke-width", 2)
                        .style("stroke-linejoin", "round");
                }
            }
        };

        if (networkInstanceRef.current) {
            drawGroupHulls(networkInstanceRef.current);
        }

    }, [containers, volumes, networks, onNodeClick]);

    return (
        <div id="network-graph-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div ref={visJsRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }} />
            <svg ref={svgRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }} />
        </div>
    );
};

export default NetworkGraph;
