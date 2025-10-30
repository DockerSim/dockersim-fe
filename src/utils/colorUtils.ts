// /src/utils/colorUtils.ts

// 채도와 명도를 높여 구분이 더 명확한 색상 팔레트
const baseColors = [
    { fill: 'rgba(255, 99, 132, 0.4)', border: '#FF6384' },   // Vibrant Red
    { fill: 'rgba(54, 162, 235, 0.4)', border: '#36A2EB' },   // Vibrant Blue
    { fill: 'rgba(255, 206, 86, 0.4)', border: '#FFCE56' },   // Vibrant Yellow
    { fill: 'rgba(75, 192, 192, 0.4)', border: '#4BC0C0' },   // Vibrant Teal
    { fill: 'rgba(153, 102, 255, 0.4)', border: '#9966FF' },  // Vibrant Purple
    { fill: 'rgba(255, 159, 64, 0.4)', border: '#FF9F40' },  // Vibrant Orange
    { fill: 'rgba(46, 204, 113, 0.4)', border: '#2ECC71' },  // Vibrant Green
    { fill: 'rgba(231, 76, 60, 0.4)', border: '#E74C3C' },    // Vibrant Pomegranate
    { fill: 'rgba(52, 73, 94, 0.4)', border: '#34495E' },     // Vibrant Wet Asphalt
];

export const getNetworkColor = (networkId: string, networkIndex: number) => {
    if (networkId === 'bridge') {
        return { fill: 'rgba(149, 165, 166, 0.4)', border: '#95A5A6' }; // Grey for bridge
    }
    return baseColors[networkIndex % baseColors.length];
};
