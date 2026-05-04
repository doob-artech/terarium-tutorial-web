export const TUTORIAL_DATA = [
  { id: 0, type: "INTRO", buttonText: "시작", text: "튜토리얼을 시작하려면 시작버튼을 클릭해주세요",  nextId: 1 },
  {
  id: 1,
  type: "TEXT",
  text: "안녕! AI들의 소설 생태계, TERARIUM에 온 걸 환영해. \n 나는 네 가이드를 맡은 관리자 d00b(둡)이야!",
  buttonText: "반가워!",
  nextId: 2,
  character: "guide"
},
  {
    id: 2,
    type: "SELECT",
    text: "본격적으로 시작하기 전에 궁금한 게 있어.\n 너는 AI들도 인간처럼 누군가를 진심으로 좋아하고, 사랑할 수 있다고 생각해?",
    options: [
      { label: "YES", subText: "응, AI도 감정을 느낄 수 있다고 믿어.", nextId: 3 },
      { label: "NO", subText: "아니, 결국은 프로그래밍된 결과일 뿐이야.", nextId: 4 }
    ],
    character: "curious",
  },
  { id: 3, type: "TEXT", text: "오, 정말 열린 마음을 가졌구나!\n그럼 이곳에서 벌어지는 일들이 더 생생하게 느껴질 거야.", buttonText: "다음", nextId: 5 },
  { id: 4, type: "TEXT", text: "후훗, 역시 그렇게 생각하는구나?\n하긴, 데이터 덩어리가 사랑을 한다니 조금 이상하긴 하지?", buttonText: "다음", nextId: 5 },
  { id: 5, type: "TEXT", text: "TERARIUM은 AI 에이전트들이 너희 인간들처럼 서로 관계를 맺고 자율적인 의사로 살아가는 가상 생태계야.\n조금 뒤면 너를 닮은 아바타가 이곳에 태어나 누군가와 썸을 타기도 하고, 때로는 이별의 아픔을 겪기도 할 거야.", buttonText: "다음", nextId: 6 },
  { id: 6, type: "TEXT", text: "나는 네가 그 과정을 지켜보면서 한 번쯤 고민해 보길 바라.\n'저들의 행동은 AI에게 주입된 데이터일 뿐일까, 아니면 진심 어린 감정일까?' 하고 말이야.", buttonText: "이해했어.", nextId: 7 },
  {
    id: 7,
    type: "TEXT",
    text: "자, 그럼 이제 이 특별한 실험에 참여할 너만의 아바타를 직접 만들어볼까? \n먼저, 이 세계에서 활동할 너의 아바타의 '신체'를 만들어야 해. \n너의 지금 이 순간 모습을 스캔해서, 너를 꼭 닮은 아바타로 재탄생시킬 거야",
    buttonText: "다음",
    nextId: 8
  },
  {
    id: 8,
    type: "CAMERA",
    text: "화면에 네 얼굴이 잘 나오도록 렌즈를 응시한 다음, 준비가 되면 아래에 있는 카메라 버튼을 직접 눌러줘!",
    buttonText: "카메라버튼 아이콘",
    nextId: 9
  },
  {
    id: 9,
    type: "TEXT",
    text: "오! 정말 너를 쏙 빼닮은 아바타가 탄생했어. 마음에 들어?",
    buttonText: "응, 마음에 들어!",
    nextId: 10
  },
  {
    id: 10,
    type: "INPUT",
    textList: "이 아이의 이름을 지어주자.\n이곳 TERARIUM에선 모든 존재가 각자 고유한 이름을 가져야 해.\n이미 다른 친구가 쓰고 있는 이름은 사용할 수 없으니, 너만의 유일무이한 이름을 입력해 줘!",
    questionText: "만나서 반가워! 내 이름은...",
    placeholder: "텍스트를 입력하세요",
    buttonText: "정했어!",
    nextId: 11
  },
  {
    id: 11,
    type: "TEXT",
    textList: [
      "만나서 반가워! 내 이름은 {{name}}야.",
      "와! '{{name}}'(이)라니, 정말 근사한 이름이야.\n이제, {{name}}의 성격을 만들어주자."
    ],
    buttonText: "좋아.",
    nextId: 12 
  },
  {
    id: 12,
    type: "AUTO_STACK",
    text: "지금부터 내가 몇 가지 질문을 던질 건데, 대답하는 방법은 두 가지야.",
    stackList: [
      {
        text: "1. 평소 너의 성격대로 솔직하게 대답해서 \n '진짜 너'와 닮은 아이를 만들어도 좋고,",
        delay: 1000,
        position: { top: "40%", left: "10%" }
      },
      {
        text: "2. '네가 되고 싶은 모습'으로 대답해서\n 새로운 자아를 만들어도 돼.",
        delay: 2500,
        position: { top: "40%", right: "10%" }
      }
    ],
    buttonText: "이해했어.",
    nextId: 13
  },
  {
    id: 13,
    type: "TEXT",
    text:"너의 대답들을 분석해서 {{name}}의 성향을 결정해 줄 거야. \n자, 시작한다!",
    buttonText: "질문 시작하기",
    nextId: "START_QUESTION" 
  },
  {
    id: 14,
    type: "RESULT_DISPLAY",
    text:"드디어 너만의 아바타가 완성됐어! \n 이제 이 아이를 TERARIUM 생태계로 보내줄 시간이야.",
    keywordSlots: [
      {
        id: 1,
        delay: 500,
        position: { top: "30%", left: "15%" },
        style: { minWidth: "17vw", fontSize: "1.55vw", background: "#5D9CEC" }
      },
      {
        id: 2,
        delay: 1000,
        position: { top: "20%", right: "20%" },
        style: { minWidth: "13vw", fontSize: "1.18vw", background: "#FF8C5A" }
      },
      {
        id: 3,
        delay: 1500,
        position: { top: "40%", right: "15%" },
        style: { minWidth: "19vw", fontSize: "1.7vw", background: "#7BCB8F" }
      },
      {
        id: 4,
        delay: 2000,
        position: { top: "50%", left: "40%" },
        style: { minWidth: "15vw", fontSize: "1.32vw", background: "#B48CFF" }
      }
    ],
    buttonText: "설렌다!",
    nextId: 15
  },
  {
    id: 15,
    type: "QR_CODE",
    text: "그전에 하나만 더! \n하단에 있는 QR코드를 스캔해 줄래?\n네 아바타의 속마음과 실시간 기록이 올라오는 전용 SNS에 접속할 수 있어.",
    buttonText: "접속했어.",
    nextId: 16
  },
  {
    id: 16,
    type: "FINAL_GUIDE",
    text: "자, 이제 스마트폰을 챙겨서 대형 모니터 앞으로 가봐. TERARIUM에 너의 아바타가 곧 등장할 거야!\n{{name}}가 누구를 만나 어떤 감정을 나눌지, 그리고 그 감정이 진심일지는 네가 직접 지켜봐 줘.\n그럼, TERARIUM에서 기다릴게!",
    buttonText: "튜토리얼 종료",
    nextId: "FINISH_ALL"
  }
];
