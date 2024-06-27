import {
  type ClientSchema,
  a,
  defineData
} from '@aws-amplify/backend';

const schema = a.schema({
  kindStoragePaths: a.enum([
    'aws-s3',
    'azure-blob'
  ]),
  storagePath: a.customType({
    kind: a.ref('kindStoragePaths').required(),
    region: a.string(),
    url: a.url().required()
  }),
  recordings: a
    .model({
      instituteId: a.string().required(),
      patientId: a.string().required(),
      sessionId: a.string().required(),
      startTimestamp: a.datetime().required(),
      finishTimestamp: a.datetime(),
      localTimeZone: a.string().required(),
      data: a.customType({
        folder: a.ref('storagePath')
      }),
      video: a.customType({
        channelARN: a.string(),
        channelName: a.string(),
        folder: a.ref('storagePath'),
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
