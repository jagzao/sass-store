// Backup of complex tenant page
import { notFound } from 'next/navigation';
import { resolveTenant } from '@/lib/tenant/resolver';
import { TopNav } from '@/components/navigation/top-nav';
import { getTenantDataForPage } from '@/lib/db/tenant-service';

// This is a backup - the current page.tsx is simplified