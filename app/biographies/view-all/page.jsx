import ViewAllBiographiesClient from './view-all-client';

// Force dynamic rendering - prevents static pre-rendering at build time
export const dynamic = 'force-dynamic';

export default function ViewAllBiographies() {
   return <ViewAllBiographiesClient />;
}
