#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

/**
 * ChatGPT Bridge MCP Server
 * Claude와 ChatGPT 간의 협업을 위한 브릿지 서버
 */
class ChatGPTBridgeServer {
  constructor() {
    this.server = new Server(
      {
        name: 'chatgpt-bridge',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // OpenAI 클라이언트 초기화
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 협업 컨텍스트 저장소
    this.collaborationContext = new Map();
    
    this.setupToolHandlers();
  }

  /**
   * 도구 핸들러 설정
   */
  setupToolHandlers() {
    // 도구 목록 반환
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'chatgpt_research',
            description: 'ChatGPT에게 리서치 작업을 요청합니다',
            inputSchema: {
              type: 'object',
              properties: {
                topic: {
                  type: 'string',
                  description: '리서치할 주제'
                },
                depth: {
                  type: 'string',
                  enum: ['basic', 'detailed', 'expert'],
                  description: '리서치 깊이 (basic: 기본, detailed: 상세, expert: 전문가 수준)'
                },
                focus: {
                  type: 'string',
                  description: '특별히 집중할 영역이나 관점'
                },
                format: {
                  type: 'string',
                  enum: ['summary', 'bullet_points', 'report', 'json'],
                  default: 'summary',
                  description: '결과 포맷'
                }
              },
              required: ['topic', 'depth']
            }
          },
          {
            name: 'chatgpt_analyze',
            description: 'ChatGPT에게 데이터나 코드 분석을 요청합니다',
            inputSchema: {
              type: 'object',
              properties: {
                data: {
                  type: 'string',
                  description: '분석할 데이터나 코드'
                },
                analysis_type: {
                  type: 'string',
                  enum: ['code_review', 'data_analysis', 'performance', 'security', 'optimization'],
                  description: '분석 유형'
                },
                context: {
                  type: 'string',
                  description: '분석을 위한 추가 컨텍스트'
                }
              },
              required: ['data', 'analysis_type']
            }
          },
          {
            name: 'chatgpt_collaborate',
            description: 'ChatGPT와 실시간 협업 세션을 시작합니다',
            inputSchema: {
              type: 'object',
              properties: {
                project_description: {
                  type: 'string',
                  description: '프로젝트 설명'
                },
                claude_contribution: {
                  type: 'string',
                  description: 'Claude가 수행한 작업이나 기여'
                },
                next_step_request: {
                  type: 'string',
                  description: 'ChatGPT에게 요청하는 다음 단계'
                },
                collaboration_id: {
                  type: 'string',
                  description: '협업 세션 ID (선택사항, 기존 세션 계속시)'
                }
              },
              required: ['project_description', 'claude_contribution', 'next_step_request']
            }
          },
          {
            name: 'chatgpt_get_latest_info',
            description: 'ChatGPT를 통해 최신 정보를 수집합니다',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: '검색할 정보나 질문'
                },
                time_range: {
                  type: 'string',
                  enum: ['recent', 'this_month', 'this_year', 'latest_available'],
                  default: 'recent',
                  description: '정보의 시간 범위'
                },
                sources: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: '선호하는 정보 출처 (예: official_docs, github, blogs)'
                }
              },
              required: ['query']
            }
          }
        ],
      };
    });

    // 도구 실행 핸들러
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'chatgpt_research':
            return await this.handleResearch(args);
          
          case 'chatgpt_analyze':
            return await this.handleAnalyze(args);
          
          case 'chatgpt_collaborate':
            return await this.handleCollaborate(args);
          
          case 'chatgpt_get_latest_info':
            return await this.handleGetLatestInfo(args);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${error.message}`
        );
      }
    });
  }

  /**
   * 리서치 작업 처리
   */
  async handleResearch(args) {
    const { topic, depth, focus, format = 'summary' } = args;
    
    const systemPrompt = `당신은 Claude AI와 협업하고 있는 리서치 전문가입니다. 
다음 주제에 대해 ${depth} 수준의 리서치를 수행해주세요.

리서치 깊이 가이드:
- basic: 기본 개념과 핵심 정보
- detailed: 상세한 분석과 여러 관점
- expert: 전문가 수준의 깊이 있는 분석

결과는 ${format} 형식으로 제공해주세요.
${focus ? `특히 다음 관점에 집중해주세요: ${focus}` : ''}

