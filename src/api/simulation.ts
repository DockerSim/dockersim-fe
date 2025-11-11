import axiosInstance from './axiosInstance';
import { Simulation, Collaborator } from '@/types/simulation';

const API_URL = '/simulations';

// Simulation 생성/수정 시 요청 DTO
interface SimulationRequest {
  title: string;
  dockerState: string; // JSON string
  shareState: 'READ' | 'WRITE' | 'PRIVATE'; // shareStatus -> shareState로 변경
}

// 협업자 초대 시 요청 DTO
interface CollaboratorRequest {
  email: string;
}

export const simulationApi = {
  /**
   * 새로운 시뮬레이션을 생성합니다.
   */
  createSimulation: async (request: SimulationRequest): Promise<Simulation> => {
    const response = await axiosInstance.post(API_URL, request);
    return response.data.data;
  },

  /**
   * 특정 시뮬레이션 정보를 조회합니다.
   */
  getSimulation: async (simulationId: string): Promise<Simulation> => {
    const response = await axiosInstance.get(`${API_URL}/${simulationId}`);
    return response.data.data;
  },

  /**
   * 시뮬레이션 정보를 업데이트합니다.
   */
  updateSimulation: async (simulationId: string, request: SimulationRequest): Promise<Simulation> => {
    const response = await axiosInstance.put(`${API_URL}/${simulationId}`, request);
    return response.data.data;
  },

  /**
   * 시뮬레이션을 삭제합니다.
   */
  deleteSimulation: async (simulationId: string): Promise<void> => {
    await axiosInstance.delete(`${API_URL}/${simulationId}`);
  },
  
  /**
   * 현재 사용자의 모든 시뮬레이션 목록을 가져옵니다.
   */
  getMySimulations: async (): Promise<Simulation[]> => {
    try {
        const response = await axiosInstance.get(`${API_URL}/me`); // '/users/me/simulations' -> '/simulations/me'로 변경
        return response.data.data;
    } catch (error) {
        console.error("getMySimulations API 호출 실패. 임시 데이터를 반환합니다.", error);
        return [];
    }
  },

  /**
   * 시뮬레이션의 협업자 목록을 조회합니다.
   */
  getCollaborators: async (simulationId: string): Promise<Collaborator[]> => {
    const response = await axiosInstance.get(`${API_URL}/${simulationId}/collaborators`);
    return response.data.data;
  },

  /**
   * 시뮬레이션에 협업자를 초대합니다.
   */
  inviteCollaborator: async (simulationId: string, email: string): Promise<Collaborator> => {
    const request: CollaboratorRequest = { email };
    const response = await axiosInstance.post(`${API_URL}/${simulationId}/collaborators`, request);
    return response.data.data;
  },

  /**
   * 시뮬레이션에서 협업자를 제거합니다.
   */
  removeCollaborator: async (simulationId: string, collaboratorId: string): Promise<void> => {
    await axiosInstance.delete(`${API_URL}/${simulationId}/collaborators/${collaboratorId}`);
  },
};
