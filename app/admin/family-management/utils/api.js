/**
 * Family Management API Utilities
 * Handles all API calls for family-tree operations
 */

const AUTH_SESSION_EVENT = 'auth:session-expired';

function notifySessionExpired(message) {
   if (typeof window === 'undefined') return;
   window.dispatchEvent(new CustomEvent(AUTH_SESSION_EVENT, {
      detail: { message: message || 'Session expired. Please login again.' }
   }));
}

async function safeJson(response) {
   try {
      return await response.json();
   } catch {
      return {};
   }
}

function throwApiError(response, result, fallbackMessage) {
   const errorMessage = result?.error || fallbackMessage || 'Request failed';
   const authErrorPattern = /(session\s*expired|unauthorized|login\s*again)/i;

   if (response?.status === 401 || authErrorPattern.test(errorMessage)) {
      notifySessionExpired(errorMessage);
   }

   throw new Error(errorMessage);
}

// ============================================================
// FAMILY OPERATIONS
// ============================================================

export async function createFamily(familyData) {
   try {
      const response = await fetch('/api/admin/families', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify(familyData)
      });

      const result = await safeJson(response);
      if (!response.ok) throwApiError(response, result, 'Failed to create family');
      return result.data;
   } catch (error) {
      console.error('Create family error:', error);
      throw error;
   }
}

export async function updateFamily(familyId, familyData) {
   try {
      const response = await fetch(`/api/admin/families/${familyId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify(familyData)
      });

      const result = await safeJson(response);
      if (!response.ok) throwApiError(response, result, 'Failed to update family');
      return result.data;
   } catch (error) {
      console.error('Update family error:', error);
      throw error;
   }
}

export async function deleteFamily(familyId) {
   try {
      const response = await fetch(`/api/admin/families/${familyId}`, {
         method: 'DELETE',
         credentials: 'include'
      });

      if (!response.ok) {
         const result = await safeJson(response);
         throwApiError(response, result, 'Failed to delete family');
      }
      return { success: true };
   } catch (error) {
      console.error('Delete family error:', error);
      throw error;
   }
}

// ============================================================
// PERSON OPERATIONS
// ============================================================

export async function createPerson(personData) {
   const response = await fetch('/api/admin/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(personData)
   });
   const result = await safeJson(response);
   if (!response.ok) throwApiError(response, result, 'Failed to create person');
   return result.data;
}

export async function updatePerson(personId, personData) {
   try {
      const response = await fetch(`/api/admin/persons/${personId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify(personData)
      });

      const result = await safeJson(response);
      if (!response.ok) throwApiError(response, result, 'Failed to update person');
      return result.data;
   } catch (error) {
      console.error('Update person error:', error);
      throw error;
   }
}

export async function deletePerson(personId) {
   try {
      const response = await fetch(`/api/admin/persons/${personId}`, {
         method: 'DELETE',
         credentials: 'include'
      });

      if (!response.ok) {
         const result = await safeJson(response);
         throwApiError(response, result, 'Failed to delete person');
      }
      return { success: true };
   } catch (error) {
      console.error('Delete person error:', error);
      throw error;
   }
}

// ============================================================
// MARRIAGE OPERATIONS
// ============================================================

export async function createMarriage(spouse1Id, spouse2Id, marriageData = {}) {
   try {
      const response = await fetch('/api/admin/marriages', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify({
            spouse1Id,
            spouse2Id,
            ...marriageData
         })
      });

      const result = await safeJson(response);
      if (!response.ok) throwApiError(response, result, 'Failed to create marriage');
      return result.data;
   } catch (error) {
      console.error('Create marriage error:', error);
      throw error;
   }
}

export async function deleteMarriage(marriageId) {
   try {
      const response = await fetch(`/api/admin/marriages/${marriageId}`, {
         method: 'DELETE',
         credentials: 'include'
      });

      if (!response.ok) {
         const result = await safeJson(response);
         throwApiError(response, result, 'Failed to delete marriage');
      }
      return { success: true };
   } catch (error) {
      console.error('Delete marriage error:', error);
      throw error;
   }
}

// ============================================================
// BURIAL OPERATIONS
// ============================================================

export async function createBurialInfo(personId, burialData) {
   try {
      const response = await fetch('/api/admin/burial-info', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify({
            personId,
            ...burialData
         })
      });

      const result = await safeJson(response);
      if (!response.ok) throwApiError(response, result, 'Failed to create burial info');
      return result.data;
   } catch (error) {
      console.error('Create burial info error:', error);
      throw error;
   }
}

