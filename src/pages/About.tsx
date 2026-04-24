import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PrimaryBtn, SecondaryBtn } from "../components/Btn";
import { PixelAnimal } from "../components/PixelAnimal";
import { PixelIcon } from "../components/PixelIcon";
import { bgStyle, C } from "../data/design";
import { TypeId } from "../types";

const HERO_LINEUP: TypeId[] = [1, 5, 9, 3, 7];

const TYPE_SUMMARY: { id: TypeId; name: string; tag: string; color: keyof typeof C }[] = [
  { id: 1, name: "개혁가", tag: "원칙과 기준", color: "yellowA" },
  { id: 2, name: "조력자", tag: "공감과 돌봄", color: "pinkA" },
  { id: 3, name: "성취자", tag: "성과와 실행", color: "peachA" },
  { id: 4, name: "예술가", tag: "개성과 감수성", color: "lavA" },
  { id: 5, name: "탐구자", tag: "지식과 통찰", color: "skyA" },
  { id: 6, name: "충성가", tag: "신뢰와 안정", color: "mintA" },
  { id: 7, name: "열정가", tag: "가능성과 활력", color: "cyanA" },
  { id: 8, name: "도전자", tag: "추진과 보호", color: "redA" },
  { id: 9, name: "평화주의자", tag: "조화와 수용", color: "slateA" },
];

function Section({
  icon,
  iconColor,
  title,
  children,
}: {
  icon: Parameters<typeof PixelIcon>[0]["name"];
  iconColor: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <PixelIcon name={icon} size={16} color={iconColor} />
        <h2 className="text-[15px] font-bold" style={{ color: C.text }}>
          {title}
        </h2>
      </div>
      <div className="text-[13.5px] leading-[1.7]" style={{ color: C.textL }}>
        {children}
      </div>
    </section>
  );
}

