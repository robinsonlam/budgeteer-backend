variable "aws_region" {
  description = "The AWS region things are created in"
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Name of the project"
  default     = "budgeteer"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  default     = "172.17.0.0/16"
}

variable "az_count" {
  description = "Number of AZs to cover in a given region"
  default     = "2"
}

variable "app_image_name" {
  description = "Name of the docker image"
  default     = "budgeteer-repo"
}

variable "app_port" {
  description = "Port exposed by the docker image to redirect traffic to"
  default     = 3000
}

variable "app_count" {
  description = "Number of docker containers to run"
  default     = 1
}

variable "health_check_grace_period_seconds" {
  description = "Seconds to ignore failing load balancer health checks on newly instantiated tasks to prevent premature shutdown"
  default     = 30
}

variable "fargate_cpu" {
  description = "Fargate instance CPU units to provision (1 vCPU = 1024 CPU units)"
  default     = "256"
}

variable "fargate_memory" {
  description = "Fargate instance memory to provision (in MiB)"
  default     = "512"
}

variable "mongodb_uri" {
  description = "MongoDB connection string"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "jwt_expires_in" {
  description = "JWT expiration time in seconds"
  type        = string
  sensitive   = true
}

variable "frontend_url" {
  description = "Frontend URL for OAuth redirects"
  type        = string
  default     = "https://master.d3b2w5it401pk9.amplifyapp.com"
}

variable "cors_origins" {
  description = "Comma-separated list of allowed CORS origins (used only if custom override needed)"
  type        = string
  default     = "http://localhost:5173,https://master.d3b2w5it401pk9.amplifyapp.com"
}

# Auto Scaling Variables
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

# CloudFront Configuration
variable "enable_cloudfront" {
  description = "Enable CloudFront distribution for HTTPS"
  type        = bool
  default     = true
}