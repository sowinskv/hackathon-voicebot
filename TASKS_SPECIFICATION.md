# Next-Generation Call Center - Product Tasks Specification

## Project Overview
Build a complete next-generation call center solution with a voicebot + consultant platform for handling insurance claims (OC damage reporting scenario).

**Technology Requirements:**
- Voice orchestration: **LiveKit** (MANDATORY)
- Web application demo (no telephony integration)
- Allowed: External TTS, STT, LLM services (e.g., ElevenLabs, Whisper, Gemini)
- Not allowed: Full implementation in single external platform
- Make sure the whole system works for both Polish and English
deployable using docker compose
---

## CORE MODULES TO IMPLEMENT

### 1. Voice App (Client Channel) - Web Application
**Priority: CRITICAL**

#### Tasks:
- [ ] Create web application UI with:
  - [ ] Start/Stop session controls
  - [ ] Real-time voice conversation (microphone → STT → bot → TTS → speaker)
  - [ ] Live transcription display (showing what client says + bot responses)
  - [ ] Session status indicator
- [ ] Integrate LiveKit for voice orchestration
- [ ] Implement STT integration (Azure Whisper Diarize)
- [ ] Implement TTS integration (ElevenLabs)
- [ ] Add "Connect to consultant" voice trigger
- [ ] Display escalation status clearly in UI

**Technical Requirements:**
- Framework: React/Vue/Next.js (choose based on team preference)
- LiveKit client SDK integration
- WebRTC support for browser audio
- Real-time UI updates

---

### 2. Voicebot Logic (Conversation Engine)
**Priority: CRITICAL**

#### Tasks:
- [ ] Implement conversation flow for different scenarios including "OC damage reporting" (main scenario)
- [ ] Structure data collection as JSON/form with validation
- [ ] Implement data confirmation mechanism
- [ ] Add conversation context management
- [ ] Implement slot-filling logic with default required fields for "OC damage reporting" (but we can modify this list freely):
  - [ ] Policy number
  - [ ] Incident date and time
  - [ ] Location of incident
  - [ ] Description of damage
  - [ ] Other party information (if applicable)
  - [ ] Witness information (if any)
