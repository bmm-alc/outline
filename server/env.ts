/* eslint-disable @typescript-eslint/no-var-requires */

// Load the process environment variables
require("dotenv").config({
  silent: true,
});

import {
  validate,
  IsNotEmpty,
  IsUrl,
  IsOptional,
  IsByteLength,
  Equals,
  IsNumber,
  IsIn,
  IsEmail,
  IsBoolean,
  Contains,
  MaxLength,
} from "class-validator";
import { languages } from "@shared/i18n";
import { CannotUseWithout } from "@server/utils/validators";
import Deprecated from "./models/decorators/Deprecated";

export class Environment {
  private validationPromise;

  constructor() {
    this.validationPromise = validate(this);
  }

  /**
   * Allows waiting on the environment to be validated.
   *
   * @returns A promise that resolves when the environment is validated.
   */
  public validate() {
    return this.validationPromise;
  }

  /**
   * The current envionment name.
   */
  @IsIn(["development", "production", "staging", "test"])
  public ENVIRONMENT = process.env.NODE_ENV ?? "production";

  /**
   * The secret key is used for encrypting data. Do not change this value once
   * set or your users will be unable to login.
   */
  @IsByteLength(32, 64)
  public SECRET_KEY = `${process.env.SECRET_KEY}`;

  /**
   * The secret that should be passed to the cron utility endpoint to enable
   * triggering of scheduled tasks.
   */
  @IsNotEmpty()
  public UTILS_SECRET = `${process.env.UTILS_SECRET}`;

  /**
   * The url of the database.
   */
  @IsNotEmpty()
  @IsUrl({ require_tld: false, protocols: ["postgres"] })
  public DATABASE_URL = `${process.env.DATABASE_URL}`;

