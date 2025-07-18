// Docker API 클라이언트
import { Container, Volume, Network } from '@/store/dockerStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// API 응답 타입
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Docker 명령어 실행 응답
interface DockerCommandResponse {
  output: string
  error?: string
  containers?: Container[]
  volumes?: Volume[]
  networks?: Network[]
}

class DockerApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Docker 명령어 실행
  async executeCommand(command: string): Promise<ApiResponse<DockerCommandResponse>> {
    return this.request<DockerCommandResponse>('/docker/execute', {
      method: 'POST',
      body: JSON.stringify({ command }),
    })
  }

  // 컨테이너 목록 조회
  async getContainers(): Promise<ApiResponse<Container[]>> {
    return this.request<Container[]>('/docker/containers')
  }

  // 컨테이너 생성
  async createContainer(data: {
    name: string
    image: string
    ports?: string[]
    volumes?: string[]
    network?: string
    environment?: Record<string, string>
  }): Promise<ApiResponse<Container>> {
    return this.request<Container>('/docker/containers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 컨테이너 시작
  async startContainer(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/docker/containers/${id}/start`, {
      method: 'POST',
    })
  }

  // 컨테이너 중지
  async stopContainer(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/docker/containers/${id}/stop`, {
      method: 'POST',
    })
  }

  // 컨테이너 삭제
  async deleteContainer(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/docker/containers/${id}`, {
      method: 'DELETE',
    })
  }

  // 볼륨 목록 조회
  async getVolumes(): Promise<ApiResponse<Volume[]>> {
    return this.request<Volume[]>('/docker/volumes')
  }

  // 볼륨 생성
  async createVolume(data: {
    name: string
    mountPoint?: string
  }): Promise<ApiResponse<Volume>> {
    return this.request<Volume>('/docker/volumes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 볼륨 삭제
  async deleteVolume(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/docker/volumes/${id}`, {
      method: 'DELETE',
    })
  }

  // 네트워크 목록 조회
  async getNetworks(): Promise<ApiResponse<Network[]>> {
    return this.request<Network[]>('/docker/networks')
  }

  // 네트워크 생성
  async createNetwork(data: {
    name: string
    driver?: string
    subnet?: string
    gateway?: string
  }): Promise<ApiResponse<Network>> {
    return this.request<Network>('/docker/networks', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 네트워크 삭제
  async deleteNetwork(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/docker/networks/${id}`, {
      method: 'DELETE',
    })
  }

  // 컨테이너를 네트워크에 연결
  async connectToNetwork(containerId: string, networkId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/docker/networks/${networkId}/connect`, {
      method: 'POST',
      body: JSON.stringify({ containerId }),
    })
  }

  // 컨테이너를 네트워크에서 연결 해제
  async disconnectFromNetwork(containerId: string, networkId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/docker/networks/${networkId}/disconnect`, {
      method: 'POST',
      body: JSON.stringify({ containerId }),
    })
  }
}

// 싱글톤 인스턴스 생성
export const dockerApi = new DockerApiClient()

// 유틸리티 함수들
export const dockerUtils = {
  // Docker 명령어 파싱
  parseDockerCommand: (command: string): { action: string; args: string[] } => {
    const parts = command.trim().split(/\s+/)
    const action = parts.slice(0, 2).join(' ') // 'docker ps', 'docker run' 등
    const args = parts.slice(2)
    return { action, args }
  },

  // 컨테이너 상태 번역
  translateContainerStatus: (status: string): string => {
    const statusMap: Record<string, string> = {
      running: '실행 중',
      stopped: '중지됨',
      paused: '일시정지',
      restarting: '재시작 중',
      removing: '삭제 중',
      dead: '죽음',
    }
    return statusMap[status] || status
  },

  // 포트 포맷팅
  formatPorts: (ports: string[]): string => {
    return ports.join(', ')
  },

  // 볼륨 크기 포맷팅
  formatVolumeSize: (size: string): string => {
    return size
  },

  // 네트워크 서브넷 유효성 검사
  isValidSubnet: (subnet: string): boolean => {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
    return cidrRegex.test(subnet)
  },
} 