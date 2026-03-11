import { Router, Request, Response } from 'express';
import { query } from '../db';
import axios from 'axios';

const router = Router();

// Azure Speaker Recognition configuration
const AZURE_SPEAKER_KEY = process.env.AZURE_SPEAKER_RECOGNITION_KEY || '';
const AZURE_SPEAKER_REGION = process.env.AZURE_SPEAKER_RECOGNITION_REGION || 'eastus';
const AZURE_SPEAKER_BASE_URL = `https://${AZURE_SPEAKER_REGION}.api.cognitive.microsoft.com/speaker`;
const CONFIDENCE_THRESHOLD = parseFloat(process.env.VOICE_RECOGNITION_CONFIDENCE_THRESHOLD || '0.75');

// Check if voice recognition is enabled
const isVoiceRecognitionEnabled = () => {
  return !!AZURE_SPEAKER_KEY;
};

/**
 * GET /api/voice-recognition/status
 * Check if voice recognition is enabled
 */
router.get('/status', async (req: Request, res: Response) => {
  res.json({
    enabled: isVoiceRecognitionEnabled(),
    confidence_threshold: CONFIDENCE_THRESHOLD,
    region: AZURE_SPEAKER_REGION,
  });
});

/**
 * GET /api/voice-recognition/profiles
 * Get all voice profiles from database
 */