  /**
   * The url of the database pool.
   */
  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ["postgres"] })
  public DATABASE_CONNECTION_POOL_URL = `${process.env.DATABASE_CONNECTION_POOL_URL}`;

  /**
   * Database connection pool configuration.
   */
  @IsNumber()
  @IsOptional()
  public DATABASE_CONNECTION_POOL_MIN = this.toOptionalNumber(
    process.env.DATABASE_CONNECTION_POOL_MIN
  );

  /**
   * Database connection pool configuration.
   */
  @IsNumber()
  @IsOptional()
  public DATABASE_CONNECTION_POOL_MAX = this.toOptionalNumber(
    process.env.DATABASE_CONNECTION_POOL_MAX
  );

  /**
   * Set to "disable" to disable SSL connection to the database. This option is
   * passed through to Postgres. See:
   *
   * https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE
   */
  @IsIn(["disable", "allow", "require", "prefer", "verify-ca", "verify-full"])
  @IsOptional()
  public PGSSLMODE = process.env.PGSSLMODE;

  /**
   * The url of redis. Note that redis does not have a database after the port.
   */
  @IsOptional()
  @IsNotEmpty()
  @IsUrl({ require_tld: false, protocols: ["redis", "rediss", "ioredis"] })
  public REDIS_URL = process.env.REDIS_URL;

  /**
   * The fully qualified, external facing domain name of the server.
   */
  @IsNotEmpty()
  @IsUrl({ require_tld: false })
  public URL = `${process.env.URL}`;

  /**
   * If using a Cloudfront/Cloudflare distribution or similar it can be set below.
   * This will cause paths to javascript, stylesheets, and images to be updated to
   * the hostname defined in CDN_URL. In your CDN configuration the origin server
   * should be set to the same as URL.
   */
  @IsOptional()
  @IsUrl()
  public CDN_URL = process.env.CDN_URL;

  /**
   * The fully qualified, external facing domain name of the collaboration
   * service, if different (unlikely)
   */
  @IsUrl({ require_tld: false, protocols: ["http", "https", "ws", "wss"] })
  @IsOptional()
  public COLLABORATION_URL = process.env.COLLABORATION_URL;

  /**
   * The port that the server will listen on, defaults to 3000.
   */
  @IsNumber()
  @IsOptional()
  public PORT = this.toOptionalNumber(process.env.PORT);

  /**
   * Optional extra debugging. Comma separated
   */
  public DEBUG = `${process.env.DEBUG}`;

  /**
   * How many processes should be spawned. As a reasonable rule divide your
   * server's available memory by 512 for a rough estimate
   */
  @IsNumber()
  @IsOptional()
  public WEB_CONCURRENCY = this.toOptionalNumber(process.env.WEB_CONCURRENCY);

  /**
   * Base64 encoded private key if Outline is to perform SSL termination.
   */
  @IsOptional()
  @CannotUseWithout("SSL_CERT")
  public SSL_KEY = process.env.SSL_KEY;

  /**
   * Base64 encoded public certificate if Outline is to perform SSL termination.
   */
  @IsOptional()
  @CannotUseWithout("SSL_KEY")
  public SSL_CERT = process.env.SSL_CERT;

  /**
   * Should always be left unset in a self-hosted environment.
   */
  @Equals("hosted")
  @IsOptional()
  public DEPLOYMENT = process.env.DEPLOYMENT;

  /**
   * Custom company logo that displays on the authentication screen.
   */
  public TEAM_LOGO = process.env.TEAM_LOGO;

  /**
   * The default interface language. See translate.getoutline.com for a list of
   * available language codes and their percentage translated.
   */
  @IsIn(languages)
  public DEFAULT_LANGUAGE = process.env.DEFAULT_LANGUAGE ?? "en_US";

  /**
   * A comma separated list of which services should be enabled on this
   * instance – defaults to all.
   */
  public SERVICES =
    process.env.SERVICES ?? "collaboration,websockets,worker,web";

  /**
   * Auto-redirect to https in production. The default is true but you may set
   * to false if you can be sure that SSL is terminated at an external
   * loadbalancer.
   */
  @IsBoolean()
  public FORCE_HTTPS = Boolean(process.env.FORCE_HTTPS ?? "true");

  /**
   * Whether to support multiple subdomains in a single instance.
   */
  @IsBoolean()
  @Deprecated("The community edition of Outline does not support subdomains")
  public SUBDOMAINS_ENABLED = Boolean(
    process.env.SUBDOMAINS_ENABLED ?? "false"
  );

  /**
   * Should the installation send anonymized statistics to the maintainers.
   * Defaults to true.
   */
  @IsBoolean()
  public TELEMETRY = Boolean(
    process.env.ENABLE_UPDATES ?? process.env.TELEMETRY ?? "true"
  );

  /**
   * Because imports can be much larger than regular file attachments and are
   * deleted automatically we allow an optional separate limit on the size of
   * imports.
   */
  @IsNumber()
  public MAXIMUM_IMPORT_SIZE =
    this.toOptionalNumber(process.env.MAXIMUM_IMPORT_SIZE) ?? 5120000;

  /**
   * An optional comma separated list of allowed domains.
   */
  public ALLOWED_DOMAINS =
    process.env.ALLOWED_DOMAINS ?? process.env.GOOGLE_ALLOWED_DOMAINS;

  // Third-party services

  /**
   * The host of your SMTP server for enabling emails.
   */
  public SMTP_HOST = process.env.SMTP_HOST;

  /**
   * The port of your SMTP server.
   */
  @IsNumber()
  @IsOptional()
  public SMTP_PORT = this.toOptionalNumber(process.env.SMTP_PORT);

  /**
   * The username of your SMTP server, if any.
   */
  public SMTP_USERNAME = process.env.SMTP_USERNAME;

  /**
   * The password for the SMTP username, if any.
   */
  public SMTP_PASSWORD = process.env.SMTP_PASSWORD;

  /**
   * The email address from which emails are sent.
   */
  @IsEmail({ allow_display_name: true, allow_ip_domain: true })
  @IsOptional()
  public SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL;

  /**
   * The reply-to address for emails sent from Outline. If unset the from
   * address is used by default.
   */
  @IsEmail({ allow_display_name: true, allow_ip_domain: true })
  @IsOptional()
  public SMTP_REPLY_EMAIL = process.env.SMTP_REPLY_EMAIL;

  /**
   * Override the cipher used for SMTP SSL connections.
   */
  public SMTP_TLS_CIPHERS = process.env.SMTP_TLS_CIPHERS;

  /**
   * If true (the default) the connection will use TLS when connecting to server.
   * If false then TLS is used only if server supports the STARTTLS extension.
   *
   * Setting secure to false therefore does not mean that you would not use an
   * encrypted connection.
   */
  public SMTP_SECURE = Boolean(process.env.SMTP_SECURE ?? "true");

  /**
   * Sentry DSN for capturing errors and frontend performance.
   */
  @IsUrl()
  @IsOptional()
  public SENTRY_DSN = process.env.SENTRY_DSN;

  /**
   * A release SHA or other identifier for Sentry.
   */
  public RELEASE = process.env.RELEASE;

  /**
   * An optional host from which to load default avatars.
   */
  @IsUrl()
  public DEFAULT_AVATAR_HOST =
    process.env.DEFAULT_AVATAR_HOST ?? "https://tiley.herokuapp.com";

  /**
   * A Google Analytics tracking ID, only v3 supported at this time.
   */
  @Contains("UA-")
  @IsOptional()
  public GOOGLE_ANALYTICS_ID = process.env.GOOGLE_ANALYTICS_ID;

  /**
   * A DataDog API key for tracking server metrics.
   */
  public DD_API_KEY = process.env.DD_API_KEY;

  /**
   * Google OAuth2 client credentials. To enable authentication with Google.
   */
  @IsOptional()
  @CannotUseWithout("GOOGLE_CLIENT_SECRET")
  public GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

  @IsOptional()
  @CannotUseWithout("GOOGLE_CLIENT_ID")
  public GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

  /**
   * Slack OAuth2 client credentials. To enable authentication with Slack.
   */
  @IsOptional()
  @CannotUseWithout("SLACK_CLIENT_SECRET")
  public SLACK_CLIENT_ID = process.env.SLACK_CLIENT_ID ?? process.env.SLACK_KEY;

  @IsOptional()
  @CannotUseWithout("SLACK_CLIENT_ID")
  public SLACK_CLIENT_SECRET =
    process.env.SLACK_CLIENT_SECRET ?? process.env.SLACK_SECRET;

  /**
   * This is injected into the HTML page headers for Slack.
   */
  @IsOptional()
  @CannotUseWithout("SLACK_CLIENT_ID")
  public SLACK_VERIFICATION_TOKEN = process.env.SLACK_VERIFICATION_TOKEN;

  /**
   * This is injected into the slack-app-id header meta tag if provided.
   */
  @IsOptional()
  @CannotUseWithout("SLACK_CLIENT_ID")
  public SLACK_APP_ID = process.env.SLACK_APP_ID;

  /**
   * If enabled a "Post to Channel" button will be added to search result
   * messages inside of Slack. This also requires setup in Slack UI.
   */
  @IsOptional()
  @IsBoolean()
  public SLACK_MESSAGE_ACTIONS = Boolean(
    process.env.SLACK_MESSAGE_ACTIONS ?? "false"
  );

  /**
   * Azure OAuth2 client credentials. To enable authentication with Azure.
   */
  @IsOptional()
  @CannotUseWithout("AZURE_CLIENT_SECRET")
  public AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;

  @IsOptional()
  @CannotUseWithout("AZURE_CLIENT_ID")
  public AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;

  @IsOptional()
  @CannotUseWithout("AZURE_CLIENT_ID")
  public AZURE_RESOURCE_APP_ID = process.env.AZURE_RESOURCE_APP_ID;

  /**
   * OICD client credentials. To enable authentication with any
   * compatible provider.
   */
  @IsOptional()
  @CannotUseWithout("OIDC_CLIENT_SECRET")
  @CannotUseWithout("OIDC_AUTH_URI")
  @CannotUseWithout("OIDC_TOKEN_URI")
  @CannotUseWithout("OIDC_USERINFO_URI")
  @CannotUseWithout("OIDC_DISPLAY_NAME")
  public OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID;

  @IsOptional()
  @CannotUseWithout("OIDC_CLIENT_ID")
  public OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET;

  /**
   * The name of the OIDC provider, eg "GitLab" – this will be displayed on the
   * sign-in button and other places in the UI. The default value is:
   * "OpenID Connect".
   */
  @MaxLength(50)
  public OIDC_DISPLAY_NAME = process.env.OIDC_DISPLAY_NAME ?? "OpenID Connect";

  /**
   * The OIDC authorization endpoint.
   */
  @IsOptional()
  @IsUrl()
  public OIDC_AUTH_URI = process.env.OIDC_AUTH_URI;

  /**
   * The OIDC token endpoint.
   */
  @IsOptional()
  @IsUrl()
  public OIDC_TOKEN_URI = process.env.OIDC_TOKEN_URI;

  /**
   * The OIDC userinfo endpoint.
   */
  @IsOptional()
  @IsUrl()
  public OIDC_USERINFO_URI = process.env.OIDC_USERINFO_URI;

  /**
   * The OIDC profile field to use as the username. The default value is
   * "preferred_username".
   */
  public OIDC_USERNAME_CLAIM =
    process.env.OIDC_USERNAME_CLAIM ?? "preferred_username";

  /**
   * A space separated list of OIDC scopes to request. Defaults to "openid
   * profile email".
   */
  public OIDC_SCOPES = process.env.OIDC_SCOPES ?? "openid profile email";

  private toOptionalNumber(value: string | undefined) {
    return value ? parseInt(value, 10) : undefined;
  }
}

const env = new Environment();

export default env;
