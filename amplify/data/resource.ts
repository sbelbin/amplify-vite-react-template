import {
  type ClientSchema,
  a,
  defineData
} from '@aws-amplify/backend';

const schema = a.schema({
  recordings: a
    .model({
      instituteId: a.string().required(),
      patientId: a.string().required(),
      sessionId: a.string().required(),
      startTimestamp: a.datetime().required(),
      finishTimestamp: a.datetime(),
      localTimeZone: a.string().required(),
      data: a.customType({
        folder: a.customType({
          kind: a.enum(['aws-s3', 'azure-blob']),
          region: a.string(),
          url: a.url().required()
        })
      }),
      video: a.customType({
        channelARN: a.string(),
        channelName: a.string(),
        folder: a.customType({
          kind: a.enum(['aws-s3', 'azure-blob']),
          region: a.string(),
          url: a.url().required()
        }),
        playbackURL: a.url(),
        streamId: a.string(),
        streamSessionId: a.string()
      })
    })
    .authorization((allow) => [
      allow.authenticated('identityPool'),
      // allow.publicApiKey(),
      allow.authenticated()
    ])
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool'
  }
});