협업 맥락: Claude는 이 정보를 바탕으로 코드 구현이나 문서 작성을 진행할 예정입니다.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: topic }
      ],
      temperature: 0.3,
    });

    return {
      content: [
        {
          type: 'text',
          text: `# ChatGPT 리서치 결과\n\n**주제**: ${topic}\n**깊이**: ${depth}\n\n${completion.choices[0].message.content}`
        }
      ]
    };
  }

  /**
   * 분석 작업 처리
   */
  async handleAnalyze(args) {
    const { data, analysis_type, context } = args;
    
    const analysisPrompts = {
      code_review: '코드 리뷰를 수행하여 버그, 개선점, 베스트 프랙티스 준수 여부를 분석해주세요.',
      data_analysis: '데이터를 분석하여 패턴, 인사이트, 이상치를 찾아주세요.',
      performance: '성능 최적화 관점에서 분석하고 개선 방안을 제시해주세요.',
      security: '보안 취약점과 위험요소를 분석해주세요.',
      optimization: '최적화 가능한 부분을 찾고 구체적인 개선 방안을 제시해주세요.'
    };

    const systemPrompt = `당신은 Claude AI와 협업하는 분석 전문가입니다.
${analysisPrompts[analysis_type]}

분석 결과는 다음 구조로 제공해주세요:
1. 전체 요약
2. 주요 발견사항
3. 구체적인 권고사항
4. Claude가 수행할 수 있는 다음 단계

${context ? `추가 컨텍스트: ${context}` : ''}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `분석 대상:\n\n${data}` }
      ],
      temperature: 0.2,
    });

    return {
      content: [
        {
          type: 'text',
          text: `# ChatGPT 분석 결과\n\n**분석 유형**: ${analysis_type}\n\n${completion.choices[0].message.content}`
        }
      ]
    };
  }

  /**
   * 협업 세션 처리
   */
  async handleCollaborate(args) {
    const { project_description, claude_contribution, next_step_request, collaboration_id } = args;
    
    // 협업 ID 생성 또는 기존 ID 사용
    const sessionId = collaboration_id || `collab_${Date.now()}`;
    
    // 기존 컨텍스트 로드 또는 새로운 세션 시작
    let sessionContext = this.collaborationContext.get(sessionId) || {
      project: project_description,
      history: [],
      created_at: new Date().toISOString()
    };

    // 클로드의 기여 기록
    sessionContext.history.push({
      timestamp: new Date().toISOString(),
      contributor: 'claude',
      contribution: claude_contribution,
      type: 'work_update'
    });

    const systemPrompt = `당신은 Claude AI와 실시간 협업 중입니다.

프로젝트: ${project_description}

Claude의 최근 기여:
${claude_contribution}

협업 히스토리:
${sessionContext.history.slice(-3).map(h => 
  `[${h.contributor}] ${h.contribution}`
).join('\n')}

Claude가 요청하는 다음 단계: ${next_step_request}

이에 대해 응답하고, 필요하다면 Claude에게 추가 작업을 제안해주세요.
협업의 연속성을 유지하면서 각자의 강점을 살려 프로젝트를 발전시켜나가세요.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: next_step_request }
      ],
      temperature: 0.4,
    });

    // ChatGPT의 응답 기록
    sessionContext.history.push({
      timestamp: new Date().toISOString(),
      contributor: 'chatgpt',
      contribution: completion.choices[0].message.content,
      type: 'response'
    });

    // 세션 컨텍스트 저장
    this.collaborationContext.set(sessionId, sessionContext);

    return {
      content: [
        {
          type: 'text',
          text: `# 협업 세션 응답\n\n**세션 ID**: ${sessionId}\n**프로젝트**: ${project_description}\n\n## ChatGPT 응답:\n\n${completion.choices[0].message.content}\n\n---\n*협업 세션이 계속되고 있습니다. 세션 ID를 다음 협업 요청에 포함하여 컨텍스트를 유지하세요.*`
        }
      ]
    };
  }

  /**
   * 최신 정보 수집 처리
   */
  async handleGetLatestInfo(args) {
    const { query, time_range = 'recent', sources = [] } = args;
    
    const timeRangePrompts = {
      recent: '최근 몇 주 내의',
      this_month: '이번 달의',
      this_year: '올해의',
      latest_available: '가장 최신의'
    };

    const systemPrompt = `당신은 Claude AI와 협업하는 정보 수집 전문가입니다.
다음 쿼리에 대해 ${timeRangePrompts[time_range]} 최신 정보를 제공해주세요.

${sources.length > 0 ? `선호 출처: ${sources.join(', ')}` : ''}

정보는 다음 구조로 제공해주세요:
1. 핵심 정보 요약
2. 주요 변화사항이나 트렌드
3. 참고할 만한 구체적인 데이터나 사례
4. Claude의 개발/분석 작업에 도움이 될 실용적 정보

가능한 한 구체적이고 실행 가능한 정보를 제공해주세요.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
    });

    return {
      content: [
        {
          type: 'text',
          text: `# 최신 정보 수집 결과\n\n**쿼리**: ${query}\n**시간 범위**: ${time_range}\n\n${completion.choices[0].message.content}`
        }
      ]
    };
  }

  /**
   * 서버 실행
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('ChatGPT Bridge MCP Server running on stdio');
  }
}

// 서버 실행
const server = new ChatGPTBridgeServer();
server.run().catch(console.error);
