# ====================
# IAM ROLES AND POLICIES FOR ECS FARGATE
# ====================

# ====================
# TASK EXECUTION ROLE
# ====================
# This role is used by the ECS agent to:
# - Pull container images from ECR
# - Push logs to CloudWatch
# - Retrieve secrets from SSM/Secrets Manager

resource "aws_iam_role" "task_execution" {
  name = "${var.project_name}-task-execution-role"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.project_name}-task-execution-role"
    Environment = "production"
    Purpose     = "ECS task execution"
  }
}

# Attach the AWS managed ECS task execution policy
resource "aws_iam_role_policy_attachment" "task_execution_policy" {
  role       = aws_iam_role.task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Custom policy for enhanced task execution permissions
resource "aws_iam_policy" "task_execution_custom" {
  name        = "${var.project_name}-task-execution-custom"
  description = "Enhanced permissions for ECS task execution"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams",
          "logs:DescribeLogGroups"
        ]
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.project_name}*",
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/ecs/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameters",
          "ssm:GetParameter",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:${var.project_name}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "task_execution_custom" {
  role       = aws_iam_role.task_execution.name
  policy_arn = aws_iam_policy.task_execution_custom.arn
}

# ====================
# TASK ROLE
# ====================
# This role is used by the application container to access AWS services

resource "aws_iam_role" "task_role" {
  name = "${var.project_name}-task-role"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.project_name}-task-role"
    Environment = "production"
    Purpose     = "ECS application permissions"
  }
}

# Custom policy for application-specific permissions
resource "aws_iam_policy" "task_role_policy" {
  name        = "${var.project_name}-task-policy"
  description = "Permissions for the ${var.project_name} application"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/ecs/${var.project_name}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = [
          "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/${var.project_name}/*"
        ]
      }
      # Add additional permissions here as needed
      # Example: S3 access for file uploads
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "s3:GetObject",
      #     "s3:PutObject",
      #     "s3:DeleteObject"
      #   ]
      #   Resource = [
      #     "arn:aws:s3:::${var.project_name}-uploads/*"
      #   ]
      # },
      # {
      #   Effect = "Allow"
      #   Action = [
      #     "s3:ListBucket"
      #   ]
      #   Resource = [
      #     "arn:aws:s3:::${var.project_name}-uploads"
      #   ]
      # }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "task_role_policy" {
  role       = aws_iam_role.task_role.name
  policy_arn = aws_iam_policy.task_role_policy.arn
}

# ====================
# AUTO SCALING ROLE
# ====================
# This role is used by Application Auto Scaling to scale ECS services

resource "aws_iam_role" "ecs_autoscale_role" {
  name = "${var.project_name}-ecs-autoscale-role"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "application-autoscaling.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.project_name}-ecs-autoscale-role"
    Environment = "production"
    Purpose     = "ECS auto scaling"
  }
}

resource "aws_iam_policy" "ecs_autoscale_policy" {
  name        = "${var.project_name}-ecs-autoscale-policy"
  description = "Policy for ECS auto scaling"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:DescribeServices",
          "ecs:UpdateService",
          "cloudwatch:DescribeAlarms",
          "cloudwatch:PutMetricAlarm",
          "cloudwatch:DeleteAlarms",
          "cloudwatch:DescribeAlarmHistory",
          "cloudwatch:DescribeAlarmsForMetric",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_autoscale_policy" {
  role       = aws_iam_role.ecs_autoscale_role.name
  policy_arn = aws_iam_policy.ecs_autoscale_policy.arn
}

# ====================
# CLOUDWATCH ROLE (Optional)
# ====================
# Role for CloudWatch Container Insights

resource "aws_iam_role" "ecs_task_cloudwatch" {
  name = "${var.project_name}-ecs-cloudwatch-role"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })

  tags = {
    Name        = "${var.project_name}-ecs-cloudwatch-role"
    Environment = "production"
    Purpose     = "CloudWatch Container Insights"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_cloudwatch_policy" {
  role       = aws_iam_role.ecs_task_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

# ====================
# DEPLOYMENT ROLE (Optional)
# ====================
# Role for CI/CD deployment (GitHub Actions, etc.)

resource "aws_iam_role" "deployment_role" {
  name = "${var.project_name}-deployment-role"
  path = "/"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs.amazonaws.com"
        }
      },
      # Uncomment and modify for GitHub Actions OIDC
      # {
      #   Effect = "Allow"
      #   Principal = {
      #     Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
      #   }
      #   Action = "sts:AssumeRoleWithWebIdentity"
      #   Condition = {
      #     StringEquals = {
      #       "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
      #       "token.actions.githubusercontent.com:sub" = "repo:your-org/your-repo:ref:refs/heads/main"
      #     }
      #   }
      # }
    ]
  })

  tags = {
    Name        = "${var.project_name}-deployment-role"
    Environment = "production"
    Purpose     = "CI/CD deployment"
  }
}

resource "aws_iam_policy" "deployment_policy" {
  name        = "${var.project_name}-deployment-policy"
  description = "Permissions for CI/CD deployment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "ecs:cluster" = aws_ecs_cluster.main.arn
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.task_execution.arn,
          aws_iam_role.task_role.arn
        ]
      }
    ]
  })
}