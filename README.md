# Cloudsec CLI

A command-line tool for managing Google Cloud Platform (GCP) secrets across multiple environments. Cloudsec simplifies secret management by providing a unified interface to create, read, update, and delete secrets stored in GCP Secret Manager.

## Features

- 🔐 **Multi-environment support** - Manage secrets across dev, staging, and production environments
- 📦 **Bulk operations** - Import and export secrets from JSON files
- 🔄 **Environment variable sync** - Easily sync secrets to local environment variables
- 🏷️ **Automatic labeling** - Secrets are automatically tagged with environment metadata
- ⚡ **Fast and efficient** - Direct integration with GCP Secret Manager API

## Installation

### Prerequisites

- Node.js >= 18.0.0
- GCP account with Secret Manager API enabled
- GCP authentication configured (via `gcloud auth application-default login` or service account)

### Install from npm

```bash
npm install -g cloudsec
```

After installation, you can use the `cloudsec` command from anywhere.

### Install from source

```bash
cd cli
npm install
npm run build
npm link  # Optional: link globally for `cloudsec` command
```

### Development

```bash
npm run dev  # Run with tsx for development
```

## Quick Start

### 1. Initialize Configuration

First, initialize Cloudsec with your GCP project settings:

```bash
cloudsec init
```

This creates a `.cloudsec.yaml` configuration file in your current directory. You'll be prompted to configure:
- GCP project IDs for each environment
- GCP regions
- Secret name prefixes
- Default environment

### 2. Configure GCP Authentication

Ensure you're authenticated with GCP:

```bash
gcloud auth application-default login
```

Or set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to a service account key file.

### 3. Start Managing Secrets

```bash
# Set a secret
cloudsec set DATABASE_URL "postgresql://localhost:5432/mydb" -e dev

# Get a secret
cloudsec get DATABASE_URL -e dev

# List all secrets
cloudsec list -e dev

# Sync secrets to local environment
cloudsec env -e dev --export
```

## Configuration

The `.cloudsec.yaml` file defines your environments and GCP settings:

```yaml
environments:
  - name: dev
    projectId: your-dev-project-id
    region: us-central1
    prefix: dev-
    labels:
      environment: development
      managed_by: cloudsec
  - name: staging
    projectId: your-staging-project-id
    region: us-central1
    prefix: staging-
    labels:
      environment: staging
      managed_by: cloudsec
  - name: prod
    projectId: your-prod-project-id
    region: us-central1
    prefix: prod-
    labels:
      environment: production
      managed_by: cloudsec
defaultEnvironment: dev
defaultProject: your-default-project-id
defaultRegion: us-central1
```

## Commands

### `init`

Initialize Cloudsec configuration in the current directory.

```bash
cloudsec init
cloudsec init --force  # Overwrite existing configuration
```

### `list` / `ls`

List all secrets for an environment.

```bash
cloudsec list
cloudsec list -e dev
cloudsec ls -e prod
```

### `get <key>`

Retrieve the value of a specific secret.

```bash
cloudsec get DATABASE_URL
cloudsec get API_KEY -e prod
```

### `set <key> [value]`

Set or update a secret value. If no value is provided, you'll be prompted to enter it securely.

```bash
cloudsec set DATABASE_URL "postgresql://localhost:5432/mydb"
cloudsec set API_KEY -e prod  # Interactive prompt
```

### `delete <key>` / `rm <key>`

Delete a secret.

```bash
cloudsec delete OLD_SECRET
cloudsec rm API_KEY -e dev --force  # Skip confirmation
```

### `import <file>`

Import secrets from a JSON file. The file should contain key-value pairs.

```bash
cloudsec import secrets.json
cloudsec import secrets.json -e prod --force
```

Example `secrets.json`:
```json
{
  "DATABASE_URL": "postgresql://localhost:5432/mydb",
  "API_KEY": "your-api-key-here",
  "JWT_SECRET": "your-jwt-secret"
}
```

### `download [output]` / `pull [output]`

Download all secrets from an environment to a JSON file.

```bash
cloudsec download
cloudsec download secrets-backup.json
cloudsec pull -e prod -o prod-secrets.json
```

### `env`

Set local environment variables from remote secrets. This command outputs shell-compatible variable assignments.

```bash
# Output to stdout (for bash/zsh)
cloudsec env -e dev --export | source /dev/stdin

# Output to stdout (for fish shell)
cloudsec env -e dev --export --shell fish | source

# Filter secrets by pattern
cloudsec env -e dev --filter "API_*" --export

# Remove prefix from secret names
cloudsec env -e dev --prefix "dev-" --export

# Show verbose output
cloudsec env -e dev --verbose
```

**Options:**
- `--filter <pattern>` - Filter secrets by name pattern (supports wildcards)
- `--prefix <prefix>` - Remove prefix from secret names when setting env vars
- `--shell <shell>` - Shell type: `bash`, `fish`, or `zsh` (default: `bash`)
- `--export` - Include `export` keyword in output
- `--verbose` - Show verbose output

## Global Options

These options can be used with any command:

- `-e, --environment <env>` - Environment to use (dev, staging, prod)
- `-p, --project <project>` - GCP project ID (overrides config)
- `-r, --region <region>` - GCP region (overrides config)
- `--config <path>` - Path to config file (default: `.cloudsec.yaml`)
- `--verbose` - Enable verbose logging

## Examples

### Working with Multiple Environments

```bash
# Set a secret in dev
cloudsec set DATABASE_URL "postgresql://localhost:5432/devdb" -e dev

# Set the same secret in prod with different value
cloudsec set DATABASE_URL "postgresql://prod-db:5432/proddb" -e prod

# List all secrets across environments
cloudsec list -e dev
cloudsec list -e prod
```

### Bulk Operations

```bash
# Export all dev secrets
cloudsec download dev-secrets.json -e dev

# Import secrets to staging
cloudsec import dev-secrets.json -e staging

# Backup production secrets
cloudsec download prod-backup-$(date +%Y%m%d).json -e prod
```

### Local Development Setup

```bash
# Load all dev secrets as environment variables
eval $(cloudsec env -e dev --export)

# Load only API-related secrets
eval $(cloudsec env -e dev --filter "API_*" --export)

# Load secrets without the "dev-" prefix
eval $(cloudsec env -e dev --prefix "dev-" --export)
```

### CI/CD Integration

```bash
# In your CI pipeline, load secrets before running tests
cloudsec env -e staging --export >> $GITHUB_ENV

# Or for GitLab CI
cloudsec env -e staging --export >> .env
```

## How It Works

Cloudsec stores all secrets for an environment in a single GCP Secret Manager secret (named with the environment prefix). This secret contains a JSON object with all key-value pairs. This approach:

- Reduces API calls when working with multiple secrets
- Maintains atomic updates (all secrets updated together)
- Simplifies backup and restore operations
- Keeps secrets organized by environment

## Troubleshooting

### Authentication Errors

If you see authentication errors:

```bash
# Re-authenticate with GCP
gcloud auth application-default login

# Or set service account credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Secret Not Found

If a secret doesn't exist, Cloudsec will create it automatically when you use `set` or `import`. Use `list` to verify secrets exist.

### Permission Denied

Ensure your GCP account has the following IAM roles:
- `roles/secretmanager.secretAccessor` (to read secrets)
- `roles/secretmanager.secretVersionManager` (to create/update secrets)

## Contributing

Contributions are welcome! Please ensure your code follows the existing style and includes tests where applicable.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
