import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';

const backend = defineBackend({
  auth,
  data
});

backend.addOutput({
  storage: {
    aws_region: "us-east-1",
    bucket_name: "veegix8iosdev140644-dev"
  },
});