'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { simulationApi } from '@/api/simulation';
import { communityApi, PostResponse } from '@/api/community';
import { Simulation } from '@/types/simulation';
import '../../styles/Settings.css';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('community');
  const [activeCommunityTab, setActiveCommunityTab] = useState('my-posts');
  const router = useRouter();

  const handleCommunityRowClick = (postId: number) => {
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
            onRowClick={handleCommunityRowClick}
          />
        );
      case 'works':
        return <WorkSettings />;
      default:
        return (
            <CommunitySettings
              activeTab={activeCommunityTab}
              setActiveTab={setActiveCommunityTab}
              onRowClick={handleCommunityRowClick}
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

// 커뮤니티 활동 섹션
const CommunitySettings = ({ activeTab, setActiveTab, onRowClick }: { activeTab: string, setActiveTab: (tab: string) => void, onRowClick: (postId: number) => void }) => {
  const [myPosts, setMyPosts] = useState<PostResponse[]>([]);
  const [likedPosts, setLikedPosts] = useState<PostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (activeTab === 'my-posts') {
          const result = await communityApi.getMyPosts();
          if (result.success) {
            setMyPosts(result.data);
          } else {
            throw new Error(result.errorMessage || '내 게시글을 불러오는데 실패했습니다.');
          }
        } else if (activeTab === 'my-likes') {
          const result = await communityApi.getMyLikedPosts();
          if (result.success) {
            setLikedPosts(result.data);
          } else {
            throw new Error(result.errorMessage || '좋아요한 게시글을 불러오는데 실패했습니다.');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (activeTab === 'my-posts' || activeTab === 'my-likes') {
      fetchData();
    }
  }, [activeTab]);

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>커뮤니티 활동</h2>
      <div className="community-tabs">
        <button className={activeTab === 'my-posts' ? 'active' : ''} onClick={() => setActiveTab('my-posts')}>내가 작성한 글</button>
        <button className={activeTab === 'my-likes' ? 'active' : ''} onClick={() => setActiveTab('my-likes')}>공감</button>
      </div>
      <div className="community-content">
        {activeTab === 'my-posts' && (
          <DataTable
            headers={['제목', '유형', '작성일', '조회수', '좋아요']}
            data={myPosts.map(p => ({
              id: p.id,
              title: p.title,
              type: p.type,
              createdAt: new Date(p.createdAt).toLocaleDateString('ko-KR'),
              views: p.views,
              likesCount: p.likesCount,
              onRowClick: () => onRowClick(p.id)
            }))}
          />
        )}
        {activeTab === 'my-likes' && (
          <DataTable
            headers={['제목', '작성자', '유형', '작성일']}
            data={likedPosts.map(l => ({
              id: l.id,
              title: l.title,
              author: l.author,
              type: l.type,
              createdAt: new Date(l.createdAt).toLocaleDateString('ko-KR'),
              onRowClick: () => onRowClick(l.id)
            }))}
          />
        )}
      </div>
    </div>
  );
};

// 저장된 작업 섹션
const WorkSettings = () => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        setIsLoading(true);
        const mySimulations = await simulationApi.getMySimulations();
        setSimulations(mySimulations);
      } catch (err) {
        setError('작업 목록을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSimulations();
  }, []);

  const handleLoadSimulation = (simulationId: string) => {
    router.push(`/?simulationId=${simulationId}`); // 메인 페이지로 이동하도록 수정
  };

  const handleDeleteSimulation = async (simulationId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 행 클릭 이벤트 전파 방지
    if (confirm('정말로 이 작업을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        try {
            await simulationApi.deleteSimulation(simulationId);
            setSimulations(simulations.filter(s => s.simulationPublicId !== simulationId));
            alert('작업이 삭제되었습니다.');
        } catch (err) {
            alert('작업 삭제에 실패했습니다.');
            console.error(err);
        }
    }
  };

  const tableData = simulations.map(sim => ({
    id: sim.simulationPublicId,
    title: sim.title,
    shareStatus: sim.shareStatus, // shareStatus 필드 추가
    updatedAt: new Date(sim.updatedAt).toLocaleString('ko-KR'),
    actions: (
        <button className="delete-work-btn" onClick={(e) => handleDeleteSimulation(sim.simulationPublicId, e)}>삭제</button>
    ),
    onRowClick: () => handleLoadSimulation(sim.simulationPublicId),
  }));

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>저장된 작업</h2>
      <DataTable headers={['제목', '공유 상태', '최근 수정일', '작업']} data={tableData} /> {}
    </div>
  );
};

// 재사용 가능한 테이블 컴포넌트
const DataTable = ({ headers, data }: { headers: string[], data: any[] }) => (
  <table className="data-table">
    <thead>
      <tr>
        {headers.map(h => <th key={h}>{h}</th>)}
      </tr>
    </thead>
    <tbody>
      {data.length === 0 ? (
        <tr>
          <td colSpan={headers.length} className="no-data">데이터가 없습니다.</td>
        </tr>
      ) : (
        data.map(item => (
          <tr key={item.id} onClick={item.onRowClick} className={item.onRowClick ? 'clickable' : ''}>
            {Object.keys(item).filter(key => key !== 'id' && key !== 'onRowClick').map(key => <td key={key}>{item[key]}</td>)}
          </tr>
        ))
      )}
    </tbody>
  </table>
);