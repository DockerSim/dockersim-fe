import { create } from 'zustand';

export interface ImageInfo {
  repo: string;
  tag: string;
  size?: string;
  created?: string;
  layers?: number;
  digest?: string;
}

export interface LocalImage extends ImageInfo {
  status: 'pulled' | 'missing';
}

interface DockerState {
  viewMode: 'local' | 'registry';
  localImages: LocalImage[];
  remoteResults: ImageInfo[];
  selectedImage: ImageInfo | null;
  isLoading: boolean;
  hasMore: boolean;
  currentPage: number;
  error: string | null;
  
  setViewMode: (mode: 'local' | 'registry') => void;
  setSelectedImage: (image: ImageInfo | null) => void;
  searchImages: (query: string, page?: number) => Promise<void>;
  pullImage: (repo: string, tag: string) => Promise<void>;
  clearError: () => void;
}

// 초기 더미 데이터
const initialLocalImages: LocalImage[] = [
  {
    repo: 'nginx',
    tag: 'latest',
    status: 'pulled',
    size: '133MB',
    created: '2024-03-15',
    layers: 5,
    digest: 'sha256:a8758716bb6ad1975ca40436ea3a7f5789df2944' 
  },
  {
    repo: 'ubuntu',
    tag: '22.04',
    status: 'missing',
    size: '72MB',
    created: '2024-03-10',
    layers: 3,
    digest: 'sha256:b8758716bb6ad1975ca40436ea3a7f5789df2944'
  },
  {
    repo: 'node',
    tag: '20-alpine',
    status: 'pulled',
    size: '345MB',
    created: '2024-03-12',
    layers: 8,
    digest: 'sha256:c8758716bb6ad1975ca40436ea3a7f5789df2944'
  },
  {
    repo: 'redis',
    tag: 'alpine',
    status: 'pulled',
    size: '32MB',
    created: '2024-03-14',
    layers: 4,
    digest: 'sha256:d8758716bb6ad1975ca40436ea3a7f5789df2944'
  },
  {
    repo: 'mysql',
    tag: '8.0',
    status: 'missing',
    size: '446MB',
    created: '2024-03-13',
    layers: 12,
    digest: 'sha256:e8758716bb6ad1975ca40436ea3a7f5789df2944'
  }
];

const initialRemoteResults: ImageInfo[] = [
  {
    repo: 'postgres',
    tag: '16-alpine',
    size: '246MB',
    created: '2024-03-15',
    layers: 7,
    digest: 'sha256:f8758716bb6ad1975ca40436ea3a7f5789df2944'
  },
  {
    repo: 'mongo',
    tag: 'latest',
    size: '655MB',
    created: '2024-03-14',
    layers: 9,
    digest: 'sha256:g8758716bb6ad1975ca40436ea3a7f5789df2944'
  },
  {
    repo: 'rabbitmq',
    tag: '3.12-management',
    size: '246MB',
    created: '2024-03-13',
    layers: 8,
    digest: 'sha256:h8758716bb6ad1975ca40436ea3a7f5789df2944'
  }
];

export const useDockerStore = create<DockerState>((set, get) => ({
  viewMode: 'local',
  localImages: initialLocalImages,
  remoteResults: initialRemoteResults,
  selectedImage: null,
  isLoading: false,
  hasMore: true,
  currentPage: 1,
  error: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  
  setSelectedImage: (image) => set({ selectedImage: image }),
  
  searchImages: async (query, page = 1) => {
    if (!query.trim()) {
      set({ remoteResults: initialRemoteResults, hasMore: false });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      
      // 페이지가 1이면 결과를 초기화
      if (page === 1) {
        set({ remoteResults: [], currentPage: 1 });
      }

      // Docker Hub API 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newResults: ImageInfo[] = Array.from({ length: 10 }, (_, i) => ({
        repo: `${query}-${i + (page - 1) * 10}`,
        tag: 'latest',
        size: `${Math.floor(Math.random() * 200) + 10}MB`,
        created: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
        layers: Math.floor(Math.random() * 10) + 1,
        digest: `sha256:${Math.random().toString(36).substring(2)}`,
      }));

      set(state => ({
        remoteResults: page === 1 ? newResults : [...state.remoteResults, ...newResults],
        currentPage: page,
        hasMore: page < 5, // 최대 5페이지까지만 제공
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '검색 중 오류가 발생했습니다.' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  pullImage: async (repo, tag) => {
    try {
      set({ isLoading: true, error: null });
      
      // Pull 작업 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      set(state => ({
        localImages: [
          ...state.localImages,
          {
            repo,
            tag,
            status: 'pulled',
            size: `${Math.floor(Math.random() * 200) + 10}MB`,
            created: new Date().toISOString().split('T')[0],
            layers: Math.floor(Math.random() * 10) + 1,
            digest: `sha256:${Math.random().toString(36).substring(2)}`,
          }
        ]
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : '이미지 다운로드 중 오류가 발생했습니다.' });
    } finally {
      set({ isLoading: false });
    }
  },
  
  clearError: () => set({ error: null }),
})); 