router.get('/profiles', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        id,
        customer_id,
        customer_name,
        phone_number,
        email,
        policy_number,
        enrollment_status,
        enrollment_audio_duration_seconds,
        enrolled_at,
        last_recognized_at,
        recognition_count,
        created_at
      FROM customer_voice_profiles
      ORDER BY created_at DESC
    `);

    res.json({
      status: 'success',
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching voice profiles:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /api/voice-recognition/profiles/:customerId
 * Get voice profile by customer ID
 */
router.get('/profiles/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const result = await query(`
      SELECT *
      FROM customer_voice_profiles
      WHERE customer_id = $1
    `, [customerId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Voice profile not found',
      });
    }

    res.json({
      status: 'success',
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching voice profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * POST /api/voice-recognition/enroll
 * Create voice profile and enroll customer
 * Body: { customerId, customerName, phoneNumber, email, policyNumber, audioBase64 }
 */
router.post('/enroll', async (req: Request, res: Response) => {
  try {
    const { customerId, customerName, phoneNumber, email, policyNumber, audioBase64 } = req.body;

    if (!customerId || !customerName || !audioBase64) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: customerId, customerName, audioBase64',
      });
    }

    if (!isVoiceRecognitionEnabled()) {
      // Mock enrollment for demo
      const mockProfileId = `mock-profile-${customerId}-${Date.now()}`;

      await query(`
        INSERT INTO customer_voice_profiles (
          customer_id,
          customer_name,
          phone_number,
          email,
          policy_number,
          azure_profile_id,
          enrollment_status,
          enrollment_audio_duration_seconds,
          enrolled_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'enrolled', 32, NOW())
        ON CONFLICT (customer_id) DO UPDATE SET
          customer_name = EXCLUDED.customer_name,
          phone_number = EXCLUDED.phone_number,
          email = EXCLUDED.email,
          policy_number = EXCLUDED.policy_number,
          enrollment_status = 'enrolled',
          enrolled_at = NOW(),
          updated_at = NOW()
      `, [customerId, customerName, phoneNumber, email, policyNumber, mockProfileId]);

      return res.json({
        status: 'success',
        message: 'Voice profile enrolled (mock mode)',
        data: {
          profile_id: mockProfileId,
          customer_id: customerId,
          enrollment_status: 'enrolled',
        },
      });
    }

    // Real Azure enrollment
    console.log(`Creating Azure voice profile for customer: ${customerId}`);

    // Step 1: Create profile
    const createProfileResponse = await axios.post(
      `${AZURE_SPEAKER_BASE_URL}/identification/v2.0/text-independent/profiles`,
      { locale: 'en-US' },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEAKER_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const azureProfileId = createProfileResponse.data.profileId;
    console.log(`Azure profile created: ${azureProfileId}`);

    // Step 2: Enroll with audio
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    const enrollResponse = await axios.post(
      `${AZURE_SPEAKER_BASE_URL}/identification/v2.0/text-independent/profiles/${azureProfileId}/enrollments`,
      audioBuffer,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEAKER_KEY,
          'Content-Type': 'audio/wav',
        },
        timeout: 60000,
      }
    );

    const enrollmentStatus = enrollResponse.data.enrollmentStatus;
    console.log(`Enrollment status: ${enrollmentStatus}`);

    // Step 3: Store in database
    await query(`
      INSERT INTO customer_voice_profiles (
        customer_id,
        customer_name,
        phone_number,
        email,
        policy_number,
        azure_profile_id,
        enrollment_status,
        enrollment_audio_duration_seconds,
        enrolled_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (customer_id) DO UPDATE SET
        azure_profile_id = EXCLUDED.azure_profile_id,
        enrollment_status = EXCLUDED.enrollment_status,
        enrolled_at = EXCLUDED.enrolled_at,
        updated_at = NOW()
    `, [
      customerId,
      customerName,
      phoneNumber,
      email,
      policyNumber,
      azureProfileId,
      enrollmentStatus.toLowerCase(),
      32, // approximate duration
      enrollmentStatus === 'Enrolled' ? new Date() : null,
    ]);

    res.json({
      status: 'success',
      message: 'Voice profile enrolled',
      data: {
        profile_id: azureProfileId,
        customer_id: customerId,
        enrollment_status: enrollmentStatus,
      },
    });
  } catch (error: any) {
    console.error('Error enrolling voice profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * POST /api/voice-recognition/identify
 * Identify speaker from audio sample
 * Body: { sessionId, audioBase64 }
 */
router.post('/identify', async (req: Request, res: Response) => {
  try {
    const { sessionId, audioBase64 } = req.body;

    if (!audioBase64) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required field: audioBase64',
      });
    }

    const startTime = Date.now();

    // Get all enrolled profiles
    const profilesResult = await query(`
      SELECT azure_profile_id, customer_id, customer_name
      FROM customer_voice_profiles
      WHERE enrollment_status = 'enrolled'
    `);

    if (profilesResult.rows.length === 0) {
      return res.json({
        status: 'success',
        data: {
          recognized: false,
          message: 'No enrolled profiles to match against',
        },
      });
    }

    const enrolledProfiles = profilesResult.rows;

    if (!isVoiceRecognitionEnabled()) {
      // Mock recognition for demo - randomly pick a profile
      const mockProfile = enrolledProfiles[0];
      const mockConfidence = 0.94;

      const recognitionTimeMs = Date.now() - startTime;

      // Log event
      await query(`
        INSERT INTO voice_recognition_events (
          session_id,
          customer_id,
          voice_profile_id,
          recognized,
          confidence_score,
          audio_duration_seconds,
          recognition_time_ms
        )
        SELECT $1::uuid, $2, id, true, $3, 10, $4
        FROM customer_voice_profiles
        WHERE customer_id = $2
      `, [sessionId || null, mockProfile.customer_id, mockConfidence, recognitionTimeMs]);

      // Update session
      if (sessionId) {
        await query(`
          UPDATE sessions
          SET voice_recognized = true,
              recognized_customer_id = $1,
              recognition_confidence = $2
          WHERE room_id = $3
        `, [mockProfile.customer_id, mockConfidence, sessionId]);
      }

      return res.json({
        status: 'success',
        data: {
          recognized: true,
          customer_id: mockProfile.customer_id,
          customer_name: mockProfile.customer_name,
          confidence: mockConfidence,
          recognition_time_ms: recognitionTimeMs,
        },
      });
    }

    // Real Azure recognition
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    const profileIds = enrolledProfiles.map(p => p.azure_profile_id).join(',');

    console.log(`Identifying speaker against ${enrolledProfiles.length} profiles`);

    const identifyResponse = await axios.post(
      `${AZURE_SPEAKER_BASE_URL}/identification/v2.0/text-independent/profiles/identifySingleSpeaker?profileIds=${profileIds}`,
      audioBuffer,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEAKER_KEY,
          'Content-Type': 'audio/wav',
        },
        timeout: 60000,
      }
    );

    const recognitionTimeMs = Date.now() - startTime;
    const identifiedProfileId = identifyResponse.data.identifiedProfile?.profileId;
    const confidence = identifyResponse.data.identifiedProfile?.score || 0;

    if (identifiedProfileId && confidence >= CONFIDENCE_THRESHOLD) {
      // Find customer info
      const matchedProfile = enrolledProfiles.find(p => p.azure_profile_id === identifiedProfileId);

      if (matchedProfile) {
        // Log successful recognition
        await query(`
          INSERT INTO voice_recognition_events (
            session_id,
            customer_id,
            voice_profile_id,
            recognized,
            confidence_score,
            audio_duration_seconds,
            recognition_time_ms
          )
          SELECT $1, $2, id, true, $3, 10, $4
          FROM customer_voice_profiles
          WHERE customer_id = $2
        `, [sessionId, matchedProfile.customer_id, confidence, recognitionTimeMs]);

        // Update session
        if (sessionId) {
          await query(`
            UPDATE sessions
            SET voice_recognized = true,
                recognized_customer_id = $1,
                recognition_confidence = $2
            WHERE room_id = $3
          `, [matchedProfile.customer_id, confidence, sessionId]);
        }

        // Update profile stats
        await query(`
          UPDATE customer_voice_profiles
          SET last_recognized_at = NOW(),
              recognition_count = recognition_count + 1
          WHERE customer_id = $1
        `, [matchedProfile.customer_id]);

        res.json({
          status: 'success',
          data: {
            recognized: true,
            customer_id: matchedProfile.customer_id,
            customer_name: matchedProfile.customer_name,
            confidence: confidence,
            recognition_time_ms: recognitionTimeMs,
          },
        });
      } else {
        throw new Error('Matched profile not found in database');
      }
    } else {
      // Recognition failed
      await query(`
        INSERT INTO voice_recognition_events (
          session_id,
          recognized,
          confidence_score,
          audio_duration_seconds,
          recognition_time_ms,
          fallback_to_manual_auth
        ) VALUES ($1, false, $2, 10, $3, true)
      `, [sessionId, confidence, recognitionTimeMs]);

      res.json({
        status: 'success',
        data: {
          recognized: false,
          confidence: confidence,
          recognition_time_ms: recognitionTimeMs,
          fallback_to_manual_auth: true,
        },
      });
    }
  } catch (error: any) {
    console.error('Error identifying speaker:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * DELETE /api/voice-recognition/profiles/:customerId
 * Delete voice profile (GDPR compliance)
 */
router.delete('/profiles/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    // Get profile info
    const profileResult = await query(`
      SELECT azure_profile_id
      FROM customer_voice_profiles
      WHERE customer_id = $1
    `, [customerId]);

    if (profileResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Voice profile not found',
      });
    }

    const azureProfileId = profileResult.rows[0].azure_profile_id;

    // Delete from Azure (if enabled)
    if (isVoiceRecognitionEnabled() && !azureProfileId.startsWith('mock-')) {
      await axios.delete(
        `${AZURE_SPEAKER_BASE_URL}/identification/v2.0/text-independent/profiles/${azureProfileId}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': AZURE_SPEAKER_KEY,
          },
        }
      );
    }

    // Delete from database
    await query(`
      DELETE FROM customer_voice_profiles
      WHERE customer_id = $1
    `, [customerId]);

    res.json({
      status: 'success',
      message: 'Voice profile deleted',
    });
  } catch (error: any) {
    console.error('Error deleting voice profile:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

/**
 * GET /api/voice-recognition/analytics
 * Get voice recognition analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT * FROM voice_recognition_analytics
      ORDER BY date DESC
      LIMIT 30
    `);

    res.json({
      status: 'success',
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching voice recognition analytics:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
    });
  }
});

export default router;
