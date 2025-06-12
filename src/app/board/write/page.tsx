'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PostType, CreatePostData } from '@/domains/board/types';
import Header from '@/components/common/Header';

export default function WritePostPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    content: '',
    type: 'question',
    tags: []
  });
  const [tagInput, setTagInput] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    // 실제로는 API 호출을 통해 게시글을 저장
    console.log('새 게시글:', formData);
    alert('게시글이 등록되었습니다!');
    router.push('/board');
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag && !formData.tags.includes(newTag) && formData.tags.length < 10) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const renderPreview = (content: string) => {
    // 간단한 마크다운 렌더링
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeLines: string[] = [];
    let language = '';

    lines.forEach((line, index) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // 코드 블록 종료
          elements.push(
            <div key={`code-${index}`} className="my-4">
              <div className="bg-gray-800 text-gray-200 rounded-t-lg px-4 py-2 text-sm font-mono">
                {language || 'code'}
              </div>
              <pre className="bg-gray-900 text-gray-200 p-4 rounded-b-lg overflow-x-auto">
                <code>{codeLines.join('\n')}</code>
              </pre>
            </div>
          );
          codeLines = [];
          inCodeBlock = false;
          language = '';
        } else {
          // 코드 블록 시작
          language = line.substring(3);
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        codeLines.push(line);
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">
            {line.substring(3)}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-lg font-semibold text-gray-900 mt-4 mb-2">
            {line.substring(4)}
          </h3>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <li key={index} className="ml-4 mb-1">
            {line.substring(2)}
          </li>
        );
      } else if (line.match(/^\d+\. /)) {
        const match = line.match(/^(\d+)\. (.*)$/);
        if (match) {
          elements.push(
            <li key={index} className="ml-4 mb-1 list-decimal">
              {match[2]}
            </li>
          );
        }
      } else if (line.includes('`') && !line.startsWith('```')) {
        // 인라인 코드
        const parts = line.split('`');
        const rendered = parts.map((part, i) => 
          i % 2 === 1 ? (
            <code key={i} className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">
              {part}
            </code>
          ) : part
        );
        elements.push(
          <p key={index} className="mb-3 leading-relaxed">
            {rendered}
          </p>
        );
      } else if (line.trim()) {
        elements.push(
          <p key={index} className="mb-3 leading-relaxed">
            {line}
          </p>
        );
      } else {
        elements.push(<br key={index} />);
      }
    });

    return <div className="prose max-w-none">{elements}</div>;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Header />
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        {/* 상단 네비게이션 */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link 
            href="/board" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#228be6',
              fontWeight: '500',
              textDecoration: 'none'
            }}
          >
            <span>←</span>
            <span>게시판으로 돌아가기</span>
          </Link>
        </div>

        {/* 헤더 */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ 
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#333',
            margin: '0 0 0.5rem 0'
          }}>
            새 글 작성
          </h1>
          <p style={{ 
            color: '#666',
            fontSize: '1rem',
            margin: 0
          }}>
            질문이나 시뮬레이션을 공유해보세요
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            {/* 게시글 타입 선택 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#333',
                marginBottom: '0.75rem'
              }}>
                게시글 유형
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="type"
                    value="question"
                    checked={formData.type === 'question'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PostType }))}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{
                    padding: '0.35rem 1rem',
                    backgroundColor: '#e7f5ff',
                    color: '#1971c2',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    질문
                  </span>
                </label>
                <label style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="type"
                    value="simulation"
                    checked={formData.type === 'simulation'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PostType }))}
                    style={{ marginRight: '0.5rem' }}
                  />
                  <span style={{
                    padding: '0.35rem 1rem',
                    backgroundColor: '#ebfbee',
                    color: '#2b8a3e',
                    borderRadius: '20px',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}>
                    시뮬레이션
                  </span>
                </label>
              </div>
              <p style={{ 
                fontSize: '0.875rem',
                color: '#6c757d',
                marginTop: '0.5rem'
              }}>
                {formData.type === 'question' 
                  ? 'Docker 사용 중 궁금한 점이나 문제를 질문해보세요'
                  : 'Docker 실습이나 시뮬레이션 내용을 공유해보세요'
                }
              </p>
            </div>

            {/* 제목 입력 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#333',
                marginBottom: '0.5rem'
              }}>
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="제목을 입력하세요"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  fontSize: '1rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  outline: 'none'
                }}
                required
              />
            </div>

            {/* 내용 입력/미리보기 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem'
              }}>
                <label style={{ 
                  fontSize: '1rem',
                  fontWeight: '500',
                  color: '#333'
                }}>
                  내용 *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsPreview(false)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: !isPreview ? '#e7f5ff' : '#f1f3f5',
                      color: !isPreview ? '#1971c2' : '#495057',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    편집
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreview(true)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      backgroundColor: isPreview ? '#e7f5ff' : '#f1f3f5',
                      color: isPreview ? '#1971c2' : '#495057',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    미리보기
                  </button>
                </div>
              </div>

              {!isPreview ? (
                <>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="내용을 입력하세요. 마크다운 문법을 지원합니다."
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1rem',
                      fontFamily: 'monospace',
                      border: '1px solid #dee2e6',
                      borderRadius: '8px',
                      minHeight: '300px',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                    required
                  />
                  <div style={{ 
                    marginTop: '0.75rem',
                    fontSize: '0.875rem',
                    color: '#6c757d'
                  }}>
                    <p style={{ margin: '0 0 0.5rem 0' }}>💡 마크다운 사용법:</p>
                    <div style={{ 
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '0.5rem',
                      fontSize: '0.75rem'
                    }}>
                      <span>## 제목 → <strong>제목</strong></span>
                      <span>`코드` → <code style={{ 
                        backgroundColor: '#f1f3f5',
                        padding: '0.125rem 0.25rem',
                        borderRadius: '4px',
                        fontFamily: 'monospace'
                      }}>코드</code></span>
                      <span>```언어 → 코드블록</span>
                      <span>- 목록 → • 목록</span>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ 
                  border: '1px solid #dee2e6',
                  borderRadius: '8px',
                  padding: '1rem',
                  minHeight: '300px',
                  backgroundColor: '#f8f9fa',
                  overflow: 'auto'
                }}>
                  {formData.content ? renderPreview(formData.content) : (
                    <p style={{ color: '#6c757d' }}>내용을 입력하면 미리보기가 표시됩니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 태그 입력 */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ 
                display: 'block',
                fontSize: '1rem',
                fontWeight: '500',
                color: '#333',
                marginBottom: '0.5rem'
              }}>
                태그
              </label>
              <div style={{ marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="태그를 입력하고 Enter나 쉼표를 누르세요 (최대 10개)"
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    fontSize: '1rem',
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    outline: 'none'
                  }}
                />
              </div>
              {formData.tags.length > 0 && (
                <div style={{ 
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.75rem'
                }}>
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.35rem 0.75rem',
                        backgroundColor: '#e7f5ff',
                        color: '#1971c2',
                        borderRadius: '20px',
                        fontSize: '0.875rem'
                      }}
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        style={{
                          marginLeft: '0.35rem',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#1971c2',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          padding: 0
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p style={{ 
                fontSize: '0.875rem',
                color: '#6c757d',
                margin: 0
              }}>
                관련 키워드나 기술 스택을 태그로 추가해주세요
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ 
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <Link
              href="/board"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.5rem',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#495057',
                fontWeight: '500',
                textDecoration: 'none',
                fontSize: '1rem'
              }}
            >
              취소
            </Link>
            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#228be6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              게시글 등록
            </button>
          </div>
        </form>

        {/* 작성 가이드 */}
        <div style={{
          backgroundColor: '#e7f5ff',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ 
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1971c2',
            marginBottom: '1rem'
          }}>
            ✍️ 작성 가이드
          </h3>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            fontSize: '0.9rem',
            color: '#1864ab'
          }}>
            <div>
              <strong>질문 작성 시:</strong>
              <ul style={{ 
                listStyleType: 'disc',
                margin: '0.5rem 0 0 1.25rem',
                padding: 0,
                lineHeight: '1.5'
              }}>
                <li>구체적인 상황과 오류 메시지를 포함해주세요</li>
                <li>시도해본 방법들을 설명해주세요</li>
                <li>환경 정보(OS, Docker 버전 등)를 제공해주세요</li>
              </ul>
            </div>
            <div>
              <strong>시뮬레이션 공유 시:</strong>
              <ul style={{ 
                listStyleType: 'disc',
                margin: '0.5rem 0 0 1.25rem',
                padding: 0,
                lineHeight: '1.5'
              }}>
                <li>실습 목표와 학습 포인트를 명시해주세요</li>
                <li>단계별 진행 과정을 상세히 설명해주세요</li>
                <li>필요한 파일이나 설정 정보를 포함해주세요</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}