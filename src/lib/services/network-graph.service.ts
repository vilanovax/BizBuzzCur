/**
 * Network Graph & Trust Signals Service
 *
 * BizBuzz از «پروفایل هوشمند» می‌ره به «شبکه‌ی قابل اعتماد»
 *
 * Core Logic:
 * - Trust Score = collaboration×0.35 + mutuals×0.2 + endorsement×0.2 + interactionQuality×0.15 + freshness×0.1
 * - Connection count has NO weight
 * - Every recommendation is explainable
 *
 * Key Principle: Connect with reason, not guess.
 */

import sql from '@/lib/db';
import type {
  NetworkNode,
  NetworkEdge,
  TrustSignal,
  ConnectionWithProfile,
  ConnectionRequest,
  ConnectionRequestWithProfile,
  NetworkDecisionContext,
  NetworkDecision,
  IntroductionPath,
  NetworkDecisionReason,
  TrustBreakdown,
  ConnectionSuggestion,
  NetworkHealthScore,
  InteractionFeedback,
  NetworkEdgeType,
  NetworkContext,
  EdgeStatus,
  TrustSignalType,
  FeedbackRating,
} from '@/types/network-graph';
import { TRUST_SCORE_WEIGHTS } from '@/types/network-graph';

// =============================================================================
// CONNECTIONS CRUD
// =============================================================================

/**
 * Get all connections for a profile
 */
export async function getConnections(profileId: string): Promise<ConnectionWithProfile[]> {
  type EdgeRow = {
    id: string;
    from_profile_id: string;
    to_profile_id: string;
    edge_type: NetworkEdgeType;
    context: NetworkContext;
    strength: string;
    trust: string;
    status: EdgeStatus;
    introduced_by: string | null;
    introduction_message: string | null;
    created_at: string;
    updated_at: string;
    last_interaction_at: string | null;
    // Profile fields
    profile_id: string;
    name: string;
    headline: string | null;
    photo_url: string | null;
  };

  const rows = await sql<EdgeRow[]>`
    SELECT
      e.*,
      p.id as profile_id,
      p.name,
      p.headline,
      p.photo_url
    FROM network_edges e
    JOIN profiles p ON (
      CASE
        WHEN e.from_profile_id = ${profileId} THEN e.to_profile_id = p.id
        ELSE e.from_profile_id = p.id
      END
    )
    WHERE (e.from_profile_id = ${profileId} OR e.to_profile_id = ${profileId})
      AND e.status = 'active'
    ORDER BY e.trust DESC, e.updated_at DESC
  `;

  // Get mutual counts
  const connections: ConnectionWithProfile[] = await Promise.all(
    rows.map(async (row) => {
      const otherProfileId = row.from_profile_id === profileId
        ? row.to_profile_id
        : row.from_profile_id;

      const mutualCount = await getMutualConnectionCount(profileId, otherProfileId);
      const signals = await getTrustSignals(row.id);

      return {
        id: row.id,
        fromProfileId: row.from_profile_id,
        toProfileId: row.to_profile_id,
        edgeType: row.edge_type,
        context: row.context,
        strength: parseFloat(row.strength),
        trust: parseFloat(row.trust),
        status: row.status,
        introducedBy: row.introduced_by || undefined,
        introductionMessage: row.introduction_message || undefined,
        signals,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastInteractionAt: row.last_interaction_at || undefined,
        profile: {
          profileId: row.profile_id,
          name: row.name,
          headline: row.headline || undefined,
          photoUrl: row.photo_url || undefined,
          roleTags: [],
          domains: [],
        },
        mutualCount,
      };
    })
  );

  return connections;
}

/**
 * Get trust signals for an edge
 */
