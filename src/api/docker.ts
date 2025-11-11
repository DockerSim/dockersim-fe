// Docker API 클라이언트
import { Container, Volume, Network } from '@/store/dockerStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080' // 변경: 백엔드 기본 URL로 설정

// API 응답 타입 (백엔드 API 문서에 맞춰 수정)
interface ApiResponse<T> {
  code: string // 백엔드 API 문서에 따라 'code' 필드 추가
  message: string // 백엔드 API 문서에 따라 'message' 필드 추가
  data?: T
  error?: string // 기존 프론트엔드 에러 처리 로직을 위해 유지
}

// Docker 명령어 실행 요청 타입 (추가)
interface DockerCommandRequest {
  command: string
  simulationId: string
  userId: number
  sessionId?: string // 선택 사항
}

// Docker 명령어 실행 응답 (백엔드 API 문서의 'data' 필드에 맞춰 수정)
interface DockerCommandResponse {
  command: string // 실행된 명령어
  output: string // 명령어 실행 결과
  success: boolean // 성공 여부 (백엔드 data 필드 내)
  simulationId: string // 시뮬레이션 ID
  executedAt: string // "2024-06-12 15:30:45"
  containers?: Container[] // 현재 컨테이너 목록
  images?: any[] // 현재 이미지 목록 (타입 정의 필요 시 추가)
  networks?: Network[] // 현재 네트워크 목록
  volumes?: Volume[] // 현재 볼륨 목록
  stateChanges?: any // 상태 변화 정보 (타입 정의 필요 시 추가)
  hint?: string // 학습 힌트
  help?: string // 추가 도움말
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

      // HTTP 상태 코드가 2xx 범위가 아니면 에러로 간주
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      return {
        code: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        // 백엔드 응답과 일치시키기 위해 success 필드 추가 (기존 ApiResponse에는 없었음)
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // Docker 명령어 실행 (수정)
  async executeCommand(
    command: string,
    simulationId: string,
    userId: number,
    sessionId?: string
  ): Promise<ApiResponse<DockerCommandResponse>> {
    const requestBody: DockerCommandRequest = { command, simulationId, userId, sessionId }
    return this.request<DockerCommandResponse>('/api/docker/execute', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    })
  }

  // 헬스체크 (추가)
  async getHealthCheck(): Promise<ApiResponse<any>> {
    return this.request<any>('/hc')
  }

  // 컨테이너 목록 조회 (수정)
  async getContainers(simulationId: string, userId: number): Promise<ApiResponse<Container[]>> {
    const response = await this.executeCommand('docker ps -a', simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.containers) {
      return {
        code: 'SUCCESS',
        message: 'Containers fetched successfully',
        data: response.data.containers,
      };
    } else {
      // 백엔드에서 컨테이너 목록을 직접 제공하지 않거나 에러 발생 시
      // 기존 프론트엔드 로직 (더미 데이터 등)을 사용하도록 유도
      console.warn('Backend did not return containers directly. Consider parsing output or using dummy data.');
      return {
        code: response.code,
        message: response.message || 'Failed to fetch containers from backend.',
        error: response.error,
        data: [], // 빈 배열 반환 또는 더미 데이터 로직 추가
      };
    }
  }

