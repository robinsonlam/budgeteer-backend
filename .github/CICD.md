# CI/CD Pipeline Documentation

## Overview

This repository includes comprehensive GitHub Actions workflows for automated deployment of both infrastructure (Terraform) and application code (Docker) for the Budgeteer backend application.

## Workflows

### 1. Infrastructure Deployment (`deploy-infrastructure.yml`)

**Triggers:**
- Push to `master` branch
- Changes to `terraform/**` files
- Changes to backend source code that might affect infrastructure

**What it does:**
1. **Terraform Plan:** Validates and plans infrastructure changes
2. **Terraform Apply:** Applies infrastructure changes (only if changes detected)
3. **Build & Deploy:** Builds Docker image and deploys to ECS
4. **Service Update:** Forces ECS service update and waits for stability

### 2. Backend Code Deployment (`deploy-backend.yml`)

**Triggers:**
- Push to `master` branch
- Changes to backend source code (excluding Terraform)
- Changes to `src/**`, `Dockerfile`, `package*.json`

**What it does:**
1. Builds Docker image for linux/amd64 platform
2. Tags image with commit SHA and `latest`
3. Pushes to Amazon ECR
4. Forces ECS service deployment
5. Waits for service stability

### 3. Pull Request Planning (`terraform-pr.yml`)

**Triggers:**
- Pull requests to `master` branch
- Changes to Terraform files

**What it does:**
1. Runs `terraform plan` on PR changes
2. Comments plan results on the PR
3. Shows what changes will be made to infrastructure
4. Validates Terraform syntax and formatting

### 4. Manual Terraform Operations (`manual-terraform.yml`)

**Triggers:**
- Manual trigger via GitHub Actions UI
- Allows selection of action: `plan`, `apply`, or `destroy`
- Environment selection (production/staging)

**Use cases:**
- Testing infrastructure changes
- Emergency infrastructure updates
- Infrastructure rollback scenarios
- One-off infrastructure operations

### 5. Manual Deployment (`manual-deploy-backend.yml`)

**Triggers:**
- Manual trigger via GitHub Actions UI
- Environment selection (production/staging)

**Use cases:**
- Testing deployments
- Emergency deployments
- Rollback scenarios

### 6. Testing Pipeline (`test-backend.yml`)

**Triggers:**
- Pull requests + pushes to master
- Changes to backend code

**Actions:**
- Runs unit tests with MongoDB service
- Linting and build verification
- Docker build test
- Quality gates before deployment

## Setup Requirements

### GitHub Secrets

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

**AWS Credentials:**
```
AWS_ACCESS_KEY_ID       - AWS access key for deployment user
AWS_SECRET_ACCESS_KEY   - AWS secret key for deployment user
```

**Application Secrets (for Terraform):**
```
MONGODB_URI            - MongoDB connection string for production
JWT_SECRET             - JWT secret key for production
JWT_EXPIRES_IN         - JWT expiration time (e.g., "3600")
```

### GitHub Environments

1. Go to `Settings > Environments`
2. Create environment: `production`
3. Configure protection rules as needed (e.g., required reviewers)
4. Optionally create `staging` environment for testing

## Terraform State Management

**Important:** Ensure your Terraform state is properly configured:

1. **Remote State:** Use S3 backend for state storage
2. **State Locking:** Use DynamoDB for state locking
3. **Workspace:** Use appropriate Terraform workspace for each environment

Example `backend.tf`:
```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "budgeteer/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "terraform-state-lock"
    encrypt        = true
  }
}
```

### AWS IAM User

Create an IAM user with the following permissions:

**ECR Permissions (for Docker images):**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage"
            ],
            "Resource": "arn:aws:ecr:ap-southeast-2:*:repository/budgeteer-repo"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken"
            ],
            "Resource": "*"
        }
    ]
}
```

**ECS Permissions (for application deployment):**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecs:UpdateService",
                "ecs:DescribeServices"
            ],
            "Resource": [
                "arn:aws:ecs:ap-southeast-2:*:service/budgeteer/budgeteer",
                "arn:aws:ecs:ap-southeast-2:*:cluster/budgeteer"
            ]
        }
    ]
}
```

**Terraform Permissions (for infrastructure management):**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "ecs:*",
                "ecr:*",
                "elasticloadbalancing:*",
                "cloudfront:*",
                "logs:*",
                "iam:*",
                "ssm:*",
                "application-autoscaling:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            "Resource": "arn:aws:s3:::your-terraform-state-bucket/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:ap-southeast-2:*:table/terraform-state-lock"
        }
    ]
}
```

**Note:** For production, consider using more restrictive permissions with specific resource ARNs.

## Configuration

### Current Settings

- **AWS Region:** `ap-southeast-2`
- **ECR Repository:** `budgeteer-repo`
- **ECS Cluster:** `budgeteer`
- **ECS Service:** `budgeteer`

### Customization

To modify these settings, update the `env` section in the workflow files:

```yaml
env:
  AWS_REGION: ap-southeast-2
  ECR_REPOSITORY: budgeteer-repo
  ECS_SERVICE: budgeteer
  ECS_CLUSTER: budgeteer
```

## Image Tagging Strategy

- **Commit SHA:** Each deployment gets tagged with the Git commit SHA
- **Latest:** Always updated to point to the most recent deployment
- **Platform:** Built specifically for `linux/amd64` (required for Fargate)

## Deployment Process

### Infrastructure Changes

1. **Plan Phase:**
   - Checkout code
   - Configure AWS credentials
   - Initialize Terraform
   - Run terraform plan

2. **Apply Phase:**
   - Apply planned changes
   - Get infrastructure outputs

3. **Deploy Phase:**
   - Build and push Docker image
   - Update ECS service
   - Wait for stability

### Code-Only Changes

1. **Build Phase:**
   - Checkout code
   - Configure AWS credentials
   - Build Docker image

2. **Deploy Phase:**
   - Push to ECR
   - Update ECS service
   - Wait for stability

## Workflow Logic

1. **Push to master with Terraform changes:**
   - Runs `deploy-infrastructure.yml`
   - Plans → Applies → Builds → Deploys

2. **Push to master with code changes only:**
   - Runs `deploy-backend.yml`  
   - Builds → Deploys (fast deployment)

3. **Pull Request with Terraform changes:**
   - Runs `terraform-pr.yml`
   - Shows plan in PR comments

4. **Manual operations:**
   - Use manual workflows for testing/emergency changes

## Monitoring

- Check workflow status in GitHub Actions tab
- Monitor ECS service in AWS Console
- View application logs in CloudWatch

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check Docker build context in repository root
   - Verify Dockerfile syntax
   - Check for missing dependencies

2. **Push Failures:**
   - Verify AWS credentials
   - Check ECR repository exists
   - Verify IAM permissions

3. **Deployment Failures:**
   - Check ECS service exists
   - Verify task definition
   - Monitor CloudWatch logs

4. **Terraform Failures:**
   - Check Terraform state
   - Verify variable values
   - Check AWS permissions

### Manual Recovery

If automatic deployment fails, use the manual workflows:

1. Go to Actions tab
2. Select appropriate manual workflow
3. Click "Run workflow"
4. Select environment and parameters
5. Run workflow

## Security Notes

- AWS credentials are stored as GitHub secrets
- ECR repositories are private
- ECS tasks run with least-privilege IAM roles
- All communication uses HTTPS/TLS
- Terraform state should be encrypted and stored securely
