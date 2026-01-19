# CI/CD Pipeline Setup Guide

This GitHub Actions workflow automatically runs tests and builds Docker images when code is pushed to the `main` branch.

## Workflow Overview

The pipeline consists of two jobs:

1. **Test Job**: Runs on every push and pull request to `main`
   - Sets up PostgreSQL and MinIO services
   - Installs Python dependencies
   - Initializes MinIO bucket
   - Runs Django migrations
   - Executes all Django tests

2. **Build and Push Job**: Runs only on pushes to `main` (after tests pass)
   - Builds Docker image from `backend/Dockerfile`
   - Tags image with: `latest`, branch name, and commit SHA
   - Pushes to Docker registry

## Required GitHub Secrets

Before the pipeline can push Docker images, you need to set up GitHub Secrets:

### Option 1: Docker Hub (Recommended)

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add:
   - **Name**: `DOCKER_USERNAME`
   - **Value**: Your Docker Hub username
4. Click **New repository secret** again and add:
   - **Name**: `DOCKER_PASSWORD`
   - **Value**: Your Docker Hub password or access token

### Option 2: GitHub Container Registry (ghcr.io)

If you prefer to use GitHub Container Registry instead:

1. The workflow will use `GITHUB_TOKEN` automatically (no secrets needed)
2. Update the workflow file to use ghcr.io:
   - Uncomment the ghcr.io lines in the "Log in to Docker Registry" step
   - Comment out the Docker Hub lines
   - Update the `DOCKER_REGISTRY` env variable to `ghcr.io`

## Testing the Pipeline

1. Push code to a feature branch and create a pull request to `main`:
   - This will trigger the test job
   - The build-and-push job will NOT run (only on direct pushes to main)

2. Merge the PR or push directly to `main`:
   - Both test and build jobs will run
   - Docker image will be built and pushed to your registry

## Environment Variables

The test job uses these environment variables (configured in the workflow):
- Database: PostgreSQL on localhost:5432
- MinIO: S3-compatible storage on localhost:9000
- All test credentials are set in the workflow file

## Troubleshooting

### Tests Fail
- Check the workflow logs in the **Actions** tab
- Ensure all dependencies are listed in `requirements/base.txt` and `requirements/development.txt`

### Docker Build Fails
- Verify `DOCKER_USERNAME` and `DOCKER_PASSWORD` secrets are set correctly
- Check that your Docker registry credentials are valid
- Ensure the Dockerfile in `backend/` is correct

### MinIO Connection Issues
- The workflow waits up to 60 seconds for MinIO to be ready
- If initialization fails, the workflow continues (it's non-blocking)
