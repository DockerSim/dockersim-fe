'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import '../../../../styles/CommunityWrite.css'; // 동일한 스타일 사용
import { communityApi } from '@/api/community'; // communityApi 임포트
import { PostType } from '@/app/community/page'; // PostType 임포트

export default function CommunityEditPage() {
  const router = useRouter();
  const params = useParams();
  const postId = parseInt(params.id as string); // postId를 숫자로 파싱

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'QUESTION' as PostType,
    tags: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isNaN(postId)) { // postId가 유효한 숫자인지 확인
      alert('유효하지 않은 게시글 ID입니다.');
      router.push('/community'); // 유효하지 않으면 목록으로 이동
      return;
    }
    const fetchPostData = async () => {
      try {
        const result = await communityApi.getPost(postId); // communityApi.getPost 호출
        if (result.success) {
          const post = result.data;
          setFormData({
            title: post.title,
            content: post.content,
            type: post.type,
            tags: post.tags ? post.tags.replace(/,/g, '#') : '', // API는 쉼표 구분, UI는 # 구분
          });
        } else {
          throw new Error(result.errorMessage || '게시글 정보를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to fetch post:', error);
        alert(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
        router.push(`/community/${postId}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPostData();
  }, [postId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('제목과 내용은 필수 항목입니다.');
      return;
    }
    if (isNaN(postId)) return;

    const postData = {
      title: formData.title,
      content: formData.content,
      type: formData.type,
      tags: formData.tags.split('#').map(tag => tag.trim()).filter(Boolean).join(','),
    };

    try {
      const result = await communityApi.updatePost(postId, postData); // communityApi.updatePost 호출

      if (result.success) {
        alert('게시글이 성공적으로 수정되었습니다!');
        router.push(`/community/${postId}`);
      } else {
        throw new Error(result.errorMessage || '게시글 수정에 실패했습니다.');
      }

    } catch (error) {
      console.error('Post update failed:', error);
      alert(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return <div className="write-container"><span>Loading...</span></div>;
  }

  return (
    <div className="write-container">
      <div className="write-header">
        <h1 className="write-title">게시글 수정</h1>
      </div>

      <form onSubmit={handleSubmit} className="write-form">
        <div className="form-group">
          <label htmlFor="type">카테고리</label>
          <select id="type" name="type" value={formData.type} onChange={handleChange} className="form-select">
            <option value="QUESTION">질문</option>
            <option value="SIMULATION">시뮬레이션</option>
            <option value="TECHNICAL">기술</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="title">제목 <span className="required">*</span></label>
          <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="form-input" placeholder="게시글 제목을 입력하세요" maxLength={100} />
          <div className="char-count">{formData.title.length}/100</div>
        </div>

        <div className="form-group">
          <label htmlFor="content">내용 <span className="required">*</span></label>
          <textarea id="content" name="content" value={formData.content} onChange={handleChange} className="form-textarea" placeholder="게시글 내용을 입력하세요" rows={15} maxLength={5000} />
          <div className="char-count">{formData.content.length}/5000</div>
        </div>

        <div className="form-group">
          <label htmlFor="tags">태그</label>
          <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} className="form-input" placeholder="태그를 #으로 구분하여 입력하세요 (예: docker#ci/cd#쿠버네티스)" />
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleCancel} className="btn-cancel">취소</button>
          <button type="submit" className="btn-submit">수정 완료</button>
        </div>
      </form>
    </div>
  );
}
