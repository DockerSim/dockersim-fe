import { useCallback } from 'react';
import { errorHandler, AppError, ErrorInfo } from '../utils/errorHandler';
import { useToast } from './useToast';

export interface UseErrorHandlerReturn {
  handleError: (error: unknown) => ErrorInfo;
  handleErrorSilently: (error: unknown) => ErrorInfo;
  showError: (error: unknown) => void;
}

/**
 * 통합 에러 처리 Hook
 * 
 * 기능:
 * - 에러를 AppError로 변환
 * - 사용자 친화적 메시지로 토스트 표시
 * - 에러 로깅 (개발/프로덕션 환경 구분)
 * - 에러 리포팅 (향후 Sentry 등 연동)
 */
export const useErrorHandler = (): UseErrorHandlerReturn => {
  const { showErrorToast } = useToast();

  const logError = useCallback((errorInfo: ErrorInfo) => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Details');
      console.error('Message:', errorInfo.message);
      console.error('Code:', errorInfo.code);
      console.error('Status:', errorInfo.statusCode);
      console.error('Timestamp:', errorInfo.timestamp);
      if (errorInfo.details) {
        console.error('Details:', errorInfo.details);
      }
      console.groupEnd();
    } else {
      // 프로덕션에서는 에러 리포팅 서비스로 전송
      console.error('[ERROR]', errorInfo);
      // TODO: Sentry나 다른 에러 리포팅 서비스 연동
      // reportError(errorInfo);
    }
  }, []);

  const handleError = useCallback((error: unknown): ErrorInfo => {
    const appError = errorHandler.handle(error);
    const errorInfo = errorHandler.format(appError);
    
    // 에러 로깅
    logError(errorInfo);
    
    // 사용자에게 토스트 표시
    const userMessage = errorHandler.getUserMessage(appError);
    showErrorToast(userMessage);
    
    return errorInfo;
  }, [logError, showErrorToast]);

  const handleErrorSilently = useCallback((error: unknown): ErrorInfo => {
    const appError = errorHandler.handle(error);
    const errorInfo = errorHandler.format(appError);
    
    // 로깅만 하고 사용자에게는 표시하지 않음
    logError(errorInfo);
    
    return errorInfo;
  }, [logError]);

  const showError = useCallback((error: unknown) => {
    const appError = errorHandler.handle(error);
    const userMessage = errorHandler.getUserMessage(appError);
    showErrorToast(userMessage);
  }, [showErrorToast]);

  return {
    handleError,
    handleErrorSilently,
    showError,
  };
}; 