  // 컨테이너 생성 (수정)
  async createContainer(
    data: {
      name: string
      image: string
      ports?: string[]
      volumes?: string[]
      network?: string
      environment?: Record<string, string>
    },
    simulationId: string,
    userId: number
  ): Promise<ApiResponse<Container>> {
    let command = `docker run -d --name ${data.name} ${data.image}`;
    if (data.ports && data.ports.length > 0) {
      command += ` ${data.ports.map(p => `-p ${p}`).join(' ')}`;
    }
    if (data.volumes && data.volumes.length > 0) {
      command += ` ${data.volumes.map(v => `-v ${v}`).join(' ')}`;
    }
    if (data.network) {
      command += ` --network ${data.network}`;
    }
    if (data.environment) {
      for (const key in data.environment) {
        command += ` -e ${key}=${data.environment[key]}`;
      }
    }

    const response = await this.executeCommand(command, simulationId, userId);

    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      // 백엔드에서 생성된 컨테이너 정보를 직접 반환하지 않을 수 있으므로,
      // 성공 여부만 확인하고, 필요하다면 getContainers를 다시 호출하여 목록을 갱신
      // 또는 백엔드 응답의 stateChanges 등을 활용
      console.log('Container creation command executed successfully:', response.data.output);
      // 백엔드 API 문서에 따르면, `containers` 필드에 현재 컨테이너 목록이 올 수 있으므로,
      // 이를 활용하여 생성된 컨테이너를 찾을 수도 있습니다.
      const createdContainer = response.data.containers?.find(c => c.name === data.name);
      return {
        code: 'SUCCESS',
        message: response.message || 'Container created successfully',
        data: createdContainer || { id: 'unknown', name: data.name, image: data.image, status: 'running', ports: [], volumes: [], network: data.network || 'bridge' }, // 임시 데이터
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to create container.',
        error: response.error,
      };
    }
  }

  // 컨테이너 시작 (수정)
  async startContainer(id: string, simulationId: string, userId: number): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker start ${id}`, simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      return {
        code: 'SUCCESS',
        message: response.message || 'Container started successfully',
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to start container.',
        error: response.error,
      };
    }
  }

  // 컨테이너 중지 (수정)
  async stopContainer(id: string, simulationId: string, userId: number): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker stop ${id}`, simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      return {
        code: 'SUCCESS',
        message: response.message || 'Container stopped successfully',
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to stop container.',
        error: response.error,
      };
    }
  }

  // 컨테이너 삭제 (수정)
  async deleteContainer(id: string, simulationId: string, userId: number): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker rm -f ${id}`, simulationId, userId); // -f (force) 옵션 추가
    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      return {
        code: 'SUCCESS',
        message: response.message || 'Container deleted successfully',
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to delete container.',
        error: response.error,
      };
    }
  }

  // 볼륨 목록 조회 (수정)
  async getVolumes(simulationId: string, userId: number): Promise<ApiResponse<Volume[]>> {
    const response = await this.executeCommand('docker volume ls', simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.volumes) {
      return {
        code: 'SUCCESS',
        message: 'Volumes fetched successfully',
        data: response.data.volumes,
      };
    } else {
      console.warn('Backend did not return volumes directly. Consider parsing output or using dummy data.');
      return {
        code: response.code,
        message: response.message || 'Failed to fetch volumes from backend.',
        error: response.error,
        data: [], // 빈 배열 반환 또는 더미 데이터 로직 추가
      };
    }
  }

  // 볼륨 생성 (수정)
  async createVolume(
    data: {
      name: string
      mountPoint?: string // mountPoint는 docker volume create 명령에 직접 사용되지 않음. -o 옵션으로 드라이버 옵션 가능
    },
    simulationId: string,
    userId: number
  ): Promise<ApiResponse<Volume>> {
    let command = `docker volume create ${data.name}`;
    // mountPoint는 docker volume create 명령의 직접적인 옵션이 아님.
    // 만약 특정 드라이버 옵션으로 사용된다면 여기에 추가 로직 필요.
    // 현재는 이름만으로 생성.

    const response = await this.executeCommand(command, simulationId, userId);

    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      console.log('Volume creation command executed successfully:', response.data.output);
      const createdVolume = response.data.volumes?.find(v => v.name === data.name);
      return {
        code: 'SUCCESS',
        message: response.message || 'Volume created successfully',
        data: createdVolume || { name: data.name, driver: 'local', mountpoint: `/var/lib/docker/volumes/${data.name}/_data` }, // 임시 데이터
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to create volume.',
        error: response.error,
      };
    }
  }

  // 볼륨 삭제 (수정)
  async deleteVolume(id: string, simulationId: string, userId: number): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker volume rm ${id}`, simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      return {
        code: 'SUCCESS',
        message: response.message || 'Volume deleted successfully',
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to delete volume.',
        error: response.error,
      };
    }
  }

  // 네트워크 목록 조회 (수정)
  async getNetworks(simulationId: string, userId: number): Promise<ApiResponse<Network[]>> {
    const response = await this.executeCommand('docker network ls', simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.networks) {
      return {
        code: 'SUCCESS',
        message: 'Networks fetched successfully',
        data: response.data.networks,
      };
    } else {
      console.warn('Backend did not return networks directly. Consider parsing output or using dummy data.');
      return {
        code: response.code,
        message: response.message || 'Failed to fetch networks from backend.',
        error: response.error,
        data: [], // 빈 배열 반환 또는 더미 데이터 로직 추가
      };
    }
  }

  // 네트워크 생성 (수정)
  async createNetwork(
    data: {
      name: string
      driver?: string
      subnet?: string
      gateway?: string
    },
    simulationId: string,
    userId: number
  ): Promise<ApiResponse<Network>> {
    let command = `docker network create`;
    if (data.driver) {
      command += ` --driver ${data.driver}`;
    }
    if (data.subnet) {
      command += ` --subnet ${data.subnet}`;
    }
    if (data.gateway) {
      command += ` --gateway ${data.gateway}`;
    }
    command += ` ${data.name}`;

    const response = await this.executeCommand(command, simulationId, userId);

    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      console.log('Network creation command executed successfully:', response.data.output);
      const createdNetwork = response.data.networks?.find(n => n.name === data.name);
      return {
        code: 'SUCCESS',
        message: response.message || 'Network created successfully',
        data: createdNetwork || { id: 'unknown', name: data.name, driver: data.driver || 'bridge', subnet: data.subnet || 'unknown', gateway: data.gateway || 'unknown' }, // 임시 데이터
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to create network.',
        error: response.error,
      };
    }
  }

  // 네트워크 삭제 (수정)
  async deleteNetwork(id: string, simulationId: string, userId: number): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker network rm ${id}`, simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      return {
        code: 'SUCCESS',
        message: response.message || 'Network deleted successfully',
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to delete network.',
        error: response.error,
      };
    }
  }

  // 컨테이너를 네트워크에 연결 (수정)
  async connectToNetwork(containerId: string, networkId: string, simulationId: string, userId: number): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker network connect ${networkId} ${containerId}`, simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      return {
        code: 'SUCCESS',
        message: response.message || 'Container connected to network successfully',
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to connect container to network.',
        error: response.error,
      };
    }
  }

  // 컨테이너를 네트워크에서 연결 해제 (수정)
  async disconnectFromNetwork(containerId: string, networkId: string, simulationId: string, userId: number): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker network disconnect ${networkId} ${containerId}`, simulationId, userId);
    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      return {
        code: 'SUCCESS',
        message: response.message || 'Container disconnected from network successfully',
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to disconnect container from network.',
        error: response.error,
      };
    }
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
