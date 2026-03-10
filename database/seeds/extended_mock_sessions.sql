-- Extended Mock Session Data for Agent Console
-- This script adds 30 additional example voice call sessions to the database

-- First, get the flows IDs
DO $$
DECLARE
    english_flow_id UUID;
    polish_flow_id UUID;
BEGIN
    -- Get flow IDs from the database
    SELECT id INTO english_flow_id FROM flows WHERE name = 'OC Damage Report - English' AND status = 'published' LIMIT 1;
    SELECT id INTO polish_flow_id FROM flows WHERE name = 'OC Damage Report - Polish' AND status = 'published' LIMIT 1;

    -- If no flow IDs found, raise notice
    IF english_flow_id IS NULL AND polish_flow_id IS NULL THEN
        RAISE NOTICE 'No valid flows found in the database. Using random UUIDs instead.';
        english_flow_id := uuid_generate_v4();
        polish_flow_id := uuid_generate_v4();
    END IF;

    -- Create 30 diverse example sessions
    -- 1. Completed session with high satisfaction
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '4 days 3 hours',
        NOW() - interval '4 days 2 hours 45 minutes',
        900, -- 15 minutes
        FALSE,
        NULL,
        NULL,
        '{"name": "Robert Johnson", "phone": "+1 555-111-2222", "email": "robert.johnson@example.com", "device_type": "mobile"}',
        '{"total_usd": 1.35, "input_tokens": 480, "output_tokens": 356, "audio_minutes": 4.2}',
        ARRAY['insurance', 'claim_report'],
        5, -- Excellent satisfaction score
        TRUE, -- First try completion success
        FALSE, -- Customer not angry
        FALSE -- No legal threats
    );

    -- Get the ID of the session we just inserted for transcript entries
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'Hi, I need to report a car accident.',
        (NOW() - interval '4 days 3 hours'),
        'neutral',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I''m sorry to hear about your accident. I''d be happy to help you report it. Could you please provide your policy number?',
        (NOW() - interval '4 days 2 hours 58 minutes'),
        'positive',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'Sure, it''s POL123456789.',
        (NOW() - interval '4 days 2 hours 57 minutes'),
        'neutral',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Thank you. When did the accident occur?',
        (NOW() - interval '4 days 2 hours 56 minutes'),
        'neutral',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'It happened yesterday at around 4:30 PM.',
        (NOW() - interval '4 days 2 hours 55 minutes'),
        'neutral',
        FALSE
    FROM last_session;

    -- Add session data for this session
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO session_data (session_id, field_name, field_value, field_type, is_confirmed)
    SELECT
        id,
        'policy_number',
        'POL123456789',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'incident_date',
        '2026-03-06 16:30',
        'date',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'location',
        '123 Main Street, Springfield',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'damage_description',
        'Rear-end collision while stopped at a traffic light',
        'text',
        TRUE
    FROM last_session;

    -- 2. Completed session with medium satisfaction
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'pl',
        polish_flow_id,
        NOW() - interval '3 days 5 hours',
        NOW() - interval '3 days 4 hours 40 minutes',
        1200, -- 20 minutes
        FALSE,
        NULL,
        NULL,
        '{"name": "Anna Kowalska", "phone": "+48 555-111-222", "email": "anna.kowalska@example.pl", "device_type": "desktop"}',
        '{"total_usd": 1.86, "input_tokens": 620, "output_tokens": 540, "audio_minutes": 6.5}',
        ARRAY['insurance', 'policy_update', 'polish'],
        3, -- Average satisfaction score
        TRUE, -- First try completion success
        FALSE, -- Customer not angry
        FALSE -- No legal threats
    );

    -- Get the ID of the session we just inserted for transcript entries
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'Dzień dobry, potrzebuję zgłosić szkodę w moim samochodzie.',
        (NOW() - interval '3 days 5 hours'),
        'neutral',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Dzień dobry. Z przyjemnością pomogę w zgłoszeniu szkody. Czy mógłbym prosić o numer Pani polisy?',
        (NOW() - interval '3 days 4 hours 58 minutes'),
        'positive',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'Oczywiście, mój numer polisy to POL987654321.',
        (NOW() - interval '3 days 4 hours 57 minutes'),
        'neutral',
        FALSE
    FROM last_session;

    -- Add session data for this session
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO session_data (session_id, field_name, field_value, field_type, is_confirmed)
    SELECT
        id,
        'policy_number',
        'POL987654321',
        'text',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'incident_date',
        '2026-03-07 09:15',
        'date',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'location',
        'ul. Długa 45, Warszawa',
        'text',
        TRUE
    FROM last_session;

    -- 3. Escalated session with negative experience
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'escalated',
        'en',
        english_flow_id,
        NOW() - interval '2 days 6 hours',
        NOW() - interval '2 days 5 hours 15 minutes',
        2700, -- 45 minutes
        TRUE,
        NOW() - interval '2 days 5 hours 30 minutes',
        'Complex policy questions requiring specialized knowledge',
        '{"name": "Jason Miller", "phone": "+1 555-333-4444", "email": "jason.miller@example.com", "device_type": "tablet"}',
        '{"total_usd": 3.55, "input_tokens": 1580, "output_tokens": 1290, "audio_minutes": 12.3}',
        ARRAY['insurance', 'complex_policy', 'escalated'],
        2, -- Poor satisfaction score
        FALSE, -- Failed first try completion
        TRUE, -- Customer angry
        FALSE -- No legal threats
    );

    -- Get the ID of the session we just inserted for transcript entries
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'I need to understand why my claim was denied. This is ridiculous!',
        (NOW() - interval '2 days 6 hours'),
        'negative',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I understand your frustration. I''d be happy to look into why your claim was denied. Could you please provide your policy number?',
        (NOW() - interval '2 days 5 hours 58 minutes'),
        'neutral',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'It''s POL555666777. I don''t understand why I pay so much for insurance if you won''t cover my damages!',
        (NOW() - interval '2 days 5 hours 57 minutes'),
        'negative',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'Thank you for providing your policy number. Let me check the details of your claim. Can you tell me when the incident occurred?',
        (NOW() - interval '2 days 5 hours 56 minutes'),
        'neutral',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'It happened last week, on Tuesday. Look, this is getting nowhere. I want to speak to a real person who can actually help me.',
        (NOW() - interval '2 days 5 hours 55 minutes'),
        'very_negative',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I understand you want to speak with a human agent. I''ll connect you with a specialist who can better assist with your claim denial concerns.',
        (NOW() - interval '2 days 5 hours 53 minutes'),
        'neutral',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'agent',
        'Hello Mr. Miller, I''m Alex from our claims department. I understand you have questions about your denied claim. I''d like to review the details with you.',
        (NOW() - interval '2 days 5 hours 30 minutes'),
        'positive',
        FALSE
    FROM last_session;

    -- Add escalation record
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO escalations (
        session_id,
        status,
        priority,
        summary,
        assigned_to
    )
    SELECT
        id,
        'assigned',
        'high',
        'Customer upset about claim denial. Needs detailed explanation of policy exclusions.',
        'Alex Thompson'
    FROM last_session;

    -- 4-30. Generate additional varied sessions with different characteristics
    -- Let's create sessions with various attributes: statuses, languages, satisfaction scores, etc.

    -- 4. Active session - English
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'active',
        'en',
        english_flow_id,
        NOW() - interval '10 minutes',
        NULL,
        600,
        FALSE,
        '{"name": "Lisa Chen", "phone": "+1 555-777-8888", "email": "lisa.chen@example.com", "device_type": "mobile"}',
        '{"total_usd": 0.75, "input_tokens": 250, "output_tokens": 180, "audio_minutes": 2.1}',
        ARRAY['insurance', 'new_policy'],
        FALSE
    );

    -- 5. Active session - Polish
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'active',
        'pl',
        polish_flow_id,
        NOW() - interval '15 minutes',
        NULL,
        900,
        FALSE,
        '{"name": "Piotr Nowak", "phone": "+48 555-333-444", "email": "piotr.nowak@example.pl", "device_type": "desktop"}',
        '{"total_usd": 0.95, "input_tokens": 310, "output_tokens": 240, "audio_minutes": 2.9}',
        ARRAY['insurance', 'claim_report', 'polish'],
        TRUE
    );

    -- 6. Abandoned session
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'abandoned',
        'en',
        english_flow_id,
        NOW() - interval '1 day 3 hours',
        NOW() - interval '1 day 2 hours 55 minutes',
        300,
        FALSE,
        '{"name": "Unknown", "phone": "Unknown", "device_type": "mobile"}',
        '{"total_usd": 0.45, "input_tokens": 120, "output_tokens": 90, "audio_minutes": 1.2}',
        ARRAY['insurance', 'abandoned'],
        FALSE
    );

    -- 7. Completed session with legal threat
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '5 days 7 hours',
        NOW() - interval '5 days 6 hours 30 minutes',
        1800,
        TRUE,
        NOW() - interval '5 days 6 hours 45 minutes',
        'Customer threatened legal action',
        '{"name": "Karen Williams", "phone": "+1 555-123-9876", "email": "karen.williams@example.com", "device_type": "desktop"}',
        '{"total_usd": 2.75, "input_tokens": 980, "output_tokens": 850, "audio_minutes": 9.3}',
        ARRAY['insurance', 'complaint', 'legal'],
        1,
        FALSE,
        TRUE,
        TRUE
    );

    -- Get the ID of the session we just inserted for transcript entries with legal threat
    WITH last_session AS (
        SELECT id FROM sessions ORDER BY created_at DESC LIMIT 1
    )
    INSERT INTO transcripts (session_id, speaker, text, timestamp, sentiment, contains_legal_threat)
    SELECT
        id,
        'client',
        'Your company has consistently denied my valid claims. This is unacceptable!',
        (NOW() - interval '5 days 6 hours 50 minutes'),
        'negative',
        FALSE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'client',
        'If this isn''t resolved immediately, I will be contacting my attorney. You''ll be hearing from my lawyer!',
        (NOW() - interval '5 days 6 hours 48 minutes'),
        'very_negative',
        TRUE
    FROM last_session
    UNION ALL
    SELECT
        id,
        'bot',
        'I understand your frustration. Given the nature of your concerns, I''ll connect you with our customer relations manager who can better assist with your situation.',
        (NOW() - interval '5 days 6 hours 47 minutes'),
        'neutral',
        FALSE
    FROM last_session;

    -- 8. Completed session with extremely high satisfaction
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '6 days 4 hours',
        NOW() - interval '6 days 3 hours 45 minutes',
        900,
        FALSE,
        '{"name": "Michael Rodriguez", "phone": "+1 555-765-4321", "email": "michael.rodriguez@example.com", "device_type": "mobile"}',
        '{"total_usd": 1.65, "input_tokens": 540, "output_tokens": 480, "audio_minutes": 5.8}',
        ARRAY['insurance', 'claim_report'],
        5,
        TRUE,
        FALSE,
        FALSE
    );

    -- 9. Completed Polish session with medium satisfaction
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'pl',
        polish_flow_id,
        NOW() - interval '7 days 5 hours',
        NOW() - interval '7 days 4 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "Katarzyna Lewandowska", "phone": "+48 555-987-654", "email": "katarzyna.lewandowska@example.pl", "device_type": "tablet"}',
        '{"total_usd": 1.92, "input_tokens": 680, "output_tokens": 570, "audio_minutes": 6.8}',
        ARRAY['insurance', 'policy_update', 'polish'],
        3,
        TRUE,
        FALSE,
        FALSE
    );

    -- 10. Another escalated session with negative sentiment
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'escalated',
        'en',
        english_flow_id,
        NOW() - interval '8 days 3 hours',
        NOW() - interval '8 days 2 hours 20 minutes',
        2400,
        TRUE,
        NOW() - interval '8 days 2 hours 30 minutes',
        'Technical difficulties with policy retrieval',
        '{"name": "Brian Taylor", "phone": "+1 555-222-3333", "email": "brian.taylor@example.com", "device_type": "mobile"}',
        '{"total_usd": 3.35, "input_tokens": 1450, "output_tokens": 1180, "audio_minutes": 11.2}',
        ARRAY['insurance', 'technical_issue', 'escalated'],
        2,
        FALSE,
        TRUE,
        FALSE
    );

    -- 11. Active lengthy session
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'active',
        'en',
        english_flow_id,
        NOW() - interval '45 minutes',
        NULL,
        2700,
        FALSE,
        '{"name": "Emma Wilson", "phone": "+1 555-444-5555", "email": "emma.wilson@example.com", "device_type": "desktop"}',
        '{"total_usd": 3.15, "input_tokens": 1350, "output_tokens": 1120, "audio_minutes": 10.5}',
        ARRAY['insurance', 'complex_claim'],
        TRUE
    );

    -- 12. Very short completed session
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry,
        legal_threat_detected
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '9 days 6 hours',
        NOW() - interval '9 days 5 hours 55 minutes',
        300,
        FALSE,
        '{"name": "Thomas Johnson", "phone": "+1 555-111-0000", "email": "thomas.johnson@example.com", "device_type": "mobile"}',
        '{"total_usd": 0.85, "input_tokens": 280, "output_tokens": 210, "audio_minutes": 2.5}',
        ARRAY['insurance', 'quick_question'],
        4,
        TRUE,
        FALSE,
        FALSE
    );

    -- 13-30. Let's create more sessions with various characteristics
    -- Adding 18 more sessions with different dates, statuses, and attributes

    -- 13. Completed session with high satisfaction (yesterday)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '1 day 4 hours',
        NOW() - interval '1 day 3 hours 45 minutes',
        900,
        FALSE,
        '{"name": "Sarah Lewis", "phone": "+1 555-222-1111", "email": "sarah.lewis@example.com", "device_type": "mobile"}',
        '{"total_usd": 1.55, "input_tokens": 520, "output_tokens": 450, "audio_minutes": 5.2}',
        ARRAY['insurance', 'policy_renewal'],
        5,
        TRUE
    );

    -- 14. Completed session with medium satisfaction (2 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'pl',
        polish_flow_id,
        NOW() - interval '2 days 7 hours',
        NOW() - interval '2 days 6 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "Jan Kowalski", "phone": "+48 555-444-333", "email": "jan.kowalski@example.pl", "device_type": "tablet"}',
        '{"total_usd": 1.75, "input_tokens": 580, "output_tokens": 490, "audio_minutes": 5.8}',
        ARRAY['insurance', 'policy_change', 'polish'],
        3,
        TRUE
    );

    -- 15. Abandoned session (3 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        tags
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'abandoned',
        'en',
        english_flow_id,
        NOW() - interval '3 days 2 hours',
        NOW() - interval '3 days 1 hour 55 minutes',
        300,
        FALSE,
        '{"name": "Unknown", "device_type": "mobile"}',
        ARRAY['insurance', 'abandoned']
    );

    -- 16. Escalated session with low satisfaction (4 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'escalated',
        'en',
        english_flow_id,
        NOW() - interval '4 days 5 hours',
        NOW() - interval '4 days 4 hours 20 minutes',
        2400,
        TRUE,
        NOW() - interval '4 days 4 hours 30 minutes',
        'Billing dispute requiring manager intervention',
        '{"name": "Rachel Green", "phone": "+1 555-666-7777", "email": "rachel.green@example.com", "device_type": "desktop"}',
        '{"total_usd": 3.15, "input_tokens": 1350, "output_tokens": 1180, "audio_minutes": 10.5}',
        ARRAY['insurance', 'billing_issue', 'escalated'],
        2,
        FALSE,
        TRUE
    );

    -- 17. Completed session with average satisfaction (5 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '5 days 3 hours',
        NOW() - interval '5 days 2 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "Daniel Morris", "phone": "+1 555-888-9999", "email": "daniel.morris@example.com", "device_type": "mobile"}',
        '{"total_usd": 1.85, "input_tokens": 620, "output_tokens": 530, "audio_minutes": 6.2}',
        ARRAY['insurance', 'policy_question'],
        3,
        TRUE
    );

    -- 18. Active session (just started)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'active',
        'en',
        english_flow_id,
        NOW() - interval '5 minutes',
        NULL,
        300,
        FALSE,
        '{"name": "Jessica Smith", "phone": "+1 555-444-3333", "email": "jessica.smith@example.com", "device_type": "tablet"}',
        '{"total_usd": 0.45, "input_tokens": 150, "output_tokens": 120, "audio_minutes": 1.5}',
        ARRAY['insurance', 'new_inquiry']
    );

    -- 19. Completed session with high satisfaction (6 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '6 days 8 hours',
        NOW() - interval '6 days 7 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "Anthony Wilson", "phone": "+1 555-123-7890", "email": "anthony.wilson@example.com", "device_type": "desktop"}',
        '{"total_usd": 1.95, "input_tokens": 650, "output_tokens": 580, "audio_minutes": 6.5}',
        ARRAY['insurance', 'policy_update'],
        4,
        TRUE
    );

    -- 20. Polish escalated session (7 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'escalated',
        'pl',
        polish_flow_id,
        NOW() - interval '7 days 4 hours',
        NOW() - interval '7 days 3 hours 30 minutes',
        1800,
        TRUE,
        NOW() - interval '7 days 3 hours 40 minutes',
        'Specialized claim requiring expert assessment',
        '{"name": "Marcin Nowak", "phone": "+48 555-111-000", "email": "marcin.nowak@example.pl", "device_type": "desktop"}',
        '{"total_usd": 2.65, "input_tokens": 950, "output_tokens": 840, "audio_minutes": 8.8}',
        ARRAY['insurance', 'complex_claim', 'polish'],
        3,
        FALSE
    );

    -- 21. Completed session with low satisfaction (8 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '8 days 6 hours',
        NOW() - interval '8 days 5 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "Oliver Brown", "phone": "+1 555-222-4444", "email": "oliver.brown@example.com", "device_type": "mobile"}',
        '{"total_usd": 1.85, "input_tokens": 620, "output_tokens": 540, "audio_minutes": 6.2}',
        ARRAY['insurance', 'claim_issue'],
        2,
        FALSE,
        TRUE
    );

    -- 22. Another abandoned session (9 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        tags
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'abandoned',
        'pl',
        polish_flow_id,
        NOW() - interval '9 days 5 hours',
        NOW() - interval '9 days 4 hours 58 minutes',
        120,
        FALSE,
        '{"name": "Unknown", "device_type": "mobile"}',
        ARRAY['insurance', 'abandoned', 'polish']
    );

    -- 23. Completed session with high satisfaction (10 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '10 days 7 hours',
        NOW() - interval '10 days 6 hours 45 minutes',
        900,
        FALSE,
        '{"name": "Samantha Davis", "phone": "+1 555-777-6666", "email": "samantha.davis@example.com", "device_type": "desktop"}',
        '{"total_usd": 1.65, "input_tokens": 550, "output_tokens": 480, "audio_minutes": 5.5}',
        ARRAY['insurance', 'policy_inquiry'],
        5,
        TRUE
    );

    -- 24. Escalated session with customer anger (11 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion,
        customer_extremely_angry
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'escalated',
        'en',
        english_flow_id,
        NOW() - interval '11 days 4 hours',
        NOW() - interval '11 days 3 hours 20 minutes',
        2400,
        TRUE,
        NOW() - interval '11 days 3 hours 40 minutes',
        'Customer extremely dissatisfied with claim process',
        '{"name": "Richard Harris", "phone": "+1 555-333-2222", "email": "richard.harris@example.com", "device_type": "tablet"}',
        '{"total_usd": 3.25, "input_tokens": 1350, "output_tokens": 1180, "audio_minutes": 10.8}',
        ARRAY['insurance', 'claim_complaint', 'escalated'],
        1,
        FALSE,
        TRUE
    );

    -- 25. Completed Polish session (12 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'pl',
        polish_flow_id,
        NOW() - interval '12 days 5 hours',
        NOW() - interval '12 days 4 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "Marta Wiśniewska", "phone": "+48 555-888-777", "email": "marta.wisniewska@example.pl", "device_type": "mobile"}',
        '{"total_usd": 1.85, "input_tokens": 620, "output_tokens": 540, "audio_minutes": 6.2}',
        ARRAY['insurance', 'claim_report', 'polish'],
        4,
        TRUE
    );

    -- 26. Completed session with average satisfaction (13 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '13 days 6 hours',
        NOW() - interval '13 days 5 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "Justin Taylor", "phone": "+1 555-444-1111", "email": "justin.taylor@example.com", "device_type": "desktop"}',
        '{"total_usd": 1.85, "input_tokens": 620, "output_tokens": 530, "audio_minutes": 6.2}',
        ARRAY['insurance', 'coverage_question'],
        3,
        TRUE
    );

    -- 27. Completed session with high satisfaction (14 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '14 days 3 hours',
        NOW() - interval '14 days 2 hours 45 minutes',
        900,
        FALSE,
        '{"name": "Catherine Johnson", "phone": "+1 555-999-8888", "email": "catherine.johnson@example.com", "device_type": "mobile"}',
        '{"total_usd": 1.55, "input_tokens": 520, "output_tokens": 450, "audio_minutes": 5.2}',
        ARRAY['insurance', 'policy_renewal'],
        5,
        TRUE
    );

    -- 28. Polish session with medium satisfaction (15 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'pl',
        polish_flow_id,
        NOW() - interval '15 days 5 hours',
        NOW() - interval '15 days 4 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "Adam Zieliński", "phone": "+48 555-222-111", "email": "adam.zielinski@example.pl", "device_type": "tablet"}',
        '{"total_usd": 1.75, "input_tokens": 580, "output_tokens": 490, "audio_minutes": 5.8}',
        ARRAY['insurance', 'policy_change', 'polish'],
        3,
        TRUE
    );

    -- 29. Completed session with mixed sentiment (16 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'completed',
        'en',
        english_flow_id,
        NOW() - interval '16 days 7 hours',
        NOW() - interval '16 days 6 hours 40 minutes',
        1200,
        FALSE,
        '{"name": "William Parker", "phone": "+1 555-777-3333", "email": "william.parker@example.com", "device_type": "mobile"}',
        '{"total_usd": 1.85, "input_tokens": 620, "output_tokens": 530, "audio_minutes": 6.2}',
        ARRAY['insurance', 'general_inquiry'],
        3,
        TRUE
    );

    -- 30. Long escalated session (17 days ago)
    INSERT INTO sessions (
        id,
        room_id,
        status,
        language,
        flow_id,
        started_at,
        ended_at,
        duration_seconds,
        escalated,
        escalated_at,
        escalation_reason,
        client_metadata,
        cost_data,
        tags,
        satisfaction_score,
        first_try_completion
    ) VALUES (
        uuid_generate_v4(),
        'room_ins_' || floor(random() * 10000000)::text,
        'escalated',
        'en',
        english_flow_id,
        NOW() - interval '17 days 4 hours',
        NOW() - interval '17 days 3 hours',
        3600,
        TRUE,
        NOW() - interval '17 days 3 hours 30 minutes',
        'Complex multi-policy issue requiring specialized knowledge',
        '{"name": "Amanda Martinez", "phone": "+1 555-222-5555", "email": "amanda.martinez@example.com", "device_type": "desktop"}',
        '{"total_usd": 4.15, "input_tokens": 1850, "output_tokens": 1680, "audio_minutes": 13.8}',
        ARRAY['insurance', 'complex_policy', 'escalated'],
        2,
        FALSE
    );

    -- Update the daily metrics to reflect our new sessions
    INSERT INTO daily_metrics (
        date,
        total_sessions,
        completed_sessions,
        escalated_sessions,
        abandoned_sessions,
        avg_duration_seconds,
        avg_satisfaction_score,
        total_cost_usd,
        completeness_rate
    )
    VALUES
        (CURRENT_DATE, 173, 55, 13, 5, 1248, 3.4, 552.18, 87.5)
    ON CONFLICT (date)
    DO UPDATE SET
        total_sessions = daily_metrics.total_sessions + 30,
        completed_sessions = daily_metrics.completed_sessions + 18,
        escalated_sessions = daily_metrics.escalated_sessions + 9,
        abandoned_sessions = daily_metrics.abandoned_sessions + 3,
        avg_duration_seconds =
            (daily_metrics.avg_duration_seconds * daily_metrics.total_sessions + 36000) /
            (daily_metrics.total_sessions + 30),
        avg_satisfaction_score =
            (daily_metrics.avg_satisfaction_score * daily_metrics.total_sessions + 87) /
            (daily_metrics.total_sessions + 30),
        total_cost_usd = daily_metrics.total_cost_usd + 65.35;

END $$;