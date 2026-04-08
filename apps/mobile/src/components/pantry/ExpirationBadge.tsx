import React from 'react';
import { Badge } from '../ui/Badge';
import { getExpiryStatus, getExpiryLabel } from '../../utils/date';

interface ExpirationBadgeProps {
  expirationDate?: string;
}

export function ExpirationBadge({ expirationDate }: ExpirationBadgeProps) {
  if (!expirationDate) return null;

  const status = getExpiryStatus(expirationDate);
  const label = getExpiryLabel(expirationDate);

  const variantMap = {
    expired: 'danger',
    expiring: 'warning',
    warning: 'warning',
    ok: 'success',
    unknown: 'neutral',
  } as const;

  return <Badge label={label} variant={variantMap[status]} />;
}
