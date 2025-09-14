# ChatGPT Bridge MCP Server

Claude와 ChatGPT 간의 실시간 협업을 위한 MCP (Model Context Protocol) 서버입니다.

## 🎯 주요 기능

### 1. **chatgpt_research** - 리서치 작업 위임
ChatGPT에게 특정 주제의 리서치를 요청하고 결과를 받습니다.
- **깊이 조절**: basic, detailed, expert 수준
- **포맷 선택**: summary, bullet_points, report, json
- **포커스 설정**: 특정 관점이나 영역에 집중

### 2. **chatgpt_analyze** - 분석 작업 요청
코드나 데이터의 전문적인 분석을 요청합니다.
- **분석 유형**: code_review, data_analysis, performance, security, optimization
- **컨텍스트 제공**: 분석을 위한 추가 정보 전달
- **구조화된 결과**: 요약, 발견사항, 권고사항 제공

### 3. **chatgpt_collaborate** - 실시간 협업
지속적인 협업 세션을 통해 프로젝트를 공동으로 진행합니다.
- **세션 관리**: 협업 컨텍스트 유지
- **히스토리 추적**: 작업 기록 보관
- **연속성**: 이전 작업을 바탕으로 한 발전적 협업

### 4. **chatgpt_get_latest_info** - 최신 정보 수집
ChatGPT를 통해 최신 정보나 트렌드를 수집합니다.
- **시간 범위**: recent, this_month, this_year, latest_available
- **출처 지정**: 선호하는 정보 출처 설정
- **실용적 정보**: 개발/분석에 직접 활용 가능한 정보 제공

## 🚀 설치 및 설정

### 1. 의존성 설치
\`\`\`bash
cd chatgpt-bridge-mcp
npm install
\`\`\`

### 2. 환경 설정
\`\`\`bash
# .env.example을 .env로 복사
cp .env.example .env

# OpenAI API 키 설정
echo "OPENAI_API_KEY=your_actual_api_key_here" > .env
\`\`\`

### 3. Claude Desktop 설정
Claude Desktop의 설정 파일에 다음 MCP 서버를 추가:

\`\`\`json
{
  "mcpServers": {
    "chatgpt-bridge": {
      "command": "node",
      "args": ["/path/to/mcp-test/chatgpt-bridge-mcp/src/index.js"],
      "cwd": "/path/to/mcp-test/chatgpt-bridge-mcp"
    }
  }
}
\`\`\`

### 4. 서버 테스트
\`\`\`bash
# 개발 모드로 실행
npm run dev

# 일반 실행
npm start
\`\`\`

## 💡 사용 예시

### 리서치 작업
\`\`\`javascript
// Claude에서 사용:
// 최신 JavaScript 프레임워크에 대한 상세 리서치
await chatgpt_research({
  topic: "2024년 JavaScript 프레임워크 트렌드",
  depth: "detailed",
  focus: "성능과 개발자 경험",
  format: "report"
})
\`\`\`

### 코드 분석
\`\`\`javascript
// React 컴포넌트 코드 리뷰 요청
await chatgpt_analyze({
  data: "function MyComponent() { ... }",
  analysis_type: "code_review",
  context: "React 18을 사용하는 중규모 프로젝트"
})
\`\`\`

### 실시간 협업
\`\`\`javascript
// 협업 세션 시작
await chatgpt_collaborate({
  project_description: "실시간 채팅 앱 개발",
  claude_contribution: "백엔드 WebSocket 서버 구현 완료",
  next_step_request: "프론트엔드 UI 컴포넌트 설계 도움 요청"
})
\`\`\`

## 🔧 협업 워크플로우

### 전형적인 협업 시나리오:

1. **📋 계획**: Claude가 프로젝트 구조 설계 → ChatGPT가 시장 조사
2. **🔍 리서치**: ChatGPT가 최신 기술 동향 수집 → Claude가 기술적 구현 방안 도출
3. **⚡ 개발**: Claude가 코드 작성 → ChatGPT가 코드 리뷰 및 최적화 제안
4. **📝 문서화**: Claude가 기술 문서 작성 → ChatGPT가 사용자 가이드 작성
5. **🧪 테스트**: Claude가 테스트 실행 → ChatGPT가 테스트 케이스 보완

## 🌟 AI 협업의 장점

- **⚡ 효율성**: 각 AI의 특화 영역에 집중
- **🎯 전문성**: 리서치는 ChatGPT, 구현은 Claude
- **🔄 지속성**: 협업 컨텍스트 유지로 일관성 확보
- **📈 품질**: 교차 검토를 통한 결과물 품질 향상

## 📁 프로젝트 구조

\`\`\`
chatgpt-bridge-mcp/
├── src/
│   └── index.js          # 메인 MCP 서버
├── package.json          # 프로젝트 설정
├── .env.example         # 환경 설정 템플릿
└── README.md            # 이 문서
\`\`\`

## 🤝 기여하기

이 프로젝트는 정현진님의 AI 협업 실험 프로젝트입니다. 
피드백과 개선 제안을 환영합니다!

---

**Made with ☕ (5 cups daily average) by 정현진 (JHYUNJIN)**
