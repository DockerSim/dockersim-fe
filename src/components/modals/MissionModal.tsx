import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './MissionModal.css';

interface MissionModalProps {
  open: boolean;
  onClose: () => void;
}

const missionData = [
  { level: 1, title: "“Hello, Image!”", why: "도커의 모든 시작점은 “이미지”예요. 컨테이너는 이미지를 실행한 결과물이죠.", concept: "컨텍스트(작업 폴더), Dockerfile, 레이어(0B 더미 포함).", check: "“로컬 이미지 목록”, “이미지 상세”, “레이어 내역”에서 새로 생성된 1개가 보이는가.", mistake: "Dockerfile 경로가 학습장에 등록된 컨텍스트가 아닐 때 “파일 없음” 오류.", hints: ["“이미지 목록 보기”로 새 항목이 생겼는지 먼저 확인해요.", "“이미지 레이어 보기”에서 0B 더미 레이어가 있는지 찾아보세요."], done: "로컬 저장소에 새 이미지 1개가 생성되고, 레이어에 0B가 포함되어 있음이 보인다." },
  { level: 2, title: "“태그의 기본값: latest”", why: "태그는 버전·배포 라벨입니다. 아무 태그도 안 쓰면 팀이 혼란스러워져요.", concept: "태그 생략 시 기본값 latest(정책), repo:tag 이름 구성.", check: "“이미지 상세”에서 my-app이 명시적 태그 없이도 기본 태그로 표시되는가.", mistake: "이름만 바꾸고 태그를 안 붙여서 같은 이름의 서로 다른 버전이 섞임.", hints: ["이름만 지정해 만들면 어떤 태그로 표시되는지 “상세 보기”로 확인해요.", "“이미지 목록”에 my-app이 보이면 “상세”에서 태그 필드를 찾아보세요."], done: "my-app이 존재하며 기본 태그가 적용된 상태가 확인된다." },
  { level: 3, title: "“댕글링을 마주하다”", why: "같은 이름·태그로 다시 만들면 예전 게 댕글링(떠다니는 이미지)으로 남습니다. 디스크가 불어나는 주범.", concept: "동일 repo:tag 재생성 → 이전 항목은 참조 끊김(댕글링). 정리는 prune.", check: "“전체 이미지 목록(숨김 포함)”에서 댕글링이 생겼다가 정리 후 사라지는 전후 비교.", mistake: "정리 전에 무엇이 지워질지 요약 안 보고 덜컥 정리.", hints: ["같은 이름·태그로 한 번 더 만들어 보세요(예전 것이 떠다닙니다).", "“전체 목록 보기”로 떠다니는 항목을 보고, 정리 후 다시 목록을 확인해요."], done: "최신만 남고, 이전 동일 태그는 댕글링→정리되어 기록에 전후 변화가 남아 있다." },
  { level: 4, title: "“Pull & 충돌”", why: "원격(허브)과 로컬이 충돌하면 배포 사고가 납니다. 최신만 남기는 습관 필요.", concept: "원격에서 내려받을 때 로컬 같은 이름·다른 식별자는 로컬 기존을 댕글링 전환.", check: "“이미지 목록”에서 최신 식별자가 활성이고, 이전 동명이 댕글링 처리 흔적이 보이는가.", mistake: "최신 여부 메시지 무시, 중복 상태 방치.", hints: ["원격에서 같은 이름을 내려받아 충돌을 유도해 보세요.", "충돌 후 “상세/목록/전체 목록”을 차례로 비교해 보세요."], done: "최신만 활성이고, 기존 동명은 댕글링 처리된 기록이 있다." },
  { level: 5, title: "“컨테이너 라이프사이클”", why: "실무 대부분은 “만들고→돌리고→멈추고→다시 돌리고→지우기”의 반복.", concept: "상태 전이(Created/Running/Paused/Exited). 이름 붙이기.", check: "“컨테이너 목록/상세” 타임라인에 상태 변화가 순서대로 남는가.", mistake: "실행 중인데 삭제를 시도(실패), 이름 충돌.", hints: ["“생성”으로 이름부터 고정하세요.", "실행→일시정지→재개→재시작→중지→삭제 순으로 목록 변화를 관찰해요."], done: "지정 이름의 컨테이너가 순환을 끝내고 목록에서 사라졌다." },
  { level: 6, title: "“run -d & attach”", why: "서버는 보통 백그라운드로 떠 있어요. 잠깐 “붙었다가” 안전하게 빠져나오는 법을 익혀요.", concept: "분리 모드 실행, 접속(안내만), 정상 종료.", check: "“컨테이너 목록”에 실행 상태, 접속 시 안내 메시지, 종료 후 상태.", mistake: "접속 중 강제 종료로 리소스 유실(학습장에선 안내 메시지만).", hints: ["분리 모드로 실행해 두고,", "접속 안내를 본 뒤 정상적으로 중지합니다."], done: "안내가 출력되고, 최종적으로 중지 상태임이 확인된다." },
  { level: 7, title: "“cp로 파일 반입/반출”", why: "테스트 자산을 ‘넣고/빼고’ 하는 과정은 잦습니다. 여기선 메타만 기록합니다.", concept: "A(추가)/C(변경)/D(삭제) 형태의 변경 이력(내용 저장 X).", check: "“컨테이너 파일 변경 이력”에 외부↔컨테이너 양방향 기록 존재.", mistake: "실제 파일 내용이 반영되는 것으로 오해.", hints: ["외부→컨테이너로 파일 하나 넣어 보세요(A).", "수정 후 다시 반입(C)하거나, 반출/삭제(D)로 이력을 남겨 보세요."], done: "A/C/D 메타가 남고, 내용은 저장되지 않는다." },
  { level: 8, title: "“이미지 정비: inspect / history / prune”", why: "배포 전/후에는 메타 확인 → 안전 정리가 기본 루틴입니다.", concept: "상세/레이어/정리 3종 점검.", check: "선택 이미지의 이름/식별자/태그/위치와 레이어가 보이고, 정리 전후 차이가 기록됨.", mistake: "정리 범위(특히 전체 정리)를 확인하지 않고 실행.", hints: ["상세→레이어 순으로 먼저 “읽기”.", "정리 전 요약을 확인한 뒤 정리하고, 전후를 다시 비교."], done: "정보 확인 기록과 정리 전후 변화가 모두 남아 있다." },
  { level: 9, title: "“볼륨의 기초”", why: "컨테이너를 지워도 데이터는 살아야 해요.", concept: "명명/익명 볼륨, 참조수, 마운트 경로 개념.", check: "“볼륨 목록/상세”에서 생성/참조 상태, 컨테이너 삭제 후에도 볼륨이 남는지.", mistake: "사용 중 볼륨 삭제 시도(실패), 볼륨이 아닌 컨테이너 내부에 저장.", hints: ["볼륨을 만들고 컨테이너와 연결해 보세요.", "컨테이너를 지운 뒤에도 볼륨이 남는지 확인하세요."], done: "볼륨이 남고, 재실행 시 데이터 지속성이 확인된다." },
  { level: 10, title: "“네트워크를 엮다”", why: "실무에선 서비스끼리 섞이지 않게 망을 분리합니다.", concept: "사용자 네트워크, 연결/해제, 연결 목록.", check: "“네트워크 상세”에서 컨테이너 2개가 연결→1개 해제로 리스트가 변하는가.", mistake: "연결된 상태에서 삭제 시도(거부), 이름 중복 네트워크 생성.", hints: ["사용자 네트워크를 만들고 두 컨테이너를 연결.", "하나를 해제하고 연결 목록 변화를 확인."], done: "연결/해제 이력이 정확히 반영된다." },
  { level: 11, title: "“Push의 문지기(네임스페이스 규칙)”", why: "조직 레지스트리 규칙을 어기면 배포 파이프라인이 막혀요.", concept: "사용자 네임스페이스 검증(닉네임 일치), 단일/전체 태그 업로드, 원격의 동일 태그 전환(댕글링).", check: "업로드 성공 로그, 검증 통과, 필요한 경우 전환 안내.", mistake: "네임스페이스 불일치, 태그 생략으로 의도치 않은 latest 업로드.", hints: ["시작 상태에 네임스페이스가 포함된 이미지가 준비되어 있어요(또는 처음부터 그렇게 만드세요).", "단일 태그 또는 전체 태그 업로드 후 결과 로그를 확인하세요."], done: "네임스페이스 검증을 통과해 업로드되었고, 전환 안내(필요 시)가 남아 있다." },
  { level: 12, title: "“한 방에 정리: prune 3종”", why: "실험 끝에는 깨끗이 정리하는 습관이 필요합니다.", concept: "비참조 이미지/볼륨/네트워크 정리 정책과 제약.", check: "정리 전 요약 → 정리 결과 → 전후 비교.", mistake: "참조 중 리소스 제거 시도, 영향 범위 미확인.", hints: ["먼저 각 범주의 “목록/상세”로 참조 여부를 파악해요.", "정리 전 요약을 확인한 뒤 실행하고, 전후를 비교하세요."], done: "정책에 맞게 정리되었고 전후 변화가 기록된다." },
  { level: 13, title: "“밤 11시, 이미지가 300MB나 불어났어요”", situation: "급하게 패치한 뒤 이미지가 불필요하게 커졌습니다. 원인을 파악해 최근 빌드 산출물의 레이어 구성과 메타 정보를 살펴보세요.", goal: "최신 이미지의 레이어와 상세 정보를 확인하고, 필요 없는 이미지들을 정리해 깨끗한 상태로 유지하세요.", done: "레이어/상세 정보 확인 기록이 있고, 사용하지 않는 로컬 이미지가 정리된 전후 상태가 보인다." },
  { level: 14, title: "“같은 이름의 이미지가 두 개? 배포 태그가 꼬였어요”", situation: "my-app 최신 버전을 받았는데, 로컬에 같은 이름의 이전 태그가 얽혀 동작이 혼란스럽습니다.", goal: "최신 이미지만 활성 상태로 두고, 이전 동일 repo:tag는 댕글링 처리 후 정리하세요.", done: "최신만 남고, 이전 동일 태그는 댕글링→정리된 상태 변화가 기록에 남아 있다." },
  { level: 15, title: "“롤백이 필요해요 (1.1 → 1.0)”", situation: "1.1 배포 후 장애 발생. 빠르게 이전 버전으로 되돌려야 합니다.", goal: "1.0 이미지를 확보해 컨테이너를 안전하게 이전 상태로 되돌리고, 현재 실행 컨테이너의 상태 전이가 확인되도록 하세요.", done: "목표 버전 컨테이너가 실행 중이고, 이전 버전으로의 전환 타임라인이 보인다." },
  { level: 16, title: "“데이터는 남겨야 한다”", situation: "컨테이너를 지워도 데이터는 유지되어야 합니다(보고서 파일 등).", goal: "데이터를 컨테이너 생애와 분리해 보관하고, 컨테이너 재생성 후에도 동일 데이터가 유지됨을 확인하세요.", done: "컨테이너 삭제 후에도 볼륨이 남아 있고, 재실행 후 데이터 지속성이 확인된다." },
  { level: 17, title: "“테스트 환경을 격리하세요”", situation: "두 개의 서비스를 테스트망으로 격리하려 합니다.", goal: "사용자 네트워크를 만들고 두 컨테이너를 연결한 뒤, 하나를 해제해 연결 목록 변화를 확인하세요.", done: "네트워크 상세에서 연결/해제 이력이 정확히 반영된다." },
  { level: 18, title: "“원격 레지스트리에 올리기 전 체크”", situation: "팀 네임스페이스 규칙을 지켜 이미지를 올려야 합니다. 잘못된 네임스페이스는 거부됩니다.", goal: "올바른 네임스페이스로 이미지를 업로드하고, 필요한 경우 원격의 동일 태그가 전환(댕글링) 되었음을 확인하세요.", done: "업로드 성공 로그와 네임스페이스 검증 통과 기록이 있다." },
  { level: 19, title: "“깨끗한 작업실”", situation: "실험 중에 남은 이미지/볼륨/네트워크가 쌓였습니다.", goal: "정책에 맞게 비참조 리소스만 안전하게 정리하고, 정리 전후 변화를 남기세요.", done: "삭제 대상 요약→정리 결과가 전후 비교로 확인된다." },
  { level: 20, title: "“로그 붙여 보기(attach는 안내만)”", situation: "백그라운드로 돌고 있는 컨테이너에 잠깐 붙어 동작 상태를 확인해야 합니다. 실제 셸은 제공되지 않습니다.", goal: "분리 모드 실행→접속 안내 확인→안전 종료까지 수순을 밟으세요.", done: "분리/종료 안내 메시지가 기록되고, 최종적으로 컨테이너가 중지 상태다." }
];

