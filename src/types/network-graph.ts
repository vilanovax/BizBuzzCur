/**
 * Network Graph & Trust Signals Types
 *
 * BizBuzz از «پروفایل هوشمند» می‌ره به «شبکه‌ی قابل اعتماد»
 * نه کانکشن عددی، نه فالو — گراف معنادار + سیگنال اعتماد
 *
 * Design Principles:
 * 1. Profile-first (connections around identity, not messages)
 * 2. Explainable (every suggestion = reason)
 * 3. Non-vanity (no followers, no likes count)
 * 4. Privacy-first (no revealing sensitive details)
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Edge type - how the connection was formed
 */
export type NetworkEdgeType =
  | 'direct'       // درخواست مستقیم
  | 'introduced'   // معرفی شده
  | 'collaborated' // همکاری کرده
  | 'endorsed';    // تأیید مهارت

/**
 * Relationship context
 */
export type NetworkContext =
  | 'network'  // شبکه‌سازی عمومی
  | 'team'     // تیم/همکار
  | 'mentor'   // منتور
  | 'event'    // آشنایی در رویداد
  | 'project'; // پروژه مشترک

/**
 * Edge status
 */
export type EdgeStatus =
  | 'pending'  // در انتظار
  | 'active'   // فعال
  | 'declined' // رد شده
  | 'blocked'; // بلاک شده

/**
 * Trust signal type
 */
export type TrustSignalType =
  | 'shared_project'     // پروژه مشترک
  | 'mutual_connection'  // کانکشن مشترک
  | 'endorsement'        // تأیید مهارت
  | 'intro_history'      // سابقه معرفی موفق
  | 'reputation'         // شهرت خارجی
  | 'collaboration';     // همکاری فعال

/**
 * Connection request type
 */
export type ConnectionRequestType =
  | 'direct'       // مستقیم
  | 'introduction'; // از طریق معرفی

/**
 * Interaction feedback rating
 */
export type FeedbackRating = 'positive' | 'negative' | 'neutral';

/**
 * Network intent for decision engine
 */
export type NetworkIntent =
  | 'connect'     // ارتباط
  | 'introduce'   // معرفی
  | 'collaborate' // همکاری
  | 'mentor';     // منتورینگ

/**
 * Recommendation decision
 */
export type RecommendationDecision = 'do' | 'consider' | 'hold';

// =============================================================================
// NETWORK NODE
// =============================================================================

/**
 * Network node (profile in graph context)
 */
export interface NetworkNode {
  profileId: string;
  name: string;
  headline?: string;
  photoUrl?: string;
  roleTags: string[];    // dev, founder, mentor...
  domains: string[];     // fintech, ai, edtech...
}

// =============================================================================
// NETWORK EDGE
// =============================================================================

/**
 * Trust signal
 */
