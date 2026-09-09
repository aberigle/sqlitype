import { ValueError } from "@sinclair/typebox/errors";
export class ValidationException extends Error {

  constructor(
    public errors: Array<ValueError>
  ) {
    super(`Validation error`)
  }
}