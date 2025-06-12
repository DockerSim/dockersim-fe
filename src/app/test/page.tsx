export default function TestPage() {
  console.log('Test page loaded!');
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>테스트 페이지</h1>
      <p>라우팅이 정상적으로 작동합니다!</p>
      <a href="/board">게시판으로 이동 (a 태그)</a>
    </div>
  );
} 