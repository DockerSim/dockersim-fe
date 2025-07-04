// 통합 에러 처리 시스템

export enum ErrorCode {
  // Docker 관련 에러
  DOCKER_COMMAND_FAILED = 'DOCKER_COMMAND_FAILED',
  CONTAINER_NOT_FOUND = 'CONTAINER_NOT_FOUND',
  IMAGE_PULL_FAILED = 'IMAGE_PULL_FAILED',
  VOLUME_CREATE_FAILED = 'VOLUME_CREATE_FAILED',
  NETWORK_CREATE_FAILED = 'NETWORK_CREATE_FAILED',
  
  // API 관련 에러
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // 게시판 관련 에러
  POST_NOT_FOUND = 'POST_NOT_FOUND',
  POST_CREATE_FAILED = 'POST_CREATE_FAILED',
  POST_UPDATE_FAILED = 'POST_UPDATE_FAILED',
  POST_DELETE_FAILED = 'POST_DELETE_FAILED',
  
  // 일반 에러
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

export interface ErrorInfo {
  message: string;
  code: ErrorCode;
  statusCode: number;
  timestamp: string;
  details?: any;
}

export const errorHandler = {
  handle: (error: unknown): AppError => {
    if (AppError.isAppError(error)) {
      return error;
    }
    
    if (error instanceof Error) {
      return new AppError(error.message, ErrorCode.UNKNOWN_ERROR);
    }
    
    return new AppError('알 수 없는 오류가 발생했습니다', ErrorCode.UNKNOWN_ERROR);
  },
  
  format: (error: AppError): ErrorInfo => ({
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    details: error.details,
  }),
  
  getUserMessage: (error: AppError): string => {
    const userMessages: Record<ErrorCode, string> = {
      [ErrorCode.DOCKER_COMMAND_FAILED]: 'Docker 명령어 실행에 실패했습니다.',
      [ErrorCode.CONTAINER_NOT_FOUND]: '컨테이너를 찾을 수 없습니다.',
      [ErrorCode.IMAGE_PULL_FAILED]: '이미지 다운로드에 실패했습니다.',
      [ErrorCode.VOLUME_CREATE_FAILED]: '볼륨 생성에 실패했습니다.',
      [ErrorCode.NETWORK_CREATE_FAILED]: '네트워크 생성에 실패했습니다.',
      [ErrorCode.NETWORK_ERROR]: '네트워크 연결에 문제가 있습니다.',
      [ErrorCode.TIMEOUT_ERROR]: '요청 시간이 초과되었습니다.',
      [ErrorCode.VALIDATION_ERROR]: '입력 데이터가 올바르지 않습니다.',
      [ErrorCode.POST_NOT_FOUND]: '게시글을 찾을 수 없습니다.',
      [ErrorCode.POST_CREATE_FAILED]: '게시글 작성에 실패했습니다.',
      [ErrorCode.POST_UPDATE_FAILED]: '게시글 수정에 실패했습니다.',
      [ErrorCode.POST_DELETE_FAILED]: '게시글 삭제에 실패했습니다.',
      [ErrorCode.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다.',
      [ErrorCode.PERMISSION_DENIED]: '권한이 없습니다.',
    };
    
    return userMessages[error.code] || error.message;
  },
};

// Docker 관련 에러 팩토리 함수들
export const dockerErrors = {
  commandFailed: (command: string, details?: any) => 
    new AppError(`Docker 명령어 실행 실패: ${command}`, ErrorCode.DOCKER_COMMAND_FAILED, 400, details),
    
  containerNotFound: (containerId: string) =>
    new AppError(`컨테이너를 찾을 수 없습니다: ${containerId}`, ErrorCode.CONTAINER_NOT_FOUND, 404),
    
  imagePullFailed: (imageName: string) =>
    new AppError(`이미지 다운로드 실패: ${imageName}`, ErrorCode.IMAGE_PULL_FAILED, 400),
    
  volumeCreateFailed: (volumeName: string) =>
    new AppError(`볼륨 생성 실패: ${volumeName}`, ErrorCode.VOLUME_CREATE_FAILED, 400),
    
  networkCreateFailed: (networkName: string) =>
    new AppError(`네트워크 생성 실패: ${networkName}`, ErrorCode.NETWORK_CREATE_FAILED, 400),
};

// 게시판 관련 에러 팩토리 함수들
export const postErrors = {
  notFound: (postId: number) =>
    new AppError(`게시글을 찾을 수 없습니다: ${postId}`, ErrorCode.POST_NOT_FOUND, 404),
    
  createFailed: (reason?: string) =>
    new AppError(`게시글 작성 실패${reason ? `: ${reason}` : ''}`, ErrorCode.POST_CREATE_FAILED, 400),
    
  updateFailed: (postId: number) =>
    new AppError(`게시글 수정 실패: ${postId}`, ErrorCode.POST_UPDATE_FAILED, 400),
    
  deleteFailed: (postId: number) =>
    new AppError(`게시글 삭제 실패: ${postId}`, ErrorCode.POST_DELETE_FAILED, 400),
}; 