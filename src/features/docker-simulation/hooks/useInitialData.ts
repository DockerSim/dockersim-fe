import { useEffect } from 'react';
import { Container, Network, Image } from '../types';

interface UseInitialDataProps {
  setNetworks: React.Dispatch<React.SetStateAction<Network[]>>;
  setContainers: React.Dispatch<React.SetStateAction<Container[]>>;
  setImages: React.Dispatch<React.SetStateAction<Image[]>>;
  setActiveNetwork: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * useInitialData - 시뮬레이션을 위한 초기 더미 데이터를 설정하는 커스텀 훅
 * 
 * 책임:
 * - 기본 네트워크 생성 (net-front, net-back)
 * - 기본 컨테이너 생성 (nginx, mysql 등)
 * - 기본 이미지 생성
 * - 컨테이너와 네트워크 연결
 */
export const useInitialData = ({
  setNetworks,
  setContainers,
  setImages,
  setActiveNetwork
}: UseInitialDataProps) => {
  
  useEffect(() => {
    // 기본 네트워크 생성
    const defaultNetworks: Network[] = [
      {
        id: '1001',
        name: 'net-front',
        containers: [],
        isNew: false
      },
      {
        id: '1002', 
        name: 'net-back',
        containers: [],
        isNew: false
      }
    ];

    // 기본 컨테이너 생성
    const defaultContainers: Container[] = [
      {
        id: '101',
        name: 'web1',
        image: 'nginx:latest',
        ports: [{ hostPort: '80', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(Date.now() - 86400000), // 1일 전
        network: 'net-front',
        volumes: []
      },
      {
        id: '102',
        name: 'web2', 
        image: 'nginx:latest',
        ports: [{ hostPort: '81', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(Date.now() - 86400000), // 1일 전
        network: 'net-front',
        volumes: []
      },
      {
        id: '103',
        name: 'web3',
        image: 'nginx:latest', 
        ports: [{ hostPort: '82', containerPort: '80' }],
        status: 'running',
        createdAt: new Date(Date.now() - 86400000), // 1일 전
        network: 'net-front',
        volumes: []
      },
      {
        id: '104',
        name: 'db1',
        image: 'mysql:8',
        ports: [{ hostPort: '3306', containerPort: '3306' }],
        status: 'stopped',
        createdAt: new Date(Date.now() - 172800000), // 2일 전
        network: 'net-back',
        volumes: []
      }
    ];

    // 기본 이미지 생성
    const defaultImages: Image[] = [
      {
        id: '201',
        name: 'nginx',
        tag: 'latest',
        size: '133MB',
        created: new Date(Date.now() - 259200000), // 3일 전
        isOfficial: true
      },
      {
        id: '202',
        name: 'mysql',
        tag: '8',
        size: '545MB', 
        created: new Date(Date.now() - 345600000), // 4일 전
        isOfficial: true
      },
      {
        id: '203',
        name: 'node',
        tag: 'latest',
        size: '908MB',
        created: new Date(Date.now() - 432000000), // 5일 전
        isOfficial: true
      },
      {
        id: '204',
        name: 'redis',
        tag: 'alpine',
        size: '32MB',
        created: new Date(Date.now() - 518400000), // 6일 전
        isOfficial: true
      }
    ];

    // 네트워크에 컨테이너 연결
    defaultNetworks[0].containers = defaultContainers.filter(c => c.network === 'net-front');
    defaultNetworks[1].containers = defaultContainers.filter(c => c.network === 'net-back');

    // 상태 업데이트
    setNetworks(defaultNetworks);
    setContainers(defaultContainers);
    setImages(defaultImages);
    setActiveNetwork(defaultNetworks[0].id);

    console.log('✅ 초기 더미 데이터가 로드되었습니다:', {
      networks: defaultNetworks.length,
      containers: defaultContainers.length, 
      images: defaultImages.length
    });

  }, []); // 빈 의존성 배열로 컴포넌트 마운트 시에만 실행

  return null; // 이 hook은 UI를 렌더링하지 않음
}; 