export interface TrustSignal {
  id: string;
  signalType: TrustSignalType;
  weight: number;        // 0-1
  evidence?: string;
  referenceId?: string;
  referenceType?: string;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Network edge (relationship between profiles)
 */
export interface NetworkEdge {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  edgeType: NetworkEdgeType;
  context: NetworkContext;
  strength: number;       // 0-1
  trust: number;          // 0-1
  status: EdgeStatus;
  introducedBy?: string;
  introductionMessage?: string;
  signals: TrustSignal[];
  createdAt: string;
  updatedAt: string;
  lastInteractionAt?: string;
}

/**
 * Connection with profile info
 */
export interface ConnectionWithProfile extends NetworkEdge {
  profile: NetworkNode;
  mutualCount: number;
}

// =============================================================================
// CONNECTION REQUESTS
// =============================================================================

/**
 * Connection request
 */
export interface ConnectionRequest {
  id: string;
  fromProfileId: string;
  toProfileId: string;
  requestType: ConnectionRequestType;
  message?: string;
  introducerProfileId?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  respondedAt?: string;
  expiresAt: string;
}

/**
 * Connection request with profile info
 */
export interface ConnectionRequestWithProfile extends ConnectionRequest {
  fromProfile: NetworkNode;
  introducerProfile?: NetworkNode;
}

// =============================================================================
// NETWORK DECISION ENGINE
// =============================================================================

/**
 * Network context for decision engine
 */
export interface NetworkDecisionContext {
  intent: NetworkIntent;
  targetProfileId?: string;
}

/**
 * Introduction path
 */
export interface IntroductionPath {
  viaProfileId: string;
  viaProfileName: string;
  trustScore: number;
  reason: string;
}

/**
 * Decision reason
 */
export interface NetworkDecisionReason {
  type: 'trust' | 'mutual' | 'domain' | 'history';
  message: string;
}

/**
 * Network decision output
 */
export interface NetworkDecision {
  recommendation: RecommendationDecision;
  confidence: number;
  reasons: NetworkDecisionReason[];
  suggestedPath?: IntroductionPath[];
  trustBreakdown?: TrustBreakdown;
}

/**
 * Trust breakdown for explainability
 */
export interface TrustBreakdown {
  collaboration: number;    // 35%
  mutuals: number;          // 20%
  endorsement: number;      // 20%
  interactionQuality: number; // 15%
  freshness: number;        // 10%
  total: number;
}

// =============================================================================
// NETWORK DISCOVERY
// =============================================================================

/**
 * Connection suggestion
 */
export interface ConnectionSuggestion {
  profile: NetworkNode;
  trustScore: number;
  mutualCount: number;
  reasons: NetworkDecisionReason[];
  suggestedPath?: IntroductionPath;
  badge?: 'high_trust' | 'good_fit' | 'mutual_heavy';
}

/**
 * Network health score (Premium)
 */
export interface NetworkHealthScore {
  totalConnections: number;
  activeConnections: number;
  averageTrust: number;
  diversityScore: number;   // Domain diversity
  strengthScore: number;    // Average relationship strength
  suggestions: string[];
}

// =============================================================================
// INTERACTION FEEDBACK
// =============================================================================

/**
 * Interaction feedback
 */
export interface InteractionFeedback {
  id: string;
  edgeId: string;
  fromProfileId: string;
  interactionType: 'connection' | 'introduction' | 'collaboration' | 'message';
  rating: FeedbackRating;
  note?: string;
  createdAt: string;
}

// =============================================================================
// TRUST SCORE WEIGHTS
// =============================================================================

export const TRUST_SCORE_WEIGHTS = {
  collaboration: 0.35,
  mutuals: 0.20,
  endorsement: 0.20,
  interactionQuality: 0.15,
  freshness: 0.10,
} as const;

// =============================================================================
// LABELS (Persian)
// =============================================================================

export const EDGE_TYPE_LABELS: Record<NetworkEdgeType, string> = {
  direct: 'ارتباط مستقیم',
  introduced: 'معرفی شده',
  collaborated: 'همکار',
  endorsed: 'تأیید شده',
};

export const NETWORK_CONTEXT_LABELS: Record<NetworkContext, string> = {
  network: 'شبکه‌سازی',
  team: 'تیم',
  mentor: 'منتورینگ',
  event: 'رویداد',
  project: 'پروژه',
};

export const EDGE_STATUS_LABELS: Record<EdgeStatus, string> = {
  pending: 'در انتظار',
  active: 'فعال',
  declined: 'رد شده',
  blocked: 'بلاک شده',
};

export const TRUST_SIGNAL_LABELS: Record<TrustSignalType, string> = {
  shared_project: 'پروژه مشترک',
  mutual_connection: 'کانکشن مشترک',
  endorsement: 'تأیید مهارت',
  intro_history: 'سابقه معرفی موفق',
  reputation: 'شهرت',
  collaboration: 'همکاری فعال',
};

export const NETWORK_INTENT_LABELS: Record<NetworkIntent, string> = {
  connect: 'ارتباط',
  introduce: 'معرفی',
  collaborate: 'همکاری',
  mentor: 'منتورینگ',
};

export const RECOMMENDATION_LABELS: Record<RecommendationDecision, string> = {
  do: 'پیشنهاد می‌شود',
  consider: 'قابل بررسی',
  hold: 'صبر کنید',
};

export const CONNECTION_BADGE_LABELS: Record<string, string> = {
  high_trust: 'اعتماد بالا',
  good_fit: 'تناسب خوب',
  mutual_heavy: 'کانکشن‌های مشترک زیاد',
};

// =============================================================================
// UX COPY (Persian)
// =============================================================================

export const NETWORK_COPY = {
  discover: {
    title: 'پیشنهاد ارتباط',
    subtitle: 'بر اساس اعتماد، نه محبوبیت',
    emptyState: 'هنوز پیشنهادی نداریم',
  },
  connect: {
    directButton: 'ارتباط مستقیم',
    introButton: 'درخواست معرفی',
    introSuggested: 'پیشنهاد شده',
    introReason: 'بهتره از طریق {name} معرفی بشی—اعتماد شبکه‌ای بالاتره (+{percent}٪)',
  },
  request: {
    pendingTitle: 'درخواست‌های ارتباط',
    acceptButton: 'قبول',
    declineButton: 'رد',
    messageLabel: 'پیام',
  },
  trust: {
    title: 'چرا این ارتباط؟',
    trustLabel: 'اعتماد',
  },
  feedback: {
    title: 'آیا این ارتباط مفید بود؟',
    positiveButton: 'بله',
    negativeButton: 'خیر',
  },
  health: {
    title: 'سلامت شبکه',
    connectionsLabel: 'ارتباط‌ها',
    trustLabel: 'میانگین اعتماد',
    diversityLabel: 'تنوع',
  },
};
