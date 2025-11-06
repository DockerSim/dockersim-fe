'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation'; // next/navigation에서 useRouter 임포트
import Sidebar from '../../components/Sidebar';
import '../../styles/Settings.css';

// --- 더미 데이터 확장 ---
const dummyPosts = [
  { id: 1, postId: 101, title: 'Dockerfile 최적화 질문입니다.', date: '2023-10-27' },
  { id: 2, postId: 105, title: 'Multi-stage 빌드 관련 팁 공유', date: '2023-10-25' },
  { id: 3, postId: 112, title: 'Docker Compose v2 사용법 아시는 분?', date: '2023-10-22' },
];
const dummyComments = [
  { id: 1, postId: 105, content: '좋은 정보 감사합니다!', postTitle: 'Multi-stage 빌드 관련 팁 공유', date: '2023-10-26' },
  { id: 2, postId: 101, content: '저도 같은 문제가 있었는데, 해결 방법이 궁금하네요.', postTitle: 'Dockerfile 최적화 질문입니다.', date: '2023-10-27' },
];
const dummyLikes = [
  { id: 1, postId: 108, title: 'Docker Compose 사용법', author: 'user123', date: '2023-10-24' },
  { id: 2, postId: 110, title: '초보자를 위한 Docker 기본 개념 정리', author: 'docker_master', date: '2023-10-23' },
];
const dummyWorks = [
  { id: 1, name: 'My Web App', description: 'Nginx + React + Node.js 스택', lastModified: '2023-10-20' },
  { id: 2, name: 'Data Processing Pipeline', description: 'Python과 Redis를 이용한 데이터 처리', lastModified: '2023-10-15' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('community');
  const [activeCommunityTab, setActiveCommunityTab] = useState('my-posts');
  const router = useRouter(); // useRouter 훅 사용

  const handleRowClick = (postId: number) => {
    if (postId) {
      router.push(`/community/${postId}`);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'community':
        return (
          <CommunitySettings 
            activeTab={activeCommunityTab} 
            setActiveTab={setActiveCommunityTab} 
            onRowClick={handleRowClick}
          />
        );
      case 'works':
        return <WorkSettings />;
      default:
        return (
            <CommunitySettings 
              activeTab={activeCommunityTab} 
              setActiveTab={setActiveCommunityTab} 
              onRowClick={handleRowClick}
            />
        );
    }
  };

  return (
    <div className="settings-layout">
      <div className="settings-main-content">
        <h1 className="settings-main-title">👤 내 정보</h1>
        <div className="settings-container">
          <div className="settings-menu">
            <button className={activeTab === 'community' ? 'active' : ''} onClick={() => setActiveTab('community')}>커뮤니티</button>
            <button className={activeTab === 'works' ? 'active' : ''} onClick={() => setActiveTab('works')}>작업</button>
          </div>
          <div className="settings-content-area">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

// 각 섹션 컴포넌트
const CommunitySettings = ({ activeTab, setActiveTab, onRowClick }: { activeTab: string, setActiveTab: (tab: string) => void, onRowClick: (postId: number) => void }) => (
  <div>
    <h2>커뮤니티 활동</h2>
    <div className="community-tabs">
      <button className={activeTab === 'my-posts' ? 'active' : ''} onClick={() => setActiveTab('my-posts')}>내가 작성한 글</button>
      <button className={activeTab === 'my-comments' ? 'active' : ''} onClick={() => setActiveTab('my-comments')}>댓글</button>
      <button className={activeTab === 'my-likes' ? 'active' : ''} onClick={() => setActiveTab('my-likes')}>공감</button>
    </div>
    <div className="community-content">
      {activeTab === 'my-posts' && <DataTable data={dummyPosts} headers={['제목', '작성일']} onRowClick={onRowClick} />} 
      {activeTab === 'my-comments' && <DataTable data={dummyComments} headers={['내용', '원문', '작성일']} onRowClick={onRowClick} />}
      {activeTab === 'my-likes' && <DataTable data={dummyLikes} headers={['제목', '작성자', '공감한 날짜']} onRowClick={onRowClick} />}
    </div>
  </div>
);

const WorkSettings = () => (
  <div>
    <h2>저장된 작업</h2>
    <DataTable data={dummyWorks} headers={['작업 이름', '설명', '최근 수정일']} />
  </div>
);

const DataTable = ({ data, headers, onRowClick }: { data: any[], headers: string[], onRowClick?: (postId: number) => void }) => (
  <table className="data-table">
    <thead>
      <tr>
        {headers.map(h => <th key={h}>{h}</th>)}
      </tr>
    </thead>
    <tbody>
      {data.map(item => (
        <tr key={item.id} onClick={() => onRowClick && item.postId && onRowClick(item.postId)} className={onRowClick && item.postId ? 'clickable' : ''}>
          {Object.keys(item).filter(key => key !== 'id' && key !== 'postId').map(key => <td key={key}>{item[key]}</td>)}
        </tr>
      ))}
    </tbody>
  </table>
);