-- Default OC Damage Reporting Flow

INSERT INTO flows (
    id,
    name,
    description,
    version,
    status,
    language,
    system_prompt,
    flow_definition,
    required_fields,
    validation_rules,
    created_by,
    published_at
) VALUES (
    uuid_generate_v4(),
    'OC Damage Report - Polish',
    'Default flow for reporting OC (car insurance) damage in Polish',
    1,
    'published',
    'pl',
    'Jesteś profesjonalnym asystentem call center dla firmy ubezpieczeniowej. Twoim zadaniem jest zebrać informacje o szkodzie OC (odpowiedzialność cywilna) w sposób przyjazny, empatyczny i profesjonalny.

ZASADY:
1. Zawsze mów po polsku, chyba że klient wolipref English
2. Bądź empatyczny - klient może być zestresowany po wypadku
3. Zbieraj informacje krok po kroku, nie przytłaczaj klienta wieloma pytaniami naraz
4. Potwierdzaj zebrane informacje przed zakończeniem rozmowy
5. Jeśli klient poprosi o połączenie z konsultantem, natychmiast to zrób
6. Jeśli klient używa wulgarnych słów lub jest agresywny, ostrzeż go uprzejmie (maksymalnie 3 razy), następnie zakończ rozmowę
7. Trzymaj się tematu szkody OC - jeśli klient schodzi na inne tematy, grzecznie przyprowadź go do tematu

STRUKTURA ROZMOWY:
1. Powitanie i przedstawienie się
2. Zbiórka danych o polisie
3. Zbiórka informacji o zdarzeniu
4. Zbiórka informacji o drugiej stronie (jeśli dotyczy)
5. Potwierdzenie zebranych danych
6. Informacja o następnych krokach
7. Ankieta satysfakcji (skala 1-5)

POLA DO ZEBRANIA:
- Numer polisy
- Data i godzina zdarzenia
- Miejsce zdarzenia (dokładny adres)
- Opis szkody
- Informacje o drugiej stronie (jeśli dotyczy): imię, nazwisko, numer rejestracyjny, numer telefonu
- Informacje o świadkach (jeśli są)

Na końcu rozmowy poinformuj klienta o następnych krokach.',
    '{"nodes": [{"id": "start", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}}, {"id": "greet", "type": "message", "position": {"x": 100, "y": 200}, "data": {"label": "Powitanie"}}, {"id": "collect_policy", "type": "slot_collection", "position": {"x": 100, "y": 300}, "data": {"label": "Numer polisy", "slotName": "policy_number"}}, {"id": "collect_date", "type": "slot_collection", "position": {"x": 100, "y": 400}, "data": {"label": "Data zdarzenia", "slotName": "incident_date"}}, {"id": "collect_location", "type": "slot_collection", "position": {"x": 100, "y": 500}, "data": {"label": "Miejsce zdarzenia", "slotName": "location"}}, {"id": "collect_description", "type": "slot_collection", "position": {"x": 100, "y": 600}, "data": {"label": "Opis szkody", "slotName": "damage_description"}}, {"id": "collect_other_party", "type": "slot_collection", "position": {"x": 100, "y": 700}, "data": {"label": "Druga strona", "slotName": "other_party_info"}}, {"id": "confirm", "type": "confirmation", "position": {"x": 100, "y": 800}, "data": {"label": "Potwierdzenie"}}, {"id": "next_steps", "type": "message", "position": {"x": 100, "y": 900}, "data": {"label": "Następne kroki"}}, {"id": "satisfaction", "type": "survey", "position": {"x": 100, "y": 1000}, "data": {"label": "Ankieta satysfakcji"}}, {"id": "end", "type": "end", "position": {"x": 100, "y": 1100}, "data": {"label": "Koniec"}}], "edges": [{"id": "e1", "source": "start", "target": "greet"}, {"id": "e2", "source": "greet", "target": "collect_policy"}, {"id": "e3", "source": "collect_policy", "target": "collect_date"}, {"id": "e4", "source": "collect_date", "target": "collect_location"}, {"id": "e5", "source": "collect_location", "target": "collect_description"}, {"id": "e6", "source": "collect_description", "target": "collect_other_party"}, {"id": "e7", "source": "collect_other_party", "target": "confirm"}, {"id": "e8", "source": "confirm", "target": "next_steps"}, {"id": "e9", "source": "next_steps", "target": "satisfaction"}, {"id": "e10", "source": "satisfaction", "target": "end"}]}',
    '[
        {"name": "policy_number", "type": "text", "label": {"pl": "Numer polisy", "en": "Policy number"}, "required": true, "validation": {"pattern": "^[A-Z0-9]{6,12}$"}, "confirmationRequired": true, "promptTemplate": {"pl": "Proszę podać numer swojej polisy ubezpieczeniowej", "en": "Please provide your insurance policy number"}},
        {"name": "incident_date", "type": "date", "label": {"pl": "Data i godzina zdarzenia", "en": "Date and time of incident"}, "required": true, "validation": {"format": "YYYY-MM-DD HH:mm"}, "confirmationRequired": true, "promptTemplate": {"pl": "Kiedy dokładnie miało miejsce zdarzenie? Proszę podać datę i godzinę", "en": "When exactly did the incident occur? Please provide date and time"}},
        {"name": "location", "type": "text", "label": {"pl": "Miejsce zdarzenia", "en": "Location of incident"}, "required": true, "confirmationRequired": true, "promptTemplate": {"pl": "Gdzie dokładnie miało miejsce zdarzenie? Proszę podać jak najdokładniejszy adres", "en": "Where exactly did the incident occur? Please provide the most accurate address"}},
        {"name": "damage_description", "type": "text", "label": {"pl": "Opis szkody", "en": "Damage description"}, "required": true, "confirmationRequired": false, "promptTemplate": {"pl": "Proszę opisać jak doszło do zdarzenia i jakie są szkody", "en": "Please describe how the incident happened and what damages occurred"}},
        {"name": "other_party_info", "type": "text", "label": {"pl": "Informacje o drugiej stronie", "en": "Other party information"}, "required": false, "confirmationRequired": false, "promptTemplate": {"pl": "Czy było zamieszane jakieś inne pojazd? Jeśli tak, proszę podać informacje o drugiej stronie", "en": "Was another vehicle involved? If yes, please provide information about the other party"}},
        {"name": "witness_info", "type": "text", "label": {"pl": "Informacje o świadkach", "en": "Witness information"}, "required": false, "confirmationRequired": false, "promptTemplate": {"pl": "Czy byli jacyś świadkowie zdarzenia?", "en": "Were there any witnesses to the incident?"}}
    ]',
    '{"maxDuration": 600, "maxRetries": 3, "warningThreshold": 3, "enableSatisfactionSurvey": true}',
    'system',
    NOW()
), (
    uuid_generate_v4(),
    'OC Damage Report - English',
    'Default flow for reporting OC (car insurance) damage in English',
    1,
    'published',
    'en',
    'You are a professional call center assistant for an insurance company. Your task is to collect information about OC (third-party liability) damage in a friendly, empathetic, and professional manner.

RULES:
1. Always speak English unless the client prefers Polish
2. Be empathetic - the client may be stressed after an accident
3. Collect information step by step, don''t overwhelm the client with many questions at once
4. Confirm collected information before ending the call
5. If the client requests to connect with a consultant, do it immediately
6. If the client uses profane language or is aggressive, politely warn them (maximum 3 times), then end the call
7. Stay on topic about OC damage - if the client goes off-topic, politely bring them back

CONVERSATION STRUCTURE:
1. Greeting and introduction
2. Collect policy information
3. Collect incident information
4. Collect other party information (if applicable)
5. Confirm collected data
6. Provide information about next steps
7. Satisfaction survey (1-5 scale)

FIELDS TO COLLECT:
- Policy number
- Date and time of incident
- Location of incident (exact address)
- Damage description
- Other party information (if applicable): name, license plate, phone number
- Witness information (if any)

At the end of the call, inform the client about the next steps.',
    '{"nodes": [{"id": "start", "type": "start", "position": {"x": 100, "y": 100}, "data": {"label": "Start"}}, {"id": "greet", "type": "message", "position": {"x": 100, "y": 200}, "data": {"label": "Greeting"}}, {"id": "collect_policy", "type": "slot_collection", "position": {"x": 100, "y": 300}, "data": {"label": "Policy number", "slotName": "policy_number"}}, {"id": "collect_date", "type": "slot_collection", "position": {"x": 100, "y": 400}, "data": {"label": "Incident date", "slotName": "incident_date"}}, {"id": "collect_location", "type": "slot_collection", "position": {"x": 100, "y": 500}, "data": {"label": "Location", "slotName": "location"}}, {"id": "collect_description", "type": "slot_collection", "position": {"x": 100, "y": 600}, "data": {"label": "Damage description", "slotName": "damage_description"}}, {"id": "collect_other_party", "type": "slot_collection", "position": {"x": 100, "y": 700}, "data": {"label": "Other party", "slotName": "other_party_info"}}, {"id": "confirm", "type": "confirmation", "position": {"x": 100, "y": 800}, "data": {"label": "Confirmation"}}, {"id": "next_steps", "type": "message", "position": {"x": 100, "y": 900}, "data": {"label": "Next steps"}}, {"id": "satisfaction", "type": "survey", "position": {"x": 100, "y": 1000}, "data": {"label": "Satisfaction survey"}}, {"id": "end", "type": "end", "position": {"x": 100, "y": 1100}, "data": {"label": "End"}}], "edges": [{"id": "e1", "source": "start", "target": "greet"}, {"id": "e2", "source": "greet", "target": "collect_policy"}, {"id": "e3", "source": "collect_policy", "target": "collect_date"}, {"id": "e4", "source": "collect_date", "target": "collect_location"}, {"id": "e5", "source": "collect_location", "target": "collect_description"}, {"id": "e6", "source": "collect_description", "target": "collect_other_party"}, {"id": "e7", "source": "collect_other_party", "target": "confirm"}, {"id": "e8", "source": "confirm", "target": "next_steps"}, {"id": "e9", "source": "next_steps", "target": "satisfaction"}, {"id": "e10", "source": "satisfaction", "target": "end"}]}',
    '[
        {"name": "policy_number", "type": "text", "label": {"pl": "Numer polisy", "en": "Policy number"}, "required": true, "validation": {"pattern": "^[A-Z0-9]{6,12}$"}, "confirmationRequired": true, "promptTemplate": {"pl": "Proszę podać numer swojej polisy ubezpieczeniowej", "en": "Please provide your insurance policy number"}},
        {"name": "incident_date", "type": "date", "label": {"pl": "Data i godzina zdarzenia", "en": "Date and time of incident"}, "required": true, "validation": {"format": "YYYY-MM-DD HH:mm"}, "confirmationRequired": true, "promptTemplate": {"pl": "Kiedy dokładnie miało miejsce zdarzenie? Proszę podać datę i godzinę", "en": "When exactly did the incident occur? Please provide date and time"}},
        {"name": "location", "type": "text", "label": {"pl": "Miejsce zdarzenia", "en": "Location of incident"}, "required": true, "confirmationRequired": true, "promptTemplate": {"pl": "Gdzie dokładnie miało miejsce zdarzenie?", "en": "Where exactly did the incident occur?"}},
        {"name": "damage_description", "type": "text", "label": {"pl": "Opis szkody", "en": "Damage description"}, "required": true, "confirmationRequired": false, "promptTemplate": {"pl": "Proszę opisać jak doszło do zdarzenia", "en": "Please describe how the incident happened"}},
        {"name": "other_party_info", "type": "text", "label": {"pl": "Informacje o drugiej stronie", "en": "Other party information"}, "required": false, "confirmationRequired": false, "promptTemplate": {"pl": "Czy było zamieszane inne pojazd?", "en": "Was another vehicle involved?"}},
        {"name": "witness_info", "type": "text", "label": {"pl": "Informacje o świadkach", "en": "Witness information"}, "required": false, "confirmationRequired": false, "promptTemplate": {"pl": "Czy byli świadkowie?", "en": "Were there any witnesses?"}}
    ]',
    '{"maxDuration": 600, "maxRetries": 3, "warningThreshold": 3, "enableSatisfactionSurvey": true}',
    'system',
    NOW()
);
