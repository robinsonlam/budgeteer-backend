output "alb_hostname" {
  description = "Load balancer hostname"
  value       = aws_lb.main.dns_name
}

output "load_balancer_url" {
  description = "URL of the load balancer"
  value       = "http://${aws_lb.main.dns_name}"
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.main.name
}

output "task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.task_execution.arn
}

output "task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.task_role.arn
}

output "autoscale_role_arn" {
  description = "ARN of the ECS autoscale role"
  value       = aws_iam_role.ecs_autoscale_role.arn
}

output "log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.app.name
}

output "target_group_arn" {
  description = "ARN of the load balancer target group"
  value       = aws_lb_target_group.app.arn
}

output "security_group_alb_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "security_group_ecs_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "deployment_role_arn" {
  description = "ARN of the deployment role for CI/CD"
  value       = aws_iam_role.deployment_role.arn
}

output "cloudwatch_role_arn" {
  description = "ARN of the CloudWatch role"
  value       = aws_iam_role.ecs_task_cloudwatch.arn
}

output "task_execution_policy_arn" {
  description = "ARN of the custom task execution policy"
  value       = aws_iam_policy.task_execution_custom.arn
}

output "task_policy_arn" {
  description = "ARN of the custom task policy"
  value       = aws_iam_policy.task_role_policy.arn
}

output "ecs_autoscale_policy_arn" {
  description = "ARN of the custom ECS auto scaling policy"
  value       = aws_iam_policy.ecs_autoscale_policy.arn
}

output "cloudfront_url" {
  description = "CloudFront distribution URL (HTTPS)"
  value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.app[0].domain_name}" : null
}

output "api_base_url" {
  description = "Base URL for API calls (use this in your frontend)"
  value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.app[0].domain_name}" : "http://${aws_lb.main.dns_name}"
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.main.repository_url
}

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.main.name
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.main.arn
}
