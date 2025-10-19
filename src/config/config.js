const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");

dotenv.config({ path: path.join(__dirname, "../../.env") });

const envVarsSchema = Joi.object()
  .keys({
    HOST: Joi.string(),
    PORT: Joi.number().default(5000),
    NODE_ENV: Joi.string()
      .valid(
        "production",
        "staging",
        "development",
        "dev",
        "beta",
        "local",
        "test"
      )
      .required(),
  })
  .unknown();
const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  appState: {
    down: envVars.APP_STATE != 1,
    downMsg: envVars.APP_DOWN_MESSAGE,
  },
  cardano: {
    adminPrivateKey: envVars.CARDANO_ADMIN_PRIVATE_KEY,
    blockfrost: {
      baseUrl: envVars.BLOCKFROST_BASE_URL,
      projectId: envVars.BLOCKFROST_PROJECT_ID,
    },
    koios: {
      secretToken: envVars.KOIOS_SECRET_TOKEN,
    },
    network: envVars.CARDANO_NETWORK,
  },
  env: envVars.NODE_ENV,
  errorHandling: {
    alwaysStackTrace: envVars.ERROR_ALWAYS_STACK_TRACE == 1,
  },
  frontendUrl: envVars.FRONTEND_URL,
  frontendUrl2: envVars.FRONTEND_URL_2,
  evm: {
    adminPrivateKey: envVars.EVM_ADMIN_PRIVATE_KEY,
    rpc: envVars.EVM_CHAIN_RPC,
    wss: envVars.EVM_CHAIN_WSS,
  },
  logger: {
    file: envVars.LOG_FILE,
  },
  port: envVars.PORT,
};