export async function updateBurialInfo(burialInfoId, burialData) {
   try {
      const response = await fetch(`/api/admin/burial-info/${burialInfoId}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         credentials: 'include',
         body: JSON.stringify(burialData)
      });

      const result = await safeJson(response);
      if (!response.ok) throwApiError(response, result, 'Failed to update burial info');
      return result.data;
   } catch (error) {
      console.error('Update burial info error:', error);
      throw error;
   }
}

export async function fetchBurialInfo(personId) {
   try {
      const response = await fetch(`/api/family-tree/person/${personId}`, {
         cache: 'no-store',
         headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.burialInfo || data.burial || null;
   } catch {
      return null;
   }
}

// ============================================================
// FETCH OPERATIONS
// ============================================================

export async function fetchAllFamilies() {
   const response = await fetch(`/api/family-tree/families?_ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
   });
   if (!response.ok) throw new Error('Failed to fetch families');
   const result = await response.json();
   return result.data || [];
}

export async function fetchFamilyData(qasba) {
   const response = await fetch(`/api/family-tree/family/${qasba}?_ts=${Date.now()}`, {
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
   });
   if (!response.ok) throw new Error('Failed to fetch family data');
   return await response.json();
}

export async function searchPersons(query) {
   try {
      const searchUrl = `/api/family-tree/search?q=${encodeURIComponent(query)}&_ts=${Date.now()}`;
      const response = await fetch(searchUrl, {
         cache: 'no-store',  // ✅ Disable browser cache
         headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
         }
      });
      if (!response.ok) throw new Error('Failed to search persons');
      const result = await response.json();
      return result.data || [];
   } catch (error) {
      // Retry once for transient dev-server reconnect/network hiccups.
      try {
         const retryUrl = `/api/family-tree/search?q=${encodeURIComponent(query)}&_ts=${Date.now()}&retry=1`;
         const retryResponse = await fetch(retryUrl, {
            cache: 'no-store',
            headers: {
               'Cache-Control': 'no-cache, no-store, must-revalidate',
               'Pragma': 'no-cache'
            }
         });
         if (!retryResponse.ok) throw new Error('Failed to search persons');
         const retryResult = await retryResponse.json();
         return retryResult.data || [];
      } catch (retryError) {
         console.error('Search persons error:', retryError);
         throw retryError;
      }
   }
}

export async function searchPersonsInFamily(query, familyId, limit = 20) {
   try {
      if (!familyId) return [];
      const response = await fetch(
         `/api/family-tree/search?q=${encodeURIComponent(query)}&familyId=${encodeURIComponent(familyId)}&limit=${limit}`,
         {
            cache: 'no-store',
            headers: {
               'Cache-Control': 'no-cache, no-store, must-revalidate',
               'Pragma': 'no-cache'
            }
         }
      );
      if (!response.ok) throw new Error('Failed to search persons in source family');
      const result = await response.json();
      return result.data || [];
   } catch (error) {
      console.error('Search persons in family error:', error);
      throw error;
   }
}

export async function previewFamilyChainImport(payload) {
   const response = await fetch('/api/admin/family-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...payload, action: 'preview' })
   });
   const result = await safeJson(response);
   if (!response.ok) throwApiError(response, result, 'Failed to preview import chain');
   return result.data;
}

export async function importFamilyChain(payload) {
   const response = await fetch('/api/admin/family-import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ ...payload, action: 'import' })
   });
   const result = await safeJson(response);
   if (!response.ok) throwApiError(response, result, 'Failed to import chain');
   return result.data;
}

export async function fetchPersonDetails(personId) {
   try {
      const normalizedId = String(personId || '').trim();
      if (!normalizedId || normalizedId === '=' || normalizedId === 'undefined' || normalizedId === 'null') {
         throw new Error('Invalid person id for details request');
      }

      const response = await fetch(`/api/family-tree/person/${encodeURIComponent(normalizedId)}?_ts=${Date.now()}`, {
         cache: 'no-store',  // ✅ Disable browser cache
         headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
         }
      });
      if (!response.ok) throw new Error('Failed to fetch person details');
      const result = await response.json();
      return result;
   } catch (error) {
      console.error('Fetch person details error:', error);
      throw error;
   }
}

// ============================================================
// FAMILY-PERSONS OPERATIONS
// ============================================================

export async function addPersonToFamily(familyId, personId) {
   const response = await fetch('/api/admin/family-persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ familyId, personId })
   });
   const result = await safeJson(response);
   if (!response.ok) throwApiError(response, result, 'Failed to add person to family');
   return result.data;
}

export async function removePersonFromFamily(familyId, personId) {
   const response = await fetch('/api/admin/family-persons/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ familyId, personId })
   });
   const result = await safeJson(response);
   if (!response.ok) throwApiError(response, result, 'Failed to remove person from family');
   return result;
}
