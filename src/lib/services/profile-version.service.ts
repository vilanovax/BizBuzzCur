/**
 * Profile Version Service
 *
 * Manages profile versions - different views of the same identity.
 * One Profile → Many Versions
 *
 * Key principles:
 * - Data is NEVER duplicated
 * - Version only controls: visibility, emphasis, ordering
 * - Every version is explainable
 */

import sql from '@/lib/db';
import type {
  ProfileVersion,
  ProfileVersionWithShare,
  ProfileVersionContext,
  VisibilityRule,
  EmphasisRule,
  OrderingRule,
  VersionReason,
  CreateProfileVersionRequest,
  UpdateProfileVersionRequest,
} from '@/types/profile-version';
import {
  DEFAULT_VISIBILITY_BY_CONTEXT,
  DEFAULT_ORDERING_BY_CONTEXT,
} from '@/types/profile-version';

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Get all versions for a profile
 */
export async function getProfileVersions(profileId: string): Promise<ProfileVersion[]> {
  const versions = await sql<ProfileVersion[]>`
    SELECT * FROM profile_versions
    WHERE profile_id = ${profileId}
    ORDER BY is_default DESC, created_at ASC
  `;
  return versions;
}

/**
 * Get a specific version by ID
 */
export async function getProfileVersionById(versionId: string): Promise<ProfileVersion | null> {
  const [version] = await sql<ProfileVersion[]>`
    SELECT * FROM profile_versions
    WHERE id = ${versionId}
  `;
  return version || null;
}

/**
 * Get a version by profile ID and slug
 */
export async function getProfileVersionBySlug(
  profileId: string,
  slug: string
): Promise<ProfileVersion | null> {
  const [version] = await sql<ProfileVersion[]>`
    SELECT * FROM profile_versions
    WHERE profile_id = ${profileId}
      AND slug = ${slug}
  `;
  return version || null;
}

/**
 * Get the default version for a profile
 */
export async function getDefaultVersion(profileId: string): Promise<ProfileVersion | null> {
  const [version] = await sql<ProfileVersion[]>`
    SELECT * FROM profile_versions
    WHERE profile_id = ${profileId}
      AND is_default = TRUE
  `;
  return version || null;
}

/**
 * Get version with computed share URL
 */