async function getTrustSignals(edgeId: string): Promise<TrustSignal[]> {
  type SignalRow = {
    id: string;
    signal_type: TrustSignalType;
    weight: string;
    evidence: string | null;
    reference_id: string | null;
    reference_type: string | null;
    created_at: string;
    expires_at: string | null;
  };

  const rows = await sql<SignalRow[]>`
    SELECT * FROM trust_signals
    WHERE edge_id = ${edgeId}
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY weight DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    signalType: row.signal_type,
    weight: parseFloat(row.weight),
    evidence: row.evidence || undefined,
    referenceId: row.reference_id || undefined,
    referenceType: row.reference_type || undefined,
    createdAt: row.created_at,
    expiresAt: row.expires_at || undefined,
  }));
}

/**
 * Get mutual connection count
 */
async function getMutualConnectionCount(profileA: string, profileB: string): Promise<number> {
  type CountRow = { count: string };
  const [result] = await sql<CountRow[]>`
    SELECT COUNT(*) as count
    FROM network_edges e1
    JOIN network_edges e2 ON e1.to_profile_id = e2.to_profile_id
    WHERE e1.from_profile_id = ${profileA}
      AND e2.from_profile_id = ${profileB}
      AND e1.status = 'active'
      AND e2.status = 'active'
  `;

  return parseInt(result?.count || '0');
}

// =============================================================================
// CONNECTION REQUESTS
// =============================================================================

/**
 * Send connection request
 */
export async function sendConnectionRequest(
  fromProfileId: string,
  toProfileId: string,
  message?: string,
  introducerProfileId?: string
): Promise<ConnectionRequest> {
  const requestType = introducerProfileId ? 'introduction' : 'direct';

  type RequestRow = {
    id: string;
    from_profile_id: string;
    to_profile_id: string;
    request_type: 'direct' | 'introduction';
    message: string | null;
    introducer_profile_id: string | null;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    created_at: string;
    responded_at: string | null;
    expires_at: string;
  };

  const [request] = await sql<RequestRow[]>`
    INSERT INTO connection_requests (
      from_profile_id,
      to_profile_id,
      request_type,
      message,
      introducer_profile_id
    ) VALUES (
      ${fromProfileId},
      ${toProfileId},
      ${requestType},
      ${message || null},
      ${introducerProfileId || null}
    )
    RETURNING *
  `;

  return {
    id: request.id,
    fromProfileId: request.from_profile_id,
    toProfileId: request.to_profile_id,
    requestType: request.request_type,
    message: request.message || undefined,
    introducerProfileId: request.introducer_profile_id || undefined,
    status: request.status,
    createdAt: request.created_at,
    respondedAt: request.responded_at || undefined,
    expiresAt: request.expires_at,
  };
}

/**
 * Get pending connection requests for a profile
 */
export async function getPendingRequests(profileId: string): Promise<ConnectionRequestWithProfile[]> {
  type RequestRow = {
    id: string;
    from_profile_id: string;
    to_profile_id: string;
    request_type: 'direct' | 'introduction';
    message: string | null;
    introducer_profile_id: string | null;
    status: 'pending' | 'accepted' | 'declined' | 'expired';
    created_at: string;
    responded_at: string | null;
    expires_at: string;
    from_name: string;
    from_headline: string | null;
    from_photo_url: string | null;
    introducer_name: string | null;
  };

  const rows = await sql<RequestRow[]>`
    SELECT
      cr.*,
      fp.name as from_name,
      fp.headline as from_headline,
      fp.photo_url as from_photo_url,
      ip.name as introducer_name
    FROM connection_requests cr
    JOIN profiles fp ON cr.from_profile_id = fp.id
    LEFT JOIN profiles ip ON cr.introducer_profile_id = ip.id
    WHERE cr.to_profile_id = ${profileId}
      AND cr.status = 'pending'
      AND cr.expires_at > NOW()
    ORDER BY cr.created_at DESC
  `;

  return rows.map((row) => ({
    id: row.id,
    fromProfileId: row.from_profile_id,
    toProfileId: row.to_profile_id,
    requestType: row.request_type,
    message: row.message || undefined,
    introducerProfileId: row.introducer_profile_id || undefined,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at || undefined,
    expiresAt: row.expires_at,
    fromProfile: {
      profileId: row.from_profile_id,
      name: row.from_name,
      headline: row.from_headline || undefined,
      photoUrl: row.from_photo_url || undefined,
      roleTags: [],
      domains: [],
    },
    introducerProfile: row.introducer_name
      ? {
          profileId: row.introducer_profile_id!,
          name: row.introducer_name,
          roleTags: [],
          domains: [],
        }
      : undefined,
  }));
}

/**
 * Accept connection request
 */
export async function acceptConnectionRequest(requestId: string): Promise<NetworkEdge | null> {
  // Get request
  type RequestRow = {
    from_profile_id: string;
    to_profile_id: string;
    request_type: 'direct' | 'introduction';
    introducer_profile_id: string | null;
    message: string | null;
  };

  const [request] = await sql<RequestRow[]>`
    UPDATE connection_requests
    SET status = 'accepted', responded_at = NOW()
    WHERE id = ${requestId} AND status = 'pending'
    RETURNING from_profile_id, to_profile_id, request_type, introducer_profile_id, message
  `;

  if (!request) return null;

  // Create edge
  const edgeType: NetworkEdgeType = request.request_type === 'introduction' ? 'introduced' : 'direct';

  type EdgeRow = {
    id: string;
    from_profile_id: string;
    to_profile_id: string;
    edge_type: NetworkEdgeType;
    context: NetworkContext;
    strength: string;
    trust: string;
    status: EdgeStatus;
    introduced_by: string | null;
    introduction_message: string | null;
    created_at: string;
    updated_at: string;
    last_interaction_at: string | null;
  };

  const [edge] = await sql<EdgeRow[]>`
    INSERT INTO network_edges (
      from_profile_id,
      to_profile_id,
      edge_type,
      introduced_by,
      introduction_message,
      status
    ) VALUES (
      ${request.from_profile_id},
      ${request.to_profile_id},
      ${edgeType},
      ${request.introducer_profile_id || null},
      ${request.message || null},
      'active'
    )
    ON CONFLICT (from_profile_id, to_profile_id) DO UPDATE
    SET status = 'active', updated_at = NOW()
    RETURNING *
  `;

  // Add intro_history signal if introduced
  if (request.introducer_profile_id) {
    await addTrustSignal(edge.id, 'intro_history', 0.6, 'معرفی از طریق کانکشن مشترک');
  }

  const signals = await getTrustSignals(edge.id);

  return {
    id: edge.id,
    fromProfileId: edge.from_profile_id,
    toProfileId: edge.to_profile_id,
    edgeType: edge.edge_type,
    context: edge.context,
    strength: parseFloat(edge.strength),
    trust: parseFloat(edge.trust),
    status: edge.status,
    introducedBy: edge.introduced_by || undefined,
    introductionMessage: edge.introduction_message || undefined,
    signals,
    createdAt: edge.created_at,
    updatedAt: edge.updated_at,
    lastInteractionAt: edge.last_interaction_at || undefined,
  };
}

/**
 * Decline connection request
 */
export async function declineConnectionRequest(requestId: string): Promise<boolean> {
  const result = await sql`
    UPDATE connection_requests
    SET status = 'declined', responded_at = NOW()
    WHERE id = ${requestId} AND status = 'pending'
  `;

  return result.count > 0;
}

// =============================================================================
// TRUST SIGNALS
// =============================================================================

/**
 * Add trust signal to an edge
 */
export async function addTrustSignal(
  edgeId: string,
  signalType: TrustSignalType,
  weight: number,
  evidence?: string,
  referenceId?: string,
  referenceType?: string
): Promise<TrustSignal> {
  type SignalRow = {
    id: string;
    signal_type: TrustSignalType;
    weight: string;
    evidence: string | null;
    reference_id: string | null;
    reference_type: string | null;
    created_at: string;
    expires_at: string | null;
  };

  const [signal] = await sql<SignalRow[]>`
    INSERT INTO trust_signals (
      edge_id,
      signal_type,
      weight,
      evidence,
      reference_id,
      reference_type
    ) VALUES (
      ${edgeId},
      ${signalType},
      ${weight},
      ${evidence || null},
      ${referenceId || null},
      ${referenceType || null}
    )
    RETURNING *
  `;

  // Update edge trust score
  await updateEdgeTrust(edgeId);

  return {
    id: signal.id,
    signalType: signal.signal_type,
    weight: parseFloat(signal.weight),
    evidence: signal.evidence || undefined,
    referenceId: signal.reference_id || undefined,
    referenceType: signal.reference_type || undefined,
    createdAt: signal.created_at,
    expiresAt: signal.expires_at || undefined,
  };
}

/**
 * Update edge trust score based on signals
 */
async function updateEdgeTrust(edgeId: string): Promise<void> {
  const signals = await getTrustSignals(edgeId);

  if (signals.length === 0) return;

  // Calculate weighted average
  const totalWeight = signals.reduce((sum, s) => sum + s.weight, 0);
  const avgTrust = Math.min(1, (totalWeight / signals.length) * 1.2);

  await sql`
    UPDATE network_edges
    SET trust = ${avgTrust}
    WHERE id = ${edgeId}
  `;
}

// =============================================================================
// NETWORK DECISION ENGINE
// =============================================================================

/**
 * Get network decision for a potential connection
 */
export async function getNetworkDecision(
  fromProfileId: string,
  context: NetworkDecisionContext
): Promise<NetworkDecision> {
  const { intent, targetProfileId } = context;

  if (!targetProfileId) {
    return {
      recommendation: 'hold',
      confidence: 0,
      reasons: [{ type: 'trust', message: 'هدف مشخص نشده' }],
    };
  }

  // Check existing connection
  type EdgeCheck = { status: EdgeStatus };
  const [existingEdge] = await sql<EdgeCheck[]>`
    SELECT status FROM network_edges
    WHERE (from_profile_id = ${fromProfileId} AND to_profile_id = ${targetProfileId})
       OR (from_profile_id = ${targetProfileId} AND to_profile_id = ${fromProfileId})
  `;

  if (existingEdge?.status === 'active') {
    return {
      recommendation: 'do',
      confidence: 100,
      reasons: [{ type: 'trust', message: 'قبلاً متصل هستید' }],
    };
  }

  // Calculate trust breakdown
  const trustBreakdown = await calculateTrustBreakdown(fromProfileId, targetProfileId);
  const totalTrust = trustBreakdown.total;

  // Find introduction paths
  const suggestedPath = await findIntroductionPaths(fromProfileId, targetProfileId);

  // Build reasons
  const reasons: NetworkDecisionReason[] = [];

  if (trustBreakdown.mutuals > 0.1) {
    reasons.push({
      type: 'mutual',
      message: 'کانکشن‌های مشترک دارید',
    });
  }

  if (trustBreakdown.collaboration > 0) {
    reasons.push({
      type: 'history',
      message: 'سابقه همکاری مشترک',
    });
  }

  if (suggestedPath.length > 0) {
    reasons.push({
      type: 'trust',
      message: `معرفی از طریق ${suggestedPath[0].viaProfileName} پیشنهاد می‌شود`,
    });
  }

  // Determine recommendation
  let recommendation: 'do' | 'consider' | 'hold';
  if (totalTrust >= 0.7) {
    recommendation = 'do';
  } else if (totalTrust >= 0.4 || suggestedPath.length > 0) {
    recommendation = 'consider';
  } else {
    recommendation = 'hold';
  }

  return {
    recommendation,
    confidence: Math.round(totalTrust * 100),
    reasons,
    suggestedPath: suggestedPath.length > 0 ? suggestedPath : undefined,
    trustBreakdown,
  };
}

/**
 * Calculate trust breakdown between two profiles
 */
async function calculateTrustBreakdown(
  fromProfileId: string,
  targetProfileId: string
): Promise<TrustBreakdown> {
  // Mutual connections
  const mutualCount = await getMutualConnectionCount(fromProfileId, targetProfileId);
  const mutuals = Math.min(1, mutualCount * 0.2);

  // Check for past collaboration (simplified)
  const collaboration = 0; // Would need project data

  // Endorsements
  const endorsement = 0; // Would need endorsement data

  // Interaction quality (simplified)
  const interactionQuality = 0.5;

  // Freshness (simplified)
  const freshness = 0.5;

  const total =
    collaboration * TRUST_SCORE_WEIGHTS.collaboration +
    mutuals * TRUST_SCORE_WEIGHTS.mutuals +
    endorsement * TRUST_SCORE_WEIGHTS.endorsement +
    interactionQuality * TRUST_SCORE_WEIGHTS.interactionQuality +
    freshness * TRUST_SCORE_WEIGHTS.freshness;

  return {
    collaboration,
    mutuals,
    endorsement,
    interactionQuality,
    freshness,
    total: Math.min(1, total),
  };
}

/**
 * Find introduction paths
 */
async function findIntroductionPaths(
  fromProfileId: string,
  targetProfileId: string
): Promise<IntroductionPath[]> {
  type PathRow = {
    via_profile_id: string;
    via_name: string;
    trust_score: string;
  };

  const paths = await sql<PathRow[]>`
    SELECT
      e1.to_profile_id as via_profile_id,
      p.name as via_name,
      (e1.trust + e2.trust) / 2 as trust_score
    FROM network_edges e1
    JOIN network_edges e2 ON e1.to_profile_id = e2.from_profile_id
    JOIN profiles p ON e1.to_profile_id = p.id
    WHERE e1.from_profile_id = ${fromProfileId}
      AND e2.to_profile_id = ${targetProfileId}
      AND e1.status = 'active'
      AND e2.status = 'active'
    ORDER BY trust_score DESC
    LIMIT 3
  `;

  return paths.map((p) => ({
    viaProfileId: p.via_profile_id,
    viaProfileName: p.via_name,
    trustScore: parseFloat(p.trust_score),
    reason: 'مسیر معرفی با اعتماد بالا',
  }));
}

// =============================================================================
// CONNECTION SUGGESTIONS
// =============================================================================

/**
 * Get connection suggestions for a profile
 */
export async function getConnectionSuggestions(
  profileId: string,
  limit: number = 10
): Promise<ConnectionSuggestion[]> {
  // Find profiles connected to my connections but not to me
  type SuggestionRow = {
    profile_id: string;
    name: string;
    headline: string | null;
    photo_url: string | null;
    mutual_count: string;
    avg_trust: string;
  };

  const suggestions = await sql<SuggestionRow[]>`
    SELECT
      p.id as profile_id,
      p.name,
      p.headline,
      p.photo_url,
      COUNT(DISTINCT e2.from_profile_id) as mutual_count,
      AVG(e1.trust) as avg_trust
    FROM profiles p
    JOIN network_edges e2 ON p.id = e2.to_profile_id
    JOIN network_edges e1 ON e2.from_profile_id = e1.to_profile_id
    WHERE e1.from_profile_id = ${profileId}
      AND e1.status = 'active'
      AND e2.status = 'active'
      AND p.id != ${profileId}
      AND NOT EXISTS (
        SELECT 1 FROM network_edges e3
        WHERE (e3.from_profile_id = ${profileId} AND e3.to_profile_id = p.id)
           OR (e3.from_profile_id = p.id AND e3.to_profile_id = ${profileId})
      )
    GROUP BY p.id, p.name, p.headline, p.photo_url
    ORDER BY avg_trust DESC, mutual_count DESC
    LIMIT ${limit}
  `;

  return Promise.all(
    suggestions.map(async (s) => {
      const mutualCount = parseInt(s.mutual_count);
      const trustScore = parseFloat(s.avg_trust);

      // Find best intro path
      const paths = await findIntroductionPaths(profileId, s.profile_id);

      // Determine badge
      let badge: 'high_trust' | 'good_fit' | 'mutual_heavy' | undefined;
      if (trustScore >= 0.7) badge = 'high_trust';
      else if (mutualCount >= 3) badge = 'mutual_heavy';
      else if (trustScore >= 0.5) badge = 'good_fit';

      // Build reasons
      const reasons: NetworkDecisionReason[] = [];
      if (mutualCount > 0) {
        reasons.push({
          type: 'mutual',
          message: `${mutualCount} کانکشن مشترک`,
        });
      }
      if (paths.length > 0) {
        reasons.push({
          type: 'trust',
          message: `معرفی از طریق ${paths[0].viaProfileName}`,
        });
      }

      return {
        profile: {
          profileId: s.profile_id,
          name: s.name,
          headline: s.headline || undefined,
          photoUrl: s.photo_url || undefined,
          roleTags: [],
          domains: [],
        },
        trustScore,
        mutualCount,
        reasons,
        suggestedPath: paths[0],
        badge,
      };
    })
  );
}

// =============================================================================
// NETWORK HEALTH (Premium)
// =============================================================================

/**
 * Get network health score
 */
export async function getNetworkHealthScore(profileId: string): Promise<NetworkHealthScore> {
  // Get all active connections
  type StatsRow = {
    total: string;
    avg_trust: string;
    avg_strength: string;
  };

  const [stats] = await sql<StatsRow[]>`
    SELECT
      COUNT(*) as total,
      AVG(trust) as avg_trust,
      AVG(strength) as avg_strength
    FROM network_edges
    WHERE (from_profile_id = ${profileId} OR to_profile_id = ${profileId})
      AND status = 'active'
  `;

  const totalConnections = parseInt(stats?.total || '0');
  const averageTrust = parseFloat(stats?.avg_trust || '0');
  const strengthScore = parseFloat(stats?.avg_strength || '0');

  // Calculate diversity (simplified - would need domain data)
  const diversityScore = 0.5;

  // Generate suggestions
  const suggestions: string[] = [];
  if (totalConnections < 10) {
    suggestions.push('شبکه‌ی خود را گسترش دهید');
  }
  if (averageTrust < 0.5) {
    suggestions.push('روی ارتباطات عمیق‌تر تمرکز کنید');
  }
  if (diversityScore < 0.5) {
    suggestions.push('با افراد از حوزه‌های مختلف ارتباط برقرار کنید');
  }

  return {
    totalConnections,
    activeConnections: totalConnections, // All are active
    averageTrust,
    diversityScore,
    strengthScore,
    suggestions,
  };
}

// =============================================================================
// INTERACTION FEEDBACK
// =============================================================================

/**
 * Submit interaction feedback
 */
export async function submitInteractionFeedback(
  edgeId: string,
  fromProfileId: string,
  interactionType: 'connection' | 'introduction' | 'collaboration' | 'message',
  rating: FeedbackRating,
  note?: string
): Promise<InteractionFeedback> {
  type FeedbackRow = {
    id: string;
    edge_id: string;
    from_profile_id: string;
    interaction_type: 'connection' | 'introduction' | 'collaboration' | 'message';
    rating: FeedbackRating;
    note: string | null;
    created_at: string;
  };

  const [feedback] = await sql<FeedbackRow[]>`
    INSERT INTO interaction_feedback (
      edge_id,
      from_profile_id,
      interaction_type,
      rating,
      note
    ) VALUES (
      ${edgeId},
      ${fromProfileId},
      ${interactionType},
      ${rating},
      ${note || null}
    )
    RETURNING *
  `;

  // Update edge based on feedback
  if (rating === 'positive') {
    // Add positive signal
    await addTrustSignal(edgeId, 'collaboration', 0.2, 'بازخورد مثبت');
    // Increase strength
    await sql`
      UPDATE network_edges
      SET strength = LEAST(1, strength + 0.1)
      WHERE id = ${edgeId}
    `;
  } else if (rating === 'negative') {
    // Decrease strength
    await sql`
      UPDATE network_edges
      SET strength = GREATEST(0, strength - 0.1)
      WHERE id = ${edgeId}
    `;
  }

  return {
    id: feedback.id,
    edgeId: feedback.edge_id,
    fromProfileId: feedback.from_profile_id,
    interactionType: feedback.interaction_type,
    rating: feedback.rating,
    note: feedback.note || undefined,
    createdAt: feedback.created_at,
  };
}
