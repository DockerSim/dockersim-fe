import { Post, Comment } from './types';

export const dummyComments: Comment[] = [
  {
    id: 1,
    postId: 1,
    author: 'Docker초보',
    content: '저도 같은 문제로 고생했어요! 컨테이너 로그를 확인해보시는 것을 추천드립니다.',
    createdAt: '2025-05-15T14:30:00Z',
    likes: 3
  },
  {
    id: 2,
    postId: 1,
    author: 'DevOps마스터',
    content: 'docker logs <container_name> 명령어로 확인할 수 있습니다. 포트 바인딩도 다시 확인해보세요.',
    createdAt: '2025-05-15T15:45:00Z',
    likes: 5
  },
  {
    id: 3,
    postId: 2,
    author: '시뮬러',
    content: '정말 유용한 시뮬레이션이네요! 초보자들에게 도움이 많이 될 것 같습니다.',
    createdAt: '2025-05-14T11:20:00Z',
    likes: 8
  },
  {
    id: 4,
    postId: 3,
    author: 'Docker전문가',
    content: 'docker-compose down -v 명령어를 사용하면 볼륨까지 함께 제거됩니다.',
    createdAt: '2025-05-13T16:15:00Z',
    likes: 12
  }
];

export const dummyPosts: Post[] = [
  {
    id: 1,
    title: 'Docker 컨테이너가 시작되지 않아요',
    content: `안녕하세요, Docker 초보입니다.

다음 명령어로 컨테이너를 실행했는데 바로 종료되어버려서 문제를 겪고 있습니다:

\`\`\`bash
docker run -d --name my-app -p 3000:3000 node:18
\`\`\`

어떻게 문제를 해결할 수 있을까요? 로그를 확인하는 방법도 알려주시면 감사하겠습니다.`,
    type: 'question',
    author: 'Docker학습자',
    createdAt: '2025-05-15T10:00:00Z',
    updatedAt: '2025-05-15T10:00:00Z',
    views: 45,
    likes: 7,
    tags: ['docker', '컨테이너', '초보', '문제해결'],
    comments: dummyComments.filter(c => c.postId === 1)
  },
  {
    id: 2,
    title: '[시뮬레이션] 웹 애플리케이션 배포 실습',
    content: `안녕하세요! Docker를 이용한 웹 애플리케이션 배포 시뮬레이션을 공유합니다.

## 시뮬레이션 내용
1. Node.js 애플리케이션 컨테이너화
2. Nginx 리버스 프록시 설정
3. Docker Compose를 이용한 멀티 컨테이너 배포

## 실습 단계

### 1단계: Dockerfile 작성
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### 2단계: docker-compose.yml 작성
\`\`\`yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
\`\`\`

실제로 따라해보시고 질문이 있으시면 댓글 남겨주세요!`,
    type: 'simulation',
    author: 'Docker교육자',
    createdAt: '2025-05-14T09:30:00Z',
    updatedAt: '2025-05-14T09:30:00Z',
    views: 128,
    likes: 23,
    tags: ['시뮬레이션', 'nodejs', 'nginx', 'docker-compose', '배포'],
    comments: dummyComments.filter(c => c.postId === 2)
  },
  {
    id: 3,
    title: 'Docker 볼륨 삭제 방법 문의',
    content: `Docker를 공부하다보니 볼륨이 계속 쌓여서 용량을 많이 차지하고 있습니다.

사용하지 않는 볼륨들을 안전하게 삭제하는 방법이 있을까요?

현재 \`docker volume ls\` 로 확인해보니 20개 이상의 볼륨이 있는데, 어떤 것이 사용중인지 확인하는 방법도 궁금합니다.`,
    type: 'question',
    author: 'Docker정리왕',
    createdAt: '2025-05-13T14:20:00Z',
    updatedAt: '2025-05-13T14:20:00Z',
    views: 67,
    likes: 15,
    tags: ['docker', '볼륨', '정리', '용량관리'],
    comments: dummyComments.filter(c => c.postId === 3)
  },
  {
    id: 4,
    title: '[시뮬레이션] 마이크로서비스 아키텍처 구현',
    content: `Docker를 활용한 마이크로서비스 아키텍처 시뮬레이션입니다.

## 구성 요소
- API Gateway (Express.js)
- 사용자 서비스 (Node.js + MongoDB)
- 주문 서비스 (Python + PostgreSQL)
- Redis 캐시
- Nginx 로드밸런서

## 실습 목표
1. 각 서비스를 개별 컨테이너로 분리
2. 서비스 간 통신 구현
3. 로드밸런싱 설정
4. 모니터링 대시보드 구성

전체 docker-compose 파일과 각 서비스의 Dockerfile을 제공합니다. 

궁금한 점이나 개선 사항이 있으시면 댓글로 알려주세요!`,
    type: 'simulation',
    author: '마이크로서비스전문가',
    createdAt: '2025-05-12T16:45:00Z',
    updatedAt: '2025-05-12T16:45:00Z',
    views: 203,
    likes: 41,
    tags: ['시뮬레이션', '마이크로서비스', 'api-gateway', 'mongodb', 'postgresql', 'redis'],
    comments: []
  },
  {
    id: 5,
    title: 'Docker 네트워크 설정 관련 질문',
    content: `두 개의 컨테이너를 서로 통신하게 하려고 하는데 잘 안되네요.

\`\`\`bash
docker run -d --name db mysql:8.0
docker run -d --name app --link db my-app:latest
\`\`\`

이렇게 실행했는데 app 컨테이너에서 db 컨테이너에 접속이 안됩니다. 
--link 옵션이 deprecated라고 하는데, 최신 방법으로는 어떻게 해야 할까요?`,
    type: 'question',
    author: '네트워크초보',
    createdAt: '2025-05-11T13:10:00Z',
    updatedAt: '2025-05-11T13:10:00Z',
    views: 89,
    likes: 12,
    tags: ['docker', '네트워크', 'mysql', '컨테이너통신'],
    comments: []
  },
  {
    id: 6,
    title: '[시뮬레이션] CI/CD 파이프라인 구축',
    content: `Docker를 활용한 CI/CD 파이프라인 시뮬레이션을 공유합니다.

## 파이프라인 구성
1. GitHub 코드 푸시
2. Jenkins에서 자동 빌드
3. Docker 이미지 생성
4. 테스트 컨테이너 실행
5. Docker Hub에 이미지 푸시
6. 운영 서버에 자동 배포

## 사용 도구
- Jenkins (빌드 서버)
- Docker (컨테이너화)
- Docker Hub (이미지 레지스트리)
- Docker Compose (멀티 컨테이너 관리)

각 단계별로 상세한 설정 방법과 Jenkinsfile, Dockerfile 예제를 포함했습니다.

실제 프로덕션 환경에서 사용할 수 있는 설정들이니 참고해보세요!`,
    type: 'simulation',
    author: 'DevOps엔지니어',
    createdAt: '2025-05-10T11:30:00Z',
    updatedAt: '2025-05-10T11:30:00Z',
    views: 156,
    likes: 38,
    tags: ['시뮬레이션', 'cicd', 'jenkins', 'docker-hub', '자동배포'],
    comments: []
  }
]; 