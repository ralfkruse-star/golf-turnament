# ============================================================================
# Variables for Golf Tournament Management System - AWS Infrastructure
# ============================================================================

# ============================================================================
# General Configuration
# ============================================================================

variable "environment" {
  description = "Environment name (production, staging, development)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["production", "staging", "development"], var.environment)
    error_message = "Environment must be production, staging, or development."
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "golf-tournament"
}

# ============================================================================
# Network Configuration
# ============================================================================

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

# ============================================================================
# Domain Configuration
# ============================================================================

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "acm_certificate_arn" {
  description = "ARN of ACM certificate for HTTPS"
  type        = string
}

# ============================================================================
# ECS Configuration
# ============================================================================

variable "container_image" {
  description = "Docker image for the application"
  type        = string
  default     = "golf-tournament:latest"
}

variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 2
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks for auto-scaling"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks for auto-scaling"
  type        = number
  default     = 10
}

variable "ecs_task_cpu" {
  description = "CPU units for ECS task (1 vCPU = 1024)"
  type        = number
  default     = 1024
}

variable "ecs_task_memory" {
  description = "Memory for ECS task in MB"
  type        = number
  default     = 2048
}

# ============================================================================
# RDS Configuration
# ============================================================================

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_allocated_storage" {
  description = "Allocated storage for RDS in GB"
  type        = number
  default     = 100
}

variable "rds_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = true
}

variable "db_master_username" {
  description = "Master username for RDS"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "db_master_password" {
  description = "Master password for RDS"
  type        = string
  sensitive   = true
}

# ============================================================================
# Application Configuration
# ============================================================================

variable "nextauth_secret" {
  description = "NextAuth secret key"
  type        = string
  sensitive   = true
}

variable "brevo_api_key" {
  description = "Brevo API key"
  type        = string
  sensitive   = true
}

variable "brevo_sender_email" {
  description = "Brevo sender email"
  type        = string
}

variable "brevo_sender_name" {
  description = "Brevo sender name"
  type        = string
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  sensitive   = true
}

variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook secret"
  type        = string
  sensitive   = true
}

variable "vapid_public_key" {
  description = "VAPID public key for push notifications"
  type        = string
}

variable "vapid_private_key" {
  description = "VAPID private key for push notifications"
  type        = string
  sensitive   = true
}

variable "vapid_subject" {
  description = "VAPID subject (contact email)"
  type        = string
}

variable "cron_secret" {
  description = "Secret for authenticating cron jobs"
  type        = string
  sensitive   = true
}

# ============================================================================
# Monitoring Configuration
# ============================================================================

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

# ============================================================================
# Backup Configuration
# ============================================================================

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

# ============================================================================
# Tags
# ============================================================================

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
