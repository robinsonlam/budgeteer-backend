# Budgeteer ECS Fargate IAM Configuration

This Terraform configuration creates a comprehensive IAM setup for running the Budgeteer application on AWS ECS Fargate.

## IAM Roles Created

### 1. Task Execution Role (`budgeteer-task-execution-role`)
**Purpose**: Used by the ECS agent to bootstrap your container
- Pulls container images from ECR
- Sends logs to CloudWatch
- Retrieves secrets from AWS Secrets Manager/SSM Parameter Store

**Attached Policies**:
- `AmazonECSTaskExecutionRolePolicy` (AWS managed)
- `budgeteer-task-execution-custom` (custom policy)

**Custom Permissions**:
- ECR: `GetAuthorizationToken`, `BatchCheckLayerAvailability`, `GetDownloadUrlForLayer`, `BatchGetImage`
- CloudWatch Logs: `CreateLogGroup`, `CreateLogStream`, `PutLogEvents`, `DescribeLogStreams`
- SSM Parameter Store: `GetParameters`, `GetParameter`, `GetParametersByPath` for `/budgeteer/*`
- Secrets Manager: `GetSecretValue` for `budgeteer/*` secrets

### 2. Task Role (`budgeteer-task-role`)
**Purpose**: Used by your application container to access AWS services
- Application-level permissions
- Access to CloudWatch Logs
- Access to SSM Parameter Store for configuration

**Attached Policies**:
- `budgeteer-task-policy` (custom policy)

**Custom Permissions**:
- CloudWatch Logs: Create and write to application log groups
- SSM Parameter Store: Read application configuration from `/budgeteer/*`

### 3. Auto Scaling Role (`budgeteer-ecs-autoscale-role`)
**Purpose**: Used by Application Auto Scaling service to scale your ECS service
- Enables automatic scaling based on CPU/Memory metrics
- Only needed if you enable auto scaling

**Attached Policies**:
- `AmazonECSServiceRolePolicy` (AWS managed)

### 4. CloudWatch Role (`budgeteer-ecs-cloudwatch-role`)
**Purpose**: Used for CloudWatch Container Insights
- Enables enhanced monitoring and metrics collection
- Provides detailed container-level metrics

**Attached Policies**:
- `CloudWatchAgentServerPolicy` (AWS managed)

### 5. Deployment Role (`budgeteer-deployment-role`)
**Purpose**: Used by CI/CD systems for automated deployments
- Update ECS services and task definitions
- Push images to ECR
- Manage deployments

**Custom Permissions**:
- ECS: Update services, register task definitions, describe resources
- ECR: Push and pull container images
- IAM: Pass roles to ECS tasks

## Security Best Practices

### Principle of Least Privilege
- Each role has only the minimum permissions required for its function
- Resource-specific ARNs where possible (e.g., specific log groups, SSM paths)
- No wildcard permissions except where necessary (e.g., ECR token)

### Resource Scoping
- Log permissions scoped to `/ecs/budgeteer*` log groups
- SSM permissions scoped to `/budgeteer/*` parameter paths
- Secrets Manager permissions scoped to `budgeteer/*` secrets

### Environment Separation
- All resources tagged with environment information
- Easy to replicate for different environments (dev, staging, prod)

## Configuration Variables

The following variables control the IAM setup:

```hcl
# Auto scaling configuration
variable "enable_autoscaling" {
  description = "Enable auto scaling for the ECS service"
  type        = bool
  default     = false
}

variable "autoscaling_min_capacity" {
  description = "Minimum number of tasks for auto scaling"
  type        = number
  default     = 1
}

variable "autoscaling_max_capacity" {
  description = "Maximum number of tasks for auto scaling"
  type        = number
  default     = 10
}

variable "autoscaling_cpu_target" {
  description = "Target CPU utilization percentage for auto scaling"
  type        = number
  default     = 70
}

variable "autoscaling_memory_target" {
  description = "Target memory utilization percentage for auto scaling"
  type        = number
  default     = 80
}
```

## Usage

### 1. Basic Deployment
```bash
# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply
```

### 2. Enable Auto Scaling
Update your `terraform.tfvars`:
```hcl
enable_autoscaling = true
autoscaling_min_capacity = 2
autoscaling_max_capacity = 20
autoscaling_cpu_target = 70
autoscaling_memory_target = 80
```

### 3. Configure Application Secrets
Store sensitive configuration in AWS Systems Manager Parameter Store:
```bash
# Store database connection string
aws ssm put-parameter \
  --name "/budgeteer/mongodb_uri" \
  --value "mongodb://your-connection-string" \
  --type "SecureString"

# Store JWT secret
aws ssm put-parameter \
  --name "/budgeteer/jwt_secret" \
  --value "your-jwt-secret" \
  --type "SecureString"
```

Then update your task definition to use these parameters instead of environment variables.

### 4. CI/CD Integration
The deployment role can be assumed by your CI/CD system (GitHub Actions, GitLab CI, etc.) to automate deployments:

```yaml
# Example GitHub Actions workflow
- name: Deploy to ECS
  env:
    AWS_ROLE_ARN: ${{ secrets.AWS_DEPLOYMENT_ROLE_ARN }}
  run: |
    # Assume the deployment role
    # Update ECS service with new task definition
```

## Monitoring and Logging

### CloudWatch Integration
- Container Insights enabled on the ECS cluster
- Application logs sent to `/ecs/budgeteer` log group
- 7-day log retention (configurable)

### Metrics and Alarms
When auto scaling is enabled, CloudWatch alarms monitor:
- CPU utilization (threshold: 80%)
- Memory utilization (threshold: 80%)

## Troubleshooting

### Common Issues
1. **Task fails to start**: Check task execution role permissions for ECR/logging
2. **Application can't access AWS services**: Verify task role permissions
3. **Auto scaling not working**: Ensure auto scaling role is properly configured
4. **Logs not appearing**: Check CloudWatch permissions in task execution role

### Useful Commands
```bash
# Check role policies
aws iam list-attached-role-policies --role-name budgeteer-task-execution-role

# View task definition
aws ecs describe-task-definition --task-definition budgeteer

# Check service status
aws ecs describe-services --cluster budgeteer --services budgeteer
```

## Additional Security Considerations

### For Production Deployments
1. **Enable VPC Flow Logs**: Monitor network traffic
2. **Use AWS Config**: Track configuration changes
3. **Enable CloudTrail**: Audit API calls
4. **Implement WAF**: Protect the Application Load Balancer
5. **Use Secrets Manager**: For more advanced secret rotation
6. **Enable GuardDuty**: Threat detection

### Network Security
- ECS tasks run in private subnets (if using custom VPC)
- Security groups restrict access to necessary ports only
- ALB security group allows public HTTP/HTTPS access
- ECS security group only allows ALB traffic

## Cost Optimization

### Right-sizing
- Monitor CPU/Memory utilization to optimize task resource allocation
- Use auto scaling to handle traffic spikes efficiently
- Consider spot instances for non-critical workloads

### Log Management
- Adjust log retention periods based on compliance requirements
- Use log filtering to reduce storage costs
- Consider log archiving to S3 for long-term retention
