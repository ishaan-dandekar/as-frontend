import { NextResponse } from 'next/server';

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

const LEETCODE_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        reputation
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
    }
    userContestRanking(username: $username) {
      attendedContestsCount
      rating
      globalRanking
      topPercentage
    }
  }
`;

const TOTALS = {
  easy: 927,
  medium: 2010,
  hard: 909,
};

function normalizeUsername(raw: string): string {
  const value = (raw || '').trim();
  if (!value) return '';

  const cleaned = value
    .replace(/^https?:\/\/(www\.)?leetcode\.com\//i, '')
    .replace(/^u\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '');

  return cleaned.split('/')[0].trim();
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> }
) {
  const { username } = await context.params;
  const normalizedUsername = normalizeUsername(decodeURIComponent(username));

  if (!normalizedUsername) {
    return NextResponse.json(
      { message: 'Invalid LeetCode username' },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(LEETCODE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: LEETCODE_QUERY,
        variables: { username: normalizedUsername },
      }),
      next: { revalidate: 120 },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { message: `LeetCode upstream error (${upstream.status})` },
        { status: upstream.status }
      );
    }

    const payload = await upstream.json();
    const user = payload?.data?.matchedUser;
    const contest = payload?.data?.userContestRanking;

    if (!user) {
      return NextResponse.json({ message: 'LeetCode user not found' }, { status: 404 });
    }

    const acStats = Array.isArray(user?.submitStatsGlobal?.acSubmissionNum)
      ? user.submitStatsGlobal.acSubmissionNum
      : [];

    const all = acStats.find((item: { difficulty?: string }) => item.difficulty === 'All') || {};
    const easy = acStats.find((item: { difficulty?: string }) => item.difficulty === 'Easy') || {};
    const medium = acStats.find((item: { difficulty?: string }) => item.difficulty === 'Medium') || {};
    const hard = acStats.find((item: { difficulty?: string }) => item.difficulty === 'Hard') || {};

    const totalSolved = Number(all.count || 0);
    const totalSubmissions = Number(all.submissions || 0);

    const result = {
      profile: {
        username: user.username || normalizedUsername,
        ranking: Number(user?.profile?.ranking || 0),
        totalSolved,
        totalQuestions: TOTALS.easy + TOTALS.medium + TOTALS.hard,
        easySolved: Number(easy.count || 0),
        totalEasy: TOTALS.easy,
        mediumSolved: Number(medium.count || 0),
        totalMedium: TOTALS.medium,
        hardSolved: Number(hard.count || 0),
        totalHard: TOTALS.hard,
        acceptanceRate: totalSubmissions > 0 ? Math.round((totalSolved / totalSubmissions) * 1000) / 10 : 0,
        contributionPoints: 0,
        reputation: Number(user?.profile?.reputation || 0),
      },
      contest: contest
        ? {
            attendedContestsCount: Number(contest.attendedContestsCount || 0),
            rating: Math.round(Number(contest.rating || 0)),
            globalRanking: Number(contest.globalRanking || 0),
            topPercentage: Number(contest.topPercentage || 0),
          }
        : null,
      streak: 0,
      badges: 0,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { message: 'Failed to fetch LeetCode stats' },
      { status: 502 }
    );
  }
}
