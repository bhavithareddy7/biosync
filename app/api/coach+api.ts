import { generateCoachResponse, CoachUserContext } from '../../services/geminiCoachBackend';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, userContext } = body as {
      query?: string;
      userContext?: CoachUserContext;
    };

    if (!query || typeof query !== 'string' || !query.trim()) {
      return Response.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    const defaultContext: CoachUserContext = {
      myTwin: {
        restingHeartRate: 64,
        restingHeartRateBaseline: 58,
        sleepHours: 6.2,
        sleepHoursBaseline: 7.5,
        fitnessLevel: 'Intermediate',
        injuryHistory: 'Mild lumbar tension under heavy axial compression',
      },
      myData: {
        activeSplit: 'Chest & Triceps Focus',
        recoveryPercentage: 74,
        recentLogs: [],
      },
    };

    const finalContext = userContext || defaultContext;
    const response = await generateCoachResponse(query, finalContext);

    return Response.json(response);
  } catch (error: any) {
    console.error('[API /api/coach] Error generating response:', error);
    return Response.json(
      { error: error?.message || 'Internal coaching error' },
      { status: 500 }
    );
  }
}