export async function getVersionWithShare(
  versionId: string,
  profileSlug: string
): Promise<ProfileVersionWithShare | null> {
  const version = await getProfileVersionById(versionId);
  if (!version) return null;

  const shareUrl = version.slug
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://bizbuzz.me'}/${profileSlug}/${version.slug}`
    : null;

  return {
    ...version,
    share_url: shareUrl,
  };
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Create a new profile version
 */
export async function createProfileVersion(
  request: CreateProfileVersionRequest
): Promise<ProfileVersion> {
  const {
    profile_id,
    name,
    context,
    visibility_rules = DEFAULT_VISIBILITY_BY_CONTEXT[context] || [],
    emphasis_rules = [],
    ordering_rules = DEFAULT_ORDERING_BY_CONTEXT[context] || [],
    slug,
    is_default = false,
    expires_at,
  } = request;

  // If setting as default, unset current default first
  if (is_default) {
    await sql`
      UPDATE profile_versions
      SET is_default = FALSE
      WHERE profile_id = ${profile_id}
        AND is_default = TRUE
    `;
  }

  const [version] = await sql<ProfileVersion[]>`
    INSERT INTO profile_versions (
      profile_id,
      name,
      type,
      context,
      visibility_rules,
      emphasis_rules,
      ordering_rules,
      slug,
      is_default,
      expires_at,
      auto_generated,
      reasons
    ) VALUES (
      ${profile_id},
      ${name},
      'user',
      ${context},
      ${JSON.stringify(visibility_rules)},
      ${JSON.stringify(emphasis_rules)},
      ${JSON.stringify(ordering_rules)},
      ${slug || null},
      ${is_default},
      ${expires_at || null},
      FALSE,
      '[]'
    )
    RETURNING *
  `;

  return version;
}

/**
 * Update a profile version
 */
export async function updateProfileVersion(
  versionId: string,
  request: UpdateProfileVersionRequest
): Promise<ProfileVersion | null> {
  const version = await getProfileVersionById(versionId);
  if (!version) return null;

  // If setting as default, unset current default first
  if (request.is_default && !version.is_default) {
    await sql`
      UPDATE profile_versions
      SET is_default = FALSE
      WHERE profile_id = ${version.profile_id}
        AND is_default = TRUE
    `;
  }

  const [updated] = await sql<ProfileVersion[]>`
    UPDATE profile_versions
    SET
      name = COALESCE(${request.name || null}, name),
      context = COALESCE(${request.context || null}, context),
      visibility_rules = COALESCE(${request.visibility_rules ? JSON.stringify(request.visibility_rules) : null}, visibility_rules),
      emphasis_rules = COALESCE(${request.emphasis_rules ? JSON.stringify(request.emphasis_rules) : null}, emphasis_rules),
      ordering_rules = COALESCE(${request.ordering_rules ? JSON.stringify(request.ordering_rules) : null}, ordering_rules),
      slug = COALESCE(${request.slug || null}, slug),
      is_default = COALESCE(${request.is_default ?? null}, is_default),
      expires_at = COALESCE(${request.expires_at || null}, expires_at),
      updated_at = NOW()
    WHERE id = ${versionId}
    RETURNING *
  `;

  return updated || null;
}

/**
 * Delete a profile version
 * Cannot delete the default version
 */
export async function deleteProfileVersion(versionId: string): Promise<boolean> {
  const version = await getProfileVersionById(versionId);
  if (!version) return false;

  // Cannot delete default version
  if (version.is_default) {
    throw new Error('Cannot delete the default version');
  }

  await sql`
    DELETE FROM profile_versions
    WHERE id = ${versionId}
  `;

  return true;
}

/**
 * Set a version as default
 */
export async function setDefaultVersion(versionId: string): Promise<ProfileVersion | null> {
  const version = await getProfileVersionById(versionId);
  if (!version) return null;

  // Unset current default
  await sql`
    UPDATE profile_versions
    SET is_default = FALSE
    WHERE profile_id = ${version.profile_id}
      AND is_default = TRUE
  `;

  // Set new default
  const [updated] = await sql<ProfileVersion[]>`
    UPDATE profile_versions
    SET is_default = TRUE, updated_at = NOW()
    WHERE id = ${versionId}
    RETURNING *
  `;

  return updated || null;
}

/**
 * Increment view count for a version
 */
export async function incrementVersionViewCount(versionId: string): Promise<void> {
  await sql`
    UPDATE profile_versions
    SET view_count = view_count + 1
    WHERE id = ${versionId}
  `;
}

// =============================================================================
// CONTEXT-BASED VERSIONING
// =============================================================================

/**
 * Get or create a system version for a specific context
 * Used when profile is requested in a specific context
 */
export async function getOrCreateContextVersion(
  profileId: string,
  context: ProfileVersionContext
): Promise<ProfileVersion> {
  // Check if system version exists for this context
  const [existing] = await sql<ProfileVersion[]>`
    SELECT * FROM profile_versions
    WHERE profile_id = ${profileId}
      AND context = ${context}
      AND type = 'system'
  `;

  if (existing) {
    return existing;
  }

  // Create new system version
  const contextNames: Record<ProfileVersionContext, string> = {
    public: 'نسخه عمومی',
    network: 'نسخه شبکه‌سازی',
    team: 'نسخه تیمی',
    investor: 'نسخه سرمایه‌گذار',
    job: 'نسخه شغلی',
    custom: 'نسخه سفارشی',
  };

  const [version] = await sql<ProfileVersion[]>`
    INSERT INTO profile_versions (
      profile_id,
      name,
      type,
      context,
      visibility_rules,
      emphasis_rules,
      ordering_rules,
      auto_generated,
      reasons
    ) VALUES (
      ${profileId},
      ${contextNames[context]},
      'system',
      ${context},
      ${JSON.stringify(DEFAULT_VISIBILITY_BY_CONTEXT[context] || [])},
      '[]',
      ${JSON.stringify(DEFAULT_ORDERING_BY_CONTEXT[context] || [])},
      TRUE,
      ${JSON.stringify(generateContextReasons(context))}
    )
    RETURNING *
  `;

  return version;
}

/**
 * Generate explainability reasons for a context
 */
function generateContextReasons(context: ProfileVersionContext): VersionReason[] {
  const reasonMap: Record<ProfileVersionContext, VersionReason[]> = {
    public: [
      { type: 'context_fit', message: 'این نسخه برای اشتراک‌گذاری عمومی بهینه شده.' },
    ],
    network: [
      { type: 'context_fit', message: 'اطلاعات تماس محدود شده برای حفظ حریم خصوصی.' },
      { type: 'context_fit', message: 'مهارت‌ها برای معرفی سریع‌تر پررنگ شده‌اند.' },
    ],
    team: [
      { type: 'context_fit', message: 'تحصیلات پنهان شده چون برای هم‌تیمی‌ها کمتر مهم است.' },
      { type: 'context_fit', message: 'پروژه‌ها و مهارت‌های عملی پررنگ شده‌اند.' },
    ],
    investor: [
      { type: 'context_fit', message: 'سوابق کاری و پروژه‌ها در اولویت هستند.' },
      { type: 'context_fit', message: 'اطلاعات تماس برای ارتباط اولیه محدود شده.' },
    ],
    job: [
      { type: 'context_fit', message: 'سوابق و مهارت‌ها برای کارفرما بهینه شده‌اند.' },
    ],
    custom: [],
  };

  return reasonMap[context] || [];
}

// =============================================================================
// VERSION ANALYTICS
// =============================================================================

/**
 * Get version analytics for a profile
 */
export async function getVersionAnalytics(profileId: string): Promise<{
  total_versions: number;
  total_views: number;
  most_viewed: ProfileVersion | null;
  by_context: Record<ProfileVersionContext, number>;
}> {
  const versions = await getProfileVersions(profileId);

  const totalViews = versions.reduce((sum, v) => sum + v.view_count, 0);
  const mostViewed = versions.length > 0
    ? versions.reduce((max, v) => (v.view_count > max.view_count ? v : max))
    : null;

  const byContext: Record<ProfileVersionContext, number> = {
    public: 0,
    network: 0,
    team: 0,
    investor: 0,
    job: 0,
    custom: 0,
  };

  versions.forEach((v) => {
    byContext[v.context] = (byContext[v.context] || 0) + 1;
  });

  return {
    total_versions: versions.length,
    total_views: totalViews,
    most_viewed: mostViewed,
    by_context: byContext,
  };
}