const MissionModal: React.FC<MissionModalProps> = ({ open, onClose }) => {
  const [selectedLevel, setSelectedLevel] = useState(1);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const currentMission = missionData.find(m => m.level === selectedLevel);

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container">
        <div className="modal-header">
          <div className="modal-title">
            <span className="modal-icon">🏆</span>
            <span>미션</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="mission-modal-content">
          <aside className="mission-toc">
            {missionData.map(mission => (
              <div
                key={mission.level}
                className={`mission-toc-item ${selectedLevel === mission.level ? 'active' : ''} ${mission.level >= 13 ? 'locked' : ''}`}
                onClick={() => setSelectedLevel(mission.level)}
              >
                레벨 {mission.level} — {mission.title}
              </div>
            ))}
          </aside>
          <main className="mission-detail">
            {currentMission && (
              <>
                <h3>레벨 {currentMission.level} — {currentMission.title}</h3>
                
                {currentMission.why && <div className="detail-section"><h4>🤔 왜 배우나?</h4><p>{currentMission.why}</p></div>}
                {currentMission.concept && <div className="detail-section"><h4>💡 개념 포인트</h4><p>{currentMission.concept}</p></div>}
                {currentMission.situation && <div className="detail-section"><h4>😱 상황</h4><p>{currentMission.situation}</p></div>}
                {currentMission.goal && <div className="detail-section"><h4>🎯 목표</h4><p>{currentMission.goal}</p></div>}
                {currentMission.check && <div className="detail-section"><h4>✅ 확인 포인트</h4><p>{currentMission.check}</p></div>}
                {currentMission.mistake && <div className="detail-section"><h4>🚫 자주하는 실수</h4><p>{currentMission.mistake}</p></div>}
                
                {currentMission.hints && (
                  <div className="detail-section">
                    <h4>🤫 힌트</h4>
                    <ul>
                      {currentMission.hints.map((hint, i) => <li key={i}>{hint}</li>)}
                    </ul>
                  </div>
                )}

                {currentMission.done && <div className="detail-section"><h4>🎉 Done</h4><p>{currentMission.done}</p></div>}
              </>
            )}
          </main>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MissionModal;