/**
 * Validation utilities for family management forms
 */

// ============================================================
// FORM VALIDATION
// ============================================================

export const validatePersonForm = (formData) => {
   const errors = {};

   // Name validation
   if (!formData.name || formData.name.trim().length < 3) {
      errors.name = 'Name must be at least 3 characters';
   }

   // Gender validation
   if (!formData.gender || !['male', 'female'].includes(formData.gender)) {
      errors.gender = 'Gender is required (male or female)';
   }

   // Alive status validation
   if (formData.alive === null || formData.alive === undefined) {
      errors.alive = 'Please specify if person is alive or deceased';
   }

   // Date format validation (optional but if provided, should be reasonable)
   if (formData.dateOfBirth && !isValidDate(formData.dateOfBirth)) {
      errors.dateOfBirth = 'Invalid date format';
   }

   // Date of death is optional (even for deceased persons)
   if (formData.dateOfDeath && !isValidDate(formData.dateOfDeath)) {
      errors.dateOfDeath = 'Invalid date format';
   }

   return {
      isValid: Object.keys(errors).length === 0,
      errors
   };
};

export const validateFamilyForm = (formData) => {
   const errors = {};

   // Family name validation
   if (!formData.name || formData.name.trim().length < 3) {
      errors.name = 'Family name must be at least 3 characters';
   }

   // Qasba (slug) validation
   if (!formData.qasba || formData.qasba.trim().length < 2) {
      errors.qasba = 'Family identifier (qasba) is required';
   }

   // Check qasba format (only lowercase letters, numbers, hyphens)
   if (formData.qasba && !/^[a-z0-9-]+$/.test(formData.qasba)) {
      errors.qasba = 'Family identifier can only contain lowercase letters, numbers, and hyphens';
   }

   // Focus person is now optional - removed the validation here

   return {
      isValid: Object.keys(errors).length === 0,
      errors
   };
};

export const validateBurialForm = (formData) => {
   const errors = {};

   // Burial place is optional, but if provided, map URL is recommended
   if (formData.burialPlace && !formData.burialMapUrl) {
      // Not an error, just a warning - we'll handle this separately
   }

   // Validate Google Maps URL format
   if (formData.burialMapUrl) {
      if (!isValidGoogleMapsUrl(formData.burialMapUrl)) {
         errors.burialMapUrl = 'Invalid Google Maps URL';
      }
   }

   return {
      isValid: Object.keys(errors).length === 0,
      errors
   };
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export const isValidDate = (dateString) => {
   // Accept formats like: "600 CE", "04/03/625 CE", "28/01/661 CE/ 40 AH"
   // Very loose validation - just check it's not empty
   return dateString && dateString.trim().length > 0;
};

export const isValidGoogleMapsUrl = (url) => {
   return /^https:\/\/maps\.app\.goo\.gl\//.test(url) ||
      /^https:\/\/maps\.google\.com\//.test(url) ||
      /^https:\/\/www\.google\.com\/maps\//.test(url);
};

export const generateUniqueId = (existingIds = []) => {
   // Generate ID like "p001", "p002", etc.
   const numbers = existingIds
      .map(id => parseInt(id.replace('p', '')))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a);

   const nextNumber = (numbers[0] || 0) + 1;
   return `p${String(nextNumber).padStart(3, '0')}`;
};

export const sanitizeQasba = (name) => {
   return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
};

// ============================================================
// FORM DATA TRANSFORMATION
// ============================================================

export const formatPersonForApi = (formData) => {
   return {
      name: formData.name.trim(),
      gender: formData.gender,
      alive: formData.alive,
      is_lawald: Boolean(formData.isLawald),
      date_of_birth: formData.dateOfBirth?.trim() || null,
      date_of_death: formData.dateOfDeath?.trim() || null,
      place_of_birth: formData.placeOfBirth?.trim() || null,
      place_of_death: formData.placeOfDeath?.trim() || null,
      about: formData.about?.trim() || null,
      father_id: formData.fatherId || null,
      mother_id: formData.motherId || null,
      display_badge: formData.displayBadge?.trim() || null
   };
};

export const formatFamilyForApi = (formData) => {
   return {
      name: formData.name.trim(),
      qasba: formData.qasba.trim().toLowerCase(),
      focus_person_id: formData.focusPersonId,
      description: formData.description?.trim() || null,
      region: formData.region?.trim() || null
   };
};

export const formatBurialForApi = (formData) => {
   return {
      burial_place: formData.burialPlace?.trim() || null,
      burial_map_url: formData.burialMapUrl?.trim() || null
   };
};
