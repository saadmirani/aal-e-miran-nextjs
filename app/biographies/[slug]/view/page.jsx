import ViewBiographyClient from './view-client';

// Force dynamic rendering - prevents static pre-rendering at build time
export const dynamic = 'force-dynamic';

export default function ViewBiography() {
   return <ViewBiographyClient />;
}
