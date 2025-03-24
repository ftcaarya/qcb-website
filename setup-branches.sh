#!/bin/bash

# Queen City Blendz Website - Branch Setup Script

# Set text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Queen City Blendz - Branch Setup Script${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: Git is not installed. Please install Git and try again.${NC}"
    exit 1
fi

# Check if the current directory is a git repository
if [ ! -d .git ]; then
    echo -e "${YELLOW}This directory is not a Git repository. Initializing...${NC}"
    git init
    echo -e "${GREEN}Git repository initialized.${NC}"
else
    echo -e "${GREEN}Git repository already exists.${NC}"
fi

# Create main branch if it doesn't exist
echo ""
echo -e "${BLUE}Setting up main branch...${NC}"
if ! git show-ref --quiet refs/heads/main; then
    # If main branch doesn't exist, create it
    current_branch=$(git branch --show-current)
    
    if [ "$current_branch" = "" ]; then
        # No branch yet, create main and initial commit
        git checkout -b main
        git add .
        git commit -m "Initial commit for Queen City Blendz booking website"
        echo -e "${GREEN}Created main branch with initial commit.${NC}"
    else
        # We're on some branch, create main from it
        git branch -m "$current_branch" main
        echo -e "${GREEN}Renamed current branch to main.${NC}"
    fi
else
    # Main branch exists, switch to it
    git checkout main
    echo -e "${GREEN}Switched to existing main branch.${NC}"
fi

# Create and configure admin branch
echo ""
echo -e "${BLUE}Setting up admin branch...${NC}"
if ! git show-ref --quiet refs/heads/admin; then
    # If admin branch doesn't exist, create it from main
    git checkout -b admin
    echo -e "${GREEN}Created admin branch from main.${NC}"
else
    # Admin branch exists, ask if user wants to recreate it
    echo -e "${YELLOW}Admin branch already exists.${NC}"
    read -p "Do you want to recreate it from main? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git branch -D admin
        git checkout -b admin
        echo -e "${GREEN}Recreated admin branch from main.${NC}"
    else
        git checkout admin
        echo -e "${GREEN}Switched to existing admin branch.${NC}"
    fi
fi

# Ask for remote repository URL
echo ""
echo -e "${BLUE}Remote Repository Setup${NC}"
echo -e "Would you like to add a remote repository?"
read -p "Enter repository URL (or press Enter to skip): " repo_url

if [ ! -z "$repo_url" ]; then
    if git remote | grep -q "origin"; then
        echo -e "${YELLOW}Remote 'origin' already exists.${NC}"
        read -p "Do you want to update it? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git remote set-url origin "$repo_url"
            echo -e "${GREEN}Updated remote 'origin' to $repo_url${NC}"
        fi
    else
        git remote add origin "$repo_url"
        echo -e "${GREEN}Added remote 'origin' as $repo_url${NC}"
    fi
    
    # Ask if user wants to push branches
    echo ""
    read -p "Do you want to push branches to remote? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push -u origin main
        git checkout admin
        git push -u origin admin
        echo -e "${GREEN}Pushed main and admin branches to remote.${NC}"
    fi
fi

# Final instructions
echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""
echo -e "Current branch: $(git branch --show-current)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Deploy your main branch to Vercel as the client-facing site"
echo -e "2. Deploy your admin branch to Vercel as the admin site"
echo -e "3. Configure custom domains for each deployment"
echo ""
echo -e "${BLUE}To switch between branches:${NC}"
echo -e "  ${GREEN}git checkout main${NC}  - Work on client site"
echo -e "  ${GREEN}git checkout admin${NC} - Work on admin site"
echo ""
echo -e "${BLUE}To sync changes from main to admin:${NC}"
echo -e "  ${GREEN}git checkout admin${NC}"
echo -e "  ${GREEN}git merge main${NC}"
echo -e "  ${GREEN}git push origin admin${NC}"
echo "" 