- [ ] Add an option to allow the call center operator to prompt LLM so that based on described case it proposes a list of fields to use
- [ ] Add completeness checking (ensure all required data collected - at the end of the call go through all required fields and make sure they're completed)
- [ ] Implement conversation state management
- [ ] Add retry logic for unclear responses

**Technical Requirements:**
- Use LiveKit for conversation orchestration
- LLM integration (Gemini 2.5 Flash)
- Structured output parsing
- Session persistence

---

### 3. Escalation to Consultant (Handoff)
**Priority: CRITICAL**

#### Tasks:
- [ ] Detect escalation request in speech ("connect me to consultant" or similar)
- [ ] Create handoff mechanism:
  - [ ] Generate conversation summary
  - [ ] Package complete transcription
  - [ ] Extract all collected data
  - [ ] Mark session as "escalated"
- [ ] Mock consultant number switching (UI indication)
- [ ] Log escalation event with timestamp
- [ ] Transfer context to Agent Console
- [ ] Implement escalation notification system

**Data to Transfer:**
- Conversation summary
- Full transcription
- Structured collected data
- Session metadata (duration, timestamp, client ID)

---

### 4. Bot Builder Platform (No-Code Flow Editor)
**Priority: HIGH**

#### Tasks:
- [ ] Create UI for system prompt editing
  - [ ] Text editor with syntax highlighting
  - [ ] Save/version management
  - [ ] Preview functionality
- [ ] Build no-code flow editor:
  - [ ] Visual flow designer (nodes and connections)
  - [ ] Define conversation states/steps
  - [ ] Configure required slots/fields
  - [ ] Set validation rules
  - [ ] Configure bot behavior per state
- [ ] Implement draft/published version management
- [ ] Add test mode:
  - [ ] Launch test conversation with draft version
  - [ ] Side-by-side comparison with production
  - [ ] Test result logging
- [ ] Create flow templates library
- [ ] Add import/export functionality for flows
- i've added some requirements about configuration of the required data fields to gather during the call in section 2, please apply it here

**UI Components:**
- System prompt editor
- Flow designer canvas
- Slot configuration panel
- Test console
- Version history viewer

---

### 5. Agent Console (Consultant Platform)
**Priority: HIGH**

#### Tasks:
- [ ] Build session/case list view:
  - [ ] Filter by status (in progress/completed + bot/escalated)
  - [ ] Sort by date, priority, status
  - [ ] Search functionality
  - [ ] Status indicators
- [ ] Create session detail view:
  - [ ] Full transcription display AND audio recording
  - [ ] Conversation summary including redirection to the constultant
  - [ ] Collected data fields display
  - [ ] Session metadata
  - [ ] Timeline visualization
- [ ] Add case management features:
  - [ ] Mark case as resolved
  - [ ] Add consultant notes
  - [ ] Update collected information
  - [ ] Re-assign cases
- [ ] Implement real-time updates for new escalations
- [ ] Add notification system for urgent cases

**UI Requirements:**
- Dashboard with key metrics
- Searchable case list
- Detailed case view
- Notes/comments functionality

---

### 6. Observability & Analytics
**Priority: HIGH**

#### Tasks:
- [ ] Implement logging system:
  - [ ] Conversation logs
  - [ ] Session events
  - [ ] Error tracking
  - [ ] Performance metrics
- tags about the call and the customer (e.g. customer satisfied, angry, warns to sue us)
  - generally we would like to closely monitor the customer satisfaction 
  - ask after the call about their satifsaction with a 5-point scale or something 
- [ ] Create metrics dashboard:
  - [ ] Session duration (avg, min, max)
  - [ ] Escalation rate
  - [ ] Field completeness percentage
  - [ ] Success rate (completed vs abandoned)
- [ ] Add cost tracking:
  - [ ] Token usage per session
  - [ ] STT/TTS API calls count
  - [ ] LLM API calls count
  - [ ] Cost estimation per session
- [ ] Implement analytics views:
  - [ ] Daily/weekly/monthly trends
  - [ ] Bot performance over time
  - [ ] Common failure points
  - [ ] User satisfaction indicators

**Metrics to Track:**
- Session count and duration
- Escalation rate and reasons
- Data completeness percentage
- API usage and costs
- Error rates
- Response times

---

## BONUS FEATURES (30 points total)

### A. Fast Deployment (0-10 points)
**Priority: MEDIUM**

#### Tasks:
- [ ] Build module to analyze call center recordings/transcripts:
  - [ ] Upload transcript files
  - [ ] Parse and analyze conversation patterns
  - [ ] Extract common questions and flows
- [ ] Auto-generate system prompt from transcripts:
  - [ ] Identify conversation style
  - [ ] Extract domain knowledge
  - [ ] Generate prompt template
  - audio recordings in wav format
  - user uploads wav files or other audio files of previous conversations and wants to quickly create a good call flow for the voicebot based on that.
- from previous conversations save insights about their flow and propose fixes to current flow to improve itself in a bootstrap manner
- [ ] Auto-generate flow from transcripts:
  - [ ] Identify conversation stages
  - [ ] Extract required data slots
  - [ ] Create flow diagram
  - [ ] Suggest validation rules
- [ ] Create deployment wizard for quick setup

---

### B. Cost Security (Fraud/Abuse Prevention) (0-10 points)
**Priority: MEDIUM**

#### Tasks:
- [ ] Implement conversation time limits:
  - [ ] Set max session duration (configurable)
  - [ ] Warning before timeout
  - [ ] Graceful session termination
- [ ] Add attempt limits:
  - [ ] Max retries per field
  - [ ] Max sessions per user/day
  - [ ] Rate limiting
- [ ] Implement escalation limits:
  - [ ] Max escalations per user
  - [ ] Cooldown period
  - [ ] Abuse detection
- [ ] Detect conversation loops:
  - [ ] Identify repeated questions
  - [ ] Detect stuck states
  - [ ] Auto-recovery or termination
- [ ] Handle silent sessions:
  - [ ] Detect no audio input
  - [ ] Timeout after silence
  - [ ] Send prompts for engagement
- [ ] Add emergency session termination
- [ ] Create fraud detection dashboard
- 10min max call lenght and 3 retries max

---

### C. Content Security (Prompt Attacks, Profanity, Off-Topic) (0-5 points)
**Priority: MEDIUM**

#### Tasks:
- [ ] Implement guardrails system:
  - [ ] Profanity filter
  - [ ] Off-topic detection
  - [ ] Prompt injection detection
  - [ ] Jailbreak attempt detection
- [ ] Add refusal and redirect logic:
  - [ ] Polite refusal responses
  - [ ] Redirect to appropriate topic
  - [ ] Escalation trigger for abuse
- [ ] Implement tool permission controls:
  - [ ] Whitelist allowed functions
  - [ ] Restrict sensitive operations
  - [ ] Audit tool usage
- [ ] Add safety fallback mode:
  - [ ] Switch to conservative responses
  - [ ] Limited functionality mode
  - [ ] Alert human moderator
- [ ] Create content moderation dashboard
- for all abuse/flirty/offtopic situations warn user 3 times, then terminate the call and add apropriate tags to the transcript.

---

### D. Data Stability (Information Completeness) (0-5 points)
**Priority: MEDIUM**

#### Tasks:
- [ ] Implement field validation:
  - [ ] Type checking (date, number, text)
  - [ ] Format validation (phone, email, policy number)
  - [ ] Range validation (dates in past, etc.)
  - [ ] Required field enforcement
  - add this to the cretor of the required fields
- [ ] Add critical information confirmation:
  - [ ] Read-back mechanism for key data
  - [ ] Explicit user confirmation
  - [ ] Multiple confirmation for sensitive data
- [ ] Create conversation test suite:
  - [ ] Predefine test scenarios
  - [ ] Automated test execution
  - [ ] Coverage report (which slots collected)
  - [ ] Success rate tracking
- [ ] Implement "Quality Gate":
  - [ ] Check completeness before ending
  - [ ] Prompt for missing required fields
  - [ ] Verify critical data
  - [ ] Block incomplete submissions
- remind user at the end of the call of next steps they have to take after 

---

## DELIVERABLES

### 1. Live Demo (CRITICAL)
**Priority: CRITICAL**

- [ ] Prepare demo scenario script
- [ ] Test end-to-end flow before presentation
- [ ] Demonstrate:
  - [ ] Voice conversation with bot
  - [ ] Data collection process
  - [ ] Escalation to consultant
  - [ ] Consultant viewing context
  - [ ] Case completion
- [ ] Prepare backup demo (recording if live fails)

---

### 2. Repository & Documentation
**Priority: CRITICAL**

#### Tasks:
- [ ] Create comprehensive README.md:
  - [ ] Project description
  - [ ] Architecture overview
  - [ ] Prerequisites
  - [ ] Local setup instructions
  - [ ] Environment variables explanation
  - [ ] How to run (step by step)
  - [ ] How to test
  - [ ] Troubleshooting guide
- [ ] Create .env.example (WITHOUT secrets)
- [ ] Document API endpoints
- [ ] Add code comments for complex logic
- [ ] Create deployment guide
- [ ] Add architecture diagram

---

### 3. Technical Specification Document
**Priority: HIGH**

#### Tasks:
- [ ] Write architecture description:
  - [ ] System components diagram
  - [ ] Technology stack
  - [ ] Data flow
  - [ ] Integration points
- [ ] Document security measures:
  - [ ] Cost security mechanisms
  - [ ] Content safety guardrails
  - [ ] Data protection
  - [ ] Authentication/authorization
- [ ] Explain flow/prompt editing:
  - [ ] How system prompt works
  - [ ] Flow editor capabilities
  - [ ] Update process
  - [ ] Testing workflow
- [ ] List limitations and risks:
  - [ ] Known issues
  - [ ] Technical debt
  - [ ] Scalability concerns
  - [ ] Security considerations
- [ ] Create development roadmap:
  - [ ] Phase 1 (MVP)
  - [ ] Phase 2 (enhancements)
  - [ ] Phase 3 (scaling)
  - [ ] Future features

---

### 4. Presentation (15 minutes)
**Priority: CRITICAL**

#### Tasks:
- [ ] Create presentation slides (minimal):
  - [ ] Problem statement
  - [ ] Solution overview
  - [ ] Key features highlights
  - [ ] Innovation points
  - [ ] Technical approach
- [ ] Prepare LIVE DEMO walkthrough
- [ ] Document team contributions:
  - [ ] Role division
  - [ ] Individual achievements
  - [ ] Collaboration highlights
- [ ] Prepare "challenges faced" section
- [ ] Prepare "what we're most proud of" section
- [ ] Rehearse presentation timing
- [ ] Prepare Q&A answers

---

## DEVELOPMENT PRIORITIES

### Phase 1: Core MVP (Days 1-2)
1. Basic web voice app with LiveKit
2. Simple voicebot with hardcoded flow
3. Basic transcription display
4. Simple escalation mechanism
5. Basic agent console

### Phase 2: Platform Features (Days 2-3)
1. Bot builder UI
2. Flow editor
3. Enhanced agent console
4. Observability dashboard

### Phase 3: Bonus Features (Days 3-4)
1. Cost security measures
2. Content security guardrails
3. Auto-generation from transcripts
4. Data validation and quality gates

### Phase 4: Polish & Demo (Day 4-5)
1. Testing and bug fixes
2. Documentation
3. Presentation preparation
4. Demo rehearsal

---

## TECHNICAL ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                        │
│  ┌──────────────┐         ┌─────────────────────────┐  │
│  │  Voice App   │         │   Bot Builder UI        │  │
│  │  (Web UI)    │         │   (Admin Panel)         │  │
│  └──────────────┘         └─────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Agent Console (Consultant Panel)         │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   ORCHESTRATION LAYER                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │              LiveKit                             │  │
│  │         (Voice Orchestration Engine)             │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION LAYER                      │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Voicebot  │  │   Flow     │  │   Escalation     │  │
│  │   Logic    │  │  Engine    │  │   Manager        │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │   Safety   │  │  Session   │  │   Analytics      │  │
│  │ Guardrails │  │  Manager   │  │   & Metrics      │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   INTEGRATION LAYER                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   STT    │  │   TTS    │  │   LLM    │              │
│  │ (Whisper)│  │(ElevenLab│  │ (Gemini) │              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      DATA LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────┐  │
│  │  Sessions  │  │   Flows    │  │   Transcripts    │  │
│  │    DB      │  │    DB      │  │       DB         │  │
│  └────────────┘  └────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## EVALUATION CRITERIA

### Main Criteria (90 points)
- **Completeness (40 points)**: End-to-end system with all core components
- **Innovation (30 points)**: Creative features addressing real risks
- **Presentation (20 points)**: Demo quality, clarity, argumentation

### Bonus Points (30 points)
- **Fast deployment (10 points)**: Auto-generation from transcripts
- **Cost security (10 points)**: Fraud prevention mechanisms
- **Attack resistance (5 points)**: Safety guardrails
- **Data stability (5 points)**: Completeness assurance

---

## AVAILABLE RESOURCES

### Existing Components (for inspiration or reuse)
1. **ElevenLabs Voicebot**: System prompt reference
2. **FastVoicebotWebhooks**: Azure tools for bot
3. **voicebot_tester**: Automated testing/attack module
4. **FastObservability**: Observability module
5. **voicebotpanel**: Admin panel
6. **claimwizard**: Agent testing platform

### API Keys (configured in .env)
- ElevenLabs API
- Gemini 2.5 Flash
- Azure OpenAI Whisper Diarize

### Call Center Recordings
- Available for training/testing transcript analysis

---

## SUCCESS METRICS

### Must Have:
- ✅ Working voice conversation in web app
- ✅ LiveKit integration functional
- ✅ Data collection structured and complete
- ✅ Escalation with context transfer
- ✅ Agent console with transcriptions
- ✅ Basic observability

### Nice to Have:
- ✅ No-code flow editor
- ✅ Cost tracking and limits
- ✅ Safety guardrails
- ✅ Auto-generation from transcripts
- ✅ Quality gates for data

---

## RISK MITIGATION

### Technical Risks:
1. **LiveKit integration complexity**: Start early, use examples
2. **Real-time transcription latency**: Test with different services
3. **Audio quality issues**: Implement error handling
4. **State management complexity**: Use established patterns

### Timeline Risks:
1. **Feature creep**: Focus on MVP first
2. **Integration delays**: Have fallback mocks
3. **Demo failures**: Prepare backup recordings

### Resource Risks:
1. **API rate limits**: Implement caching
2. **API costs**: Set usage limits early
3. **Service downtime**: Have offline mode

---

## QUESTIONS TO RESOLVE

- [ ] LiveKit implementation
- [ ] Select web framework (React)
- [ ] Decide on database (PostgreSQL)
- [ ] Choose flow editor library (React Flow)
- [ ] Determine hosting strategy (local for now)
- [ ] Define authentication approach for admin panels - for now no auth, each panel has one user for it's role

---

## NOTES

- Use Claude Code intensively throughout development
- Prioritize working demo over perfect code
- Document as you build
- Test early and often
- Keep the non-technical user in mind for Builder UI
- Business value > technical complexity
