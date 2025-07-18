import AddBtn from './addBtn';
import DeleteBtn from './deleteBtn';
import StartBtn from './startBtn';
import StopBtn from './stopBtn';
import PauseBtn from './pauseBtn';
import Button from './Button';

// 네트워크 연결 버튼 컴포넌트
const NetworkConnectBtn = ({ onClick, className = '', size = 'md' }: { onClick?: () => void; className?: string; size?: 'sm' | 'md' | 'lg' }) => {
  return (
    <Button 
      onClick={onClick} 
      className={className}
      variant="secondary"
      size={size}
      style={{ borderRadius: '9999px' }}
    >
      <i className="bi bi-link-45deg"></i>
    </Button>
  );
};

export {
  AddBtn,
  DeleteBtn,
  StartBtn,
  StopBtn,
  PauseBtn,
  Button,
  NetworkConnectBtn
}; 