import { listConversionTypes } from "../converters/registry.js";
import { success } from "../lib/response.js";

/**
 * GET /conversion-types
 * Returns the list of available conversion types.
 */
export async function handler() {
  return success({ conversionTypes: listConversionTypes() });
}
