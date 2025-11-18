# ============================================================================
# Golf Tournament Management System - AWS Infrastructure
# ============================================================================
# Terraform configuration for deploying to AWS ECS Fargate
# Includes: VPC, ALB, ECS, RDS, S3, CloudFront, Route53
# ============================================================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration - uncomment and configure for remote state
  # backend "s3" {
  #   bucket         = "golf-tournament-terraform-state"
  #   key            = "production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-state-lock"
  # }
}

# ============================================================================
# Provider Configuration
# ============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Golf Tournament Management"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ============================================================================
# Data Sources
# ============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Get latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# ============================================================================
# VPC Module
# ============================================================================

module "vpc" {
  source = "./modules/vpc"

  environment         = var.environment
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

# ============================================================================
# Security Groups
# ============================================================================

resource "aws_security_group" "alb" {
  name_prefix = "golf-tournament-alb-"
  description = "Security group for Application Load Balancer"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "golf-tournament-alb-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "ecs_tasks" {
  name_prefix = "golf-tournament-ecs-tasks-"
  description = "Security group for ECS tasks"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "golf-tournament-ecs-tasks-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "golf-tournament-rds-"
  description = "Security group for RDS PostgreSQL"
  vpc_id      = module.vpc.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
    description     = "Allow PostgreSQL from ECS tasks"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = {
    Name = "golf-tournament-rds-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# ============================================================================
# Application Load Balancer
# ============================================================================

module "alb" {
  source = "./modules/alb"

  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnets     = module.vpc.public_subnets
  security_group_id  = aws_security_group.alb.id
  certificate_arn    = var.acm_certificate_arn
  domain_name        = var.domain_name
}

# ============================================================================
# ECS Cluster
# ============================================================================

module "ecs" {
  source = "./modules/ecs"

  environment       = var.environment
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnets
  security_group_id = aws_security_group.ecs_tasks.id
  target_group_arn  = module.alb.target_group_arn

  # Container configuration
  container_image       = var.container_image
  container_port        = 3000
  desired_count         = var.ecs_desired_count
  task_cpu              = var.ecs_task_cpu
  task_memory           = var.ecs_task_memory

  # Environment variables
  database_url          = module.rds.connection_string
  nextauth_url          = "https://${var.domain_name}"
  nextauth_secret       = var.nextauth_secret
  brevo_api_key         = var.brevo_api_key
  brevo_sender_email    = var.brevo_sender_email
  brevo_sender_name     = var.brevo_sender_name
  stripe_secret_key     = var.stripe_secret_key
  stripe_publishable_key = var.stripe_publishable_key
  stripe_webhook_secret = var.stripe_webhook_secret
  vapid_public_key      = var.vapid_public_key
  vapid_private_key     = var.vapid_private_key
  vapid_subject         = var.vapid_subject
  cron_secret           = var.cron_secret
  main_domain           = var.domain_name
  s3_bucket             = module.s3.bucket_name
  s3_region             = var.aws_region
}

# ============================================================================
# RDS PostgreSQL
# ============================================================================

module "rds" {
  source = "./modules/rds"

  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnets         = module.vpc.private_subnets
  security_group_id       = aws_security_group.rds.id

  # Database configuration
  engine_version          = "16.1"
  instance_class          = var.rds_instance_class
  allocated_storage       = var.rds_allocated_storage
  storage_type            = "gp3"
  multi_az                = var.rds_multi_az

  # Database credentials
  database_name           = "golf_tournament"
  master_username         = var.db_master_username
  master_password         = var.db_master_password

  # Backup configuration
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "mon:04:00-mon:05:00"

  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
}

# ============================================================================
# S3 Bucket for Photos
# ============================================================================

module "s3" {
  source = "./modules/s3"

  environment = var.environment
  bucket_name = "golf-tournament-photos-${var.environment}"

  # CORS configuration
  cors_allowed_origins = [
    "https://${var.domain_name}",
    "https://*.${var.domain_name}"
  ]

  # Lifecycle rules
  enable_lifecycle_rules = true

  # Versioning
  enable_versioning = true
}

# ============================================================================
# CloudFront Distribution
# ============================================================================

module "cloudfront" {
  source = "./modules/cloudfront"

  environment     = var.environment
  domain_name     = var.domain_name
  certificate_arn = var.acm_certificate_arn

  # Origins
  alb_dns_name    = module.alb.dns_name
  s3_bucket_domain = module.s3.bucket_regional_domain_name

  # Cache behavior
  default_ttl     = 0
  min_ttl         = 0
  max_ttl         = 31536000
}

# ============================================================================
# Route53 DNS
# ============================================================================

module "route53" {
  source = "./modules/route53"

  domain_name           = var.domain_name
  cloudfront_domain_name = module.cloudfront.domain_name
  cloudfront_zone_id    = module.cloudfront.hosted_zone_id

  # Optional: if you manage the hosted zone in Terraform
  # create_hosted_zone = true
}

# ============================================================================
# Auto Scaling
# ============================================================================

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${module.ecs.cluster_name}/${module.ecs.service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# CPU-based auto scaling
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "golf-tournament-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# Memory-based auto scaling
resource "aws_appautoscaling_policy" "ecs_memory" {
  name               = "golf-tournament-memory-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}

# ============================================================================
# EventBridge for Cron Jobs
# ============================================================================

module "eventbridge" {
  source = "./modules/eventbridge"

  environment       = var.environment
  cluster_arn       = module.ecs.cluster_arn
  task_definition_arn = module.ecs.task_definition_arn
  subnets           = module.vpc.private_subnets
  security_group_id = aws_security_group.ecs_tasks.id
  cron_secret       = var.cron_secret
}

# ============================================================================
# CloudWatch Log Groups
# ============================================================================

resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/golf-tournament-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "golf-tournament-logs"
  }
}

# ============================================================================
# Outputs
# ============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = module.alb.dns_name
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = module.cloudfront.domain_name
}

output "rds_endpoint" {
  description = "Endpoint of the RDS PostgreSQL instance"
  value       = module.rds.endpoint
  sensitive   = true
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for photos"
  value       = module.s3.bucket_name
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = module.ecs.cluster_name
}

output "application_url" {
  description = "URL of the application"
  value       = "https://${var.domain_name}"
}
