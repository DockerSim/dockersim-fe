import { useState, useCallback, useRef } from 'react';
import { Image } from '../types';

// 더미 이미지 데이터
const DUMMY_IMAGES: Image[] = [
  {
    id: 'img_nginx_latest',
    name: 'nginx',
    tag: 'latest',
    size: '133MB',
    created: new Date('2024-03-10'),
    isOfficial: true
  },
  {
    id: 'img_node_18',
    name: 'node',
    tag: '18',
    size: '908MB',
    created: new Date('2024-03-08'),
    isOfficial: true
  },
  {
    id: 'img_ubuntu_22_04',
    name: 'ubuntu',
    tag: '22.04',
    size: '77.8MB',
    created: new Date('2024-03-05'),
    isOfficial: true
  },
  {
    id: 'img_mysql_8_0',
    name: 'mysql',
    tag: '8.0',
    size: '447MB',
    created: new Date('2024-03-12'),
    isOfficial: true
  },
  {
    id: 'img_redis_alpine',
    name: 'redis',
    tag: 'alpine',
    size: '32.3MB',
    created: new Date('2024-03-09'),
    isOfficial: true
  }
];

interface UseImageManagementReturn {
  images: Image[];
  isImageBrowserOpen: boolean;
  isImageModalOpen: boolean;
  imageDownloading: string | null;
  isDownloading: boolean;
  downloadProgress: number;
  isDownloadComplete: boolean;
  downloadTimer: any;
  selectedImageTab: 'local' | 'registry';
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setImages: React.Dispatch<React.SetStateAction<Image[]>>;
  setIsImageBrowserOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsImageModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setImageDownloading: React.Dispatch<React.SetStateAction<string | null>>;
  setIsDownloading: React.Dispatch<React.SetStateAction<boolean>>;
  setDownloadProgress: React.Dispatch<React.SetStateAction<number>>;
  setIsDownloadComplete: React.Dispatch<React.SetStateAction<boolean>>;
  setDownloadTimer: React.Dispatch<React.SetStateAction<any>>;
  setSelectedImageTab: React.Dispatch<React.SetStateAction<'local' | 'registry'>>;
  handleImageRepositoryClick: () => void;
  handleLocalImageClick: () => void;
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  addImageFromPull: (imageName: string, tag?: string) => void;
}

export const useImageManagement = (): UseImageManagementReturn => {
  // 더미 데이터로 초기화
  const [images, setImages] = useState<Image[]>(DUMMY_IMAGES);
  const [isImageBrowserOpen, setIsImageBrowserOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageDownloading, setImageDownloading] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);
  const [downloadTimer, setDownloadTimer] = useState<any>(null);
  const [selectedImageTab, setSelectedImageTab] = useState<'local' | 'registry'>('local');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageRepositoryClick = useCallback(() => {
    setSelectedImageTab('registry');
    setIsImageModalOpen(true);
  }, []);

  const handleLocalImageClick = useCallback(() => {
    setSelectedImageTab('local');
    setIsImageModalOpen(true);
  }, []);

  // docker pull로 이미지 추가하는 함수
  const addImageFromPull = useCallback((imageName: string, tag: string = 'latest') => {
    const imageId = `img_${imageName}_${tag}_${Date.now()}`;
    
    // 이미 존재하는지 확인
    const exists = images.some(img => img.name === imageName && img.tag === tag);
    if (exists) {
      return; // 이미 존재하면 추가하지 않음
    }

    const newImage: Image = {
      id: imageId,
      name: imageName,
      tag: tag,
      size: `${Math.floor(Math.random() * 500 + 50)}MB`, // 랜덤 사이즈
      created: new Date(),
      isOfficial: ['nginx', 'node', 'ubuntu', 'mysql', 'redis', 'postgres', 'python', 'alpine'].includes(imageName)
    };

    setImages(prev => [...prev, newImage]);
  }, [images]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Docker 이미지 파일 시뮬레이션
    if (file.name.endsWith('.tar') || file.name.endsWith('.tar.gz')) {
      setIsDownloading(true);
      setDownloadProgress(0);
      setIsDownloadComplete(false);
      
      const imageName = file.name.replace(/\.(tar|tar\.gz)$/, '');
      
      // 다운로드 진행 시뮬레이션
      let progress = 0;
      const timer = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(timer);
          setIsDownloadComplete(true);
          
          // 새 이미지 추가
          const newImage: Image = {
            id: `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name: imageName,
            tag: 'latest',
            size: `${Math.floor(Math.random() * 500 + 50)}MB`,
            created: new Date(),
            isOfficial: false
          };
          
          setImages(prev => [...prev, newImage]);
          
          setTimeout(() => {
            setIsDownloading(false);
            setDownloadProgress(0);
            setIsDownloadComplete(false);
          }, 2000);
        }
        setDownloadProgress(progress);
      }, 200);
      
      setDownloadTimer(timer);
    } else {
      alert('Docker 이미지 파일(.tar, .tar.gz)만 업로드 가능합니다.');
    }
    
    // 파일 입력 초기화
    event.target.value = '';
  }, []);

  return {
    images,
    isImageBrowserOpen,
    isImageModalOpen,
    imageDownloading,
    isDownloading,
    downloadProgress,
    isDownloadComplete,
    downloadTimer,
    selectedImageTab,
    fileInputRef,
    setImages,
    setIsImageBrowserOpen,
    setIsImageModalOpen,
    setImageDownloading,
    setIsDownloading,
    setDownloadProgress,
    setIsDownloadComplete,
    setDownloadTimer,
    setSelectedImageTab,
    handleImageRepositoryClick,
    handleLocalImageClick,
    handleFileUpload,
    addImageFromPull
  };
}; 