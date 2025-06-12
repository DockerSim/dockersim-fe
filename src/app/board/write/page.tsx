'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PostType, CreatePostData } from '@/domains/board/types';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* 상단 네비게이션 */}
        <div className="mb-6">
          <Link href="/board" className="text-blue-600 hover:text-blue-800 font-medium">
            ← 게시판으로 돌아가기
          </Link>
        </div>

        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">새 글 작성</h1>
          <p className="text-gray-600 mt-2">질문이나 시뮬레이션을 공유해보세요</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            {/* 게시글 타입 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                게시글 유형
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="question"
                    checked={formData.type === 'question'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PostType }))}
                    className="mr-2"
                  />
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    질문
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="simulation"
                    checked={formData.type === 'simulation'}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as PostType }))}
                    className="mr-2"
                  />
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    시뮬레이션
                  </span>
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {formData.type === 'question' 
                  ? 'Docker 사용 중 궁금한 점이나 문제를 질문해보세요'
                  : 'Docker 실습이나 시뮬레이션 내용을 공유해보세요'
                }
              </p>
            </div>

            {/* 제목 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제목 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* 내용 입력/미리보기 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  내용 *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPreview(false)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      !isPreview 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    편집
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPreview(true)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      isPreview 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                    rows={15}
                    required
                  />
                  <div className="mt-2 text-sm text-gray-500">
                    <p className="mb-1">💡 마크다운 사용법:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span>## 제목 → <strong>제목</strong></span>
                      <span>`코드` → <code className="bg-gray-100 px-1 rounded">코드</code></span>
                      <span>```언어 → 코드블록</span>
                      <span>- 목록 → • 목록</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 min-h-[300px] bg-gray-50">
                  {formData.content ? renderPreview(formData.content) : (
                    <p className="text-gray-500">내용을 입력하면 미리보기가 표시됩니다.</p>
                  )}
                </div>
              )}
            </div>

            {/* 태그 입력 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                태그
              </label>
              <div className="mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="태그를 입력하고 Enter나 쉼표를 누르세요 (최대 10개)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-500 mt-2">
                관련 키워드나 기술 스택을 태그로 추가해주세요
              </p>
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end gap-4">
            <Link
              href="/board"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              취소
            </Link>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              게시글 등록
            </button>
          </div>
        </form>

        {/* 작성 가이드 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">✍️ 작성 가이드</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>질문 작성 시:</strong>
              <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
                <li>구체적인 상황과 오류 메시지를 포함해주세요</li>
                <li>시도해본 방법들을 설명해주세요</li>
                <li>환경 정보(OS, Docker 버전 등)를 제공해주세요</li>
              </ul>
            </div>
            <div>
              <strong>시뮬레이션 공유 시:</strong>
              <ul className="list-disc list-inside mt-1 ml-4 space-y-1">
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