# Terraform ECS Deployment for Budgeteer Backend 

This Terraform configuration deploys the Budgeteer NestJS backend to AWS ECS Fargate.

## Architecture

- **VPC**: Custom VPC with public subnets across 2 AZs
- **ECS**: Fargate cluster with Application Load Balancer
- **Security**: IAM roles, security groups, and SSM Parameter Store for secrets
- **Logging**: CloudWatch log groups for container logs
- **Health Checks**: ALB health checks using `/health` endpoint

## Prerequisites

1. **AWS CLI** configured with appropriate credentials
2. **Terraform** >= 1.0 installed
3. **Docker image** pushed to ECR (already done: `225989367801.dkr.ecr.ap-southeast-2.amazonaws.com/budgeteer-repo:latest`)
4. **MongoDB Atlas** connection string ready

## Quick Start

### 1. Configure Variables

```bash
# Copy the example file
cp terraform.tfvars.example terraform.tfvars

# Edit with your actual values
vi terraform.tfvars
```

### 2. Initialize and Deploy

```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

### 3. Access Your Application

After deployment, Terraform will output the ALB hostname:

```bash
# Get the application URL
terraform output app_url
```

## Configuration

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `mongodb_uri` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `jwt_secret` | JWT secret key | `your-secret-key` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `aws_region` | `ap-southeast-2` | AWS region |
| `project_name` | `budgeteer` | Project name prefix |
| `app_count` | `2` | Number of ECS tasks |
| `fargate_cpu` | `1024` | CPU units (1 vCPU = 1024) |
| `fargate_memory` | `2048` | Memory in MiB |

## Security Features

- **Non-root container**: Docker runs as non-root user
- **Secrets management**: MongoDB URI and JWT secret stored in SSM Parameter Store
- **Security groups**: Restricted network access
- **IAM roles**: Minimal permissions for ECS tasks

## Health Checks

The configuration includes:
- **ALB health check**: `/health` endpoint every 30 seconds
- **ECS health check**: Container-level health monitoring
- **CloudWatch**: Centralized logging

## Monitoring

- **CloudWatch Logs**: `/ecs/budgeteer` log group
- **Container Insights**: Enabled for detailed metrics
- **ALB Metrics**: Request count, response time, error rates

## Updating the Application

To update your application:

1. Build and push new Docker image
2. Update the `app_image` variable
3. Run `terraform apply`

```bash
# Example: Update to new image tag
terraform apply -var="app_image=225989367801.dkr.ecr.ap-southeast-2.amazonaws.com/budgeteer-repo:v2.0.0"
```

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

## Troubleshooting

### ECS Task Stuck in Provisioning

1. Check CloudWatch logs: `/ecs/budgeteer`
2. Verify health check endpoint: `/health`
3. Check security group rules
4. Verify ECR image exists and is accessible

### Common Issues

- **503 errors**: Check ECS service health in AWS Console
- **Task failures**: Review CloudWatch logs for container errors
- **ALB timeouts**: Verify application starts within health check grace period

## Costs

Estimated monthly costs (ap-southeast-2):
- **ECS Fargate** (2 tasks, 1vCPU, 2GB): ~$45
- **ALB**: ~$20
- **NAT Gateway**: $0 (using public subnets)
- **CloudWatch Logs**: ~$5

Total: ~$70/month

## Files

- `main.tf`: Main infrastructure configuration
- `variables.tf`: Variable definitions
- `outputs.tf`: Output values
- `terraform.tfvars.example`: Example configuration
- `README.md`: This documentation