export function About() {
  const nav = useNavigate();

  return (
    <div style={bgStyle} className="flex items-center justify-center p-4 sm:p-6 pb-16">
      <Card className="p-6 sm:p-8">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-end gap-1 mb-3">
            {HERO_LINEUP.map((t, i) => (
              <div key={t} style={{ transform: `translateY(${i % 2 === 0 ? 0 : -6}px)` }}>
                <PixelAnimal type={t} size={44} />
              </div>
            ))}
          </div>
          <div
            className="text-[10px] tracking-[0.22em] font-bold mb-1"
            style={{ color: C.primary, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            ABOUT · ANIAGRAM TEAM
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: C.text }}>
            애니어그램, 그게 뭐예요?
          </h1>
          <p className="text-sm" style={{ color: C.textL }}>
            사람의 '속성'을 바라보는 9가지 성격의 지도
          </p>
        </div>

        {/* 프로젝트 소개 */}
        <div
          className="rounded-2xl p-4 mb-6"
          style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <PixelIcon name="rocket" size={14} color={C.primary} accent={C.peachA} />
            <div
              className="text-[10px] tracking-[0.18em] font-bold"
              style={{ color: C.primary, fontFamily: "ui-monospace, Menlo, monospace" }}
            >
              THIS PROJECT
            </div>
          </div>
          <p className="text-[13.5px] leading-[1.7]" style={{ color: C.text }}>
            <span className="font-bold">AniagramTeam</span>은 애니어그램을 IT 제품을 만드는 팀의
            '동물 버전'으로 풀어낸 팀 성향 테스트예요. 직무에 맞춘 12문항을 풀면 9가지 유형 중
            하나가 나오고, 팀원들과 함께 모이면 우리 팀의 케미·성향 분포·페어 궁합·닮은 회사
            스타일까지 한눈에 볼 수 있어요.
          </p>
        </div>

        {/* 애니어그램이란? */}
        <Section icon="brain" iconColor={C.lavA} title="애니어그램이란?">
          <p className="mb-2.5">
            애니어그램(Enneagram)은 고대 지혜 전통과 현대 심리학이 만나 정리된 <b>9가지 성격
            유형</b>의 지도예요. 사람의 행동 방식이 아니라{" "}
            <span style={{ color: C.text }}>'어떤 두려움을 피하고, 어떤 욕망을 향해 움직이는가'</span>
            라는 <b>내면의 동기</b>에 주목해서 유형을 나눠요.
          </p>
          <p>
            각 유형은 원(Ennea=9, gram=도형) 위의 한 점으로 표시되고, 점끼리는 화살표로
            이어져요. 이 화살표는 내가 건강할 때 어떤 방향으로 성장하고, 스트레스 받을 때 어떤
            방향으로 흔들리는지를 알려주는 '성격의 지도'예요.
          </p>
        </Section>

        {/* MBTI와 애니어그램의 차이 */}
        <Section icon="masks" iconColor={C.peachA} title="MBTI와 뭐가 달라요?">
          <p className="mb-2.5">
            MBTI는 상황과 환경에 따라 결과가 바뀌기 쉬워요. 회사에서는 J인데 집에서는 P, 연애할
            땐 F인데 일할 땐 T… 이렇게 <b>겉으로 드러난 선호·행동</b>을 4가지 축으로 나눠 보는
            방식이라, 맥락이 바뀌면 결과도 함께 출렁여요.
          </p>
          <p>
            반면 애니어그램은 <b>사람의 속성 그 자체</b>, 그러니까 '나는 왜 그렇게 반응할
            수밖에 없는가'라는 근본 동기에 초점을 맞춰요. 상황이 달라져도 잘 흔들리지 않는
            대신, 같은 유형 안에서도 건강한 모습과 스트레스 받은 모습이 아주 다르게
            나타난다는 게 특징이에요.
          </p>
        </Section>

        {/* 9가지 유형 요약 */}
        <Section icon="team" iconColor={C.mintA} title="9가지 유형 한눈에">
          <div className="grid grid-cols-1 gap-1.5 mt-1">
            {TYPE_SUMMARY.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg"
                style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
              >
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold"
                  style={{
                    background: C[t.color] as string,
                    color: C.bg1,
                    fontFamily: "ui-monospace, Menlo, monospace",
                  }}
                >
                  {t.id}
                </div>
                <div className="flex-1 flex items-baseline gap-1.5">
                  <span className="text-[13px] font-semibold" style={{ color: C.text }}>
                    {t.name}
                  </span>
                  <span className="text-[11.5px]" style={{ color: C.textL }}>
                    {t.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* 날개 (Wings) */}
        <Section icon="sparkle" iconColor={C.cyanA} title="날개(Wing)는 또 뭐예요?">
          <p className="mb-2.5">
            애니어그램에선 내 주(主) 유형 <b>양옆의 두 유형</b>을 '날개'라고 불러요. 예를 들어 내
            주 유형이 5번이면, 바로 옆 4번과 6번 중 하나가 내 성향에 자연스레 묻어 나와요. 같은
            5번이라도 <span style={{ color: C.text }}>5w4</span>는 더 예술적·감성적이고,{" "}
            <span style={{ color: C.text }}>5w6</span>는 더 체계적·분석적이에요.
          </p>
          <p>
            즉 주 유형이 '큰 틀의 동기'라면, 날개는 그 위에 얹히는 <b>색감과 뉘앙스</b>예요.
            9가지 유형만으로는 다 담기 어려운 개개인의 결을, 날개가 한 겹 더 설명해 주는 셈이죠.
          </p>
        </Section>

        {/* 결과 활용 */}
        <Section icon="chart" iconColor={C.peachA} title="결과를 어떻게 써먹을까?">
          <ul className="space-y-2.5 list-none">
            <li className="flex gap-2">
              <span style={{ color: C.primary }}>•</span>
              <span>
                <b style={{ color: C.text }}>자기 이해:</b> 내가 자꾸 반복하는 패턴과 그 뒤에
                숨은 동기를 짚어봐요. "나는 왜 또 이러고 있지?"에 이름을 붙이는 순간, 선택지가
                늘어나요.
              </span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: C.primary }}>•</span>
              <span>
                <b style={{ color: C.text }}>팀 커뮤니케이션:</b> "나는 2번, 너는 5번"처럼 서로의
                유형을 알면 피드백·회의·협업 방식을 상대에 맞게 조율하기 쉬워져요. 오해를 유형
                차이로 번역할 수 있거든요.
              </span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: C.primary }}>•</span>
              <span>
                <b style={{ color: C.text }}>역할 배분:</b> 팀에 어떤 센터(머리/가슴/장)와
                스타일이 많은지 보고, 비어 있는 자리를 의식적으로 채워요. 전원이 8번인 팀은
                추진력은 좋지만 세심함이 부족할 수 있어요.
              </span>
            </li>
            <li className="flex gap-2">
              <span style={{ color: C.primary }}>•</span>
              <span>
                <b style={{ color: C.text }}>성장 방향:</b> 스트레스 때 무너지는 패턴과 건강할
                때 발휘되는 강점을 알면, 번아웃을 빨리 알아차리고 회복 루틴을 더 쉽게 만들 수
                있어요.
              </span>
            </li>
          </ul>
        </Section>

        {/* 주의 */}
        <div
          className="rounded-xl p-3.5 mb-6 flex gap-2.5"
          style={{ background: C.surfaceHi, border: `1px solid ${C.border}` }}
        >
          <PixelIcon name="warn" size={14} color={C.warning} accent={C.warning} />
          <p className="text-[12.5px] leading-[1.6]" style={{ color: C.textL }}>
            애니어그램은 사람을 칸막이에 가두는 라벨이 아니라, 자신과 팀을 이해하기 위한{" "}
            <span style={{ color: C.text }}>대화의 실마리</span>예요. 결과가 '진단'처럼 느껴지면
            한 걸음 떨어져서 가볍게 읽어주세요.
          </p>
        </div>

        {/* 참고 */}
        <div className="text-center mb-5 text-[11.5px]" style={{ color: C.textLL }}>
          더 깊이 읽고 싶다면{" "}
          <a
            href="https://namu.wiki/w/%EC%97%90%EB%8B%88%EC%96%B4%EA%B7%B8%EB%9E%A8"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: C.primary }}
          >
            나무위키 · 에니어그램
          </a>{" "}
          문서를 참고하세요.
        </div>

        {/* CTA */}
        <div className="space-y-2.5">
          <PrimaryBtn onClick={() => nav("/role")}>
            <span className="inline-flex items-center gap-2">
              <PixelIcon name="sparkle" size={14} color={C.white} />내 유형 찾아보기
            </span>
          </PrimaryBtn>
          <SecondaryBtn onClick={() => nav("/")}>홈으로 돌아가기</SecondaryBtn>
        </div>
      </Card>
    </div>
  );
}
