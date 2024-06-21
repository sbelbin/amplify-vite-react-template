import hasValue from '../optional/has_value';

import { MetadataBearer } from '@aws-sdk/types';

/**
 * Raises an exception when the specified response of AWS-SDK command has failed.
 *
 * @param response: The AWS-SDK command's response.
 *
 * @remarks The intent is standardizing how errors are handled so that the application logic
 *          can catch & handle specific categories of exceptions instead of maintaining a
 *          suite of error handling specific to cloud provider or context.
 *
 *          This is based on the HTTP status code needs to be within the range 200 to 299 range,
 *          otherwise it's considered as being an error.
 *
 *          This will be adapted as needed, since some status codes might ne consider as a
 *          warning more so than an exception.
 */
export function assertAWSResponseMetaData(response: MetadataBearer): void {
  if (!hasValue(response.$metadata.httpStatusCode)) {
    throw new Error('An invalid HTTP response has occurred. http_status_code: unknown');
  }

  const httpStatusCode = response.$metadata.httpStatusCode!;

  if (httpStatusCode < 200 && httpStatusCode > 299) {
    throw new Error(`An invalid HTTP response has occurred. http_status_code: ${httpStatusCode}`);
  }
}

/**
 * Raises an exception when the specified response of AWS-SDK command has failed.
 *
 * @param response: The AWS-SDK command's response.
 * @return Response
 *
 * @remarks Returning the response allows coding as follows:
 *                const response = assertAWSResponse(await client.send(myCmd));
 */
export function assertAWSResponse<Response extends MetadataBearer>(response: Response): Response {
  assertAWSResponseMetaData(response);
  return response;
}
