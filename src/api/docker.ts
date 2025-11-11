// Docker API 클라이언트
import { Container, Volume, Network } from '@/store/dockerStore'
import { useAuthStore } from '@/store/authStore'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// API 응답 타입
interface ApiResponse<T> {
  code: string
  message: string
  data?: T
  error?: string
}

// 백엔드 응답 타입 (실제 백엔드 구조에 맞춤)
interface BackendDockerContainerResponse {
  console: string[]
  id: number
  hexId: string
  shortHexId: string
  name: string
  baseImageName: string
  status: string  // RUNNING, STOPPED, PAUSED 등
  layer: string[]
  volumes?: Array<{
    volumeName: string
    containerPath: string
    isReadOnly: boolean
  }>
  networks?: string[]
}

interface BackendDockerVolumeResponse {
  console: string[]
  createAt: string
  mountPoint: string
  name: string
  anonymous: boolean
}

interface BackendDockerNetworkResponse {
  console: string[]
  id: number
  shortHexId: string
  name: string
  createdAt: string
  connectState: string  // NONE, CONNECTED, DISCONNECTED
  containerId: number
}

// 백엔드 CommandResult 타입
interface BackendCommandResult {
  console: string[]
  status: 'CREATE' | 'UPDATE' | 'READ' | 'DELETE'
  changedImages: any[]
  changedContainers: BackendDockerContainerResponse[]
  changedVolumes: BackendDockerVolumeResponse[]
  changedNetworks: BackendDockerNetworkResponse[]
}

// 백엔드 이미지 응답 타입
interface BackendDockerImageResponse {
  console: string[]
  hexId: string
  shortHexId: string
  namespace: string
  name: string
  tag: string
  location: string
  layer: string[]
  createdAt: string
}

// 변환된 응답 타입 (프론트엔드에서 사용)
interface DockerCommandResponse {
  output: string
  success: boolean
  containers: Container[]
  volumes: Volume[]
  networks: Network[]
  localImages?: any[]  // 이미지 정보 추가
}

class DockerApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // 인증 토큰 가져오기
      const { accessToken } = useAuthStore.getState()

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      }

      // 토큰이 있으면 Authorization 헤더 추가
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', {
          status: response.status,
          endpoint,
          errorText,
        })
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('API request failed:', error)
      return {
        code: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // 백엔드 응답을 프론트엔드 형식으로 변환
  private transformBackendResponse(backendResult: BackendCommandResult): DockerCommandResponse {
    // 콘솔 출력을 문자열로 변환
    const output = backendResult.console?.join('\n') || ''
    const success = backendResult.status === 'CREATE' || backendResult.status === 'UPDATE' || backendResult.status === 'READ'

    // 컨테이너 변환 (백엔드에서 직접 제공하는 네트워크 및 볼륨 정보 사용)
    const containers: Container[] = (backendResult.changedContainers || []).map(c => {
      // 백엔드가 직접 제공하는 네트워크 정보 사용
      const containerNetworks = c.networks || [];

      // 백엔드가 직접 제공하는 볼륨 정보를 프론트엔드 형식으로 변환
      const containerVolumes: Volume[] = (c.volumes || []).map(v => ({
        id: v.volumeName,
        name: v.volumeName,
        driver: 'local',
        scope: 'local' as 'local',
        createdAt: new Date(),
        mountPath: v.containerPath,
        labels: null,
        options: null,
        connectedContainers: [c.hexId || c.shortHexId || String(c.id)],
      }));

      console.log(`[docker.ts] Container ${c.name} networks:`, containerNetworks);
      console.log(`[docker.ts] Container ${c.name} volumes:`, containerVolumes);

      return {
        id: c.hexId || c.shortHexId || String(c.id),
        name: c.name,
        image: c.baseImageName,
        status: c.status.toLowerCase() as 'running' | 'stopped' | 'paused',
        ports: [],  // 백엔드 응답에 포트 정보가 없으므로 빈 배열
        volumes: containerVolumes,
        network: containerNetworks,
        created: new Date(),
      };
    });

    // 볼륨 변환
    const volumes: Volume[] = (backendResult.changedVolumes || []).map(v => ({
      id: v.name,
      name: v.name,
      driver: 'local',
      scope: 'local' as 'local',
      createdAt: v.createAt ? new Date(v.createAt) : new Date(),
      mountPath: v.mountPoint || '',
      labels: null,
      options: null,
      connectedContainers: [],  // TODO: 백엔드에서 볼륨-컨테이너 연결 정보 필요
    }))

    // 네트워크 변환
    const networks: Network[] = (backendResult.changedNetworks || []).map(n => ({
      id: n.shortHexId || String(n.id),
      name: n.name,
      driver: 'bridge',  // 백엔드 응답에 driver 정보가 없으므로 기본값
      scope: 'local' as 'local',
      createdAt: n.createdAt ? new Date(n.createdAt) : new Date(),
      containers: [],  // syncNetworksWithContainers에서 채워짐
    }))

    // 이미지 변환 (docker pull 등의 명령어에서 사용)
    const localImages = (backendResult.changedImages || []).map((img: any) => ({
      id: img.hexId || img.shortHexId,
      name: img.name,
      tag: img.tag,
      created: img.createdAt ? new Date(img.createdAt) : new Date(),
      size: 'N/A',
    }))

    console.log('Transformed localImages:', localImages);

    return {
      output,
      success,
      containers,
      volumes,
      networks,
      localImages: localImages.length > 0 ? localImages : undefined,
    }
  }

  // Docker 명령어 실행
  async executeCommand(
    command: string,
    simulationId: string
  ): Promise<ApiResponse<DockerCommandResponse>> {
    try {
      // 명령어에서 모든 줄바꿈과 불필요한 공백 제거
      const cleanCommand = command.trim().replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ');

      // 인증 토큰 가져오기
      const { accessToken } = useAuthStore.getState()

      const headers: HeadersInit = {
        'Content-Type': 'text/plain', // Content-Type을 text/plain으로 변경
      }

      // 토큰이 있으면 Authorization 헤더 추가
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`
      }

      console.log('=== Sending Command ===');
      console.log('Original command:', command);
      console.log('Cleaned command:', cleanCommand);
      console.log('Has newline:', command.includes('\n') || command.includes('\r'));

      const response = await fetch(`${API_BASE_URL}/api/simulations/${simulationId}/command`, {
        method: 'POST',
        headers,
        body: cleanCommand,  // JSON.stringify 제거
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error:', {
          status: response.status,
          endpoint: `/api/simulations/${simulationId}/command`,
          errorText,
        })
        return {
          code: 'ERROR',
          message: `HTTP error! status: ${response.status}`,
          error: errorText,
        }
      }

      const backendResponse: any = await response.json()

      console.log('=== Backend Response ===');
      console.log('Full response:', backendResponse);
      console.log('success:', backendResponse.success);
      console.log('code:', backendResponse.code);

      // 백엔드 응답이 성공이면 변환하여 반환
      // 백엔드가 success: true를 반환하거나 code가 'SUCCESS'인 경우 성공으로 처리
      if ((backendResponse.success || backendResponse.code === 'SUCCESS') && backendResponse.data) {
        const transformedData = this.transformBackendResponse(backendResponse.data)
        return {
          code: 'SUCCESS',
          message: backendResponse.message || 'Success',
          data: transformedData,
        }
      }

      // 실패한 경우 에러 응답 반환
      return {
        code: backendResponse.code || 'ERROR',
        message: backendResponse.message || backendResponse.errorMessage || 'Unknown error',
        error: backendResponse.error || backendResponse.errorMessage,
      }
    } catch (error) {
      console.error('executeCommand error:', error)
      return {
        code: 'ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  // 컨테이너 목록 조회
  async getContainers(simulationId: string): Promise<ApiResponse<Container[]>> {
    const response = await this.executeCommand('docker ps -a', simulationId);
    if (response.code === 'SUCCESS' && response.data && response.data.containers) {
      return {
        code: 'SUCCESS',
        message: 'Containers fetched successfully',
        data: response.data.containers,
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to fetch containers from backend.',
        error: response.error,
        data: [],
      };
    }
  }

  // 컨테이너 생성
  async createContainer(
    data: {
      name: string
      image: string
      ports?: string[]
      volumes?: string[]
      network?: string
      environment?: Record<string, string>
    },
    simulationId: string
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

    const response = await this.executeCommand(command, simulationId);

    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      const createdContainer = response.data.containers?.find(c => c.name === data.name);
      return {
        code: 'SUCCESS',
        message: response.message || 'Container created successfully',
        data: createdContainer || { id: 'unknown', name: data.name, image: data.image, status: 'running', ports: [], volumes: [], network: [data.network || 'bridge'], created: new Date() },
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to create container.',
        error: response.error,
      };
    }
  }

  // 컨테이너 시작
  async startContainer(id: string, simulationId: string): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker start ${id}`, simulationId);
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

  // 컨테이너 중지
  async stopContainer(id: string, simulationId: string): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker stop ${id}`, simulationId);
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

  // 컨테이너 삭제
  async deleteContainer(id: string, simulationId: string): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker rm -f ${id}`, simulationId);
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

  // 볼륨 목록 조회
  async getVolumes(simulationId: string): Promise<ApiResponse<Volume[]>> {
    const response = await this.executeCommand('docker volume ls', simulationId);
    if (response.code === 'SUCCESS' && response.data && response.data.volumes) {
      return {
        code: 'SUCCESS',
        message: 'Volumes fetched successfully',
        data: response.data.volumes,
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to fetch volumes from backend.',
        error: response.error,
        data: [],
      };
    }
  }

  // 볼륨 생성
  async createVolume(
    data: {
      name: string
      mountPoint?: string
    },
    simulationId: string
  ): Promise<ApiResponse<Volume>> {
    let command = `docker volume create ${data.name}`;
    const response = await this.executeCommand(command, simulationId);

    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      const createdVolume = response.data.volumes?.find(v => v.name === data.name);
      return {
        code: 'SUCCESS',
        message: response.message || 'Volume created successfully',
        data: createdVolume || { id: data.name, name: data.name, driver: 'local', scope: 'local' as 'local', createdAt: new Date(), mountPath: '', labels: null, options: null, connectedContainers: [] },
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to create volume.',
        error: response.error,
      };
    }
  }

  // 볼륨 삭제
  async deleteVolume(id: string, simulationId: string): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker volume rm ${id}`, simulationId);
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

  // 네트워크 목록 조회
  async getNetworks(simulationId: string): Promise<ApiResponse<Network[]>> {
    const response = await this.executeCommand('docker network ls', simulationId);
    if (response.code === 'SUCCESS' && response.data && response.data.networks) {
      return {
        code: 'SUCCESS',
        message: 'Networks fetched successfully',
        data: response.data.networks,
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to fetch networks from backend.',
        error: response.error,
        data: [],
      };
    }
  }

  // 네트워크 생성
  async createNetwork(
    data: {
      name: string
      driver?: string
      subnet?: string
      gateway?: string
    },
    simulationId: string
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

    const response = await this.executeCommand(command, simulationId);

    if (response.code === 'SUCCESS' && response.data && response.data.success) {
      const createdNetwork = response.data.networks?.find(n => n.name === data.name);
      return {
        code: 'SUCCESS',
        message: response.message || 'Network created successfully',
        data: createdNetwork || { id: 'unknown', name: data.name, driver: data.driver || 'bridge', scope: 'local' as 'local', createdAt: new Date(), containers: [] },
      };
    } else {
      return {
        code: response.code,
        message: response.message || 'Failed to create network.',
        error: response.error,
      };
    }
  }

  // 네트워크 삭제
  async deleteNetwork(id: string, simulationId: string): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker network rm ${id}`, simulationId);
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

  // 컨테이너를 네트워크에 연결
  async connectToNetwork(containerId: string, networkId: string, simulationId: string): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker network connect ${networkId} ${containerId}`, simulationId);
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

  // 컨테이너를 네트워크에서 연결 해제
  async disconnectFromNetwork(containerId: string, networkId: string, simulationId: string): Promise<ApiResponse<void>> {
    const response = await this.executeCommand(`docker network disconnect ${networkId} ${containerId}`, simulationId);
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
    const action = parts.slice(0, 2).join(' ')
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