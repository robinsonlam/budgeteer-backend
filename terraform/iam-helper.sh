#!/bin/bash

# Budgeteer IAM Management Script
# This script helps with common IAM-related tasks for the Budgeteer ECS deployment

set -e

PROJECT_NAME="budgeteer"
REGION="ap-southeast-2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi

    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi

    log_success "AWS CLI is configured"
}

# Function to validate IAM roles exist
validate_roles() {
    log_info "Validating IAM roles..."
    
    roles=(
        "${PROJECT_NAME}-task-execution-role"
        "${PROJECT_NAME}-task-role"
        "${PROJECT_NAME}-ecs-autoscale-role"
        "${PROJECT_NAME}-ecs-cloudwatch-role"
        "${PROJECT_NAME}-deployment-role"
    )

    for role in "${roles[@]}"; do
        if aws iam get-role --role-name "$role" &> /dev/null; then
            log_success "Role exists: $role"
        else
            log_warning "Role not found: $role"
            log_info "Run 'terraform apply' to create missing roles"
        fi
    done
}

# Function to create SSM parameters for secrets
create_ssm_parameters() {
    log_info "Creating SSM parameters for application secrets..."
    
    # Prompt for MongoDB URI
    echo -n "Enter MongoDB URI (leave empty to skip): "
    read -r mongodb_uri
    if [[ -n "$mongodb_uri" ]]; then
        aws ssm put-parameter \
            --name "/${PROJECT_NAME}/mongodb_uri" \
            --value "$mongodb_uri" \
            --type "SecureString" \
            --overwrite \
            --region "$REGION"
        log_success "Created SSM parameter: /${PROJECT_NAME}/mongodb_uri"
    fi

    # Prompt for JWT Secret
    echo -n "Enter JWT Secret (leave empty to generate random): "
    read -r jwt_secret
    if [[ -z "$jwt_secret" ]]; then
        jwt_secret=$(openssl rand -base64 32)
        log_info "Generated random JWT secret"
    fi
    
    if [[ -n "$jwt_secret" ]]; then
        aws ssm put-parameter \
            --name "/${PROJECT_NAME}/jwt_secret" \
            --value "$jwt_secret" \
            --type "SecureString" \
            --overwrite \
            --region "$REGION"
        log_success "Created SSM parameter: /${PROJECT_NAME}/jwt_secret"
    fi

    # Prompt for JWT Expires In
    echo -n "Enter JWT expiration time in seconds (default: 86400): "
    read -r jwt_expires_in
    jwt_expires_in=${jwt_expires_in:-86400}
    
    aws ssm put-parameter \
        --name "/${PROJECT_NAME}/jwt_expires_in" \
        --value "$jwt_expires_in" \
        --type "String" \
        --overwrite \
        --region "$REGION"
    log_success "Created SSM parameter: /${PROJECT_NAME}/jwt_expires_in"
}

# Function to list SSM parameters
list_ssm_parameters() {
    log_info "Listing SSM parameters for ${PROJECT_NAME}..."
    
    parameters=$(aws ssm get-parameters-by-path \
        --path "/${PROJECT_NAME}" \
        --recursive \
        --region "$REGION" \
        --query 'Parameters[].Name' \
        --output text)
    
    if [[ -n "$parameters" ]]; then
        echo "$parameters" | tr '\t' '\n'
    else
        log_warning "No SSM parameters found for /${PROJECT_NAME}"
    fi
}

# Function to get role ARNs
get_role_arns() {
    log_info "Getting IAM role ARNs..."
    
    roles=(
        "${PROJECT_NAME}-task-execution-role"
        "${PROJECT_NAME}-task-role"
        "${PROJECT_NAME}-ecs-autoscale-role"
        "${PROJECT_NAME}-deployment-role"
    )

    for role in "${roles[@]}"; do
        if arn=$(aws iam get-role --role-name "$role" --query 'Role.Arn' --output text 2>/dev/null); then
            echo "$role: $arn"
        else
            log_warning "Role not found: $role"
        fi
    done
}

# Function to test permissions
test_permissions() {
    log_info "Testing IAM permissions..."
    
    # Test ECS permissions
    if aws ecs list-clusters --region "$REGION" &> /dev/null; then
        log_success "ECS permissions: OK"
    else
        log_error "ECS permissions: FAILED"
    fi

    # Test ECR permissions
    if aws ecr describe-repositories --region "$REGION" &> /dev/null; then
        log_success "ECR permissions: OK"
    else
        log_warning "ECR permissions: Limited (this is normal for some roles)"
    fi

    # Test CloudWatch permissions
    if aws logs describe-log-groups --log-group-name-prefix "/ecs/${PROJECT_NAME}" --region "$REGION" &> /dev/null; then
        log_success "CloudWatch Logs permissions: OK"
    else
        log_warning "CloudWatch Logs permissions: Limited"
    fi
}

# Function to show help
show_help() {
    cat << EOF
Budgeteer IAM Management Script

Usage: $0 [COMMAND]

Commands:
    validate        Validate that all required IAM roles exist
    create-secrets  Create SSM parameters for application secrets
    list-secrets    List existing SSM parameters
    get-arns        Get ARNs of all IAM roles
    test            Test current user's permissions
    help            Show this help message

Examples:
    $0 validate
    $0 create-secrets
    $0 list-secrets
    $0 get-arns
    $0 test

EOF
}

# Main script logic
case "${1:-help}" in
    validate)
        check_aws_cli
        validate_roles
        ;;
    create-secrets)
        check_aws_cli
        create_ssm_parameters
        ;;
    list-secrets)
        check_aws_cli
        list_ssm_parameters
        ;;
    get-arns)
        check_aws_cli
        get_role_arns
        ;;
    test)
        check_aws_cli
        test_permissions
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
