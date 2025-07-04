import { Position } from '../types';
import styles from '../components/terminal/Terminal.module.css';

/**
 * 프로세스 타입과 인덱스를 기반으로 위치를 계산합니다.
 */
export const calculateProcessPosition = (type: string, processIndex: number): Position => {
  // 기본 위치
  const baseX = window.innerWidth / 2 - 150;
  const baseY = 150;
  
  // 프로세스 타입별 수직 오프셋
  const typeOffsets = {
    'search': 0,
    'pull': 1,
    'create': 2,
    'connect': 3,
    'start': 4,
    'error': 5
  };
  
  // 타입별 오프셋 계산 (해당 타입이 없으면 기본값 0)
  const typeOffset = (typeOffsets as any)[type] || 0;
  
  // 프로세스 인덱스에 따른 수평 오프셋
  const horizontalOffset = (processIndex % 3) * 320; // 3개씩 수평 배치, 각 320px 간격
  
  // 최종 위치 계산
  return {
    x: baseX + horizontalOffset,
    y: baseY + (typeOffset * 90) // 각 타입별 90px 간격으로 수직 배치
  };
};

/**
 * 컨테이너 위치를 기반으로 프로세스 말풍선의 위치를 조정합니다.
 */
export const adjustProcessPositionToContainer = (containerId: string | undefined): Position | undefined => {
  if (!containerId) return undefined;
  
  // 먼저 컨테이너 래퍼 요소 찾기 (더 큰 컨테이너 영역)
  const containerWrapperElement = document.querySelector(`.${styles.containerWrapper}[data-container-id="${containerId}"]`);
  if (containerWrapperElement) {
    const rect = containerWrapperElement.getBoundingClientRect();
    return {
      x: rect.left + (rect.width / 2) - 150, // 말풍선 중앙 정렬
      y: rect.top - 100 // 컨테이너 위쪽에 약간 더 가깝게 배치
    };
  }
  
  // 래퍼를 찾지 못하면 컨테이너 카드 요소 찾기
  const containerElement = document.querySelector(`[data-container-id="${containerId}"]`);
  if (containerElement) {
    const rect = containerElement.getBoundingClientRect();
    return {
      x: rect.left + (rect.width / 2) - 150, // 말풍선 중앙 정렬
      y: rect.top - 100 // 컨테이너 위쪽에 약간 더 가깝게 배치
    };
  }
  
  return undefined;
}; 